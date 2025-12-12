<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use App\Models\Usuario;
use App\Models\Perfil;
use App\Models\Formacion;
use App\Models\Experiencia;
use App\Models\Idioma;
use App\Models\Habilidad;
use App\Models\Interes;
use App\Models\HabilidadInteres;
use Illuminate\Support\Carbon;

class ProfileController extends Controller
{
    /**
     * Obtener el perfil completo del usuario autenticado
     */
    public function show(Request $request): JsonResponse
    {
        try {
            // Usar auth()->user() para mayor compatibilidad
            $user = auth('sanctum')->user() ?? $request->user();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Usuario no autenticado'
                ], 401);
            }

            //  Obtener el perfil del usuairo
            $perfil = $user->perfil;
            if (!$perfil) {
                return response()->json([
                    'success' => true,
                    'data' => null
                ], 200);
            }


            // Cargar perfil con todas las relaciones usando with() para mejor performance
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


            return response()->json([
                'success' => true,
                'data' => $perfilCompleto->getPerfilCompleto()
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener el perfil',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Guardar o actualizar el perfil completo del usuario
     */
    public function store(Request $request): JsonResponse
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

                'formacion' => 'sometimes|array',
                'formacion.*.nivel' => 'sometimes|in:secundaria,bachillerato,fp_medio,fp_superior,universitario,master,doctorado',
                'formacion.*.centro_estudios' => 'sometimes|string|max:255',
                'formacion.*.titulo_obtenido' => 'sometimes|string|max:255',
                'formacion.*.fecha_inicio' => 'sometimes|date',
                'formacion.*.fecha_fin' => 'sometimes|date',
                'formacion.*.cursando_actualmente' => 'boolean',

                'experiencia_laboral' => 'sometimes|array',
                'experiencia_laboral.*.puesto' => 'sometimes|string|max:255',
                'experiencia_laboral.*.empresa' => 'sometimes|string|max:255',
                'experiencia_laboral.*.fecha_inicio' => 'sometimes|date',
                'experiencia_laboral.*.fecha_fin' => 'nullable|date',
                'experiencia_laboral.*.descripcion' => 'nullable|string',
                'experiencia_laboral.*.trabajando_actualmente' => 'boolean',

                'idiomas' => 'sometimes|array',
                'idiomas.*.idioma' => 'sometimes|string|max:100',
                'idiomas.*.nivel' => 'sometimes|in:basico,intermedio,avanzado,nativo',

                'habilidades_intereses' => 'sometimes|array',
                'habilidades_intereses.habilidades' => 'sometimes|array',
                'habilidades_intereses.intereses' => 'sometimes|array',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Datos de validación incorrectos',
                    'errors' => $validator->errors()
                ], 422);
            }

            $user = auth('sanctum')->user() ?? $request->user();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Usuario no autenticado'
                ], 401);
            }

            DB::beginTransaction();

            // 1. Crear o actualizar perfil principal
            $perfil = $user->perfil;
            if (!$perfil) {
                $perfil = new Perfil();
                $perfil->usuario_id = $user->id;
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
            $perfil->save();

            // 2. Actualizar formaciones
            if ($request->has('formacion')) {
                // Eliminar formaciones existentes
                $perfil->formaciones()->delete();

                // Crear nuevas formaciones
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
                // Eliminar experiencias existentes
                $perfil->experiencias()->delete();

                // Crear nuevas experiencias
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
                // Eliminar idiomas existentes
                $perfil->idiomas()->delete();

                // Crear nuevos idiomas
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
                //  Eliminar habilidades e intereses existentes
                $perfil->habilidades()->delete();
                $perfil->intereses()->delete();

                //  Crear nuevas habilidades e intereses
                $datos = $request->input('habilidades_intereses');
                foreach ($datos['habilidades'] as $habilidad) {
                    $habilidad = new Habilidad(['nombre' => $habilidad]);
                    $habilidad->perfil_id = $perfil->id;
                    $habilidad->save();
                }
                foreach ($datos['intereses'] as $interes) {
                    $interes = new Interes(['nombre' => $interes]);
                    $interes->perfil_id = $perfil->id;
                    $interes->save();
                }
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Perfil guardado correctamente',
                'data' => [
                    'perfil_id' => $perfil->id
                ]
            ]);

        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => 'Error al guardar el perfil',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener estadísticas del perfil del usuario
     */
    public function stats(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            $perfil = $user->perfil;

            if (!$perfil) {
                return response()->json([
                    'success' => true,
                    'data' => [
                        'completitud' => 0,
                        'secciones_completadas' => 0,
                        'total_secciones' => 5
                    ]
                ]);
            }

            // Calcular completitud del perfil
            $seccionesCompletadas = 0;
            $totalSecciones = 5;

            // 1. Información personal
            if ($perfil->nombre && $perfil->apellidos) {
                $seccionesCompletadas++;
            }

            // 2. Formación
            if ($perfil->formaciones()->count() > 0) {
                $seccionesCompletadas++;
            }

            // 3. Experiencia laboral
            if ($perfil->experiencias()->count() > 0) {
                $seccionesCompletadas++;
            }

            // 4. Idiomas
            if ($perfil->idiomas()->count() > 0) {
                $seccionesCompletadas++;
            }

            // 5. Habilidades e intereses
            $habilidadesIntereses = $perfil->habilidadesIntereses;
            if (
                $habilidadesIntereses &&
                (count($habilidadesIntereses->habilidades ?? []) > 0 ||
                    count($habilidadesIntereses->intereses ?? []) > 0)
            ) {
                $seccionesCompletadas++;
            }

            $completitud = round(($seccionesCompletadas / $totalSecciones) * 100);

            return response()->json([
                'success' => true,
                'data' => [
                    'completitud' => $completitud,
                    'secciones_completadas' => $seccionesCompletadas,
                    'total_secciones' => $totalSecciones,
                    'contadores' => [
                        'formaciones' => $perfil->formaciones()->count(),
                        'experiencias' => $perfil->experiencias()->count(),
                        'idiomas' => $perfil->idiomas()->count(),
                        'habilidades' => count($habilidadesIntereses->habilidades ?? []),
                        'intereses' => count($habilidadesIntereses->intereses ?? [])
                    ]
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener estadísticas del perfil',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
