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
        // Mapping: career_catalog ↔ professional_certificates
        Schema::create('career_certificate_mappings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('career_id')->constrained('career_catalog')->onDelete('cascade');
            $table->foreignId('certificate_id')->constrained('professional_certificates')->onDelete('cascade');
            $table->tinyInteger('relevance')->default(5)->comment('1-10 scale: how relevant is this certificate for this career');
            $table->string('requirement_type', 20)->default('recommended')->comment('required, recommended, optional');
            $table->timestamps();
            
            $table->unique(['career_id', 'certificate_id']);
            $table->index('relevance');
        });

        // Mapping: career_catalog ↔ training_courses
        Schema::create('career_course_mappings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('career_id')->constrained('career_catalog')->onDelete('cascade');
            $table->foreignId('course_id')->constrained('training_courses')->onDelete('cascade');
            $table->tinyInteger('relevance')->default(5)->comment('1-10 scale');
            $table->string('requirement_type', 20)->default('recommended');
            $table->timestamps();
            
            $table->unique(['career_id', 'course_id']);
            $table->index('relevance');
        });

        // Mapping: career_catalog ↔ public_competitions
        Schema::create('career_competition_mappings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('career_id')->constrained('career_catalog')->onDelete('cascade');
            $table->foreignId('competition_id')->constrained('public_competitions')->onDelete('cascade');
            $table->tinyInteger('relevance')->default(5)->comment('1-10 scale');
            $table->timestamps();
            
            $table->unique(['career_id', 'competition_id']);
            $table->index('relevance');
        });

        // Mapping: career_catalog ↔ esco_occupations (enrichment)
        Schema::create('career_esco_mappings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('career_id')->constrained('career_catalog')->onDelete('cascade');
            $table->string('esco_occupation_uri')->index();
            $table->tinyInteger('match_confidence')->default(80)->comment('0-100: confidence in this mapping');
            $table->string('mapped_by', 50)->default('manual')->comment('manual, auto, ai');
            $table->timestamps();
            
            $table->unique(['career_id', 'esco_occupation_uri']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('career_esco_mappings');
        Schema::dropIfExists('career_competition_mappings');
        Schema::dropIfExists('career_course_mappings');
        Schema::dropIfExists('career_certificate_mappings');
    }
};
