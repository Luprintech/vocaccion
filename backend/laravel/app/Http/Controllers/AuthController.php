<?php

namespace App\Http\Controllers;

use App\Models\Usuario;
use App\Models\Rol;
use App\Models\Formacion;
use App\Models\Experiencia;
use App\Models\Idioma;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;


class AuthController extends Controller
{
    // Registro de usuario
    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'nombre' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:usuarios',
            'password' => 'required|string|min:6',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $usuario = Usuario::create([
            'nombre' => $request->nombre,
            'email' => $request->email,
            'password' => Hash::make($request->password),
        ]);

        // Asignar rol "estudiante" automáticamente
        $rolEstudiante = Rol::where('nombre', 'estudiante')->first();
        if ($rolEstudiante) {
            $usuario->roles()->attach($rolEstudiante);
        }

        // Crear suscripción GRATUITA por defecto (solo si la tabla existe)
        if (\Schema::hasTable('suscripciones')) {
            \DB::table('suscripciones')->insert([
                'usuario_id' => $usuario->id,
                'tipo_plan' => 'gratuito',
                'estado' => 'activa',
                'fecha_inicio' => now(),
                'fecha_fin' => now()->addYears(100), // Indefinido
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        // Enviar email de verificación
        $usuario->sendEmailVerificationNotification();

        return response()->json([
            'message' => 'Usuario registrado correctamente. Hemos enviado un enlace de verificación a tu correo. Revisa tu bandeja para activarlo.',
            'email_sent' => true,
            'email' => $usuario->email
        ], 201);
    }

    // Login de usuario
    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|string|email',
            'password' => 'required|string',
        ]);



        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $usuario = Usuario::where('email', $request->email)->first();

        if (!$usuario || !Hash::check($request->password, $usuario->password)) {
            return response()->json(['error' => 'Credenciales incorrectas'], 401);
        }

        // Verificar si el email está verificado
        if (is_null($usuario->email_verified_at)) {
            return response()->json([
                'error' => 'Tu correo aún no ha sido verificado. Revisa tu bandeja para continuar.',
                'email_verified' => false,
                'email' => $usuario->email
            ], 403);
        }

        // Generar token de Sanctum
        $token = $usuario->createToken('auth_token')->plainTextToken;

        // Obtener roles del usuario con estructura clara para el frontend
        $roles = $usuario->roles()->get(['roles.id', 'roles.nombre'])->toArray();

        return response()->json([
            'message' => 'Login correcto',
            'token' => $token,
            'usuario' => [
                'id' => $usuario->id,
                'nombre' => $usuario->nombre,
                'email' => $usuario->email,
                'roles' => $roles, // Array de objetos con 'id' y 'nombre'
            ],
            'email_verificado' => !is_null($usuario->email_verified_at)
        ], 200);
    }

    // Consultar perfil del usuario autenticado
    public function profile(Request $request)
    {
        /** @var Usuario $usuario */
        $usuario = $request->user();

        if (!$usuario) {
            return response()->json(['error' => 'Usuario no autenticado'], 401);
        }

        // Refrescar el usuario desde la base de datos para asegurar datos actualizados
        $usuario->refresh();

        // Obtener perfil completo si existe
        $perfil = $usuario->perfil;

        $profileImageUrl = $this->resolveProfileImageUrl($usuario->profile_image);

        Log::info(' GET /api/profile', [
            'usuario_id' => $usuario->id,
            'profile_image_db' => $usuario->profile_image,
            'profile_image_url' => $profileImageUrl
        ]);

        if ($perfil) {
            $perfilCompleto = $perfil->load([
                'formaciones' => function ($query) {
                $query->orderBy('fecha_inicio', 'desc');
            },
                'experiencias' => function ($query) {
                $query->orderBy('fecha_inicio', 'desc');
            },
                'idiomas' => function ($query) {
                $query->orderBy('idioma', 'asc');
            },
                'habilidades',
                'intereses'
            ]);

            return response()->json([
                'success' => true,
                'data' => $perfilCompleto->getPerfilCompleto(),
                'profile_image' => $profileImageUrl
            ], 200);
        }

        return response()->json([
            'success' => true,
            'data' => null,
            'profile_image' => $profileImageUrl
        ], 200);
    }

    // Eliminar imagen de perfil
    public function deleteProfileImage(Request $request)
    {
        /** @var Usuario $usuario */
        $usuario = $request->user();

        if (!$usuario) {
            return response()->json(['error' => 'Usuario no autenticado'], 401);
        }

        // Eliminar archivo físico si existe
        if ($usuario->profile_image) {
            $normalizedPath = $this->normalizeStoragePath($usuario->profile_image);
            $filePath = storage_path('app/public/' . $normalizedPath);
            if (file_exists($filePath)) {
                unlink($filePath);
            }
        }

        // Limpiar el campo en la base de datos
        $usuario->profile_image = null;
        $usuario->save();

        Log::info('🗑️ Imagen de perfil eliminada', ['usuario_id' => $usuario->id]);

        return response()->json([
            'success' => true,
            'message' => 'Imagen de perfil eliminada correctamente'
        ], 200);
    }

    // Editar perfil del usuario autenticado
    public function updateProfile(Request $request)
    {
        /** @var Usuario $usuario */
        $usuario = $request->user();
        if (!$usuario) {
            return response()->json(['error' => 'Usuario no autenticado'], 401);
        }

        // MANEJO DE IMAGEN DE PERFIL
        if ($request->hasFile('profile_image')) {
            try {
                // Validar imagen
                $request->validate([
                    'profile_image' => 'required|image|mimes:jpeg,jpg,png,gif|max:2048',
                ]);

                // Eliminar imagen anterior si existe
                if ($usuario->profile_image) {
                    Storage::disk('public')->delete($this->normalizeStoragePath($usuario->profile_image));
                }

                // Guardar nueva imagen
                $path = $request->file('profile_image')->store('profile_images', 'public');
                $usuario->profile_image = $path;
                $usuario->save();

                Log::info('✅ Imagen guardada correctamente', ['path' => $path]);

                // Si viene FormData, los datos del perfil están en 'data' como JSON
                $requestData = json_decode($request->input('data'), true);

                if (!$requestData || empty($requestData)) {
                    return response()->json([
                        'success' => true,
                        'message' => 'Imagen de perfil actualizada correctamente',
                        'usuario' => $usuario->fresh()->load('perfil'),
                        'profile_image' => $this->resolveProfileImageUrl($usuario->profile_image)
                    ]);
                }
            }
            catch (\Illuminate\Validation\ValidationException $e) {
                Log::error('❌ Error validando imagen', ['errors' => $e->errors()]);
                return response()->json([
                    'success' => false,
                    'error' => 'Error al validar la imagen',
                    'details' => $e->errors()
                ], 422);
            }
            catch (\Exception $e) {
                Log::error('❌ Error guardando imagen', ['message' => $e->getMessage()]);
                return response()->json([
                    'success' => false,
                    'error' => 'Error al guardar la imagen: ' . $e->getMessage()
                ], 500);
            }
        }
        else {
            // Si no hay imagen, los datos vienen directamente en el request
            $requestData = $request->all();
        }

        // Obtener el perfil
        $perfil = $usuario->perfil ?? $usuario->crearPerfilSiNoExiste();

        // Si SOLO se está subiendo imagen, no validar ni actualizar datos personales
        $soloImagen = $request->hasFile('profile_image') &&
            (!isset($requestData['informacion_personal']) ||
            empty(array_filter($requestData['informacion_personal'] ?? [])));

        if ($soloImagen) {
            // Solo se subió imagen, ya se guardó arriba, retornamos éxito
            return response()->json([
                'success' => true,
                'message' => 'Imagen de perfil actualizada correctamente',
                'usuario' => $usuario->fresh()->load('perfil')
            ]);
        }

        //  Verificar que se estén enviando datos personales mínimos
        $hayDatosPersonales = isset($requestData['informacion_personal']) &&
            !empty($requestData['informacion_personal']['nombre']) &&
            !empty($requestData['informacion_personal']['apellidos']);

        //  Si hay datos válidos, actualizamos
        if ($hayDatosPersonales) {
            $perfil->fill([
                'nombre' => $requestData['informacion_personal']['nombre'] ?? $perfil->nombre,
                'apellidos' => $requestData['informacion_personal']['apellidos'] ?? $perfil->apellidos,
                'ciudad' => $requestData['informacion_personal']['ciudad'] ?? $perfil->ciudad,
                'dni' => $requestData['informacion_personal']['dni'] ?? $perfil->dni,
                'telefono' => $requestData['informacion_personal']['telefono'] ?? $perfil->telefono,
                'fecha_nacimiento' => $requestData['informacion_personal']['fecha_nacimiento'] ?? $perfil->fecha_nacimiento,
            ]);

            $perfil->save();
        }

        //  Formaciones
        if (isset($requestData['formacion']) && is_array($requestData['formacion'])) {
            try {
                // Obtener IDs que vienen del frontend (para actualizar)
                $formacionIdsEnviados = array_filter(array_column($requestData['formacion'], 'id'));

                // Eliminar formaciones que YA NO están en el frontend (fueron borradas)
                if (!empty($formacionIdsEnviados)) {
                    $perfil->formaciones()->whereNotIn('id', $formacionIdsEnviados)->delete();
                }
                else {
                    // Si no hay IDs (todo es nuevo), borrar todas las formaciones antiguas
                    $perfil->formaciones()->delete();
                }

                foreach ($requestData['formacion'] as $formacionData) {
                    //  Validar campos obligatorios
                    if (
                    empty($formacionData['nivel']) ||
                    empty($formacionData['centro_estudios']) ||
                    empty($formacionData['titulo_obtenido']) ||
                    empty($formacionData['fecha_inicio'])
                    ) {
                        return response()->json([
                            'error' => 'Por favor completa todos los campos obligatorios en Formación.'
                        ], 422);
                    }

                    // Si tiene ID, actualizar; si no, crear nuevo
                    if (!empty($formacionData['id'])) {
                        $perfil->formaciones()->updateOrCreate(
                        ['id' => $formacionData['id']],
                            $formacionData
                        );
                    }
                    else {
                        $perfil->formaciones()->create($formacionData);
                    }
                }
            }
            catch (\Exception $e) {
                return response()->json([
                    'error' => 'Error al procesar las formaciones: ' . $e->getMessage()
                ], 500);
            }
        }

        //  Experiencias
        if (isset($requestData['experiencia_laboral']) && is_array($requestData['experiencia_laboral'])) {
            try {
                // Obtener IDs que vienen del frontend
                $experienciaIdsEnviados = array_filter(array_column($requestData['experiencia_laboral'], 'id'));

                // Eliminar experiencias que YA NO están
                if (!empty($experienciaIdsEnviados)) {
                    $perfil->experiencias()->whereNotIn('id', $experienciaIdsEnviados)->delete();
                }
                else {
                    $perfil->experiencias()->delete();
                }

                foreach ($requestData['experiencia_laboral'] as $experienciaData) {
                    //  Validar campos obligatorios
                    if (
                    empty($experienciaData['puesto']) ||
                    empty($experienciaData['empresa']) ||
                    empty($experienciaData['fecha_inicio'])
                    ) {
                        return response()->json([
                            'error' => 'Por favor completa todos los campos obligatorios en Experiencia Laboral.'
                        ], 422);
                    }

                    // Si tiene ID, actualizar; si no, crear
                    if (!empty($experienciaData['id'])) {
                        $perfil->experiencias()->updateOrCreate(
                        ['id' => $experienciaData['id']],
                            $experienciaData
                        );
                    }
                    else {
                        $perfil->experiencias()->create($experienciaData);
                    }
                }
            }
            catch (\Exception $e) {
                return response()->json([
                    'error' => 'Error al procesar las experiencias: ' . $e->getMessage()
                ], 500);
            }
        }

        //  Idiomas
        if (isset($requestData['idiomas']) && is_array($requestData['idiomas'])) {
            try {
                // Obtener IDs que vienen del frontend
                $idiomaIdsEnviados = array_filter(array_column($requestData['idiomas'], 'id'));

                // Eliminar idiomas que YA NO están
                if (!empty($idiomaIdsEnviados)) {
                    $perfil->idiomas()->whereNotIn('id', $idiomaIdsEnviados)->delete();
                }
                else {
                    $perfil->idiomas()->delete();
                }

                foreach ($requestData['idiomas'] as $idiomaData) {
                    //  Validar campos obligatorios
                    if (empty($idiomaData['idioma']) || empty($idiomaData['nivel'])) {
                        return response()->json([
                            'error' => 'Por favor completa todos los campos obligatorios en Idiomas.'
                        ], 422);
                    }

                    // Si tiene ID, actualizar; si no, crear
                    if (!empty($idiomaData['id'])) {
                        $perfil->idiomas()->updateOrCreate(
                        ['id' => $idiomaData['id']],
                            $idiomaData
                        );
                    }
                    else {
                        $perfil->idiomas()->create($idiomaData);
                    }
                }
            }
            catch (\Exception $e) {
                return response()->json([
                    'error' => 'Error al procesar los idiomas: ' . $e->getMessage()
                ], 500);
            }
        }

        //  Habilidades
        if (isset($requestData['habilidades_intereses']['habilidades']) && is_array($requestData['habilidades_intereses']['habilidades'])) {
            // Limpiar habilidades existentes y crear nuevas
            $perfil->habilidades()->delete();
            foreach ($requestData['habilidades_intereses']['habilidades'] as $habilidad) {
                // Soportar tanto strings como objetos
                $nombreHabilidad = is_string($habilidad) ? $habilidad : ($habilidad['nombre'] ?? null);
                if ($nombreHabilidad) {
                    $perfil->habilidades()->create(['nombre' => $nombreHabilidad]);
                }
            }
        }

        //  Intereses
        if (isset($requestData['habilidades_intereses']['intereses']) && is_array($requestData['habilidades_intereses']['intereses'])) {
            // Limpiar intereses existentes y crear nuevos
            $perfil->intereses()->delete();
            foreach ($requestData['habilidades_intereses']['intereses'] as $interes) {
                // Soportar tanto strings como objetos
                $nombreInteres = is_string($interes) ? $interes : ($interes['nombre'] ?? null);
                if ($nombreInteres) {
                    $perfil->intereses()->create(['nombre' => $nombreInteres]);
                }
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Perfil actualizado correctamente.',
            'perfil' => $perfil->getPerfilCompleto(),
            'profile_image' => $this->resolveProfileImageUrl($usuario->profile_image)
        ], 200);
    }

    /**
     * Normaliza la ruta guardada para disco public.
     */
    private function normalizeStoragePath(?string $storedPath): ?string
    {
        if (!$storedPath) {
            return null;
        }

        $path = trim($storedPath);

        if (preg_match('#^https?://#i', $path)) {
            $path = parse_url($path, PHP_URL_PATH) ?: '';
        }

        $path = preg_replace('#^/?storage/#', '', $path);

        return ltrim($path, '/');
    }

    /**
     * Genera URL pública robusta para la imagen de perfil.
     */
    private function resolveProfileImageUrl(?string $storedPath): ?string
    {
        if (!$storedPath) {
            return null;
        }

        $raw = trim($storedPath);

        if (preg_match('#^(https?://|data:image/)#i', $raw)) {
            return $raw;
        }

        $normalized = $this->normalizeStoragePath($raw);
        if (!$normalized) {
            return null;
        }

        $url = Storage::disk('public')->url($normalized);

        return preg_match('#^https?://#i', $url) ? $url : url($url);
    }

    // Logout de usuario
    public function logout(Request $request)
    {
        // Para APIs con Sanctum, eliminamos el token actual
        $usuario = $request->user();
        if ($usuario) {
            $usuario->tokens()->delete(); // Eliminar todos los tokens del usuario
        }
        return response()->json(['message' => 'Logout correcto']);
    }

    // Verificar email
    public function verifyEmail(Request $request)
    {
        $usuario = Usuario::find($request->route('id'));

        if (!$usuario) {
            // Redirigir al frontend con error
            return redirect(env('FRONTEND_URL', 'http://localhost:3000') . '/login?error=user_not_found');
        }

        // Verificar que el hash coincide
        if (!hash_equals((string)$request->route('hash'), sha1($usuario->getEmailForVerification()))) {
            // Redirigir al frontend con error
            return redirect(env('FRONTEND_URL', 'http://localhost:3000') . '/login?error=invalid_hash');
        }

        if ($usuario->hasVerifiedEmail()) {
            // Redirigir al frontend indicando que ya estaba verificado
            return redirect(env('FRONTEND_URL', 'http://localhost:3000') . '/login?verified=already');
        }

        if ($usuario->markEmailAsVerified()) {
            // Redirigir al frontend con éxito
            return redirect(env('FRONTEND_URL', 'http://localhost:3000') . '/login?verified=success');
        }

        // Redirigir al frontend con error
        return redirect(env('FRONTEND_URL', 'http://localhost:3000') . '/login?error=verification_failed');
    }

    // Reenviar email de verificación
    public function resendVerification(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|string|email|exists:usuarios,email',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $usuario = Usuario::where('email', $request->email)->first();

        if ($usuario->hasVerifiedEmail()) {
            return response()->json([
                'message' => 'El email ya está verificado',
                'verified' => true
            ], 200);
        }

        $usuario->sendEmailVerificationNotification();

        return response()->json([
            'message' => 'Enlace de verificación reenviado. Revisa tu bandeja de correo.',
            'email_sent' => true
        ], 200);
    }

    // Verificar estado de verificación de email
    public function checkEmailVerification(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|string|email|exists:usuarios,email',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $usuario = Usuario::where('email', $request->email)->first();

        return response()->json([
            'email' => $usuario->email,
            'verified' => !is_null($usuario->email_verified_at),
            'verified_at' => $usuario->email_verified_at
        ], 200);
    }
}
