<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;

/**
 * Servicio centralizado para comparar habilidades y estudios del usuario
 * con los requeridos por una profesión.
 * 
 * Usado tanto en TestController (resultados) como en ObjetivoProfesionalController (mi profesión)
 */
class ProfesionComparadorService
{
    /**
     * Enriquecer una profesión con comparación de habilidades y estudios del usuario.
     * 
     * @param object $profesion Objeto profesión con habilidades y formaciones_necesarias
     * @param object $perfil Perfil del usuario con relaciones habilidades y formaciones
     * @return object Profesión enriquecida con habilidades_comparadas y estudios_comparados
     */
    public function enriquecerProfesion($profesion, $perfil)
    {
        // Obtener habilidades del usuario (normalizadas)
        $habilidadesUsuario = [];
        if ($perfil && $perfil->habilidades) {
            $habilidadesUsuario = $perfil->habilidades
                ->pluck('nombre')
                ->filter(function ($nombre) {
                    return is_string($nombre) && !empty(trim($nombre));
                })
                ->map(function ($nombre) {
                    return $this->normalizarTexto($nombre);
                })
                ->toArray();
        }

        // Obtener formaciones del usuario (normalizadas)
        $formacionesUsuario = [];
        if ($perfil && $perfil->formaciones) {
            $formacionesUsuario = $perfil->formaciones
                ->pluck('titulo_obtenido')
                ->filter(function ($titulo) {
                    return is_string($titulo) && !empty(trim($titulo));
                })
                ->map(function ($titulo) {
                    return $this->normalizarTexto($titulo);
                })
                ->toArray();
        }

        Log::info('🔍 Comparando profesión con perfil usuario', [
            'habilidades_usuario' => $habilidadesUsuario,
            'formaciones_usuario' => $formacionesUsuario
        ]);

        // 1. COMPARAR HABILIDADES
        $habilidadesComparadas = $this->compararHabilidades($profesion, $habilidadesUsuario);

        // 2. COMPARAR ESTUDIOS
        $estudiosComparados = $this->compararEstudios($profesion, $formacionesUsuario);

        // Añadir campos a la profesión
        $profesion->habilidades_comparadas = $habilidadesComparadas;
        $profesion->estudios_comparados = $estudiosComparados;

        Log::info('✅ Profesión enriquecida', [
            'habilidades_comparadas' => count($habilidadesComparadas),
            'estudios_comparados' => count($estudiosComparados)
        ]);

        return $profesion;
    }

    /**
     * Comparar habilidades de la profesión con las del usuario
     */
    private function compararHabilidades($profesion, array $habilidadesUsuario): array
    {
        $habilidadesProfesion = $this->extraerHabilidades($profesion);
        $habilidadesComparadas = [];

        foreach ($habilidadesProfesion as $habilidad) {
            $nombreHabilidad = is_string($habilidad) ? $habilidad : ($habilidad['nombre'] ?? json_encode($habilidad));
            $usuarioLaTiene = false;

            foreach ($habilidadesUsuario as $habilidadUsuario) {
                if ($this->calcularCoincidenciaPalabras($nombreHabilidad, $habilidadUsuario)) {
                    $usuarioLaTiene = true;
                    break;
                }
            }

            $habilidadesComparadas[] = [
                'nombre' => trim($nombreHabilidad),
                'usuario_la_tiene' => $usuarioLaTiene,
                'posee_usuario' => $usuarioLaTiene // Alias para compatibilidad
            ];
        }

        return $habilidadesComparadas;
    }

    /**
     * Comparar estudios de la profesión con las formaciones del usuario
     */
    private function compararEstudios($profesion, array $formacionesUsuario): array
    {
        $estudiosNecesarios = $this->extraerEstudios($profesion);
        $estudiosComparados = [];

        foreach ($estudiosNecesarios as $estudio) {
            // VALIDACIÓN: Asegurar que $estudio sea un string
            if (is_array($estudio)) {
                // Si es array, intentar extraer el campo 'nombre' o convertir a string
                $estudio = $estudio['nombre'] ?? json_encode($estudio);
            }

            if (!is_string($estudio) || empty(trim($estudio))) {
                continue; // Saltar estudios inválidos
            }

            $estudioNormalizado = $this->normalizarTexto($estudio);
            $usuarioLoTiene = false;

            foreach ($formacionesUsuario as $formacionUsuario) {
                // Para estudios, usamos coincidencia más flexible (substring o similitud alta)
                if ($estudioNormalizado === $formacionUsuario) {
                    $usuarioLoTiene = true;
                    break;
                }

                if (str_contains($estudioNormalizado, $formacionUsuario) && strlen($formacionUsuario) > 5) {
                    $usuarioLoTiene = true;
                    break;
                }

                if (str_contains($formacionUsuario, $estudioNormalizado) && strlen($estudioNormalizado) > 5) {
                    $usuarioLoTiene = true;
                    break;
                }

                // Similitud por palabras clave (menos estricto que habilidades)
                if ($this->calcularSimilitudEstudios($estudioNormalizado, $formacionUsuario)) {
                    $usuarioLoTiene = true;
                    break;
                }
            }

            $estudiosComparados[] = [
                'nombre' => $estudio,
                'usuario_lo_tiene' => $usuarioLoTiene
            ];
        }

        return $estudiosComparados;
    }

    /**
     * Extraer habilidades de una profesión (maneja diferentes formatos)
     */
    private function extraerHabilidades($profesion): array
    {
        if (!isset($profesion->habilidades)) {
            return [];
        }

        $habilidades = $profesion->habilidades;

        if (is_array($habilidades)) {
            return $habilidades;
        }

        if (is_string($habilidades)) {
            try {
                $parsed = json_decode($habilidades, true);
                return is_array($parsed) ? $parsed : explode(',', $habilidades);
            } catch (\Throwable $e) {
                return explode(',', $habilidades);
            }
        }

        return [];
    }

    /**
     * Extraer estudios de una profesión (maneja diferentes formatos)
     */
    private function extraerEstudios($profesion): array
    {
        // Priorizar formaciones_necesarias
        if (isset($profesion->formaciones_necesarias)) {
            $estudios = $profesion->formaciones_necesarias;

            if (is_array($estudios)) {
                return $estudios;
            }

            if (is_string($estudios)) {
                try {
                    $parsed = json_decode($estudios, true);
                    return is_array($parsed) ? $parsed : [$estudios];
                } catch (\Throwable $e) {
                    return [$estudios];
                }
            }
        }

        // NUEVO: Buscar en el campo 'estudios' (usado en resultados)
        if (isset($profesion->estudios)) {
            $estudios = $profesion->estudios;

            if (is_array($estudios)) {
                return $estudios;
            }

            if (is_string($estudios)) {
                try {
                    $parsed = json_decode($estudios, true);
                    return is_array($parsed) ? $parsed : [$estudios];
                } catch (\Throwable $e) {
                    return [$estudios];
                }
            }
        }

        // Fallback: formacion_recomendada
        if (!empty($profesion->formacion_recomendada)) {
            return $this->extraerEstudiosDeTexto($profesion->formacion_recomendada);
        }

        return [];
    }

    /**
     * Calcular coincidencia ESTRICTA de palabras clave para habilidades.
     * 
     * REGLA DEL USUARIO: "Solo verde si MÁS DE 2 palabras coinciden"
     * 
     * Lógica:
     * 1. Coincidencia exacta (normalizada) -> TRUE
     * 2. Tokenizar y contar palabras coincidentes (ignorando stop words)
     * 3. Si la habilidad tiene < 3 palabras significativas: Requiere TODAS
     * 4. Si tiene >= 3 palabras significativas: Requiere MÁS DE 2 (>= 3)
     */
    private function calcularCoincidenciaPalabras(string $texto1, string $texto2): bool
    {
        $t1 = $this->normalizarTexto($texto1);
        $t2 = $this->normalizarTexto($texto2);

        // Coincidencia exacta
        if ($t1 === $t2)
            return true;

        // Tokenización (eliminar stop words)
        $stopWords = ['de', 'del', 'el', 'la', 'los', 'las', 'un', 'una', 'y', 'o', 'en', 'con', 'para', 'por', 'al', 'lo', 'se', 'su', 'sus', 'como', 'entre'];

        $tokens1 = array_values(array_filter(
            array_diff(explode(' ', $t1), $stopWords),
            fn($t) => strlen($t) > 1
        ));

        $tokens2 = array_values(array_filter(
            array_diff(explode(' ', $t2), $stopWords),
            fn($t) => strlen($t) > 1
        ));

        if (empty($tokens1) || empty($tokens2))
            return false;

        // Contar coincidencias
        $matches = 0;
        foreach ($tokens1 as $word1) {
            foreach ($tokens2 as $word2) {
                if ($this->palabrasSimilares($word1, $word2)) {
                    $matches++;
                    break;
                }
            }
        }

        $count1 = count($tokens1);

        // Aplicar regla estricta
        if ($count1 < 3) {
            // Frase corta: requiere coincidencia total
            return $matches >= $count1;
        } else {
            // Frase larga: requiere MÁS DE 2 palabras (>= 3)
            return $matches > 2;
        }
    }

    /**
     * Calcular similitud para estudios (menos estricto que habilidades)
     */
    private function calcularSimilitudEstudios(string $texto1, string $texto2): bool
    {
        $tokens1 = array_values(array_filter(explode(' ', $texto1), fn($t) => strlen($t) > 2));
        $tokens2 = array_values(array_filter(explode(' ', $texto2), fn($t) => strlen($t) > 2));

        if (empty($tokens1) || empty($tokens2))
            return false;

        $matches = 0;
        foreach ($tokens1 as $word1) {
            foreach ($tokens2 as $word2) {
                if ($this->palabrasSimilares($word1, $word2)) {
                    $matches++;
                    break;
                }
            }
        }

        // Para estudios: 60% de coincidencia es suficiente
        return ($matches / max(count($tokens1), count($tokens2))) >= 0.6;
    }

    /**
     * Verificar si dos palabras son similares (exactas o raíz común)
     */
    private function palabrasSimilares(string $word1, string $word2): bool
    {
        if ($word1 === $word2)
            return true;

        // Raíz común (ej: programacion vs programar)
        if (strlen($word1) > 3 && strlen($word2) > 3) {
            if (str_starts_with($word1, $word2) || str_starts_with($word2, $word1)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Normalizar texto para comparación
     */
    private function normalizarTexto(string $texto): string
    {
        $texto = mb_strtolower($texto, 'UTF-8');
        $texto = preg_replace('/\([^)]*\)/', '', $texto);
        $texto = preg_replace('/\s+/', ' ', trim($texto));

        $acentos = ['á' => 'a', 'é' => 'e', 'í' => 'i', 'ó' => 'o', 'ú' => 'u', 'ñ' => 'n'];
        $texto = strtr($texto, $acentos);

        return trim($texto);
    }

    /**
     * Extraer estudios mencionados en un texto
     */
    private function extraerEstudiosDeTexto(string $texto): array
    {
        $patrones = [
            'grado (superior )?en [^,\.;]+',
            'ciclo formativo de [^,\.;]+',
            'fp (superior|medio) en [^,\.;]+',
            'master en [^,\.;]+',
            'máster en [^,\.;]+',
            'licenciatura en [^,\.;]+',
            'ingeniería [^,\.;]+',
            'diplomatura en [^,\.;]+',
        ];

        $estudios = [];
        foreach ($patrones as $patron) {
            if (preg_match_all('/' . $patron . '/iu', $texto, $matches)) {
                foreach ($matches[0] as $match) {
                    $estudios[] = trim($match);
                }
            }
        }

        if (empty($estudios)) {
            $partes = explode(',', $texto);
            foreach ($partes as $parte) {
                $parte = trim($parte);
                if (strlen($parte) > 10) {
                    $estudios[] = $parte;
                }
            }
        }

        return array_unique($estudios);
    }
}
