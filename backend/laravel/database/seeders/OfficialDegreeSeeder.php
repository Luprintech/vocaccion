<?php

namespace Database\Seeders;

use App\Models\OfficialDegree;
use App\Models\OfficialUniversity;
use Illuminate\Database\Seeder;
use Illuminate\Support\Collection;

require_once __DIR__ . '/helpers.php';

class OfficialDegreeSeeder extends Seeder
{
    public function run(): void
    {
        $data = require_data('catalog/universities/raw/ruct_degrees.json');
        $universities = OfficialUniversity::query()->get()->keyBy('ruct_code');

        $rows = [];
        foreach ($data as $item) {
            $university = $universities->get($item['university_code'] ?? null);

            $rows[] = [
                'official_university_id' => $university?->id,
                'ruct_study_code' => $item['study_code'],
                'name' => $item['name'],
                'academic_level_code' => $this->inferLevelCode($item['listing_level_name'] ?? null, $item['cycle_code'] ?? null),
                'academic_level_name' => $item['listing_level_name'] ?? null,
                'cycle_code' => $item['cycle_code'] ?? null,
                'branch_code' => null,
                'branch_name' => null,
                'field_code' => null,
                'field_name' => null,
                'status_code' => null,
                'status_name' => $item['listing_status_name'] ?? null,
                'situation_code' => null,
                'situation_name' => $item['listing_status_name'] ?? null,
                'officiality_boe_url' => null,
                'boe_urls' => json_encode([], JSON_UNESCAPED_UNICODE),
                'center_codes' => json_encode($item['center_code'] ? [$item['center_code']] : [], JSON_UNESCAPED_UNICODE),
                'active' => true,
                'source_system' => 'RUCT',
                'source_url' => $item['detail_url'] ?? null,
                'last_seen_at' => now(),
                'raw_payload' => json_encode($item, JSON_UNESCAPED_UNICODE),
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        collect($rows)
            ->chunk(50)
            ->each(function (Collection $chunk) {
                OfficialDegree::upsert(
                    $chunk->all(),
                    ['ruct_study_code'],
                    [
                        'official_university_id',
                        'name',
                        'academic_level_code',
                        'academic_level_name',
                        'cycle_code',
                        'branch_code',
                        'branch_name',
                        'field_code',
                        'field_name',
                        'status_code',
                        'status_name',
                        'situation_code',
                        'situation_name',
                        'officiality_boe_url',
                        'boe_urls',
                        'center_codes',
                        'active',
                        'source_system',
                        'source_url',
                        'last_seen_at',
                        'raw_payload',
                        'updated_at',
                    ]
                );
            });

        $this->command?->info('✅ OfficialDegreeSeeder: ' . count($rows) . ' títulos procesados');
    }

    private function inferLevelCode(?string $listingLevel, ?string $cycleCode): ?string
    {
        $text = mb_strtolower((string) $listingLevel);
        return match (true) {
            str_contains($text, 'grado') => 'G',
            str_contains($text, 'máster'), str_contains($text, 'master') => 'M',
            str_contains($text, 'doctor') => 'D',
            str_contains($text, 'ciclo') => 'C',
            default => $cycleCode,
        };
    }
}
