<?php

namespace Database\Seeders;

use App\Models\OfficialCenter;
use App\Models\OfficialUniversity;
use Illuminate\Database\Seeder;
use Illuminate\Support\Collection;

require_once __DIR__ . '/helpers.php';

class OfficialCenterSeeder extends Seeder
{
    public function run(): void
    {
        // Check if backup with coordinates exists
        $backupPath = database_path('data/backups/official_centers_backup.json');
        
        if (file_exists($backupPath)) {
            $this->command?->info('⚡ Using backup with coordinates...');
            $backupData = json_decode(file_get_contents($backupPath), true);
            
            // Directly insert from backup (already has all fields including lat/lng, except raw_payload)
            collect($backupData)
                ->chunk(50)
                ->each(function (Collection $chunk) {
                    OfficialCenter::upsert(
                        $chunk->all(),
                        ['ruct_center_code'],
                        [
                            'official_university_id',
                            'name',
                            'center_type',
                            'legal_nature',
                            'attachment_type',
                            'address',
                            'postal_code',
                            'locality',
                            'municipality',
                            'province',
                            'autonomous_community_code',
                            'autonomous_community_name',
                            'lat',
                            'lng',
                            'active',
                            'source_system',
                            'source_url',
                            'last_seen_at',
                            'updated_at',
                        ]
                    );
                });
            
            $this->command?->info('✅ OfficialCenterSeeder: ' . count($backupData) . ' centros procesados (with coordinates)');
            return;
        }
        
        // Fallback to original RUCT data (without coordinates)
        $this->command?->warn('⚠️  No backup found. Loading from RUCT (coordinates will need to be geocoded)');
        $data = require_data('catalog/universities/raw/ruct_centers.json');
        $universities = OfficialUniversity::query()->get()->keyBy('ruct_code');

        $rows = [];
        foreach ($data as $item) {
            $university = $universities->get($item['university_code'] ?? null);

            $rows[] = [
                'official_university_id' => $university?->id,
                'ruct_center_code' => $item['ruct_center_code'],
                'name' => $item['name'],
                'center_type' => $item['center_type'] ?? null,
                'legal_nature' => $item['legal_nature'] ?? null,
                'attachment_type' => $item['attachment_type'] ?? null,
                'address' => $item['address'] ?? null,
                'postal_code' => $item['postal_code'] ?? null,
                'locality' => $item['locality'] ?? null,
                'municipality' => $item['municipality'] ?? null,
                'province' => $item['province'] ?? null,
                'autonomous_community_code' => null,
                'autonomous_community_name' => $item['autonomous_community_name'] ?? null,
                'active' => true,
                'source_system' => 'RUCT',
                'source_url' => $item['source_url'] ?? null,
                'last_seen_at' => now(),
                'raw_payload' => json_encode($item, JSON_UNESCAPED_UNICODE),
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        collect($rows)
            ->chunk(50)
            ->each(function (Collection $chunk) {
                OfficialCenter::upsert(
                    $chunk->all(),
                    ['ruct_center_code'],
                    [
                        'official_university_id',
                        'name',
                        'center_type',
                        'legal_nature',
                        'attachment_type',
                        'address',
                        'postal_code',
                        'locality',
                        'municipality',
                        'province',
                        'autonomous_community_code',
                        'autonomous_community_name',
                        'active',
                        'source_system',
                        'source_url',
                        'last_seen_at',
                        'raw_payload',
                        'updated_at',
                    ]
                );
            });

        $this->command?->info('✅ OfficialCenterSeeder: ' . count($rows) . ' centros procesados');
    }
}
