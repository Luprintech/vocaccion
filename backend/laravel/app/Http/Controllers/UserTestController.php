<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Services\ProfesionComparadorService;

class UserTestController extends Controller
{
    // ============================================
    // FUNCIONES DE GESTIÓN DE TEST
    // ============================================

    /**
     * Guardar progreso parcial del test
     */
    public function saveProgress(Request $request)
    {
        $user = Auth::user();

        DB::table('test_sessions')->updateOrInsert(
            ['usuario_id' => $user->id],
            [
                'answers' => json_encode($request->answers),
                'current_index' => $request->current_index ?? 0,
                'seconds_left' => $request->seconds_left ?? 0,
                'updated_at' => now(),
            ]
        );

        return response()->json(['success' => true]);
    }

    /**
     * Consultar progreso guardado del test del usuario
     */
    public function getProgress()
    {
        $user = Auth::user();

        // Buscar la sesión más reciente sin completar
        $session = DB::table('test_sessions')
            ->where('usuario_id', $user->id)
            ->whereNull('completed_at')
            ->latest('updated_at') // importante: devuelve la más reciente
            ->first();

        if (!$session) {
            return response()->json([
                'success' => false,
                'enCurso' => false,
                'message' => 'No hay test en progreso'
            ]);
        }

        return response()->json([
            'success' => true,
            'enCurso' => true,
            'session' => [
                'id' => $session->id,
                'current_index' => (int) $session->current_index,
                'answers' => $session->answers,
                'updated_at' => $session->updated_at,
            ]
        ]);
    }


    /**
     * Guardar resultado final del test
     */
    public function saveResult(Request $request)
    {
        $user = Auth::user();

        // Preparar datos
        $answers_json = json_encode($request->answers ?? []);
        $result_text = $request->result ?? null;
        $modelo = $request->modelo ?? null;
        $session_id = $request->session_id ?? null;
        $profesiones = $request->profesiones ?? null; // puede ser array
        $profesiones_json = $profesiones ? json_encode($profesiones) : null;

        // Comprobar último resultado para evitar duplicados exactos
        $latest = DB::table('test_results')
            ->where('usuario_id', $user->id)
            ->latest('created_at')
            ->first();

        if ($latest) {
            // Si el cliente pide actualizar el último resultado, lo actualizamos
            if ($request->update_existing === true || $request->update_existing === 'true') {
                DB::table('test_results')
                    ->where('id', $latest->id)
                    ->update([
                        'test_session_id' => $session_id,
                        'answers' => $answers_json,
                        'result_text' => $result_text,
                        'modelo' => $modelo,
                        'profesiones' => $profesiones_json,
                        'updated_at' => now(),
                    ]);

                // Marcar sesión como completada si aplica
                if ($session_id) {
                    DB::table('test_sessions')
                        ->where('id', $session_id)
                        ->update([
                            'completed_at' => now(),
                            'updated_at' => now(),
                        ]);
                }

                return response()->json(['success' => true, 'updated' => true]);
            }

            // Evitar insertar duplicado exacto (mismo texto, mismas respuestas y mismas profesiones)
            $sameResultText = ($latest->result_text === $result_text);
            $sameAnswers = ($latest->answers === $answers_json);
            $latestProfesiones = property_exists($latest, 'profesiones') ? $latest->profesiones : null;
            $sameProfesiones = ($latestProfesiones === $profesiones_json);

            if ($sameResultText && $sameAnswers && $sameProfesiones) {
                // No insertar duplicado
                // Marcar sesión completada si se envía session_id
                if ($session_id) {
                    DB::table('test_sessions')
                        ->where('id', $session_id)
                        ->update([
                            'completed_at' => now(),
                            'updated_at' => now(),
                        ]);
                }

                return response()->json(['success' => true, 'skipped_duplicate' => true]);
            }
        }

        // Insertar nuevo resultado
        DB::table('test_results')->insert([
            'usuario_id' => $user->id,
            'test_session_id' => $session_id,
            'answers' => $answers_json,
            'result_text' => $result_text,
            'modelo' => $modelo,
            'profesiones' => $profesiones_json,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Marcar sesión como completada
        if ($request->session_id) {
            DB::table('test_sessions')
                ->where('id', $request->session_id)
                ->update([
                    'completed_at' => now(),
                    'updated_at' => now(),
                ]);
        }

        return response()->json(['success' => true]);
    }


    // Consultar estado del test del usuario
    public function stateTest()
    {
        try {
            $user = Auth::user();

            if (!$user) {
                // No autenticado: devolver JSON claro y código 401
                return response()->json(['enCurso' => false, 'message' => 'Usuario no autenticado'], 401);
            }

            $sesion = DB::table('test_sessions')
                ->where('usuario_id', $user->id)
                ->whereNull('completed_at') // test no completado
                ->latest('updated_at')
                ->first();

            if ($sesion) {
                return response()->json([
                    'enCurso' => true,
                    'current_index' => $sesion->current_index,
                    'answers' => json_decode($sesion->answers, true),
                ]);
            }

            return response()->json(['enCurso' => false]);
        } catch (\Exception $e) {
            // Error inesperado: siempre devolver JSON
            return response()->json([
                'enCurso' => false,
                'error' => 'Error al consultar el estado del test'
            ], 500);
        }
    }


    // Cancela el test en curso del usuario
    public function cancelTest()
    {
        $user = Auth::user();

        DB::table('test_sessions')
            ->where('usuario_id', $user->id)
            ->whereNull('completed_at')
            ->delete();

        return response()->json(['success' => true]);
    }

    /**
     * Borra todos los resultados y sesiones del usuario y su objetivo profesional.
     * Se usará cuando el usuario quiera reiniciar completamente el test.
     */
    public function clearResults()
    {
        $user = Auth::user();

        // Borrar resultados previos
        DB::table('test_results')
            ->where('usuario_id', $user->id)
            ->delete();

        // Borrar sesiones en curso (por si queda alguna)
        DB::table('test_sessions')
            ->where('usuario_id', $user->id)
            ->delete();

        // Borrar objetivo profesional si existe (protegemos con try por si la tabla no está presente)
        try {
            DB::table('objetivo_profesional')
                ->where('user_id', $user->id)
                ->delete();
        } catch (\Exception $e) {
            // intentar nombre alternativo
            try {
                DB::table('objetivo_profesionales')->where('user_id', $user->id)->delete();
            } catch (\Exception $e) { /* ignore */
            }
        }

        // Borrar itinerarios generados
        try {
            DB::table('itinerarios_generados')
                ->where('user_id', $user->id)
                ->delete();
        } catch (\Exception $e) {
            Log::error('Error borrando itinerarios: ' . $e->getMessage());
        }

        return response()->json(['success' => true]);
    }

    /**
     * Obtener el progreso guardado del test del usuario
     * Este método devuelve la sesión activa si existe
     */
    public function getTest()
    {
        try {
            $user = Auth::user();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Usuario no autenticado'
                ], 401);
            }

            $session = DB::table('test_sessions')
                ->where('usuario_id', $user->id)
                ->whereNull('completed_at')
                ->latest('updated_at')
                ->first();

            if ($session) {
                return response()->json([
                    'success' => true,
                    'session' => [
                        'answers' => $session->answers,
                        'current_index' => $session->current_index,
                        'seconds_left' => $session->seconds_left,
                    ]
                ]);
            }

            return response()->json([
                'success' => false,
                'message' => 'No hay sesión activa'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Error al obtener el test: ' . $e->getMessage()
            ], 500);
        }
    }


    /**
     * Listar resultados guardados del usuario (más recientes primero)
     * AHORA CON RECALCULACIÓN DE HABILIDADES USANDO EL SERVICIO CENTRALIZADO
     */
    public function listResults()
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return response()->json(['success' => false, 'message' => 'Usuario no autenticado'], 401);
            }

            $results = DB::table('test_results')
                ->where('usuario_id', $user->id)
                ->orderBy('created_at', 'desc')
                ->get();

            // RECALCULAR HABILIDADES Y ESTUDIOS PARA CADA RESULTADO
            $comparador = new ProfesionComparadorService();
            $perfil = $user->perfil;

            foreach ($results as &$result) {
                if (!empty($result->profesiones)) {
                    $profesiones = json_decode($result->profesiones, true);

                    if (is_array($profesiones) && $perfil) {
                        // Recalcular para cada profesión
                        foreach ($profesiones as &$prof) {
                            $profObj = (object) $prof;

                            // DEBUG: Ver qué campos tiene la profesión original
                            Log::info('📋 Profesión antes de enriquecer', [
                                'titulo' => $profObj->titulo ?? 'sin titulo',
                                'tiene_formaciones_necesarias' => isset($profObj->formaciones_necesarias),
                                'tiene_estudios' => isset($profObj->estudios),
                                'formaciones_necesarias' => $profObj->formaciones_necesarias ?? null,
                                'estudios' => $profObj->estudios ?? null
                            ]);

                            $profObj = $comparador->enriquecerProfesion($profObj, $perfil);

                            // Actualizar con datos recalculados
                            if (isset($profObj->habilidades_comparadas)) {
                                $prof['habilidades'] = $profObj->habilidades_comparadas;
                            }

                            if (isset($profObj->estudios_comparados)) {
                                $prof['estudios'] = $profObj->estudios_comparados;

                                // DEBUG: Ver qué se está asignando
                                Log::info('✅ Estudios asignados', [
                                    'count' => count($profObj->estudios_comparados),
                                    'estudios' => $profObj->estudios_comparados
                                ]);
                            } else {
                                Log::warning('⚠️ No hay estudios_comparados para esta profesión');
                            }
                        }
                        unset($prof);

                        // Guardar de vuelta como JSON
                        $result->profesiones = json_encode($profesiones);
                    }
                }
            }
            unset($result);

            return response()->json(['success' => true, 'results' => $results]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'error' => 'Error al obtener resultados'], 500);
        }
    }
}

