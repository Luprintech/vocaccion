<?php
    namespace App\Models;

    use Illuminate\Database\Eloquent\Model;
    use Illuminate\Database\Eloquent\Relations\BelongsToMany;
    use Illuminate\Support\Str;

    class Tags extends Model {

        //  Atributos aceptados cuando se use create() o update()
        protected $fillable = [
            'nombre',
            'slug'
        ];

        /**
         * Asignar valores automáticamente, en este caso necesito asignar el slug cuando se cree el tag
         */
        protected static function boot() {
            parent::boot();

            //  Generar slug al crear el tag
            static::creating (function ($model) {
                if (empty($model->slug)) {
                    $model->slug = Str::slug($model->nombre);
                }
            });
        }

        /**
         * Relación: Las guías asociadas a este tag
         */
        public function guias(): BelongsToMany {
            return $this->belongsToMany(Guia::class, 'guia_tag', 'tag_id', 'guia_id');
        }

        /**
         * Scope: Filtrar tags por su slug
         */
        public function scopeBySlug($query, $slug) {
            return $query->where('slug', $slug);
        }
    }
?>
