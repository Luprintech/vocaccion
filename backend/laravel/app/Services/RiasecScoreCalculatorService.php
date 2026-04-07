<?php

namespace App\Services;

use App\Models\VocationalResponse;
use Illuminate\Support\Collection;

/**
 * RiasecScoreCalculatorService
 * 
 * Pure deterministic RIASEC scoring from vocational responses.
 * Handles all three phase types: Likert (1-5), Checklist (0|1), Comparative (-1|0|1).
 * 
 * Returns normalized scores 0-100 for each RIASEC dimension.
 */
class RiasecScoreCalculatorService
{
    /**
     * Calculate RIASEC scores from vocational responses.
     *
     * @param Collection<VocationalResponse> $responses  With loaded `item` relation
     * @return array{R: float, I: float, A: float, S: float, E: float, C: float} Scores 0-100
     */
    public function calculate(Collection $responses): array
    {
        // Initialize raw scores
        $rawScores = [
            'R' => 0.0,
            'I' => 0.0,
            'A' => 0.0,
            'S' => 0.0,
            'E' => 0.0,
            'C' => 0.0,
        ];

        // Track max possible scores per dimension for normalization
        $maxScores = [
            'R' => 0.0,
            'I' => 0.0,
            'A' => 0.0,
            'S' => 0.0,
            'E' => 0.0,
            'C' => 0.0,
        ];

        foreach ($responses as $response) {
            $item = $response->item;
            
            if (!$item) {
                continue; // Skip if item relation not loaded
            }

            $weight = $item->weight ?? 1.0;
            $dimension = $item->dimension;
            $phase = $item->phase;

            // Calculate contribution based on phase
            if ($phase === 'likert') {
                // Likert: 1-5 scale
                // Normalize: (value - 1) / 4 → [0, 1]
                // Contribution: normalized × weight
                $normalized = ($response->value - 1) / 4;
                $contribution = $normalized * $weight;
                $maxPossible = 1.0 * $weight; // Max when value = 5

                $rawScores[$dimension] += $contribution;
                $maxScores[$dimension] += $maxPossible;

            } elseif ($phase === 'checklist') {
                // Checklist: 0 or 1
                // Each checklist item can have multiple options, each targeting different dimensions
                // The value represents binary selection (0 = not selected, 1 = selected)
                $contribution = $response->value * $weight;
                $maxPossible = 1.0 * $weight;

                $rawScores[$dimension] += $contribution;
                $maxScores[$dimension] += $maxPossible;

            } elseif ($phase === 'comparative') {
                // Comparative: -1, 0, 1 (comparing two dimensions)
                // -1 = prefer dimension_b, 0 = neutral, 1 = prefer dimension_a
                // Normalize: (value + 1) / 2 → [0, 1]
                $normalized = ($response->value + 1) / 2;
                $contribution = $normalized * $weight;
                $maxPossible = 1.0 * $weight;

                // Primary dimension gets the contribution
                $rawScores[$dimension] += $contribution;
                $maxScores[$dimension] += $maxPossible;

                // Secondary dimension (dimension_b) gets inverse contribution
                if ($item->dimension_b) {
                    $inverseContribution = (1 - $normalized) * $weight;
                    $rawScores[$item->dimension_b] += $inverseContribution;
                    $maxScores[$item->dimension_b] += $maxPossible;
                }
            }
        }

        // Normalize to 0-100 scale
        $normalizedScores = [];
        foreach ($rawScores as $dimension => $rawScore) {
            $maxScore = $maxScores[$dimension];
            
            if ($maxScore > 0) {
                // Normalize to 0-100
                $normalizedScores[$dimension] = round(($rawScore / $maxScore) * 100, 2);
            } else {
                // No questions for this dimension (edge case)
                $normalizedScores[$dimension] = 0.0;
            }
        }

        return $normalizedScores;
    }

    /**
     * Calculate scores and return detailed breakdown for debugging/analytics
     *
     * @param Collection<VocationalResponse> $responses
     * @return array{scores: array, breakdown: array, stats: array}
     */
    public function calculateWithBreakdown(Collection $responses): array
    {
        $rawScores = ['R' => 0.0, 'I' => 0.0, 'A' => 0.0, 'S' => 0.0, 'E' => 0.0, 'C' => 0.0];
        $maxScores = ['R' => 0.0, 'I' => 0.0, 'A' => 0.0, 'S' => 0.0, 'E' => 0.0, 'C' => 0.0];
        $breakdown = [
            'likert' => ['count' => 0, 'contributions' => []],
            'checklist' => ['count' => 0, 'contributions' => []],
            'comparative' => ['count' => 0, 'contributions' => []],
        ];

        foreach ($responses as $response) {
            $item = $response->item;
            
            if (!$item) {
                continue;
            }

            $weight = $item->weight ?? 1.0;
            $dimension = $item->dimension;
            $phase = $item->phase;
            $contribution = 0.0;
            $maxPossible = 0.0;

            if ($phase === 'likert') {
                $normalized = ($response->value - 1) / 4;
                $contribution = $normalized * $weight;
                $maxPossible = 1.0 * $weight;

                $rawScores[$dimension] += $contribution;
                $maxScores[$dimension] += $maxPossible;

                $breakdown['likert']['count']++;
                $breakdown['likert']['contributions'][] = [
                    'item_id' => $item->id,
                    'dimension' => $dimension,
                    'value' => $response->value,
                    'contribution' => $contribution,
                ];

            } elseif ($phase === 'checklist') {
                $contribution = $response->value * $weight;
                $maxPossible = 1.0 * $weight;

                $rawScores[$dimension] += $contribution;
                $maxScores[$dimension] += $maxPossible;

                $breakdown['checklist']['count']++;
                $breakdown['checklist']['contributions'][] = [
                    'item_id' => $item->id,
                    'dimension' => $dimension,
                    'value' => $response->value,
                    'contribution' => $contribution,
                ];

            } elseif ($phase === 'comparative') {
                $normalized = ($response->value + 1) / 2;
                $contribution = $normalized * $weight;
                $maxPossible = 1.0 * $weight;

                $rawScores[$dimension] += $contribution;
                $maxScores[$dimension] += $maxPossible;

                if ($item->dimension_b) {
                    $inverseContribution = (1 - $normalized) * $weight;
                    $rawScores[$item->dimension_b] += $inverseContribution;
                    $maxScores[$item->dimension_b] += $maxPossible;
                }

                $breakdown['comparative']['count']++;
                $breakdown['comparative']['contributions'][] = [
                    'item_id' => $item->id,
                    'dimension_a' => $dimension,
                    'dimension_b' => $item->dimension_b,
                    'value' => $response->value,
                    'contribution_a' => $contribution,
                    'contribution_b' => $item->dimension_b ? (1 - $normalized) * $weight : 0,
                ];
            }
        }

        // Normalize to 0-100
        $normalizedScores = [];
        foreach ($rawScores as $dimension => $rawScore) {
            $maxScore = $maxScores[$dimension];
            
            if ($maxScore > 0) {
                $normalizedScores[$dimension] = round(($rawScore / $maxScore) * 100, 2);
            } else {
                $normalizedScores[$dimension] = 0.0;
            }
        }

        return [
            'scores' => $normalizedScores,
            'breakdown' => $breakdown,
            'stats' => [
                'total_responses' => $responses->count(),
                'raw_scores' => $rawScores,
                'max_scores' => $maxScores,
            ],
        ];
    }

    /**
     * Validate that responses cover all required phases
     *
     * @param Collection<VocationalResponse> $responses
     * @return array{valid: bool, missing_phases: array, phase_counts: array}
     */
    public function validateResponses(Collection $responses): array
    {
        $phaseCounts = [
            'likert' => 0,
            'checklist' => 0,
            'comparative' => 0,
        ];

        foreach ($responses as $response) {
            $item = $response->item;
            if ($item && isset($phaseCounts[$item->phase])) {
                $phaseCounts[$item->phase]++;
            }
        }

        // Expected counts (from design spec: 18 likert + 10 checklist + 6 comparative = 34)
        $expectedCounts = [
            'likert' => 18,
            'checklist' => 10,
            'comparative' => 6,
        ];

        $missingPhases = [];
        foreach ($expectedCounts as $phase => $expected) {
            if ($phaseCounts[$phase] < $expected) {
                $missingPhases[] = $phase;
            }
        }

        return [
            'valid' => empty($missingPhases),
            'missing_phases' => $missingPhases,
            'phase_counts' => $phaseCounts,
            'expected_counts' => $expectedCounts,
        ];
    }
}
