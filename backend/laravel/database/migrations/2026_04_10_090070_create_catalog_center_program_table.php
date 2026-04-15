<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('catalog_center_program');

        Schema::create('catalog_center_program', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('center_id');
            $table->unsignedBigInteger('program_id');
            $table->string('academic_year', 20)->nullable()->index();
            $table->string('shift', 30)->nullable()->index();
            $table->string('modality', 30)->nullable()->index();
            $table->unsignedInteger('vacancies')->nullable();
            $table->string('price_range', 100)->nullable();
            $table->string('official_url')->nullable();
            $table->boolean('active')->default(true)->index();
            $table->string('source_system', 50)->nullable()->index();
            $table->timestamp('last_seen_at')->nullable()->index();
            $table->timestamps();

            $table->unique(['center_id', 'program_id', 'academic_year'], 'catalog_center_program_unique');
            $table->foreign('center_id', 'ccp_center_fk')->references('id')->on('catalog_centers')->cascadeOnDelete();
            $table->foreign('program_id', 'ccp_program_fk')->references('id')->on('catalog_programs')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('catalog_center_program');
    }
};
