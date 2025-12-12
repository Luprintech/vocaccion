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
        Schema::create('mensajes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('emisor_id')
                  ->constrained('usuarios')
                  ->cascadeOnDelete();
            $table->foreignId('receptor_id')
                  ->constrained('usuarios')
                  ->cascadeOnDelete();
            $table->text('contenido');
            $table->boolean('leido')->default(false);
            $table->timestamps();
            
            // Índices para búsquedas rápidas
            $table->index(['emisor_id', 'receptor_id']);
            $table->index('leido');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('mensajes');
    }
};
