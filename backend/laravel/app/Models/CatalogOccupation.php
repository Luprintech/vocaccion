<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CatalogOccupation extends Model
{
    protected $table = 'catalog_occupations';

    protected $fillable = [
        'slug',
        'preferred_label',
        'description',
        'occupation_type',
        'parent_id',
        'source_system',
        'source_code',
        'cno_occupation_id',
        'career_catalog_id',
        'employment_outlook',
        'salary_band',
        'active',
        'source_updated_at',
        'last_seen_at',
        'source_url',
        'raw_payload',
    ];

    protected $casts = [
        'active' => 'boolean',
        'source_updated_at' => 'datetime',
        'last_seen_at' => 'datetime',
        'raw_payload' => 'array',
    ];

    public function parent(): BelongsTo
    {
        return $this->belongsTo(self::class, 'parent_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(self::class, 'parent_id');
    }

    public function cnoOccupation(): BelongsTo
    {
        return $this->belongsTo(CnoOccupation::class, 'cno_occupation_id');
    }

    public function careerCatalog(): BelongsTo
    {
        return $this->belongsTo(CareerCatalog::class, 'career_catalog_id');
    }

    public function qualifications(): BelongsToMany
    {
        return $this->belongsToMany(ProfessionalQualification::class, 'catalog_occupation_qualification', 'occupation_id', 'professional_qualification_id')
            ->withPivot('relation_type', 'relevance', 'notes', 'source_system', 'last_seen_at')
            ->withTimestamps();
    }

    public function programs(): BelongsToMany
    {
        return $this->belongsToMany(CatalogProgram::class, 'catalog_occupation_program', 'occupation_id', 'program_id')
            ->withPivot('relation_type', 'priority', 'notes', 'source_system', 'last_seen_at')
            ->withTimestamps();
    }
}
