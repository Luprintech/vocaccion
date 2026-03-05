<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddUniqueUserToObjetivoProfesionalTable extends Migration
{
    public function up()
    {
        Schema::table('objetivo_profesional', function (Blueprint $table) {
            // Añadir índice único en user_id para garantizar que un usuario solo tenga un objetivo
            $table->unique('user_id', 'objetivo_profesional_user_unique');
        });
    }

    public function down()
    {
        Schema::table('objetivo_profesional', function (Blueprint $table) {
            // En MySQL, el unique index es usado como soporte de la FK.
            // Hay que eliminar la FK primero, luego el índice, y volver a crear la FK.
            $table->dropForeign(['user_id']);
            $table->dropUnique('objetivo_profesional_user_unique');
            $table->foreign('user_id')->references('id')->on('usuarios')->onDelete('cascade');
        });
    }
}
