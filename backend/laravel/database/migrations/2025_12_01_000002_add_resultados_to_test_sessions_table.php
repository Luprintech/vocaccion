<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up()
    {
        Schema::table('test_sessions', function (Blueprint $table) {
            if (!Schema::hasColumn('test_sessions', 'resultados')) {
                $table->json('resultados')->nullable()->after('estado');
            }
        });
    }

    public function down()
    {
        Schema::table('test_sessions', function (Blueprint $table) {
            $table->dropColumn('resultados');
        });
    }
};
