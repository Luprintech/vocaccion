<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ItinerarioGenerado extends Model
{
    protected $table = 'itinerarios_generados';

    protected $fillable = [
        'user_id',
        'profesion',
        'ccaa',
        'texto_html',
    ];

    protected $casts = [
        'texto_html' => 'array', // Parsea automáticamente JSON
    ];


    /**
     * Relación con el usuario
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'user_id');
    }
}
