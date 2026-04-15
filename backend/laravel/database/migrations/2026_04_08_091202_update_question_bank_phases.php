<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Actualiza el enum de 'phase' para incluir las nuevas fases del test RIASEC:
     * - activities (antes 'likert'): Actividades con escala Likert 5 puntos
     * - competencies (antes 'checklist'): Competencias autopercibidas Sí/No
     * - occupations (nueva): Atracción por ocupaciones Me atrae / No me atrae
     * - comparative (se mantiene): Comparaciones directas entre dimensiones
     */
    public function up(): void
    {
        if (Schema::getConnection()->getDriverName() === 'sqlite') {
            return;
        }

        // MySQL no permite modificar ENUMs directamente, hay que usar DB::statement
        \DB::statement("ALTER TABLE question_bank MODIFY COLUMN phase ENUM('likert', 'checklist', 'comparative', 'activities', 'competencies', 'occupations') NOT NULL");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::getConnection()->getDriverName() === 'sqlite') {
            return;
        }

        // Volver al enum original
        \DB::statement("ALTER TABLE question_bank MODIFY COLUMN phase ENUM('likert', 'checklist', 'comparative') NOT NULL");
    }
};
