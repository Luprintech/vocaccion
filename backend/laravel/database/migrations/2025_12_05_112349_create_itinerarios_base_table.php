<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up()
    {
        Schema::create('itinerarios_base', function (Blueprint $table) {
            $table->id();

            // Relación con profesiones
            $table->unsignedBigInteger('profesion_id')->nullable();

            $table->string('nivel')->nullable();   // Tipo de formación base: FP Medio, Superior, Grado…
            $table->json('pasos')->nullable();     // Pasos sugeridos en formato JSON
            $table->text('descripcion')->nullable(); // Descripción larga del itinerario

            $table->timestamps();

            // Foreign Key correcta → apunta a la tabla profesiones
            $table->foreign('profesion_id')
                ->references('id')
                ->on('profesiones')
                ->onDelete('set null'); // Si borras una profesión, no rompe la tabla
        });
    }

    public function down()
    {
        Schema::dropIfExists('itinerarios_base');
    }
};
