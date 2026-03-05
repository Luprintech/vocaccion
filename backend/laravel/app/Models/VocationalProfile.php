<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VocationalProfile extends Model
{
    use HasFactory;

    protected $fillable = [
        'usuario_id',
        'realistic_score',
        'investigative_score',
        'artistic_score',
        'social_score',
        'enterprising_score',
        'conventional_score',
        'dominant_archetype',
        'top_skills',
        'recommended_careers'
    ];

    protected $casts = [
        'top_skills' => 'array',
        'recommended_careers' => 'array',
    ];

    /**
     * El usuario propietario del perfil.
     */
    public function usuario(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'usuario_id');
    }

    /**
     * Calcula dinámicamente el arquetipo dominante basado en scores.
     * Ejemplo: "Investigador Artístico" si I y A son los más altos.
     */
    public function calculateArchetype()
    {
        $scores = [
            'Realista' => $this->realistic_score,
            'Investigador' => $this->investigative_score,
            'Artístico' => $this->artistic_score,
            'Social' => $this->social_score,
            'Emprendedor' => $this->enterprising_score,
            'Convencional' => $this->conventional_score,
        ];

        arsort($scores);

        // Tomar los 2 primeros
        $top2 = array_slice($scores, 0, 2);
        $keys = array_keys($top2);

        return implode(' ', $keys);
    }
}
