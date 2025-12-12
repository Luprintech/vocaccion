<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * EstudianteDashboardController
 * 
 * Controlador para el dashboard de estudiante.
 * Acceso al test vocacional, resultados, recomendaciones, fichas de profesiones.
 * 
 * Rutas protegidas por middleware: auth:sanctum, role:estudiante
 * 
 * @package App\Http\Controllers
 */
class EstudianteDashboardController extends Controller
{
    /**
     * Obtener datos del dashboard del estudiante.
     * 
     * Devuelve estado del test, resultados, recomendaciones, plan premium.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function index(Request $request)
    {
        $usuario = $request->user();

        return response()->json([
            'success' => true,
            'message' => 'Bienvenido al Dashboard de Estudiante',
            'data' => [
                'usuario_id' => $usuario->id,
                'nombre' => $usuario->nombre,
                'email' => $usuario->email,
                'rol' => 'estudiante',
                'test' => [
                    'completado' => false,
                    'en_progreso' => false,
                    'porcentaje_avance' => 0,
                ],
                'funcionalidades' => [
                    'realizar_test' => '/api/test/obtener-test-completo',
                    'ver_resultados' => '/api/user/test/results',
                    'ver_recomendaciones' => '/api/profile/stats',
                    'fichas_profesiones' => '/api/profesiones',
                    'plan_premium' => '/api/suscripciones'
                ]
            ]
        ], 200);
    }

    /**
     * Verificar si el estudiante tiene suscripción Pro Plus activa.
     */
    public function miSuscripcion(Request $request)
    {
        try {
            $usuario = $request->user();

            $suscripcion = DB::table('suscripciones')
                ->where('usuario_id', $usuario->id)
                ->where('estado', 'activa')
                ->first();

            $esProPlus = $suscripcion && in_array($suscripcion->tipo_plan, ['pro_plus', 'Pro Plus']);

            return response()->json([
                'success' => true,
                'data' => [
                    'tiene_suscripcion' => (bool) $suscripcion,
                    'es_pro_plus' => $esProPlus,
                    'tipo_plan' => $suscripcion ? $suscripcion->tipo_plan : 'basico',
                    'fecha_fin' => $suscripcion ? $suscripcion->fecha_fin : null
                ]
            ], 200);

        } catch (\Exception $e) {
            Log::error('Error verificando suscripción: ' . $e->getMessage());
            return response()->json([
                'success' => true,
                'data' => [
                    'tiene_suscripcion' => false,
                    'es_pro_plus' => false,
                    'tipo_plan' => 'basico'
                ]
            ], 200);
        }
    }

    /**
     * Obtener el orientador asignado al estudiante (solo Pro Plus).
     */
    public function miOrientador(Request $request)
    {
        try {
            $usuario = $request->user();

            // Verificar que es Pro Plus
            $esProPlus = DB::table('suscripciones')
                ->where('usuario_id', $usuario->id)
                ->where('estado', 'activa')
                ->whereIn('tipo_plan', ['pro_plus', 'Pro Plus'])
                ->exists();

            if (!$esProPlus) {
                return response()->json([
                    'success' => false,
                    'message' => 'Esta función es exclusiva para usuarios Pro Plus'
                ], 403);
            }

            // Obtener orientador asignado
            $orientador = DB::table('orientador_estudiante')
                ->where('estudiante_id', $usuario->id)
                ->where('estado', 'activo')
                ->join('usuarios', 'orientador_estudiante.orientador_id', '=', 'usuarios.id')
                ->select(
                    'usuarios.id',
                    'usuarios.nombre',
                    'usuarios.email',
                    'usuarios.profile_image'
                )
                ->first();

            if (!$orientador) {
                return response()->json([
                    'success' => true,
                    'data' => null,
                    'message' => 'Aún no tienes un orientador asignado'
                ], 200);
            }

            return response()->json([
                'success' => true,
                'data' => $orientador
            ], 200);

        } catch (\Exception $e) {
            Log::error('Error obteniendo orientador: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener orientador'
            ], 500);
        }
    }

    /**
     * Obtener mensajes con el orientador asignado (solo Pro Plus).
     */
    public function mensajes(Request $request)
    {
        try {
            $usuario = $request->user();

            // Verificar que es Pro Plus
            $esProPlus = DB::table('suscripciones')
                ->where('usuario_id', $usuario->id)
                ->where('estado', 'activa')
                ->whereIn('tipo_plan', ['pro_plus', 'Pro Plus'])
                ->exists();

            if (!$esProPlus) {
                return response()->json([
                    'success' => false,
                    'message' => 'Esta función es exclusiva para usuarios Pro Plus'
                ], 403);
            }

            // Obtener orientador asignado
            $orientador = DB::table('orientador_estudiante')
                ->where('orientador_estudiante.estudiante_id', $usuario->id)
                ->where('orientador_estudiante.estado', 'activo')
                ->join('usuarios', 'orientador_estudiante.orientador_id', '=', 'usuarios.id')
                ->select('usuarios.id', 'usuarios.nombre', 'usuarios.email', 'usuarios.profile_image')
                ->first();

            if (!$orientador) {
                return response()->json([
                    'success' => false,
                    'message' => 'No tienes acceso al chat o no tienes orientador asignado'
                ], 403);
            }

            // Obtener mensajes (Filtrando los ocultos por el usuario)
            $mensajes = DB::table('mensajes')
                ->where(function ($q) use ($usuario, $orientador) {
                    $q->where('emisor_id', $usuario->id)
                        ->where('receptor_id', $orientador->id)
                        ->where('visible_para_emisor', true);
                })
                ->orWhere(function ($q) use ($usuario, $orientador) {
                    $q->where('emisor_id', $orientador->id)
                        ->where('receptor_id', $usuario->id)
                        ->where('visible_para_receptor', true);
                })
                ->orderBy('created_at', 'asc')
                ->get()
                ->map(function ($m) use ($usuario) {
                    return [
                        'id' => $m->id,
                        'contenido' => $m->contenido,
                        'archivo' => $m->archivo,
                        'nombre_archivo' => $m->nombre_archivo,
                        'tipo_archivo' => $m->tipo_archivo,
                        'es_mio' => $m->emisor_id == $usuario->id,
                        'leido' => (bool) $m->leido,
                        'fecha' => $m->created_at
                    ];
                });

            // Marcar como leídos los mensajes del orientador
            DB::table('mensajes')
                ->where('emisor_id', $orientador->id)
                ->where('receptor_id', $usuario->id)
                ->where('leido', false)
                ->update(['leido' => true]);

            return response()->json([
                'success' => true,
                'data' => [
                    'orientador' => $orientador,
                    'mensajes' => $mensajes
                ]
            ], 200);

        } catch (\Exception $e) {
            Log::error('Error obteniendo mensajes: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener mensajes'
            ], 500);
        }
    }

    /**
     * Vaciar chat con el orientador.
     */
    public function vaciarChat(Request $request)
    {
        try {
            $usuario = $request->user();

            // Obtener orientador
            $orientador = DB::table('orientador_estudiante')
                ->where('estudiante_id', $usuario->id)
                ->where('estado', 'activo')
                ->first();

            if (!$orientador) {
                return response()->json([
                    'success' => false,
                    'message' => 'No tienes orientador asignado'
                ], 404);
            }

            // Ocultar mensajes enviados por el estudiante
            DB::table('mensajes')
                ->where('emisor_id', $usuario->id)
                ->where('receptor_id', $orientador->orientador_id)
                ->update(['visible_para_emisor' => false]);

            // Ocultar mensajes enviados por el orientador
            DB::table('mensajes')
                ->where('emisor_id', $orientador->orientador_id)
                ->where('receptor_id', $usuario->id)
                ->update(['visible_para_receptor' => false]);

            return response()->json([
                'success' => true,
                'message' => 'Chat vaciado correctamente'
            ], 200);

        } catch (\Exception $e) {
            Log::error('Error vaciando chat estudiante: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error al vaciar chat'
            ], 500);
        }
    }

    /**
     * Contar mensajes sin leer.
     */
    public function conteoMensajesSinLeer(Request $request)
    {
        try {
            $usuario = $request->user();

            // Verificar plan Pro Plus para no hacer queries innecesarias
            $esProPlus = DB::table('suscripciones')
                ->where('usuario_id', $usuario->id)
                ->where('estado', 'activa')
                ->whereIn('tipo_plan', ['pro_plus', 'Pro Plus'])
                ->exists();

            if (!$esProPlus) {
                return response()->json(['success' => true, 'count' => 0]);
            }

            $count = DB::table('mensajes')
                ->where('receptor_id', $usuario->id)
                ->where('leido', false)
                ->count();

            return response()->json([
                'success' => true,
                'count' => $count
            ], 200);

        } catch (\Exception $e) {
            return response()->json(['success' => false, 'count' => 0], 500);
        }
    }

    /**
     * Enviar mensaje al orientador (solo Pro Plus).
     */
    public function enviarMensaje(Request $request)
    {
        try {
            $usuario = $request->user();

            $request->validate([
                'contenido' => 'nullable|string|max:2000',
                'archivo' => 'nullable|file|max:10240' // 10MB máx
            ]);

            if (!$request->contenido && !$request->hasFile('archivo')) {
                return response()->json([
                    'success' => false,
                    'message' => 'El mensaje o un archivo es requerido'
                ], 422);
            }

            // Verificar que es Pro Plus
            $esProPlus = DB::table('suscripciones')
                ->where('usuario_id', $usuario->id)
                ->where('estado', 'activa')
                ->whereIn('tipo_plan', ['pro_plus', 'Pro Plus'])
                ->exists();

            if (!$esProPlus) {
                return response()->json([
                    'success' => false,
                    'message' => 'Esta función es exclusiva para usuarios Pro Plus'
                ], 403);
            }

            // Obtener orientador asignado
            $orientador = DB::table('orientador_estudiante')
                ->where('orientador_estudiante.estudiante_id', $usuario->id)
                ->where('orientador_estudiante.estado', 'activo')
                ->select('orientador_estudiante.orientador_id')
                ->first();

            if (!$orientador) {
                return response()->json([
                    'success' => false,
                    'message' => 'No tienes un orientador asignado'
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

            // Crear mensaje
            $id = DB::table('mensajes')->insertGetId([
                'emisor_id' => $usuario->id,
                'receptor_id' => $orientador->orientador_id,
                'contenido' => $request->contenido ?? '',
                'archivo' => $archivoPath,
                'nombre_archivo' => $nombreArchivo,
                'tipo_archivo' => $tipoArchivo,
                'leido' => false,
                'created_at' => now(),
                'updated_at' => now()
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Mensaje enviado',
                'data' => [
                    'id' => $id,
                    'contenido' => $request->contenido ?? '',
                    'archivo' => $archivoPath, // Opcional: url completa si se usa Storage::url
                    'nombre_archivo' => $nombreArchivo,
                    'tipo_archivo' => $tipoArchivo,
                    'es_mio' => true,
                    'leido' => false,
                    'fecha' => now()->toISOString()
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
     * Listar reservas del estudiante.
     */
    public function reservas(Request $request)
    {
        try {
            $usuario = $request->user();

            $reservas = DB::table('videollamadas')
                ->where('estudiante_id', $usuario->id)
                ->join('usuarios', 'videollamadas.orientador_id', '=', 'usuarios.id')
                ->select(
                    'videollamadas.*',
                    'usuarios.nombre as orientador_nombre',
                    'usuarios.email as orientador_email'
                )
                ->orderBy('fecha', 'desc')
                ->orderBy('hora', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $reservas
            ], 200);

        } catch (\Exception $e) {
            Log::error('Error obteniendo reservas: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener reservas'
            ], 500);
        }
    }

    /**
     * Consultar disponibilidad mensual (días libres/ocupados).
     */
    public function disponibilidadMensual(Request $request)
    {
        try {
            $year = $request->input('year');
            $month = $request->input('month');

            if (!$year || !$month) {
                return response()->json(['success' => false, 'message' => 'Año y mes requeridos'], 400);
            }

            $usuario = $request->user();

            // Obtener orientador
            $orientador = DB::table('orientador_estudiante')
                ->where('estudiante_id', $usuario->id)
                ->where('estado', 'activo')
                ->first();

            if (!$orientador) {
                return response()->json(['success' => false, 'message' => 'Sin orientador'], 404);
            }

            // Consultar citas del mes
            $citas = DB::table('videollamadas')
                ->where('orientador_id', $orientador->orientador_id)
                ->whereYear('fecha', $year)
                ->whereMonth('fecha', $month)
                ->whereIn('estado', ['programada', 'en_curso'])
                ->select('fecha')
                ->get();

            // Agrupar por fecha
            $conteos = $citas->groupBy('fecha')->map(function ($group) {
                return $group->count();
            });

            $diasEnMes = date('t', strtotime("$year-$month-01"));
            $disponibilidad = [];

            for ($d = 1; $d <= $diasEnMes; $d++) {
                $fecha = sprintf('%04d-%02d-%02d', $year, $month, $d);
                $timestamp = strtotime($fecha);
                $dow = date('N', $timestamp); // 1 (Mon) - 7 (Sun)

                // Pasar días pasados a 'pasado'
                if ($timestamp < strtotime(date('Y-m-d'))) {
                    $disponibilidad[$fecha] = 'pasado';
                    continue;
                }

                // Fin de semana
                if ($dow >= 6) {
                    $disponibilidad[$fecha] = 'cerrado';
                } else {
                    // Capacidad diaria: 10 horas (9-14, 16-21)
                    $ocupadas = $conteos->get($fecha, 0);
                    if ($ocupadas >= 10) {
                        $disponibilidad[$fecha] = 'lleno';
                    } else {
                        $disponibilidad[$fecha] = 'libre';
                    }
                }
            }

            return response()->json([
                'success' => true,
                'data' => $disponibilidad
            ], 200);

        } catch (\Exception $e) {
            Log::error('Error disp mensual: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Error al obtener disponibilidad mensual'], 500);
        }
    }

    /**
     * Consultar disponibilidad del orientador.
     */
    public function disponibilidad(Request $request)
    {
        try {
            $usuario = $request->user();
            $fecha = $request->input('fecha');

            if (!$fecha) {
                return response()->json([
                    'success' => false,
                    'message' => 'Fecha requerida'
                ], 400);
            }

            // Validar fin de semana (Sábado=6, Domingo=7)
            $diaSemana = date('N', strtotime($fecha));
            if ($diaSemana >= 6) {
                return response()->json([
                    'success' => true,
                    'data' => [],
                    'message' => 'No hay disponibilidad en fines de semana'
                ], 200);
            }

            // Obtener orientador
            $orientador = DB::table('orientador_estudiante')
                ->where('estudiante_id', $usuario->id)
                ->where('estado', 'activo')
                ->first();

            if (!$orientador) {
                return response()->json([
                    'success' => false,
                    'message' => 'No tienes orientador asignado'
                ], 404);
            }

            // Franjas horarias: 9-14 y 16-21. Asumimos sesiones de 1 hora.
            $slots = [
                '09:00:00',
                '10:00:00',
                '11:00:00',
                '12:00:00',
                '13:00:00',
                '16:00:00',
                '17:00:00',
                '18:00:00',
                '19:00:00',
                '20:00:00'
            ];

            // Consultar reservas del orientador para esa fecha
            $ocupadas = DB::table('videollamadas')
                ->where('orientador_id', $orientador->orientador_id)
                ->where('fecha', $fecha)
                ->whereIn('estado', ['programada', 'en_curso'])
                ->pluck('hora')
                ->map(function ($hora) {
                    return date('H:i:s', strtotime($hora));
                })
                ->toArray();

            // Filtrar
            $disponibles = array_values(array_diff($slots, $ocupadas));

            return response()->json([
                'success' => true,
                'data' => $disponibles,
                'orientador_id' => $orientador->orientador_id
            ], 200);

        } catch (\Exception $e) {
            Log::error('Error verificando disponibilidad: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error al verificar disponibilidad'
            ], 500);
        }
    }

    /**
     * Crear reserva.
     */
    public function reservar(Request $request)
    {
        try {
            $usuario = $request->user();

            $request->validate([
                'fecha' => 'required|date|after_or_equal:today',
                'hora' => 'required',
                'notas' => 'nullable|string|max:500'
            ]);

            // Obtener orientador
            $orientador = DB::table('orientador_estudiante')
                ->where('estudiante_id', $usuario->id)
                ->where('estado', 'activo')
                ->first();

            if (!$orientador) {
                return response()->json([
                    'success' => false,
                    'message' => 'No tienes orientador asignado'
                ], 404);
            }

            // Verificar turno disponible
            $ocupada = DB::table('videollamadas')
                ->where('orientador_id', $orientador->orientador_id)
                ->where('fecha', $request->fecha)
                ->where('hora', $request->hora)
                ->whereIn('estado', ['programada', 'en_curso'])
                ->exists();

            if ($ocupada) {
                return response()->json([
                    'success' => false,
                    'message' => 'Esta franja horaria ya no está disponible'
                ], 409);
            }

            // Crear enlace videollamada
            $enlace = "https://meet.jit.si/Vocaccion-" . Str::random(10);

            // Crear reserva
            $id = DB::table('videollamadas')->insertGetId([
                'orientador_id' => $orientador->orientador_id,
                'estudiante_id' => $usuario->id,
                'fecha' => $request->fecha,
                'hora' => $request->hora,
                'duracion' => 60,
                'estado' => 'programada',
                'enlace' => $enlace,
                'notas' => $request->notas,
                'created_at' => now(),
                'updated_at' => now()
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Sesión reservada con éxito',
                'data' => ['id' => $id]
            ], 201);

        } catch (\Exception $e) {
            Log::error('Error creando reserva: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error al crear la reserva'
            ], 500);
        }
    }

    /**
     * Cancelar reserva.
     */
    public function cancelarReserva(Request $request, $id)
    {
        try {
            $usuario = $request->user();

            $reserva = DB::table('videollamadas')
                ->where('id', $id)
                ->where('estudiante_id', $usuario->id)
                ->first();

            if (!$reserva) {
                return response()->json([
                    'success' => false,
                    'message' => 'Reserva no encontrada'
                ], 404);
            }

            if ($reserva->estado !== 'programada') {
                return response()->json([
                    'success' => false,
                    'message' => 'No se puede cancelar una sesión pasada o cancelada'
                ], 400);
            }

            DB::table('videollamadas')
                ->where('id', $id)
                ->update([
                    'estado' => 'cancelada',
                    'updated_at' => now()
                ]);

            return response()->json([
                'success' => true,
                'message' => 'Reserva cancelada'
            ], 200);

        } catch (\Exception $e) {
            Log::error('Error cancelando reserva: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error al cancelar reserva'
            ], 500);
        }
    }

    /**
     * Descargar archivo adjunto de un mensaje.
     */
    public function descargarAdjunto(Request $request, $mensajeId)
    {
        try {
            $usuario = $request->user();

            $mensaje = DB::table('mensajes')->where('id', $mensajeId)->first();

            if (!$mensaje) {
                return response()->json(['success' => false, 'message' => 'Mensaje no encontrado'], 404);
            }

            // Verificar acceso
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
            Log::error('Error descargando archivo: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Error al descargar archivo'], 500);
        }
    }


}
