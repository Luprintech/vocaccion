<?php
    namespace App\Models;

    use Illuminate\Database\Eloquent\Model;
    use Illuminate\Database\Eloquent\Relations\BelongsTo;
    use Illuminate\Database\Eloquent\Relations\HasMany;
    use Illuminate\Database\Eloquent\Relations\BelongsToMany;
    use Illuminate\Database\Eloquent\SoftDeletes;
    use Illuminate\Support\Str;

    class Guia extends Model {
        use SoftDeletes;

        //  Atributos aceptados cuando se use create() o update()
        protected $fillable = [
            'titulo',
            'categoria',
            'descripcion',
            'path_pdf',
            'tamanio',
            'numero_paginas',
            'imagen_portada',
            'visibilidad',
            'esta_publicado',
            'fecha_publicacion',
            'usuario_id'
        ];

        //  Atributos que se agregan al modelo cuando se convierte a array o JSON
        protected $appends = [
            'imagen_portada_url',
            'tamanio_archivo_formateado',
        ];

        //  Conversión automática de atributos a tipos nativos
        protected $casts = [
            'tamanio' => 'integer',
            'numero_paginas' => 'integer',
            'esta_publicado' => 'boolean',
            'fecha_publicacion' => 'datetime',
            'descargas' => 'integer',
            'vistas' => 'integer',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];

        /**
         * Asignar valores automáticamente, en este caso necesito asignar el slug cuando se cree la guía o se modifique el título de la misma
         */
        protected static function boot() {
            parent::boot();

            //  Generar slug al crear la guía
            static::creating(function ($model) {
                if (!$model->slug) {
                    $model->slug = Str::slug($model->titulo);
                }
            });

            //  Generar nuevo slug si el título de la guía se modifica
            static::updating(function ($model) {
                if ($model->isDirty('titulo')) {
                    $model->slug = Str::slug($model->titulo);
                }
            });
        }

        /**
         * Relación: Autor de la guía
         */
        public function author(): BelongsTo {
            return $this->belongsTo(Usuario::class, 'usuario_id');
        }

        /**
         * Relación: Descargas
         */
        public function downloads(): HasMany {
            return $this->hasMany(GuiaDescarga::class, 'guia_id', 'id');
        }

        /**
         * Relación: Tags
         */
        public function tags(): BelongsToMany {
            return $this->belongsToMany(Tags::class, 'guia_tag', 'guia_id', 'tag_id');
        }

        /**
         * Scope: Solo guías públicas
         */
        public function scopePublic($query) {
            return $query->where('visibilidad', 'publico');
        }

        /**
         * Scope: Solo guías premium
         */
        public function scopePremium($query) {
            return $query->where('visibilidad', 'privado');
        }

        /**
         * Scope: Solo guías publicadas
         */
        public function scopePublished($query) {
            return $query->where('esta_publicado', true);
        }

        /**
         * Scope: Por categoría
         */
        public function scopeCategory($query, $category) {
            return $query->where('categoria', $category);
        }

        /**
         * Scope: Por tag
         */
        public function scopeTag($query, $tag) {
            return $query->whereHas('tags', function ($q) use ($tag) {
                $q->where('slug', 'like', '%' . $tag . '%');
            });
        }

        /**
         * Scope: Búsqueda full text
         */
        public function scopeSearch($query, $search) {
            return $query->whereFullText(['titulo', 'descripcion'], $search);
        }

        /**
         * Obtener tamaño formateado
         */
        public function getTamanioArchivoFormateadoAttribute(): string {
            $bytes = $this->tamanio;
            $units = ['B', 'KB', 'MB', 'GB'];

            for ($i = 0; $bytes > 1024; $i++) {
                $bytes /= 1024;
            }

            return round($bytes, 2) . ' ' . $units[$i];
        }

        /**
         * Verificar si el usuario ya descargó
         */
        public function hasUserDownloaded(Usuario $user): bool {
            return $this->downloads()->where('usuario_id', $user->id)->exists();
        }

        /**
         * Incrementar contador de descargas
         */
        public function incrementDownloadCount(): void {
            $this->increment('descargas');
        }

        /**
         * Atributo para obtener ruta de imagen
         */
        public function getImagenPortadaUrlAttribute(): string {
            return asset('storage/' . $this->imagen_portada);
        }

        /**
         * Obtener ruta de PDF
         */
        public function getPdfUrl(): string {
            return route('guias.download', $this->id);
        }

        /**
         * Ruta de imagen usando el alias del atributo
         */
        public function getThumbnailUrl(): string {
            return $this->imagen_portada_url;
        }

        /**
         * Registrar descarga del usuario sobre esa guía o actualizarla si ya existe
         */
        public function recordDownload(Usuario $user): GuiaDescarga {
            return $this->downloads()->updateOrCreate(
                ['guia_id' => $this->id, 'usuario_id' => $user->id],
                [
                    'ip_address' => request()->ip(),
                    'user_agent' => request()->userAgent(),
                ]
            );
        }
    }
?>
