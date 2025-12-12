<?php

if (!function_exists('obtenerCCAAporCiudad')) {
    function obtenerCCAAporCiudad(?string $ciudadOrProvincia = null): ?string
    {
        if (!$ciudadOrProvincia)
            return null;

        $mapa = config('ccaa', []);
        $ciudadOrProvincia = mb_strtolower(trim($ciudadOrProvincia));

        // 1) Coincidencia EXACTA con provincia
        foreach ($mapa as $ccaa => $provincias) {
            foreach ($provincias as $prov) {
                if (mb_strtolower($prov) === $ciudadOrProvincia) {
                    return $ccaa;
                }
            }
        }

        // 2) Coincidencia PARCIAL (para pueblos)
        foreach ($mapa as $ccaa => $provincias) {
            foreach ($provincias as $prov) {
                if (str_contains($ciudadOrProvincia, mb_strtolower($prov))) {
                    return $ccaa;
                }
            }
        }

        return null;
    }
}
