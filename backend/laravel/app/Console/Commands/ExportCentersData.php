<?php

namespace App\Console\Commands;

use App\Models\OfficialCenter;
use App\Models\OfficialUniversity;
use Illuminate\Console\Command;

class ExportCentersData extends Command
{
    protected $signature = 'data:export-centers';
    protected $description = 'Export universities and centers data to JSON (with coordinates)';

    public function handle()
    {
        $this->info('Exporting universities and centers data...');

        $exportDir = database_path('data/backups');
        
        if (!file_exists($exportDir)) {
            mkdir($exportDir, 0755, true);
        }

        // Export universities
        $universities = OfficialUniversity::all()->toArray();
        $univFile = $exportDir . '/official_universities_backup.json';
        file_put_contents($univFile, json_encode($universities, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
        $this->info("✅ Exported " . count($universities) . " universities to: {$univFile}");

        // Export centers WITH coordinates (exclude raw_payload and fix timestamps)
        $centers = OfficialCenter::all()->map(function($center) {
            $data = $center->toArray();
            unset($data['raw_payload']); // Remove complex JSON field
            
            // Convert timestamps to MySQL format
            if (isset($data['created_at'])) $data['created_at'] = date('Y-m-d H:i:s', strtotime($data['created_at']));
            if (isset($data['updated_at'])) $data['updated_at'] = date('Y-m-d H:i:s', strtotime($data['updated_at']));
            if (isset($data['last_seen_at'])) $data['last_seen_at'] = date('Y-m-d H:i:s', strtotime($data['last_seen_at']));
            
            return $data;
        })->toArray();
        
        $centersFile = $exportDir . '/official_centers_backup.json';
        file_put_contents($centersFile, json_encode($centers, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
        $this->info("✅ Exported " . count($centers) . " centers to: {$centersFile}");

        // Count centers with coordinates
        $withCoords = collect($centers)->filter(fn($c) => isset($c['lat']) && isset($c['lng']))->count();
        $total = count($centers);
        $this->info("   → {$withCoords}/{$total} centers have coordinates");

        $this->newLine();
        $this->info('🎉 Export complete! These files can be used to restore data if needed.');
        
        return Command::SUCCESS;
    }
}
