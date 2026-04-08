<?php

namespace Database\Seeders;

use App\Models\QuestionBank;
use Illuminate\Database\Seeder;

/**
 * QuestionBankSeeder - Test RIASEC reestructurado según informe abril 2026
 * 
 * Estructura basada en el SDS (Self-Directed Search) de Holland:
 * - Fase 1: Actividades (30 ítems, 5 por dimensión, Likert 5 puntos) - Peso ×2
 * - Fase 2: Competencias (18 ítems, 3 por dimensión, Sí/No) - Peso ×1.5
 * - Fase 3: Ocupaciones (18 ítems, 3 por dimensión, Me atrae/No) - Peso ×1.5
 * - Fase 4: Comparativas (6 pares críticos) - Peso ×1
 * 
 * Total: 72 ítems por grupo de edad
 * 
 * Referencias:
 * - Holland, J.L. (1994). Self-Directed Search Form R (4th ed.)
 * - Martins et al. (2025). 18REST-2: A Revised Measure. N=63,128
 * - Ambiel et al. (2018). 18REST: A short RIASEC-interest measure
 */
class QuestionBankSeeder extends Seeder
{
    public function run(): void
    {
        foreach ($this->itemsByAgeGroup() as $ageGroup => $items) {
            // Deactivate previous bank for this age group (keeps history/compatibility)
            // Then upsert the current canonical set as active.
            QuestionBank::where('age_group', $ageGroup)->update(['is_active' => false]);

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
            'teen' => $this->teenItems(),
            'young_adult' => $this->youngAdultItems(),
            'adult' => $this->adultItems(),
        ];
    }

    // =========================================================================
    // TEEN (14-17 años)
    // =========================================================================
    
    protected function teenItems(): array
    {
        $items = [];
        $order = 1;
        
        $context = 'Piensa en lo que haces fuera de clase, en proyectos del instituto o en tu tiempo libre.';

        // FASE 1: ACTIVIDADES (Likert 5 puntos) - 30 ítems - Peso ×2
        $activities = [
            ['R', 'Me gusta arreglar o montar cosas con las manos'],
            ['R', 'Prefiero las actividades donde me muevo y hago algo físico'],
            ['R', 'Me atrae trabajar con herramientas, máquinas o materiales'],
            ['R', 'Disfruto construir o reparar objetos'],
            ['R', 'Me resulta más fácil aprender haciendo que leyendo'],
            
            ['I', 'Me gusta buscar explicaciones a las cosas que no entiendo'],
            ['I', 'Disfruto resolviendo problemas que requieren pensar mucho'],
            ['I', 'Me atrae experimentar para comprobar si algo funciona'],
            ['I', 'Prefiero entender cómo funciona algo antes de usarlo'],
            ['I', 'Me interesan los documentales o artículos sobre ciencia o tecnología'],
            
            ['A', 'Me gusta dibujar, escribir, componer o diseñar cosas propias'],
            ['A', 'Disfruto cuando puedo hacer un trabajo a mi manera, sin instrucciones fijas'],
            ['A', 'Me atrae actuar, tocar música, hacer vídeos o fotografía'],
            ['A', 'Prefiero tareas donde puedo inventar algo nuevo'],
            ['A', 'Me fijo en la estética: colores, formas, cómo quedan las cosas'],
            
            ['S', 'Me ofrezco a explicar cosas a compañeros que no las entienden'],
            ['S', 'Disfruto en actividades donde se trabaja en equipo cuidando a todos'],
            ['S', 'Me siento bien cuando alguien me cuenta un problema y puedo ayudar'],
            ['S', 'Prefiero trabajos donde trato con personas, no solo con objetos'],
            ['S', 'Me interesa participar en voluntariados o proyectos solidarios'],
            
            ['E', 'Me gusta proponer ideas y convencer a otros de que son buenas'],
            ['E', 'Disfruto organizando actividades y tomando decisiones'],
            ['E', 'Me atrae la idea de montar algo propio (un negocio, un canal, un proyecto)'],
            ['E', 'Prefiero ser quien dirige un grupo antes que seguir instrucciones'],
            ['E', 'Me motiva competir y conseguir resultados visibles'],
            
            ['C', 'Me gusta tener todo ordenado y saber qué toca en cada momento'],
            ['C', 'Disfruto tareas donde hay que seguir pasos claros y no improvisar'],
            ['C', 'Me atrae trabajar con números, tablas o listas'],
            ['C', 'Prefiero que las normas estén claras antes de empezar'],
            ['C', 'Me resulta fácil organizar información y mantener las cosas al día'],
        ];

        foreach ($activities as [$dim, $text]) {
            $items[] = [
                'phase' => 'activities',
                'dimension' => $dim,
                'dimension_b' => null,
                'weight' => 2.0,
                'text_es' => $text,
                'context_es' => $context,
                'options_json' => null,
                'order_default' => $order++,
                'is_active' => true,
            ];
        }

        // FASE 2: COMPETENCIAS (Sí/No) - 18 ítems - Peso ×1.5
        $competencies = [
            ['R', 'Sé usar herramientas básicas (destornillador, taladro, soldador...)'],
            ['R', 'Podría montar un mueble siguiendo las instrucciones'],
            ['R', 'Sé hacer reparaciones sencillas en casa'],
            
            ['I', 'Sé buscar información fiable y contrastarla con varias fuentes'],
            ['I', 'Podría diseñar un experimento sencillo para comprobar una hipótesis'],
            ['I', 'Sé interpretar un gráfico estadístico básico'],
            
            ['A', 'Sé usar algún programa de diseño, edición de vídeo o música'],
            ['A', 'Podría escribir un relato corto, una canción o un guion'],
            ['A', 'Sé improvisar una presentación creativa de un tema'],
            
            ['S', 'Sé mediar cuando dos amigos tienen un conflicto'],
            ['S', 'Podría explicar un tema difícil a alguien que no lo entiende'],
            ['S', 'Sé escuchar sin juzgar cuando alguien me cuenta un problema'],
            
            ['E', 'Sé organizar una actividad de grupo y repartir tareas'],
            ['E', 'Podría convencer a alguien de participar en un proyecto'],
            ['E', 'Sé negociar cuando hay desacuerdos para llegar a un acuerdo'],
            
            ['C', 'Sé organizar mis apuntes, archivos o materiales de forma ordenada'],
            ['C', 'Podría llevar las cuentas de un pequeño proyecto o evento'],
            ['C', 'Sé seguir un procedimiento paso a paso sin saltarme nada'],
        ];

        $compContext = '¿Serías capaz de hacer lo siguiente? Responde honestamente, no lo que te gustaría saber hacer, sino lo que realmente sabes o podrías hacer hoy.';
        
        foreach ($competencies as [$dim, $text]) {
            $items[] = [
                'phase' => 'competencies',
                'dimension' => $dim,
                'dimension_b' => null,
                'weight' => 1.5,
                'text_es' => $text,
                'context_es' => $compContext,
                'options_json' => null,
                'order_default' => $order++,
                'is_active' => true,
            ];
        }

        // FASE 3: OCUPACIONES (Me atrae / No me atrae) - 18 ítems - Peso ×1.5
        $occupations = [
            ['R', 'Electricista o técnico de instalaciones'],
            ['R', 'Mecánico o técnico de mantenimiento'],
            ['R', 'Agricultor o jardinero profesional'],
            
            ['I', 'Investigador científico'],
            ['I', 'Programador o analista de datos'],
            ['I', 'Médico o biólogo'],
            
            ['A', 'Diseñador gráfico o de videojuegos'],
            ['A', 'Músico, actor o director de cine'],
            ['A', 'Escritor, periodista o creador de contenido'],
            
            ['S', 'Profesor o educador'],
            ['S', 'Enfermero o trabajador social'],
            ['S', 'Psicólogo o terapeuta'],
            
            ['E', 'Empresario o fundador de startups'],
            ['E', 'Director de marketing o ventas'],
            ['E', 'Abogado o político'],
            
            ['C', 'Contable o auditor'],
            ['C', 'Administrativo o secretario de dirección'],
            ['C', 'Bibliotecario o archivista'],
        ];

        $occContext = 'Sin pensar demasiado, ¿te atrae o no la idea de trabajar como...?';
        
        foreach ($occupations as [$dim, $text]) {
            $items[] = [
                'phase' => 'occupations',
                'dimension' => $dim,
                'dimension_b' => null,
                'weight' => 1.5,
                'text_es' => $text,
                'context_es' => $occContext,
                'options_json' => null,
                'order_default' => $order++,
                'is_active' => true,
            ];
        }

        // FASE 4: COMPARATIVAS (6 pares críticos) - Peso ×1
        $comparatives = [
            ['R', 'S', '¿Prefieres arreglar cosas rotas o ayudar a personas que lo pasan mal?'],
            ['I', 'E', '¿Te atrae más investigar un tema a fondo o montar un proyecto y liderar a otros?'],
            ['A', 'C', '¿Prefieres hacer las cosas a tu manera o seguir un plan paso a paso?'],
            ['R', 'I', '¿Disfrutas más construyendo algo con tus manos o pensando cómo funciona algo?'],
            ['S', 'E', '¿Prefieres escuchar y apoyar a un amigo o convencer a un grupo de tu idea?'],
            ['A', 'I', '¿Te atrae más inventar algo original o descubrir cómo funciona algo que ya existe?'],
        ];

        $compContext = 'Elige la opción que más se acerque a ti. Si ambas te atraen, elige la que sientas con más fuerza.';
        
        foreach ($comparatives as [$dimA, $dimB, $text]) {
            $items[] = [
                'phase' => 'comparative',
                'dimension' => $dimA,
                'dimension_b' => $dimB,
                'weight' => 1.0,
                'text_es' => $text,
                'context_es' => $compContext,
                'options_json' => null,
                'order_default' => $order++,
                'is_active' => true,
            ];
        }

        return $items;
    }

    // =========================================================================
    // YOUNG ADULT (18-25 años)
    // =========================================================================
    
    protected function youngAdultItems(): array
    {
        $items = [];
        $order = 1;
        
        $context = 'Piensa en tus estudios, primeros trabajos o proyectos que te motivan.';

        // FASE 1: ACTIVIDADES (Likert 5 puntos) - 30 ítems - Peso ×2
        $activities = [
            ['R', 'Me gusta resolver problemas técnicos de forma práctica'],
            ['R', 'Prefiero trabajos donde el resultado sea tangible y concreto'],
            ['R', 'Me atrae operar equipos, herramientas o sistemas técnicos'],
            ['R', 'Disfruto más ejecutando que planificando'],
            ['R', 'Me siento cómodo en entornos donde se trabaja con las manos o en campo'],
            
            ['I', 'Me gusta analizar datos o información antes de tomar una decisión'],
            ['I', 'Disfruto investigando temas hasta comprenderlos a fondo'],
            ['I', 'Me atrae resolver problemas complejos que otros evitan'],
            ['I', 'Prefiero entornos donde se valora el pensamiento crítico'],
            ['I', 'Me interesa leer artículos técnicos, papers o documentación especializada'],
            
            ['A', 'Me gusta generar propuestas originales y diferentes'],
            ['A', 'Disfruto cuando un proyecto me deja libertad para crear'],
            ['A', 'Me atrae el diseño, la escritura, la producción audiovisual o el arte'],
            ['A', 'Prefiero improvisar soluciones antes que seguir un manual'],
            ['A', 'Me fijo en cómo se presenta algo, no solo en lo que dice'],
            
            ['S', 'Me gusta orientar, formar o acompañar a otras personas'],
            ['S', 'Disfruto en trabajos donde el trato humano es fundamental'],
            ['S', 'Me siento bien cuando mi trabajo mejora la vida de alguien'],
            ['S', 'Prefiero colaborar que competir'],
            ['S', 'Me interesa entender las emociones y motivaciones de los demás'],
            
            ['E', 'Me gusta asumir la iniciativa y mover a otros hacia un objetivo'],
            ['E', 'Disfruto negociando, vendiendo o defendiendo ideas'],
            ['E', 'Me atrae emprender o liderar proyectos propios'],
            ['E', 'Prefiero tomar decisiones rápidas a esperar consensos'],
            ['E', 'Me motivan los retos con impacto económico o estratégico'],
            
            ['C', 'Me gusta planificar tareas y hacer seguimiento de cada detalle'],
            ['C', 'Disfruto trabajando con datos, hojas de cálculo o registros'],
            ['C', 'Me atrae optimizar procesos para que todo funcione mejor'],
            ['C', 'Prefiero entornos con procedimientos claros y estables'],
            ['C', 'Me resulta natural revisar documentos para detectar errores'],
        ];

        foreach ($activities as [$dim, $text]) {
            $items[] = [
                'phase' => 'activities',
                'dimension' => $dim,
                'dimension_b' => null,
                'weight' => 2.0,
                'text_es' => $text,
                'context_es' => $context,
                'options_json' => null,
                'order_default' => $order++,
                'is_active' => true,
            ];
        }

        // FASE 2: COMPETENCIAS (Sí/No) - 18 ítems - Peso ×1.5
        $competencies = [
            ['R', 'Sé instalar, configurar o reparar equipos técnicos'],
            ['R', 'Podría ejecutar un proyecto práctico de principio a fin'],
            ['R', 'Sé diagnosticar fallos en un sistema o equipo'],
            
            ['I', 'Sé analizar un problema complejo descomponiéndolo en partes'],
            ['I', 'Podría redactar un informe con conclusiones basadas en datos'],
            ['I', 'Sé aplicar el método científico o un proceso de investigación'],
            
            ['A', 'Sé diseñar contenido visual atractivo (gráficos, vídeos, layouts)'],
            ['A', 'Podría crear un proyecto artístico o comunicativo desde cero'],
            ['A', 'Sé adaptar un mensaje para diferentes audiencias de forma creativa'],
            
            ['S', 'Sé facilitar una conversación grupal donde todos participen'],
            ['S', 'Podría formar o mentorizar a alguien en un tema que domino'],
            ['S', 'Sé detectar cuando alguien en un grupo no se siente bien'],
            
            ['E', 'Sé presentar una propuesta de forma persuasiva'],
            ['E', 'Podría coordinar un equipo y hacer seguimiento de entregables'],
            ['E', 'Sé identificar oportunidades donde otros ven problemas'],
            
            ['C', 'Sé crear hojas de cálculo con fórmulas y organización de datos'],
            ['C', 'Podría documentar un proceso para que otros lo repliquen'],
            ['C', 'Sé detectar errores o inconsistencias en un documento'],
        ];

        $compContext = '¿Serías capaz de hacer lo siguiente? Responde honestamente, no lo que te gustaría saber hacer, sino lo que realmente sabes o podrías hacer hoy.';
        
        foreach ($competencies as [$dim, $text]) {
            $items[] = [
                'phase' => 'competencies',
                'dimension' => $dim,
                'dimension_b' => null,
                'weight' => 1.5,
                'text_es' => $text,
                'context_es' => $compContext,
                'options_json' => null,
                'order_default' => $order++,
                'is_active' => true,
            ];
        }

        // FASE 3: OCUPACIONES (Me atrae / No me atrae) - 18 ítems - Peso ×1.5
        $occupations = [
            ['R', 'Técnico de redes, sistemas o ciberseguridad'],
            ['R', 'Ingeniero de producción o logística'],
            ['R', 'Técnico de sonido, iluminación o audiovisuales'],
            
            ['I', 'Analista de datos o científico de datos'],
            ['I', 'Investigador en tecnología o I+D'],
            ['I', 'Consultor especializado o perito'],
            
            ['A', 'Director creativo o diseñador UX/UI'],
            ['A', 'Fotógrafo, cineasta o productor audiovisual'],
            ['A', 'Redactor, copywriter o storyteller'],
            
            ['S', 'Orientador laboral o coach'],
            ['S', 'Educador social o mediador comunitario'],
            ['S', 'Terapeuta ocupacional o de rehabilitación'],
            
            ['E', 'CEO, fundador o director de operaciones'],
            ['E', 'Business developer o key account manager'],
            ['E', 'Project manager o scrum master'],
            
            ['C', 'Controller financiero o analista contable'],
            ['C', 'Especialista en compliance o calidad'],
            ['C', 'Administrador de bases de datos o documentalista'],
        ];

        $occContext = 'Sin pensar demasiado, ¿te atrae o no la idea de trabajar como...?';
        
        foreach ($occupations as [$dim, $text]) {
            $items[] = [
                'phase' => 'occupations',
                'dimension' => $dim,
                'dimension_b' => null,
                'weight' => 1.5,
                'text_es' => $text,
                'context_es' => $occContext,
                'options_json' => null,
                'order_default' => $order++,
                'is_active' => true,
            ];
        }

        // FASE 4: COMPARATIVAS (6 pares críticos) - Peso ×1
        $comparatives = [
            ['R', 'S', '¿Te ves más resolviendo problemas técnicos o acompañando personas en sus procesos?'],
            ['I', 'E', '¿Prefieres analizar datos para entender algo o tomar decisiones para mover un proyecto?'],
            ['A', 'C', '¿Te motiva más diseñar algo creativo o estructurar un proceso eficiente?'],
            ['R', 'I', '¿Disfrutas más implementando una solución o diseñando el análisis previo?'],
            ['S', 'E', '¿Te ves más mentorizando a alguien o coordinando un equipo hacia un objetivo?'],
            ['A', 'I', '¿Te atrae más crear una propuesta original o profundizar en la investigación de un tema?'],
        ];

        $compContext = 'Elige la opción que más se acerque a ti. Si ambas te atraen, elige la que sientas con más fuerza.';
        
        foreach ($comparatives as [$dimA, $dimB, $text]) {
            $items[] = [
                'phase' => 'comparative',
                'dimension' => $dimA,
                'dimension_b' => $dimB,
                'weight' => 1.0,
                'text_es' => $text,
                'context_es' => $compContext,
                'options_json' => null,
                'order_default' => $order++,
                'is_active' => true,
            ];
        }

        return $items;
    }

    // =========================================================================
    // ADULT (26+ años)
    // =========================================================================
    
    protected function adultItems(): array
    {
        $items = [];
        $order = 1;
        
        $context = 'Piensa en tu trayectoria profesional y en qué tipo de trabajo te haría sentir realizado.';

        // FASE 1: ACTIVIDADES (Likert 5 puntos) - 30 ítems - Peso ×2
        $activities = [
            ['R', 'Me satisface resolver problemas prácticos en contextos reales'],
            ['R', 'Valoro los trabajos donde el resultado es visible y útil'],
            ['R', 'Me atrae trabajar con instalaciones, equipos o infraestructura'],
            ['R', 'Disfruto más implementando que teorizando'],
            ['R', 'Me siento cómodo en entornos de trabajo físico o técnico'],
            
            ['I', 'Valoro poder analizar una situación a fondo antes de actuar'],
            ['I', 'Me satisface comprender sistemas complejos y encontrar patrones'],
            ['I', 'Me atrae el trabajo de investigación, diagnóstico o evaluación'],
            ['I', 'Disfruto aprendiendo conceptos nuevos de forma continua'],
            ['I', 'Prefiero que mis decisiones estén basadas en evidencia y datos'],
            
            ['A', 'Me satisface crear enfoques originales para resolver problemas'],
            ['A', 'Valoro la autonomía y la libertad en mi forma de trabajar'],
            ['A', 'Me atrae el diseño, la comunicación visual o la narrativa'],
            ['A', 'Disfruto reimaginando procesos o productos existentes'],
            ['A', 'Prefiero trabajos donde la creatividad sea un diferencial'],
            
            ['S', 'Encuentro sentido en acompañar, orientar o cuidar a otros'],
            ['S', 'Valoro los entornos donde el impacto humano es prioritario'],
            ['S', 'Me atrae la formación, la mediación o la atención a personas'],
            ['S', 'Disfruto generando espacios de confianza y escucha'],
            ['S', 'Me interesa contribuir al bienestar de comunidades o colectivos'],
            
            ['E', 'Me impulsa liderar cambios y asumir responsabilidades'],
            ['E', 'Valoro la capacidad de influir en decisiones estratégicas'],
            ['E', 'Me atrae gestionar personas, recursos o proyectos'],
            ['E', 'Disfruto identificando oportunidades y actuando rápido'],
            ['E', 'Me motivan los resultados medibles y el crecimiento'],
            
            ['C', 'Me satisface que los procesos funcionen con precisión'],
            ['C', 'Valoro el orden, la documentación y el seguimiento'],
            ['C', 'Me atrae el control de calidad, la auditoría o la gestión de datos'],
            ['C', 'Disfruto trabajando dentro de marcos normativos claros'],
            ['C', 'Me resulta natural sistematizar información y mantener registros'],
        ];

        foreach ($activities as [$dim, $text]) {
            $items[] = [
                'phase' => 'activities',
                'dimension' => $dim,
                'dimension_b' => null,
                'weight' => 2.0,
                'text_es' => $text,
                'context_es' => $context,
                'options_json' => null,
                'order_default' => $order++,
                'is_active' => true,
            ];
        }

        // FASE 2: COMPETENCIAS (Sí/No) - 18 ítems - Peso ×1.5
        $competencies = [
            ['R', 'Sé gestionar la ejecución técnica de un proyecto'],
            ['R', 'Podría resolver una incidencia operativa bajo presión'],
            ['R', 'Sé supervisar la calidad de un producto o servicio tangible'],
            
            ['I', 'Sé realizar diagnósticos fundamentados en datos y evidencias'],
            ['I', 'Podría diseñar un estudio o evaluación para resolver un problema'],
            ['I', 'Sé sintetizar información compleja en conclusiones claras'],
            
            ['A', 'Sé dirigir un proceso creativo o de diseño'],
            ['A', 'Podría innovar en un producto, servicio o experiencia existente'],
            ['A', 'Sé comunicar ideas complejas de forma visual e impactante'],
            
            ['S', 'Sé liderar procesos de formación o desarrollo de personas'],
            ['S', 'Podría gestionar situaciones de conflicto interpersonal'],
            ['S', 'Sé construir relaciones de confianza en un equipo'],
            
            ['E', 'Sé elaborar una estrategia y defenderla ante decisores'],
            ['E', 'Podría gestionar un presupuesto y tomar decisiones de inversión'],
            ['E', 'Sé motivar a un equipo cuando las cosas se ponen difíciles'],
            
            ['C', 'Sé implementar y mejorar procedimientos operativos'],
            ['C', 'Podría auditar un proceso y generar un informe de mejoras'],
            ['C', 'Sé gestionar bases de datos, inventarios o sistemas documentales'],
        ];

        $compContext = '¿Serías capaz de hacer lo siguiente? Responde honestamente, no lo que te gustaría saber hacer, sino lo que realmente sabes o podrías hacer hoy.';
        
        foreach ($competencies as [$dim, $text]) {
            $items[] = [
                'phase' => 'competencies',
                'dimension' => $dim,
                'dimension_b' => null,
                'weight' => 1.5,
                'text_es' => $text,
                'context_es' => $compContext,
                'options_json' => null,
                'order_default' => $order++,
                'is_active' => true,
            ];
        }

        // FASE 3: OCUPACIONES (Me atrae / No me atrae) - 18 ítems - Peso ×1.5
        $occupations = [
            ['R', 'Director técnico o jefe de obra'],
            ['R', 'Responsable de mantenimiento o producción'],
            ['R', 'Técnico especialista o artesano'],
            
            ['I', 'Director de I+D o responsable de innovación'],
            ['I', 'Consultor estratégico basado en datos'],
            ['I', 'Investigador sénior o docente universitario'],
            
            ['A', 'Director de arte o diseño'],
            ['A', 'Arquitecto, urbanista o diseñador de interiores'],
            ['A', 'Editor, guionista o productor ejecutivo'],
            
            ['S', 'Director de formación o desarrollo de personas'],
            ['S', 'Mediador, trabajador social o terapeuta'],
            ['S', 'Director de ONG o responsable de RSC'],
            
            ['E', 'Director general o consejero delegado'],
            ['E', 'Inversor, gestor de fondos o emprendedor serial'],
            ['E', 'Director comercial o de desarrollo de negocio'],
            
            ['C', 'Director financiero (CFO) o controller'],
            ['C', 'Responsable de calidad o compliance officer'],
            ['C', 'Director de administración o de operaciones'],
        ];

        $occContext = 'Sin pensar demasiado, ¿te atrae o no la idea de trabajar como...?';
        
        foreach ($occupations as [$dim, $text]) {
            $items[] = [
                'phase' => 'occupations',
                'dimension' => $dim,
                'dimension_b' => null,
                'weight' => 1.5,
                'text_es' => $text,
                'context_es' => $occContext,
                'options_json' => null,
                'order_default' => $order++,
                'is_active' => true,
            ];
        }

        // FASE 4: COMPARATIVAS (6 pares críticos) - Peso ×1
        $comparatives = [
            ['R', 'S', '¿Te realizas más resolviendo retos operativos o generando impacto en la vida de otros?'],
            ['I', 'E', '¿Prefieres diagnosticar y comprender o decidir y ejecutar?'],
            ['A', 'C', '¿Te aporta más la libertad creativa o la precisión y el control?'],
            ['R', 'I', '¿Disfrutas más llevando la ejecución práctica o diseñando la estrategia analítica?'],
            ['S', 'E', '¿Te identificas más con desarrollar personas o con impulsar resultados de negocio?'],
            ['A', 'I', '¿Te atrae más innovar desde la creatividad o desde el conocimiento profundo?'],
        ];

        $compContext = 'Elige la opción que más se acerque a ti. Si ambas te atraen, elige la que sientas con más fuerza.';
        
        foreach ($comparatives as [$dimA, $dimB, $text]) {
            $items[] = [
                'phase' => 'comparative',
                'dimension' => $dimA,
                'dimension_b' => $dimB,
                'weight' => 1.0,
                'text_es' => $text,
                'context_es' => $compContext,
                'options_json' => null,
                'order_default' => $order++,
                'is_active' => true,
            ];
        }

        return $items;
    }
}
