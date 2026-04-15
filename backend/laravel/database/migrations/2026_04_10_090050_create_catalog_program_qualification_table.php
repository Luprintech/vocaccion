<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('catalog_program_qualification');

        Schema::create('catalog_program_qualification', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('program_id');
            $table->unsignedBigInteger('professional_qualification_id');
            $table->string('relation_type', 30)->default('covers')->index();
            $table->unsignedTinyInteger('relevance')->default(50);
            $table->text('notes')->nullable();
            $table->string('source_system', 50)->nullable()->index();
            $table->timestamp('last_seen_at')->nullable()->index();
            $table->timestamps();

            $table->unique(['program_id', 'professional_qualification_id'], 'catalog_prog_qual_unique');
            $table->foreign('program_id', 'cpq_prog_fk')->references('id')->on('catalog_programs')->cascadeOnDelete();
            $table->foreign('professional_qualification_id', 'cpq_qual_fk')->references('id')->on('professional_qualifications')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('catalog_program_qualification');
    }
};
