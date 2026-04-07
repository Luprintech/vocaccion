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
            // Likert and checklist affect one dimension
            $vector[$this->dimension] = $this->weight;
        }

        return $vector;
    }

    /**
     * Check if this is a checklist item
     */
    public function isChecklist(): bool
    {
        return $this->phase === 'checklist';
    }

    /**
     * Check if this is a comparative item
     */
    public function isComparative(): bool
    {
        return $this->phase === 'comparative';
    }

    /**
     * Get checklist options with their dimensions
     */
    public function getChecklistOptions(): array
    {
        if (!$this->isChecklist() || !$this->options_json) {
            return [];
        }

        return $this->options_json;
    }
}
