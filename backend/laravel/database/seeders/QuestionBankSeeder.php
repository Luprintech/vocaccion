<?php

namespace Database\Seeders;

use App\Models\QuestionBank;
use Illuminate\Database\Seeder;

class QuestionBankSeeder extends Seeder
{
    public function run(): void
    {
        foreach ($this->itemsByAgeGroup() as $ageGroup => $items) {
            foreach ($items as $item) {
                QuestionBank::updateOrCreate(
                    [
                        'age_group' => $ageGroup,
                        'phase' => $item['phase'],
                        'text_es' => $item['text_es'],
                    ],
                    $item + ['age_group' => $ageGroup]
                );
            }
        }
    }

    protected function itemsByAgeGroup(): array
    {
        return [
            'teen' => $this->buildAgeGroupItems('teen', [
                'context' => 'Piensa en actividades del instituto, proyectos personales o cosas que disfrutas aprender.',
                'likert_prefix' => [
                    'R' => 'Me gusta',
                    'I' => 'Disfruto',
                    'A' => 'Me entusiasma',
                    'S' => 'Me siento bien',
                    'E' => 'Me motiva',
                    'C' => 'Me resulta cómodo',
                ],
                'likert' => [
                    'R' => ['arreglar o montar cosas con mis manos', 'usar herramientas o materiales para construir algo', 'aprender haciendo pruebas prácticas'],
                    'I' => ['investigar por qué ocurren las cosas', 'resolver problemas complejos paso a paso', 'analizar datos o experimentar hasta entender algo'],
                    'A' => ['crear dibujos, historias o ideas originales', 'expresarme de forma creativa en trabajos o proyectos', 'imaginar formas distintas de hacer una actividad'],
                    'S' => ['ayudar a compañeros cuando lo necesitan', 'escuchar y apoyar a otras personas', 'participar en actividades donde colaboramos en grupo'],
                    'E' => ['organizar actividades y tomar la iniciativa', 'convencer a otros de una buena idea', 'liderar un equipo para lograr una meta'],
                    'C' => ['seguir un plan claro para terminar bien una tarea', 'ordenar materiales, apuntes o información', 'trabajar con normas y pasos definidos'],
                ],
                'checklist' => [
                    ['dimension' => 'R', 'text' => 'Me llaman la atención actividades relacionadas con talleres, laboratorio o montaje.', 'options' => ['Talleres prácticos', 'Montaje o reparación', 'Experimentos con materiales']],
                    ['dimension' => 'R', 'text' => 'Disfruto tareas donde veo un resultado concreto al final.', 'options' => ['Construir algo', 'Armar un prototipo', 'Resolver una tarea manual']],
                    ['dimension' => 'I', 'text' => 'Me interesan actividades donde tengo que investigar o descubrir información.', 'options' => ['Buscar datos', 'Hacer hipótesis', 'Probar soluciones']],
                    ['dimension' => 'I', 'text' => 'Me motivan retos que requieren pensar bastante antes de responder.', 'options' => ['Resolver enigmas', 'Analizar causas', 'Diseñar experimentos']],
                    ['dimension' => 'A', 'text' => 'Me atraen actividades donde puedo expresarme con originalidad.', 'options' => ['Diseño', 'Escritura creativa', 'Música o arte']],
                    ['dimension' => 'A', 'text' => 'Prefiero tareas con libertad para proponer ideas nuevas.', 'options' => ['Inventar propuestas', 'Crear contenido', 'Improvisar soluciones']],
                    ['dimension' => 'S', 'text' => 'Me gusta participar en actividades centradas en ayudar o acompañar a otros.', 'options' => ['Tutorías', 'Voluntariado', 'Trabajo en equipo']],
                    ['dimension' => 'S', 'text' => 'Me siento cómodo en tareas donde hay mucho contacto con personas.', 'options' => ['Escuchar', 'Orientar', 'Colaborar']],
                    ['dimension' => 'E', 'text' => 'Me atraen actividades donde puedo influir o coordinar a otras personas.', 'options' => ['Dirigir', 'Negociar', 'Presentar ideas']],
                    ['dimension' => 'C', 'text' => 'Valoro actividades donde todo está bien organizado y estructurado.', 'options' => ['Ordenar datos', 'Seguir procedimientos', 'Revisar detalles']],
                ],
                'comparative' => [
                    ['A', 'I', 'Entre imaginar algo nuevo o investigar cómo funciona algo, ¿qué te atrae más?'],
                    ['S', 'E', 'Si estás en un grupo, ¿prefieres ayudar personalmente o coordinar a los demás?'],
                    ['R', 'I', '¿Disfrutas más haciendo algo práctico o analizando el problema antes?'],
                    ['C', 'A', '¿Te resulta más natural seguir una estructura o crear una propuesta original?'],
                    ['E', 'R', '¿Te ilusiona más liderar una actividad o construir/ejecutar directamente?'],
                    ['S', 'C', '¿Prefieres atender personas o trabajar con orden y procedimientos claros?'],
                ],
            ]),
            'young_adult' => $this->buildAgeGroupItems('young_adult', [
                'context' => 'Piensa en estudios, primeros trabajos, proyectos personales o actividades que te hacen sentir motivado.',
                'likert_prefix' => [
                    'R' => 'Me gusta',
                    'I' => 'Disfruto',
                    'A' => 'Me inspira',
                    'S' => 'Me resulta gratificante',
                    'E' => 'Me activa',
                    'C' => 'Me da seguridad',
                ],
                'likert' => [
                    'R' => ['trabajar en tareas técnicas o de ejecución práctica', 'resolver incidencias con herramientas, equipos o procesos', 'ver un resultado tangible de mi trabajo'],
                    'I' => ['analizar información antes de tomar decisiones', 'profundizar en problemas complejos hasta entenderlos bien', 'aprender conceptos nuevos y conectar ideas'],
                    'A' => ['crear propuestas originales o contenido propio', 'aportar una visión diferente en proyectos o trabajos', 'trabajar con libertad para imaginar soluciones nuevas'],
                    'S' => ['acompañar a otras personas en sus dudas o dificultades', 'colaborar en entornos donde el bienestar de otros importa', 'comunicarme con empatía y escucha activa'],
                    'E' => ['asumir liderazgo en proyectos o equipos', 'persuadir y defender una propuesta con confianza', 'tomar decisiones y mover a otros a la acción'],
                    'C' => ['trabajar con planificación, orden y seguimiento', 'revisar detalles para que todo encaje correctamente', 'sentirme cómodo con procesos, datos y organización'],
                ],
                'checklist' => [
                    ['dimension' => 'R', 'text' => 'Me interesan actividades donde haya acción práctica o técnica.', 'options' => ['Montaje', 'Operación de equipos', 'Resolución práctica']],
                    ['dimension' => 'R', 'text' => 'Valoro tareas donde se construye, mejora o repara algo.', 'options' => ['Optimizar procesos', 'Reparar', 'Implementar']],
                    ['dimension' => 'I', 'text' => 'Me atraen actividades donde debo investigar, analizar o diagnosticar.', 'options' => ['Investigar', 'Analizar causas', 'Contrastar datos']],
                    ['dimension' => 'I', 'text' => 'Disfruto entornos donde se aprende y razona constantemente.', 'options' => ['Estudiar', 'Modelizar', 'Resolver problemas']],
                    ['dimension' => 'A', 'text' => 'Me interesa participar en tareas creativas o de diseño.', 'options' => ['Diseñar', 'Escribir', 'Crear campañas o piezas']],
                    ['dimension' => 'A', 'text' => 'Me motivan proyectos con espacio para innovar.', 'options' => ['Idear conceptos', 'Experimentar formatos', 'Desarrollar propuestas']],
                    ['dimension' => 'S', 'text' => 'Me atraen funciones orientadas a apoyar o formar a otras personas.', 'options' => ['Mentorizar', 'Acompañar', 'Enseñar']],
                    ['dimension' => 'S', 'text' => 'Disfruto actividades donde la relación humana es central.', 'options' => ['Escuchar', 'Medir necesidades', 'Atender personas']],
                    ['dimension' => 'E', 'text' => 'Me llaman la atención tareas de liderazgo, ventas o negociación.', 'options' => ['Presentar', 'Convencer', 'Coordinar']],
                    ['dimension' => 'C', 'text' => 'Me siento cómodo trabajando con estructura, control y seguimiento.', 'options' => ['Documentar', 'Planificar', 'Auditar detalles']],
                ],
                'comparative' => [
                    ['I', 'E', 'Si tuvieras que elegir, ¿te atrae más investigar a fondo o liderar una iniciativa?'],
                    ['A', 'C', '¿Te motiva más crear algo original o estructurar algo para que funcione mejor?'],
                    ['S', 'R', '¿Prefieres ayudar directamente a personas o ejecutar tareas prácticas/técnicas?'],
                    ['E', 'S', '¿Te ves más influyendo y coordinando o acompañando de forma cercana?'],
                    ['R', 'I', '¿Disfrutas más aplicando soluciones o analizando problemas complejos?'],
                    ['C', 'A', '¿Te atrae más el orden y precisión o la libertad creativa?'],
                ],
            ]),
            'adult' => $this->buildAgeGroupItems('adult', [
                'context' => 'Piensa en tu experiencia laboral, intereses actuales y el tipo de trabajo que te haría sentir realizado.',
                'likert_prefix' => [
                    'R' => 'Me satisface',
                    'I' => 'Valoro',
                    'A' => 'Disfruto',
                    'S' => 'Encuentro sentido en',
                    'E' => 'Me impulsa',
                    'C' => 'Me resulta natural',
                ],
                'likert' => [
                    'R' => ['resolver problemas prácticos en contextos reales', 'trabajar con herramientas, equipos o procesos concretos', 'hacer tareas donde el resultado final sea visible y útil'],
                    'I' => ['analizar situaciones complejas antes de actuar', 'profundizar en información para comprender mejor un problema', 'aprender continuamente y aplicar pensamiento crítico'],
                    'A' => ['crear enfoques originales y diferentes', 'aportar visión creativa en proyectos o servicios', 'expresarme con libertad en mi forma de trabajar'],
                    'S' => ['acompañar, orientar o cuidar a otras personas', 'trabajar en entornos donde el impacto humano sea importante', 'usar la empatía como parte central del trabajo'],
                    'E' => ['impulsar cambios, liderar y tomar decisiones', 'movilizar a otras personas hacia objetivos concretos', 'asumir responsabilidad sobre resultados y dirección'],
                    'C' => ['organizar procesos y mantener orden operativo', 'controlar detalles para asegurar calidad y cumplimiento', 'trabajar con sistemas, datos o procedimientos definidos'],
                ],
                'checklist' => [
                    ['dimension' => 'R', 'text' => 'Me siguen atrayendo actividades de ejecución práctica o técnica.', 'options' => ['Operativa', 'Mantenimiento', 'Trabajo de campo']],
                    ['dimension' => 'R', 'text' => 'Valoro trabajos donde se resuelven problemas concretos y visibles.', 'options' => ['Implementar', 'Ajustar', 'Corregir fallos']],
                    ['dimension' => 'I', 'text' => 'Me interesan funciones donde hay análisis, diagnóstico o investigación.', 'options' => ['Analizar', 'Interpretar datos', 'Evaluar escenarios']],
                    ['dimension' => 'I', 'text' => 'Me motiva comprender sistemas complejos y mejorarlos.', 'options' => ['Modelar', 'Auditar', 'Diseñar soluciones']],
                    ['dimension' => 'A', 'text' => 'Me atraen trabajos donde la creatividad siga siendo importante.', 'options' => ['Diseñar', 'Crear contenidos', 'Idear experiencias']],
                    ['dimension' => 'A', 'text' => 'Prefiero tareas que permitan innovación y autonomía.', 'options' => ['Proponer', 'Conceptualizar', 'Explorar enfoques']],
                    ['dimension' => 'S', 'text' => 'Encuentro sentido en roles de ayuda, acompañamiento o formación.', 'options' => ['Acompañar', 'Escuchar', 'Formar']],
                    ['dimension' => 'S', 'text' => 'Me interesa trabajar de forma cercana con personas.', 'options' => ['Orientar', 'Atender', 'Facilitar']],
                    ['dimension' => 'E', 'text' => 'Me siguen atrayendo funciones de liderazgo o influencia.', 'options' => ['Negociar', 'Dirigir', 'Desarrollar negocio']],
                    ['dimension' => 'C', 'text' => 'Valoro entornos bien organizados, estables y con control de detalle.', 'options' => ['Planificar', 'Documentar', 'Supervisar cumplimiento']],
                ],
                'comparative' => [
                    ['S', 'E', 'En esta etapa, ¿te ves más acompañando personas o liderando decisiones?'],
                    ['I', 'R', '¿Prefieres analizar con profundidad o actuar directamente sobre lo práctico?'],
                    ['A', 'C', '¿Te aporta más la creatividad o la estructura y el control?'],
                    ['E', 'C', '¿Disfrutas más impulsando iniciativas o gestionando procesos con precisión?'],
                    ['R', 'S', '¿Te sientes más cómodo resolviendo tareas concretas o atendiendo personas?'],
                    ['A', 'I', '¿Te atrae más crear algo original o estudiar algo en profundidad?'],
                ],
            ]),
        ];
    }

    protected function buildAgeGroupItems(string $ageGroup, array $config): array
    {
        $items = [];
        $order = 1;

        foreach (['R', 'I', 'A', 'S', 'E', 'C'] as $dimension) {
            foreach ($config['likert'][$dimension] as $text) {
                $items[] = [
                    'phase' => 'likert',
                    'dimension' => $dimension,
                    'dimension_b' => null,
                    'weight' => 1.0,
                    'text_es' => $config['likert_prefix'][$dimension] . ' ' . $text,
                    'context_es' => $config['context'],
                    'options_json' => null,
                    'order_default' => $order++,
                    'is_active' => true,
                ];
            }
        }

        foreach ($config['checklist'] as $check) {
            $items[] = [
                'phase' => 'checklist',
                'dimension' => $check['dimension'],
                'dimension_b' => null,
                'weight' => 1.0,
                'text_es' => $check['text'],
                'context_es' => 'Marca las opciones que sientas cercanas a ti. En esta versión v2 se registra la afinidad general del item.',
                'options_json' => array_map(fn ($label) => ['label' => $label, 'dimension' => $check['dimension']], $check['options']),
                'order_default' => $order++,
                'is_active' => true,
            ];
        }

        foreach ($config['comparative'] as [$dimensionA, $dimensionB, $text]) {
            $items[] = [
                'phase' => 'comparative',
                'dimension' => $dimensionA,
                'dimension_b' => $dimensionB,
                'weight' => 1.0,
                'text_es' => $text,
                'context_es' => $config['context'],
                'options_json' => null,
                'order_default' => $order++,
                'is_active' => true,
            ];
        }

        return $items;
    }
}
