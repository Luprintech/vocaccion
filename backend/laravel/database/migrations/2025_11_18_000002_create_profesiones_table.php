<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateProfesionesTable extends Migration
{
    public function up()
    {
        Schema::create('profesiones', function (Blueprint $table) {
            $table->id();
            $table->string('titulo');
            $table->text('descripcion')->nullable();
            $table->text('salidas')->nullable();
            $table->text('formacion_recomendada')->nullable();
            $table->json('habilidades')->nullable();
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('profesiones');
    }
}
