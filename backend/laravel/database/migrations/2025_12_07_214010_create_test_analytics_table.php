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
        Schema::create('test_analytics', function (Blueprint $table) {
            $table->id();
            $table->foreignId('session_id')->constrained('test_sessions')->onDelete('cascade');
            $table->foreignId('usuario_id')->constrained('usuarios')->onDelete('cascade');
            $table->integer('question_number')->nullable();
            $table->string('event_type'); // 'question_answered', 'question_regenerated', 'test_completed', 'test_abandoned'
            $table->integer('time_spent_seconds')->nullable();
            $table->string('area_detected')->nullable();
            $table->boolean('regenerated')->default(false);
            $table->json('metadata')->nullable(); // Para datos adicionales
            $table->timestamps();

            // Índices para consultas rápidas
            $table->index('event_type');
            $table->index('question_number');
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('test_analytics');
    }
};
