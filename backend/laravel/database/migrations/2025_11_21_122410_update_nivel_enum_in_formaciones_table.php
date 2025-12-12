<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Modificar el ENUM de nivel para que coincida con los valores del código
        // SQLite no soporta MODIFY COLUMN, así que lo saltamos en testing
        if (DB::getDriverName() !== 'sqlite') {
            DB::statement("ALTER TABLE `formaciones` MODIFY COLUMN `nivel` ENUM(
                'secundaria',
                'bachillerato',
                'fp_medio',
                'fp_superior',
                'universitario',
                'master',
                'doctorado'
            ) NULL");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revertir al ENUM anterior
        DB::statement("ALTER TABLE `formaciones` MODIFY COLUMN `nivel` ENUM(
            'ESO',
            'Bachillerato',
            'Grado Medio',
            'Grado Superior',
            'Grado Universitario',
            'Máster',
            'Doctorado'
        ) NULL");
    }
};
