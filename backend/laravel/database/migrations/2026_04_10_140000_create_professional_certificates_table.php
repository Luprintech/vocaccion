<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('professional_certificates', function (Blueprint $table) {
            $table->id();
            $table->string('sepe_code')->unique()->comment('Código SEPE (ej: ADGD0001)');
            $table->string('name');
            $table->string('family_code', 10)->nullable()->comment('Código familia profesional');
            $table->string('family_name')->nullable();
            $table->string('area_code', 10)->nullable()->comment('Código área profesional');
            $table->string('area_name')->nullable();
            $table->integer('level')->nullable()->comment('Nivel 1, 2, 3');
            $table->integer('total_hours')->nullable();
            $table->boolean('is_modular')->default(false);
            $table->boolean('is_professional_certificate')->default(false);
            $table->integer('online_hours')->nullable();
            $table->text('associated_centers')->nullable();
            $table->string('detail_url')->nullable();
            
            // Metadata
            $table->boolean('active')->default(true);
            $table->string('source_system')->default('SEPE');
            $table->timestamp('last_seen_at')->nullable();
            $table->json('raw_payload')->nullable();
            $table->timestamps();
            
            // Indexes
            $table->index('family_code');
            $table->index('area_code');
            $table->index('level');
            $table->index(['active', 'is_professional_certificate'], 'idx_active_is_cert');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('professional_certificates');
    }
};
