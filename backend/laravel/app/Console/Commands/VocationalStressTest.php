<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Str;
use App\Models\Usuario;
use App\Models\VocationalProfile;
use App\Models\VocationalSession;
use App\Services\GeminiService;
use App\Services\VocationalEngineService;

/**
 * VOCATIONAL STRESS TEST — Artisan Command
 *
 * Simulates a full 15-question test session using real services.
 * Replaces the removed /api/debug/stress-test public HTTP route.
 *
 * Usage:
 * Ver config sin llamar a Gemini
 * php artisan vocacional:stress-test --dry-run
 * 
 * Test completo de 15 preguntas
 * php artisan vocacional:stress-test
 * 
 * Test rápido de 5 preguntas
 * php artisan vocacional:stress-test --questions=5
 * 
 * Sin delay entre preguntas (máxima presión)
 * php artisan vocacional:stress-test --questions=15 --delay=0
 * 
 * IMPORTANT: Only executable from CLI by someone with server access.
 * This command is NOT reachable via HTTP.
 */
class VocationalStressTest extends Command
{
    protected $signature = 'vocacional:stress-test
                            {--questions=15 : Number of questions to simulate}
                            {--dry-run : Show config and exit without calling Gemini}
                            {--delay=100 : Milliseconds to wait between questions (simulates user speed)}';

    protected $description = 'Runs a full diagnostic stress test on the VocationalEngine and Gemini API.';

    public function handle(VocationalEngineService $engine): int
    {
        $totalQuestions = (int) $this->option('questions');
        $isDryRun = (bool) $this->option('dry-run');
        $delayMs = (int) $this->option('delay');

        $this->info('╔══════════════════════════════════════════════╗');
        $this->info('║      VOCACIONAL STRESS TEST — DIAGNOSTIC      ║');
        $this->info('╚══════════════════════════════════════════════╝');
        $this->newLine();

        // --- DRY RUN: Show config and exit ---
        if ($isDryRun) {
            $this->showConfig();
            return Command::SUCCESS;
        }

        // --- SETUP ---
        GeminiService::resetDiagnostics();
        $startTime = microtime(true);

        $email = 'stress_' . time() . '@test.internal';
        $user = null;

        // Guaranteed cleanup even if Gemini throws
        try {
            $this->line("► Creating temporary test user...");
            $user = Usuario::create([
                'nombre' => 'Stress Tester',
                'email' => $email,
                'email_verified_at' => now(),
                'password' => bcrypt(Str::random(32)),
                'remember_token' => Str::random(10),
            ]);
            $this->line("  <fg=green>✓</> User created: {$email} (ID: {$user->id})");

            VocationalProfile::create(['usuario_id' => $user->id]);
            $this->line("  <fg=green>✓</> VocationalProfile created.");

            $session = new VocationalSession();
            $session->usuario_id = $user->id;
            $session->save();
            $this->line("  <fg=green>✓</> Session created: {$session->id}");

            $this->newLine();
            $this->line("► Starting question loop ({$totalQuestions} questions, {$delayMs}ms delay)...");
            $this->newLine();

            // --- MAIN LOOP ---
            $questionCount = 0;
            while ($questionCount < $totalQuestions) {
                $stepStart = microtime(true);

                $nextStep = $engine->getNextQuestion($session);

                $stepDuration = round((microtime(true) - $stepStart) * 1000);

                if (empty($nextStep)) {
                    $this->line("  <fg=yellow>⚠</> Engine returned null at step " . ($questionCount + 1) . ". Test ended early.");
                    $session->is_completed = true;
                    $session->save();
                    break;
                }

                $questionText = substr($nextStep['question_text'] ?? '(no text)', 0, 60);
                $this->line("  <fg=cyan>Q" . str_pad($questionCount + 1, 2, '0', STR_PAD_LEFT) . "</> [{$stepDuration}ms] {$questionText}...");

                // Simulate answer: always pick first option
                $selectedOption = $nextStep['options'][0] ?? [];
                $selectedText = $selectedOption['text'] ?? 'Default Option';
                $selectedTrait = $selectedOption['trait'] ?? 'UNKNOWN';
                $this->line("       <fg=gray>↳ Answer: {$selectedText} [{$selectedTrait}]</>");

                // Update session state
                $session->appendHistory('user', $selectedText);
                $session->question_count++;
                $session->save();

                $questionCount++;

                if ($delayMs > 0) {
                    usleep($delayMs * 1000);
                }
            }

            // --- SUMMARY ---
            $totalDuration = round(microtime(true) - $startTime, 3);
            $diagnostics = GeminiService::$diagnostics;
            $totalCalls = $diagnostics['total_calls'];
            $totalRetries = $diagnostics['total_retries'];
            $totalTokens = $diagnostics['total_tokens_estimated'];
            $history = $diagnostics['history'];
            $fallbacks = collect($history)->where('status', null)->count(); // no status = exception/fallback

            $this->newLine();
            $this->line('╔══════════════════════════════════════════════╗');
            $this->line('║              DIAGNOSTIC SUMMARY               ║');
            $this->line('╠══════════════════════════════════════════════╣');
            $this->line("║  Questions Processed : {$this->pad($questionCount, 24)}║");
            $this->line("║  Total Duration      : {$this->pad($totalDuration . 's', 24)}║");
            $this->line("║  Gemini API Calls    : {$this->pad($totalCalls, 24)}║");
            $this->line("║  API Retries         : {$this->pad($totalRetries, 24)}║");
            $this->line("║  Fallbacks Used      : {$this->pad($fallbacks, 24)}║");
            $this->line("║  Est. Tokens Sent    : {$this->pad($totalTokens, 24)}║");
            $avgTokens = $totalCalls > 0 ? round($totalTokens / $totalCalls) : 0;
            $this->line("║  Avg Tokens/Call     : {$this->pad($avgTokens, 24)}║");
            $this->line('╚══════════════════════════════════════════════╝');

            // --- CALL HISTORY TABLE ---
            if (!empty($history)) {
                $this->newLine();
                $this->line('► Gemini call breakdown:');
                $this->table(
                    ['#', 'Timestamp', 'Type', 'Chars', 'Est.Tokens', 'Duration', 'Status'],
                    collect($history)->map(function ($call, $i) {
                        return [
                            $i + 1,
                            $call['timestamp'],
                            $call['type'] ?? '?',
                            $call['prompt_chars'] ?? '?',
                            $call['est_tokens'] ?? '?',
                            isset($call['duration_sec']) ? $call['duration_sec'] . 's' : 'N/A',
                            $call['status'] ?? 'ERROR',
                        ];
                    })->toArray()
                );
            }

            // Verify: all calls used correct model
            $wrongModel = collect($history)->where('model', '!=', 'gemini-2.5-flash')->count();
            if ($wrongModel > 0) {
                $this->newLine();
                $this->error("⚠ WARNING: {$wrongModel} calls used a model OTHER than gemini-2.5-flash!");
            } else {
                $this->newLine();
                $this->line('<fg=green>✓ All calls used gemini-2.5-flash correctly.</>');
            }

            if ($totalRetries > 0) {
                $this->warn("⚠ {$totalRetries} retry(ies) detected. API may be rate-limiting.");
            } else {
                $this->line('<fg=green>✓ No retries. API quota is healthy.</>');
            }

            return Command::SUCCESS;

        } catch (\Exception $e) {
            $this->newLine();
            $this->error('FATAL ERROR: ' . $e->getMessage());
            $this->error($e->getTraceAsString());
            return Command::FAILURE;

        } finally {
            // Always clean up, even if command errored
            if ($user && $user->exists) {
                $user->delete();
                $this->newLine();
                $this->line('<fg=gray>► Test user deleted. Database is clean.</>');
            }
        }
    }

    private function showConfig(): void
    {
        $this->line('<fg=yellow>DRY RUN MODE — No Gemini calls will be made.</fg=yellow>');
        $this->newLine();
        $this->line('  Resolved Configuration:');
        $this->table(
            ['Setting', 'Value'],
            [
                ['ai.provider (custom)', config('ai.provider', 'not set')],
                ['services.gemini.url', config('services.gemini.url') ?: '<fg=red>NOT SET</>'],
                ['services.gemini.key', config('services.gemini.key') ? '<fg=green>SET</>' : '<fg=red>NOT SET</>'],
                ['app.env', config('app.env')],
                ['database.default', config('database.default')],
            ]
        );
    }

    private function pad(string|int $value, int $length): string
    {
        return str_pad((string) $value, $length);
    }
}
