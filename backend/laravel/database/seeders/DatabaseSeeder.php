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

        // LEER CONTRASEÑAS DESDE .ENV O GENERAR ALEATORIAS
        // Si no están definidas en el .env, se genera una segura de 16 caracteres.
        $passwordAdmin = env('SEEDER_ADMIN_PASSWORD') ?: Str::random(16);
        $passwordOrientador = env('SEEDER_ORIENTADOR_PASSWORD') ?: Str::random(16);


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
        ['email' => 'admin@vocaccion.com'],
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
        echo "   Admin actualizado: admin@vocaccion.com / $passwordAdmin\n";

        // ==========================================
        // 4. CREAR O ACTUALIZAR USUARIO ORIENTADOR
        // ==========================================
        $orientador = Usuario::updateOrCreate(
        ['email' => 'orientador@vocaccion.com'],
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
        echo "   Orientador actualizado: orientador@vocaccion.com / $passwordOrientador\n";



        // ==========================================
        // 6. LLAMAR AL SEEDER DE GUÍAS (DESPUÉS DE CREAR USUARIOS)
        // ==========================================
        $this->call(GuiasSeeder::class);

        // ==========================================
        // 7. LLAMAR AL SEEDER DE RECURSOS
        // ==========================================
        $this->call(RecursosSeeder::class);



        echo "\n Seeders completados!\n";
        echo "\n Credenciales de prueba:\n";
        echo "   Admin:       admin@vocaccion.com / $passwordAdmin\n";
        echo "   Orientador:  orientador@vocaccion.com / $passwordOrientador\n\n";
    }
}
