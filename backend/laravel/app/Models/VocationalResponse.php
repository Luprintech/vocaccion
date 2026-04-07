<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VocationalResponse extends Model
{
    protected $table = 'vocational_responses';

    // Disable default timestamps, we use answered_at
    public $timestamps = false;

    protected $fillable = [
        'session_id',
        'item_id',
        'value',
        'response_payload',
        'response_time_ms',
        'answered_at',
    ];

    protected $casts = [
        'value' => 'integer',
        'response_payload' => 'array',
        'response_time_ms' => 'integer',
        'answered_at' => 'datetime',
    ];

    /**
     * Get the session this response belongs to
     */
    public function session(): BelongsTo
    {
        return $this->belongsTo(VocationalSession::class, 'session_id', 'id');
    }

    /**
     * Get the question bank item this response is for
     */
    public function item(): BelongsTo
    {
        return $this->belongsTo(QuestionBank::class, 'item_id', 'id');
    }

    /**
     * Check if this is a Likert response (1-5)
     */
    public function isLikert(): bool
    {
        return $this->value >= 1 && $this->value <= 5;
    }

    /**
     * Check if this is a checklist response (0 or 1)
     */
    public function isChecklist(): bool
    {
        return $this->value === 0 || $this->value === 1;
    }

    /**
     * Check if this is a comparative response (-1, 0, or 1)
     */
    public function isComparative(): bool
    {
        return $this->value >= -1 && $this->value <= 1;
    }

    /**
     * Get the weighted contribution of this response to RIASEC scoring
     */
    public function getWeightedContribution(): float
    {
        if (!$this->relationLoaded('item')) {
            $this->load('item');
        }

        $weight = $this->item->weight ?? 1.0;

        // Normalize value based on phase
        if ($this->item->phase === 'likert') {
            // Likert: 1-5 → normalize to 0-1 range
            return (($this->value - 1) / 4) * $weight;
        } elseif ($this->item->phase === 'checklist') {
            // Checklist: 0 or 1 → direct contribution
            return $this->value * $weight;
        } elseif ($this->item->phase === 'comparative') {
            // Comparative: -1, 0, 1 → normalize to 0-1 range
            return (($this->value + 1) / 2) * $weight;
        }

        return 0.0;
    }
}
