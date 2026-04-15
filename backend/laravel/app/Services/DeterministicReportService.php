<?php

namespace App\Services;

/**
 * DeterministicReportService
 *
 * Genera el informe vocacional RIASEC en Markdown a partir de las
 * puntuaciones calculadas por RiasecScoreCalculatorService.
 *
 * La estructura es completamente determinista y personalizada por perfil.
 * La IA solo enriquece las secciones narrativas opcionales (portrait, superpowers, mentor)
 * cuando GeminiService::generateNarrativeSections() está disponible.
 */
class DeterministicReportService
{
    // ─── Etiquetas y descripciones base ───────────────────────────────────────

    private const LABELS = [
        'R' => 'Realista',
        'I' => 'Investigador',
        'A' => 'Artístico',
        'S' => 'Social',
        'E' => 'Emprendedor',
        'C' => 'Convencional',
    ];

    private const DESCRIPTIONS = [
        'R' => 'Orientación práctica, técnica y de ejecución concreta.',
        'I' => 'Interés por analizar, investigar y comprender en profundidad.',
        'A' => 'Creatividad, expresión original e innovación constante.',
        'S' => 'Vocación de ayuda, cooperación e impacto en las personas.',
        'E' => 'Liderazgo, iniciativa y orientación a resultados estratégicos.',
        'C' => 'Orden, método, precisión y gestión estructurada.',
    ];

    // ─── Superpoderes por dimensión dominante ─────────────────────────────────
    // Cada dimensión aporta un superpoder específico y fundamentado en RIASEC.

    private const DIMENSION_POWERS = [
        'R' => [
            'name' => 'Maestría técnica y ejecución práctica',
            'why'  => 'Tu alta dimensión Realista refleja una inteligencia práctica natural: comprendes cómo funcionan los sistemas físicos y técnicos y los resuelves con eficiencia. Donde otros teorizar, tú construyes. Esta capacidad de pasar del concepto a la acción tangible es escasa y muy valorada en entornos productivos, industriales y tecnológicos aplicados.',
            'how'  => 'Profundiza en certificaciones técnicas o FP de tu área específica. La práctica deliberada —no la teoría— es tu palanca de crecimiento más potente. Busca proyectos donde puedas construir, optimizar o resolver algo con resultado físico y medible.',
        ],
        'I' => [
            'name' => 'Pensamiento analítico y rigor investigador',
            'why'  => 'Tu dimensión Investigadora indica que procesas información con profundidad y rigor metódico. Donde otros ven un resultado, tú identificas el proceso, el porqué y los patrones subyacentes. Esta capacidad de análisis estructurado y cuestionamiento sistemático es un diferencial en mercados donde los datos y el conocimiento especializado son ventaja competitiva.',
            'how'  => 'Cultívala con proyectos de investigación, análisis de datos o desarrollo de software. Lee fuera de tu disciplina para crear conexiones interdisciplinares. El pensamiento crítico se afila exponiendo tus hipótesis al debate y a la evidencia contraria.',
        ],
        'A' => [
            'name' => 'Creatividad aplicada y pensamiento original',
            'why'  => 'Tu dimensión Artística refleja pensamiento lateral y capacidad para generar soluciones donde las convencionales fallan. No sigues los procesos: los replanteas. Este rasgo es crítico en economías de innovación donde la diferenciación de producto, la comunicación y la experiencia de usuario son los principales vectores de valor.',
            'how'  => 'Exponte a disciplinas creativas fuera de la tuya (diseño, música, escritura, teatro) para ampliar tu vocabulario de soluciones. Practica el prototipado rápido: materializa ideas antes de perfeccionarlas. La creatividad profesional se entrena creando con restricciones reales, no en abstracto.',
        ],
        'S' => [
            'name' => 'Inteligencia interpersonal e influencia humana',
            'why'  => 'Tu dimensión Social indica una capacidad natural para conectar con otros, leer sus necesidades y generar entornos de colaboración de alto rendimiento. En contextos laborales, esto se traduce en influencia positiva, retención de equipos y construcción de relaciones duraderas con clientes y colegas. Es uno de los rasgos menos enseñables y más demandados en roles de liderazgo.',
            'how'  => 'Busca roles con responsabilidad sobre personas: mentoría, coordinación de equipos o atención directa a usuarios. La escucha activa, la comunicación no violenta y la gestión de conflictos son habilidades que puedes practicar en cualquier conversación ordinaria.',
        ],
        'E' => [
            'name' => 'Liderazgo estratégico y capacidad de persuasión',
            'why'  => 'Tu dimensión Emprendedora refleja orientación a resultados, confianza en tus criterios y capacidad para mover a otros hacia un objetivo con energía sostenida. Las personas con alta E prosperan en entornos dinámicos e inciertos donde hay que tomar decisiones sin toda la información disponible. Este rasgo es la base del liderazgo ejecutivo, la dirección comercial y el emprendimiento.',
            'how'  => 'Lidera proyectos reales, aunque sean pequeños. La negociación, la comunicación persuasiva y la toma de decisiones bajo presión se desarrollan solo con exposición real. Un rol de responsabilidad —no un curso— es tu mejor entrenamiento.',
        ],
        'C' => [
            'name' => 'Precisión, fiabilidad y gestión sistémica',
            'why'  => 'Tu dimensión Convencional refleja un pensamiento ordenado, fiable y orientado a la excelencia en los procesos. En entornos donde la calidad, la consistencia y el cumplimiento de estándares son críticos —finanzas, salud, ingeniería, auditoría, derecho— este rasgo es una ventaja competitiva directa. La fiabilidad que proyectas genera confianza institucional.',
            'how'  => 'Aplica metodologías estructuradas (LEAN, Six Sigma, gestión por proyectos, marcos de calidad ISO) para llevar tu precisión natural al siguiente nivel profesional. La documentación y los sistemas de control de calidad son tus herramientas de amplificación.',
        ],
    ];

    // ─── Superpoderes de combinación top-2 ────────────────────────────────────
    // Captura la sinergia específica entre los dos rasgos dominantes.

    private const COMBINATION_POWERS = [
        'RI' => ['name' => 'Ingeniería aplicada con base analítica',      'why' => 'La combinación Realista-Investigador produce perfiles de ingeniería, investigación aplicada y desarrollo técnico de alto nivel. Sabes construir Y entender por qué funciona lo que construyes.', 'how' => 'Proyectos de I+D, prototipado técnico, investigación en laboratorio o desarrollo de software con componente de diseño de sistemas.'],
        'IR' => ['name' => 'Ingeniería aplicada con base analítica',      'why' => 'La combinación Investigador-Realista produce perfiles de ingeniería, investigación aplicada y desarrollo técnico de alto nivel. Sabes construir Y entender por qué funciona lo que construyes.', 'how' => 'Proyectos de I+D, prototipado técnico, investigación en laboratorio o desarrollo de software con componente de diseño de sistemas.'],
        'RA' => ['name' => 'Innovación técnica con visión creativa',       'why' => 'Combinas precisión de ejecución con pensamiento disruptivo. Puedes diseñar soluciones que otros no conciben porque unes el saber técnico con la apertura creativa. Perfiles de product design, arquitectura técnica y fabricación avanzada.', 'how' => 'Proyectos de diseño industrial, fabricación digital, prototipado creativo o desarrollo de producto físico con componente estético.'],
        'AR' => ['name' => 'Innovación técnica con visión creativa',       'why' => 'Combinas pensamiento disruptivo con precisión de ejecución. Puedes diseñar soluciones que otros no conciben porque unes la apertura creativa con el saber técnico. Perfiles de product design, arquitectura técnica y fabricación avanzada.', 'how' => 'Proyectos de diseño industrial, fabricación digital, prototipado creativo o desarrollo de producto físico con componente estético.'],
        'RS' => ['name' => 'Asistencia técnica con impacto humano',        'why' => 'Sabes hacer las cosas bien Y sabes cómo impactan en las personas. Este puente entre competencia técnica y sensibilidad social es raro y muy valorado en salud, tecnología asistiva, trabajo social técnico y formación profesional.', 'how' => 'Roles en salud técnica (fisioterapia, técnico sanitario), formación práctica, soporte técnico avanzado o tecnología aplicada a la inclusión.'],
        'SR' => ['name' => 'Asistencia técnica con impacto humano',        'why' => 'Combinas sensibilidad social con competencia técnica. Este puente entre personas y sistemas es raro y muy valorado en salud, tecnología asistiva y formación.', 'how' => 'Roles en salud técnica (fisioterapia, técnico sanitario), formación práctica, soporte técnico avanzado o tecnología aplicada a la inclusión.'],
        'RE' => ['name' => 'Emprendimiento técnico y dirección operacional','why' => 'Combinas la capacidad de construir con la energía de liderar. Eres el perfil que puede arrancar un negocio técnico, gestionar una obra, dirigir una planta industrial o liderar equipos de ingeniería con credibilidad operativa.', 'how' => 'Gestión de proyectos técnicos, dirección de operaciones, emprendimiento en sectores industriales o tecnológicos, o roles de project management en entornos de producción.'],
        'ER' => ['name' => 'Emprendimiento técnico y dirección operacional','why' => 'Combinas liderazgo con competencia técnica. Eres el perfil que puede arrancar un negocio técnico y dirigir equipos con credibilidad operativa.', 'how' => 'Gestión de proyectos técnicos, dirección de operaciones o emprendimiento en sectores industriales o tecnológicos.'],
        'RC' => ['name' => 'Calidad técnica y control de procesos',        'why' => 'Tu combinación Realista-Convencional produce perfiles de excelencia operativa: construyes bien Y documentas y controlas el proceso. Es la base de la gestión de calidad, la auditoría técnica, la producción industrial avanzada y la logística de precisión.', 'how' => 'Certificaciones en gestión de calidad (ISO, Six Sigma), roles de control de producción, auditoría técnica, planificación logística o ingeniería de procesos.'],
        'CR' => ['name' => 'Calidad técnica y control de procesos',        'why' => 'Tu combinación Convencional-Realista produce perfiles de excelencia operativa: documentas y controlas el proceso Y construyes bien.', 'how' => 'Certificaciones en gestión de calidad (ISO, Six Sigma), roles de auditoría técnica, planificación logística o ingeniería de procesos.'],
        'IA' => ['name' => 'Investigación con metodología creativa',       'why' => 'Combinas rigor analítico con apertura a soluciones no convencionales. Puedes investigar profundamente Y generar hipótesis originales. Este perfil domina en ciencias del diseño, investigación cualitativa, UX research, innovación abierta y ciencias sociales con componente creativo.', 'how' => 'Research con metodologías mixtas, UX research, diseño de experimentos con creatividad, innovación en entornos académicos o divulgación científica.'],
        'AI' => ['name' => 'Investigación con metodología creativa',       'why' => 'Combinas apertura creativa con rigor analítico. Puedes generar hipótesis originales Y verificarlas con método. Domina en UX research, innovación abierta y ciencias sociales con componente creativo.', 'how' => 'Research con metodologías mixtas, UX research, diseño de experimentos, innovación en entornos académicos o divulgación científica.'],
        'IS' => ['name' => 'Investigación aplicada al bienestar humano',   'why' => 'La combinación Investigador-Social orienta el rigor analítico hacia la comprensión y mejora de las personas. Psicología, medicina, trabajo social basado en evidencia, políticas públicas y ciencias de la educación son tu territorio natural.', 'how' => 'Investigación en ciencias de la salud o sociales, diseño de políticas basadas en evidencia, evaluación de programas sociales o psicología clínica e investigadora.'],
        'SI' => ['name' => 'Investigación aplicada al bienestar humano',   'why' => 'Combinas vocación humana con rigor investigador. Psicología, medicina, trabajo social basado en evidencia y ciencias de la educación son tu territorio natural.', 'how' => 'Investigación en ciencias de la salud o sociales, diseño de políticas basadas en evidencia o psicología clínica e investigadora.'],
        'IE' => ['name' => 'Emprendimiento científico e innovación',       'why' => 'Combinas profundidad analítica con orientación al resultado y la acción. Eres el perfil que convierte investigación en producto, tecnología en negocio o conocimiento en impacto. Startups tecnológicas, transferencia de tecnología, consultoría de alto nivel y dirección de I+D son tu espacio.', 'how' => 'Proyectos de transferencia tecnológica, roles de innovación corporativa, emprendimiento en deeptech o consultoría estratégica basada en datos.'],
        'EI' => ['name' => 'Emprendimiento científico e innovación',       'why' => 'Combinas orientación al resultado con profundidad analítica. Eres el perfil que convierte investigación en producto y conocimiento en impacto.', 'how' => 'Proyectos de transferencia tecnológica, roles de innovación corporativa o emprendimiento en deeptech.'],
        'IC' => ['name' => 'Análisis sistemático y documentación experta', 'why' => 'Tu combinación Investigador-Convencional produce analistas, auditores, consultores de datos y expertos en compliance que son tanto rigurosos en el análisis como sistemáticos en la documentación y el seguimiento de procesos.', 'how' => 'Análisis de datos estructurado, auditoría, gestión de riesgos, inteligencia de negocio (BI), investigación con estándares normativos o roles de compliance y regulación.'],
        'CI' => ['name' => 'Análisis sistemático y documentación experta', 'why' => 'Tu combinación Convencional-Investigador produce analistas que son tanto sistemáticos como rigurosos. Compliance, auditoría, BI y gestión de riesgos son tu territorio.', 'how' => 'Análisis de datos estructurado, auditoría, inteligencia de negocio o roles de compliance y regulación.'],
        'AS' => ['name' => 'Comunicación creativa con impacto social',     'why' => 'Combinas expresión original con empatía profunda. Eres el perfil que crea contenidos que mueven a la gente, diseña experiencias que importan y comunica causas con autenticidad. Publicidad con propósito, diseño social, arte-terapia, educación creativa y medios son tu espacio.', 'how' => 'Storytelling, diseño centrado en el usuario, comunicación de causas sociales, educación creativa o proyectos de arte con impacto comunitario.'],
        'SA' => ['name' => 'Comunicación creativa con impacto social',     'why' => 'Combinas empatía profunda con expresión creativa. Creas contenidos que mueven a la gente y comunicas con autenticidad. Publicidad con propósito, diseño social y educación creativa son tu espacio.', 'how' => 'Storytelling, diseño centrado en el usuario, comunicación de causas sociales o proyectos de arte con impacto comunitario.'],
        'AE' => ['name' => 'Liderazgo creativo y visión de marca',         'why' => 'Combinas creatividad con capacidad para transformarla en impacto comercial y dirección de equipos. Dirección creativa, marketing de producto, dirección de agencia, emprendimiento en industrias creativas y branding son el espacio donde tu combinación alcanza su máximo potencial.', 'how' => 'Roles de dirección creativa, brand management, emprendimiento en sectores de contenido, diseño o entretenimiento, o dirección de equipos creativos.'],
        'EA' => ['name' => 'Liderazgo creativo y visión de marca',         'why' => 'Combinas dirección estratégica con visión creativa. Dirección creativa, brand management y emprendimiento en industrias creativas son tu espacio natural.', 'how' => 'Roles de dirección creativa, brand management o dirección de equipos creativos y de producto.'],
        'AC' => ['name' => 'Diseño estructurado y producción creativa',    'why' => 'Combinas visión creativa con rigor en la ejecución y el proceso. Eres el perfil que puede liderar proyectos creativos complejos sin perder el control de los plazos, los estándares y la calidad final. Dirección de producción, arquitectura, diseño editorial y gestión de proyectos culturales son tu territorio.', 'how' => 'Gestión de proyectos creativos, producción audiovisual o editorial, arquitectura o diseño de producto con fases de control de calidad estrictas.'],
        'CA' => ['name' => 'Diseño estructurado y producción creativa',    'why' => 'Combinas rigor en procesos con visión creativa. Puedes liderar proyectos creativos sin perder el control de calidad. Arquitectura, diseño editorial y gestión de proyectos culturales son tu territorio.', 'how' => 'Gestión de proyectos creativos, producción audiovisual, arquitectura o diseño de producto con control de calidad estricto.'],
        'SE' => ['name' => 'Liderazgo con inteligencia emocional',         'why' => 'La combinación Social-Emprendedor define a los líderes más efectivos: los que consiguen resultados porque entienden y conectan con las personas. Dirección de equipos, desarrollo organizacional, coaching ejecutivo, recursos humanos de alto nivel y dirección general son tu espacio de mayor impacto.', 'how' => 'Roles de liderazgo de personas, dirección de equipos multidisciplinares, coaching, consultoría organizacional o emprendimiento en servicios donde la relación con el cliente es el producto.'],
        'ES' => ['name' => 'Liderazgo con inteligencia emocional',         'why' => 'Combinas orientación al resultado con comprensión profunda de las personas. Los líderes más efectivos tienen esta combinación.', 'how' => 'Roles de liderazgo de personas, dirección de equipos, coaching ejecutivo o emprendimiento en servicios donde la relación es el producto.'],
        'SC' => ['name' => 'Gestión de personas y procesos humanos',       'why' => 'Combinas sensibilidad social con rigor en la gestión de procesos. Eres el perfil que puede diseñar sistemas de gestión de personas (RRHH, trabajo social, servicios públicos) que funcionen de verdad porque equilibran el cuidado de las personas con la eficiencia operativa.', 'how' => 'Recursos humanos, trabajo social institucional, gestión de servicios públicos, coordinación de ONGs o diseño de procesos en organizaciones orientadas a personas.'],
        'CS' => ['name' => 'Gestión de personas y procesos humanos',       'why' => 'Combinas rigor en procesos con sensibilidad hacia las personas. Puedes diseñar sistemas de gestión que equilibran eficiencia operativa y cuidado humano.', 'how' => 'Recursos humanos, trabajo social institucional, gestión de servicios públicos o coordinación de ONGs.'],
        'EC' => ['name' => 'Dirección estratégica con control de gestión', 'why' => 'La combinación Emprendedor-Convencional define a los directores generales más efectivos: tienen visión estratégica y ambición de resultado, pero también el rigor para medir, controlar y escalar de forma sostenible. Finanzas corporativas, dirección general, consultoría estratégica y auditoría de alto nivel son tu dominio.', 'how' => 'Roles de dirección general, control de gestión, finanzas corporativas, consultoría estratégica o dirección de operaciones en empresas de escala.'],
        'CE' => ['name' => 'Dirección estratégica con control de gestión', 'why' => 'Combinas rigor en la gestión con ambición estratégica. Finanzas corporativas, dirección general y consultoría estratégica son tu dominio natural.', 'how' => 'Roles de control de gestión, finanzas corporativas, consultoría estratégica o dirección de operaciones.'],
    ];

    // ─── Textos de Áreas de Crecimiento por dimensión baja ────────────────────

    private const GROWTH_AREAS = [
        'R' => [
            'title' => 'Competencia técnica y pensamiento práctico (R)',
            'text'  => 'Una dimensión Realista baja puede limitar tu credibilidad en entornos donde se espera que domines herramientas, sistemas físicos o procesos técnicos concretos. Desarrollar este área no significa hacerte técnico, sino añadir suficiente competencia práctica para comunicarte de igual a igual con quienes ejecutan. Empieza con proyectos maker, talleres de herramientas digitales (CAD, impresión 3D, Arduino) o cualquier actividad que te exija producir un resultado tangible. La práctica deliberada en este área cierra una brecha que muchos perfiles con tu código tienen y que puede marcar la diferencia al colaborar con equipos técnicos o al presentar proyectos con componente operativo.',
        ],
        'I' => [
            'title' => 'Capacidad analítica y razonamiento basado en evidencia (I)',
            'text'  => 'Una dimensión Investigadora baja puede manifestarse como tendencia a actuar antes de analizar suficientemente, dificultad para sustentar decisiones con datos o incomodidad ante problemas abiertos sin respuesta única. Desarrollar esta capacidad no requiere convertirte en investigador académico, sino incorporar el hábito de buscar evidencia antes de concluir. Practica el análisis de datos con herramientas accesibles (Excel avanzado, Python básico, Tableau), cultiva la lectura de informes del sector y exponte a estudios de caso que requieran interpretar resultados. Con tiempo, integrarás el pensamiento crítico como parte natural de tu toma de decisiones.',
        ],
        'A' => [
            'title' => 'Pensamiento creativo y apertura a enfoques nuevos (A)',
            'text'  => 'Una dimensión Artística baja no indica falta de talento, sino que tus fortalezas actuales están en la ejecución, el análisis o la gestión más que en la generación de ideas originales. En economías donde la diferenciación es clave, desarrollar apertura creativa te permitirá proponer soluciones novedosas y destacar cuando los procesos convencionales se quedan cortos. Practica el brainstorming sin autocensura, estudia diseño de experiencias o comunicación visual básica, y rodéate intencionalmente de personas con perfiles más artísticos. El objetivo no es ser creativo en abstracto, sino añadir flexibilidad cognitiva a tu perfil para no depender siempre de los mismos marcos de solución.',
        ],
        'S' => [
            'title' => 'Inteligencia interpersonal y habilidades de relación (S)',
            'text'  => 'Una dimensión Social baja puede traducirse en percepción de frialdad por parte de equipos, dificultades para conectar con clientes o usuarios, y limitaciones en roles donde la confianza interpersonal es el principal activo. Desarrollar este área no significa forzar una personalidad extrovertida, sino aprender a comunicar interés genuino, escuchar sin interrumpir y adaptar tu mensaje a tu interlocutor. La comunicación no violenta, la retroalimentación constructiva y el trabajo en equipos multidisciplinares son contextos donde puedes practicar. La competencia social se desarrolla con exposición consistente a situaciones de colaboración real, no con teoría.',
        ],
        'E' => [
            'title' => 'Iniciativa, liderazgo y orientación a resultados (E)',
            'text'  => 'Una dimensión Emprendedora baja puede limitarte cuando necesites defender tus ideas en una reunión, liderar un proyecto bajo presión o tomar decisiones con información incompleta. Estos contextos son cada vez más frecuentes en prácticamente todos los sectores, independientemente del rol. Desarrollar esta dimensión significa asumir responsabilidad de resultados concretos, aunque sean pequeños. Busca oportunidades para liderar iniciativas en tu entorno próximo, practica la comunicación persuasiva articulando el valor de tus propuestas, y exponerte a entornos donde el fracaso rápido esté normalizado. El liderazgo no requiere un cargo: se ejerce cada vez que tomas iniciativa y asumes el resultado.',
        ],
        'C' => [
            'title' => 'Organización, estructura y fiabilidad en los procesos (C)',
            'text'  => 'Una dimensión Convencional baja indica que los entornos muy estructurados, la documentación rigurosa y los procesos repetitivos pueden resultarte limitantes o agotadores. Sin embargo, cierto nivel de sistematización es necesario en cualquier rol profesional sostenible: sin él, tus otras fortalezas —por brillantes que sean— pueden percibirse como impredecibles. Desarrolla hábitos mínimos de organización: usa herramientas de gestión de proyectos (Trello, Notion, ClickUp), documenta brevemente las decisiones importantes y practica completar proyectos dentro de plazos acordados. El objetivo no es volverse convencional, sino añadir fiabilidad suficiente a tu perfil para que otros puedan confiar en tus entregas y escalar tu trabajo.',
        ],
    ];

    // ─── Método principal ─────────────────────────────────────────────────────

    public function build(array $profileData, array $careers = [], string $userName = '', array $aiNarrative = []): string
    {
        $scores = [
            'R' => (float) ($profileData['realistic_score']    ?? 0),
            'I' => (float) ($profileData['investigative_score'] ?? 0),
            'A' => (float) ($profileData['artistic_score']      ?? 0),
            'S' => (float) ($profileData['social_score']        ?? 0),
            'E' => (float) ($profileData['enterprising_score']  ?? 0),
            'C' => (float) ($profileData['conventional_score']  ?? 0),
        ];

        // ── User context (bio, hobbies, education, job) for deterministic enrichment
        $ctx          = is_array($profileData['_user_context'] ?? null) ? $profileData['_user_context'] : [];
        $ctxBio       = trim((string) ($ctx['bio']       ?? ''));
        $ctxHobbies   = trim((string) ($ctx['hobbies']   ?? ''));
        $ctxEducation = trim((string) ($ctx['education'] ?? ''));
        $ctxJob       = trim((string) ($ctx['job']       ?? ''));

        $total = array_sum($scores);
        $norm  = $total > 0 ? $total : 1;

        // Build sorted dimension rows (descending)
        $rows = [];
        foreach (['R', 'I', 'A', 'S', 'E', 'C'] as $d) {
            $pct     = round(($scores[$d] / $norm) * 100, 1);
            $rows[]  = [
                'dim'   => $d,
                'label' => self::LABELS[$d],
                'score' => round($scores[$d], 2),
                'pct'   => $pct,
                'stars' => $this->starsFromPct($pct),
            ];
        }
        usort($rows, fn($a, $b) => $b['pct'] <=> $a['pct']);

        $top  = array_slice($rows, 0, 3);
        $low  = array_slice(array_reverse($rows), 0, 2);
        $code = implode('', array_map(fn($r) => $r['dim'], $top));
        $user = trim($userName) !== '' ? $userName : 'tu';

        // ── Section 1: Holland code ────────────────────────────────────────────
        $md  = "# Tu Perfil Vocacional RIASEC\n\n";
        $md .= "## 1. Análisis de tu Código Holland\n";
        $md .= "{$user}, tu código Holland dominante es **{$code}**. Esto indica que combinas "
            . implode(', ', array_map(fn($r) => "**{$r['label']} ({$r['dim']})**", $top))
            . ".\n\n";

        $md .= "| Dimensión | Puntuación | % | Valoración |\n";
        $md .= "|---|---:|---:|---|\n";
        foreach ($rows as $r) {
            $md .= "| {$r['dim']} ({$r['label']}) | {$r['score']} | {$r['pct']}% | {$r['stars']} |\n";
        }
        $md .= "\n";
        foreach ($top as $r) {
            $md .= "- **{$r['label']} ({$r['dim']})**: " . self::DESCRIPTIONS[$r['dim']] . "\n";
        }

        // ── Section 2: Portrait ────────────────────────────────────────────────
        $md .= "\n## 2. Retrato Psicológico-Vocacional\n";
        $portrait = trim((string) ($aiNarrative['portrait'] ?? ''));
        if ($portrait !== '') {
            $md .= $portrait . "\n";
        } else {
            $dominantLabels = implode(', ', array_map(fn($r) => "**{$r['label']}**", $top));

            // Build a context-aware intro if bio or hobbies are available
            $contextLine = '';
            $ctxParts = array_filter([$ctxBio, $ctxHobbies], fn($v) => $v !== '');
            if (!empty($ctxParts)) {
                $contextLine = ' Tus intereses declarados (' . implode('; ', $ctxParts)
                    . ') refuerzan esta orientación y constituyen un punto de partida real para explorar estas áreas.';
            }

            $educationLine = '';
            if ($ctxEducation !== '') {
                $educationLine = " Tu nivel formativo actual ({$ctxEducation}) es el punto de partida: hay rutas accesibles y bien definidas desde ahí.";
            }

            $md .= "Tu perfil combina {$dominantLabels}, lo que configura una personalidad vocacional con capacidad para operar "
                . "en entornos que demandan a la vez {$top[0]['label']} y {$top[1]['label']}.{$contextLine} "
                . "Sueles rendir mejor cuando las tareas conectan directamente con tus intereses dominantes y puedes ver un progreso real y medible.{$educationLine} "
                . "En contextos de formación o trabajo, te beneficia combinar objetivos concretos, autonomía en la ejecución y retroalimentación frecuente. "
                . "Este retrato describe tus preferencias actuales, no un techo fijo: puede evolucionar con la experiencia y la formación deliberada.\n";
        }

        // ── Section 3: Superpowers ────────────────────────────────────────────
        $md .= "\n## 3. Tus Superpoderes Profesionales\n";
        $powers = $this->buildPowers($top);
        if (!empty($aiNarrative['superpowers']) && is_array($aiNarrative['superpowers'])) {
            $powers = $this->mergeSuperpowers($powers, $aiNarrative['superpowers']);
        }
        foreach ($powers as $i => $p) {
            $n   = $i + 1;
            $md .= "- **{$n}. {$p['name']}**\n";
            $md .= "  - **Por qué lo tienes:** {$p['why']}\n";
            $md .= "  - **Cómo potenciarlo:** {$p['how']}\n";
        }

        // ── Section 4: Careers ────────────────────────────────────────────────
        $md .= "\n## 4. Tus Caminos Profesionales Recomendados\n";
        if (!empty($careers)) {
            foreach ($careers as $career) {
                $title       = $career['titulo'] ?? 'Profesión recomendada';
                $compat      = $career['match_porcentaje'] ?? 75;
                $salidas     = is_array($career['salidas'] ?? null)
                    ? implode(', ', $career['salidas'])
                    : ($career['salidas'] ?? 'Salidas profesionales variadas en el sector.');
                $formacion   = $career['ruta_formativa'] ?? $career['nivel_formacion'] ?? 'Formación profesional o universitaria alineada.';
                $sector      = $career['sector'] ?? '';
                $sueldo      = $career['nivel_salarial'] ?? '';
                $habilidades = $career['habilidades_clave'] ?? [];
                if (is_string($habilidades)) {
                    $habilidades = array_filter(array_map('trim', explode(',', $habilidades)));
                }

                $md .= "\n### **{$title}**\n";
                $md .= "- **Compatibilidad RIASEC:** {$compat}%\n";
                if ($sector) {
                    $md .= "- **Sector:** {$sector}\n";
                }
                if ($sueldo) {
                    $md .= "- **Nivel salarial:** {$sueldo}\n";
                }
                $md .= "- **Por qué encaja contigo:** " . $this->buildFitExplanation($career, $top, $code) . "\n";
                $md .= "- **Salidas profesionales:** {$salidas}\n";
                if (!empty($habilidades)) {
                    $md .= "- **Habilidades clave:** " . implode(', ', (array) $habilidades) . "\n";
                }
                $md .= "- **Formación recomendada:** {$formacion}\n";
                $md .= "- **Primeros 3 pasos:**\n";
                $stepFromLevel = $ctxEducation !== '' ? " partiendo de tu nivel de {$ctxEducation}" : '';
                $md .= "  1. Investiga ofertas reales y requisitos actualizados del sector{$stepFromLevel}.\n";
                $md .= "  2. Define un plan formativo de 6-12 meses ajustado a tu nivel actual y a las exigencias reales del rol.\n";
                $md .= "  3. Crea un proyecto o portafolio mínimo que demuestre competencia en el área con resultados concretos y medibles.\n";
            }
        } else {
            $md .= "No se encontraron profesiones para mostrar en este momento.\n";
        }

        // ── Section 5: Growth areas ────────────────────────────────────────────
        $md .= "\n## 5. Áreas de Crecimiento\n";
        foreach ($low as $idx => $l) {
            $n    = $idx + 1;
            $area = self::GROWTH_AREAS[$l['dim']] ?? null;
            if ($area) {
                $md .= "\n{$n}. **{$area['title']}:**\n{$area['text']}\n";
            } else {
                $md .= "\n{$n}. **Desarrollo de {$l['label']} ({$l['dim']}):**\n"
                    . "Fortalecer esta dimensión aumentará tu versatilidad y empleabilidad. "
                    . "Busca actividades, proyectos o formaciones que te expongan a los valores centrales de este rasgo de forma práctica y gradual.\n";
            }
        }

        // ── Section 6: Mentor ─────────────────────────────────────────────────
        $md .= "\n## 6. Mensaje Final de tu Mentor\n";
        $mentor = trim((string) ($aiNarrative['mentor'] ?? ''));
        if ($mentor !== '') {
            $md .= $mentor . "\n";
        } else {
            $jobLine = '';
            if ($ctxJob !== '') {
                $jobLine = " Desde tu posición actual como {$ctxJob}, tienes ya una base real de experiencia desde la que explorar o redirigir.";
            }
            $educationClosing = $ctxEducation !== ''
                ? " Con tu nivel de {$ctxEducation}, tienes opciones formativas concretas a tu alcance —no tienes que empezar de cero."
                : '';
            $md .= "Vas por buen camino. Tu código **{$code}** no es una etiqueta cerrada: es un mapa de tus preferencias actuales.{$jobLine} "
                . "Úsalo para elegir experiencias concretas que confirmen o maticen lo que ya sabes de ti mismo.{$educationClosing} "
                . "La mejor decisión vocacional no es la perfecta sobre el papel: es la que construyes paso a paso, con foco, acción y revisión honesta.\n";
        }

        return $md;
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    protected function starsFromPct(float $pct): string
    {
        if ($pct >= 25) return '★★★★★';
        if ($pct >= 20) return '★★★★☆';
        if ($pct >= 15) return '★★★☆☆';
        if ($pct >= 10) return '★★☆☆☆';
        return '★☆☆☆☆';
    }

    /**
     * Construye 5 superpoderes personalizados:
     *  - 3 superpoderes individuales (uno por cada dimensión top)
     *  - 1 superpoder de combinación top-1 + top-2
     *  - 1 superpoder de adaptabilidad ligado al código completo
     */
    protected function buildPowers(array $top): array
    {
        $powers = [];

        // 1-3: Superpoderes individuales por dimensión dominante
        foreach (array_slice($top, 0, 3) as $r) {
            $dim = $r['dim'];
            if (isset(self::DIMENSION_POWERS[$dim])) {
                $powers[] = self::DIMENSION_POWERS[$dim];
            }
        }

        // 4: Superpoder de combinación top-2
        $comboKey = $top[0]['dim'] . $top[1]['dim'];
        if (isset(self::COMBINATION_POWERS[$comboKey])) {
            $powers[] = self::COMBINATION_POWERS[$comboKey];
        } else {
            // Fallback combinación genérica si no existe el par
            $powers[] = [
                'name' => "Sinergia {$top[0]['label']}-{$top[1]['label']}",
                'why'  => "La combinación de tus dos dimensiones dominantes crea un perfil complementario con ventajas en múltiples contextos profesionales.",
                'how'  => "Busca roles y proyectos donde ambas dimensiones sean relevantes simultáneamente para maximizar tu potencial.",
            ];
        }

        // 5: Superpoder de adaptabilidad vocacional (código completo)
        $code         = implode('', array_map(fn($r) => $r['dim'], $top));
        $labelList    = implode(', ', array_map(fn($r) => $r['label'], $top));
        $powers[] = [
            'name' => "Adaptabilidad vocacional ({$code})",
            'why'  => "Tu perfil {$code} combina rasgos de {$labelList}, lo que te permite operar con efectividad en contextos profesionales variados. Los perfiles multi-dimensionales tienen mayor resiliencia ante cambios del mercado laboral y capacidad para pivotar entre roles cuando el contexto lo exige.",
            'how'  => "Mantén un registro activo de proyectos donde hayas activado cada dimensión. Construye un portafolio que demuestre versatilidad real —no solo la declarada en el CV— con ejemplos concretos y medibles de cada área de tu código.",
        ];

        return array_slice($powers, 0, 5);
    }

    /**
     * Generates a specific, per-career fit explanation based on the overlap between
     * the user's RIASEC profile and the career's own RIASEC dimensions.
     *
     * @param array $career  Career data array (may include 'career_top_dims')
     * @param array $top     User's top 3 RIASEC rows (dim, label, pct, ...)
     * @param string $code   User's Holland code (e.g. 'IAS')
     */
    protected function buildFitExplanation(array $career, array $top, string $code): string
    {
        $careerDims  = $career['career_top_dims'] ?? [];
        $userTopDims = array_map(fn($r) => $r['dim'], $top);

        // Find dims that appear in BOTH the career's top dims and the user's top dims
        $shared = array_intersect($careerDims, $userTopDims);

        if (empty($careerDims) || empty($shared)) {
            // Fallback: generic code-level explanation
            return "Esta opción alinea con tu código **{$code}**, especialmente por la combinación de "
                . self::LABELS[$top[0]['dim']] . " y " . self::LABELS[$top[1]['dim']] . ".";
        }

        $sharedLabels    = array_map(fn($d) => '**' . self::LABELS[$d] . '**', $shared);
        $sharedStr       = implode(' y ', $sharedLabels);
        $careerPrimary   = self::LABELS[$careerDims[0]] ?? $careerDims[0];

        // Dims in user's top 3 NOT shared with this career → the "amplifying" trait
        $amplifiers = array_diff($userTopDims, $careerDims);

        if (count($shared) >= 2) {
            // Strong direct match
            $extra = !empty($amplifiers)
                ? ' Tu dimensión ' . self::LABELS[reset($amplifiers)] . ' añade un ángulo diferenciador dentro de este campo.'
                : '';
            return "Esta profesión tiene como núcleo {$sharedStr}, que coinciden con tus dimensiones dominantes en tu código **{$code}**.{$extra}";
        }

        // Partial match: one shared + complementary
        $shared1 = self::LABELS[reset($shared)];
        $amplifier = !empty($amplifiers) ? self::LABELS[reset($amplifiers)] : null;
        $amplifierStr = $amplifier ? " La aportación de tu dimensión **{$amplifier}** completa el perfil requerido y te diferencia de candidatos con un perfil más lineal." : '';
        return "La dimensión central de esta profesión es **{$careerPrimary}**, que conecta directamente con tu **{$shared1}** dominante.{$amplifierStr}";
    }

    protected function mergeSuperpowers(array $base, array $ai): array
    {
        $out = [];
        for ($i = 0; $i < 5; $i++) {
            $b = $base[$i] ?? null;
            $a = $ai[$i]   ?? null;

            if (!$b && !$a) {
                continue;
            }

            $out[] = [
                'name' => trim((string) ($a['name'] ?? ($b['name'] ?? 'Habilidad clave'))),
                'why'  => trim((string) ($a['why']  ?? ($b['why']  ?? ''))),
                'how'  => trim((string) ($a['how']  ?? ($b['how']  ?? ''))),
            ];
        }

        return $out;
    }
}
