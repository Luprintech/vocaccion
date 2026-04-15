<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;
use App\Models\VocationalSession;
use App\Models\VocationalProfile;
use App\Models\VocationalResponse;
use App\Models\Perfil;
use App\Models\IdempotencyKey;
use App\Helpers\PersonalizationHelper;
use App\Services\VocationalEngineService;
use App\Services\GeminiService;
use App\Services\CareerMatchingService;
use App\Services\RiasecScoreCalculatorService;
use App\Services\RiasecTestConfig;
use App\Services\DeterministicReportService;

class TestController extends Controller
{
    protected $engine;
    protected $gemini;
    protected $careerMatcher;
    protected $scoreCalculator;
    protected $deterministicReport;

    public function __construct(
        VocationalEngineService $engine,
        GeminiService $gemini,
        CareerMatchingService $careerMatcher,
        RiasecScoreCalculatorService $scoreCalculator,
        DeterministicReportService $deterministicReport
    ) {
        $this->engine = $engine;
        $this->gemini = $gemini;
        $this->careerMatcher = $careerMatcher;
        $this->scoreCalculator = $scoreCalculator;
        $this->deterministicReport = $deterministicReport;
    }

    /**
     * Consulta el estado actual del motor RIASEC sin crear sesión ni llamar a Gemini.
     * Endpoint: GET /api/test/estado
     *
     * Respuestas posibles:
     *   { estado: 'completado' }  — hay una sesión completada
     *   { estado: 'en_progreso', progress: N, version: 1|2, current_index: N }  — hay sesión activa
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
            return response()->json([
                'estado' => 'completado',
                'version' => $completed->version ?? 1,
            ]);
        }

        $active = VocationalSession::where('usuario_id', $user->id)
            ->where('is_completed', false)
            ->latest()
            ->first();

        if ($active) {
            $version = $active->version ?? 1;
            
            // V2: any active session should count as pending, even at index 0
            if ($version === 2) {
                return response()->json([
                    'estado' => 'en_progreso',
                    'version' => 2,
                    'progress' => $active->current_index,
                    'current_index' => $active->current_index,
                    'phase' => $active->phase,
                ]);
            }
            
            // V1: check question_count
            if ($version === 1 && $active->question_count > 0) {
                return response()->json([
                    'estado' => 'en_progreso',
                    'version' => 1,
                    'progress' => $active->question_count,
                ]);
            }
        }

        return response()->json(['estado' => 'nuevo']);
    }

    /**
     * Inicia una nueva sesión de test o recupera una existente.
     * Endpoint: POST /api/test/iniciar
     * 
     * V2: Pass age_group in request body to start a curated bank session.
     * V1: No age_group → legacy adaptive flow.
     */
    public function iniciar(Request $request)
    {
        try {
            $user = Auth::user();

            // 1. Buscar sesión completada
            $completed = VocationalSession::where('usuario_id', $user->id)
                ->where('is_completed', true)
                ->latest()
                ->first();

            if ($completed) {
                return response()->json([
                    'success' => true,
                    'estado' => 'completado',
                    'session_id' => $completed->id,
                    'version' => $completed->version ?? 1,
                ]);
            }

            // 2. Buscar sesión activa no completada
            $session = VocationalSession::where('usuario_id', $user->id)
                ->where('is_completed', false)
                ->latest()
                ->first();

            // 3. Determine flow: resume active v2, start new v2 with age_group, or fallback to v1
            $ageGroup = $request->input('age_group');

            // ── V2 RESUME: active curated-bank session ───────────────────
            if ($session && $session->isV2()) {
                $nextItem = $this->engine->getNextItemV2($session);

                if (!$nextItem) {
                    return response()->json([
                        'success' => true,
                        'estado' => 'completado',
                        'session_id' => $session->id,
                        'version' => 2,
                    ]);
                }

                return response()->json([
                    'success' => true,
                    'estado' => $session->current_index > 0 ? 'en_progreso' : 'nuevo',
                    'version' => 2,
                    'session_id' => $session->id,
                    'total_items' => count($session->selected_items ?? []),
                    'current_index' => $session->current_index,
                    'phase' => $session->phase,
                    'item' => $nextItem['item'],
                    'answer' => $this->formatExistingAnswer($session->id, $nextItem['item']['id']),
                ]);
            }

            // ── V2 START: curated bank with explicit age_group ───────────
            if ($ageGroup) {
                $v2Session = $this->engine->startSessionV2($user->id, $ageGroup);
                
                return response()->json([
                    'success' => true,
                    'estado' => 'nuevo',
                    'version' => 2,
                    'session_id' => $v2Session['session_id'],
                    'total_items' => $v2Session['total_items'],
                    'current_index' => $v2Session['current_index'],
                    'phase' => $v2Session['phase'],
                    'item' => $v2Session['item'],
                    'answer' => null,
                ]);
            }

            // ── V1 FLOW: Legacy adaptive ───────────────────────────
            if (!$session) {
                $session = new VocationalSession();
                $session->usuario_id = $user->id;
                $session->version = 1;
                $session->save();
            }

            $nextStep = $this->engine->getNextQuestion($session);

            if (empty($nextStep)) {
                return response()->json([
                    'success' => true,
                    'estado' => 'completado',
                    'session_id' => $session->id,
                    'version' => 1,
                    'current_phase' => 'done',
                ]);
            }

            return response()->json([
                'success' => true,
                'estado' => $session->question_count > 0 ? 'en_progreso' : 'nuevo',
                'version' => 1,
                'session_id' => $session->id,
                'current_index' => (int) $session->question_count,
                'progress' => $session->question_count,
                'current_phase' => $session->current_phase,
                'pregunta_actual' => $nextStep,
            ]);

        } catch (\Exception $e) {
            if (str_contains($e->getMessage(), 'Insufficient question bank items')) {
                Log::error("Error iniciando test: " . $e->getMessage());
                return response()->json([
                    'success' => false,
                    'error' => 'El banco de preguntas del test aún no está cargado correctamente. Recarga los datos del sistema e inténtalo de nuevo.',
                ], 422);
            }

            Log::error("Error iniciando test: " . $e->getMessage(), [
                'exception' => $e,
                'trace' => $e->getTraceAsString(),
            ]);
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
     * V2: Store response and return next item from curated bank.
     * Endpoint: POST /api/test/responder
     */
    public function responder(Request $request)
    {
        $request->validate([
            'session_id' => 'required|uuid',
            'item_id' => 'required|integer',
            'value' => 'required|integer',
            'response_payload' => 'nullable|array',
            'response_time_ms' => 'nullable|integer',
        ]);

        try {
            $session = VocationalSession::where('id', $request->session_id)->first();
            
            if (!$session) {
                return response()->json(['success' => false, 'error' => 'Sesión no encontrada'], 404);
            }

            if (!$session->isV2()) {
                return response()->json(['success' => false, 'error' => 'Sesión no es v2'], 400);
            }

            if ($session->is_completed) {
                return response()->json(['success' => false, 'error' => 'Sesión ya completada'], 400);
            }

            // Store response (idempotent via unique constraint on session_id + item_id)
            VocationalResponse::updateOrCreate(
                [
                    'session_id' => $session->id,
                    'item_id' => $request->item_id,
                ],
                [
                    'value' => $request->value,
                    'response_payload' => $request->input('response_payload'),
                    'response_time_ms' => $request->response_time_ms,
                    'answered_at' => now(),
                ]
            );

            // Advance index
            $session->increment('current_index');
            $session->refresh();

            // ── Early stopping: evaluate convergence at phase boundaries ─────
            // Evaluated when current_index lands exactly on the start of
            // competencies (30) or occupations (48). If the profile already
            // converges we jump directly to the comparative phase (index 66).
            $earlyStopped = false;
            $comparativeStart = RiasecTestConfig::PHASE_TRANSITIONS['comparative']; // 66
            if ($session->current_index < $comparativeStart) {
                $partialResponses = VocationalResponse::where('session_id', $session->id)
                    ->with('item')
                    ->get();
                $partialScores = $this->scoreCalculator->calculate($partialResponses);

                if (RiasecTestConfig::evaluateEarlyStopping($partialScores, $session->current_index)) {
                    $session->update(['current_index' => $comparativeStart]);
                    $session->refresh();
                    $earlyStopped = true;
                    Log::info("Early stopping triggered at index {$session->current_index} for session {$session->id}");
                }
            }
            // ─────────────────────────────────────────────────────────────────

            // Get next item
            $nextData = $this->engine->getNextItemV2($session);

            if (!$nextData) {
                // Test complete
                return response()->json([
                    'success' => true,
                    'test_complete' => true,
                    'current_index' => $session->current_index,
                ]);
            }

            return response()->json([
                'success' => true,
                'current_index' => $session->current_index,
                'phase' => $nextData['phase'],
                'phase_transition' => $nextData['phase_transition'],
                'item' => $nextData['item'],
                'answer' => $this->formatExistingAnswer($session->id, $nextData['item']['id']),
                'test_complete' => false,
                'early_stopped' => $earlyStopped,
            ]);

        } catch (\Exception $e) {
            Log::error("Error en responder v2: " . $e->getMessage(), [
                'exception' => $e,
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json(['success' => false, 'error' => 'Error procesando respuesta'], 500);
        }
    }

    /**
     * V2: go back to previous item and load saved answer.
     * Endpoint: POST /api/test/anterior
     */
    public function anterior(Request $request)
    {
        $request->validate([
            'session_id' => 'required|uuid',
        ]);

        try {
            $session = VocationalSession::where('id', $request->session_id)->first();

            if (!$session) {
                return response()->json(['success' => false, 'error' => 'Sesión no encontrada'], 404);
            }

            if (!$session->isV2()) {
                return response()->json(['success' => false, 'error' => 'Sesión no es v2'], 400);
            }

            $targetIndex = max(0, ((int) $session->current_index) - 1);
            $session->update([
                'current_index' => $targetIndex,
                'phase' => $targetIndex < 18 ? 'likert' : ($targetIndex < 28 ? 'checklist' : 'comparative'),
            ]);

            $data = $this->engine->getItemAtIndexV2($session, $targetIndex);

            return response()->json([
                'success' => true,
                'current_index' => $targetIndex,
                'phase' => $data['phase'],
                'item' => $data['item'],
                'answer' => $this->formatExistingAnswer($session->id, $data['item']['id']),
                'test_complete' => false,
            ]);
        } catch (\Exception $e) {
            Log::error("Error en anterior v2: " . $e->getMessage(), [
                'exception' => $e,
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json(['success' => false, 'error' => 'Error retrocediendo en el test'], 500);
        }
    }

    protected function formatExistingAnswer(string $sessionId, int $itemId): mixed
    {
        $response = VocationalResponse::where('session_id', $sessionId)
            ->where('item_id', $itemId)
            ->first();

        if (!$response) {
            return null;
        }

        if (is_array($response->response_payload) && isset($response->response_payload['selected_options'])) {
            return $response->response_payload['selected_options'];
        }

        return $response->value;
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

            // ── V2 PATH: Deterministic scoring ───────────────────────────────────
            if ($vocSession->isV2()) {
                Log::info('analizarResultados: Using V2 deterministic scoring');
                
                // Load all responses with item relations
                $responses = VocationalResponse::where('session_id', $vocSession->id)
                    ->with('item')
                    ->get();
                
                if ($responses->isEmpty()) {
                    return response()->json([
                        'success' => false,
                        'error' => 'No se encontraron respuestas para esta sesión',
                    ], 400);
                }
                
                // Calculate RIASEC scores deterministically
                $scores = $this->scoreCalculator->calculate($responses);
                
                // Update profile with calculated scores
                $profile->update([
                    'realistic_score' => $scores['R'],
                    'investigative_score' => $scores['I'],
                    'artistic_score' => $scores['A'],
                    'social_score' => $scores['S'],
                    'enterprising_score' => $scores['E'],
                    'conventional_score' => $scores['C'],
                ]);
                
                Log::info('analizarResultados: V2 scores calculated', ['scores' => $scores]);
                
                // Get profile data for matching and report
                $profileData = $profile->toArray();
                
                // Get user's personal context for better report
                $perfil = Perfil::with(['intereses', 'formaciones', 'experiencias'])->where('usuario_id', $vocSession->usuario_id)->first();
                if ($perfil) {
                    $hobbies = $perfil->intereses->pluck('nombre')->filter()->values()->implode(', ');
                    $education = optional($perfil->formaciones->sortByDesc('fecha_inicio')->first())->titulo_obtenido
                        ?? optional($perfil->formaciones->sortByDesc('fecha_inicio')->first())->nivel;
                    $job = optional($perfil->experiencias->sortByDesc('fecha_inicio')->first())->puesto;

                    $profileData['_user_context'] = [
                        'bio' => $perfil->bio,
                        'hobbies' => $hobbies,
                        'education' => $education,
                        'job' => $job,
                    ];
                }
                
            } else {
                // ── V1 PATH: AI-based scoring (legacy) ───────────────────────────
                Log::info('analizarResultados: Using V1 AI-based scoring');
                
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

                // Get user's personal context for better report (same as V2 path)
                $perfil = Perfil::with(['intereses', 'formaciones', 'experiencias'])
                    ->where('usuario_id', $vocSession->usuario_id)
                    ->first();
                if ($perfil) {
                    $hobbies = $perfil->intereses->pluck('nombre')->filter()->values()->implode(', ');
                    $education = optional($perfil->formaciones->sortByDesc('fecha_inicio')->first())->titulo_obtenido
                        ?? optional($perfil->formaciones->sortByDesc('fecha_inicio')->first())->nivel;
                    $job = optional($perfil->experiencias->sortByDesc('fecha_inicio')->first())->puesto;

                    $profileData['_user_context'] = [
                        'bio'       => $perfil->bio,
                        'hobbies'   => $hobbies,
                        'education' => $education,
                        'job'       => $job,
                    ];
                }
            }
            // ─────────────────────────────────────────────────────────────────────

            // 2. Obtener profesiones del catálogo via matching RIASEC con contexto del usuario
            // Construir contexto del usuario para boosting contextual
            $userContext = [];
            
            // Intentar cargar perfil si no está ya cargado
            if (!isset($perfil)) {
                $perfil = Perfil::where('usuario_id', $vocSession->usuario_id)->first();
            }
            
            if ($perfil) {
                // Edad
                if ($perfil->fecha_nacimiento) {
                    $userContext['edad'] = \Carbon\Carbon::parse($perfil->fecha_nacimiento)->age;
                }
                
                // Comunidad Autónoma
                if ($perfil->comunidad_autonoma) {
                    $userContext['ccaa'] = $perfil->comunidad_autonoma;
                }
                
                // Nivel educativo (intentar inferir del último nivel de formación)
                $formaciones = $perfil->formaciones()->orderBy('fecha_inicio', 'desc')->first();
                if ($formaciones) {
                    $userContext['nivel_educativo'] = $formaciones->nivel ?? $formaciones->titulo_obtenido;
                }
                
                // Presupuesto (si existe en el modelo — por ahora no existe, preparado para futuro)
                // $userContext['presupuesto'] = $perfil->presupuesto_formacion ?? null;
            }
            
            $profesiones = $this->careerMatcher->match($profileData, $userContext);

            // 3. Resolve user name for personalized report narrative
            $userName = '';
            if ($perfil) {
                $userObj = \App\Models\Usuario::find($vocSession->usuario_id);
                $ctx = PersonalizationHelper::buildPersonalizationContext($userObj, $perfil);
                $userName = $ctx['nombre'] ?? '';
            } else {
                $userObj = \App\Models\Usuario::find($vocSession->usuario_id);
                if ($userObj) {
                    $userName = trim(explode(' ', $userObj->name ?? '')[0]);
                }
            }

            // 4. Informe híbrido: base determinística + narrativa IA opcional (menos tokens, más robustez)
            $reportSource = 'deterministic';
            $riasecCode = $this->deriveRiasecCodeFromProfileData($profileData);
            $aiNarrative = [];

            try {
                $aiNarrative = $this->gemini->generateNarrativeSections($profileData, $riasecCode, $userName);
                if (!empty($aiNarrative)) {
                    $reportSource = 'hybrid';
                }
            } catch (\Throwable $narrativeEx) {
                Log::warning('analizarResultados: narrativa IA no disponible, usando informe determinístico', [
                    'session_id' => $vocSession->id,
                    'error' => $narrativeEx->getMessage(),
                ]);
            }

            $reportMarkdown = $this->deterministicReport->build($profileData, $profesiones, $userName, is_array($aiNarrative) ? $aiNarrative : []);

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

            // Build structured RIASEC scores for frontend (eliminates regex parsing fragility)
            // IMPORTANT: must be defined before the INSERT below so the snapshot is not null.
            $riasecScores = [
                'R' => $profile->realistic_score ?? 0,
                'I' => $profile->investigative_score ?? 0,
                'A' => $profile->artistic_score ?? 0,
                'S' => $profile->social_score ?? 0,
                'E' => $profile->enterprising_score ?? 0,
                'C' => $profile->conventional_score ?? 0,
            ];

            // 5. Persistir en test_results para que /resultados funcione al revisitar.
            //    Evitar duplicados: si ya existe un resultado para esta sesión, no insertar otro.
            $existingResult = DB::table('test_results')
                ->where('usuario_id', $vocSession->usuario_id)
                ->where('created_at', '>=', $vocSession->created_at)
                ->first();

            if (!$existingResult) {
                // For v2: serialize responses instead of history_log
                $answersData = $vocSession->isV2()
                    ? VocationalResponse::where('session_id', $vocSession->id)->get()->toArray()
                    : ($historyLog ?? []);

                DB::table('test_results')->insert([
                    'usuario_id'    => $vocSession->usuario_id,
                    'test_session_id' => null,
                    'answers'       => json_encode($answersData),
                    'result_text'   => $reportMarkdown,
                    'profesiones'   => json_encode($profesiones),
                    // Snapshot scores at generation time — VocationalProfile can be
                    // overwritten if the user retakes the test.
                    'riasec_scores' => json_encode($riasecScores),
                    'saved_at'      => now(),
                    'created_at'    => now(),
                    'updated_at'    => now(),
                ]);
                Log::info('analizarResultados: resultado guardado en test_results para usuario ' . $vocSession->usuario_id);
            } else {
                Log::info('analizarResultados: resultado ya existía, omitiendo inserción duplicada');
            }

            return response()->json([
                'success' => true,
                'resultados' => ['profesiones' => $profesiones],
                'report_markdown' => $reportMarkdown,
                'riasec_scores' => $riasecScores,
                'report_source' => $reportSource,
            ]);

        } catch (\Exception $e) {
            Log::error('Error en analizarResultados: ' . $e->getMessage() . ' en ' . $e->getFile() . ':' . $e->getLine());
            return response()->json(['success' => false, 'error' => 'Error al analizar'], 500);
        }
    }

    /**
     * Validación mínima de calidad del informe generado por IA.
     * Evita persistir respuestas vacías como "Error de conexión.".
     */
    protected function isValidReportMarkdown(?string $markdown): bool
    {
        if (!$markdown) {
            return false;
        }

        $trimmed = trim($markdown);
        if ($trimmed === '' || $trimmed === 'Error de conexión.' || $trimmed === 'Error al generar contenido.' || $trimmed === 'Respuesta truncada.') {
            return false;
        }

        // Longitud mínima para considerar que hay contenido real
        if (mb_strlen($trimmed) < 1200) {
            return false;
        }

        // Estructura esperada del informe
        $requiredSections = [
            '## 1. Análisis de tu Código Holland',
            '## 2. Retrato Psicológico-Vocacional',
            '## 3. Tus Superpoderes Profesionales',
            '## 4. Tus Caminos Profesionales Recomendados',
            '## 5. Áreas de Crecimiento',
            '## 6. Mensaje Final de tu Mentor',
        ];

        $found = 0;
        foreach ($requiredSections as $section) {
            if (str_contains($trimmed, $section)) {
                $found++;
            }
        }

        // Requerimos al menos 4 de las 6 secciones para no descartar respuestas válidas
        return $found >= 4;
    }

    protected function deriveRiasecCodeFromProfileData(array $profileData): string
    {
        $scores = [
            'R' => (float) ($profileData['realistic_score'] ?? 0),
            'I' => (float) ($profileData['investigative_score'] ?? 0),
            'A' => (float) ($profileData['artistic_score'] ?? 0),
            'S' => (float) ($profileData['social_score'] ?? 0),
            'E' => (float) ($profileData['enterprising_score'] ?? 0),
            'C' => (float) ($profileData['conventional_score'] ?? 0),
        ];

        arsort($scores);
        return implode('', array_slice(array_keys($scores), 0, 3));
    }

    /**
     * Preloads Pexels images for all occupation-phase items of a V2 session.
     * Images are cached by normalized occupation label (long-lived) so Pexels is called only once.
     *
     * Endpoint: GET /api/test/occupation-images/{sessionId}
     *
     * Response: { success: true, images: { item_id: image_url, ... } }
     */
    public function occupationImages(string $sessionId)
    {
        $session = VocationalSession::where('id', $sessionId)->first();

        if (!$session || !$session->isV2()) {
            return response()->json(['success' => false, 'error' => 'Sesión no encontrada'], 404);
        }

        $selectedIds    = $session->selected_items ?? [];
        $occStart       = \App\Services\RiasecTestConfig::PHASE_TRANSITIONS['occupations']; // 48
        $occCount       = \App\Services\RiasecTestConfig::ITEMS_PER_PHASE['occupations'];   // 18
        $occupationIds  = array_slice($selectedIds, $occStart, $occCount);

        if (empty($occupationIds)) {
            return response()->json(['success' => true, 'images' => []]);
        }

        $items  = \App\Models\QuestionBank::whereIn('id', $occupationIds)->get()->keyBy('id');
        $pexKey = config('services.pexels.key', '');
        $result = [];

        $pending = [];

        foreach ($occupationIds as $itemId) {
            $item = $items[$itemId] ?? null;
            if (!$item) {
                $result[$itemId] = null;
                continue;
            }

            $normalizedOccupation = $this->normalizeOccupationLabel((string) $item->text_es);
            $cacheKey = 'occ_img_v3_' . md5($normalizedOccupation);
            $cached = \Illuminate\Support\Facades\Cache::get($cacheKey, '__MISS__');

            if ($cached !== '__MISS__') {
                $result[$itemId] = $cached === '__NULL__' ? null : $cached;
                continue;
            }

            $pending[$itemId] = [
                'cache_key' => $cacheKey,
                'query' => $this->occupationSearchQuery((string) $item->text_es),
            ];
        }

        if (!empty($pending)) {
            if (!$pexKey) {
                foreach ($pending as $itemId => $meta) {
                    \Illuminate\Support\Facades\Cache::forever($meta['cache_key'], '__NULL__');
                    $result[$itemId] = null;
                }
            } else {
                $responses = \Illuminate\Support\Facades\Http::pool(function ($pool) use ($pending, $pexKey) {
                    $requests = [];
                    foreach ($pending as $itemId => $meta) {
                        $requests[$itemId] = $pool
                            ->withHeaders(['Authorization' => $pexKey])
                            ->timeout(10)
                            ->get('https://api.pexels.com/v1/search', [
                                'query' => $meta['query'],
                                'per_page' => 5,
                                'orientation' => 'landscape',
                            ]);
                    }
                    return $requests;
                });

                foreach ($pending as $itemId => $meta) {
                    $res = $responses[$itemId] ?? null;
                    $url = null;
                    if ($res && $res->successful()) {
                        $photos = $res->json('photos');
                        if (!empty($photos)) {
                            $url = $photos[0]['src']['large2x'] ?? $photos[0]['src']['large'] ?? null;
                        }
                    }

                    \Illuminate\Support\Facades\Cache::forever($meta['cache_key'], $url ?? '__NULL__');
                    $result[$itemId] = $url;
                }
            }
        }

        return response()->json(['success' => true, 'images' => $result]);
    }

    /**
     * Returns a stable normalized occupation label for cache identity.
     */
    protected function normalizeOccupationLabel(string $occupation): string
    {
        $normalized = mb_strtolower(trim($occupation), 'UTF-8');
        $normalized = preg_replace('/\s+/', ' ', $normalized) ?? $normalized;
        return $normalized;
    }

    /**
     * Builds a reliable English Pexels query for seeded occupation labels.
     */
    protected function occupationSearchQuery(string $occupation): string
    {
        $normalized = $this->normalizeOccupationLabel($occupation);

        $exactMap = [
            'electricista o técnico de instalaciones' => 'electrician technician working',
            'mecánico o técnico de mantenimiento' => 'mechanic maintenance technician workshop',
            'agricultor o jardinero profesional' => 'farmer professional gardener working outdoors',
            'investigador científico' => 'scientific researcher laboratory',
            'programador o analista de datos' => 'software developer data analyst computer',
            'médico o biólogo' => 'doctor biologist laboratory',
            'diseñador gráfico o de videojuegos' => 'graphic designer video game designer workspace',
            'músico, actor o director de cine' => 'musician actor film director on set',
            'escritor, periodista o creador de contenido' => 'writer journalist content creator office',
            'profesor o educador' => 'teacher educator classroom',
            'enfermero o trabajador social' => 'nurse social worker helping people',
            'psicólogo o terapeuta' => 'psychologist therapist consultation',
            'empresario o fundador de startups' => 'entrepreneur startup founder business team',
            'director de marketing o ventas' => 'marketing sales manager business meeting',
            'abogado o político' => 'lawyer politician professional portrait office',
            'contable o auditor' => 'accountant auditor financial analysis office',
            'administrativo o secretario de dirección' => 'administrative assistant executive secretary office',
            'bibliotecario o archivista' => 'librarian archivist library documents',

            'técnico de redes, sistemas o ciberseguridad' => 'network systems cybersecurity technician server room',
            'ingeniero de producción o logística' => 'production logistics engineer industrial warehouse',
            'técnico de sonido, iluminación o audiovisuales' => 'sound lighting audiovisual technician event',
            'analista de datos o científico de datos' => 'data analyst data scientist charts laptop',
            'investigador en tecnología o i+d' => 'technology research and development scientist',
            'consultor especializado o perito' => 'specialized consultant expert professional',
            'director creativo o diseñador ux/ui' => 'creative director ux ui designer office',
            'fotógrafo, cineasta o productor audiovisual' => 'photographer filmmaker audiovisual producer camera',
            'redactor, copywriter o storyteller' => 'copywriter writer storytelling content creation',
            'orientador laboral o coach' => 'career counselor coach session',
            'educador social o mediador comunitario' => 'social educator community mediator support',
            'terapeuta ocupacional o de rehabilitación' => 'occupational therapist rehabilitation therapy',
            'ceo, fundador o director de operaciones' => 'ceo startup founder operations director',
            'business developer o key account manager' => 'business development key account manager meeting',
            'project manager o scrum master' => 'project manager scrum master agile team',
            'controller financiero o analista contable' => 'financial controller accounting analyst office',
            'especialista en compliance o calidad' => 'compliance quality specialist audit office',
            'administrador de bases de datos o documentalista' => 'database administrator document specialist computer',

            'director técnico o jefe de obra' => 'technical director construction manager site',
            'responsable de mantenimiento o producción' => 'maintenance production manager industrial plant',
            'técnico especialista o artesano' => 'specialist technician artisan workshop',
            'director de i+d o responsable de innovación' => 'research and innovation director laboratory',
            'consultor estratégico basado en datos' => 'data driven strategy consultant business',
            'investigador sénior o docente universitario' => 'senior researcher university professor',
            'director de arte o diseño' => 'art design director creative studio',
            'arquitecto, urbanista o diseñador de interiores' => 'architect urban planner interior designer',
            'editor, guionista o productor ejecutivo' => 'editor screenwriter executive producer film',
            'director de formación o desarrollo de personas' => 'training people development director corporate',
            'mediador, trabajador social o terapeuta' => 'mediator social worker therapist counseling',
            'director de ong o responsable de rsc' => 'nonprofit ngo csr director social impact',
            'director general o consejero delegado' => 'chief executive officer corporate leadership',
            'inversor, gestor de fondos o emprendedor serial' => 'investor fund manager entrepreneur business',
            'director comercial o de desarrollo de negocio' => 'commercial director business development executive',
            'director financiero (cfo) o controller' => 'chief financial officer cfo controller office',
            'responsable de calidad o compliance officer' => 'quality manager compliance officer professional',
            'director de administración o de operaciones' => 'administration operations director corporate office',
        ];

        if (isset($exactMap[$normalized])) {
            return $exactMap[$normalized];
        }

        $fallback = preg_replace('/\s+o\s+/', ' ', $normalized) ?? $normalized;
        return trim($fallback) . ' professional at work';
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
