<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('training_courses', function (Blueprint $table) {
            $table->id();
            $table->string('external_id')->nullable()->comment('ID del sistema origen');
            $table->string('title');
            $table->string('provider')->comment('SEPE, SAE Andalucía, etc.');
            $table->string('url')->nullable();
            $table->string('locality')->nullable();
            $table->string('province')->nullable();
            $table->string('autonomous_community')->nullable();
            $table->date('start_date')->nullable();
            $table->integer('hours')->nullable();
            $table->string('modality')->nullable()->comment('presencial, online, mixto');
            $table->string('search_criteria')->nullable();
            $table->text('description')->nullable();
            
            // Metadata
            $table->boolean('active')->default(true);
            $table->string('source_system');
            $table->timestamp('last_seen_at')->nullable();
            $table->json('raw_payload')->nullable();
            $table->timestamps();
            
            // Indexes
            $table->index('provider');
            $table->index('province');
            $table->index('start_date');
            $table->index(['active', 'provider'], 'idx_active_provider');
            $table->unique(['external_id', 'provider'], 'idx_unique_course');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('training_courses');
    }
};
