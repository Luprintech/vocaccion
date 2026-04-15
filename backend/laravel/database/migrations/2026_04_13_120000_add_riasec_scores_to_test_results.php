<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Añade columna riasec_scores a test_results para snapshot inmutable de las
 * puntuaciones RIASEC en el momento en que se generó el informe.
 *
 * Motivación: VocationalProfile se sobreescribe con cada nuevo test, por lo que
 * leer los scores desde el perfil al mostrar resultados históricos es incorrecto.
 * Esta columna congela los scores junto al resultado que los generó.
 *
 * Formato esperado: {"R":82.5,"I":67.3,"A":45.1,"S":30.2,"E":55.8,"C":40.0}
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('test_results', function (Blueprint $table) {
            $table->json('riasec_scores')->nullable()->after('profesiones')
                ->comment('Snapshot de scores RIASEC en el momento de generación del informe');
        });
    }

    public function down(): void
    {
        Schema::table('test_results', function (Blueprint $table) {
            $table->dropColumn('riasec_scores');
        });
    }
};
