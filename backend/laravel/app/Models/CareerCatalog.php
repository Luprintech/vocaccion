<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CareerCatalog extends Model
{
    protected $table = 'career_catalog';

    protected $fillable = [
        'titulo',
        'codigo_cno',
        'codigo_esco',
        'sector',
        'familia_profesional',
        'riasec_r',
        'riasec_i',
        'riasec_a',
        'riasec_s',
        'riasec_e',
        'riasec_c',
        'nivel_formacion',
        'nivel_salarial',
        'tipo_profesion',
        'descripcion_corta',
        'salidas_profesionales',
        'ruta_formativa',
        'habilidades_clave',
        'activo',
    ];

    protected $casts = [
        'riasec_r' => 'float',
        'riasec_i' => 'float',
        'riasec_a' => 'float',
        'riasec_s' => 'float',
        'riasec_e' => 'float',
        'riasec_c' => 'float',
        'salidas_profesionales' => 'array',
        'habilidades_clave' => 'array',
        'activo' => 'boolean',
    ];

    /**
     * Devuelve el vector RIASEC como array asociativo normalizado.
     */
    public function getRiasecVector(): array
    {
        return [
            'R' => $this->riasec_r,
            'I' => $this->riasec_i,
            'A' => $this->riasec_a,
            'S' => $this->riasec_s,
            'E' => $this->riasec_e,
            'C' => $this->riasec_c,
        ];
    }

    public function scopeActivo($query)
    {
        return $query->where('activo', true);
    }

    public function scopeSector($query, string $sector)
    {
        return $query->where('sector', $sector);
    }
}
