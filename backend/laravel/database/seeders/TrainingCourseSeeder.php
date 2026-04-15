<?php

namespace Database\Seeders;

use App\Models\TrainingCourse;
use Illuminate\Database\Seeder;
use Illuminate\Support\Collection;

require_once __DIR__ . '/helpers.php';

class TrainingCourseSeeder extends Seeder
{
    public function run(): void
    {
        // Cursos SEPE Nacional
        $sepe_data = require_data('catalog/courses/raw/sepe_courses_national.json');
        $rows = [];

        foreach ($sepe_data as $item) {
            $rows[] = [
                'external_id' => $item['id_curso'] ?? null,
                'title' => $item['titulo'],
                'provider' => 'SEPE',
                'url' => $item['url'] ?? null,
                'locality' => $item['localidad'] ?? null,
                'province' => $item['provincia'] ?? null,
                'autonomous_community' => null,
                'start_date' => $this->parseDate($item['fecha_comienzo'] ?? null),
                'hours' => $item['horas'] ?? null,
                'modality' => $this->inferModality($item),
                'search_criteria' => $item['criterio'] ?? null,
                'description' => null,
                'active' => true,
                'source_system' => 'SEPE',
                'last_seen_at' => now(),
                'raw_payload' => json_encode($item, JSON_UNESCAPED_UNICODE),
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        // Cursos SAE Andalucía
        $sae_data = require_data('catalog/courses/raw/sae_courses_andalucia.json');
        foreach ($sae_data as $item) {
            $rows[] = [
                'external_id' => $item['id_curso'] ?? $item['expediente'] ?? null,
                'title' => $item['denominacion'] ?? $item['titulo'] ?? null,
                'provider' => 'SAE Andalucía',
                'url' => $item['url'] ?? null,
                'locality' => $item['localidad'] ?? null,
                'province' => $item['provincia'] ?? 'Andalucía',
                'autonomous_community' => 'Andalucía',
                'start_date' => $this->parseDate($item['inicio_previsto'] ?? $item['fecha_comienzo'] ?? null),
                'hours' => $item['horas'] ?? null,
                'modality' => $item['modalidad'] ?? $this->inferModality($item),
                'search_criteria' => $item['criterio'] ?? $item['familia'] ?? null,
                'description' => ($item['familia'] ?? '') . ' - ' . ($item['tipo_curso'] ?? '') . ' - ' . ($item['estado'] ?? ''),
                'active' => true,
                'source_system' => 'SAE',
                'last_seen_at' => now(),
                'raw_payload' => json_encode($item, JSON_UNESCAPED_UNICODE),
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        collect($rows)
            ->chunk(100)
            ->each(function (Collection $chunk) {
                TrainingCourse::upsert(
                    $chunk->all(),
                    ['external_id', 'provider'],
                    [
                        'title',
                        'url',
                        'locality',
                        'province',
                        'autonomous_community',
                        'start_date',
                        'hours',
                        'modality',
                        'search_criteria',
                        'description',
                        'active',
                        'source_system',
                        'last_seen_at',
                        'raw_payload',
                        'updated_at',
                    ]
                );
            });

        $this->command?->info('✅ TrainingCourseSeeder: ' . count($rows) . ' cursos procesados');
    }

    private function parseDate(?string $dateString): ?string
    {
        if (!$dateString) {
            return null;
        }

        try {
            // Intentar diferentes formatos comunes
            $formats = ['Y-m-d', 'd/m/Y', 'd-m-Y'];
            foreach ($formats as $format) {
                $date = \DateTime::createFromFormat($format, $dateString);
                if ($date) {
                    return $date->format('Y-m-d');
                }
            }
        } catch (\Exception $e) {
            // Silently fail
        }

        return null;
    }

    private function inferModality(array $item): ?string
    {
        $title = strtolower($item['titulo'] ?? '');
        $criteria = strtolower($item['criterio'] ?? '');
        $combined = $title . ' ' . $criteria;

        if (str_contains($combined, 'online') || str_contains($combined, 'teleformación')) {
            return 'online';
        }
        if (str_contains($combined, 'presencial')) {
            return 'presencial';
        }
        if (str_contains($combined, 'mixto') || str_contains($combined, 'semipresencial')) {
            return 'mixto';
        }

        return null;
    }
}
