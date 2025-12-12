<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Formacion extends Model
{
    use HasFactory;

    /**
     * Nombre de la tabla en la base de datos.
     */
    protected $table = 'formaciones';

    /**
     * Los atributos que se pueden asignar masivamente.
     */
    protected $fillable = [
        'perfil_id',
        'nivel',
        'centro_estudios',
        'titulo_obtenido',
        'fecha_inicio',
        'fecha_fin',
        'cursando_actualmente'
    ];

    /**
     * Verifica si la formación tiene todos los campos obligatorios
     */
    public function estaCompleta(): bool
    {
        return !empty($this->nivel) && 
               !empty($this->centro_estudios) && 
               !empty($this->titulo_obtenido) && 
               !empty($this->fecha_inicio);
    }

    /**
     * Los atributos que deben ser convertidos.
     */
    protected $casts = [
        'fecha_inicio' => 'date',
        'fecha_fin' => 'date',
        'cursando_actualmente' => 'boolean'
    ];

    /**
     * Relación con Perfil
     */
    public function perfil(): BelongsTo
    {
        return $this->belongsTo(Perfil::class);
    }

    /**
     * Accessor para mostrar el estado de estudio
     */
    public function getEstadoAttribute(): string
    {
        return $this->cursando_actualmente ? 'En curso' : 'Finalizado';
    }

    /**
     * Scope para formaciones en curso
     */
    public function scopeEnCurso($query)
    {
        return $query->where('cursando_actualmente', true);
    }

    /**
     * Scope para formaciones finalizadas
     */
    public function scopeFinalizadas($query)
    {
        return $query->where('cursando_actualmente', false);
    }
}
