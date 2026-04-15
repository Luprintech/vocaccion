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
        Schema::create('esco_occupation_skill_relations', function (Blueprint $table) {
            $table->id();
            $table->string('occupation_uri')->index();
            $table->string('skill_uri')->index();
            $table->string('relation_type', 20)->index(); // essential, optional
            $table->string('skill_type', 50)->nullable();
            $table->timestamps();
            
            // Unique constraint to avoid duplicate relations
            $table->unique(['occupation_uri', 'skill_uri'], 'esco_occ_skill_unique');
            
            // Foreign keys (optional - can be added if we store full ESCO dataset)
            // $table->foreign('occupation_uri')->references('concept_uri')->on('esco_occupations')->onDelete('cascade');
            // $table->foreign('skill_uri')->references('concept_uri')->on('esco_skills')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('esco_occupation_skill_relations');
    }
};
