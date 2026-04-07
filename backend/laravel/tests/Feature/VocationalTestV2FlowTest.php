<?php

namespace Tests\Feature;

use App\Models\Usuario;
use App\Models\VocationalProfile;
use App\Models\VocationalResponse;
use App\Services\CareerMatchingService;
use App\Services\GeminiService;
use Database\Seeders\QuestionBankSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Mockery;
use Tests\TestCase;

class VocationalTestV2FlowTest extends TestCase
{
    use RefreshDatabase;

    protected Usuario $user;
    protected string $token;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(QuestionBankSeeder::class);

        $this->user = Usuario::factory()->create();
        $this->token = $this->user->createToken('test-token')->plainTextToken;

        $geminiMock = Mockery::mock(GeminiService::class);
        $geminiMock->shouldReceive('personalizeItemSelection')->andReturn([]);
        $geminiMock->shouldReceive('generateReport')->andReturn('# Informe vocacional generado');
        $geminiMock->shouldReceive('generateImageSearchTerm')->zeroOrMoreTimes()->andReturn('generic career');
        $this->app->instance(GeminiService::class, $geminiMock);

        $matcherMock = Mockery::mock(CareerMatchingService::class);
        $matcherMock->shouldReceive('match')->andReturn([
            ['titulo' => 'Ingeniero/a', 'imagenUrl' => '/img/1.jpg'],
            ['titulo' => 'Analista', 'imagenUrl' => '/img/2.jpg'],
            ['titulo' => 'Diseñador/a', 'imagenUrl' => '/img/3.jpg'],
            ['titulo' => 'Orientador/a', 'imagenUrl' => '/img/4.jpg'],
            ['titulo' => 'Coordinador/a', 'imagenUrl' => '/img/5.jpg'],
            ['titulo' => 'Administrador/a', 'imagenUrl' => '/img/6.jpg'],
        ]);
        $this->app->instance(CareerMatchingService::class, $matcherMock);
    }

    /** @test */
    public function it_completes_full_v2_vocational_test_flow(): void
    {
        $start = $this->withHeaders($this->authHeaders())
            ->postJson('/api/test/iniciar', ['age_group' => 'young_adult']);

        $start->assertOk()
            ->assertJson([
                'success' => true,
                'version' => 2,
                'phase' => 'likert',
                'current_index' => 0,
            ]);

        $sessionId = $start->json('session_id');
        $item = $start->json('item');
        $phase = $start->json('phase');

        for ($i = 0; $i < 34; $i++) {
            $value = match ($phase) {
                'likert' => 4,
                'checklist' => 1,
                'comparative' => 1,
                default => 0,
            };

            $response = $this->withHeaders($this->authHeaders())
                ->postJson('/api/test/responder', [
                    'session_id' => $sessionId,
                    'item_id' => $item['id'],
                    'value' => $value,
                    'response_time_ms' => 1200,
                ]);

            $response->assertOk();

            if ($i === 33) {
                $response->assertJson([
                    'success' => true,
                    'test_complete' => true,
                ]);
                break;
            }

            $item = $response->json('item');
            $phase = $response->json('phase');
        }

        $this->assertDatabaseCount('vocational_responses', 34);
        $this->assertSame(34, VocationalResponse::where('session_id', $sessionId)->count());

        $analysis = $this->withHeaders($this->authHeaders())
            ->postJson('/api/test/analizar-respuestas', ['session_id' => $sessionId]);

        $analysis->assertOk()
            ->assertJsonFragment(['success' => true])
            ->assertJsonFragment(['report_markdown' => '# Informe vocacional generado']);

        $profile = VocationalProfile::where('usuario_id', $this->user->id)->first();
        $this->assertNotNull($profile);
        $this->assertGreaterThan(0, $profile->realistic_score + $profile->investigative_score + $profile->artistic_score + $profile->social_score + $profile->enterprising_score + $profile->conventional_score);
    }

    protected function authHeaders(): array
    {
        return ['Authorization' => "Bearer {$this->token}"];
    }
}
