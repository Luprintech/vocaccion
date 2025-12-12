<?php

namespace App\Http\Controllers;

use App\Models\Usuario;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Mail;

class PasswordResetController extends Controller
{
    /**
     * Enviar email de recuperación de contraseña
     * POST /api/forgot-password
     */
    public function forgotPassword(Request $request)
    {
        $request->validate([
            'email' => 'required|email|exists:usuarios,email',
        ]);

        $usuario = Usuario::where('email', $request->email)->first();

        if (!$usuario) {
            // Respuesta genérica por seguridad (no revelar si email existe)
            return response()->json([
                'message' => 'Si el email existe en nuestro sistema, recibirás un enlace de recuperación.',
            ], 200);
        }

        // Generar token único
        $token = Str::random(60);

        // Guardar en BD con tiempo de expiración (1 hora)
        DB::table('password_reset_tokens')->updateOrInsert(
            ['email' => $usuario->email],
            [
                'email' => $usuario->email,
                'token' => Hash::make($token),
                'created_at' => now(),
            ]
        );

        // Generar URL del reset (apunta al frontend)
        $resetUrl = env('FRONTEND_URL', 'http://localhost:5173') . "/reset-password?token={$token}&email={$usuario->email}";

        // Enviar email
        try {
            Mail::send('emails.password-reset', [
                'usuario' => $usuario,
                'resetUrl' => $resetUrl,
            ], function ($message) use ($usuario) {
                $message->to($usuario->email)
                    ->subject('Recupera tu contraseña - Vocacción');
            });

            return response()->json([
                'message' => 'Email de recuperación enviado correctamente.',
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error al enviar el email. Intenta más tarde.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Validar token de recuperación
     * POST /api/verify-reset-token
     */
    public function verifyResetToken(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'token' => 'required|string',
        ]);

        $passwordReset = DB::table('password_reset_tokens')
            ->where('email', $request->email)
            ->first();

        if (!$passwordReset) {
            return response()->json([
                'valid' => false,
                'message' => 'Token no válido o expirado.',
            ], 404);
        }

        // Verificar que el token no haya expirado (1 hora)
        if (now()->diffInMinutes($passwordReset->created_at) > 60) {
            DB::table('password_reset_tokens')->where('email', $request->email)->delete();
            return response()->json([
                'valid' => false,
                'message' => 'Token expirado. Solicita uno nuevo.',
            ], 410);
        }

        // Verificar el token
        if (!Hash::check($request->token, $passwordReset->token)) {
            return response()->json([
                'valid' => false,
                'message' => 'Token no válido.',
            ], 403);
        }

        return response()->json([
            'valid' => true,
            'message' => 'Token válido.',
        ], 200);
    }

    /**
     * Resetear contraseña
     * POST /api/reset-password
     */
    public function resetPassword(Request $request)
    {
        $request->validate([
            'email' => 'required|email|exists:usuarios,email',
            'token' => 'required|string',
            'password' => 'required|string|min:6|confirmed',
        ]);

        $usuario = Usuario::where('email', $request->email)->first();
        $passwordReset = DB::table('password_reset_tokens')
            ->where('email', $request->email)
            ->first();

        if (!$passwordReset) {
            return response()->json([
                'valid' => false,
                'message' => 'Token no válido o expirado.',
            ], 404);
        }

        // Verificar que el token no haya expirado
        if (now()->diffInMinutes($passwordReset->created_at) > 60) {
            DB::table('password_reset_tokens')->where('email', $request->email)->delete();
            return response()->json([
                'valid' => false,
                'message' => 'Token expirado. Solicita uno nuevo.',
            ], 410);
        }

        // Verificar el token
        if (!Hash::check($request->token, $passwordReset->token)) {
            return response()->json([
                'valid' => false,
                'message' => 'Token no válido.',
            ], 403);
        }

        // Actualizar contraseña
        $usuario->update([
            'password' => Hash::make($request->password),
        ]);

        // Eliminar token usado
        DB::table('password_reset_tokens')->where('email', $request->email)->delete();

        return response()->json([
            'message' => 'Contraseña actualizada correctamente. Ya puedes iniciar sesión.',
        ], 200);
    }

    /**
     * Ruta web: Mostrar formulario de reset (GET /reset-password/{token})
     */
    public function showResetForm(Request $request)
    {
        $token = $request->token;
        $email = $request->email;

        // Aquí simplemente pasamos los parámetros a la vista
        // El front debería manejar esto, pero dejamos la opción web
        return view('auth.reset-password', [
            'token' => $token,
            'email' => $email,
        ]);
    }
}
