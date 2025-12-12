<?php

namespace App\Http\Controllers;

use App\Models\Usuario;
use App\Models\Rol;
use App\Models\CuentaSocial;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Laravel\Socialite\Facades\Socialite;
use Illuminate\Support\Str;
use Exception;

class GoogleAuthController extends Controller
{
    /**
     * Redirigir a Google para autenticación
     */
    public function redirectToGoogle(Request $request)
    {
        try {
            // Asegurar que la sesión esté iniciada
            if (!$request->hasSession()) {
                $request->setLaravelSession(app('session.store'));
            }

            // Iniciar la sesión manualmente
            $request->session()->start();

            return Socialite::driver('google')->redirect();
        } catch (Exception $e) {
            Log::error('Google OAuth Error: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'error' => 'Error al conectar con Google',
                'message' => 'No se pudo establecer la conexión con Google. Verifica la configuración.',
                'debug' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * Procesar callback de Google
     */
    public function handleGoogleCallback(Request $request)
    {
        try {
            // Obtener usuario de Google
            $googleUser = Socialite::driver('google')->user();

            // Verificar que tenemos los datos necesarios
            if (!$googleUser->getId() || !$googleUser->getEmail()) {
                return $this->redirectWithError('invalid_google_response', 'No se pudieron obtener los datos necesarios de Google.');
            }

            // Buscar si ya existe una cuenta social con este proveedor_id
            $cuentaSocial = CuentaSocial::where('proveedor', 'google')
                ->where('proveedor_id', $googleUser->getId())
                ->first();

            if ($cuentaSocial) {
                // Usuario ya registrado con Google - hacer login
                return $this->loginExistingGoogleUser($cuentaSocial, $googleUser);
            } else {
                // Usuario no registrado con Google - verificar si el email ya existe
                return $this->handleNewGoogleUser($googleUser);
            }

        } catch (Exception $e) {
            Log::error('Error en Google OAuth callback', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return $this->redirectWithError('oauth_error', 'Error durante la autenticación con Google.');
        }
    }

    /**
     * Login de usuario existente con Google
     */
    private function loginExistingGoogleUser(CuentaSocial $cuentaSocial, $googleUser)
    {
        $usuario = $cuentaSocial->usuario;

        // Verificar que el usuario esté activo (si tienes campo activo)
        // if (!$usuario->activo) {
        //     return $this->redirectWithError('user_inactive', 'Tu cuenta está inactiva.');
        // }

        // Actualizar datos de la cuenta social
        $cuentaSocial->update([
            'proveedor_email' => $googleUser->getEmail(),
            'proveedor_nombre' => $googleUser->getName(),
            'avatar' => $googleUser->getAvatar(),
        ]);

        // Generar token
        $token = $usuario->createToken('google_auth_token')->plainTextToken;

        // Obtener roles del usuario
        $roles = $usuario->roles()->get(['roles.id', 'roles.nombre']);

        return $this->redirectWithSuccess($token, [
            'id' => $usuario->id,
            'nombre' => $usuario->nombre,
            'email' => $usuario->email,
            'email_verified_at' => $usuario->email_verified_at,
            'roles' => $roles,
        ]);
    }

    /**
     * Manejar nuevo usuario de Google
     */
    private function handleNewGoogleUser($googleUser)
    {
        // Verificar si ya existe un usuario con este email
        $usuarioExistente = Usuario::where('email', $googleUser->getEmail())->first();

        if ($usuarioExistente) {
            // El email ya existe pero no está vinculado a Google
            return $this->redirectWithError(
                'email_already_registered',
                'Este correo ya está registrado con método tradicional. Usa tu contraseña para iniciar sesión.'
            );
        }

        // Crear nuevo usuario
        return $this->createNewGoogleUser($googleUser);
    }

    /**
     * Crear nuevo usuario desde Google
     */
    private function createNewGoogleUser($googleUser)
    {
        try {
            // Crear usuario
            $usuario = Usuario::forceCreate([
                'nombre' => $googleUser->getName(),
                'email' => $googleUser->getEmail(),
                'password' => bcrypt(Str::random(32)), // Password random ya que no se usará
                'email_verified_at' => now(), // Confiamos en Google para la verificación
                'google_id' => $googleUser->getId(),
            ]);

            // Asignar rol "estudiante"
            $rolEstudiante = Rol::where('nombre', 'estudiante')->first();
            if ($rolEstudiante) {
                $usuario->roles()->attach($rolEstudiante);
            }

            // Crear cuenta social
            $cuentaSocial = CuentaSocial::create([
                'usuario_id' => $usuario->id,
                'proveedor' => 'google',
                'proveedor_id' => $googleUser->getId(),
                'proveedor_email' => $googleUser->getEmail(),
                'proveedor_nombre' => $googleUser->getName(),
                'avatar' => $googleUser->getAvatar(),
                'activo' => true,
            ]);

            // Generar token
            $token = $usuario->createToken('google_auth_token')->plainTextToken;

            // Obtener roles del usuario
            $roles = $usuario->roles()->get(['roles.id', 'roles.nombre']);

            return $this->redirectWithSuccess($token, [
                'id' => $usuario->id,
                'nombre' => $usuario->nombre,
                'email' => $usuario->email,
                'email_verified_at' => $usuario->email_verified_at,
                'roles' => $roles,
            ], true); // true = nuevo usuario

        } catch (Exception $e) {
            Log::error('Error creando usuario desde Google', [
                'error' => $e->getMessage(),
                'google_user' => $googleUser->getRaw()
            ]);

            return $this->redirectWithError('user_creation_failed', 'Error al crear la cuenta.');
        }
    }

    /**
     * Redirigir al frontend con éxito
     */
    private function redirectWithSuccess($token, $userData, $isNewUser = false)
    {
        $frontendUrl = env('FRONTEND_URL', 'http://localhost:5173');
        $params = http_build_query([
            'token' => $token,
            'user' => base64_encode(json_encode($userData)),
            'new_user' => $isNewUser ? '1' : '0',
            'provider' => 'google'
        ]);

        return redirect($frontendUrl . '/oauth/callback?' . $params);
    }

    /**
     * Redirigir al frontend con error
     */
    private function redirectWithError($errorCode, $errorMessage)
    {
        $frontendUrl = env('FRONTEND_URL', 'http://localhost:5173');
        $params = http_build_query([
            'error' => $errorCode,
            'message' => $errorMessage,
            'provider' => 'google'
        ]);

        return redirect($frontendUrl . '/oauth/callback?' . $params);
    }

    /**
     * API endpoint para obtener URL de Google (alternativo para SPAs)
     */
    public function getGoogleUrl()
    {
        try {
            $url = Socialite::driver('google')->redirect()->getTargetUrl();

            return response()->json([
                'url' => $url
            ]);
        } catch (Exception $e) {
            return response()->json([
                'error' => 'Error al generar URL de Google',
                'message' => $e->getMessage()
            ], 500);
        }
    }
}