<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Mensaje extends Model
{
    /**
     * Campos asignables masivamente
     */
    protected $fillable = [
        'emisor_id',
        'receptor_id',
        'contenido',
        'archivo',
        'nombre_archivo',
        'tipo_archivo',
        'leido',
    ];

    /**
     * Relación: Mensaje pertenece a un emisor (Usuario)
     */
    public function emisor()
    {
        return $this->belongsTo(Usuario::class, 'emisor_id');
    }

    /**
     * Relación: Mensaje pertenece a un receptor (Usuario)
     */
    public function receptor()
    {
        return $this->belongsTo(Usuario::class, 'receptor_id');
    }
}
