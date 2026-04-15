<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('catalog_centers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('institution_id')->nullable()->constrained('catalog_institutions')->nullOnDelete();
            $table->string('slug')->unique();
            $table->string('name')->index();
            $table->string('center_type', 50)->nullable()->index();
            $table->string('ownership_type', 50)->nullable()->index();
            $table->string('source_system', 50)->nullable()->index();
            $table->string('source_code', 100)->nullable()->index();
            $table->string('official_center_code', 30)->nullable()->index();
            $table->foreignId('official_center_id')->nullable()->constrained('official_centers')->nullOnDelete();
            $table->string('address')->nullable();
            $table->string('postal_code', 20)->nullable()->index();
            $table->string('locality')->nullable()->index();
            $table->string('municipality')->nullable()->index();
            $table->string('province')->nullable()->index();
            $table->string('autonomous_community')->nullable()->index();
            $table->decimal('lat', 10, 7)->nullable();
            $table->decimal('lng', 10, 7)->nullable();
            $table->string('website')->nullable();
            $table->string('email')->nullable()->index();
            $table->string('phone', 30)->nullable();
            $table->boolean('active')->default(true)->index();
            $table->timestamp('source_updated_at')->nullable()->index();
            $table->timestamp('last_seen_at')->nullable()->index();
            $table->string('source_url')->nullable();
            $table->json('raw_payload')->nullable();
            $table->timestamps();

            $table->unique(['source_system', 'source_code'], 'catalog_centers_source_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('catalog_centers');
    }
};
