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
        Schema::create('recursos_orientador', function (Blueprint $table) {
            $table->id();
            $table->string('titulo');
            $table->text('descripcion')->nullable();
            $table->string('url_archivo'); // URL del archivo o enlace
            $table->enum('tipo', ['pdf', 'video', 'enlace', 'documento'])->default('enlace');
            $table->foreignId('orientador_id')->constrained('usuarios')->onDelete('cascade');
            $table->timestamps();

            // Índices para búsquedas rápidas
            $table->index('orientador_id');
            $table->index('tipo');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('recursos_orientador');
    }
};
