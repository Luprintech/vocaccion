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
        Schema::table('vocational_sessions', function (Blueprint $table) {
            $table->tinyInteger('version')->default(1)->after('is_completed');
            $table->string('age_group', 20)->nullable()->after('version');
            $table->json('selected_items')->nullable()->after('age_group');
            $table->string('phase', 20)->nullable()->after('selected_items');
            $table->unsignedSmallInteger('current_index')->default(0)->after('phase');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('vocational_sessions', function (Blueprint $table) {
            $table->dropColumn(['version', 'age_group', 'selected_items', 'phase', 'current_index']);
        });
    }
};
