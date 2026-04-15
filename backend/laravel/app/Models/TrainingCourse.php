<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TrainingCourse extends Model
{
    protected $fillable = [
        'external_id',
        'title',
        'provider',
        'url',
        'locality',
        'province',
        'autonomous_community',
        'start_date',
        'hours',
        'modality',
        'search_criteria',
        'description',
        'active',
        'source_system',
        'last_seen_at',
        'raw_payload',
    ];

    protected $casts = [
        'active' => 'boolean',
        'start_date' => 'date',
        'last_seen_at' => 'datetime',
        'raw_payload' => 'array',
        'hours' => 'integer',
    ];

    /**
     * Scope para filtrar por proveedor
     */
    public function scopeProvider($query, string $provider)
    {
        return $query->where('provider', $provider);
    }

    /**
     * Scope para filtrar por provincia
     */
    public function scopeProvince($query, string $province)
    {
        return $query->where('province', $province);
    }

    /**
     * Scope para cursos activos y próximos
     */
    public function scopeUpcoming($query)
    {
        return $query->where('active', true)
            ->where('start_date', '>=', now())
            ->orderBy('start_date');
    }

    /**
     * Scope para búsqueda de texto
     */
    public function scopeSearch($query, string $search)
    {
        return $query->where(function ($q) use ($search) {
            $q->where('title', 'like', "%{$search}%")
              ->orWhere('description', 'like', "%{$search}%")
              ->orWhere('search_criteria', 'like', "%{$search}%");
        });
    }
}
