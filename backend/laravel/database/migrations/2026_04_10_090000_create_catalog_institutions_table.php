<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('catalog_institutions', function (Blueprint $table) {
            $table->id();
            $table->string('slug')->unique();
            $table->string('name')->index();
            $table->string('institution_type', 50)->index();
            $table->string('source_system', 50)->nullable()->index();
            $table->string('source_code', 100)->nullable()->index();
            $table->string('official_university_code', 20)->nullable()->index();
            $table->foreignId('official_university_id')->nullable()->constrained('official_universities')->nullOnDelete();
            $table->string('website')->nullable();
            $table->string('email')->nullable()->index();
            $table->string('phone', 30)->nullable();
            $table->boolean('active')->default(true)->index();
            $table->timestamp('source_updated_at')->nullable()->index();
            $table->timestamp('last_seen_at')->nullable()->index();
            $table->string('source_url')->nullable();
            $table->json('raw_payload')->nullable();
            $table->timestamps();

            $table->unique(['source_system', 'source_code'], 'catalog_institutions_source_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('catalog_institutions');
    }
};
