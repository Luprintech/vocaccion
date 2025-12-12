<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Plan extends Model
{
    use HasFactory;

    protected $table = 'planes';

    protected $fillable = [
        'nombre',
        'slug',
        'precio',
        'moneda',
        'descripcion',
        'features',
    ];

    protected $casts = [
        'features' => 'array',
        'precio' => 'decimal:2',
    ];
}
