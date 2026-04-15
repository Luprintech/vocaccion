<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class GeocodeRabanales extends Command
{
    protected $signature = 'geocode:rabanales';
    protected $description = 'Fix Rabanales campus coords (they were geocoded to Córdoba center)';

    public function handle()
    {
        $this->info("🎯 Arreglando coordenadas del Campus Rabanales");
        $this->newLine();

        // Campus Universitario de Rabanales coords (verified with Google Maps)
        // https://www.google.com/maps/place/Campus+Universitario+de+Rabanales/@37.9165,-4.7212
        $rabanalerLat = 37.916500;
        $rabanalerLng = -4.721200;

        $affected = DB::table('official_centers')
            ->where('locality', 'Córdoba')
            ->where(function($query) {
                $query->where('address', 'LIKE', '%Rabanales%')
                      ->orWhere('address', 'LIKE', '%Madrid%Km%396%')
                      ->orWhere('address', 'LIKE', '%Nacional IV%396%');
            })
            ->update([
                'lat' => $rabanalerLat,
                'lng' => $rabanalerLng,
                'updated_at' => now()
            ]);

        $this->info("✓ Actualizados {$affected} centros del Campus Rabanales");
        $this->line("  Nueva ubicación: {$rabanalerLat}, {$rabanalerLng}");
        $this->line("  Verifica: https://www.google.com/maps?q={$rabanalerLat},{$rabanalerLng}");
        
        $this->newLine();
        $this->info("Centros actualizados:");
        
        $centers = DB::table('official_centers')
            ->where('lat', $rabanalerLat)
            ->where('lng', $rabanalerLng)
            ->get(['name', 'address']);
        
        foreach ($centers as $center) {
            $this->line("  • {$center->name}");
            $this->line("    {$center->address}");
        }

        return Command::SUCCESS;
    }
}
