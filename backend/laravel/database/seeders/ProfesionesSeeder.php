<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ProfesionesSeeder extends Seeder
{
    public function run()
    {
        $profesiones = [
            [
                'titulo' => 'Desarrollador/a Web',
                'descripcion' => 'Diseña y construye aplicaciones web usando HTML, CSS, JavaScript y frameworks.',
                'salidas' => 'Empresas tecnológicas, freelance, startups.',
                'formacion_recomendada' => 'Grado en Informática, bootcamps de programación.',
                'habilidades' => json_encode(['Programación', 'Trabajo en equipo', 'Resolución de problemas']),
            ],
            [
                'titulo' => 'Diseñador/a UX/UI',
                'descripcion' => 'Crea experiencias de usuario intuitivas y atractivas para aplicaciones y webs.',
                'salidas' => 'Agencias, equipos de producto, freelance.',
                'formacion_recomendada' => 'Grado en Diseño, cursos de UX, portfolios.',
                'habilidades' => json_encode(['Diseño visual', 'Investigación de usuarios', 'Prototipado']),
            ],
            [
                'titulo' => 'Ciclista Profesional (ejemplo)',
                'descripcion' => 'Carrera deportiva profesional en ciclismo.',
                'salidas' => 'Deporte profesional, entrenamientos, coaching.',
                'formacion_recomendada' => 'Formación deportiva especializada.',
                'habilidades' => json_encode(['Condición física', 'Disciplina']),
            ],
        ];

        foreach ($profesiones as $p) {
            DB::table('profesiones')->insert(array_merge($p, ['created_at' => now(), 'updated_at' => now()]));
        }
    }
}
