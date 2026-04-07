<?php

namespace Tests\Unit;

use App\Models\QuestionBank;
use App\Models\VocationalResponse;
use App\Services\RiasecScoreCalculatorService;
use Illuminate\Support\Collection;
use Tests\TestCase;

class RiasecScoreCalculatorServiceTest extends TestCase
{
    protected RiasecScoreCalculatorService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new RiasecScoreCalculatorService();
    }

    /** @test */
    public function it_calculates_likert_scores_on_a_0_to_100_scale(): void
    {
        $responses = new Collection([
            $this->makeResponse('likert', 'R', 5),
            $this->makeResponse('likert', 'R', 5),
            $this->makeResponse('likert', 'R', 1),
        ]);

        $scores = $this->service->calculate($responses);

        $this->assertSame(66.67, $scores['R']);
        $this->assertSame(0.0, $scores['I']);
        $this->assertSame(0.0, $scores['A']);
        $this->assertSame(0.0, $scores['S']);
        $this->assertSame(0.0, $scores['E']);
        $this->assertSame(0.0, $scores['C']);
    }

    /** @test */
    public function it_calculates_checklist_scores_as_binary_affinity(): void
    {
        $responses = new Collection([
            $this->makeResponse('checklist', 'S', 1),
            $this->makeResponse('checklist', 'S', 0),
            $this->makeResponse('checklist', 'S', 1),
            $this->makeResponse('checklist', 'S', 1),
        ]);

        $scores = $this->service->calculate($responses);

        $this->assertSame(75.0, $scores['S']);
    }

    /** @test */
    public function it_splits_comparative_scores_between_both_dimensions(): void
    {
        $responses = new Collection([
            $this->makeResponse('comparative', 'I', 1, 'A'),
            $this->makeResponse('comparative', 'I', -1, 'A'),
            $this->makeResponse('comparative', 'I', 0, 'A'),
        ]);

        $scores = $this->service->calculate($responses);

        $this->assertSame(50.0, $scores['I']);
        $this->assertSame(50.0, $scores['A']);
    }

    /** @test */
    public function it_validates_expected_phase_quotas(): void
    {
        $responses = collect();

        for ($i = 0; $i < 18; $i++) {
            $responses->push($this->makeResponse('likert', 'R', 4));
        }
        for ($i = 0; $i < 10; $i++) {
            $responses->push($this->makeResponse('checklist', 'S', 1));
        }
        for ($i = 0; $i < 6; $i++) {
            $responses->push($this->makeResponse('comparative', 'I', 1, 'A'));
        }

        $validation = $this->service->validateResponses($responses);

        $this->assertTrue($validation['valid']);
        $this->assertSame(['likert' => 18, 'checklist' => 10, 'comparative' => 6], $validation['phase_counts']);
    }

    protected function makeResponse(string $phase, string $dimension, int $value, ?string $dimensionB = null): VocationalResponse
    {
        $item = new QuestionBank([
            'phase' => $phase,
            'dimension' => $dimension,
            'dimension_b' => $dimensionB,
            'weight' => 1.0,
            'text_es' => 'test item',
        ]);

        $response = new VocationalResponse([
            'value' => $value,
        ]);

        $response->setRelation('item', $item);

        return $response;
    }
}
