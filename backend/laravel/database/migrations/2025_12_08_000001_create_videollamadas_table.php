<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Tabla de videollamadas para orientadores.
     * Permite agendar sesiones de orientación virtual con estudiantes Pro Plus.
     */
    public function up(): void
    {
        Schema::create('videollamadas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('orientador_id')
                  ->constrained('usuarios')
                  ->cascadeOnDelete()
                  ->comment('Orientador que agenda la llamada');
            $table->foreignId('estudiante_id')
                  ->constrained('usuarios')
                  ->cascadeOnDelete()
                  ->comment('Estudiante invitado');
            $table->date('fecha')->comment('Fecha de la videollamada');
            $table->time('hora')->comment('Hora de inicio');
            $table->unsignedInteger('duracion')->default(30)->comment('Duración en minutos');
            $table->enum('estado', ['programada', 'en_curso', 'completada', 'cancelada'])
                  ->default('programada');
            $table->string('enlace', 255)->nullable()->comment('Enlace a la sala de videollamada');
            $table->text('notas')->nullable()->comment('Notas o tema a tratar');
            $table->timestamps();
            
            // Índices para búsquedas rápidas
            $table->index('orientador_id');
            $table->index('estudiante_id');
            $table->index('fecha');
            $table->index('estado');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('videollamadas');
    }
};
