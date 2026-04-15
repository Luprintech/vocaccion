<?php

namespace App\Console\Commands;

use App\Models\OfficialCenter;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;

class GeocodeCenters extends Command
{
    protected $signature = 'vocacional:geocode-centers';
    protected $description = 'Geocode official centers using Nominatim based on their municipality and province';

    public function handle()
    {
        $this->info('Starting geocoding process for centers...');
        
        $locations = OfficialCenter::select('municipality', 'province')
            ->whereNotNull('municipality')
            ->distinct()
            ->get();
            
        $this->info("Found {$locations->count()} unique municipalities to geocode.");
        
        $cache = [];
        $updateCount = 0;
        
        $bar = $this->output->createProgressBar($locations->count());
        
        foreach ($locations as $loc) {
            $muni = $loc->municipality;
            $prov = $loc->province;
            
            $cacheKey = $muni . '|' . $prov;
            
            if (isset($cache[$cacheKey])) {
                $bar->advance();
                continue;
            }
            
            $query = "{$muni}, {$prov}, España";
            
            try {
                $response = Http::withHeaders([
                    'User-Agent' => 'VocaccionApp/1.0 (contact@vocaccion.es)'
                ])->get("https://nominatim.openstreetmap.org/search", [
                    'q' => $query,
                    'format' => 'json',
                    'limit' => 1
                ]);
                
                $data = $response->json();
                
                if (!empty($data) && isset($data[0])) {
                    $cache[$cacheKey] = [
                        'lat' => (float) $data[0]['lat'],
                        'lng' => (float) $data[0]['lon']
                    ];
                } else {
                    // Fallback to province
                    sleep(1);
                    $response = Http::withHeaders([
                        'User-Agent' => 'VocaccionApp/1.0 (contact@vocaccion.es)'
                    ])->get("https://nominatim.openstreetmap.org/search", [
                        'q' => "{$prov}, España",
                        'format' => 'json',
                        'limit' => 1
                    ]);
                    
                    $data = $response->json();
                    if (!empty($data) && isset($data[0])) {
                        $cache[$cacheKey] = [
                            'lat' => (float) $data[0]['lat'],
                            'lng' => (float) $data[0]['lon']
                        ];
                    }
                }
                
                // Nominatim limit 1 req/sec
                sleep(1);
                
            } catch (\Exception $e) {
                $this->error("\nError geocoding {$query}: " . $e->getMessage());
                sleep(2);
            }
            
            $bar->advance();
        }
        
        $bar->finish();
        $this->newLine(2);
        
        $this->info("Updating database...");
        
        foreach ($cache as $key => $coords) {
            [$muni, $prov] = explode('|', $key);
            
            $centers = OfficialCenter::where('municipality', $muni)
                ->where('province', $prov)
                ->get();
                
            foreach ($centers as $center) {
                // Add a tiny random offset (approx 0 to ~100m) so points don't perfectly overlap
                // Reduced from 1km to 100m for better accuracy while avoiding exact overlaps
                $latOffset = $coords['lat'] + (rand(-10, 10) / 10000);
                $lngOffset = $coords['lng'] + (rand(-10, 10) / 10000);
                
                $center->update([
                    'lat' => $latOffset,
                    'lng' => $lngOffset
                ]);
                
                $updateCount++;
            }
        }
        
        $this->info("Geocoding complete! Updated {$updateCount} centers.");
        
        return Command::SUCCESS;
    }
}