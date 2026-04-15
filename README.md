# VocAcción - Plataforma de Orientación Vocacional

Plataforma web de orientación vocacional que utiliza inteligencia artificial para ayudar a estudiantes y adultos a descubrir su camino profesional.

## Sobre el Proyecto

VocAcción es una aplicación web desarrollada como Proyecto Final de Ciclo del CFGS en Desarrollo de Aplicaciones Web del IES Gran Capitán (Córdoba, España). La plataforma combina tecnologías modernas con inteligencia artificial para ofrecer una experiencia de orientación vocacional personalizada y accesible.

### Características Principales

- Test vocacional adaptativo con IA (Gemini 2.0 Flash)
- Generación de itinerarios académicos personalizados por comunidad autónoma
- Sistema de recomendaciones profesionales basado en intereses y habilidades
- Informes descargables en PDF
- Dashboard de métricas para orientadores
- Mapa interactivo de recursos educativos
- Centro de recursos con artículos y guías descargables

## Instalación y Configuración

### Prerrequisitos

- Node.js 18+
- PHP 8.2+
- Composer
- MySQL 8.0+
- XAMPP (recomendado para desarrollo)

### Configuración del Proyecto

#### 1. Clonar el repositorio

```bash
git clone https://github.com/iesgrancapitan-proyectos/202526daw-dam-septiembre-Vocacci-n.git
cd 202526daw-dam-septiembre-Vocacci-n
```

#### 2. Configurar Frontend

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

El frontend estará disponible en `http://localhost:5173`

#### 3. Configurar Backend

```bash
# Navegar al directorio Laravel
cd backend/laravel

# Instalar dependencias PHP
composer install

# Copiar archivo de configuración
cp .env.example .env
```

#### 4. Configurar Base de Datos

Crear la base de datos en MySQL:

```sql
CREATE DATABASE vocaccion;
```

Configurar el archivo `.env` del backend:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=vocaccion
DB_USERNAME=root
DB_PASSWORD=

GEMINI_API_KEY=tu_api_key_de_gemini

PEXELS_API_KEY=tu_api_key_de_pexels
```

Ejecutar migraciones:

```bash
php artisan migrate
```

Crear roles y usuarios de prueba:

```bash
php artisan migrate:refresh --seed
```

Usuarios de prueba creados:

- **Estudiante**: `estudiante@vocaccion.es` / `12345678`
- **Orientador**: `orientador@vocaccion.es` / `12345678`
- **Admin**: `admin@vocaccion.es` / `12345678`

#### 5. Cargar Catálogos de Datos

```bash
# Cargar catálogo de profesiones RIASEC (69 profesiones)
php artisan db:seed --class=CareerCatalogSeeder

# Cargar universidades y centros (RUCT)
php artisan db:seed --class=OfficialUniversitySeeder
php artisan db:seed --class=OfficialCenterSeeder

# Geocodificar centros (coordenadas GPS)
php artisan vocacional:geocode-centers

# Geocodificación FIABLE para el mapa público (usa dirección exacta)
# Recomendado para universidades/centros si quieres marcadores precisos
php artisan vocacional:geocode-reliable --force

# Exportar backup con coordenadas
php artisan data:export-centers

# Cargar certificados profesionales, cursos y oposiciones
php artisan db:seed --class=ProfessionalCertificateSeeder
php artisan db:seed --class=TrainingCourseSeeder
php artisan db:seed --class=PublicCompetitionSeeder

# Importar centros no universitarios (IES, FP, Arte, Idiomas, etc.) — ~14.000 centros
php artisan catalog:import-non-university

# Geocodificar centros importados (Nominatim, ~1 h, deja corriendo en background)
php artisan catalog:geocode-centers

# Importar detalle QEDU por titulación/centro (nota, inserción, salario, créditos, etc.)
php artisan catalog:import-qedu-detalle --nivel=ALL --force

# Cargar dataset ESCO (European Skills Framework)
php artisan db:seed --class=EscoOccupationSeeder       # 3,039 ocupaciones
php artisan db:seed --class=EscoSkillSeeder            # 13,960 habilidades

# ⚠️  OPCIONAL (dataset muy grande, ~10 minutos)
php artisan db:seed --class=EscoOccupationSkillRelationSeeder  # 126K+ relaciones
```

> **Nota ESCO**: Las relaciones occupation-skill son opcionales. Solo necesarias si vas a usar matching avanzado de habilidades por profesión.

#### 6. Iniciar Backend

```bash
php artisan serve
```

El backend estará disponible en `http://localhost:8000`

---

## 🧪 Testing y Desarrollo

### Test Vocacional Automático

#### Opción 1: Test Completo con Resultados (Recomendado)

```bash
cd backend/laravel
php artisan vocacional:quick-test
```

Ejecuta **test vocacional completo** con análisis de resultados:
- ✅ 15 preguntas simuladas automáticamente
- ✅ Análisis RIASEC con Gemini AI
- ✅ Matching de profesiones (Top 3)
- ✅ Muestra scores finales y estadísticas
- ✅ Usuario temporal (se borra al finalizar)

**Opciones**:
- `--email=correo@ejemplo.com` → Usar usuario existente (ej: `estudiante@vocaccion.es`)
- `--keep-user` → Mantener usuario de prueba para revisión en frontend
- `--fresh` → Borrar sesiones previas del usuario antes de ejecutar

**Ejemplo con usuario existente:**
```bash
php artisan vocacional:quick-test --email=estudiante@vocaccion.es --fresh
```

**Usuarios de prueba habituales:**
```bash
php artisan vocacional:quick-test --email=estudiante@vocaccion.es --fresh
php artisan vocacional:quick-test --email=orientador@vocaccion.es --fresh
php artisan vocacional:quick-test --email=admin@vocaccion.es --fresh
```

**Salida esperada:**
```
╔══════════════════════════════════════════════╗
║      VOCACIONAL QUICK TEST — FULL DEMO       ║
╚══════════════════════════════════════════════╝

► Creating test user...
  ✓ User: quicktest_1234567890@test.internal (ID: 5)

► Starting test session (15 questions)...
[████████████████████████████] 15/15

► Analyzing results with Gemini AI...
  ✓ RIASEC analysis complete
► Matching careers...
  ✓ Found 6 matching careers

╔══════════════════════════════════════════════╗
║                 TEST RESULTS                  ║
╚══════════════════════════════════════════════╝

📊 RIASEC Profile:
+--------------+-------+
| Dimension    | Score |
+--------------+-------+
| Realista     | 65    |
| Investigador | 78    |
| Artista      | 45    |
| Social       | 52    |
| Emprendedor  | 38    |
| Convencional | 41    |
+--------------+-------+

🎯 Top 3 Recommended Careers:
  1. Ingeniero/a de Software (similarity: 92.3%)
     Diseña, desarrolla y mantiene aplicaciones...
  2. Analista de Datos (similarity: 88.1%)
     Analiza grandes volúmenes de datos...
  3. Investigador/a Científico (similarity: 85.7%)
     Realiza investigación aplicada en diversas...

📈 Session Statistics:
  Session ID: 4a06c531-9f2c-4349-aa55-3993b899245b
  Status: completado
  Questions: 15
```

#### Opción 2: Tests Múltiples en Batch

Para ejecutar **múltiples tests automáticamente** sin intervención manual:

```bash
# Windows
test-multiple.bat 10

# Linux/Mac
chmod +x test-multiple.sh
./test-multiple.sh 10
```

Esto ejecutará 10 tests completos consecutivos y mostrará un resumen final de la base de datos.

### Buscador público de estudios

Rutas públicas disponibles en frontend:

```bash
http://localhost:5173/estudios   # Buscador de estudios y centros
http://localhost:5173/mapa       # Mapa de centros con enlace a estudios del centro
```

Endpoints públicos principales:

```bash
GET /api/home/featured-courses
GET /api/studies/filters
GET /api/studies/search
GET /api/centers/{id}/studies
GET /api/centers/map
GET /api/centers/map/filters
```

### Actualización asíncrona de datasets

VocAcción incluye una base para lanzar actualizaciones largas (catálogos, cursos, geocodificación) de forma asíncrona.

**Importante:** requiere un worker de cola de Laravel.

```bash
# Worker de colas
php artisan queue:work
```

Tipos soportados actualmente en `/api/data-updates`:

```json
{ "type": "refresh_courses" }
{ "type": "refresh_official_catalog" }
{ "type": "geocode_precise", "options": { "province": "Córdoba", "limit": 50, "force": true } }
```

#### Opción 3: Test de Diagnóstico (Performance)

```bash
php artisan vocacional:stress-test
```

Solo mide rendimiento del motor (sin análisis final):
- ⚡ Más rápido
- 📊 Muestra métricas de API Gemini
- 🔍 Útil para diagnosticar problemas de performance

#### Opción 4: Validación del Matching RIASEC (Determinista)

```bash
php artisan vocacional:test-matching
```

Prueba el matching de profesiones con 13 perfiles predefinidos (6 puros + 7 mixtos) sin consumir tokens de IA:
- ✅ Determinista — no llama a Gemini
- ✅ Valida coherencia de resultados (ej. perfil I → ciencia/tecnología)
- ✅ Muestra top-6 por perfil con scores de similitud coseno
- ✅ Informe de validación automático al final

**Opciones**:
- `--perfil=RI` → Probar solo un perfil RIASEC predefinido
- `--email=correo@ejemplo.com` → Usar los scores RIASEC reales de un usuario existente
- `--scores=R:80,I:60,A:10,S:10,E:20,C:20` → Scores completamente personalizados

**Ejemplo con perfil predefinido:**
```bash
php artisan vocacional:test-matching --perfil=IS
```

**Ejemplo con usuario real (sus scores del test):**
```bash
php artisan vocacional:test-matching --email=estudiante@vocaccion.es
```

**Combinar usuario real con comparación de perfil predefinido:**
```bash
php artisan vocacional:test-matching --email=estudiante@vocaccion.es --perfil=IS
```

**Ejemplo con scores manuales:**
```bash
php artisan vocacional:test-matching --scores=R:10,I:90,A:80,S:60,E:20,C:10
```

> **Nota**: El usuario debe haber completado el test vocacional para tener un `VocationalProfile` con scores RIASEC.

### Comandos de Utilidad

```bash
# Geocodificación de centros
php artisan vocacional:geocode-centers     # Geocodificar todos los centros
php artisan vocacional:geocode-reliable    # Geocodificar con dirección exacta (recomendado para mapa público)
php artisan geocode:rabanales              # Arreglar coords Campus Rabanales (Córdoba)
php artisan geocode:fix --limit=50         # Re-geocodificar con direcciones exactas

# Exportar datos geocodificados
php artisan data:export-centers

# Conversión de datos — CSV a JSON
php artisan qedu:csv-to-json              # Convierte qedu.csv → normalized/qedu_latest.json (12.726 registros)

# Convertir ESCO CSV a JSON
php scripts/convert_esco_to_json.php

# Ver estado de migraciones
php artisan migrate:status

# Limpiar caché
php artisan config:clear
php artisan cache:clear
php artisan route:clear
```

## Despliegue

### Frontend

Para generar la versión de producción:

```bash
npm run build
```

Los archivos optimizados se generarán en la carpeta `dist/`.

### Backend

Configurar el servidor web (Apache/Nginx) para apuntar a `backend/laravel/public/`.

Asegurarse de:

- Configurar las variables de entorno en `.env` para producción
- Ejecutar `php artisan config:cache`
- Ejecutar `php artisan route:cache`
- Configurar permisos adecuados para `storage/` y `bootstrap/cache/`

## 🗄️ Estructura de Base de Datos

### Tablas Principales

#### Vocational Test Engine
- `vocational_sessions` - Sesiones de test adaptativo
- `vocational_responses` - Respuestas individuales
- `question_bank` - Banco de preguntas RIASEC
- `vocational_profiles` - Perfiles RIASEC de usuarios

#### Career Catalog
- `career_catalog` - 69 profesiones con vectores RIASEC calibrados
- `esco_occupations` - 3,039 ocupaciones europeas (ESCO)
- `esco_skills` - 13,960 habilidades/competencias (ESCO)
- `esco_occupation_skill_relations` - 126,051 relaciones ocupación-habilidad

#### Education & Training
- `official_universities` - 108 universidades (RUCT)
- `official_centers` - 1,384 centros/campus con GPS
- `official_degrees` - 13,133 titulaciones oficiales
- `professional_certificates` - 7,639 certificados profesionales (SEPE)
- `training_courses` - 419 cursos de formación (SEPE + SAE)
- `public_competitions` - Oposiciones BOE

#### Mappings (Relaciones)
- `career_certificate_mappings` - Profesión ↔ Certificados
- `career_course_mappings` - Profesión ↔ Cursos
- `career_competition_mappings` - Profesión ↔ Oposiciones
- `career_esco_mappings` - Profesión ↔ ESCO (enriquecimiento)

#### Users & Auth
- `usuarios` - Usuarios del sistema
- `roles` - Roles (estudiante, orientador, administrador)
- `perfiles` - Datos personales de usuarios

#### Content & Resources
- `recursos` - Artículos del blog/CMS
- `guias` - Guías descargables (PDF)
- `itinerarios_generados` - Itinerarios académicos personalizados

### Diagramas y Documentación

Ver documentación completa en:
- `backend/laravel/database/data/README.md` - Estructura del catálogo de datos
- `docs/archive/` - Documentación histórica del desarrollo

---

## Contexto Académico

Este proyecto ha sido desarrollado como parte del Módulo de Proyecto Integrado del Ciclo Formativo de Grado Superior en Desarrollo de Aplicaciones Web (DAW) del IES Gran Capitán, Córdoba, España.

Curso académico: 2025-2026

## Licencia

Este proyecto ha sido desarrollado con fines educativos como parte del currículo del Ciclo Formativo DAW del IES Gran Capitán.

Todos los derechos reservados al equipo de desarrollo y al IES Gran Capitán.

