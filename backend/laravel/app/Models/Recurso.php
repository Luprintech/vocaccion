<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Recurso
 * 
 * Modelo para gestionar recursos compartidos por orientadores a sus estudiantes.
 * 
 * @property int $id
 * @property string $titulo
 * @property string $descripcion
 * @property string $url_archivo
 * @property string $tipo (pdf, video, enlace, documento)
 * @property int $orientador_id
 * @property Carbon $created_at
 * @property Carbon $updated_at
 */
class Recurso extends Model
{
    protected $table = 'recursos_orientador';

    protected $fillable = [
        'titulo',
        'slug',
        'descripcion',
        'tipo',
        'enlace',
        'tiempo_lectura',
        'destacado',
        'user_id',
        'visualizaciones',
        'descargas'
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];

    /**
     * Relación: Un recurso pertenece a un orientador
     */
    public function orientador(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'orientador_id');
    }
}
