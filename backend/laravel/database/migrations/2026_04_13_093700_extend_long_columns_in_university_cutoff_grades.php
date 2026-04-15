<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Amplía las columnas de texto largo en university_cutoff_grades.
     *
     * Algunos títulos del CSV QEDU (dobles másteres, programas Erasmus Mundus,
     * nombres de centros con triple denominación idiomática) superan los 255
     * caracteres del VARCHAR predeterminado de Laravel.
     *
     * - titulacion    → VARCHAR(500)  (títulos de titulaciones)
     * - nombre_centro → VARCHAR(500)  (nombre del centro universitario)
     *
     * MySQL utf8mb4: 500 × 4 bytes = 2000 bytes < 3072 bytes límite de índice.
     */
    public function up(): void
    {
        Schema::table('university_cutoff_grades', function (Blueprint $table) {
            // Hay que eliminar el índice existente antes de cambiar el tipo
            $table->dropIndex(['titulacion']);

            $table->string('titulacion', 500)->change();
            $table->string('nombre_centro', 500)->nullable()->change();

            // Re-crear índice simple (ok con VARCHAR(500) en MySQL ≥ 5.7 innodb_large_prefix)
            $table->index('titulacion');
        });
    }

    public function down(): void
    {
        Schema::table('university_cutoff_grades', function (Blueprint $table) {
            $table->dropIndex(['titulacion']);

            $table->string('titulacion', 255)->change();
            $table->string('nombre_centro', 255)->nullable()->change();

            $table->index('titulacion');
        });
    }
};
