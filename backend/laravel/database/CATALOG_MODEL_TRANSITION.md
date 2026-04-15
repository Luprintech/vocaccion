# Convivencia entre modelo actual y modelo unificado

## Objetivo

Poder seguir usando el sistema actual mientras se incorporan nuevas fuentes de datos.

## Tablas actuales que siguen vivas

- `career_catalog`
- `cno_occupations`
- `professional_qualifications`
- `official_universities`
- `official_centers`
- `official_degrees`
- `official_degree_center`

## Tablas nuevas base

- `catalog_institutions`
- `catalog_centers`
- `catalog_programs`
- `catalog_occupations`
- `catalog_occupation_qualification`
- `catalog_program_qualification`
- `catalog_occupation_program`
- `catalog_center_program`

## Estrategia

### Fase 1 — coexistencia

- no se toca el flujo productivo actual
- las nuevas tablas se crean vacías
- sirven para empezar a cargar fuentes nuevas sin romper nada

### Fase 2 — puentes

Las tablas nuevas incluyen referencias opcionales a tablas actuales:

- `catalog_institutions.official_university_id`
- `catalog_centers.official_center_id`
- `catalog_programs.official_degree_id`
- `catalog_occupations.cno_occupation_id`
- `catalog_occupations.career_catalog_id`

### Fase 3 — unificación real

Cuando haya suficientes fuentes integradas:

- ocupar `catalog_occupations` como catálogo principal
- usar `catalog_programs` como catálogo unificado de estudios
- usar `catalog_centers` como base de mapa y filtros
- dejar `career_catalog` como subconjunto curado para orientación vocacional

## Regla práctica

Todo dataset nuevo debería cargarse primero en el modelo `catalog_*`, y solo después decidir si necesita sincronización con tablas legacy.
