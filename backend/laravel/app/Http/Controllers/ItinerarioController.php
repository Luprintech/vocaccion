<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use App\Models\ItinerarioBase;
use App\Models\ItinerarioGenerado;
use App\Models\Profesion;
use App\Models\TestSesion;
use App\Models\VocationalSession;
use App\Models\VocationalProfile;
use App\Services\GeminiService;
use App\Helpers\PersonalizationHelper;
use Barryvdh\DomPDF\Facade\Pdf;

class ItinerarioController extends Controller
{
    /**
     * Descargar PDF del informe.
     */
    public function descargarPDF($sessionId)
    {
        try {
            $user = Auth::user();

            // Dual-query: V2 VocationalSession first, then V1 TestSesion fallback
            $sesion = null;
            $isV2 = false;

            $vocSession = VocationalSession::where('id', $sessionId)
                ->where('usuario_id', $user->id)
                ->first();

            if ($vocSession) {
                $isV2 = true;
                // Build a compatible $sesion-like object from VocationalSession
                $sesion = (object) [
                    'area'         => null,
                    'subarea'      => null,
                    'user_summary' => null,
                ];
            } else {
                $sesion = TestSesion::where('id', $sessionId)
                    ->where('usuario_id', $user->id)
                    ->first();
            }

            if (!$sesion) {
                return response()->json(['error' => 'Sesión no encontrada.'], 404);
            }

            // Buscar el último itinerario generado por el usuario
            $itinerarioModel = ItinerarioGenerado::where('user_id', $user->id)
                ->latest()
                ->first();

            if (!$itinerarioModel) {
                return response()->json(['error' => 'No hay itinerario generado.'], 404);
            }

            // Datos del JSON guardado (campo texto_html casted a array)
            $content = $itinerarioModel->texto_html;

            $dateDisplay = now()->format('d/m/Y'); // Para vista
            $dateFile = now()->format('d-m-Y'); // Para nombre de archivo

            // Cargar imagen de la profesión y convertir a Base64 para DomPDF
            $user->load('objetivo.profesion');
            $imagenUrl = optional($user->objetivo)->profesion->imagen_url ?? null;
            $imagenBase64 = null;

            if ($imagenUrl) {
                try {
                    $imageContent = file_get_contents($imagenUrl);
                    if ($imageContent !== false) {
                        $type = pathinfo($imagenUrl, PATHINFO_EXTENSION);
                        // Si no tiene extensión o es compleja, asumir jpeg/png por defecto
                        if (empty($type) || strlen($type) > 4)
                            $type = 'jpeg';

                        $imagenBase64 = 'data:image/' . $type . ';base64,' . base64_encode($imageContent);
                    }
                } catch (\Exception $e) {
                    \Log::warning("No se pudo convertir imagen para PDF: " . $e->getMessage());
                    // Fallback: intentar pasar la URL directa si falla la conversión, aunque probablemente falle también
                    $imagenBase64 = $imagenUrl;
                }
            }

            // Preparar datos para la vista
            $data = [
                'user_name' => $user->perfil ? $user->perfil->nombre : $user->name,
                'user_email' => $user->email,
                'date' => $dateDisplay,
                'image' => $imagenBase64, // Pasar imagen en Base64
                'area' => $sesion->area,
                'subarea' => $sesion->subarea,
                'profesion_titulo' => $content['profesion'] ?? 'Profesión',
                'resumen' => $content['resumen'] ?? '',
                'vias_formativas' => $content['vias_formativas'] ?? [],
                'recomendaciones' => $content['recomendaciones'] ?? [],
                'habilidades' => $content['habilidades_necesarias'] ?? [],
                'consejo' => $content['consejo_final'] ?? '',
                'analysis' => $sesion->user_summary
            ];

            $pdf = Pdf::loadView('pdf.informe', compact('data'));
            return $pdf->download("informe-vocacional-{$dateFile}.pdf");

        } catch (\Exception $e) {
            Log::error("Error generando PDF: " . $e->getMessage());
            return response()->json(['error' => 'No se pudo generar el PDF'], 500);
        }
    }

    /**
     * Genera el itinerario académico personalizado para el usuario
     * Si ya existe uno guardado, lo devuelve sin llamar a Gemini
     */
    public function generar(Request $request, GeminiService $gemini)
    {
        $user = $request->user();

        // Cargar relaciones necesarias
        $user->load(['objetivo.profesion', 'perfil.formaciones']);

        // VERIFICACIÓN OBLIGATORIA: ¿El usuario ha hecho el test?
        // Dual-query: V2 VocationalSession (modern engine) first, then V1 TestSesion fallback.
        // This ensures V2 users (who never write to test_sessions) can generate itineraries.
        $lastSession = VocationalSession::where('usuario_id', $user->id)
            ->where('is_completed', true)
            ->latest()
            ->first();

        if (!$lastSession) {
            // V1 fallback: legacy test_sessions table
            $lastSession = TestSesion::where('usuario_id', $user->id)
                ->where('estado', 'completado')
                ->latest('completed_at')
                ->first();
        }

        if (!$lastSession) {
            return response()->json([
                'success' => false,
                'message' => 'Debes completar el test vocacional primero.'
            ]);
        }

        $testId = $lastSession->id;

        // Obtener la profesión del usuario
        $profesion = $request->input('profesion')
            ?? optional($user->objetivo)->profesion->titulo
            ?? 'No especificada';

        // Deducir CCAA según ciudad (desde perfil)
        $ciudad = optional($user->perfil)->ciudad ?? null;
        $ccaa = $ciudad ? obtenerCCAAporCiudad($ciudad) : null;

        // VERIFICAR SI YA EXISTE UN ITINERARIO GUARDADO
        $itinerarioGuardado = ItinerarioGenerado::where('user_id', $user->id)
            ->where('profesion', $profesion)
            ->first();

        if ($itinerarioGuardado) {
            // Devolver itinerario desde caché (ya parseado como array por el casting)
            \Log::info('✅ Itinerario recuperado de caché - ' . now()->format('H:i:s'));

            // Obtener imagen de la profesión
            $imagenUrl = optional($user->objetivo)->profesion->imagen_url ?? null;

            // Recalcular nivel estudios actual mirando formaciones
            $estudiosActualesKey = $this->getHighestEducationLevel($user);
            $itinerarioParseado = $itinerarioGuardado->texto_html;

            // Aplicar autocompletado dinámico
            $itinerarioFinal = $this->markCompletedSteps($itinerarioParseado, $estudiosActualesKey);

            return response()->json([
                'success' => true,
                'profesion' => $profesion,
                'ccaa' => $itinerarioGuardado->ccaa,
                'imagen_url' => $imagenUrl,
                'cached' => true,
                'test_id' => $testId, // INYECTAMOS TEST_ID
                'itinerario' => $itinerarioFinal
            ]);
        }

        // SI NO EXISTE, GENERAR NUEVO ITINERARIO CON GEMINI
        \Log::info('🎓 Generando nuevo itinerario con Gemini - ' . now()->format('H:i:s'));

        // Nivel de estudios del usuario (Calculado)
        $estudios = $this->getHighestEducationLevel($user);

        // Obtener perfil vocacional del usuario (scores RIASEC)
        $vocProfile = VocationalProfile::where('usuario_id', $user->id)->first();
        
        // Construir contexto de personalización
        $personalizationContext = null;
        if ($user->perfil) {
            $user->perfil->load(['intereses', 'formaciones', 'experiencias']);
            $personalizationContext = PersonalizationHelper::buildPersonalizationContext($user, $user->perfil);
        }

        // Obtener itinerario base desde la BD
        $prof = Profesion::whereRaw('LOWER(titulo) = ?', [mb_strtolower($profesion)])->first();
        $base = $prof ? ItinerarioBase::where('profesion_id', $prof->id)->first() : null;

        // Construir prompt para la IA (ahora con contexto personalizado)
        $prompt = $this->buildPrompt($profesion, $estudios, $ccaa, $base, $vocProfile, $personalizationContext);

        // Llamar al servicio Gemini (ahora devuelve JSON parseado)
        $resultado = $gemini->generateItinerario($prompt);

        // Llamar a helper para marcar pasos completados
        $itinerarioFinal = $this->markCompletedSteps($resultado, $estudios);

        // GUARDAR EL ITINERARIO GENERADO EN LA BASE DE DATOS
        ItinerarioGenerado::create([
            'user_id' => $user->id,
            'profesion' => $profesion,
            'ccaa' => $ccaa,
            'texto_html' => $itinerarioFinal // Array a JSON
        ]);

        \Log::info('Itinerario guardado en caché');

        // Obtener imagen de la profesión
        $imagenUrl = optional($user->objetivo)->profesion->imagen_url ?? null;

        return response()->json([
            'success' => true,
            'profesion' => $profesion,
            'ccaa' => $ccaa,
            'imagen_url' => $imagenUrl,
            'cached' => false,
            'test_id' => $testId, // INYECTAMOS TEST_ID
            'itinerario' => $itinerarioFinal
        ]);
    }

    /**
     * Construye el prompt para generar itinerario en formato JSON con vías formativas
     * 
     * @param string $profesion Target profession
     * @param string $estudios User's current education level
     * @param string|null $ccaa User's autonomous community
     * @param ItinerarioBase|null $base Base itinerary template from DB
     * @param VocationalProfile|null $vocProfile User's RIASEC scores
     * @param array|null $personalizationContext User profile context (nombre, bio, hobbies, etc.)
     * @return string Prompt for Gemini
     */
    private function buildPrompt($profesion, $estudios, $ccaa, $base, $vocProfile = null, $personalizationContext = null)
    {
        $pasos = $base ? json_encode($base->pasos, JSON_UNESCAPED_UNICODE) : '[]';
        $descripcion = $base->descripcion ?? '';
        $ccaaTexto = $ccaa ?? 'España';

        // Cargar datos de CCAA desde el archivo JSON
        $jsonPath = storage_path('app/itinerarios_por_ccaa.json');
        $contextoCCAA = "{}";

        if (file_exists($jsonPath)) {
            $jsonData = json_decode(file_get_contents($jsonPath), true);
            $dataEspecifica = $jsonData[$ccaaTexto] ?? $jsonData; // Usa datos específicos o todo si no encuentra
            $contextoCCAA = json_encode($dataEspecifica, JSON_UNESCAPED_UNICODE);
        }

        // Build personalization block
        $personalizationBlock = '';
        if ($personalizationContext && PersonalizationHelper::hasContext($personalizationContext)) {
            $personalizationBlock = "\n" . PersonalizationHelper::buildPromptBlock($personalizationContext);
        }

        // Build RIASEC scores block
        $riasecBlock = '';
        if ($vocProfile) {
            $scores = [
                'R' => $vocProfile->realistic_score ?? 0,
                'I' => $vocProfile->investigative_score ?? 0,
                'A' => $vocProfile->artistic_score ?? 0,
                'S' => $vocProfile->social_score ?? 0,
                'E' => $vocProfile->enterprising_score ?? 0,
                'C' => $vocProfile->conventional_score ?? 0,
            ];
            
            // Find top dimensions (>60 threshold for "strong")
            $strongDimensions = [];
            $dimensionLabels = [
                'R' => 'Realista',
                'I' => 'Investigador',
                'A' => 'Artístico',
                'S' => 'Social',
                'E' => 'Emprendedor',
                'C' => 'Convencional',
            ];
            
            foreach ($scores as $dim => $score) {
                if ($score > 60) {
                    $strongDimensions[] = "{$dimensionLabels[$dim]} ({$dim}: {$score})";
                }
            }
            
            if (!empty($strongDimensions)) {
                $riasecBlock = "\nDimensiones RIASEC dominantes del usuario: " . implode(', ', $strongDimensions) . "\n(Usa esto para alinear el consejo final con sus fortalezas vocacionales)";
            }
        }

        return <<<EOT
Eres un orientador académico experto en el sistema educativo español, en Formación Profesional, Universidad, certificaciones y vías alternativas. 
Debes generar un itinerario académico extremadamente preciso y accionable adaptado a la profesión del usuario.

La salida debe ser EXCLUSIVAMENTE JSON válido y parseable.

### CONTEXTO DEL USUARIO
Profesión objetivo: {$profesion}
Comunidad Autónoma: {$ccaaTexto}
Nivel de estudios actual: {$estudios}{$personalizationBlock}{$riasecBlock}

### OBJETIVO FINAL
Genera un JSON con la siguiente estructura EXACTA:

{
  "profesion": "string",
  "ccaa": "string",
  "resumen": "string",
  "vias_formativas": [
    {
      "id": "universitaria|fp|autodidacta",
      "titulo": "string",
      "descripcion": "string",
      "requisitos": ["string"],
      "pasos": [
        {
          "orden": 1,
          "titulo": "string",
          "descripcion": "string (Si hay opciones, indica 'Elige una de las siguientes opciones')",
          "duracion_estimada": "string opcional",
          "opciones": [
            {"nombre": "string (ej. G.S. ASIR)"}
          ]
        }
      ],
      "enlaces_utiles": [
        {"titulo":"string","url":"string"}
      ]
    }
  ],
  "recomendaciones": ["string"],
  "habilidades_necesarias": [
    "Habilidad técnica (ej. Python, SQL)",
    "Habilidad blanda (ej. Comunicación efectiva, Trabajo en equipo)"
  ],
  "consejo_final": "string"
}

### REGLAS OBLIGATORIAS

1. La salida debe ser SIEMPRE JSON limpio, sin texto fuera del JSON.
2. Los requisitos deben ser REALISTAS según la vía.
3. En cada vía, incluye TODAS las opciones reales relacionadas con la profesión.
4. **ESTRUCTURA DE PASOS OBLIGATORIA (SEGÚN VÍA)**:
   
   **PARA VÍA UNIVERSITARIA (Genera exactamente 5 pasos):**
   - **Paso 1: Acceso Inicial**. Solo una opción: "Graduado en ESO".
   - **Paso 2: Bachillerato**. Título del paso: "Bachillerato". Descripción: "Cursar el Bachillerato, preferiblemente de la modalidad [RAMA RECOMENDADA]".
   - **Paso 3: Selectividad**. Título: "Superar la EBAU (Selectividad)". Descripción: "Obtener la nota de corte necesaria".
   - **Paso 4: Grado Universitario**. Título: "Grado Universitario". Agrupa en `opciones` los grados válidos (ej. Ing. Informática, Matemáticas...).
   - **Paso 5: Máster Universitario**. Título: "Máster de Especialización". Agrupa en `opciones` los másteres recomendados.

   **PARA VÍA FP (Genera exactamente 4 pasos):**
   - **Paso 1: Acceso Inicial**. Solo una opción: "Graduado en ESO".
   - **Paso 2: Requisito Acceso Superior**. Título: "Requisito Previo". Agrupa en `opciones`: "Bachillerato (Modalidad [RAMA])", "Ciclo Grado Medio relacionado", "Prueba de Acceso a Grado Superior".
   - **Paso 3: Ciclo Formativo**. Título: "Ciclo de Grado Superior". Agrupa en `opciones` los ciclos válidos (ej. DAM, DAW, ASIR).
   - **Paso 4: Especialización**. Título: "Curso de Especialización (Máster FP)". Agrupa en `opciones` los cursos oficiales.

   **PARA VÍA AUTODIDACTA**: Adapta pasos lógicos similares (Base -> Profundización -> Portfolio -> Certificación).
5. Cada vía debe adaptarse a la profesión.
6. La vía FP siempre debe listar todas las rutas válidas.
7. **AGRUPACIÓN DE OPCIONES**: Si un paso tiene múltiples titulaciones válidas, genera un ÚNICO paso y usa el array `opciones`.
8. En `habilidades_necesarias` incluye **EXACTAMENTE 9 habilidades** (mezcla equilibrada de hard y soft skills).
   - Formato: Strings con "Nombre: Descripción corta" (ej. "Python: Lenguaje de programación versátil").
   - OBLIGATORIO: Deben ser 9 elementos. Ni más, ni menos.
9. En `recomendaciones` incluye **EXACTAMENTE 6 recomendaciones estratégicas**.
    - Formato: Objetos con `titulo` y `descripcion` (o strings "Título: Descripción").
    - OBLIGATORIO: Deben ser 6 elementos de valor añadido (networking, portfolio, diferenciación...).
10. El consejo final debe ser breve y motivador.

### INSTRUCCIONES PARA LAS VÍAS FORMATIVAS

Debes generar 2–3 vías según la profesión:
- **universitaria**: Para grados y másteres.
- **fp**: Para ciclos formativos.
- **autodidacta**: Para bootcamps y certificaciones.

Cada vía debe tener:
- requisitos específicos de esa vía  
- pasos numerados en orden lógico (objetos con titulo y descripcion)
- duración estimada (si aplica)  
- enlaces útiles  

### INSTRUCCIONES DE ESPECIALIZACIÓN
Ten siempre en cuenta:

- Si la profesión es tecnológica:
  - DAW, DAM, ASIR, SMR son opciones válidas.
  - Indica cuál es la más directa y por qué.
- Si es sanitaria:
  - Lista correctamente qué grados o ciclos llevan a esa profesión.
- Si es un perfil creativo:
  - Incluye vías como Animación 3D, Desarrollo de videojuegos, Diseño gráfico…
- Si es empresarial:
  - Administración, Marketing, Comercio Internacional…

### INSTRUCCIONES FORMACIÓN PROFESIONAL (IMPORTANTE)
Si la profesión tiene **Cursos de Especialización** (Máster de FP) oficiales (ej. Ciberseguridad, Inteligencia Artificial, Big Data):
1.  **DEBES** incluirlos obligatoriamente como el último paso de la vía FP.
2.  Menciona explícitamente el nombre del curso (ej. "Curso de Especialización en Ciberseguridad en Entornos de las Tecnologías de la Información").

### INSTRUCCIONES DE ENLACES (CRÍTICO: NO INVENTAR)
1. Usa **EXCLUSIVAMENTE** las URLs que aparecen en la sección "BASE DE DATOS OFICIAL DE NORMATIVAS POR CCAA" de este prompt.
2. Si necesitas añadir una universidad o institución no listada, usa **SOLO SU DOMINIO PRINCIPAL** (ej. "https://www.us.es/" y NO "https://www.us.es/grados/informatica").
3. **PROHIBIDO** generar rutas profundas (ej. /organismos/..., /temas/...) si no están explícitamente en el contexto. Suelen dar error 404.
4. Es preferible poner el enlace a la Home de la Consejería de Educación que un enlace roto específico.

### FINAL
Devuelve únicamente el JSON final, sin explicaciones, sin markdown y sin comentarios.
EOT;
    }

    /**
     * Calcula el nivel de estudios más alto basándose en el perfil y las formaciones
     */
    private function getHighestEducationLevel($user)
    {
        // 1. Obtener nivel base del perfil
        $nivelBase = optional($user->perfil)->nivel_estudios ?? 'sin_estudios';

        $niveles = [
            'sin_estudios' => 0,
            'eso' => 1,
            'secundaria' => 1,
            'graduado en eso' => 1,
            'grado_medio' => 2,
            'medio' => 2,
            'tecnico' => 2,
            'técnico' => 2,
            'bachillerato' => 3,
            'bachiller' => 3,
            'grado_superior' => 4,
            'superior' => 4,
            'tecnico superior' => 4,
            'técnico superior' => 4,
            'universidad' => 5,
            'grado' => 5,
            'universitario' => 5,
            'master' => 6,
            'máster' => 6
        ];

        $maxVal = 0;
        $maxKey = 'sin_estudios';

        // Evaluar base
        $strBase = mb_strtolower($nivelBase);
        foreach ($niveles as $key => $val) {
            if (str_contains($strBase, $key) && $val > $maxVal) {
                $maxVal = $val;
                $maxKey = $key;
            }
        }

        // 2. Iterar sobre formaciones si existen
        if ($user->perfil && $user->perfil->formaciones) {
            foreach ($user->perfil->formaciones as $formacion) {
                // Mirar both fields
                $texto = mb_strtolower(($formacion->nivel ?? '') . ' ' . ($formacion->titulo_obtenido ?? ''));

                foreach ($niveles as $key => $val) {
                    if (str_contains($texto, $key) && $val > $maxVal) {
                        $maxVal = $val;
                        $maxKey = $key;
                    }
                }
            }
        }

        return $maxKey; // Devuelve ej. "bachillerato" o "universidad"
    }


    /**
     * Marca los pasos como completados si el usuario ya tiene esa titulación
     */
    private function markCompletedSteps($itinerario, $nivelUsuarioKey)
    {
        $nivelesMap = [
            'sin_estudios' => 0,
            'eso' => 1,
            'secundaria' => 1,
            'grado_medio' => 2,
            'medio' => 2,
            'bachillerato' => 3,
            'bachiller' => 3,
            'grado_superior' => 4,
            'superior' => 4,
            'universidad' => 5,
            'grado' => 5,
            'master' => 6,
            'máster' => 6
        ];

        // Obtener valor numérico del usuario
        $valorUser = 0;
        $strUser = mb_strtolower($nivelUsuarioKey);

        // Mapeo inverso de string usuario a keywords
        $targetKeywords = [];
        if (str_contains($strUser, 'eso') || str_contains($strUser, 'secundaria'))
            $targetKeywords = ['eso', 'secundaria'];
        if (str_contains($strUser, 'bachill'))
            $targetKeywords = ['bachiller'];
        if (str_contains($strUser, 'medio'))
            $targetKeywords = ['grado medio', 'técnico en'];
        if (str_contains($strUser, 'superior'))
            $targetKeywords = ['grado superior', 'técnico superior'];
        if (str_contains($strUser, 'universi') || str_contains($strUser, 'grado'))
            $targetKeywords = ['grado universitario', 'universidad'];

        foreach ($nivelesMap as $k => $v) {
            if (str_contains($strUser, $k) && $v > $valorUser) {
                $valorUser = $v;
            }
        }

        // Recorrer el itinerario
        if (isset($itinerario['vias_formativas'])) {
            // Asegurar array
            if (is_string($itinerario)) {
                $itinerario = json_decode($itinerario, true) ?? $itinerario;
            }

            foreach ($itinerario['vias_formativas'] as &$via) {
                if (isset($via['pasos'])) {
                    foreach ($via['pasos'] as &$paso) {
                        $titulo = mb_strtolower($paso['titulo']);

                        $stepVal = 100; // Por defecto no completado

                        // Detectar nivel del paso
                        if (str_contains($titulo, 'eso') || str_contains($titulo, 'acceso inicial'))
                            $stepVal = 1;
                        elseif (str_contains($titulo, 'bachiller') || str_contains($titulo, 'requisito previo'))
                            $stepVal = 3;
                        elseif (str_contains($titulo, 'grado medio'))
                            $stepVal = 2;
                        elseif (str_contains($titulo, 'grado superior') || str_contains($titulo, 'ciclo formativo'))
                            $stepVal = 4;
                        elseif (str_contains($titulo, 'selectividad') || str_contains($titulo, 'ebau'))
                            $stepVal = 3;
                        elseif (str_contains($titulo, 'universitario') || str_contains($titulo, 'grado'))
                            $stepVal = 5;
                        elseif (str_contains($titulo, 'máster') || str_contains($titulo, 'master') || str_contains($titulo, 'especialización'))
                            $stepVal = 6;

                        // Marcar el paso general
                        if (($valorUser == 2 && $stepVal == 3)) { // GM no completa Bachiller
                            $paso['completado'] = false;
                        } else {
                            $paso['completado'] = ($valorUser >= $stepVal);

                            // Excepciones específicas
                            if ((str_contains($titulo, 'selectividad') || str_contains($titulo, 'ebau')) && $valorUser >= 5)
                                $paso['completado'] = true;

                            // --- REFINAMIENTO DE OPCIÓN ESPECÍFICA ---
                            if ($paso['completado'] && isset($paso['opciones']) && is_array($paso['opciones'])) {
                                foreach ($paso['opciones'] as &$opcion) {
                                    $optNombre = mb_strtolower($opcion['nombre']);

                                    // 1. Si el usuario tiene keywords (ej. 'bachillerato'), buscarlas en la opción
                                    $match = false;
                                    foreach ($targetKeywords as $kw) {
                                        if (str_contains($optNombre, $kw)) {
                                            $match = true;
                                            break;
                                        }
                                    }

                                    // 2. Si es acceso inicial (Nivel 1), 'Graduado en ESO' es lo estándar si tiene ESO
                                    if ($stepVal === 1 && $valorUser >= 1) {
                                        if (str_contains($optNombre, 'graduado') && !str_contains($optNombre, 'prueba'))
                                            $match = true;
                                    }

                                    // 3. Si coinciden niveles exactos (ej. usuario Grado Medio y opción dice Grado Medio)
                                    // Si usuario es Bachillerato y opción dice Bachillerato -> match.
                                    // Si usuario es Bachillerato y opción dice Grado Medio -> NO match.

                                    // Asignar
                                    if ($match) {
                                        $opcion['completado'] = true;
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        return $itinerario;
    }
}