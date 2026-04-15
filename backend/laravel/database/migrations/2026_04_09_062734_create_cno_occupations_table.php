<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    /**
     * Tabla de Ocupaciones del CNO-11 (Clasificación Nacional de Ocupaciones)
     * Almacena la jerarquía completa de ocupaciones oficiales de España
     * Estructura jerárquica: Gran Grupo (1 dígito) → Subgrupo Principal → Subgrupo → Grupo Primario (4 dígitos)
     */
    public function up(): void
    {
        Schema::create('cno_occupations', function (Blueprint $table) {
            $table->id();
            
            // Código CNO-11 jerárquico
            $table->string('codigo_cno', 10)->unique()->comment('Código CNO-11 (1 a 4 dígitos)');
            $table->string('denominacion')->comment('Denominación oficial de la ocupación');
            
            // Jerarquía CNO
            $table->tinyInteger('nivel_jerarquico')->comment('1=Gran Grupo, 2=Subgrupo Principal, 3=Subgrupo, 4=Grupo Primario');
            $table->string('codigo_padre', 10)->nullable()->index()->comment('Código del nivel superior jerárquico');
            
            // Gran grupo (primer dígito)
            $table->char('gran_grupo', 1)->index()->comment('0-9: Directivos, Técnicos, etc.');
            $table->string('denominacion_gran_grupo', 200)->comment('Nombre del gran grupo');
            
            // Vectores RIASEC (estimados para ocupaciones completas)
            $table->decimal('riasec_r', 3, 2)->default(0)->comment('Realista');
            $table->decimal('riasec_i', 3, 2)->default(0)->comment('Investigador');
            $table->decimal('riasec_a', 3, 2)->default(0)->comment('Artístico');
            $table->decimal('riasec_s', 3, 2)->default(0)->comment('Social');
            $table->decimal('riasec_e', 3, 2)->default(0)->comment('Emprendedor');
            $table->decimal('riasec_c', 3, 2)->default(0)->comment('Convencional');
            
            // Mapeo con career_catalog
            $table->foreignId('career_catalog_id')->nullable()->constrained('career_catalog')->nullOnDelete()
                ->comment('Relación con profesión del catálogo vocacional');
            
            // Metadatos
            $table->boolean('activo')->default(true)->index();
            $table->text('notas')->nullable()->comment('Notas adicionales sobre la ocupación');
            
            $table->timestamps();
            
            // Índices
            $table->index(['gran_grupo', 'activo']);
            $table->index(['nivel_jerarquico', 'activo']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cno_occupations');
    }
};
