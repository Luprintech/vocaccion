<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;

class QeduDegree extends Model
{
    protected $table = 'qedu_degrees';

    protected $fillable = [
        'cod_titulacion',
        'cod_centro',
        'cod_universidad',
        'titulacion',
        'nivel',
        'tipo_universidad',
        'tipo_centro',
        'nombre_centro',
        'nombre_universidad',
        'ccaa',
        'provincia',
        'cod_provincia',
        'modalidad',
        'idioma_extranjero',
        'ambito_isced',
        'plazas',
        'creditos',
        'precio_credito',
        'nota_corte',
        'nota_corte_anterior',
        'nota_admision_media',
        'anio',
        'insercion_tasa_afiliacion',
        'insercion_pct_autonomos',
        'insercion_pct_indefinidos',
        'insercion_pct_cotizacion',
        'insercion_salario_medio',
        'enlace',
        'fuente',
        'fecha_extraccion',
    ];

    protected $casts = [
        'idioma_extranjero'         => 'boolean',
        'plazas'                    => 'integer',
        'creditos'                  => 'float',
        'nota_corte'                => 'float',
        'nota_corte_anterior'       => 'float',
        'nota_admision_media'       => 'float',
        'insercion_tasa_afiliacion' => 'float',
        'insercion_pct_autonomos'   => 'float',
        'insercion_pct_indefinidos' => 'float',
        'insercion_pct_cotizacion'  => 'float',
        'insercion_salario_medio'   => 'float',
    ];

    // ──────────────────────────────────────────
    //  Scopes
    // ──────────────────────────────────────────

    public function scopeGrados(Builder $q): Builder
    {
        return $q->whereIn('nivel', ['GRADO', 'GRADOD']);
    }

    public function scopeMasters(Builder $q): Builder
    {
        return $q->whereIn('nivel', ['MASTER', 'MASTERD']);
    }

    public function scopeConInsercion(Builder $q): Builder
    {
        return $q->whereNotNull('insercion_tasa_afiliacion');
    }

    public function scopePresenciales(Builder $q): Builder
    {
        return $q->where('modalidad', '1');
    }

    public function scopeByCcaa(Builder $q, string $ccaa): Builder
    {
        return $q->where('ccaa', $ccaa);
    }

    public function scopeByProvincia(Builder $q, string $provincia): Builder
    {
        return $q->where('provincia', $provincia);
    }

    // ──────────────────────────────────────────
    //  Helpers
    // ──────────────────────────────────────────

    /** Nombre legible de la modalidad */
    public function getModalidadNombreAttribute(): string
    {
        return match ($this->modalidad) {
            '1'     => 'Presencial',
            '2'     => 'Online',
            '3'     => 'Semipresencial',
            default => 'Desconocida',
        };
    }

    /** True si tiene datos de inserción laboral */
    public function getTieneInsercionAttribute(): bool
    {
        return $this->insercion_tasa_afiliacion !== null;
    }
}
