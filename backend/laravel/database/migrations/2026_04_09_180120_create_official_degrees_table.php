<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Títulos oficiales RUCT (grado, máster, doctorado, etc.).
     */
    public function up(): void
    {
        Schema::create('official_degrees', function (Blueprint $table) {
            $table->id();

            $table->foreignId('official_university_id')->nullable()->constrained('official_universities')->nullOnDelete();

            $table->string('ruct_study_code', 20)->unique()->comment('Código oficial del título en RUCT');
            $table->string('name')->index();

            $table->string('academic_level_code', 5)->nullable()->index()->comment('G, M, D, etc.');
            $table->string('academic_level_name', 50)->nullable()->index();
            $table->string('cycle_code', 10)->nullable()->index();

            $table->string('branch_code', 20)->nullable()->index();
            $table->string('branch_name', 120)->nullable()->index();
            $table->string('field_code', 20)->nullable()->index()->comment('Campo de estudio RD 822');
            $table->string('field_name', 200)->nullable()->index();

            $table->string('status_code', 20)->nullable()->index();
            $table->string('status_name', 100)->nullable();
            $table->string('situation_code', 20)->nullable()->index();
            $table->string('situation_name', 150)->nullable();

            $table->string('officiality_boe_url')->nullable();
            $table->json('boe_urls')->nullable();
            $table->json('center_codes')->nullable()->comment('Lista denormalizada de códigos de centro detectados');

            $table->boolean('active')->default(true)->index();
            $table->string('source_system', 20)->default('RUCT')->index();
            $table->string('source_url')->nullable();
            $table->timestamp('last_seen_at')->nullable()->index();
            $table->json('raw_payload')->nullable();

            $table->timestamps();

            $table->index(['official_university_id', 'academic_level_code'], 'off_degrees_univ_level_idx');
            $table->index(['field_code', 'academic_level_code'], 'off_degrees_field_level_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('official_degrees');
    }
};
