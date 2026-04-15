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
        Schema::create('esco_occupations', function (Blueprint $table) {
            $table->id();
            $table->string('concept_uri')->unique();
            $table->string('isco_group', 10)->nullable()->index();
            $table->string('preferred_label');
            $table->text('alt_labels')->nullable();
            $table->text('description')->nullable();
            $table->string('code', 20)->nullable()->index();
            $table->string('status', 20)->default('released');
            $table->timestamp('esco_modified_date')->nullable();
            $table->timestamps();
            
            $table->index('preferred_label');
            $table->fullText(['preferred_label', 'description']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('esco_occupations');
    }
};
