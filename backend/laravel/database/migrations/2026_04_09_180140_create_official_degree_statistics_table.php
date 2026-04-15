<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Métricas SIIU/QEDU agregadas por título y/o universidad.
     */
    public function up(): void
    {
        Schema::create('official_degree_statistics', function (Blueprint $table) {
            $table->id();

            $table->foreignId('official_degree_id')->nullable()->constrained('official_degrees')->nullOnDelete();
            $table->foreignId('official_university_id')->nullable()->constrained('official_universities')->nullOnDelete();

            $table->string('academic_year', 20)->index()->comment('Ej: 2024, 2023-2024');
            $table->string('metric_type', 50)->index()->comment('preinscripcion, matriculados, egresados, afiliacion, etc.');
            $table->decimal('metric_value', 14, 2)->nullable();
            $table->string('metric_unit', 30)->nullable()->comment('personas, porcentaje, indice, etc.');

            $table->string('source_system', 20)->default('SIIU')->index();
            $table->string('source_dataset')->nullable()->index();
            $table->string('source_url')->nullable();
            $table->json('dimensions')->nullable()->comment('Dimensiones adicionales del dataset');
            $table->json('raw_payload')->nullable();

            $table->timestamps();

            $table->index(['metric_type', 'academic_year'], 'off_degree_stats_metric_year_idx');
            $table->index(['official_degree_id', 'metric_type', 'academic_year'], 'official_degree_stats_degree_metric_year');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('official_degree_statistics');
    }
};
