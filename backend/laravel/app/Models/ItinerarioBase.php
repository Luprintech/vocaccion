<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ItinerarioBase extends Model
{
    protected $table = 'itinerarios_base';

    protected $fillable = [
        'profesion_id',
        'nivel',
        'pasos',
        'descripcion'
    ];

    protected $casts = [
        'pasos' => 'array',
    ];

    public function profesion()
    {
        return $this->belongsTo(Profesion::class, 'profesion_id');
    }
}

