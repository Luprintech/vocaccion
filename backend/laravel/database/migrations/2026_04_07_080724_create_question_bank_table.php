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
        Schema::create('question_bank', function (Blueprint $table) {
            $table->id();
            $table->enum('age_group', ['teen', 'young_adult', 'adult']);
            $table->enum('phase', ['likert', 'checklist', 'comparative', 'activities', 'competencies', 'occupations']);
            $table->char('dimension', 1);         // R, I, A, S, E, C
            $table->char('dimension_b', 1)->nullable(); // For comparative: second dimension
            $table->float('weight', 4, 2)->default(1.0);
            $table->string('text_es', 500);
            $table->string('context_es', 500)->nullable();
            $table->json('options_json')->nullable();  // For checklist: [{label, dimension}]
            $table->unsignedSmallInteger('order_default')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['age_group', 'phase', 'is_active']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('question_bank');
    }
};
