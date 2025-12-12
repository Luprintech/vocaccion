<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CuentaSocial extends Model
{
    use HasFactory;

    /**
     * Nombre de la tabla en la base de datos.
     */
    protected $table = 'cuentas_sociales';

    /**
     * Los atributos que se pueden asignar masivamente.
     */
    protected $fillable = [
        'usuario_id',
        'proveedor',
        'proveedor_id',
        'proveedor_email',
        'proveedor_nombre',
        'avatar',
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
     * Relación muchos a uno con Usuario.
     */
    public function usuario()
    {
        return $this->belongsTo(Usuario::class, 'usuario_id');
    }

    /**
     * Scope para cuentas activas.
     */
    public function scopeActivas($query)
    {
        return $query->where('activo', true);
    }

    /**
     * Scope para filtrar por proveedor.
     */
    public function scopeProveedor($query, $proveedor)
    {
        return $query->where('proveedor', $proveedor);
    }
}
