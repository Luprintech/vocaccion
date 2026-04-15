<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('data_update_runs', function (Blueprint $table) {
            $table->id();
            $table->string('type')->index();
            $table->string('status')->default('pending')->index();
            $table->json('options')->nullable();
            $table->longText('output')->nullable();
            $table->text('error')->nullable();
            $table->timestamp('started_at')->nullable()->index();
            $table->timestamp('finished_at')->nullable()->index();
            $table->foreignId('usuario_id')->nullable()->constrained('usuarios')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('data_update_runs');
    }
};
