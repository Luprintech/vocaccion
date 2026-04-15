# VocAcción - Data Catalog Structure

> **Last Updated:** 2026-04-13  
> **Purpose:** Centralized data repository for vocational guidance, educational paths, and career mapping

---

## 📁 Directory Structure

```
database/data/
├── backups/                    # Database backups (auto-generated)
│   ├── official_universities_backup.json
│   └── official_centers_backup.json  (⚡ with geocoded coordinates)
│
├── catalog/                    # Main data catalog
│   ├── esco/                   # European Skills/Competences/Qualifications/Occupations
│   │   ├── source/             # Original ESCO CSV dataset (v1.2.1)
│   │   └── raw/                # Converted JSON files
│   │       ├── esco_occupations.json           (3,039 occupations)
│   │       ├── esco_skills.json                (13,960 skills/competences)
│   │       ├── esco_occupation_skill_relations.json  (126,051 relations)
│   │       ├── esco_skill_skill_relations.json
│   │       ├── esco_isco_groups.json           (ISCO-08 groups)
│   │       ├── esco_skill_groups.json
│   │       ├── esco_digital_skills.json
│   │       ├── esco_green_skills.json
│   │       ├── esco_transversal_skills.json
│   │       └── esco_language_skills.json
│   │
│   ├── universities/           # Higher education institutions (RUCT)
│   │   └── raw/
│   │       ├── ruct_universities.json          (108 universities)
│   │       ├── ruct_university_details.json
│   │       ├── ruct_centers.json               (1,384 centers)
│   │       ├── ruct_degrees.json               (13,133 degree programs)
│   │       ├── ruct_degree_center_links.json   (16,642 relations)
│   │       └── ruct_siiu_source_inventory.json
│   │
│   ├── professional_certificates/  # Certificados de profesionalidad (SEPE)
│   │   └── raw/
│   │       ├── sepe_certificates.json          (7,639 certificates)
│   │       └── sepe_training_entities.json
│   │
│   ├── courses/                # Training courses
│   │   └── raw/
│   │       ├── sepe_courses_national.json      (147 courses - SEPE España)
│   │       └── sae_courses_andalucia.json      (272 courses - Junta Andalucía)
│   │
│   ├── public_competitions/    # Civil service exams (Oposiciones BOE)
│   │   └── raw/
│   │       └── boe_public_competitions.json    (17 competitions)
│   │
│   ├── qualifications_cncp/    # CNO-11 Occupations
│   │   └── normalized/
│   │       └── cno11_ocupaciones.json
│   │
│   ├── non_university_centers/ # Centros educativos no universitarios (Ministerio Educación)
│   │   └── raw/
│   │       ├── por_comunidad/  # JSON por CCAA (19 archivos)
│   │       └── xls/            # Fuentes XLS del Ministerio (19 archivos)
│   │
│   └── notas_de_corte/         # Notas de corte universitarias (QEDU)
│       ├── raw/
│       │   ├── notas_de_corte_grado_<fecha>.json   (3,962 grados 2025-2026)
│       │   └── notas_de_corte_grado_latest.json
│       ├── enriched/           # (pendiente: plazas, nota media, inserción laboral)
│       └── normalized/         # (pendiente: tabla lista para seeder)
│
└── siiu_raw/                   # SIIU statistics (reference only)
    └── Titulaciones_Grado_Rama_Univ_2024.csv
```

---

## 📊 Data Sources

### 1. **ESCO (European Skills Framework)**
- **Source:** ESCO v1.2.1 (European Commission)
- **Language:** Spanish (es)
- **Status:** ✅ Converted to JSON (152,494 total records)
- **Use Case:** Skill mapping, competency profiles, job-skill matching
- **Key Files:**
  - `esco_occupations.json` → 3,039 European occupations
  - `esco_skills.json` → 13,960 skills/competences
  - `esco_occupation_skill_relations.json` → Which skills are required for each occupation

### 2. **RUCT (Registro de Universidades, Centros y Títulos)**
- **Source:** Ministry of Universities (Spain)
- **Status:** ✅ Scraped and geocoded
- **Use Case:** University finder, degree programs, academic paths
- **Key Data:**
  - 108 universities (public/private)
  - 1,384 centers/campuses (with GPS coordinates)
  - 13,133 official degree programs

### 3. **SEPE (Servicio Público de Empleo Estatal)**
- **Source:** SEPE Open Data
- **Status:** ✅ Imported
- **Use Case:** Professional certifications, vocational training
- **Key Data:**
  - 7,639 professional certificates
  - 147 national training courses
  - Training entity directory

### 4. **SAE (Servicio Andaluz de Empleo)**
- **Source:** Junta de Andalucía
- **Status:** ✅ Imported
- **Use Case:** Regional training programs (Andalusia)
- **Key Data:**
  - 272 courses specific to Andalusia

### 5. **BOE Oposiciones (Public Competitions)**
- **Source:** Boletín Oficial del Estado
- **Status:** ✅ Imported (sample dataset)
- **Use Case:** Civil service exam information
- **Key Data:**
  - 17 public competitions/exams

### 6. **CNO-11 (Clasificación Nacional de Ocupaciones)**
- **Source:** INE (Instituto Nacional de Estadística)
- **Status:** ✅ Normalized
- **Use Case:** Spanish occupation classification, job mapping

### 7. **Ministerio de Educación — Centros no universitarios**
- **Source:** Buscador de centros del Ministerio de Educación
- **Status:** ✅ Scraped (19 CCAA)
- **Scripts:** `scripts/sources/non_university_centers/`
- **Use Case:** Mapa de centros de FP, Bachillerato, ESO, etc.
- **Key Data:**
  - JSONs por CCAA + XLS fuente

### 8. **QEDU — Notas de corte universitarias**
- **Source:** QEDU, Ministerio de Ciencia, Innovación y Universidades
- **URL:** https://www.ciencia.gob.es/qedu.html
- **Status:** ✅ Scrapeado (2025-2026)
- **Script:** `scripts/sources/notas_de_corte/scrape_qedu.py`
- **Use Case:** Mostrar nota de corte en búsqueda de estudios e itinerario académico
- **Key Data:**
  - 3,962 grados universitarios (2,487 con nota de corte)
  - 94 universidades, 19 CCAA
  - Campos: titulación, universidad, centro, CCAA, provincia, nota_corte, nivel, modalidad

---

## 🔄 Data Flow & Integration

```
ESCO Occupations ────┐
                     ├──> career_catalog (69 curated professions with RIASEC)
CNO-11 Occupations ──┘

ESCO Skills ────────────> Competency profiles for career matching

RUCT Degrees ───────────> Academic itineraries (Plan PRO feature)
                             + nota_corte from QEDU

SEPE Certificates ──────> Recommended certifications by career

Training Courses ────────> Learning paths
```

---

## 🎯 Usage in VocAcción

### Current Implementation:
- ✅ **career_catalog** table (69 professions with RIASEC vectors)
- ✅ **official_universities** + **official_centers** (RUCT data)
- ✅ **professional_certificates** table (SEPE data)
- ✅ **training_courses** table (SEPE + SAE)
- ✅ **public_competitions** table (BOE)

### Planned Integration:
- 🔲 **ESCO → career_catalog mapping** (enrich professions with ESCO skills)
- 🔲 **ESCO skills → vocational_profiles** (skill-based recommendations)
- 🔲 **RUCT degrees → itinerario generation** (academic path suggestions)
- 🔲 **CNO-11 → career_catalog normalization** (standardize occupation codes)
- 🔲 **QEDU notas_de_corte → StudySearchPage** (nota de corte en búsqueda de estudios)
- 🔲 **QEDU notas_de_corte → ItinerarioAcademico** (nota de corte en grados sugeridos)

---

## 📝 Notes

### Geocoding
- University centers are geocoded using **Nominatim API** (OpenStreetMap)
- Backup includes pre-geocoded coordinates to avoid re-fetching
- Geocoding command: `php artisan vocacional:geocode-centers`

### Data Updates
- ESCO: Updated annually by European Commission
- RUCT: Updated continuously (scrape regularly)
- SEPE/SAE: Updated monthly/quarterly
- BOE: Updated weekly (new competitions published)

### File Formats
- **JSON**: Primary format for structured data
- **CSV**: Source format (converted to JSON for processing)
- Timestamps in JSON use MySQL format: `Y-m-d H:i:s`

---

## 🔧 Maintenance Commands

```bash
# Convert ESCO CSV to JSON
php scripts/convert_esco_to_json.php

# Export geocoded centers (backup)
php artisan data:export-centers

# Seed all catalogs
php artisan db:seed --class=OfficialUniversitySeeder
php artisan db:seed --class=OfficialCenterSeeder
php artisan db:seed --class=ProfessionalCertificateSeeder
php artisan db:seed --class=TrainingCourseSeeder
php artisan db:seed --class=PublicCompetitionSeeder

# Scrape notas de corte QEDU
python scripts/sources/notas_de_corte/scrape_qedu.py --nivel GRADO
```

---

**For questions or data updates, contact:** admin@vocaccion.es
