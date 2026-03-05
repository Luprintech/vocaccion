<?php

namespace App\Domain\Hypothesis;

/**
 * DimensionState — Value Object (immutable)
 *
 * Represents the current scoring and confidence state for a single
 * RIASEC dimension (R, I, A, S, E, or C).
 *
 * V1 Simplifications:
 *   - confidence = min(1.0, evidence_count / SATURATION_POINT)
 *   - No consistency_factor yet (planned for V2)
 *   - No discard state yet (planned for V2)
 *
 * Immutable by convention: all mutations return a NEW instance.
 * This makes state transitions auditable and prevents accidental mutation.
 */
final class DimensionState
{
    /**
     * Number of answered questions that contributed evidence to this dimension.
     * Used as the sole driver of confidence in V1.
     */
    public const EVIDENCE_SATURATION_POINT = 4;

    public function __construct(
        /** Accumulated raw score. Range: -50 to +50. */
        public readonly float $score,

        /**
         * Number of user answers that contributed evidence to this dimension.
         * A "contribution" means either the trait was selected (+weight)
         * or it was a non-selected option in a targeted question (-minor weight).
         */
        public readonly int $evidenceCount,

        /**
         * Derived confidence value. Range: 0.0 to 1.0.
         * In V1: min(1.0, evidenceCount / EVIDENCE_SATURATION_POINT)
         * Not stored: recomputed on hydration from evidenceCount.
         */
        public readonly float $confidence,

        /**
         * true once confidence >= ConfidenceCalculator::CONFIRMATION_THRESHOLD
         * Signals the HypothesisDecider this dimension doesn't need more focus.
         */
        public readonly bool $confirmed,
    ) {
    }

    /**
     * Factory: creates a zeroed DimensionState for a fresh session.
     */
    public static function initial(): self
    {
        return new self(
            score: 0.0,
            evidenceCount: 0,
            confidence: 0.0,
            confirmed: false,
        );
    }

    /**
     * Factory: hydrates from a stored array (e.g., from JSON column).
     * Recomputes confidence from evidenceCount to avoid stale stored values.
     */
    public static function fromArray(array $data): self
    {
        // Tolerate both serialization formats:
        //   'evidence_count'  — canonical (written by toArray() since V1)
        //   'evidenceCount'   — camelCase (written by early versions before toArray() was standardized)
        $evidenceCount = (int) ($data['evidence_count'] ?? $data['evidenceCount'] ?? 0);

        // Recompute confidence from evidence to avoid stale stored values
        $confidence = min(1.0, $evidenceCount / self::EVIDENCE_SATURATION_POINT);

        return new self(
            score: (float) ($data['score'] ?? 0.0),
            evidenceCount: $evidenceCount,
            confidence: $confidence,
            confirmed: (bool) ($data['confirmed'] ?? false),
        );
    }

    /**
     * Returns a new DimensionState with an applied score delta and evidence increment.
     *
     * @param float $scoreDelta   Points to add (positive = affinity, negative = rejection)
     * @param bool  $addEvidence  Whether this answer counts as evidence for this dimension
     */
    public function withUpdate(float $scoreDelta, bool $addEvidence = true): self
    {
        $newEvidence = $this->evidenceCount + ($addEvidence ? 1 : 0);
        $newScore = $this->score + $scoreDelta;
        $newConf = min(1.0, $newEvidence / self::EVIDENCE_SATURATION_POINT);

        return new self(
            score: $newScore,
            evidenceCount: $newEvidence,
            confidence: $newConf,
            confirmed: $this->confirmed, // Confirmation is set externally by ConfidenceCalculator
        );
    }

    /**
     * Returns a new instance with confirmed = true.
     */
    public function confirm(): self
    {
        return new self(
            score: $this->score,
            evidenceCount: $this->evidenceCount,
            confidence: $this->confidence,
            confirmed: true,
        );
    }

    /**
     * Serializes to array for JSON storage.
     */
    public function toArray(): array
    {
        return [
            'score' => $this->score,
            'evidence_count' => $this->evidenceCount,
            'confidence' => $this->confidence,
            'confirmed' => $this->confirmed,
        ];
    }
}
