<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;

class FixGeocoding extends Command
{
    protected $signature = 'geocode:fix {--limit=50 : Number of centers to geocode} {--dry-run : Show what would be done}';
    protected $description = 'Re-geocode centers using EXACT address (fixes inaccurate municipality-based coords)';

    public function handle()
    {
        $limit = (int) $this->option('limit');
        $dryRun = $this->option('dry-run');
        
        $this->info("🔧 RE-GEOCODIFICACIÓN PRECISA DE CENTROS");
        $this->info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        $this->newLine();
        
        if ($dryRun) {
            $this->warn("⚠️  MODO DRY-RUN - No se guardarán cambios");
            $this->newLine();
        }

        // Get centers with coordinates (we'll re-geocode them with exact address)
        $centers = DB::table('official_centers')
            ->whereNotNull('lat')
            ->whereNotNull('address')
            ->limit($limit)
            ->get();

        if ($centers->isEmpty()) {
            $this->error("No se encontraron centros para geocodificar");
            return Command::FAILURE;
        }

        $this->info("Centros a procesar: {$centers->count()}");
        $this->newLine();

        $bar = $this->output->createProgressBar($centers->count());
        $bar->setFormat(' %current%/%max% [%bar%] %percent:3s%% %message%');
        
        $stats = [
            'success' => 0,
            'improved' => 0,
            'failed' => 0,
            'skipped' => 0
        ];

        foreach ($centers as $center) {
            $bar->setMessage("Procesando {$center->name}...");
            
            // Build full search query
            $query = trim("{$center->address}, {$center->locality}, {$center->province}, España");
            
            // Call Nominatim
            try {
                $response = Http::timeout(10)
                    ->withHeaders(['User-Agent' => 'VocAccion/1.0 (educational project)'])
                    ->get('https://nominatim.openstreetmap.org/search', [
                        'q' => $query,
                        'format' => 'json',
                        'limit' => 1,
                        'addressdetails' => 1
                    ]);

                if ($response->successful() && !empty($response->json())) {
                    $result = $response->json()[0];
                    $newLat = (float) $result['lat'];
                    $newLng = (float) $result['lon'];
                    
                    // Calculate distance from old coords
                    $oldLat = (float) $center->lat;
                    $oldLng = (float) $center->lng;
                    $distance = $this->calculateDistance($oldLat, $oldLng, $newLat, $newLng);
                    
                    // Only update if coordinates changed significantly (>100m)
                    if ($distance > 0.1) {
                        if (!$dryRun) {
                            DB::table('official_centers')
                                ->where('id', $center->id)
                                ->update([
                                    'lat' => $newLat,
                                    'lng' => $newLng,
                                    'updated_at' => now()
                                ]);
                        }
                        
                        $stats['improved']++;
                        $bar->setMessage("✓ {$center->name} - Mejorado ({$distance} km)");
                    } else {
                        $stats['skipped']++;
                        $bar->setMessage("⊘ {$center->name} - Sin cambios");
                    }
                    
                    $stats['success']++;
                } else {
                    $stats['failed']++;
                    $bar->setMessage("✗ {$center->name} - No encontrado");
                }
            } catch (\Exception $e) {
                $stats['failed']++;
                $bar->setMessage("✗ {$center->name} - Error: {$e->getMessage()}");
            }
            
            $bar->advance();
            usleep(1100000); // 1.1 second delay (Nominatim rate limit: 1 req/sec)
        }

        $bar->finish();
        $this->newLine(2);

        // Summary
        $this->info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        $this->info("📊 RESUMEN");
        $this->info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        $this->line("Total procesados:  {$centers->count()}");
        $this->line("✓ Exitosos:        {$stats['success']}");
        $this->line("↑ Mejorados:       {$stats['improved']}");
        $this->line("⊘ Sin cambios:     {$stats['skipped']}");
        $this->line("✗ Fallidos:        {$stats['failed']}");
        
        if ($dryRun) {
            $this->newLine();
            $this->warn("⚠️  No se guardaron cambios (DRY-RUN)");
            $this->info("Ejecuta sin --dry-run para aplicar cambios:");
            $this->line("  php artisan geocode:fix --limit=50");
        } else {
            $this->newLine();
            $this->info("💾 Exportando backup de coordenadas...");
            $this->call('data:export-centers');
        }

        return Command::SUCCESS;
    }

    /**
     * Calculate distance between two points using Haversine formula
     * Returns distance in kilometers
     */
    private function calculateDistance($lat1, $lon1, $lat2, $lon2): float
    {
        $earthRadius = 6371; // km

        $dLat = deg2rad($lat2 - $lat1);
        $dLon = deg2rad($lon2 - $lon1);

        $a = sin($dLat/2) * sin($dLat/2) +
             cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
             sin($dLon/2) * sin($dLon/2);

        $c = 2 * atan2(sqrt($a), sqrt(1-$a));
        $distance = $earthRadius * $c;

        return round($distance, 2);
    }
}
