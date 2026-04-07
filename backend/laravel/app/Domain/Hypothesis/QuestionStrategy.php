<?php

namespace App\Domain\Hypothesis;

/**
 * QuestionStrategy — Value Object
 *
 * The output of HypothesisDecider. Represents the "what and why"
 * of the next question BEFORE the AI gives it linguistic form.
 *
 * The domain layer produces this. The AI layer consumes it.
 * This is the contract between deterministic logic and probabilistic generation.
 *
 * V1 Strategies:
 *   - CONTRAST:     Differentiate between two near-tied dimensions
 *   - CONFIRMATION: Confirm or challenge the current dominant dimension
 *   - EXPLORATION:  Discover a dimension with zero evidence
 *
 * V2 (planned):
 *   - DISCARD_GUARD: Boundary-test a dimension approaching discard threshold
 *
 * @deprecated v2 uses curated question_bank with predefined phases (Likert/Checklist/Comparative).
 *             Kept for v1 session compatibility only.
 *             See: app/Models/QuestionBank.php for v2 item types.
 */
final class QuestionStrategy
{
    public const CONTRAST = 'CONTRAST';
    public const CONFIRMATION = 'CONFIRMATION';
    public const EXPLORATION = 'EXPLORATION';

    public function __construct(
        /**
         * The strategy type. Controls how the AI prompt is framed.
         * One of the class constants above.
         */
        public readonly string $type,

        /**
         * RIASEC dimension keys this question should target.
         * - CONTRAST:     2 keys  (the two near-tied dims)
         * - CONFIRMATION: 1 key   (the dominant dimension)
         * - EXPLORATION:  1 key   (an unexplored dimension)
         */
        public readonly array $targetDimensions,

        /**
         * Traits already used in this session.
         * Passed to the AI to prevent reusing the same option texts.
         * e.g. ["E_LEADERSHIP", "I_RESEARCH"]
         */
        public readonly array $usedTraits,

        /**
         * Human-readable rationale for why this strategy was chosen.
         * Logged in decision_log. Useful for debugging and future ML.
         */
        public readonly string $rationale,

        /**
         * The question index (1-based) at which this strategy was decided.
         */
        public readonly int $questionIndex,
    ) {
    }

    /**
     * Serializes to array for storage in decision_log.
     */
    public function toLogEntry(): array
    {
        return [
            'question_index' => $this->questionIndex,
            'strategy' => $this->type,
            'target_dimensions' => $this->targetDimensions,
            'rationale' => $this->rationale,
            'timestamp' => now()->toIso8601String(),
        ];
    }
}
