# Arquitectura de catálogo profesional y educativo

## Objetivo

Unificar en una sola base de datos:

- ocupaciones/profesiones oficiales
- cualificaciones profesionales
- programas formativos
- centros educativos
- relaciones entre ocupación ⇄ cualificación ⇄ formación ⇄ centro

La idea es que esta estructura sirva para:

1. VocAcción
2. futuras búsquedas y enriquecimiento periódico
3. una API pública general cuando estén integradas todas las fuentes
4. un futuro mapa interactivo con filtros

---

## Principios de modelado

### 1. Separar qué es cada cosa

- **occupation** = trabajo / profesión / ocupación real
- **qualification** = cualificación o acreditación oficial
- **program** = formación concreta que se cursa
- **center** = entidad o centro que imparte
- **institution** = universidad, consejería, red de centros, organismo, etc.

### 2. Mantener la fuente oficial

Cada entidad importante debería poder rastrear:

- fuente (`source_system`)
- identificador oficial externo
- URL fuente
- `raw_payload`
- `last_seen_at`
- `source_updated_at` si se conoce

### 3. Pipeline por capas

- **raw**: descarga/scraping sin tocar
- **normalized**: mismo esquema entre fuentes
- **enriched**: cruces, aliases, geocoding, taxonomías
- **published**: datasets listos para seed/API

---

## Modelo recomendado

## Núcleo laboral

### `occupations`
Catálogo principal de ocupaciones/profesiones.

Campos sugeridos:

- `id`
- `slug`
- `preferred_label`
- `description`
- `occupation_type` (`occupation`, `profession`, `specialization`)
- `source_system` (`CNO`, `ESCO`, `VOCACCION`, etc.)
- `source_code`
- `parent_id`
- `employment_outlook`
- `salary_band`
- `active`
- `raw_payload`
- `last_seen_at`

### `occupation_aliases`

- `occupation_id`
- `alias`
- `alias_type` (`synonym`, `legacy`, `seo`, `colloquial`)

### `occupation_taxonomies`
Para no atar ocupaciones a una sola taxonomía.

- `occupation_id`
- `taxonomy` (`CNO`, `ESCO`, `ISCO`, etc.)
- `code`
- `label`
- `is_primary`

### `occupation_skills`

- `occupation_id`
- `skill_id`
- `importance`
- `source_system`

### `skills`

- `id`
- `slug`
- `name`
- `skill_type` (`technical`, `transversal`, `digital`, `language`)
- `description`

---

## Núcleo de cualificaciones

### `professional_qualifications`
Ya existe; debe quedar como tabla oficial base CNCP/INCUAL.

Campos clave:

- `codigo_cncp`
- `denominacion`
- `familia_profesional`
- `nivel`
- `horas_formacion`
- `competencia_general`

### `qualification_units`
Unidades de competencia si luego las incorporas.

- `professional_qualification_id`
- `code`
- `label`
- `description`

### `occupation_qualifications`
Equivale al puente actual `career_qualifications`, pero pensado para el modelo final.

- `occupation_id`
- `professional_qualification_id`
- `relation_type` (`required`, `recommended`, `adjacent`)
- `relevance`
- `notes`

---

## Núcleo formativo

### `programs`
Tabla unificada de formaciones.

Campos sugeridos:

- `id`
- `slug`
- `name`
- `program_type` (`grado`, `master`, `doctorado`, `fp_basica`, `fp_medio`, `fp_superior`, `curso_especializacion`, `certificado_profesional`, `microcredencial`, `curso`)
- `official_code`
- `family_name`
- `education_level`
- `duration_hours`
- `duration_years`
- `modality` (`presencial`, `online`, `semipresencial`, `mixta`)
- `official`
- `source_system`
- `source_url`
- `raw_payload`
- `last_seen_at`

### `program_qualifications`

- `program_id`
- `professional_qualification_id`
- `relation_type` (`grants`, `covers`, `prepares_for`)

### `occupation_programs`

- `occupation_id`
- `program_id`
- `relation_type` (`entry_route`, `recommended_route`, `specialization_route`)
- `priority`

### `program_statistics`
Para SIIU, inserción laboral, notas de corte, etc.

- `program_id`
- `metric`
- `year`
- `value`
- `source_system`

---

## Núcleo institucional y geográfico

### `institutions`
Universidades, consejerías, organismos, redes de centros.

- `id`
- `name`
- `institution_type` (`university`, `education_department`, `training_network`, `private_group`)
- `source_system`
- `source_code`
- `website`
- `email`
- `phone`
- `active`

### `centers`
Modelo general de centros.

- `id`
- `institution_id`
- `name`
- `center_type` (`faculty`, `school`, `ies`, `cifp`, `private_center`, `accredited_center`)
- `ownership_type`
- `address`
- `postal_code`
- `municipality`
- `province`
- `autonomous_community`
- `lat`
- `lng`
- `website`
- `email`
- `phone`
- `active`
- `source_system`
- `source_code`
- `raw_payload`
- `last_seen_at`

### `center_programs`

- `center_id`
- `program_id`
- `academic_year`
- `shift`
- `modality`
- `vacancies`
- `price_range`
- `official_url`
- `active`

---

## Relación con el modelo actual

## Lo que ya existe y conviene conservar

- `official_universities`
- `official_centers`
- `official_degrees`
- `official_degree_center`
- `professional_qualifications`
- `cno_occupations`
- `career_qualifications`
- `career_catalog`

## Evolución recomendada

### Fase 1
Mantener tablas actuales y añadir estructura de carpetas/fuentes.

### Fase 2
Crear tablas generales nuevas:

- `occupations`
- `programs`
- `institutions`
- `centers`
- `occupation_programs`
- `program_qualifications`

### Fase 3
Migrar/absorber gradualmente:

- `career_catalog` → subconjunto curado de `occupations`
- `official_degrees` → subconjunto de `programs`
- `official_centers` → subconjunto de `centers`
- `official_universities` → subconjunto de `institutions`

---

## Estructura de carpetas propuesta

### `database/data/catalog/`
Datasets por dominio.

```text
database/data/catalog/
├── universities/
│   ├── raw/
│   ├── normalized/
│   ├── enriched/
│   └── published/
├── non_university_centers/
│   ├── raw/
│   ├── normalized/
│   ├── enriched/
│   └── published/
├── occupations_cno/
│   ├── raw/
│   ├── normalized/
│   ├── enriched/
│   └── published/
├── qualifications_cncp/
│   ├── raw/
│   ├── normalized/
│   ├── enriched/
│   └── published/
├── professional_certificates/
│   ├── raw/
│   ├── normalized/
│   ├── enriched/
│   └── published/
├── fp_programs/
│   ├── raw/
│   ├── normalized/
│   ├── enriched/
│   └── published/
├── taxonomies/
│   ├── raw/
│   ├── normalized/
│   └── published/
└── shared/
    ├── manifests/
    ├── snapshots/
    └── lookups/
```

### `scripts/sources/`
Scrapers y utilidades por dominio.

```text
scripts/sources/
├── universities/
├── non_university_centers/
├── occupations_cno/
├── qualifications_cncp/
├── professional_certificates/
├── fp_programs/
└── shared/
```

---

## Convención para nuevos ficheros

### JSON

```text
<dataset>__<source>__<scope>__YYYYMMDD.json
```

Ejemplos:

- `universities__ruct__spain__20260410.json`
- `occupations__cno11__spain__20260410.json`
- `certificates__sepe__andalucia__20260410.json`

### Scripts

```text
<source>_<entity>_<verb>.py
```

Ejemplos:

- `ruct_universities_export.py`
- `cno_occupations_fetch.py`
- `sepe_certificates_normalize.py`

---

## Reglas prácticas

1. **No mover aún los ficheros legacy** que ya usa el código actual.
2. Todo lo nuevo debe entrar ya en la estructura `catalog/` y `scripts/sources/`.
3. Cada nueva fuente debería tener:
   - script de extracción
   - manifest de fuente
   - raw JSON/CSV original
   - normalized JSON listo para seed
4. Si una fuente cambia, nunca sobrescribir sin snapshot previo.
5. Las búsquedas periódicas deberían operar sobre `raw` y regenerar `normalized/enriched`.

---

## Siguiente paso recomendado

Cuando empieces a meter nuevas fuentes, el siguiente cambio técnico lógico será crear migraciones para el modelo general:

- `institutions`
- `centers`
- `programs`
- `occupations`
- `occupation_programs`
- `program_qualifications`
- `occupation_qualifications`

Sin romper todavía las tablas actuales de RUCT y catálogo vocacional.
