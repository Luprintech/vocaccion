<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Títulos universitarios con datos de inserción laboral extraídos de QEDU
     * (Ministerio de Ciencia, Innovación y Universidades).
     * Clave natural: (cod_titulacion, cod_centro) — una oferta por centro.
     */
    public function up(): void
    {
        Schema::create('qedu_degrees', function (Blueprint $table) {
            $table->id();

            // --- Identificadores QEDU ---
            $table->string('cod_titulacion', 20)->index()->comment('Código único QEDU de la titulación');
            $table->string('cod_centro', 20)->index()->comment('Código MECD del centro que imparte');
            $table->string('cod_universidad', 10)->nullable()->index()->comment('Código MECD de la universidad');

            // --- Nombre y nivel ---
            $table->string('titulacion', 500)->index()->comment('Nombre oficial de la titulación');
            $table->string('nivel', 10)->index()->comment('GRADO, GRADOD, MASTER, MASTERD, DOCTOR');
            $table->string('tipo_universidad', 20)->nullable()->comment('Pública / Privada');
            $table->string('tipo_centro', 20)->nullable()->comment('Propio / Adscrito');

            // --- Centro y universidad ---
            $table->string('nombre_centro', 500)->nullable()->index();
            $table->string('nombre_universidad', 300)->nullable()->index();

            // --- Geografía ---
            $table->string('ccaa', 100)->nullable()->index();
            $table->string('provincia', 100)->nullable()->index();
            $table->string('cod_provincia', 5)->nullable()->index();

            // --- Oferta académica ---
            $table->string('modalidad', 5)->nullable()->comment('1=Presencial, 2=Online, 3=Semi');
            $table->boolean('idioma_extranjero')->default(false);
            $table->string('ambito_isced', 10)->nullable()->index()->comment('Código ISCED del ámbito de estudio');
            $table->unsignedSmallInteger('plazas')->nullable();
            $table->decimal('creditos', 6, 1)->nullable()->comment('Créditos ECTS');
            $table->string('precio_credito', 10)->nullable()->comment('€/crédito como string (ej: 12,62)');

            // --- Notas de corte ---
            $table->decimal('nota_corte', 5, 2)->nullable()->index();
            $table->decimal('nota_corte_anterior', 5, 2)->nullable();
            $table->decimal('nota_admision_media', 5, 2)->nullable();
            $table->string('anio', 10)->nullable()->index()->comment('Curso académico ej: 2025-2026');

            // --- Inserción laboral (medida 4 años después) ---
            $table->decimal('insercion_tasa_afiliacion', 5, 2)->nullable()->comment('% empleados en SS');
            $table->decimal('insercion_pct_autonomos', 5, 2)->nullable()->comment('% autónomos');
            $table->decimal('insercion_pct_indefinidos', 5, 2)->nullable()->comment('% contratos indefinidos');
            $table->decimal('insercion_pct_cotizacion', 5, 2)->nullable()->comment('% cotizando SS');
            $table->decimal('insercion_salario_medio', 10, 2)->nullable()->comment('Salario bruto medio anual €');

            // --- Enlace oficial ---
            $table->string('enlace', 500)->nullable();

            // --- Control de actualización ---
            $table->string('fuente', 20)->default('QEDU')->index();
            $table->string('fecha_extraccion', 10)->nullable();

            $table->timestamps();

            // Clave única natural: una oferta = una titulación en un centro concreto
            $table->unique(['cod_titulacion', 'cod_centro'], 'qedu_degrees_titulacion_centro_unique');

            // Índices compuestos para búsquedas frecuentes
            $table->index(['nivel', 'ccaa'], 'qedu_degrees_nivel_ccaa_idx');
            $table->index(['nivel', 'nota_corte'], 'qedu_degrees_nivel_nota_idx');
            $table->index(['ambito_isced', 'nivel'], 'qedu_degrees_isced_nivel_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('qedu_degrees');
    }
};
