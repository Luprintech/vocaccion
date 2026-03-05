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
        // 1. Perfil Vocacional Persistente (Resultados A cumulados)
        Schema::create('vocational_profiles', function (Blueprint $table) {
            $table->id();

            // FK a la tabla de usuarios existente
            $table->foreignId('usuario_id')->constrained('usuarios')->onDelete('cascade');

            // RIASEC Scores (0-100) - Normalizados para consultas SQL directas
            $table->integer('realistic_score')->default(0);
            $table->integer('investigative_score')->default(0);
            $table->integer('artistic_score')->default(0);
            $table->integer('social_score')->default(0);
            $table->integer('enterprising_score')->default(0);
            $table->integer('conventional_score')->default(0);

            // Metadata rica y flexible
            $table->string('dominant_archetype')->nullable(); // Ej: "Creador Social"
            $table->json('top_skills')->nullable(); // ["Liderazgo", "Diseño UI"]
            $table->json('recommended_careers')->nullable(); // ["UX Designer", "Product Manager"]

            $table->timestamps();
        });

        // 2. Sesión de Test Activa (Estado Conversacional)
        Schema::create('vocational_sessions', function (Blueprint $table) {
            // Usamos UUID para evitar enumeración y colisiones en frontend si se expone
            $table->uuid('id')->primary();

            $table->foreignId('usuario_id')->constrained('usuarios')->onDelete('cascade');

            // Estado del Motor Conversacional
            $table->string('current_phase')->default('warm_up'); // warm_up, exploration, validation, done
            $table->integer('question_count')->default(0);

            // Log ligero para contexto del LLM (max últimas 10 interacciones o tokens limitados)
            $table->json('history_log')->nullable();

            // Control de Tokens y Costes
            $table->integer('tokens_used')->default(0);
            $table->boolean('is_completed')->default(false);

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::disableForeignKeyConstraints();
        Schema::dropIfExists('vocational_sessions');
        Schema::dropIfExists('vocational_profiles');
        Schema::enableForeignKeyConstraints();
    }
};
