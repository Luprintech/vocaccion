<?php

namespace App\Services;

use App\Domain\Hypothesis\ConfidenceCalculator;
use App\Domain\Hypothesis\HypothesisDecider;
use App\Domain\Hypothesis\QuestionStrategy;
use App\Models\VocationalSession;
use App\Models\VocationalProfile;
use Illuminate\Support\Facades\Log;

class VocationalEngineService
{
    public function __construct(
        protected GeminiService $gemini,
        protected HypothesisDecider $decider,
        protected ConfidenceCalculator $calculator,
    ) {
    }

    // ──────────────────────────────────────────────────────────────────────
    // PUBLIC API
    // ──────────────────────────────────────────────────────────────────────

    /**
     * Orchestrates the next question step.
     *
     * @param VocationalSession $session
     * @param array|null        $answeredData  Optional context from the user's PREVIOUS answer:
     *                                          [
     *                                            'trait'         => 'E_LEADERSHIP',      // selected option trait
     *                                            'all_traits'    => ['E_..','I_..', ...], // all 4 question traits
     *                                            'strategy_type' => 'EXPLORATION',        // strategy that generated it
     *                                          ]
     *                                          null = no trait data (warm-up, legacy, tests)
     */
    public function getNextQuestion(VocationalSession $session, ?array $answeredData = null)
    {
        // ── 0. STOPPING CONDITIONS ────────────────────────────────────────
        if ($session->is_completed || $session->current_phase === 'done') {
            $this->markCompleted($session);
            return null;
        }

        // ── 1. APPLY ANSWER TO HYPOTHESIS STATE (only when trait is present)
        if (!empty($answeredData['trait'])) {
            $this->applyAnswerToHypothesisState($session, $answeredData);
        }

        // ── 2. DOMAIN-DRIVEN STOPPING ─────────────────────────────────────
        // All stopping decisions delegated to HypothesisDecider::shouldStop.
        // P1=hard_limit | P2=early_excellence | P3=confidence_convergence
        // P4=evidence_saturation | P5=session_limit (legacy fallback at 15 q)
        $state = $session->getHypothesisState();
        $stopResult = $this->decider->shouldStop($state, (int) $session->question_count);

        if ($stopResult['stop']) {
            Log::info('[HypothesisEngine] shouldStop fired', [
                'session_id' => $session->id,
                'reason' => $stopResult['reason'],
                'questions_answered' => $session->question_count,
                'dominant_dimension' => $stopResult['dominant_dimension'],
                'dominant_confidence' => $stopResult['dominant_confidence'],
            ]);
            $this->markCompleted($session);
            return null;
        }

        // ── 3. LOAD PROFILE ───────────────────────────────────────────────
        $profile = VocationalProfile::firstOrCreate(['usuario_id' => $session->usuario_id]);

        // ── 4. PHASE MANAGEMENT ───────────────────────────────────────────
        $this->updatePhase($session);

        // ── 5. BATCH ANALYZER (every 5 answers) ──────────────────────────
        $logCount = count($session->history_log ?? []);
        if ($logCount > 0 && $logCount % 5 === 0) {
            $this->runBatchAnalysis($session, $profile);
        }

        // ── 6. QUESTION SELECTION STRATEGY ───────────────────────────────

        // PHASE warm_up (questions 1-3): static templates — fast, zero tokens
        if ($session->question_count < 3) {
            $template = $this->getWarmUpTemplate($session->usuario, $session->question_count + 1);
            if ($template) {
                return $template;
            }
        }

        // Domain template if archetype already clear
        if ($profile->dominant_archetype) {
            $domainTemplate = $this->getDomainTemplate($profile->dominant_archetype, $session->question_count);
            if ($domainTemplate) {
                return $domainTemplate;
            }
        }

        // ── 7. AI-ADAPTIVE: use HypothesisDecider to guide Gemini ────────
        return $this->generateAdaptiveQuestion($session, $profile);
    }

    // ──────────────────────────────────────────────────────────────────────
    // PRIVATE — HYPOTHESIS INTEGRATION
    // ──────────────────────────────────────────────────────────────────────

    /**
     * Applies the user's previous answer to the hypothesis state, persists it,
     * and logs the update for observability.
     *
     * Called only when $answeredData['trait'] is present (non-null).
     */
    private function applyAnswerToHypothesisState(VocationalSession $session, array $answeredData): void
    {
        $selectedTrait = $answeredData['trait'];
        $allTraits = $answeredData['all_traits'] ?? [$selectedTrait];
        $strategyType = $answeredData['strategy_type'] ?? QuestionStrategy::EXPLORATION;

        $currentState = $session->getHypothesisState();

        // ── Apply answer via ConfidenceCalculator ─────────────────────────
        $newState = $this->calculator->applyAnswer(
            state: $currentState,
            selectedTrait: $selectedTrait,
            allTraitsInQuestion: $allTraits,
            strategyType: $strategyType,
        );

        // ── Persist updated hypothesis_state ─────────────────────────────
        $session->hypothesis_state = $newState->toArray();

        // ── Append to decision_log for audit trail ────────────────────────
        $log = $session->decision_log ?? [];
        $log[] = [
            'question_index' => $session->question_count,
            'event' => 'answer_applied',
            'selected_trait' => $selectedTrait,
            'strategy_type' => $strategyType,
            'dim_selected' => $this->calculator->extractDimension($selectedTrait),
            'ts' => now()->toIso8601String(),
        ];
        $session->decision_log = $log;
        $session->save();

        Log::debug('[HypothesisEngine] applyAnswer executed', [
            'session_id' => $session->id,
            'selected_trait' => $selectedTrait,
            'strategy_type' => $strategyType,
            'dim_updated' => $this->calculator->extractDimension($selectedTrait),
            'new_score' => $newState->dimension(
                $this->calculator->extractDimension($selectedTrait)
            )->score,
            'new_confidence' => $newState->dimension(
                $this->calculator->extractDimension($selectedTrait)
            )->confidence,
        ]);
    }

    /**
     * Generates an AI-adaptive question guided by HypothesisDecider.
     */
    private function generateAdaptiveQuestion(VocationalSession $session, VocationalProfile $profile): array
    {
        // ── Decide strategy via domain layer ──────────────────────────────
        $state = $session->getHypothesisState();
        $usedTraits = $this->extractUsedTraitsFromHistory($session->history_log ?? []);
        $strategy = $this->decider->decide(
            state: $state,
            usedTraits: $usedTraits,
            questionIndex: $session->question_count + 1,
        );

        // ── Log strategy decision ─────────────────────────────────────────
        $log = $session->decision_log ?? [];
        $log[] = $strategy->toLogEntry();
        $session->decision_log = $log;
        $session->save();

        Log::debug('[HypothesisEngine] HypothesisDecider chose strategy', [
            'session_id' => $session->id,
            'strategy' => $strategy->type,
            'target_dimensions' => $strategy->targetDimensions,
            'question_index' => $strategy->questionIndex,
            'rationale' => $strategy->rationale,
        ]);

        // ── Build context for Gemini ──────────────────────────────────────
        $fechaNac = $session->usuario->perfil->fecha_nacimiento ?? null;
        $context = [
            'age' => $fechaNac ? (int) \Carbon\Carbon::parse($fechaNac)->age : 25,
            'phase' => $session->current_phase,
            'dominant_interest' => $profile->dominant_archetype ?? 'Exploración General',
            'last_interaction' => ($history = $session->history_log) ? end($history) : [],
        ];

        // ── Call Gemini with optional QuestionStrategy ────────────────────
        $generated = $this->gemini->generateQuestion($context, $strategy);

        // ── Fallback if AI fails ──────────────────────────────────────────
        if (empty($generated) || (!isset($generated['pregunta']) && !isset($generated['question_text']))) {
            Log::warning('[HypothesisEngine] Gemini returned empty/invalid — using fallback', [
                'session_id' => $session->id,
            ]);
            $generated = $this->getFallbackTemplate();
        }

        // Inject strategy type
        if (!isset($generated['strategy_type'])) {
            $generated['strategy_type'] = $strategy->type;
        }

        return $generated;
    }

    /**
     * Extracts all trait strings from the session history_log.
     * Used to pass usedTraits to HypothesisDecider so it avoids repeating
     * questions targeting the same traits.
     *
     * History entries with role='assistant' that have options are scanned.
     * Entries without options (user-answer entries) are skipped.
     *
     * @return string[]  e.g. ['E_LEADERSHIP', 'I_RESEARCH', ...]
     */
    private function extractUsedTraitsFromHistory(array $historyLog): array
    {
        $traits = [];
        foreach ($historyLog as $entry) {
            // Options are stored when the engine records the question it sent
            $options = $entry['options'] ?? [];
            foreach ($options as $option) {
                if (!empty($option['trait'])) {
                    $traits[] = $option['trait'];
                }
            }
        }
        return array_unique($traits);
    }

    // ──────────────────────────────────────────────────────────────────────
    // PRIVATE — SUPPORT METHODS
    // ──────────────────────────────────────────────────────────────────────

    private function markCompleted(VocationalSession $session): void
    {
        if (!$session->is_completed) {
            $session->is_completed = true;
            $session->current_phase = 'done';
            $session->save();
        }
    }

    private function updatePhase(VocationalSession $session): void
    {
        $target = $session->question_count < 3 ? 'warm_up' : 'exploration';
        if ($session->current_phase !== $target) {
            $session->current_phase = $target;
            $session->save();
        }
    }

    private function runBatchAnalysis(VocationalSession $session, VocationalProfile $profile): void
    {
        $history = array_slice($session->history_log, -5);
        $analysis = $this->gemini->analyzeBatch($history);

        if (!empty($analysis['scores_delta'])) {
            foreach ($analysis['scores_delta'] as $key => $delta) {
                if (in_array($key, $profile->getFillable())) {
                    $profile->$key += $delta;
                }
            }
        }

        if (!empty($analysis['new_skills'])) {
            $currentSkills = $profile->top_skills ?? [];
            $profile->top_skills = array_unique(array_merge($currentSkills, $analysis['new_skills']));
        }

        $profile->dominant_archetype = $profile->calculateArchetype();
        $profile->save();

        Log::info("Batch Analysis Completed for Session {$session->id}. Updated Scores.");
    }

    // ──────────────────────────────────────────────────────────────────────
    // QUESTION TEMPLATES (token-free fast path)
    // ──────────────────────────────────────────────────────────────────────

    private function getWarmUpTemplate($usuario, int $step): ?array
    {
        Log::info("[VocationalEngine] Using WarmUp Template Step {$step}");

        $edad = 20; // TODO: derive from perfil.fecha_nacimiento
        $isTeen = $edad < 18;

        return match ($step) {
            1 => [
                'pregunta' => $isTeen
                    ? '¿En un trabajo de clase, qué rol sueles tomar?'
                    : 'En tu día a día, ¿qué tipo de tareas te dan más energía?',
                'opciones' => [
                    ['texto' => 'Liderar y organizar al equipo', 'trait' => 'E_LEADERSHIP'],
                    ['texto' => 'Investigar y buscar información', 'trait' => 'I_RESEARCH'],
                    ['texto' => 'Crear la presentación visual', 'trait' => 'A_DESIGN'],
                    ['texto' => 'Asegurarme de que todo cuadre', 'trait' => 'C_DETAIL'],
                ],
                'strategy_type' => QuestionStrategy::EXPLORATION,
            ],
            2 => [
                'pregunta' => '¿Qué ambiente de trabajo prefieres?',
                'opciones' => [
                    ['texto' => 'Al aire libre o en movimiento', 'trait' => 'R_OUTDOORS'],
                    ['texto' => 'En un laboratorio o biblioteca', 'trait' => 'I_LAB'],
                    ['texto' => 'En un estudio creativo o taller', 'trait' => 'A_STUDIO'],
                    ['texto' => 'En una oficina organizada', 'trait' => 'C_OFFICE'],
                ],
                'strategy_type' => QuestionStrategy::EXPLORATION,
            ],
            3 => [
                'pregunta' => 'Si pudieras aprender algo nuevo mañana, ¿qué elegirías?',
                'opciones' => [
                    ['texto' => 'Cómo reparar máquinas complejas', 'trait' => 'R_MECHANICS'],
                    ['texto' => 'Psicología humana y comportamiento', 'trait' => 'S_PSYCHOLOGY'],
                    ['texto' => 'Estrategias de inversión y negocios', 'trait' => 'E_BUSINESS'],
                    ['texto' => 'Programación y algoritmos', 'trait' => 'I_TECH'],
                ],
                'strategy_type' => QuestionStrategy::EXPLORATION,
            ],
            default => null,
        };
    }

    private function getDomainTemplate(string $archetype, int $step): ?array
    {
        return null; // V2: domain-specific templates
    }

    private function getFallbackTemplate(): array
    {
        Log::info('[VocationalEngine] Using Fallback Template');
        return [
            'pregunta' => '¿Qué prefieres hacer en tu tiempo libre?',
            'opciones' => [
                ['texto' => 'Leer o aprender algo nuevo', 'trait' => 'I_LEARNING'],
                ['texto' => 'Salir con amigos', 'trait' => 'S_SOCIAL'],
                ['texto' => 'Hacer deporte o actividades físicas', 'trait' => 'R_PHYSICAL'],
                ['texto' => 'Crear contenido o arte', 'trait' => 'A_CREATIVE'],
            ],
            'strategy_type' => QuestionStrategy::EXPLORATION,
        ];
    }
}
