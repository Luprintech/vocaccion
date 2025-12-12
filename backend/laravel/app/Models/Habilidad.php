<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Habilidad extends Model
{
    use HasFactory;

    /**
     * Nombre de la tabla en la base de datos.
     */
    protected $table = 'habilidades';

    /**
     * Los atributos que se pueden asignar masivamente.
     */
    protected $fillable = [
        'perfil_id',
        'nombre'
    ];


    /**
     * Relación con Perfil
     */
    public function perfil(): BelongsTo
    {
        return $this->belongsTo(Perfil::class);
    }

    /**
     * Scope para buscar habilidades por nombre
     */
    public function scopePorNombr($query, $nombre) {
        return $query->where('nombre', 'like', "%$nombre%");
    }
}
?>
