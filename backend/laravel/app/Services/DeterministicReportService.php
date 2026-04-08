<?php

namespace App\Services;

class DeterministicReportService
{
    public function build(array $profileData, array $careers = [], string $userName = '', array $aiNarrative = []): string
    {
        $scores = [
            'R' => (float) ($profileData['realistic_score'] ?? 0),
            'I' => (float) ($profileData['investigative_score'] ?? 0),
            'A' => (float) ($profileData['artistic_score'] ?? 0),
            'S' => (float) ($profileData['social_score'] ?? 0),
            'E' => (float) ($profileData['enterprising_score'] ?? 0),
            'C' => (float) ($profileData['conventional_score'] ?? 0),
        ];

        $labels = [
            'R' => 'Realista',
            'I' => 'Investigador',
            'A' => 'Artístico',
            'S' => 'Social',
            'E' => 'Emprendedor',
            'C' => 'Convencional',
        ];

        $descriptions = [
            'R' => 'Orientación práctica, técnica y de ejecución.',
            'I' => 'Interés por analizar, investigar y comprender en profundidad.',
            'A' => 'Creatividad, expresión original e innovación.',
            'S' => 'Vocación de ayuda, cooperación e impacto humano.',
            'E' => 'Liderazgo, iniciativa y orientación a resultados.',
            'C' => 'Orden, método, precisión y estructura.',
        ];

        $total = array_sum($scores);
        $norm = $total > 0 ? $total : 1;

        $rows = [];
        foreach (['R', 'I', 'A', 'S', 'E', 'C'] as $d) {
            $pct = round(($scores[$d] / $norm) * 100, 1);
            $stars = $this->starsFromPct($pct);
            $rows[] = [
                'dim' => $d,
                'label' => $labels[$d],
                'score' => round($scores[$d], 2),
                'pct' => $pct,
                'stars' => $stars,
            ];
        }

        usort($rows, fn ($a, $b) => $b['pct'] <=> $a['pct']);
        $top = array_slice($rows, 0, 3);
        $code = implode('', array_map(fn ($r) => $r['dim'], $top));
        $user = trim($userName) !== '' ? $userName : 'tu';

        $low = array_slice(array_reverse($rows), 0, 2);

        $md = "# Tu Perfil Vocacional RIASEC\n\n";
        $md .= "## 1. Análisis de tu Código Holland\n";
        $md .= "{$user}, tu código Holland dominante es **{$code}**. Esto indica que combinas "
            . implode(', ', array_map(fn ($r) => "**{$r['label']} ({$r['dim']})**", $top))
            . ".\n\n";

        $md .= "| Dimensión | Puntuación | % | Valoración |\n";
        $md .= "|---|---:|---:|---|\n";
        foreach ($rows as $r) {
            $md .= "| {$r['dim']} ({$r['label']}) | {$r['score']} | {$r['pct']}% | {$r['stars']} |\n";
        }
        $md .= "\n";
        foreach ($top as $r) {
            $md .= "- **{$r['label']} ({$r['dim']})**: {$descriptions[$r['dim']]}\n";
        }

        $md .= "\n## 2. Retrato Psicológico-Vocacional\n";
        $portrait = trim((string) ($aiNarrative['portrait'] ?? ''));
        if ($portrait !== '') {
            $md .= $portrait . "\n";
        } else {
            $md .= "Tu patrón sugiere un perfil **" . implode(' + ', array_map(fn ($r) => $r['label'], $top)) . "**. "
                . "Sueles rendir mejor cuando las tareas conectan con tus intereses dominantes y puedes ver progreso real. "
                . "En contextos de estudio o trabajo, te beneficia combinar objetivos concretos, autonomía y feedback frecuente. "
                . "Este retrato no te encierra: describe tus preferencias actuales y puede evolucionar con experiencia y formación.\n";
        }

        $md .= "\n## 3. Tus Superpoderes Profesionales\n";
        $powers = $this->buildPowers($top);
        if (!empty($aiNarrative['superpowers']) && is_array($aiNarrative['superpowers'])) {
            $powers = $this->mergeSuperpowers($powers, $aiNarrative['superpowers']);
        }
        foreach ($powers as $i => $p) {
            $n = $i + 1;
            $md .= "- **{$n}. {$p['name']}**\n";
            $md .= "  - **Por qué la tienes:** {$p['why']}\n";
            $md .= "  - **Cómo potenciarla:** {$p['how']}\n";
        }

        $md .= "\n## 4. Tus Caminos Profesionales Recomendados\n";
        if (!empty($careers)) {
            foreach ($careers as $career) {
                $title = $career['titulo'] ?? 'Profesión recomendada';
                $compat = $career['match_porcentaje'] ?? 75;
                $salidas = is_array($career['salidas'] ?? null)
                    ? implode(', ', $career['salidas'])
                    : ($career['salidas'] ?? 'Salidas profesionales variadas en el sector.');
                $formacion = $career['ruta_formativa'] ?? $career['nivel_formacion'] ?? 'Formación profesional o universitaria alineada.';

                $md .= "\n### **{$title}**\n";
                $md .= "- **Compatibilidad RIASEC:** {$compat}%\n";
                $md .= "- **Por qué encaja contigo:** Esta opción encaja con tu patrón **{$code}**, especialmente por la combinación de {$top[0]['label']} y {$top[1]['label']}.\n";
                $md .= "- **Salidas profesionales:** {$salidas}\n";
                $md .= "- **Formación recomendada:** {$formacion}\n";
                $md .= "- **Primeros 3 pasos:**\n";
                $md .= "  1. Investiga ofertas reales y requisitos en tu zona.\n";
                $md .= "  2. Define un plan formativo de 6-12 meses.\n";
                $md .= "  3. Crea un mini-proyecto o portafolio relacionado.\n";
            }
        } else {
            $md .= "No se encontraron profesiones para mostrar en este momento.\n";
        }

        $md .= "\n## 5. Áreas de Crecimiento\n";
        foreach ($low as $idx => $l) {
            $n = $idx + 1;
            $md .= "\n{$n}. **Desarrollo de {$l['label']} ({$l['dim']}):**\n";
            $md .= "Fortalecer esta dimensión te dará más versatilidad para estudiar y trabajar. Puedes desarrollarla con hábitos pequeños y constantes: retos semanales, práctica deliberada y revisión de avances. El objetivo no es cambiar tu perfil dominante, sino complementar tus fortalezas para tomar mejores decisiones profesionales.\n";
        }

        $md .= "\n## 6. Mensaje Final de tu Mentor\n";
        $mentor = trim((string) ($aiNarrative['mentor'] ?? ''));
        if ($mentor !== '') {
            $md .= $mentor . "\n";
        } else {
            $md .= "Vas por buen camino. Tu resultado no es una etiqueta cerrada, sino un mapa para decidir con más claridad. Usa tu código **{$code}** como brújula: elige experiencias concretas, valida hipótesis con práctica real y ajusta tu plan con cada aprendizaje. La mejor decisión vocacional es la que construyes paso a paso, con foco y acción.\n";
        }

        return $md;
    }

    protected function starsFromPct(float $pct): string
    {
        if ($pct >= 25) return '★★★★★';
        if ($pct >= 20) return '★★★★☆';
        if ($pct >= 15) return '★★★☆☆';
        if ($pct >= 10) return '★★☆☆☆';
        return '★☆☆☆☆';
    }

    protected function buildPowers(array $top): array
    {
        $primary = $top[0]['label'] ?? 'Perfil';
        $secondary = $top[1]['label'] ?? 'Perfil';

        return [
            [
                'name' => 'Enfoque estratégico personal',
                'why' => "Tu combinación {$primary}-{$secondary} te ayuda a priorizar lo importante.",
                'how' => 'Trabaja con objetivos trimestrales y métricas simples de avance.',
            ],
            [
                'name' => 'Aprendizaje aplicado',
                'why' => 'Asimilas mejor cuando conectas teoría con práctica real.',
                'how' => 'Convierte cada aprendizaje en una acción o mini-proyecto.',
            ],
            [
                'name' => 'Resolución de problemas',
                'why' => 'Tu perfil muestra buena capacidad para encontrar soluciones útiles.',
                'how' => 'Usa método: define problema, hipótesis, prueba y revisión.',
            ],
            [
                'name' => 'Adaptabilidad profesional',
                'why' => 'Tu patrón combina rasgos complementarios que facilitan ajustarte a contextos distintos.',
                'how' => 'Busca experiencias diversas para ampliar criterio vocacional.',
            ],
            [
                'name' => 'Potencial de crecimiento sostenido',
                'why' => 'Tu distribución RIASEC sugiere base sólida para evolucionar con formación.',
                'how' => 'Diseña un plan anual con hitos de formación y práctica.',
            ],
        ];
    }

    protected function mergeSuperpowers(array $base, array $ai): array
    {
        $out = [];
        for ($i = 0; $i < 5; $i++) {
            $b = $base[$i] ?? null;
            $a = $ai[$i] ?? null;

            if (!$b && !$a) {
                continue;
            }

            $out[] = [
                'name' => trim((string) ($a['name'] ?? ($b['name'] ?? 'Habilidad clave'))),
                'why' => trim((string) ($a['why'] ?? ($b['why'] ?? ''))),
                'how' => trim((string) ($a['how'] ?? ($b['how'] ?? ''))),
            ];
        }

        return $out;
    }
}
