<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('catalog_occupation_program');

        Schema::create('catalog_occupation_program', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('occupation_id');
            $table->unsignedBigInteger('program_id');
            $table->string('relation_type', 30)->default('recommended_route')->index();
            $table->unsignedSmallInteger('priority')->default(100)->index();
            $table->text('notes')->nullable();
            $table->string('source_system', 50)->nullable()->index();
            $table->timestamp('last_seen_at')->nullable()->index();
            $table->timestamps();

            $table->unique(['occupation_id', 'program_id', 'relation_type'], 'catalog_occ_prog_unique');
            $table->foreign('occupation_id', 'cop_occ_fk')->references('id')->on('catalog_occupations')->cascadeOnDelete();
            $table->foreign('program_id', 'cop_prog_fk')->references('id')->on('catalog_programs')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('catalog_occupation_program');
    }
};
