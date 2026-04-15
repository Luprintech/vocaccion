<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    /**
     * Tabla de Cualificaciones Profesionales del CNCP (Catálogo Nacional de Cualificaciones Profesionales)
     * Almacena las 756 cualificaciones profesionales oficiales de España organizadas en 26 familias profesionales
     */
    public function up(): void
    {
        Schema::create('professional_qualifications', function (Blueprint $table) {
            $table->id();
            
            // Identificación CNCP
            $table->string('codigo_cncp', 20)->unique()->comment('Código CNCP (ej: IFC080_3)');
            $table->string('denominacion')->comment('Nombre oficial de la cualificación');
            
            // Familia profesional (26 familias)
            $table->string('familia_profesional', 100)->index()->comment('Familia profesional (ej: Informática y Comunicaciones)');
            $table->string('codigo_familia', 10)->comment('Código de familia (ej: IFC, AGA, SAN)');
            
            // Nivel de cualificación (1, 2 o 3)
            $table->tinyInteger('nivel')->index()->comment('Nivel de cualificación: 1=básico, 2=medio, 3=avanzado');
            
            // Competencia general
            $table->text('competencia_general')->nullable()->comment('Descripción de la competencia general');
            
            // Unidades de competencia (JSON array de UC)
            $table->json('unidades_competencia')->nullable()->comment('Array de unidades de competencia asociadas');
            
            // Entorno profesional
            $table->text('ambito_profesional')->nullable()->comment('Ámbito profesional de aplicación');
            $table->json('sectores_productivos')->nullable()->comment('Sectores productivos donde se aplica');
            $table->json('ocupaciones')->nullable()->comment('Ocupaciones y puestos de trabajo relevantes');
            
            // Metadatos
            $table->boolean('activo')->default(true)->index();
            $table->string('url_incual')->nullable()->comment('URL oficial en incual.educacion.gob.es');
            
            $table->timestamps();
            
            // Índices compuestos
            $table->index(['familia_profesional', 'nivel']);
            $table->index(['codigo_familia', 'activo']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('professional_qualifications');
    }
};
