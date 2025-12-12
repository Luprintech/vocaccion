<?php
    namespace App\Models;

    use Illuminate\Database\Eloquent\Model;
    use Illuminate\Database\Eloquent\Relations\BelongsTo;

    class GuiaDescarga extends Model {

        //  Atributos aceptados cuando se use create() o update()
        protected $fillable = [
            'guia_id',
            'usuario_id',
            'ip_address',
            'user_agent',
        ];

        //  Conversión automática de atributos a tipos nativos
        protected $casts = [
            'created_at' => 'datetime',
            'updated_at' => 'datetime'
        ];

        /**
         * Relación: Esta descarga pertenece a una guía
         */
        public function guide(): BelongsTo {
            return $this->belongsTo(Guia::class, 'guia_id', 'id');
        }

        /**
         * Relación: Esta descarga pertenece a un usuario
         */
        public function user(): BelongsTo {
            return $this->belongsTo(Usuario::class, 'usuario_id', 'id');
        }
    }
?>
