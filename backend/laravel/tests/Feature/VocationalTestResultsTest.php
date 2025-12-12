<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\Usuario;
use App\Models\TestSesion;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;

class VocationalTestResultsTest extends TestCase
{
    use RefreshDatabase;

    public function test_analizar_resultados_generates_and_saves_recommendations()
    {
        // 1. Crear usuario y sesión con historial
        $user = Usuario::factory()->create();
        $this->actingAs($user);

        $sesion = new TestSesion();
        $sesion->usuario_id = $user->id;
        $sesion->initialize();

        // Simular un historial completo
        $historial = [
            ['pregunta_id' => 'static_1', 'texto_pregunta' => 'P1', 'respuesta' => 'R1'],
            ['pregunta_id' => 'static_2', 'texto_pregunta' => 'P2', 'respuesta' => 'R2'],
            // ... más preguntas ...
        ];
        $sesion->historial = $historial;
        $sesion->save();

        // 2. Mockear respuesta de Gemini
        $mockResponse = [
            'profesiones' => [
                [
                    'titulo' => 'Desarrollador Web',
                    'descripcion' => 'Encaja con tu perfil lógico.',
                    'salidas' => 'Frontend, Backend, Fullstack',
                    'nivel' => 'FP Grado Superior',
                    'sector' => 'Tecnología'
                ],
                [
                    'titulo' => 'Analista de Datos',
                    'descripcion' => 'Te gusta analizar información.',
                    'salidas' => 'Big Data, Business Intelligence',
                    'nivel' => 'Grado Universitario',
                    'sector' => 'Tecnología'
                ],
                [
                    'titulo' => 'Técnico en Ciberseguridad',
                    'descripcion' => 'Te interesa la seguridad.',
                    'salidas' => 'Auditor, Pentester',
                    'nivel' => 'FP Grado Superior',
                    'sector' => 'Tecnología'
                ],
                [
                    'titulo' => 'Administrador de Sistemas',
                    'descripcion' => 'Te gusta gestionar servidores.',
                    'salidas' => 'SysAdmin, DevOps',
                    'nivel' => 'Certificado de profesionalidad',
                    'sector' => 'Tecnología'
                ]
            ]
        ];

        Http::fake([
            '*generativelanguage.googleapis.com*' => Http::response([
                'candidates' => [
                    [
                        'content' => [
                            'parts' => [
                                ['text' => json_encode($mockResponse)]
                            ]
                        ]
                    ]
                ]
            ], 200)
        ]);

        // 3. Llamar al endpoint
        $response = $this->postJson('/api/test/analizar-respuestas', [
            'session_id' => $sesion->id
        ]);

        // 4. Verificar respuesta
        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'resultados' => [
                    'profesiones' => [
                        '*' => ['titulo', 'descripcion', 'salidas', 'nivel', 'sector']
                    ]
                ]
            ]);

        // 5. Verificar base de datos (Sesión)
        $sesion->refresh();
        $this->assertEquals('completado', $sesion->estado);
        $this->assertNotNull($sesion->completed_at);
        $this->assertIsArray($sesion->resultados);
        $this->assertEquals('Desarrollador Web', $sesion->resultados['profesiones'][0]['titulo']);

        // 6. Verificar base de datos (Tabla de Resultados para Frontend)
        $this->assertDatabaseHas('test_results', [
            'usuario_id' => $user->id,
            'test_session_id' => $sesion->id,
            'result_text' => 'Análisis vocacional completado'
        ]);
    }
}
