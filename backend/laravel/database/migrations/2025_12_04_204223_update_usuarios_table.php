<?php
    use Illuminate\Database\Migrations\Migration;
    use Illuminate\Database\Schema\Blueprint;
    use Illuminate\Support\Facades\Schema;

    return new class extends Migration {
        /**
         * Run the migrations.
         */
        public function up(): void {
            Schema::table('usuarios', function (Blueprint $table) {
                $table->boolean('es_premium')->default(false)->after('email_verified_at');
                $table->date('fecha_expiracion_premium')->nullable()->after('es_premium');
            });
        }

        /**
         * Reverse the migrations.
         */
        public function down(): void {
            Schema::table('usuarios', function (Blueprint $table) {
                $table->dropColumn(['es_premium', 'fecha_expiracion_premium']);
            });
        }
    };
?>
