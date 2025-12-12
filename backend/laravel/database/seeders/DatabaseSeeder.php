<?php

namespace Database\Seeders;

use App\Models\Usuario;
use App\Models\Rol;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;



class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        echo "\n Iniciando seeders...\n";

        // ==========================================
        // 1. LLAMAR AL SEEDER DE ROLES
        // ==========================================
        $this->call(RolesSeeder::class);

        // ==========================================
        // 2. LLAMAR AL SEEDER DE PLANES
        // ==========================================
        $this->call(PlanesSeeder::class);

        // ==========================================
        // 3. CREAR USUARIOS (ANTES DE LAS GUÍAS)
        // ==========================================
        echo "\nCreando usuarios...\n";

        $admin = Usuario::firstOrCreate(
            ['email' => 'admin@vocaccion.com'],
            [
                'nombre' => 'Admin VocAcción',
                'email' => 'admin@vocaccion.com',
                'password' => Hash::make('12345678'),
                'email_verified_at' => now(),
            ]
        );

        // Asignar rol administrador si no lo tiene
        if (!$admin->roles()->where('rol_id', 1)->exists()) {
            $admin->roles()->attach(1);
        }
        echo "   Admin creado: admin@vocaccion.com / 12345678\n";

        // ==========================================
        // 4. CREAR USUARIO ORIENTADOR
        // ==========================================
        $orientador = Usuario::firstOrCreate(
            ['email' => 'orientador@vocaccion.com'],
            [
                'nombre' => 'Carlos García - Orientador',
                'email' => 'orientador@vocaccion.com',
                'password' => Hash::make('12345678'),
                'email_verified_at' => now(),
            ]
        );

        // Asignar rol orientador si no lo tiene
        if (!$orientador->roles()->where('rol_id', 2)->exists()) {
            $orientador->roles()->attach(2);
        }
        echo "   Orientador creado: orientador@vocaccion.com / 12345678\n";

        // ==========================================
        // 5. CREAR USUARIO ESTUDIANTE
        // ==========================================
        $estudiante = Usuario::firstOrCreate(
            ['email' => 'estudiante@vocaccion.com'],
            [
                'nombre' => 'Juan Pérez - Estudiante',
                'email' => 'estudiante@vocaccion.com',
                'password' => Hash::make('12345678'),
                'email_verified_at' => now(),
            ]
        );

        // Asignar rol estudiante si no lo tiene
        if (!$estudiante->roles()->where('rol_id', 3)->exists()) {
            $estudiante->roles()->attach(3);
        }
        echo "   Estudiante creado: estudiante@vocaccion.com / 12345678\n";

        // ==========================================
        // 6. LLAMAR AL SEEDER DE GUÍAS (DESPUÉS DE CREAR USUARIOS)
        // ==========================================
        $this->call(GuiasSeeder::class);

        // ==========================================
        // 7. LLAMAR AL SEEDER DE RECURSOS
        // ==========================================
        $this->call(RecursosSeeder::class);

        // Crear suscripción gratuita para el estudiante (solo si la tabla existe)
        if (Schema::hasTable('suscripciones')) {
            DB::table('suscripciones')->updateOrInsert(
                ['usuario_id' => $estudiante->id],
                [
                    'tipo_plan' => 'gratuito',
                    'estado' => 'activa',
                    'fecha_inicio' => now(),
                    'fecha_fin' => now()->addYears(100),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]
            );
        }

        // Asignar el estudiante al orientador
        DB::table('orientador_estudiante')->updateOrInsert(
            [
                'orientador_id' => $orientador->id,
                'estudiante_id' => $estudiante->id
            ],
            [
                'estado' => 'activo',
                'fecha_asignacion' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ]
        );

        echo "\n Seeders completados!\n";
        echo "\n Credenciales de prueba:\n";
        echo "   Admin:       admin@vocaccion.com / 12345678\n";
        echo "   Orientador:  orientador@vocaccion.com / 12345678\n";
        echo "   Estudiante:  estudiante@vocaccion.com / 12345678\n\n";
    }
}
