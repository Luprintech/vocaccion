# Phase 1 — Architectural Stabilization
**Start Date:** 2026-02-19
**Scope:** Security, Concurrency, Idempotency, Retry Robustness
**Constraint:** No domain redesign. No AI layer abstraction. Incremental, safe.

---

## Overview

| Step | Title | Risk Mitigated | Status |
|------|-------|---------------|--------|
| 1 | Secure debug route (Artisan command) | API abuse, DoS, cost exposure | ✅ Done |
| 2 | Implement Idempotency Key system | Frontend double-calls, duplicate AI calls | ✅ Done |
| 3 | Concurrency safety (lockForUpdate + transaction) | Race condition on question_count | ✅ Done |
| 4 | Fix retry backoff (exponential) | 429 retry storms | ⏳ Pending |
| 5 | Increase maxOutputTokens for generateReport | Silent report truncation | ⏳ Pending |

---

## Step 1 — Secure the Debug Route

### Objective
Remove the unauthenticated `/api/debug/stress-test` route from production reach.
Convert its logic into a protected Artisan console command.

### Risk Mitigated
- **API Cost Abuse**: Any public user could trigger 14 Gemini API calls per request.
- **Data Leakage**: The route creates real DB users that might not be cleaned up if the route errors.
- **DoS Vector**: The route is trivially hammerable with automation (`curl` loop).
- **Reputational**: Exposing `/debug/` routes in production is a security red flag in any audit.

### Decision: Artisan Command (not APP_ENV guard)

Two options were considered:

| Option | Pros | Cons |
|--------|------|------|
| `APP_ENV === 'local'` guard | Quick, 1-line fix | Still exists in production code; a misconfigured ENV exposes it |
| **Artisan Command** | Route doesn't exist in production. Zero exposure. Only accessible via CLI with server access. | Slightly more work |

**Artisan Command wins.** A route that doesn't exist cannot be abused. An ENV guard is a configuration-dependent security control — the weakest kind.

### Files Modified
- ✅ `routes/api.php` — Route removed
- ✅ `app/Console/Commands/VocationalStressTest.php` — Command created

### Before
```
// routes/api.php (DANGER: public, unauthenticated)
Route::get('/debug/stress-test', function () {
    // Creates DB users, triggers real Gemini calls
    // No authentication, no rate limiting
    // Any user on the internet can call this
});
```

### After
```
// routes/api.php — Route doesn't exist. Nothing to exploit.

// Terminal only:
// php artisan vocacional:stress-test
// Requires local server access. Not exploitable remotely.
```

### Artisan Command Design
The command replicates the exact logic of the old route but:
- Is invoked only from the CLI by someone with server access.
- Writes output to terminal, not to an HTTP response.
- Includes `--dry-run` flag to inspect config without calling Gemini.
- Cleans up test data in a `finally` block (guaranteed cleanup even on error).
- Accepts `--questions=N` to control test length.

### Verification Checklist
- [ ] `GET /api/debug/stress-test` returns 404
- [ ] `php artisan vocacional:stress-test` runs successfully
- [ ] `php artisan vocacional:stress-test --dry-run` shows config and exits without Gemini calls
- [ ] Test user is deleted after command completes (even if Gemini errors)
- [ ] Command appears in `php artisan list` output

---

## Step 2 — Idempotency Key System ✅ Done

**Completed:** 2026-02-25

### Objective
Prevent duplicate processing when the frontend sends the same request twice
(network retry, double-click, browser reload mid-request).

### Risk Mitigated
- Duplicate AI calls (cost).
- `question_count` increment executed twice.
- User sees two different questions for one answer.

### Files Modified
- ✅ `database/migrations/2026_02_25_000001_create_idempotency_keys_table.php` — Tabla `idempotency_keys` creada y migrada
- ✅ `app/Models/IdempotencyKey.php` — Modelo con `findValid()` y `store(insertOrIgnore)`
- ✅ `app/Http/Controllers/TestController.php` — Check/store de key en `siguientePregunta()`; también añadido `progress` alias para compatibilidad con tests
- ✅ `frontend/src/pages/test/TestVocacional.jsx` — `generateUUID()`, `idempotencyKeyRef`, header `X-Idempotency-Key` en fetch, reset al cambiar pregunta

### Flow Implemented
```
Frontend selecciona opción → UUID generado en idempotencyKeyRef
Frontend pulsa Siguiente   → POST con X-Idempotency-Key: <uuid>

Backend:
  - Busca key en DB (no expirada) → si existe, devuelve JSON cacheado (sin procesar)
  - Si no existe → procesa normalmente → guarda response con TTL 5 min

Reintento (mismo UUID):
  - Backend devuelve caché → question_count NO se incrementa → sin AI call extra
```

### Verification
- ✅ `php artisan test` → **8 tests, 8 passed, 62 assertions** — ninguno roto
- ✅ Migración ejecutada en DB local
- ✅ CORS: `allowed_headers => ['*']` ya cubría el header custom

---


## Step 3 — Concurrency Safety ✅ Done

**Completed:** 2026-03-05

### Objective
Make `question_count` increment atomic. Prevent two simultaneous requests from
reading the same count value and both incrementing to the same number.

### Risk Mitigated
- Race condition corrupting session state.
- Duplicate Gemini calls triggered by phantom question slots.
- `history_log` desync (two entries for the same question index).

### Approach (documented here, implemented in Step 3)

```php
// UNSAFE (current):
$session->question_count++;
$session->save();

// SAFE (target):
DB::transaction(function () use ($session, $answer) {
    $session = VocationalSession::lockForUpdate()->find($session->id);
    $session->appendHistory('user', $answer);
    $session->increment('question_count'); // atomic DB increment
    $session->save();
});
```

### Files Modified
- ✅ `app/Http/Controllers/TestController.php` — question_count envuelto en DB::transaction con lockForUpdate

### Verification
- ✅ `php artisan test` → 8 tests, 8 passed, 62 assertions — ninguno roto
- ✅ No existe $session->question_count++ en TestController.php
- ✅ Bloque dentro de DB::transaction()

---

## Step 4 — Exponential Backoff Retry (PENDING)

### Objective
Fix the retry strategy so that repeated 429 errors don't storm the API
with rapid successive calls.

### Risk Mitigated
- 429 retry loop making things worse (3 retries in 300ms = 3 more 429s).
- Wasted API quota during rate limit events.

### Current (broken):
```php
Http::retry(3, 100, ...) // 100ms flat between ALL retries
```

### Target:
```php
Http::retry(3, function (int $attempt): int {
    return $attempt * 1000; // 1s, 2s, 3s — linear backoff minimum
}, ...)
```

Or with jitter to avoid thundering herd:
```php
return ($attempt * 1000) + random_int(0, 500);
```

**Files that will be modified:**
- `app/Services/GeminiService.php` — `callGemini()` method only

---

## Step 5 — maxOutputTokens for generateReport (PENDING)

### Objective
Prevent silent truncation of the final vocational report.

### Risk Mitigated
- The AI generates a report that gets cut off mid-sentence.
- The user receives an incomplete, unprofessional result.

### Current:
```php
'maxOutputTokens' => 1000, // same for ALL calls
```

### Target:
```php
// In callGemini(), accept an optional $maxTokens parameter
// generateReport() passes 2500, all others keep 1000
```

**Files that will be modified:**
- `app/Services/GeminiService.php` — `callGemini()` signature
- `app/Services/GeminiService.php` — `generateReport()` call site

---
*Document updated as each step is completed.*
