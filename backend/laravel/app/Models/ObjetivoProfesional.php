<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\Usuario;



class ObjetivoProfesional extends Model
{
    protected $table = 'objetivo_profesional';

    protected $fillable = [
        'user_id',
        'profesion_id',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'user_id');
    }

    public function profesion(): BelongsTo
    {
        return $this->belongsTo(Profesion::class, 'profesion_id');
    }
}
