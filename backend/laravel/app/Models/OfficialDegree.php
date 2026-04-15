<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class OfficialDegree extends Model
{
    protected $fillable = [
        'official_university_id',
        'ruct_study_code',
        'name',
        'academic_level_code',
        'academic_level_name',
        'cycle_code',
        'branch_code',
        'branch_name',
        'field_code',
        'field_name',
        'status_code',
        'status_name',
        'situation_code',
        'situation_name',
        'officiality_boe_url',
        'boe_urls',
        'center_codes',
        'active',
        'source_system',
        'source_url',
        'last_seen_at',
        'raw_payload',
    ];

    protected $casts = [
        'boe_urls' => 'array',
        'center_codes' => 'array',
        'active' => 'boolean',
        'last_seen_at' => 'datetime',
        'raw_payload' => 'array',
    ];

    public function university(): BelongsTo
    {
        return $this->belongsTo(OfficialUniversity::class, 'official_university_id');
    }

    public function centers(): BelongsToMany
    {
        return $this->belongsToMany(OfficialCenter::class, 'official_degree_center')
            ->withTimestamps()
            ->withPivot('source_system', 'source_url', 'last_seen_at');
    }

    public function statistics(): HasMany
    {
        return $this->hasMany(OfficialDegreeStatistic::class);
    }

    /**
     * Scope: only current Spanish university degrees (Grado, Máster, Doctorado).
     * Excludes legacy titles: Ciclo Corto/Largo, Títulos Equivalentes/Extranjeros, etc.
     */
    public function scopeCurrent($query): void
    {
        $query->where(function ($q) {
            $q->where('academic_level_name', 'like', 'Grado%')
              ->orWhere('academic_level_name', 'like', 'Máster%')
              ->orWhere('academic_level_name', 'like', 'M%ster%') // accent-safe fallback
              ->orWhere('academic_level_name', 'like', 'Doctor%');
        });
    }
}
