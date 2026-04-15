<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('public_competitions', function (Blueprint $table) {
            $table->id();
            $table->string('boe_id')->unique()->comment('ID BOE (ej: BOE-A-2026-7310)');
            $table->text('title');
            $table->string('organism')->nullable();
            $table->string('url_pdf')->nullable();
            $table->string('url_xml')->nullable();
            $table->string('url_html')->nullable();
            $table->date('publication_date')->nullable();
            $table->integer('positions')->nullable()->comment('Número de plazas');
            $table->string('access_type')->nullable()->comment('concurso, oposición, concurso-oposición');
            $table->string('scope')->nullable()->comment('estatal, autonómico, local');
            $table->string('group')->nullable()->comment('A1, A2, C1, C2');
            $table->text('description')->nullable();
            
            // Metadata
            $table->boolean('active')->default(true);
            $table->string('source_system')->default('BOE');
            $table->timestamp('last_seen_at')->nullable();
            $table->json('raw_payload')->nullable();
            $table->timestamps();
            
            // Indexes
            $table->index('publication_date');
            $table->index('access_type');
            $table->index('scope');
            $table->index('group');
            $table->index(['active', 'publication_date'], 'idx_active_pub_date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('public_competitions');
    }
};
