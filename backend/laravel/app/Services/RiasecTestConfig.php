<?php

namespace App\Services;

/**
 * Configuración del test RIASEC reestructurado
 * 
 * Basado en el informe de reestructuración (abril 2026)
 * Implementa la arquitectura de 4 fases según SDS (Holland, 1994)
 */
class RiasecTestConfig
{
    /**
     * Número de ítems por fase
     */
    public const ITEMS_PER_PHASE = [
        'activities' => 30,      // 5 items × 6 dimensions
        'competencies' => 18,    // 3 items × 6 dimensions
        'occupations' => 18,     // 3 items × 6 dimensions
        'comparative' => 6,      // 6 pares críticos
    ];

    /**
     * Pesos por fase según informe
     */
    public const WEIGHTS = [
        'activities' => 2.0,     // Base principal, más ítems, más varianza
        'competencies' => 1.5,   // Complementa con autopercepción de capacidad
        'occupations' => 1.5,    // Alta resistencia a sesgo de deseabilidad
        'comparative' => 1.0,    // Función de desempate, no de base
    ];

    /**
     * Total de ítems por test
     */
    public const TOTAL_ITEMS = 72;  // 30 + 18 + 18 + 6

    /**
     * Índices de transición entre fases (índice donde empieza cada fase)
     */
    public const PHASE_TRANSITIONS = [
        'activities' => 0,        // Items 0-29
        'competencies' => 30,     // Items 30-47
        'occupations' => 48,      // Items 48-65
        'comparative' => 66,      // Items 66-71
    ];

    /**
     * Rangos de puntuación máxima por dimensión
     */
    public const SCORE_RANGES = [
        'activities' => [5, 25],      // Likert 1-5 × 5 items
        'competencies' => [0, 3],     // Binary 0-1 × 3 items
        'occupations' => [0, 3],      // Binary 0-1 × 3 items
        'comparative' => [0, 1],      // 1 point per choice
    ];

    /**
     * Puntuación máxima teórica por dimensión (con pesos aplicados)
     * 
     * Score(D) = (Σ Likert_D × 2) + (Σ Competencias_D × 1.5) + (Σ Ocupaciones_D × 1.5) + Comparativas_D
     * Score(D) = (25 × 2) + (3 × 1.5) + (3 × 1.5) + 1 = 50 + 4.5 + 4.5 + 1 = 60
     */
    public const MAX_SCORE_PER_DIMENSION = 60.0;

    /**
     * Pares de dimensiones en comparativas
     * Orden crítico: R↔S, I↔E, A↔C (opuestos) + R↔I, S↔E, A↔I (adyacentes problemáticos)
     */
    public const COMPARATIVE_PAIRS = [
        ['R', 'S'],  // Opuestos: Máxima discriminación
        ['I', 'E'],  // Opuestos: Máxima discriminación
        ['A', 'C'],  // Opuestos: Máxima discriminación
        ['R', 'I'],  // Adyacentes: Par más confuso en adolescentes
        ['S', 'E'],  // Adyacentes: "Ayudar" vs "Liderar"
        ['A', 'I'],  // Adyacentes: "Crear" vs "Descubrir"
    ];

    /**
     * Obtiene la fase correspondiente a un índice de ítem
     * 
     * @param int $index Índice del ítem (0-71)
     * @return string Nombre de la fase
     */
    public static function getPhaseForIndex(int $index): string
    {
        if ($index < self::PHASE_TRANSITIONS['competencies']) {
            return 'activities';
        }
        
        if ($index < self::PHASE_TRANSITIONS['occupations']) {
            return 'competencies';
        }
        
        if ($index < self::PHASE_TRANSITIONS['comparative']) {
            return 'occupations';
        }
        
        return 'comparative';
    }

    /**
     * Obtiene el índice de inicio de una fase
     * 
     * @param string $phase Nombre de la fase
     * @return int Índice de inicio
     */
    public static function getPhaseStartIndex(string $phase): int
    {
        return self::PHASE_TRANSITIONS[$phase] ?? 0;
    }

    /**
     * Verifica si un índice marca una transición de fase
     * 
     * @param int $index Índice del ítem
     * @return string|null Nombre de la nueva fase si es transición, null si no
     */
    public static function getPhaseTransition(int $index): ?string
    {
        return match ($index) {
            self::PHASE_TRANSITIONS['competencies'] => 'competencies',
            self::PHASE_TRANSITIONS['occupations'] => 'occupations',
            self::PHASE_TRANSITIONS['comparative'] => 'comparative',
            default => null,
        };
    }

    /**
     * Obtiene el número de ítems de una fase
     * 
     * @param string $phase Nombre de la fase
     * @return int Número de ítems
     */
    public static function getPhaseItemCount(string $phase): int
    {
        return self::ITEMS_PER_PHASE[$phase] ?? 0;
    }

    /**
     * Obtiene el peso de una fase
     * 
     * @param string $phase Nombre de la fase
     * @return float Peso de la fase
     */
    public static function getPhaseWeight(string $phase): float
    {
        return self::WEIGHTS[$phase] ?? 1.0;
    }

    /**
     * Calcula la puntuación ponderada de una respuesta
     * 
     * @param string $phase Fase del ítem
     * @param float $rawScore Puntuación sin ponderar (1-5 para Likert, 0-1 para binary)
     * @return float Puntuación ponderada
     */
    public static function calculateWeightedScore(string $phase, float $rawScore): float
    {
        $weight = self::getPhaseWeight($phase);
        return $rawScore * $weight;
    }

    /**
     * Obtiene información sobre el progreso del test
     * 
     * @param int $currentIndex Índice actual (0-71)
     * @return array Info del progreso
     */
    public static function getProgress(int $currentIndex): array
    {
        $currentPhase = self::getPhaseForIndex($currentIndex);
        $phaseStart = self::getPhaseStartIndex($currentPhase);
        $phaseItems = self::getPhaseItemCount($currentPhase);
        $itemInPhase = $currentIndex - $phaseStart + 1;
        
        return [
            'current_index' => $currentIndex,
            'total_items' => self::TOTAL_ITEMS,
            'percent_complete' => round(($currentIndex / self::TOTAL_ITEMS) * 100, 1),
            'current_phase' => $currentPhase,
            'item_in_phase' => $itemInPhase,
            'items_in_phase' => $phaseItems,
            'phase_percent' => round(($itemInPhase / $phaseItems) * 100, 1),
        ];
    }

    /**
     * Valida que un conjunto de ítems cumple con la estructura esperada
     * 
     * @param \Illuminate\Support\Collection $items Colección de QuestionBank
     * @param string $ageGroup Grupo de edad
     * @return array ['valid' => bool, 'errors' => array]
     */
    public static function validateItemSet($items, string $ageGroup): array
    {
        $errors = [];
        
        // Verificar total de ítems
        $total = $items->count();
        if ($total !== self::TOTAL_ITEMS) {
            $errors[] = "Expected " . self::TOTAL_ITEMS . " items, got {$total}";
        }
        
        // Verificar ítems por fase
        foreach (self::ITEMS_PER_PHASE as $phase => $expectedCount) {
            $count = $items->where('phase', $phase)->count();
            if ($count !== $expectedCount) {
                $errors[] = "Phase '{$phase}': expected {$expectedCount} items, got {$count}";
            }
        }
        
        // Verificar que todos son del grupo de edad correcto
        $wrongAgeGroup = $items->where('age_group', '!=', $ageGroup)->count();
        if ($wrongAgeGroup > 0) {
            $errors[] = "Found {$wrongAgeGroup} items with wrong age group";
        }
        
        // Verificar que todos están activos
        $inactive = $items->where('is_active', false)->count();
        if ($inactive > 0) {
            $errors[] = "Found {$inactive} inactive items";
        }
        
        return [
            'valid' => empty($errors),
            'errors' => $errors,
        ];
    }

    /**
     * Evalúa si los scores parciales de las fases completadas justifican saltar
     * directamente a las comparativas finales (early stopping).
     *
     * Criterios (deben cumplirse los dos):
     *   1. La dimensión top tiene score >= $dominanceThreshold
     *   2. La diferencia entre la 1ª y la 3ª dimensión >= $gapThreshold
     *
     * Umbrales conservadores para no cortar perfiles mixtos legítimos:
     *   dominanceThreshold = 72  (top dim ≥ 72/100)
     *   gapThreshold       = 25  (brecha con la 3ª ≥ 25 puntos)
     *
     * @param array $partialScores  {R, I, A, S, E, C} en escala 0-100
     * @param int   $currentIndex   Índice actual (para saber qué fases hay completadas)
     * @return bool  true → saltar a comparativas; false → continuar con la siguiente fase
     */
    public static function evaluateEarlyStopping(
        array $partialScores,
        int $currentIndex,
        float $dominanceThreshold = 72.0,
        float $gapThreshold = 25.0
    ): bool {
        // Solo aplicar al finalizar la Fase 1 (índice 30) o la Fase 2 (índice 48).
        // En cualquier otro índice no tiene sentido evaluar.
        if ($currentIndex !== self::PHASE_TRANSITIONS['competencies']
            && $currentIndex !== self::PHASE_TRANSITIONS['occupations']) {
            return false;
        }

        // Ordenar dimensiones de mayor a menor score
        arsort($partialScores);
        $sorted = array_values($partialScores);

        $topScore  = $sorted[0];   // 1ª dimensión
        $thirdScore = $sorted[2];  // 3ª dimensión

        return $topScore >= $dominanceThreshold
            && ($topScore - $thirdScore) >= $gapThreshold;
    }
}
