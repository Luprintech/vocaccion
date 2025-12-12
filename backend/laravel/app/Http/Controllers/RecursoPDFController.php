<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\View;
use Illuminate\Support\Facades\DB;

class RecursoPDFController extends Controller
{
    /**
     * Genera y descarga un PDF de un artículo/guía
     */
    public function generarPDF($slug)
    {
        // Mapeo de artículos disponibles (mismo que en el frontend)
        $articulos = [
            'que-hacer-si-no-se-que-estudiar' => [
                'titulo' => '¿Qué hacer si no sé qué estudiar?',
                'descripcion' => 'Una guía completa para descubrir tu vocación y elegir la mejor formación',
                'autor' => 'Equipo de Orientación VocAcción',
                'fecha' => '15 de Enero, 2025',
                'tiempo_lectura' => '8 min',
                'categoria' => 'Orientación Vocacional',
                'contenido' => $this->getContenidoQueEstudiar()
            ],
            'universidad-fp-cursos-como-elegir' => [
                'titulo' => 'Universidad vs FP vs Cursos: Cómo elegir',
                'descripcion' => 'Comparativa completa para ayudarte a decidir qué tipo de formación se adapta mejor a tu perfil',
                'autor' => 'María González, Orientadora Educativa',
                'fecha' => '12 de Enero, 2025',
                'tiempo_lectura' => '12 min',
                'categoria' => 'Formación',
                'contenido' => $this->getContenidoUniversidadFP()
            ],
            'como-elegir-carrera-universitaria' => [
                'titulo' => 'Cómo elegir la carrera universitaria perfecta',
                'descripcion' => 'Factores clave a considerar al elegir qué carrera estudiar en la universidad',
                'autor' => 'Carlos Ruiz, Psicólogo Educativo',
                'fecha' => '8 de Enero, 2025',
                'tiempo_lectura' => '10 min',
                'categoria' => 'Universidad',
                'contenido' => $this->getContenidoCarreraUniversitaria()
            ],
            'fp-dual-que-es-ventajas' => [
                'titulo' => 'FP Dual: Qué es y cuáles son sus ventajas',
                'descripcion' => 'Todo lo que necesitas saber sobre la Formación Profesional Dual',
                'autor' => 'Ana Martín, Experta en FP',
                'fecha' => '5 de Enero, 2025',
                'tiempo_lectura' => '7 min',
                'categoria' => 'Formación Profesional',
                'contenido' => $this->getContenidoFPDual()
            ],
            'test-orientacion-vocacional-como-funciona' => [
                'titulo' => 'Tests de orientación vocacional: ¿Realmente funcionan?',
                'descripcion' => 'Análisis de la efectividad de los tests vocacionales',
                'autor' => 'Dr. Luis Fernández, Psicólogo',
                'fecha' => '2 de Enero, 2025',
                'tiempo_lectura' => '6 min',
                'categoria' => 'Orientación Vocacional',
                'contenido' => $this->getContenidoTestsVocacionales()
            ],
            'salidas-profesionales-tecnologia-2025' => [
                'titulo' => 'Salidas profesionales en tecnología 2025',
                'descripcion' => 'Las profesiones tecnológicas más demandadas y con mejor proyección de futuro',
                'autor' => 'Tech Careers Team',
                'fecha' => '28 de Diciembre, 2024',
                'tiempo_lectura' => '9 min',
                'categoria' => 'Tendencias Laborales',
                'contenido' => $this->getContenidoSalidasTech()
            ],
            'carta-presentacion-estructura-ejemplos' => [
                'titulo' => 'La Carta de Presentación que Abre Puertas',
                'descripcion' => 'Aprende la estructura exacta que buscan los reclutadores',
                'autor' => 'Equipo de Orientación VocAcción',
                'fecha' => '9 de Diciembre, 2025',
                'tiempo_lectura' => '15 min',
                'categoria' => 'Empleo',
                'contenido' => $this->getContenidoCartaPresentacion()
            ],
            'guia-definitiva-curriculum-2025-plantilla' => [
                'titulo' => 'Cómo hacer un Currículum Perfecto en 2025',
                'descripcion' => 'Guía paso a paso con estrategias prácticas',
                'autor' => 'Equipo de Orientación VocAcción',
                'fecha' => '10 de Diciembre, 2025',
                'tiempo_lectura' => '20 min',
                'categoria' => 'Empleo',
                'contenido' => $this->getContenidoCurriculum()
            ]
        ];

        // Verificar si el artículo existe en array estático o BD
        if (isset($articulos[$slug])) {
            $articulo = $articulos[$slug];
        } else {
            $recurso = DB::table('recursos')->where('slug', $slug)->first();

            if (!$recurso) {
                return response()->json(['error' => 'Artículo no encontrado'], 404);
            }

            $articulo = [
                'titulo' => $recurso->titulo,
                'descripcion' => $recurso->descripcion,
                'autor' => 'Equipo VocAcción',
                'fecha' => date('d/m/Y', strtotime($recurso->created_at)),
                'tiempo_lectura' => $recurso->tiempo_lectura ?? 'N/A',
                'categoria' => ucfirst($recurso->tipo),
                'contenido' => [
                    [
                        'tipo' => 'texto_libre',
                        'contenido' => $recurso->contenido ?? ''
                    ]
                ]
            ];
        }

        // Generar PDF con diseño moderno
        $pdf = PDF::loadView('pdf.articulo', [
            'articulo' => $articulo
        ]);

        // Configurar opciones del PDF
        $pdf->setPaper('A4', 'portrait');

        // Descargar el PDF
        return $pdf->download("{$slug}.pdf");
    }

    /**
     * Contenido del artículo "¿Qué hacer si no sé qué estudiar?"
     */
    private function getContenidoQueEstudiar()
    {
        return [
            [
                'tipo' => 'alerta',
                'icono' => '💛',
                'titulo' => 'Tranquilo, es normal sentirse perdido',
                'texto' => 'Más del 70% de los estudiantes han pasado por esta situación. No estar seguro de qué estudiar no significa que no tengas futuro, sino que tienes muchas posibilidades por explorar.'
            ],
            [
                'tipo' => 'seccion',
                'numero' => '1',
                'titulo' => 'Haz una pausa y reflexiona',
                'contenido' => 'Lo primero es respirar profundo. La presión de elegir "correctamente" puede bloquearte. Recuerda que no existe una única respuesta perfecta, y que cambiar de rumbo más adelante no es un fracaso, sino parte del proceso de encontrar tu camino.'
            ],
            [
                'tipo' => 'seccion',
                'numero' => '2',
                'titulo' => 'Identifica tus intereses reales',
                'contenido' => 'Pregúntate: ¿Qué actividades disfrutas hacer en tu tiempo libre? ¿Qué temas te generan curiosidad? ¿En qué materias destacas sin esfuerzo? Estas pistas pueden revelar áreas profesionales que realmente te motiven.'
            ],
            [
                'tipo' => 'seccion',
                'numero' => '3',
                'titulo' => 'Investiga las opciones disponibles',
                'contenido' => 'Explora diferentes carreras, grados y formaciones profesionales. No te limites a lo que conoces: investiga profesiones emergentes, sectores en crecimiento y opciones menos convencionales que podrían encajar contigo.'
            ],
            [
                'tipo' => 'seccion',
                'numero' => '4',
                'titulo' => 'Habla con profesionales',
                'contenido' => 'Contacta con personas que trabajen en áreas que te interesen. Pregúntales sobre su día a día, los retos que enfrentan y cómo llegaron hasta ahí. Esta información real es mucho más valiosa que cualquier descripción genérica.'
            ],
            [
                'tipo' => 'seccion',
                'numero' => '5',
                'titulo' => 'Considera tus valores personales',
                'contenido' => '¿Qué es importante para ti? ¿Ayudar a otros? ¿Creatividad? ¿Estabilidad económica? ¿Flexibilidad horaria? Alinear tu elección con tus valores te ayudará a sentirte más satisfecho a largo plazo.'
            ],
            [
                'tipo' => 'seccion',
                'numero' => '6',
                'titulo' => 'Prueba antes de decidir',
                'contenido' => 'Si es posible, realiza prácticas, voluntariados o cursos introductorios en áreas que te interesen. La experiencia directa te dará una perspectiva mucho más clara que solo leer sobre una profesión.'
            ],
            [
                'tipo' => 'seccion',
                'numero' => '7',
                'titulo' => 'No tengas miedo de equivocarte',
                'contenido' => 'Muchas personas cambian de carrera o descubren su verdadera vocación años después de empezar. Lo importante es dar el primer paso y estar abierto a ajustar el rumbo si es necesario.'
            ],
            [
                'tipo' => 'fuentes',
                'items' => [
                    [
                        'nombre' => 'Ministerio de Educación y Formación Profesional',
                        'descripcion' => 'Guías de orientación académica',
                        'url' => 'https://www.educacionyfp.gob.es',
                        'url_texto' => 'www.educacionyfp.gob.es'
                    ],
                    [
                        'nombre' => 'Educaweb',
                        'descripcion' => 'Portal de orientación académica y profesional líder en España',
                        'url' => 'https://www.educaweb.com',
                        'url_texto' => 'www.educaweb.com'
                    ],
                    [
                        'nombre' => 'INJUVE (Instituto de la Juventud)',
                        'descripcion' => 'Recursos para jóvenes sobre empleo y formación',
                        'url' => 'https://www.injuve.es',
                        'url_texto' => 'www.injuve.es'
                    ]
                ]
            ]
        ];
    }

    /**
     * Contenido del artículo "Universidad vs FP vs Cursos"
     */
    private function getContenidoUniversidadFP()
    {
        return [
            [
                'tipo' => 'intro',
                'texto' => 'Elegir entre universidad, formación profesional o cursos especializados es una de las decisiones más importantes que tomarás. Cada opción tiene sus ventajas y se adapta mejor a diferentes perfiles y objetivos profesionales.'
            ],
            [
                'tipo' => 'comparativa',
                'titulo' => 'Universidad',
                'ventajas' => [
                    'Formación teórica profunda y especializada',
                    'Acceso a investigación y desarrollo',
                    'Mayor reconocimiento internacional',
                    'Networking académico y profesional amplio',
                    'Posibilidad de acceder a posgrados y doctorados'
                ],
                'desventajas' => [
                    'Duración más larga (4-5 años)',
                    'Menor enfoque práctico inicial',
                    'Coste económico más elevado',
                    'Puede estar desconectada del mercado laboral actual'
                ]
            ],
            [
                'tipo' => 'comparativa',
                'titulo' => 'Formación Profesional (FP)',
                'ventajas' => [
                    'Formación práctica y orientada al empleo',
                    'Duración más corta (2 años)',
                    'Prácticas en empresas garantizadas',
                    'Alta empleabilidad en sectores específicos',
                    'Posibilidad de acceder a universidad después'
                ],
                'desventajas' => [
                    'Especialización más limitada',
                    'Menor reconocimiento en algunos sectores',
                    'Opciones de movilidad internacional más reducidas'
                ]
            ],
            [
                'tipo' => 'comparativa',
                'titulo' => 'Cursos y Certificaciones',
                'ventajas' => [
                    'Flexibilidad total de horarios',
                    'Enfoque en habilidades específicas',
                    'Actualización rápida con tendencias del mercado',
                    'Inversión económica menor',
                    'Resultados inmediatos'
                ],
                'desventajas' => [
                    'Falta de titulación oficial en muchos casos',
                    'Calidad variable según el proveedor',
                    'Menor profundidad teórica',
                    'Puede requerir complementarse con otras formaciones'
                ]
            ],
            [
                'tipo' => 'recomendacion',
                'titulo' => '¿Cuál elegir?',
                'contenido' => 'La mejor opción depende de tus objetivos, situación personal y el sector al que quieras dedicarte. Considera combinar diferentes tipos de formación a lo largo de tu carrera profesional para maximizar tus oportunidades.'
            ],
            [
                'tipo' => 'fuentes',
                'items' => [
                    [
                        'nombre' => 'Ministerio de Universidades (SIIU)',
                        'descripcion' => 'Estadísticas sobre universidad y empleabilidad',
                        'url' => 'https://www.universidades.gob.es',
                        'url_texto' => 'www.universidades.gob.es'
                    ],
                    [
                        'nombre' => 'TodoFP (Ministerio de Educación)',
                        'descripcion' => 'Portal oficial de la Formación Profesional en España',
                        'url' => 'https://www.todofp.es',
                        'url_texto' => 'www.todofp.es'
                    ],
                    [
                        'nombre' => 'INE (Instituto Nacional de Estadística)',
                        'descripcion' => 'Encuesta de Inserción Laboral de Titulados Universitarios',
                        'url' => 'https://www.ine.es',
                        'url_texto' => 'www.ine.es'
                    ]
                ]
            ]
        ];
    }

    private function getContenidoCarreraUniversitaria()
    {
        return [
            ['tipo' => 'intro', 'texto' => 'Elegir una carrera universitaria es una de las decisiones más importantes que tomarás en tu vida. Esta guía te ayudará a tomar una decisión informada.'],
            ['tipo' => 'alerta', 'titulo' => 'No existe la carrera perfecta', 'texto' => 'La clave está en encontrar la carrera que mejor se adapte a tu perfil, no en buscar una opción "ideal" universal.'],
            ['tipo' => 'seccion', 'numero' => '1', 'titulo' => 'Autoconocimiento', 'contenido' => 'Reflexiona sobre tus intereses, habilidades y valores.'],
            ['tipo' => 'seccion', 'numero' => '2', 'titulo' => 'Investiga las salidas', 'contenido' => 'Consulta informes del SEPE y habla con profesionales.'],
            ['tipo' => 'seccion', 'numero' => '3', 'titulo' => 'Analiza el plan de estudios', 'contenido' => 'Revisa asignaturas, enfoque práctico y opciones de especialización.'],
            [
                'tipo' => 'fuentes',
                'items' => [
                    ['nombre' => 'Ministerio de Universidades (España)', 'descripcion' => 'Datos oficiales sobre grados', 'url' => 'https://www.universidades.gob.es'],
                    ['nombre' => 'SEPE', 'descripcion' => 'Observatorio de las Ocupaciones', 'url' => 'https://www.sepe.es'],
                    ['nombre' => 'U-Ranking BBVA-Ivie', 'descripcion' => 'Ranking de universidades españolas', 'url' => 'https://www.u-ranking.es']
                ]
            ]
        ];
    }

    private function getContenidoFPDual()
    {
        return [
            ['tipo' => 'intro', 'texto' => 'La Formación Profesional Dual combina el aprendizaje en el centro educativo con la formación práctica en empresas.'],
            ['tipo' => 'alerta', 'titulo' => '¿Sabías que...?', 'texto' => 'Los estudiantes de FP Dual pasan entre el 33% y el 50% de su tiempo formativo en empresas y suelen recibir remuneración.'],
            ['tipo' => 'seccion', 'numero' => '1', 'titulo' => '¿Qué es la FP Dual?', 'contenido' => 'Integra teoría en clase y práctica real en empresas con doble tutoría.'],
            ['tipo' => 'comparativa', 'titulo' => 'Ventajas', 'ventajas' => ['Experiencia laboral real', 'Mayor empleabilidad', 'Remuneración económica', 'Networking profesional']],
            [
                'tipo' => 'fuentes',
                'items' => [
                    ['nombre' => 'Ministerio de Educación y FP', 'descripcion' => 'Información oficial sobre FP Dual', 'url' => 'https://www.todofp.es'],
                    ['nombre' => 'Fundación Bertelsmann España', 'descripcion' => 'Estudios sobre FP Dual', 'url' => 'https://www.fundacionbertelsmann.org'],
                    ['nombre' => 'Alianza para la FP Dual', 'descripcion' => 'Red de empresas y centros', 'url' => 'https://www.alianzafpdual.es']
                ]
            ]
        ];
    }

    private function getContenidoTestsVocacionales()
    {
        return [
            ['tipo' => 'intro', 'texto' => 'Los tests de orientación vocacional son herramientas para descubrir tus intereses y habilidades.'],
            ['tipo' => 'alerta', 'titulo' => 'Son una guía, no una sentencia', 'texto' => 'Ningún test puede decidir tu futuro por ti. Son herramientas de autoconocimiento.'],
            ['tipo' => 'seccion', 'numero' => '1', 'titulo' => '¿Qué miden?', 'contenido' => 'Evalúan intereses, aptitudes, personalidad y valores laborales.'],
            ['tipo' => 'seccion', 'numero' => '2', 'titulo' => '¿Qué dice la ciencia?', 'contenido' => 'Tienen una fiabilidad del 70-80% si están bien diseñados, pero no predicen el éxito con certeza.'],
            [
                'tipo' => 'fuentes',
                'items' => [
                    ['nombre' => 'Consejo General de la Psicología de España', 'descripcion' => 'Uso ético de tests', 'url' => 'https://www.cop.es'],
                    ['nombre' => 'Ministerio de Educación', 'descripcion' => 'Recursos de orientación', 'url' => 'https://www.educacionyfp.gob.es']
                ]
            ]
        ];
    }

    private function getContenidoSalidasTech()
    {
        return [
            ['tipo' => 'intro', 'texto' => 'El sector tecnológico sigue siendo uno de los más dinámicos y con mayor proyección en 2025.'],
            ['tipo' => 'alerta', 'titulo' => 'Cifras del sector', 'texto' => 'Se estima que habrá miles de empleos sin cubrir en Europa y España.'],
            ['tipo' => 'seccion', 'numero' => '1', 'titulo' => 'Desarrollo de Software', 'contenido' => 'Perfiles como Full Stack, Mobile Developer y Cloud Engineer son muy demandados.'],
            ['tipo' => 'seccion', 'numero' => '2', 'titulo' => 'IA y Data', 'contenido' => 'AI Engineer y Data Scientist son las profesiones de mayor crecimiento.'],
            [
                'tipo' => 'fuentes',
                'items' => [
                    ['nombre' => 'DigitalES', 'descripcion' => 'Asociación Española para la Digitalización', 'url' => 'https://www.digitales.es'],
                    ['nombre' => 'InfoJobs', 'descripcion' => 'Informe del Mercado Laboral', 'url' => 'https://www.infojobs.net'],
                    ['nombre' => 'ONTSI', 'descripcion' => 'Observatorio Nacional de Tecnología', 'url' => 'https://www.ontsi.es']
                ]
            ]
        ];
    }

    private function getContenidoCartaPresentacion()
    {
        return [
            ['tipo' => 'intro', 'texto' => 'La carta de presentación es tu oportunidad de contar tu historia más allá de los puntos esquemáticos del currículum.'],
            ['tipo' => 'alerta', 'icono' => '💡', 'titulo' => 'Consejo clave', 'texto' => 'No repitas tu CV. Enfócate en cómo tus habilidades resolverán los problemas específicos de la empresa.'],
            ['tipo' => 'seccion', 'numero' => '1', 'titulo' => 'Estructura Ganadora', 'contenido' => "1. Saludo personalizado.\n2. Gancho inicial (quién eres y qué aportas).\n3. Cuerpo (logros relevantes y 'match' con la empresa).\n4. Cierre y llamada a la acción."],
            ['tipo' => 'seccion', 'numero' => '2', 'titulo' => 'Errores Comunes', 'contenido' => 'Usar plantillas genéricas, hablar solo de lo que tú quieres ganar y no de lo que vas a aportar, y faltas de ortografía.'],
            [
                'tipo' => 'fuentes',
                'items' => [
                    ['nombre' => 'Harvard Business Review', 'descripcion' => 'Guías de redacción profesional', 'url' => 'https://hbr.org/topic/cover-letters'],
                    ['nombre' => 'Modelos de Currículum', 'descripcion' => 'Ejemplos adaptados a España', 'url' => 'https://www.modelos-de-curriculum.com']
                ]
            ]
        ];
    }

    private function getContenidoCurriculum()
    {
        return [
            ['tipo' => 'intro', 'texto' => 'Tu currículum es tu herramienta de marketing personal. Tienes menos de 10 segundos para impresionar.'],
            ['tipo' => 'alerta', 'icono' => '⚡', 'titulo' => 'Menos es más', 'texto' => 'En 2025, se valoran los logros cuantificables y las soft skills validadas por encima de las listas interminables de tareas.'],
            ['tipo' => 'seccion', 'numero' => '1', 'titulo' => 'Estructura Perfecta', 'contenido' => 'Encabezado limpio (sin dirección completa), Perfil Profesional potente, Experiencia basada en Logros, Habilidades (Hard & Soft) y Formación.'],
            ['tipo' => 'seccion', 'numero' => '2', 'titulo' => 'Diseño Visual', 'contenido' => 'Usa tipografías sans-serif modernas, mucho espacio en blanco, y un color de acento profesional. Evita gráficos de barras para habilidades.'],
            [
                'tipo' => 'fuentes',
                'items' => [
                    ['nombre' => 'Europass', 'descripcion' => 'Estándares europeos de CV', 'url' => 'https://europass.europa.eu/es'],
                    ['nombre' => 'InfoJobs', 'descripcion' => 'Tendencias de reclutamiento', 'url' => 'https://www.infojobs.net']
                ]
            ]
        ];
    }
}
