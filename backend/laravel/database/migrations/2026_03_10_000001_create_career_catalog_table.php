<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('career_catalog', function (Blueprint $table) {
            $table->id();

            // Identificación profesional
            $table->string('titulo');                        // "Arquitecto/a"
            $table->string('codigo_cno')->nullable();        // Código CNO-11 (ej: "2431")
            $table->string('codigo_esco')->nullable();       // Código ESCO (ej: "2161.1")

            // Clasificación sectorial
            $table->string('sector');                        // "Construcción, Arquitectura e Ingeniería"
            $table->string('familia_profesional')->nullable(); // Familia CNO más específica

            // Vector RIASEC (0.0 a 1.0 cada dimensión)
            $table->decimal('riasec_r', 3, 2)->default(0);   // Realista
            $table->decimal('riasec_i', 3, 2)->default(0);   // Investigador
            $table->decimal('riasec_a', 3, 2)->default(0);   // Artístico
            $table->decimal('riasec_s', 3, 2)->default(0);   // Social
            $table->decimal('riasec_e', 3, 2)->default(0);   // Emprendedor
            $table->decimal('riasec_c', 3, 2)->default(0);   // Convencional

            // Metadatos profesionales
            $table->string('nivel_formacion');               // "FP Superior", "Grado Universitario", etc.
            $table->string('nivel_salarial');                // "Bajo", "Medio", "Medio-alto", "Alto"
            $table->string('tipo_profesion');                // "tradicional", "emergente", "en_crecimiento"

            // Contenido descriptivo
            $table->text('descripcion_corta');               // 1-2 frases
            $table->json('salidas_profesionales');           // ["Rol 1", "Rol 2", "Rol 3"]
            $table->text('ruta_formativa');                  // Camino formativo concreto
            $table->json('habilidades_clave');               // ["habilidad1", "habilidad2", ...]

            $table->boolean('activo')->default(true);
            $table->timestamps();

            // Índices para búsquedas eficientes
            $table->index('sector');
            $table->index('nivel_formacion');
            $table->index('activo');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('career_catalog');
    }
};
