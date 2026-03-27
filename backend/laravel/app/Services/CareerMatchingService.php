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
     */
    private const MAX_TECH = 1;

    /**
     * Mínimo de sectores distintos requeridos.
     */
    private const MIN_SECTORS = 4;

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
     * @return array Profesiones seleccionadas con score de matching
     */
    public function match(array $profileScores): array
    {
        $userVector = $this->normalizeProfile($profileScores);
        $dominantLetters = $this->getDominantLetters($profileScores);

        // 1. Calcular similitud para todas las profesiones activas
        $candidates = CareerCatalog::activo()->get()->map(function ($career) use ($userVector) {
            $careerVector = $career->getRiasecVector();
            $score = $this->cosineSimilarity($userVector, $careerVector);

            return [
                'career' => $career,
                'score'  => round($score * 100),
            ];
        })->sortByDesc('score')->values();

        // 2. Aplicar reglas de diversidad
        return $this->applyDiversityRules($candidates->toArray(), $dominantLetters);
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
     * Reglas:
     * R1: Exactamente TARGET_COUNT profesiones.
     * R2: Máximo MAX_TECH profesiones de "Tecnología e Informática".
     * R3: Mínimo MIN_SECTORS sectores distintos.
     * R4: Al menos 1 profesión con FP (Medio o Superior).
     * R5: Al menos 1 profesión con Grado Universitario o superior.
     * R6: Al menos 1 con nivel salarial "Medio-bajo" o "Bajo".
     * R7: Al menos 1 profesión emergente o en_crecimiento.
     * R8: Priorizar sectores primarios del código RIASEC dominante.
     */
    private function applyDiversityRules(array $candidates, array $dominantLetters): array
    {
        $selected = [];
        $usedSectors = [];
        $techCount = 0;
        $hasFP = false;
        $hasUniversity = false;
        $hasLowSalary = false;
        $hasEmergent = false;

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

            // Evitar más de 2 del mismo sector
            if (($usedSectors[$sector] ?? 0) >= 2) {
                continue;
            }

            $selected[] = $c;
            $usedSectors[$sector] = ($usedSectors[$sector] ?? 0) + 1;
            if ($sector === 'Tecnología e Informática') $techCount++;
            if (str_starts_with($career->nivel_formacion, 'FP')) $hasFP = true;
            if (str_contains($career->nivel_formacion, 'Grado')) $hasUniversity = true;
            if (in_array($career->nivel_salarial, ['Bajo', 'Medio-bajo'])) $hasLowSalary = true;
            if (in_array($career->tipo_profesion, ['emergente', 'en_crecimiento'])) $hasEmergent = true;
        }

        // Fase 2: Sustituir para cumplir reglas de diversidad mínima
        $this->ensureRule($selected, $candidates, $usedSectors,
            fn($c) => str_starts_with($c['career']->nivel_formacion, 'FP'), $hasFP);

        $this->ensureRule($selected, $candidates, $usedSectors,
            fn($c) => str_contains($c['career']->nivel_formacion, 'Grado'), $hasUniversity);

        $this->ensureRule($selected, $candidates, $usedSectors,
            fn($c) => in_array($c['career']->nivel_salarial, ['Bajo', 'Medio-bajo']), $hasLowSalary);

        $this->ensureRule($selected, $candidates, $usedSectors,
            fn($c) => in_array($c['career']->tipo_profesion, ['emergente', 'en_crecimiento']), $hasEmergent);

        // Fase 3: Asegurar diversidad mínima de sectores
        if (count(array_unique(array_map(fn($c) => $c['career']->sector, $selected))) < self::MIN_SECTORS) {
            $this->diversifySectors($selected, $candidates, $primarySectors);
        }

        // Ordenar por score descendente
        usort($selected, fn($a, $b) => $b['score'] <=> $a['score']);

        // Formatear resultado final
        return array_map(function ($c) {
            $career = $c['career'];
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
                    ? implode(', ', $career->salidas_profesionales)
                    : $career->salidas_profesionales,
                'ruta_formativa'        => $career->ruta_formativa,
                'habilidades_clave'     => $career->habilidades_clave,
                'codigo_cno'            => $career->codigo_cno,
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
