<?php

namespace App\Console\Commands;

use App\Models\OfficialCenter;
use App\Services\CenterGeocodingService;
use Illuminate\Console\Command;

class GeocodeCentersReliable extends Command
{
    protected $signature = 'vocacional:geocode-reliable {--province=} {--limit=} {--status=null : null|failed|pending|all} {--force : Reprocess even already exact rows}';
    protected $description = 'Geocode centers using exact address matching only (no municipality fallback for map accuracy)';

    public function __construct(private readonly CenterGeocodingService $geocoder)
    {
        parent::__construct();
    }

    public function handle(): int
    {
        $query = OfficialCenter::query()->whereNotNull('address');

        if ($this->option('province')) {
            $query->where('province', 'like', '%' . $this->option('province') . '%');
        }

        $status = (string) $this->option('status');

        if (!$this->option('force')) {
            if ($status === 'null') {
                $query->whereNull('geocode_precision');
            } elseif ($status === 'failed') {
                $query->where('geocode_precision', 'failed');
            } elseif ($status === 'pending') {
                $query->where(function ($q) {
                    $q->whereNull('geocode_precision')
                        ->orWhere('geocode_precision', 'failed');
                });
            } else {
                $query->whereNotIn('geocode_precision', ['exact', 'street']);
            }
        }

        if ($this->option('limit')) {
            $query->limit((int) $this->option('limit'));
        }

        $centers = $query->orderBy('id')->get();

        $this->info("Procesando {$centers->count()} centros con geocodificación fiable...");

        $bar = $this->output->createProgressBar($centers->count());
        $success = 0;
        $failed = 0;

        foreach ($centers as $center) {
            $result = $this->geocoder->geocode($center);

            if ($result) {
                $center->update([
                    'lat' => $result['lat'],
                    'lng' => $result['lng'],
                    'geocode_precision' => $result['precision'],
                    'geocode_provider' => $result['provider'],
                    'geocode_query' => $result['query'],
                    'geocode_display_name' => $result['display_name'],
                    'geocode_last_checked_at' => now(),
                ]);
                $success++;
            } else {
                $center->update([
                    'lat' => null,
                    'lng' => null,
                    'geocode_precision' => 'failed',
                    'geocode_provider' => 'nominatim',
                    'geocode_last_checked_at' => now(),
                ]);
                $failed++;
            }

            $bar->advance();
            usleep(1100000);
        }

        $bar->finish();
        $this->newLine(2);
        $this->info("Geocodificación fiable completada. OK: {$success} | Fallidos: {$failed}");

        return self::SUCCESS;
    }
}
