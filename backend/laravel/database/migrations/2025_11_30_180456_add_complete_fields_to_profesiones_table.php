<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('profesiones', function (Blueprint $table) {
            $table->json('formaciones_necesarias')->nullable()->after('habilidades');
            $table->text('pexels_prompt')->nullable()->after('formaciones_necesarias');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('profesiones', function (Blueprint $table) {
            $table->dropColumn(['formaciones_necesarias', 'pexels_prompt']);
        });
    }
};
