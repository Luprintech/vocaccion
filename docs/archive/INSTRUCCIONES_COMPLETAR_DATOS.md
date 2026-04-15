# 📋 INSTRUCCIONES PARA COMPLETAR LOS DATOS (Opción C - Mixta)

## ✅ ESTADO ACTUAL

**FASE 1 - Infraestructura de Base de Datos: COMPLETADA ✅**
- ✅ 3 modelos creados (ProfessionalQualification, CnoOccupation, CareerCatalog)
- ✅ 3 migraciones ejecutadas exitosamente
- ✅ Tablas vacías y listas para recibir datos

**FASE 2 - Extracción de Datos: EN PROGRESO (25%) 🔄**
- ✅ Estructura de archivos PHP creada
- ✅ 15 ejemplos de cualificaciones CNCP
- ✅ 15 ejemplos de ocupaciones CNO
- ⏳ PENDIENTE: Completar las 741 cualificaciones restantes
- ⏳ PENDIENTE: Completar 35 ocupaciones CNO adicionales

---

## 📂 ARCHIVOS CREADOS

### 1. Cualificaciones CNCP (756 totales)
**Archivo**: `backend/laravel/database/data/cncp_qualifications_data.php`
- **Completadas**: 15/756 (2%)
- **Pendientes**: 741

### 2. Ocupaciones CNO-11 (muestra de ~50)
**Archivo**: `backend/laravel/database/data/cno_occupations_sample.php`
- **Completadas**: 15/50 (30%)
- **Pendientes**: 35

---

## 🎯 TU TAREA: Completar los datos

### OPCIÓN 1: Completar MANUALMENTE (lento pero preciso)

#### Para CNCP (741 cualificaciones restantes):
1. Abre el PDF: `CNCP_listadoQ.pdf` en la página 9
2. Abre el archivo: `backend/laravel/database/data/cncp_qualifications_data.php`
3. Por cada cualificación del PDF (desde la #16 hasta la #756):
   ```php
   [
       'codigo' => 'AFD338_2',  // Del PDF
       'denominacion' => 'Guía por barrancos secos o acuáticos',  // Del PDF
       'familia_profesional' => 'AFD',  // Primeras 3 letras del código
       'nivel' => 2,  // Último dígito después del _
       'competencia_general' => null,  // Dejar null por ahora
       'entorno_profesional' => null,  // Dejar null por ahora
       'sectores_productivos' => [],  // Puedes dejar vacío []
       'ocupaciones' => [],  // Puedes dejar vacío []
       'activo' => true
   ],
   ```
4. Guarda cada 50-100 entradas para no perder progreso

#### Para CNO (35 ocupaciones restantes):
1. Abre el PDF: `Catálogo nacional de ocupaciones.pdf`
2. Abre el archivo: `backend/laravel/database/data/cno_occupations_sample.php`
3. Selecciona ~5 ocupaciones por cada gran grupo (4-9 y 0)
4. Solo ocupaciones de **4 dígitos** (nivel de grupo primario)
5. Formato:
   ```php
   [
       'codigo_cno' => '4111',  // Del PDF (4 dígitos)
       'denominacion' => 'Empleados de contabilidad',  // Del PDF
       'nivel_jerarquico' => 4,  // Siempre 4
       'parent_codigo' => '411',  // Primeros 3 dígitos
       'gran_grupo' => 4,  // Primer dígito
       'descripcion' => null,
       'riasec_r' => 0,  // Dejar en 0
       'riasec_i' => 0,
       'riasec_a' => 0,
       'riasec_s' => 0,
       'riasec_e' => 0,
       'riasec_c' => 0
   ],
   ```

---

### OPCIÓN 2: Usar un SCRIPT SEMI-AUTOMATIZADO (recomendado si sabes Python)

Puedo ayudarte a crear un script Python que:
1. Lee los PDFs
2. Extrae los datos usando OCR/parsing
3. Genera el PHP automáticamente

**¿Quieres que te ayude con esto?** Dime y te creo el script.

---

### OPCIÓN 3: HÍBRIDA (lo más rápido)

1. **Para CNCP**: Completa SOLO las familias profesionales más importantes (200-300 cualificaciones):
   - SAN (Sanidad): 19 cualificaciones
   - IFC (Informática): 27 cualificaciones
   - ADG (Administración): 15 cualificaciones
   - COM (Comercio): 24 cualificaciones
   - HOT (Hostelería): 32 cualificaciones
   - ELE (Electricidad): 41 cualificaciones
   - AGA (Agraria): 55 cualificaciones
   - EOC (Construcción): 36 cualificaciones
   
   **Total**: ~250 cualificaciones (las más demandadas)

2. **Para CNO**: Completar las 35 ocupaciones restantes (1-2 horas)

3. **El resto** (506 cualificaciones CNCP) lo puedes añadir más adelante si lo necesitas.

---

## 📋 SIGUIENTE PASO: SEEDERS

Una vez completados los archivos de datos, te crearé:

### ProfessionalQualificationSeeder.php
```php
public function run()
{
    $qualifications = include database_path('data/cncp_qualifications_data.php');
    
    foreach ($qualifications as $qual) {
        ProfessionalQualification::updateOrCreate(
            ['codigo' => $qual['codigo']],
            $qual
        );
    }
}
```

### CnoOccupationSeeder.php
```php
public function run()
{
    $occupations = include database_path('data/cno_occupations_sample.php');
    
    foreach ($occupations as $occ) {
        CnoOccupation::updateOrCreate(
            ['codigo_cno' => $occ['codigo_cno']],
            $occ
        );
    }
}
```

---

## ⏱️ ESTIMACIÓN DE TIEMPO

| Tarea | Manual | Semi-auto | Híbrida |
|-------|--------|-----------|---------|
| 756 cualificaciones CNCP | 20-30h | 2-3h | 5-8h (250 qual.) |
| 50 ocupaciones CNO | 2-3h | 30min | 1-2h |
| **TOTAL** | **22-33h** | **2.5-3.5h** | **6-10h** |

---

## 🚀 RECOMENDACIÓN

**Si tienes urgencia** → Opción 3 (Híbrida):
- Completa ~250 cualificaciones CNCP de las familias más demandadas
- Completa las 50 ocupaciones CNO
- **Total: 6-10 horas de trabajo**
- El resto se puede añadir progresivamente

**Si quieres completitud** → Opción 2 (Script semi-automatizado):
- Te ayudo a crear un script Python
- **Total: 2.5-3.5 horas** (incluyendo revisión manual)

**Si prefieres control total** → Opción 1 (Manual):
- Máxima precisión
- **Total: 22-33 horas**

---

## 📞 SIGUIENTE ACCIÓN

**Dime qué opción prefieres y continúo:**

1. ✅ **"Híbrida"** → Te marco las familias prioritarias para completar
2. 🐍 **"Script Python"** → Te creo un script semi-automatizado
3. ✋ **"Manual"** → Te doy más tips para hacerlo manualmente
4. ❓ **"Tengo dudas"** → Te aclaro cualquier cosa

**¿Qué prefieres?** 😊
