<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schedule;
use Illuminate\Support\Facades\Log;
use App\Models\Usuario;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('test:relaciones', function () {
    $this->info('Probando relaciones del modelo Usuario...');

    $usuario = Usuario::with('roles')->first();

    if ($usuario) {
        $this->info('Usuario encontrado: ' . $usuario->nombre);
        $this->info('Email: ' . $usuario->email);
        $this->info('Roles: ' . $usuario->roles->pluck('nombre')->join(', '));

        $this->info('Verificando método tieneRol...');
        $this->info('¿Tiene rol administrador? ' . ($usuario->tieneRol('administrador') ? 'Sí' : 'No'));
        $this->info('¿Tiene rol estudiante? ' . ($usuario->tieneRol('estudiante') ? 'Sí' : 'No'));

        $this->info('Cuentas sociales: ' . $usuario->cuentasSociales->count());
    } else {
        $this->error('No se encontró ningún usuario.');
    }
})->purpose('Probar las relaciones entre modelos');

Artisan::command('test:auth', function () {
    $this->info('🔐 Probando sistema de autenticación...');

    // Probar creación de usuario
    $this->info('📝 Probando registro de usuario...');

    $email = 'test' . time() . '@vocaccion.com';
    $password = 'password123';

    try {
        $usuario = Usuario::create([
            'nombre' => 'Usuario de Prueba',
            'email' => $email,
            'password' => Hash::make($password),
        ]);

        $this->info('✅ Usuario creado correctamente: ' . $usuario->email);

        // Asignar rol estudiante
        $rolEstudiante = \App\Models\Rol::where('nombre', 'estudiante')->first();
        if ($rolEstudiante) {
            $usuario->roles()->attach($rolEstudiante);
            $this->info('✅ Rol estudiante asignado correctamente');
        }

        // Verificar que el usuario tiene el rol
        $this->info('Roles del usuario: ' . $usuario->roles->pluck('nombre')->join(', '));

        // Probar creación de token
        $token = $usuario->createToken('test_token')->plainTextToken;
        $this->info('✅ Token de acceso creado correctamente');

        // Probar verificación de contraseña
        if (Hash::check($password, $usuario->password)) {
            $this->info('✅ Verificación de contraseña correcta');
        } else {
            $this->error('❌ Error en verificación de contraseña');
        }

        // Crear una cuenta social de prueba
        $cuentaSocial = $usuario->cuentasSociales()->create([
            'proveedor' => 'google',
            'proveedor_id' => '12345',
            'proveedor_email' => $email,
            'proveedor_nombre' => 'Usuario de Prueba',
            'activo' => true,
        ]);

        $this->info('✅ Cuenta social creada correctamente: ' . $cuentaSocial->proveedor);

        // Limpiar datos de prueba
        $usuario->cuentasSociales()->delete();
        $usuario->tokens()->delete();
        $usuario->roles()->detach();
        $usuario->delete();

        $this->info('🧹 Datos de prueba eliminados');
        $this->info('🎉 ¡Todas las pruebas de autenticación pasaron correctamente!');

    } catch (\Exception $e) {
        $this->error('❌ Error en las pruebas: ' . $e->getMessage());
    }
})->purpose('Probar el sistema completo de autenticación');



Artisan::command('roles:listar', function () {
    $this->info('📋 Roles actuales en el sistema:');

    $roles = \App\Models\Rol::all();

    if ($roles->count() > 0) {
        foreach ($roles as $rol) {
            $this->info('🏷️  ' . $rol->nombre . ' (ID: ' . $rol->id . ')');
            $this->info('   Descripción: ' . $rol->descripcion);
            $this->info('   Estado: ' . ($rol->activo ? 'Activo' : 'Inactivo'));
            $this->info('   Creado: ' . $rol->created_at->format('d/m/Y H:i'));
            $this->line('');
        }
    } else {
        $this->warn('No se encontraron roles en el sistema');
    }
})->purpose('Listar todos los roles del sistema');

Artisan::command('test:email-verification', function () {
    $this->info('📧 Probando flujo completo de verificación de email...');

    try {
        // Crear usuario de prueba sin verificar
        $email = 'test.verification.' . time() . '@vocaccion.com';
        $password = 'password123';

        $usuario = Usuario::create([
            'nombre' => 'Usuario Verificación',
            'email' => $email,
            'password' => Hash::make($password),
        ]);

        $this->info('✅ Usuario creado: ' . $usuario->email);
        $this->info('📧 Email verificado: ' . ($usuario->hasVerifiedEmail() ? 'Sí' : 'No'));

        // Simular verificación de email
        $this->info('🔄 Verificando email manualmente...');
        $usuario->markEmailAsVerified();

        $this->info('✅ Email verificado: ' . ($usuario->hasVerifiedEmail() ? 'Sí' : 'No'));
        $this->info('📅 Verificado en: ' . $usuario->email_verified_at);

        // Probar login después de verificación
        $this->info('🔐 Probando login después de verificación...');
        if (Hash::check($password, $usuario->password) && $usuario->hasVerifiedEmail()) {
            $this->info('✅ Login sería exitoso');
        } else {
            $this->error('❌ Login fallaría');
        }

        // Limpiar
        $usuario->delete();
        $this->info('🧹 Usuario de prueba eliminado');

        $this->info('🎉 ¡Flujo de verificación de email funcionando correctamente!');

    } catch (\Exception $e) {
        $this->error('❌ Error en las pruebas: ' . $e->getMessage());
    }
})->purpose('Probar el flujo completo de verificación de email');

//  Si la fecha de creación es mayor que la fecha actual menos 30 días y el email no está verificado lo borramos
Artisan::command('usuarios:eliminar', function () {
    $limite = now()->subDays(30);
    $usuariosEliminados = Usuario::whereNull('email_verified_at')->where('created_at', '<', $limite)->get();
    $contador = 0;

    foreach ($usuariosEliminados as $usuario) {
        $usuario->delete();
        $contador++;
    }
    Log::info('Usuarios no verificados eliminados: ' . $contador);
})->purpose('Elimina usuarios no verificados tras 30 días');

Schedule::command('usuarios:eliminar')->daily();
