# AGENTS.md — VocAcción

> Guía de contexto para agentes de IA (Antigravity, Copilot, Claude, etc.) que trabajen en este repositorio.
> Leé este archivo completo antes de tocar cualquier código.

---

## 0. Resumen del Proyecto

**VocAcción** es una plataforma web de orientación vocacional con IA para estudiantes y adultos.
Proyecto académico del CFGS DAW — IES Gran Capitán, Córdoba (España). Curso 2025-2026.

**Stack:**
- **Frontend:** React 19 + Vite 7 + TailwindCSS 4 + React Router 7
- **Backend:** Laravel 12 + PHP 8.2 + Laravel Sanctum + Laravel Cashier (Stripe)
- **IA:** Google Gemini 2.5 Flash (vía API REST directa con Guzzle)
- **Imágenes:** Pexels API (búsqueda semántica de fotos para profesiones)
- **Auth Social:** Google OAuth 2.0 vía Laravel Socialite
- **DB:** MySQL 8.0

---

## 1. Estructura del Repositorio

```
vocaccion/
├── frontend/                    # SPA React (Vite)
│   ├── src/
│   │   ├── App.jsx              # Router central — todas las rutas aquí
│   │   ├── api.js               # Capa de comunicación con el backend (axios)
│   │   ├── context/
│   │   │   └── AuthContextFixed.jsx  # Contexto global de autenticación
│   │   ├── layouts/
│   │   │   ├── MainLayout.jsx   # Layout público (Header + Footer)
│   │   │   └── DashboardLayout.jsx  # Layout de dashboards con sidebar
│   │   ├── components/          # Componentes reutilizables
│   │   ├── pages/               # Páginas organizadas por dominio
│   │   │   ├── test/            # TestIntro, TestVocacional, InformeVocacional
│   │   │   ├── dashboards/      # Admin, Orientador, Estudiante
│   │   │   ├── orientador/      # Módulos del rol orientador
│   │   │   ├── estudiante/      # Módulos del rol estudiante
│   │   │   ├── recursos/        # Artículos, Guías, Comunidades
│   │   │   ├── mi-profesion/    # Perfil de profesión del usuario
│   │   │   ├── itinerario/      # Itinerario académico (Plan PRO)
│   │   │   ├── perfil/          # Perfil personal y suscripción
│   │   │   └── legal/           # Páginas legales (GDPR)
│   │   ├── data/                # Datos estáticos (RIASEC labels, etc.)
│   │   ├── styles/              # CSS adicionales
│   │   └── utils/               # Helpers utilitarios
│   ├── package.json
│   └── vite.config.js           # Alias "@" → "./src"
│
└── backend/
    └── laravel/
        ├── app/
        │   ├── Http/Controllers/   # 20 controllers (ver §4)
        │   ├── Models/             # 28 modelos Eloquent (ver §5)
        │   ├── Services/           # Lógica de negocio (ver §6)
        │   ├── Domain/
        │   │   └── Hypothesis/     # Motor RIASEC basado en hipótesis (ver §7)
        │   ├── Helpers/            # ccaa_helper.php (comunidades autónomas)
        │   ├── Mail/               # Mail classes
        │   └── Policies/           # Authorization policies
        ├── routes/
        │   ├── api.php             # Rutas públicas + auth
        │   ├── admin.php           # Rutas /admin (rol: administrador)
        │   ├── orientador.php      # Rutas /orientador (rol: orientador)
        │   ├── estudiante.php      # Rutas /estudiante (rol: estudiante)
        │   └── console.php         # Comandos Artisan (stress-test, etc.)
        ├── database/
        │   ├── migrations/         # 70 migraciones cronológicas
        │   └── seeders/            # CareerCatalogSeeder (69 profesiones)
        └── .env                    # Variables de entorno (NUNCA commitear)
```

---

## 2. Roles de Usuario

El sistema tiene **3 roles** con acceso diferenciado:

| Rol | Rutas Frontend | Rutas API |
|-----|---------------|-----------|
| `estudiante` | `/estudiante/*`, `/test`, `/resultados`, `/mi-profesion`, `/itinerario` (PRO) | `routes/estudiante.php` |
| `orientador` | `/orientador/*`, `/chat` | `routes/orientador.php` |
| `administrador` | `/admin/*`, `/orientador/*` | `routes/admin.php` |

**Protección de rutas en frontend:**
- `<ProtectedRoute>` → requiere auth (token Sanctum)
- `<RequireRole roles="...">` → verifica rol del usuario
- `requiredPlan="pro"` / `requiredPlan="pro_plus"` → verifica suscripción Stripe

---

## 3. Sistema de Suscripciones (Stripe)

Tres planes:
- **Gratuito**: Test vocacional, informe básico
- **PRO**: + Itinerario académico personalizado
- **PRO PLUS**: + Chat con orientador, videollamadas, reservas de sesión

Integración vía **Laravel Cashier**. Webhooks en `StripeWebhookController`.
El plan activo se obtiene en `/api/subscription/status`.

---

## 4. Controllers del Backend

| Controller | Responsabilidad |
|------------|-----------------|
| `AuthController` | Registro, login, logout, perfil, imagen, email verification |
| `GoogleAuthController` | OAuth 2.0 Google (Socialite) |
| `TestController` | **Motor test vocacional adaptativo** (ver §7) |
| `UserTestController` | Progreso/resultados del test (tabla legacy `test_sessions`) |
| `ProfileController` | Stats del perfil vocacional |
| `EstudianteDashboardController` | Dashboard del estudiante |
| `OrientadorDashboardController` | Dashboard del orientador + métricas |
| `AdminDashboardController` | Panel de administración |
| `GuiaController` | CRUD guías descargables (PDF) |
| `RecursoController` | CRUD artículos/recursos |
| `RecursoPDFController` | Generación PDF de artículos |
| `ItinerarioController` | Generación de itinerarios académicos (Gemini) |
| `ObjetivoProfesionalController` | Objetivo profesional del usuario |
| `SubscriptionController` | Checkout Stripe, portal de cliente, status |
| `StripeWebhookController` | Webhooks de Stripe (idempotente) |
| `ChatController` | Mensajería interna orientador↔estudiante |
| `ContactoController` | Formulario de contacto público |
| `TestimonioController` | CRUD testimonios |
| `PasswordResetController` | Recuperación de contraseña |

---

## 5. Modelos Clave de la Base de Datos

| Modelo | Tabla | Descripción |
|--------|-------|-------------|
| `Usuario` | `usuarios` | Usuario principal (extiende Authenticatable) |
| `Perfil` | `perfiles` | Datos personales del usuario (fecha_nacimiento, bio) |
| `VocationalSession` | `vocational_sessions` | Sesión del motor de test adaptativo (NUEVO) |
| `VocationalProfile` | `vocational_profiles` | Scores RIASEC acumulados |
| `CareerCatalog` | `career_catalog` | Catálogo de 69 profesiones curadas (CNO/ESCO) |
| `IdempotencyKey` | `idempotency_keys` | Caché anti-duplicados para respuestas de Gemini |
| `TestSesion` | `test_sessions` | Sesión legacy (mantener por compatibilidad) |
| `Guia` | `guias` | Guías descargables (PDF) |
| `Recurso` | `recursos` | Artículos del blog/CMS |
| `ItinerarioGenerado` | `itinerarios_generados` | Itinerarios académicos por usuario/CCAA |
| `Rol` | `roles` | Roles del sistema |
| `Plan` | `planes` | Planes de suscripción |
| `Mensaje` | `mensajes` | Chat interno |

---

## 6. Services de Negocio

### `GeminiService.php`
Wrapper sobre la API de Gemini 2.5 Flash. Cuatro prompts principales:

| Método | Prompt | Salida |
|--------|--------|--------|
| `analyzeBatch()` | Analiza bloque de respuestas → scores RIASEC delta | JSON |
| `generateQuestion()` | Genera pregunta adaptativa con estrategia RIASEC | JSON |
| `generateImageSearchTerm()` | Término de búsqueda para Pexels | String plano |
| `generateReport()` | Informe RIASEC completo (+800 palabras en Markdown) | Markdown |

**Importante:** `generateReport()` acepta `$matchedCareers[]` como segundo parámetro.
Gemini NO inventa profesiones — solo narra sobre las pre-seleccionadas por `CareerMatchingService`.

### `VocationalEngineService.php`
Orquesta el motor de preguntas adaptativas:
1. **Warm-up** (preguntas 1-3): templates estáticos, sin tokens IA
2. **Domain templates**: si hay arquetipo dominante claro
3. **Adaptive AI**: `HypothesisDecider` decide estrategia → `GeminiService` genera pregunta

### `CareerMatchingService.php`
Matching de profesiones basado en similitud coseno:
- Normaliza scores RIASEC (0-100) a vector unitario
- Calcula similitud coseno vs cada profesión del catálogo
- Aplica **8 reglas de diversidad** (sectorial, formativa, salarial)
- Devuelve exactamente **6 profesiones**

### `ProfesionComparadorService.php`
Comparación detallada entre profesiones para la página `/mi-profesion`.

---

## 7. Motor de Hipótesis (Domain Layer)

Ubicado en `app/Domain/Hypothesis/`:

| Clase | Rol |
|-------|-----|
| `HypothesisState` | Estado inmutable: scores por dimensión + confianza |
| `DimensionState` | Estado de una dimensión RIASEC (score, confidence, evidence_count) |
| `ConfidenceCalculator` | Aplica respuesta al estado → nuevo estado (funcional, inmutable) |
| `HypothesisDecider` | Decide estrategia de pregunta (CONTRAST/CONFIRMATION/EXPLORATION) y condiciones de parada |
| `QuestionStrategy` | DTO con tipo de estrategia, dimensiones objetivo, traits usados |

**Condiciones de parada (`shouldStop`):**
- P1: Hard limit (máximo configurado de preguntas)
- P2: Early excellence (confianza muy alta en 1-2 dimensiones)
- P3: Convergencia de confianza
- P4: Saturación de evidencias
- P5: Session limit legacy (fallback 15 preguntas)

---

## 8. Flujo del Test Vocacional

```
Frontend                          Backend
   │                                 │
   ├─ GET /api/test/estado ──────────► estadoTest()
   │    (nuevo | en_progreso | completado)
   │
   ├─ POST /api/test/iniciar ────────► iniciar()
   │    { session_id, pregunta_actual }   └── VocationalEngineService.getNextQuestion()
   │                                          └── WarmUpTemplate (preguntas 1-3)
   │
   ├─ POST /api/test/siguiente-pregunta ► siguientePregunta()
   │    { session_id, respuesta,            ├── IdempotencyKey check
   │      trait, all_traits, strategy_type }├── appendHistory() + increment()
   │    { pregunta_actual | finalizado }    └── HypothesisDecider → GeminiService
   │                      (loop)
   │
   └─ POST /api/test/analizar-respuestas ► analizarResultados()
        { session_id }                       ├── GeminiService.analyzeBatch()
        { report_markdown, profesiones }     ├── CareerMatchingService.match()
                                             ├── GeminiService.generateReport()
                                             └── Pexels API → imagenUrl por profesión
```

**Anti-duplicados:** `X-Idempotency-Key` en header → `IdempotencyKey` model (TTL 5min).

---

## 9. Rutas de API Principales

### Públicas (sin auth)
```
POST /api/register
POST /api/login
POST /api/forgot-password / verify-reset-token / reset-password
GET  /api/testimonios
GET  /api/recursos
```

### Protegidas (Sanctum Bearer Token)
```
GET  /api/profile
PUT  /api/profile
POST /api/profile  (FormData con imagen)
POST /api/logout

GET  /api/test/estado
POST /api/test/iniciar
POST /api/test/siguiente-pregunta
POST /api/test/analizar-respuestas

GET  /api/subscription/status
POST /api/subscription/checkout
POST /api/subscription/portal

/api/guias/*   (CRUD guías)
/api/recursos/articulos/*  (artículos/PDF)
/api/objetivo-profesional  (CRUD)
/api/itinerario/generar    (IA, Plan PRO)
```

---

## 10. Catálogo de Profesiones (`career_catalog`)

**69 profesiones reales** en 16 sectores, con:
- Vector RIASEC normalizado (suma ≈ 1.0, calibrado desde O*NET)
- Códigos CNO-11 y ESCO reales
- Nivel de formación, salario y tipo (tradicional/emergente/en_crecimiento)

**CRÍTICO:** No modificar los vectores RIASEC sin recalibrar desde O*NET.
El seeder es idempotente (`updateOrCreate`). Ejecutar con:
```bash
php artisan db:seed --class=CareerCatalogSeeder
```

---

## 11. Variables de Entorno Requeridas (backend/.env)

```env
# Base de datos
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=vocaccion
DB_USERNAME=root
DB_PASSWORD=

# Gemini (Google AI)
GEMINI_API_KEY=...

# Pexels (imágenes de profesiones)
PEXELS_API_KEY=...

# Google OAuth
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=http://localhost:8000/api/auth/google/callback

# Stripe
STRIPE_KEY=pk_test_...
STRIPE_SECRET=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email (mailers)
MAIL_MAILER=smtp
MAIL_HOST=...
```

```env
# frontend/.env
VITE_API_URL=http://localhost:8000/api
```

---

## 12. Cómo Arrancar el Proyecto

```bash
# Backend
cd backend/laravel
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan db:seed --class=CareerCatalogSeeder
php artisan serve          # http://localhost:8000

# Frontend (otra terminal)
cd frontend
npm install
npm run dev                # http://localhost:5173
```

**Usuarios de prueba** (tras `php artisan migrate:refresh --seed`):
- Estudiante: `estudiante@test.com` / `12345678`
- Orientador: `orientador@test.com` / `12345678`
- Admin: `admin@test.com` / `12345678`

---

## 13. Convenciones y Reglas del Proyecto

### Git
- Commits en **conventional commits** formato: `feat:`, `fix:`, `refactor:`, `docs:`, `test:`
- **NUNCA** añadir "Co-Authored-By" ni atribuciones de IA en commits
- No commitear `.env`, `node_modules/`, `vendor/`, archivos `*.txt` de debug

### Backend
- Auth vía **Laravel Sanctum** (Bearer token en SPA)
- Rutas segmentadas por rol en `routes/admin.php`, `orientador.php`, `estudiante.php`
- Todos los endpoints de Stripe llevan `->middleware('auth:sanctum')` explícito
- Usar **transacciones DB** para operaciones que modifican varias tablas
- El `VocationalSession` es el modelo moderno; `TestSesion` es legacy (mantener compatibilidad)

### Frontend
- Alias `@` → `src/` (configurado en `vite.config.js`)
- Todas las llamadas a la API pasan por `src/api.js` (axios con interceptores)
- Auth state en `AuthContextFixed` (Context API, no Redux/Zustand)
- Rutas protegidas con `<ProtectedRoute>` y `<RequireRole>`
- **No usar** `console.log` en producción; eliminar cualquier log de debug

### IA / Gemini
- Modelo: `gemini-2.5-flash` (definido en `GeminiService::$baseUrl`)
- Temperatura: `0.7` por defecto
- `maxOutputTokens`: 4096 por defecto, 8192 para `generateReport()`
- Implementa retry logic (3 intentos, 100ms inicial, exponential backoff)
- Modo JSON: `responseMimeType: 'application/json'`
- **Gemini NO inventa profesiones** — solo narra sobre las del catálogo

---

## 14. Archivos que No Debes Modificar Sin Consultar

| Archivo | Razón |
|---------|-------|
| `backend/laravel/database/seeders/CareerCatalogSeeder.php` | Vectores RIASEC calibrados desde O*NET |
| `app/Domain/Hypothesis/ConfidenceCalculator.php` | Algoritmo matemático de confianza |
| `app/Domain/Hypothesis/HypothesisDecider.php` | Lógica de parada del test |
| `app/Services/CareerMatchingService.php` | Reglas de diversidad calibradas |
| `backend/laravel/routes/api.php` | Estructura de rutas públicas/privadas |

---

## 15. Documentos de Referencia Internos

| Archivo | Contenido |
|---------|-----------|
| `CATALOG_IMPLEMENTATION.md` | Implementación del catálogo de profesiones y CareerMatchingService |
| `ENGINE_STABILIZATION_STATE.md` | Estado del motor de hipótesis (Phase 1) |
| `PHASE_1_IMPLEMENTATION.md` | Detalles de la fase 1 de estabilización del engine |
| `README.md` | Instrucciones generales de instalación |
