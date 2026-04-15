<?php

namespace App\Services;

use App\Models\OfficialCenter;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class CenterGeocodingService
{
    public function geocode(OfficialCenter $center): ?array
    {
        $center->loadMissing('university');
        $queries = $this->buildQueries($center);

        foreach ($queries as $query) {
            $result = $this->queryNominatim($query);

            if (!$result) {
                usleep(1100000);
                continue;
            }

            $precision = $this->detectPrecision($center, $query, $result['display_name'] ?? '');

            if (!in_array($precision, ['exact', 'street'], true)) {
                continue;
            }

            if (!$this->matchesTerritory($center, $result['display_name'] ?? '')) {
                continue;
            }

            return [
                'lat' => (float) $result['lat'],
                'lng' => (float) $result['lon'],
                'precision' => $precision,
                'provider' => 'nominatim',
                'query' => $query,
                'display_name' => $result['display_name'] ?? null,
            ];
        }

        return null;
    }

    protected function buildQueries(OfficialCenter $center): array
    {
        $address = $this->normalizeAddress($center->address ?? '');
        $municipality = trim((string) ($center->municipality ?: $center->locality ?: ''));
        $province = trim((string) ($center->province ?? ''));
        $name = trim((string) $center->name);
        $university = trim((string) ($center->university?->name ?? ''));
        $postalCode = trim((string) ($center->postal_code ?? ''));

        $queries = [];

        $hasCampus = $address !== '' && stripos($address, 'campus') !== false;
        $hasStreetLikeAddress = $address !== '' && preg_match('/\b(calle|avenida|avda|carretera|ctra|plaza|paseo|ronda|camino|autopista|via|vía)\b/iu', $address);

        if ($hasCampus) {
            if ($name !== '') {
                $queries[] = "{$name}, {$municipality}, {$province}, España";
            }
            if ($name !== '' && $university !== '') {
                $queries[] = "{$name}, {$university}, {$municipality}, {$province}, España";
            }

            $campusOnly = $this->extractCampusReference($address);
            if ($campusOnly) {
                $queries[] = "{$campusOnly}, {$municipality}, {$province}, España";
                if ($university !== '') {
                    $queries[] = "{$campusOnly}, {$university}, {$municipality}, {$province}, España";
                }
            }
        } elseif ($hasStreetLikeAddress) {
            $queries[] = "{$address}, {$municipality}, {$province}, España";
            if ($postalCode !== '') {
                $queries[] = "{$address}, {$postalCode}, {$municipality}, {$province}, España";
            }

            if ($name !== '') {
                $queries[] = "{$name}, {$municipality}, {$province}, España";
            }
        } else {
            if ($name !== '') {
                $queries[] = "{$name}, {$municipality}, {$province}, España";
            }
            if ($address !== '') {
                $queries[] = "{$address}, {$municipality}, {$province}, España";
            }
        }

        if ($university !== '') {
            $queries[] = "{$university}, {$municipality}, {$province}, España";
        }

        return array_slice(array_values(array_unique(array_filter(array_map('trim', $queries)))), 0, 3);
    }

    protected function normalizeAddress(string $address): string
    {
        $normalized = preg_replace('/(?<=[a-záéíóúñüç])(?=[A-ZÁÉÍÓÚÑÜÇ])/u', ' ', trim($address));
        $normalized = preg_replace('/^c\//iu', 'Calle ', $normalized);
        $normalized = preg_replace('/^cl\.?\s+/iu', 'Calle ', $normalized);
        $normalized = preg_replace('/^avda?\.?\s+/iu', 'Avenida ', $normalized);
        $normalized = preg_replace('/^ctra?\.?\s+/iu', 'Carretera ', $normalized);
        $normalized = str_replace([' s/n', ' S/N'], ' sin número', $normalized);
        $normalized = preg_replace('/\s*\/\s*/u', ' / ', $normalized);
        $normalized = preg_replace('/\s+/', ' ', $normalized);
        $normalized = preg_replace('/\((.*?)\)/', '$1', $normalized);
        return trim((string) $normalized, " ,.");
    }

    protected function extractCampusReference(string $address): ?string
    {
        if (preg_match('/(Campus[^,.]+)/iu', $address, $matches)) {
            return trim($matches[1]);
        }

        return null;
    }

    protected function queryNominatim(string $query): ?array
    {
        try {
            $response = Http::withHeaders([
                'User-Agent' => 'VocaccionApp/1.0 (contact@vocaccion.es)',
            ])->timeout(12)->get('https://nominatim.openstreetmap.org/search', [
                'q' => $query,
                'format' => 'jsonv2',
                'limit' => 1,
                'countrycodes' => 'es',
                'addressdetails' => 1,
            ]);

            $payload = $response->json();

            return !empty($payload[0]) ? $payload[0] : null;
        } catch (\Throwable) {
            return null;
        }
    }

    protected function detectPrecision(OfficialCenter $center, string $query, string $displayName): string
    {
        $haystack = Str::lower(Str::ascii($displayName . ' ' . $query));
        $address = Str::lower(Str::ascii($this->normalizeAddress($center->address ?? '')));

        if ($address !== '') {
            $tokens = collect(preg_split('/[^\pL\pN]+/u', $address))
                ->filter(fn ($token) => mb_strlen($token) >= 3)
                ->reject(fn ($token) => in_array($token, ['campus', 'universitario', 'carretera', 'avenida', 'calle']))
                ->values();

            $matches = $tokens->filter(fn ($token) => Str::contains($haystack, Str::lower($token)))->count();

            if ($matches >= 2 || ($tokens->count() > 0 && $matches === $tokens->count())) {
                return 'exact';
            }

            if (Str::contains($haystack, 'campus') || Str::contains($haystack, 'carretera') || Str::contains($haystack, 'calle')) {
                return 'street';
            }
        }

        return 'municipality';
    }

    protected function matchesTerritory(OfficialCenter $center, string $displayName): bool
    {
        $display = Str::lower(Str::ascii($displayName));
        $municipality = Str::lower(Str::ascii((string) ($center->municipality ?: $center->locality ?: '')));
        $province = Str::lower(Str::ascii((string) ($center->province ?? '')));

        $municipalityAlternatives = collect(preg_split('/[\/,-]+/', $municipality))
            ->map(fn ($value) => trim((string) $value))
            ->filter()
            ->values();

        $provinceAlternatives = collect(preg_split('/[\/,-]+/', $province))
            ->map(fn ($value) => trim((string) $value))
            ->filter()
            ->values();

        $municipalityOk = $municipality === '' || $municipalityAlternatives->contains(fn ($value) => Str::contains($display, $value));
        $provinceOk = $province === '' || $provinceAlternatives->contains(fn ($value) => Str::contains($display, $value));

        return $municipalityOk && $provinceOk;
    }
}
