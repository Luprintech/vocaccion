<?php

namespace Database\Seeders;

use App\Models\Usuario;
use App\Models\Rol;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;



class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        echo "\n Iniciando seeders...\n";

        // CONTRASEÑAS PARA DESARROLLO (EN PRODUCCIÓN USAR .ENV)
        $passwordAdmin = '12345678';
        $passwordOrientador = '12345678';


        // ==========================================
        // 1. LLAMAR AL SEEDER DE ROLES
        // ==========================================
        $this->call(RolesSeeder::class);

        // ==========================================
        // 2. LLAMAR AL SEEDER DE PLANES
        // ==========================================
        $this->call(PlanesSeeder::class);

        // ==========================================
        // 3. CREAR O ACTUALIZAR USUARIOS (ANTES DE LAS GUÍAS)
        // ==========================================
        echo "\nCreando o actualizando usuarios...\n";

        $admin = Usuario::updateOrCreate(
        ['email' => 'admin@vocaccion.es'],
        [
            'nombre' => 'Admin VocAcción',
            'password' => Hash::make($passwordAdmin),
            'email_verified_at' => now(),
        ]
        );

        // Asignar rol administrador si no lo tiene
        if (!$admin->roles()->where('rol_id', 1)->exists()) {
            $admin->roles()->attach(1);
        }
        echo "   Admin actualizado: admin@vocaccion.es / $passwordAdmin\n";

        // ==========================================
        // 4. CREAR O ACTUALIZAR USUARIO ORIENTADOR
        // ==========================================
        $orientador = Usuario::updateOrCreate(
        ['email' => 'orientador@vocaccion.es'],
        [
            'nombre' => 'Carlos García - Orientador',
            'password' => Hash::make($passwordOrientador),
            'email_verified_at' => now(),
        ]
        );

        // Asignar rol orientador si no lo tiene
        if (!$orientador->roles()->where('rol_id', 2)->exists()) {
            $orientador->roles()->attach(2);
        }
        echo "   Orientador actualizado: orientador@vocaccion.es / $passwordOrientador\n";

        // ==========================================
        // 5. CREAR O ACTUALIZAR USUARIO ESTUDIANTE
        // ==========================================
        $estudiante = Usuario::updateOrCreate(
        ['email' => 'estudiante@vocaccion.es'],
        [
            'nombre' => 'María López - Estudiante',
            'password' => Hash::make('12345678'),
            'email_verified_at' => now(),
        ]
        );

        // Asignar rol estudiante si no lo tiene
        if (!$estudiante->roles()->where('rol_id', 3)->exists()) {
            $estudiante->roles()->attach(3);
        }
        echo "   Estudiante actualizado: estudiante@vocaccion.es / 12345678\n";

        // ==========================================
        // 6. LLAMAR AL SEEDER DE GUÍAS (DESPUÉS DE CREAR USUARIOS)
        // ==========================================
        $this->call(GuiasSeeder::class);

        // ==========================================
        // 7. LLAMAR AL SEEDER DE RECURSOS
        // ==========================================
        $this->call(RecursosSeeder::class);

        // ==========================================
        // 8. BANCO DE PREGUNTAS RIASEC V2
        // ==========================================
        $this->call(QuestionBankSeeder::class);

        // ==========================================
        // 9. NOTAS DE CORTE UNIVERSITARIAS (QEDU)
        // ==========================================
        $this->call(UniversityCutoffGradeSeeder::class);



        echo "\n Seeders completados!\n";
        echo "\n Credenciales de prueba:\n";
        echo "   Admin:       admin@vocaccion.es / $passwordAdmin\n";
        echo "   Orientador:  orientador@vocaccion.es / $passwordOrientador\n";
        echo "   Estudiante:  estudiante@vocaccion.es / 12345678\n\n";
    }
}
