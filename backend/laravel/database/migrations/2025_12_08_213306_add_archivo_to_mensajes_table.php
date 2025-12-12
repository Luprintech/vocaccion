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
        Schema::table('mensajes', function (Blueprint $table) {
            $table->string('archivo')->nullable()->after('contenido');
            $table->string('nombre_archivo')->nullable()->after('archivo');
            $table->string('tipo_archivo')->nullable()->after('nombre_archivo');
            $table->text('contenido')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('mensajes', function (Blueprint $table) {
            $table->dropColumn(['archivo', 'nombre_archivo', 'tipo_archivo']);
            $table->text('contenido')->nullable(false)->change();
        });
    }
};
