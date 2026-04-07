<?php

namespace App\Services;

use App\Domain\Hypothesis\ConfidenceCalculator;
use App\Domain\Hypothesis\HypothesisDecider;
use App\Domain\Hypothesis\QuestionStrategy;
use App\Models\QuestionBank;
use App\Models\VocationalSession;
use App\Models\VocationalProfile;
use App\Models\Perfil;
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

    // ──────────────────────────────────────────────────────────────────────
    // V2 API: CURATED BANK + PROFILE CONTEXT
    // ──────────────────────────────────────────────────────────────────────

    /**
     * Start a new V2 session with curated question bank and profile-based personalization.
     *
     * @param int    $usuarioId     User ID
     * @param string $ageGroup      One of: teen, young_adult, adult
     * @return array {session_id: uuid, total_items: 34, current_index: 0, phase: 'likert', item: {...}}
     */
    public function startSessionV2(int $usuarioId, string $ageGroup): array
    {
        // 1. Load question bank for the age group
        $bankItems = QuestionBank::forAgeGroup($ageGroup)
            ->active()
            ->ordered()
            ->get();

        if ($bankItems->count() < 34) {
            throw new \Exception("Insufficient question bank items for age group: {$ageGroup}");
        }

        // 2. Get user profile context for personalization
        $perfil = Perfil::with(['intereses', 'formaciones', 'experiencias'])->where('usuario_id', $usuarioId)->first();
        $profileContext = $this->buildProfileContext($perfil, $ageGroup);

        // 3. Personalize item selection via Gemini (fallback to default order)
        $selectedItemIds = $this->personalizeItemOrder($bankItems, $profileContext);

        // 4. Create session
        $session = VocationalSession::create([
            'usuario_id' => $usuarioId,
            'version' => 2,
            'age_group' => $ageGroup,
            'selected_items' => $selectedItemIds,
            'phase' => 'likert',
            'current_index' => 0,
            'is_completed' => false,
        ]);

        // 5. Get first item
        $firstItem = $this->getItemAtIndex($session, 0);

        return [
            'session_id' => $session->id,
            'version' => 2,
            'total_items' => count($selectedItemIds),
            'current_index' => 0,
            'phase' => 'likert',
            'item' => $firstItem,
        ];
    }

    /**
     * Get the next item for a V2 session.
     *
     * @param VocationalSession $session
     * @return array|null {item: {...}, phase: 'likert', current_index: 5, phase_transition?: 'checklist'}
     */
    public function getNextItemV2(VocationalSession $session): ?array
    {
        if ($session->is_completed) {
            return null;
        }

        $selectedItems = $session->selected_items;
        $currentIndex = $session->current_index;

        // Check if test is complete
        if ($currentIndex >= count($selectedItems)) {
            $session->update(['is_completed' => true]);
            return null;
        }

        // Get current item
        $item = $this->getItemAtIndex($session, $currentIndex);

        // Detect phase transitions (18 likert → 10 checklist → 6 comparative)
        $phaseTransition = null;
        if ($currentIndex === 18) {
            $phaseTransition = 'checklist';
            $session->update(['phase' => 'checklist']);
        } elseif ($currentIndex === 28) {
            $phaseTransition = 'comparative';
            $session->update(['phase' => 'comparative']);
        }

        return [
            'item' => $item,
            'phase' => $this->resolvePhaseForIndex($currentIndex),
            'current_index' => $currentIndex,
            'phase_transition' => $phaseTransition,
            'test_complete' => false,
        ];
    }

    public function getItemAtIndexV2(VocationalSession $session, int $index): array
    {
        return [
            'item' => $this->getItemAtIndex($session, $index),
            'phase' => $this->resolvePhaseForIndex($index),
            'current_index' => $index,
            'phase_transition' => null,
            'test_complete' => false,
        ];
    }

    /**
     * Build profile context for personalization
     */
    protected function buildProfileContext(?Perfil $perfil, string $ageGroup): array
    {
        if (!$perfil) {
            return ['age_group' => $ageGroup];
        }

        $hobbies = $perfil->relationLoaded('intereses')
            ? $perfil->intereses->pluck('nombre')->filter()->values()->implode(', ')
            : '';

        $latestEducation = $perfil->relationLoaded('formaciones')
            ? optional($perfil->formaciones->sortByDesc('fecha_inicio')->first())->titulo_obtenido
                ?? optional($perfil->formaciones->sortByDesc('fecha_inicio')->first())->nivel
            : '';

        $latestJob = $perfil->relationLoaded('experiencias')
            ? optional($perfil->experiencias->sortByDesc('fecha_inicio')->first())->puesto
            : '';

        return [
            'age_group' => $ageGroup,
            'bio' => $perfil->bio ?? '',
            'hobbies' => $hobbies,
            'education' => $latestEducation ?? '',
            'job' => $latestJob ?? '',
        ];
    }

    /**
     * Personalize item order using Gemini, fallback to default order
     */
    protected function personalizeItemOrder($bankItems, array $profileContext): array
    {
        // Convert to array format for Gemini
        $itemsArray = $bankItems->map(fn($item) => [
            'id' => $item->id,
            'phase' => $item->phase,
            'dimension' => $item->dimension,
            'text_es' => $item->text_es,
            'age_group' => $item->age_group,
        ])->toArray();

        // Try personalization via Gemini
        $personalizedIds = $this->gemini->personalizeItemSelection($itemsArray, $profileContext);

        // Fallback to default order if personalization fails or returns empty
        if (empty($personalizedIds)) {
            Log::info('[VocationalEngineV2] Using default question order (personalization skipped)');
            return $bankItems->pluck('id')->toArray();
        }

        Log::info('[VocationalEngineV2] Using personalized question order');
        return $personalizedIds;
    }

    /**
     * Get item at specific index from session's selected_items
     */
    protected function getItemAtIndex(VocationalSession $session, int $index): array
    {
        $selectedItems = $session->selected_items;
        
        if (!isset($selectedItems[$index])) {
            throw new \Exception("Item index {$index} out of bounds");
        }

        $itemId = $selectedItems[$index];
        $item = QuestionBank::find($itemId);

        if (!$item) {
            throw new \Exception("Question bank item {$itemId} not found");
        }

        $payload = [
            'id' => $item->id,
            'phase' => $item->phase,
            'dimension' => $item->dimension,
            'text_es' => $item->text_es,
            'context_es' => $item->context_es,
        ];

        // Add phase-specific data
        if ($item->phase === 'checklist') {
            $payload['options'] = $item->getChecklistOptions();
        } elseif ($item->phase === 'comparative') {
            $payload['dimension_b'] = $item->dimension_b;
        }

        return $payload;
    }

    protected function resolvePhaseForIndex(int $index): string
    {
        if ($index < 18) {
            return 'likert';
        }

        if ($index < 28) {
            return 'checklist';
        }

        return 'comparative';
    }
}
