<?php
    use Illuminate\Database\Migrations\Migration;
    use Illuminate\Database\Schema\Blueprint;
    use Illuminate\Support\Facades\Schema;

    return new class extends Migration {
        /**
         * Run the migrations.
         */
        public function up(): void {
            Schema::create('guia_descargas', function (Blueprint $table) {
                $table->id();
                $table->foreignId('guia_id')->constrained('guias')->onDelete('cascade');
                $table->foreignId('usuario_id')->constrained('usuarios')->onDelete('cascade');
                $table->ipAddress('ip_address')->nullable();
                $table->string('user_agent')->nullable();
                $table->timestamps();
                $table->unique(['guia_id', 'usuario_id']);

                //  Índice para búsqueda por id del usuario
                $table->index('usuario_id');
            });
        }

        /**
         * Reverse the migrations.
         */
        public function down(): void {
            Schema::dropIfExists('guia_descargas');
        }
    };
?>
