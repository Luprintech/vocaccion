<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class CatalogCenter extends Model
{
    protected $table = 'catalog_centers';

    protected $fillable = [
        'institution_id',
        'slug',
        'name',
        'center_type',
        'ownership_type',
        'source_system',
        'source_code',
        'official_center_code',
        'official_center_id',
        'address',
        'postal_code',
        'locality',
        'municipality',
        'province',
        'autonomous_community',
        'lat',
        'lng',
        'website',
        'email',
        'phone',
        'active',
        'source_updated_at',
        'last_seen_at',
        'source_url',
        'raw_payload',
    ];

    protected $casts = [
        'lat' => 'float',
        'lng' => 'float',
        'active' => 'boolean',
        'source_updated_at' => 'datetime',
        'last_seen_at' => 'datetime',
        'raw_payload' => 'array',
    ];

    public function institution(): BelongsTo
    {
        return $this->belongsTo(CatalogInstitution::class, 'institution_id');
    }

    public function officialCenter(): BelongsTo
    {
        return $this->belongsTo(OfficialCenter::class, 'official_center_id');
    }

    public function programs(): BelongsToMany
    {
        return $this->belongsToMany(CatalogProgram::class, 'catalog_center_program', 'center_id', 'program_id')
            ->withPivot('academic_year', 'shift', 'modality', 'vacancies', 'price_range', 'official_url', 'active', 'source_system', 'last_seen_at')
            ->withTimestamps();
    }
}
