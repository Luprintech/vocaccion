<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class GeocodeController extends Controller
{
    /**
     * Geocode an address using Nominatim (OpenStreetMap)
     * GET /api/geocode?q=address
     */
    public function geocode(Request $request)
    {
        $query = $request->input('q');
        
        if (!$query) {
            return response()->json(['success' => false, 'error' => 'Query required']);
        }
        
        try {
            $response = Http::withHeaders([
                'User-Agent' => 'VocaccionApp/1.0 (contact@vocaccion.es)'
            ])->get("https://nominatim.openstreetmap.org/search", [
                'q' => $query,
                'format' => 'json',
                'limit' => 1,
                'addressdetails' => 1
            ]);
            
            $data = $response->json();
            
            if (!empty($data) && isset($data[0])) {
                return response()->json([
                    'success' => true,
                    'lat' => (float) $data[0]['lat'],
                    'lng' => (float) $data[0]['lon'],
                    'display_name' => $data[0]['display_name'] ?? null,
                    'address' => $data[0]['address'] ?? null
                ]);
            }
            
            return response()->json(['success' => false, 'error' => 'Address not found']);
            
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'error' => $e->getMessage()]);
        }
    }
}