<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Carbon;
use App\Models\Usuario;

/**
 * OrientadorDashboardController
 * 
 * Controlador para el dashboard de orientador.
 * Gestión de estudiantes asignados, resultados, análisis, recursos.
 * 
 * Rutas protegidas por middleware: auth:sanctum, role:orientador
 * 
 * @package App\Http\Controllers
 */
class OrientadorDashboardController extends Controller
{
    /**
     * Obtener datos del dashboard del orientador.
     */
    public function index(Request $request)
    {
        try {
            $usuario = $request->user();

            if (!$usuario) {
                return response()->json([
                    'success' => false,
                    'message' => 'Usuario no autenticado'
                ], 401);
            }

            // Contar estudiantes asignados a este orientador
            $estudiantesAsignados = DB::table('orientador_estudiante')
                ->where('orientador_id', $usuario->id)
                ->where('estado', 'activo')
                ->count();

            // Contar tests analizados de forma más segura
            // Verificar si la tabla test_sessions existe
            $testsAnalizados = 0;
            try {
                if (Schema::hasTable('test_sessions')) {
                    $testsAnalizados = DB::table('orientador_estudiante')
                        ->where('orientador_estudiante.orientador_id', $usuario->id)
                        ->where('orientador_estudiante.estado', 'activo')
                        ->join('test_sessions', 'orientador_estudiante.estudiante_id', '=', 'test_sessions.usuario_id')
                        ->whereNotNull('test_sessions.completed_at')
                        ->count();
                }
            } catch (\Exception $e) {
                // Si hay error en la consulta, dejar en 0
                Log::warning('Error al contar tests analizados: ' . $e->getMessage());
            }

            return response()->json([
                'success' => true,
                'message' => 'Bienvenido al Dashboard de Orientador',
                'data' => [
                    'usuario_id' => $usuario->id,
                    'nombre' => $usuario->nombre,
                    'email' => $usuario->email,
                    'rol' => 'orientador',
                    'estadisticas' => [
                        'estudiantes_asignados' => $estudiantesAsignados,
                        'tests_analizados' => $testsAnalizados,
                        'nuevos_estudiantes' => 0,
                        'mensajes_pendientes' => 0,
                    ],
                ]
            ], 200);
        } catch (\Exception $e) {
            Log::error('Error en dashboard orientador: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());
            return response()->json([
                'success' => false,
                'message' => 'Error al cargar dashboard',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Estadísticas simples para el dashboard.
     */
    public function statsSimple(Request $request)
    {
        try {
            $usuario = $request->user();

            // Contar estudiantes asignados
            $estudiantesAsignados = DB::table('orientador_estudiante')
                ->where('orientador_id', $usuario->id)
                ->where('estado', 'activo')
                ->count();

            // Contar tests completados de estudiantes asignados
            $testsAnalizados = DB::table('orientador_estudiante')
                ->where('orientador_id', $usuario->id)
                ->where('estado', 'activo')
                ->join('test_sessions', 'orientador_estudiante.estudiante_id', '=', 'test_sessions.usuario_id')
                ->whereNotNull('test_sessions.completed_at')
                ->count();

            // Nuevos estudiantes esta semana
            $nuevosEstudiantes = DB::table('orientador_estudiante')
                ->where('orientador_id', $usuario->id)
                ->where('fecha_asignacion', '>=', now()->subWeek())
                ->count();

            return response()->json([
                'success' => true,
                'estudiantes_asignados' => $estudiantesAsignados,
                'tests_analizados' => $testsAnalizados,
                'nuevos_estudiantes' => $nuevosEstudiantes,
                'mensajes_pendientes' => 0, // Por implementar
            ], 200);

        } catch (\Exception $e) {
            Log::error('Error en stats orientador: ' . $e->getMessage());
            return response()->json([
                'success' => true,
                'estudiantes_asignados' => 0,
                'tests_analizados' => 0,
                'nuevos_estudiantes' => 0,
                'mensajes_pendientes' => 0,
            ], 200);
        }
    }

    /**
     * Listar estudiantes asignados al orientador.
     */
    public function listarEstudiantes(Request $request)
    {
        try {
            $usuario = $request->user();

            $estudiantes = DB::table('orientador_estudiante')
                ->where('orientador_estudiante.orientador_id', $usuario->id)
                ->where('orientador_estudiante.estado', 'activo')
                ->join('usuarios', 'orientador_estudiante.estudiante_id', '=', 'usuarios.id')
                ->leftJoin('perfiles', 'usuarios.id', '=', 'perfiles.usuario_id')
                ->leftJoin('test_sessions', function ($join) {
                    $join->on('usuarios.id', '=', 'test_sessions.usuario_id')
                        ->whereNotNull('test_sessions.completed_at');
                })
                ->select(
                    'usuarios.id',
                    DB::raw('COALESCE(perfiles.nombre, usuarios.nombre) as nombre'),
                    'usuarios.email',
                    'usuarios.profile_image', // Añadido campo de imagen
                    'usuarios.created_at',
                    'orientador_estudiante.fecha_asignacion',
                    'orientador_estudiante.notas',
                    DB::raw('CASE WHEN test_sessions.id IS NOT NULL THEN 1 ELSE 0 END as test_completado'),
                    DB::raw("(SELECT tipo_plan FROM suscripciones WHERE usuario_id = usuarios.id AND estado = 'activa' LIMIT 1) as plan")
                )
                ->groupBy(
                    'usuarios.id',
                    'perfiles.nombre',
                    'usuarios.nombre',
                    'usuarios.email',
                    'usuarios.profile_image',
                    'usuarios.created_at',
                    'orientador_estudiante.fecha_asignacion',
                    'orientador_estudiante.notas',
                    'test_sessions.id'
                )
                ->orderBy('orientador_estudiante.fecha_asignacion', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $estudiantes
            ], 200);

        } catch (\Exception $e) {
            Log::error('Error listando estudiantes orientador: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener estudiantes',
                'data' => []
            ], 200);
        }
    }

    /**
     * Ver detalle de un estudiante asignado.
     */
    public function verEstudiante(Request $request, $id)
    {
        try {
            $usuario = $request->user();

            // Verificar que el estudiante está asignado a este orientador
            $asignacion = DB::table('orientador_estudiante')
                ->where('orientador_id', $usuario->id)
                ->where('estudiante_id', $id)
                ->where('estado', 'activo')
                ->first();

            if (!$asignacion) {
                return response()->json([
                    'success' => false,
                    'message' => 'Estudiante no asignado a este orientador'
                ], 404);
            }

            $estudiante = Usuario::with([
                'perfil',
                'perfil.formaciones',
                'perfil.experiencias',
                'perfil.idiomas',
                'perfil.habilidades',
                'perfil.intereses'
            ])->find($id);

            // Obtener test session y resultados
            $testSession = DB::table('test_sessions')
                ->where('usuario_id', $id)
                ->orderBy('created_at', 'desc')
                ->first();

            $testResult = DB::table('test_results')
                ->where('usuario_id', $id)
                ->orderBy('created_at', 'desc')
                ->first();

            // Obtener la profesión elegida por el usuario (objetivo profesional)
            $profesionElegida = null;
            try {
                Log::info("Buscando profesión para user_id: " . $id);

                // Primero obtener el profesion_id
                $objetivoProfesional = DB::table('objetivo_profesional')
                    ->where('user_id', $id)
                    ->first();

                if ($objetivoProfesional) {
                    // Luego obtener el nombre de la profesión
                    $profesion = DB::table('profesiones')
                        ->where('id', $objetivoProfesional->profesion_id)
                        ->first();

                    if ($profesion) {
                        // LA COLUMNA ES 'titulo', NO 'nombre'
                        $profesionElegida = $profesion->titulo;
                        Log::info("Profesión encontrada: " . $profesionElegida);
                    }
                } else {
                    Log::info("No se encontró objetivo_profesional para user_id: " . $id);
                }
            } catch (\Exception $e) {
                Log::error('Error obteniendo profesión elegida: ' . $e->getMessage());
            }

            // Obtener plan actual
            $plan = DB::table('suscripciones')
                ->where('usuario_id', $id)
                ->where('estado', 'activa')
                ->value('tipo_plan') ?? 'gratuito';

            return response()->json([
                'success' => true,
                'data' => [
                    'estudiante' => $estudiante,
                    'asignacion' => $asignacion,
                    'test_session' => $testSession,
                    'test_result' => $testResult,
                    'profesion_elegida' => $profesionElegida,
                    'plan' => $plan
                ]
            ], 200);

        } catch (\Exception $e) {
            Log::error('Error viendo estudiante: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener estudiante',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener resultados de tests de estudiantes asignados.
     */
    public function analisis(Request $request)
    {
        try {
            $usuario = $request->user();

            $resultados = DB::table('orientador_estudiante')
                ->where('orientador_estudiante.orientador_id', $usuario->id)
                ->where('orientador_estudiante.estado', 'activo')
                ->join('usuarios', 'orientador_estudiante.estudiante_id', '=', 'usuarios.id')
                ->leftJoin('perfiles', 'usuarios.id', '=', 'perfiles.usuario_id')
                ->join('test_results', 'usuarios.id', '=', 'test_results.usuario_id')
                ->select(
                    'usuarios.id as estudiante_id',
                    DB::raw('COALESCE(perfiles.nombre, usuarios.nombre) as nombre'),
                    'usuarios.email',
                    'usuarios.profile_image',
                    'test_results.id as resultado_id',
                    'test_results.profesiones',
                    'test_results.result_text',
                    'test_results.created_at as fecha_resultado'
                )
                ->orderBy('test_results.created_at', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $resultados
            ], 200);

        } catch (\Exception $e) {
            Log::error('Error en análisis: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'data' => []
            ], 200);
        }
    }

    // ============ ENDPOINTS DE CHAT ============

    /**
     * Obtener estudiantes para chat (solo Pro Plus).
     */
    public function chatEstudiantes(Request $request)
    {
        try {
            $usuario = $request->user();

            // Solo estudiantes Pro Plus (tipo_plan = 'pro_plus' o 'Pro Plus')
            $estudiantes = DB::table('orientador_estudiante')
                ->where('orientador_estudiante.orientador_id', $usuario->id)
                ->where('orientador_estudiante.estado', 'activo')
                ->join('usuarios', 'orientador_estudiante.estudiante_id', '=', 'usuarios.id')
                ->leftJoin('perfiles', 'usuarios.id', '=', 'perfiles.usuario_id')
                ->join('suscripciones', function ($join) {
                    $join->on('usuarios.id', '=', 'suscripciones.usuario_id')
                        ->where('suscripciones.estado', 'activa')
                        ->whereIn('suscripciones.tipo_plan', ['pro_plus', 'Pro Plus']);
                })
                ->select(
                    'usuarios.id',
                    DB::raw('COALESCE(perfiles.nombre, usuarios.nombre) as nombre'),
                    'usuarios.email',
                    DB::raw('usuarios.profile_image as avatar'),
                    DB::raw("'Pro Plus' as plan"),
                    DB::raw("0 as bloqueado"),
                    'usuarios.last_seen'
                )
                ->orderBy('nombre')
                ->get();

            // Añadir último mensaje y mensajes sin leer
            foreach ($estudiantes as $est) {
                $ultimoMensaje = DB::table('mensajes')
                    ->where(function ($q) use ($usuario, $est) {
                        $q->where('emisor_id', $usuario->id)->where('receptor_id', $est->id);
                    })
                    ->orWhere(function ($q) use ($usuario, $est) {
                        $q->where('emisor_id', $est->id)->where('receptor_id', $usuario->id);
                    })
                    ->orderBy('created_at', 'desc')
                    ->first();

                $est->ultimoMensaje = $ultimoMensaje ? $ultimoMensaje->contenido : null;
                $est->fechaUltimoMensaje = $ultimoMensaje ? $ultimoMensaje->created_at : null;

                $est->sinLeer = DB::table('mensajes')
                    ->where('emisor_id', $est->id)
                    ->where('receptor_id', $usuario->id)
                    ->where('leido', false)
                    ->count();

                // Online si last_seen < 5 minutos
                $est->online = $est->last_seen && Carbon::parse($est->last_seen)->diffInMinutes(now()) < 5;
            }

            return response()->json([
                'success' => true,
                'data' => $estudiantes
            ], 200);

        } catch (\Exception $e) {
            Log::error('Error obteniendo estudiantes para chat: ' . $e->getMessage());
            return response()->json([
                'success' => true,
                'data' => []
            ], 200);
        }
    }

    /**
     * Obtener mensajes con un estudiante.
     */
    public function chatMensajes(Request $request, $estudianteId)
    {
        try {
            $usuario = $request->user();

            // Verificar que el estudiante está asignado
            $asignado = DB::table('orientador_estudiante')
                ->where('orientador_id', $usuario->id)
                ->where('estudiante_id', $estudianteId)
                ->where('estado', 'activo')
                ->exists();

            if (!$asignado) {
                return response()->json([
                    'success' => false,
                    'message' => 'Estudiante no asignado'
                ], 403);
            }

            $mensajes = DB::table('mensajes')
                ->where(function ($q) use ($usuario, $estudianteId) {
                    $q->where('emisor_id', $usuario->id)
                        ->where('receptor_id', $estudianteId)
                        ->where('visible_para_emisor', true);
                })
                ->orWhere(function ($q) use ($usuario, $estudianteId) {
                    $q->where('emisor_id', $estudianteId)
                        ->where('receptor_id', $usuario->id)
                        ->where('visible_para_receptor', true);
                })
                ->orderBy('created_at', 'asc')
                ->get()
                ->map(function ($m) use ($usuario) {
                    return [
                        'id' => $m->id,
                        'texto' => $m->contenido,
                        'archivo' => $m->archivo,
                        'nombre_archivo' => $m->nombre_archivo,
                        'tipo_archivo' => $m->tipo_archivo,
                        'emisor' => $m->emisor_id == $usuario->id ? 'orientador' : 'estudiante',
                        'fecha' => $m->created_at,
                        'leido' => (bool) $m->leido
                    ];
                });

            // Marcar como leídos los mensajes del estudiante
            DB::table('mensajes')
                ->where('emisor_id', $estudianteId)
                ->where('receptor_id', $usuario->id)
                ->where('leido', false)
                ->update(['leido' => true]);

            return response()->json([
                'success' => true,
                'data' => $mensajes
            ], 200);

        } catch (\Exception $e) {
            Log::error('Error obteniendo mensajes: ' . $e->getMessage());
            return response()->json([
                'success' => true,
                'data' => []
            ], 200);
        }
    }

    /**
     * Enviar mensaje a un estudiante.
     */
    public function chatEnviar(Request $request)
    {
        try {
            $request->validate([
                'estudiante_id' => 'required|exists:usuarios,id',
                'mensaje' => 'nullable|string',
                'archivo' => 'nullable|file|max:10240' // 10MB máx
            ]);

            if (!$request->mensaje && !$request->hasFile('archivo')) {
                return response()->json([
                    'success' => false,
                    'message' => 'El mensaje o un archivo es requerido'
                ], 422);
            }

            $usuario = $request->user();

            // Verificar asignación
            $asignado = DB::table('orientador_estudiante')
                ->where('orientador_id', $usuario->id)
                ->where('estudiante_id', $request->estudiante_id)
                ->where('estado', 'activo')
                ->exists();

            if (!$asignado) {
                return response()->json([
                    'success' => false,
                    'message' => 'Estudiante no asignado'
                ], 403);
            }

            $archivoPath = null;
            $nombreArchivo = null;
            $tipoArchivo = null;

            if ($request->hasFile('archivo')) {
                $file = $request->file('archivo');
                $nombreArchivo = $file->getClientOriginalName();
                $tipoArchivo = $file->getMimeType();
                $archivoPath = $file->store('adjuntos/chat', 'public');
            }

            $mensajeId = DB::table('mensajes')->insertGetId([
                'emisor_id' => $usuario->id,
                'receptor_id' => $request->estudiante_id,
                'contenido' => $request->mensaje ?? '',
                'archivo' => $archivoPath,
                'nombre_archivo' => $nombreArchivo,
                'tipo_archivo' => $tipoArchivo,
                'leido' => false,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            return response()->json([
                'success' => true,
                'data' => [
                    'id' => $mensajeId,
                    'texto' => $request->mensaje ?? '',
                    'archivo' => $archivoPath ? Storage::url($archivoPath) : null,
                    'nombre_archivo' => $nombreArchivo,
                    'tipo_archivo' => $tipoArchivo,
                    'emisor' => 'orientador',
                    'fecha' => now(),
                    'leido' => false
                ]
            ], 201);

        } catch (\Exception $e) {
            Log::error('Error enviando mensaje: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error al enviar mensaje'
            ], 500);
        }
    }

    /**
     * Borrar un mensaje específico.
     */
    /**
     * Borrar un mensaje específico.
     * Mode: 'me' (solo para mí), 'all' (para todos)
     */
    public function chatBorrarMensaje(Request $request, $id)
    {
        try {
            $usuario = $request->user();
            $mode = $request->input('mode', 'me'); // 'me' or 'all'

            // Buscar el mensaje
            $mensaje = DB::table('mensajes')->where('id', $id)->first();

            if (!$mensaje) {
                return response()->json([
                    'success' => false,
                    'message' => 'Mensaje no encontrado'
                ], 404);
            }

            // Verificar permiso: el orientador debe ser emisor o receptor del mensaje
            if ($mensaje->emisor_id !== $usuario->id && $mensaje->receptor_id !== $usuario->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'No tienes permiso para borrar este mensaje'
                ], 403);
            }

            if ($mode === 'all') {
                // Borrar para todos (Ocultar para ambos)
                // Nota: Generalmente solo puedes borrar "para todos" tus propios mensajes, 
                // pero como orientador permitimos borrar cualquier mensaje por moderación.
                DB::table('mensajes')->where('id', $id)->update([
                    'visible_para_emisor' => false,
                    'visible_para_receptor' => false
                ]);
            } else {
                // Borrar solo para mí
                if ($mensaje->emisor_id == $usuario->id) {
                    DB::table('mensajes')->where('id', $id)->update(['visible_para_emisor' => false]);
                } else {
                    DB::table('mensajes')->where('id', $id)->update(['visible_para_receptor' => false]);
                }
            }

            return response()->json([
                'success' => true,
                'message' => 'Mensaje eliminado'
            ], 200);

        } catch (\Exception $e) {
            Log::error('Error borrando mensaje: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error al borrar mensaje'
            ], 500);
        }
    }

    /**
     * Vaciar conversación con un estudiante (Solo para el orientador).
     */
    public function chatVaciarConversacion(Request $request, $estudianteId)
    {
        try {
            $usuario = $request->user();

            // Verificar asignación (opcional, pero buena práctica)
            $asignado = DB::table('orientador_estudiante')
                ->where('orientador_id', $usuario->id)
                ->where('estudiante_id', $estudianteId)
                ->where('estado', 'activo')
                ->exists();

            if (!$asignado) {
                // Si no está asignado, igual podría querer borrar logs viejos, pero mantengamos seguridad
                return response()->json([
                    'success' => false,
                    'message' => 'Estudiante no asignado'
                ], 403);
            }

            // Ocultar mensajes enviados por el orientador (Yo soy emisor)
            DB::table('mensajes')
                ->where('emisor_id', $usuario->id)
                ->where('receptor_id', $estudianteId)
                ->update(['visible_para_emisor' => false]);

            // Ocultar mensajes enviados por el estudiante (Yo soy receptor)
            DB::table('mensajes')
                ->where('emisor_id', $estudianteId)
                ->where('receptor_id', $usuario->id)
                ->update(['visible_para_receptor' => false]);

            return response()->json([
                'success' => true,
                'message' => 'Conversación vaciada correctamente'
            ], 200);

        } catch (\Exception $e) {
            Log::error('Error vaciando chat: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error al vaciar la conversación'
            ], 500);
        }
    }

    /**
     * Descargar archivo adjunto de un mensaje (Desde el dashboard del orientador).
     */
    public function chatDescargarAdjunto(Request $request, $mensajeId)
    {
        try {
            $usuario = $request->user();

            $mensaje = DB::table('mensajes')->where('id', $mensajeId)->first();

            if (!$mensaje) {
                return response()->json(['success' => false, 'message' => 'Mensaje no encontrado'], 404);
            }

            // Verificar acceso (Orientador debe ser emisor o receptor)
            if ($mensaje->emisor_id != $usuario->id && $mensaje->receptor_id != $usuario->id) {
                return response()->json(['success' => false, 'message' => 'No tienes permiso para ver este mensaje'], 403);
            }

            if (!$mensaje->archivo) {
                return response()->json(['success' => false, 'message' => 'El mensaje no tiene archivo adjunto'], 404);
            }

            $path = storage_path('app/public/' . $mensaje->archivo);

            if (!file_exists($path)) {
                return response()->json(['success' => false, 'message' => 'El archivo no existe en el servidor'], 404);
            }

            return response()->download($path, $mensaje->nombre_archivo ?? basename($path));

        } catch (\Exception $e) {
            Log::error('Error descargando archivo orientador: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Error al descargar archivo'], 500);
        }
    }

    // ============ ENDPOINTS DE VIDEOLLAMADAS ============

    /**
     * Listar videollamadas del orientador.
     */
    public function videollamadas(Request $request)
    {
        try {
            $usuario = $request->user();

            $videollamadas = DB::table('videollamadas')
                ->where('orientador_id', $usuario->id)
                ->join('usuarios', 'videollamadas.estudiante_id', '=', 'usuarios.id')
                ->leftJoin('perfiles', 'usuarios.id', '=', 'perfiles.usuario_id')
                ->select(
                    'videollamadas.*',
                    DB::raw('COALESCE(perfiles.nombre, usuarios.nombre) as estudiante_nombre'),
                    'usuarios.email as estudiante_email'
                )
                ->orderBy('videollamadas.fecha', 'asc')
                ->orderBy('videollamadas.hora', 'asc')
                ->get()
                ->map(function ($v) {
                    return [
                        'id' => $v->id,
                        'estudiante' => [
                            'id' => $v->estudiante_id,
                            'nombre' => $v->estudiante_nombre,
                            'email' => $v->estudiante_email
                        ],
                        'fecha' => $v->fecha,
                        'hora' => $v->hora,
                        'duracion' => $v->duracion,
                        'estado' => $v->estado,
                        'enlace' => $v->enlace,
                        'notas' => $v->notas
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => $videollamadas
            ], 200);

        } catch (\Exception $e) {
            Log::error('Error obteniendo videollamadas: ' . $e->getMessage());
            return response()->json([
                'success' => true,
                'data' => []
            ], 200);
        }
    }

    /**
     * Crear una nueva videollamada.
     */
    public function crearVideollamada(Request $request)
    {
        try {
            $usuario = $request->user();

            $request->validate([
                'estudiante_id' => 'required|exists:usuarios,id',
                'fecha' => 'required|date',
                'hora' => 'required',
                'duracion' => 'required|integer|min:15|max:120'
            ]);

            // Verificar que el estudiante está asignado
            $asignado = DB::table('orientador_estudiante')
                ->where('orientador_id', $usuario->id)
                ->where('estudiante_id', $request->estudiante_id)
                ->where('estado', 'activo')
                ->exists();

            if (!$asignado) {
                return response()->json([
                    'success' => false,
                    'message' => 'Estudiante no asignado'
                ], 403);
            }

            // Verificar que el estudiante es Pro Plus
            $esProPlus = DB::table('suscripciones')
                ->where('usuario_id', $request->estudiante_id)
                ->where('estado', 'activa')
                ->whereIn('tipo_plan', ['pro_plus', 'Pro Plus'])
                ->exists();

            if (!$esProPlus) {
                return response()->json([
                    'success' => false,
                    'message' => 'Esta función solo está disponible para estudiantes Pro Plus'
                ], 403);
            }

            // Generar enlace único
            $enlace = 'https://meet.vocaccion.com/' . uniqid();

            $id = DB::table('videollamadas')->insertGetId([
                'orientador_id' => $usuario->id,
                'estudiante_id' => $request->estudiante_id,
                'fecha' => $request->fecha,
                'hora' => $request->hora,
                'duracion' => $request->duracion,
                'estado' => 'programada',
                'enlace' => $enlace,
                'notas' => $request->notas ?? null,
                'created_at' => now(),
                'updated_at' => now()
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Videollamada programada',
                'data' => ['id' => $id, 'enlace' => $enlace]
            ], 201);

        } catch (\Exception $e) {
            Log::error('Error creando videollamada: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error al crear videollamada'
            ], 500);
        }
    }

    /**
     * Cancelar una videollamada.
     */
    public function cancelarVideollamada(Request $request, $id)
    {
        try {
            $usuario = $request->user();

            $deleted = DB::table('videollamadas')
                ->where('id', $id)
                ->where('orientador_id', $usuario->id)
                ->where('estado', 'programada')
                ->delete();

            if (!$deleted) {
                return response()->json([
                    'success' => false,
                    'message' => 'No se encontró la videollamada'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'message' => 'Videollamada cancelada'
            ], 200);

        } catch (\Exception $e) {
            Log::error('Error cancelando videollamada: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error al cancelar videollamada'
            ], 500);
        }
    }

    // ============ ENDPOINTS DE DETALLES DE ESTUDIANTES ============

    /**
     * Ver el test completo de un estudiante (preguntas y respuestas).
     */
    public function verTestEstudiante(Request $request, $id)
    {
        try {
            $usuario = $request->user();

            // Verificar que el estudiante está asignado a este orientador
            $asignado = DB::table('orientador_estudiante')
                ->where('orientador_id', $usuario->id)
                ->where('estudiante_id', $id)
                ->where('estado', 'activo')
                ->exists();

            if (!$asignado) {
                return response()->json([
                    'success' => false,
                    'message' => 'Estudiante no asignado a este orientador'
                ], 403);
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
            Log::error('Error obteniendo test del estudiante: ' . $e->getMessage());
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
            $usuario = $request->user();

            // Verificar que el estudiante está asignado a este orientador
            $asignado = DB::table('orientador_estudiante')
                ->where('orientador_id', $usuario->id)
                ->where('estudiante_id', $id)
                ->where('estado', 'activo')
                ->exists();

            if (!$asignado) {
                return response()->json([
                    'success' => false,
                    'message' => 'Estudiante no asignado a este orientador'
                ], 403);
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

            // Decodificar profesiones
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
            Log::error('Error obteniendo profesiones del estudiante: ' . $e->getMessage());
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
            $usuario = $request->user();

            // Verificar que el estudiante está asignado a este orientador
            $asignado = DB::table('orientador_estudiante')
                ->where('orientador_id', $usuario->id)
                ->where('estudiante_id', $id)
                ->where('estado', 'activo')
                ->exists();

            if (!$asignado) {
                return response()->json([
                    'success' => false,
                    'message' => 'Estudiante no asignado a este orientador'
                ], 403);
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
            Log::error('Error obteniendo itinerario del estudiante: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener el itinerario'
            ], 500);
        }
    }

    /**
     * Listar todos los estudiantes disponibles para asignación.
     */
    public function estudiantesDisponibles(Request $request)
    {
        try {
            $usuario = $request->user();

            // Obtener IDs de estudiantes ya asignados al orientador actual
            $asignados = DB::table('orientador_estudiante')
                ->where('orientador_id', $usuario->id)
                ->where('estado', 'activo')
                ->pluck('estudiante_id')
                ->toArray();

            // Obtener todos los estudiantes (usando whereHas como el admin)
            $estudiantes = Usuario::with(['perfil'])
                ->whereHas('roles', function ($q) {
                    $q->where('nombre', 'estudiante');
                })
                ->select('usuarios.id', 'usuarios.nombre', 'usuarios.email', 'usuarios.created_at', 'usuarios.profile_image')
                ->get();

            // Añadir información adicional a cada estudiante
            $estudiantes->transform(function ($est) use ($asignados) {
                // Verificar si tiene test completado
                $testCompletado = DB::table('test_sessions')
                    ->where('usuario_id', $est->id)
                    ->whereNotNull('completed_at')
                    ->exists();

                // Obtener plan de suscripción
                $plan = DB::table('suscripciones')
                    ->where('usuario_id', $est->id)
                    ->where('estado', 'activa')
                    ->value('tipo_plan') ?? 'gratuito';

                // Usar nombre del perfil si existe
                $est->nombre = $est->perfil->nombre ?? $est->nombre;
                $est->test_completado = $testCompletado ? 1 : 0;
                $est->ya_asignado = in_array($est->id, $asignados) ? 1 : 0;
                $est->plan = $plan;

                // Limpiar relación perfil del resultado
                unset($est->perfil);

                return $est;
            });

            return response()->json([
                'success' => true,
                'data' => $estudiantes
            ], 200);

        } catch (\Exception $e) {
            Log::error('Error obteniendo estudiantes disponibles: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener estudiantes',
                'data' => []
            ], 500);
        }
    }

    /**
     * Auto-asignarse a un estudiante.
     */
    public function asignarEstudiante(Request $request)
    {
        try {
            $usuario = $request->user();
            $estudianteId = $request->input('estudiante_id');

            // Validar que el estudiante existe y tiene rol de estudiante
            $estudiante = Usuario::whereHas('roles', function ($q) {
                $q->where('nombre', 'estudiante');
            })
                ->where('id', $estudianteId)
                ->first();

            if (!$estudiante) {
                return response()->json([
                    'success' => false,
                    'message' => 'Estudiante no encontrado'
                ], 404);
            }

            // Verificar que el estudiante es Pro Plus (Requisito: Solo se podrá asignar los usuario pro plus)
            $esProPlus = DB::table('suscripciones')
                ->where('usuario_id', $estudianteId)
                ->where('estado', 'activa')
                ->whereIn('tipo_plan', ['pro_plus', 'Pro Plus'])
                ->exists();

            if (!$esProPlus) {
                return response()->json([
                    'success' => false,
                    'message' => 'Solo se pueden asignar estudiantes con plan Pro Plus'
                ], 403);
            }

            // Verificar si ya existe la asignación
            $asignacionExistente = DB::table('orientador_estudiante')
                ->where('orientador_id', $usuario->id)
                ->where('estudiante_id', $estudianteId)
                ->first();

            if ($asignacionExistente) {
                // Si existe pero está inactiva, reactivarla
                if ($asignacionExistente->estado === 'inactivo') {
                    DB::table('orientador_estudiante')
                        ->where('id', $asignacionExistente->id)
                        ->update([
                            'estado' => 'activo',
                            'updated_at' => now()
                        ]);

                    return response()->json([
                        'success' => true,
                        'message' => 'Estudiante reactivado correctamente'
                    ], 200);
                }

                return response()->json([
                    'success' => false,
                    'message' => 'Ya estás asignado a este estudiante'
                ], 400);
            }

            // Crear nueva asignación
            DB::table('orientador_estudiante')->insert([
                'orientador_id' => $usuario->id,
                'estudiante_id' => $estudianteId,
                'estado' => 'activo',
                'fecha_asignacion' => now(),
                'created_at' => now(),
                'updated_at' => now()
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Estudiante asignado correctamente'
            ], 200);

        } catch (\Exception $e) {
            Log::error('Error asignando estudiante: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error al asignar estudiante'
            ], 500);
        }
    }

    /**
     * Desasignar un estudiante.
     */
    public function desasignarEstudiante(Request $request)
    {
        try {
            $usuario = $request->user();
            $estudianteId = $request->input('estudiante_id');

            // Buscar la asignación activa
            $asignacion = DB::table('orientador_estudiante')
                ->where('orientador_id', $usuario->id)
                ->where('estudiante_id', $estudianteId)
                ->where('estado', 'activo')
                ->first();

            if (!$asignacion) {
                return response()->json([
                    'success' => false,
                    'message' => 'No estás asignado a este estudiante'
                ], 404);
            }

            // Cambiar estado a inactivo
            DB::table('orientador_estudiante')
                ->where('id', $asignacion->id)
                ->update([
                    'estado' => 'inactivo',
                    'updated_at' => now()
                ]);

            return response()->json([
                'success' => true,
                'message' => 'Estudiante desasignado correctamente'
            ], 200);

        } catch (\Exception $e) {
            Log::error('Error desasignando estudiante: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error al desasignar estudiante'
            ], 500);
        }
    }
}

