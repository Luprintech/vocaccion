<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Usuario;
use App\Models\Rol;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AdminAndRolesSeeder extends Seeder
{
    /**
     * Ejecuta el seeder para crear usuarios de prueba con roles.
     * 
     * Crea:
     * - 1 Administrador
     * - 1 Orientador
     * - 1 Estudiante
     * 
     * Uso: php artisan db:seed --class=AdminAndRolesSeeder
     */
    public function run(): void
    {
        echo "\n Creando usuarios de prueba...\n";

        // LEER CONTRASEÑAS DESDE .ENV O GENERAR ALEATORIAS
        $passwordAdmin = env('SEEDER_ADMIN_PASSWORD') ?: Str::random(16);
        $passwordOrientador = env('SEEDER_ORIENTADOR_PASSWORD') ?: Str::random(16);

        // ==========================================
        // 1. ADMINISTRADOR
        // ==========================================
        $admin = Usuario::updateOrCreate(
        ['email' => 'admin@vocaccion.com'],
        [
            'nombre' => 'Admin VocAcción',
            'password' => Hash::make($passwordAdmin),
            'email_verified_at' => now(),
        ]
        );
        echo "   Admin actualizado: admin@vocaccion.com / $passwordAdmin\n";

        // Asignar rol si no lo tiene
        if (!$admin->roles()->where('rol_id', 1)->exists()) {
            $admin->roles()->attach(1);
        }

        // ==========================================
        // 2. ORIENTADOR
        // ==========================================
        // ==========================================
        // 2. ORIENTADOR
        // ==========================================
        $orientador = Usuario::updateOrCreate(
        ['email' => 'carlos@vocaccion.com'],
        [
            'nombre' => 'Carlos García - Orientador',
            'password' => Hash::make($passwordOrientador),
            'email_verified_at' => now(),
        ]
        );
        echo "   Orientador actualizado: carlos@vocaccion.com / $passwordOrientador\n";

        // Asignar rol si no lo tiene
        if (!$orientador->roles()->where('rol_id', 2)->exists()) {
            $orientador->roles()->attach(2);
        }



        echo "\n Todos los usuarios de prueba están listos!\n";
        echo "\n Credenciales de prueba:\n";
        echo "   Administrador: admin@vocaccion.com / $passwordAdmin\n";
        echo "   Orientador:    carlos@vocaccion.com / $passwordOrientador\n";
        echo "\n";
    }
}
