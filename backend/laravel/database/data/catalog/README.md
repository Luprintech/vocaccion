# Organización de datasets del catálogo

## Regla general

- `raw/` → descarga/scraping original
- `normalized/` → estructura homogénea lista para transformar/seedear
- `enriched/` → cruces, aliases, geocoding, enriquecimiento
- `published/` → snapshots finales consumibles por seeders o API

## Dominios

- `universities/` → RUCT, SIIU, títulos universitarios, centros universitarios
- `non_university_centers/` → IES, CIFP, centros acreditados, redes autonómicas
- `occupations_cno/` → ocupaciones CNO-11 y taxonomías relacionadas
- `qualifications_cncp/` → INCUAL / CNCP / unidades de competencia
- `professional_certificates/` → SEPE / certificados profesionales
- `fp_programs/` → títulos de FP, cursos de especialización, catálogos de oferta
- `taxonomies/` → catálogos auxiliares (CCAA, provincias, familias, sectores)
- `shared/` → manifests, snapshots comunes y lookups reutilizables

## Importante

Los ficheros legacy que ya usa el código actual siguen en `database/data/` raíz por compatibilidad.
Todo lo nuevo debería entrar ya bajo `database/data/catalog/`.
