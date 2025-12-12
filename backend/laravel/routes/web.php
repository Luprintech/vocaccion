<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Foundation\Auth\EmailVerificationRequest;
use App\Models\Usuario;

Route::get('testweb', function() { return 'web ok'; });

// Ruta de verificación de email (guest-friendly): muestra una vista HTML en lugar de JSON
use Illuminate\Auth\Events\Verified;

Route::get('email/verify/{id}/{hash}', function ($id, $hash) {
    $usuario = \App\Models\Usuario::find($id);

    if (! $usuario) {
        return view('auth.verify_failed', ['message' => 'Usuario no encontrado.']);
    }

    // Validar el hash
    if (! hash_equals((string) $hash, sha1($usuario->getEmailForVerification()))) {
        return view('auth.verify_failed', ['message' => 'Enlace de verificación no válido o caducado.']);
    }

    if ($usuario->hasVerifiedEmail()) {
        return view('auth.verify_success', ['message' => 'El correo ya está verificado.']);
    }

    $usuario->markEmailAsVerified();
    event(new Verified($usuario));

    return view('auth.verify_success', ['message' => '¡Tu correo ha sido verificado correctamente!']);
})->middleware(['signed'])->name('verification.verify');

Route::get('/', function () {
    return view('welcome');
});

Route::get('login', function () {
    return response()->json(['message' => 'Página de login']);
})->name('login');
