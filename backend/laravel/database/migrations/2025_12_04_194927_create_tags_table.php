<?php
    use Illuminate\Database\Migrations\Migration;
    use Illuminate\Database\Schema\Blueprint;
    use Illuminate\Support\Facades\Schema;

    return new class extends Migration {
        /**
         * Run the migrations.
         */
        public function up(): void {
            Schema::create('tags', function (Blueprint $table) {
                $table->id();
                $table->string('nombre')->unique();
                $table->string('slug')->unique();
                $table->timestamps();
            });

            Schema::create('guia_tag', function (Blueprint $table) {
                $table->id();
                $table->foreignId('guia_id')->constrained('guias')->onDelete('cascade');
                $table->foreignId('tag_id')->constrained('tags')->onDelete('cascade');
                $table->unique(['guia_id', 'tag_id']);
            });
        }

        /**
         * Reverse the migrations.
         */
        public function down(): void {
            Schema::dropIfExists('guia_tag');
            Schema::dropIfExists('tags');
        }
    };
?>
