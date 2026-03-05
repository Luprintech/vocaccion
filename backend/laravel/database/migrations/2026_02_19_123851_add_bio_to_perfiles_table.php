<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('perfiles', function (Blueprint $table) {
            if (!Schema::hasColumn('perfiles', 'bio')) {
                $table->text('bio')->nullable()->after('telefono');
            }
        });
    }

    public function down(): void
    {
        Schema::table('perfiles', function (Blueprint $table) {
            $table->dropColumn('bio');
        });
    }
};
