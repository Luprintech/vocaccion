<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\Usuario;
use App\Models\VocationalSession;
use App\Services\GeminiService;
use Mockery;

class VocationalTestFlowTest extends TestCase
{
    use RefreshDatabase;

    protected $user;
    protected $token;
    protected $geminiMock;

    protected function setUp(): void
    {
        parent::setUp();

        // Mock GeminiService BEFORE creating the controller that might use it
        $this->geminiMock = Mockery::mock(GeminiService::class);
        $this->app->instance(GeminiService::class, $this->geminiMock);

        // Crear usuario y autenticar
        $this->user = Usuario::factory()->create();
        $this->token = $this->user->createToken('test-token')->plainTextToken;
    }

    /** @test */
    public function it_completes_full_vocational_test_flow()
    {
        // 1. INICIAR TEST
        $response = $this->withHeaders(['Authorization' => "Bearer {$this->token}"])
            ->postJson('/api/test/iniciar');

        $response->assertStatus(200);
        $sessionId = $response->json('session_id');

        $this->assertNotNull($sessionId);
        $this->assertEquals(1, $response->json('version'));
        $this->assertEquals('warm_up', $response->json('current_phase'));
        $this->assertEquals(0, $response->json('progress'));

        // 2. RETRIEVE SESSION FROM DB
        $session = VocationalSession::find($sessionId);
        $this->assertNotNull($session);
        $this->assertTrue($session->isV1());

        // MOCK SETUP
        // Setup GMock for generateQuestion
        $this->geminiMock->shouldReceive('generateQuestion')
            ->andReturn([
                'question_text' => '¿Pregunta dinámica generada por Mock?',
                'options' => [
                    ['text' => 'Opción A', 'trait' => 'R_REALISTIC'],
                    ['text' => 'Opción B', 'trait' => 'I_INVESTIGATIVE'],
                    ['text' => 'Opción C', 'trait' => 'A_ARTISTIC'],
                    ['text' => 'Opción D', 'trait' => 'S_SOCIAL']
                ]
            ]);

        // Setup GMock for analyzeBatch (every 5 questions)
        $this->geminiMock->shouldReceive('analyzeBatch')
            ->andReturn([
                'scores_delta' => ['realistic_score' => 5],
                'new_skills' => [],
                'discarded_areas' => [],
                'next_focus_recommendation' => 'Keep going'
            ]);

        // 3. ANSWER 3 WARM-UP QUESTIONS (Static logic, no Gemini needed yet)
        for ($i = 0; $i < 3; $i++) {
            $response = $this->withHeaders(['Authorization' => "Bearer {$this->token}"])
                ->postJson('/api/test/siguiente-pregunta', [
                    'session_id' => $sessionId,
                    'respuesta' => 'Opción de prueba'
                ]);

            $response->assertStatus(200);
            // After 3 questions (0, 1, 2 answered), next question (index 3) might start triggering dynamic logic depending on implementation
        }

        // 4. ANSWER REMAINING QUESTIONS (Explore Phase - Dynamic)
        // We expect questions 4 to 15. The engine triggers batch analysis every 5 questions.
        // And generates questions using Gemini if no template.

        // Loop until question 15
        // We already did 3. So we loop 12 more times.
        for ($i = 3; $i < 15; $i++) {
            $response = $this->withHeaders(['Authorization' => "Bearer {$this->token}"])
                ->postJson('/api/test/siguiente-pregunta', [
                    'session_id' => $sessionId,
                    'respuesta' => 'Opción Dinámica'
                ]);

            if ($response->json('finalizado')) {
                break;
            }

            $response->assertStatus(200);
        }

        // 5. VERIFY COMPLETION
        // The next call should return finalized=true
        $response = $this->withHeaders(['Authorization' => "Bearer {$this->token}"])
            ->postJson('/api/test/siguiente-pregunta', [
                'session_id' => $sessionId,
                'respuesta' => 'Última respuesta'
            ]);

        $response->assertStatus(200);
        $this->assertTrue($response->json('finalizado') ?? false);
        $this->assertEquals('done', $response->json('current_phase'));

        // 6. CHECK DB STATE
        $session->refresh();
        $this->assertTrue($session->is_completed);
        $this->assertEquals('done', $session->current_phase);
    }
}
