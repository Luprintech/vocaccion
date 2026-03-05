<?php

namespace App\Models;

use App\Domain\Hypothesis\HypothesisState;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class VocationalSession extends Model
{
    use HasFactory;

    // UUID configuración
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'usuario_id',
        'current_phase',
        'question_count',
        'history_log',
        'tokens_used',
        'is_completed',
        'hypothesis_state',  // RIASEC confidence state for the adaptive engine
        'decision_log',      // Audit trail of HypothesisDecider strategy choices
    ];

    protected $casts = [
        'history_log' => 'array',
        'is_completed' => 'boolean',
        'hypothesis_state' => 'array',  // Stored as JSON, hydrated to array by Eloquent
        'decision_log' => 'array',
    ];

    /**
     * Boot: assigns UUID on creating, and ensures hypothesis_state is always
     * initialized to a valid HypothesisState::initial() payload.
     *
     * This runs before INSERT so every new row has a non-null hypothesis_state.
     * Existing rows with null will be hydrated lazily by the engine via
     * VocationalEngineService::resolveHypothesisState().
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            // 1. Assign UUID
            if (empty($model->id)) {
                $model->id = (string) Str::uuid();
            }

            // 2. Initialize hypothesis_state if not already set
            if (empty($model->hypothesis_state)) {
                $initialState = HypothesisState::initial()->toArray();
                $model->hypothesis_state = $initialState;

                // DEBUG: confirm initialization fires on every new session
                Log::debug('[HypothesisState] Initialized on session create', [
                    'session_id' => $model->id,
                    'dimensions' => array_keys($initialState),
                    'all_zeroed' => collect($initialState)
                        ->every(fn($d) => $d['score'] === 0.0 && $d['evidence_count'] === 0),
                ]);
            }

            // 3. Initialize decision_log
            if (empty($model->decision_log)) {
                $model->decision_log = [];
            }
        });
    }

    /**
     * El usuario propietario de la sesión.
     */
    public function usuario(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'usuario_id');
    }

    /**
     * Añade una entrada al historial de chat (optimizado para LLM context).
     */
    public function appendHistory($role, $content)
    {
        $log = $this->getAttribute('history_log') ?? [];

        // Mantener solo un buffer de últimos X mensajes si se desea,
        // pero por ahora guardamos todo y el servicio decidirá qué enviar
        $log[] = ['role' => $role, 'content' => $content, 'ts' => time()];

        $this->setAttribute('history_log', $log);
        $this->save();
    }

    /**
     * Hydrates the raw JSON array into a typed HypothesisState VO.
     *
     * Returns HypothesisState::initial() if the column is null
     * (safety net for sessions created before this feature was added).
     *
     * NOTE: This is a pure read — it does NOT save to DB.
     * The engine is responsible for persisting updated states via
     * $session->hypothesis_state = $newState->toArray(); $session->save();
     */
    public function getHypothesisState(): HypothesisState
    {
        $raw = $this->getAttribute('hypothesis_state');

        if (empty($raw)) {
            Log::debug('[HypothesisState] Column was null on read — returning initial()', [
                'session_id' => $this->id,
            ]);
            return HypothesisState::initial();
        }

        return HypothesisState::fromArray($raw);
    }
}
