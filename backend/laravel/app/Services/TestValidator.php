<?php

namespace App\Services;

class TestValidator
{
    /**
     * Valida la estructura y contenido de una pregunta generada.
     * Si no es válida, devuelve un fallback según la fase.
     *
     * @param array $pregunta
     * @param int $fase
     * @param array|null $preguntaAnterior
     * @return array
     */
    public function validate(array $pregunta, int $fase, ?array $preguntaAnterior = null): array
    {
        // 1. Validar estructura básica
        if (!isset($pregunta['texto']) || !isset($pregunta['opciones']) || !is_array($pregunta['opciones'])) {
            \Log::warning("⚠️ Validación falló: Estructura básica inválida");
            return $this->fallback($fase);
        }

        $texto = trim($pregunta['texto']);
        $opciones = $pregunta['opciones'];

        // 2. Validar cantidad de opciones (Exactamente 4, la 5ta se añade automáticamente)
        if (count($opciones) !== 4) {
            \Log::warning("⚠️ Validación falló: Cantidad de opciones incorrecta (" . count($opciones) . " en lugar de 4)");
            return $this->fallback($fase);
        }

        // 3. Validar opciones únicas (case-insensitive)
        $opcionesLower = array_map(fn($o) => mb_strtolower(trim($o)), $opciones);
        if (count(array_unique($opcionesLower)) !== 4) {
            \Log::warning("⚠️ Validación falló: Opciones duplicadas detectadas: " . json_encode($opciones));
            return $this->fallback($fase);
        }

        // 4. Validar longitud del texto (Máx 120 caracteres)
        if (mb_strlen($texto) > 120) {
            \Log::warning("⚠️ Validación falló: Texto demasiado largo (" . mb_strlen($texto) . " caracteres)");
            return $this->fallback($fase);
        }

        // 5. Validar patrones prohibidos
        if ($this->hasForbiddenPatterns($texto)) {
            \Log::warning("⚠️ Validación falló: Patrones prohibidos detectados en: {$texto}");
            return $this->fallback($fase);
        }

        // 6. Validar similitud con pregunta anterior
        if ($preguntaAnterior && isset($preguntaAnterior['texto'])) {
            $textoAnterior = trim($preguntaAnterior['texto']);

            // Similitud general
            if ($this->isSimilar($texto, $textoAnterior)) {
                \Log::warning("⚠️ Validación falló: Pregunta muy similar a la anterior");
                return $this->fallback($fase);
            }

            // No empezar igual (primeras 15 letras)
            if (mb_substr(mb_strtolower($texto), 0, 15) === mb_substr(mb_strtolower($textoAnterior), 0, 15)) {
                \Log::warning("⚠️ Validación falló: Pregunta empieza igual que la anterior");
                return $this->fallback($fase);
            }
        }

        // Si pasa todas las validaciones
        \Log::info("✅ Pregunta validada exitosamente: {$texto}");
        return $pregunta;
    }

    /**
     * Devuelve una pregunta de respaldo estática según la fase.
     *
     * @param int $fase
     * @return array
     */
    public function fallback(int $fase): array
    {
        $id = 'fallback_' . $fase . '_' . uniqid();

        switch ($fase) {
            case 1: // Exploración amplia
                return [
                    'id' => $id,
                    'texto' => '¿Qué tipo de actividades te resultan más gratificantes en tu día a día?',
                    'opciones' => [
                        'Resolver problemas lógicos',
                        'Ayudar a otras personas',
                        'Crear o diseñar cosas nuevas',
                        'Organizar y planificar tareas'
                    ]
                ];
            case 2: // Selección de familia
                return [
                    'id' => $id,
                    'texto' => 'Si tuvieras que elegir un entorno de trabajo, ¿cuál preferirías?',
                    'opciones' => [
                        'Un laboratorio o centro de investigación',
                        'Una oficina corporativa dinámica',
                        'Un taller o espacio creativo',
                        'Trabajo de campo o al aire libre'
                    ]
                ];
            case 3: // Refinamiento del rol
                return [
                    'id' => $id,
                    'texto' => 'Dentro de un equipo de trabajo, ¿qué rol sueles adoptar naturalmente?',
                    'opciones' => [
                        'El que lidera y toma decisiones',
                        'El que analiza los detalles técnicos',
                        'El que media y facilita la comunicación',
                        'El que ejecuta y hace que las cosas pasen'
                    ]
                ];
            case 4: // Especialización final
            default:
                return [
                    'id' => $id,
                    'texto' => '¿Qué aspecto valoras más para tu futuro desarrollo profesional?',
                    'opciones' => [
                        'La innovación constante',
                        'La estabilidad y seguridad',
                        'El impacto social directo',
                        'La autonomía y libertad creativa'
                    ]
                ];
        }
    }

    /**
     * Calcula si dos textos son demasiado similares (> 65%).
     *
     * @param string $a
     * @param string $b
     * @return bool
     */
    private function isSimilar(string $a, string $b): bool
    {
        if (empty($a) || empty($b)) {
            return false;
        }

        $percent = 0;
        similar_text($a, $b, $percent);

        return $percent > 65;
    }

    /**
     * Verifica si el texto contiene patrones prohibidos.
     *
     * @param string $texto
     * @return bool
     */
    private function hasForbiddenPatterns(string $texto): bool
    {
        $forbidden = [
            "considerando",
            "teniendo en cuenta",
            "basado en",
            "a la vista de",
            "según tus respuestas"
        ];

        $textoLower = mb_strtolower($texto);

        foreach ($forbidden as $phrase) {
            if (str_contains($textoLower, $phrase)) {
                return true;
            }
        }

        return false;
    }
}
