# 🧭 PLAN MAESTRO DE REDISEÑO: TEST VOCACIONAL IA v2.0
> **Estado del Proyecto**: En curso
> **Última actualización**: 18 Feb 2026
> **Fase Actual**: FASE 5 - IMPLEMENTACIÓN TÉCNICA (Listos para codificar)

Este documento actúa como "memoria persistente" del proyecto. Contiene la hoja de ruta, decisiones tomadas y especificaciones técnicas.

---

## 📅 HOJA DE RUTA

- [x] **FASE 1: AUDITORÍA (Completada)**
- [x] **FASE 2: ARQUITECTURA (Completada)**
- [x] **FASE 3: DISEÑO ADAPTATIVO (Completada)**
- [x] **FASE 4: PROMPTS OPTIMIZADOS (Completada)**
- [x] **FASE 5: INTEGRACIÓN TÉCNICA (COMPLETADA)**
  - [x] Migración Base de Datos (Tablas creadas y migradas)
  - [x] Service Layer (Gemini) (Implementado básico)
  - [x] Service Layer (Engine) (Lógica de fases y terminación implementada)
  - [x] Controller Endpoint (Validado con tests automáticos)

---

## 🏗️ ESPECIFICACIÓN TÉCNICA (BLUEPRINT)

### 1. Base de Datos (Tablas Relacionales)

**Tabla: `vocational_profiles`** (Resultados Persistentes)
- `id`, `user_id`
- `riasec_scores` (JSON: {R: 10, I: 40...})
- `dominant_archetype` (String: "Creador Tecnológico")
- `top_skills` (JSON Array)
- `recommended_careers` (JSON Array)

**Tabla: `vocational_sessions`** (Estado del Chat)
- `id` (UUID), `user_id`
- `current_phase` (Enum: warm_up, exploration, validation, done)
- `question_count` (Integer)
- `history_log` (JSON: Historial ligero para contexto LLM)
- `tokens_used` (Integer: Para control de costes)

### 2. Lógica del Motor (`VocationalEngineService`)

El "Cebrero" PHP que orquesta el flujo sin gastar tokens innecesarios.

```php
class VocationalEngineService {
    public function getNextQuestion($session) {
        // 1. BATCH ANALYSIS: Cada 5 preguntas, actualizar scores con IA
        if ($session->question_count % 5 === 0) {
            $this->geminiService->analyzeBatch($session);
        }

        // 2. TEMPLATE MATCHING (Ahorro Tokens):
        // Si usuario < 18 y fase inicial -> Usar plantilla estática
        if ($session->user->age < 18 && $session->question_count < 3) {
            return $this->templates->get('adolescent_warmup');
        }

        // 3. FALLBACK AI:
        // Solo si no hay template, generar pregunta con Gemini
        return $this->geminiService->generateAdaptiveQuestion($session);
    }
}
```

### 3. Estrategia de Prompts (Gemini 2.0 Flash)

**Prompt A: The Batch Analyzer**
- **Trigger**: Cada 5 respuestas.
- **Input**: Bloque de 5 Q&A recientes.
- **Output**: JSON puro con deltas de RIASEC (+R, -S, etc.).
- **Objetivo**: Mantener el "Profile State" actualizado sin re-leer todo el historial siempre.

**Prompt B: The Adaptive Interviewer**
- **Trigger**: Cuando `VocationalEngine` no encuentra template.
- **Input**: Perfil actual + Última respuesta.
- **Output**: JSON con pregunta y 4 opciones mapeadas a rasgos.

**Prompt C: The Reporter**
- **Trigger**: Al finalizar el test.
- **Input**: Perfil completo final.
- **Output**: Markdown estructurado para PDF.

---
*Este documento es la fuente de verdad para la implementación del código.*
