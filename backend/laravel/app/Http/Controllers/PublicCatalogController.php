<?php

namespace App\Http\Controllers;

use App\Models\CatalogCenter;
use App\Models\CatalogProgram;
use App\Models\OfficialCenter;
use App\Models\OfficialDegree;
use App\Models\ProfessionalCertificate;
use App\Models\QeduDegree;
use App\Models\TrainingCourse;
use App\Models\UniversityCutoffGrade;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

class PublicCatalogController extends Controller
{
    public function featuredCourses(Request $request)
    {
        $limit = min((int) $request->integer('limit', 6), 12);

        $courses = TrainingCourse::query()
            ->upcoming()
            ->select('id', 'title', 'provider', 'url', 'locality', 'province', 'start_date', 'hours', 'modality', 'description')
            ->limit($limit)
            ->get();

        return response()->json([
            'success' => true,
            'courses' => $courses,
        ]);
    }

    public function courses(Request $request)
    {
        $scope = trim((string) $request->string('scope', 'all'));
        $community = trim((string) $request->string('community', ''));

        $query = TrainingCourse::query()
            ->upcoming()
            ->select(
                'id',
                'title',
                'provider',
                'url',
                'locality',
                'province',
                'autonomous_community',
                'start_date',
                'hours',
                'modality',
                'description',
                'search_criteria',
                'source_system'
            );

        if ($scope === 'general') {
            $query->where(function ($subQuery) {
                $subQuery->whereNull('autonomous_community')
                    ->orWhere('source_system', 'SEPE');
            });
        }

        if ($scope === 'community') {
            $query->whereNotNull('autonomous_community');
        }

        if ($community !== '') {
            $query->where('autonomous_community', $community);
        }

        $courses = $query
            ->orderBy('start_date')
            ->orderBy('title')
            ->limit(60)
            ->get();

        $communities = TrainingCourse::query()
            ->upcoming()
            ->whereNotNull('autonomous_community')
            ->distinct()
            ->orderBy('autonomous_community')
            ->pluck('autonomous_community')
            ->values();

        return response()->json([
            'success' => true,
            'courses' => $courses,
            'filters' => [
                'communities' => $communities,
                'scopes' => [
                    ['value' => 'all', 'label' => 'Todos los cursos'],
                    ['value' => 'community', 'label' => 'Cursos por comunidad autónoma'],
                    ['value' => 'general', 'label' => 'Cursos generales de España'],
                ],
            ],
        ]);
    }

    public function studyFilters()
    {
        $universityLevels = collect(['Grado', 'Máster', 'Doctorado']);
        $catalogLevels = CatalogProgram::query()
            ->whereNotNull('education_level')
            ->distinct()
            ->orderBy('education_level')
            ->pluck('education_level')
            ->map(fn ($level) => $this->groupCatalogEducationLevel($level))
            ->filter()
            ->unique()
            ->values();

        $provinces = OfficialCenter::query()->whereNotNull('province')->distinct()->pluck('province')
            ->merge(CatalogCenter::query()->whereNotNull('province')->distinct()->pluck('province'))
            ->filter()
            ->unique()
            ->sort()
            ->values();

        $autonomousCommunities = CatalogCenter::query()
            ->whereNotNull('autonomous_community')
            ->distinct()
            ->orderBy('autonomous_community')
            ->pluck('autonomous_community')
            ->merge(
                OfficialCenter::query()
                    ->whereNotNull('autonomous_community_name')
                    ->distinct()
                    ->orderBy('autonomous_community_name')
                    ->pluck('autonomous_community_name')
            )
            ->filter()
            ->unique()
            ->sort()
            ->values();

        return response()->json([
            'success' => true,
            'filters' => [
                'provinces' => $provinces,
                'autonomous_communities' => $autonomousCommunities,
                'academic_levels' => $universityLevels->merge($catalogLevels)->unique()->values(),
                'universities' => OfficialDegree::current()->with('university:id,name')->get()->pluck('university.name')->filter()->unique()->sort()->values(),
                'bachillerato_vias' => [
                    'Artes Plásticas, Imagen y Diseño',
                    'Música y Artes Escénicas',
                    'Ciencias y Tecnología',
                    'Humanidades y Ciencias Sociales',
                    'General',
                    'Internacional',
                ],
                'bachillerato_modalities' => CatalogProgram::query()
                    ->where('education_level', 'Bachillerato')
                    ->whereNotNull('modality')
                    ->distinct()
                    ->orderBy('modality')
                    ->pluck('modality')
                    ->values(),
                'fp_families' => CatalogProgram::query()
                    ->whereIn('education_level', ['FP Grado Superior', 'FP Grado Medio', 'FP Grado Básico', 'FP Básica', 'Curso de Especialización', 'Especialización FP', 'Especialización'])
                    ->whereNotNull('family_name')
                    ->distinct()
                    ->orderBy('family_name')
                    ->pluck('family_name')
                    ->values(),
                'fp_titles' => CatalogProgram::query()
                    ->whereIn('education_level', ['FP Grado Superior', 'FP Grado Medio', 'FP Grado Básico', 'FP Básica', 'Curso de Especialización', 'Especialización FP', 'Especialización'])
                    ->whereNotNull('name')
                    ->distinct()
                    ->orderBy('name')
                    ->pluck('name')
                    ->values(),
                'certificate_families' => ProfessionalCertificate::query()
                    ->where('is_professional_certificate', true)
                    ->whereIn('level', [1, 2, 3])
                    ->whereNotNull('family_name')
                    ->distinct()
                    ->orderBy('family_name')
                    ->pluck('family_name')
                    ->values(),
                'modalities' => CatalogProgram::query()
                    ->whereNotNull('modality')
                    ->distinct()
                    ->orderBy('modality')
                    ->pluck('modality')
                    ->values(),
            ],
        ]);
    }

    public function localitySuggestions(Request $request)
    {
        $province = trim((string) $request->string('province', ''));
        $source   = trim((string) $request->string('source', 'all'));

        $catalogLocalities  = collect();
        $officialLocalities = collect();

        if (in_array($source, ['all', 'fp', 'bachillerato', 'educacion_secundaria', 'eso', 'catalog'], true)) {
            $q = CatalogCenter::query()->whereNotNull('locality')->distinct();
            if ($province !== '') {
                $q->where('province', $province);
            }
            $catalogLocalities = $q->orderBy('locality')->pluck('locality');
        }

        if (in_array($source, ['all', 'university'], true)) {
            $q = OfficialCenter::query()->whereNotNull('locality')->distinct();
            if ($province !== '') {
                $q->where('province', $province);
            }
            $officialLocalities = $q->orderBy('locality')->pluck('locality');
        }

        return response()->json([
            'success'    => true,
            'localities' => $catalogLocalities->merge($officialLocalities)->filter()->unique()->sort()->values(),
        ]);
    }

    public function searchSuggestions(Request $request)
    {
        $q      = trim((string) $request->string('q', ''));
        $source = trim((string) $request->string('source', 'all'));

        if (strlen($q) < 2) {
            return response()->json(['success' => true, 'suggestions' => []]);
        }

        $suggestions = collect();

        if (in_array($source, ['all', 'university'], true)) {
            $suggestions = $suggestions->merge(
                OfficialDegree::current()->where('name', 'like', "%{$q}%")->distinct()->limit(10)->pluck('name')
            );
        }

        if (in_array($source, ['all', 'fp', 'bachillerato', 'educacion_secundaria', 'eso', 'catalog'], true)) {
            $suggestions = $suggestions->merge(
                CatalogProgram::query()
                    ->where('official', true)
                    ->where('name', 'like', "%{$q}%")
                    ->distinct()
                    ->limit(10)
                    ->pluck('name')
            );
        }

        if (in_array($source, ['all', 'certificates'], true)) {
            $suggestions = $suggestions->merge(
                ProfessionalCertificate::query()
                    ->where('is_professional_certificate', true)
                    ->where('active', true)
                    ->where('name', 'like', "%{$q}%")
                    ->distinct()
                    ->limit(10)
                    ->pluck('name')
            );
        }

        return response()->json([
            'success'     => true,
            'suggestions' => $suggestions->unique()->sort()->values()->take(20),
        ]);
    }

    public function searchStudies(Request $request)
    {
        $search = trim((string) $request->string('search', ''));
        $province = trim((string) $request->string('province', ''));
        $level = trim((string) $request->string('academic_level', ''));
        $source = trim((string) $request->string('source', 'all'));
        $centerId = $request->integer('center_id');
        $catalogCenterId = $request->integer('catalog_center_id');
        $university = trim((string) $request->string('university', ''));
        $page = max(1, (int) $request->integer('page', 1));
        // Filtros específicos de bachillerato
        $via = trim((string) $request->string('via', ''));
        $bachModality = trim((string) $request->string('bachi_modality', ''));
        $bachAdults = $request->boolean('bachi_adults', false);
        $fpFamily = trim((string) $request->string('fp_family', ''));
        $fpTitle = trim((string) $request->string('fp_title', ''));
        $perPage = 12;
        $selectedCenterCode = $centerId
            ? OfficialCenter::query()->whereKey($centerId)->value('ruct_center_code')
            : null;

        $certFamily      = trim((string) $request->string('cert_family', ''));
        $ownership       = trim((string) $request->string('ownership', ''));   // 'public' | 'private'
        $modality        = trim((string) $request->string('modality', ''));    // 'Diurno' | 'Nocturno' | …
        $locality        = trim((string) $request->string('locality', ''));    // partial match
        $community       = trim((string) $request->string('community', ''));   // autonomous community exact
        $doubleDegree    = $request->boolean('double_degree', false);
        $distanceMode    = $request->boolean('distance_mode', false);         // legacy: solo enseñanza a distancia/online
        $universityOffer = trim((string) $request->string('university_offer', ''));
        $universityModality = trim((string) $request->string('university_modality', ''));
        $ensType         = trim((string) $request->string('ens_type', ''));   // sub-filtro dentro de educacion_secundaria
        $idiomaName      = trim((string) $request->string('idioma_name', '')); // filtro de idioma específico (solo cuando ens_type=idiomas)
        $needsUniversity = in_array($source, ['all', 'university'], true);
        $needsCatalog    = in_array($source, ['all', 'catalog', 'fp', 'bachillerato', 'educacion_secundaria', 'eso'], true);

        // ── Universidad ───────────────────────────────────────────────────────
        if (! $needsUniversity) {
            $universityItems = collect();
        } else {
        $query = OfficialDegree::current()
            ->with([
                'university:id,name,website,province',
                'centers' => function ($q) use ($ownership, $locality, $community) {
                    $q->select('official_centers.id', 'name', 'address', 'locality', 'municipality', 'province', 'autonomous_community_name', 'lat', 'lng', 'geocode_precision', 'official_university_id', 'legal_nature');
                    if ($ownership !== '') {
                        $legalNature = $ownership === 'public' ? 'Público' : 'Privado';
                        $q->where('legal_nature', $legalNature);
                    }
                    if ($locality !== '') {
                        $q->where('official_centers.locality', 'like', "%{$locality}%");
                    }
                    if ($community !== '') {
                        $q->where('official_centers.autonomous_community_name', $community);
                    }
                },
            ])
            ->where('active', true)
            ->whereHas('centers');

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('branch_name', 'like', "%{$search}%")
                    ->orWhere('field_name', 'like', "%{$search}%")
                    ->orWhereHas('centers', fn ($centerQ) => $centerQ->where('name', 'like', "%{$search}%"));
            });
        }

        if ($level !== '') {
            // Normalized labels (Grado, Máster, Doctorado) → match via prefix
            $prefix = $level === 'Doctorado' ? 'Doctor' : $level;
            $query->where('academic_level_name', 'like', "{$prefix}%");
        }

        if ($universityOffer !== '') {
            if (in_array($universityOffer, ['grado', 'master', 'doctorado'], true)) {
                $prefix = $universityOffer === 'grado'
                    ? 'Grado'
                    : ($universityOffer === 'master' ? 'M' : 'Doctor');

                $query->where('academic_level_name', 'like', "{$prefix}%");

                if ($universityOffer !== 'doctorado') {
                    $query->where('name', 'not like', '%Doble%');
                }
            }

            if ($universityOffer === 'doble_grado') {
                $query->where('academic_level_name', 'like', 'Grado%')
                    ->where('name', 'like', '%Doble%');
            }

            if ($universityOffer === 'doble_master') {
                $query->where(function ($q) {
                    $q->where('academic_level_name', 'like', 'M%')
                      ->orWhere('academic_level_name', 'like', 'Máster%')
                      ->orWhere('academic_level_name', 'like', 'Master%');
                })->where('name', 'like', '%Doble%');
            }
        }

        if ($university !== '') {
            $query->whereHas('university', fn ($q) => $q->where('name', $university));
        }

        if ($province !== '') {
            $query->whereHas('centers', fn ($q) => $q->where('province', $province));
        }

        if ($ownership !== '') {
            $legalNature = $ownership === 'public' ? 'Público' : 'Privado';
            $query->whereHas('centers', fn ($q) => $q->where('legal_nature', $legalNature));
        }

        if ($locality !== '') {
            $query->whereHas('centers', fn ($q) => $q->where('official_centers.locality', 'like', "%{$locality}%"));
        }

        if ($community !== '') {
            $query->whereHas('centers', fn ($q) => $q->where('official_centers.autonomous_community_name', $community));
        }

        if ($doubleDegree && $universityOffer === '') {
            $query->where('name', 'like', '%Doble%');
        }

        $onlineModeRequested = $distanceMode || $universityModality === 'online';
        $presentialModeRequested = $universityModality === 'presencial';

        if ($onlineModeRequested) {
            // Obtener ruct_study_codes con modalidad a distancia/online en QEDU
            $distanciaRucts = QeduDegree::query()
                ->where(function ($q) {
                    $q->where('modalidad', 'like', '%distancia%')
                      ->orWhere('modalidad', 'like', '%online%')
                      ->orWhere('modalidad', 'like', '%virtual%');
                })
                ->distinct()
                ->pluck('cod_titulacion');

            $query->where(function ($q) use ($distanciaRucts) {
                $q->whereIn('ruct_study_code', $distanciaRucts)
                  ->orWhereHas('university', fn ($uq) => $uq
                      ->where('name', 'like', '%Distancia%')
                      ->orWhere('name', 'like', '%UNED%')
                      ->orWhere('name', 'like', '%UNIR%')
                      ->orWhere('name', 'like', '%Virtual%')
                      ->orWhere('name', 'like', '%Online%')
                      ->orWhere('name', 'like', '%UDIMA%')
                      ->orWhere('name', 'like', '%UOC%')
                      ->orWhere('name', 'like', '%VIU%')
                  );
            });
        }

        if ($presentialModeRequested) {
            $presencialRucts = QeduDegree::query()
                ->where(function ($q) {
                    $q->where('modalidad', 'like', '%presencial%')
                      ->orWhere('modalidad', 'like', '%Presencial%');
                })
                ->where(function ($q) {
                    $q->where('modalidad', 'not like', '%semi%')
                      ->where('modalidad', 'not like', '%distancia%')
                      ->where('modalidad', 'not like', '%online%')
                      ->where('modalidad', 'not like', '%virtual%');
                })
                ->distinct()
                ->pluck('cod_titulacion');

            $query->whereIn('ruct_study_code', $presencialRucts);
        }

        if ($centerId) {
            $query->whereHas('centers', fn ($q) => $q->where('official_centers.id', $centerId));
        }

        $universityResults = $query
            ->orderBy('name')
            ->get();

        // --- Enriquecer con notas de corte (QEDU) ---
        // Una sola query batch para toda la página (evita N+1)
        $ructCodes = $universityResults->pluck('ruct_study_code');
        $notasCorteMap = UniversityCutoffGrade::conNota()
            ->whereIn('cod_titulacion', $ructCodes)
            ->select('cod_titulacion', 'nota_corte', 'nombre_universidad', 'ccaa', 'anio')
            ->get()
            ->groupBy('cod_titulacion');

        $qeduQuery = QeduDegree::query()
            ->whereIn('cod_titulacion', $ructCodes);

        if ($province !== '') {
            $qeduQuery->where('provincia', $province);
        }

        if ($university !== '') {
            $qeduQuery->where('nombre_universidad', $university);
        }

        if ($selectedCenterCode) {
            $qeduQuery->where('cod_centro', $selectedCenterCode);
        }

        $qeduMap = $qeduQuery
            ->select(
                'cod_titulacion',
                'cod_centro',
                'insercion_tasa_afiliacion',
                'insercion_salario_medio',
                'insercion_pct_indefinidos',
                'insercion_pct_cotizacion',
                'modalidad',
                'nivel'
            )
            ->get()
            ->groupBy('cod_titulacion');

        $universityItems = $universityResults->map(function (OfficialDegree $degree) use ($province, $centerId, $notasCorteMap, $qeduMap, $ownership, $locality, $community) {
                $centers = $degree->centers
                    ->filter(function ($center) use ($province, $centerId, $ownership, $locality, $community) {
                        if ($province !== '' && $center->province !== $province) {
                            return false;
                        }

                        if ($centerId && (int) $center->id !== (int) $centerId) {
                            return false;
                        }

                        if ($ownership !== '') {
                            $legalNature = $ownership === 'public' ? 'Público' : 'Privado';
                            if (($center->legal_nature ?? '') !== $legalNature) {
                                return false;
                            }
                        }

                        if ($locality !== '' && stripos($center->locality ?? '', $locality) === false) {
                            return false;
                        }

                        if ($community !== '' && ($center->autonomous_community_name ?? '') !== $community) {
                            return false;
                        }

                        return true;
                    })
                    ->values()
                    ->map(fn ($center) => [
                        'id' => $center->id,
                        'name' => $center->name,
                        'address' => $center->address,
                        'municipality' => $center->municipality,
                        'locality' => $center->locality,
                        'province' => $center->province,
                        'lat' => $center->lat,
                        'lng' => $center->lng,
                        'geocode_precision' => $center->geocode_precision,
                        'website' => $degree->university?->website,
                        'email' => null,
                        'phone' => null,
                    ]);

                $qeduRows = $qeduMap->get($degree->ruct_study_code, collect());
                $afil = $qeduRows->pluck('insercion_tasa_afiliacion')->filter(fn ($v) => $v !== null)->values();
                $sal = $qeduRows->pluck('insercion_salario_medio')->filter(fn ($v) => $v !== null)->values();
                $indef = $qeduRows->pluck('insercion_pct_indefinidos')->filter(fn ($v) => $v !== null)->values();
                $cot = $qeduRows->pluck('insercion_pct_cotizacion')->filter(fn ($v) => $v !== null)->values();

                $rawLevel = $degree->academic_level_name ?? '';
                $levelLabel = str_starts_with($rawLevel, 'Grado')   ? 'Grado'
                            : (str_starts_with($rawLevel, 'Doctor') ? 'Doctorado'
                            : (str_starts_with($rawLevel, 'M')      ? 'Máster'
                            : $rawLevel));

                return [
                    'id' => $degree->id,
                    'source' => 'university',
                    'name' => $degree->name,
                    'academic_level_name' => $levelLabel,
                    'branch_name' => $degree->branch_name,
                    'field_name' => $degree->field_name,
                    'university' => $degree->university ? [
                        'id' => $degree->university->id,
                        'name' => $degree->university->name,
                        'website' => $degree->university->website,
                        'province' => $degree->university->province,
                    ] : null,
                    'centers_count' => $centers->count(),
                    'centers' => $centers,
                    'nota_corte_min' => $notasCorteMap->has($degree->ruct_study_code)
                        ? $notasCorteMap->get($degree->ruct_study_code)->min('nota_corte')
                        : null,
                    'nota_corte_max' => $notasCorteMap->has($degree->ruct_study_code)
                        ? $notasCorteMap->get($degree->ruct_study_code)->max('nota_corte')
                        : null,
                    'nota_corte_anio' => $notasCorteMap->has($degree->ruct_study_code)
                        ? $notasCorteMap->get($degree->ruct_study_code)->first()?->anio
                        : null,
                    'qedu_offers_count' => $qeduRows->count(),
                    'qedu_centers_count' => $qeduRows->pluck('cod_centro')->unique()->count(),
                    'tiene_insercion' => $afil->isNotEmpty(),
                    'insercion_tasa_afiliacion_min' => $afil->isNotEmpty() ? round($afil->min(), 2) : null,
                    'insercion_tasa_afiliacion_max' => $afil->isNotEmpty() ? round($afil->max(), 2) : null,
                    'insercion_salario_medio_min' => $sal->isNotEmpty() ? round($sal->min(), 2) : null,
                    'insercion_salario_medio_max' => $sal->isNotEmpty() ? round($sal->max(), 2) : null,
                    'insercion_pct_indefinidos_max' => $indef->isNotEmpty() ? round($indef->max(), 2) : null,
                    'insercion_pct_cotizacion_max' => $cot->isNotEmpty() ? round($cot->max(), 2) : null,
                ];
            });

            // Si hay un filtro de nivel no universitario, los universitarios no aplican
            if ($level !== '' && ! in_array($level, ['Grado', 'Máster', 'Doctorado'], true)) {
                $universityItems = collect();
            }
        } // end $needsUniversity

        // ── Catálogo (FP, Bachillerato, otras enseñanzas) ────────────────────
        if (! $needsCatalog) {
            $catalogItems = collect();
        } else {
        $catalogQuery = CatalogProgram::query()
            ->with([
                'centers' => function ($q) use ($ownership, $locality, $community) {
                    $q->select('catalog_centers.id', 'name', 'address', 'locality', 'municipality', 'province', 'autonomous_community', 'lat', 'lng', 'website', 'email', 'phone', 'ownership_type');
                    if ($ownership !== '') {
                        $q->where('catalog_centers.ownership_type', $ownership);
                    }
                    if ($locality !== '') {
                        $q->where('catalog_centers.locality', 'like', "%{$locality}%");
                    }
                    if ($community !== '') {
                        $q->where('catalog_centers.autonomous_community', $community);
                    }
                },
            ])
            ->where('official', true)
            ->whereHas('centers', function ($q) use ($province, $catalogCenterId, $ownership, $locality, $community) {
                if ($province !== '') {
                    $q->where('catalog_centers.province', $province);
                }

                if ($catalogCenterId) {
                    $q->where('catalog_centers.id', $catalogCenterId);
                }

                if ($ownership !== '') {
                    $q->where('catalog_centers.ownership_type', $ownership);
                }

                if ($locality !== '') {
                    $q->where('catalog_centers.locality', 'like', "%{$locality}%");
                }

                if ($community !== '') {
                    $q->where('catalog_centers.autonomous_community', $community);
                }
            });

            // Filtro de fuente: restringe el tipo de enseñanza según la pestaña seleccionada
            if ($source === 'fp') {
                $catalogQuery->whereIn('education_level', [
                    'FP Grado Superior', 'FP Grado Medio', 'FP Grado Básico', 'FP Básica',
                    'Curso de Especialización', 'Especialización FP', 'Especialización',
                ]);
            } elseif ($source === 'bachillerato') {
                $catalogQuery->where('education_level', 'Bachillerato');
            } elseif ($source === 'educacion_secundaria' || $source === 'eso') {
                $catalogQuery->whereNotIn('education_level', [
                    'FP Grado Superior', 'FP Grado Medio', 'FP Grado Básico', 'FP Básica',
                    'Curso de Especialización', 'Especialización FP', 'Especialización', 'Bachillerato',
                ]);
                // Sub-filtro por tipo de enseñanza (solo aplica desde la pestaña educacion_secundaria)
                if ($ensType !== '' && $source === 'educacion_secundaria') {
                    switch ($ensType) {
                        case 'eso':
                            $catalogQuery->where(function ($q) {
                                $q->where('education_level', 'ESO')
                                  ->orWhere('name', 'like', '%Secundaria Obligatoria%');
                            });
                            break;
                        case 'idiomas':
                            $catalogQuery->where(function ($q) {
                                $q->where('education_level', 'Idiomas')
                                  ->orWhere('education_level', 'like', '%Idioma%');
                            });
                            if ($idiomaName !== '') {
                                $catalogQuery->where('name', 'like', "%{$idiomaName}%");
                            }
                            break;
                        case 'musica':
                            $catalogQuery->where(function ($q) {
                                $q->where('education_level', 'Música')
                                  ->orWhere('name', 'like', '%Música%')
                                  ->orWhere('name', 'like', '%Musica%');
                            });
                            break;
                        case 'danza':
                            $catalogQuery->where(function ($q) {
                                $q->where('education_level', 'Danza')
                                  ->orWhere('name', 'like', '%Danza%');
                            });
                            break;
                        case 'teatro':
                            $catalogQuery->where(function ($q) {
                                $q->where('education_level', 'like', '%Dramático%')
                                  ->orWhere('name', 'like', '%Teatro%')
                                  ->orWhere('name', 'like', '%Arte Dramático%')
                                  ->orWhere('name', 'like', '%Dramaturgi%');
                            });
                            break;
                        case 'artes_plasticas':
                            $catalogQuery->where(function ($q) {
                                $q->where('education_level', 'Enseñanzas Artísticas')
                                  ->where('name', 'not like', '%Danza%')
                                  ->where('name', 'not like', '%Teatro%')
                                  ->where('name', 'not like', '%Música%');
                            });
                            break;
                        case 'deportivas':
                            $catalogQuery->where('education_level', 'Enseñanzas Deportivas');
                            break;
                        case 'adultos':
                            $catalogQuery->where(function ($q) {
                                $q->where('education_level', 'Educación para Adultos')
                                  ->orWhere('education_level', 'like', '%Adulto%');
                            });
                            break;
                        case 'acceso_fp_medio':
                            $catalogQuery->where(function ($q) {
                                $q->where('name', 'like', '%Acceso%Grado Medio%')
                                  ->orWhere('name', 'like', '%Acceso a Ciclos%Medio%');
                            });
                            break;
                        case 'acceso_fp_superior':
                            $catalogQuery->where(function ($q) {
                                $q->where('name', 'like', '%Acceso%Grado Superior%')
                                  ->orWhere('name', 'like', '%Acceso a Ciclos%Superior%');
                            });
                            break;
                        case 'prueba_mayores_25':
                            $catalogQuery->where(function ($q) {
                                $q->where('name', 'like', '%mayores de 25%')
                                  ->orWhere('name', 'like', '%25 años%');
                            });
                            break;
                        case 'educacion_especial':
                            $catalogQuery->where(function ($q) {
                                $q->where('education_level', 'Educación Especial')
                                  ->orWhere('name', 'like', '%Necesidades Educativas%')
                                  ->orWhere('name', 'like', '%Educación Especial%');
                            });
                            break;
                    }
                }
            }

        if ($search !== '') {
            $catalogQuery->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('family_name', 'like', "%{$search}%")
                    ->orWhere('education_level', 'like', "%{$search}%")
                    ->orWhereHas('centers', fn ($cq) => $cq->where('catalog_centers.name', 'like', "%{$search}%"));
            });
        }

        if ($level !== '' && !in_array($level, ['Grado', 'Máster', 'Doctorado'], true)) {
            $catalogQuery->where(function ($q) use ($level) {
                foreach ($this->catalogLevelVariants($level) as $variant) {
                    $q->orWhere('education_level', $variant);
                }
            });
        }

        // Filtros SQL adicionales para bachillerato
        if ($level === 'Bachillerato' || $source === 'bachillerato') {
            if ($bachModality !== '') {
                $catalogQuery->where('modality', $bachModality);
            }
            if ($bachAdults) {
                $catalogQuery->where('name', 'like', '%para Adultos%');
            }
        }

        // Filtros SQL adicionales para FP (incluye Cursos de Especialización)
        if ($source === 'fp' || in_array($level, ['FP Grado Superior', 'FP Grado Medio', 'FP Básica', 'Curso de Especialización'], true)) {
            if ($fpFamily !== '') {
                $catalogQuery->where('family_name', $fpFamily);
            }
            if ($fpTitle !== '') {
                $catalogQuery->where('name', 'like', "%{$fpTitle}%");
            }
        }

        // Filtro general de modalidad (aplica a todos los sources del catálogo)
        // Tiene prioridad sobre bachi_modality si ambos están presentes.
        if ($modality !== '') {
            $catalogQuery->where('modality', $modality);
        }

        $catalogItems = $catalogQuery
            ->orderBy('education_level')
            ->orderBy('name')
            ->get()
            ->map(function (CatalogProgram $program) use ($province, $catalogCenterId, $ownership, $locality, $community) {
                $centers = $program->centers
                    ->filter(function ($center) use ($province, $catalogCenterId, $ownership, $locality, $community) {
                        if ($province !== '' && $center->province !== $province) {
                            return false;
                        }

                        if ($catalogCenterId && (int) $center->id !== (int) $catalogCenterId) {
                            return false;
                        }

                        if ($ownership !== '' && ($center->ownership_type ?? '') !== $ownership) {
                            return false;
                        }

                        if ($locality !== '' && stripos($center->locality ?? '', $locality) === false) {
                            return false;
                        }

                        if ($community !== '' && ($center->autonomous_community ?? '') !== $community) {
                            return false;
                        }

                        return true;
                    })
                    ->values()
                    ->map(fn ($center) => [
                        'id' => $center->id,
                        'name' => $center->name,
                        'address' => $center->address,
                        'municipality' => $center->municipality,
                        'locality' => $center->locality,
                        'province' => $center->province,
                        'autonomous_community' => $center->autonomous_community,
                        'lat' => $center->lat,
                        'lng' => $center->lng,
                        'website' => $center->website,
                        'email' => $center->email,
                        'phone' => $center->phone,
                        // Campos temporales para la agregación de bachillerato
                        '_program_modality' => $program->modality,
                        '_program_for_adults' => str_contains(mb_strtolower($program->name ?? ''), 'para adultos'),
                    ]);

                $canonicalVia = str_contains(mb_strtolower($program->education_level ?? ''), 'bachiller')
                    ? $this->canonicalBachilleratoVia($program->name ?? '')
                    : null;

                return [
                    'id' => $program->id,
                    'source' => 'catalog',
                    'name' => $program->name,
                    'academic_level_name' => $this->groupCatalogEducationLevel($program->education_level),
                    'branch_name' => $program->family_name,
                    'field_name' => $program->program_type,
                    'canonical_via' => $canonicalVia,
                    'university' => null,
                    'centers_count' => $centers->count(),
                    'centers' => $centers->toArray(),
                    'nota_corte_min' => null,
                    'nota_corte_max' => null,
                    'nota_corte_anio' => null,
                    'qedu_offers_count' => 0,
                    'qedu_centers_count' => 0,
                    'tiene_insercion' => false,
                    'insercion_tasa_afiliacion_min' => null,
                    'insercion_tasa_afiliacion_max' => null,
                    'insercion_salario_medio_min' => null,
                    'insercion_salario_medio_max' => null,
                    'insercion_pct_indefinidos_max' => null,
                    'insercion_pct_cotizacion_max' => null,
                    'summary' => $program->summary,
                    'modality' => $program->modality,
                ];
            })
            ->filter(fn (array $item) => $item['centers_count'] > 0)
            ->values();

        // Deduplicar programas repetidos y canonicalizar vías de bachillerato
        if ($via !== '') {
            // Normalizar el input del usuario (acepta "ciencias", "humanidades", etc.)
            $normalizedVia = $this->canonicalBachilleratoVia($via);
            $catalogItems = $catalogItems->filter(fn ($item) => $item['canonical_via'] === $normalizedVia)->values();
        }

        $catalogItems = $catalogItems
            ->groupBy(function ($item) {
                if ($item['canonical_via'] !== null) {
                    // Bachillerato: agrupar por vía canónica
                    return 'bach||' . $item['canonical_via'];
                }

                // Resto: mismo nombre + nivel + familia
                return mb_strtolower(trim($item['name'])) . '||' . ($item['academic_level_name'] ?? '') . '||' . ($item['branch_name'] ?? '');
            })
            ->map(function ($group) {
                $first = $group->first();
                $isBachillerato = $first['canonical_via'] !== null;

                // Merge de centros con agregación de modalidades (bachillerato)
                $centersByID = $group->flatMap(fn ($item) => collect($item['centers']))->groupBy('id');
                $allCenters = $centersByID->map(function ($centerGroup) use ($isBachillerato) {
                    $base = $centerGroup->first();
                    if ($isBachillerato) {
                        $modalities = $centerGroup->pluck('_program_modality')->filter()->unique()->sort()->values()->toArray();
                        $hasAdults = in_array(true, $centerGroup->pluck('_program_for_adults')->toArray(), true);
                        $result = array_merge($base, ['modalities' => $modalities, 'has_adults' => $hasAdults]);
                    } else {
                        $result = $base;
                    }
                    unset($result['_program_modality'], $result['_program_for_adults']);

                    return $result;
                })->sortBy('name')->values();

                // Para bachillerato: nombre = vía canónica limpia
                if ($isBachillerato) {
                    $first['name'] = $first['canonical_via'];
                }

                $first['centers'] = $allCenters->toArray();
                $first['centers_count'] = $allCenters->count();

                return $first;
            })
            ->values();
        } // end $needsCatalog

        // --- Certificados de Profesionalidad (SEPE) ---
        $certificateItems = collect();
        if ($source === 'certificates' || $source === 'all') {
            $certQuery = ProfessionalCertificate::query()
                ->where('is_professional_certificate', true)
                ->whereIn('level', [1, 2, 3])
                ->where('active', true);

            if ($search !== '') {
                $certQuery->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('family_name', 'like', "%{$search}%")
                        ->orWhere('area_name', 'like', "%{$search}%");
                });
            }

            if ($certFamily !== '') {
                $certQuery->where('family_name', $certFamily);
            }

            $levelMap = [1 => 'Nivel 1 (básico)', 2 => 'Nivel 2 (medio)', 3 => 'Nivel 3 (superior)'];

            $certificateItems = $certQuery
                ->orderBy('family_name')
                ->orderBy('name')
                ->get()
                ->map(fn (ProfessionalCertificate $cert) => [
                    'id' => $cert->id,
                    'source' => 'certificate',
                    'name' => $cert->name,
                    'academic_level_name' => $levelMap[$cert->level] ?? "Nivel {$cert->level}",
                    'branch_name' => $cert->family_name,
                    'field_name' => $cert->area_name,
                    'sepe_code' => $cert->sepe_code,
                    'total_hours' => $cert->total_hours,
                    'online_hours' => $cert->online_hours,
                    'is_modular' => $cert->is_modular,
                    'family_name' => $cert->family_name,
                    'family_code' => $cert->family_code,
                    'level' => $cert->level,
                    'detail_url' => 'https://www.sepe.es/HomeSepe/Personas/formacion/certificados-profesionalidad/buscador-de-certificados-de-profesionalidad.html',
                    'centers_count' => 0,
                    'centers' => [],
                    'canonical_via' => null,
                    'nota_corte_min' => null,
                    'nota_corte_max' => null,
                    'nota_corte_anio' => null,
                    'tiene_insercion' => false,
                    'insercion_tasa_afiliacion_min' => null,
                    'insercion_tasa_afiliacion_max' => null,
                    'insercion_salario_medio_min' => null,
                    'insercion_salario_medio_max' => null,
                    'insercion_pct_indefinidos_max' => null,
                    'insercion_pct_cotizacion_max' => null,
                    'qedu_offers_count' => 0,
                    'qedu_centers_count' => 0,
                    'summary' => null,
                    'modality' => null,
                    'university' => null,
                ]);
        }

        $items = $universityItems->concat($catalogItems)->concat($certificateItems)->values();

        $results = new LengthAwarePaginator(
            $items->forPage($page, $perPage)->values(),
            $items->count(),
            $perPage,
            $page,
            ['path' => $request->url(), 'query' => $request->query()]
        );

        return response()->json([
            'success' => true,
            'results' => $results,
        ]);
    }

    private function groupCatalogEducationLevel(?string $level): string
    {
        $value = trim((string) $level);
        $normalized = mb_strtolower($value);

        if ($value === '') return 'Otras enseñanzas';

        // Mapeos exactos para valores normalizados específicos
        if ($value === 'ESO') return 'ESO';
        if ($value === 'Danza') return 'Danza';
        if ($value === 'Música') return 'Música';
        if ($value === 'Educación Especial') return 'Educación Especial';
        if ($value === 'Pruebas de Acceso') return 'Pruebas de Acceso';

        if (str_contains($normalized, 'especializaci')) return 'Curso de Especialización';
        if (str_contains($normalized, 'grado superior')) return 'FP Grado Superior';
        if (str_contains($normalized, 'grado medio')) return 'FP Grado Medio';
        if (str_contains($normalized, 'grado básico') || str_contains($normalized, 'fp básica')) return 'FP Básica';
        if (str_contains($normalized, 'bachiller')) return 'Bachillerato';
        if (str_contains($normalized, 'idioma') || str_contains($normalized, 'art') || str_contains($normalized, 'deport')) return 'Idiomas y enseñanzas especiales';
        if (str_contains($normalized, 'adult')) return 'Educación para adultos';

        return 'Otras enseñanzas';
    }

    private function catalogLevelVariants(string $group): array
    {
        return match ($group) {
            'Curso de Especialización' => ['Curso de Especialización', 'Especialización FP', 'Especialización'],
            'FP Grado Superior' => ['FP Grado Superior'],
            'FP Grado Medio' => ['FP Grado Medio'],
            'FP Básica' => ['FP Grado Básico', 'FP Básica'],
            'Bachillerato' => ['Bachillerato'],
            'Idiomas y enseñanzas especiales' => ['Idiomas', 'Enseñanzas Artísticas', 'Enseñanzas Deportivas'],
            'Educación para adultos' => ['Educación para Adultos'],
            default => ['Otras enseñanzas'],
        };
    }

    /**
     * Mapea el nombre del programa de bachillerato a una de las 6 vías canónicas.
     * Orden de comprobación importante: Música/Escénicas antes que "artes" genérico.
     */
    private function canonicalBachilleratoVia(string $name): string
    {
        $lower = mb_strtolower($name);

        // Música y Artes Escénicas (antes del match genérico de "artes")
        if (str_contains($lower, 'música') || str_contains($lower, 'musica')
            || str_contains($lower, 'escénica') || str_contains($lower, 'escenica')
            || str_contains($lower, 'danza')) {
            return 'Música y Artes Escénicas';
        }

        // Artes Plásticas, Imagen y Diseño
        if (str_contains($lower, 'plástica') || str_contains($lower, 'plastica')
            || str_contains($lower, 'imagen') || str_contains($lower, 'diseño')
            || str_contains($lower, 'diseno')) {
            return 'Artes Plásticas, Imagen y Diseño';
        }

        // "Bachillerato de Artes" genérico → Artes Plásticas por defecto
        if (str_contains($lower, 'artes')) {
            return 'Artes Plásticas, Imagen y Diseño';
        }

        if (str_contains($lower, 'humanidades')) {
            return 'Humanidades y Ciencias Sociales';
        }

        if (str_contains($lower, 'ciencias')) {
            return 'Ciencias y Tecnología';
        }

        if (str_contains($lower, 'internacional') || str_contains($lower, 'extranjero')) {
            return 'Internacional';
        }

        // General, Genérico, prueba libre, etc.
        return 'General';
    }

    public function centerStudies(int $id)
    {
        $center = OfficialCenter::query()
            ->with([
                'university:id,name,website,email,phone_1',
                'degrees' => fn ($q) => $q->current()->select('official_degrees.id', 'ruct_study_code', 'name', 'academic_level_name', 'branch_name', 'field_name'),
            ])
            ->findOrFail($id);

        // Enriquecer grados del centro con nota de corte (QEDU) — batch lookup
        $ructCodes = $center->degrees->pluck('ruct_study_code');
        $notasMap = UniversityCutoffGrade::conNota()
            ->whereIn('cod_titulacion', $ructCodes)
            ->select('cod_titulacion', 'nota_corte', 'nombre_universidad', 'anio')
            ->get()
            ->groupBy('cod_titulacion');

        $qeduMap = QeduDegree::query()
            ->whereIn('cod_titulacion', $ructCodes)
            ->where('cod_centro', $center->ruct_center_code)
            ->select(
                'cod_titulacion',
                'insercion_tasa_afiliacion',
                'insercion_salario_medio',
                'insercion_pct_indefinidos',
                'insercion_pct_cotizacion',
                'modalidad',
                'creditos'
            )
            ->get()
            ->groupBy('cod_titulacion');

        return response()->json([
            'success' => true,
            'center' => [
                'id' => $center->id,
                'name' => $center->name,
                'address' => $center->address,
                'municipality' => $center->municipality,
                'locality' => $center->locality,
                'province' => $center->province,
                'lat' => $center->lat,
                'lng' => $center->lng,
                'website' => $center->university->website ?? null,
                'email' => $center->university->email ?? null,
                'phone' => $center->university->phone_1 ?? null,
                'university' => $center->university?->name,
                'degrees' => $center->degrees->map(function ($degree) use ($notasMap, $qeduMap) {
                    $rawLevel = $degree->academic_level_name ?? '';
                    $levelLabel = str_starts_with($rawLevel, 'Grado')   ? 'Grado'
                                : (str_starts_with($rawLevel, 'Doctor') ? 'Doctorado'
                                : (str_starts_with($rawLevel, 'M')      ? 'Máster'
                                : $rawLevel));
                    $notas = $notasMap->get($degree->ruct_study_code, collect());
                    $qedu = $qeduMap->get($degree->ruct_study_code, collect());
                    $afil = $qedu->pluck('insercion_tasa_afiliacion')->filter(fn ($v) => $v !== null)->values();
                    $sal = $qedu->pluck('insercion_salario_medio')->filter(fn ($v) => $v !== null)->values();
                    return [
                        'id' => $degree->id,
                        'name' => $degree->name,
                        'academic_level_name' => $levelLabel,
                        'branch_name' => $degree->branch_name,
                        'field_name' => $degree->field_name,
                        'nota_corte_min' => $notas->min('nota_corte'),
                        'nota_corte_max' => $notas->max('nota_corte'),
                        'nota_corte_anio' => $notas->first()?->anio,
                        'tiene_insercion' => $afil->isNotEmpty(),
                        'insercion_tasa_afiliacion' => $afil->isNotEmpty() ? round($afil->max(), 2) : null,
                        'insercion_salario_medio' => $sal->isNotEmpty() ? round($sal->max(), 2) : null,
                        'creditos' => $qedu->pluck('creditos')->filter(fn ($v) => $v !== null)->max(),
                    ];
                })->values(),
            ],
        ]);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Oposiciones públicas (BOE)
    // ─────────────────────────────────────────────────────────────────────────
    public function competitions(Request $request)
    {
        $search     = trim((string) $request->string('search', ''));
        $scope      = trim((string) $request->string('scope', ''));
        $accessType = trim((string) $request->string('access_type', ''));
        $group      = trim((string) $request->string('group', ''));
        $dateFrom   = trim((string) $request->string('date_from', ''));
        $dateTo     = trim((string) $request->string('date_to', ''));
        $perPage    = 20;

        $query = \App\Models\PublicCompetition::query()
            ->where('active', true)
            ->orderByDesc('publication_date');

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('organism', 'like', "%{$search}%");
            });
        }

        if ($scope !== '') {
            $query->where('scope', $scope);
        }

        if ($accessType !== '') {
            $query->where('access_type', $accessType);
        }

        if ($group !== '') {
            $query->where('group', $group);
        }

        if ($dateFrom !== '') {
            $query->where('publication_date', '>=', $dateFrom);
        }

        if ($dateTo !== '') {
            $query->where('publication_date', '<=', $dateTo);
        }

        $results = $query->select(
            'id', 'boe_id', 'title', 'organism', 'publication_date',
            'positions', 'access_type', 'scope', 'group',
            'url_pdf', 'url_html', 'url_xml', 'description'
        )->paginate($perPage);

        $base = \App\Models\PublicCompetition::query()->where('active', true);

        $scopes = (clone $base)->whereNotNull('scope')->distinct()->orderBy('scope')->pluck('scope');
        $accessTypes = (clone $base)->whereNotNull('access_type')->distinct()->orderBy('access_type')->pluck('access_type');
        $groups = (clone $base)->whereNotNull('group')->distinct()->orderBy('group')->pluck('group');

        return response()->json([
            'success' => true,
            'results' => $results,
            'filters' => [
                'scopes'       => $scopes,
                'access_types' => $accessTypes,
                'groups'       => $groups,
            ],
        ]);
    }
}
