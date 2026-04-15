<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class EscoSkillSeeder extends Seeder
{
    public function run(): void
    {
        $this->command?->info('Loading ESCO skills from JSON...');
        
        $jsonPath = database_path('data/catalog/esco/raw/esco_skills.json');
        
        if (!file_exists($jsonPath)) {
            $this->command?->error('ESCO skills file not found.');
            return;
        }

        $data = json_decode(file_get_contents($jsonPath), true);
        
        if (!$data) {
            $this->command?->error('Failed to parse JSON file');
            return;
        }

        $this->command?->info("Found " . count($data) . " skills. Inserting in chunks of 200...");
        
        $bar = $this->command?->getOutput()->createProgressBar(count($data));
        $inserted = 0;

        // Process in chunks of 200 (larger than occupations because skills are simpler)
        foreach (array_chunk($data, 200) as $chunk) {
            $rows = [];
            
            foreach ($chunk as $item) {
                $rows[] = [
                    'concept_uri' => $item['conceptUri'],
                    'skill_type' => $item['skillType'] ?? null,
                    'reuse_level' => $item['reuseLevel'] ?? null,
                    'preferred_label' => $item['preferredLabel'],
                    'alt_labels' => $item['altLabels'] ?? null,
                    'description' => $item['description'] ?? null,
                    'status' => $item['status'] ?? 'released',
                    'esco_modified_date' => isset($item['modifiedDate']) ? date('Y-m-d H:i:s', strtotime($item['modifiedDate'])) : null,
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
                
                $bar?->advance();
            }

            DB::table('esco_skills')->insertOrIgnore($rows);
            $inserted += count($rows);
        }

        $bar?->finish();
        $this->command?->newLine();
        $this->command?->info("✅ Inserted {$inserted} ESCO skills");
    }
}
