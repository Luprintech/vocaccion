<?php

namespace Database\Seeders;

use App\Models\OfficialCenter;
use App\Models\OfficialDegree;
use Illuminate\Database\Seeder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

require_once __DIR__ . '/helpers.php';

class OfficialDegreeCenterSeeder extends Seeder
{
    public function run(): void
    {
        $links = require_data('catalog/universities/raw/ruct_degree_center_links.json');
        $degrees = OfficialDegree::query()->get()->keyBy('ruct_study_code');
        $centers = OfficialCenter::query()->get()->keyBy('ruct_center_code');

        $rows = [];
        foreach ($links as $link) {
            $degree = $degrees->get($link['study_code'] ?? null);
            $center = $centers->get($link['center_code'] ?? null);

            if (!$degree || !$center) {
                continue;
            }

            $rows[] = [
                'official_degree_id' => $degree->id,
                'official_center_id' => $center->id,
                'source_system' => 'RUCT',
                'source_url' => null,
                'last_seen_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        collect($rows)
            ->chunk(500)
            ->each(function (Collection $chunk) {
                DB::table('official_degree_center')->upsert(
                    $chunk->all(),
                    ['official_degree_id', 'official_center_id'],
                    ['source_system', 'source_url', 'last_seen_at', 'updated_at']
                );
            });

        $this->command?->info('✅ OfficialDegreeCenterSeeder: ' . count($rows) . ' relaciones procesadas');
    }
}
