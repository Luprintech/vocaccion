<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $usuario_id
 * @property int $current_index
 * @property int $total_questions
 * @property array $questions
 * @property array $historial
 * @property array|null $answers
 * @property string|null $area
 * @property string|null $subarea
 * @property string|null $role
 * @property string $estado
 * @property array|null $resultados
 * @property string|null $last_request_id
 * @property array|null $last_response
 * @property string|null $user_summary
 * @property array|null $covered_domains
 * @property \Illuminate\Support\Carbon|null $completed_at
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 */
class TestSesion extends Model
{
    protected $table = 'test_sessions';

    protected $fillable = [
        'usuario_id',
        'current_index',
        'total_questions',
        'questions',
        'historial',
        'area',
        'subarea',
        'role',
        'estado',
        'answers', // Mantenemos por compatibilidad temporal si es necesario, pero el historial es el nuevo estándar
        'completed_at',
        'resultados',
        'last_request_id',
        'last_response',
        'user_summary',
        'covered_domains',
        'semantic_areas',
        'semantic_history'
    ];

    protected $casts = [
        'questions' => 'array',
        'historial' => 'array',
        'answers' => 'array',
        'completed_at' => 'datetime',
        'resultados' => 'array',
        'last_response' => 'array',
        'covered_domains' => 'array',
        'semantic_areas' => 'array',
        'semantic_history' => 'array',
    ];

    /**
     * Relación: una sesión pertenece a un usuario
     */
    public function usuario(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'usuario_id'); // Asumiendo modelo Usuario
    }

    // ==========================================
    // MÉTODOS HELPERS DEL TEST PROGRESIVO
    // ==========================================

    /**
     * Inicializa una nueva sesión de test con valores por defecto.
     */
    public function initialize()
    {
        $this->current_index = 0;
        $this->total_questions = 20;
        $this->questions = [];
        $this->historial = [];
        $this->area = null;
        $this->subarea = null;
        $this->role = null;
        $this->estado = 'en_progreso';
        $this->answers = []; // Limpiar legacy
        $this->completed_at = null;
        $this->save();
    }

    /**
     * Añade una pregunta generada al array de preguntas.
     * 
     * @param array $question Estructura de la pregunta
     */
    public function addQuestion($question)
    {
        $questions = $this->questions ?? [];
        $questions[] = $question;
        $this->questions = $questions;
        $this->save();
    }

    /**
     * Añade una respuesta al historial.
     * 
     * @param string|int $preguntaId
     * @param string $textoPregunta
     * @param string $respuesta
     */
    public function addAnswer($preguntaId, $textoPregunta, $respuesta)
    {
        // 1. Actualizar Historial (Nuevo sistema)
        $historial = $this->historial ?? [];
        $historial[] = [
            'pregunta_id' => $preguntaId,
            'texto_pregunta' => $textoPregunta,
            'respuesta' => $respuesta,
            'timestamp' => now()->toIso8601String()
        ];
        $this->historial = $historial;

        // 2. Actualizar Answers (Legacy / Compatibilidad UserTestController)
        $answers = $this->answers ?? [];
        // Formato simple key-value o array de objetos según lo que espere el frontend antiguo
        // Asumimos array de objetos simple para mantener consistencia
        $answers[] = ['id' => $preguntaId, 'respuesta' => $respuesta];
        $this->answers = $answers;

        $this->save();
    }

    /**
     * Borra preguntas e historial desde un índice dado.
     * Útil cuando el usuario retrocede y cambia una respuesta anterior.
     * 
     * @param int $index Índice (0-based) desde donde borrar (inclusive)
     */
    public function resetFromIndex($index)
    {
        // Recortar preguntas
        $questions = $this->questions ?? [];
        if (count($questions) > $index) {
            $this->questions = array_slice($questions, 0, $index);
        }

        // Recortar historial
        $historial = $this->historial ?? [];
        if (count($historial) > $index) {
            $this->historial = array_slice($historial, 0, $index);
        }

        // Recortar answers (Legacy)
        $answers = $this->answers ?? [];
        if (count($answers) > $index) {
            $this->answers = array_slice($answers, 0, $index);
        }

        $this->current_index = $index;
        $this->save();
    }

    /**
     * Devuelve la última respuesta del historial o null.
     */
    public function getLastAnswer()
    {
        $historial = $this->historial ?? [];
        if (empty($historial)) {
            return null;
        }
        return end($historial);
    }

    /**
     * Devuelve un array compacto con el estado actual del test.
     */
    public function toStateArray()
    {
        return [
            'area' => $this->area,
            'subarea' => $this->subarea,
            'role' => $this->role,
            'current_index' => $this->current_index,
            'total_questions' => $this->total_questions,
            'estado' => $this->estado
        ];
    }

    // ==========================================
    // MÉTODOS SEMÁNTICOS
    // ==========================================

    /**
     * Inicializa el sistema de áreas semánticas con la definición proporcionada.
     * 
     * @param array $definition Definición de áreas semánticas con keywords y pesos
     */
    public function initializeSemanticAreas(array $definition)
    {
        $this->semantic_areas = $definition;
        $this->semantic_history = [];
        $this->save();
    }

    /**
     * Actualiza los pesos de las áreas semánticas basándose en una respuesta.
     * 
     * @param array $areaWeights Array asociativo de área => peso a sumar
     */
    public function updateSemanticAreas(array $areaWeights)
    {
        $semanticAreas = $this->semantic_areas ?? [];

        foreach ($areaWeights as $area => $weight) {
            if (isset($semanticAreas[$area])) {
                $semanticAreas[$area]['weight'] = ($semanticAreas[$area]['weight'] ?? 0) + $weight;
            }
        }

        $this->semantic_areas = $semanticAreas;
        $this->save();
    }

    /**
     * Obtiene el área semántica con mayor peso.
     * 
     * @return array|null ['area' => string, 'weight' => int, 'second_weight' => int]
     */
    public function getTopSemanticArea()
    {
        $semanticAreas = $this->semantic_areas ?? [];

        if (empty($semanticAreas)) {
            return null;
        }

        // Ordenar por peso descendente
        $sorted = $semanticAreas;
        uasort($sorted, function ($a, $b) {
            return ($b['weight'] ?? 0) <=> ($a['weight'] ?? 0);
        });

        $keys = array_keys($sorted);
        $topArea = $keys[0] ?? null;
        $topWeight = $sorted[$topArea]['weight'] ?? 0;
        $secondWeight = isset($keys[1]) ? ($sorted[$keys[1]]['weight'] ?? 0) : 0;

        return [
            'area' => $topArea,
            'weight' => $topWeight,
            'second_weight' => $secondWeight,
            'margin' => $topWeight - $secondWeight
        ];
    }

    /**
     * Añade una entrada al historial semántico.
     * 
     * @param int $questionIndex
     * @param string $response
     * @param array $detectedAreas
     */
    public function addSemanticHistory(int $questionIndex, string $response, array $detectedAreas)
    {
        $history = $this->semantic_history ?? [];
        $history[] = [
            'question_index' => $questionIndex,
            'response' => substr($response, 0, 100), // Guardar solo primeros 100 chars
            'detected_areas' => $detectedAreas,
            'timestamp' => now()->toIso8601String()
        ];
        $this->semantic_history = $history;
        $this->save();
    }
}
