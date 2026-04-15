<?php

namespace App\Services;

use App\Models\CareerCatalog;

/**
 * Servicio de matching de profesiones basado en similitud coseno
 * entre el perfil RIASEC del usuario y los vectores del catálogo.
 *
 * Implementa reglas de diversidad para garantizar recomendaciones
 * equilibradas: diversidad sectorial, formativa y salarial.
 */
class CareerMatchingService
{
    /**
     * Número de profesiones a devolver.
     */
    private const TARGET_COUNT = 6;

    /**
     * Máximo de profesiones del sector tecnológico.
     * CAMBIO: Aumentado de 1 a 3 para permitir más variedad cuando el perfil es fuerte en I+R.
     */
    private const MAX_TECH = 3;

    /**
     * Máximo de profesiones del mismo sector (general).
     * CAMBIO: Aumentado de 2 a 3 para respetar mejor el matching RIASEC.
     */
    private const MAX_PER_SECTOR = 3;

    /**
     * Mínimo de sectores distintos requeridos (soft constraint).
     * CAMBIO: Reducido de 4 a 3 para priorizar scores RIASEC altos.
     */
    private const MIN_SECTORS = 3;

    /**
     * Sectores RIASEC primarios por letra dominante.
     */
    private const RIASEC_PRIMARY_SECTORS = [
        'R' => ['Industria y Manufactura', 'Construcción, Arquitectura e Ingeniería', 'Agricultura, Medio Ambiente y Sostenibilidad', 'Logística y Transporte'],
        'I' => ['Ciencia e Investigación', 'Salud y Bienestar', 'Agricultura, Medio Ambiente y Sostenibilidad'],
        'A' => ['Arte, Diseño y Creatividad', 'Comunicación y Medios'],
        'S' => ['Educación y Formación', 'Servicios Sociales y Comunitarios', 'Salud y Bienestar'],
        'E' => ['Negocios, Finanzas y Derecho', 'Marketing y Ventas', 'Administración Pública y Gestión'],
        'C' => ['Administración Pública y Gestión', 'Logística y Transporte', 'Negocios, Finanzas y Derecho'],
    ];

    /**
     * Genera las mejores profesiones para un perfil RIASEC dado.
     *
     * @param array $profileScores ['R' => int, 'I' => int, ...] (valores 0-100)
     * @param array $userContext   Contexto opcional del usuario para boosting contextual:
     *                             - 'edad': int (años)
     *                             - 'nivel_educativo': string ('ESO', 'Bachillerato', 'FP Medio', 'FP Superior', 'Grado', etc.)
     *                             - 'ccaa': string ('Andalucía', 'Madrid', etc.)
     *                             - 'presupuesto': int (euros disponibles para formación)
     * @return array Profesiones seleccionadas con score de matching
     */
    public function match(array $profileScores, array $userContext = []): array
    {
        $userVector = $this->normalizeProfile($profileScores);
        $dominantLetters = $this->getDominantLetters($profileScores);

        // 1. Calcular similitud coseno base para todas las profesiones activas
        $candidates = CareerCatalog::activo()->get()->map(function ($career) use ($userVector, $userContext, $dominantLetters) {
            $careerVector = $career->getRiasecVector();
            $baseScore = $this->cosineSimilarity($userVector, $careerVector);

            // 2. Aplicar boosting contextual (NUEVO)
            $boost = $this->calculateContextualBoost($career, $userContext, $dominantLetters);
            
            $finalScore = $baseScore * $boost;

            return [
                'career'     => $career,
                'score'      => min(100, round($finalScore * 100)),
                'base_score' => min(100, round($baseScore * 100)),
                'boost'      => round($boost, 2),
            ];
        })->sortByDesc('score')->values();

        // 3. Aplicar reglas de diversidad
        return $this->applyDiversityRules($candidates->toArray(), $dominantLetters);
    }

    /**
     * Calcula un multiplicador de boosting basado en el contexto del usuario.
     * 
     * @param CareerCatalog $career La profesión candidata
     * @param array $userContext Contexto del usuario (edad, nivel_educativo, ccaa, etc.)
     * @param array $dominantLetters Las 2 letras RIASEC dominantes del perfil
     * @return float Multiplicador (1.0 = sin boost, 1.15 = +15%, etc.)
     */
    private function calculateContextualBoost(CareerCatalog $career, array $userContext, array $dominantLetters): float
    {
        $boost = 1.0;

        // ─── BOOST 1: Edad y tipo de profesión ─────────────────────────────────
        // Jóvenes (<25) → priorizar profesiones emergentes/en crecimiento
        // Adultos (25-35) → priorizar profesiones tradicionales estables
        // Mayores (35+) → priorizar profesiones de reconversión con FP/certificaciones rápidas
        if (isset($userContext['edad'])) {
            $edad = (int) $userContext['edad'];
            
            if ($edad < 25 && in_array($career->tipo_profesion, ['emergente', 'en_crecimiento'])) {
                $boost *= 1.12; // +12% para jóvenes en profesiones del futuro
            }
            
            if ($edad >= 25 && $edad < 35 && $career->tipo_profesion === 'tradicional') {
                $boost *= 1.05; // +5% para adultos en profesiones consolidadas
            }
            
            if ($edad >= 35 && str_starts_with($career->nivel_formacion, 'FP')) {
                $boost *= 1.10; // +10% para reconversión vía FP (más rápida)
            }
        }

        // ─── BOOST 2: Nivel educativo actual ───────────────────────────────────
        // Si el usuario ya tiene FP Superior → priorizar Grados (progresión natural)
        // Si tiene Grado → priorizar Másteres o profesiones que valoren experiencia
        if (isset($userContext['nivel_educativo'])) {
            $nivelUser = $userContext['nivel_educativo'];
            $nivelCareer = $career->nivel_formacion;
            
            // Usuario con FP Superior → boost para Grados
            if ($nivelUser === 'FP Superior' && str_contains($nivelCareer, 'Grado')) {
                $boost *= 1.08;
            }
            
            // Usuario con Bachillerato → boost para FP y Grados (opciones naturales)
            if ($nivelUser === 'Bachillerato' && 
                (str_contains($nivelCareer, 'FP') || str_contains($nivelCareer, 'Grado'))) {
                $boost *= 1.06;
            }
            
            // Usuario con ESO → priorizar FP Medio/Superior
            if ($nivelUser === 'ESO' && str_contains($nivelCareer, 'FP')) {
                $boost *= 1.10;
            }
        }

        // ─── BOOST 3: Presupuesto (si disponible) ──────────────────────────────
        // Bajo presupuesto → priorizar FP pública (gratuita) y formación subvencionada
        // Alto presupuesto → cualquier opción es viable (sin penalización)
        if (isset($userContext['presupuesto'])) {
            $presupuesto = (int) $userContext['presupuesto'];
            
            // Presupuesto bajo (<5000€) → boost para FP pública
            if ($presupuesto < 5000 && str_starts_with($career->nivel_formacion, 'FP')) {
                $boost *= 1.12;
            }
            
            // Presupuesto medio (5000-15000€) → boost para FP Superior y Grados públicos
            if ($presupuesto >= 5000 && $presupuesto < 15000 && 
                (str_contains($career->nivel_formacion, 'FP Superior') || 
                 str_contains($career->nivel_formacion, 'Grado'))) {
                $boost *= 1.05;
            }
        }

        // ─── BOOST 4: Sectores primarios RIASEC ───────────────────────────────
        // Si la profesión está en un sector primario del código Holland dominante → boost
        $primarySectors = [];
        foreach ($dominantLetters as $letter) {
            $primarySectors = array_merge($primarySectors, self::RIASEC_PRIMARY_SECTORS[$letter] ?? []);
        }
        $primarySectors = array_unique($primarySectors);
        
        if (in_array($career->sector, $primarySectors)) {
            $boost *= 1.08; // +8% para sectores alineados con el código RIASEC
        }

        return $boost;
    }

    /**
     * Normaliza scores (0-100) a vector unitario (suma = 1.0).
     */
    private function normalizeProfile(array $scores): array
    {
        $map = [
            'R' => $scores['R'] ?? $scores['realistic_score'] ?? 0,
            'I' => $scores['I'] ?? $scores['investigative_score'] ?? 0,
            'A' => $scores['A'] ?? $scores['artistic_score'] ?? 0,
            'S' => $scores['S'] ?? $scores['social_score'] ?? 0,
            'E' => $scores['E'] ?? $scores['enterprising_score'] ?? 0,
            'C' => $scores['C'] ?? $scores['conventional_score'] ?? 0,
        ];

        $total = array_sum($map);
        if ($total === 0) {
            return array_fill_keys(['R', 'I', 'A', 'S', 'E', 'C'], 1 / 6);
        }

        return array_map(fn($v) => $v / $total, $map);
    }

    /**
     * Obtiene las 2 letras dominantes del perfil.
     */
    private function getDominantLetters(array $scores): array
    {
        $map = [
            'R' => $scores['R'] ?? $scores['realistic_score'] ?? 0,
            'I' => $scores['I'] ?? $scores['investigative_score'] ?? 0,
            'A' => $scores['A'] ?? $scores['artistic_score'] ?? 0,
            'S' => $scores['S'] ?? $scores['social_score'] ?? 0,
            'E' => $scores['E'] ?? $scores['enterprising_score'] ?? 0,
            'C' => $scores['C'] ?? $scores['conventional_score'] ?? 0,
        ];

        arsort($map);
        return array_slice(array_keys($map), 0, 2);
    }

    /**
     * Similitud coseno entre dos vectores RIASEC.
     */
    private function cosineSimilarity(array $a, array $b): float
    {
        $dotProduct = 0;
        $normA = 0;
        $normB = 0;

        foreach (['R', 'I', 'A', 'S', 'E', 'C'] as $dim) {
            $va = $a[$dim] ?? 0;
            $vb = $b[$dim] ?? 0;
            $dotProduct += $va * $vb;
            $normA += $va * $va;
            $normB += $vb * $vb;
        }

        $denominator = sqrt($normA) * sqrt($normB);
        return $denominator > 0 ? $dotProduct / $denominator : 0;
    }

     /**
      * Aplica reglas de diversidad para seleccionar las profesiones finales.
      *
      * FILOSOFÍA: Priorizar MATCHING RIASEC sobre diversidad artificial.
      * Las reglas de diversidad son "soft constraints" — solo se aplican
      * si no sacrifican demasiado el score de similitud.
      *
      * Reglas:
      * R1: Exactamente TARGET_COUNT profesiones.
      * R2: Máximo MAX_TECH (3) profesiones de "Tecnología e Informática".
      * R3: Máximo MAX_PER_SECTOR (3) del mismo sector general.
      * R4: Mínimo MIN_SECTORS (3) sectores distintos (soft — se relaja si los scores son muy altos).
      * R5: Al menos 1 profesión con FP (Medio o Superior) — ELIMINADO para no forzar opciones de bajo match.
      * R6: Al menos 1 profesión con Grado Universitario o superior — ELIMINADO por la misma razón.
      * R7: Priorizar sectores primarios del código RIASEC dominante.
      */
    private function applyDiversityRules(array $candidates, array $dominantLetters): array
    {
        $selected = [];
        $usedSectors = [];
        $techCount = 0;

        $primarySectors = [];
        foreach ($dominantLetters as $letter) {
            $primarySectors = array_merge($primarySectors, self::RIASEC_PRIMARY_SECTORS[$letter] ?? []);
        }
        $primarySectors = array_unique($primarySectors);

        // Fase 1: Rellenar con los mejores candidatos respetando reglas básicas
        foreach ($candidates as $c) {
            if (count($selected) >= self::TARGET_COUNT) break;

            $career = $c['career'];
            $sector = $career->sector;

            // Límite de tecnología
            if ($sector === 'Tecnología e Informática' && $techCount >= self::MAX_TECH) {
                continue;
            }

            // Evitar más de MAX_PER_SECTOR del mismo sector
            if (($usedSectors[$sector] ?? 0) >= self::MAX_PER_SECTOR) {
                continue;
            }

            $selected[] = $c;
            $usedSectors[$sector] = ($usedSectors[$sector] ?? 0) + 1;
            if ($sector === 'Tecnología e Informática') $techCount++;
        }

        // Fase 2: Asegurar diversidad sectorial mínima (soft constraint)
        if (count(array_unique(array_map(fn($c) => $c['career']->sector, $selected))) < self::MIN_SECTORS) {
            $this->diversifySectors($selected, $candidates, $primarySectors);
        }

        // Ordenar por score descendente
        usort($selected, fn($a, $b) => $b['score'] <=> $a['score']);

        // Formatear resultado final
        return array_map(function ($c) {
            $career = $c['career'];

            // Derive career's top RIASEC dims (sorted desc, keeping only non-zero)
            $vec = [
                'R' => (float) ($career->riasec_r ?? 0),
                'I' => (float) ($career->riasec_i ?? 0),
                'A' => (float) ($career->riasec_a ?? 0),
                'S' => (float) ($career->riasec_s ?? 0),
                'E' => (float) ($career->riasec_e ?? 0),
                'C' => (float) ($career->riasec_c ?? 0),
            ];
            arsort($vec);
            $careerTopDims = array_keys(array_slice($vec, 0, 3, true));

            return [
                'id'                    => $career->id,
                'titulo'                => $career->titulo,
                'sector'                => $career->sector,
                'compatibilidad_riasec' => $c['score'] . '%',
                'match_porcentaje'      => $c['score'],
                'nivel_salarial'        => $career->nivel_salarial,
                'nivel_formacion'       => $career->nivel_formacion,
                'tipo_profesion'        => $career->tipo_profesion,
                'descripcion'           => $career->descripcion_corta,
                'salidas'               => is_array($career->salidas_profesionales)
                    ? $career->salidas_profesionales
                    : ($career->salidas_profesionales ? [$career->salidas_profesionales] : []),
                'ruta_formativa'        => $career->ruta_formativa,
                'habilidades_clave'     => $career->habilidades_clave,
                'codigo_cno'            => $career->codigo_cno,
                'career_top_dims'       => $careerTopDims, // ['R','I','A'] of the career itself
            ];
        }, array_values($selected));
    }

    /**
     * Sustituye la última posición por un candidato que cumpla una regla si no se cumple.
     */
    private function ensureRule(array &$selected, array $candidates, array &$usedSectors, callable $check, bool &$flag): void
    {
        if ($flag || empty($selected)) return;

        $selectedTitles = array_map(fn($c) => $c['career']->titulo, $selected);

        foreach ($candidates as $c) {
            if (in_array($c['career']->titulo, $selectedTitles)) continue;
            if (!$check($c)) continue;

            $sector = $c['career']->sector;
            if ($sector === 'Tecnología e Informática') {
                $techInSelected = count(array_filter($selected, fn($s) => $s['career']->sector === 'Tecnología e Informática'));
                if ($techInSelected >= self::MAX_TECH) continue;
            }

            // Reemplazar el último elemento (menor score)
            $removed = array_pop($selected);
            $removedSector = $removed['career']->sector;
            $usedSectors[$removedSector] = max(0, ($usedSectors[$removedSector] ?? 1) - 1);

            $selected[] = $c;
            $usedSectors[$sector] = ($usedSectors[$sector] ?? 0) + 1;
            $flag = true;
            return;
        }
    }

    /**
     * Fuerza diversidad sectorial sustituyendo duplicados por candidatos de sectores nuevos.
     */
    private function diversifySectors(array &$selected, array $candidates, array $primarySectors): void
    {
        $selectedTitles = array_map(fn($c) => $c['career']->titulo, $selected);
        $sectors = array_map(fn($c) => $c['career']->sector, $selected);
        $sectorCounts = array_count_values($sectors);

        // Encontrar sectores duplicados (>1 profesión) para sustituir
        $replaceable = [];
        for ($i = count($selected) - 1; $i >= 0; $i--) {
            $s = $selected[$i]['career']->sector;
            if ($sectorCounts[$s] > 1) {
                $replaceable[] = $i;
            }
        }

        foreach ($replaceable as $idx) {
            if (count(array_unique(array_map(fn($c) => $c['career']->sector, $selected))) >= self::MIN_SECTORS) break;

            $existingSectors = array_unique(array_map(fn($c) => $c['career']->sector, $selected));

            foreach ($candidates as $c) {
                $newSector = $c['career']->sector;
                if (in_array($c['career']->titulo, $selectedTitles)) continue;
                if (in_array($newSector, $existingSectors)) continue;
                if ($newSector === 'Tecnología e Informática') {
                    $techCount = count(array_filter($selected, fn($s) => $s['career']->sector === 'Tecnología e Informática'));
                    if ($techCount >= self::MAX_TECH) continue;
                }

                $selected[$idx] = $c;
                $selectedTitles = array_map(fn($c) => $c['career']->titulo, $selected);
                break;
            }
        }
    }
}
