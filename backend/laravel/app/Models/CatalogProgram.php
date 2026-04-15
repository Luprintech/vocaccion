<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class CatalogProgram extends Model
{
    protected $table = 'catalog_programs';

    protected $fillable = [
        'slug',
        'name',
        'program_type',
        'official_code',
        'source_system',
        'source_code',
        'family_name',
        'education_level',
        'duration_hours',
        'duration_years',
        'modality',
        'official',
        'official_degree_code',
        'official_degree_id',
        'summary',
        'source_updated_at',
        'last_seen_at',
        'source_url',
        'raw_payload',
    ];

    protected $casts = [
        'duration_hours' => 'integer',
        'duration_years' => 'float',
        'official' => 'boolean',
        'source_updated_at' => 'datetime',
        'last_seen_at' => 'datetime',
        'raw_payload' => 'array',
    ];

    public function officialDegree(): BelongsTo
    {
        return $this->belongsTo(OfficialDegree::class, 'official_degree_id');
    }

    public function qualifications(): BelongsToMany
    {
        return $this->belongsToMany(ProfessionalQualification::class, 'catalog_program_qualification', 'program_id', 'professional_qualification_id')
            ->withPivot('relation_type', 'relevance', 'notes', 'source_system', 'last_seen_at')
            ->withTimestamps();
    }

    public function occupations(): BelongsToMany
    {
        return $this->belongsToMany(CatalogOccupation::class, 'catalog_occupation_program', 'program_id', 'occupation_id')
            ->withPivot('relation_type', 'priority', 'notes', 'source_system', 'last_seen_at')
            ->withTimestamps();
    }

    public function centers(): BelongsToMany
    {
        return $this->belongsToMany(CatalogCenter::class, 'catalog_center_program', 'program_id', 'center_id')
            ->withPivot('academic_year', 'shift', 'modality', 'vacancies', 'price_range', 'official_url', 'active', 'source_system', 'last_seen_at')
            ->withTimestamps();
    }
}
