<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Usuario;
use App\Models\Rol;
use Illuminate\Support\Facades\Hash;

class UsuariosTestSeeder extends Seeder
{
    /**
     * Ejecutar los seeds de la base de datos.
     */
    public function run(): void
    {
        // Obtener roles
        $rolAdmin = Rol::where('nombre', 'administrador')->first();
        $rolOrientador = Rol::where('nombre', 'orientador')->first();
        $rolEstudiante = Rol::where('nombre', 'estudiante')->first();

        // 1️⃣ Crear usuario administrador
        $admin = Usuario::firstOrCreate(
            ['email' => 'admin@vocaccion.es'],
            [
                'nombre' => 'Administrador del Sistema',
                'password' => Hash::make('12345678'),
                'email_verified_at' => now(),
            ]
        );

        // Asignar rol de administrador (evitar duplicados)
        if ($rolAdmin && !$admin->roles->contains($rolAdmin)) {
            $admin->roles()->attach($rolAdmin->id);
            $this->command->info('✅ Rol administrador asignado a: admin@vocaccion.es');
        }

        // 2️⃣ Crear usuario orientador
        $orientador = Usuario::firstOrCreate(
            ['email' => 'orientador@vocaccion.es'],
            [
                'nombre' => 'Orientador de Prueba',
                'password' => Hash::make('12345678'),
                'email_verified_at' => now(),
            ]
        );

        // Asignar rol de orientador
        if ($rolOrientador && !$orientador->roles->contains($rolOrientador)) {
            $orientador->roles()->attach($rolOrientador->id);
            $this->command->info('✅ Rol orientador asignado a: orientador@vocaccion.es');
        }

        // 3️⃣ Crear usuario estudiante
        $estudiante = Usuario::firstOrCreate(
            ['email' => 'estudiante@vocaccion.es'],
            [
                'nombre' => 'Estudiante de Prueba',
                'password' => Hash::make('12345678'),
                'email_verified_at' => now(),
            ]
        );

        // Asignar rol de estudiante
        if ($rolEstudiante && !$estudiante->roles->contains($rolEstudiante)) {
            $estudiante->roles()->attach($rolEstudiante->id);
            $this->command->info('✅ Rol estudiante asignado a: estudiante@vocaccion.es');
        }

        $this->command->info("\n🎉 Usuarios de prueba creados exitosamente!\n");
        $this->command->info("Credenciales de prueba:");
        $this->command->info("  👤 Admin:      admin@vocaccion.es / 12345678");
        $this->command->info("  👤 Orientador: orientador@vocaccion.es / 12345678");
        $this->command->info("  👤 Estudiante: estudiante@vocaccion.es / 12345678");
    }
}
