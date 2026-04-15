<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CatalogInstitution extends Model
{
    protected $table = 'catalog_institutions';

    protected $fillable = [
        'slug',
        'name',
        'institution_type',
        'source_system',
        'source_code',
        'official_university_code',
        'official_university_id',
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
        'active' => 'boolean',
        'source_updated_at' => 'datetime',
        'last_seen_at' => 'datetime',
        'raw_payload' => 'array',
    ];

    public function officialUniversity(): BelongsTo
    {
        return $this->belongsTo(OfficialUniversity::class, 'official_university_id');
    }

    public function centers(): HasMany
    {
        return $this->hasMany(CatalogCenter::class, 'institution_id');
    }
}
