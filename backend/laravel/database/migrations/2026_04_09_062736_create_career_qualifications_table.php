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
     * Tabla pivot: Relación entre profesiones del catálogo vocacional y cualificaciones profesionales CNCP
     * Permite asociar múltiples cualificaciones a cada profesión y viceversa
     */
    public function up(): void
    {
        Schema::create('career_qualifications', function (Blueprint $table) {
            $table->id();
            
            // Relaciones
            $table->foreignId('career_catalog_id')->constrained('career_catalog')->cascadeOnDelete();
            $table->foreignId('professional_qualification_id')->constrained('professional_qualifications')->cascadeOnDelete();
            
            // Tipo de relación
            $table->enum('tipo', ['obligatoria', 'recomendada', 'complementaria'])->default('recomendada')
                ->comment('Nivel de necesidad de la cualificación para la profesión');
            
            // Relevancia (0-100)
            $table->tinyInteger('relevancia')->default(50)->comment('Porcentaje de relevancia (0-100)');
            
            // Observaciones
            $table->text('observaciones')->nullable()->comment('Notas sobre cómo se relaciona con la profesión');
            
            $table->timestamps();
            
            // Índices y constraints
            $table->unique(['career_catalog_id', 'professional_qualification_id'], 'career_qualification_unique');
            $table->index(['tipo', 'relevancia']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('career_qualifications');
    }
};
