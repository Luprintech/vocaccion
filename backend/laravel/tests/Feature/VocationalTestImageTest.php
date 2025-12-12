<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\Usuario;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;

class VocationalTestImageTest extends TestCase
{
    use RefreshDatabase;

    public function test_generar_imagen_returns_pexels_url()
    {
        $user = Usuario::factory()->create();
        $this->actingAs($user);

        // Mock Gemini response (search term)
        Http::fake([
            '*generativelanguage.googleapis.com*' => Http::response([
                'candidates' => [
                    [
                        'content' => [
                            'parts' => [
                                ['text' => 'Software Developer']
                            ]
                        ]
                    ]
                ]
            ], 200),

            // Mock Pexels response
            'api.pexels.com*' => Http::response([
                'photos' => [
                    [
                        'src' => [
                            'large2x' => 'https://images.pexels.com/photos/12345/pexels-photo-12345.jpeg'
                        ]
                    ]
                ]
            ], 200)
        ]);

        $response = $this->postJson('/api/generar-imagen', [
            'profesion' => 'Desarrollador de Software'
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'term' => 'Software Developer',
                'source' => 'pexels',
                'imagenUrl' => 'https://images.pexels.com/photos/12345/pexels-photo-12345.jpeg'
            ]);
    }

    public function test_generar_imagen_handles_pexels_error()
    {
        $user = Usuario::factory()->create();
        $this->actingAs($user);

        // Mock Gemini success but Pexels failure
        Http::fake([
            '*generativelanguage.googleapis.com*' => Http::response([
                'candidates' => [['content' => [['parts' => [['text' => 'Astronaut']]]]]]
            ], 200),
            'api.pexels.com*' => Http::response([], 500)
        ]);

        $response = $this->postJson('/api/generar-imagen', [
            'profesion' => 'Astronauta'
        ]);

        // Should return success true but with default image and source fallback_error
        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'source' => 'fallback_error',
                'imagenUrl' => '/images/default-profession.jpg'
            ]);
    }
}
