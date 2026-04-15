<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('official_universities', function (Blueprint $table) {
            $table->string('acronym', 50)->nullable()->after('name')->index();
            $table->string('cif', 20)->nullable()->after('ownership_type')->index();
            $table->string('erasmus_code', 30)->nullable()->after('cif')->index();
            $table->boolean('for_profit')->nullable()->after('erasmus_code')->index();
            $table->string('address')->nullable()->after('for_profit');
            $table->string('postal_code', 20)->nullable()->after('address')->index();
            $table->string('locality')->nullable()->after('postal_code')->index();
            $table->string('municipality')->nullable()->after('locality')->index();
            $table->string('province')->nullable()->after('municipality')->index();
            $table->string('autonomous_community_name')->nullable()->after('province')->index();
            $table->string('website')->nullable()->after('autonomous_community_name');
            $table->string('email')->nullable()->after('website')->index();
            $table->string('phone_1', 30)->nullable()->after('email');
            $table->string('phone_2', 30)->nullable()->after('phone_1');
            $table->string('fax', 30)->nullable()->after('phone_2');
        });

        Schema::table('official_centers', function (Blueprint $table) {
            $table->string('municipality')->nullable()->after('locality')->index();
        });
    }

    public function down(): void
    {
        Schema::table('official_centers', function (Blueprint $table) {
            $table->dropColumn('municipality');
        });

        Schema::table('official_universities', function (Blueprint $table) {
            $table->dropColumn([
                'acronym',
                'cif',
                'erasmus_code',
                'for_profit',
                'address',
                'postal_code',
                'locality',
                'municipality',
                'province',
                'autonomous_community_name',
                'website',
                'email',
                'phone_1',
                'phone_2',
                'fax',
            ]);
        });
    }
};
