<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('formaciones', function (Blueprint $table) {
            if (Schema::hasColumn('formaciones', 'user_id')) {
                // Primero intentamos eliminar la FK solo si existe
                try {
                    $table->dropForeign(['user_id']);
                } catch (\Exception $e) {
                    // Si no existe la FK, ignoramos el error
                }

                // Después eliminamos la columna
                $table->dropColumn('user_id');
            }
        });
    }
};
