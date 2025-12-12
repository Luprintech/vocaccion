<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Rol extends Model
{
    use HasFactory;

    /**
     * Nombre de la tabla en la base de datos.
     */
    protected $table = 'roles';

    /**
     * Los atributos que se pueden asignar masivamente.
     */
    protected $fillable = [
        'nombre',
        'descripcion',
        'activo',
    ];

    /**
     * Los atributos que deben ser convertidos.
     */
    protected function casts(): array
    {
        return [
            'activo' => 'boolean',
        ];
    }

    /**
     * Relación muchos a muchos con Usuario.
     */
    public function usuarios()
    {
        return $this->belongsToMany(Usuario::class, 'rol_usuario', 'rol_id', 'usuario_id')->withTimestamps();
    }

    /**
     * Scope para roles activos.
     */
    public function scopeActivos($query)
    {
        return $query->where('activo', true);
    }

    /**
     * Verificar si el rol está activo.
     */
    public function estaActivo()
    {
        return $this->activo;
    }

    /**
     * Obtener el ID del rol estudiante.
     */
    public static function getEstudianteId()
    {
        return self::where('nombre', 'estudiante')->value('id');
    }
}
