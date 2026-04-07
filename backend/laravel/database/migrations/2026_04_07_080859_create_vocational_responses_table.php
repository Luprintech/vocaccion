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
        Schema::create('vocational_responses', function (Blueprint $table) {
            $table->id();
            $table->uuid('session_id');
            $table->foreignId('item_id')->constrained('question_bank');
            $table->smallInteger('value');          // Likert: 1-5, Checklist: 0|1, Comparative: -1|0|1
            $table->unsignedInteger('response_time_ms')->nullable();
            $table->timestamp('answered_at')->useCurrent();

            $table->foreign('session_id')->references('id')->on('vocational_sessions')->onDelete('cascade');
            $table->unique(['session_id', 'item_id']); // One answer per item per session
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('vocational_responses');
    }
};
