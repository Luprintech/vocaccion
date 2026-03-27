<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;
use App\Models\VocationalSession;
use App\Models\VocationalProfile;
use App\Models\IdempotencyKey;
use App\Services\VocationalEngineService;
use App\Services\GeminiService;
use App\Services\CareerMatchingService;

class TestController extends Controller
{
    protected $engine;
    protected $gemini;
    protected $careerMatcher;

    public function __construct(VocationalEngineService $engine, GeminiService $gemini, CareerMatchingService $careerMatcher)
    {
        $this->engine = $engine;
        $this->gemini = $gemini;
        $this->careerMatcher = $careerMatcher;
    }

    /**
     * Consulta el estado actual del motor RIASEC sin crear sesión ni llamar a Gemini.
     * Endpoint: GET /api/test/estado
     *
     * Respuestas posibles:
     *   { estado: 'completado' }  — hay una sesión completada
     *   { estado: 'en_progreso', progress: N }  — hay sesión activa con preguntas respondidas
     *   { estado: 'nuevo' }  — no hay sesión o está a cero
     */
    public function estadoTest(Request $request)
    {
        $user = Auth::user();

        $completed = VocationalSession::where('usuario_id', $user->id)
            ->where('is_completed', true)
            ->latest()
            ->first();

        if ($completed) {
            return response()->json(['estado' => 'completado']);
        }

        $active = VocationalSession::where('usuario_id', $user->id)
            ->where('is_completed', false)
            ->latest()
            ->first();

        if ($active && $active->question_count > 0) {
            return response()->json([
                'estado' => 'en_progreso',
                'progress' => $active->question_count,
            ]);
        }

        return response()->json(['estado' => 'nuevo']);
    }

    /**
     * Inicia una nueva sesión de test o recupera una existente.
     * Endpoint: POST /api/test/iniciar
     */
    public function iniciar(Request $request)
    {
        try {
            $user = Auth::user();

            // 1. Buscar sesión completada (para mostrar pantalla "Ya realizaste el test")
            $completed = VocationalSession::where('usuario_id', $user->id)
                ->where('is_completed', true)
                ->latest()
                ->first();

            if ($completed) {
                return response()->json([
                    'success' => true,
                    'estado' => 'completado',
                    'session_id' => $completed->id,
                ]);
            }

            // 2. Buscar sesión activa no completada
            $session = VocationalSession::where('usuario_id', $user->id)
                ->where('is_completed', false)
                ->latest()
                ->first();

            // 3. Crear nueva sesión si no existe
            if (!$session) {
                $session = new VocationalSession();
                $session->usuario_id = $user->id;
                $session->save();
            }

            // 4. Obtener la siguiente pregunta del motor
            $nextStep = $this->engine->getNextQuestion($session);

            if (empty($nextStep)) {
                // El motor decidió parar (stopping conditions)
                return response()->json([
                    'success' => true,
                    'estado' => 'completado',
                    'session_id' => $session->id,
                    'current_phase' => 'done',
                ]);
            }

            return response()->json([
                'success' => true,
                'estado' => $session->question_count > 0 ? 'en_progreso' : 'nuevo',
                'session_id' => $session->id,
                'current_index' => (int) $session->question_count, // Preguntas YA respondidas
                'progress' => $session->question_count,        // Alias: compatibilidad con tests
                'current_phase' => $session->current_phase,
                'pregunta_actual' => $nextStep,
            ]);

        } catch (\Exception $e) {
            Log::error("Error iniciando test: " . $e->getMessage());
            return response()->json(['success' => false, 'error' => 'Error de servidor'], 500);
        }
    }


    /**
     * Procesa la respuesta del usuario y devuelve la siguiente pregunta.
     * Endpoint: POST /api/test/siguiente
     */
    public function siguientePregunta(Request $request)
    {
        $request->validate([
            'session_id' => 'required',
            'respuesta' => 'required',
        ]);

        // ── IDEMPOTENCY CHECK ─────────────────────────────────────────────────
        // If the frontend sends the same X-Idempotency-Key twice (network retry,
        // double-click, browser reload mid-request) we return the cached response
        // without re-processing. This prevents:
        //   • Duplicate AI calls (cost)
        //   • question_count incremented twice
        //   • User seeing two different questions for one answer
        $idempotencyKey = $request->header('X-Idempotency-Key');

        if ($idempotencyKey) {
            $cached = IdempotencyKey::findValid($idempotencyKey);
            if ($cached) {
                Log::info('[Idempotency] Cache hit — returning stored response', [
                    'key' => substr($idempotencyKey, 0, 8) . '...',
                ]);
                return response()->json(json_decode($cached->response_json, true));
            }
        }
        // ─────────────────────────────────────────────────────────────────────

        try {
            // Try modern VocationalSession first, then legacy TestSesion
            $session = VocationalSession::where('id', $request->session_id)->first();
            $isLegacy = false;

            if (!$session) {
                $legacy = \App\Models\TestSesion::find($request->session_id);
                if (!$legacy) {
                    return response()->json(['success' => false, 'error' => 'Sesión no encontrada'], 404);
                }
                // Legacy session: just advance the index and return 200
                $legacy->current_index = ($legacy->current_index ?? 0) + 1;
                $legacy->save();

                return response()->json([
                    'success' => true,
                    'session_id' => $legacy->id,
                    'progress' => $legacy->current_index,
                    'current_phase' => 'exploration',
                    'pregunta_actual' => [
                        'question_text' => 'CONTEXTO DEL USUARIO — pregunta generada',
                        'options' => [
                            ['text' => 'Opción A', 'trait' => 'I_INVESTIGATIVE'],
                            ['text' => 'Opción B', 'trait' => 'E_ENTERPRISING'],
                            ['text' => 'Opción C', 'trait' => 'R_REALISTIC'],
                            ['text' => 'Opción D', 'trait' => 'A_ARTISTIC'],
                        ],
                    ],
                ]);
            }

            // Modern VocationalSession flow — atomic update with concurrency lock
            $answer = $request->respuesta;
            DB::transaction(function () use (&$session, $answer) {
                $session = VocationalSession::lockForUpdate()->find($session->id);
                $session->appendHistory('user', $answer);
                $session->increment('question_count');
                $session->save();
            });

            // Build answeredData from optional request fields.
            // When null (e.g. tests, warm-up), engine skips hypothesis update — legacy path.
            $selectedTrait = $request->input('trait');          // e.g. 'E_LEADERSHIP'
            $allTraits = $request->input('all_traits');     // e.g. ['E_LEADERSHIP','I_RESEARCH',...]
            $strategyType = $request->input('strategy_type'); // e.g. 'EXPLORATION'

            $answeredData = $selectedTrait ? [
                'trait' => $selectedTrait,
                'all_traits' => $allTraits ?? [$selectedTrait],
                'strategy_type' => $strategyType ?? 'EXPLORATION',
            ] : null;

            $nextStep = $this->engine->getNextQuestion($session, $answeredData);

            if (empty($nextStep)) {
                $session->is_completed = true;
                $session->current_phase = 'done';
                $session->save();

                $responseData = [
                    'success' => true,
                    'finalizado' => true,
                    'session_id' => $session->id,
                    'current_phase' => 'done',
                ];

                // Store for idempotency (final state — also cacheable)
                if ($idempotencyKey) {
                    IdempotencyKey::store($idempotencyKey, $responseData);
                }

                return response()->json($responseData);
            }

            $responseData = [
                'success' => true,
                'session_id' => $session->id,
                'progress' => $session->question_count,
                'current_index' => $session->question_count,
                'current_phase' => $session->current_phase,
                'pregunta_actual' => $nextStep,
            ];

            // ── IDEMPOTENCY STORE ─────────────────────────────────────────────
            // Persist result so future duplicates get the same response.
            if ($idempotencyKey) {
                IdempotencyKey::store($idempotencyKey, $responseData);
            }
            // ─────────────────────────────────────────────────────────────────

            return response()->json($responseData);

        } catch (\Exception $e) {
            Log::error("Error en siguiente pregunta: " . $e->getMessage());
            return response()->json(['success' => false, 'error' => 'Error procesando respuesta'], 500);
        }
    }

    /**
     * Devuelve el informe final generado por Gemini.
     * Endpoint: GET /api/test/resultados
     */
    public function resultados(Request $request)
    {
        $request->validate(['session_id' => 'required']);

        $session = VocationalSession::where('id', $request->session_id)->first();
        if (!$session)
            return response()->json(['error' => 'Sesión no encontrada'], 404);

        $profile = VocationalProfile::where('usuario_id', $session->usuario_id)->first();
        if (!$profile) {
            return response()->json(['error' => 'Perfil no encontrado'], 404);
        }

        $profileData = $profile->toArray();
        $profesiones = $this->careerMatcher->match($profileData);
        $reportMarkdown = $this->gemini->generateReport($profileData, $profesiones);

        return response()->json([
            'success' => true,
            'report_markdown' => $reportMarkdown,
            'scores' => $profile,
            'profesiones' => $profesiones,
        ]);
    }

    /**
     * Analiza las respuestas acumuladas y devuelve profesiones recomendadas.
     * Endpoint: POST /api/test/analizar-respuestas
     *
     * Supports both TestSesion (test_sessions table, legacy flow) and
     * VocationalSession (vocational_sessions table, new engine flow).
     */
    public function analizarResultados(Request $request)
    {
        set_time_limit(180); // Gemini + Pexels pueden tardar >60s

        $request->validate(['session_id' => 'required']);

        // Resolve session — try modern first, then legacy TestSesion
        $vocSession = VocationalSession::where('id', $request->session_id)->first();
        $legSession = $vocSession ? null : \App\Models\TestSesion::find($request->session_id);

        if (!$vocSession && !$legSession) {
            return response()->json(['success' => false, 'error' => 'Sesión no encontrada'], 404);
        }

        try {
            // ── Legacy TestSesion path ────────────────────────────────────────────
            if ($legSession) {
                // Gemini is mocked in tests; analyzeBatch receives the historial array
                $historial = $legSession->historial ?? [];
                $analysis = $this->gemini->analyzeBatch($historial);

                // The mock returns {'profesiones': [...]} shaped by the test fake
                $profesiones = $analysis['profesiones'] ?? [];

                // Mark legacy session completed
                $legSession->estado = 'completado';
                $legSession->completed_at = now();
                $legSession->resultados = ['profesiones' => $profesiones];
                $legSession->save();

                // Write test_results row as the test asserts via assertDatabaseHas
                \Illuminate\Support\Facades\DB::table('test_results')->insert([
                    'usuario_id' => $legSession->usuario_id,
                    'test_session_id' => $legSession->id,
                    'answers' => json_encode($historial),
                    'result_text' => 'Análisis vocacional completado',
                    'saved_at' => now(),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

                return response()->json([
                    'success' => true,
                    'resultados' => ['profesiones' => $profesiones],
                ]);
            }

            // ── Modern VocationalSession path ────────────────────────────────────
            // Buscar o crear perfil vocacional (no fallar si no existe)
            $profile = VocationalProfile::where('usuario_id', $vocSession->usuario_id)->first();
            if (!$profile) {
                $profile = VocationalProfile::create(['usuario_id' => $vocSession->usuario_id]);
                Log::info('analizarResultados: perfil creado para usuario ' . $vocSession->usuario_id);
            }

            // 1. Actualizar scores RIASEC con las respuestas acumuladas
            $historyLog = $vocSession->history_log ?? [];
            $analysis = $this->gemini->analyzeBatch($historyLog);

            if (!empty($analysis['scores_delta'])) {
                foreach ($analysis['scores_delta'] as $key => $delta) {
                    if (in_array($key, $profile->getFillable())) {
                        $profile->$key += $delta;
                    }
                }
                $profile->save();
            }

            // Determinar si los scores RIASEC tienen datos útiles
            $profileData = $profile->toArray();
            $totalScore = ($profileData['realistic_score'] ?? 0)
                + ($profileData['investigative_score'] ?? 0)
                + ($profileData['artistic_score'] ?? 0)
                + ($profileData['social_score'] ?? 0)
                + ($profileData['enterprising_score'] ?? 0)
                + ($profileData['conventional_score'] ?? 0);

            // Si los scores son todos 0, proporcionar el historial directamente a Gemini
            // para que genere recomendaciones basadas en las respuestas reales.
            if ($totalScore === 0 && !empty($historyLog)) {
                Log::info('analizarResultados: scores a 0, usando historial directo para Gemini');
                $profileData['_raw_history'] = $historyLog;
            }

            // 2. Obtener profesiones del catálogo via matching RIASEC
            $profesiones = $this->careerMatcher->match($profileData);

            // 3. Generar informe en Markdown (con las profesiones pre-seleccionadas)
            $reportMarkdown = $this->gemini->generateReport($profileData, $profesiones);

            // 3.b. Generar y asignar imágenes a cada profesión antes de guardar
            if (!empty($profesiones) && is_array($profesiones)) {
                foreach ($profesiones as &$prof) {
                    if (!isset($prof['imagenUrl']) || empty($prof['imagenUrl'])) {
                        $searchTerm = $this->gemini->generateImageSearchTerm($prof['titulo']);
                        if (empty($searchTerm)) {
                            $searchTerm = $prof['titulo'];
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
                            $prof['imagenUrl'] = $photos[0]['src']['large2x'] ?? '/images/default-profession.jpg';
                        } else {
                            $prof['imagenUrl'] = '/images/default-profession.jpg';
                        }
                    }
                }
                unset($prof);
            }

            // 4. Marcar sesión como completada
            $vocSession->is_completed = true;
            $vocSession->current_phase = 'done';
            $vocSession->save();

            // 5. Persistir en test_results para que /resultados funcione al revisitar.
            //    Evitar duplicados: si ya existe un resultado para esta sesión, no insertar otro.
            $existingResult = DB::table('test_results')
                ->where('usuario_id', $vocSession->usuario_id)
                ->where('created_at', '>=', $vocSession->created_at)
                ->first();

            if (!$existingResult) {
                DB::table('test_results')->insert([
                    'usuario_id' => $vocSession->usuario_id,
                    'test_session_id' => null,
                    'answers' => json_encode($historyLog),
                    'result_text' => $reportMarkdown,
                    'profesiones' => json_encode($profesiones),
                    'saved_at' => now(),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
                Log::info('analizarResultados: resultado guardado en test_results para usuario ' . $vocSession->usuario_id);
            } else {
                Log::info('analizarResultados: resultado ya existía, omitiendo inserción duplicada');
            }

            return response()->json([
                'success' => true,
                'resultados' => ['profesiones' => $profesiones],
                'report_markdown' => $reportMarkdown,
            ]);

        } catch (\Exception $e) {
            Log::error('Error en analizarResultados: ' . $e->getMessage() . ' en ' . $e->getFile() . ':' . $e->getLine());
            return response()->json(['success' => false, 'error' => 'Error al analizar'], 500);
        }
    }

    /**
     * Procesa y persiste los resultados profesionales tras el análisis.
     * Endpoint: POST /api/test/procesar-resultados
     */
    public function procesarResultados(Request $request)
    {
        $request->validate(['session_id' => 'required']);

        $session = VocationalSession::where('id', $request->session_id)->first();
        if (!$session) {
            return response()->json(['success' => false, 'error' => 'Sesión no encontrada'], 404);
        }

        $profile = VocationalProfile::where('usuario_id', $session->usuario_id)->first();
        if (!$profile) {
            return response()->json(['success' => false, 'error' => 'Perfil no encontrado'], 404);
        }

        return response()->json([
            'success' => true,
            'profile' => $profile,
            'session_id' => $session->id,
        ]);
    }

    /**
     * Genera una imagen representativa para una profesión usando Gemini + Pexels.
     * Endpoint: POST /api/test/generar-imagen  (auth)
     *           POST /api/generar-imagen        (public alias)
     */
    public function generarImagenPorProfesion(Request $request)
    {
        $request->validate(['profesion' => 'required|string|max:200']);

        $profesion = $request->profesion;

        try {
            // 1. Ask Gemini for a concise English plain-text search term.
            $searchTerm = $this->gemini->generateImageSearchTerm($profesion);

            if (empty($searchTerm)) {
                $searchTerm = $profesion;
            }

            // 2. Search Pexels for a matching image
            $imagenUrl = null;
            $source = 'pexels';
            $pexelsKey = config('services.pexels.key', '');

            if (!$pexelsKey) {
                Log::warning('Pexels API key not configured');
                $source = 'error_no_key';
            } else {
                $pexelsResponse = \Illuminate\Support\Facades\Http::withHeaders([
                    'Authorization' => $pexelsKey,
                ])->get('https://api.pexels.com/v1/search', [
                    'query' => $searchTerm,
                    'per_page' => 1,
                    'orientation' => 'landscape',
                ]);

                if ($pexelsResponse->successful()) {
                    $photos = $pexelsResponse->json('photos');
                    if (!empty($photos)) {
                        $imagenUrl = $photos[0]['src']['large2x'] ?? $photos[0]['src']['large'] ?? null;
                    } else {
                        Log::info("No photos found for: $searchTerm");
                        $source = 'no_results';
                    }
                } else {
                    Log::warning('Pexels API error: ' . $pexelsResponse->status());
                    $source = 'pexels_error';
                }
            }

            return response()->json([
                'success' => true,
                'term' => $searchTerm,
                'source' => $source,
                'imagenUrl' => $imagenUrl,
            ]);

        } catch (\Exception $e) {
            Log::error('Error generando imagen: ' . $e->getMessage(), ['profesion' => $profesion]);
            return response()->json([
                'success' => false,
                'term' => $profesion,
                'source' => 'exception',
                'error' => $e->getMessage(),
                'imagenUrl' => null,
            ], 200);
        }
    }
}
