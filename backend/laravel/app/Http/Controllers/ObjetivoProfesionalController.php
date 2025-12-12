<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use App\Models\Profesion;
use App\Models\ObjetivoProfesional;
use App\Services\ProfesionComparadorService;

class ObjetivoProfesionalController extends Controller
{
    // Guardar o actualizar la profesión objetivo del usuario
    public function store(Request $request)
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Usuario no autenticado'], 401);
        }

        $profesion_id = $request->input('profesion_id');
        $profesion_data = $request->input('profesion'); // objeto con campos si no viene id

        if (!$profesion_id && !$profesion_data) {
            return response()->json(['success' => false, 'message' => 'Falta profesion_id o profesion'], 422);
        }

        // Si nos dieron datos de profesión sin id, crear registro en profesiones
        if (!$profesion_id && $profesion_data) {
            // Preparar formación (puede venir como 'estudios' array o 'formacion' string)
            $formacion = $profesion_data['estudios'] ?? $profesion_data['formacion'] ?? null;
            if (is_array($formacion)) {
                $formacion = json_encode($formacion, JSON_UNESCAPED_UNICODE);
            }

            // Preparar salidas (puede venir como array)
            $salidas = $profesion_data['salidas'] ?? null;
            if (is_array($salidas)) {
                $salidas = implode(', ', $salidas);
            }

            $profesion = Profesion::create([
                'titulo' => $profesion_data['titulo'] ?? 'Profesión sin título',
                'descripcion' => $profesion_data['descripcion'] ?? null,
                'salidas' => $profesion_data['salidas'] ?? null,
                'formacion_recomendada' => $profesion_data['formacion_recomendada'] ?? $profesion_data['formacion'] ?? null,
                'habilidades' => $profesion_data['habilidades'] ?? null,
                'formaciones_necesarias' => $profesion_data['formaciones_necesarias'] ?? $profesion_data['estudios'] ?? null,
                'imagen_url' => $profesion_data['imagenUrl'] ?? $profesion_data['imagen_url'] ?? null,
                'pexels_prompt' => $profesion_data['pexels_prompt'] ?? null,
            ]);
            $profesion_id = $profesion->id;
        }

        // Verificar si el usuario ya tiene un objetivo profesional
        $existing = ObjetivoProfesional::where('user_id', $user->id)->first();
        if ($existing) {
            // Si es la misma profesion, devolver éxito (idempotente)
            if ($existing->profesion_id == $profesion_id) {
                return response()->json(['success' => true, 'objetivo' => $existing]);
            }

            // Si intenta guardar una profesión distinta mientras ya tiene una, bloquear
            return response()->json([
                'success' => false,
                'message' => 'Ya tienes una profesión elegida. Elimina la actual antes de elegir otra.'
            ], 409);
        }

        // Crear el registro de objetivo profesional
        $obj = ObjetivoProfesional::create([
            'user_id' => $user->id,
            'profesion_id' => $profesion_id,
        ]);

        return response()->json(['success' => true, 'objetivo' => $obj]);
    }

    // Obtener la profesion objetivo del usuario
    public function show()
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Usuario no autenticado'], 401);
        }

        $obj = ObjetivoProfesional::where('user_id', $user->id)->with('profesion')->first();
        if (!$obj) {
            return response()->json(['success' => true, 'objetivo' => null]);
        }

        // Agregar la URL de la imagen a la profesión
        if ($obj->profesion) {
            // Si la profesión ya tiene imagen_url guardada, usarla
            if (!empty($obj->profesion->imagen_url)) {
                $obj->profesion->imagenUrl = $obj->profesion->imagen_url;
                Log::info("📸 Usando imagen guardada para Mi Profesión", [
                    'titulo' => $obj->profesion->titulo,
                    'url' => $obj->profesion->imagen_url
                ]);
            } else {
                // Si no hay imagen guardada, generar una nueva (caso legacy)
                try {
                    [$url, $note] = $this->obtenerImagenPexels($obj->profesion->titulo);
                    $obj->profesion->imagenUrl = $url;
                    Log::info("📸 Imagen generada para Mi Profesión (no estaba guardada)", [
                        'titulo' => $obj->profesion->titulo,
                        'url' => $url
                    ]);
                } catch (\Throwable $e) {
                    $obj->profesion->imagenUrl = '/images/default-profession.jpg';
                    Log::warning('⚠️ Error al obtener imagen para Mi Profesión', [
                        'titulo' => $obj->profesion->titulo,
                        'error' => $e->getMessage()
                    ]);
                }
            }

            // Enriquecer con comparación de habilidades y estudios del usuario
            try {
                $perfil = $user->perfil;
                if ($perfil) {
                    $comparador = new ProfesionComparadorService();
                    $obj->profesion = $comparador->enriquecerProfesion($obj->profesion, $perfil);
                }
            } catch (\Throwable $e) {
                Log::warning('⚠️ Error al enriquecer profesión con comparación', [
                    'error' => $e->getMessage()
                ]);
            }
        }

        return response()->json(['success' => true, 'objetivo' => $obj]);
    }

    // Eliminar objetivo del usuario
    public function destroy()
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Usuario no autenticado'], 401);
        }

        $deleted = ObjetivoProfesional::where('user_id', $user->id)->delete();

        return response()->json(['success' => true, 'deleted' => (bool) $deleted]);
    }

    // ============================================
    // MÉTODOS AUXILIARES PARA GENERACIÓN DE IMÁGENES
    // ============================================

    /**
     * Obtener la URL remota de una imagen de Pexels para una profesión dada.
     * Ahora usa directamente el prompt (puede ser pexels_prompt de Gemini o título).
     * Si Pexels falla, intenta con Lexica.art.
     * Devuelve [url, note]
     */
    private function obtenerImagenPexels(string $profesion): array
    {
        $apiKey = env('PEXELS_API_KEY');
        if (!$apiKey) {
            Log::error('❌ PEXELS_API_KEY no configurada');
            return $this->obtenerImagenLexica($profesion);
        }

        // Usar directamente el prompt que llega (ya optimizado)
        $query = urlencode($profesion);

        // Agregar orientación landscape para imágenes horizontales
        $endpoint = "https://api.pexels.com/v1/search?query={$query}&per_page=20&orientation=landscape";

        Log::info("🔍 ObjetivoProfesional: Buscando en Pexels", ['query' => $profesion]);

        try {
            $response = Http::withHeaders([
                'Authorization' => $apiKey,
                'Accept' => 'application/json'
            ])
                ->timeout(15)
                ->get($endpoint);

            if ($response->failed()) {
                return $this->obtenerImagenLexica($profesion);
            }

            $data = $response->json();

            if (!isset($data['photos']) || empty($data['photos'])) {
                return $this->obtenerImagenLexica($profesion);
            }

            // Filtrar ESTRICTAMENTE por aspect ratio >= 1.5 (solo horizontales)
            $landscapePhotos = array_filter($data['photos'], function ($photo) {
                $width = $photo['width'] ?? 0;
                $height = $photo['height'] ?? 0;
                if ($height <= 0)
                    return false;
                $ratio = $width / $height;
                return $ratio >= 1.5; // Claramente horizontal
            });

            // Si no hay suficientes fotos landscape, usar Lexica
            if (empty($landscapePhotos)) {
                Log::warning('⚠️ No hay imágenes landscape en Pexels, usando Lexica', [
                    'profesion' => $profesion
                ]);
                return $this->obtenerImagenLexica($profesion);
            }

            $photo = reset($landscapePhotos);

            // Priorizar large para landscape (mejor balance calidad/tamaño)
            $url = $photo['src']['large'] ?? $photo['src']['large2x'] ?? $photo['src']['landscape'] ?? null;

            if (!$url) {
                return $this->obtenerImagenLexica($profesion);
            }

            return [$url, 'pexels: ' . ($photo['photographer'] ?? 'api')];

        } catch (\Throwable $e) {
            Log::error('❌ Error en Pexels', ['error' => $e->getMessage()]);
            return $this->obtenerImagenLexica($profesion);
        }
    }

    /**
     * Fallback: obtener imagen desde Lexica.art
     */
    private function obtenerImagenLexica(string $profesion): array
    {
        // Crear prompt creativo directamente con la profesión
        $promptCreativo = "professional illustration of {$profesion}, workplace environment, high quality, horizontal";
        $query = urlencode($promptCreativo);
        $endpoint = "https://lexica.art/api/v1/search?q={$query}";

        Log::info("🎨 ObjetivoProfesional: Buscando en Lexica", ['prompt' => $promptCreativo]);

        try {
            $response = Http::timeout(10)->get($endpoint);

            if ($response->failed()) {
                return ['/images/default-profession.jpg', 'api failed'];
            }

            $data = $response->json();

            if (!isset($data['images']) || empty($data['images'])) {
                return ['/images/default-profession.jpg', 'no results'];
            }

            $image = $data['images'][0];
            $url = $image['src'] ?? $image['srcSmall'] ?? null;

            if (!$url) {
                return ['/images/default-profession.jpg', 'no url'];
            }

            return [$url, 'lexica: AI-generated'];

        } catch (\Throwable $e) {
            return ['/images/default-profession.jpg', 'exception'];
        }
    }
}
