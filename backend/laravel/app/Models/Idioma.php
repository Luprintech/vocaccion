<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Idioma extends Model
{
    use HasFactory;

    /**
     * Nombre de la tabla en la base de datos.
     */
    protected $table = 'idiomas';

    /**
     * Los atributos que se pueden asignar masivamente.
     */
    protected $fillable = [
        'perfil_id',
        'idioma',
        'nivel'
    ];

    /**
     * Relación con Perfil
     */
    public function perfil(): BelongsTo
    {
        return $this->belongsTo(Perfil::class);
    }

    /**
     * Scope para idiomas por nivel
     */
    public function scopePorNivel($query, string $nivel)
    {
        return $query->where('nivel', $nivel);
    }

    /**
     * Scope para idiomas nativos
     */
    public function scopeNativos($query)
    {
        return $query->where('nivel', 'nativo');
    }

    /**
     * Scope para idiomas avanzados o superiores
     */
    public function scopeAvanzados($query)
    {
        return $query->whereIn('nivel', ['avanzado', 'nativo']);
    }

    /**
     * Verifica si el idioma tiene todos los campos obligatorios
     */
    public function estaCompleto(): bool
    {
        return !empty($this->idioma) && !empty($this->nivel);
    }

    /**
     * Accessor para mostrar el nivel de manera más legible
     */
    public function getNivelFormateadoAttribute(): string
    {
        $niveles = [
            'basico' => 'Básico (A1-A2)',
            'intermedio' => 'Intermedio (B1-B2)',
            'avanzado' => 'Avanzado (C1-C2)',
            'nativo' => 'Nativo'
        ];

        return $niveles[$this->nivel] ?? ucfirst($this->nivel);
    }
}
