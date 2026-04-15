<?php

namespace Database\Seeders;

use App\Models\ProfessionalCertificate;
use Illuminate\Database\Seeder;
use Illuminate\Support\Collection;

require_once __DIR__ . '/helpers.php';

class ProfessionalCertificateSeeder extends Seeder
{
    public function run(): void
    {
        $data = require_data('catalog/professional_certificates/raw/sepe_certificates.json');

        $rows = [];
        foreach ($data as $item) {
            $rows[] = [
                'sepe_code' => $item['codigo'],
                'name' => $item['denominacion'],
                'family_code' => $item['familia_codigo'] ?? null,
                'family_name' => $item['familia'] ?? null,
                'area_code' => $item['area_codigo'] ?? null,
                'area_name' => $item['area'] ?? null,
                'level' => $item['nivel'] ?? null,
                'total_hours' => $item['horas_totales'] ?? null,
                'is_modular' => $item['modulada'] ?? false,
                'is_professional_certificate' => $item['certificado_prof'] ?? false,
                'online_hours' => $item['horas_teleformacion'] ?? null,
                'associated_centers' => $item['centros_asociados'] ?? null,
                'detail_url' => $item['detalle_url'] ?? null,
                'active' => true,
                'source_system' => 'SEPE',
                'last_seen_at' => now(),
                'raw_payload' => json_encode($item, JSON_UNESCAPED_UNICODE),
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        collect($rows)
            ->chunk(100)
            ->each(function (Collection $chunk) {
                ProfessionalCertificate::upsert(
                    $chunk->all(),
                    ['sepe_code'],
                    [
                        'name',
                        'family_code',
                        'family_name',
                        'area_code',
                        'area_name',
                        'level',
                        'total_hours',
                        'is_modular',
                        'is_professional_certificate',
                        'online_hours',
                        'associated_centers',
                        'detail_url',
                        'active',
                        'source_system',
                        'last_seen_at',
                        'raw_payload',
                        'updated_at',
                    ]
                );
            });

        $this->command?->info('✅ ProfessionalCertificateSeeder: ' . count($rows) . ' certificados procesados');
    }
}
