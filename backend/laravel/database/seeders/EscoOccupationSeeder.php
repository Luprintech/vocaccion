<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class EscoOccupationSeeder extends Seeder
{
    public function run(): void
    {
        $this->command?->info('Loading ESCO occupations from JSON...');
        
        $jsonPath = database_path('data/catalog/esco/raw/esco_occupations.json');
        
        if (!file_exists($jsonPath)) {
            $this->command?->error('ESCO occupations file not found. Run: php scripts/convert_esco_to_json.php');
            return;
        }

        $data = json_decode(file_get_contents($jsonPath), true);
        
        if (!$data) {
            $this->command?->error('Failed to parse JSON file');
            return;
        }

        $this->command?->info("Found " . count($data) . " occupations. Inserting in chunks...");
        
        $bar = $this->command?->getOutput()->createProgressBar(count($data));
        $inserted = 0;

        // Process in chunks of 100
        foreach (array_chunk($data, 100) as $chunk) {
            $rows = [];
            
            foreach ($chunk as $item) {
                $rows[] = [
                    'concept_uri' => $item['conceptUri'],
                    'isco_group' => $item['iscoGroup'] ?? null,
                    'preferred_label' => $item['preferredLabel'],
                    'alt_labels' => $item['altLabels'] ?? null,
                    'description' => $item['description'] ?? null,
                    'code' => $item['code'] ?? null,
                    'status' => $item['status'] ?? 'released',
                    'esco_modified_date' => isset($item['modifiedDate']) ? date('Y-m-d H:i:s', strtotime($item['modifiedDate'])) : null,
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
                
                $bar?->advance();
            }

            DB::table('esco_occupations')->insertOrIgnore($rows);
            $inserted += count($rows);
        }

        $bar?->finish();
        $this->command?->newLine();
        $this->command?->info("✅ Inserted {$inserted} ESCO occupations");
    }
}
