<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;

class GeocodeCatalogCenters extends Command
{
    protected $signature = 'catalog:geocode-centers
                            {--community= : Only geocode centers from this community}
                            {--batch=5000 : Max centers to geocode per run}
                            {--all : Re-geocode centers that already have coordinates}
                            {--clear-cache : Delete the locality geocode cache and start fresh}';

    protected $description = 'Geocode catalog_centers using Nominatim API (batched by locality+province, cached)';

    private const CACHE_FILE  = 'geocode_locality_cache.json';
    private const DELAY_MS    = 1100; // >1 s to respect Nominatim rate limit

    public function handle(): int
    {
        if ($this->option('clear-cache')) {
            Storage::disk('local')->delete(self::CACHE_FILE);
            $this->info('Cache cleared.');
        }

        $cache     = $this->loadCache();
        $batchSize = (int) $this->option('batch');
        $all       = $this->option('all');
        $community = $this->option('community');

        $this->info("Loaded {$cache->count()} cached localities.");

        // ---------------------------------------------------------------
        // Phase 1: Apply cache to ungeocoded centers (free — no HTTP)
        // ---------------------------------------------------------------
        $this->info('Phase 1: Applying cached coordinates...');
        $cacheHits = $this->applyCacheToUngeocoded($cache);
        $this->info("  → {$cacheHits} centers updated from cache.");

        // ---------------------------------------------------------------
        // Phase 2: Discover unique (locality, province) pairs still missing
        // ---------------------------------------------------------------
        $this->info('Phase 2: Geocoding uncached localities via Nominatim...');

        $query = DB::table('catalog_centers')
            ->whereNull('lat')
            ->whereNotNull('locality')
            ->whereNotNull('province');

        if (!$all) {
            $query->whereNull('lat');
        }

        if ($community) {
            $query->where('autonomous_community', 'like', "%{$community}%");
        }

        $pairs = $query
            ->select(DB::raw('LOWER(TRIM(locality)) as loc, LOWER(TRIM(province)) as prov, locality, province'))
            ->groupBy('loc', 'prov', 'locality', 'province')
            ->limit($batchSize)
            ->get();

        $total     = $pairs->count();
        $geocoded  = 0;
        $failed    = 0;

        $this->info("  Unique localities to geocode: {$total}");

        if ($total === 0) {
            $this->info('✅ All geocodeable centers already have coordinates.');
            return 0;
        }

        $bar = $this->output->createProgressBar($total);
        $bar->start();

        foreach ($pairs as $pair) {
            $cacheKey = strtolower(trim($pair->locality)) . '|' . strtolower(trim($pair->province));

            if ($cache->has($cacheKey)) {
                // Already cached from a previous batch — apply
                $coords = $cache->get($cacheKey);
                $this->updateByLocality($pair->locality, $pair->province, $coords);
                $geocoded++;
                $bar->advance();
                continue;
            }

            $coords = $this->nominatimLookup($pair->locality, $pair->province);

            if ($coords) {
                $cache->put($cacheKey, $coords);
                $this->updateByLocality($pair->locality, $pair->province, $coords);
                $geocoded++;
            } else {
                $failed++;
            }

            $bar->advance();

            // Save cache every 50 localities
            if (($geocoded + $failed) % 50 === 0) {
                $this->saveCache($cache);
            }

            usleep(self::DELAY_MS * 1000);
        }

        $bar->finish();
        $this->newLine();
        $this->saveCache($cache);

        // ---------------------------------------------------------------
        // Phase 3: Apply newly cached coords to all remaining ungeocoded
        // ---------------------------------------------------------------
        $extra = $this->applyCacheToUngeocoded($cache);
        $this->info("Phase 3: Applied newly cached coords to {$extra} more centers.");

        $remaining = DB::table('catalog_centers')->whereNull('lat')->count();
        $this->info("\n✅ Done! Geocoded localities: {$geocoded} | Failed: {$failed}");
        $this->info("   Centers still without coordinates: {$remaining}");

        return 0;
    }

    // -----------------------------------------------------------------------
    // Helpers
    // -----------------------------------------------------------------------

    private function applyCacheToUngeocoded(\Illuminate\Support\Collection $cache): int
    {
        if ($cache->isEmpty()) {
            return 0;
        }

        $updated = 0;

        // Chunk through ungeocoded centers and apply cache
        DB::table('catalog_centers')
            ->whereNull('lat')
            ->whereNotNull('locality')
            ->whereNotNull('province')
            ->select('id', 'locality', 'province')
            ->orderBy('id')
            ->chunk(1000, function ($rows) use ($cache, &$updated) {
                foreach ($rows as $row) {
                    $key = strtolower(trim($row->locality)) . '|' . strtolower(trim($row->province));
                    if ($cache->has($key)) {
                        $coords = $cache->get($key);
                        DB::table('catalog_centers')
                            ->where('id', $row->id)
                            ->update([
                                'lat'        => $coords['lat'],
                                'lng'        => $coords['lng'],
                                'updated_at' => now(),
                            ]);
                        $updated++;
                    }
                }
            });

        return $updated;
    }

    private function updateByLocality(string $locality, string $province, array $coords): void
    {
        DB::table('catalog_centers')
            ->whereRaw('LOWER(TRIM(locality)) = ?', [strtolower(trim($locality))])
            ->whereRaw('LOWER(TRIM(province)) = ?', [strtolower(trim($province))])
            ->whereNull('lat')
            ->update([
                'lat'        => $coords['lat'],
                'lng'        => $coords['lng'],
                'updated_at' => now(),
            ]);
    }

    private function nominatimLookup(string $city, string $state): ?array
    {
        try {
            $response = Http::timeout(10)
                ->withHeaders([
                    'User-Agent'      => 'VocaccionApp/1.0 (contact@vocaccion.es)',
                    'Accept-Language' => 'es',
                ])
                ->get('https://nominatim.openstreetmap.org/search', [
                    'city'    => $city,
                    'state'   => $state,
                    'country' => 'España',
                    'format'  => 'json',
                    'limit'   => 1,
                ]);

            $data = $response->json();

            if (!empty($data) && isset($data[0]['lat'], $data[0]['lon'])) {
                return [
                    'lat' => (float) $data[0]['lat'],
                    'lng' => (float) $data[0]['lon'],
                ];
            }
        } catch (\Exception $e) {
            $this->warn("\n  Nominatim error for {$city}: " . $e->getMessage());
        }

        return null;
    }

    private function loadCache(): \Illuminate\Support\Collection
    {
        try {
            if (Storage::disk('local')->exists(self::CACHE_FILE)) {
                $data = json_decode(Storage::disk('local')->get(self::CACHE_FILE), true);
                return collect($data ?? []);
            }
        } catch (\Exception) {}

        return collect();
    }

    private function saveCache(\Illuminate\Support\Collection $cache): void
    {
        Storage::disk('local')->put(self::CACHE_FILE, json_encode($cache->all(), JSON_PRETTY_PRINT));
    }
}
