<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\RateLimiter;
use App\Models\TestSesion;
use App\Models\TestAnalytics;
use App\Services\TestValidator;
use App\Services\ProfesionComparadorService;

class TestController extends Controller
{
    private $geminiApiKey;
    private $geminiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

    public function __construct()
    {
        $this->geminiApiKey = env('GEMINI_API_KEY');
    }

    /**
     * Rate limiting para llamadas a Gemini API
     * Límite: 100 llamadas por hora por usuario
     */
    private function checkGeminiRateLimit()
    {
        $user = Auth::user();
        $key = 'gemini_api_' . $user->id;

        if (RateLimiter::tooManyAttempts($key, 100)) {
            $seconds = RateLimiter::availableIn($key);
            $minutes = ceil($seconds / 60);

            Log::warning("⚠️ Rate limit excedido para usuario {$user->id}. Disponible en {$minutes} minutos.");

            throw new \Exception("Demasiadas peticiones. Por favor, espera {$minutes} minutos antes de continuar.");
        }

        RateLimiter::hit($key, 3600); // 1 hora
        Log::debug("✅ Rate limit OK para usuario {$user->id}. Llamadas restantes: " . (100 - RateLimiter::attempts($key)));
    }

    /**
     * Trackear evento de analytics
     */
    private function trackEvent($sessionId, $questionNumber, $eventType, $timeSpent = null, $areaDetected = null, $regenerated = false, $metadata = null)
    {
        try {
            TestAnalytics::create([
                'session_id' => $sessionId,
                'usuario_id' => Auth::id(),
                'question_number' => $questionNumber,
                'event_type' => $eventType,
                'time_spent_seconds' => $timeSpent,
                'area_detected' => $areaDetected,
                'regenerated' => $regenerated,
                'metadata' => $metadata
            ]);
        } catch (\Exception $e) {
            Log::error("Error tracking event: " . $e->getMessage());
        }
    }

    /**
     * Iniciar una nueva sesión de test.
     * Reinicia el progreso y devuelve la primera pregunta.
     */
    public function iniciar(Request $request)
    {
        try {
            $user = Auth::user();

            // 1. Buscar sesión activa
            /** @var TestSesion|null $sesion */
            $sesion = TestSesion::where('usuario_id', $user->id)
                ->where('estado', 'en_progreso')
                ->first();

            if ($sesion) {
                Log::info("Resumiendo test para usuario {$user->id}");

                // Recuperar la pregunta actual del array de preguntas
                $questions = $sesion->questions ?? [];
                $currentIndex = $sesion->current_index;
                $preguntaActual = $questions[$currentIndex] ?? null;

                // Si por alguna razón no hay pregunta para el índice actual, generarla
                if (!$preguntaActual && $currentIndex < 20) {
                    $preguntaActual = $this->generarPreguntaProgresiva($currentIndex + 1, null, [], [], null, null, 25, $user);
                    $sesion->addQuestion($preguntaActual);
                }

                return response()->json([
                    'success' => true,
                    'session_id' => $sesion->id,
                    'current_index' => $currentIndex,
                    'pregunta_actual' => $preguntaActual,
                    'questions' => $questions, // Devolver historial completo de preguntas
                    'total_questions' => $sesion->total_questions,
                    'estado' => $sesion->estado
                ]);
            }

            // 2. Crear nueva sesión
            /** @var TestSesion $sesion */
            $sesion = new TestSesion();
            $sesion->usuario_id = $user->id;
            $sesion->initialize(); // Inicializa valores por defecto

            // Inicializar sistema semántico de áreas
            $sesion->initializeSemanticAreas($this->getSemanticAreasDefinition());

            Log::info("Nuevo test iniciado para usuario {$user->id}");

            // 3. Generar primera pregunta
            $pregunta = $this->generarPreguntaProgresiva(1, null, [], [], null, null, 25, $user);

            // 4. Guardar pregunta y sesión
            $sesion->addQuestion($pregunta);

            return response()->json([
                'success' => true,
                'session_id' => $sesion->id,
                'pregunta_actual' => $pregunta,
                'current_index' => 0,
                'total_questions' => 20,
                'estado' => 'en_progreso'
            ]);

        } catch (\Exception $e) {
            Log::error("Error iniciando test: " . $e->getMessage());
            return response()->json(['success' => false, 'error' => 'Error al iniciar el test'], 500);
        }
    }


    /**
     * Obtener la siguiente pregunta basada en las respuestas anteriores.
     */
    public function siguientePregunta(Request $request)
    {
        // 1. Validar payload
        $request->validate([
            'session_id' => 'required',
            'pregunta_id' => 'required',
            'respuesta' => 'required',
            'editar' => 'boolean',
            'request_id' => 'nullable|string'
        ]);

        $sessionId = $request->input('session_id');
        $preguntaId = $request->input('pregunta_id');
        $respuesta = $request->input('respuesta');
        $editar = $request->input('editar', false);
        $requestId = $request->input('request_id');
        $user = Auth::user();

        // 2. Cargar Sesión
        $sesion = TestSesion::where('id', $sessionId)
            ->where('usuario_id', $user->id)
            ->first();

        if (!$sesion) {
            return response()->json(['success' => false, 'error' => 'Sesión no encontrada'], 404);
        }

        // IDEMPOTENCIA STRICT: Si el request_id ya fue procesado, devolver la respuesta guardada INMEDIATAMENTE
        // Esto evita cualquier procesamiento adicional o llamada a Gemini.
        if ($requestId && $sesion->last_request_id === $requestId && !empty($sesion->last_response)) {
            Log::info("Idempotencia: Devolviendo respuesta cacheada para request {$requestId}");
            return response()->json($sesion->last_response);
        }

        // Sincronizar índice si es necesario (para consistencia)
        $questions = $sesion->questions ?? [];
        $foundIndex = -1;
        foreach ($questions as $idx => $q) {
            if (isset($q['id']) && $q['id'] == $preguntaId) {
                $foundIndex = $idx;
                break;
            }
        }
        if ($foundIndex !== -1 && $foundIndex !== $sesion->current_index) {
            $sesion->current_index = $foundIndex;
        }

        $currentIndex = $sesion->current_index;
        $shouldAdvance = true;
        $isRegeneration = false;

        // 3. Lógica de Flujo
        if ($respuesta === '[EXPLORAR_OTRAS_OPCIONES]') {
            // CASO ESCAPE: No guardar, no avanzar, solo regenerar
            Log::info("Escape en pregunta {$currentIndex}");
            $shouldAdvance = false;
            $isRegeneration = true;
            // No guardamos respuesta ni cambiamos estado
        } elseif ($editar) {
            // CASO EDITAR: Truncar y guardar nueva
            Log::info("Editando respuesta en indice {$currentIndex}");
            $sesion->resetFromIndex($currentIndex);

            // Guardar nueva respuesta
            $currentQuestionText = $sesion->questions[$currentIndex]['texto'] ?? 'Pregunta desconocida';
            $sesion->addAnswer($preguntaId, $currentQuestionText, $respuesta);

            // Recalcular estado
            $this->determineNextState($sesion, $respuesta);

            // Avanzamos
            $shouldAdvance = true;
        } else {
            // CASO NORMAL: Guardar y avanzar
            Log::info("Respuesta normal en indice {$currentIndex}");

            // Guardar respuesta
            $currentQuestionText = $sesion->questions[$currentIndex]['texto'] ?? 'Pregunta desconocida';
            $currentQuestionOptions = $sesion->questions[$currentIndex]['opciones'] ?? [];
            $sesion->addAnswer($preguntaId, $currentQuestionText, $respuesta);

            // Log detallado de la respuesta con opciones
            $opcionesTexto = is_array($currentQuestionOptions) ? implode("\n   - ", $currentQuestionOptions) : 'No disponibles';
            Log::info("
═══════════════════════════════════════════════════════════
 RESPUESTA RECIBIDA - Pregunta " . ($currentIndex + 1) . "
═══════════════════════════════════════════════════════════
 PREGUNTA: {$currentQuestionText}

 POSIBLES RESPUESTAS:
    - {$opcionesTexto}

 RESPUESTA SELECCIONADA: {$respuesta}

 ID Pregunta: {$preguntaId}
 Session ID: " . $sesion->id . "

 ESTADO ACTUAL:
    - Area: " . ($sesion->area ?? 'No definida') . "
    - Subarea: " . ($sesion->subarea ?? 'No definida') . "
    - Rol: " . ($sesion->role ?? 'No definido') . "
═══════════════════════════════════════════════════════════
");

            // Actualizar estado
            $this->determineNextState($sesion, $respuesta);

            // ACTUALIZAR USER SUMMARY (Incremental)
            $this->updateUserSummary($sesion, $currentQuestionText, $respuesta);

            // Avanzamos
            $shouldAdvance = true;
        }

        // 4. Avanzar índice si corresponde
        if ($shouldAdvance) {
            $sesion->current_index += 1;
            $sesion->save();
        }

        // 5. Verificar finalización
        if ($sesion->current_index >= $sesion->total_questions) {
            $sesion->estado = 'completado';
            $sesion->completed_at = now();
            $sesion->save();

            return response()->json([
                'success' => true,
                'finalizado' => true,
                'resultado' => [
                    'area' => $sesion->area,
                    'subarea' => $sesion->subarea,
                    'role' => $sesion->role
                ]
            ]);
        }

        // 6. GENERAR SIGUIENTE PREGUNTA (Siempre)
        // Si es regeneración, usamos el mismo índice. Si avanzamos, usamos el nuevo.
        $targetIndex = $sesion->current_index;

        // Llamada a Gemini
        // Usar perfil con diferente intensidad según fase
        $perfilInfo = "";
        $perfilIntensidad = "NINGUNO";

        if ($targetIndex + 1 <= 5) {
            // FASE 1: Perfil FUERTE
            $perfilInfo = $this->obtenerPerfilTexto($user);
            $perfilIntensidad = "FUERTE";
        } elseif ($targetIndex + 1 <= 10) {
            // FASE 2: Perfil MODERADO
            $perfilInfo = $this->obtenerPerfilTexto($user);
            $perfilIntensidad = "MODERADO";
        } elseif ($targetIndex + 1 <= 20) {
            // FASE 3-4: Perfil como PISTA SECUNDARIA
            $perfilInfo = $this->obtenerPerfilTexto($user);
            $perfilIntensidad = "SECUNDARIO";
        }

        if (!empty($perfilInfo)) {
            Log::info("USANDO PERFIL con intensidad {$perfilIntensidad} para generar pregunta " . ($targetIndex + 1) . " | Perfil: " . substr($perfilInfo, 0, 100) . "...");
        } else {
            Log::info("NO USANDO PERFIL para generar pregunta " . ($targetIndex + 1));
        }

        // Obtener pregunta anterior si es regeneración por escape
        $previousQuestion = null;
        if ($isRegeneration && isset($questions[$targetIndex])) {
            $previousQuestion = $questions[$targetIndex];
            Log::info("Regeneracion por escape: manteniendo pregunta '" . substr($previousQuestion['texto'], 0, 50) . "...'");
        }

        // Calcular edad del usuario
        $edad = 25; // Default adulto
        if ($user && $user->perfil && $user->perfil->fecha_nacimiento) {
            $edad = $user->perfil->fecha_nacimiento->age;
            Log::info("Edad detectada desde perfil: {$edad} años (Nacimiento: {$user->perfil->fecha_nacimiento->toDateString()})");
        } else {
            Log::warning("No se pudo detectar edad (Perfil o fecha nacimiento missing). Usando default: {$edad}");
            if ($user)
                Log::info("User ID: {$user->id}, Perfil exists: " . ($user->perfil ? 'YES' : 'NO'));
        }

        Log::info("Generando pregunta para usuario de {$edad} años");

        $nuevaPregunta = $this->generarPreguntaProgresiva(
            $targetIndex + 1, // Convertir a 1-based para la función
            $perfilInfo,
            $sesion->historial,
            $sesion->toStateArray(),
            $sesion, // Pasamos la sesión completa para acceder a user_summary y covered_domains
            $previousQuestion, // Pasar pregunta anterior para regeneración
            $edad, // NUEVO: Pasar edad para personalización de contexto
            $user // NUEVO: Pasar objeto usuario completo para nombre
        );

        // 7. Guardar pregunta generada
        $questions = $sesion->questions ?? [];
        $questions[$targetIndex] = $nuevaPregunta; // Sobrescribir o añadir
        $sesion->questions = $questions;
        $sesion->save();

        $responsePayload = [
            'success' => true,
            'regenerada' => $isRegeneration,
            'pregunta' => $nuevaPregunta,
            'current_index' => $targetIndex,
            'total_questions' => $sesion->total_questions,
            'request_id' => $requestId, // Devolver el mismo request_id para confirmación
            'semantic_areas' => $sesion->semantic_areas ?? [], // Para visualización de convergencia
            'transition_insight' => $nuevaPregunta['insight_transicion'] ?? null // Para modal de transición
        ];

        // Guardar estado de idempotencia
        if ($requestId) {
            $sesion->last_request_id = $requestId;
            $sesion->last_response = $responsePayload;
            $sesion->save();
        }

        return response()->json($responsePayload);
    }

    // ==========================================
    // PRIVADAS
    // ==========================================
    /**
     * Genera una pregunta progresiva usando Gemini.
     * 
     * @param int $numeroPregunta
     * @param string|null $perfilInfo
     * @param array $contexto
     * @param array $respuestasAnteriores
     * @return array
     */
    /**
     * NUEVO MÉTODO determineNextState() CON SISTEMA SEMÁNTICO
     * 
     * Este archivo contiene el nuevo método que debe reemplazar al actual en TestController.php
     * Líneas aproximadas: 314-461
     */

    /**
     * Helper para coincidencia difusa de palabras clave.
     * Detecta: exacta, plurales, regex boundary y similar_text (>60%).
     */
    private function matchKeywordFuzzy($text, $keyword, $areaName = null): bool
    {
        $text = mb_strtolower(trim($text), 'UTF-8');
        $keyword = mb_strtolower(trim($keyword), 'UTF-8');

        if (empty($text) || empty($keyword))
            return false;

        $matchMethod = null;
        $similarity = 0;

        // 1. Coincidencia literal rápida (PESO: 3)
        if (str_contains($text, $keyword)) {
            $matchMethod = 'literal';
            $similarity = 100;
            if ($areaName) {
                Log::debug("🎯 Match [{$matchMethod}] '{$keyword}' en '{$text}' → Área: {$areaName} (Similitud: {$similarity}%)");
            }
            return true;
        }

        // 2. Variantes de plurales comunes (PESO: 2)
        if (str_contains($text, $keyword . 's') || str_contains($text, $keyword . 'es')) {
            $matchMethod = 'plural';
            $similarity = 95;
            if ($areaName) {
                Log::debug("🎯 Match [{$matchMethod}] '{$keyword}' en '{$text}' → Área: {$areaName} (Similitud: {$similarity}%)");
            }
            return true;
        }

        // 3. Coincidencia por palabras completas (Regex) (PESO: 2)
        $quoted = preg_quote($keyword, '/');
        if (preg_match("/\\b{$quoted}\\b/u", $text)) {
            $matchMethod = 'boundary';
            $similarity = 90;
            if ($areaName) {
                Log::debug("🎯 Match [{$matchMethod}] '{$keyword}' en '{$text}' → Área: {$areaName} (Similitud: {$similarity}%)");
            }
            return true;
        }

        // 4. Similitud difusa (Fuzzy) - SOLO para keywords largas (PESO: 1)
        // Aumentado de 6 a 8 chars para reducir falsos positivos (ej: "ui", "ia", "red")
        if (strlen($keyword) >= 8) {
            similar_text($text, $keyword, $percent);
            // Aumentado de 70% a 75% para ser más estricto y profesional
            if ($percent >= 75) {
                $matchMethod = 'fuzzy';
                $similarity = round($percent, 2);
                if ($areaName) {
                    Log::debug("🎯 Match [{$matchMethod}] '{$keyword}' en '{$text}' → Área: {$areaName} (Similitud: {$similarity}%)");
                }
                return true;
            }
        }

        return false;
    }

    /**
     * Determina y actualiza el estado (área, subárea, rol) usando análisis semántico acumulativo.
     * VERSIÓN MEJORADA: Fuzzy Matching + Fallback Automático
     */
    private function determineNextState(TestSesion $sesion, $respuesta)
    {
        /** @var \App\Models\TestSesion $sesion */
        $respuestaLower = mb_strtolower($respuesta, 'UTF-8');

        // ═══════════════════════════════════════════════════════════
        // PASO 1: ANÁLISIS SEMÁNTICO DE LA RESPUESTA
        // ═══════════════════════════════════════════════════════════

        // Filtrar frases inválidas que no deben influir en la detección
        $frasesInvalidas = ['depende', 'mixto', 'no sé', 'ninguna', 'otra', 'prefiero otra', 'flexible', 'variable', 'cualquier', 'no importa', 'no lo sé', 'no estoy seguro'];
        $esRespuestaInvalida = false;
        foreach ($frasesInvalidas as $bad) {
            if (str_contains($respuestaLower, $bad)) {
                $esRespuestaInvalida = true;
                break;
            }
        }

        // Si la respuesta es inválida, no analizar semánticamente
        if ($esRespuestaInvalida) {
            Log::info("Respuesta generica detectada, no se actualiza semantic_areas");
            return;
        }

        // Obtener semantic_areas actual
        $semanticAreas = $sesion->semantic_areas ?? $this->getSemanticAreasDefinition();

        // Analizar coincidencias semánticas con FUZZY MATCHING
        $detectedAreas = [];
        foreach ($semanticAreas as $areaKey => $areaData) {
            $keywords = $areaData['keywords'] ?? [];
            $matches = 0;

            foreach ($keywords as $keyword) {
                if ($this->matchKeywordFuzzy($respuestaLower, $keyword, $areaKey)) {
                    $matches++;
                }
            }

            if ($matches > 0) {
                $detectedAreas[$areaKey] = $matches;
            }
        }

        // Actualizar pesos en semantic_areas
        if (!empty($detectedAreas)) {
            $sesion->updateSemanticAreas($detectedAreas);
            $sesion->addSemanticHistory($sesion->current_index, $respuesta, $detectedAreas);

            Log::info("Analisis semantico - Areas detectadas: " . json_encode($detectedAreas));
        }

        // ═══════════════════════════════════════════════════════════
        // PASO 2: ASIGNACIÓN DE ÁREA (SOLO CON EVIDENCIA SUFICIENTE)
        // ═══════════════════════════════════════════════════════════

        if (empty($sesion->area)) {
            // Obtener área con mayor peso
            $topAreaData = $sesion->getTopSemanticArea();

            if ($topAreaData) {
                $topArea = $topAreaData['area'];
                $topWeight = $topAreaData['weight'];
                $margin = $topAreaData['margin'];

                // REGLAS DE ASIGNACIÓN MEJORADAS:
                // 1. Estamos en pregunta >= 5 (antes era 6)
                // 2. El peso del área top >= 2 (antes era 3) - Más sensible
                // 3. El margen con la segunda >= 1

                $minQuestion = 5;
                $minWeight = 2; // Solicitado por usuario
                $minMargin = 1;

                if ($sesion->current_index >= $minQuestion && $topWeight >= $minWeight && $margin >= $minMargin) {
                    // Asignar área con nombre legible
                    $sesion->area = $this->prettyAreaName($topArea);
                    $sesion->save();

                    Log::info("AREA ASIGNADA (Semantica): {$sesion->area} (peso: {$topWeight}, margen: {$margin})");
                    return;
                }
            }

            // FALLBACK AUTOMÁTICO AL FINAL DEL TEST
            // Si llegamos a la pregunta 20 y no hay área, asignamos la de mayor peso si existe
            if ($sesion->current_index >= 19 && $topAreaData && $topAreaData['weight'] >= 2) {
                $sesion->area = $this->prettyAreaName($topAreaData['area']);
                $sesion->save();
                Log::info("AREA ASIGNADA (Fallback Final): {$sesion->area} (peso: {$topAreaData['weight']})");
                return;
            }

            return; // No hay área aún, salir
        }

        // ═══════════════════════════════════════════════════════════
        // PASO 3: ASIGNACIÓN DE SUBÁREA (Lógica existente mantenida)
        // ═══════════════════════════════════════════════════════════

        if (empty($sesion->subarea)) {
            $subareasMap = [
                'tecnología' => ['desarrollo de software', 'análisis de datos', 'ciberseguridad', 'administración de sistemas', 'redes y comunicaciones', 'inteligencia artificial'],
                'sanidad' => ['enfermería', 'auxiliar de clínica', 'diagnóstico por imagen', 'fisioterapia', 'farmacia hospitalaria', 'medicina general'],
                'educación' => ['educación infantil', 'educación primaria', 'educación secundaria', 'formación profesional', 'orientación educativa'],
                'social' => ['trabajo social', 'integración social', 'psicología clínica', 'pedagogía terapéutica', 'mediación'],
                'oficios' => ['electricidad industrial', 'fontanería y calefacción', 'carpintería metálica', 'mecánica automotriz', 'soldadura especializada'],
                'creatividad' => ['diseño gráfico', 'fotografía profesional', 'producción audiovisual', 'ilustración digital', 'marketing digital', 'diseño web', 'diseño UX/UI', 'diseño instruccional', 'diseño de experiencias educativas'],
                'seguridad' => ['policía local', 'bombero forestal', 'seguridad privada', 'emergencias sanitarias', 'protección civil'],
                'administración' => ['contabilidad y finanzas', 'gestión de proyectos', 'recursos humanos', 'secretariado de dirección', 'comercio internacional'],
                'logística' => ['gestión de almacenes', 'transporte de mercancías', 'planificación de rutas', 'comercio exterior'],
                'veterinaria' => ['clínica de pequeños animales', 'ganadería y producción animal', 'salud pública veterinaria'],
                'deporte' => ['entrenamiento personal', 'gestión deportiva', 'monitor de actividades dirigidas'],
                'ciencia' => ['investigación biomédica', 'ingeniería química', 'análisis de laboratorio', 'desarrollo de materiales'],
                'hostelería' => ['cocina de autor', 'gestión hotelera', 'servicio de sala', 'eventos y catering'],
                'comercio' => ['ventas al por menor', 'comercio electrónico', 'gestión de tiendas', 'atención al cliente'],
                'comunicación' => ['periodismo', 'marketing digital', 'publicidad', 'social media', 'producción audiovisual'],
                'artes escénicas' => ['teatro', 'danza', 'música', 'producción musical', 'dirección escénica'],
                'jurídico' => ['derecho civil', 'derecho penal', 'derecho laboral', 'asesoría legal', 'oposiciones'],
                'emprendimiento' => ['startup tecnológica', 'negocio propio', 'gestión de proyectos', 'consultoría']
            ];

            $areaKey = mb_strtolower($sesion->area ?? '', 'UTF-8');
            if (isset($subareasMap[$areaKey])) {
                foreach ($subareasMap[$areaKey] as $subarea) {
                    if (str_contains($respuestaLower, mb_strtolower($subarea, 'UTF-8'))) {
                        $sesion->subarea = ucfirst($subarea);
                        $sesion->save();
                        Log::info("SUBAREA ASIGNADA: {$sesion->subarea}");
                        return;
                    }
                }
            }

            // Fallback: asignar si estamos avanzados y la respuesta es específica
            if ($sesion->current_index >= 10 && strlen($respuesta) < 50 && strlen($respuesta) > 5 && !$esRespuestaInvalida) {
                $sesion->subarea = ucfirst(substr($respuesta, 0, 50));
                $sesion->save();
                Log::info("SUBAREA ASIGNADA (fallback): {$sesion->subarea}");
            }

            return;
        }

        // ═══════════════════════════════════════════════════════════
        // PASO 4: ASIGNACIÓN DE ROL (Lógica existente mantenida)
        // ═══════════════════════════════════════════════════════════

        if (empty($sesion->role)) {
            $rolesMap = [
                'desarrollo de software' => ['frontend developer', 'backend developer', 'mobile developer', 'fullstack developer', 'devops engineer'],
                'análisis de datos' => ['data analyst', 'data scientist', 'business intelligence analyst'],
                'ciberseguridad' => ['ethical hacker', 'analista SOC', 'ingeniero de seguridad', 'consultor de ciberseguridad'],
                'administración de sistemas' => ['administrador de redes', 'administrador de bases de datos', 'ingeniero de sistemas cloud'],
                'enfermería' => ['enfermero de urgencias', 'enfermero de cuidados intensivos', 'enfermero de atención primaria', 'enfermero quirúrgico'],
                'electricidad industrial' => ['técnico electricista', 'ingeniero eléctrico', 'montador de instalaciones'],
                'diseño gráfico' => ['diseñador UX/UI', 'diseñador de branding', 'diseñador editorial'],
                'diseño UX/UI' => ['diseñador UX/UI', 'diseñador de experiencias de usuario', 'diseñador instruccional', 'diseñador de apps educativas'],
                'marketing digital' => ['especialista SEO/SEM', 'community manager', 'content creator', 'analista de marketing'],
                'contabilidad y finanzas' => ['contable', 'auditor', 'asesor financiero', 'gestor de nóminas'],
                'gestión de proyectos' => ['project manager', 'scrum master', 'consultor de proyectos'],
                'cocina de autor' => ['chef ejecutivo', 'jefe de partida', 'pastelero'],
                'gestión hotelera' => ['director de hotel', 'recepcionista', 'gestor de eventos'],
                'ventas al por menor' => ['dependiente', 'encargado de tienda', 'visual merchandiser']
            ];

            $subareaKey = mb_strtolower($sesion->subarea ?? '', 'UTF-8');
            if (isset($rolesMap[$subareaKey])) {
                foreach ($rolesMap[$subareaKey] as $role) {
                    if (str_contains($respuestaLower, mb_strtolower($role, 'UTF-8'))) {
                        $sesion->role = ucfirst($role);
                        $sesion->save();
                        Log::info("ROL ASIGNADO: {$sesion->role}");
                        return;
                    }
                }
            }

            // Fallback: asignar si estamos muy avanzados y la respuesta es específica
            if ($sesion->current_index >= 15 && strlen($respuesta) < 50 && strlen($respuesta) > 5 && !$esRespuestaInvalida) {
                $sesion->role = ucfirst(substr($respuesta, 0, 50));
                $sesion->save();
                Log::info("ROL ASIGNADO (fallback): {$sesion->role}");
            }
        }
    }

    /**
     * Convierte clave de área a nombre legible.
     */
    private function prettyAreaName($key)
    {
        $map = [
            'tecnologia' => 'Tecnología',
            'sanidad' => 'Sanidad',
            'educacion' => 'Educación',
            'social' => 'Trabajo Social',
            'administracion' => 'Administración y Gestión',
            'comunicacion' => 'Comunicación y Marketing',
            'creatividad' => 'Creatividad y Artes Visuales',
            'artes_escenicas' => 'Artes Escénicas y Música',
            'oficios' => 'Oficios y Técnicos',
            'ciencia' => 'Ciencia e Investigación',
            'juridico' => 'Jurídico y Legal',
            'seguridad' => 'Seguridad y Emergencias',
            'logistica' => 'Logística y Transporte',
            'comercio' => 'Comercio y Ventas',
            'hosteleria' => 'Hostelería y Turismo',
            'deporte' => 'Deporte y Bienestar',
            'veterinaria' => 'Veterinaria y Medio Ambiente',
            'emprendimiento' => 'Emprendimiento y Startups'
        ];

        return $map[$key] ?? ucfirst($key);
    }



    /**
     * Genera una pregunta progresiva usando Gemini.
     * 
     * @param int $numeroPregunta
     * @param string $perfilInfo
     * @param array $historial
     * @param array $estado
     * @param TestSesion|null $sesionObj
     * @param array|null $previousQuestion Pregunta anterior para regeneración (mantiene pregunta, cambia opciones)
     * @param int $edad Edad del usuario para adaptar contexto (default: 25)
     */
    private function generarPreguntaProgresiva(
        $numeroPregunta,
        $perfilInfo,
        $historial,
        $estado,
        $sesionObj = null,
        $previousQuestion = null,
        $edad = 25,
        $user = null
    ) {
        // Determinar fase (Bloques de 5)
        // 1-5: Fase 1 - RIASEC
        // 6-10: Fase 2 - Work Environment
        // 11-15: Fase 3 - Roles & Tasks
        // 16-20: Fase 4 - Specialization
        $fase = 1;
        if ($numeroPregunta > 5)
            $fase = 2;
        if ($numeroPregunta > 10)
            $fase = 3;
        if ($numeroPregunta > 15)
            $fase = 4;

        $preguntaAnterior = null;
        if (!empty($historial)) {
            $lastItem = end($historial);
            if (isset($lastItem['texto_pregunta'])) {
                $preguntaAnterior = ['texto' => $lastItem['texto_pregunta']];
            }
        }

        $validator = new TestValidator();
        $intentos = 0;
        $maxIntentos = 3;
        $preguntaFinal = [];

        while ($intentos < $maxIntentos) {
            $intentos++;
            try {
                // 1. Construir prompt y llamar a Gemini
                // Añadimos variación al prompt si es reintento
                $extraInstruction = ($intentos > 1) ? " (Intento {$intentos}: Sé más creativo y evita repetir temas anteriores)" : "";

                // Usar user_summary si está disponible
                $userSummary = $sesionObj ? $sesionObj->user_summary : "";
                $coveredDomains = $sesionObj ? ($sesionObj->covered_domains ?? []) : [];
                $semanticAreas = $sesionObj ? ($sesionObj->semantic_areas ?? []) : [];

                $prompt = $this->construirPrompt($numeroPregunta, $perfilInfo, $historial, $estado, $userSummary, $coveredDomains, $semanticAreas, $previousQuestion, $edad, $user) . $extraInstruction;

                $jsonResponse = $this->llamarGeminiAPI($prompt);
                Log::info("🤖 Gemini Raw Response (Intento {$intentos}): " . substr($jsonResponse, 0, 500)); // Log first 500 chars

                $preguntaData = json_decode($this->limpiarJson($jsonResponse), true);

                if (json_last_error() !== JSON_ERROR_NONE) {
                    Log::error("JSON Decode Error: " . json_last_error_msg());
                    // No incrementamos $intentos aquí, ya se hizo al inicio del bucle
                    continue;
                }

                // LIMPIAR PREFIJOS DE LAS OPCIONES (A., B., etc.)
                if (isset($preguntaData['opciones']) && is_array($preguntaData['opciones'])) {
                    $preguntaData['opciones'] = $this->limpiarOpcionesPrefijos($preguntaData['opciones']);
                    Log::info("🧹 Opciones limpiadas: " . json_encode($preguntaData['opciones']));
                }

                // ═══════════════════════════════════════════════════════════════
                // SISTEMA ANTI-REPETICIÓN SEMÁNTICA
                // ═══════════════════════════════════════════════════════════════
                // Verificar similitud con las últimas 5 preguntas ANTES del validador

                $textoPregunta = $preguntaData['texto'] ?? '';

                if (!empty($textoPregunta) && $sesionObj) {
                    // Obtener últimas 5 preguntas del historial
                    $ultimasPreguntas = [];
                    if (!empty($sesionObj->questions)) {
                        $allQuestions = $sesionObj->questions;
                        // Tomar últimas 5 preguntas (o menos si no hay tantas)
                        $ultimasPreguntas = array_slice($allQuestions, -5, 5, true);
                    }

                    // Verificar si es demasiado similar
                    // CRÍTICO: Revisión vs TODO el historial para evitar duplicados exactos (Q18 vs Q19)
                    if ($this->esDuplicada($textoPregunta, $allQuestions)) {
                        Log::warning("Pregunta RECHAZADA por ser EXACTAMENTE IGUAL a una anterior: '{$textoPregunta}'");
                        if ($intentos < $maxIntentos) {
                            continue;
                        }
                    }

                    // Verificar similitud semántica (fuzzy)
                    if ($this->esDemasiadoSimilar($textoPregunta, $ultimasPreguntas, 0.75)) {
                        Log::warning("Pregunta rechazada por similitud semántica alta (Intento {$intentos})");

                        if ($intentos < $maxIntentos) {
                            Log::info("Reintentando con instrucción de evitar tema similar...");
                            continue; // Reintentar
                        } else {
                            Log::error("Máximos intentos alcanzados con preguntas similares, aceptando pregunta");
                            // Continuar con validación normal aunque sea similar
                        }
                    } else {
                        Log::info("Pregunta pasa verificación anti-repetición semántica");
                    }
                }

                // Validar
                $preguntaValidada = $validator->validate($preguntaData, $fase, $preguntaAnterior);

                // Check if validation returned a fallback (ID starts with fallback_)
                if (isset($preguntaValidada['id']) && str_starts_with($preguntaValidada['id'], 'fallback_')) {
                    Log::warning("Validación falló. Gemini retornó: " . json_encode($preguntaData));
                    // Contamos esto como fallo para forzar reintento si es posible, o aceptar fallback si se alcanzaron los intentos máximos.
                    // Validate() retorna una estructura de fallback, así que no podemos distinguir fácilmente a menos que verifiquemos el ID.
                    // Si retornó un fallback, podríamos querer reintentar el bucle.
                    if ($intentos < $maxIntentos) {
                        Log::info("Reintentando por fallo de validación...");
                        // $intentos ya se incrementó al inicio del bucle
                        continue;
                    }
                    // Si se alcanzaron los intentos máximos y sigue siendo fallback, lo aceptamos como pregunta final
                    $preguntaFinal = $preguntaValidada;
                    break;
                } else {
                    Log::info("Pregunta validada correctamente.");

                    // AÑADIR AUTOMÁTICAMENTE LA 5TA OPCIÓN: [EXPLORAR_OTRAS_OPCIONES]
                    if (isset($preguntaValidada['opciones']) && is_array($preguntaValidada['opciones'])) {
                        $preguntaValidada['opciones'][] = '[EXPLORAR_OTRAS_OPCIONES]';
                        Log::info("Añadida opción escape: [EXPLORAR_OTRAS_OPCIONES]");
                    }

                    $preguntaFinal = $preguntaValidada;
                    break; // Pregunta válida encontrada, salir del bucle
                }

            } catch (\Exception $e) {
                Log::error("❌ Error generando pregunta (Intento {$intentos}): " . $e->getMessage());
                Log::error($e->getTraceAsString());
                // $intentos is already incremented at the start of the loop
                sleep(1); // Esperar un poco antes de reintentar
            }
        }

        // Si después de los intentos no tenemos pregunta válida, usamos fallback (o la última generada si el validador la aceptó parcialmente)
        if (empty($preguntaFinal)) {
            Log::error("❌ Se agotaron los intentos para pregunta {$numeroPregunta}. Usando FALLBACK.");
            $preguntaFinal = $validator->fallback($fase);
            $preguntaFinal['source'] = 'fallback';
        } else {
            $preguntaFinal['source'] = 'gemini';
        }

        // 3. Asegurar ID y número
        if (!isset($preguntaFinal['id'])) {
            // Si no tiene ID, asignamos uno basado en el origen
            if ($preguntaFinal['source'] === 'fallback') {
                $preguntaFinal['id'] = 'fallback_' . $fase . '_' . uniqid();
            } else {
                $preguntaFinal['id'] = 'gemini_' . $numeroPregunta . '_' . uniqid();
            }
        } elseif (str_contains($preguntaFinal['id'], 'fallback_') && $preguntaFinal['source'] !== 'fallback') {
            // Si tiene un ID de fallback pero el origen no es fallback, corregir
            $preguntaFinal['id'] = 'gemini_' . $numeroPregunta . '_' . uniqid();
        }

        $preguntaFinal['numero'] = $numeroPregunta;

        // LOG FINAL: Mostrar qué tipo de pregunta se está devolviendo
        Log::info("📤 Pregunta #{$numeroPregunta} generada - Source: {$preguntaFinal['source']} - ID: {$preguntaFinal['id']} - Texto: " . substr($preguntaFinal['texto'], 0, 60));

        return $preguntaFinal;
    }

    private function construirPrompt($n, $perfil, $historial, $estado, $userSummary = "", $coveredDomains = [], $semanticAreas = [], $previousQuestion = null, $edad = 25, $user = null)
    {
        // DETERMINAR CONTEXTO POR EDAD
        $isMinor = ($edad < 18);
        $ageContext = "";

        Log::info("👶 Contexto Edad: " . ($isMinor ? "MENOR (<18)" : "ADULTO (>=18)") . " - Edad: {$edad}");

        if ($isMinor) {
            $ageContext = "
CONTEXTO EDAD: USUARIO ES MENOR ({$edad} años).
REGLAS DE ADAPTACIÓN CRÍTICAS:
1. 🚫 PALABRAS PROHIBIDAS: 'empleo', 'trabajo', 'empresa', 'carrera', 'jefe', 'salario', 'oficina', 'proyecto'.
2. USA ESCENARIOS DE VIDA REAL Y HOBBIES (NO SOLO ESCUELA):
   - BIEN: 'Si se rompe algo en casa...', 'Cuando juegas videojuegos...', 'Organizando un viaje con amigos...', 'Ayudando a un vecino...'.
   - TAMBIÉN: 'En un trabajo en grupo de clase...', 'Preparando una presentación...'.
   - MAL: 'En tu futuro profesional...', 'Gestionando un proyecto...'.
3. LENGUAJE: Natural, directo, tú a tú. Evita sonar como un profesor.";
        } else {
            $ageContext = "
CONTEXTO EDAD: USUARIO ADULTO ({$edad} años).
REGLAS DE ADAPTACIÓN CRÍTICAS:
1. 🚫 EVITA LA PALABRA 'PROYECTO' (Úsala máximo 1 vez).
2. BUSCA ESCENARIOS DE 'MICRO-GESTIÓN' DIARIA:
   - BIEN: 'Lidiando con un error urgente...', 'Explicando algo complejo a un cliente...', 'Organizando tu escritorio...', 'Tomando una decisión rápida...'.
   - MAL: '¿En qué tipo de proyecto te gustaría trabajar?'.
3. LENGUAJE: Profesional pero cercano. Situaciones tangibles.";
        }
        // CONTEXTO OPTIMIZADO:
        // 1. Resumen de Usuario (Acumulativo)
        // 2. Última pregunta/respuesta (Contexto inmediato)
        // 3. Estado explícito (Area/Subárea)
        // 4. Evidencia Semántica (Lo que el usuario dice implícitamente)
        // 5. Historial de preguntas (Para evitar repetición)
        $lastInteraction = "";
        if (!empty($historial)) {
            $lastItem = end($historial);
            $q = $lastItem['texto_pregunta'] ?? 'Pregunta';
            $a = $lastItem['respuesta'] ?? '';
            $lastInteraction = "Última Pregunta: \"{$q}\"\nÚltima Respuesta: \"{$a}\"";
        }

        $area = $estado['area'] ?? 'General';
        $subarea = $estado['subarea'] ?? 'General';

        // Dominios requeridos para asegurar variedad
        $requiredDomains = [
            "tecnologia",
            "artes",
            "musica",
            "oficios_manuales",
            "sanidad",
            "administracion",
            "fuerzas_seguridad",
            "emprendimiento",
            "ciencias",
            "humanidades",
            "trabajo_social"
        ];

        $coveredDomainsJson = json_encode($coveredDomains);
        $requiredDomainsJson = json_encode($requiredDomains);

        // NUEVO: Preparar evidencia semántica para Gemini
        $semanticEvidence = "";
        if (!empty($semanticAreas)) {
            // Ordenar áreas por peso descendente
            $sortedAreas = $semanticAreas;
            uasort($sortedAreas, function ($a, $b) {
                return ($b['weight'] ?? 0) <=> ($a['weight'] ?? 0);
            });

            // Tomar top 5 áreas con mayor evidencia
            $topAreas = array_slice($sortedAreas, 0, 5, true);
            $evidenceList = [];
            foreach ($topAreas as $areaKey => $areaData) {
                $weight = $areaData['weight'] ?? 0;
                if ($weight > 0) {
                    $evidenceList[] = "{$areaKey}: {$weight}";
                }
            }

            if (!empty($evidenceList)) {
                $semanticEvidence = "\n  \"semantic_evidence\": [" . implode(", ", $evidenceList) . "]";
            }
        }

        // NUEVO: Gestión de diversidad temática
        $diversityInfo = $this->domainDiversityManager($coveredDomains, $n - 1);
        $pendingDomainsJson = json_encode($diversityInfo['pending_domains']);
        $allowSpecialization = $diversityInfo['allow_specialization'] ? 'true' : 'false';

        // Determinar fase RIASEC/O*NET
        $phase = "";
        $phaseGuidance = "";

        $isMinor = ($edad < 18);

        if ($n <= 5) {
            $phase = "PHASE_1_RIASEC";

            if ($isMinor) {
                // Contexto ESCOLAR para menores
                $phaseGuidance = "Modelo Holland RIASEC - ENFOQUE ESCOLAR Y ACADÉMICO (Usuario tiene {$edad} años).

CRÍTICO: NO PREGUNTES SOBRE TRABAJO/EMPLEO. CÉNTRATE EN LA VIDA ESCOLAR.

GUÍAS OBLIGATORIAS:
1. Explora dimensiones RIASEC vía ACTIVIDADES ESCOLARES, TAREAS DE CLASE y PROYECTOS.
2. Enfócate en ESTILOS DE APRENDIZAJE y PREFERENCIAS COGNITIVAS.
3. Empieza desde ESCENARIOS DE AULA.

VARIEDAD REQUERIDA (Contexto Escolar):
- Q1: TAREAS ESCOLARES PREFERIDAS (ej: '¿Qué tipo de trabajos de clase disfrutas?')
- Q2: RESOLUCIÓN DE PROBLEMAS EN ESTUDIOS (ej: '¿Cómo abordas una asignatura difícil?')
- Q3: ENTORNO DE ESTUDIO (ej: '¿En qué ambiente aprendes mejor?')
- Q4: MOTIVACIÓN ACADÉMICA (ej: '¿Qué proyectos escolares te hacen sentir orgulloso?')
- Q5: ROL EN TRABAJO GRUPAL (ej: 'Cuando trabajas en equipo en clase, ¿qué haces?')

Las opciones deben representar diferentes polos RIASEC adaptados a la escuela.";
            } else {
                // Contexto PROFESIONAL para adultos
                $phaseGuidance = "Modelo Holland RIASEC - ENFOQUE ESTRICTAMENTE PROFESIONAL.

PROHIBICIONES CRÍTICAS:
- NUNCA preguntes sobre 'tiempo libre', 'fines de semana', 'hobbies', 'ocio' o 'vacaciones'.
- NUNCA uses contextos casuales.

GUÍAS OBLIGATORIAS:
1. Cada pregunta debe explorar una dimensión RIASEC DIFERENTE.
2. Enfócate SOLO en: COMPORTAMIENTOS LABORALES, PREFERENCIAS COGNITIVAS o ACTIVIDADES LABORALES AMPLIAS.
3. Empieza desde ESCENARIOS DE TRABAJO GENERALES.

VARIEDAD REQUERIDA:
- Q1: TAREAS PREFERIDAS
- Q2: RESOLUCIÓN DE PROBLEMAS
- Q3: ENTORNO DE TRABAJO
- Q4: MOTIVACIÓN
- Q5: PREFERENCIA DE ROL

Las opciones deben representar DIFERENTES polos RIASEC.";
            }
        } elseif ($n <= 10) {
            $phase = "PHASE_2_WORK_ENVIRONMENT";
            if ($isMinor) {
                $phaseGuidance = "Estilos de Trabajo O*NET - ENTORNO ESCOLAR. Pregunta sobre PREFERENCIAS DE ESTUDIO, dinámicas de equipo en clase y ritmo de aprendizaje. Las opciones deben representar diferentes entornos de AULA/ESTUDIO.";
            } else {
                $phaseGuidance = "Estilos y Valores de Trabajo O*NET - Pregunta sobre ENTORNOS DE TRABAJO, preferencias de equipo, ritmo y condiciones concretas. Las opciones deben representar diferentes entornos laborales.";
            }
        } elseif ($n <= 15) {
            $phase = "PHASE_3_ROLES_TASKS";
            if ($isMinor) {
                $phaseGuidance = "Familias de Trabajo O*NET - ROLES ESCOLARES.
                OBLIGATORIO: Explora DIFERENTES roles en proyectos escolares.
                - NO repitas 'organizar' o 'ayudar' si ya se preguntó.
                - Explora: Investigar, Crear, Presentar, Analizar, Liderar.
                Las opciones deben ser TAREAS ESCOLARES CONCRETAS.";
            } else {
                $phaseGuidance = "Familias de Trabajo O*NET - Pregunta sobre FUNCIONES Y ROLES ESPECÍFICOS dentro de las áreas detectadas. Las opciones deben ser TAREAS O RESPONSABILIDADES CONCRETAS.";
            }
        } else {
            $phase = "PHASE_4_SPECIALIZATION";
            if ($isMinor) {
                $phaseGuidance = "Actividades Detalladas O*NET - ESTUDIOS FUTUROS E INTERESES ESPECÍFICOS.
                ANTI-REPETICIÓN CRÍTICA:
                - Si las preguntas anteriores fueron sobre 'campañas', pregunta sobre 'herramientas' o 'impacto'.
                - Si las anteriores fueron sobre 'eventos', pregunta sobre 'temas de investigación' o 'producción creativa'.
                - Explora ASIGNATURAS (Matemáticas, Historia, Arte), HABILIDADES (Programación, Escritura) o SECTORES (Salud, Tecnología).
                - NO preguntes genéricamente 'qué te gustaría coordinar' de nuevo.";
            } else {
                $phaseGuidance = "Actividades de Trabajo Detalladas O*NET - Pregunta sobre NICHOS, ESPECIALIZACIONES y tipos de proyectos específicos dentro del área detectada.";
            }
        }

        // NUEVO: Preparar historial de preguntas anteriores para evitar repeticiones
        $previousQuestionsText = "";
        $bannedStarts = [];

        if (!empty($historial)) {
            $recentQuestions = array_slice($historial, -5, 5); // Últimas 5 preguntas
            $questionsList = [];
            foreach ($recentQuestions as $item) {
                if (isset($item['texto_pregunta'])) {
                    $qText = $item['texto_pregunta'];
                    $questionsList[] = $qText;

                    // Detectar inicios comunes para prohibirlos
                    $words = explode(' ', trim($qText));
                    if (count($words) >= 4) {
                        // Tomar las primeras 3-4 palabras como "inicio"
                        $start = implode(' ', array_slice($words, 0, 4));
                        $bannedStarts[] = mb_strtolower($start, 'UTF-8');

                        // También prohibir variantes cortas
                        if (count($words) >= 3) {
                            $shortStart = implode(' ', array_slice($words, 0, 3));
                            $bannedStarts[] = mb_strtolower($shortStart, 'UTF-8');
                        }
                    }
                }
            }
            if (!empty($questionsList)) {
                $previousQuestionsText = "\n  \"previous_questions\": [\"" . implode("\", \"", $questionsList) . "\"]";
            }
        }

        $bannedStartsJson = json_encode(array_unique($bannedStarts));

        // NUEVO: Variación de Estilo Aleatoria
        $styles = [
            "ESCENARIO: Describe una situación específica y pregunta qué haría el usuario.",
            "ELECCIÓN_DIRECTA: Pregunta sobre una preferencia sin listar las opciones en la pregunta.",
            "HIPOTÉTICO: 'Imagina que eres...' o 'Si pudieras...'",
            "ENTORNO: Enfócate en el lugar o atmósfera.",
            "BASADO_EN_TAREA: Enfócate en la acción específica o tarea diaria.",
            "BASADO_EN_ROL: Enfócate en la responsabilidad o posición."
        ];
        // Seleccionar un estilo basado en el índice para rotación determinista pero variada
        $styleIndex = ($n % count($styles));
        $currentStyle = $styles[$styleIndex];

        // NUEVO: Preparar instrucción especial para regeneración
        $regenerationInstruction = "";
        $previousOptionsText = "";
        if ($previousQuestion) {
            $previousText = $previousQuestion['texto'] ?? '';
            $previousOptions = $previousQuestion['opciones'] ?? [];
            // Eliminar la opción escape de las anteriores
            $previousOptions = array_filter($previousOptions, fn($opt) => $opt !== '[EXPLORAR_OTRAS_OPCIONES]');
            $previousOptionsJson = json_encode(array_values($previousOptions));

            $regenerationInstruction = "\n  \"modo_regeneracion\": true,\n  \"mantener_pregunta\": \"{$previousText}\",\n  \"opciones_previas\": {$previousOptionsJson}";
        }

        // Lógica de Personalización con Nombre (4-5 veces por test)
        // Índices elegidos para distribuir: 3, 7, 12, 16, 19
        $indicesConNombre = [3, 7, 12, 16, 19];

        // OBTENER NOMBRE DEL PERFIL (Prioridad absoluta)
        // Si no hay perfil o no hay nombre en el perfil, NO USAR EL NOMBRE (no usar el del usuario/login)
        $nombrePerfil = $user->perfil ? $user->perfil->nombre : null;
        $tieneNombreValido = !empty($nombrePerfil);

        // Solo activar si toca en este índice Y tenemos nombre real de perfil
        $usarNombreEnPregunta = ($tieneNombreValido && in_array($n, $indicesConNombre)) ? 'true' : 'false';
        $nombreUsuario = $nombrePerfil ?? '';

        // Instrucción extra si toca usar nombre
        $nameInstruction = ($usarNombreEnPregunta === 'true')
            ? "\nOBLIGATORIO: INCLUYE el nombre '{$nombreUsuario}' en el texto de la pregunta para personalizarla (ej: '{$nombreUsuario}, ¿qué prefieres...?')."
            : "";

        // Lógica de Preguntas con IMAGEN (2, 10, 20) - Cambio solicitado: Q2 en vez de Q1
        $indicesImagen = [2, 10, 20];

        // CORRECCIÓN: Si estamos en MODO REGENERACIÓN, debemos comprobar si la pregunta ANTERIOR era de tipo imagen
        // para mantener el tipo 'imagen' al regenerar.
        $eraImagen = false;
        if ($previousQuestion && isset($previousQuestion['tipo']) && $previousQuestion['tipo'] === 'imagen') {
            $eraImagen = true;
        }

        $solicitarImagen = (in_array($n, $indicesImagen) || $eraImagen) ? 'true' : 'false';

        $imagenInstruction = ($solicitarImagen === 'true')
            ? "\nOBLIGATORIO: Genera EXACTAMENTE 4 opciones. El campo 'tipo' debe ser 'imagen'. Las opciones deben ser FRASES CORTAS Y VISUALES (ej: 'Reparar un motor', 'Diseñar un edificio') que sirvan como PROMPT para generar una imagen."
            : "";

        // Lógica de Transition Insights (5, 10, 15)
        // Se solicita A PARTIR de la siguiente, así que detectamos si venimos de 5, 10, 15? 
        // No, el insight se muestra ANTES de la Q6, Q11, Q16. 
        // Mejor solicitarlo EN la generación de Q6, Q11, Q16 como un campo extra "insight_previo".
        $indicesInsight = [6, 11, 16];
        $solicitarInsight = in_array($n, $indicesInsight) ? 'true' : 'false';
        $insightInstruction = ($solicitarInsight === 'true')
            ? "\nOBLIGATORIO: Genera un campo 'insight_transicion'. Resume en una frase positiva qué has detectado del usuario en la fase anterior (ej: 'He notado que te interesa mucho la tecnología...')."
            : "";

        // Prompt Base JSON Estricto con RIASEC/O*NET
        $baseInstruction = "SISTEMA: Eres un orientador vocacional profesional que utiliza los estándares Holland RIASEC y O*NET.

ENTRADA:
{
  \"fase\": \"{$phase}\",
  \"indice_pregunta\": {$n},
  \"total_preguntas\": 20,
  \"resumen_usuario\": \"{$userSummary}\",
  \"ultima_interaccion\": \"{$lastInteraction}\",
  \"estado_actual\": { \"area\": \"{$area}\", \"subarea\": \"{$subarea}\" },
  \"evidencia_semantica\": {$semanticEvidence},
  \"dominios_requeridos\": {$requiredDomainsJson},
  \"dominios_cubiertos\": {$coveredDomainsJson},
  \"dominios_pendientes\": {$pendingDomainsJson},
  \"permitir_especializacion\": {$allowSpecialization},
  \"inicios_prohibidos\": {$bannedStartsJson},
  \"estilo_requerido\": \"{$currentStyle}\",
  \"nombre_usuario\": \"{$nombreUsuario}\",
  \"usar_nombre\": {$usarNombreEnPregunta},
  \"solicitar_imagen\": {$solicitarImagen},
  \"solicitar_insight\": {$solicitarInsight}{$previousQuestionsText}{$regenerationInstruction}
}

ESTÁNDARES PROFESIONALES:
{$phaseGuidance}

{$ageContext}

REGLA DE IDIOMA CRÍTICA:
- TODO EL CONTENIDO DE SALIDA (Preguntas y Opciones) DEBE ESTAR EN ESPAÑOL (Español de España).
- NUNCA uses inglés en los campos 'texto' u 'opciones'.
- Las claves del JSON deben permanecer en inglés (texto, opciones, domain).

REGLAS CRÍTICAS:
1. Las preguntas deben ser CONCRETAS, basadas en ACTIVIDADES o ESCENARIOS, nunca abstractas.
{$nameInstruction}
{$imagenInstruction}
{$insightInstruction}
2. Las opciones deben representar DIFERENTES dominios (excepto en Fase 4 de especialización).
3. NUNCA repitas estructuras o temas de 'previous_questions'.
4. NUNCA uses lenguaje abstracto (\"qué valoras\", \"qué prefieres\" sin contexto).
5. Si pending_domains no está vacío y allow_specialization es falso: DEBES explorar pending_domains.
6. Longitud: máx 120 caracteres.
7. Genera EXACTAMENTE 4 opciones (la 5ª opción de escape se añadirá automáticamente).
8. CRÍTICO: NUNCA LISTES LAS OPCIONES DENTRO DEL TEXTO DE LA PREGUNTA (ej: \"¿Prefieres A, B o C?\"). La pregunta debe ser abierta o situacional.
9. ALCANCE: Incluye todos los niveles educativos (FP, Grados, Oficios, Certificados). No asumas solo Universidad.

MODO REGENERACIÓN (si regeneration_mode es true):
- CRÍTICO: Usa EXACTAMENTE el mismo texto de pregunta de \"keep_question\".
- Genera 4 opciones COMPLETAMENTE DIFERENTES de \"previous_options\".
- Las nuevas opciones deben explorar el MISMO tema pero con DIFERENTES actividades/escenarios.
- Ejemplo: Si el anterior tenía \"Dibujar\", \"Hacer ejercicio\", el nuevo podría ser \"Ver series\", \"Quedar con amigos\".
- OBLIGATORIO: el campo texto debe ser IDÉNTICO a keep_question.

ANTI-REPETICIÓN (CRÍTICO):
- Si se proporciona previous_questions: NUNCA hagas preguntas similares.
- NUNCA repitas la redacción, estructura o tema de la pregunta.
- Cada pregunta DEBE explorar un aspecto COMPLETAMENTE NUEVO.
- Usa DIFERENTES verbos, contextos y escenarios.
- Ejemplo: Si el anterior preguntó \"Qué actividades...\", pregunta \"En qué entorno...\" o \"Qué tipo de proyectos...\".
- LA VARIEDAD ES OBLIGATORIA.

ANTI-REDUNDANCIA (ESTRICTO):
- NO COMIENCES preguntas con frases encontradas en 'banned_starts'.
- EVITA estructuras repetitivas como '¿Qué tipo de proyecto...?', '¿Qué rol...?' si se usaron recientemente.
- USA el 'required_style' para formular la pregunta.
- CRÍTICO: NUNCA LISTES LAS OPCIONES DENTRO DEL TEXTO DE LA PREGUNTA.

FORMATO DE SALIDA:
{
  \"texto\": \"Texto de la pregunta (máx 120 caracteres)\",
  \"opciones\": [\"Opción1\", \"Opción2\", \"Opción3\", \"Opción4\"],
  \"razonamiento\": \"Explicación breve de por qué se hace esta pregunta (para el usuario)\",
  \"domain\": \"nombre_dominio\",
  \"tipo\": \"texto\" 
}
CAMPO TIPO: \"texto\" por defecto. Si se solicitan imágenes explícitamente, usar \"imagen\".
SI ES TIPO IMAGEN: \"opciones\" debe contener descripciones visuales para buscar fotos.

CRÍTICO: Las opciones deben ser TEXTO PLANO sin prefijos (A., B., 1., 2., etc.).";

        // FASE 1 (1-5): Exploración General con ANÁLISIS TEMPRANO DEL PERFIL (preguntas 1-3)
        if ($n <= 5) {
            $perfilInstruction = !empty($perfil) ? "PERFIL DEL USUARIO: {$perfil}" : "";
            $perfilFocus = ($n <= 3 && !empty($perfil)) ? "

────────────────────────────────────────────
USO DEL PERFIL (Preguntas 3-5)
────────────────────────────────────────────
El perfil SOLO debe ayudar a personalizar, NO a encerrar al usuario en un área concreta.

EJEMPLO:
Si el perfil menciona programación, tecnología, CCNA:
- Mención ligera inicial
- NO debes hacer todas las preguntas de tecnología
- NO debes preguntar certificaciones técnicas hasta fase 4

REGLA:
- VALIDA los intereses mencionados en el perfil con preguntas específicas
- EXPLORA áreas relacionadas con las habilidades del perfil
- HAZ preguntas que ayuden a FILTRAR rápidamente hacia profesiones específicas
- OBJETIVO: En 2-3 preguntas, tener una dirección clara hacia un área profesional concreta
- PERO SIEMPRE manteniendo DIVERSIDAD de opciones" : "";

            return "{$baseInstruction}

────────────────────────────────────────────
FASE 1 (Preguntas 1-5): Exploración Amplia y Hobbies
────────────────────────────────────────────
{$perfilInstruction}
{$perfilFocus}

OBJETIVO: Detectar intereses generales (RIASEC) a través de PREFERENCIAS DE ACTIVIDAD Y HOBBIES.
NO asumas un contexto laboral o corporativo todavía.

INSTRUCCIONES CRÍTICAS FASE 1:
- CÉNTRATE EN: Hobbies, intereses personales, clases favoritas, actividades de tiempo libre.
- PROHIBIDO: Preguntar sobre \"roles en un proyecto\", \"departamentos de empresa\", \"gestión de negocios\", \"planes financieros\", \"PROYECTOS\".
- EVITA EL SESGO DE OFICINA: Incluye opciones manuales, artísticas, al aire libre, científicas, de ayuda social.
- PREGUNTA CLAVE: \"¿Qué disfrutas haciendo?\" NO \"¿De qué quieres trabajar?\".

EJEMPLOS BUENOS (Exploratorios):
- 'Cuando tienes tiempo libre, ¿qué prefieres hacer?'
   [\"Reparar o construir objetos\", \"Leer o investigar temas curiosos\", \"Dibujar o crear música\", \"Organizar una comida con amigos\"]

- '¿Qué tipo de documentales o vídeos te llaman más la atención?'
   [\"Sobre naturaleza y animales\", \"Sobre tecnología y futuro\", \"Sobre historia y personas\", \"Sobre arte y diseño\"]

EJEMPLOS MALOS (Demasiado específicos/Corporativos):
- '¿Qué rol tendrías en una empresa?' (Muy pronto)
- '¿Desarrollar un plan de negocios?' (Muy específico)
- '¿Gestionar un equipo?' (Asume jerarquía laboral)
- Todas las opciones son de trabajar sentado ante un ordenador.";
        }

        // FASE 2 (6-10): Entorno y Valores
        if ($n <= 10) {
            $perfilHint = !empty($perfil) ? "\n\nPERFIL (uso moderado para personalizar contexto): {$perfil}" : "";

            // Sub-temas rotativos para evitar repetición (Q8 vs Q9)
            $subTemas = [
                6 => "TIPO DE ESPACIO FÍSICO (Laboratorio, Oficina, Aire libre, Taller)",
                7 => "DINÁMICA DE HORARIO Y RITMO (Plazos fijos, Flexibilidad, Urgencias, Rutina)",
                8 => "INTERACCIÓN SOCIAL Y EQUIPO (Trabajo solo, Pequeño equipo, Gran empresa, Liderazgo)",
                9 => "VALORES Y PROPÓSITO (Innovación, Ayuda social, Estabilidad, Dinero/Prestigio)",
                10 => "ESTILO DE SUPERVISIÓN Y AUTONOMÍA (Instrucciones claras vs Libertad total)"
            ];
            $enfoqueActual = $subTemas[$n] ?? "Entorno General";

            return "{$baseInstruction}

────────────────────────────────────────────
FASE 2 (Preguntas 6-10): Entorno Laboral - PREGUNTA ESPECÍFICA: {$enfoqueActual}
────────────────────────────────────────────
ESTADO ACTUAL: Área detectada: {$area}.{$perfilHint}

OBJETIVO: Definir preferencias de entorno SIN REPETIR PREGUNTAS ANTERIORES.

INSTRUCCIONES ESPECÍFICAS PARA PREGUNTA {$n}:
- CÉNTRATE EXCLUSIVAMENTE EN: {$enfoqueActual}.
- NO preguntes sobre otros aspectos.
- USA ESCENARIOS TANGIBLES (No abstractos).

EJEMPLOS DE VARIEDAD:
- Si toca 'Interacción Social': '¿Te agobia estar rodeado de gente todo el día o te recarga de energía?'
- Si toca 'Valores': '¿Preferirías ganar menos dinero pero sentir que ayudas a alguien directamente?'
- Si toca 'Entorno Físico': '¿Te ves más arreglando algo con las manos manchadas o tecleando en un despacho limpio?'

CRÍTICO ANTI-REPETICIÓN:
- NO uses la palabra 'PROYECTO'.
- Haz la pregunta específica al subtema asignado.";
        }

        // FASE 3 (11-15): Roles Específicos
        if ($n <= 15) {
            $perfilHint = !empty($perfil) ? "\n\nPERFIL (pista secundaria): {$perfil}" : "";
            return "{$baseInstruction}
            
────────────────────────────────────────────
FASE 3 (Preguntas 11-15): Roles y Tareas
────────────────────────────────────────────
ESTADO ACTUAL (Acumulado): Área: {$area} > Subárea: {$subarea}.{$perfilHint}

CRÍTICO - VALIDADOR DE COHERENCIA:
- Chequea la 'ultima_interaccion'.
- ¿La última respuesta del usuario encaja con el 'ESTADO ACTUAL'?
- SI NO ENCAJA: PRIORIZA la 'ultima_interaccion' sobre el Estado Actual. El usuario puede haber cambiado de opinión.
- EJEMPLO: Si Estado es 'Tecnología' pero usuario acaba de elegir 'Cuidar personas', cambia el enfoque a 'Sanidad/Social' INMEDIATAMENTE.

OBJETIVO: Identificar el ROL específico y tareas concretas.
Liderar, analizar, crear, enseñar, construir, investigar.

INSTRUCCIONES ESPECÍFICAS:
- Pregunta sobre TAREAS DIARIAS y ACCIONES (verbos de acción).
- Enfócate en: 'Te pasas el día...', 'Tu herramienta principal es...', 'Tu objetivo hoy es...'.

EJEMPLOS BUENOS (SITUACIONES):
- 'Tienes que arreglar un problema urgente. ¿Qué prefieres que sea?'
   [\"Un fallo en un código/máquina\", \"Un cliente enfadado\", \"Un error en un diseño\", \"Un desajuste en el presupuesto\"]

- '¿Qué te cansa MENOS hacer durante 4 horas seguidas?'
   [\"Escribir informes\", \"Hablar con gente\", \"Mover cajas/material\", \"Analizar números\"]

IMPORTANTE: Evita preguntar '¿Qué te gustaría ser?'. Pregunta '¿Qué te gustaría HACER HOY?'. Avoid 'PROJECTS'.

TRADUCCIÓN PARA MENORES (<18):
- REEMPLAZA 'Desarrollo Profesional' POR 'Tu Futuro'.
- REEMPLAZA 'Impacto Social' POR 'Ayudar a los demás'.
- REEMPLAZA 'Autonomía' POR 'Hacerlo a tu manera'.
- REEMPLAZA 'Estabilidad' POR 'Tener las cosas claras'.";
        }

        // FASE 4 (16-20): Validación y Afinación de Especialización
        $perfilHint = !empty($perfil) ? "\nPERFIL (pista secundaria): {$perfil}" : "";

        // Rotación de temas de especialización para evitar preguntar siempre "¿Qué proyecto?"
        $subTemasFase4 = [
            16 => "NICHO ESPECÍFICO O SUB-SECTOR (Ej: Residencial vs Comercial / Frontend vs Backend)",
            17 => "PÚBLICO OBJETIVO O USUARIO FINAL (Ej: Niños, Empresas, Pacientes, Clientes VIP)",
            18 => "ENFOQUE METODOLÓGICO (Ej: Innovador/Experimental vs Tradicional/Estable)",
            19 => "ALCANCE Y ESCALA (Ej: Impacto Local/Personal vs Global/Masivo)",
            20 => "HERRAMIENTAS O MEDIO PREFERIDO (Ej: Digital/Remoto vs Físico/Presencial)"
        ];
        $enfoqueFase4 = $subTemasFase4[$n] ?? "Especialización General";

        return "{$baseInstruction}

────────────────────────────────────────────
FASE 4 (Preguntas 16-20): Validación y Afinación - ENFOQUE: {$enfoqueFase4}
────────────────────────────────────────────
ESTADO ACTUAL: Área: {$area} > Subárea: {$subarea}.{$perfilHint}

OBJETIVO: Afinar la especialización. NO REPETIR PREGUNTAS DE 'TIPO DE PROYECTO'.
Cada pregunta debe atacar un ángulo diferente de la profesión.

INSTRUCCIONES ESPECÍFICAS PARA PREGUNTA {$n}:
- CÉNTRATE EXCLUSIVAMENTE EN: {$enfoqueFase4}.
- SI YA SE PREGUNTÓ SOBRE PROYECTOS, PREGUNTA SOBRE PERSONAS O MÉTODOS.
- PLANTEA UN DILEMA. 'Tienes que elegir entre A y B'.

EJEMPLOS DE VARIEDAD POR ENFOQUE:
- (Público): 'Un cliente te pide algo imposible. ¿Prefieres explicárselo con datos técnicos o convencerle emocionalmente?'
- (Metodología): '¿Prefieres un manual de instrucciones paso a paso o que te dejen experimentar hasta que funcione?'
- (Alcance): '¿Prefieres que tu trabajo lo usen 10 personas intensamente o 1 millón de personas superficialmente?'

PROHIBIDO:
- Usar la palabra 'PROYECTO'.
- Preguntar cosas genéricas. Busca el MATIZ.

TRADUCCIÓN PARA MENORES (<18):
- REEMPLAZA términos corporativos ('cliente', 'empresa', 'mercado') por términos de ESTUDIO/VIDA ('profesor', 'escuela', 'gente').
- REEMPLAZA 'Especialización' por 'Lo que más te gusta'.";
    }

    private function updateUserSummary($sesion, $question, $answer)
    {
        // Lógica simple de resumen: Concatenar palabras clave o usar Gemini para resumir (costoso).
        // Por ahora, haremos una concatenación inteligente de las últimas respuestas.
        // En una implementación ideal, llamaríamos a Gemini cada 5 preguntas para "comprimir" el historial.

        $currentSummary = $sesion->user_summary ?? "";

        // Limpiamos la respuesta de caracteres extraños
        $cleanAnswer = strip_tags($answer);

        // Añadimos al resumen
        $newEntry = " | Q{$sesion->current_index}: {$cleanAnswer}";

        // Mantenemos el resumen manejable (últimos 500 caracteres aprox)
        if (strlen($currentSummary) > 1000) {
            $currentSummary = "..." . substr($currentSummary, -1000);
        }

        $sesion->user_summary = $currentSummary . $newEntry;
        $sesion->save();
    }

    private function llamarGeminiAPI($prompt)
    {
        $apiKey = env('GEMINI_API_KEY');
        $url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={$apiKey}";

        // Enmascarar la API Key para los logs de depuración
        $maskedUrl = str_replace($apiKey, substr($apiKey, 0, 4) . '...' . substr($apiKey, -4), $url);
        Log::info("Llamando a Gemini. URL: {$maskedUrl}");
        Log::info("Prompt Length: " . strlen($prompt) . " | API Key Length: " . strlen($apiKey));

        $maxRetries = 3;
        $attempt = 0;
        $delay = 2;

        while ($attempt < $maxRetries) {
            $attempt++;

            try {
                $response = Http::timeout(30)->withHeaders(['Content-Type' => 'application/json'])
                    ->post($url, [
                        "contents" => [
                            [
                                "parts" => [
                                    ["text" => $prompt]
                                ]
                            ]
                        ],
                        "generationConfig" => [
                            "temperature" => 0.7,
                            "maxOutputTokens" => 500,
                            "responseMimeType" => "application/json"
                        ]
                    ]);

                if ($response->successful()) {
                    $data = $response->json();
                    if (isset($data['candidates'][0]['content']['parts'][0]['text'])) {
                        return $data['candidates'][0]['content']['parts'][0]['text'];
                    }
                    Log::error("🔥 Gemini API Invalid Structure: " . json_encode($data));
                    throw new \Exception("Respuesta inválida de Gemini");
                }

                // Si es 429, reintentar
                if ($response->status() === 429) {
                    Log::warning("⚠️ Gemini Rate Limit (429). Reintentando en {$delay}s... (Intento {$attempt}/{$maxRetries})");
                    sleep($delay);
                    $delay *= 2;
                    continue;
                }

                Log::error("🔥 Gemini API Error: " . $response->status() . " - " . $response->body());
                throw new \Exception("Error en API Gemini: " . $response->status());

            } catch (\Exception $e) {
                Log::error("❌ Error HTTP/Red en llamada a Gemini: " . $e->getMessage());
                if ($attempt >= $maxRetries) {
                    throw $e;
                }
                sleep($delay);
            }
        }

        throw new \Exception("Gemini API falló tras {$maxRetries} intentos.");
    }

    private function validarEstructuraPregunta($data)
    {
        return isset($data['texto']) &&
            isset($data['opciones']) &&
            is_array($data['opciones']) &&
            count($data['opciones']) >= 2;
    }

    private function checkSimilarity($text1, $text2)
    {
        if (empty($text1) || empty($text2))
            return false;

        $sim = 0;
        similar_text($text1, $text2, $sim);
        return $sim > 65;
    }

    private function getFallbackQuestion($n, $estado)
    {
        if ($n <= 4) {
            return [
                'texto' => '¿Qué tipo de actividades disfrutas más en tu tiempo libre?',
                'opciones' => ['Crear cosas', 'Ayudar a otros', 'Resolver problemas', 'Organizar datos']
            ];
        }
        if ($n <= 9) {
            return [
                'texto' => '¿Qué sector te llama más la atención?',
                'opciones' => ['Tecnología', 'Sanidad', 'Arte y Diseño', 'Negocios']
            ];
        }
        if ($n <= 14) {
            return [
                'texto' => 'Dentro de este sector, ¿qué rol prefieres?',
                'opciones' => ['Técnico', 'Gestión', 'Creativo', 'Investigación']
            ];
        }
        return [
            'texto' => '¿En qué te gustaría especializarte?',
            'opciones' => ['Desarrollo', 'Consultoría', 'Docencia', 'Emprendimiento']
        ];
    }

    private function limpiarJson($text)
    {
        // 1. Eliminar bloques de código markdown ```json ... ``` o ``` ... ```
        if (preg_match('/```(?:json)?\s*([\s\S]*?)\s*```/', $text, $matches)) {
            $text = $matches[1];
        }

        // 2. Limpiar espacios extra
        $text = trim($text);

        // 3. Intentar encontrar el primer '{' y el último '}'
        $start = strpos($text, '{');
        $end = strrpos($text, '}');

        if ($start !== false && $end !== false && $end > $start) {
            $text = substr($text, $start, $end - $start + 1);
        }

        return $text;
    }

    /**
     * Limpia prefijos alfabéticos o numéricos de las opciones.
     * Ejemplo: "A. Opción" -> "Opción"
     */
    private function limpiarOpcionesPrefijos($opciones)
    {
        if (!is_array($opciones)) {
            return $opciones;
        }

        return array_map(function ($opcion) {
            // Eliminar prefijos como "A.", "B.", "1.", "2.", "A)", "B)", etc.
            // Patrón: letra o número seguido de punto o paréntesis y espacio opcional
            $cleaned = preg_replace('/^[A-Za-z0-9]+[\.\)]\s*/', '', trim($opcion));
            return $cleaned;
        }, $opciones);
    }

    private function construirContexto($historial, $estado = [], $fullHistory = false)
    {
        // Si $fullHistory es true, enviamos TODO el historial (para resultados finales)
        // Si es false, usamos ventana deslizante (para generación de preguntas)

        $txt = "";
        if (empty($historial)) {
            $txt .= "Ninguna.\n";
        } else {
            $total = count($historial);
            // Si es fullHistory, window es el total, si no, es 3
            $window = $fullHistory ? $total : 3;
            $start = max(0, $total - $window);

            // Si hay preguntas ocultas (solo en modo no-full), indicarlo
            if ($start > 0 && !$fullHistory) {
                $txt .= "... (interacciones 1 a {$start} omitidas por brevedad) ...\n";
            }

            $slice = array_slice($historial, $start);
            foreach ($slice as $i => $h) {
                $idx = $start + $i + 1;
                $pregunta = $h['texto_pregunta'] ?? 'Pregunta';
                $respuesta = $h['respuesta'] ?? '';
                // Formato compacto: Q: ... A: ...
                $txt .= "Q{$idx}: \"{$pregunta}\" -> A: \"{$respuesta}\"\n";
            }
        }

        // El estado se inyecta en el prompt principal, no aquí para evitar duplicidad
        return $txt;
    }

    private function getStaticQuestion($n)
    {
        $staticQuestions = [
            1 => [
                'texto' => '¿Qué tipo de actividades disfrutas más en tu tiempo libre?',
                'opciones' => [
                    'Crear cosas (dibujar, escribir, construir)',
                    'Resolver problemas lógicos o matemáticos',
                    'Ayudar a otras personas o enseñar',
                    'Organizar eventos o liderar grupos'
                ]
            ],
            2 => [
                'texto' => 'Si tuvieras que trabajar en un proyecto, ¿qué rol preferirías?',
                'opciones' => [
                    'Investigar y analizar datos',
                    'Diseñar la parte visual o creativa',
                    'Coordinar al equipo y los recursos',
                    'Ejecutar tareas prácticas y manuales'
                ]
            ],
            3 => [
                'texto' => '¿Qué ambiente de trabajo te resulta más atractivo?',
                'opciones' => [
                    'Un laboratorio o centro de investigación',
                    'Un estudio artístico o agencia creativa',
                    'Una oficina corporativa o de negocios',
                    'Un hospital, escuela o centro comunitario'
                ]
            ]
        ];

        $q = $staticQuestions[$n] ?? $staticQuestions[1];
        // Asegurar estructura
        $q['id'] = 'static_' . $n;
        $q['numero'] = $n;
        $q['source'] = 'static';
        return $q;
    }

    private function obtenerPerfilTexto($user)
    {
        if (!$user || !$user->perfil)
            return "";

        $p = $user->perfil;
        $info = "";

        // Solo incluimos Habilidades, Intereses y Experiencia (contextual)
        // Excluimos explícitamente: Edad, Estudios concretos, Empresas específicas

        if ($p->intereses && $p->intereses->count() > 0)
            $info .= "Intereses: " . $p->intereses->pluck('nombre')->implode(', ') . ". ";

        if ($p->habilidades && $p->habilidades->count() > 0)
            $info .= "Habilidades: " . $p->habilidades->pluck('nombre')->implode(', ') . ". ";

        // Si hay experiencia, la resumimos de forma genérica (ej: "Ha trabajado en...")
        // Aquí asumimos que no tenemos un campo de experiencia estructurado en el modelo Perfil mostrado,
        // pero si existiera, lo filtraríamos. Por ahora nos limitamos a lo seguro.

        return $info;
    }

    /**
     * Calcular coincidencia estricta basada en palabras clave.
     * Reglas:
     * 1. Coincidencia exacta (normalizada) -> VERDADERO
     * 2. Si no, tokenizar y contar palabras coincidentes (ignorando palabras vacías).
     * 3. Si la habilidad requerida tiene < 3 palabras significativas: Requiere TODAS.
     * 4. Si tiene >= 3 palabras: Requiere el 75% de coincidencia.
     */
    private function calcularCoincidenciaPalabras(string $texto1, string $texto2): bool
    {
        // 1. Normalización básica
        $t1 = $this->normalizarTexto($texto1);
        $t2 = $this->normalizarTexto($texto2);

        if ($t1 === $t2)
            return true;
        if (str_contains($t1, $t2) && strlen($t2) > 4)
            return true; // Contiene palabra clave fuerte
        if (str_contains($t2, $t1) && strlen($t1) > 4)
            return true;

        // 2. Tokenización y Stop Words
        $stopWords = ['de', 'del', 'el', 'la', 'los', 'las', 'un', 'una', 'y', 'o', 'en', 'con', 'para', 'por', 'al', 'lo', 'se', 'su', 'sus', 'como', 'entre'];

        $tokens1 = array_diff(explode(' ', $t1), $stopWords);
        $tokens2 = array_diff(explode(' ', $t2), $stopWords);

        // Filtrar tokens vacíos o muy cortos (<2 chars)
        $tokens1 = array_filter($tokens1, fn($t) => strlen($t) > 1);
        $tokens2 = array_filter($tokens2, fn($t) => strlen($t) > 1);

        if (empty($tokens1) || empty($tokens2))
            return false;

        // 3. Contar coincidencias
        $matches = 0;
        foreach ($tokens1 as $word1) {
            foreach ($tokens2 as $word2) {
                // Coincidencia exacta de palabra o raíz muy similar (ej: programacion vs programar)
                if ($word1 === $word2 || (str_starts_with($word1, $word2) && strlen($word2) > 3) || (str_starts_with($word2, $word1) && strlen($word1) > 3)) {
                    $matches++;
                    break; // Count once per word in t1
                }
            }
        }

        $count1 = count($tokens1);

        // 4. Aplicar Reglas
        if ($count1 < 3) {
            // Frase corta: Requiere coincidencia total de palabras significativas
            return $matches >= $count1;
        } else {
            // Frase larga: Requiere el 75% de coincidencia
            return ($matches / $count1) >= 0.75;
        }
    }

    /**
     * Normalizar texto para comparación (minúsculas, sin acentos, sin paréntesis)
     */
    private function normalizarTexto(string $texto): string
    {
        $texto = mb_strtolower($texto, 'UTF-8');
        $texto = preg_replace('/\([^)]*\)/', '', $texto); // Eliminar contenido entre paréntesis
        $texto = preg_replace('/\s+/', ' ', trim($texto)); // Normalizar espacios

        // Eliminar acentos
        $acentos = ['á' => 'a', 'é' => 'e', 'í' => 'i', 'ó' => 'o', 'ú' => 'u', 'ñ' => 'n'];
        $texto = strtr($texto, $acentos);

        return trim($texto);
    }

    /**
     * Analiza los resultados del test y genera recomendaciones.
     */
    public function analizarResultados(Request $request)
    {
        $user = Auth::user(); // O $request->user()
        $sessionId = $request->input('session_id');

        if (!$sessionId) {
            // Intentar buscar la última sesión activa si no se envía ID
            $sesion = TestSesion::where('usuario_id', $user->id)
                ->orderBy('created_at', 'desc')
                ->first();
        } else {
            $sesion = TestSesion::where('id', $sessionId)
                ->where('usuario_id', $user->id)
                ->first();
        }

        if (!$sesion) {
            return response()->json(['success' => false, 'error' => 'Sesión no encontrada'], 404);
        }

        // OPTIMIZACIÓN: Si ya tiene resultados, no volver a llamar a Gemini
        if (!empty($sesion->resultados)) {
            return response()->json([
                'success' => true,
                'resultados' => $sesion->resultados,
                'cached' => true
            ]);
        }

        // Construir el texto del historial para el prompt (HISTORIAL COMPLETO)
        $historialTexto = $this->construirContexto($sesion->historial, $sesion->toStateArray(), true);
        $perfilInfo = $this->obtenerPerfilTexto($user);

        // Obtener habilidades del usuario para el matching
        $userSkills = [];
        if ($user->perfil && $user->perfil->habilidades) {
            $userSkills = $user->perfil->habilidades->pluck('nombre')->toArray();
        }
        $userSkillsStr = implode(', ', $userSkills);

        // 1. OBTENER ÁREAS SEMÁNTICAS RELEVANTES
        $semanticAreas = $sesion->semantic_areas ?? [];

        // Ordenar por peso descendente (usando uasort para arrays de arrays)
        uasort($semanticAreas, function ($a, $b) {
            $weightA = is_array($a) ? ($a['weight'] ?? 0) : $a;
            $weightB = is_array($b) ? ($b['weight'] ?? 0) : $b;
            return $weightB <=> $weightA;
        });

        // Tomar las top 2 si tienen peso suficiente
        $topAreas = [];
        foreach ($semanticAreas as $area => $data) {
            $weight = is_array($data) ? $data['weight'] : $data; // Compatibilidad estructura
            if ($weight >= 1) { // Umbral mínimo
                $topAreas[$area] = $weight;
            }
            if (count($topAreas) >= 2)
                break;
        }

        // Si no hay áreas con peso, usar el área detectada o "General"
        if (empty($topAreas)) {
            $areaPrincipal = $sesion->area ?? 'General';
            $topAreas[$areaPrincipal] = 1;
        }

        // Construir string de áreas para el prompt
        $areasNombres = array_map(fn($k) => $this->prettyAreaName($k), array_keys($topAreas));
        $areasStr = implode(' y ', $areasNombres);

        $instruccionAreas = "";
        if (count($topAreas) > 1) {
            $instruccionAreas = "ÁREAS DETECTADAS: El usuario tiene afinidad con **{$areasStr}**.
            - IMPRESCINDIBLE: Genera 3 profesiones DIVERSAS.
            - OPCIÓN 1: Una profesión ideal que COMBINE ambas áreas.
            - OPCIÓN 2: Una profesión pura de la primera área.
            - OPCIÓN 3: Una profesión pura de la segunda área.
            - NO te limites a una sola área. La variedad es clave.";
        } else {
            $instruccionAreas = "ÁREA: El usuario tiene afinidad con **{$areasStr}**.
            - Genera 3 profesiones especializadas dentro de este campo.
            - Busca roles distintos (ej: uno técnico, uno creativo, uno de gestión) dentro del mismo sector.";
        }

        // 2. CONTEXTO DE EDAD (Menores vs Adultos)
        $edad = 25;
        if ($user && $user->perfil && $user->perfil->fecha_nacimiento) {
            $edad = $user->perfil->fecha_nacimiento->age;
        }
        $isMinor = ($edad < 18);

        $ageInstruction = "";
        if ($isMinor) {
            $ageInstruction = "
CONTEXTO USUARIO: MENOR DE EDAD ({$edad} años).
CRÍTICO - SALIDA ACADÉMICA:
- El usuario NO busca trabajo hoy. Busca QUÉ ESTUDIAR.
- El campo 'titulo' DEBE SER EL NOMBRE DEL ESTUDIO, NO DE LA PROFESIÓN.
- EJEMPLO MAL: 'Enfermero'.
- EJEMPLO BIEN: 'Grado en Enfermería' o 'FP en Cuidados Auxiliares'.
- NUNCA uses 'Especialista en...'. Usa nombres de TÍTULOS OFICIALES.";
        } else {
            $ageInstruction = "CONTEXTO USUARIO: ADULTO ({$edad} años). Enfoque laboral real. Usa el Catálogo Nacional de Ocupaciones (CNO-11) de España.";
        }

        // 3. PROMPT DETERMINISTA (Mejorado para ponderación)
        $outputType = $isMinor ? 'títulos académicos' : 'profesiones CNO-11';
        $prompt = "Eres un experto orientador vocacional de alto nivel.
OBJETIVO: Recomendar 3 salidas ({$outputType}) ESPECÍFICAS Y REALES basadas en: {$areasStr}.

{$ageInstruction}
{$instruccionAreas}

DATOS DEL USUARIO:
- Habilidades: {$userSkillsStr}
- Perfil: {$perfilInfo}
- Historial COMPLETO de respuestas:
{$historialTexto}

REGLAS DE PONDERACIÓN (CRÍTICAS):
1. CUENTA las respuestas por tema.
   - Si el usuario eligió 'Sanidad' 8 veces y 'Arte' 2 veces, el resultado PRIMARIO DEBE SER SANIDAD.
   - Ignora las 'respuestas aspiracionales' de última hora si contradicen la mayoría de respuestas.
   - La coherencia con la MAYORÍA es más importante que la última respuesta.

REGLAS DE NOMENCLATURA (CRÍTICAS):
1. PROHIBIDO TÍTULOS GENÉRICOS DE IA.
   - NUNCA generes: 'Especialista en...', 'Gestor de [Tema]...', 'Experto en...', 'Técnico especialista'.
   - SI ES ADULTO: Usa SOLO títulos del Catálogo Nacional de Ocupaciones (CNO-11) (ej: 'Ingeniero de Software', 'Celador', 'Abogado').
   - SI ES MENOR: Usa SOLO nombres de GRADOS UNIVERSITARIOS o CICLOS FP (ej: 'Grado en Psicología', 'FP Desarrollo Web').
2. NUNCA inventes profesiones. Deben existir en LinkedIn España.

INSTRUCCIONES DE SALIDA (JSON EXACTO):
Genera un JSON con esta estructura:
{
  \"profesiones\": [
    {
      \"titulo\": \"Nombre EXACTO (CNO-11 o Título Académico)\",
      \"descripcion\": \"Descripción motivadora explicando POR QUÉ encaja con su mayoría de respuestas (3 líneas)\",
      \"salidas\": \"3 salidas laborales concretas\",
      \"nivel\": \"Nivel de estudios (FP / Grado / Máster)\",
      \"sector\": \"Sector principal\",
      \"habilidades\": [
        { \"nombre\": \"Habilidad Técnica Clave\", \"posee_usuario\": true/false },
        { \"nombre\": \"Soft Skill Clave\", \"posee_usuario\": true/false },
        { \"nombre\": \"Habilidad Diferencial\", \"posee_usuario\": true/false },
        { \"nombre\": \"Habilidad Blanda 1\", \"posee_usuario\": true/false },
        { \"nombre\": \"Habilidad Blanda 2\", \"posee_usuario\": true/false },
        { \"nombre\": \"Habilidad Blanda 3\", \"posee_usuario\": true/false }
      ],
      \"estudios\": [
        \"Estudio Oficial 1 (Grado/FP)\",
        \"Estudio Oficial 2 (Grado/FP)\",
        \"Postgrado/Especialización\",
        \"Alternativa (Bootcamp/Certificación)\"
      ]
    }
  ]
}

REGLAS FINALES:
- Genera EXACTAMENTE 3 resultados de ALTA CALIDAD.
- Prioriza la frecuencia de temas en el historial sobre la recencia.
- Respuesta SOLO JSON válido sin markdown.";


        try {
            // Llamada a Gemini con más tokens para análisis detallado
            $apiKey = env('GEMINI_API_KEY');
            $url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={$apiKey}";

            Log::info("Analizando resultados del test con Gemini...");

            $response = Http::timeout(60)->withHeaders(['Content-Type' => 'application/json'])
                ->post($url, [
                    "contents" => [
                        [
                            "parts" => [
                                ["text" => $prompt]
                            ]
                        ]
                    ],
                    "generationConfig" => [
                        "temperature" => 0.7,
                        "maxOutputTokens" => 2000, // Aumentado para respuestas más detalladas
                        "responseMimeType" => "application/json"
                    ]
                ]);

            if (!$response->successful()) {
                throw new \Exception("Error en API Gemini: " . $response->status());
            }

            $data = $response->json();
            if (!isset($data['candidates'][0]['content']['parts'][0]['text'])) {
                throw new \Exception("Respuesta inválida de Gemini");
            }

            $jsonResponse = $data['candidates'][0]['content']['parts'][0]['text'];
            $resultados = json_decode($this->limpiarJson($jsonResponse), true);

            if (!isset($resultados['profesiones']) || !is_array($resultados['profesiones'])) {
                throw new \Exception("Formato de respuesta inválido de Gemini");
            }

            // VALIDACIÓN ESTRICTA DE HABILIDADES Y ESTUDIOS (Usar servicio centralizado)
            $comparador = new ProfesionComparadorService();
            foreach ($resultados['profesiones'] as &$prof) {
                // Convertir array a objeto temporal para el comparador
                $profObj = (object) $prof;
                $profObj = $comparador->enriquecerProfesion($profObj, $user->perfil);

                // Actualizar habilidades con la comparación correcta
                if (isset($profObj->habilidades_comparadas)) {
                    $prof['habilidades'] = $profObj->habilidades_comparadas;
                }

                // Actualizar estudios con la comparación correcta
                if (isset($profObj->estudios_comparados)) {
                    $prof['estudios'] = $profObj->estudios_comparados;
                }
            }
            unset($prof); // Limpiar referencia

            // ASEGURAR MÁXIMO 3 RESULTADOS
            $resultados['profesiones'] = array_slice($resultados['profesiones'], 0, 3);

            // Guardar resultados y finalizar sesión
            $sesion->resultados = $resultados;
            $sesion->estado = 'completado';
            $sesion->completed_at = now();
            $sesion->save();

            // GUARDAR EN TABLA DE RESULTADOS (Para que ResultadosTest.jsx lo encuentre)
            DB::table('test_results')->insert([
                'usuario_id' => $user->id,
                'test_session_id' => $sesion->id,
                'answers' => json_encode($sesion->historial),
                'result_text' => 'Análisis vocacional completado',
                'modelo' => 'gemini-2.0-flash',
                'profesiones' => json_encode($resultados['profesiones']),
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            return response()->json([
                'success' => true,
                'resultados' => $resultados
            ]);

        } catch (\Exception $e) {
            Log::error("❌ Error al analizar resultados: " . $e->getMessage());
            Log::error("Stack trace: " . $e->getTraceAsString());
            Log::error("Archivo: " . $e->getFile() . " Línea: " . $e->getLine());

            // FALLBACK ROBUSTO: Si Gemini falla, devolvemos resultados predefinidos basados en el área
            $area = $sesion->area ?? 'General';

            $fallbackResultados = [
                'profesiones' => [
                    [
                        'titulo' => 'Especialista en ' . $area,
                        'descripcion' => 'Tu perfil muestra afinidad con este sector. Esta profesión te permitirá desarrollar tu potencial.',
                        'salidas' => 'Empresas del sector, Consultoría, Emprendimiento',
                        'nivel' => 'Grado Universitario / FP Superior',
                        'sector' => $area,
                        'habilidades' => [
                            ['nombre' => 'Resolución de problemas', 'posee_usuario' => true],
                            ['nombre' => 'Trabajo en equipo', 'posee_usuario' => true],
                            ['nombre' => 'Comunicación efectiva', 'posee_usuario' => false]
                        ],
                        'estudios' => ['Grado relacionado con ' . $area, 'Máster de especialización']
                    ],
                    [
                        'titulo' => 'Gestor de Proyectos en ' . $area,
                        'descripcion' => 'Ideal para perfiles con capacidad de organización y liderazgo.',
                        'salidas' => 'Gestión de equipos, Planificación, Dirección',
                        'nivel' => 'Grado Universitario + Máster',
                        'sector' => 'Gestión / ' . $area,
                        'habilidades' => [
                            ['nombre' => 'Liderazgo', 'posee_usuario' => false],
                            ['nombre' => 'Organización', 'posee_usuario' => true],
                            ['nombre' => 'Gestión del tiempo', 'posee_usuario' => true]
                        ],
                        'estudios' => ['Grado en Administración', 'MBA', 'Certificación PMP']
                    ],
                    [
                        'titulo' => 'Técnico Especialista',
                        'descripcion' => 'Enfoque práctico y técnico para resolver problemas concretos.',
                        'salidas' => 'Industria, Mantenimiento, Soporte',
                        'nivel' => 'FP Grado Superior',
                        'sector' => 'Técnico',
                        'habilidades' => [
                            ['nombre' => 'Habilidad técnica', 'posee_usuario' => true],
                            ['nombre' => 'Atención al detalle', 'posee_usuario' => true]
                        ],
                        'estudios' => ['Ciclo Formativo de Grado Superior', 'Cursos de especialización']
                    ]
                ]
            ];

            // Guardar fallback en sesión y BD para que persista
            $sesion->resultados = $fallbackResultados;
            $sesion->estado = 'completado';
            $sesion->completed_at = now();
            $sesion->save();

            try {
                DB::table('test_results')->insert([
                    'usuario_id' => $user->id,
                    'test_session_id' => $sesion->id,
                    'answers' => json_encode($sesion->historial),
                    'result_text' => 'Análisis vocacional completado (Fallback)',
                    'modelo' => 'fallback',
                    'profesiones' => json_encode($fallbackResultados['profesiones']),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            } catch (\Exception $dbEx) {
                Log::error("Error guardando fallback en DB: " . $dbEx->getMessage());
            }

            return response()->json([
                'success' => true,
                'resultados' => $fallbackResultados,
                'warning' => 'Resultados generados por sistema de respaldo (API no disponible)'
            ]);
        }
    }

    /**
     * Genera una imagen para una profesión usando Pexels y Gemini para el prompt.
     * OPTIMIZADO CON CACHÉ
     */
    public function generarImagenPorProfesion(Request $request)
    {
        $profesion = $request->input('profesion');
        if (!$profesion) {
            return response()->json(['error' => 'Profesión requerida'], 400);
        }

        try {
            // Cachear para evitar llamadas repetidas a la API para la misma profesión
            $cacheKeyTerm = 'term_img_' . md5(strtolower(trim($profesion)));

            $searchTerm = Cache::remember($cacheKeyTerm, 60 * 24 * 7, function () use ($profesion) {
                // 1. Usar Gemini para obtener un término de búsqueda en inglés optimizado
                $prompt = "Translate this profession to a simple, visual English search term for a stock photo website (Pexels).
                Profession: '{$profesion}'.
                Output ONLY the English term, nothing else. Example: 'Software Developer' or 'Nurse hospital'.";

                // Usamos una llamada rápida a Gemini
                // Nota: Usamos una instancia separada o llamada directa para evitar bucles,
                // pero aquí reutilizaremos llamarGeminiAPI simplificando el prompt.
                // En producción idealmente esto sería una tabla fija o un servicio de traducción dedicado.
                $term = trim($this->llamarGeminiAPI($prompt));
                $term = str_replace(['"', "'", '`', '**'], '', $term);
                return trim($term);
            });

            Log::info("🔍 Término de búsqueda (Cacheado/Generado) para '{$profesion}': '{$searchTerm}'");

            // CACHÉ 2: URL de imagen (7 días)
            $cacheKeyImg = 'pexels_url_' . md5($searchTerm);
            $cachedUrl = Cache::get($cacheKeyImg);

            if ($cachedUrl) {
                return response()->json([
                    'success' => true,
                    'imagenUrl' => $cachedUrl,
                    'term' => $searchTerm,
                    'source' => 'pexels_cached'
                ]);
            }

            // Si no está en caché, llamar a Pexels
            $pexelsKey = env('PEXELS_API_KEY');
            if (!$pexelsKey) {
                throw new \Exception("Pexels API Key no configurada");
            }

            $response = Http::withHeaders([
                'Authorization' => $pexelsKey
            ])->get("https://api.pexels.com/v1/search", [
                        'query' => $searchTerm,
                        'per_page' => 1,
                        'orientation' => 'landscape',
                        'size' => 'medium'
                    ]);

            if ($response->failed()) {
                Log::error("Error Pexels: " . $response->body());
                // NO CACHEAMOS el error para reintentar luego
                return response()->json([
                    'success' => false,
                    'imagenUrl' => 'https://placehold.co/800x600?text=' . urlencode($profesion),
                    'source' => 'fallback_error'
                ]);
            }

            $data = $response->json();
            $imageUrl = $data['photos'][0]['src']['large2x'] ??
                $data['photos'][0]['src']['large'] ??
                $data['photos'][0]['src']['medium'] ??
                'https://placehold.co/800x600?text=' . urlencode($profesion);

            // Guardar en caché solo si es una imagen válida (no default si es posible evitarlo, pero aquí asumimos que si Pexels responde ok, es válido)
            Cache::put($cacheKeyImg, $imageUrl, 60 * 24 * 7);

            return response()->json([
                'success' => true,
                'imagenUrl' => $imageUrl,
                'term' => $searchTerm,
                'source' => 'pexels'
            ]);

        } catch (\Exception $e) {
            Log::error("❌ Error generando imagen: " . $e->getMessage());
            return response()->json([
                'success' => false,
                'imagenUrl' => 'https://placehold.co/800x600?text=' . urlencode($profesion),
                'error' => $e->getMessage()
            ]);
        }
    }

    // ==========================================
    // SISTEMA SEMÁNTICO DE ÁREAS
    // ==========================================

    /**
     * Devuelve la definición completa de áreas semánticas con sus palabras clave.
     * Cubre el espectro completo de profesiones en España.
     *
     * @return array
     */
    private function getSemanticAreasDefinition()
    {
        return [
            'tecnologia' => [
                'keywords' => ['tecnología', 'informática', 'programación', 'programar', 'software', 'desarrollo', 'desarrollar', 'frontend', 'backend', 'fullstack', 'devops', 'datos', 'data', 'analisis de datos', 'ciberseguridad', 'inteligencia artificial', 'machine learning', 'cloud', 'bases de datos', 'sql', 'javascript', 'python', 'java', 'mobile', 'aplicaciones', 'app', 'web', 'sistemas', 'redes informáticas', 'networking', 'ordenador', 'computadora', 'código', 'codificar', 'algoritmo', 'hardware', 'servidor', 'linux', 'windows'],
                'weight' => 0
            ],
            'ciencia' => [
                'keywords' => [
                    'ciencia',
                    'científico',
                    'investigación',
                    'investigar',
                    'investigador',
                    'experimento',
                    'experimentos',
                    'experimentar',
                    'experimental',
                    'laboratorio',
                    'lab',
                    'ensayo',
                    'ensayos',
                    'prueba',
                    'pruebas',
                    'química',
                    'químico',
                    'reacción',
                    'molécula',
                    'átomo',
                    'física',
                    'físico',
                    'partículas',
                    'mecánica',
                    'cuántica',
                    'biología',
                    'biólogo',
                    'célula',
                    'genética',
                    'adn',
                    'microscopio',
                    'hipótesis',
                    'teoría',
                    'método científico',
                    'análisis',
                    'analizar',
                    'datos',
                    'estadística',
                    'matemáticas',
                    'lógica',
                    'cálculo',
                    'materiales',
                    'innovación',
                    'descubrimiento',
                    'curiosidad',
                    'observación',
                    'deducción',
                    'patrones',
                    'causa',
                    'efecto'
                ],
                'weight' => 0
            ],
            'sanidad' => [
                'keywords' => [
                    // Keywords existentes
                    'sanidad',
                    'salud',
                    'enfermería',
                    'enfermero',
                    'enfermera',
                    'medicina',
                    'médico',
                    'doctor',
                    'hospital',
                    'clínica',
                    'paciente',
                    'pacientes',
                    'fisioterapia',
                    'fisioterapeuta',
                    'terapia',
                    'psicología',
                    'psicólogo',
                    'odontología',
                    'dentista',
                    'farmacia',
                    'farmacéutico',
                    'auxiliar',
                    'cuidados',
                    'diagnóstico',
                    'tratamiento',
                    'curar',
                    'sanar',
                    'bienestar',
                    'anatomía',
                    'fisiología',
                    'urgencias',

                    // Primeros Auxilios y Emergencias
                    'primeros auxilios',
                    'auxilios',
                    'socorrismo',
                    'socorrista',
                    'rcp',
                    'reanimación',
                    'reanimación cardiopulmonar',
                    'vendaje',
                    'vendajes',
                    'venda',
                    'vendas',
                    'emergencia médica',
                    'emergencias médicas',
                    'ambulancia',
                    'paramédico',
                    'técnico sanitario',
                    'trauma',
                    'traumatología',
                    'traumatólogo',
                    'herida',
                    'heridas',
                    'lesión',
                    'lesiones',
                    'hemorragia',
                    'sangrado',
                    'fractura',
                    'fracturas',
                    'quemadura',
                    'quemaduras',
                    'intoxicación',
                    'asfixia',
                    'atragantamiento',
                    'desmayo',
                    'camilla',
                    'botiquín',
                    'desfibrilador',
                    'dea',
                    'triaje',
                    'estabilización',
                    'inmovilización',

                    // Especialidades médicas adicionales
                    'radiología',
                    'radiólogo',
                    'laboratorio clínico',
                    'análisis clínicos',
                    'técnico de laboratorio',
                    'quirófano',
                    'cirugía',
                    'cirujano',
                    'pediatría',
                    'pediatra',
                    'geriatría',
                    'geriatra',
                    'cardiología',
                    'cardiólogo',
                    'neurología',
                    'neurólogo',
                    'oncología',
                    'oncólogo',
                    'ginecología',
                    'ginecólogo',
                    'oftalmología',
                    'oftalmólogo',
                    'dermatología',
                    'dermatólogo',

                    // Cuidados y asistencia
                    'cuidador',
                    'cuidadora',
                    'asistencia sanitaria',
                    'atención domiciliaria',
                    'residencia',
                    'geriátrico',
                    'rehabilitación',
                    'terapeuta ocupacional',
                    'nutrición',
                    'nutricionista',
                    'dietista',
                    'higiene',
                    'esterilización',
                    'desinfección'
                ],
                'weight' => 0
            ],
            'educacion' => [
                'keywords' => ['educación', 'docencia', 'profesor', 'profesora', 'maestro', 'maestra', 'enseñar', 'enseñanza', 'tutor', 'pedagogía', 'formación', 'didáctica', 'educador', 'orientación educativa', 'colegio', 'instituto', 'universidad', 'escuela', 'alumno', 'estudiante', 'clase', 'aula', 'aprender', 'aprendizaje', 'explicar', 'transmitir'],
                'weight' => 0
            ],
            'social' => [
                'keywords' => [
                    'social',
                    'trabajo social',
                    'trabajador social',
                    'trabajadora social',
                    'inclusión',
                    'inclusión social',
                    'exclusión social',
                    'comunidad',
                    'comunitario',
                    'asistencia social',
                    'servicios sociales',
                    'mediación',
                    'mediador',
                    'mediadora',
                    'voluntariado',
                    'voluntario',
                    'cooperación',
                    'ayuda',
                    'ayudar',
                    'ayuda social',
                    'personas',
                    'colectivos',
                    'grupos vulnerables',
                    'infancia',
                    'menores',
                    'juventud',
                    'integración',
                    'reinserción',
                    'ong',
                    'organizaciones sin ánimo de lucro',
                    'tercer sector',
                    'asociación',
                    'fundación',
                    'vulnerable',
                    'vulnerabilidad',
                    'apoyo',
                    'apoyo social',
                    'solidaridad',
                    'solidario',
                    'derechos humanos',
                    'derechos sociales',
                    'sociedad',
                    'bienestar social',
                    'intervención social',
                    'acción social',
                    'benéfico',
                    'beneficencia',
                    'caridad',
                    'impacto social',
                    'cambio social',
                    'orientación social',
                    'asesoramiento social',
                    'familia',
                    'familias',
                    'menores en riesgo',
                    'adopción',
                    'acogida',
                    'inmigración',
                    'inmigrantes',
                    'refugiados',
                    'diversidad',
                    'multiculturalidad',
                    'empoderamiento',
                    'participación ciudadana'
                ],
                'weight' => 0
            ],
            'derecho' => [
                'keywords' => [
                    'derecho',
                    'derechos',
                    'legal',
                    'jurídico',
                    'jurídica',
                    'abogado',
                    'abogada',
                    'abogacía',
                    'letrado',
                    'asesorar',
                    'asesoramiento',
                    'asesoría',
                    'asesor legal',
                    'casos',
                    'caso legal',
                    'expediente',
                    'informes',
                    'informe legal',
                    'informe jurídico',
                    'tribunal',
                    'juzgado',
                    'corte',
                    'justicia',
                    'legislación',
                    'normativa',
                    'ley',
                    'leyes',
                    'contratos',
                    'contrato',
                    'acuerdo',
                    'litigios',
                    'litigio',
                    'demanda',
                    'defensa',
                    'defender',
                    'representación legal',
                    'procurador',
                    'procuradora',
                    'notario',
                    'notaría',
                    'derecho civil',
                    'derecho penal',
                    'derecho laboral',
                    'derecho mercantil',
                    'derecho administrativo',
                    'derecho familiar',
                    'derecho internacional',
                    'constitucional',
                    'constitución',
                    'sentencia',
                    'resolución judicial',
                    'arbitraje',
                    'mediación legal',
                    'asesoría jurídica',
                    'consultoría legal',
                    'bufete',
                    'despacho de abogados',
                    'código',
                    'código penal',
                    'código civil',
                    'jurisprudencia',
                    'doctrina legal'
                ],
                'weight' => 0
            ],
            'administracion' => [
                'keywords' => ['administración', 'gestión', 'contabilidad', 'finanzas', 'recursos humanos', 'rrhh', 'oficina', 'secretariado', 'administrativo', 'contable', 'auditoría', 'gestor', 'empresa', 'organización', 'planificación', 'documentación', 'archivo', 'negocio', 'economía', 'presupuesto'],
                'weight' => 0
            ],
            'comunicacion' => [
                'keywords' => ['marketing', 'publicidad', 'comunicación', 'periodismo', 'redactor', 'contenido', 'content creator', 'youtube', 'streaming', 'influencer', 'social media', 'seo', 'sem', 'copywriting', 'comunicador', 'medios', 'prensa', 'radio', 'televisión', 'redes sociales', 'campaña', 'audiencia'],
                'weight' => 0
            ],
            'creatividad' => [
                'keywords' => [
                    'arte',
                    'artístico',
                    'artes plásticas',
                    'pintura',
                    'dibujo',
                    'escultura',
                    'ilustración',
                    'diseño',
                    'diseñador',
                    'diseñadora',
                    'gráfico',
                    'diseño ux',
                    'diseño ui',
                    'ux/ui',
                    'experiencia de usuario',
                    'interfaz de usuario',
                    'diseño instruccional',
                    'experiencias',
                    'creativo',
                    'creatividad',
                    'fotografía',
                    'fotógrafo',
                    'fotógrafa',
                    'vídeo',
                    'video',
                    'videografía',
                    'producción audiovisual',
                    'audiovisual',
                    'animación',
                    'animador',
                    'motion graphics',
                    'dirección de arte',
                    'director de arte',
                    'diseño de aplicaciones',
                    'diseño de apps',
                    'tecnología educativa',
                    'diseño de interfaces',
                    'diseño centrado en el usuario',
                    'educación digital',
                    'talleres creativos',
                    'crear',
                    'creación',
                    'visual',
                    'diseño visual',
                    'estética',
                    'color',
                    'composición',
                    'branding',
                    'identidad visual',
                    'tipografía',
                    'layout'
                ],
                'weight' => 0
            ],
            'artes_escenicas' => [
                'keywords' => ['teatro', 'actor', 'actriz', 'dramaturgia', 'dirección escénica', 'escenografía', 'coreografía', 'danza', 'bailar', 'música', 'músico', 'compositor', 'canto', 'cantante', 'producción musical', 'sonido', 'espectáculo', 'escena', 'interpretación', 'cine', 'película', 'guion'],
                'weight' => 0
            ],
            'oficios' => [
                'keywords' => ['electricidad', 'electricista', 'mecánico', 'fontanería', 'fontanero', 'carpintería', 'carpintero', 'soldadura', 'soldador', 'albañilería', 'albañil', 'construcción', 'mantenimiento', 'reparación', 'reparar', 'instalaciones', 'jardinería', 'jardinero', 'peluquería', 'estética', 'taller', 'herramienta', 'manual', 'técnico', 'montaje'],
                'weight' => 0
            ],
            'juridico' => [
                'keywords' => ['derecho', 'abogado', 'fiscal', 'procurador', 'notario', 'registrador', 'oposiciones', 'funcionario', 'juez', 'magistrado', 'asesor legal', 'ley', 'legislación', 'jurídico', 'legal', 'justicia', 'tribunal', 'normativa', 'reglamento'],
                'weight' => 0
            ],
            'seguridad' => [
                'keywords' => ['policía', 'bombero', 'emergencias', 'seguridad privada', 'protección', 'rescate', 'defensa', 'protección civil', 'salvamento', 'militar', 'vigilancia', 'guardia', 'seguridad', 'ejército', 'armada'],
                'weight' => 0
            ],
            'logistica' => [
                'keywords' => ['logística', 'transporte', 'almacén', 'conductor', 'camionero', 'reparto', 'cadena de suministro', 'planificación de rutas', 'operador logístico', 'distribución', 'envío', 'stock', 'inventario', 'flota'],
                'weight' => 0
            ],
            'comercio' => [
                'keywords' => ['ventas', 'vender', 'retail', 'comercio', 'tienda', 'dependiente', 'comercio electrónico', 'ecommerce', 'atención al cliente', 'televenta', 'vendedor', 'cliente', 'negociación', 'producto'],
                'weight' => 0
            ],
            'hosteleria' => [
                'keywords' => ['hostelería', 'turismo', 'hotel', 'recepción', 'gestión hotelera', 'guía turístico', 'agencia de viajes', 'restaurante', 'evento', 'catering', 'cocina', 'chef', 'camarero', 'barista', 'bar', 'cafetería', 'gastronomía'],
                'weight' => 0
            ],
            'deporte' => [
                'keywords' => ['deporte', 'entrenador', 'monitor', 'actividad física', 'fitness', 'nutrición deportiva', 'coach', 'bienestar', 'salud deportiva', 'gimnasio', 'entrenar', 'ejercicio', 'competición', 'atleta'],
                'weight' => 0
            ],
            'veterinaria' => [
                'keywords' => ['veterinaria', 'veterinario', 'animales', 'zoología', 'ganadería', 'cuidado animal', 'agronomía', 'medio ambiente', 'sostenibilidad', 'ecología', 'mascota', 'fauna', 'flora', 'naturaleza'],
                'weight' => 0
            ],
            'emprendimiento' => [
                'keywords' => ['emprendimiento', 'emprender', 'startup', 'cofundador', 'intraemprendedor', 'negocio propio', 'gestión de proyectos', 'project manager', 'pm', 'scrum', 'agile', 'empresa propia', 'autónomo', 'liderazgo', 'innovación', 'estrategia'],
                'weight' => 0
            ]
        ];
    }

    // ==========================================
    // SISTEMA ANTI-REPETICIÓN SEMÁNTICA
    // ==========================================

    /**
     * Calcula similitud de texto usando distancia de Levenshtein (similar_text).
     * Normalizado a un valor entre 0.0 y 1.0.
     *
     * @param string $texto1
     * @param string $texto2
     * @return float Similitud entre 0.0 y 1.0
     */
    private function calcularSimilitudTexto(string $texto1, string $texto2): float
    {
        $texto1 = mb_strtolower(trim($texto1), 'UTF-8');
        $texto2 = mb_strtolower(trim($texto2), 'UTF-8');

        if (empty($texto1) || empty($texto2)) {
            return 0.0;
        }

        similar_text($texto1, $texto2, $percent);
        return $percent / 100.0;
    }

    /**
     * Calcula similitud de Jaccard entre dos textos.
     * Compara la intersección de palabras únicas sobre la unión.
     *
     * @param string $texto1
     * @param string $texto2
     * @return float Similitud entre 0.0 y 1.0
     */
    private function calcularSimilitudJaccard(string $texto1, string $texto2): float
    {
        $texto1 = mb_strtolower(trim($texto1), 'UTF-8');
        $texto2 = mb_strtolower(trim($texto2), 'UTF-8');

        if (empty($texto1) || empty($texto2)) {
            return 0.0;
        }

        // Tokenizar en palabras
        $palabras1 = preg_split('/\s+/', $texto1);
        $palabras2 = preg_split('/\s+/', $texto2);

        // Eliminar stopwords comunes en español
        $stopwords = ['el', 'la', 'de', 'que', 'y', 'a', 'en', 'un', 'ser', 'se', 'no', 'haber', 'por', 'con', 'su', 'para', 'como', 'estar', 'tener', 'le', 'lo', 'todo', 'pero', 'más', 'hacer', 'o', 'poder', 'decir', 'este', 'ir', 'otro', 'ese', 'si', 'me', 'ya', 'ver', 'porque', 'dar', 'cuando', 'él', 'muy', 'sin', 'vez', 'mucho', 'saber', 'qué', 'sobre', 'mi', 'alguno', 'mismo', 'yo', 'también', 'hasta', 'año', 'dos', 'querer', 'entre', 'así', 'primero', 'desde', 'grande', 'eso', 'ni', 'nos', 'llegar', 'pasar', 'tiempo', 'ella', 'sí', 'día', 'uno', 'bien', 'poco', 'deber', 'entonces', 'poner', 'cosa', 'tanto', 'hombre', 'parecer', 'nuestro', 'tan', 'donde', 'ahora', 'parte', 'después', 'vida', 'quedar', 'siempre', 'creer', 'hablar', 'llevar', 'dejar', 'nada', 'cada', 'seguir', 'menos', 'nuevo', 'encontrar', 'algo', 'solo', 'decir', 'salir', 'volver', 'tomar', 'conocer', 'vivir', 'sentir', 'tratar', 'mirar', 'contar', 'empezar', 'esperar', 'buscar', 'existir', 'entrar', 'trabajar', 'escribir', 'perder', 'producir', 'ocurrir', 'entender', 'pedir', 'recibir', 'recordar', 'terminar', 'permitir', 'aparecer', 'conseguir', 'comenzar', 'servir', 'sacar', 'necesitar', 'mantener', 'resultar', 'leer', 'caer', 'cambiar', 'presentar', 'crear', 'abrir', 'considerar', 'oír', 'acabar', 'mil', 'te', 'les', 'cual', 'cómo', 'cuál'];

        $palabras1 = array_diff($palabras1, $stopwords);
        $palabras2 = array_diff($palabras2, $stopwords);

        // Conjuntos únicos
        $set1 = array_unique($palabras1);
        $set2 = array_unique($palabras2);

        // Intersección y unión
        $interseccion = count(array_intersect($set1, $set2));
        $union = count(array_unique(array_merge($set1, $set2)));

        if ($union === 0) {
            return 0.0;
        }

        return $interseccion / $union;
    }

    /**
     * Calcula similitud TF-IDF aproximada entre dos textos.
     * Usa frecuencia de términos como aproximación simple.
     *
     * @param string $texto1
     * @param string $texto2
     * @return float Similitud entre 0.0 y 1.0
     */
    private function calcularSimilitudTFIDF(string $texto1, string $texto2): float
    {
        $texto1 = mb_strtolower(trim($texto1), 'UTF-8');
        $texto2 = mb_strtolower(trim($texto2), 'UTF-8');

        if (empty($texto1) || empty($texto2)) {
            return 0.0;
        }

        // Tokenizar
        $palabras1 = preg_split('/\s+/', $texto1);
        $palabras2 = preg_split('/\s+/', $texto2);

        // Calcular frecuencias
        $freq1 = array_count_values($palabras1);
        $freq2 = array_count_values($palabras2);

        // Todas las palabras únicas
        $todasPalabras = array_unique(array_merge($palabras1, $palabras2));

        // Vectores TF
        $vector1 = [];
        $vector2 = [];

        foreach ($todasPalabras as $palabra) {
            $vector1[] = $freq1[$palabra] ?? 0;
            $vector2[] = $freq2[$palabra] ?? 0;
        }

        // Similitud coseno
        $dotProduct = 0;
        $magnitude1 = 0;
        $magnitude2 = 0;

        for ($i = 0; $i < count($vector1); $i++) {
            $dotProduct += $vector1[$i] * $vector2[$i];
            $magnitude1 += $vector1[$i] * $vector1[$i];
            $magnitude2 += $vector2[$i] * $vector2[$i];
        }

        $magnitude1 = sqrt($magnitude1);
        $magnitude2 = sqrt($magnitude2);

        if ($magnitude1 == 0 || $magnitude2 == 0) {
            return 0.0;
        }

        return $dotProduct / ($magnitude1 * $magnitude2);
    }

    /**
     * Verifica si una nueva pregunta es demasiado similar a preguntas anteriores.
     * Usa 3 algoritmos de similitud y retorna true si alguno supera el umbral.
     *
     * @param string $nuevaPregunta
     * @param array $preguntasAnteriores Array de preguntas anteriores (últimas 5)
     * @param float $umbral Umbral de similitud (default: 0.75)
     * @return bool true si es demasiado similar
     */
    private function esDemasiadoSimilar(string $nuevaPregunta, array $preguntasAnteriores, float $umbral = 0.75): bool
    {
        if (empty($preguntasAnteriores)) {
            return false;
        }

        foreach ($preguntasAnteriores as $preguntaAnterior) {
            $textoAnterior = $preguntaAnterior['texto'] ?? '';

            if (empty($textoAnterior)) {
                continue;
            }

            // Calcular 3 tipos de similitud
            $simTexto = $this->calcularSimilitudTexto($nuevaPregunta, $textoAnterior);
            $simJaccard = $this->calcularSimilitudJaccard($nuevaPregunta, $textoAnterior);
            $simTFIDF = $this->calcularSimilitudTFIDF($nuevaPregunta, $textoAnterior);

            // Si CUALQUIERA de los 3 supera el umbral, es demasiado similar
            if ($simTexto > $umbral || $simJaccard > $umbral || $simTFIDF > $umbral) {
                Log::warning("⚠️ Pregunta demasiado similar detectada:");
                Log::warning("   Nueva: " . substr($nuevaPregunta, 0, 60));
                Log::warning("   Anterior: " . substr($textoAnterior, 0, 60));
                Log::warning("   Similitudes - Texto: {$simTexto}, Jaccard: {$simJaccard}, TF-IDF: {$simTFIDF}");
                return true;
            }
        }

        return false;
    }

    // ==========================================
    // SISTEMA DE DIVERSIDAD TEMÁTICA
    // ==========================================

    /**
     * Gestiona la diversidad temática del test.
     * Garantiza que se exploren múltiples dominios antes de especializar.
     *
     * @param array $coveredDomains Dominios ya cubiertos
     * @param int $questionIndex Índice de la pregunta actual (0-19)
     * @return array Información de diversidad
     */
    private function domainDiversityManager(array $coveredDomains, int $questionIndex): array
    {
        // Definir 15 dominios profesionales obligatorios
        $allDomains = [
            'tecnologia',
            'arte_diseno',
            'sanidad',
            'educacion',
            'oficios',
            'social',
            'administracion',
            'comunicacion',
            'ciencia',
            'logistica',
            'seguridad',
            'juridico',
            'hosteleria',
            'deporte',
            'veterinaria'
        ];

        // Calcular dominios pendientes
        $pendingDomains = array_diff($allDomains, $coveredDomains);

        // Determinar si se permite especialización
        // Q1-10: Exploración obligatoria (mínimo 8 dominios)
        // Q11-15: Permitir especialización gradual
        // Q16-20: Especialización fina
        $allowSpecialization = false;
        $minDomainsRequired = 0;

        if ($questionIndex < 10) {
            // Fase 1-2: Exploración amplia
            $allowSpecialization = false;
            $minDomainsRequired = 8;
        } elseif ($questionIndex < 15) {
            // Fase 3: Permitir especialización si ya se cubrieron 8+ dominios
            $allowSpecialization = count($coveredDomains) >= 8;
            $minDomainsRequired = 8;
        } else {
            // Fase 4: Especialización fina
            $allowSpecialization = true;
            $minDomainsRequired = 8;
        }

        // Determinar dominios requeridos para esta pregunta
        $requiredDomains = [];

        if (!$allowSpecialization && count($pendingDomains) > 0) {
            // Si aún no se permite especialización, priorizar dominios pendientes
            $requiredDomains = array_values($pendingDomains);
        } else {
            // Si se permite especialización, todos los dominios son válidos
            $requiredDomains = $allDomains;
        }

        return [
            'all_domains' => $allDomains,
            'covered_domains' => $coveredDomains,
            'pending_domains' => array_values($pendingDomains),
            'required_domains' => $requiredDomains,
            'allow_specialization' => $allowSpecialization,
            'min_domains_required' => $minDomainsRequired,
            'coverage_percentage' => count($coveredDomains) / count($allDomains) * 100
        ];
    }
    private function esDuplicada($textoNuevo, $historial)
    {
        $textoNuevoLimpio = trim(mb_strtolower($textoNuevo));
        foreach ($historial as $q) {
            $textoAnterior = trim(mb_strtolower($q['texto'] ?? $q['texto_pregunta'] ?? ''));

            if (empty($textoAnterior))
                continue;

            if ($textoNuevoLimpio === $textoAnterior) {
                return true;
            }
            // Check Levenshtein for very close matches (typos or minor changes)
            // Solo si la longitud es similar para evitar falsos positivos en frases cortas
            if (abs(strlen($textoNuevoLimpio) - strlen($textoAnterior)) < 5) {
                if (levenshtein($textoNuevoLimpio, $textoAnterior) < 5) {
                    return true;
                }
            }
        }
        return false;
    }
}
