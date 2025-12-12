<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class RecursoController extends Controller
{
    /**
     * Listar recursos.
     */
    public function index(Request $request)
    {
        try {
            $query = DB::table('recursos')
                ->leftJoin('usuarios', 'recursos.user_id', '=', 'usuarios.id')
                ->leftJoin('perfiles', 'usuarios.id', '=', 'perfiles.usuario_id')
                ->select('recursos.*', DB::raw("COALESCE(CONCAT(perfiles.nombre, ' ', COALESCE(perfiles.apellidos, '')), usuarios.nombre) as autor_nombre"));

            // Búsqueda
            if ($request->has('search') && $request->search) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('recursos.titulo', 'like', "%{$search}%")
                        ->orWhere('recursos.descripcion', 'like', "%{$search}%");
                });
            }

            // Filtro por tipo
            if ($request->has('tipo') && $request->tipo !== 'todos') {
                $query->where('recursos.tipo', $request->tipo);
            }

            // Filtro por mis recursos
            if ($request->has('mine')) {
                $query->where('recursos.user_id', $request->user()->id);
            }

            // Ordenar destacados primero
            $query->orderBy('recursos.destacado', 'desc')
                ->orderBy('recursos.created_at', 'desc');

            return response()->json([
                'success' => true,
                'data' => $query->get()
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching resources: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Error al cargar recursos'], 500);
        }
    }

    /**
     * Mostrar recurso público por slug.
     */
    public function showPublic($slug)
    {
        $recurso = DB::table('recursos')
            ->leftJoin('usuarios', 'recursos.user_id', '=', 'usuarios.id')
            ->leftJoin('perfiles', 'usuarios.id', '=', 'perfiles.usuario_id')
            ->select('recursos.*', DB::raw("COALESCE(CONCAT(perfiles.nombre, ' ', COALESCE(perfiles.apellidos, '')), usuarios.nombre) as autor_nombre"))
            ->where('recursos.slug', $slug)
            ->first();

        if (!$recurso) {
            return response()->json(['success' => false, 'message' => 'Recurso no encontrado'], 404);
        }

        return response()->json(['success' => true, 'data' => $recurso]);
    }

    /**
     * Crear recurso.
     */
    /**
     * Crear recurso.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'titulo' => 'required|string',
            'descripcion' => 'required|string',
            'tipo' => 'required|string',
            'enlace' => 'nullable|string',
            'contenido' => 'nullable|string',
            'tiempo_lectura' => 'nullable|string',
            'destacado' => 'boolean',
            'imagen_portada' => 'nullable|image|max:2048',
            'plan_requerido' => 'required|string|in:gratuito,pro,pro_plus'
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 400);
        }

        try {
            $imagenPath = null;
            if ($request->hasFile('imagen_portada')) {
                $path = $request->file('imagen_portada')->store('recursos', 'public');
                $imagenPath = '/storage/' . $path;
            }

            $slug = \Illuminate\Support\Str::slug($request->titulo) . '-' . uniqid();

            $id = DB::table('recursos')->insertGetId([
                'titulo' => $request->titulo,
                'slug' => $slug,
                'descripcion' => $request->descripcion,
                'contenido' => $request->contenido,
                'tipo' => $request->tipo,
                'enlace' => $request->enlace ?? '',
                'tiempo_lectura' => $request->tiempo_lectura,
                'destacado' => $request->boolean('destacado'),
                'imagen_portada' => $imagenPath,
                'plan_requerido' => $request->plan_requerido ?? 'gratuito',
                'user_id' => $request->user()->id,
                'created_at' => now(),
                'updated_at' => now(),
                'visualizaciones' => 0,
                'descargas' => 0
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Recurso creado exitosamente',
                'data' => ['id' => $id, 'slug' => $slug]
            ], 201);
        } catch (\Exception $e) {
            Log::error('Error creating resource: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Error al crear recurso'], 500);
        }
    }

    /**
     * Actualizar recurso.
     */
    public function update(Request $request, $id)
    {
        try {
            $data = [
                'titulo' => $request->titulo,
                'descripcion' => $request->descripcion,
                'tipo' => $request->tipo,
                'enlace' => $request->enlace,
                'tiempo_lectura' => $request->tiempo_lectura,
                'destacado' => $request->boolean('destacado'),
                'updated_at' => now()
            ];

            if ($request->has('contenido')) {
                $data['contenido'] = $request->contenido;
            }

            if ($request->has('plan_requerido')) {
                $data['plan_requerido'] = $request->plan_requerido;
            }

            if ($request->hasFile('imagen_portada')) {
                $path = $request->file('imagen_portada')->store('recursos', 'public');
                $data['imagen_portada'] = '/storage/' . $path;
            }

            DB::table('recursos')->where('id', $id)->update($data);
            return response()->json(['success' => true, 'message' => 'Recurso actualizado']);
        } catch (\Exception $e) {
            Log::error('Error updating resource: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Error al actualizar'], 500);
        }
    }

    /**
     * Eliminar recurso.
     */
    public function destroy($id)
    {
        try {
            DB::table('recursos')->where('id', $id)->delete();
            return response()->json(['success' => true, 'message' => 'Recurso eliminado']);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Error al eliminar'], 500);
        }
    }
    public function descargarPlantilla(Request $request, $nombreArchivo)
    {
        // ... (código existente sin cambios, lo mantenemos por compatibilidad)
        try {
            $usuario = $request->user();

            // Verificación simplificada de suscripción
            $esPro = DB::table('suscripciones')
                ->where('usuario_id', $usuario->id)
                ->where('estado', 'activa')
                ->whereIn('tipo_plan', ['pro', 'pro_plus', 'Pro Plus'])
                ->exists();

            $esAdmin = DB::table('usuario_rol')->where('usuario_id', $usuario->id)->where('rol_id', 1)->exists();
            $esOrientador = DB::table('usuario_rol')->where('usuario_id', $usuario->id)->where('rol_id', 2)->exists();

            if (!$esPro && !$esAdmin && !$esOrientador) {
                return response()->json(['message' => 'Contenido exclusivo para usuarios PRO'], 403);
            }

            $nombreArchivo = basename($nombreArchivo);

            // Usamos public_path que sabemos que funciona y tiene el archivo
            $path = public_path('plantillas/' . $nombreArchivo);

            if (!file_exists($path)) {
                return response()->json(['message' => 'Archivo no encontrado', 'path' => $path], 404);
            }

            // streamDownload fuerza la descarga y maneja mejor la memoria/streams
            return response()->streamDownload(function () use ($path) {
                echo file_get_contents($path);
            }, $nombreArchivo);

        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Error descarga: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Incrementar visualizaciones
     */
    public function incrementarVisualizacion($slug)
    {
        try {
            DB::table('recursos')->where('slug', $slug)->increment('visualizaciones');
            $recurso = DB::table('recursos')->where('slug', $slug)->select('visualizaciones', 'descargas')->first();
            return response()->json(['success' => true, 'data' => $recurso]);
        } catch (\Exception $e) {
            Log::error('Error incrementing views: ' . $e->getMessage());
            return response()->json(['success' => false], 500);
        }
    }

    /**
     * Incrementar descargas
     */
    public function incrementarDescarga($slug)
    {
        try {
            DB::table('recursos')->where('slug', $slug)->increment('descargas');
            $recurso = DB::table('recursos')->where('slug', $slug)->select('visualizaciones', 'descargas')->first();
            return response()->json(['success' => true, 'data' => $recurso]);
        } catch (\Exception $e) {
            Log::error('Error incrementing downloads: ' . $e->getMessage());
            return response()->json(['success' => false], 500);
        }
    }

    /**
     * Estadísticas de recursos del orientador
     */
    public function stats(Request $request)
    {
        try {
            $userId = $request->user()->id;

            // Obtener TODOS los recursos (propios y del sistema)
            // Los recursos del sistema tienen user_id NULL
            $recursos = DB::table('recursos')
                ->select('id', 'titulo', 'tipo', 'visualizaciones', 'descargas', 'created_at', 'user_id')
                ->get();

            // Separar recursos propios y del sistema para estadísticas detalladas
            $recursosPropios = $recursos->where('user_id', $userId);
            $recursosSistema = $recursos->whereNull('user_id');

            $totalVisualizaciones = $recursos->sum('visualizaciones');
            $totalDescargas = $recursos->sum('descargas');

            // Top 5 más vistos (de todos)
            $topVistos = $recursos->sortByDesc('visualizaciones')->take(5)->values();

            // Top 5 más descargados (de todos)
            $topDescargados = $recursos->sortByDesc('descargas')->take(5)->values();

            return response()->json([
                'success' => true,
                'data' => [
                    'total_visualizaciones' => $totalVisualizaciones,
                    'total_descargas' => $totalDescargas,
                    'total_recursos' => $recursos->count(),
                    'recursos_propios' => $recursosPropios->count(),
                    'recursos_sistema' => $recursosSistema->count(),
                    'top_vistos' => $topVistos,
                    'top_descargados' => $topDescargados,
                    'recursos' => $recursos
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching resource stats: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Error al cargar estadísticas'], 500);
        }
    }
}
