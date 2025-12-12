<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TestAnalytics extends Model
{
    protected $fillable = [
        'session_id',
        'usuario_id',
        'question_number',
        'event_type',
        'time_spent_seconds',
        'area_detected',
        'regenerated',
        'metadata'
    ];

    protected $casts = [
        'metadata' => 'array',
        'regenerated' => 'boolean'
    ];

    // Relaciones
    public function session()
    {
        return $this->belongsTo(TestSesion::class, 'session_id');
    }

    public function usuario()
    {
        return $this->belongsTo(\App\Models\Usuario::class, 'usuario_id');
    }
}
