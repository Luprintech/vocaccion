<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Ampliar longitud de nombres de títulos RUCT.
     */
    public function up(): void
    {
        if (Schema::getConnection()->getDriverName() === 'sqlite') {
            return;
        }

        DB::statement('ALTER TABLE official_degrees DROP INDEX official_degrees_name_index');
        DB::statement('ALTER TABLE official_degrees MODIFY name TEXT NOT NULL');
    }

    public function down(): void
    {
        if (Schema::getConnection()->getDriverName() === 'sqlite') {
            return;
        }

        DB::statement('ALTER TABLE official_degrees MODIFY name VARCHAR(255) NOT NULL');
        DB::statement('ALTER TABLE official_degrees ADD INDEX official_degrees_name_index (name(191))');
    }
};
