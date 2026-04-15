<?php

namespace App\Console\Commands;

use App\Models\OfficialCenter;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;

class GeocodeCentersExact extends Command
{
    protected $signature = 'vocacional:geocode-exact {--province= : Province to filter} {--limit= : Limit the number of centers}';
    protected $description = 'Geocode official centers exactly using their street address';

    public function handle()
    {
        $this->info('Starting exact geocoding process for centers...');
        
        $query = OfficialCenter::whereNotNull('address')
            ->whereNotNull('municipality');
            
        if ($this->option('province')) {
            $query->where('province', 'like', '%' . $this->option('province') . '%');
        }
        
        if ($this->option('limit')) {
            $query->limit((int)$this->option('limit'));
        }
            
        $centers = $query->get();
            
        $this->info("Found {$centers->count()} centers to geocode exactly.");
        
        $bar = $this->output->createProgressBar($centers->count());
        $updateCount = 0;
        
        foreach ($centers as $center) {
            // Clean address (remove parentheticals, common in RUCT like "(Campus Universitario)")
            $addr = trim(preg_replace('/\([^)]*\)/', '', $center->address));
            
            // Clean c/ or cl. prefixes to help Nominatim
            $addr = preg_replace('/^(c\/|cl\.|calle\s)/i', '', $addr);
            
            $muni = $center->municipality;
            $prov = $center->province;
            
            $searchQuery = "{$addr}, {$muni}, {$prov}, España";
            
            try {
                $response = Http::withHeaders([
                    'User-Agent' => 'VocaccionApp/1.0 (contact@vocaccion.es)'
                ])->get("https://nominatim.openstreetmap.org/search", [
                    'q' => $searchQuery,
                    'format' => 'json',
                    'limit' => 1
                ]);
                
                $data = $response->json();
                
                if (!empty($data) && isset($data[0])) {
                    $center->update([
                        'lat' => (float) $data[0]['lat'],
                        'lng' => (float) $data[0]['lon']
                    ]);
                    $updateCount++;
                } else {
                    // Try without street number if it has one (often confusing for Nominatim)
                    $addrNoNum = preg_replace('/[0-9]+.*$/', '', $addr);
                    if ($addrNoNum !== $addr) {
                        sleep(1);
                        $response = Http::withHeaders([
                            'User-Agent' => 'VocaccionApp/1.0 (contact@vocaccion.es)'
                        ])->get("https://nominatim.openstreetmap.org/search", [
                            'q' => "{$addrNoNum}, {$muni}, {$prov}, España",
                            'format' => 'json',
                            'limit' => 1
                        ]);
                        $data = $response->json();
                        if (!empty($data) && isset($data[0])) {
                            $center->update([
                                'lat' => (float) $data[0]['lat'],
                                'lng' => (float) $data[0]['lon']
                            ]);
                            $updateCount++;
                        }
                    }
                }
                
                sleep(1); // 1 req/sec Nominatim limit
                
            } catch (\Exception $e) {
                sleep(2);
            }
            
            $bar->advance();
        }
        
        $bar->finish();
        $this->newLine(2);
        
        $this->info("Exact geocoding complete! Found exact coordinates for {$updateCount} out of {$centers->count()} centers.");
        
        return Command::SUCCESS;
    }
}