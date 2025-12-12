<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class RecursosSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // NO truncamos para preservar recursos creados manualmente
        // DB::table('recursos')->truncate();

        $recursos = [
            [
                'slug' => 'que-hacer-si-no-se-que-estudiar',
                'titulo' => '¿Qué hacer si no sé qué estudiar?',
                'descripcion' => 'Una guía completa para descubrir tu vocación y elegir la mejor formación para tu futuro profesional.',
                'tipo' => 'artículo',
                'tiempo_lectura' => '8 min',
                'enlace' => '/recursos/articulos/que-hacer-si-no-se-que-estudiar',
                'destacado' => true,
                'visualizaciones' => 0,
                'descargas' => 0,
                'plan_requerido' => 'gratuito',
                'imagen_portada' => '/images/articulos/que-estudiar.jpg',
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'slug' => 'universidad-fp-cursos-como-elegir',
                'titulo' => 'Universidad vs FP vs Cursos: Cómo elegir',
                'descripcion' => 'Comparativa completa para ayudarte a decidir qué tipo de formación se adapta mejor a tu perfil y objetivos.',
                'tipo' => 'artículo',
                'tiempo_lectura' => '12 min',
                'enlace' => '/recursos/articulos/universidad-fp-cursos-como-elegir',
                'destacado' => true,
                'visualizaciones' => 0,
                'descargas' => 0,
                'plan_requerido' => 'gratuito',
                'imagen_portada' => '/images/articulos/universidad-fp.jpg',
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'slug' => 'como-elegir-carrera-universitaria',
                'titulo' => 'Cómo elegir la carrera universitaria perfecta',
                'descripcion' => 'Factores clave a considerar al elegir qué carrera estudiar en la universidad.',
                'tipo' => 'artículo',
                'tiempo_lectura' => '10 min',
                'enlace' => '/recursos/articulos/como-elegir-carrera-universitaria',
                'destacado' => false,
                'visualizaciones' => 0,
                'descargas' => 0,
                'plan_requerido' => 'gratuito',
                'imagen_portada' => '/images/articulos/elegir-carrera.jpg',
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'slug' => 'fp-dual-que-es-ventajas',
                'titulo' => 'FP Dual: Qué es y cuáles son sus ventajas',
                'descripcion' => 'Todo lo que necesitas saber sobre la Formación Profesional Dual.',
                'tipo' => 'artículo',
                'tiempo_lectura' => '7 min',
                'enlace' => '/recursos/articulos/fp-dual-que-es-ventajas',
                'destacado' => false,
                'visualizaciones' => 0,
                'descargas' => 0,
                'plan_requerido' => 'gratuito',
                'imagen_portada' => '/images/articulos/fp-dual.jpg',
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'slug' => 'test-orientacion-vocacional-como-funciona',
                'titulo' => 'Tests de orientación vocacional: ¿Realmente funcionan?',
                'descripcion' => 'Análisis de la efectividad de los tests vocacionales.',
                'tipo' => 'artículo',
                'tiempo_lectura' => '6 min',
                'enlace' => '/recursos/articulos/test-orientacion-vocacional-como-funciona',
                'destacado' => false,
                'visualizaciones' => 0,
                'descargas' => 0,
                'plan_requerido' => 'gratuito',
                'imagen_portada' => '/images/articulos/test-orientacion.jpg',
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'slug' => 'salidas-profesionales-tecnologia-2025',
                'titulo' => 'Salidas profesionales en tecnología 2025',
                'descripcion' => 'Las profesiones tecnológicas más demandadas.',
                'tipo' => 'artículo',
                'tiempo_lectura' => '9 min',
                'enlace' => '/recursos/articulos/salidas-profesionales-tecnologia-2025',
                'destacado' => true,
                'visualizaciones' => 0,
                'descargas' => 0,
                'plan_requerido' => 'gratuito',
                'imagen_portada' => '/images/articulos/salidas-profesionales.jpg',
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'slug' => 'carta-presentacion-estructura-ejemplos',
                'titulo' => 'La Carta de Presentación que Abre Puertas',
                'descripcion' => 'Aprende la estructura exacta que buscan los reclutadores.',
                'tipo' => 'artículo',
                'tiempo_lectura' => '15 min',
                'enlace' => '/recursos/articulos/carta-presentacion-estructura-ejemplos',
                'destacado' => true,
                'visualizaciones' => 0,
                'descargas' => 0,
                'plan_requerido' => 'pro',
                'imagen_portada' => '/images/articulos/carta-presentacion.jpg',
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'slug' => 'guia-definitiva-curriculum-2025-plantilla',
                'titulo' => 'Cómo hacer un Currículum Perfecto en 2025',
                'descripcion' => 'Guía paso a paso con estrategias y plantilla descargable.',
                'tipo' => 'artículo',
                'tiempo_lectura' => '20 min',
                'enlace' => '/recursos/articulos/guia-definitiva-curriculum-2025-plantilla',
                'destacado' => true,
                'visualizaciones' => 0,
                'descargas' => 0,
                'plan_requerido' => 'pro',
                'imagen_portada' => '/images/articulos/cv.jpg',
                'created_at' => now(),
                'updated_at' => now()
            ]
        ];

        foreach ($recursos as $recurso) {
            DB::table('recursos')->updateOrInsert(
                ['slug' => $recurso['slug']],
                $recurso
            );
        }
    }
}
