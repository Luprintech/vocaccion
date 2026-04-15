<?php

namespace App\Services;

use App\Models\CareerCatalog;
use App\Models\CnoOccupation;
use Illuminate\Support\Facades\Log;

/**
 * Servicio de generación de itinerarios formativos personalizados.
 * 
 * Utiliza Gemini para crear rutas educativas específicas por CCAA,
 * incluyendo centros reales, costes, duración y alternativas.
 */
class ItinerarioGeneratorService
{
    protected GeminiService $gemini;

    public function __construct(GeminiService $gemini)
    {
        $this->gemini = $gemini;
    }

    /**
     * Genera un itinerario formativo personalizado para llegar a una profesión.
     *
     * @param int $profesionId ID de la profesión del catálogo
     * @param array $userContext Contexto del usuario:
     *                           - edad: int
     *                           - ccaa: string ('Andalucía', 'Madrid', etc.)
     *                           - nivel_educativo: string ('ESO', 'Bachillerato', 'FP Superior', 'Grado', etc.)
     *                           - presupuesto: int|null (euros disponibles)
     *                           - situacion_laboral: string|null ('estudiante', 'trabajando', 'desempleado')
     * @return array Itinerario estructurado con rutas, costes, centros
     */
    public function generate(int $profesionId, array $userContext): array
    {
        $profesion = CareerCatalog::query()
            ->with([
                'qualifications' => function ($q) {
                    $q->orderByDesc('career_qualifications.relevancia');
                },
                'cnoOccupations',
            ])
            ->findOrFail($profesionId);
        
        Log::info('[ItinerarioGenerator] Generando itinerario', [
            'profesion' => $profesion->titulo,
            'ccaa' => $userContext['ccaa'] ?? 'no especificada',
            'edad' => $userContext['edad'] ?? 'no especificada',
        ]);

        // Construir prompt para Gemini
        $prompt = $this->buildPrompt($profesion, $userContext);
        
        // Llamar a Gemini con JSON estructurado
        $systemInstruction = $this->buildSystemInstruction();
        
        try {
            // 16384 tokens necesarios: gemini-2.5-flash usa tokens de "thinking" internos
            // que consumen el presupuesto. Con 4096 el JSON queda truncado.
            $response = $this->gemini->callGemini($prompt, true, $systemInstruction, 16384);
            
            // Validar y normalizar respuesta
            $itinerario = $this->normalizeResponse($response, $profesion, $userContext);
            
            Log::info('[ItinerarioGenerator] Itinerario generado exitosamente', [
                'profesion_id' => $profesionId,
                'rutas_count' => count($itinerario['rutas'] ?? []),
            ]);
            
            return $itinerario;
            
        } catch (\Exception $e) {
            Log::error('[ItinerarioGenerator] Error generando itinerario', [
                'profesion_id' => $profesionId,
                'error' => $e->getMessage(),
            ]);
            
            // Fallback: itinerario genérico basado en ruta_formativa del catálogo
            return $this->buildFallbackItinerario($profesion, $userContext);
        }
    }

    /**
     * Construye el system instruction para Gemini.
     */
    protected function buildSystemInstruction(): string
    {
        return <<<EOT
ACTÚA COMO: Orientador Educativo Senior experto en el sistema educativo español (LOMCE/LOMLOE).

OBJETIVO: Generar un itinerario formativo REAL y ESPECÍFICO para una profesión en España.

REQUISITOS CRÍTICOS:
1. VÍAS FORMATIVAS: Incluir 2-3 vías distintas usando EXACTAMENTE estos identificadores:
   - "universitaria": para rutas de Grado universitario y/o Máster.
   - "fp": para rutas de Formación Profesional (FP Medio, FP Superior).
   - "autodidacta": para rutas de certificaciones, bootcamps o formación propia.
   Si una profesión no tiene ruta universitaria, omite esa vía. Mínimo 2 vías.

2. CENTROS EDUCATIVOS REALES:
   - Para universidades: USA universidades públicas reales de esa CCAA en las "opciones".
   - Para FP: USA institutos (IES/CIFP) reales. Si no conoces, usa "IES públicos de [CCAA]".

3. COSTES REALES:
   - FP pública: Gratuito / 3.000-6.000€ (privada)
   - Grado universitario público: 800-1.500€/año
   - Máster oficial: 1.500-3.500€/año

4. DURACIÓN estándar:
   - FP Medio/Superior: 2 años | Grado: 4 años | Máster: 1-2 años

5. USO DE DATOS OFICIALES:
   - Integra las CUALIFICACIONES CNCP aportadas en las "opciones" del paso correspondiente.
   - No inventes códigos CNCP.

FORMATO DE SALIDA (JSON ESTRICTO — usar exactamente estas claves):
{
  "profesion": "string",
  "resumen": "string (2-3 frases que describen el perfil profesional y las opciones formativas)",
  "nivel_educativo_minimo": "string",
  "vias_formativas": [
    {
      "id": "universitaria" | "fp" | "autodidacta",
      "titulo": "string (ej: 'Vía Universitaria — Grado + Máster')",
      "descripcion": "string (párrafo descriptivo: qué ofrece esta vía, a quién conviene)",
      "requisitos": ["string (requisito de acceso a esta vía)"],
      "pasos": [
        {
          "orden": 1,
          "titulo": "string (ej: 'Grado en Ingeniería Informática')",
          "duracion_estimada": "string (ej: '4 años')",
          "descripcion": "string (qué se estudia, qué competencias se desarrollan)",
          "completado": false,
          "opciones": [
            {
              "nombre": "string (nombre del centro, programa o titulación específica)",
              "completado": false
            }
          ]
        }
      ],
      "enlaces_utiles": [
        {
          "titulo": "string",
          "url": "string (URL oficial real, o null si no hay una segura)"
        }
      ]
    }
  ],
  "habilidades_necesarias": ["string"],
  "certificaciones_opcionales": ["string"],
  "recomendaciones": ["string"],
  "consejo_final": "string",
  "observaciones_especiales": "string|null"
}

IMPORTANTE:
- Si el usuario tiene 35+ años, priorizar vías cortas (fp, autodidacta).
- Si el usuario es estudiante joven (<25), mencionar opciones de becas en descripción.
- Si la profesión requiere colegiación, mencionarlo en observaciones_especiales.
- SIEMPRE devolver JSON válido sin texto adicional fuera del objeto JSON.
EOT;
    }

    /**
     * Construye el prompt con contexto del usuario y profesión.
     */
    protected function buildPrompt(CareerCatalog $profesion, array $userContext): string
    {
        $edad = $userContext['edad'] ?? 'no especificada';
        $ccaa = $userContext['ccaa'] ?? 'España (comunidad no especificada)';
        $nivelEducativo = $userContext['nivel_educativo'] ?? 'ESO';
        $presupuesto = $userContext['presupuesto'] ?? 'sin límite específico';
        $situacion = $userContext['situacion_laboral'] ?? 'estudiante';

        $qualificationsContext = $this->buildQualificationsContext($profesion);
        $cnoContext = $this->buildCnoContext($profesion);

        return <<<EOT
Genera un itinerario formativo para llegar a ser **{$profesion->titulo}** en España.

CONTEXTO DEL USUARIO:
- Edad: {$edad} años
- Comunidad Autónoma: {$ccaa}
- Nivel educativo actual: {$nivelEducativo}
- Presupuesto estimado: {$presupuesto}€
- Situación laboral: {$situacion}

INFORMACIÓN DE LA PROFESIÓN:
- Título: {$profesion->titulo}
- Sector: {$profesion->sector}
- Nivel de formación requerido: {$profesion->nivel_formacion}
- Ruta formativa genérica: {$profesion->ruta_formativa}
- Familia profesional: {$profesion->familia_profesional}

REFERENCIAS OFICIALES (usar para mayor precisión):
{$cnoContext}

{$qualificationsContext}

TASK: Genera un itinerario detallado y específico para {$ccaa} con centros educativos reales.
EOT;
    }

    /**
     * Construye contexto de cualificaciones CNCP asociadas a la profesión.
     */
    protected function buildQualificationsContext(CareerCatalog $profesion): string
    {
        $qualifications = $profesion->qualifications
            ->take(5)
            ->map(function ($q) {
                $tipo = $q->pivot->tipo ?? 'recomendada';
                $relevancia = $q->pivot->relevancia ?? 50;

                return sprintf(
                    '- [%s] %s — %s (nivel %d, %s, relevancia %d%%)',
                    $q->codigo_cncp,
                    $q->denominacion,
                    $q->familia_profesional,
                    $q->nivel,
                    $tipo,
                    $relevancia
                );
            })
            ->values();

        if ($qualifications->isEmpty()) {
            return 'CUALIFICACIONES CNCP ASOCIADAS: No disponibles para esta profesión.';
        }

        return "CUALIFICACIONES CNCP ASOCIADAS (top por relevancia):\n" . $qualifications->implode("\n");
    }

    /**
     * Construye contexto CNO de la profesión.
     */
    protected function buildCnoContext(CareerCatalog $profesion): string
    {
        $entries = collect();

        if ($profesion->cnoOccupations && $profesion->cnoOccupations->isNotEmpty()) {
            $entries = $entries->merge($profesion->cnoOccupations);
        }

        if ($entries->isEmpty() && !empty($profesion->codigo_cno)) {
            $direct = CnoOccupation::query()
                ->where('codigo_cno', $profesion->codigo_cno)
                ->first();

            if ($direct) {
                $entries->push($direct);
            }
        }

        if ($entries->isEmpty()) {
            return sprintf(
                'REFERENCIA CNO-11: código %s (sin ocupación CNO enriquecida en base local).',
                $profesion->codigo_cno ?? 'N/D'
            );
        }

        $lines = $entries
            ->take(3)
            ->map(function ($o) {
                return sprintf(
                    '- CNO %s: %s (gran grupo %s, RIASEC aprox: R %.2f / I %.2f / A %.2f / S %.2f / E %.2f / C %.2f)',
                    $o->codigo_cno,
                    $o->denominacion,
                    $o->gran_grupo,
                    (float) $o->riasec_r,
                    (float) $o->riasec_i,
                    (float) $o->riasec_a,
                    (float) $o->riasec_s,
                    (float) $o->riasec_e,
                    (float) $o->riasec_c,
                );
            })
            ->values();

        return "REFERENCIAS CNO-11 DISPONIBLES:\n" . $lines->implode("\n");
    }

    /**
     * Normaliza y valida la respuesta de Gemini.
     */
    protected function normalizeResponse(array $response, CareerCatalog $profesion, array $userContext): array
    {
        // Compatibilidad: si Gemini devolvió formato antiguo (rutas), convertirlo
        if (empty($response['vias_formativas']) && !empty($response['rutas'])) {
            $response['vias_formativas'] = $this->convertLegacyRutas($response['rutas']);
            unset($response['rutas']);
        }

        // Validar estructura mínima
        if (empty($response['vias_formativas']) || !is_array($response['vias_formativas'])) {
            throw new \Exception('Respuesta de Gemini sin vias_formativas válidas');
        }

        // Añadir metadatos
        $response['profesion_id'] = $profesion->id;
        $response['profesion_titulo'] = $profesion->titulo;
        $response['ccaa'] = $userContext['ccaa'] ?? null;
        $response['generado_en'] = now()->toIso8601String();

        // Asegurar que cada vía tiene campos requeridos
        $validIds = ['universitaria', 'fp', 'autodidacta'];
        foreach ($response['vias_formativas'] as $idx => &$via) {
            // Normalizar id
            if (empty($via['id']) || !in_array($via['id'], $validIds)) {
                $nombre = strtolower($via['titulo'] ?? $via['id'] ?? '');
                if (str_contains($nombre, 'universitari') || str_contains($nombre, 'grado') || str_contains($nombre, 'máster') || str_contains($nombre, 'master')) {
                    $via['id'] = 'universitaria';
                } elseif (str_contains($nombre, 'fp') || str_contains($nombre, 'formación profesional') || str_contains($nombre, 'formacion profesional')) {
                    $via['id'] = 'fp';
                } else {
                    $via['id'] = 'autodidacta';
                }
            }

            $via['titulo'] = $via['titulo'] ?? 'Vía ' . ($idx + 1);
            $via['descripcion'] = $via['descripcion'] ?? '';
            $via['requisitos'] = $via['requisitos'] ?? [];
            $via['pasos'] = $via['pasos'] ?? [];
            $via['enlaces_utiles'] = $via['enlaces_utiles'] ?? [];

            // Normalizar pasos
            foreach ($via['pasos'] as $pIdx => &$paso) {
                $paso['orden'] = $paso['orden'] ?? ($pIdx + 1);
                $paso['completado'] = $paso['completado'] ?? false;
                $paso['opciones'] = $paso['opciones'] ?? [];
                $paso['duracion_estimada'] = $paso['duracion_estimada'] ?? ($paso['duracion'] ?? null);
            }
        }

        return $response;
    }

    /**
     * Convierte el formato antiguo de rutas al nuevo formato de vias_formativas.
     * Compatibilidad con itinerarios cacheados antes del cambio de schema.
     */
    public function convertLegacyRutas(array $rutas): array
    {
        $validIds = ['universitaria', 'fp', 'autodidacta'];

        return array_values(array_map(function ($ruta, $idx) use ($validIds) {
            $nombre = strtolower($ruta['nombre'] ?? '');
            if (str_contains($nombre, 'universitari') || str_contains($nombre, 'grado') || str_contains($nombre, 'máster') || str_contains($nombre, 'master')) {
                $viaId = 'universitaria';
            } elseif (str_contains($nombre, 'fp') || str_contains($nombre, 'formación profesional') || str_contains($nombre, 'formacion profesional')) {
                $viaId = 'fp';
            } else {
                $viaId = 'autodidacta';
            }

            $pasos = array_values(array_map(function ($paso) {
                $opciones = [];
                if (!empty($paso['centros_educativos']) && is_array($paso['centros_educativos'])) {
                    $opciones = array_map(fn ($c) => ['nombre' => $c, 'completado' => false], $paso['centros_educativos']);
                }
                return [
                    'orden' => $paso['orden'] ?? 1,
                    'titulo' => $paso['titulo'] ?? '',
                    'duracion_estimada' => $paso['duracion'] ?? null,
                    'descripcion' => trim(($paso['requisitos_acceso'] ?? '') . ' ' . ($paso['coste'] ?? '')),
                    'completado' => false,
                    'opciones' => $opciones,
                ];
            }, $ruta['pasos'] ?? []));

            $enlaceInfo = null;
            if (!empty($ruta['pasos'])) {
                foreach ($ruta['pasos'] as $p) {
                    if (!empty($p['enlace_info'])) {
                        $enlaceInfo = $p['enlace_info'];
                        break;
                    }
                }
            }

            return [
                'id' => $viaId,
                'titulo' => $ruta['nombre'] ?? 'Vía ' . ($idx + 1),
                'descripcion' => ($ruta['ventajas'] ?? '') . ($ruta['desventajas'] ? ' — ' . $ruta['desventajas'] : ''),
                'requisitos' => [],
                'pasos' => $pasos,
                'enlaces_utiles' => $enlaceInfo ? [['titulo' => 'Más información', 'url' => $enlaceInfo]] : [],
            ];
        }, $rutas, array_keys($rutas)));
    }

    /**
     * Genera un itinerario genérico de fallback si Gemini falla.
     */
    protected function buildFallbackItinerario(CareerCatalog $profesion, array $userContext): array
    {
        $ccaa = $userContext['ccaa'] ?? 'España';
        $qualifications = $profesion->qualifications()
            ->orderByDesc('career_qualifications.relevancia')
            ->limit(3)
            ->get(['professional_qualifications.codigo_cncp', 'professional_qualifications.denominacion']);

        $qualificationsSimple = $qualifications
            ->map(fn ($q) => "{$q->codigo_cncp} - {$q->denominacion}")
            ->values()
            ->toArray();

        $duracion = $this->estimateDuration($profesion->nivel_formacion);
        $coste = $this->estimateCost($profesion->nivel_formacion);

        // Determinar id de vía según nivel formativo
        $nivelLower = strtolower($profesion->nivel_formacion ?? '');
        if (str_contains($nivelLower, 'grado') || str_contains($nivelLower, 'master') || str_contains($nivelLower, 'máster')) {
            $viaId = 'universitaria';
        } elseif (str_contains($nivelLower, 'fp') || str_contains($nivelLower, 'formación')) {
            $viaId = 'fp';
        } else {
            $viaId = 'autodidacta';
        }

        return [
            'profesion' => $profesion->titulo,
            'profesion_id' => $profesion->id,
            'profesion_titulo' => $profesion->titulo,
            'ccaa' => $ccaa,
            'resumen' => "Itinerario formativo para acceder a la profesión de {$profesion->titulo} en {$ccaa}.",
            'nivel_educativo_minimo' => $profesion->nivel_formacion,
            'vias_formativas' => [
                [
                    'id' => $viaId,
                    'titulo' => 'Ruta estándar — ' . $profesion->nivel_formacion,
                    'descripcion' => "Ruta formativa recomendada para convertirse en {$profesion->titulo} según los requisitos del sector.",
                    'requisitos' => [],
                    'pasos' => [
                        [
                            'orden' => 1,
                            'titulo' => $profesion->nivel_formacion,
                            'duracion_estimada' => $duracion . ' años',
                            'descripcion' => "Formación necesaria para el ejercicio de la profesión. Consulta con centros educativos de {$ccaa} para más información.",
                            'completado' => false,
                            'opciones' => [
                                ['nombre' => "Centros educativos de {$ccaa}", 'completado' => false],
                            ],
                        ],
                    ],
                    'enlaces_utiles' => [],
                ],
            ],
            'habilidades_necesarias' => [],
            'certificaciones_opcionales' => $qualificationsSimple,
            'recomendaciones' => [],
            'consejo_final' => "Consulta con orientadores de tu CCAA para información actualizada sobre centros y plazas disponibles.",
            'observaciones_especiales' => 'Itinerario genérico generado por fallback. Puede contener información incompleta.',
            'generado_en' => now()->toIso8601String(),
            'fallback' => true,
        ];
    }

    /**
     * Estima duración según nivel formativo.
     */
    protected function estimateDuration(string $nivelFormacion): float
    {
        if (str_contains($nivelFormacion, 'FP Medio')) return 2;
        if (str_contains($nivelFormacion, 'FP Superior')) return 2;
        if (str_contains($nivelFormacion, 'Grado')) return 4;
        if (str_contains($nivelFormacion, 'Máster')) return 1;
        return 4; // Default
    }

    /**
     * Estima coste según nivel formativo.
     */
    protected function estimateCost(string $nivelFormacion): string
    {
        if (str_contains($nivelFormacion, 'FP')) return 'Gratuito (público) / 3.000-6.000€ (privado)';
        if (str_contains($nivelFormacion, 'Grado')) return '800-1.500€/año (público)';
        if (str_contains($nivelFormacion, 'Máster')) return '1.500-3.500€/año';
        return 'Consultar con el centro';
    }
}
