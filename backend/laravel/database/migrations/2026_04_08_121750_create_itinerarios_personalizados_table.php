<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('itinerarios_personalizados', function (Blueprint $table) {
            $table->id();
            $table->foreignId('usuario_id')->constrained('usuarios')->onDelete('cascade');
            $table->foreignId('profesion_id')->constrained('career_catalog')->onDelete('cascade');
            
            // Contexto del usuario en momento de generación
            $table->string('ccaa')->nullable();
            $table->integer('edad_usuario')->nullable();
            $table->string('nivel_educativo')->nullable();
            
            // Contenido del itinerario (JSON completo de Gemini)
            $table->json('contenido');
            
            // Metadatos
            $table->boolean('es_fallback')->default(false); // Si usó fallback genérico o Gemini
            $table->timestamp('generado_en')->useCurrent();
            
            // Índices para búsquedas rápidas
            $table->index(['usuario_id', 'profesion_id']);
            $table->index('ccaa');
            
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('itinerarios_personalizados');
    }
};
