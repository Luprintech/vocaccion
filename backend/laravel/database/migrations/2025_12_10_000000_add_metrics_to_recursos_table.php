<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up()
    {
        Schema::table('recursos', function (Blueprint $table) {
            // Añadir conteo de visualizaciones y descargas
            if (!Schema::hasColumn('recursos', 'visualizaciones')) {
                $table->unsignedBigInteger('visualizaciones')->default(0)->after('destacado');
            }
            if (!Schema::hasColumn('recursos', 'descargas')) {
                $table->unsignedBigInteger('descargas')->default(0)->after('visualizaciones');
            }
            // Añadir slug para identificación amigable
            if (!Schema::hasColumn('recursos', 'slug')) {
                $table->string('slug')->nullable()->unique()->after('titulo');
            }
        });
    }

    public function down()
    {
        Schema::table('recursos', function (Blueprint $table) {
            $table->dropColumn(['visualizaciones', 'descargas', 'slug']);
        });
    }
};
