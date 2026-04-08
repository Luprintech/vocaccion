<?php

namespace App\Helpers;

use App\Models\Usuario;
use App\Models\Perfil;

/**
 * PersonalizationHelper
 *
 * Builds a safe, prompt-ready personalization context from a user's profile.
 * All returned values are non-null strings or empty strings — never null —
 * so callers can safely interpolate them into Gemini prompts without empty
 * placeholders like "bio: " causing awkward output.
 *
 * Usage:
 *   $ctx = PersonalizationHelper::buildPersonalizationContext($user, $perfil);
 *   // $ctx['nombre'], $ctx['bio'], etc. are always strings.
 */
class PersonalizationHelper
{
    /**
     * Build a safe personalization context from a user + optional profile.
     *
     * @param  Usuario  $user    The authenticated user model.
     * @param  Perfil|null $perfil The user's profile (may be null for new users).
     * @return array{
     *   nombre: string,
     *   edad_grupo: string,
     *   bio: string,
     *   hobbies: string,
     *   formacion: string,
     *   experiencia_laboral: string
     * }
     */
    public static function buildPersonalizationContext(Usuario $user, ?Perfil $perfil): array
    {
        return [
            'nombre'             => self::safeName($user, $perfil),
            'edad_grupo'         => self::calculateAgeGroup($perfil?->fecha_nacimiento),
            'bio'                => trim($perfil?->bio ?? ''),
            'hobbies'            => self::extractHobbies($perfil),
            'formacion'          => self::latestEducation($perfil),
            'experiencia_laboral' => self::latestJob($perfil),
        ];
    }

    /**
     * Returns true if the context has at least one meaningful field
     * that can enrich a Gemini prompt (bio, hobbies, formacion, or experiencia).
     */
    public static function hasContext(array $context): bool
    {
        return !empty($context['bio'])
            || !empty($context['hobbies'])
            || !empty($context['formacion'])
            || !empty($context['experiencia_laboral']);
    }

    /**
     * Build a formatted prompt block from the context.
     * Returns empty string if no meaningful context exists (graceful degradation).
     *
     * @param  array  $context  Output of buildPersonalizationContext()
     * @return string           Formatted block for Gemini prompt injection, or ''
     */
    public static function buildPromptBlock(array $context): string
    {
        if (!self::hasContext($context)) {
            return '';
        }

        $lines = [];

        if (!empty($context['nombre'])) {
            $lines[] = "Nombre del usuario: {$context['nombre']}";
        }
        if (!empty($context['edad_grupo'])) {
            $lines[] = "Grupo de edad: {$context['edad_grupo']}";
        }
        if (!empty($context['bio'])) {
            $lines[] = "Descripción personal: {$context['bio']}";
        }
        if (!empty($context['hobbies'])) {
            $lines[] = "Intereses y hobbies: {$context['hobbies']}";
        }
        if (!empty($context['formacion'])) {
            $lines[] = "Formación más reciente: {$context['formacion']}";
        }
        if (!empty($context['experiencia_laboral'])) {
            $lines[] = "Experiencia laboral reciente: {$context['experiencia_laboral']}";
        }

        return implode("\n", $lines);
    }

    // ── Private helpers ─────────────────────────────────────────────────────

    private static function safeName(Usuario $user, ?Perfil $perfil): string
    {
        // Prefer profile nombre (first name only), fallback to auth user name
        $nombre = $perfil?->nombre ?? '';
        if (!empty(trim($nombre))) {
            return trim($nombre);
        }
        // From user.name take only the first word (first name)
        $userName = $user->name ?? '';
        return trim(explode(' ', $userName)[0] ?? '');
    }

    private static function calculateAgeGroup(mixed $fechaNacimiento): string
    {
        if (!$fechaNacimiento) {
            return '';
        }

        try {
            $dob = \Carbon\Carbon::parse($fechaNacimiento);
            $age = $dob->age;

            return match (true) {
                $age < 16  => 'menor de 16 años',
                $age <= 18 => '16-18 años (bachillerato/FP)',
                $age <= 25 => '19-25 años (universitario/inicio carrera)',
                $age <= 35 => '26-35 años (inicio/consolidación profesional)',
                $age <= 50 => '36-50 años (profesional consolidado)',
                default    => 'más de 50 años (experiencia senior)',
            };
        } catch (\Exception $e) {
            return '';
        }
    }

    private static function extractHobbies(?Perfil $perfil): string
    {
        if (!$perfil) {
            return '';
        }

        // Load intereses relation if not already loaded
        $intereses = $perfil->intereses ?? collect();

        if ($intereses instanceof \Illuminate\Database\Eloquent\Collection) {
            $list = $intereses->pluck('nombre')->filter()->values()->implode(', ');
            return $list;
        }

        return '';
    }

    private static function latestEducation(?Perfil $perfil): string
    {
        if (!$perfil) {
            return '';
        }

        $formaciones = $perfil->formaciones ?? collect();

        if ($formaciones instanceof \Illuminate\Database\Eloquent\Collection && $formaciones->isNotEmpty()) {
            $latest = $formaciones->sortByDesc('fecha_inicio')->first();
            $titulo = $latest?->titulo_obtenido ?? '';
            $nivel  = $latest?->nivel ?? '';
            $centro = $latest?->centro_estudios ?? '';

            $parts = array_filter([$titulo ?: $nivel, $centro]);
            return implode(' en ', $parts);
        }

        // Fallback to perfil.nivel_estudios
        return $perfil->nivel_estudios ?? '';
    }

    private static function latestJob(?Perfil $perfil): string
    {
        if (!$perfil) {
            return '';
        }

        $experiencias = $perfil->experiencias ?? collect();

        if ($experiencias instanceof \Illuminate\Database\Eloquent\Collection && $experiencias->isNotEmpty()) {
            $latest = $experiencias->sortByDesc('fecha_inicio')->first();
            $puesto  = $latest?->puesto ?? '';
            $empresa = $latest?->empresa ?? '';

            $parts = array_filter([$puesto, $empresa]);
            return implode(' en ', $parts);
        }

        return '';
    }
}
