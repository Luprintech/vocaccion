<?php

namespace App\Http\Controllers;

use App\Models\CareerCatalog;
use App\Models\Perfil;
use App\Services\ItinerarioGeneratorService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Controller para itinerarios formativos específicos por profesión del catálogo.
 * Diferente de ItinerarioController (que gestiona itinerarios legacy del test).
 */
class ItinerarioProfesionController extends Controller
{
    protected ItinerarioGeneratorService $generator;

    public function __construct(ItinerarioGeneratorService $generator)
    {
        $this->generator = $generator;
    }

    /**
     * Genera un itinerario formativo personalizado para una profesión del catálogo.
     * 
     * Endpoint: POST /api/profesion/{profesionId}/itinerario
     * 
     * Auth: Requiere usuario autenticado (Sanctum)
     */
    public function generar(Request $request, int $profesionId)
    {
        $user = Auth::user();
        
        // Validar que la profesión existe
        $profesion = CareerCatalog::find($profesionId);
        if (!$profesion) {
            return response()->json([
                'success' => false,
                'error' => 'Profesión no encontrada',
            ], 404);
        }

        // Obtener perfil del usuario
        $perfil = Perfil::where('usuario_id', $user->id)->first();
        
        // Construir contexto del usuario
        $userContext = $this->buildUserContext($user, $perfil, $request);
        
        // Verificar si ya existe un itinerario reciente (último 30 días) para evitar regenerar
        // Los fallbacks no se cachean (se regeneran siempre para obtener contenido de Gemini)
        $itinerarioExistente = DB::table('itinerarios_personalizados')
            ->where('usuario_id', $user->id)
            ->where('profesion_id', $profesionId)
            ->where('es_fallback', false)
            ->where('generado_en', '>=', now()->subDays(30))
            ->orderBy('generado_en', 'desc')
            ->first();
        
        if ($itinerarioExistente) {
            Log::info('[ItinerarioProfesion] Retornando itinerario cacheado', [
                'usuario_id' => $user->id,
                'profesion_id' => $profesionId,
                'generado_en' => $itinerarioExistente->generado_en,
            ]);

            $contenido = json_decode($itinerarioExistente->contenido, true);

            // Compat: si el cache tiene formato antiguo (rutas), convertirlo al nuevo formato
            if (empty($contenido['vias_formativas']) && !empty($contenido['rutas'])) {
                $contenido['vias_formativas'] = $this->generator->convertLegacyRutas($contenido['rutas']);
                unset($contenido['rutas']);

                // Actualizar el cache con el nuevo formato para futuras peticiones
                DB::table('itinerarios_personalizados')
                    ->where('id', $itinerarioExistente->id)
                    ->update(['contenido' => json_encode($contenido), 'updated_at' => now()]);
            }

            $notasCorte = $this->buildNotasCorteMap($contenido, $userContext['ccaa'] ?? null);

            return response()->json([
                'success' => true,
                'itinerario' => $contenido,
                'notas_corte' => $notasCorte,
                'cached' => true,
                'generado_en' => $itinerarioExistente->generado_en,
            ]);
        }

        try {
            // Generar itinerario con Gemini
            $itinerario = $this->generator->generate($profesionId, $userContext);
            
            // Guardar en BD
            DB::table('itinerarios_personalizados')->insert([
                'usuario_id' => $user->id,
                'profesion_id' => $profesionId,
                'ccaa' => $userContext['ccaa'] ?? null,
                'edad_usuario' => $userContext['edad'] ?? null,
                'nivel_educativo' => $userContext['nivel_educativo'] ?? null,
                'contenido' => json_encode($itinerario),
                'es_fallback' => $itinerario['fallback'] ?? false,
                'generado_en' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            
            $notasCorte = $this->buildNotasCorteMap($itinerario, $userContext['ccaa'] ?? null);

            return response()->json([
                'success' => true,
                'itinerario' => $itinerario,
                'notas_corte' => $notasCorte,
                'cached' => false,
            ]);
            
        } catch (\Throwable $e) {
            Log::error('[ItinerarioProfesion] Error generando itinerario', [
                'usuario_id' => $user->id,
                'profesion_id' => $profesionId,
                'error' => $e->getMessage(),
            ]);
            
            return response()->json([
                'success' => false,
                'error' => 'Error al generar el itinerario. Inténtalo de nuevo más tarde.',
            ], 500);
        }
    }

    /**
     * Genera un itinerario formativo por título de profesión (busca ID internamente).
     * 
     * Endpoint: POST /api/profesion/itinerario-by-title
     * Body: { "titulo": "Desarrollador/a de Software", "ccaa": "Andalucía" (opcional) }
     * 
     * Auth: Requiere usuario autenticado (Sanctum)
     */
    public function generarByTitulo(Request $request)
    {
        $request->validate([
            'titulo' => 'required|string|max:255',
        ]);

        $titulo = $request->input('titulo');
        
        // Buscar profesión por título (case-insensitive exact match)
        $profesion = CareerCatalog::whereRaw('LOWER(titulo) = ?', [strtolower($titulo)])
            ->first();
        
        if (!$profesion) {
            return response()->json([
                'success' => false,
                'error' => 'Profesión no encontrada en el catálogo',
            ], 404);
        }
        
        // Redirigir a generar() con el ID encontrado
        return $this->generar($request, $profesion->id);
    }

    /**
     * Obtiene el historial de itinerarios generados por el usuario.
     * 
     * Endpoint: GET /api/itinerario/historial
     */
    public function historial(Request $request)
    {
        $user = Auth::user();
        
        $itinerarios = DB::table('itinerarios_personalizados')
            ->join('career_catalog', 'itinerarios_personalizados.profesion_id', '=', 'career_catalog.id')
            ->where('itinerarios_personalizados.usuario_id', $user->id)
            ->orderBy('itinerarios_personalizados.generado_en', 'desc')
            ->select(
                'itinerarios_personalizados.id',
                'itinerarios_personalizados.profesion_id',
                'career_catalog.titulo as profesion_titulo',
                'career_catalog.sector',
                'itinerarios_personalizados.ccaa',
                'itinerarios_personalizados.generado_en',
                'itinerarios_personalizados.es_fallback'
            )
            ->limit(20)
            ->get();
        
        return response()->json([
            'success' => true,
            'itinerarios' => $itinerarios,
        ]);
    }

    /**
     * Obtiene un itinerario específico por ID.
     * 
     * Endpoint: GET /api/itinerario/{id}
     */
    public function show(int $id)
    {
        $user = Auth::user();
        
        $itinerario = DB::table('itinerarios_personalizados')
            ->where('id', $id)
            ->where('usuario_id', $user->id)
            ->first();
        
        if (!$itinerario) {
            return response()->json([
                'success' => false,
                'error' => 'Itinerario no encontrado',
            ], 404);
        }
        
        return response()->json([
            'success' => true,
            'itinerario' => json_decode($itinerario->contenido, true),
            'generado_en' => $itinerario->generado_en,
        ]);
    }

    /**
     * Construye el mapa de notas de corte indexado por nombre de opción.
     *
     * Recorre todas las vías formativas y sus pasos buscando opciones con
     * equivalente en `university_cutoff_grades`. Las opciones universitarias
     * son las que típicamente tendrán resultados; el resto devolverá [].
     *
     * @param  array       $itinerario Estructura con vias_formativas[]
     * @param  string|null $ccaa       Comunidad autónoma del usuario (para priorizar)
     * @return array<string, array>    { "Grado en X" => [{ universidad, centro, ... }] }
     */
    protected function buildNotasCorteMap(array $itinerario, ?string $ccaa = null): array
    {
        $notasCorte = [];

        foreach ($itinerario['vias_formativas'] ?? [] as $via) {
            foreach ($via['pasos'] ?? [] as $paso) {
                foreach ($paso['opciones'] ?? [] as $opcion) {
                    $nombre = trim($opcion['nombre'] ?? '');
                    if (!$nombre || isset($notasCorte[$nombre])) {
                        continue;
                    }

                    $rows = $this->searchNotasCorte($nombre, $ccaa);
                    if (!empty($rows)) {
                        $notasCorte[$nombre] = $rows;
                    }
                }
            }
        }

        return $notasCorte;
    }

    /**
     * Busca notas de corte para un nombre de titulación dado.
     *
     * Estrategia en cascada:
     *  1. LIKE exacto en CCAA del usuario
     *  2. LIKE exacto a nivel nacional
     *  3. LIKE con término reducido (sin prefijo "Grado en / Máster en") nacional
     *
     * @return array<int, array{ universidad: string, centro: ?string, provincia: ?string, ccaa: ?string, nota: float, anio: string }>
     */
    protected function searchNotasCorte(string $nombre, ?string $ccaa): array
    {
        // Término de búsqueda principal: el nombre completo
        $termFull = '%' . $nombre . '%';

        // Término reducido: quita prefijos comunes para mejorar el recall
        $core = preg_replace(
            '/^(Grado\s+en\s+|Máster\s+en\s+|Master\s+en\s+|Grado\s+universitario\s+en\s+|Ingeniería\s+en\s+|Licenciatura\s+en\s+|Doble\s+grado\s+en\s+)/ui',
            '',
            $nombre
        );
        $termCore = '%' . trim($core) . '%';

        $select = ['nombre_universidad', 'nombre_centro', 'provincia', 'ccaa', 'nota_corte', 'anio'];

        // 1) Intento: coincidencia exacta + filtro por CCAA
        if ($ccaa) {
            $rows = DB::table('university_cutoff_grades')
                ->whereNotNull('nota_corte')
                ->where('nota_corte', '>', 0)
                ->where('titulacion', 'LIKE', $termFull)
                ->where('ccaa', 'LIKE', '%' . $ccaa . '%')
                ->orderBy('nota_corte')
                ->select($select)
                ->limit(30)
                ->get();

            if ($rows->isNotEmpty()) {
                return $this->formatNotasCorte($rows);
            }
        }

        // 2) Intento: coincidencia exacta a nivel nacional
        $rows = DB::table('university_cutoff_grades')
            ->whereNotNull('nota_corte')
            ->where('nota_corte', '>', 0)
            ->where('titulacion', 'LIKE', $termFull)
            ->orderBy('nota_corte')
            ->select($select)
            ->limit(30)
            ->get();

        if ($rows->isNotEmpty()) {
            return $this->formatNotasCorte($rows);
        }

        // 3) Intento: término reducido a nivel nacional (mayor recall, menor precisión)
        if ($termCore !== $termFull) {
            $rows = DB::table('university_cutoff_grades')
                ->whereNotNull('nota_corte')
                ->where('nota_corte', '>', 0)
                ->where('titulacion', 'LIKE', $termCore)
                ->orderBy('nota_corte')
                ->select($select)
                ->limit(30)
                ->get();

            if ($rows->isNotEmpty()) {
                return $this->formatNotasCorte($rows);
            }
        }

        return [];
    }

    /**
     * Formatea filas de university_cutoff_grades al formato esperado por el frontend.
     */
    protected function formatNotasCorte($rows): array
    {
        return $rows->map(fn($r) => [
            'universidad' => $r->nombre_universidad,
            'centro'      => $r->nombre_centro,
            'provincia'   => $r->provincia,
            'ccaa'        => $r->ccaa,
            'nota'        => (float) $r->nota_corte,
            'anio'        => $r->anio,
        ])->values()->toArray();
    }

    /**
     * Construye el contexto del usuario para el generador.
     */
    protected function buildUserContext($user, $perfil, Request $request): array
    {
        $context = [];
        
        // Edad
        if ($perfil && $perfil->fecha_nacimiento) {
            $context['edad'] = \Carbon\Carbon::parse($perfil->fecha_nacimiento)->age;
        } elseif ($request->has('edad')) {
            $context['edad'] = (int) $request->input('edad');
        }
        
        // Comunidad Autónoma
        if ($perfil && $perfil->comunidad_autonoma) {
            $context['ccaa'] = $perfil->comunidad_autonoma;
        } elseif ($request->has('ccaa')) {
            $context['ccaa'] = $request->input('ccaa');
        }
        
        // Nivel educativo (de la última formación registrada)
        if ($perfil) {
            $ultimaFormacion = DB::table('formaciones')
                ->where('perfil_id', $perfil->id)
                ->orderBy('fecha_inicio', 'desc')
                ->first();
            
            if ($ultimaFormacion) {
                $context['nivel_educativo'] = $ultimaFormacion->nivel ?? $ultimaFormacion->titulo_obtenido;
            }
        }
        
        // Permitir override manual desde el request
        if ($request->has('nivel_educativo')) {
            $context['nivel_educativo'] = $request->input('nivel_educativo');
        }
        
        // Presupuesto (si se especifica)
        if ($request->has('presupuesto')) {
            $context['presupuesto'] = (int) $request->input('presupuesto');
        }
        
        // Situación laboral (inferir o pedir)
        if ($request->has('situacion_laboral')) {
            $context['situacion_laboral'] = $request->input('situacion_laboral');
        } else {
            // Inferir: si tiene experiencias laborales recientes → 'trabajando'
            $tieneExperiencias = $perfil ? DB::table('experiencias')
                ->where('perfil_id', $perfil->id)
                ->where('fecha_fin', '>=', now()->subYears(2))
                ->exists() : false;
            
            $context['situacion_laboral'] = $tieneExperiencias ? 'trabajando' : 'estudiante';
        }
        
        return $context;
    }
}
