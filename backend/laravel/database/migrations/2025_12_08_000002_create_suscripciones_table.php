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
        Schema::create('suscripciones', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('usuario_id');
            $table->string('tipo_plan', 100)->default('basico')->comment('basico, pro, pro_plus');
            $table->enum('estado', ['activa', 'cancelada', 'finalizada'])->default('activa');
            $table->datetime('fecha_inicio');
            $table->datetime('fecha_fin')->comment('Fecha de expiración');
            $table->timestamps();

            $table->foreign('usuario_id')->references('id')->on('usuarios')->onDelete('cascade');
            $table->unique('usuario_id'); // Solo una suscripción activa por usuario
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('suscripciones');
    }
};
