<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('catalog_programs', function (Blueprint $table) {
            $table->id();
            $table->string('slug')->unique();
            $table->string('name')->index();
            $table->string('program_type', 50)->index();
            $table->string('official_code', 100)->nullable()->index();
            $table->string('source_system', 50)->nullable()->index();
            $table->string('source_code', 100)->nullable()->index();
            $table->string('family_name')->nullable()->index();
            $table->string('education_level', 100)->nullable()->index();
            $table->unsignedInteger('duration_hours')->nullable();
            $table->decimal('duration_years', 4, 1)->nullable();
            $table->string('modality', 30)->nullable()->index();
            $table->boolean('official')->default(true)->index();
            $table->string('official_degree_code', 30)->nullable()->index();
            $table->foreignId('official_degree_id')->nullable()->constrained('official_degrees')->nullOnDelete();
            $table->text('summary')->nullable();
            $table->timestamp('source_updated_at')->nullable()->index();
            $table->timestamp('last_seen_at')->nullable()->index();
            $table->string('source_url')->nullable();
            $table->json('raw_payload')->nullable();
            $table->timestamps();

            $table->unique(['source_system', 'source_code'], 'catalog_programs_source_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('catalog_programs');
    }
};
