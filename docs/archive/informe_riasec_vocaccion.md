# Informe: Reestructuración del Test RIASEC — Vocacción

**Fecha:** Abril 2026  
**Para:** Lupe (LuPrinTech)  
**Objetivo:** Análisis crítico del seeder actual y propuesta fundamentada de mejora

---

## 1. Diagnóstico del estado actual

### Lo que tienes bien
- La diferenciación por **3 grupos de edad** (teen, young_adult, adult) es un acierto. El SDS oficial tiene versiones distintas: Form R para adultos, Career Explorer para adolescentes, y Form E simplificada. Tú estás siguiendo esa lógica.
- La estructura de **3 fases progresivas** (Likert → checklist → comparativas) tiene sentido pedagógico: vas de lo general a lo específico.
- Los **prefijos adaptativos** por dimensión ("Me gusta", "Disfruto", "Me entusiasma"...) son un detalle de calidad.

### Lo que hay que corregir (sin paños calientes)

**Problema 1: Tu fase Likert tiene solo 3 ítems por dimensión (18 total)**

El SDS original tiene **11 ítems por dimensión solo en la sección de Actividades**, más 11 en Competencias, 14 en Ocupaciones, y 2 de Autoestima. Eso son ~228 ítems en total. El 18REST, que es la versión corta validada científicamente, tiene 18 ítems (3 por dimensión) pero está diseñado como instrumento **único**, no como parte de un test multifase. Con 3 ítems por dimensión en Likert tienes muy poca granularidad para diferenciar perfiles, especialmente cuando los tipos adyacentes en el hexágono (R-I, I-A, A-S, etc.) son similares por definición.

**Problema 2: Tu fase "Checklist" no es realmente un checklist del modelo**

En el SDS, la sección de Competencias pregunta cosas como "Sé leer planos" o "Sé tocar un instrumento" (sí/no). Tu "checklist" es en realidad una selección de actividades con 3 opciones predefinidas, todas apuntando a la **misma dimensión**. Esto no discrimina entre dimensiones; solo confirma algo que ya sabes. Es como preguntar "¿Te gusta el chocolate: a) con leche, b) negro, c) blanco?" — las tres respuestas son "chocolate".

**Problema 3: Las comparativas solo cubren 6 de los 15 pares posibles**

El hexágono RIASEC tiene 15 pares posibles (combinaciones de 6 elementos tomados de 2 en 2). Tú solo comparas 6 pares, y peor aún, no son los mismos pares en los 3 grupos de edad. Esto hace que los resultados no sean comparables entre grupos.

**Problema 4: Mezcla de constructos**

Algunas preguntas miden **intereses** ("Me gusta..."), otras miden **valores** ("Valoro..."), y otras miden **competencias autopercibidas** ("Me resulta cómodo..."). El SDS separa estos constructos en secciones distintas por una razón: mezclarlos en una misma escala Likert contamina la medición.

**Problema 5: Sesgo de deseabilidad social**

Muchas de tus preguntas son demasiado "bonitas". Nadie va a decir "No me gusta ayudar a compañeros" o "No disfruto colaborar". Las preguntas de la dimensión Social y Emprendedora son especialmente vulnerables a esto. El SDS original usa ítems más concretos y conductuales para evitarlo.

---

## 2. Fundamentación teórica

### Fuentes principales utilizadas

| Fuente | Referencia |
|--------|-----------|
| Teoría original | Holland, J.L. (1959). A theory of occupational choice. *Psychological Bulletin*, 56, 121-139 |
| Instrumento SDS | Holland, J.L. (1994). Self-Directed Search Form R, 4th Ed. |
| Versión corta validada | Ambiel et al. (2018). 18REST: A short RIASEC-interest measure. *Psicologia: Reflexão e Crítica*, 31(1) |
| Revisión 18REST-2 | Martins et al. (2025). 18REST-2: A Revised Measure. Muestra: 63.128 estudiantes |
| Meta-revisión de la teoría | Nauta, M.M. (2010). The Development, Evolution, and Status of Holland's Theory |
| Validación en árabe | Aljojo & Saifuddin (2017). Reliability and Validity of Holland's RIASEC in Arabic. N=178 |

### Estructura del SDS oficial (Form R, 5ª edición)

El SDS oficial se compone de estas secciones en este orden:

1. **Aspiraciones** (Daydreams): El usuario lista ocupaciones que ha soñado tener. Se codifican según RIASEC.
2. **Actividades**: 11 ítems × 6 dimensiones = 66 ítems. Respuesta: "Me gusta" / "No me gusta".
3. **Competencias**: 11 ítems × 6 dimensiones = 66 ítems. Respuesta: "Sí puedo" / "No puedo".
4. **Ocupaciones**: 14 títulos × 6 dimensiones = 84 ítems. Respuesta: "Sí" / "No".
5. **Autoestimaciones**: 2 escalas × 6 dimensiones = 12 ítems. Escala 1-7.

**Total: ~228 ítems + aspiraciones.**

La fiabilidad test-retest del SDS va de .76 a .89, y la consistencia interna (KR-20) de .90 a .94.

### El hexágono y las distancias

Regla mnemotécnica: **RIASEC se lee como un reloj**. Los tipos adyacentes se parecen, los opuestos son incompatibles:

```
        R (Realista)
       / \
      C   I (Investigador)
      |   |
      E   A (Artístico)
       \ /
        S (Social)

Opuestos: R↔S, I↔E, A↔C
```

Esto importa para tus comparativas: comparar opuestos (R vs S, I vs E, A vs C) es lo que más discrimina.

### Hallazgo clave del 18REST-2 (Martins et al., 2025)

Este estudio con 63.128 estudiantes brasileños de 5°, 9° y 12° grado encontró que **los estudiantes más jóvenes muestran menor coherencia y diferenciación en sus intereses**. Esto significa que tu grupo "teen" necesita preguntas más concretas y conductuales, no abstractas.

---

## 3. Propuesta de reestructuración

### Arquitectura general

| Fase | Nombre | Qué mide | Ítems por dimensión | Total | Formato |
|------|--------|----------|---------------------|-------|---------|
| 1 | Actividades | Intereses | 5 | 30 | Likert 5 puntos |
| 2 | Competencias | Habilidades autopercibidas | 3 | 18 | Sí/No |
| 3 | Ocupaciones | Atracción por títulos ocupacionales | 3 | 18 | Me atrae / No me atrae |
| 4 | Comparativas | Desempate entre dimensiones cercanas | — | 6 | Elección forzada |
| **Total** | | | | **72** | |

Esto da un test de ~10-15 minutos, que es razonable para una app.

### Por qué esta estructura y no la tuya

- **Fase 1 (Actividades/Likert)**: Pasa de 3 a 5 ítems por dimensión. Con 5 ítems y escala de 5 puntos, cada dimensión tiene un rango de 5-25 puntos, suficiente para discriminar.
- **Fase 2 (Competencias)**: Reemplaza tu "checklist" que no discriminaba. Ahora pregunta "¿Sabes hacer X?" — mide capacidad percibida, no interés. Esto es clave porque alguien puede tener interés R pero no competencia R, y eso es información útil.
- **Fase 3 (Ocupaciones)**: Nueva. Pregunta por títulos ocupacionales concretos. Es la sección más resistente al sesgo de deseabilidad social porque "¿Te atrae ser fontanero?" no tiene una respuesta "socialmente correcta".
- **Fase 4 (Comparativas)**: Se mantiene pero ahora cubre los 3 pares opuestos obligatorios (R↔S, I↔E, A↔C) más 3 pares adyacentes problemáticos — y **son los mismos pares para los 3 grupos de edad**.

---

## 4. Batería de preguntas propuesta

### FASE 1: Actividades — Escala Likert (5 puntos)

**Escala:** 1 = Nada de acuerdo · 2 = Poco de acuerdo · 3 = Neutral · 4 = De acuerdo · 5 = Muy de acuerdo

**Instrucción general:** "Indica cuánto te identificas con cada afirmación."

#### GRUPO: Teen (14-17 años)

**Contexto:** "Piensa en lo que haces fuera de clase, en proyectos del instituto o en tu tiempo libre."

| # | Dim | Ítem |
|---|-----|------|
| 1 | R | Me gusta arreglar o montar cosas con las manos |
| 2 | R | Prefiero las actividades donde me muevo y hago algo físico |
| 3 | R | Me atrae trabajar con herramientas, máquinas o materiales |
| 4 | R | Disfruto construir o reparar objetos |
| 5 | R | Me resulta más fácil aprender haciendo que leyendo |
| 6 | I | Me gusta buscar explicaciones a las cosas que no entiendo |
| 7 | I | Disfruto resolviendo problemas que requieren pensar mucho |
| 8 | I | Me atrae experimentar para comprobar si algo funciona |
| 9 | I | Prefiero entender cómo funciona algo antes de usarlo |
| 10 | I | Me interesan los documentales o artículos sobre ciencia o tecnología |
| 11 | A | Me gusta dibujar, escribir, componer o diseñar cosas propias |
| 12 | A | Disfruto cuando puedo hacer un trabajo a mi manera, sin instrucciones fijas |
| 13 | A | Me atrae actuar, tocar música, hacer vídeos o fotografía |
| 14 | A | Prefiero tareas donde puedo inventar algo nuevo |
| 15 | A | Me fijo en la estética: colores, formas, cómo quedan las cosas |
| 16 | S | Me ofrezco a explicar cosas a compañeros que no las entienden |
| 17 | S | Disfruto en actividades donde se trabaja en equipo cuidando a todos |
| 18 | S | Me siento bien cuando alguien me cuenta un problema y puedo ayudar |
| 19 | S | Prefiero trabajos donde trato con personas, no solo con objetos |
| 20 | S | Me interesa participar en voluntariados o proyectos solidarios |
| 21 | E | Me gusta proponer ideas y convencer a otros de que son buenas |
| 22 | E | Disfruto organizando actividades y tomando decisiones |
| 23 | E | Me atrae la idea de montar algo propio (un negocio, un canal, un proyecto) |
| 24 | E | Prefiero ser quien dirige un grupo antes que seguir instrucciones |
| 25 | E | Me motiva competir y conseguir resultados visibles |
| 26 | C | Me gusta tener todo ordenado y saber qué toca en cada momento |
| 27 | C | Disfruto tareas donde hay que seguir pasos claros y no improvisar |
| 28 | C | Me atrae trabajar con números, tablas o listas |
| 29 | C | Prefiero que las normas estén claras antes de empezar |
| 30 | C | Me resulta fácil organizar información y mantener las cosas al día |

#### GRUPO: Young Adult (18-25 años)

**Contexto:** "Piensa en tus estudios, primeros trabajos o proyectos que te motivan."

| # | Dim | Ítem |
|---|-----|------|
| 1 | R | Me gusta resolver problemas técnicos de forma práctica |
| 2 | R | Prefiero trabajos donde el resultado sea tangible y concreto |
| 3 | R | Me atrae operar equipos, herramientas o sistemas técnicos |
| 4 | R | Disfruto más ejecutando que planificando |
| 5 | R | Me siento cómodo en entornos donde se trabaja con las manos o en campo |
| 6 | I | Me gusta analizar datos o información antes de tomar una decisión |
| 7 | I | Disfruto investigando temas hasta comprenderlos a fondo |
| 8 | I | Me atrae resolver problemas complejos que otros evitan |
| 9 | I | Prefiero entornos donde se valora el pensamiento crítico |
| 10 | I | Me interesa leer artículos técnicos, papers o documentación especializada |
| 11 | A | Me gusta generar propuestas originales y diferentes |
| 12 | A | Disfruto cuando un proyecto me deja libertad para crear |
| 13 | A | Me atrae el diseño, la escritura, la producción audiovisual o el arte |
| 14 | A | Prefiero improvisar soluciones antes que seguir un manual |
| 15 | A | Me fijo en cómo se presenta algo, no solo en lo que dice |
| 16 | S | Me gusta orientar, formar o acompañar a otras personas |
| 17 | S | Disfruto en trabajos donde el trato humano es fundamental |
| 18 | S | Me siento bien cuando mi trabajo mejora la vida de alguien |
| 19 | S | Prefiero colaborar que competir |
| 20 | S | Me interesa entender las emociones y motivaciones de los demás |
| 21 | E | Me gusta asumir la iniciativa y mover a otros hacia un objetivo |
| 22 | E | Disfruto negociando, vendiendo o defendiendo ideas |
| 23 | E | Me atrae emprender o liderar proyectos propios |
| 24 | E | Prefiero tomar decisiones rápidas a esperar consensos |
| 25 | E | Me motivan los retos con impacto económico o estratégico |
| 26 | C | Me gusta planificar tareas y hacer seguimiento de cada detalle |
| 27 | C | Disfruto trabajando con datos, hojas de cálculo o registros |
| 28 | C | Me atrae optimizar procesos para que todo funcione mejor |
| 29 | C | Prefiero entornos con procedimientos claros y estables |
| 30 | C | Me resulta natural revisar documentos para detectar errores |

#### GRUPO: Adult (26+ años)

**Contexto:** "Piensa en tu trayectoria profesional y en qué tipo de trabajo te haría sentir realizado."

| # | Dim | Ítem |
|---|-----|------|
| 1 | R | Me satisface resolver problemas prácticos en contextos reales |
| 2 | R | Valoro los trabajos donde el resultado es visible y útil |
| 3 | R | Me atrae trabajar con instalaciones, equipos o infraestructura |
| 4 | R | Disfruto más implementando que teorizando |
| 5 | R | Me siento cómodo en entornos de trabajo físico o técnico |
| 6 | I | Valoro poder analizar una situación a fondo antes de actuar |
| 7 | I | Me satisface comprender sistemas complejos y encontrar patrones |
| 8 | I | Me atrae el trabajo de investigación, diagnóstico o evaluación |
| 9 | I | Disfruto aprendiendo conceptos nuevos de forma continua |
| 10 | I | Prefiero que mis decisiones estén basadas en evidencia y datos |
| 11 | A | Me satisface crear enfoques originales para resolver problemas |
| 12 | A | Valoro la autonomía y la libertad en mi forma de trabajar |
| 13 | A | Me atrae el diseño, la comunicación visual o la narrativa |
| 14 | A | Disfruto reimaginando procesos o productos existentes |
| 15 | A | Prefiero trabajos donde la creatividad sea un diferencial |
| 16 | S | Encuentro sentido en acompañar, orientar o cuidar a otros |
| 17 | S | Valoro los entornos donde el impacto humano es prioritario |
| 18 | S | Me atrae la formación, la mediación o la atención a personas |
| 19 | S | Disfruto generando espacios de confianza y escucha |
| 20 | S | Me interesa contribuir al bienestar de comunidades o colectivos |
| 21 | E | Me impulsa liderar cambios y asumir responsabilidades |
| 22 | E | Valoro la capacidad de influir en decisiones estratégicas |
| 23 | E | Me atrae gestionar personas, recursos o proyectos |
| 24 | E | Disfruto identificando oportunidades y actuando rápido |
| 25 | E | Me motivan los resultados medibles y el crecimiento |
| 26 | C | Me satisface que los procesos funcionen con precisión |
| 27 | C | Valoro el orden, la documentación y el seguimiento |
| 28 | C | Me atrae el control de calidad, la auditoría o la gestión de datos |
| 29 | C | Disfruto trabajando dentro de marcos normativos claros |
| 30 | C | Me resulta natural sistematizar información y mantener registros |

---

### FASE 2: Competencias autopercibidas — Sí/No

**Instrucción:** "¿Serías capaz de hacer lo siguiente? Responde honestamente, no lo que te gustaría saber hacer, sino lo que realmente sabes o podrías hacer hoy."

#### GRUPO: Teen

| # | Dim | Ítem |
|---|-----|------|
| 1 | R | Sé usar herramientas básicas (destornillador, taladro, soldador...) |
| 2 | R | Podría montar un mueble siguiendo las instrucciones |
| 3 | R | Sé hacer reparaciones sencillas en casa |
| 4 | I | Sé buscar información fiable y contrastarla con varias fuentes |
| 5 | I | Podría diseñar un experimento sencillo para comprobar una hipótesis |
| 6 | I | Sé interpretar un gráfico estadístico básico |
| 7 | A | Sé usar algún programa de diseño, edición de vídeo o música |
| 8 | A | Podría escribir un relato corto, una canción o un guion |
| 9 | A | Sé improvisar una presentación creativa de un tema |
| 10 | S | Sé mediar cuando dos amigos tienen un conflicto |
| 11 | S | Podría explicar un tema difícil a alguien que no lo entiende |
| 12 | S | Sé escuchar sin juzgar cuando alguien me cuenta un problema |
| 13 | E | Sé organizar una actividad de grupo y repartir tareas |
| 14 | E | Podría convencer a alguien de participar en un proyecto |
| 15 | E | Sé negociar cuando hay desacuerdos para llegar a un acuerdo |
| 16 | C | Sé organizar mis apuntes, archivos o materiales de forma ordenada |
| 17 | C | Podría llevar las cuentas de un pequeño proyecto o evento |
| 18 | C | Sé seguir un procedimiento paso a paso sin saltarme nada |

#### GRUPO: Young Adult

| # | Dim | Ítem |
|---|-----|------|
| 1 | R | Sé instalar, configurar o reparar equipos técnicos |
| 2 | R | Podría ejecutar un proyecto práctico de principio a fin |
| 3 | R | Sé diagnosticar fallos en un sistema o equipo |
| 4 | I | Sé analizar un problema complejo descomponiéndolo en partes |
| 5 | I | Podría redactar un informe con conclusiones basadas en datos |
| 6 | I | Sé aplicar el método científico o un proceso de investigación |
| 7 | A | Sé diseñar contenido visual atractivo (gráficos, vídeos, layouts) |
| 8 | A | Podría crear un proyecto artístico o comunicativo desde cero |
| 9 | A | Sé adaptar un mensaje para diferentes audiencias de forma creativa |
| 10 | S | Sé facilitar una conversación grupal donde todos participen |
| 11 | S | Podría formar o mentorizar a alguien en un tema que domino |
| 12 | S | Sé detectar cuando alguien en un grupo no se siente bien |
| 13 | E | Sé presentar una propuesta de forma persuasiva |
| 14 | E | Podría coordinar un equipo y hacer seguimiento de entregables |
| 15 | E | Sé identificar oportunidades donde otros ven problemas |
| 16 | C | Sé crear hojas de cálculo con fórmulas y organización de datos |
| 17 | C | Podría documentar un proceso para que otros lo repliquen |
| 18 | C | Sé detectar errores o inconsistencias en un documento |

#### GRUPO: Adult

| # | Dim | Ítem |
|---|-----|------|
| 1 | R | Sé gestionar la ejecución técnica de un proyecto |
| 2 | R | Podría resolver una incidencia operativa bajo presión |
| 3 | R | Sé supervisar la calidad de un producto o servicio tangible |
| 4 | I | Sé realizar diagnósticos fundamentados en datos y evidencias |
| 5 | I | Podría diseñar un estudio o evaluación para resolver un problema |
| 6 | I | Sé sintetizar información compleja en conclusiones claras |
| 7 | A | Sé dirigir un proceso creativo o de diseño |
| 8 | A | Podría innovar en un producto, servicio o experiencia existente |
| 9 | A | Sé comunicar ideas complejas de forma visual e impactante |
| 10 | S | Sé liderar procesos de formación o desarrollo de personas |
| 11 | S | Podría gestionar situaciones de conflicto interpersonal |
| 12 | S | Sé construir relaciones de confianza en un equipo |
| 13 | E | Sé elaborar una estrategia y defenderla ante decisores |
| 14 | E | Podría gestionar un presupuesto y tomar decisiones de inversión |
| 15 | E | Sé motivar a un equipo cuando las cosas se ponen difíciles |
| 16 | C | Sé implementar y mejorar procedimientos operativos |
| 17 | C | Podría auditar un proceso y generar un informe de mejoras |
| 18 | C | Sé gestionar bases de datos, inventarios o sistemas documentales |

---

### FASE 3: Ocupaciones — Me atrae / No me atrae

**Instrucción:** "Sin pensar demasiado, ¿te atrae o no la idea de trabajar como...?"

#### GRUPO: Teen

| # | Dim | Ocupación |
|---|-----|-----------|
| 1 | R | Electricista o técnico de instalaciones |
| 2 | R | Mecánico o técnico de mantenimiento |
| 3 | R | Agricultor o jardinero profesional |
| 4 | I | Investigador científico |
| 5 | I | Programador o analista de datos |
| 6 | I | Médico o biólogo |
| 7 | A | Diseñador gráfico o de videojuegos |
| 8 | A | Músico, actor o director de cine |
| 9 | A | Escritor, periodista o creador de contenido |
| 10 | S | Profesor o educador |
| 11 | S | Enfermero o trabajador social |
| 12 | S | Psicólogo o terapeuta |
| 13 | E | Empresario o fundador de startups |
| 14 | E | Director de marketing o ventas |
| 15 | E | Abogado o político |
| 16 | C | Contable o auditor |
| 17 | C | Administrativo o secretario de dirección |
| 18 | C | Bibliotecario o archivista |

#### GRUPO: Young Adult

| # | Dim | Ocupación |
|---|-----|-----------|
| 1 | R | Técnico de redes, sistemas o ciberseguridad |
| 2 | R | Ingeniero de producción o logística |
| 3 | R | Técnico de sonido, iluminación o audiovisuales |
| 4 | I | Analista de datos o científico de datos |
| 5 | I | Investigador en tecnología o I+D |
| 6 | I | Consultor especializado o perito |
| 7 | A | Director creativo o diseñador UX/UI |
| 8 | A | Fotógrafo, cineasta o productor audiovisual |
| 9 | A | Redactor, copywriter o storyteller |
| 10 | S | Orientador laboral o coach |
| 11 | S | Educador social o mediador comunitario |
| 12 | S | Terapeuta ocupacional o de rehabilitación |
| 13 | E | CEO, fundador o director de operaciones |
| 14 | E | Business developer o key account manager |
| 15 | E | Project manager o scrum master |
| 16 | C | Controller financiero o analista contable |
| 17 | C | Especialista en compliance o calidad |
| 18 | C | Administrador de bases de datos o documentalista |

#### GRUPO: Adult

| # | Dim | Ocupación |
|---|-----|-----------|
| 1 | R | Director técnico o jefe de obra |
| 2 | R | Responsable de mantenimiento o producción |
| 3 | R | Técnico especialista o artesano |
| 4 | I | Director de I+D o responsable de innovación |
| 5 | I | Consultor estratégico basado en datos |
| 6 | I | Investigador sénior o docente universitario |
| 7 | A | Director de arte o diseño |
| 8 | A | Arquitecto, urbanista o diseñador de interiores |
| 9 | A | Editor, guionista o productor ejecutivo |
| 10 | S | Director de formación o desarrollo de personas |
| 11 | S | Mediador, trabajador social o terapeuta |
| 12 | S | Director de ONG o responsable de RSC |
| 13 | E | Director general o consejero delegado |
| 14 | E | Inversor, gestor de fondos o emprendedor serial |
| 15 | E | Director comercial o de desarrollo de negocio |
| 16 | C | Director financiero (CFO) o controller |
| 17 | C | Responsable de calidad o compliance officer |
| 18 | C | Director de administración o de operaciones |

---

### FASE 4: Comparaciones directas — Elección forzada

**Instrucción:** "Elige la opción que más se acerque a ti. Si ambas te atraen, elige la que sientas con más fuerza."

**Formato:** `[Opción A] — [Ambas por igual] — [Opción B]`

**IMPORTANTE:** Los 6 pares son **idénticos para los 3 grupos de edad**. Lo que cambia es la redacción.

#### Pares seleccionados y justificación

| Par | Tipo | Justificación |
|-----|------|--------------|
| R ↔ S | Opuestos | Máxima discriminación teórica |
| I ↔ E | Opuestos | Máxima discriminación teórica |
| A ↔ C | Opuestos | Máxima discriminación teórica |
| R ↔ I | Adyacentes | Par más confuso en adolescentes (Martins, 2025) |
| S ↔ E | Adyacentes | "Ayudar" vs "Liderar" — confusión frecuente |
| A ↔ I | Adyacentes | "Crear" vs "Descubrir" — confusión frecuente |

#### GRUPO: Teen

| # | Dim A | Dim B | Pregunta |
|---|-------|-------|----------|
| 1 | R | S | ¿Prefieres arreglar cosas rotas o ayudar a personas que lo pasan mal? |
| 2 | I | E | ¿Te atrae más investigar un tema a fondo o montar un proyecto y liderar a otros? |
| 3 | A | C | ¿Prefieres hacer las cosas a tu manera o seguir un plan paso a paso? |
| 4 | R | I | ¿Disfrutas más construyendo algo con tus manos o pensando cómo funciona algo? |
| 5 | S | E | ¿Prefieres escuchar y apoyar a un amigo o convencer a un grupo de tu idea? |
| 6 | A | I | ¿Te atrae más inventar algo original o descubrir cómo funciona algo que ya existe? |

#### GRUPO: Young Adult

| # | Dim A | Dim B | Pregunta |
|---|-------|-------|----------|
| 1 | R | S | ¿Te ves más resolviendo problemas técnicos o acompañando personas en sus procesos? |
| 2 | I | E | ¿Prefieres analizar datos para entender algo o tomar decisiones para mover un proyecto? |
| 3 | A | C | ¿Te motiva más diseñar algo creativo o estructurar un proceso eficiente? |
| 4 | R | I | ¿Disfrutas más implementando una solución o diseñando el análisis previo? |
| 5 | S | E | ¿Te ves más mentorizando a alguien o coordinando un equipo hacia un objetivo? |
| 6 | A | I | ¿Te atrae más crear una propuesta original o profundizar en la investigación de un tema? |

#### GRUPO: Adult

| # | Dim A | Dim B | Pregunta |
|---|-------|-------|----------|
| 1 | R | S | ¿Te realizas más resolviendo retos operativos o generando impacto en la vida de otros? |
| 2 | I | E | ¿Prefieres diagnosticar y comprender o decidir y ejecutar? |
| 3 | A | C | ¿Te aporta más la libertad creativa o la precisión y el control? |
| 4 | R | I | ¿Disfrutas más llevando la ejecución práctica o diseñando la estrategia analítica? |
| 5 | S | E | ¿Te identificas más con desarrollar personas o con impulsar resultados de negocio? |
| 6 | A | I | ¿Te atrae más innovar desde la creatividad o desde el conocimiento profundo? |

---

## 5. Sistema de puntuación recomendado

### Fase 1 (Likert): 5 ítems × (1-5 puntos) = **5 a 25 puntos** por dimensión
### Fase 2 (Competencias): 3 ítems × (0 o 1) = **0 a 3 puntos** por dimensión
### Fase 3 (Ocupaciones): 3 ítems × (0 o 1) = **0 a 3 puntos** por dimensión
### Fase 4 (Comparativas): +1 punto a la dimensión elegida, +0.5 a cada una si "ambas por igual"

### Ponderación sugerida

| Fase | Peso | Justificación |
|------|------|--------------|
| Actividades (Likert) | ×2 | Base principal, más ítems, más varianza |
| Competencias | ×1.5 | Complementa con autopercepción de capacidad |
| Ocupaciones | ×1.5 | Alta resistencia a sesgo de deseabilidad |
| Comparativas | ×1 | Función de desempate, no de base |

### Puntuación total por dimensión

```
Score(D) = (Σ Likert_D × 2) + (Σ Competencias_D × 1.5) + (Σ Ocupaciones_D × 1.5) + Comparativas_D
```

**Rango teórico por dimensión:** 5 a 59.5 puntos

Las 3 dimensiones con mayor puntuación forman el **código de 3 letras** del usuario.

---

## 6. Consideraciones por grupo de edad

| Aspecto | Teen | Young Adult | Adult |
|---------|------|-------------|-------|
| Vocabulario | Cotidiano, concreto | Técnico accesible | Profesional |
| Ocupaciones | Conocidas y actuales | Emergentes y digitales | Posiciones de responsabilidad |
| Referencia temporal | Instituto, hobbies | Estudios, primeros trabajos | Carrera, reorientación |
| Riesgo principal | Baja diferenciación de perfiles | Sesgo "aspiracional" | Inercia del perfil actual |
| Recomendación | Ítems más conductuales y concretos | Mezclar aspiración y realidad | Incluir perspectiva de satisfacción |

---

## 7. Checklist de implementación para el seeder

- [ ] Cambiar `phase: 'likert'` a `phase: 'activities'` (más fiel al SDS)
- [ ] Cambiar `phase: 'checklist'` a `phase: 'competencies'`
- [ ] Añadir `phase: 'occupations'` (nueva)
- [ ] Mantener `phase: 'comparative'`
- [ ] En `competencies`: `options_json` → null (es Sí/No simple)
- [ ] En `occupations`: `options_json` → null (es Me atrae / No me atrae)
- [ ] Las comparativas de las 3 age groups deben cubrir los **mismos 6 pares** (R↔S, I↔E, A↔C, R↔I, S↔E, A↔I)
- [ ] Implementar peso/weight diferente por fase (2, 1.5, 1.5, 1)
- [ ] Subir de 18 a 30 ítems en Likert (5 por dimensión)
- [ ] Añadir 18 ítems de Competencias (3 por dimensión)
- [ ] Añadir 18 ítems de Ocupaciones (3 por dimensión)

---

## 8. Referencias bibliográficas

1. Holland, J.L. (1959). A theory of vocational choice. *Psychological Bulletin*, 56, 121-139.
2. Holland, J.L. (1997). *Making vocational choices: A theory of vocational personalities and work environments* (3rd ed.). Odessa, FL: PAR.
3. Holland, J.L. (1994). *Self-Directed Search Form R* (4th ed.). Odessa, FL: PAR.
4. Ambiel, R.A.M. et al. (2018). 18REST: A short RIASEC-interest measure for large-scale educational and vocational assessment. *Psicologia: Reflexão e Crítica*, 31(1), 6.
5. Martins, G.H. et al. (2025). 18REST-2: A Revised Measure of the RIASEC Model for Large-Scale Assessment With Students. *Journal of Career Assessment*. N=63,128.
6. Nauta, M.M. (2010). The Development, Evolution, and Status of Holland's Theory of Vocational Personalities. *Journal of Counseling Psychology*, 57(1), 11-22.
7. Aljojo, N. & Saifuddin, H. (2017). A Study of the Reliability and Validity of Holland's RIASEC of Vocational Personalities in Arabic. *American Journal of Information Science*, 5(1), 44-51.
8. Wille, B. et al. (2015). A Closer Look at the Psychological Diversity Within Holland Interest Types. *Consulting Psychology Journal*, 67(3), 234-257.
9. Larson, L.M., Rottinghaus, P.J. & Borgen, F.H. (2002). Meta-analyses of Big Six interests and Big Five personality factors. *Journal of Vocational Behavior*, 61, 217-239.
