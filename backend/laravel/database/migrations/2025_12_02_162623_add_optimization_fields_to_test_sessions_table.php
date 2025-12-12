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
        Schema::table('test_sessions', function (Blueprint $table) {
            $table->string('last_request_id')->nullable()->after('estado');
            $table->json('last_response')->nullable()->after('last_request_id');
            $table->text('user_summary')->nullable()->after('last_response');
            $table->json('covered_domains')->nullable()->after('user_summary');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('test_sessions', function (Blueprint $table) {
            $table->dropColumn(['last_request_id', 'last_response', 'user_summary', 'covered_domains']);
        });
    }
};
