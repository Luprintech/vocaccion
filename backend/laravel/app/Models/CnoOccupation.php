<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Ocupación del CNO-11 (Clasificación Nacional de Ocupaciones de España)
 * 
 * Estructura jerárquica de 4 niveles:
 * - Gran Grupo (1 dígito): 0-9
 * - Subgrupo Principal (2 dígitos)
 * - Subgrupo (3 dígitos)
 * - Grupo Primario (4 dígitos) ← nivel más específico
 * 
 * @property int $id
 * @property string $codigo_cno Código CNO-11 (1-4 dígitos)
 * @property string $denominacion Nombre oficial
 * @property int $nivel_jerarquico 1=Gran Grupo, 2=Subgrupo Principal, 3=Subgrupo, 4=Grupo Primario
 * @property string|null $codigo_padre Código del padre jerárquico
 * @property string $gran_grupo Primer dígito (0-9)
 * @property string $denominacion_gran_grupo Nombre del gran grupo
 * @property float $riasec_r Vector RIASEC Realista
 * @property float $riasec_i Vector RIASEC Investigador
 * @property float $riasec_a Vector RIASEC Artístico
 * @property float $riasec_s Vector RIASEC Social
 * @property float $riasec_e Vector RIASEC Emprendedor
 * @property float $riasec_c Vector RIASEC Convencional
 * @property int|null $career_catalog_id Relación con catálogo vocacional
 * @property bool $activo Estado
 */
class CnoOccupation extends Model
{
    protected $fillable = [
        'codigo_cno',
        'denominacion',
        'nivel_jerarquico',
        'codigo_padre',
        'gran_grupo',
        'denominacion_gran_grupo',
        'riasec_r',
        'riasec_i',
        'riasec_a',
        'riasec_s',
        'riasec_e',
        'riasec_c',
        'career_catalog_id',
        'activo',
        'notas',
    ];

    protected $casts = [
        'nivel_jerarquico' => 'integer',
        'riasec_r' => 'float',
        'riasec_i' => 'float',
        'riasec_a' => 'float',
        'riasec_s' => 'float',
        'riasec_e' => 'float',
        'riasec_c' => 'float',
        'activo' => 'boolean',
    ];

    /**
     * Ocupación padre en la jerarquía CNO
     */
    public function parent(): BelongsTo
    {
        return $this->belongsTo(CnoOccupation::class, 'codigo_padre', 'codigo_cno');
    }

    /**
     * Ocupaciones hijas en la jerarquía CNO
     */
    public function children(): HasMany
    {
        return $this->hasMany(CnoOccupation::class, 'codigo_padre', 'codigo_cno');
    }

    /**
     * Profesión del catálogo vocacional asociada
     */
    public function careerCatalog(): BelongsTo
    {
        return $this->belongsTo(CareerCatalog::class);
    }

    /**
     * Scope: Solo grupos primarios (nivel 4 - más específico)
     */
    public function scopePrimaryGroups($query)
    {
        return $query->where('nivel_jerarquico', 4);
    }

    /**
     * Scope: Por gran grupo
     */
    public function scopeByMainGroup($query, string $granGrupo)
    {
        return $query->where('gran_grupo', $granGrupo);
    }

    /**
     * Calcula similitud RIASEC con un perfil dado
     */
    public function riasecSimilarity(array $profile): float
    {
        $dotProduct = 
            $this->riasec_r * ($profile['R'] ?? 0) +
            $this->riasec_i * ($profile['I'] ?? 0) +
            $this->riasec_a * ($profile['A'] ?? 0) +
            $this->riasec_s * ($profile['S'] ?? 0) +
            $this->riasec_e * ($profile['E'] ?? 0) +
            $this->riasec_c * ($profile['C'] ?? 0);

        return max(0, min(100, $dotProduct * 100));
    }
}
