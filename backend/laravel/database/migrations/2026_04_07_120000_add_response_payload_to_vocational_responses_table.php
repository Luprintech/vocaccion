<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('vocational_responses', function (Blueprint $table) {
            $table->json('response_payload')->nullable()->after('value');
        });
    }

    public function down(): void
    {
        Schema::table('vocational_responses', function (Blueprint $table) {
            $table->dropColumn('response_payload');
        });
    }
};
