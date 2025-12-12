<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GeminiService
{
    protected ?string $apiKey;
    protected ?string $apiUrl;

    public function __construct()
    {
        $this->apiKey = env('GEMINI_API_KEY');
        $this->apiUrl = env('GEMINI_API_URL');

        if (!$this->apiKey || !$this->apiUrl) {
            throw new \Exception("Gemini API no está configurada. Faltan variables en .env");
        }
    }

    /**
     * Envía un prompt a Gemini y obtiene un JSON parseado.
     */
    public function generateItinerario(string $prompt): array
    {
        try {
            // Construir la URL con la API key como parámetro
            $url = $this->apiUrl . '?key=' . $this->apiKey;

            $response = Http::withHeaders([
                'Content-Type' => 'application/json'
            ])->post($url, [
                        'contents' => [
                            [
                                'parts' => [
                                    ['text' => $prompt]
                                ]
                            ]
                        ],
                        'generationConfig' => [
                            'temperature' => 0.7,
                            'maxOutputTokens' => 3048,
                        ]
                    ]);

            if (!$response->ok()) {
                Log::error("Error Gemini: " . $response->body());
                throw new \Exception("La IA no pudo generar el itinerario.");
            }

            $json = $response->json();

            // Extraer el texto generado del formato de respuesta de Gemini
            $text = $json['candidates'][0]['content']['parts'][0]['text'] ?? '';

            if (empty($text)) {
                throw new \Exception('Gemini devolvió respuesta vacía');
            }

            // Limpiar posibles bloques de markdown
            $text = preg_replace('/```json\s*|\s*```/', '', $text);
            $text = trim($text);

            // Parsear JSON
            $itinerario = json_decode($text, true);

            if (json_last_error() !== JSON_ERROR_NONE) {
                Log::error("Error parseando JSON de Gemini: " . json_last_error_msg());
                Log::error("Texto recibido: " . $text);
                throw new \Exception('Error al parsear JSON de Gemini: ' . json_last_error_msg());
            }

            // Validar estructura básica (Adaptado a nueva estructura)
            if (!isset($itinerario['vias_formativas'])) {

                Log::error("JSON de Gemini no tiene la estructura esperada: " . json_encode(array_keys($itinerario)));
                throw new \Exception('JSON de Gemini no tiene la estructura esperada');
            }

            return $itinerario;

        } catch (\Exception $e) {
            Log::error("GeminiService Exception: " . $e->getMessage());
            throw $e;
        }
    }
}
