<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class RolesSeeder extends Seeder
{
    /**
     * Ejecutar los seeds de la base de datos para roles.
     * 
     * Inserta los tres roles base del sistema manteniendo los IDs fijos
     * para garantizar la consistencia del RBAC en toda la aplicación.
     */
    public function run(): void
    {
        // Verificar si ya existen roles para evitar duplicados
        if (DB::table('roles')->count() > 0) {
            $this->command->info('⚠️  Roles ya existen en la base de datos. Saltando inserción.');
            return;
        }

        // Insertar roles con IDs fijos para consistencia RBAC
        DB::table('roles')->insert([
            [
                'id' => 1,
                'nombre' => 'administrador',
                'descripcion' => null,
                'activo' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => 2,
                'nombre' => 'orientador',
                'descripcion' => null,
                'activo' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => 3,
                'nombre' => 'estudiante',
                'descripcion' => null,
                'activo' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);

        $this->command->info(' Roles creados exitosamente: administrador (ID:1), orientador (ID:2), estudiante (ID:3)');
    }
}
