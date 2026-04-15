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

class AutoTest extends Command
{
    protected $signature = 'test:auto {--user= : Email of existing user} {--keep : Keep test user} {--no-ai : Skip AI, use deterministic scoring} {--questions=15 : Number of questions}';
    
    protected $description = 'Fully automated vocational test - no manual interaction required';

    private $engine;
    private $matching;
    private $gemini;

    public function __construct(
        VocationalEngineService $engine, 
        CareerMatchingService $matching, 
        GeminiService $gemini
    ) {
        parent::__construct();
        $this->engine = $engine;
        $this->matching = $matching;
        $this->gemini = $gemini;
    }

    public function handle()
    {
        $this->showHeader();
        
        // 1. Get or create user
        $user = $this->getUser();
        $isTemp = !$this->option('user');
        
        // 2. Run test
        $session = $this->runAutomatedTest($user);
        
        // 3. Analyze results
        $results = $this->analyzeResults($session);
        
        // 4. Display results
        $this->displayResults($results);
        
        // 5. Generate report preview
        $this->generateReportPreview($results);
        
        // 6. Cleanup
        if ($isTemp && !$this->option('keep')) {
            $this->cleanup($user);
        } elseif ($isTemp) {
            $this->warn("\n✓ Test user kept: {$user->email}");
            $this->info("  Password: testpassword");
            $this->info("  Login at: http://localhost:5173/login");
        }

        return Command::SUCCESS;
    }

    private function showHeader()
    {
        $this->newLine();
        $this->line("╔═══════════════════════════════════════════════════════╗");
        $this->line("║          VOCACIONAL AUTO TEST — FULL DEMO             ║");
        $this->line("║       No manual interaction • Instant results         ║");
        $this->line("╚═══════════════════════════════════════════════════════╝");
        $this->newLine();
    }

    private function getUser()
    {
        if ($email = $this->option('user')) {
            $this->info("► Using existing user: {$email}");
            $user = Usuario::where('email', $email)->first();
            
            if (!$user) {
                $this->error("User not found: {$email}");
                exit(1);
            }
            
            $this->line("  <fg=green>✓</> Found: {$user->nombre} (ID: {$user->id})");
            return $user;
        }

        return $this->createTempUser();
    }

    private function createTempUser()
    {
        $this->info("► Creating temporary test user...");
        
        $email = 'autotest_' . time() . '@test.internal';
        
        $user = Usuario::create([
            'nombre' => 'AutoTest User',
            'email' => $email,
            'password' => bcrypt('testpassword'),
            'email_verified_at' => now(),
        ]);

        // Attach student role (ID 3)
        $user->roles()->attach(3);

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

        $this->line("  <fg=green>✓</> Created: {$email} (ID: {$user->id})");
        
        return $user;
    }

    private function runAutomatedTest($user)
    {
        $questionCount = (int) $this->option('questions');
        
        $this->info("► Running automated test ({$questionCount} questions)...");
        $this->line("  Strategy: Randomized RIASEC responses (simulates real user)");
        
        $bar = $this->output->createProgressBar($questionCount);
        $bar->setFormat(' %current%/%max% [%bar%] %percent:3s%% %message%');
        $bar->setMessage('Initializing...');
        $bar->start();

        // Initialize session
        $response = $this->engine->getNextQuestion($user->id);
        $sessionId = $response['session_id'];

        // Generate realistic answer pattern (favor 2-3 dimensions)
        $favoredDimensions = $this->getFavoredDimensions();

        // Answer all questions
        for ($i = 1; $i <= $questionCount; $i++) {
            $answer = $this->generateRealisticAnswer($favoredDimensions);
            
            $bar->setMessage("Q{$i}: {$answer['dimension']} ({$answer['text']})");
            
            $response = $this->engine->answerQuestion($user->id, $sessionId, [
                'respuesta' => $answer['text'],
                'trait' => $answer['trait'],
                'all_traits' => $answer['all_traits'],
                'strategy_type' => 'EXPLORATION',
            ]);

            $bar->advance();
            usleep(50000); // 50ms delay for visual feedback
        }

        $bar->finish();
        $this->newLine(2);

        return VocationalSession::where('session_id', $sessionId)->first();
    }

    private function getFavoredDimensions()
    {
        // Randomly pick 2-3 dimensions that this simulated user prefers
        $dimensions = ['realista', 'investigador', 'artista', 'social', 'emprendedor', 'convencional'];
        shuffle($dimensions);
        
        $count = rand(2, 3);
        return array_slice($dimensions, 0, $count);
    }

    private function generateRealisticAnswer($favoredDimensions)
    {
        $dimensions = ['realista', 'investigador', 'artista', 'social', 'emprendedor', 'convencional'];
        $dimension = $dimensions[array_rand($dimensions)];
        
        // If this is a favored dimension, bias toward agreement
        $isFavored = in_array($dimension, $favoredDimensions);
        
        if ($isFavored) {
            // 70% chance of strong agreement, 20% agreement, 10% neutral
            $rand = rand(1, 10);
            if ($rand <= 7) {
                $answer = ['text' => 'Completamente de acuerdo', 'value' => 5];
            } elseif ($rand <= 9) {
                $answer = ['text' => 'De acuerdo', 'value' => 4];
            } else {
                $answer = ['text' => 'Neutral', 'value' => 3];
            }
        } else {
            // Non-favored: normal distribution
            $answers = [
                ['text' => 'Completamente de acuerdo', 'value' => 5, 'weight' => 1],
                ['text' => 'De acuerdo', 'value' => 4, 'weight' => 2],
                ['text' => 'Neutral', 'value' => 3, 'weight' => 3],
                ['text' => 'En desacuerdo', 'value' => 2, 'weight' => 2],
                ['text' => 'Completamente en desacuerdo', 'value' => 1, 'weight' => 1],
            ];
            
            // Weighted random selection
            $totalWeight = array_sum(array_column($answers, 'weight'));
            $rand = rand(1, $totalWeight);
            $cumulative = 0;
            
            foreach ($answers as $a) {
                $cumulative += $a['weight'];
                if ($rand <= $cumulative) {
                    $answer = $a;
                    break;
                }
            }
        }
        
        $traitId = $dimension . '_' . Str::random(10);
        
        return [
            'text' => $answer['text'],
            'value' => $answer['value'],
            'dimension' => $dimension,
            'trait' => $traitId,
            'all_traits' => [$traitId],
        ];
    }

    private function analyzeResults($session)
    {
        $noAI = $this->option('no-ai');
        
        if ($noAI) {
            $this->info("► Analyzing results (deterministic scoring - NO AI)...");
            return $this->analyzeDeterministic($session);
        }
        
        $this->info("► Analyzing results with Gemini AI...");
        return $this->analyzeWithAI($session);
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

    private function analyzeWithAI($session)
    {
        $history = json_decode($session->question_history, true) ?? [];
        
        try {
            $analysis = $this->gemini->analyzeBatch($history);
        } catch (\Exception $e) {
            $this->warn("  AI analysis failed: {$e->getMessage()}");
            $this->info("  Falling back to deterministic scoring...");
            return $this->analyzeDeterministic($session);
        }
        
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

        $this->line("  <fg=green>✓</> AI analysis complete");
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
            'profile' => $profile->fresh(),
            'analysis' => $analysis,
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

    private function displayResults($results)
    {
        $this->newLine();
        $this->line("╔═══════════════════════════════════════════════════════╗");
        $this->line("║                    TEST RESULTS                       ║");
        $this->line("╚═══════════════════════════════════════════════════════╝");
        $this->newLine();

        // RIASEC Profile
        $profile = $results['profile'];
        $this->line("<fg=cyan>📊 RIASEC PROFILE:</>");
        $this->newLine();
        
        $dimensions = [
            ['Realista (R)', $profile->realista, 'yellow'],
            ['Investigador (I)', $profile->investigador, 'blue'],
            ['Artista (A)', $profile->artista, 'magenta'],
            ['Social (S)', $profile->social, 'green'],
            ['Emprendedor (E)', $profile->emprendedor, 'red'],
            ['Convencional (C)', $profile->convencional, 'cyan'],
        ];
        
        foreach ($dimensions as [$label, $score, $color]) {
            $bar = str_repeat('█', (int)($score / 5));
            $this->line(sprintf(
                "  %-20s <fg=%s>%3.1f</> %s",
                $label,
                $color,
                $score,
                $bar
            ));
        }

        // Top 5 Careers
        $this->newLine(2);
        $this->line("<fg=cyan>🎯 TOP 5 RECOMMENDED CAREERS:</>");
        $this->newLine();
        
        $topCareers = $results['careers']->take(5);
        
        foreach ($topCareers as $index => $career) {
            $medal = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'][$index] ?? '';
            
            $this->line(sprintf(
                "  %s <fg=white;options=bold>%s</> <fg=gray>(%.1f%% match)</>",
                $medal,
                $career->preferredLabel,
                $career->similarity * 100
            ));
            
            $desc = Str::limit($career->description ?? 'No description', 80);
            $this->line("     <fg=gray>{$desc}</>");
            
            $this->line(sprintf(
                "     <fg=yellow>Sector:</> %s  |  <fg=yellow>Formación:</> %s  |  <fg=yellow>Salario:</> %s",
                $career->sector ?? 'N/A',
                $career->education_level ?? 'N/A',
                $career->salary_range ?? 'N/A'
            ));
            
            $this->newLine();
        }

        // Session Stats
        $this->line("<fg=cyan>📈 SESSION STATISTICS:</>");
        $this->line("  Session ID:    <fg=white>{$results['session']->session_id}</>");
        $this->line("  Status:        <fg=green>{$results['session']->estado}</>");
        $this->line("  Questions:     <fg=white>" . count(json_decode($results['session']->question_history, true)) . "</>");
        $this->line("  Analysis:      <fg=white>{$results['analysis']['method']}</>");
    }

    private function generateReportPreview($results)
    {
        $this->newLine(2);
        $this->line("╔═══════════════════════════════════════════════════════╗");
        $this->line("║                   REPORT PREVIEW                      ║");
        $this->line("╚═══════════════════════════════════════════════════════╝");
        $this->newLine();

        $profile = $results['profile'];
        $topCareer = $results['careers']->first();
        
        // Determine dominant code
        $scores = [
            'R' => $profile->realista,
            'I' => $profile->investigador,
            'A' => $profile->artista,
            'S' => $profile->social,
            'E' => $profile->emprendedor,
            'C' => $profile->convencional,
        ];
        arsort($scores);
        $code = implode('', array_slice(array_keys($scores), 0, 3));
        
        $this->line("<fg=white;options=bold>Tu Código RIASEC: {$code}</>");
        $this->newLine();
        
        $this->line($this->getCodeDescription($code));
        $this->newLine();
        
        if ($topCareer) {
            $this->line("<fg=yellow;options=bold>Profesión recomendada #1:</> {$topCareer->preferredLabel}");
            $this->newLine();
            $this->line($topCareer->description ?? 'No description available.');
        }
        
        $this->newLine();
        $this->info("💡 Full report available at: http://localhost:5173/estudiante/resultados");
    }

    private function getCodeDescription($code)
    {
        $descriptions = [
            'R' => 'Realista: Práctico, orientado a la acción, trabaja con herramientas y objetos.',
            'I' => 'Investigador: Analítico, curioso, disfruta resolviendo problemas complejos.',
            'A' => 'Artista: Creativo, expresivo, valora la originalidad y la estética.',
            'S' => 'Social: Empático, cooperativo, le gusta ayudar y trabajar con personas.',
            'E' => 'Emprendedor: Persuasivo, ambicioso, busca liderazgo e influencia.',
            'C' => 'Convencional: Organizado, metódico, prefiere estructura y precisión.',
        ];
        
        $text = "Tu perfil combina las siguientes dimensiones:\n\n";
        
        foreach (str_split($code) as $letter) {
            $text .= "  • " . ($descriptions[$letter] ?? '') . "\n";
        }
        
        return $text;
    }

    private function cleanup($user)
    {
        $this->newLine();
        $this->info("► Cleaning up temporary data...");
        
        VocationalSession::where('usuario_id', $user->id)->delete();
        VocationalProfile::where('usuario_id', $user->id)->delete();
        $user->roles()->detach();
        $user->delete();
        
        $this->line("  <fg=green>✓</> Test data cleaned");
    }
}
