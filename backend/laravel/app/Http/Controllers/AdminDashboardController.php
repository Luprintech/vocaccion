<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use App\Models\Usuario;
use App\Models\Rol;
use App\Models\Perfil;
use App\Models\Formacion;
use App\Models\Experiencia;
use App\Models\Idioma;
use App\Models\Habilidad;
use App\Models\Interes;
use App\Models\Profesion;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Validator;

/**
 * AdminDashboardController
 * 
 * Controlador completo para el dashboard de administrador.
 * Gestión de usuarios (estudiantes), orientadores y estadísticas.
 * 
 * Rutas protegidas por middleware: auth:sanctum, role:administrador
 * 
 * @package App\Http\Controllers
 */
class AdminDashboardController extends Controller
{
    // =========================================================================
    // DASHBOARD PRINCIPAL
    // =========================================================================

    /**
     * Obtener datos del dashboard del administrador.
     */
    public function index(Request $request)
    {
        $usuario = $request->user();

        return response()->json([
            'success' => true,
            'message' => 'Bienvenido al Dashboard de Administrador',
            'data' => [
                'usuario_id' => $usuario->id,
                'nombre' => $usuario->nombre,
                'email' => $usuario->email,
                'rol' => 'administrador',
            ]
        ], 200);
    }

    /**
     * Estadísticas principales del dashboard.
     */
    public function stats(Request $request)
    {
        $totalUsuarios = Usuario::count();

        // Contar tests completados (usuarios con test_sessions completadas)
        $testsCompletados = DB::table('test_sessions')
            ->whereNotNull('completed_at')
            ->count();

        // Nuevos registros últimos 30 días
        $nuevosRegistros = Usuario::where('created_at', '>=', now()->subDays(30))->count();

        // Orientadores activos
        $orientadoresActivos = Usuario::whereHas('roles', function ($q) {
            $q->where('nombre', 'orientador');
        })->count();

        return response()->json([
            'success' => true,
            'total_usuarios' => $totalUsuarios,
            'tests_completados' => $testsCompletados,
            'nuevos_registros' => $nuevosRegistros,
            'orientadores_activos' => $orientadoresActivos,
        ], 200);
    }

    // =========================================================================
    // GESTIÓN DE USUARIOS (ESTUDIANTES)
    // =========================================================================

    /**
     * Listar todos los estudiantes con paginación y búsqueda.
     */
    public function listarUsuarios(Request $request)
    {
        try {
            // Eager load cuentasSociales to identify Google users
            $query = Usuario::with(['roles', 'perfil', 'cuentasSociales'])
                ->whereHas('roles', function ($q) {
                    $q->where('nombre', 'estudiante');
                });

            // Búsqueda por nombre o email
            if ($request->has('search') && !empty($request->search)) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('nombre', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                });
            }

            // Filtro por estado de verificación
            if ($request->has('verificado')) {
                if ($request->verificado === 'true') {
                    $query->whereNotNull('email_verified_at');
                } else {
                    $query->whereNull('email_verified_at');
                }
            }

            // Ordenamiento
            $orderBy = $request->get('orderBy', 'created_at');
            $order = $request->get('order', 'desc');
            $query->orderBy($orderBy, $order);

            // Paginación
            $perPage = $request->get('per_page', 10);
            $usuarios = $query->paginate($perPage);

            // Añadir información extra a cada usuario
            $usuarios->getCollection()->transform(function ($usuario) {
                // Verificar si tiene test completado
                $testCompletado = DB::table('test_sessions')
                    ->where('usuario_id', $usuario->id)
                    ->whereNotNull('completed_at')
                    ->exists();

                // Verificar si tiene orientador asignado
                $orientadorAsignado = DB::table('orientador_estudiante')
                    ->where('estudiante_id', $usuario->id)
                    ->first();

                $usuario->test_completado = $testCompletado;
                $usuario->orientador_id = $orientadorAsignado ? $orientadorAsignado->orientador_id : null;

                // Polyfill google_id from cuentasSociales if missing
                if (!$usuario->google_id) {
                    $googleAccount = $usuario->cuentasSociales->where('proveedor', 'google')->first();
                    if ($googleAccount) {
                        $usuario->google_id = $googleAccount->proveedor_id;
                    }
                }

                // Get Active Plan
                $planActual = DB::table('suscripciones')
                    ->where('usuario_id', $usuario->id)
                    ->where('estado', 'activa')
                    ->value('tipo_plan');

                $usuario->plan = $planActual ?? 'gratuito'; // Default to gratuito

                return $usuario;
            });


            return response()->json([
                'success' => true,
                'data' => $usuarios
            ], 200);

        } catch (\Exception $e) {
            Log::error('Error listando usuarios: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener usuarios',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener detalle de un usuario específico.
     */
    public function verUsuario(Request $request, $id)
    {
        try {
            $usuario = Usuario::with(['roles', 'perfil', 'objetivo', 'cuentasSociales'])->find($id);

            if (!$usuario) {
                return response()->json([
                    'success' => false,
                    'message' => 'Usuario no encontrado'
                ], 404);
            }

            // Polyfill google_id for view details
            if (!$usuario->google_id) {
                $googleAccount = $usuario->cuentasSociales->where('proveedor', 'google')->first();
                if ($googleAccount) {
                    $usuario->google_id = $googleAccount->proveedor_id;
                }
            }

            // Get Active Plan for details view
            $planActual = DB::table('suscripciones')
                ->where('usuario_id', $usuario->id)
                ->where('estado', 'activa')
                ->value('tipo_plan');

            $usuario->plan = $planActual ?? 'gratuito';

            // Obtener información del test
            $testSession = DB::table('test_sessions')
                ->where('usuario_id', $id)
                ->orderBy('created_at', 'desc')
                ->first();

            // Obtener resultado del test si existe
            $testResult = DB::table('test_results')
                ->where('usuario_id', $id)
                ->orderBy('created_at', 'desc')
                ->first();

            // Obtener orientador asignado
            $asignacion = DB::table('orientador_estudiante')
                ->where('estudiante_id', $id)
                ->first();

            $orientador = null;
            if ($asignacion) {
                $orientador = Usuario::select('id', 'nombre', 'email')->find($asignacion->orientador_id);
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'usuario' => $usuario,
                    'test_session' => $testSession,
                    'test_result' => $testResult,
                    'orientador_asignado' => $orientador,
                    'fecha_asignacion' => $asignacion ? $asignacion->fecha_asignacion : null
                ]
            ], 200);

        } catch (\Exception $e) {
            Log::error('Error viendo usuario: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener usuario',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Actualizar datos de un usuario.
     */
    public function actualizarUsuario(Request $request, $id)
    {
        try {
            $usuario = Usuario::find($id);

            if (!$usuario) {
                return response()->json([
                    'success' => false,
                    'message' => 'Usuario no encontrado'
                ], 404);
            }

            $validated = $request->validate([
                'nombre' => 'sometimes|string|max:255',
                'email' => ['sometimes', 'email', Rule::unique('usuarios')->ignore($id)],
            ]);

            $usuario->update($validated);

            return response()->json([
                'success' => true,
                'message' => 'Usuario actualizado correctamente',
                'data' => $usuario
            ], 200);

        } catch (\Exception $e) {
            Log::error('Error actualizando usuario: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error al actualizar usuario',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Eliminar un usuario.
     */
    public function eliminarUsuario(Request $request, $id)
    {
        try {
            $usuario = Usuario::find($id);

            if (!$usuario) {
                return response()->json([
                    'success' => false,
                    'message' => 'Usuario no encontrado'
                ], 404);
            }

            // No permitir eliminar administradores
            if ($usuario->tieneRol('administrador')) {
                return response()->json([
                    'success' => false,
                    'message' => 'No se puede eliminar un administrador'
                ], 403);
            }

            $usuario->delete();

            return response()->json([
                'success' => true,
                'message' => 'Usuario eliminado correctamente'
            ], 200);

        } catch (\Exception $e) {
            Log::error('Error eliminando usuario: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error al eliminar usuario',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Ver el test completo de un estudiante (preguntas y respuestas).
     */
    public function verTestEstudiante(Request $request, $id)
    {
        try {
            // Verificar si el usuario existe y es estudiante
            $usuario = Usuario::find($id);
            if (!$usuario) {
                return response()->json(['success' => false, 'message' => 'Usuario no encontrado'], 404);
            }

            // Obtener la sesión de test más reciente
            $testSession = DB::table('test_sessions')
                ->where('usuario_id', $id)
                ->whereNotNull('completed_at')
                ->orderBy('completed_at', 'desc')
                ->first();

            // Obtener el resultado del test más reciente
            $testResult = DB::table('test_results')
                ->where('usuario_id', $id)
                ->orderBy('created_at', 'desc')
                ->first();

            if (!$testSession && !$testResult) {
                return response()->json([
                    'success' => false,
                    'message' => 'El estudiante no ha completado el test'
                ], 404);
            }

            // Obtener información del estudiante con nombre desde perfiles
            $estudiante = DB::table('usuarios')
                ->leftJoin('perfiles', 'usuarios.id', '=', 'perfiles.usuario_id')
                ->where('usuarios.id', $id)
                ->select('usuarios.id', 'perfiles.nombre as nombre', 'usuarios.email')
                ->first();

            // Si no hay nombre en perfiles, usar el de usuarios como fallback
            if (!$estudiante->nombre) {
                $usuarioData = DB::table('usuarios')->where('id', $id)->first();
                $estudiante->nombre = $usuarioData->nombre;
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'estudiante' => $estudiante,
                    'session' => $testSession,
                    'result' => $testResult,
                    'questions' => $testSession ? json_decode($testSession->questions, true) : [],
                    'answers' => $testSession ? json_decode($testSession->answers, true) : [],
                    'result_text' => $testResult ? $testResult->result_text : null,
                ]
            ], 200);

        } catch (\Exception $e) {
            Log::error('Error obteniendo test del estudiante (admin): ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener el test'
            ], 500);
        }
    }

    /**
     * Ver las profesiones recomendadas de un estudiante.
     */
    public function verProfesionesEstudiante(Request $request, $id)
    {
        try {
            // Verificar si el usuario existe
            $usuario = Usuario::find($id);
            if (!$usuario) {
                return response()->json(['success' => false, 'message' => 'Usuario no encontrado'], 404);
            }

            // Obtener el resultado del test más reciente
            $testResult = DB::table('test_results')
                ->where('usuario_id', $id)
                ->orderBy('created_at', 'desc')
                ->first();

            if (!$testResult || !$testResult->profesiones) {
                return response()->json([
                    'success' => false,
                    'message' => 'No hay profesiones recomendadas para este estudiante'
                ], 404);
            }

            // Obtener información del estudiante con nombre desde perfiles
            $estudiante = DB::table('usuarios')
                ->leftJoin('perfiles', 'usuarios.id', '=', 'perfiles.usuario_id')
                ->where('usuarios.id', $id)
                ->select('usuarios.id', 'perfiles.nombre as nombre', 'usuarios.email')
                ->first();

            // Si no hay nombre en perfiles, usar el de usuarios como fallback
            if (!$estudiante->nombre) {
                $usuarioData = DB::table('usuarios')->where('id', $id)->first();
                $estudiante->nombre = $usuarioData->nombre;
            }

            // Decodificar JSON de profesiones
            $profesiones = json_decode($testResult->profesiones, true);

            return response()->json([
                'success' => true,
                'data' => [
                    'estudiante' => $estudiante,
                    'profesiones' => $profesiones,
                    'fecha_resultado' => $testResult->created_at,
                ]
            ], 200);

        } catch (\Exception $e) {
            Log::error('Error obteniendo profesiones del estudiante (admin): ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener las profesiones'
            ], 500);
        }
    }

    /**
     * Ver el itinerario académico de un estudiante.
     */
    public function verItinerarioEstudiante(Request $request, $id)
    {
        try {
            // Verificar si el usuario existe
            $usuario = Usuario::find($id);
            if (!$usuario) {
                return response()->json(['success' => false, 'message' => 'Usuario no encontrado'], 404);
            }

            // Obtener el itinerario más reciente
            $itinerario = DB::table('itinerarios_generados')
                ->where('user_id', $id)
                ->orderBy('created_at', 'desc')
                ->first();

            if (!$itinerario) {
                return response()->json([
                    'success' => false,
                    'message' => 'No hay itinerario generado para este estudiante'
                ], 404);
            }

            // Obtener información del estudiante con nombre desde perfiles
            $estudiante = DB::table('usuarios')
                ->leftJoin('perfiles', 'usuarios.id', '=', 'perfiles.usuario_id')
                ->where('usuarios.id', $id)
                ->select('usuarios.id', 'perfiles.nombre as nombre', 'usuarios.email')
                ->first();

            // Si no hay nombre en perfiles, usar el de usuarios como fallback
            if (!$estudiante->nombre) {
                $usuarioData = DB::table('usuarios')->where('id', $id)->first();
                $estudiante->nombre = $usuarioData->nombre;
            }

            // Decodificar el contenido del itinerario (la columna se llama texto_html)
            $contenido = json_decode($itinerario->texto_html, true);

            return response()->json([
                'success' => true,
                'data' => [
                    'estudiante' => $estudiante,
                    'itinerario' => [
                        'id' => $itinerario->id,
                        'profesion' => $itinerario->profesion,
                        'contenido' => $contenido,
                        'created_at' => $itinerario->created_at,
                    ]
                ]
            ], 200);

        } catch (\Exception $e) {
            Log::error('Error obteniendo itinerario del estudiante (admin): ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener el itinerario'
            ], 500);
        }
    }

    // =========================================================================
    // GESTIÓN DE ORIENTADORES
    // =========================================================================

    /**
     * Listar todos los orientadores con sus estudiantes asignados.
     */
    public function listarOrientadores(Request $request)
    {
        try {
            $query = Usuario::with(['roles', 'perfil'])
                ->whereHas('roles', function ($q) {
                    $q->where('nombre', 'orientador');
                });

            // Búsqueda por nombre o email
            if ($request->has('search') && !empty($request->search)) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('nombre', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                });
            }

            $orientadores = $query->orderBy('nombre')->get();

            // Añadir conteo de estudiantes a cada orientador
            $orientadores->transform(function ($orientador) {
                $estudiantesCount = DB::table('orientador_estudiante')
                    ->where('orientador_id', $orientador->id)
                    ->where('estado', 'activo')
                    ->count();

                $orientador->estudiantes_count = $estudiantesCount;
                return $orientador;
            });

            return response()->json([
                'success' => true,
                'data' => $orientadores
            ], 200);

        } catch (\Exception $e) {
            Log::error('Error listando orientadores: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener orientadores',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Ver detalle de un orientador con sus estudiantes.
     */
    public function verOrientador(Request $request, $id)
    {
        try {
            $orientador = Usuario::with(['roles', 'perfil'])->find($id);

            if (!$orientador || !$orientador->tieneRol('orientador')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Orientador no encontrado'
                ], 404);
            }

            // Obtener estudiantes asignados
            $estudiantesIds = DB::table('orientador_estudiante')
                ->where('orientador_id', $id)
                ->pluck('estudiante_id');

            $estudiantes = Usuario::whereIn('id', $estudiantesIds)
                ->select('id', 'nombre', 'email', 'created_at')
                ->get();

            // Añadir info de asignación a cada estudiante
            $estudiantes->transform(function ($est) use ($id) {
                $asignacion = DB::table('orientador_estudiante')
                    ->where('orientador_id', $id)
                    ->where('estudiante_id', $est->id)
                    ->first();

                $est->fecha_asignacion = $asignacion->fecha_asignacion ?? null;
                $est->estado = $asignacion->estado ?? null;
                $est->notas = $asignacion->notas ?? null;

                return $est;
            });

            return response()->json([
                'success' => true,
                'data' => [
                    'orientador' => $orientador,
                    'estudiantes' => $estudiantes
                ]
            ], 200);

        } catch (\Exception $e) {
            Log::error('Error viendo orientador: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener orientador',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Crear un nuevo orientador.
     */
    public function crearOrientador(Request $request)
    {
        try {
            $validated = $request->validate([
                'nombre' => 'required|string|max:255',
                'email' => 'required|email|unique:usuarios,email',
                'password' => 'required|string|min:8',
            ]);

            // Crear usuario
            $orientador = Usuario::forceCreate([
                'nombre' => $validated['nombre'],
                'email' => $validated['email'],
                'password' => Hash::make($validated['password']),
                'email_verified_at' => now(), // Verificado automáticamente
            ]);

            // Asignar rol de orientador
            $rolOrientador = Rol::where('nombre', 'orientador')->first();
            if ($rolOrientador) {
                $orientador->roles()->attach($rolOrientador->id);
            }

            return response()->json([
                'success' => true,
                'message' => 'Orientador creado correctamente',
                'data' => $orientador
            ], 201);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error de validación',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Error creando orientador: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error al crear orientador',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Eliminar un orientador.
     */
    public function eliminarOrientador(Request $request, $id)
    {
        try {
            $orientador = Usuario::find($id);

            if (!$orientador || !$orientador->tieneRol('orientador')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Orientador no encontrado'
                ], 404);
            }

            // Eliminar asignaciones de estudiantes primero
            DB::table('orientador_estudiante')
                ->where('orientador_id', $id)
                ->delete();

            $orientador->delete();

            return response()->json([
                'success' => true,
                'message' => 'Orientador eliminado correctamente'
            ], 200);

        } catch (\Exception $e) {
            Log::error('Error eliminando orientador: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error al eliminar orientador',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Asignar un estudiante a un orientador.
     */
    public function asignarEstudiante(Request $request)
    {
        try {
            $validated = $request->validate([
                'orientador_id' => 'required|exists:usuarios,id',
                'estudiante_id' => 'required|exists:usuarios,id',
                'notas' => 'nullable|string'
            ]);

            // Verificar que el orientador tenga rol de orientador
            $orientador = Usuario::find($validated['orientador_id']);
            if (!$orientador->tieneRol('orientador')) {
                return response()->json([
                    'success' => false,
                    'message' => 'El usuario especificado no es un orientador'
                ], 400);
            }

            // Verificar que el estudiante tenga rol de estudiante
            $estudiante = Usuario::find($validated['estudiante_id']);
            if (!$estudiante->tieneRol('estudiante')) {
                return response()->json([
                    'success' => false,
                    'message' => 'El usuario especificado no es un estudiante'
                ], 400);
            }

            // Verificar si ya está asignado
            $existente = DB::table('orientador_estudiante')
                ->where('estudiante_id', $validated['estudiante_id'])
                ->first();

            if ($existente) {
                // Actualizar asignación existente
                DB::table('orientador_estudiante')
                    ->where('estudiante_id', $validated['estudiante_id'])
                    ->update([
                        'orientador_id' => $validated['orientador_id'],
                        'notas' => $validated['notas'] ?? null,
                        'fecha_asignacion' => now(),
                        'estado' => 'activo',
                        'updated_at' => now()
                    ]);
            } else {
                // Crear nueva asignación
                DB::table('orientador_estudiante')->insert([
                    'orientador_id' => $validated['orientador_id'],
                    'estudiante_id' => $validated['estudiante_id'],
                    'notas' => $validated['notas'] ?? null,
                    'fecha_asignacion' => now(),
                    'estado' => 'activo',
                    'created_at' => now(),
                    'updated_at' => now()
                ]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Estudiante asignado correctamente al orientador'
            ], 200);

        } catch (\Exception $e) {
            Log::error('Error asignando estudiante: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error al asignar estudiante',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Desasignar un estudiante de su orientador.
     */
    public function desasignarEstudiante(Request $request, $estudianteId)
    {
        try {
            $deleted = DB::table('orientador_estudiante')
                ->where('estudiante_id', $estudianteId)
                ->delete();

            if ($deleted) {
                return response()->json([
                    'success' => true,
                    'message' => 'Estudiante desasignado correctamente'
                ], 200);
            }

            return response()->json([
                'success' => false,
                'message' => 'El estudiante no tenía orientador asignado'
            ], 404);

        } catch (\Exception $e) {
            Log::error('Error desasignando estudiante: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error al desasignar estudiante',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener estudiantes sin orientador asignado.
     */
    public function estudiantesSinOrientador(Request $request)
    {
        try {
            $asignados = DB::table('orientador_estudiante')
                ->pluck('estudiante_id')
                ->toArray();

            $estudiantes = Usuario::whereHas('roles', function ($q) {
                $q->where('nombre', 'estudiante');
            })
                ->whereNotIn('id', $asignados)
                ->select('id', 'nombre', 'email', 'created_at')
                ->orderBy('nombre')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $estudiantes
            ], 200);

        } catch (\Exception $e) {
            Log::error('Error obteniendo estudiantes sin orientador: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener estudiantes',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // =========================================================================
    // ESTADÍSTICAS AVANZADAS
    // =========================================================================

    /**
     * Obtener estadísticas completas de la plataforma.
     */
    public function estadisticas(Request $request)
    {
        try {
            // Totales generales
            // Filtro para excluir usuarios de seed (@vocaccion.com)
            $dominioSeed = '%@vocaccion.com';

            $totalUsuarios = Usuario::where('email', 'not like', $dominioSeed)->count();
            $totalEstudiantes = Usuario::where('email', 'not like', $dominioSeed)
                ->whereHas('roles', fn($q) => $q->where('nombre', 'estudiante'))->count();
            $totalOrientadores = Usuario::where('email', 'not like', $dominioSeed)
                ->whereHas('roles', fn($q) => $q->where('nombre', 'orientador'))->count();

            // Tests (filtrando usuarios seed)
            $testsCompletados = DB::table('test_sessions')
                ->join('usuarios', 'test_sessions.usuario_id', '=', 'usuarios.id')
                ->where('usuarios.email', 'not like', $dominioSeed)
                ->whereNotNull('completed_at')
                ->count();
            $testsEnProgreso = DB::table('test_sessions')
                ->join('usuarios', 'test_sessions.usuario_id', '=', 'usuarios.id')
                ->where('usuarios.email', 'not like', $dominioSeed)
                ->whereNull('completed_at')
                ->count();

            // Registros por período
            $registrosHoy = Usuario::where('email', 'not like', $dominioSeed)->whereDate('created_at', today())->count();
            $registrosSemana = Usuario::where('email', 'not like', $dominioSeed)->where('created_at', '>=', now()->subWeek())->count();
            $registrosMes = Usuario::where('email', 'not like', $dominioSeed)->where('created_at', '>=', now()->subMonth())->count();

            // Registros por mes (últimos 6 meses)
            $registrosPorMes = [];
            for ($i = 5; $i >= 0; $i--) {
                $fecha = now()->subMonths($i);
                $count = Usuario::where('email', 'not like', $dominioSeed)
                    ->whereYear('created_at', $fecha->year)
                    ->whereMonth('created_at', $fecha->month)
                    ->count();
                $registrosPorMes[] = [
                    'mes' => $fecha->format('M Y'),
                    'count' => $count
                ];
            }

            // Asignaciones orientador-estudiante
            $estudiantesAsignados = DB::table('orientador_estudiante')
                ->join('usuarios', 'orientador_estudiante.estudiante_id', '=', 'usuarios.id')
                ->where('usuarios.email', 'not like', $dominioSeed)
                ->where('estado', 'activo')
                ->count();
            $estudiantesSinAsignar = max(0, $totalEstudiantes - $estudiantesAsignados);

            // Top profesiones (de test_results y tabla profesiones)
            // 1. Obtener todas las profesiones base de la tabla 'profesiones' (titulo)
            $profesionesBase = Profesion::pluck('titulo')->toArray();
            $profesionCounts = array_fill_keys($profesionesBase, 0);

            // 2. Contar apariciones en test_results
            $testResults = DB::table('test_results')
                ->join('usuarios', 'test_results.usuario_id', '=', 'usuarios.id')
                ->where('usuarios.email', 'not like', $dominioSeed)
                ->whereNotNull('profesiones')
                ->pluck('profesiones');

            foreach ($testResults as $profesionesJson) {
                // Determine if it is double encoded or just string
                if (is_string($profesionesJson)) {
                    $profesiones = json_decode($profesionesJson, true);
                } else {
                    $profesiones = $profesionesJson;
                }

                if (is_array($profesiones)) {
                    foreach ($profesiones as $profesion) {
                        // Extract name logic
                        $nombre = null;

                        // Case 1: Profession is an array (e.g. from Python script output sometimes)
                        if (is_array($profesion)) {
                            // Check for standard keys
                            if (isset($profesion['titulo']))
                                $nombre = $profesion['titulo'];
                            elseif (isset($profesion['nombre']))
                                $nombre = $profesion['nombre'];
                            elseif (isset($profesion['profesion']))
                                $nombre = $profesion['profesion']; // Just in case
                            elseif (isset($profesion[0]))
                                $nombre = $profesion[0]; // If indexed array
                        }
                        // Case 2: Profession is an object (stdClass) - happens if json_decode wasn't associative
                        elseif (is_object($profesion)) {
                            if (isset($profesion->titulo))
                                $nombre = $profesion->titulo;
                            elseif (isset($profesion->nombre))
                                $nombre = $profesion->nombre;
                            elseif (isset($profesion->profesion))
                                $nombre = $profesion->profesion;
                        }
                        // Case 3: Profession is a string directly
                        elseif (is_string($profesion)) {
                            $nombre = $profesion;
                        }

                        if ($nombre && trim($nombre) !== '') {
                            // Normalizar
                            $found = false;
                            foreach ($profesionCounts as $key => $val) {
                                if (mb_strtolower(trim($key)) === mb_strtolower(trim($nombre))) {
                                    $profesionCounts[$key]++;
                                    $found = true;
                                    break;
                                }
                            }
                            if (!$found) {
                                $profesionCounts[$nombre] = 1;
                            }
                        }
                    }
                }
            }

            // Ordenar por count descendente (y alfabético para empates)
            uksort($profesionCounts, 'strcasecmp'); // Primero alfabético para estabilidad
            arsort($profesionCounts); // Luego por cantidad

            // Tomar top 3 como máximo
            $topProfesiones = collect(array_slice($profesionCounts, 0, 3, true))
                ->map(fn($count, $nombre) => ['profesion' => $nombre, 'count' => $count])
                ->values();

            // Usuarios verificados vs no verificados
            // Ahora consideramos VERIFICADOS si tienen email_verified_at O google_id O cuenta social google vinculada
            $usuariosVerificados = Usuario::where('email', 'not like', $dominioSeed)
                ->where(function ($q) {
                    $q->whereNotNull('email_verified_at')
                        ->orWhereNotNull('google_id')
                        ->orWhereHas('cuentasSociales', function ($q2) {
                            $q2->where('proveedor', 'google');
                        });
                })->count();

            $usuariosNoVerificados = Usuario::where('email', 'not like', $dominioSeed)
                ->whereNull('email_verified_at')
                ->whereNull('google_id')
                ->whereDoesntHave('cuentasSociales', function ($q2) {
                    $q2->where('proveedor', 'google');
                })
                ->count();

            return response()->json([
                'success' => true,
                'data' => [
                    'totales' => [
                        'usuarios' => $totalUsuarios,
                        'estudiantes' => $totalEstudiantes,
                        'orientadores' => $totalOrientadores,
                    ],
                    'tests' => [
                        'completados' => $testsCompletados,
                        'en_progreso' => $testsEnProgreso,
                    ],
                    'registros' => [
                        'hoy' => $registrosHoy,
                        'semana' => $registrosSemana,
                        'mes' => $registrosMes,
                        'por_mes' => $registrosPorMes,
                    ],
                    'asignaciones' => [
                        'asignados' => $estudiantesAsignados,
                        'sin_asignar' => $estudiantesSinAsignar,
                    ],
                    'verificacion' => [
                        'verificados' => $usuariosVerificados,
                        'no_verificados' => $usuariosNoVerificados,
                    ],
                    'top_profesiones' => $topProfesiones,
                ]
            ], 200);

        } catch (\Exception $e) {
            Log::error('Error obteniendo estadísticas: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener estadísticas',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    /**
     * Cambiar el plan de un usuario.
     */
    public function actualizarPlanUsuario(Request $request, $id)
    {
        try {
            $request->validate([
                'plan' => 'required|in:gratuito,pro,pro_plus'
            ]);

            $usuario = Usuario::find($id);
            if (!$usuario) {
                return response()->json(['success' => false, 'message' => 'Usuario no encontrado'], 404);
            }

            $nuevoPlan = $request->plan;

            // Buscar suscripción existente
            $suscripcion = DB::table('suscripciones')->where('usuario_id', $id)->first();

            if ($suscripcion) {
                // Actualizar existente
                DB::table('suscripciones')->where('id', $suscripcion->id)->update([
                    'tipo_plan' => $nuevoPlan,
                    'estado' => 'activa',
                    'updated_at' => now(),
                    // Si se cambia desde admin, reiniciamos la fecha de fin a +1 año
                    'fecha_inicio' => now(),
                    'fecha_fin' => now()->addYear(),
                ]);
            } else {
                // Crear nueva
                DB::table('suscripciones')->insert([
                    'usuario_id' => $id,
                    'tipo_plan' => $nuevoPlan,
                    'estado' => 'activa',
                    'fecha_inicio' => now(),
                    'fecha_fin' => now()->addYear(),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Plan actualizado correctamente',
                'plan' => $nuevoPlan
            ]);

        } catch (\Exception $e) {
            Log::error('Error cambiando plan usuario: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error al cambiar plan',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    /**
     * Obtener perfil completo del estudiante (Admin).
     */
    public function verPerfilEstudiante(Request $request, $id)
    {
        try {
            // Verificar si el usuario existe
            $usuario = Usuario::find($id);
            if (!$usuario) {
                return response()->json(['success' => false, 'message' => 'Usuario no encontrado'], 404);
            }

            // Obtener perfil
            $perfil = $usuario->perfil;

            // Si no tiene perfil, retornamos null en data pero success true
            if (!$perfil) {
                return response()->json([
                    'success' => true,
                    'data' => null
                ], 200);
            }

            // Cargar perfil con todas las relaciones
            $perfilCompleto = Perfil::with([
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
            ])->find($perfil->id);

            $datosPerfil = $perfilCompleto->getPerfilCompleto()->toArray();

            // Logic to handle profile image URL consistent with AuthController
            $profileImageUrl = null;
            if ($usuario->profile_image) {
                // Check if it's already a full URL (from previous admin upload implementation)
                if (filter_var($usuario->profile_image, FILTER_VALIDATE_URL)) {
                    $profileImageUrl = $usuario->profile_image;
                } else {
                    // It's a relative path from storage (standard student upload)
                    $profileImageUrl = asset('storage/' . $usuario->profile_image);
                }
            }
            $datosPerfil['profile_image'] = $profileImageUrl;

            return response()->json([
                'success' => true,
                'data' => $datosPerfil
            ]);

        } catch (\Exception $e) {
            Log::error('Error obteniendo perfil del estudiante (admin): ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener el perfil',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Actualizar perfil completo del estudiante (Admin).
     */
    public function actualizarPerfilEstudiante(Request $request, $id)
    {
        try {
            // Validar los datos de entrada
            $validator = Validator::make($request->all(), [
                'informacion_personal' => 'required|array',
                'informacion_personal.nombre' => 'required|string|max:255',
                'informacion_personal.apellidos' => 'required|string|max:255',
                'informacion_personal.ciudad' => 'required|string|max:255',
                'informacion_personal.dni' => 'nullable|string|max:20',
                'informacion_personal.fecha_nacimiento' => 'nullable|date',
                'informacion_personal.telefono' => 'nullable|string|max:20',
                // Otras validaciones opcionales para subarrays
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Datos de validación incorrectos',
                    'errors' => $validator->errors()
                ], 422);
            }

            $usuario = Usuario::find($id);
            if (!$usuario) {
                return response()->json(['success' => false, 'message' => 'Usuario no encontrado'], 404);
            }

            DB::beginTransaction();

            // 1. Crear o actualizar perfil principal
            $perfil = $usuario->perfil;
            if (!$perfil) {
                $perfil = new Perfil();
                $perfil->usuario_id = $usuario->id;
            }

            $informacionPersonal = $request->input('informacion_personal');
            $perfil->fill([
                'nombre' => $informacionPersonal['nombre'],
                'apellidos' => $informacionPersonal['apellidos'],
                'ciudad' => $informacionPersonal['ciudad'],
                'dni' => $informacionPersonal['dni'] ?? null,
                'fecha_nacimiento' => isset($informacionPersonal['fecha_nacimiento'])
                    ? Carbon::parse($informacionPersonal['fecha_nacimiento'])
                    : null,
                'telefono' => $informacionPersonal['telefono'] ?? null
            ]);


            // Handling Image Upload if present in request
            if ($request->hasFile('profile_image')) {
                // Delete old image if exists
                if ($usuario->profile_image) {
                    // Check if it is a storage file or a public file (legacy)
                    if (filter_var($usuario->profile_image, FILTER_VALIDATE_URL)) {
                        // Legacy public path
                        $oldPath = public_path(str_replace($request->root() . '/', '', $usuario->profile_image));
                        if (file_exists($oldPath))
                            @unlink($oldPath);
                        // Also try just replacing url('/') just in case root differs
                        $oldPath2 = public_path(str_replace(url('/'), '', $usuario->profile_image));
                        if (file_exists($oldPath2))
                            @unlink($oldPath2);
                    } else {
                        // Storage path
                        Storage::disk('public')->delete($usuario->profile_image);
                    }
                }

                $image = $request->file('profile_image');
                // Store in 'profile_images' directory within 'public' disk (storage/app/public/profile_images)
                // This returns the relative path which is what we want in DB
                $path = $image->store('profile_images', 'public');

                $usuario->profile_image = $path;
                $usuario->save();
            }

            $perfil->save();

            // 2. Actualizar formaciones
            if ($request->has('formacion')) {
                $perfil->formaciones()->delete();
                foreach ($request->input('formacion', []) as $formacionData) {
                    $formacion = new Formacion();
                    $formacion->perfil_id = $perfil->id;
                    $formacion->nivel = $formacionData['nivel'];
                    $formacion->centro_estudios = $formacionData['centro_estudios'];
                    $formacion->titulo_obtenido = $formacionData['titulo_obtenido'];
                    $formacion->fecha_inicio = Carbon::parse($formacionData['fecha_inicio']);
                    $formacion->fecha_fin = isset($formacionData['fecha_fin']) && !empty($formacionData['fecha_fin'])
                        ? Carbon::parse($formacionData['fecha_fin'])
                        : null;
                    $formacion->cursando_actualmente = $formacionData['cursando_actualmente'] ?? false;
                    $formacion->save();
                }
            }

            // 3. Actualizar experiencias laborales
            if ($request->has('experiencia_laboral')) {
                $perfil->experiencias()->delete();
                foreach ($request->input('experiencia_laboral', []) as $experienciaData) {
                    $experiencia = new Experiencia();
                    $experiencia->perfil_id = $perfil->id;
                    $experiencia->puesto = $experienciaData['puesto'];
                    $experiencia->empresa = $experienciaData['empresa'];
                    $experiencia->fecha_inicio = Carbon::parse($experienciaData['fecha_inicio']);
                    $experiencia->fecha_fin = isset($experienciaData['fecha_fin']) && !empty($experienciaData['fecha_fin'])
                        ? Carbon::parse($experienciaData['fecha_fin'])
                        : null;
                    $experiencia->descripcion = $experienciaData['descripcion'] ?? null;
                    $experiencia->trabajando_actualmente = $experienciaData['trabajando_actualmente'] ?? false;
                    $experiencia->save();
                }
            }

            // 4. Actualizar idiomas
            if ($request->has('idiomas')) {
                $perfil->idiomas()->delete();
                foreach ($request->input('idiomas', []) as $idiomaData) {
                    $idioma = new Idioma();
                    $idioma->perfil_id = $perfil->id;
                    $idioma->idioma = $idiomaData['idioma'];
                    $idioma->nivel = $idiomaData['nivel'];
                    $idioma->save();
                }
            }

            // 5. Actualizar habilidades e intereses
            if ($request->has('habilidades_intereses')) {
                $perfil->habilidades()->delete();
                $perfil->intereses()->delete();
                $datos = $request->input('habilidades_intereses');

                if (isset($datos['habilidades']) && is_array($datos['habilidades'])) {
                    foreach ($datos['habilidades'] as $habilidadNombre) {
                        $habilidad = new Habilidad(['nombre' => $habilidadNombre]);
                        $habilidad->perfil_id = $perfil->id;
                        $habilidad->save();
                    }
                }

                if (isset($datos['intereses']) && is_array($datos['intereses'])) {
                    foreach ($datos['intereses'] as $interesNombre) {
                        $interes = new Interes(['nombre' => $interesNombre]);
                        $interes->perfil_id = $perfil->id;
                        $interes->save();
                    }
                }
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Perfil actualizado correctamente por administrador',
                'data' => [
                    'perfil_id' => $perfil->id
                ]
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error actualizando perfil del estudiante (admin): ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error al actualizar el perfil',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Eliminar foto de perfil del estudiante (Admin).
     */
    public function eliminarFotoPerfilEstudiante($id)
    {
        try {
            $usuario = Usuario::find($id);
            if (!$usuario) {
                return response()->json(['success' => false, 'message' => 'Usuario no encontrado'], 404);
            }

            if (!$usuario->profile_image) {
                return response()->json(['success' => false, 'message' => 'El usuario no tiene foto de perfil'], 400);
            }

            // Delete existing image file
            if ($usuario->profile_image) {
                if (filter_var($usuario->profile_image, FILTER_VALIDATE_URL)) {
                    // Legacy removal
                    $relativeUrl = str_replace(url('/'), '', $usuario->profile_image);
                    // Handle cases where url() might differ from stored
                    if (strpos($usuario->profile_image, 'http') === 0) {
                        // Extract path segment safely? Simple approach:
                        $parts = explode('/profile_images/', $usuario->profile_image);
                        if (count($parts) > 1) {
                            $oldPath = public_path('profile_images/' . $parts[1]);
                            if (file_exists($oldPath))
                                @unlink($oldPath);
                        }
                    }
                } else {
                    // Standard storage removal
                    Storage::disk('public')->delete($usuario->profile_image);
                }
            }

            $usuario->profile_image = null;
            $usuario->save();

            return response()->json([
                'success' => true,
                'message' => 'Foto de perfil eliminada correctamente'
            ]);

        } catch (\Exception $e) {
            Log::error('Error eliminando foto perfil estudiante (admin): ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error al eliminar la foto',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // =========================================================================
    // GESTIÓN DE TESTIMONIOS
    // =========================================================================

    /**
     * Listar todos los testimonios con información del usuario.
     */
    public function listarTestimonios(Request $request)
    {
        try {
            $query = DB::table('testimonios')
                ->join('usuarios', 'testimonios.user_id', '=', 'usuarios.id')
                ->leftJoin('perfiles', 'usuarios.id', '=', 'perfiles.usuario_id')
                ->select(
                    'testimonios.id',
                    'testimonios.user_id',
                    'testimonios.mensaje',
                    'testimonios.edad',
                    'testimonios.visible',
                    'testimonios.created_at',
                    'usuarios.email',
                    'usuarios.profile_image',
                    DB::raw('COALESCE(perfiles.nombre, usuarios.nombre) as nombre')
                );

            // Filtro por visibilidad
            if ($request->has('visible')) {
                $query->where('testimonios.visible', $request->visible === 'true' ? 1 : 0);
            }

            // Búsqueda por nombre o email
            if ($request->has('search') && !empty($request->search)) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('perfiles.nombre', 'like', "%{$search}%")
                        ->orWhere('usuarios.nombre', 'like', "%{$search}%")
                        ->orWhere('usuarios.email', 'like', "%{$search}%")
                        ->orWhere('testimonios.mensaje', 'like', "%{$search}%");
                });
            }

            // Ordenamiento
            $orderBy = $request->get('orderBy', 'created_at');
            $order = $request->get('order', 'desc');
            $query->orderBy('testimonios.' . $orderBy, $order);

            // Paginación
            $perPage = $request->get('per_page', 15);
            $testimonios = $query->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => $testimonios
            ], 200);

        } catch (\Exception $e) {
            Log::error('Error listando testimonios (admin): ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener testimonios',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Cambiar la visibilidad de un testimonio.
     */
    public function toggleVisibilidadTestimonio(Request $request, $id)
    {
        try {
            $testimonio = DB::table('testimonios')->where('id', $id)->first();

            if (!$testimonio) {
                return response()->json([
                    'success' => false,
                    'message' => 'Testimonio no encontrado'
                ], 404);
            }

            $nuevoEstado = !$testimonio->visible;

            DB::table('testimonios')
                ->where('id', $id)
                ->update(['visible' => $nuevoEstado]);

            return response()->json([
                'success' => true,
                'message' => $nuevoEstado ? 'Testimonio visible' : 'Testimonio oculto',
                'visible' => $nuevoEstado
            ], 200);

        } catch (\Exception $e) {
            Log::error('Error cambiando visibilidad testimonio (admin): ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error al cambiar visibilidad',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Eliminar un testimonio.
     */
    public function eliminarTestimonio(Request $request, $id)
    {
        try {
            $testimonio = DB::table('testimonios')->where('id', $id)->first();

            if (!$testimonio) {
                return response()->json([
                    'success' => false,
                    'message' => 'Testimonio no encontrado'
                ], 404);
            }

            DB::table('testimonios')->where('id', $id)->delete();

            return response()->json([
                'success' => true,
                'message' => 'Testimonio eliminado correctamente'
            ], 200);

        } catch (\Exception $e) {
            Log::error('Error eliminando testimonio (admin): ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error al eliminar testimonio',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
