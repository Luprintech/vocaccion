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
        Schema::create('formaciones', function (Blueprint $table) {
            $table->id();
            $table->foreignId('perfil_id')->constrained('perfiles')->onDelete('cascade');
            $table->enum('nivel', [
                'secundaria',
                'bachillerato',
                'fp_medio',
                'fp_superior',
                'universitario',
                'master',
                'doctorado'
            ])->nullable();
            $table->string('centro_estudios')->nullable();
            $table->string('titulo_obtenido')->nullable();
            $table->date('fecha_inicio')->nullable();
            $table->date('fecha_fin')->nullable();
            $table->boolean('cursando_actualmente')->default(false);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('formaciones');
    }

    /**
     * Comprueba si la formación está completa
     */
    public function estaCompleta(): bool {
        return !empty($this->nivel) && !empty($this->centro_estudios) && !empty($this->titulo_obtenido) && !empty($this->fecha_inicio);
    }
};
