<?php

namespace App\Domain\Hypothesis;

/**
 * HypothesisDecider — Pure Domain Service
 *
 * Given a HypothesisState, decides WHAT type of question to ask next.
 * Does NOT generate the question text. That is the AI's job.
 *
 * V1 Decision Tree (in priority order):
 *   1. EXPLORATION  — if any dimension has zero evidence, explore it first
 *   2. CONTRAST     — if top 2 dimensions are too close (confidence gap < threshold)
 *   3. CONFIRMATION — if dominant dimension has high score but low confidence
 *   4. EXPLORATION  — default fallback (explore lowest-evidence dimension)
 *
 * All decisions are deterministic and unit-testable without any mocks.
 * This class has zero dependencies on Laravel, Eloquent, or HTTP.
 *
 * @deprecated v2 uses curated question_bank with RiasecScoreCalculatorService.
 *             Kept for v1 session compatibility only.
 *             See: app/Services/RiasecScoreCalculatorService.php for v2 scoring.
 */
final class HypothesisDecider
{
    public function __construct(
        private readonly ConfidenceCalculator $calculator,
    ) {
    }

    /**
     * Evaluates the current HypothesisState and returns the optimal strategy
     * for the next question.
     *
     * @param HypothesisState $state        Current scoring state
     * @param array           $usedTraits   Traits already seen in this session (to avoid repetition)
     * @param int             $questionIndex The 1-based index of the NEXT question
     *
     * @return QuestionStrategy  The decided strategy for the AI to execute
     */
    public function decide(
        HypothesisState $state,
        array $usedTraits,
        int $questionIndex,
    ): QuestionStrategy {

        $ranked = $state->rankedByScore();
        $rankedKeys = array_keys($ranked);
        $dominantKey = $rankedKeys[0];
        $secondaryKey = $rankedKeys[1] ?? $dominantKey;

        $dominantDim = $state->dimension($dominantKey);
        $secondaryDim = $state->dimension($secondaryKey);
        $gap = $dominantDim->confidence - $secondaryDim->confidence;

        // ─────────────────────────────────────────────
        // RULE 1 — EXPLORATION: Uncharted dimensions
        // If any dimension has zero evidence, explore it.
        // We want at least ONE data point per dimension before deeper analysis.
        // ─────────────────────────────────────────────
        $unexplored = $state->unexploredDimensions();
        if (!empty($unexplored)) {
            $target = $unexplored[0]; // Take the first unexplored
            return new QuestionStrategy(
                type: QuestionStrategy::EXPLORATION,
                targetDimensions: [$target],
                usedTraits: $usedTraits,
                rationale: "Dimension {$target} has no evidence yet. Exploring before deeper analysis.",
                questionIndex: $questionIndex,
            );
        }

        // ─────────────────────────────────────────────
        // RULE 2 — CONTRAST: Near-tied top 2
        // If the confidence gap between dominant and secondary is too small,
        // we cannot confidently distinguish them. Ask a question that forces a choice.
        // ─────────────────────────────────────────────
        if ($gap < ConfidenceCalculator::CONTRAST_THRESHOLD) {
            return new QuestionStrategy(
                type: QuestionStrategy::CONTRAST,
                targetDimensions: [$dominantKey, $secondaryKey],
                usedTraits: $usedTraits,
                rationale: "Confidence gap ({$gap}) between {$dominantKey} and {$secondaryKey} is below threshold. Asking contrast question.",
                questionIndex: $questionIndex,
            );
        }

        // ─────────────────────────────────────────────
        // RULE 3 — CONFIRMATION: Strong score, weak confidence
        // The dominant dimension shows clearly positive scores but hasn't
        // accumulated enough direct evidence. Confirm or challenge it.
        // ─────────────────────────────────────────────
        $needsConfirmation = $dominantDim->score >= 14.0
            && $dominantDim->confidence < ConfidenceCalculator::CONFIRMATION_THRESHOLD
            && !$dominantDim->confirmed;

        if ($needsConfirmation) {
            return new QuestionStrategy(
                type: QuestionStrategy::CONFIRMATION,
                targetDimensions: [$dominantKey],
                usedTraits: $usedTraits,
                rationale: "Dimension {$dominantKey} has score {$dominantDim->score} but confidence {$dominantDim->confidence}. Confirming hypothesis.",
                questionIndex: $questionIndex,
            );
        }

        // ─────────────────────────────────────────────
        // RULE 4 — Default EXPLORATION of least-evidenced dimension
        // All dimensions have some evidence, there's a clear leader with
        // sufficient confidence, and distinction is established.
        // Continue exploring the weakest dimensions to complete the picture.
        // ─────────────────────────────────────────────
        $leastEvidenced = $this->leastEvidencedUnconfirmedDimension($state);

        return new QuestionStrategy(
            type: QuestionStrategy::EXPLORATION,
            targetDimensions: [$leastEvidenced],
            usedTraits: $usedTraits,
            rationale: "Profile is sufficiently distinguished. Exploring {$leastEvidenced} to complete the picture.",
            questionIndex: $questionIndex,
        );
    }

    // ─────────────────────────────────────────────────────────────────────
    // STOPPING LOGIC
    // ─────────────────────────────────────────────────────────────────────

    /**
     * Evaluates whether the session should stop before generating the next question.
     *
     * Five clearly separated priorities (evaluated top-down):
     *
     *   P1 — HARD LIMIT          : unconditional safety ceiling (question_count >= HARD_LIMIT)
     *   P2 — EARLY EXCELLENCE    : all 6 dims have evidence + dominant fully confirmed
     *   P3 — CONFIDENCE CONV.    : dominant + secondary cleared their thresholds with sufficient gap
     *   P4 — EVIDENCE SATURATION : every dimension has reached the confirmation threshold
     *   P5 — SESSION LIMIT       : fallback when no adaptive evidence gathered yet
     *
     * Rules P2–P4 are GATED: they only activate when totalEvidence > 0.
     * This preserves legacy behavior (no trait data sent → only P1 and P5 fire).
     *
     * @param HypothesisState $state         Current epistemic state
     * @param int             $questionCount Questions answered so far (post-increment)
     *
     * @return array{
     *   stop: bool,
     *   reason: string,
     *   dominant_dimension: ?string,
     *   dominant_confidence: ?float
     * }
     */
    public function shouldStop(HypothesisState $state, int $questionCount): array
    {
        // ── Pre-compute shared values ─────────────────────────────────────
        $ranked = $state->rankedByScore();
        $rankedKeys = array_keys($ranked);
        $dominantKey = $rankedKeys[0];
        $secondaryKey = $rankedKeys[1] ?? $dominantKey;
        $dominantDim = $state->dimension($dominantKey);
        $secondaryDim = $state->dimension($secondaryKey);

        // Total evidence across all dimensions — 0 means no trait was ever sent
        $totalEvidence = array_sum(array_map(
            fn(string $k) => $state->dimension($k)->evidenceCount,
            HypothesisState::DIMENSIONS,
        ));

        $hasMeaningfulEvidence = $totalEvidence > 0;

        $dominantInfo = $hasMeaningfulEvidence
            ? ['dominant_dimension' => $dominantKey, 'dominant_confidence' => $dominantDim->confidence]
            : ['dominant_dimension' => null, 'dominant_confidence' => null];

        // ── P1: HARD LIMIT — unconditional ───────────────────────────────
        if ($questionCount >= ConfidenceCalculator::HARD_LIMIT) {
            return array_merge(['stop' => true, 'reason' => 'hard_limit'], $dominantInfo);
        }

        // ── P2–P4: ADAPTIVE RULES (only when there is real evidence) ─────
        if ($hasMeaningfulEvidence && $questionCount >= ConfidenceCalculator::MINIMUM_QUESTIONS) {

            // ── P2: EARLY EXCELLENCE ──────────────────────────────────────
            // All 6 dimensions explored AND dominant is fully confirmed.
            // The profile is complete — no value in asking more questions.
            $allExplored = empty($state->unexploredDimensions());
            $dominantDone = $dominantDim->confirmed
                && $dominantDim->confidence >= ConfidenceCalculator::CONVERGENCE_DOMINANT_CONF;

            if ($allExplored && $dominantDone) {
                return array_merge(['stop' => true, 'reason' => 'early_excellence'], $dominantInfo);
            }

            // ── P3: CONFIDENCE CONVERGENCE ────────────────────────────────
            // Dominant and secondary have sufficient confidence with enough gap.
            $gap = $dominantDim->confidence - $secondaryDim->confidence;

            $convergenceMet =
                $dominantDim->confidence >= ConfidenceCalculator::CONVERGENCE_DOMINANT_CONF &&
                $secondaryDim->confidence >= ConfidenceCalculator::CONVERGENCE_SECONDARY_CONF &&
                $gap >= ConfidenceCalculator::CONVERGENCE_GAP;

            if ($convergenceMet) {
                return array_merge(['stop' => true, 'reason' => 'confidence_convergence'], $dominantInfo);
            }

            // ── P4: EVIDENCE SATURATION ───────────────────────────────────
            // Every dimension is confirmed — the full RIASEC profile is known.
            $allConfirmed = !in_array(false, array_map(
                fn(string $k) => $state->dimension($k)->confirmed,
                HypothesisState::DIMENSIONS,
            ), strict: true);

            if ($allConfirmed) {
                return array_merge(['stop' => true, 'reason' => 'evidence_saturation'], $dominantInfo);
            }
        }

        // ── P5: SESSION LIMIT — soft fallback ─────────────────────────────
        // Fires when no adaptive convergence was reached.
        // For legacy mode (no traits) this is the only stopping mechanism below P1.
        if ($questionCount >= ConfidenceCalculator::SESSION_QUESTION_LIMIT) {
            return array_merge(['stop' => true, 'reason' => 'session_limit'], $dominantInfo);
        }

        // ── No stopping condition met ─────────────────────────────────────
        return array_merge(['stop' => false, 'reason' => 'continue'], $dominantInfo);
    }

    /**
     * Returns the RIASEC key of the dimension with the fewest evidence entries
     * that has not yet been confirmed. This is the most "uncertain" dimension.
     */
    private function leastEvidencedUnconfirmedDimension(HypothesisState $state): string
    {
        $best = null;
        $bestEvidence = PHP_INT_MAX;

        foreach (HypothesisState::DIMENSIONS as $key) {
            $dim = $state->dimension($key);
            if (!$dim->confirmed && $dim->evidenceCount < $bestEvidence) {
                $bestEvidence = $dim->evidenceCount;
                $best = $key;
            }
        }

        return $best ?? HypothesisState::DIMENSIONS[0]; // Absolute fallback
    }
}
