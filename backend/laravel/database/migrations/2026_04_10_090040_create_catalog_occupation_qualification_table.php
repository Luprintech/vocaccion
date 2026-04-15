<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('catalog_occupation_qualification');

        Schema::create('catalog_occupation_qualification', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('occupation_id');
            $table->unsignedBigInteger('professional_qualification_id');
            $table->string('relation_type', 30)->default('recommended')->index();
            $table->unsignedTinyInteger('relevance')->default(50);
            $table->text('notes')->nullable();
            $table->string('source_system', 50)->nullable()->index();
            $table->timestamp('last_seen_at')->nullable()->index();
            $table->timestamps();

            $table->unique(['occupation_id', 'professional_qualification_id'], 'catalog_occ_qual_unique');
            $table->foreign('occupation_id', 'coq_occ_fk')->references('id')->on('catalog_occupations')->cascadeOnDelete();
            $table->foreign('professional_qualification_id', 'coq_qual_fk')->references('id')->on('professional_qualifications')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('catalog_occupation_qualification');
    }
};
