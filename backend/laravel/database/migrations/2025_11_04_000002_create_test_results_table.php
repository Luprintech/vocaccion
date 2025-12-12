<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateTestResultsTable extends Migration
{
    public function up()
    {
        Schema::create('test_results', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('usuario_id');
            $table->unsignedBigInteger('test_session_id')->nullable();
            $table->json('answers');
            $table->text('result_text');
            $table->string('modelo')->nullable();
            $table->timestamp('saved_at')->nullable();
            $table->timestamps();

            $table->foreign('usuario_id')->references('id')->on('usuarios')->onDelete('cascade');
            $table->foreign('test_session_id')->references('id')->on('test_sessions')->onDelete('set null');
        });
    }

    public function down()
    {
        Schema::dropIfExists('test_results');
    }
}

