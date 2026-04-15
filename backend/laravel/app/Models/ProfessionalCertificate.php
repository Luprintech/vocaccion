<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class ProfessionalCertificate extends Model
{
    protected $fillable = [
        'sepe_code',
        'name',
        'family_code',
        'family_name',
        'area_code',
        'area_name',
        'level',
        'total_hours',
        'is_modular',
        'is_professional_certificate',
        'online_hours',
        'associated_centers',
        'detail_url',
        'active',
        'source_system',
        'last_seen_at',
        'raw_payload',
    ];

    protected $casts = [
        'is_modular' => 'boolean',
        'is_professional_certificate' => 'boolean',
        'active' => 'boolean',
        'last_seen_at' => 'datetime',
        'raw_payload' => 'array',
        'level' => 'integer',
        'total_hours' => 'integer',
        'online_hours' => 'integer',
    ];

    /**
     * Scope para filtrar por nivel
     */
    public function scopeLevel($query, int $level)
    {
        return $query->where('level', $level);
    }

    /**
     * Scope para filtrar por familia profesional
     */
    public function scopeFamily($query, string $familyCode)
    {
        return $query->where('family_code', $familyCode);
    }

    /**
     * Scope para solo certificados profesionales oficiales
     */
    public function scopeOnlyOfficialCertificates($query)
    {
        return $query->where('is_professional_certificate', true);
    }

    /**
     * Relación con profesiones del catálogo (many-to-many)
     */
    public function careers(): BelongsToMany
    {
        return $this->belongsToMany(CareerCatalog::class, 'career_certificate_mappings')
            ->withTimestamps();
    }
}
