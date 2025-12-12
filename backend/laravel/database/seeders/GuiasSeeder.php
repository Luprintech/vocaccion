<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class GuiasSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Obtener el ID del usuario admin para asignar como creador
        $adminId = DB::table('usuarios')
            ->join('rol_usuario', 'usuarios.id', '=', 'rol_usuario.usuario_id')
            ->join('roles', 'rol_usuario.rol_id', '=', 'roles.id')
            ->where('roles.nombre', 'administrador')
            ->value('usuarios.id');

        $guias = [
            // RECURSOS GRATUITOS
            [
                'titulo' => 'Guía de Orientación Vocacional',
                'slug' => 'guia-orientacion-vocacional',
                'imagen_portada' => null,
                'descripcion' => 'Guía completa para descubrir tu vocación y elegir la carrera adecuada. Incluye ejercicios prácticos, test de autoevaluación y consejos de expertos.',
                'categoria' => 'profesiones',
                'path_pdf' => 'guias/orientacion-vocacional.pdf',
                'tamanio' => 2048000, // 2 MB
                'numero_paginas' => 24,
                'usuario_id' => $adminId,
                'visibilidad' => 'publico',
                'plan_requerido' => 'gratuito',
                'esta_publicado' => true,
                'fecha_publicacion' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'titulo' => 'Becas y Ayudas 2025',
                'slug' => 'becas-ayudas-2025',
                'imagen_portada' => null,
                'descripcion' => 'Recopilación completa de todas las becas y ayudas disponibles para estudiantes en 2025. Incluye requisitos, plazos y enlaces directos.',
                'categoria' => 'estudios',
                'path_pdf' => 'guias/becas-2025.pdf',
                'tamanio' => 1536000, // 1.5 MB
                'numero_paginas' => 18,
                'usuario_id' => $adminId,
                'visibilidad' => 'publico',
                'plan_requerido' => 'gratuito',
                'esta_publicado' => true,
                'fecha_publicacion' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'titulo' => 'Guía de Formación Profesional',
                'slug' => 'guia-formacion-profesional',
                'imagen_portada' => null,
                'descripcion' => 'Todo lo que necesitas saber sobre la Formación Profesional: tipos de ciclos, salidas laborales, centros y proceso de admisión.',
                'categoria' => 'estudios',
                'path_pdf' => 'guias/formacion-profesional.pdf',
                'tamanio' => 3072000, // 3 MB
                'numero_paginas' => 32,
                'usuario_id' => $adminId,
                'visibilidad' => 'publico',
                'plan_requerido' => 'gratuito',
                'esta_publicado' => true,
                'fecha_publicacion' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ],

            // RECURSOS PRO / PRO PLUS
            [
                'titulo' => 'Plantilla de Carta de Presentación Profesional',
                'slug' => 'plantilla-carta-presentacion',
                'imagen_portada' => null,
                'descripcion' => 'Plantilla profesional y personalizable para crear tu carta de presentación perfecta. Incluye ejemplos, consejos de redacción y estructura optimizada para destacar.',
                'categoria' => 'tecnicas',
                'path_pdf' => 'guias/premium/carta-presentacion-plantilla.pdf',
                'tamanio' => 512000, // 500 KB
                'numero_paginas' => 6,
                'usuario_id' => $adminId,
                'visibilidad' => 'publico',
                'plan_requerido' => 'pro',
                'esta_publicado' => true,
                'fecha_publicacion' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'titulo' => 'Plantilla de Currículum Vitae Profesional',
                'slug' => 'plantilla-curriculum-vitae',
                'imagen_portada' => null,
                'descripcion' => 'Plantilla de CV moderna y profesional con diseño atractivo. Incluye múltiples formatos, consejos de optimización y ejemplos de cada sección.',
                'categoria' => 'tecnicas',
                'path_pdf' => 'guias/premium/curriculum-vitae-plantilla.pdf',
                'tamanio' => 768000, // 750 KB
                'numero_paginas' => 8,
                'usuario_id' => $adminId,
                'visibilidad' => 'publico',
                'plan_requerido' => 'pro',
                'esta_publicado' => true,
                'fecha_publicacion' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ];

        foreach ($guias as $guia) {
            DB::table('guias')->insert($guia);
        }

        echo "✅ Guías creadas exitosamente:\n";
        echo "   - 3 recursos gratuitos\n";
        echo "   - 2 recursos premium (Pro/Pro Plus)\n";
    }
}
