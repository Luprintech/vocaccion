<?php

namespace App\Console\Commands;

use App\Models\Usuario;
use App\Models\VocationalSession;
use App\Models\VocationalProfile;
use App\Services\VocationalEngineService;
use App\Services\CareerMatchingService;
use App\Services\GeminiService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class VocacionalQuickTest extends Command
{
    protected $signature = 'vocacional:quick-test {--keep-user : Keep test user after completion} {--no-ai : Use deterministic scoring instead of AI}';
    protected $description = 'Complete vocational test simulation with full results (RIASEC report + careers + itinerary)';

    private $engine;
    private $matching;
    private $gemini;

    public function __construct(VocationalEngineService $engine, CareerMatchingService $matching, GeminiService $gemini)
    {
        parent::__construct();
        $this->engine = $engine;
        $this->matching = $matching;
        $this->gemini = $gemini;
    }

    public function handle()
    {
        $this->info("╔══════════════════════════════════════════════╗");
        $this->info("║      VOCACIONAL QUICK TEST — FULL DEMO       ║");
        $this->info("╚══════════════════════════════════════════════╝");
        $this->newLine();

        // Create test user
        $user = $this->createTestUser();
        
        // Run test session
        $session = $this->runTestSession($user);
        
        // Analyze results
        $results = $this->analyzeResults($session);
        
        // Display results
        $this->displayResults($results);
        
        // Cleanup
        if (!$this->option('keep-user')) {
            $this->cleanup($user);
        } else {
            $this->warn("Test user kept: {$user->email} (ID: {$user->id})");
            $this->info("Login with password: testpassword");
        }

        return Command::SUCCESS;
    }

    private function createTestUser()
    {
        $this->info("► Creating test user...");
        
        $email = 'quicktest_' . time() . '@test.internal';
        
        $user = Usuario::create([
            'nombre' => 'Test User',
            'email' => $email,
            'password' => bcrypt('testpassword'),
            'email_verified_at' => now(),
        ]);

        // Attach student role
        $user->roles()->attach(3); // estudiante

        // Create vocational profile
        VocationalProfile::create([
            'usuario_id' => $user->id,
            'realista' => 0,
            'investigador' => 0,
            'artista' => 0,
            'social' => 0,
            'emprendedor' => 0,
            'convencional' => 0,
        ]);

        $this->line("  <fg=green>✓</> User: {$email} (ID: {$user->id})");
        
        return $user;
    }

    private function runTestSession($user)
    {
        $this->info("► Starting test session (15 questions)...");
        
        $bar = $this->output->createProgressBar(15);
        $bar->start();

        // Initialize session
        $response = $this->engine->getNextQuestion($user->id);
        $sessionId = $response['session_id'];

        // Simulate 15 questions
        for ($i = 1; $i <= 15; $i++) {
            // Simulate random answer
            $answer = $this->getRandomAnswer();
            
            $response = $this->engine->answerQuestion($user->id, $sessionId, [
                'respuesta' => $answer['text'],
                'trait' => $answer['trait'],
                'all_traits' => $answer['all_traits'],
                'strategy_type' => 'EXPLORATION',
            ]);

            $bar->advance();
            usleep(100000); // 100ms delay
        }

        $bar->finish();
        $this->newLine(2);

        return VocationalSession::where('session_id', $sessionId)->first();
    }

    private function analyzeResults($session)
    {
        if ($this->option('no-ai')) {
            $this->info("► Analyzing results (deterministic scoring - NO AI)...");
            return $this->analyzeDeterministic($session);
        }
        
        $this->info("► Analyzing results with Gemini AI...");
        
        // Get session history
        $history = json_decode($session->question_history, true) ?? [];
        
        // Analyze with Gemini
        try {
            $analysis = $this->gemini->analyzeBatch($history);
        } catch (\Exception $e) {
            $this->warn("  AI analysis failed: {$e->getMessage()}");
            $this->info("  Falling back to deterministic scoring...");
            return $this->analyzeDeterministic($session);
        }
        
        // Update vocational profile
        $profile = VocationalProfile::where('usuario_id', $session->usuario_id)->first();
        
        if ($analysis && isset($analysis['scores'])) {
            $profile->update([
                'realista' => $analysis['scores']['realista'] ?? 0,
                'investigador' => $analysis['scores']['investigador'] ?? 0,
                'artista' => $analysis['scores']['artista'] ?? 0,
                'social' => $analysis['scores']['social'] ?? 0,
                'emprendedor' => $analysis['scores']['emprendedor'] ?? 0,
                'convencional' => $analysis['scores']['convencional'] ?? 0,
            ]);
        }

        // Match careers
        $this->line("  <fg=green>✓</> RIASEC analysis complete");
        $this->info("► Matching careers...");
        
        $careers = $this->matching->matchCareers(
            $profile->realista,
            $profile->investigador,
            $profile->artista,
            $profile->social,
            $profile->emprendedor,
            $profile->convencional
        );

        $this->line("  <fg=green>✓</> Found {$careers->count()} matching careers");

        return [
            'profile' => $profile,
            'analysis' => $analysis,
            'careers' => $careers,
            'session' => $session,
        ];
    }

    private function displayResults($results)
    {
        $this->newLine();
        $this->info("╔══════════════════════════════════════════════╗");
        $this->info("║                 TEST RESULTS                  ║");
        $this->info("╚══════════════════════════════════════════════╝");
        $this->newLine();

        // RIASEC Scores
        $profile = $results['profile'];
        $this->line("<fg=cyan>📊 RIASEC Profile:</>");
        $this->table(
            ['Dimension', 'Score'],
            [
                ['Realista', $profile->realista],
                ['Investigador', $profile->investigador],
                ['Artista', $profile->artista],
                ['Social', $profile->social],
                ['Emprendedor', $profile->emprendedor],
                ['Convencional', $profile->convencional],
            ]
        );

        // Top 3 Careers
        $this->newLine();
        $this->line("<fg=cyan>🎯 Top 3 Recommended Careers:</>");
        $topCareers = $results['careers']->take(3);
        
        foreach ($topCareers as $index => $career) {
            $this->line(sprintf(
                "  <fg=yellow>%d.</> <fg=white>%s</> <fg=gray>(similarity: %.1f%%)</>",
                $index + 1,
                $career->preferredLabel,
                $career->similarity * 100
            ));
            $this->line("     <fg=gray>%s</>", Str::limit($career->description, 100));
        }

        // Session Stats
        $this->newLine();
        $this->line("<fg=cyan>📈 Session Statistics:</>");
        $this->line("  Session ID: <fg=white>{$results['session']->session_id}</>");
        $this->line("  Status: <fg=green>{$results['session']->estado}</>");
        $this->line("  Questions: <fg=white>" . count(json_decode($results['session']->question_history, true)) . "</>");
        $this->line("  Analysis:  <fg=white>" . ($results['analysis']['method'] ?? 'AI') . "</>");
    }

    private function getRandomAnswer()
    {
        $answers = [
            ['text' => 'Completamente de acuerdo', 'value' => 5],
            ['text' => 'De acuerdo', 'value' => 4],
            ['text' => 'Neutral', 'value' => 3],
            ['text' => 'En desacuerdo', 'value' => 2],
            ['text' => 'Completamente en desacuerdo', 'value' => 1],
        ];

        $traits = ['realista', 'investigador', 'artista', 'social', 'emprendedor', 'convencional'];

        $answer = $answers[array_rand($answers)];
        
        return [
            'text' => $answer['text'],
            'value' => $answer['value'],
            'trait' => $traits[array_rand($traits)] . '_' . Str::random(10),
            'all_traits' => [$traits[array_rand($traits)] . '_' . Str::random(10)],
        ];
    }

    private function analyzeDeterministic($session)
    {
        // Parse history and calculate scores manually
        $history = json_decode($session->question_history, true) ?? [];
        
        $scores = [
            'realista' => 0,
            'investigador' => 0,
            'artista' => 0,
            'social' => 0,
            'emprendedor' => 0,
            'convencional' => 0,
        ];
        
        $counts = $scores; // Track response count per dimension
        
        foreach ($history as $item) {
            $allTraits = $item['all_traits'] ?? [];
            $respuesta = $item['respuesta'] ?? '';
            
            // Map answer text to value
            $value = $this->mapAnswerToValue($respuesta);
            
            // Extract dimension from trait
            foreach ($allTraits as $trait) {
                foreach (array_keys($scores) as $dim) {
                    if (str_starts_with($trait, $dim)) {
                        $scores[$dim] += $value;
                        $counts[$dim]++;
                        break;
                    }
                }
            }
        }
        
        // Normalize to 0-100
        foreach ($scores as $dim => $total) {
            if ($counts[$dim] > 0) {
                // Average: total / count, then scale from 1-5 to 0-100
                $avg = $total / $counts[$dim];
                $scores[$dim] = round((($avg - 1) / 4) * 100, 2);
            }
        }
        
        // Update profile
        $profile = VocationalProfile::where('usuario_id', $session->usuario_id)->first();
        $profile->update($scores);
        
        $this->line("  <fg=green>✓</> Deterministic scoring complete");
        $this->info("► Matching careers...");
        
        // Match careers
        $careers = $this->matching->matchCareers(
            $scores['realista'],
            $scores['investigador'],
            $scores['artista'],
            $scores['social'],
            $scores['emprendedor'],
            $scores['convencional']
        );
        
        $this->line("  <fg=green>✓</> Found {$careers->count()} matching careers");
        
        return [
            'profile' => $profile->fresh(),
            'analysis' => ['scores' => $scores, 'method' => 'deterministic'],
            'careers' => $careers,
            'session' => $session,
        ];
    }

    private function mapAnswerToValue($answer)
    {
        $map = [
            'Completamente de acuerdo' => 5,
            'De acuerdo' => 4,
            'Neutral' => 3,
            'En desacuerdo' => 2,
            'Completamente en desacuerdo' => 1,
        ];
        
        return $map[$answer] ?? 3;
    }

    private function cleanup($user)
    {
        $this->newLine();
        $this->info("► Cleaning up...");
        
        // Delete sessions
        VocationalSession::where('usuario_id', $user->id)->delete();
        
        // Delete profile
        VocationalProfile::where('usuario_id', $user->id)->delete();
        
        // Delete user
        $user->delete();
        
        $this->line("  <fg=green>✓</> Test data cleaned");
    }
}
