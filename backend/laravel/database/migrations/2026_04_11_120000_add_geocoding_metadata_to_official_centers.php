<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('official_centers', function (Blueprint $table) {
            $table->string('geocode_precision', 20)->nullable()->after('lng')->index();
            $table->string('geocode_provider', 30)->nullable()->after('geocode_precision');
            $table->string('geocode_query')->nullable()->after('geocode_provider');
            $table->string('geocode_display_name')->nullable()->after('geocode_query');
            $table->timestamp('geocode_last_checked_at')->nullable()->after('geocode_display_name');
        });
    }

    public function down(): void
    {
        Schema::table('official_centers', function (Blueprint $table) {
            $table->dropColumn([
                'geocode_precision',
                'geocode_provider',
                'geocode_query',
                'geocode_display_name',
                'geocode_last_checked_at',
            ]);
        });
    }
};
