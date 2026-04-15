<?php

namespace App\Console\Commands;

use App\Models\Perfil;
use App\Models\QuestionBank;
use App\Models\Usuario;
use App\Models\VocationalProfile;
use App\Models\VocationalResponse;
use App\Models\VocationalSession;
use App\Services\CareerMatchingService;
use App\Services\DeterministicReportService;
use App\Services\RiasecScoreCalculatorService;
use App\Services\RiasecTestConfig;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class VocationalQuickTest extends Command
{
    protected $signature = 'vocacional:quick-test
                            {--email= : Usuario existente a reutilizar; si no existe se crea}
                            {--age-group=young_adult : teen|young_adult|adult}
                            {--fresh : Borra sesiones/resultados previos del usuario antes de ejecutar}
                            {--keep-user : Conserva el usuario temporal creado para la prueba}';

    protected $description = 'Ejecuta un smoke test rápido del flujo post-test sin hacer el cuestionario a mano.';

    public function handle(
        RiasecScoreCalculatorService $scoreCalculator,
        CareerMatchingService $careerMatcher,
        DeterministicReportService $deterministicReport,
    ): int {
        $ageGroup = (string) $this->option('age-group');
        $email = $this->option('email');
        $keepUser = (bool) $this->option('keep-user');
        $fresh = (bool) $this->option('fresh');

        $items = QuestionBank::forAgeGroup($ageGroup)->active()->ordered()->get();
        $validation = RiasecTestConfig::validateItemSet($items, $ageGroup);

        if (!$validation['valid']) {
            $this->error('Banco de preguntas inválido para ' . $ageGroup . ': ' . implode('; ', $validation['errors']));
            $this->line('Sugerencia: ejecuta `php artisan db:seed --class=QuestionBankSeeder` cuando la BD esté disponible.');
            return self::FAILURE;
        }

        $createdTemporaryUser = false;
        $user = null;

        try {
            if ($email) {
                $user = Usuario::firstOrCreate(
                    ['email' => $email],
                    [
                        'nombre' => 'Usuario Smoke Test',
                        'password' => Hash::make(Str::random(32)),
                        'email_verified_at' => now(),
                    ]
                );
            } else {
                $createdTemporaryUser = true;
                $user = Usuario::create([
                    'nombre' => 'Usuario Smoke Test',
                    'email' => 'smoke.' . now()->format('YmdHis') . '@vocaccion.local',
                    'password' => Hash::make(Str::random(32)),
                    'email_verified_at' => now(),
                ]);
            }

            Perfil::firstOrCreate(['usuario_id' => $user->id]);

            if ($fresh) {
                $this->purgeUserTestData($user->id);
            }

            $profile = VocationalProfile::updateOrCreate(
                ['usuario_id' => $user->id],
                [
                    'realistic_score' => 0,
                    'investigative_score' => 0,
                    'artistic_score' => 0,
                    'social_score' => 0,
                    'enterprising_score' => 0,
                    'conventional_score' => 0,
                ]
            );

            $session = VocationalSession::create([
                'usuario_id' => $user->id,
                'version' => 2,
                'age_group' => $ageGroup,
                'selected_items' => $items->pluck('id')->values()->all(),
                'phase' => 'activities',
                'current_index' => 0,
                'is_completed' => false,
            ]);

            foreach ($items as $item) {
                VocationalResponse::updateOrCreate(
                    [
                        'session_id' => $session->id,
                        'item_id' => $item->id,
                    ],
                    [
                        'value' => $this->resolveAnswerValue($item->phase),
                        'response_time_ms' => 250,
                        'answered_at' => now(),
                    ]
                );
            }

            $session->update([
                'current_index' => $items->count(),
                'phase' => 'done',
                'current_phase' => 'done',
                'is_completed' => true,
            ]);

            $responses = VocationalResponse::where('session_id', $session->id)
                ->with('item')
                ->get();

            $scores = $scoreCalculator->calculate($responses);

            $profile->update([
                'realistic_score' => $scores['R'],
                'investigative_score' => $scores['I'],
                'artistic_score' => $scores['A'],
                'social_score' => $scores['S'],
                'enterprising_score' => $scores['E'],
                'conventional_score' => $scores['C'],
            ]);

            $profileData = $profile->fresh()->toArray();
            $professions = $careerMatcher->match($profileData, []);
            $firstName = trim(explode(' ', $user->nombre ?? 'Usuario')[0]);
            $reportMarkdown = $deterministicReport->build($profileData, $professions, $firstName);

            DB::table('test_results')->insert([
                'usuario_id' => $user->id,
                'test_session_id' => null,
                'answers' => json_encode($responses->toArray()),
                'result_text' => $reportMarkdown,
                'modelo' => 'smoke-deterministic',
                'profesiones' => json_encode($professions),
                'saved_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $this->info('Smoke test completado correctamente.');
            $this->table(
                ['Campo', 'Valor'],
                [
                    ['Usuario', $user->email],
                    ['Session ID', $session->id],
                    ['Age group', $ageGroup],
                    ['Items respondidos', (string) $items->count()],
                    ['Código RIASEC', $this->deriveRiasecCode($scores)],
                    ['Top profesión', $professions[0]['titulo'] ?? 'N/D'],
                    ['Modo', 'deterministic smoke'],
                ]
            );

            $this->newLine();
            $this->line('Puedes relanzarlo con:');
            $this->line('  php artisan vocacional:quick-test --fresh --email=' . $user->email);

            return self::SUCCESS;
        } catch (\Throwable $e) {
            $this->error('Error en smoke test: ' . $e->getMessage());
            $this->line($e->getFile() . ':' . $e->getLine());
            return self::FAILURE;
        } finally {
            if ($createdTemporaryUser && !$keepUser && $user?->exists) {
                $this->purgeUserTestData($user->id);
                $user->delete();
            }
        }
    }

    private function resolveAnswerValue(string $phase): int
    {
        return match ($phase) {
            'activities', 'likert' => 4,
            'competencies', 'occupations', 'checklist' => 1,
            'comparative' => 1,
            default => 1,
        };
    }

    private function deriveRiasecCode(array $scores): string
    {
        arsort($scores);
        return implode('', array_slice(array_keys($scores), 0, 3));
    }

    private function purgeUserTestData(int $userId): void
    {
        $sessionIds = VocationalSession::where('usuario_id', $userId)->pluck('id');

        if ($sessionIds->isNotEmpty()) {
            VocationalResponse::whereIn('session_id', $sessionIds)->delete();
        }

        VocationalSession::where('usuario_id', $userId)->delete();
        DB::table('test_results')->where('usuario_id', $userId)->delete();
        VocationalProfile::where('usuario_id', $userId)->delete();
    }
}
