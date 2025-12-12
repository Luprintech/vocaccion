<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RecomendacionIA extends Model
{
    protected $table = 'recomendaciones_ia'; 

    protected $fillable = [
        'resultado_id',
        'texto_recomendacion',
    ];

    public function resultado(): BelongsTo
    {
        return $this->belongsTo(Resultado::class, 'resultado_id');
    }
}
