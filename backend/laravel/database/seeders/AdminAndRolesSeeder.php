<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Usuario;
use App\Models\Rol;
use Illuminate\Support\Facades\Hash;

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
        echo "\n📋 Creando usuarios de prueba...\n";

        // ==========================================
        // 1. ADMINISTRADOR
        // ==========================================
        $admin = Usuario::where('email', 'admin@vocaccion.com')->first();
        
        if (!$admin) {
            $admin = Usuario::create([
                'nombre' => 'Admin VocAcción',
                'email' => 'admin@vocaccion.com',
                'password' => Hash::make('admin123'),
                'email_verified_at' => now(),
            ]);
            echo "✅ Administrador creado: admin@vocaccion.com / admin123\n";
        } else {
            echo "⚠️  Administrador ya existe: admin@vocaccion.com\n";
        }

        // Asignar rol si no lo tiene
        if (!$admin->roles()->where('rol_id', 1)->exists()) {
            $admin->roles()->attach(1);
        }

        // ==========================================
        // 2. ORIENTADOR
        // ==========================================
        $orientador = Usuario::where('email', 'carlos@vocaccion.com')->first();
        
        if (!$orientador) {
            $orientador = Usuario::create([
                'nombre' => 'Carlos García - Orientador',
                'email' => 'carlos@vocaccion.com',
                'password' => Hash::make('carlos123'),
                'email_verified_at' => now(),
            ]);
            echo "✅ Orientador creado: carlos@vocaccion.com / carlos123\n";
        } else {
            echo "⚠️  Orientador ya existe: carlos@vocaccion.com\n";
        }

        // Asignar rol si no lo tiene
        if (!$orientador->roles()->where('rol_id', 2)->exists()) {
            $orientador->roles()->attach(2);
        }

        // ==========================================
        // 3. ESTUDIANTE
        // ==========================================
        $estudiante = Usuario::where('email', 'juan@vocaccion.com')->first();
        
        if (!$estudiante) {
            $estudiante = Usuario::create([
                'nombre' => 'Juan Pérez - Estudiante',
                'email' => 'juan@vocaccion.com',
                'password' => Hash::make('juan123'),
                'email_verified_at' => now(),
            ]);
            echo "✅ Estudiante creado: juan@vocaccion.com / juan123\n";
        } else {
            echo "⚠️  Estudiante ya existe: juan@vocaccion.com\n";
        }

        // Asignar rol si no lo tiene
        if (!$estudiante->roles()->where('rol_id', 3)->exists()) {
            $estudiante->roles()->attach(3);
        }

        echo "\n🎉 Todos los usuarios de prueba están listos!\n";
        echo "\n📝 Credenciales de prueba:\n";
        echo "   Administrador: admin@vocaccion.com / admin123\n";
        echo "   Orientador:    carlos@vocaccion.com / carlos123\n";
        echo "   Estudiante:    juan@vocaccion.com / juan123\n";
        echo "\n";
    }
}
