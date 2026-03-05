<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Services\ProfesionComparadorService;
use App\Services\GeminiService;
use App\Models\VocationalSession;
use App\Models\VocationalProfile;

class UserTestController extends Controller
{
    protected GeminiService $gemini;

    public function __construct(GeminiService $gemini)
    {
        $this->gemini = $gemini;
    }

    // ============================================
    // FUNCIONES DE GESTIÓN DE TEST
    // ============================================

    /**
     * Guardar progreso parcial del test
     */
    public function saveProgress(Request $request)
    {
        $user = Auth::user();

        DB::table('test_sessions')->updateOrInsert(
            ['usuario_id' => $user->id],
            [
                'answers' => json_encode($request->answers),
                'current_index' => $request->current_index ?? 0,
                'seconds_left' => $request->seconds_left ?? 0,
                'updated_at' => now(),
            ]
        );

        return response()->json(['success' => true]);
    }

    /**
     * Consultar progreso guardado del test del usuario
     */
    public function getProgress()
    {
        $user = Auth::user();

        // Buscar la sesión más reciente sin completar
        $session = DB::table('test_sessions')
            ->where('usuario_id', $user->id)
            ->whereNull('completed_at')
            ->latest('updated_at') // importante: devuelve la más reciente
            ->first();

        if (!$session) {
            return response()->json([
                'success' => false,
                'enCurso' => false,
                'message' => 'No hay test en progreso'
            ]);
        }

        return response()->json([
            'success' => true,
            'enCurso' => true,
            'session' => [
                'id' => $session->id,
                'current_index' => (int) $session->current_index,
                'answers' => $session->answers,
                'updated_at' => $session->updated_at,
            ]
        ]);
    }


    /**
     * Guardar resultado final del test
     */
    public function saveResult(Request $request)
    {
        $user = Auth::user();

        // Preparar datos
        $answers_json = json_encode($request->answers ?? []);
        $result_text = $request->result ?? null;
        $modelo = $request->modelo ?? null;
        $session_id = $request->session_id ?? null;
        $profesiones = $request->profesiones ?? null; // puede ser array
        $profesiones_json = $profesiones ? json_encode($profesiones) : null;

        // Comprobar último resultado para evitar duplicados exactos
        $latest = DB::table('test_results')
            ->where('usuario_id', $user->id)
            ->latest('created_at')
            ->first();

        if ($latest) {
            // Si el cliente pide actualizar el último resultado, lo actualizamos
            if ($request->update_existing === true || $request->update_existing === 'true') {
                DB::table('test_results')
                    ->where('id', $latest->id)
                    ->update([
                        'test_session_id' => $session_id,
                        'answers' => $answers_json,
                        'result_text' => $result_text,
                        'modelo' => $modelo,
                        'profesiones' => $profesiones_json,
                        'updated_at' => now(),
                    ]);

                // Marcar sesión como completada si aplica
                if ($session_id) {
                    DB::table('test_sessions')
                        ->where('id', $session_id)
                        ->update([
                            'completed_at' => now(),
                            'updated_at' => now(),
                        ]);
                }

                return response()->json(['success' => true, 'updated' => true]);
            }

            // Evitar insertar duplicado exacto (mismo texto, mismas respuestas y mismas profesiones)
            $sameResultText = ($latest->result_text === $result_text);
            $sameAnswers = ($latest->answers === $answers_json);
            $latestProfesiones = property_exists($latest, 'profesiones') ? $latest->profesiones : null;
            $sameProfesiones = ($latestProfesiones === $profesiones_json);

            if ($sameResultText && $sameAnswers && $sameProfesiones) {
                // No insertar duplicado
                // Marcar sesión completada si se envía session_id
                if ($session_id) {
                    DB::table('test_sessions')
                        ->where('id', $session_id)
                        ->update([
                            'completed_at' => now(),
                            'updated_at' => now(),
                        ]);
                }

                return response()->json(['success' => true, 'skipped_duplicate' => true]);
            }
        }

        // Insertar nuevo resultado
        DB::table('test_results')->insert([
            'usuario_id' => $user->id,
            'test_session_id' => $session_id,
            'answers' => $answers_json,
            'result_text' => $result_text,
            'modelo' => $modelo,
            'profesiones' => $profesiones_json,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Marcar sesión como completada
        if ($request->session_id) {
            DB::table('test_sessions')
                ->where('id', $request->session_id)
                ->update([
                    'completed_at' => now(),
                    'updated_at' => now(),
                ]);
        }

        return response()->json(['success' => true]);
    }


    // Consultar estado del test del usuario
    public function stateTest()
    {
        try {
            $user = Auth::user();

            if (!$user) {
                // No autenticado: devolver JSON claro y código 401
                return response()->json(['enCurso' => false, 'message' => 'Usuario no autenticado'], 401);
            }

            $sesion = DB::table('test_sessions')
                ->where('usuario_id', $user->id)
                ->whereNull('completed_at') // test no completado
                ->latest('updated_at')
                ->first();

            if ($sesion) {
                return response()->json([
                    'enCurso' => true,
                    'current_index' => $sesion->current_index,
                    'answers' => json_decode($sesion->answers, true),
                ]);
            }

            return response()->json(['enCurso' => false]);
        } catch (\Exception $e) {
            // Error inesperado: siempre devolver JSON
            return response()->json([
                'enCurso' => false,
                'error' => 'Error al consultar el estado del test'
            ], 500);
        }
    }


    // Cancela el test en curso del usuario
    public function cancelTest()
    {
        $user = Auth::user();

        DB::table('test_sessions')
            ->where('usuario_id', $user->id)
            ->whereNull('completed_at')
            ->delete();

        return response()->json(['success' => true]);
    }

    /**
     * Borra todos los resultados y sesiones del usuario y su objetivo profesional.
     * Se usará cuando el usuario quiera reiniciar completamente el test.
     */
    public function clearResults()
    {
        $user = Auth::user();

        // Borrar resultados previos
        DB::table('test_results')
            ->where('usuario_id', $user->id)
            ->delete();

        // Borrar sesiones en curso (por si queda alguna)
        DB::table('test_sessions')
            ->where('usuario_id', $user->id)
            ->delete();

        // Borrar objetivo profesional si existe (protegemos con try por si la tabla no está presente)
        try {
            DB::table('objetivo_profesional')
                ->where('user_id', $user->id)
                ->delete();
        } catch (\Exception $e) {
            // intentar nombre alternativo
            try {
                DB::table('objetivo_profesionales')->where('user_id', $user->id)->delete();
            } catch (\Exception $e) { /* ignore */
            }
        }

        // Borrar sesiones del motor RIASEC (vocational_sessions)
        // ⚠️ CRÍTICO: Sin esto, TestController::iniciar() sigue encontrando
        // la sesión completada y devuelve estado='completado' → bucle infinito.
        try {
            \App\Models\VocationalSession::where('usuario_id', $user->id)->delete();
        } catch (\Exception $e) {
            Log::error('Error borrando vocational_sessions: ' . $e->getMessage());
        }

        // Resetear perfil RIASEC para que el nuevo test empiece con scores a 0
        try {
            \App\Models\VocationalProfile::where('usuario_id', $user->id)->delete();
        } catch (\Exception $e) {
            Log::error('Error borrando vocational_profile: ' . $e->getMessage());
        }

        // Borrar itinerarios generados
        try {
            DB::table('itinerarios_generados')
                ->where('user_id', $user->id)
                ->delete();
        } catch (\Exception $e) {
            Log::error('Error borrando itinerarios: ' . $e->getMessage());
        }

        return response()->json(['success' => true]);
    }

    /**
     * Obtener el progreso guardado del test del usuario
     * Este método devuelve la sesión activa si existe
     */
    public function getTest()
    {
        try {
            $user = Auth::user();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Usuario no autenticado'
                ], 401);
            }

            $session = DB::table('test_sessions')
                ->where('usuario_id', $user->id)
                ->whereNull('completed_at')
                ->latest('updated_at')
                ->first();

            if ($session) {
                return response()->json([
                    'success' => true,
                    'session' => [
                        'answers' => $session->answers,
                        'current_index' => $session->current_index,
                        'seconds_left' => $session->seconds_left,
                    ]
                ]);
            }

            return response()->json([
                'success' => false,
                'message' => 'No hay sesión activa'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Error al obtener el test: ' . $e->getMessage()
            ], 500);
        }
    }


    /**
     * Listar resultados guardados del usuario (más recientes primero).
     * Si no hay resultados en test_results pero hay una vocational_session completada,
     * llama automáticamente al análisis para generar y persistir los resultados.
     */
    public function listResults()
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return response()->json(['success' => false, 'message' => 'Usuario no autenticado'], 401);
            }

            $results = DB::table('test_results')
                ->where('usuario_id', $user->id)
                ->orderBy('created_at', 'desc')
                ->get();

            // ── RECUPERACIÓN AUTOMÁTICA ───────────────────────────────────────────────────────
            // Si no hay resultados guardados pero existe una vocational_session completada,
            // regenerar los resultados llamando al servicio de análisis.
            if ($results->isEmpty()) {
                $vocSession = VocationalSession::where('usuario_id', $user->id)
                    ->where('is_completed', true)
                    ->latest()
                    ->first();

                if ($vocSession && !empty($vocSession->history_log)) {
                    Log::info('listResults: test_results vacío con vocSession completada, regenerando...', [
                        'usuario_id' => $user->id,
                        'session_id' => $vocSession->id,
                    ]);

                    // Resolver o crear el perfil vocacional
                    $profile = VocationalProfile::where('usuario_id', $user->id)->first();
                    if (!$profile) {
                        $profile = VocationalProfile::create(['usuario_id' => $user->id]);
                    }

                    // Construir contexto para Gemini
                    $historyLog = $vocSession->history_log ?? [];
                    $profileData = $profile->toArray();

                    $totalScore = ($profileData['realistic_score'] ?? 0)
                        + ($profileData['investigative_score'] ?? 0)
                        + ($profileData['artistic_score'] ?? 0)
                        + ($profileData['social_score'] ?? 0)
                        + ($profileData['enterprising_score'] ?? 0)
                        + ($profileData['conventional_score'] ?? 0);

                    if ($totalScore === 0 && !empty($historyLog)) {
                        $profileData['_raw_history'] = $historyLog;
                    }

                    // Generar informe y recomendaciones directamente con Gemini
                    try {
                        $reportMarkdown = $this->gemini->generateReport($profileData);
                        $profesiones = $this->gemini->generateCareerRecommendations($profileData, $reportMarkdown);

                        if (!empty($profesiones) && is_array($profesiones)) {
                            foreach ($profesiones as &$profesion) {
                                if (!isset($profesion['imagenUrl']) || empty($profesion['imagenUrl'])) {
                                    $searchTerm = $this->gemini->generateImageSearchTerm($profesion['titulo']);
                                    if (empty($searchTerm)) {
                                        $searchTerm = $profesion['titulo'];
                                    }

                                    $pexelsResponse = \Illuminate\Support\Facades\Http::withHeaders([
                                        'Authorization' => config('services.pexels.key', ''),
                                    ])->get('https://api.pexels.com/v1/search', [
                                                'query' => $searchTerm,
                                                'per_page' => 1,
                                                'orientation' => 'landscape',
                                            ]);

                                    if ($pexelsResponse->successful()) {
                                        $photos = $pexelsResponse->json('photos');
                                        $profesion['imagenUrl'] = $photos[0]['src']['large2x'] ?? '/images/default-profession.jpg';
                                    } else {
                                        $profesion['imagenUrl'] = '/images/default-profession.jpg';
                                    }
                                }
                            }
                            unset($profesion);
                        }

                        // Fallback si Gemini no devuelve profesiones
                        if (empty($profesiones)) {
                            $profesiones = [
                                ['titulo' => 'Consultor de Carrera', 'descripcion' => 'Tu perfil muestra capacidades analíticas y de comunicación que encajan con la orientación profesional.', 'salidas' => 'Orientador laboral, Coach profesional, Consultor RRHH', 'nivel' => 'Grado Universitario', 'sector' => 'Servicios', 'match_porcentaje' => 75],
                                ['titulo' => 'Analista de Datos', 'descripcion' => 'Tu perfil investigativo y sistemático te posiciona bien en el mundo de los datos y la analítica.', 'salidas' => 'Data Analyst, Business Analyst, Analista BI', 'nivel' => 'Grado Universitario o FP Superior', 'sector' => 'Tecnología', 'match_porcentaje' => 70],
                                ['titulo' => 'Coordinador de Proyectos', 'descripcion' => 'Tu capacidad organizativa y de planificación encaja con la gestión de proyectos en múltiples sectores.', 'salidas' => 'Project Manager, Coordinador de área, Responsable de operaciones', 'nivel' => 'Grado Universitario', 'sector' => 'Transversal', 'match_porcentaje' => 65],
                            ];
                        }

                        // Persistir resultados para futuros accesos
                        DB::table('test_results')->insert([
                            'usuario_id' => $user->id,
                            'test_session_id' => null,
                            'answers' => json_encode($historyLog),
                            'result_text' => $reportMarkdown,
                            'profesiones' => json_encode($profesiones),
                            'saved_at' => now(),
                            'created_at' => now(),
                            'updated_at' => now(),
                        ]);

                        // Recargar resultados recién insertados
                        $results = DB::table('test_results')
                            ->where('usuario_id', $user->id)
                            ->orderBy('created_at', 'desc')
                            ->get();

                        Log::info('listResults: resultados regenerados y guardados', [
                            'usuario_id' => $user->id,
                            'count' => $results->count(),
                        ]);
                    } catch (\Throwable $ex) {
                        Log::error('listResults: error regenerando resultados: ' . $ex->getMessage());
                    }
                }
            }

            // ──────────────────────────────────────────────────────────────────

            // RECALCULAR HABILIDADES Y ESTUDIOS PARA CADA RESULTADO
            $comparador = new ProfesionComparadorService();
            $perfil = $user->perfil;

            foreach ($results as &$result) {
                if (!empty($result->profesiones)) {
                    $profesiones = json_decode($result->profesiones, true);

                    if (is_array($profesiones) && $perfil) {
                        // Recalcular para cada profesión
                        foreach ($profesiones as &$prof) {
                            $profObj = (object) $prof;
                            $profObj = $comparador->enriquecerProfesion($profObj, $perfil);

                            if (isset($profObj->habilidades_comparadas)) {
                                $prof['habilidades'] = $profObj->habilidades_comparadas;
                            }
                            if (isset($profObj->estudios_comparados)) {
                                $prof['estudios'] = $profObj->estudios_comparados;
                            }
                        }
                        unset($prof);

                        $result->profesiones = json_encode($profesiones);
                    }
                }
            }
            unset($result);

            return response()->json(['success' => true, 'results' => $results]);
        } catch (\Exception $e) {
            Log::error('Error en listResults: ' . $e->getMessage() . ' en ' . $e->getFile() . ':' . $e->getLine());
            return response()->json(['success' => false, 'error' => 'Error al obtener resultados'], 500);
        }
    }
}

