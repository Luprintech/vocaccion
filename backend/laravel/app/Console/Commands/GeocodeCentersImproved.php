<?php

namespace App\Console\Commands;

use App\Models\OfficialCenter;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;

class GeocodeCentersImproved extends Command
{
    protected $signature = 'vocacional:geocode-improved {--province= : Province to filter} {--limit= : Limit} {--force : Force re-geocode}';
    protected $description = 'Improved geocoding with multiple fallback strategies';

    public function handle()
    {
        $this->info('Starting improved geocoding process...');
        
        $query = OfficialCenter::whereNotNull('address')
            ->whereNotNull('municipality');
            
        if ($this->option('province')) {
            $query->where('province', 'like', '%' . $this->option('province') . '%');
        }
        
        if (!$this->option('force')) {
            // Only geocode centers without coordinates or with suspicious coords
            $query->where(function($q) {
                $q->whereNull('lat')
                  ->orWhereNull('lng');
            });
        }
        
        if ($this->option('limit')) {
            $query->limit((int)$this->option('limit'));
        }
            
        $centers = $query->get();
            
        $this->info("Found {$centers->count()} centers to geocode.");
        
        $bar = $this->output->createProgressBar($centers->count());
        $updateCount = 0;
        $failedCenters = [];
        
        foreach ($centers as $center) {
            $result = $this->geocodeWithFallback($center);
            
            if ($result) {
                $center->update([
                    'lat' => $result['lat'],
                    'lng' => $result['lng']
                ]);
                $updateCount++;
            } else {
                $failedCenters[] = [
                    'id' => $center->id,
                    'name' => $center->name,
                    'address' => $center->address
                ];
            }
            
            $bar->advance();
            sleep(1); // Respect Nominatim rate limit
        }
        
        $bar->finish();
        $this->newLine(2);
        
        $this->info("Geocoding complete! Successfully geocoded {$updateCount} out of {$centers->count()} centers.");
        
        if (count($failedCenters) > 0) {
            $this->newLine();
            $this->warn("Failed to geocode " . count($failedCenters) . " centers:");
            foreach ($failedCenters as $failed) {
                $this->line("  - ID {$failed['id']}: {$failed['name']}");
            }
        }
        
        return Command::SUCCESS;
    }

    /**
     * Try multiple geocoding strategies with fallback
     */
    private function geocodeWithFallback($center)
    {
        $strategies = [
            // Strategy 1: Campus name + university + city
            function($c) {
                if (stripos($c->address, 'Campus') !== false) {
                    preg_match('/Campus\s+[^.]+/', $c->address, $matches);
                    if (!empty($matches)) {
                        return $this->geocodeQuery("{$matches[0]}, {$c->municipality}, {$c->province}, España");
                    }
                }
                return null;
            },
            
            // Strategy 2: Main road (Carretera, Calle) without building details
            function($c) {
                $addr = $c->address;
                // Extract main road reference
                if (preg_match('/(Carretera|Ctra\.?|Avda?\.?|Calle|C\/)\s+[^,\.]+/', $addr, $matches)) {
                    $road = trim($matches[0]);
                    // Remove building/floor details
                    $road = preg_replace('/\s+(Edificio|Planta|km).*$/i', '', $road);
                    return $this->geocodeQuery("{$road}, {$c->municipality}, {$c->province}, España");
                }
                return null;
            },
            
            // Strategy 3: Full address cleaned
            function($c) {
                $addr = $c->address;
                // Remove parentheses
                $addr = preg_replace('/\([^)]*\)/', '', $addr);
                // Remove building details
                $addr = preg_replace('/\.\s*(Edificio|Planta|Despacho).*$/i', '', $addr);
                // Remove extra dots and commas
                $addr = trim(preg_replace('/[.,]+$/', '', $addr));
                
                return $this->geocodeQuery("{$addr}, {$c->municipality}, {$c->province}, España");
            },
            
            // Strategy 4: Just municipality + institution name (for well-known places)
            function($c) {
                // Clean institution name (remove "Facultad de", "Escuela de", etc)
                $name = preg_replace('/^(Facultad|Escuela|Instituto|Centro)\s+(de\s+|del\s+)?/i', '', $c->name);
                return $this->geocodeQuery("{$name}, {$c->municipality}, {$c->province}, España");
            },
            
            // Strategy 5: Just municipality + province (fallback to city center)
            function($c) {
                return $this->geocodeQuery("{$c->municipality}, {$c->province}, España");
            }
        ];

        foreach ($strategies as $index => $strategy) {
            $result = $strategy($center);
            if ($result && $this->validateCoordinates($result, $center)) {
                $this->newLine();
                $this->info("  ✓ Strategy " . ($index + 1) . " succeeded for: {$center->name}");
                return $result;
            }
            sleep(1); // Rate limiting between attempts
        }

        return null;
    }

    /**
     * Make geocoding request to Nominatim
     */
    private function geocodeQuery($query)
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
                    'lng' => (float) $data[0]['lon'],
                    'display_name' => $data[0]['display_name'] ?? null
                ];
            }
        } catch (\Exception $e) {
            // Silent fail, will try next strategy
        }
        
        return null;
    }

    /**
     * Validate that coordinates are reasonable for Spain
     */
    private function validateCoordinates($result, $center)
    {
        $lat = $result['lat'];
        $lng = $result['lng'];
        
        // Basic Spain bounds check
        if ($lat < 27 || $lat > 44 || $lng < -19 || $lng > 5) {
            return false;
        }
        
        // Canary Islands
        if ($center->province === 'Las Palmas' || $center->province === 'Santa Cruz de Tenerife') {
            return ($lat >= 27 && $lat <= 29.5 && $lng >= -18.5 && $lng <= -13);
        }
        
        // Ceuta
        if ($center->province === 'Ceuta') {
            return ($lat >= 35.8 && $lat <= 35.95 && $lng >= -5.4 && $lng <= -5.25);
        }
        
        // Melilla
        if ($center->province === 'Melilla') {
            return ($lat >= 35.25 && $lat <= 35.35 && $lng >= -3.0 && $lng <= -2.9);
        }
        
        // Mainland Spain
        return ($lat >= 36 && $lat <= 44 && $lng >= -10 && $lng <= 5);
    }
}
