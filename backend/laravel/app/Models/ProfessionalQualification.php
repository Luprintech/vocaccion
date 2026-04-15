<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

/**
 * Cualificación Profesional del CNCP (Catálogo Nacional de Cualificaciones Profesionales)
 * 
 * Representa una de las 756 cualificaciones profesionales oficiales de España,
 * organizadas en 26 familias profesionales y 3 niveles de cualificación.
 * 
 * @property int $id
 * @property string $codigo_cncp Código oficial CNCP (ej: IFC080_3, AGA001_3)
 * @property string $denominacion Nombre de la cualificación
 * @property string $familia_profesional Familia profesional (26 opciones)
 * @property string $codigo_familia Código de familia (ej: IFC, SAN, TMV)
 * @property int $nivel Nivel: 1=básico, 2=medio, 3=avanzado
 * @property string|null $competencia_general Descripción de competencia general
 * @property array|null $unidades_competencia Array de UC asociadas
 * @property string|null $ambito_profesional Ámbito de aplicación
 * @property array|null $sectores_productivos Sectores donde se aplica
 * @property array|null $ocupaciones Ocupaciones relevantes
 * @property bool $activo Estado de la cualificación
 * @property string|null $url_incual URL oficial INCUAL
 */
class ProfessionalQualification extends Model
{
    protected $fillable = [
        'codigo_cncp',
        'denominacion',
        'familia_profesional',
        'codigo_familia',
        'nivel',
        'competencia_general',
        'unidades_competencia',
        'ambito_profesional',
        'sectores_productivos',
        'ocupaciones',
        'activo',
        'url_incual',
    ];

    protected $casts = [
        'nivel' => 'integer',
        'unidades_competencia' => 'array',
        'sectores_productivos' => 'array',
        'ocupaciones' => 'array',
        'activo' => 'boolean',
    ];

    /**
     * Profesiones del catálogo vocacional que requieren esta cualificación
     */
    public function careers(): BelongsToMany
    {
        return $this->belongsToMany(CareerCatalog::class, 'career_qualifications')
            ->withPivot('tipo', 'relevancia', 'observaciones')
            ->withTimestamps();
    }

    /**
     * Scope: Filtrar por familia profesional
     */
    public function scopeByFamily($query, string $familia)
    {
        return $query->where('familia_profesional', $familia);
    }

    /**
     * Scope: Filtrar por nivel
     */
    public function scopeByLevel($query, int $nivel)
    {
        return $query->where('nivel', $nivel);
    }

    /**
     * Scope: Solo activas
     */
    public function scopeActive($query)
    {
        return $query->where('activo', true);
    }
}
