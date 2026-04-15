<?php

if (!function_exists('require_data')) {
    function require_data(string $relativePath): mixed
    {
        $path = database_path('data/' . $relativePath);

        if (str_ends_with($relativePath, '.php')) {
            return require $path;
        }

        if (str_ends_with($relativePath, '.json')) {
            return json_decode(file_get_contents($path), true, 512, JSON_THROW_ON_ERROR);
        }

        throw new InvalidArgumentException('Unsupported data file format: ' . $relativePath);
    }
}
