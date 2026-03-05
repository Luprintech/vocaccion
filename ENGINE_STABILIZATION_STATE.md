# Engine Stabilization State - Technical Snapshot
**Date:** 2026-02-19
**Status:** Stable (Backend), Diagnostic (AI Integration)
**Model:** Gemini 2.5 Flash

## 1. Current Gemini Architecture

### GeminiService Implementation
- **Location:** `app/Services/GeminiService.php`
- **Configuration:** Reads from `config/services.php` (which maps `.env` variables `GEMINI_API_KEY` and `GEMINI_API_URL`).
- **Base URL:** `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent` (Configurable via `.env`).

### AI Call Strategy
- **Method:** `callGemini(prompt, jsonMode, systemInstruction)`
- **System Instructions:** Moved to the specialized `system_instruction` field in the API payload (v1beta). This separates the "persona" from the user context, improving prompt adherence and token efficiency.
- **Retry Logic:** Implements `Http::retry(3, 100)` with exponential backoff.
  - **Triggers:** Network errors, HTTP 429 (Rate Limit), HTTP 5xx.
  - **Behavior:** Retries up to 3 times before throwing an exception back to the caller.

### Diagnostics & Instrumentation
- **Storage:** `public static $diagnostics` array in `GeminiService`.
- **Scope:** Per-request (resets via `resetDiagnostics()`).
- **Metrics Collected:**
  - `total_calls`: Intentional calls initiated by the engine.
  - `total_retries`: Failed attempts caught and retried by Laravel.
  - `total_tokens_estimated`: Cumulative heuristic estimation.
  - `history`: Array of detailed logs (timestamp, model, duration, status, prompt chars).
- **Token Estimation:** Heuristic `ceil((strlen($prompt) + strlen($systemInstruction)) / 4)`. **NOT** a real tokenizer.

## 2. VocationalEngineService Flow

### Question Generation Logic
- **Location:** `app/Services/VocationalEngineService.php`
- **Flow:**
  1.  **Check Completion:** Stops if `question_count >= 15`.
  2.  **Batch Analysis:** Every 5 questions (`count % 5 === 0`), triggers `analyzeBatch` to update RIASEC scores in `VocationalProfile`.
  3.  **Branching Strategy:**
      - **Phase 1 (Warm Up):** Questions 1-3 use static templates (`getWarmUpTemplate`). Logs `[STRESS_TEST] Using WarmUp Template`.
      - **Phase 2 (Exploration):** Questions 4-15 usually hit Gemini (`generateAdaptiveQuestion`).
      - **Fallback:** If Gemini returns empty/error after retries, uses `getFallbackTemplate`. Logs `[STRESS_TEST] Using Fallback Template`.

### History & State
- **Session Model:** `VocationalSession`
- **History Log:** Stored in `history_log` (JSON column).
  - **Structure:** `['role' => 'user', 'content' => 'Option Text']`.
  - **Limitation:** Currently only stores *User Answers*. The *Question Context* is NOT stored in the structured history, meaning the AI relies on a reconstructed context or "blind" continuation.
- **Termination:** Verified in `getNextQuestion`. If limit reached, marks `current_phase = 'done'` and `is_completed = true`.

## 3. Testing Strategy

### Unit/Feature Tests
- **Suite:** `tests/Feature/VocationalTestFlowTest.php`
- **Drivers:** Uses `RefreshDatabase`.
- **Mocks:** `GeminiService` is mocked using `Mockery`.
  - **Validation:** Tests logic flow (Phase transitions 1->15->Done), NOT real AI responses.
  - **Environment:** Runs on SQLite (`:memory:`).

### SQLite Compatibility
- **Issue:** SQLite does not support `FULLTEXT` indexes used in `guias` table.
- **Fix:** Migration `2025_12_04_194534_create_guias_table.php` now conditionally applies `fullText` only if the driver is NOT `sqlite`.

## 4. Stress Test Route (Runtime Diagnostic)

### Route Details
- **Endpoint:** `GET /api/debug/stress-test`
- **Logic:**
  - Creates a temporary User (`stress_{timestamp}@test.com`).
  - Instantiates `VocationalEngineService` directly (Service Layer Bypass of Controller).
  - Loops 15 times calling `getNextQuestion`.
  - Simulates providing the *first option* as an answer.
  - Sleeps 100ms between steps.
- **Output:** JSON summary of `total_duration`, `questions_processed`, and full `gemini_diagnostics`.

### Limitations vs Real HTTP
- **Bypasses Middleware:** Does not test Authentication, Rate Limiting (Throttle), or Input Validation.
- **Bypasses Controller:** Does not test `TestController` response formatting or error handling.
- **Ideal For:** Validating Engine stability, API Quotas, and Token usage.

## 5. Known Limitations

1.  **Token Estimation is Heuristic:** The `/4` rule is a rough approximation. Real BPE token count for Spanish text may vary significantly.
2.  **No "Real" Duplicate Detection:** The system detects retries, but if the Frontend (React) sends two HTTP requests due to a double-click, the Backend will currently process both (no idempotency key mechanism).
3.  **Context "Blindness":** `history_log` only saves user answers. The AI generates the next question based on *answers* but doesn't explicitly know what question prompted that answer unless inferred.
4.  **Prompt Size:** We are sending `json_encode($recentHistory)`. As the session grows, this linear growth might hit token limits if we switched models or increased limits (currently capped appropriately by 5-question logic).

## 6. Open Technical Risks (Brutally Honest)

-   **Frontend Race Conditions:** The React frontend at `TestVocacional.jsx` lacks aggressive debouncing/locking. A user clicking "Next" rapidly **will** cause parallel backend executions, potentially corrupting the `question_count` or wasting AI tokens.
-   **Cost Scalability:** Using high-end models (Gemini Pro/Flash 2.5) for *every* question (12 calls/user) is expensive at scale. Caching or reduced frequency (batching 3 questions at once) isn't implemented.
-   **Mocked Tests != Real Stability:** passing `phpunit` means the *code logic* is valid, but says nothing about the *prompt quality* or *API stability*. The diagnostic route is the only way to verify the "Intelligence" integration.
-   **Error Handling UX:** If `GeminiService` fails after 3 retries and returns the Fallback Template, the user sees a generic static question. There is no alert system to notify admins that the AI is effectively down.
