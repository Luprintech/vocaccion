<?php

namespace App\Domain\Hypothesis;

/**
 * HypothesisState — Aggregate Value Object (immutable)
 *
 * Holds the complete epistemic state of a vocational test session:
 * the confidence and evidence for all 6 RIASEC dimensions.
 *
 * This object is serialized to/from the `hypothesis_state` JSON column
 * in `vocational_sessions`. It is the single source of truth for the
 * HypothesisDecider when choosing the next question strategy.
 *
 * All mutations return a NEW HypothesisState instance.
 *
 * @deprecated v2 uses VocationalResponse rows with deterministic scoring.
 *             Kept for v1 session compatibility only.
 *             See: app/Models/VocationalResponse.php for v2 response storage.
 */
final class HypothesisState
{
    /** The 6 canonical RIASEC dimension keys */
    public const DIMENSIONS = ['R', 'I', 'A', 'S', 'E', 'C'];

    public function __construct(
        /** @var array<string, DimensionState>  e.g. ['R' => DimensionState, ...] */
        public readonly array $dimensions,
    ) {
    }

    /**
     * Factory: builds a fresh HypothesisState with all dimensions zeroed.
     * Called when a new vocational session is initialized.
     */
    public static function initial(): self
    {
        $dims = [];
        foreach (self::DIMENSIONS as $key) {
            $dims[$key] = DimensionState::initial();
        }
        return new self($dims);
    }

    /**
     * Factory: hydrates from a stored array (the JSON column value).
     * Tolerates missing keys: missing dimensions default to initial state.
     */
    public static function fromArray(array $data): self
    {
        $dims = [];
        foreach (self::DIMENSIONS as $key) {
            $dims[$key] = isset($data[$key])
                ? DimensionState::fromArray($data[$key])
                : DimensionState::initial();
        }
        return new self($dims);
    }

    /**
     * Returns the DimensionState for a given RIASEC key.
     * @throws \InvalidArgumentException for unknown dimension keys
     */
    public function dimension(string $key): DimensionState
    {
        if (!isset($this->dimensions[$key])) {
            throw new \InvalidArgumentException("Unknown RIASEC dimension: '{$key}'");
        }
        return $this->dimensions[$key];
    }

    /**
     * Applies a score update to a single dimension.
     * Returns a new HypothesisState with the updated dimension.
     *
     * @param string $dimKey     RIASEC key ('R', 'I', etc.)
     * @param float  $scoreDelta Points to add (positive or negative)
     * @param bool   $isEvidence Whether this answer counts as evidence
     */
    public function withDimensionUpdate(string $dimKey, float $scoreDelta, bool $isEvidence = true): self
    {
        $updatedDims = $this->dimensions;
        $updatedDims[$dimKey] = $this->dimensions[$dimKey]->withUpdate($scoreDelta, $isEvidence);
        return new self($updatedDims);
    }

    /**
     * Returns dimensions sorted by score descending.
     * @return array<string, DimensionState>  Ordered map
     */
    public function rankedByScore(): array
    {
        $dims = $this->dimensions;
        arsort($dims, SORT_REGULAR); // Sort descending by score property
        uasort($dims, fn($a, $b) => $b->score <=> $a->score);
        return $dims;
    }

    /**
     * Returns the dominant dimension key (highest score).
     */
    public function dominantKey(): string
    {
        $ranked = $this->rankedByScore();
        return array_key_first($ranked);
    }

    /**
     * Returns the secondary dimension key (second highest score).
     */
    public function secondaryKey(): string
    {
        $ranked = $this->rankedByScore();
        $keys = array_keys($ranked);
        return $keys[1] ?? $keys[0]; // Fallback to first if only one
    }

    /**
     * Calculates the confidence gap between dominant and secondary dimensions.
     * Used by HypothesisDecider to detect near-ties requiring CONTRAST questions.
     */
    public function confidenceGapBetweenTop2(): float
    {
        $ranked = $this->rankedByScore();
        $keys = array_keys($ranked);
        $top1Key = $keys[0];
        $top2Key = $keys[1] ?? $keys[0];

        return abs(
            $this->dimensions[$top1Key]->confidence
            - $this->dimensions[$top2Key]->confidence
        );
    }

    /**
     * Returns all dimension keys that have zero evidence (never explored).
     * @return string[]
     */
    public function unexploredDimensions(): array
    {
        return array_keys(array_filter(
            $this->dimensions,
            fn(DimensionState $d) => $d->evidenceCount === 0
        ));
    }

    /**
     * Serializes to array for JSON storage in `vocational_sessions.hypothesis_state`.
     */
    public function toArray(): array
    {
        $out = [];
        foreach ($this->dimensions as $key => $dim) {
            $out[$key] = $dim->toArray();
        }
        return $out;
    }
}
