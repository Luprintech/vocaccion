<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('guias', function (Blueprint $table) {
            $table->enum('plan_requerido', ['gratuito', 'pro', 'pro_plus'])
                ->default('gratuito')
                ->after('visibilidad')
                ->comment('Plan mínimo requerido para acceder a este recurso');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('guias', function (Blueprint $table) {
            $table->dropColumn('plan_requerido');
        });
    }
};
