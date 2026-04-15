<?php

namespace Database\Seeders;

use App\Models\ProfessionalQualification;
use Illuminate\Database\Seeder;

class ProfessionalQualificationSeeder extends Seeder
{
    /**
     * Seed CNCP professional qualifications (756 entries).
     */
    public function run(): void
    {
        $data = require database_path('data/cncp_qualifications_data.php');

        $rows = array_map(function (array $item) {
            $unidades = $item['unidades_competencia'] ?? null;
            $sectores = $item['sectores_productivos'] ?? [];
            $ocupaciones = $item['ocupaciones'] ?? [];

            return [
                'codigo_cncp' => $item['codigo'],
                'denominacion' => $item['denominacion'],
                'familia_profesional' => $item['familia_profesional'],
                'codigo_familia' => $item['codigo_familia'] ?? substr($item['codigo'], 0, 3),
                'nivel' => (int) $item['nivel'],
                'competencia_general' => $item['competencia_general'] ?? null,
                'unidades_competencia' => is_array($unidades) ? json_encode($unidades, JSON_UNESCAPED_UNICODE) : $unidades,
                'ambito_profesional' => $item['entorno_profesional'] ?? null,
                'sectores_productivos' => json_encode($sectores, JSON_UNESCAPED_UNICODE),
                'ocupaciones' => json_encode($ocupaciones, JSON_UNESCAPED_UNICODE),
                'activo' => $item['activo'] ?? true,
                'url_incual' => $item['url_incual'] ?? null,
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }, $data);

        ProfessionalQualification::upsert(
            $rows,
            ['codigo_cncp'],
            [
                'denominacion',
                'familia_profesional',
                'codigo_familia',
                'nivel',
                'competencia_general',
                'unidades_competencia',
                'ambito_profesional',
                'sectores_productivos',
                'ocupaciones',
                'activo',
                'url_incual',
                'updated_at',
            ]
        );

        $this->command?->info('✅ ProfessionalQualificationSeeder: ' . count($rows) . ' cualificaciones procesadas');
    }
}
