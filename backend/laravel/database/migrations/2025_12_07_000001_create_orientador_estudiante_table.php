<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Tabla pivote para la relación orientador-estudiante.
     * Un orientador puede tener múltiples estudiantes asignados.
     */
    public function up(): void
    {
        Schema::create('orientador_estudiante', function (Blueprint $table) {
            $table->id();
            $table->foreignId('orientador_id')->constrained('usuarios')->onDelete('cascade');
            $table->foreignId('estudiante_id')->constrained('usuarios')->onDelete('cascade');
            $table->timestamp('fecha_asignacion')->useCurrent();
            $table->text('notas')->nullable(); // Notas del orientador sobre el estudiante
            $table->enum('estado', ['activo', 'inactivo', 'completado'])->default('activo');
            $table->timestamps();

            // Un estudiante solo puede estar asignado a un orientador a la vez
            $table->unique(['estudiante_id']);
            $table->index('orientador_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('orientador_estudiante');
    }
};
