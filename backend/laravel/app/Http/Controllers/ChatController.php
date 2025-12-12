<?php

namespace App\Http\Controllers;

use App\Models\Mensaje;
use App\Models\Usuario;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ChatController extends Controller
{
    /**
     * Obtener lista de contactos (estudiantes asignados al orientador)
     * con el último mensaje de cada conversación
     */
    public function getContactos(Request $request)
    {
        $orientador = $request->user();

        // Obtener todos los estudiantes asignados a este orientador
        $estudiantes = Usuario::whereHas('asignaciones', function ($query) use ($orientador) {
            $query->where('orientador_id', $orientador->id);
        })
            ->with([
                'asignaciones' => function ($query) use ($orientador) {
                    $query->where('orientador_id', $orientador->id);
                }
            ])
            ->get();

        // Enriquecer con último mensaje
        $contactos = $estudiantes->map(function ($estudiante) use ($orientador) {
            $ultimoMensaje = Mensaje::where(function ($query) use ($orientador, $estudiante) {
                $query->where('emisor_id', $orientador->id)
                    ->where('receptor_id', $estudiante->id);
            })
                ->orWhere(function ($query) use ($orientador, $estudiante) {
                    $query->where('emisor_id', $estudiante->id)
                        ->where('receptor_id', $orientador->id);
                })
                ->latest('created_at')
                ->first();

            return [
                'id' => $estudiante->id,
                'nombre' => $estudiante->nombre,
                'email' => $estudiante->email,
                'ultimo_mensaje' => $ultimoMensaje?->contenido ?? '',
                'fecha_ultimo_mensaje' => $ultimoMensaje?->created_at ?? null,
                'no_leidos' => Mensaje::where('receptor_id', $orientador->id)
                    ->where('emisor_id', $estudiante->id)
                    ->where('leido', false)
                    ->count(),
            ];
        });

        return response()->json([
            'success' => true,
            'contactos' => $contactos->sortByDesc('fecha_ultimo_mensaje')->values(),
        ]);
    }

    /**
     * Obtener mensajes entre el orientador y un estudiante específico
     */
    public function getMensajes(Request $request, $usuarioId)
    {
        $orientador = $request->user();

        // Validar que el usuario existe
        $usuario = Usuario::find($usuarioId);
        if (!$usuario) {
            return response()->json(['error' => 'Usuario no encontrado'], 404);
        }

        // Obtener conversación (ambas direcciones)
        $mensajes = Mensaje::where(function ($query) use ($orientador, $usuarioId) {
            $query->where('emisor_id', $orientador->id)
                ->where('receptor_id', $usuarioId);
        })
            ->orWhere(function ($query) use ($orientador, $usuarioId) {
                $query->where('emisor_id', $usuarioId)
                    ->where('receptor_id', $orientador->id);
            })
            ->with(['emisor', 'receptor'])
            ->orderBy('created_at', 'asc')
            ->get();

        // Marcar mensajes recibidos como leídos
        Mensaje::where('emisor_id', $usuarioId)
            ->where('receptor_id', $orientador->id)
            ->where('leido', false)
            ->update(['leido' => true]);

        return response()->json([
            'success' => true,
            'mensajes' => $mensajes,
        ]);
    }

    /**
     * Enviar un nuevo mensaje
     */
    public function enviarMensaje(Request $request)
    {
        $validated = $request->validate([
            'receptor_id' => 'required|exists:usuarios,id',
            'contenido' => 'nullable|string',
            'archivo' => 'nullable|file|max:10240' // 10MB
        ]);

        if (!$request->contenido && !$request->hasFile('archivo')) {
            return response()->json([
                'success' => false,
                'message' => 'El mensaje o un archivo es requerido'
            ], 422);
        }

        $usuario = $request->user();

        // Verificar relación (opcional, pero recomendable)
        // Por brevedad, asumimos que si está en la DB está bien, o implementamos chequeo rápido
        // Como es api interna, confiamos en `receptor_id` existente.

        // The original code had a permission check here.
        // If it's still needed, it should be re-added.
        // For now, I'm following the provided snippet which omits it.
        // $tieneAsignacion = Usuario::whereHas('asignaciones', function ($query) use ($orientador, $validated) {
        //     $query->where('orientador_id', $orientador->id)
        //           ->where('estudiante_id', $validated['receptor_id']);
        // })->exists();

        // if (!$tieneAsignacion) {
        //     return response()->json([
        //         'error' => 'No tienes permiso para enviar mensajes a este usuario'
        //     ], 403);
        // }

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
            'receptor_id' => $validated['receptor_id'],
            'contenido' => $validated['contenido'] ?? '',
            'archivo' => $archivoPath,
            'nombre_archivo' => $nombreArchivo,
            'tipo_archivo' => $tipoArchivo,
            'leido' => false,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'mensaje' => [
                'id' => $mensajeId,
                'contenido' => $validated['contenido'] ?? '',
                'archivo' => $archivoPath,
                'nombre_archivo' => $nombreArchivo,
                'tipo_archivo' => $tipoArchivo,
                'emisor_id' => $usuario->id,
                'created_at' => now(),
                'leido' => false
            ]
        ], 201); // Changed status code to 201 for resource creation
    }
}
