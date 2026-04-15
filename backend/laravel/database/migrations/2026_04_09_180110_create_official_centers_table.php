<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Centros oficiales RUCT asociados a universidades.
     */
    public function up(): void
    {
        Schema::create('official_centers', function (Blueprint $table) {
            $table->id();

            $table->foreignId('official_university_id')->nullable()->constrained('official_universities')->nullOnDelete();

            $table->string('ruct_center_code', 20)->unique()->comment('Código oficial del centro en RUCT');
            $table->string('name')->index();
            $table->string('center_type')->nullable()->index();
            $table->string('legal_nature')->nullable()->index();
            $table->string('attachment_type', 20)->nullable()->index()->comment('Propio/Adscrito');

            $table->string('address')->nullable();
            $table->string('postal_code', 20)->nullable()->index();
            $table->string('locality')->nullable()->index();
            $table->string('province')->nullable()->index();
            $table->string('autonomous_community_code', 10)->nullable()->index();
            $table->string('autonomous_community_name')->nullable()->index();

            $table->boolean('active')->default(true)->index();
            $table->string('source_system', 20)->default('RUCT')->index();
            $table->string('source_url')->nullable();
            $table->timestamp('last_seen_at')->nullable()->index();
            $table->json('raw_payload')->nullable();

            $table->timestamps();

            $table->index(['official_university_id', 'active'], 'off_centers_univ_active_idx');
            $table->index(['autonomous_community_code', 'active'], 'off_centers_ccaa_active_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('official_centers');
    }
};
