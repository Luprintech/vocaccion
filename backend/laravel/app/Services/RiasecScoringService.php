<?php

namespace App\Services;

use App\Models\VocationalSession;
use App\Models\VocationalResponse;
use App\Models\QuestionBank;
use App\Models\VocationalProfile;
use Illuminate\Support\Facades\Log;

/**
 * RiasecScoringService
 * 
 * Calcula puntuaciones RIASEC con pesos diferenciados según el informe de reestructuración.
 * 
 * Sistema de puntuación:
 * - Activities (Likert 1-5): peso ×2
 * - Competencies (Sí/No): peso ×1.5
 * - Occupations (Me atrae/No): peso ×1.5
 * - Comparative (A vs B): peso ×1
 * 
 * Fórmula por dimensión:
 * Score(D) = (Σ Activities_D × 2) + (Σ Competencies_D × 1.5) + (Σ Occupations_D × 1.5) + Comparatives_D
 * 
 * Rango teórico: 5 a 60 puntos por dimensión
 */
class RiasecScoringService
{
    /**
     * Calcula las puntuaciones RIASEC de una sesión completa
     * 
     * @param VocationalSession $session
     * @return array ['R' => 45.5, 'I' => 38.0, 'A' => 52.0, 'S' => 41.5, 'E' => 35.0, 'C' => 28.5]
     */
    public function calculateSessionScores(VocationalSession $session): array
    {
        // Inicializar scores
        $scores = [
            'R' => 0.0,
            'I' => 0.0,
            'A' => 0.0,
            'S' => 0.0,
            'E' => 0.0,
            'C' => 0.0,
        ];

        // Cargar todas las respuestas de la sesión con sus ítems
        $responses = VocationalResponse::where('session_id', $session->id)
            ->with('item')
            ->get();

        if ($responses->isEmpty()) {
            Log::warning('[RiasecScoring] No responses found for session', [
                'session_id' => $session->id,
            ]);
            return $scores;
        }

        // Procesar cada respuesta
        foreach ($responses as $response) {
            $item = $response->item;
            
            if (!$item) {
                Log::warning('[RiasecScoring] Response without item', [
                    'response_id' => $response->id,
                    'item_id' => $response->item_id,
                ]);
                continue;
            }

            // Calcular puntuación según el tipo de fase
            $contribution = $this->calculateResponseContribution($item, $response);
            
            // Sumar a la dimensión correspondiente
            foreach ($contribution as $dimension => $points) {
                $scores[$dimension] += $points;
            }
        }

        Log::info('[RiasecScoring] Session scores calculated', [
            'session_id' => $session->id,
            'scores' => $scores,
            'responses_count' => $responses->count(),
        ]);

        return $scores;
    }

    /**
     * Calcula la contribución de una respuesta individual a las puntuaciones RIASEC
     * 
     * @param QuestionBank $item
     * @param VocationalResponse $response
     * @return array ['R' => 0.0, 'I' => 2.0, ...] (solo dimensiones afectadas)
     */
    protected function calculateResponseContribution(QuestionBank $item, VocationalResponse $response): array
    {
        $contribution = [
            'R' => 0.0,
            'I' => 0.0,
            'A' => 0.0,
            'S' => 0.0,
            'E' => 0.0,
            'C' => 0.0,
        ];

        $phase = $item->phase;
        $dimension = $item->dimension;
        $weight = $item->weight; // Ya viene con el peso correcto del seeder

        switch ($phase) {
            case 'activities':
                // Likert 1-5: respuesta directa × peso (×2)
                $rawScore = (float) $response->likert_value ?? 3;
                $contribution[$dimension] = $rawScore * $weight;
                break;

            case 'competencies':
            case 'occupations':
                // Binary Sí/No: 1 o 0 × peso (×1.5)
                $rawScore = $response->binary_value ? 1.0 : 0.0;
                $contribution[$dimension] = $rawScore * $weight;
                break;

            case 'comparative':
                // Elección forzada entre dos dimensiones
                $dimensionB = $item->dimension_b;
                $choice = $response->selected_option; // 'A', 'B', o 'both'
                
                if ($choice === 'both') {
                    // Ambas reciben 0.5 × peso (×1)
                    $contribution[$dimension] = 0.5 * $weight;
                    $contribution[$dimensionB] = 0.5 * $weight;
                } elseif ($choice === 'A') {
                    // Solo dimension A recibe 1 × peso (×1)
                    $contribution[$dimension] = 1.0 * $weight;
                } elseif ($choice === 'B') {
                    // Solo dimension B recibe 1 × peso (×1)
                    $contribution[$dimensionB] = 1.0 * $weight;
                }
                break;

            // Legacy phases (deprecated)
            case 'likert':
                $rawScore = (float) $response->likert_value ?? 3;
                $contribution[$dimension] = $rawScore * $weight;
                break;

            case 'checklist':
                // Las opciones del checklist antiguo ya tienen dimension asignada
                if ($response->selected_options && is_array($response->selected_options)) {
                    foreach ($response->selected_options as $option) {
                        if (isset($option['dimension'])) {
                            $optionDim = $option['dimension'];
                            $contribution[$optionDim] += 1.0 * $weight;
                        }
                    }
                }
                break;

            default:
                Log::warning('[RiasecScoring] Unknown phase type', [
                    'phase' => $phase,
                    'item_id' => $item->id,
                ]);
        }

        return $contribution;
    }

    /**
     * Normaliza las puntuaciones a escala 0-100
     * 
     * @param array $rawScores Puntuaciones brutas
     * @return array Puntuaciones normalizadas 0-100
     */
    public function normalizeScores(array $rawScores): array
    {
        $maxScore = RiasecTestConfig::MAX_SCORE_PER_DIMENSION;
        $normalized = [];

        foreach ($rawScores as $dimension => $score) {
            // Normalizar a 0-100
            $normalized[$dimension] = ($score / $maxScore) * 100;
        }

        return $normalized;
    }

    /**
     * Obtiene el código RIASEC de 3 letras (las 3 dimensiones dominantes)
     * 
     * @param array $scores Puntuaciones RIASEC
     * @return string Código de 3 letras (ej: "IAS", "REC")
     */
    public function getRiasecCode(array $scores): string
    {
        // Ordenar por puntuación descendente
        arsort($scores);
        
        // Tomar las 3 primeras
        $topThree = array_slice(array_keys($scores), 0, 3);
        
        return implode('', $topThree);
    }

    /**
     * Guarda o actualiza el perfil vocacional del usuario con las puntuaciones
     * 
     * @param VocationalSession $session
     * @param array $scores Puntuaciones RIASEC (raw o normalized)
     * @return VocationalProfile
     */
    public function saveToProfile(VocationalSession $session, array $scores): VocationalProfile
    {
        $profile = VocationalProfile::firstOrCreate(
            ['usuario_id' => $session->usuario_id]
        );

        $riasecCode = $this->getRiasecCode($scores);
        
        // Determinar dimensión dominante
        $dominantDimension = substr($riasecCode, 0, 1);
        
        // Mapear dimensión a arquetipo
        $archetypeMap = [
            'R' => 'realistic',
            'I' => 'investigative',
            'A' => 'artistic',
            'S' => 'social',
            'E' => 'enterprising',
            'C' => 'conventional',
        ];
        
        $dominantArchetype = $archetypeMap[$dominantDimension] ?? null;

        $profile->update([
            'score_r' => round($scores['R'], 2),
            'score_i' => round($scores['I'], 2),
            'score_a' => round($scores['A'], 2),
            'score_s' => round($scores['S'], 2),
            'score_e' => round($scores['E'], 2),
            'score_c' => round($scores['C'], 2),
            'riasec_code' => $riasecCode,
            'dominant_archetype' => $dominantArchetype,
            'confidence_r' => $this->calculateDimensionConfidence($scores['R']),
            'confidence_i' => $this->calculateDimensionConfidence($scores['I']),
            'confidence_a' => $this->calculateDimensionConfidence($scores['A']),
            'confidence_s' => $this->calculateDimensionConfidence($scores['S']),
            'confidence_e' => $this->calculateDimensionConfidence($scores['E']),
            'confidence_c' => $this->calculateDimensionConfidence($scores['C']),
        ]);

        return $profile;
    }

    /**
     * Calcula el nivel de confianza de una dimensión basado en su puntuación
     * 
     * @param float $score Puntuación de la dimensión (0-60 raw, o 0-100 normalized)
     * @return float Confianza 0.0-1.0
     */
    protected function calculateDimensionConfidence(float $score): float
    {
        // Si el score está en escala 0-100 (normalizado)
        if ($score > 60) {
            return min(1.0, $score / 100);
        }
        
        // Si está en escala raw (0-60)
        $maxScore = RiasecTestConfig::MAX_SCORE_PER_DIMENSION;
        return min(1.0, $score / $maxScore);
    }

    /**
     * Obtiene un resumen detallado de las puntuaciones por fase
     * 
     * @param VocationalSession $session
     * @return array Breakdown por fase
     */
    public function getScoreBreakdown(VocationalSession $session): array
    {
        $breakdown = [
            'activities' => ['R' => 0, 'I' => 0, 'A' => 0, 'S' => 0, 'E' => 0, 'C' => 0],
            'competencies' => ['R' => 0, 'I' => 0, 'A' => 0, 'S' => 0, 'E' => 0, 'C' => 0],
            'occupations' => ['R' => 0, 'I' => 0, 'A' => 0, 'S' => 0, 'E' => 0, 'C' => 0],
            'comparative' => ['R' => 0, 'I' => 0, 'A' => 0, 'S' => 0, 'E' => 0, 'C' => 0],
            'total' => ['R' => 0, 'I' => 0, 'A' => 0, 'S' => 0, 'E' => 0, 'C' => 0],
        ];

        $responses = VocationalResponse::where('session_id', $session->id)
            ->with('item')
            ->get();

        foreach ($responses as $response) {
            $item = $response->item;
            if (!$item) continue;

            $phase = $item->phase;
            if (!isset($breakdown[$phase])) {
                $breakdown[$phase] = ['R' => 0, 'I' => 0, 'A' => 0, 'S' => 0, 'E' => 0, 'C' => 0];
            }

            $contribution = $this->calculateResponseContribution($item, $response);
            
            foreach ($contribution as $dimension => $points) {
                $breakdown[$phase][$dimension] += $points;
                $breakdown['total'][$dimension] += $points;
            }
        }

        return $breakdown;
    }
}
