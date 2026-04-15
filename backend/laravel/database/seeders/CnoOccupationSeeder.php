<?php

namespace Database\Seeders;

use App\Models\CnoOccupation;
use Illuminate\Database\Seeder;

class CnoOccupationSeeder extends Seeder
{
    /**
     * Seed representative CNO-11 occupations sample (~50 entries).
     */
    public function run(): void
    {
        $data = require database_path('data/cno_occupations_sample.php');

        $rows = array_map(function (array $item) {
            return [
                'codigo_cno' => $item['codigo_cno'],
                'denominacion' => $item['denominacion'],
                'nivel_jerarquico' => (int) ($item['nivel_jerarquico'] ?? 4),
                'codigo_padre' => $item['codigo_padre'] ?? null,
                'gran_grupo' => (string) ($item['gran_grupo'] ?? substr($item['codigo_cno'], 0, 1)),
                'denominacion_gran_grupo' => $item['denominacion_gran_grupo'] ?? null,
                'riasec_r' => (float) ($item['riasec_r'] ?? 0),
                'riasec_i' => (float) ($item['riasec_i'] ?? 0),
                'riasec_a' => (float) ($item['riasec_a'] ?? 0),
                'riasec_s' => (float) ($item['riasec_s'] ?? 0),
                'riasec_e' => (float) ($item['riasec_e'] ?? 0),
                'riasec_c' => (float) ($item['riasec_c'] ?? 0),
                'activo' => $item['activo'] ?? true,
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }, $data);

        CnoOccupation::upsert(
            $rows,
            ['codigo_cno'],
            [
                'denominacion',
                'nivel_jerarquico',
                'codigo_padre',
                'gran_grupo',
                'denominacion_gran_grupo',
                'riasec_r',
                'riasec_i',
                'riasec_a',
                'riasec_s',
                'riasec_e',
                'riasec_c',
                'activo',
                'updated_at',
            ]
        );

        $this->command?->info('✅ CnoOccupationSeeder: ' . count($rows) . ' ocupaciones procesadas');
    }
}
