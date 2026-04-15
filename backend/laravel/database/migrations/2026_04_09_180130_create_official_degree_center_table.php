<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Relación N:M entre títulos oficiales y centros que los imparten.
     */
    public function up(): void
    {
        Schema::create('official_degree_center', function (Blueprint $table) {
            $table->id();

            $table->foreignId('official_degree_id')->constrained('official_degrees')->cascadeOnDelete();
            $table->foreignId('official_center_id')->constrained('official_centers')->cascadeOnDelete();

            $table->string('source_system', 20)->default('RUCT')->index();
            $table->string('source_url')->nullable();
            $table->timestamp('last_seen_at')->nullable()->index();
            $table->timestamps();

            $table->unique(['official_degree_id', 'official_center_id'], 'official_degree_center_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('official_degree_center');
    }
};
