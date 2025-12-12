<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddProfesionesToTestResultsTable extends Migration
{
    public function up()
    {
        Schema::table('test_results', function (Blueprint $table) {
            if (!Schema::hasColumn('test_results', 'profesiones')) {
                $table->json('profesiones')->nullable()->after('result_text');
            }
        });
    }

    public function down()
    {
        Schema::table('test_results', function (Blueprint $table) {
            if (Schema::hasColumn('test_results', 'profesiones')) {
                $table->dropColumn('profesiones');
            }
        });
    }
}
