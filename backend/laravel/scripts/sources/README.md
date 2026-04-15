# Organización de scrapers y jobs de fuentes

Cada carpeta agrupa scripts Python por dominio:

- `universities/`
- `non_university_centers/`
- `occupations_cno/`
- `qualifications_cncp/`
- `professional_certificates/`
- `fp_programs/`
- `shared/`

## Convención recomendada

### Nombres de script

```text
<source>_<entity>_<verb>.py
```

Ejemplos:

- `ruct_universities_export.py`
- `cno_occupations_fetch.py`
- `incual_qualifications_normalize.py`
- `sepe_certificates_refresh.py`

## Flujo recomendado

1. descargar/scrapear a `database/data/catalog/<dominio>/raw/`
2. normalizar a `.../normalized/`
3. enriquecer a `.../enriched/`
4. publicar snapshot a `.../published/`

## Nota

Los scripts legacy actuales en `backend/laravel/scripts/` se mantienen por compatibilidad.
Los nuevos ya deberían crearse dentro de `backend/laravel/scripts/sources/`.
