<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('recursos', function (Blueprint $table) {
            $table->string('titulo')->after('id');
            $table->text('descripcion')->after('titulo');
            $table->string('tipo')->default('artículo')->after('descripcion');
            $table->text('enlace')->after('tipo');
            $table->string('tiempo_lectura')->nullable()->after('enlace');
            $table->boolean('destacado')->default(false)->after('tiempo_lectura');
            // user_id nullable para indicar quién lo creó, null=sistema
            $table->unsignedBigInteger('user_id')->nullable()->after('destacado');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('recursos', function (Blueprint $table) {
            $table->dropColumn(['titulo', 'descripcion', 'tipo', 'enlace', 'tiempo_lectura', 'destacado', 'user_id']);
        });
    }
};
