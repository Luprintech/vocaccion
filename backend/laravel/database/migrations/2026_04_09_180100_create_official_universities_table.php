<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Catálogo oficial de universidades/entidades RUCT.
     */
    public function up(): void
    {
        Schema::create('official_universities', function (Blueprint $table) {
            $table->id();

            $table->string('ruct_code', 10)->unique()->comment('Código oficial de universidad/entidad en RUCT');
            $table->string('name')->index()->comment('Nombre oficial de la universidad o entidad');

            $table->string('responsible_administration_code', 10)->nullable()->index();
            $table->string('responsible_administration_name')->nullable()->index();
            $table->string('ownership_type', 30)->nullable()->index()->comment('publica, privada, especial, extranjera, etc.');

            $table->boolean('is_university')->default(true)->index();
            $table->boolean('is_special_entity')->default(false)->index();
            $table->boolean('active')->default(true)->index();

            $table->string('source_system', 20)->default('RUCT')->index();
            $table->string('source_url')->nullable();
            $table->timestamp('last_seen_at')->nullable()->index();
            $table->json('raw_payload')->nullable();

            $table->timestamps();

            $table->index(['responsible_administration_code', 'active'], 'off_univ_admin_active_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('official_universities');
    }
};
