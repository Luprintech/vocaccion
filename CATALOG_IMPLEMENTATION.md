# Sistema de Catálogo de Profesiones — Implementación

> Fecha: 10 de marzo de 2026

## Problema Original

El sistema anterior delegaba **100% de la generación de profesiones** a Gemini (LLM), lo que causaba:

- **Sesgo tecnológico**: ~60-70% de recomendaciones eran del sector IT
- **Dependencia circular**: Prompt 3 generaba profesiones en markdown → Prompt 4 las re-extraía del mismo markdown
- **Falta de diversidad**: sin restricciones sectoriales, formativas ni salariales
- **Alucinaciones**: códigos CNO/ESCO inventados, rutas formativas inexistentes

## Arquitectura Nueva

```
┌──────────────────────────────────────────────────────────────────┐
│                    FLUJO ANTERIOR (eliminado)                    │
│  Scores RIASEC → Gemini inventa 3 profesiones → Gemini re-extrae│
│  JSON del markdown → Frontend parsea 3 careers                  │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                      FLUJO NUEVO                                 │
│                                                                  │
│  Scores RIASEC                                                   │
│       │                                                          │
│       ▼                                                          │
│  CareerMatchingService                                           │
│  (coseno + reglas de diversidad)                                 │
│       │                                                          │
│       ▼                                                          │
│  6 profesiones del catálogo (career_catalog)                     │
│       │                                                          │
│       ▼                                                          │
│  Gemini genera SOLO narrativa personalizada                      │
│  (no inventa profesiones, usa las pre-seleccionadas)             │
│       │                                                          │
│       ▼                                                          │
│  Frontend muestra 6 career cards                                 │
└──────────────────────────────────────────────────────────────────┘
```

## Archivos Creados

### 1. Migración: `career_catalog`

**Archivo:** `database/migrations/2026_03_10_000001_create_career_catalog_table.php`

Tabla con las siguientes columnas:

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `titulo` | string | Nombre oficial de la profesión |
| `codigo_cno` | string | Código CNO-11 (España) |
| `codigo_esco` | string | Código ESCO (Europa) |
| `sector` | string | Sector profesional (16 posibles) |
| `riasec_r` a `riasec_c` | decimal(3,2) | Vector RIASEC normalizado (suma ≈ 1.0) |
| `nivel_formacion` | string | FP Medio / FP Superior / Grado / Máster |
| `nivel_salarial` | string | Bajo / Medio-bajo / Medio / Medio-alto / Alto |
| `tipo_profesion` | string | tradicional / emergente / en_crecimiento |
| `descripcion_corta` | text | Descripción breve de la profesión |
| `salidas_profesionales` | JSON | Array de roles/salidas concretas |
| `ruta_formativa` | text | Camino formativo recomendado |
| `habilidades_clave` | JSON | Array de competencias necesarias |
| `activo` | boolean | Permite desactivar sin borrar |

### 2. Modelo Eloquent

**Archivo:** `app/Models/CareerCatalog.php`

- Casts JSON para `salidas_profesionales` y `habilidades_clave`
- Método `getRiasecVector()` → devuelve `['R' => float, ..., 'C' => float]`
- Scopes: `activo()`, `sector($name)`

### 3. Seeder: 69 profesiones reales

**Archivo:** `database/seeders/CareerCatalogSeeder.php`

Profesiones distribuidas en **16 sectores** con vectores RIASEC calibrados desde O\*NET:

| Sector | Cantidad | Ejemplos |
|--------|----------|----------|
| Tecnología e Informática | 4 | Ingeniero de Software, Analista de Datos, Ciberseguridad, Diseñador UX |
| Ciencia e Investigación | 5 | Biotecnólogo, Físico, Químico, Matemático, Veterinario |
| Salud y Bienestar | 7 | Medicina, Enfermería, Psicología, Fisioterapia, Farmacia, Nutrición, Terapia Ocupacional |
| Educación y Formación | 4 | Maestro, Profesor Secundaria, Pedagogo, Educador Social |
| Arte, Diseño y Creatividad | 5 | Diseñador Gráfico, Ilustrador, Realizador Audiovisual, Músico, Restaurador |
| Comunicación y Medios | 4 | Periodista, Community Manager, Traductor, Relaciones Públicas |
| Negocios, Finanzas y Derecho | 5 | Abogado, Economista, Auditor, Asesor Fiscal, Criminólogo |
| Marketing y Ventas | 3 | Director de Marketing, Investigador de Mercados, Key Account Manager |
| Industria y Manufactura | 4 | Ingeniero Industrial, Mecánico, Técnico Electrónica, Operador CNC |
| Construcción, Arquitectura e Ingeniería | 4 | Arquitecto, Ingeniero Civil, Topógrafo, Instalador Energías Renovables |
| Servicios Sociales y Comunitarios | 5 | Trabajador Social, Mediador, Integrador Social, Cooperante, Gestor Cultural |
| Administración Pública y Gestión | 2 | Gestor Administrativo, Inspector de Hacienda |
| Turismo y Hostelería | 4 | Director de Hotel, Chef, Guía Turístico, Organizador de Eventos |
| Deporte y Actividad Física | 3 | Entrenador Personal, Fisioterapeuta Deportivo, Gestor Deportivo |
| Logística y Transporte | 3 | Ingeniero Logístico, Técnico Comercio Internacional, Piloto Drones |
| Agricultura, Medio Ambiente y Sostenibilidad | 5 | Ingeniero Agrónomo, Ingeniero Forestal, Técnico Ambiental, Enólogo, Oceanógrafo |

Cada profesión incluye:
- Códigos CNO-11 y ESCO reales
- Vector RIASEC de 6 dimensiones (calibrado, suma ≈ 1.0)
- Nivel formativo, salarial y tipo (tradicional/emergente/en_crecimiento)
- Salidas profesionales concretas y ruta formativa

### 4. CareerMatchingService

**Archivo:** `app/Services/CareerMatchingService.php`

#### Algoritmo de Matching

1. **Normalización**: Convierte scores RIASEC (0-100) a vector unitario
2. **Similitud coseno**: Calcula distancia angular entre vector del usuario y cada profesión del catálogo
3. **Ranking**: Ordena por score descendente

#### Reglas de Diversidad

| Regla | Restricción |
|-------|-------------|
| R1 | Exactamente **6** profesiones |
| R2 | Máximo **1** de Tecnología e Informática |
| R3 | Mínimo **4** sectores distintos |
| R4 | Al menos **1** profesión con FP (Medio o Superior) |
| R5 | Al menos **1** con Grado Universitario |
| R6 | Al menos **1** con nivel salarial Bajo o Medio-bajo |
| R7 | Al menos **1** profesión emergente o en_crecimiento |
| R8 | Máximo **2** del mismo sector |

#### Fases de Selección

- **Fase 1**: Greedy fill con restricciones básicas (R2, R8)
- **Fase 2**: Sustitución para cumplir R4-R7 (reemplaza último elemento por candidato que cumpla regla faltante)
- **Fase 3**: Diversificación sectorial forzada si < 4 sectores

#### Output

```php
[
    [
        'id'                    => 42,
        'titulo'                => 'Arquitecto/a',
        'sector'                => 'Construcción, Arquitectura e Ingeniería',
        'compatibilidad_riasec' => '87%',
        'match_porcentaje'      => 87,
        'nivel_salarial'        => 'Medio-alto',
        'nivel_formacion'       => 'Grado Universitario + Máster habilitante',
        'tipo_profesion'        => 'tradicional',
        'descripcion'           => 'Diseña espacios habitables...',
        'salidas'               => 'Estudio de arquitectura, Urbanismo, ...',
        'ruta_formativa'        => 'Grado en Arquitectura (5 años) + ...',
        'habilidades_clave'     => ['Dibujo técnico', 'Visión espacial', ...],
        'codigo_cno'            => '2451',
    ],
    // ... 5 más
]
```

## Archivos Modificados

### 5. GeminiService.php — Prompt del Informe

**Archivo:** `app/Services/GeminiService.php`

**Cambios:**

- `generateReport()` ahora acepta segundo parámetro: `array $matchedCareers = []`
- **Sección 4 del system instruction** reescrita:

```
## 4. Tus Caminos Profesionales Recomendados
IMPORTANTE: Las profesiones ya han sido pre-seleccionadas por el algoritmo
de matching RIASEC. Se te proporcionarán en el prompt del usuario bajo
"PROFESIONES PRE-SELECCIONADAS". Tu labor es ÚNICAMENTE generar la
narrativa personalizada para cada una.
```

- Las profesiones se inyectan en el **user prompt** como:

```
PROFESIONES PRE-SELECCIONADAS POR EL ALGORITMO DE MATCHING:
1. Arquitecto/a (Sector: Construcción, Match: 87%)
   Salidas: Estudio, Urbanismo, ...
   Formación: Grado en Arquitectura + Máster
2. ...
```

- `generateCareerRecommendations()` marcado como **deprecado** (solo se usa en flujo legacy)

### 6. TestController.php — Flujo de Análisis

**Archivo:** `app/Http/Controllers/TestController.php`

**Cambios en `analizarResultados()`:**

```
ANTES:
  1. analyzeBatch() → actualizar scores
  2. generateReport($profileData)
  3. generateCareerRecommendations($profileData, $reportMarkdown)  ← circular
  4. Pexels images
  5. Guardar

AHORA:
  1. analyzeBatch() → actualizar scores
  2. careerMatcher->match($profileData)  ← 6 profesiones del catálogo
  3. generateReport($profileData, $profesiones)  ← narrativa sobre carreras reales
  4. Pexels images
  5. Guardar
```

- `CareerMatchingService` inyectado en el constructor
- Eliminado el fallback hardcodeado de 3 profesiones genéricas
- Eliminada la llamada a `generateCareerRecommendations()` en el flujo moderno

### 7. InformeVocacional.jsx — Frontend

**Archivo:** `frontend/src/pages/test/InformeVocacional.jsx`

**Cambios:**

- Parser de carreras: `.slice(0, 3)` → `.slice(0, 6)` (soporta 6 profesiones)
- Matcher de sección: añadido `'recomendados'` para el nuevo título del header
- Título de sección actualizado: "Tus Caminos Profesionales Recomendados"
- Descripción actualizada: referencia al catálogo CNO/ESCO

## Ejecución

```bash
# Migración
php artisan migrate --path=database/migrations/2026_03_10_000001_create_career_catalog_table.php

# Seeder (idempotente, usa updateOrCreate)
php artisan db:seed --class=CareerCatalogSeeder
```

## Ventajas del Nuevo Sistema

| Aspecto | Antes | Ahora |
|---------|-------|-------|
| Fuente de profesiones | Gemini las inventa | Catálogo curado (69 reales) |
| Diversidad sectorial | Sin control | Mín. 4 sectores, máx. 1 tech |
| Diversidad formativa | Sin control | Al menos 1 FP + 1 Grado |
| Diversidad salarial | Sin control | Al menos 1 nivel bajo/medio-bajo |
| Profesiones emergentes | Aleatorio | Al menos 1 garantizada |
| Códigos CNO/ESCO | Inventados por LLM | Reales, verificados |
| Cantidad | 3 | 6 |
| Rol de Gemini | Inventar + narrar | Solo narrar (controlado) |
| Consistencia | Variable (alucinaciones) | Determinista (coseno + reglas) |
