<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Experiencia extends Model
{
    use HasFactory;

    /**
     * Nombre de la tabla en la base de datos.
     */
    protected $table = 'experiencias';

    /**
     * Los atributos que se pueden asignar masivamente.
     */
    protected $fillable = [
        'perfil_id',
        'puesto',
        'empresa',
        'fecha_inicio',
        'fecha_fin',
        'descripcion',
        'trabajando_actualmente'
    ];

    /**
     * Los atributos que deben ser convertidos.
     */
    protected $casts = [
        'fecha_inicio' => 'date',
        'fecha_fin' => 'date',
        'trabajando_actualmente' => 'boolean',
    ];

    /**
     * Relación con Perfil
     */
    public function perfil(): BelongsTo
    {
        return $this->belongsTo(Perfil::class);
    }

    /**
     * Accessor para mostrar el estado laboral
     */
    public function getEstadoAttribute(): string
    {
        return $this->trabajando_actualmente ? 'Actual' : 'Anterior';
    }

    /**
     * Scope para experiencias actuales
     */
    public function scopeActuales($query)
    {
        return $query->where('trabajando_actualmente', true);
    }

    /**
     * Scope para experiencias anteriores
     */
    public function scopeAnteriores($query)
    {
        return $query->where('trabajando_actualmente', false);
    }

    /**
     * Verifica si la experiencia tiene todos los campos obligatorios
     */
    public function estaCompleta(): bool
    {
        return !empty($this->puesto) && 
               !empty($this->empresa) && 
               !empty($this->fecha_inicio);
    }

    /**
     * Calcular duración de la experiencia en meses
     */
    public function getDuracionEnMeses(): int
    {
        $fechaFin = $this->trabajando_actualmente ? now() : $this->fecha_fin;
        return $this->fecha_inicio->diffInMonths($fechaFin);
    }
}
