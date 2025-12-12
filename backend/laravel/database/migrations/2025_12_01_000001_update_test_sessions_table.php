<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up()
    {
        Schema::table('test_sessions', function (Blueprint $table) {
            // Añadir nuevos campos si no existen
            if (!Schema::hasColumn('test_sessions', 'total_questions')) {
                $table->integer('total_questions')->default(20)->after('current_index');
            }
            if (!Schema::hasColumn('test_sessions', 'questions')) {
                $table->json('questions')->nullable()->after('total_questions');
            }
            if (!Schema::hasColumn('test_sessions', 'historial')) {
                $table->json('historial')->nullable()->after('questions');
            }
            if (!Schema::hasColumn('test_sessions', 'area')) {
                $table->string('area')->nullable()->after('historial');
            }
            if (!Schema::hasColumn('test_sessions', 'subarea')) {
                $table->string('subarea')->nullable()->after('area');
            }
            if (!Schema::hasColumn('test_sessions', 'role')) {
                $table->string('role')->nullable()->after('subarea');
            }
            if (!Schema::hasColumn('test_sessions', 'estado')) {
                $table->string('estado')->default('en_progreso')->after('role');
            }

            // Eliminar campos antiguos si es necesario (opcional, pero recomendado para limpieza)
            // $table->dropColumn(['seconds_left']); 
        });
    }

    public function down()
    {
        Schema::table('test_sessions', function (Blueprint $table) {
            $table->dropColumn(['total_questions', 'questions', 'historial', 'area', 'subarea', 'role', 'estado']);
        });
    }
};
