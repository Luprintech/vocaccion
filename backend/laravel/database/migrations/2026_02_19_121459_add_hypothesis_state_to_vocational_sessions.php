<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Migration: Add Hypothesis State to Vocational Sessions
 *
 * Adds two new JSON columns to vocational_sessions:
 *   - hypothesis_state: The full HypothesisState VO (RIASEC scores + confidence per dimension)
 *   - decision_log: Ordered list of strategy decisions made by HypothesisDecider
 *
 * history_log is NOT modified in schema — it remains a JSON column.
 * The extended format (with trait, dimension, weight fields) is handled
 * at the application layer via VocationalSession::appendHistory().
 * This is backwards compatible: old entries without those fields are tolerated.
 */
return new class extends Migration {
    public function up(): void
    {
        Schema::table('vocational_sessions', function (Blueprint $table) {

            // The full serialized HypothesisState Value Object.
            // Stores per-dimension: score, confidence, evidence_count.
            // Initialized to a zeroed state when the session is created.
            $table->json('hypothesis_state')->nullable()->after('history_log');

            // Ordered log of strategy decisions taken by HypothesisDecider.
            // Each entry: { question_index, strategy, target_dims, timestamp }
            // Used for audit, debugging, and future ML training data.
            $table->json('decision_log')->nullable()->after('hypothesis_state');
        });
    }

    public function down(): void
    {
        Schema::table('vocational_sessions', function (Blueprint $table) {
            $table->dropColumn(['hypothesis_state', 'decision_log']);
        });
    }
};
