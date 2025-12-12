<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Perfil extends Model
{
    use HasFactory;

    /**
     * Nombre de la tabla en la base de datos.
     */
    protected $table = 'perfiles';

    /**
     * Los atributos que se pueden asignar masivamente.
     */
    protected $fillable = [
        'usuario_id',
        'nombre',
        'apellidos',
        'ciudad',
        'dni',
        'fecha_nacimiento',
        'telefono'
    ];

    /**
     * Los atributos que deben ser convertidos.
     */
    protected $casts = [
        'fecha_nacimiento' => 'date',
    ];

    /**
     * Relación con Usuario
     */
    public function usuario(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'usuario_id');
    }

    /**
     * Relación con Formaciones
     */
    public function formaciones(): HasMany
    {
        return $this->hasMany(Formacion::class);
    }

    /**
     * Relación con Experiencias
     */
    public function experiencias(): HasMany
    {
        return $this->hasMany(Experiencia::class);
    }

    /**
     * Relación con Idiomas
     */
    public function idiomas(): HasMany
    {
        return $this->hasMany(Idioma::class);
    }

    /**
     * Relación con Habilidades
     */
    public function habilidades(): HasMany
    {
        return $this->hasMany(Habilidad::class);
    }

    /**
     * Relación con Intereses
     */
    public function intereses(): HasMany {
        return $this->hasMany(Interes::class);
    }

    /**
     * Obtener el perfil completo con todas las relaciones
     */
    public function getPerfilCompleto()
    {
        return $this->load([
            'formaciones',
            'experiencias',
            'idiomas',
            'habilidades',
            'intereses'
        ]);
    }

    /**
     * Devuelve true si el perfil tiene los datos básicos completos
    */
    public function estaCompleto(): bool {
        return !empty($this->nombre) && !empty($this->apellidos) && !empty($this->ciudad);
    }
}
