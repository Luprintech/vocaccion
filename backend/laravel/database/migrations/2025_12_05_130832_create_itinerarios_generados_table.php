<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('itinerarios_generados', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('usuarios')->onDelete('cascade');
            $table->string('profesion');
            $table->string('ccaa')->nullable();
            $table->text('texto_html'); // Contenido generado por Gemini
            $table->timestamps();

            // Índice para búsqueda rápida
            $table->index(['user_id', 'profesion']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('itinerarios_generados');
    }
};
