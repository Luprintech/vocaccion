<?php

namespace App\Jobs;

use App\Models\DataUpdateRun;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Artisan;

class RunDataUpdateJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(private readonly int $runId)
    {
    }

    public function handle(): void
    {
        $run = DataUpdateRun::find($this->runId);

        if (!$run) {
            return;
        }

        $run->update([
            'status' => 'running',
            'started_at' => now(),
            'error' => null,
        ]);

        try {
            $output = [];

            foreach ($this->commandsFor($run) as [$command, $options]) {
                Artisan::call($command, $options);
                $output[] = "$ {$command} " . json_encode($options, JSON_UNESCAPED_UNICODE);
                $output[] = trim(Artisan::output());
            }

            $run->update([
                'status' => 'completed',
                'output' => trim(implode("\n\n", array_filter($output))),
                'finished_at' => now(),
            ]);
        } catch (\Throwable $e) {
            $run->update([
                'status' => 'failed',
                'error' => $e->getMessage(),
                'finished_at' => now(),
            ]);

            throw $e;
        }
    }

    protected function commandsFor(DataUpdateRun $run): array
    {
        $options = $run->options ?? [];

        return match ($run->type) {
            'refresh_courses' => [
                ['db:seed', ['--class' => 'TrainingCourseSeeder', '--force' => true]],
            ],
            'refresh_official_catalog' => [
                ['db:seed', ['--class' => 'OfficialUniversitySeeder', '--force' => true]],
                ['db:seed', ['--class' => 'OfficialCenterSeeder', '--force' => true]],
                ['db:seed', ['--class' => 'OfficialDegreeSeeder', '--force' => true]],
                ['db:seed', ['--class' => 'OfficialDegreeCenterSeeder', '--force' => true]],
            ],
            'geocode_precise' => [
                ['vocacional:geocode-reliable', array_filter([
                    '--province' => $options['province'] ?? null,
                    '--limit' => $options['limit'] ?? null,
                    '--force' => (bool) ($options['force'] ?? false),
                ], fn ($value) => $value !== null && $value !== false)],
            ],
            default => [],
        };
    }
}
