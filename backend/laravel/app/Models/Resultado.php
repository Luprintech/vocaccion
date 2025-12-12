<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Resultado extends Model
{
    protected $table = 'test_results';

    protected $fillable = [
        'usuario_id',
        'test_session_id',
        'answers',
        'result_text',
        'modelo',
        'saved_at',
        'profesiones',
    ];

    protected $casts = [
        'answers' => 'array',
        'profesiones' => 'array',
    ];

    public function session(): BelongsTo
    {
        return $this->belongsTo(TestSesion::class, 'test_session_id');
    }

    public function recomendacionIA(): HasOne
    {
        return $this->hasOne(RecomendacionIA::class, 'resultado_id');
    }
}
