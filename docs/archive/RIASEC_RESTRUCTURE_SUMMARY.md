# Reestructuración Test RIASEC - Resumen de Implementación

**Fecha:** 8 de abril de 2026  
**Basado en:** Informe de reestructuración RIASEC (abril 2026)  
**Estado:** Backend 100% completado ✅

---

## 📋 Resumen Ejecutivo

Se ha implementado completamente la reestructuración del test RIASEC siguiendo las recomendaciones del informe técnico basado en el SDS (Self-Directed Search) de Holland. El nuevo sistema corrige los 5 problemas críticos identificados:

1. ✅ Poca granularidad (ahora 5 ítems por dimensión en lugar de 3)
2. ✅ Checklist que no discriminaba (reemplazado por Competencias Sí/No)
3. ✅ Comparativas inconsistentes (ahora 6 pares críticos fijos para todos los grupos)
4. ✅ Mezcla de constructos (ahora separados en fases distintas)
5. ✅ Sesgo de deseabilidad social (fase de Ocupaciones añadida)

---

## 🎯 Nueva Estructura del Test

### Resumen de Fases

| Fase | Ítems | Formato | Peso | Propósito | Rango Raw |
|------|-------|---------|------|-----------|-----------|
| **1. Activities** | 30 (5×6) | Likert 1-5 | ×2.0 | Mide intereses | 5-25 por dim |
| **2. Competencies** | 18 (3×6) | Sí/No | ×1.5 | Habilidades autopercibidas | 0-3 por dim |
| **3. Occupations** | 18 (3×6) | Me atrae/No | ×1.5 | Atracción por profesiones | 0-3 por dim |
| **4. Comparative** | 6 pares | A vs B | ×1.0 | Desempate entre dimensiones | 0-1 por dim |
| **Total** | **72** | — | — | — | **5-60 por dim** |

### Pares Comparativos (iguales para los 3 grupos de edad)

1. **R ↔ S** (opuestos): Máxima discriminación
2. **I ↔ E** (opuestos): Máxima discriminación
3. **A ↔ C** (opuestos): Máxima discriminación
4. **R ↔ I** (adyacentes): Par más confuso en adolescentes
5. **S ↔ E** (adyacentes): "Ayudar" vs "Liderar"
6. **A ↔ I** (adyacentes): "Crear" vs "Descubrir"

### Sistema de Puntuación

```
Score(D) = (Σ Activities_D × 2) + (Σ Competencies_D × 1.5) + (Σ Occupations_D × 1.5) + Comparatives_D

Rango teórico: 5 a 60 puntos por dimensión
Normalizado: 0 a 100 puntos
```

---

## 🗂️ Archivos Creados/Modificados

### ✅ Base de Datos

#### Migración
```
backend/laravel/database/migrations/2026_04_08_091202_update_question_bank_phases.php
```
- Añade nuevos valores al enum `phase`: `activities`, `competencies`, `occupations`
- Mantiene compatibilidad con `likert`, `checklist`, `comparative` (legacy)

#### Seeder
```
backend/laravel/database/seeders/QuestionBankSeeder.php
```
- **Completamente reescrito** con 216 ítems (72 por grupo de edad)
- Pesos aplicados correctamente en cada ítem
- Preguntas legacy desactivadas con `is_active = false`

**Comandos de instalación:**
```bash
php artisan migrate
php artisan db:seed --class=QuestionBankSeeder
```

---

### ✅ Modelos

#### QuestionBank (`app/Models/QuestionBank.php`)
Métodos añadidos:
- `isActivities()`, `isCompetencies()`, `isOccupations()` - Checkers de fase
- `getResponseType()` - Devuelve `'likert_5'`, `'binary'`, o `'comparative'`
- `getMaxScore()` - Puntuación máxima del ítem con peso aplicado

#### VocationalResponse (`app/Models/VocationalResponse.php`)
Métodos añadidos:
- `isActivities()`, `isCompetencies()`, `isOccupations()` - Checkers de tipo
- `getWeightedContribution()` - Actualizado para soportar nuevas fases

---

### ✅ Servicios

#### RiasecTestConfig (`app/Services/RiasecTestConfig.php`) **[NUEVO]**
Configuración centralizada del test:
- Constantes de ítems por fase, pesos, transiciones
- `getPhaseForIndex(int $index)` - Obtiene fase según índice 0-71
- `getPhaseTransition(int $index)` - Detecta transiciones de fase
- `getProgress(int $index)` - Calcula progreso con información de fase
- `validateItemSet($items, $ageGroup)` - Valida estructura de ítems
- `calculateWeightedScore($phase, $rawScore)` - Aplica ponderación

#### RiasecScoringService (`app/Services/RiasecScoringService.php`) **[NUEVO]**
Sistema de puntuación ponderado:
- `calculateSessionScores(VocationalSession)` - Calcula scores RIASEC raw
- `normalizeScores(array $rawScores)` - Normaliza a 0-100
- `getRiasecCode(array $scores)` - Devuelve código de 3 letras (ej: "IAS")
- `saveToProfile(VocationalSession, array $scores)` - Guarda en VocationalProfile
- `getScoreBreakdown(VocationalSession)` - Breakdown detallado por fase

#### RiasecScoreCalculatorService (`app/Services/RiasecScoreCalculatorService.php`)
Actualizado para soportar ambos sistemas (legacy + nuevo):
- `calculate(Collection $responses)` - Calcula scores 0-100
- `calculateWithBreakdown(Collection $responses)` - Con detalle por fase
- `validateResponses(Collection $responses)` - Valida respuestas y detecta sistema

#### VocationalEngineService (`app/Services/VocationalEngineService.php`)
Actualizado:
- `startSessionV2()` - Ahora valida estructura con `RiasecTestConfig`
- `getNextItemV2()` - Usa `RiasecTestConfig` para transiciones de fase
- `getItemAtIndex()` - Añade `response_type` al payload

---

## 🔌 API - Endpoints Existentes (ya funcionan)

### Iniciar Test
```http
POST /api/test/iniciar
Content-Type: application/json

{
  "age_group": "teen" | "young_adult" | "adult"
}
```

**Respuesta:**
```json
{
  "success": true,
  "estado": "nuevo",
  "version": 2,
  "session_id": "uuid",
  "total_items": 72,
  "current_index": 0,
  "phase": "activities",
  "item": {
    "id": 123,
    "phase": "activities",
    "dimension": "R",
    "text_es": "Me gusta arreglar o montar cosas con las manos",
    "context_es": "Piensa en lo que haces fuera de clase...",
    "response_type": "likert_5"
  },
  "progress": {
    "current_index": 0,
    "total_items": 72,
    "percent_complete": 0,
    "current_phase": "activities",
    "item_in_phase": 1,
    "items_in_phase": 30,
    "phase_percent": 3.3
  }
}
```

### Responder Ítem
```http
POST /api/test/responder
Content-Type: application/json

{
  "session_id": "uuid",
  "item_id": 123,
  "value": 4,  // Likert 1-5, Binary 0-1, Comparative -1/0/1
  "response_time_ms": 3500
}
```

**Respuesta:**
```json
{
  "success": true,
  "current_index": 1,
  "phase": "activities",
  "phase_transition": null,  // o "competencies" si cambia de fase
  "item": { /* siguiente ítem */ },
  "test_complete": false
}
```

### Analizar Resultados
```http
POST /api/test/analizar-respuestas
Content-Type: application/json

{
  "session_id": "uuid"
}
```

**Respuesta:**
```json
{
  "success": true,
  "report_markdown": "# Tu Perfil Vocacional RIASEC...",
  "profesiones": [
    {
      "titulo": "Ingeniero de Software",
      "codigo_cno": "2711",
      "similarity_score": 0.95,
      "imagen_url": "https://...",
      "riasec_vector": { "R": 0.15, "I": 0.40, "A": 0.20, ... }
    }
  ],
  "scores": {
    "R": 45.5,
    "I": 72.3,
    "A": 58.0,
    "S": 41.2,
    "E": 35.7,
    "C": 28.9
  }
}
```

---

## 📊 Transiciones de Fase

| Índice | Fase | Acción Frontend |
|--------|------|-----------------|
| 0-29 | `activities` | Mostrar Likert 1-5 |
| 30 | `competencies` | **Transición**: Mostrar nueva instrucción "¿Serías capaz de...?" |
| 30-47 | `competencies` | Mostrar Sí/No |
| 48 | `occupations` | **Transición**: Mostrar "¿Te atrae la idea de trabajar como...?" |
| 48-65 | `occupations` | Mostrar Me atrae / No me atrae |
| 66 | `comparative` | **Transición**: Mostrar "Elige la opción que más se acerque a ti" |
| 66-71 | `comparative` | Mostrar elección A / Ambas / B |

---

## 🎨 Guía para el Frontend

### 1. Detectar Tipo de Respuesta

El backend ahora envía `response_type` en cada ítem:

```javascript
const renderInput = (item) => {
  switch (item.response_type) {
    case 'likert_5':
      return <LikertScale value={value} onChange={setValue} />
    
    case 'binary':
      if (item.phase === 'competencies') {
        return <BinaryChoice labels={['No', 'Sí']} />
      } else if (item.phase === 'occupations') {
        return <BinaryChoice labels={['No me atrae', 'Me atrae']} />
      }
      break
    
    case 'comparative':
      return <ComparativeChoice dimensionA={item.dimension} dimensionB={item.dimension_b} />
    
    default:
      return <div>Tipo desconocido</div>
  }
}
```

### 2. Mostrar Progreso por Fase

Usar el objeto `progress` que devuelve el backend:

```javascript
<ProgressBar 
  phase={progress.current_phase}
  itemInPhase={progress.item_in_phase}
  totalInPhase={progress.items_in_phase}
  percentComplete={progress.percent_complete}
/>

// Ejemplo visual:
// Fase: Actividades (15 de 30)
// ▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░ 50%
```

### 3. Transiciones de Fase

Cuando `phase_transition` no es `null`, mostrar una pantalla intermedia:

```javascript
if (response.phase_transition) {
  return (
    <PhaseTransition 
      newPhase={response.phase_transition}
      instruction={getInstructionForPhase(response.phase_transition)}
      onContinue={() => setShowTransition(false)}
    />
  )
}
```

**Instrucciones por fase:**

```javascript
const PHASE_INSTRUCTIONS = {
  activities: "Indica cuánto te identificas con cada afirmación (1 = Nada, 5 = Mucho)",
  competencies: "¿Serías capaz de hacer lo siguiente? Responde honestamente",
  occupations: "Sin pensar demasiado, ¿te atrae la idea de trabajar como...?",
  comparative: "Elige la opción que más se acerque a ti"
}
```

### 4. Componente de Respuesta Binaria (NUEVO)

```jsx
function BinaryChoice({ labels, value, onChange }) {
  return (
    <div className="flex gap-4">
      <button
        className={value === 0 ? 'selected' : ''}
        onClick={() => onChange(0)}
      >
        {labels[0]}
      </button>
      <button
        className={value === 1 ? 'selected' : ''}
        onClick={() => onChange(1)}
      >
        {labels[1]}
      </button>
    </div>
  )
}
```

### 5. Componente Comparativo (ajustar si es necesario)

El valor debe ser `-1`, `0`, o `1`:
- `-1`: Prefiero dimensión B
- `0`: Ambas por igual
- `1`: Prefiero dimensión A

```jsx
function ComparativeChoice({ dimensionA, dimensionB, value, onChange }) {
  return (
    <div className="flex gap-2">
      <button onClick={() => onChange(1)}>Opción A</button>
      <button onClick={() => onChange(0)}>Ambas por igual</button>
      <button onClick={() => onChange(-1)}>Opción B</button>
    </div>
  )
}
```

---

## 🧪 Testing

### Verificar Carga de Preguntas

```bash
php artisan tinker
```

```php
// Verificar ítems por fase (grupo teen)
use App\Models\QuestionBank;

$teen = QuestionBank::where('age_group', 'teen')->active()->get();
echo "Total: " . $teen->count() . PHP_EOL;
echo "Activities: " . $teen->where('phase', 'activities')->count() . PHP_EOL;
echo "Competencies: " . $teen->where('phase', 'competencies')->count() . PHP_EOL;
echo "Occupations: " . $teen->where('phase', 'occupations')->count() . PHP_EOL;
echo "Comparative: " . $teen->where('phase', 'comparative')->count() . PHP_EOL;

// Debe mostrar: 72 total (30 + 18 + 18 + 6)
```

### Validar Estructura del Test

```php
use App\Services\RiasecTestConfig;

$items = QuestionBank::forAgeGroup('young_adult')->active()->ordered()->get();
$validation = RiasecTestConfig::validateItemSet($items, 'young_adult');

print_r($validation);
// Debe devolver: ['valid' => true, 'errors' => []]
```

### Probar Puntuación

```php
use App\Services\RiasecScoreCalculatorService;
use App\Models\VocationalSession;

$scorer = new RiasecScoreCalculatorService();
$session = VocationalSession::find('session-uuid');
$responses = $session->responses()->with('item')->get();

$scores = $scorer->calculate($responses);
print_r($scores);
// Debe devolver: ['R' => 45.5, 'I' => 72.3, ...]

$validation = $scorer->validateResponses($responses);
print_r($validation);
// Debe detectar: 'system' => 'new' o 'legacy'
```

---

## 📖 Referencias Técnicas

### Fundamentación Teórica

| Fuente | Referencia |
|--------|-----------|
| Teoría original | Holland, J.L. (1959). A theory of occupational choice |
| Instrumento SDS | Holland, J.L. (1994). Self-Directed Search Form R, 4th Ed. |
| Versión corta validada | Ambiel et al. (2018). 18REST: A short RIASEC-interest measure |
| Revisión 18REST-2 | Martins et al. (2025). 18REST-2. Muestra: 63.128 estudiantes |

### Arquitectura Hexagonal RIASEC

```
         R (Realista)
        / \
       C   I (Investigador)
       |   |
       E   A (Artístico)
        \ /
         S (Social)

Opuestos: R↔S, I↔E, A↔C (máxima discriminación)
Adyacentes: R-I, I-A, A-S, S-E, E-C, C-R (similares)
```

---

## ✅ Checklist de Verificación

- [x] Migración ejecutada
- [x] Seeder ejecutado con 216 ítems
- [x] Preguntas legacy desactivadas
- [x] Pesos correctos en cada ítem (×2, ×1.5, ×1.5, ×1)
- [x] RiasecTestConfig creado y probado
- [x] RiasecScoringService creado
- [x] RiasecScoreCalculatorService actualizado
- [x] Modelos QuestionBank y VocationalResponse actualizados
- [x] VocationalEngineService integrado
- [ ] Frontend actualizado para nuevas fases
- [ ] Tests E2E con los 3 grupos de edad
- [ ] Documentación de usuario final

---

## 🚀 Próximos Pasos

1. **Frontend (prioritario)**
   - Actualizar componentes de respuesta
   - Implementar transiciones de fase
   - Mostrar progreso por fase

2. **Testing**
   - Probar con usuarios reales de cada grupo de edad
   - Validar tiempos de respuesta
   - Verificar cálculo de scores

3. **Optimización**
   - Cachear validaciones de RiasecTestConfig
   - Añadir índices a la tabla vocational_responses
   - Monitorizar tiempos de cálculo de scores

---

## 💾 Backup y Rollback

### Backup de Datos Legacy

Antes de eliminar las preguntas antiguas permanentemente:

```bash
php artisan tinker
```

```php
use App\Models\QuestionBank;
use Illuminate\Support\Facades\Storage;

$legacy = QuestionBank::whereIn('phase', ['likert', 'checklist'])->get();
$backup = $legacy->toJson(JSON_PRETTY_PRINT);
Storage::disk('local')->put('backups/question_bank_legacy.json', $backup);
```

### Rollback de Migración

```bash
php artisan migrate:rollback --step=1
```

### Reactivar Preguntas Legacy (emergencia)

```php
QuestionBank::whereIn('phase', ['likert', 'checklist'])->update(['is_active' => true]);
QuestionBank::whereIn('phase', ['activities', 'competencies', 'occupations'])->update(['is_active' => false]);
```

---

**Última actualización:** 8 de abril de 2026  
**Autor:** Claude (basado en informe de Lupe/LuPrinTech)  
**Proyecto:** VocAcción - IES Gran Capitán
