<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('qedu_degrees', function (Blueprint $table) {
            $table->decimal('creditos', 6, 1)->nullable()->comment('Créditos ECTS')->change();
        });
    }

    public function down(): void
    {
        Schema::table('qedu_degrees', function (Blueprint $table) {
            $table->unsignedSmallInteger('creditos')->nullable()->comment('Créditos ECTS')->change();
        });
    }
};
