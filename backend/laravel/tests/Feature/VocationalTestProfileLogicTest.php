<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\Usuario;
use App\Models\Perfil;
use App\Models\TestSesion;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class VocationalTestProfileLogicTest extends TestCase
{
    use RefreshDatabase;

    public function test_phase_1_uses_profile_info()
    {
        $user = Usuario::factory()->create();
        $perfil = Perfil::create([
            'usuario_id' => $user->id,
            'fecha_nacimiento' => '1990-01-01',
            'telefono' => '123456789',
            'bio' => 'Bio test'
        ]);

        // Add interests/skills manually or via factory if available
        // Mocking obtaining profile text directly via controller logic is hard without unit test, 
        // so we will rely on checking the prompt sent to Gemini via Http::fake

        $this->actingAs($user);

        // Create session
        $sesion = TestSesion::create([
            'usuario_id' => $user->id,
            'current_index' => 3, // Next is 4 (Phase 1)
            'total_questions' => 20,
            'estado' => 'en_progreso'
        ]);

        Http::fake(function ($request) {
            $body = $request->body();
            // Check if prompt contains "CONTEXTO DEL USUARIO"
            if (str_contains($body, 'CONTEXTO DEL USUARIO')) {
                return Http::response(['candidates' => [['content' => [['parts' => [['text' => '{"texto": "Pregunta P1", "opciones": ["A", "B"]}']]]]]]], 200);
            }
            return Http::response(['candidates' => [['content' => [['parts' => [['text' => '{}']]]]]]], 200);
        });

        $response = $this->postJson('/api/test/siguiente-pregunta', [
            'session_id' => $sesion->id,
            'pregunta_id' => 'prev_id',
            'respuesta' => 'Respuesta anterior'
        ]);

        $response->assertStatus(200);
        // We implicitly asserted the prompt content via Http::fake logic returning valid JSON only if matched
    }

    public function test_phase_2_ignores_profile_info()
    {
        $user = Usuario::factory()->create();
        $perfil = Perfil::create([
            'usuario_id' => $user->id,
            'fecha_nacimiento' => '1990-01-01',
            'telefono' => '123456789',
            'bio' => 'Bio test'
        ]);

        $this->actingAs($user);

        // Create session in Phase 2
        $sesion = TestSesion::create([
            'usuario_id' => $user->id,
            'current_index' => 6, // Next is 7 (Phase 2)
            'total_questions' => 20,
            'estado' => 'en_progreso'
        ]);

        Http::fake(function ($request) {
            $body = $request->body();
            // Check if prompt DOES NOT contain "CONTEXTO DEL USUARIO"
            if (!str_contains($body, 'CONTEXTO DEL USUARIO')) {
                return Http::response(['candidates' => [['content' => [['parts' => [['text' => '{"texto": "Pregunta P2", "opciones": ["A", "B"]}']]]]]]], 200);
            }
            return Http::response(['candidates' => [['content' => [['parts' => [['text' => '{}']]]]]]], 500); // Fail if it contains profile
        });

        $response = $this->postJson('/api/test/siguiente-pregunta', [
            'session_id' => $sesion->id,
            'pregunta_id' => 'prev_id',
            'respuesta' => 'Respuesta anterior'
        ]);

        $response->assertStatus(200);
    }
}
