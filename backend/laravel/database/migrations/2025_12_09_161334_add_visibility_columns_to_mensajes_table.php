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
        Schema::table('mensajes', function (Blueprint $table) {
            $table->boolean('visible_para_emisor')->default(true)->after('leido');
            $table->boolean('visible_para_receptor')->default(true)->after('visible_para_emisor');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('mensajes', function (Blueprint $table) {
            $table->dropColumn(['visible_para_emisor', 'visible_para_receptor']);
        });
    }
};
