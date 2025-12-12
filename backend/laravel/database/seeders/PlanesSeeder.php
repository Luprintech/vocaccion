<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class PlanesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Limpiar tabla antes de seedear
        DB::table('planes')->truncate();

        $planes = [
            [
                'nombre' => 'Gratuito',
                'slug' => 'gratuito',
                'precio' => 0.00,
                'moneda' => 'EUR',
                'descripcion' => 'Acceso básico a la plataforma. Realiza el test vocacional y descubre tu camino.',
                'features' => json_encode([
                    'Test vocacional básico',
                    'Resultados limitados',
                    'Acceso a información de carreras'
                ]),
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'nombre' => 'Pro',
                'slug' => 'pro',
                'precio' => 9.99,
                'moneda' => 'EUR',
                'descripcion' => 'Profundiza en tus resultados y obtén orientación personalizada.',
                'features' => json_encode([
                    'Todo lo del plan Gratuito',
                    'Análisis detallado de perfil',
                    'Recomendaciones de IA avanzadas',
                    'Chat con orientador (limitado)'
                ]),
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'nombre' => 'Pro Plus',
                'slug' => 'pro_plus',
                'precio' => 19.99,
                'moneda' => 'EUR',
                'descripcion' => 'La experiencia completa con soporte prioritario y videollamadas.',
                'features' => json_encode([
                    'Todo lo del plan Pro',
                    'Videollamadas con orientadores',
                    'Prioridad en soporte',
                    'Plan de acción personalizado'
                ]),
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ];

        DB::table('planes')->insert($planes);
    }
}
