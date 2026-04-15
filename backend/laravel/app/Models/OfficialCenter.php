<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class OfficialCenter extends Model
{
    protected $fillable = [
        'official_university_id',
        'ruct_center_code',
        'name',
        'center_type',
        'legal_nature',
        'attachment_type',
        'address',
        'postal_code',
        'locality',
        'municipality',
        'province',
        'autonomous_community_code',
        'autonomous_community_name',
        'lat',
        'lng',
        'geocode_precision',
        'geocode_provider',
        'geocode_query',
        'geocode_display_name',
        'geocode_last_checked_at',
        'active',
        'source_system',
        'source_url',
        'last_seen_at',
        'raw_payload',
    ];

    protected $casts = [
        'active' => 'boolean',
        'lat' => 'float',
        'lng' => 'float',
        'geocode_last_checked_at' => 'datetime',
        'last_seen_at' => 'datetime',
        'raw_payload' => 'array',
    ];

    public function university(): BelongsTo
    {
        return $this->belongsTo(OfficialUniversity::class, 'official_university_id');
    }

    public function degrees(): BelongsToMany
    {
        return $this->belongsToMany(OfficialDegree::class, 'official_degree_center')
            ->withTimestamps()
            ->withPivot('source_system', 'source_url', 'last_seen_at');
    }
}
