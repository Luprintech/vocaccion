<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('catalog_occupations', function (Blueprint $table) {
            $table->id();
            $table->string('slug')->unique();
            $table->string('preferred_label')->index();
            $table->text('description')->nullable();
            $table->string('occupation_type', 50)->default('occupation')->index();
            $table->foreignId('parent_id')->nullable()->constrained('catalog_occupations')->nullOnDelete();
            $table->string('source_system', 50)->nullable()->index();
            $table->string('source_code', 100)->nullable()->index();
            $table->foreignId('cno_occupation_id')->nullable()->constrained('cno_occupations')->nullOnDelete();
            $table->foreignId('career_catalog_id')->nullable()->constrained('career_catalog')->nullOnDelete();
            $table->string('employment_outlook', 100)->nullable()->index();
            $table->string('salary_band', 100)->nullable()->index();
            $table->boolean('active')->default(true)->index();
            $table->timestamp('source_updated_at')->nullable()->index();
            $table->timestamp('last_seen_at')->nullable()->index();
            $table->string('source_url')->nullable();
            $table->json('raw_payload')->nullable();
            $table->timestamps();

            $table->unique(['source_system', 'source_code'], 'catalog_occupations_source_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('catalog_occupations');
    }
};
