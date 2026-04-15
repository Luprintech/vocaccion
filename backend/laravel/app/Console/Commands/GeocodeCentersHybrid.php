<?php

namespace App\Console\Commands;

use App\Models\OfficialCenter;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;

class GeocodeCentersHybrid extends Command
{
    protected $signature = 'vocacional:geocode-hybrid';
    protected $description = 'Hybrid geocoding: exact address first, fallback to municipality';

    private $cache = [];
    private $successCount = 0;
    private $fallbackCount = 0;

    public function handle()
    {
        $this->info('Starting hybrid geocoding process...');
        
        $centers = OfficialCenter::whereNotNull('municipality')->get();
        $this->info("Found {$centers->count()} centers to geocode.\n");
        
        $bar = $this->output->createProgressBar($centers->count());
        
        foreach ($centers as $center) {
            $coords = $this->geocodeCenter($center);
            
            if ($coords) {
                $center->update([
                    'lat' => $coords['lat'],
                    'lng' => $coords['lng']
                ]);
            }
            
            $bar->advance();
            
            // Nominatim rate limit: 1 request/second
            sleep(1);
        }
        
        $bar->finish();
        $this->newLine(2);
        
        $this->info("Geocoding complete!");
        $this->line("  ✅ Exact matches: {$this->successCount}");
        $this->line("  🔄 Municipality fallbacks: {$this->fallbackCount}");
        $this->line("  📊 Total: " . ($this->successCount + $this->fallbackCount));
        
        return Command::SUCCESS;
    }

    private function geocodeCenter($center)
    {
        $muni = $center->municipality;
        $prov = $center->province;
        
        // Strategy 1: Try exact address (if available and not just "?")
        if ($center->address && $center->address !== '?') {
            $coords = $this->tryExactAddress($center->address, $muni, $prov);
            if ($coords) {
                $this->successCount++;
                return $coords;
            }
        }
        
        // Strategy 2: Fallback to municipality with small random offset
        $cacheKey = "{$muni}|{$prov}";
        
        if (!isset($this->cache[$cacheKey])) {
            $coords = $this->geocodeMunicipality($muni, $prov);
            if ($coords) {
                $this->cache[$cacheKey] = $coords;
            }
        }
        
        if (isset($this->cache[$cacheKey])) {
            $this->fallbackCount++;
            
            // Add small random offset (~100m) to avoid exact overlaps
            return [
                'lat' => $this->cache[$cacheKey]['lat'] + (rand(-10, 10) / 10000),
                'lng' => $this->cache[$cacheKey]['lng'] + (rand(-10, 10) / 10000)
            ];
        }
        
        return null;
    }

    private function tryExactAddress($address, $municipality, $province)
    {
        // Clean address
        $addr = trim(preg_replace('/\([^)]*\)/', '', $address));
        $addr = preg_replace('/^(c\/|cl\.|calle\s)/i', '', $addr);
        
        // Try with full address
        $query = "{$addr}, {$municipality}, {$province}, España";
        $coords = $this->queryNominatim($query);
        
        if ($coords) {
            return $coords;
        }
        
        // Try without street number
        $addrNoNum = preg_replace('/[0-9]+.*$/', '', $addr);
        if ($addrNoNum !== $addr && strlen($addrNoNum) > 3) {
            sleep(1); // Rate limit
            $query = "{$addrNoNum}, {$municipality}, {$province}, España";
            $coords = $this->queryNominatim($query);
            
            if ($coords) {
                return $coords;
            }
        }
        
        return null;
    }

    private function geocodeMunicipality($municipality, $province)
    {
        $query = "{$municipality}, {$province}, España";
        return $this->queryNominatim($query);
    }

    private function queryNominatim($query)
    {
        try {
            $response = Http::withHeaders([
                'User-Agent' => 'VocaccionApp/1.0 (contact@vocaccion.es)'
            ])->timeout(10)->get("https://nominatim.openstreetmap.org/search", [
                'q' => $query,
                'format' => 'json',
                'limit' => 1,
                'countrycodes' => 'es'
            ]);
            
            $data = $response->json();
            
            if (!empty($data) && isset($data[0])) {
                return [
                    'lat' => (float) $data[0]['lat'],
                    'lng' => (float) $data[0]['lon']
                ];
            }
        } catch (\Exception $e) {
            // Silently continue on error
        }
        
        return null;
    }
}
