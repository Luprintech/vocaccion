<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class OfficialUniversity extends Model
{
    protected $fillable = [
        'ruct_code',
        'name',
        'acronym',
        'responsible_administration_code',
        'responsible_administration_name',
        'ownership_type',
        'cif',
        'erasmus_code',
        'for_profit',
        'address',
        'postal_code',
        'locality',
        'municipality',
        'province',
        'autonomous_community_name',
        'website',
        'email',
        'phone_1',
        'phone_2',
        'fax',
        'is_university',
        'is_special_entity',
        'active',
        'source_system',
        'source_url',
        'last_seen_at',
        'raw_payload',
    ];

    protected $casts = [
        'for_profit' => 'boolean',
        'is_university' => 'boolean',
        'is_special_entity' => 'boolean',
        'active' => 'boolean',
        'last_seen_at' => 'datetime',
        'raw_payload' => 'array',
    ];

    public function centers(): HasMany
    {
        return $this->hasMany(OfficialCenter::class);
    }

    public function degrees(): HasMany
    {
        return $this->hasMany(OfficialDegree::class);
    }

    public function statistics(): HasMany
    {
        return $this->hasMany(OfficialDegreeStatistic::class);
    }

    public function scopeActive($query)
    {
        return $query->where('active', true);
    }
}
