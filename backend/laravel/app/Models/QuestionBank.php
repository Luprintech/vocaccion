<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class QuestionBank extends Model
{
    protected $table = 'question_bank';

    protected $fillable = [
        'age_group',
        'phase',
        'dimension',
        'dimension_b',
        'weight',
        'text_es',
        'context_es',
        'options_json',
        'order_default',
        'is_active',
    ];

    protected $casts = [
        'weight' => 'float',
        'options_json' => 'array',
        'is_active' => 'boolean',
        'order_default' => 'integer',
    ];

    /**
     * Scope: Filter by age group
     */
    public function scopeForAgeGroup($query, string $ageGroup)
    {
        return $query->where('age_group', $ageGroup);
    }

    /**
     * Scope: Filter by phase
     */
    public function scopeForPhase($query, string $phase)
    {
        return $query->where('phase', $phase);
    }

    /**
     * Scope: Only active items
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope: Order by default order
     */
    public function scopeOrdered($query)
    {
        return $query->orderBy('order_default');
    }

    /**
     * Get RIASEC vector for this item
     * Returns array with dimensions as keys
     */
    public function getRiasecVector(): array
    {
        $vector = [
            'R' => 0.0,
            'I' => 0.0,
            'A' => 0.0,
            'S' => 0.0,
            'E' => 0.0,
            'C' => 0.0,
        ];

        if ($this->phase === 'comparative' && $this->dimension_b) {
            // Comparative questions affect two dimensions
            $vector[$this->dimension] = $this->weight;
            $vector[$this->dimension_b] = $this->weight;
        } else {
            // Activities, competencies, occupations affect one dimension
            $vector[$this->dimension] = $this->weight;
        }

        return $vector;
    }

    // =========================================================================
    // Phase type checkers
    // =========================================================================

    /**
     * Check if this is an activities item (Likert 5 points)
     */
    public function isActivities(): bool
    {
        return $this->phase === 'activities';
    }

    /**
     * Check if this is a competencies item (Yes/No)
     */
    public function isCompetencies(): bool
    {
        return $this->phase === 'competencies';
    }

    /**
     * Check if this is an occupations item (Attracts me / Doesn't attract)
     */
    public function isOccupations(): bool
    {
        return $this->phase === 'occupations';
    }

    /**
     * Check if this is a comparative item
     */
    public function isComparative(): bool
    {
        return $this->phase === 'comparative';
    }

    /**
     * Check if this is a legacy checklist item (deprecated)
     */
    public function isChecklist(): bool
    {
        return $this->phase === 'checklist';
    }

    /**
     * Check if this is a legacy likert item (deprecated)
     */
    public function isLikert(): bool
    {
        return $this->phase === 'likert';
    }

    // =========================================================================
    // Phase-specific helpers
    // =========================================================================

    /**
     * Get the expected response type for this phase
     * 
     * @return string 'likert_5'|'binary'|'comparative'
     */
    public function getResponseType(): string
    {
        return match ($this->phase) {
            'activities' => 'likert_5',        // 1-5 scale
            'competencies' => 'binary',        // Yes/No (1/0)
            'occupations' => 'binary',         // Attracts/Doesn't (1/0)
            'comparative' => 'comparative',    // Choice between A/B/Both
            'likert' => 'likert_5',           // Legacy
            'checklist' => 'options',         // Legacy
            default => 'unknown',
        };
    }

    /**
     * Get the maximum score for this item
     */
    public function getMaxScore(): float
    {
        return match ($this->phase) {
            'activities' => 5.0 * $this->weight,     // Likert 1-5
            'competencies' => 1.0 * $this->weight,   // Binary 0-1
            'occupations' => 1.0 * $this->weight,    // Binary 0-1
            'comparative' => 1.0 * $this->weight,    // 1 point for choice
            default => 1.0 * $this->weight,
        };
    }

    /**
     * Get checklist options with their dimensions (legacy)
     */
    public function getChecklistOptions(): array
    {
        if (!$this->isChecklist() || !$this->options_json) {
            return [];
        }

        return $this->options_json;
    }
}
