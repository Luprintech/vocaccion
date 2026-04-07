<?php

namespace App\Domain\Hypothesis;

/**
 * ConfidenceCalculator — Pure Domain Service
 *
 * All confidence and threshold mathematics live here.
 * No Laravel dependencies. No database. No HTTP.
 * 100% unit-testable with PHPUnit without any mocking.
 *
 * V1 Simplifications (intentional):
 *   - confidence = min(1.0, evidence_count / SATURATION_POINT)
 *   - No consistency_factor (V2)
 *   - No temporal decay (V2)
 *   - Score weights are flat (V2 will differentiate question types)
 *
 * @deprecated v2 uses deterministic scoring via RiasecScoreCalculatorService.
 *             Kept for v1 session compatibility only.
 *             See: app/Services/RiasecScoreCalculatorService.php for v2 scoring.
 */
final class ConfidenceCalculator
{
    // ─────────────────────────────────────────────
    // Calibration Constants
    // ─────────────────────────────────────────────

    /**
     * Evidence count at which confidence saturates to 1.0.
     * With 4 answers pointing to the same dimension, we are fully confident.
     */
    public const EVIDENCE_SATURATION_POINT = 4;

    /**
     * Confidence gap below which we consider two dimensions "tied"
     * and trigger a CONTRAST question strategy.
     */
    public const CONTRAST_THRESHOLD = 0.20;

    /**
     * Confidence level above which a dimension is declared "confirmed".
     * At 0.75: 3 out of 4 evidence points saturated.
     */
    public const CONFIRMATION_THRESHOLD = 0.75;

    /**
     * Score weight applied when a trait is directly selected by the user.
     * i.e. "I clicked this option" → strong positive signal.
     */
    public const WEIGHT_DIRECT_SELECTION = 7.0;

    /**
     * Score weight applied to non-selected options in a targeted question.
     * i.e. "I did NOT pick this option" → mild negative signal.
     * Only applied in CONTRAST and CONFIRMATION strategies (targeted questions).
     */
    public const WEIGHT_INDIRECT_REJECTION = -2.0;

    // ─────────────────────────────────────────────
    // Stopping Condition Constants
    // ─────────────────────────────────────────────

    /**
     * Hard maximum questions per session regardless of confidence state.
     * Safety net. Never exceeded.
     */
    public const HARD_LIMIT = 20;

    /**
     * Minimum questions before any confidence-based stopping is considered.
     * Prevents premature termination on lucky first-answer patterns.
     */
    public const MINIMUM_QUESTIONS = 5;

    /**
     * Maximum session length when NO adaptive convergence has been detected.
     *
     * This activates as a fallback when hypothesis_state never received trait
     * evidence (legacy / warm-up / tests without trait data). It ensures the
     * session terminates predictably even without RIASEC signal.
     *
     * Distinct from HARD_LIMIT: SESSION_QUESTION_LIMIT is a soft, configurable
     * exploration ceiling. HARD_LIMIT is the unconditional safety net.
     *
     * ⚠ Changing this value will affect VocationalTestFlowTest expectations.
     */
    public const SESSION_QUESTION_LIMIT = 15;

    /**
     * Confidence required on dominant dimension for convergence stopping.
     */
    public const CONVERGENCE_DOMINANT_CONF = 0.85;

    /**
     * Confidence required on secondary dimension for convergence stopping.
     */
    public const CONVERGENCE_SECONDARY_CONF = 0.60;

    /**
     * Minimum confidence gap between dominant and secondary for stopping.
     * Prevents stopping when there's still ambiguity at the top.
     */
    public const CONVERGENCE_GAP = 0.25;


    // ─────────────────────────────────────────────
    // Core Methods
    // ─────────────────────────────────────────────

    /**
     * Applies a user's answer to the HypothesisState.
     *
     * Logic:
     *   1. The selected trait's dimension receives WEIGHT_DIRECT_SELECTION + evidence.
     *   2. If the question was TARGETED (CONTRAST or CONFIRMATION strategy):
     *      non-selected target dimensions receive WEIGHT_INDIRECT_REJECTION.
     *
     * @param HypothesisState $state         Current state before this answer
     * @param string          $selectedTrait The trait string of the chosen option (e.g. "E_LEADERSHIP")
     * @param array           $allTraitsInQuestion All 4 option traits in the question
     * @param string          $strategyType  The strategy that generated this question
     *
     * @return HypothesisState  New state after applying the answer
     */
    public function applyAnswer(
        HypothesisState $state,
        string $selectedTrait,
        array $allTraitsInQuestion,
        string $strategyType,
    ): HypothesisState {

        $selectedDim = $this->extractDimension($selectedTrait);

        // 1. Apply direct selection to the chosen dimension
        $state = $state->withDimensionUpdate(
            dimKey: $selectedDim,
            scoreDelta: self::WEIGHT_DIRECT_SELECTION,
            isEvidence: true,
        );

        // 2. For targeted strategies: apply indirect rejection to non-selected target dims
        $isTargeted = in_array($strategyType, [
            QuestionStrategy::CONTRAST,
            QuestionStrategy::CONFIRMATION,
        ], strict: true);

        if ($isTargeted) {
            foreach ($allTraitsInQuestion as $trait) {
                $dim = $this->extractDimension($trait);
                if ($dim !== $selectedDim) {
                    $state = $state->withDimensionUpdate(
                        dimKey: $dim,
                        scoreDelta: self::WEIGHT_INDIRECT_REJECTION,
                        isEvidence: false, // Rejection doesn't count as evidence
                    );
                }
            }
        }

        // 3. Re-evaluate confirmation status for all dimensions
        $state = $this->recomputeConfirmations($state);

        return $state;
    }

    /**
     * Determines whether the session should stop based on the current state.
     *
     * @param HypothesisState $state
     * @param int             $questionCount Total questions answered so far
     *
     * @return array{should_stop: bool, reason: string}
     */
    public function checkStoppingCondition(HypothesisState $state, int $questionCount): array
    {
        // Hard limit — always enforced
        if ($questionCount >= self::HARD_LIMIT) {
            return ['should_stop' => true, 'reason' => 'hard_limit'];
        }

        // Minimum gate — never stop early
        if ($questionCount < self::MINIMUM_QUESTIONS) {
            return ['should_stop' => false, 'reason' => 'minimum_not_reached'];
        }

        // Confidence convergence check
        $ranked = $state->rankedByScore();
        $keys = array_keys($ranked);
        $dominantDim = $ranked[$keys[0]];
        $secondaryDim = $ranked[$keys[1]] ?? $dominantDim;
        $gap = $dominantDim->confidence - $secondaryDim->confidence;

        if (
            $dominantDim->confidence >= self::CONVERGENCE_DOMINANT_CONF &&
            $secondaryDim->confidence >= self::CONVERGENCE_SECONDARY_CONF &&
            $gap >= self::CONVERGENCE_GAP
        ) {
            return ['should_stop' => true, 'reason' => 'confidence_convergence'];
        }

        return ['should_stop' => false, 'reason' => 'still_collecting'];
    }

    // ─────────────────────────────────────────────
    // Private Helpers
    // ─────────────────────────────────────────────

    /**
     * Extracts the RIASEC dimension letter from a trait string.
     * "E_LEADERSHIP" → "E"
     * "R_OUTDOORS"   → "R"
     * Unknown traits  → "I" (default, investigative) to avoid crashes
     */
    public function extractDimension(string $trait): string
    {
        $letter = strtoupper(substr($trait, 0, 1));
        return in_array($letter, HypothesisState::DIMENSIONS, strict: true)
            ? $letter
            : 'I'; // Safe fallback
    }

    /**
     * Iterates all dimensions and sets confirmed = true for those
     * that have reached CONFIRMATION_THRESHOLD confidence.
     */
    private function recomputeConfirmations(HypothesisState $state): HypothesisState
    {
        foreach (HypothesisState::DIMENSIONS as $key) {
            $dim = $state->dimension($key);
            if (!$dim->confirmed && $dim->confidence >= self::CONFIRMATION_THRESHOLD) {
                $state = new HypothesisState(
                    array_merge($state->dimensions, [$key => $dim->confirm()])
                );
            }
        }
        return $state;
    }
}
