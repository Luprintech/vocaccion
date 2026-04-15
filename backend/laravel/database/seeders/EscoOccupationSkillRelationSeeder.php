<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class EscoOccupationSkillRelationSeeder extends Seeder
{
    public function run(): void
    {
        $this->command?->info('Loading ESCO occupation-skill relations from JSON...');
        $this->command?->warn('⚠️  This is a LARGE dataset (126K+ relations). This may take several minutes...');
        
        $jsonPath = database_path('data/catalog/esco/raw/esco_occupation_skill_relations.json');
        
        if (!file_exists($jsonPath)) {
            $this->command?->error('ESCO relations file not found.');
            return;
        }

        // Read file in streaming mode to avoid memory issues
        $handle = fopen($jsonPath, 'r');
        if (!$handle) {
            $this->command?->error('Could not open file');
            return;
        }

        // Skip opening bracket
        fgets($handle);
        
        $buffer = [];
        $inserted = 0;
        $chunkSize = 500;
        $lineCount = 0;

        $this->command?->info('Processing relations in chunks of ' . $chunkSize . '...');
        
        while (!feof($handle)) {
            $line = fgets($handle);
            if (!$line || trim($line) === ']') continue;
            
            $line = rtrim($line, ",\n\r");
            $item = json_decode($line, true);
            
            if (!$item || !isset($item['occupationUri'], $item['skillUri'])) {
                continue;
            }

            $buffer[] = [
                'occupation_uri' => $item['occupationUri'],
                'skill_uri' => $item['skillUri'],
                'relation_type' => $item['relationType'] ?? 'essential',
                'skill_type' => $item['skillType'] ?? null,
                'created_at' => now(),
                'updated_at' => now(),
            ];

            $lineCount++;

            // Insert in chunks
            if (count($buffer) >= $chunkSize) {
                DB::table('esco_occupation_skill_relations')->insertOrIgnore($buffer);
                $inserted += count($buffer);
                $buffer = [];
                
                if ($inserted % 5000 === 0) {
                    $this->command?->line("  → Processed {$inserted} relations...");
                }
            }
        }

        // Insert remaining
        if (!empty($buffer)) {
            DB::table('esco_occupation_skill_relations')->insertOrIgnore($buffer);
            $inserted += count($buffer);
        }

        fclose($handle);

        $this->command?->newLine();
        $this->command?->info("✅ Inserted {$inserted} ESCO occupation-skill relations");
    }
}
