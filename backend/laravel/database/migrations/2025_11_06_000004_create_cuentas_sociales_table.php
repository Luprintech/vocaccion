<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Ejecutar las migraciones.
     */
    public function up(): void
    {
        Schema::create('cuentas_sociales', function (Blueprint $table) {
            $table->id();
            $table->foreignId('usuario_id')->constrained('usuarios')->onDelete('cascade');
            $table->string('proveedor'); // google, facebook, twitter, etc.
            $table->string('proveedor_id'); // ID único del proveedor
            $table->string('proveedor_email')->nullable();
            $table->string('proveedor_nombre')->nullable();
            $table->string('avatar')->nullable();
            $table->boolean('activo')->default(true);
            $table->timestamps();

            // Índice único para evitar duplicados por proveedor y usuario
            $table->unique(['usuario_id', 'proveedor']);

            // Índice único para evitar duplicados por proveedor e ID del proveedor
            $table->unique(['proveedor', 'proveedor_id']);

            // Índices para optimización
            $table->index(['proveedor', 'activo']);
            $table->index('usuario_id');
        });
    }

    /**
     * Revertir las migraciones.
     */
    public function down(): void
    {
        Schema::dropIfExists('cuenta_socials');
    }
};
