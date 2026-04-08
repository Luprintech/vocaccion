<?php

namespace App\Services;

use App\Domain\Hypothesis\QuestionStrategy;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GeminiService
{
    protected ?string $apiKey;
    protected string $baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

    // DIAGNOSTIC METRICS (TEMPORARY)
    public static $diagnostics = [
        'total_calls' => 0,
        'total_retries' => 0,
        'total_tokens_estimated' => 0,
        'history' => []
    ];

    public static function resetDiagnostics()
    {
        self::$diagnostics = [
            'total_calls' => 0,
            'total_retries' => 0,
            'total_tokens_estimated' => 0,
            'history' => []
        ];
    }

    public function __construct()
    {
        // Priorizar configuración de config/services.php
        $this->apiKey = config('services.gemini.key');

        $configUrl = config('services.gemini.url');
        if ($configUrl) {
            $this->baseUrl = $configUrl;
        }

        if (!$this->apiKey) {
            // Fallback directo a env() por si acaso config cache limpio
            $this->apiKey = env('GEMINI_API_KEY');
        }

        if (!$this->apiKey) {
            throw new \Exception("GEMINI_API_KEY no configurada en config/services.php o .env");
        }
    }

    /**
     * PROMPT 1: BATCH ANALYZER
     * Analiza un bloque de respuestas para actualizar scores RIASEC y Skills.
     *
     * @deprecated Since V2 (2025-04). V2 uses deterministic scoring via RiasecScoreCalculatorService.
     *             This method is ONLY retained for V1 legacy session compatibility (test_sessions table).
     *             DO NOT use in new code. Will be removed once V1 sessions are fully migrated.
     */
    public function analyzeBatch(array $recentHistory): array
    {
        $jsonHistory = json_encode($recentHistory, JSON_UNESCAPED_UNICODE);

        $systemInstruction = <<<EOT
ACTÚA COMO: Psicómetra Senior experto en Holland (RIASEC) y O*NET.
OBJETIVO: Analizar este bloque de respuestas recientes del usuario y extraer puntuaciones.

SALIDA ESPERADA (JSON STRICT):
{
  "scores_delta": {
    "realistic_score": [int -10 to 10],
    "investigative_score": [int -10 to 10],
    "artistic_score": [int -10 to 10],
    "social_score": [int -10 to 10],
    "enterprising_score": [int -10 to 10],
    "conventional_score": [int -10 to 10]
  },
  "new_skills": ["skill1", "skill2"],
  "discarded_areas": ["area_rejected"],
  "next_focus_recommendation": "string_summary"
}

REGLAS:
1. Sé conservador. Solo asigna puntos si la evidencia es explícita.
2. Si hay rechazo explícito, asigna puntuación negativa (-5).
3. Detecta patrones sutiles.
4. NO INVENTES. Si no hay evidencia, 0.
EOT;

        $prompt = "ENTRADA (JSON):\n" . $jsonHistory;

        return $this->callGemini($prompt, true, $systemInstruction);
    }

    /**
     * PROMPT 2: ADAPTIVE INTERVIEWER
     * Generates a personalised question when no template is available.
     *
     * @param array                $context   Session context (age, phase, last interaction…)
     * @param QuestionStrategy|null $strategy  Domain strategy decided by HypothesisDecider.
     *                                         When null, falls back to generic exploration prompt
     *                                         (legacy / warm-up / test-mock path — no change).
     * 
     * @deprecated Since V2 (2025-04). V2 uses curated question_bank items — no runtime AI generation.
     *             This method is ONLY retained for V1 legacy session compatibility (VocationalSession v=1).
     *             DO NOT use in new code. Will be removed once V1 sessions are fully migrated.
     */
    public function generateQuestion(array $context, ?QuestionStrategy $strategy = null): array
    {
        $contextStr = json_encode($context, JSON_UNESCAPED_UNICODE);

        // ── Build strategy directive ──────────────────────────────────────
        $strategyDirective = '';
        if ($strategy !== null) {
            $dimsStr = implode(' y ', $strategy->targetDimensions);
            $usedStr = empty($strategy->usedTraits)
                ? 'ninguno todavía'
                : implode(', ', array_slice($strategy->usedTraits, -8)); // last 8 to stay concise

            $strategyDirective = match ($strategy->type) {
                QuestionStrategy::CONTRAST => "ESTRATEGIA: CONTRAST — Crea una pregunta que obligue a elegir entre las dimensiones RIASEC {$dimsStr}. Las 4 opciones deben cubrir exactamente estas dimensiones.",
                QuestionStrategy::CONFIRMATION => "ESTRATEGIA: CONFIRMATION — Crea una pregunta que profundice en la dimensión RIASEC {$dimsStr}. Confirma o cuestiona el perfil dominante del usuario.",
                QuestionStrategy::EXPLORATION => "ESTRATEGIA: EXPLORATION — Explora la dimensión RIASEC {$dimsStr}. El usuario aún no ha mostrado evidencia clara en esta área.",
                default => "ESTRATEGIA: EXPLORATION — Genera una pregunta general de orientación vocacional.",
            };

            if (!empty($strategy->usedTraits)) {
                $strategyDirective .= "\nTRAITS YA USADOS (no repetir): {$usedStr}.";
            }
        }

        $systemInstruction = <<<EOT
ACTÚA COMO: Orientador Vocacional Empático.
OBJETIVO: Generar UNA (1) pregunta de opción múltiple.

INSTRUCCIONES:
1. Genera una pregunta situacional, no abstracta.
2. 4 opciones claras mapeadas a rasgos RIASEC o O*NET.
3. Tono adaptado a la edad del usuario.
4. Max 280 caracteres.
{$strategyDirective}

SALIDA ESPERADA (JSON STRICT):
{
  "pregunta": "¿...?",
  "opciones": [
    {"texto": "Opción A", "trait": "R_TECHNICAL"},
    {"texto": "Opción B", "trait": "A_CREATIVE"},
    {"texto": "Opción C", "trait": "S_SOCIAL"},
    {"texto": "Opción D", "trait": "E_LEADERSHIP"}
  ]
}
EOT;

        $prompt = "CONTEXTO ACTUAL:\n" . $contextStr;

        $response = $this->callGemini($prompt, true, $systemInstruction);

        // Normalizar estructura (adaptar mocks de tests que usan formato antiguo)
        if (isset($response['question_text'])) {
            $response['pregunta'] = $response['question_text'];
            unset($response['question_text']);
        }
        if (isset($response['options'])) {
            $response['opciones'] = array_map(function ($opt) {
                if (isset($opt['text'])) {
                    $opt['texto'] = $opt['text'];
                    unset($opt['text']);
                }
                return $opt;
            }, $response['options']);
            unset($response['options']);
        }

        return $response;
    }

    /**
     * PROMPT 2C: ITEM PERSONALIZATION (V2)
     * Select and order items from the question bank based on user profile context.
     * Called ONCE at test start. Falls back to default order on failure.
     *
     * @param array $bankItems  Array of items from question_bank: [{id, phase, dimension, text_es, age_group}, ...]
     * @param array $profile    User profile context: {age_group, bio, hobbies, education, job}
     * @return array Ordered array of item IDs, or empty array on failure (caller should use default order)
     */
    public function personalizeItemSelection(array $bankItems, array $profile): array
    {
        // If profile is empty or minimal, skip personalization
        $hasContext = !empty($profile['bio']) || !empty($profile['hobbies']) || 
                      !empty($profile['education']) || !empty($profile['job']);
        
        if (!$hasContext) {
            Log::info('[GeminiService] Skipping personalization — empty profile context');
            return []; // Caller will use default order
        }

        $profileJson = json_encode($profile, JSON_UNESCAPED_UNICODE);
        $bankJson = json_encode(array_map(function ($item) {
            // Send only relevant fields to reduce token usage
            return [
                'id' => $item['id'],
                'phase' => $item['phase'],
                'dimension' => $item['dimension'],
                'text' => $item['text_es'],
            ];
        }, $bankItems), JSON_UNESCAPED_UNICODE);

        $systemInstruction = <<<EOT
ACTÚA COMO: Psicólogo experto en evaluación vocacional con el modelo RIASEC (Holland).

OBJETIVO: Personalizar la selección y orden de preguntas del test vocacional basándote en el perfil del usuario.

CONTEXTO:
- Recibirás un banco de preguntas organizadas en 4 fases: Activities (30), Competencies (18), Occupations (18), Comparative (6).
- Debes ordenar EXACTAMENTE 72 items (30 + 18 + 18 + 6) y devolver sus IDs en el orden deseado.
  1. Las primeras preguntas sean las MÁS relevantes para el perfil del usuario (basándote en su bio, hobbies, formación, trabajo).
  2. Se mantenga la proporción por fase (30/18/18/6).
  3. Se cubran las 6 dimensiones RIASEC (R, I, A, S, E, C) de forma balanceada dentro de cada fase.
  4. El orden de fases se respete: primero todos los Likert, luego Checklist, luego Comparative.

REGLAS:
1. Analiza el perfil del usuario para identificar áreas de interés probable.
2. Prioriza preguntas que exploren esas áreas PRIMERO (aumenta engagement).
3. Si mencionan educación técnica/ingeniería, prioriza items R (Realistic) e I (Investigative) al inicio de cada fase.
4. Si mencionan hobbies creativos/artísticos, prioriza A (Artistic).
5. Si mencionan trabajo con personas/social, prioriza S (Social).
6. Si mencionan liderazgo/emprendimiento, prioriza E (Enterprising).
7. Si mencionan organización/administración, prioriza C (Conventional).
  8. Mantén diversidad — NO agrupes todas las preguntas de una dimensión al principio.

SALIDA ESPERADA (JSON STRICT):
{
  "selected_item_ids": [id1, id2, id3, ..., id72],
  "reasoning": "Breve explicación de la estrategia de ordenamiento (max 100 palabras)"
}

IMPORTANTE: La salida DEBE tener exactamente 72 IDs, en el orden deseado, respetando las proporciones por fase.
EOT;

        $prompt = <<<EOT
PERFIL DEL USUARIO:
{$profileJson}

BANCO DE PREGUNTAS DISPONIBLES:
{$bankJson}

Selecciona y ordena 72 items optimizando para el perfil del usuario.
EOT;

        try {
            $response = $this->callGemini($prompt, true, $systemInstruction, 2048);
            
            if (isset($response['selected_item_ids']) && is_array($response['selected_item_ids'])) {
                $itemIds = $response['selected_item_ids'];
                
                // Validate count
                if (count($itemIds) === 72) {
                    Log::info('[GeminiService] Personalized item selection', [
                        'reasoning' => $response['reasoning'] ?? 'No reasoning provided',
                        'first_5_ids' => array_slice($itemIds, 0, 5),
                    ]);
                    return $itemIds;
                } else {
                    Log::warning('[GeminiService] Invalid item count from personalization', [
                        'expected' => 72,
                        'received' => count($itemIds),
                    ]);
                    return []; // Fallback to default order
                }
            }

            Log::warning('[GeminiService] Invalid response format from personalization');
            return []; // Fallback to default order

        } catch (\Exception $e) {
            Log::error('[GeminiService] Personalization failed', [
                'error' => $e->getMessage(),
            ]);
            return []; // Fallback to default order
        }
    }

    /**
     * PROMPT 2B: IMAGE SEARCH TERM GENERATOR
     * Generates a concise English search term for a given profession.
     * Returns a plain string (not JSON) — used for image lookup via Pexels.
     *
     * The Http::fake in tests intercepts this call and returns:
     *   candidates[0].content.parts[0].text = 'Software Developer'
     * which this method extracts and returns directly.
     */
    public function generateImageSearchTerm(string $profesion): string
    {
        $systemInstruction = 'For the given Spanish profession name, generate a concise English search term (2-4 words max) that captures a typical work scene or activity for that profession, suitable for a stock photo search. Focus on the work environment or activity, not just the job title. Return ONLY the search term, no explanation.';
        $prompt = $profesion;

        $result = $this->callGemini($prompt, false, $systemInstruction);
        return trim($result['text'] ?? $profesion);
    }

    /**
     * PROMPT 3: VOCATIONAL REPORTER
     * Genera el informe RIASEC completo en Markdown.
     * Si el perfil tiene _raw_history, usa las respuestas directas del usuario
     * para inferir su perfil vocacional sin depender de los scores del motor.
     *
     * @param  array   $profileData    RIASEC scores + optional _user_context and _raw_history.
     * @param  array   $matchedCareers Pre-selected careers from CareerMatchingService.
     * @param  string  $userName       Optional user first name for personalized narrative.
     */
    public function generateReport(array $profileData, array $matchedCareers = [], string $userName = ''): string
    {
        // Construir bloque de scores RIASEC si existen
        $riasecBlock = '';
        $hasRealScores = (
            ($profileData['realistic_score'] ?? 0) +
            ($profileData['investigative_score'] ?? 0) +
            ($profileData['artistic_score'] ?? 0) +
            ($profileData['social_score'] ?? 0) +
            ($profileData['enterprising_score'] ?? 0) +
            ($profileData['conventional_score'] ?? 0)
        ) > 0;

        if ($hasRealScores) {
            $r = $profileData['realistic_score'] ?? 0;
            $i = $profileData['investigative_score'] ?? 0;
            $a = $profileData['artistic_score'] ?? 0;
            $s = $profileData['social_score'] ?? 0;
            $e = $profileData['enterprising_score'] ?? 0;
            $c = $profileData['conventional_score'] ?? 0;
            $total = max(1, $r + $i + $a + $s + $e + $c);

            $riasecBlock = "\nSCORES RIASEC (puntos acumulados a partir de las respuestas del test):"
                . "\n  R (Realista/Manual):       {$r} pts (" . round($r / $total * 100, 1) . "%)"
                . "\n  I (Investigador/Analítico): {$i} pts (" . round($i / $total * 100, 1) . "%)"
                . "\n  A (Artístico/Creativo):    {$a} pts (" . round($a / $total * 100, 1) . "%)"
                . "\n  S (Social/Humanista):      {$s} pts (" . round($s / $total * 100, 1) . "%)"
                . "\n  E (Emprendedor/Líder):     {$e} pts (" . round($e / $total * 100, 1) . "%)"
                . "\n  C (Convencional/Metódico): {$c} pts (" . round($c / $total * 100, 1) . "%)";
        }

        // Historial de respuestas (si los scores son 0, usamos el historial directamente)
        $historyBlock = '';
        if (!empty($profileData['_raw_history'])) {
            $historyJson = json_encode(
                array_slice($profileData['_raw_history'], 0, 20),
                JSON_UNESCAPED_UNICODE
            );
            $historyBlock = "\nRESPUESTAS DEL USUARIO EN EL TEST (analiza el patrón vocacional):\n" . $historyJson;
        }

        $systemInstruction = <<<'EOT'
ACTÚA COMO: Psicólogo Vocacional y Consultor de Carrera Senior especializado en la teoría RIASEC de Holland.
OBJETIVO: Generar un INFORME VOCACIONAL COMPLETO, exhaustivo y personalizado de al menos 800 palabras.

ESTRUCTURA OBLIGATORIA DEL INFORME (MARKDOWN, sin JSON):

# Tu Perfil Vocacional RIASEC

## 1. Análisis de tu Código Holland
Describe el código RIASEC del usuario (2-3 letras dominantes). Explica qué significa cada dimensión en términos de:
- Estilo de trabajo preferido
- Tipo de tareas que disfruta
- Entorno laboral ideal
- Fortalezas naturales
Incluye una tabla con los 6 rasgos RIASEC, su porcentaje y una valoración (★★★★★).

## 2. Retrato Psicológico-Vocacional
Parágrafo de 150-200 palabras que describa la personalidad laboral del usuario de forma inspiradora y realista. Menciona cómo sus valores, estilo cognitivo y preferencias encajan con las dimensiones Holland identificadas. **[IMPORTANTE: Usa texto en negrita (**) orgánicamente para resaltar los adjetivos, conceptos clave y fortalezas principales dentro del párrafo].**

## 3. Tus Superpoderes Profesionales
Lista de exactamente 5 habilidades clave (con bullet points), cada una con:
- Nombre de la habilidad
- Por qué el usuario la tiene (basado en el perfil)
- Cómo puede potenciarla

## 4. Tus Caminos Profesionales Recomendados
IMPORTANTE: Las profesiones ya han sido pre-seleccionadas por el algoritmo de matching RIASEC. Se te proporcionarán en el prompt del usuario bajo "PROFESIONES PRE-SELECCIONADAS". Tu labor es ÚNICAMENTE generar la narrativa personalizada para cada una.

Para CADA profesión proporcionada, escribe:
### **[Título exacto de la profesión]**
- **Compatibilidad RIASEC:** [usa el match_porcentaje proporcionado]%
- **Por qué encaja contigo:** Párrafo de 2-3 frases personalizado que conecte el perfil RIASEC del usuario con esta profesión concreta. NO inventes datos; basa tu análisis en los scores RIASEC.
- **Salidas profesionales:** [usa las salidas proporcionadas]
- **Formación recomendada:** [usa la ruta formativa proporcionada]
- **Primeros 3 pasos:** 3 acciones concretas y realistas para empezar

NO inventes, modifiques ni añadas profesiones. Usa EXACTAMENTE las que se proporcionan.

## 5. Áreas de Crecimiento
Exactamente 2 áreas de mejora basadas en las dimensiones RIASEC más bajas del usuario. Formato estricto:

1. **Nombre del Área (letra RIASEC):**
Párrafo de 3-4 frases explicando por qué esta área es relevante para el usuario y cómo puede desarrollarla. Relaciona la dimensión RIASEC baja con habilidades concretas que beneficiarían su perfil.

2. **Nombre del Área (letra RIASEC):**
Párrafo de 3-4 frases explicando por qué esta área es relevante para el usuario y cómo puede desarrollarla. Relaciona la dimensión RIASEC baja con habilidades concretas que beneficiarían su perfil.

Las 2 áreas deben ser complementarias y no repetitivas. Cada área es solo un título en negrita seguido de un párrafo descriptivo. NO uses sub-secciones, bullets ni listas dentro de cada área.

## 6. Mensaje Final de tu Mentor
Párrafo corto y personal (60-80 palabras) con un mensaje motivador, personalizado para el perfil del usuario.

REGLAS CRÍTICAS:
- Mínimo 800 palabras totales. El informe debe ser EXHAUSTIVO.
- Tono: profesional, motivador, empático y realista.
- Si recibes historial de respuestas, úsalas para inferir el perfil dominante.
- Usa Markdown limpio con headers, bullets y negrita donde corresponda.
- SIN introducciones genéricas. Empieza directamente con el contenido.
- El informe debe sentirse PERSONALIZADO, no genérico.
EOT;

        // Build user context block (name + optional _user_context from profile)
        $userContextBlock = '';
        if (!empty($userName)) {
            $userContextBlock .= "\nNombre del usuario: {$userName}";
        }
        if (!empty($profileData['_user_context'])) {
            $ctx = $profileData['_user_context'];
            if (!empty($ctx['bio']))      $userContextBlock .= "\nDescripción personal: {$ctx['bio']}";
            if (!empty($ctx['hobbies']))  $userContextBlock .= "\nIntereses y hobbies: {$ctx['hobbies']}";
            if (!empty($ctx['education'])) $userContextBlock .= "\nFormación: {$ctx['education']}";
            if (!empty($ctx['job']))      $userContextBlock .= "\nExperiencia laboral: {$ctx['job']}";
        }

        $prompt = "PERFIL DEL USUARIO:{$riasecBlock}{$historyBlock}{$userContextBlock}";
        if (empty($riasecBlock) && empty($historyBlock)) {
            $prompt = "Genera un informe vocacional completo para un usuario que acaba de responder un test vocacional adaptativo.";
            if (!empty($userContextBlock)) {
                $prompt .= "\n\nCONTEXTO DEL USUARIO:{$userContextBlock}";
            }
        }

        // Inyectar profesiones pre-seleccionadas del catálogo
        if (!empty($matchedCareers)) {
            $careersBlock = "\n\nPROFESIONES PRE-SELECCIONADAS POR EL ALGORITMO DE MATCHING (usa EXACTAMENTE estas):";
            foreach ($matchedCareers as $idx => $career) {
                $num = $idx + 1;
                $salidas = is_array($career['salidas'] ?? null) ? implode(', ', $career['salidas']) : ($career['salidas'] ?? '');
                $careersBlock .= "\n{$num}. {$career['titulo']} (Sector: {$career['sector']}, Match: {$career['match_porcentaje']}%)"
                    . "\n   Salidas: {$salidas}"
                    . "\n   Formación: " . ($career['ruta_formativa'] ?? $career['nivel_formacion'] ?? '');
            }
            $prompt .= $careersBlock;
        }

        $response = $this->callGemini($prompt, false, $systemInstruction, 8192);
        return $response['text'] ?? '';
    }

    /**
     * Genera SOLO narrativa breve para enriquecer el informe híbrido.
     * La interpretación base y cálculos RIASEC se mantienen determinísticos.
     *
     * @return array{portrait?:string, mentor?:string, superpowers?:array<int,array{name:string,why:string,how:string}>}
     */
    public function generateNarrativeSections(array $profileData, string $riasecCode = '', string $userName = ''): array
    {
        $scores = [
            'R' => (float) ($profileData['realistic_score'] ?? 0),
            'I' => (float) ($profileData['investigative_score'] ?? 0),
            'A' => (float) ($profileData['artistic_score'] ?? 0),
            'S' => (float) ($profileData['social_score'] ?? 0),
            'E' => (float) ($profileData['enterprising_score'] ?? 0),
            'C' => (float) ($profileData['conventional_score'] ?? 0),
        ];

        $prompt = "Datos RIASEC: " . json_encode([
            'riasec_code' => $riasecCode,
            'scores' => $scores,
            'user_name' => $userName,
            'context' => $profileData['_user_context'] ?? null,
        ], JSON_UNESCAPED_UNICODE);

        $systemInstruction = <<<'EOT'
ACTÚA COMO: Orientador vocacional experto en RIASEC.
OBJETIVO: Generar SOLO narrativa breve para un informe híbrido (los cálculos ya vienen hechos).

Devuelve JSON estricto con esta estructura:
{
  "portrait": "Párrafo de 90-130 palabras, personalizado, tono profesional y motivador.",
  "superpowers": [
    {"name":"...","why":"...","how":"..."},
    {"name":"...","why":"...","how":"..."},
    {"name":"...","why":"...","how":"..."},
    {"name":"...","why":"...","how":"..."},
    {"name":"...","why":"...","how":"..."}
  ],
  "mentor": "Párrafo final de 45-70 palabras."
}

REGLAS:
- NO inventes profesiones ni porcentajes.
- Mantén superpowers en exactamente 5 elementos.
- Frases claras, sin markdown, sin texto fuera del JSON.
EOT;

        return $this->callGemini($prompt, true, $systemInstruction, 1400);
    }

    /**
     * PROMPT 4: CAREER RECOMMENDATIONS
     *
     * @deprecated Since V2 (2025-04). Modern flow uses CareerMatchingService for catalog-based matching.
     *             Retained for legacy TestSesion compatibility only.
     *             DO NOT use in new code. Will be removed once V1 sessions are fully migrated.
     */
    public function generateCareerRecommendations(array $profileData, string $reportMarkdown = ''): array
    {
        $jsonProfile = json_encode($profileData, JSON_UNESCAPED_UNICODE);

        $systemInstruction = <<<EOT
ACTÚA COMO: Orientador de Carrera experto en RIASEC (Holland) y O*NET.
OBJETIVO: Extraer exactamente las 3 profesiones recomendadas en el INFORME VOCACIONAL proporcionado.
ES CRÍTICO que las 3 profesiones que devuelvas coincidan EXACTAMENTE con las 3 recomendadas en dicho informe. Si no hay informe, usa el perfil RIASEC.

SALIDA ESPERADA (JSON STRICT, array de exactamente 3 objetos):
[
  {
    "titulo": "Nombre exacto de la profesión según el informe",
    "descripcion": "Descripción motivadora de 2-3 frases sobre esta carrera y por qué encaja con el perfil del usuario",
    "salidas": "Rol concreto 1, Rol concreto 2, Rol concreto 3",
    "nivel": "Grado Universitario / FP Superior / Certificación Profesional",
    "sector": "Tecnología / Salud / Educación / Arte / Negocios / etc.",
    "match_porcentaje": 85
  }
]

REGLAS:
1. Exactamente 3 profesiones — ni más ni menos. Devuelve SOLO el array JSON.
2. Ordénalas de mayor a menor compatibilidad con el perfil RIASEC.
3. Las profesiones DEBEN ser las descritas en el informe vocacional proporcionado.
4. La descripción debe ser motivadora y personalizada al perfil del usuario.
5. Las salidas deben ser roles de trabajo específicos (no genéricos).
6. match_porcentaje: entero entre 60 y 98.
7. NO incluyas texto introductorio ni explicaciones. SOLO el array JSON.
EOT;

        $prompt = "PERFIL RIASEC DEL USUARIO:\n" . $jsonProfile;
        if (!empty($reportMarkdown)) {
            $prompt .= "\n\nINFORME VOCACIONAL (Extrae las profesiones de aquí):\n" . $reportMarkdown;
        }

        $result = $this->callGemini($prompt, true, $systemInstruction);

        // El resultado puede ser un array indexado (lista directa) o envuelto en clave
        if (isset($result[0]) && is_array($result[0])) {
            return $result;
        }
        if (isset($result['profesiones'])) {
            return $result['profesiones'];
        }

        return [];
    }

    /**
     * Método base para llamar a la API con estrategia robusta.
     * @param int $maxOutputTokens  Número máximo de tokens de salida (default 4096)
     */
    protected function callGemini(
        string $prompt,
        bool $jsonMode = false,
        string $systemInstruction = '',
        int $maxOutputTokens = 4096
    ): array {
        $startTime = microtime(true);
        $url = $this->baseUrl . '?key=' . $this->apiKey;

        // Estructura del payload optimizada
        $payload = [
            'contents' => [
                ['parts' => [['text' => $prompt]]]
            ],
            'generationConfig' => [
                'temperature' => 0.7,
                'maxOutputTokens' => $maxOutputTokens,
            ]
        ];

        // Añadir instrucción de sistema si existe (v1beta)
        if (!empty($systemInstruction)) {
            $payload['system_instruction'] = [
                'parts' => [['text' => $systemInstruction]]
            ];
        }

        if ($jsonMode) {
            $payload['generationConfig']['responseMimeType'] = 'application/json';
        }

        // --- DIAGNÓSTICO ---
        self::$diagnostics['total_calls']++;
        $charCount = strlen($prompt) + strlen($systemInstruction);
        $estTokens = ceil($charCount / 4);
        self::$diagnostics['total_tokens_estimated'] += $estTokens;

        $callLog = [
            'timestamp' => now()->toIso8601String(),
            'model' => 'gemini-2.5-flash', // Hardcoded match config
            'prompt_chars' => $charCount,
            'est_tokens' => $estTokens,
            'type' => $jsonMode ? 'JSON' : 'TEXT'
        ];
        // -------------------

        try {
            // Implementar Retry Logic (3 intentos, 100ms inicial, exponential backoff)
            $response = Http::retry(3, 100, function ($exception, $request) {
                // Count retry
                self::$diagnostics['total_retries']++;
                return $exception instanceof \Illuminate\Http\Client\ConnectionException ||
                    $exception->response->status() === 429 ||
                    $exception->response->status() >= 500;
            })->withHeaders(['Content-Type' => 'application/json'])
                ->post($url, $payload);

            $duration = microtime(true) - $startTime;
            $callLog['duration_sec'] = round($duration, 4);
            $callLog['status'] = $response->status();

            self::$diagnostics['history'][] = $callLog;

            if ($response->failed()) {
                Log::error("Gemini API Error [{$response->status()}]: " . $response->body());
                return $jsonMode ? [] : ['text' => 'Error al generar contenido.'];
            }

            $data = $response->json();

            // Detectar truncado por límite de tokens — JSON incompleto → decode fallará
            $finishReason = $data['candidates'][0]['finishReason'] ?? 'unknown';
            if ($finishReason === 'MAX_TOKENS') {
                Log::warning('Gemini MAX_TOKENS: respuesta truncada, aumentar maxOutputTokens', [
                    'model' => $callLog['model'],
                    'est_tokens' => $callLog['est_tokens'],
                    'json_mode' => $jsonMode,
                ]);
                return $jsonMode ? [] : ['text' => 'Respuesta truncada.'];
            }

            $text = $data['candidates'][0]['content']['parts'][0]['text'] ?? '';

            if ($jsonMode) {
                return json_decode(str_replace(['```json', '```'], '', $text), true) ?? [];
            }

            return ['text' => $text];

        } catch (\Exception $e) {
            Log::error("Gemini Connection Exception: " . $e->getMessage());
            $callLog['error'] = $e->getMessage();
            self::$diagnostics['history'][] = $callLog;
            return $jsonMode ? [] : ['text' => 'Error de conexión.'];
        }
    }
}
