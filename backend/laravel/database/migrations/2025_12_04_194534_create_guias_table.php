<?php
    use Illuminate\Database\Migrations\Migration;
    use Illuminate\Database\Schema\Blueprint;
    use Illuminate\Support\Facades\Schema;

    return new class extends Migration {
        /**
         * Run the migrations.
         */
        public function up(): void {
            Schema::create('guias', function (Blueprint $table) {
                $table->id();

                //  Información básica
                $table->string('titulo');
                $table->string('slug')->unique();
                $table->enum('categoria', [
                    'profesiones',
                    'estudios',
                    'competencias',
                    'tecnicas',
                    'otro'
                ]);
                $table->text('descripcion');

                //  Metadatos
                $table->string('path_pdf');
                $table->unsignedBigInteger('tamanio')->default(0);
                $table->unsignedBigInteger('descargas')->default(0);
                $table->unsignedBigInteger('vistas')->default(0);
                $table->unsignedInteger('numero_paginas')->default(0);
                $table->string('imagen_portada')->nullable();

                //  Autor, visibilidad, estado, fecha de publicaión y timestamps
                //  Cosas a tener en cuenta, a pesar de tener un timestamp que me indica la fecha de creación quiero poder saber la fecha real de publicación por si se queda como borrador
                $table->foreignId('usuario_id')->constrained('usuarios')->onDelete('cascade');
                $table->enum('visibilidad', ['publico', 'privado']);
                $table->boolean('esta_publicado')->default(false);
                $table->timestamp('fecha_publicacion')->nullable();
                $table->timestamps();

                //  Hacemos un soft delete para en un futuro poder implementar la recuperación de guías borradas
                $table->softDeletes();

                // Índice para búsquedas por filtros
                $table->index(['titulo', 'categoria']);
                $table->index('visibilidad');
                $table->index('usuario_id');
                $table->fullText(['titulo', 'descripcion']);
            });
        }

        /**
         * Reverse the migrations.
         */
        public function down(): void {
            Schema::dropIfExists('guias');
        }
    };
?>
