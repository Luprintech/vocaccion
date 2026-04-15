<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Notas de corte universitarias por titulación + centro + universidad (QEDU).
     * Fuente: Ministerio de Ciencia, Innovación y Universidades — https://www.ciencia.gob.es/qedu.html
     */
    public function up(): void
    {
        Schema::create('university_cutoff_grades', function (Blueprint $table) {
            $table->id();

            // Códigos QEDU (no necesariamente iguales a RUCT)
            $table->string('cod_titulacion', 20)->index();
            $table->string('cod_centro', 20)->index();
            $table->string('cod_universidad', 10)->index();

            $table->string('titulacion')->index();
            $table->string('nivel', 20)->index()->comment('GRADO, MASTER, etc.');

            $table->string('tipo_universidad', 30)->nullable()->comment('Pública, Privada, etc.');
            $table->string('tipo_centro', 30)->nullable()->comment('Propio, Adscrito, etc.');
            $table->string('nombre_centro')->nullable();
            $table->string('nombre_universidad')->nullable()->index();
            $table->string('ccaa', 60)->nullable()->index();
            $table->string('provincia', 60)->nullable()->index();
            $table->string('cod_provincia', 5)->nullable()->index();
            $table->string('modalidad', 5)->nullable()->comment('1=Presencial, 2=Online, 3=Semipresencial');
            $table->boolean('idioma_extranjero')->default(false);

            $table->decimal('nota_corte', 5, 3)->nullable()->index()->comment('Nota de corte de acceso (0-14)');
            $table->string('anio', 10)->index()->comment('Curso académico, ej: 2025-2026');

            $table->string('source', 20)->default('QEDU');
            $table->timestamps();

            // Unicidad: una nota por titulación+centro+universidad+año
            $table->unique(
                ['cod_titulacion', 'cod_centro', 'cod_universidad', 'anio'],
                'cutoff_tit_centro_univ_anio_unique'
            );

            $table->index(['ccaa', 'nivel'], 'cutoff_ccaa_nivel_idx');
            $table->index(['titulacion', 'nota_corte'], 'cutoff_tit_nota_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('university_cutoff_grades');
    }
};
