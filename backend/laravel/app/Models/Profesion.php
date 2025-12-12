<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Profesion extends Model
{
    protected $table = 'profesiones';

    protected $fillable = [
        'titulo',
        'descripcion',
        'salidas',
        'formacion_recomendada',
        'habilidades',
        'imagen_url',
        'formaciones_necesarias',
        'pexels_prompt',
    ];

    protected $casts = [
        'habilidades' => 'array',
        'formaciones_necesarias' => 'array',
    ];

    public function objetivos()
    {
        return $this->hasMany(ObjetivoProfesional::class, 'profesion_id');
    }
}
