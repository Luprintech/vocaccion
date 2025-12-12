<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateObjetivoProfesionalTable extends Migration
{
    public function up()
    {
        Schema::create('objetivo_profesional', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->unsignedBigInteger('profesion_id');
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('usuarios')->onDelete('cascade');
            $table->foreign('profesion_id')->references('id')->on('profesiones')->onDelete('cascade');
        });
    }

    public function down()
    {
        Schema::dropIfExists('objetivo_profesional');
    }
}
