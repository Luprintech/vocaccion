<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Notas de corte universitarias por titulación, centro y universidad.
 * Fuente: QEDU — Ministerio de Ciencia, Innovación y Universidades (España).
 *
 * @property int         $id
 * @property string      $cod_titulacion
 * @property string      $cod_centro
 * @property string      $cod_universidad
 * @property string      $titulacion
 * @property string      $nivel           GRADO | MASTER | etc.
 * @property string|null $tipo_universidad
 * @property string|null $tipo_centro
 * @property string|null $nombre_centro
 * @property string|null $nombre_universidad
 * @property string|null $ccaa
 * @property string|null $provincia
 * @property string|null $cod_provincia
 * @property string|null $modalidad
 * @property bool        $idioma_extranjero
 * @property float|null  $nota_corte
 * @property string      $anio            Curso académico, ej: "2025-2026"
 * @property string      $source
 */
class UniversityCutoffGrade extends Model
{
    protected $table = 'university_cutoff_grades';

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
        'nota_corte',
        'anio',
        'source',
    ];

    protected $casts = [
        'idioma_extranjero' => 'boolean',
        'nota_corte'        => 'float',
    ];

    // ------------------------------------------------------------------
    // Scopes
    // ------------------------------------------------------------------

    /** Filtra por CCAA (exacto, case-insensitive). */
    public function scopeCcaa($query, string $ccaa)
    {
        return $query->where('ccaa', 'like', $ccaa);
    }

    /** Solo registros con nota de corte. */
    public function scopeConNota($query)
    {
        return $query->whereNotNull('nota_corte');
    }

    /** Filtra por nivel de titulación (GRADO, MASTER…). */
    public function scopeNivel($query, string $nivel)
    {
        return $query->where('nivel', strtoupper($nivel));
    }

    /** Búsqueda por nombre de titulación (LIKE). */
    public function scopeBuscar($query, string $q)
    {
        return $query->where('titulacion', 'like', "%{$q}%");
    }

    /** Año académico más reciente disponible en la tabla. */
    public static function latestAnio(): string
    {
        return static::max('anio') ?? '2025-2026';
    }
}
