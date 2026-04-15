<?php

namespace App\Http\Controllers;

use App\Models\CatalogCenter;
use App\Models\OfficialCenter;
use Illuminate\Http\Request;

class MapController extends Controller
{
    /**
     * GET /api/centers/map
     *
     * Parámetros:
     *   type=universities|non_universities|fp  (default: universities)
     *   search, province, limit
     */
    public function getCenters(Request $request)
    {
        $type     = trim((string) $request->string('type', 'universities'));
        $search   = trim((string) $request->string('search', ''));
        $province = trim((string) $request->string('province', ''));
        $limit    = min((int) $request->integer('limit', 200), 500);

        return match ($type) {
            'non_universities' => $this->getCatalogCenters('non_universities', $search, $province, $limit),
            'fp'               => $this->getCatalogCenters('fp', $search, $province, $limit),
            default            => $this->getUniversityCenters($search, $province, $limit),
        };
    }

    // -----------------------------------------------------------------------

    private function getUniversityCenters(string $search, string $province, int $limit)
    {
        $centers = OfficialCenter::with(['university:id,website,email,phone_1', 'degrees:id,name'])
            ->select(
                'id', 'name', 'center_type', 'legal_nature as ownership_type', 'address',
                'locality', 'municipality', 'province', 'autonomous_community_name',
                'lat', 'lng', 'official_university_id', 'geocode_precision'
            )
            ->whereNotNull('lat')
            ->whereNotNull('lng')
            ->whereIn('geocode_precision', ['exact', 'street'])
            ->when($province !== '', fn ($q) => $q->where('province', $province))
            ->when($search !== '', function ($q) use ($search) {
                $q->where(function ($inner) use ($search) {
                    $inner->where('name', 'like', "%{$search}%")
                        ->orWhere('address', 'like', "%{$search}%")
                        ->orWhere('locality', 'like', "%{$search}%")
                        ->orWhere('municipality', 'like', "%{$search}%")
                        ->orWhere('province', 'like', "%{$search}%");
                });
            })
            ->orderBy('name')
            ->limit($limit)
            ->get()
            ->map(function ($center) {
                $data                   = $center->toArray();
                $data['source']         = 'university';
                $data['website']        = $center->university->website ?? null;
                $data['email']          = $center->university->email ?? null;
                $data['phone']          = $center->university->phone_1 ?? null;
                $data['studies_count']  = $center->degrees->count();
                $data['studies_preview'] = $center->degrees->take(3)->pluck('name')->values();
                unset($data['university'], $data['degrees']);
                return $data;
            });

        return response()->json(['success' => true, 'centers' => $centers]);
    }

    // -----------------------------------------------------------------------

    private function getCatalogCenters(string $type, string $search, string $province, int $limit)
    {
        $query = CatalogCenter::query()
            ->select(
                'id', 'name', 'center_type', 'ownership_type', 'address',
                'locality', 'municipality', 'province', 'autonomous_community',
                'lat', 'lng', 'website', 'email', 'phone', 'raw_payload'
            )
            ->whereNotNull('lat')
            ->whereNotNull('lng')
            ->where('active', true);

        // FP filter: keep only centers likely to have FP / Bachillerato
        if ($type === 'fp') {
            $query->where(function ($q) {
                $q->where('center_type', 'like', '%Formaci%')      // Formación Profesional
                  ->orWhere('center_type', 'like', '%Integrado%')  // CIPFP
                  ->orWhere('center_type', 'like', '%Secundaria%') // IES
                  ->orWhere('center_type', 'like', '%Bachiller%')
                  ->orWhere('center_type', 'like', '%Docente Privado%'); // may have FP
            });
        }

        if ($province !== '') {
            $query->where('province', $province);
        }

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('locality', 'like', "%{$search}%")
                  ->orWhere('municipality', 'like', "%{$search}%")
                  ->orWhere('province', 'like', "%{$search}%");
            });
        }

        $centers = $query
            ->orderBy('name')
            ->limit($limit)
            ->get()
            ->map(function ($center) {
                $payload    = $center->raw_payload ?? [];
                $ensenanzas = $payload['ensenanzas'] ?? [];

                // Build a preview of study names
                $preview = array_slice(
                    array_filter(array_column($ensenanzas, 'ensenanza')),
                    0, 3
                );

                return [
                    'id'               => $center->id,
                    'name'             => $center->name,
                    'center_type'      => $center->center_type,
                    'ownership_type'   => $center->ownership_type,
                    'address'          => $center->address,
                    'locality'         => $center->locality,
                    'municipality'     => $center->municipality,
                    'province'         => $center->province,
                    'autonomous_community' => $center->autonomous_community,
                    'lat'              => $center->lat,
                    'lng'              => $center->lng,
                    'website'          => $center->website,
                    'email'            => $center->email,
                    'phone'            => $center->phone,
                    'source'           => 'catalog',
                    'studies_count'    => count($ensenanzas),
                    'studies_preview'  => array_values($preview),
                ];
            });

        return response()->json(['success' => true, 'centers' => $centers]);
    }

    // -----------------------------------------------------------------------

    /**
     * GET /api/centers/map/filters
     * Returns available provinces from both official and catalog centers.
     */
    public function filters()
    {
        $univProvinces = OfficialCenter::query()
            ->whereIn('geocode_precision', ['exact', 'street'])
            ->whereNotNull('province')
            ->distinct()
            ->pluck('province');

        $catalogProvinces = CatalogCenter::query()
            ->whereNotNull('lat')
            ->whereNotNull('province')
            ->where('active', true)
            ->distinct()
            ->pluck('province');

        $all = $univProvinces->merge($catalogProvinces)
            ->unique()
            ->filter()
            ->sort()
            ->values();

        return response()->json(['success' => true, 'provinces' => $all]);
    }

    // -----------------------------------------------------------------------

    /**
     * GET /api/catalog-centers/{id}/programs
     * Returns normalized programs for a catalog center.
     */
    public function catalogCenterPrograms(int $id)
    {
        $center = CatalogCenter::with('programs')->findOrFail($id);

        $grouped = [];
        foreach ($center->programs as $program) {
            $key = $program->education_level ?: 'General';

            $grouped[$key][] = [
                'ensenanza' => $program->name,
                'familia'   => $program->family_name,
                'modalidad' => $program->pivot->modality ?: $program->modality,
            ];
        }

        return response()->json([
            'success' => true,
            'center'  => [
                'id'           => $center->id,
                'name'         => $center->name,
                'center_type'  => $center->center_type,
                'ownership_type' => $center->ownership_type,
                'address'      => $center->address,
                'locality'     => $center->locality,
                'municipality' => $center->municipality,
                'province'     => $center->province,
                'autonomous_community' => $center->autonomous_community,
                'lat'          => $center->lat,
                'lng'          => $center->lng,
                'website'      => $center->website,
                'email'        => $center->email,
                'phone'        => $center->phone,
            ],
            'programs_total'  => $center->programs->count(),
            'programs_grouped' => $grouped,
        ]);
    }
}
