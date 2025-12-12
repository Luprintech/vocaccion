<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

/**
 * RoleMiddleware
 * 
 * Middleware para proteger rutas que requieren roles específicos.
 * 
 * Uso:
 * Route::middleware(['auth:sanctum', 'role:administrador'])->group(...)
 * Route::middleware(['auth:sanctum', 'role:orientador,administrador'])->group(...)
 * 
 * @package App\Http\Middleware
 */
class RoleMiddleware
{
    /**
     * Procesa la solicitud.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @param  string  $roles  Roles permitidos separados por comas
     * @return mixed
     */
    public function handle(Request $request, Closure $next, ...$roles): mixed
    {
        // Verificar que el usuario esté autenticado
        $user = $request->user();
        if (!$user) {
            return response()->json([
                'error' => 'No autorizado',
                'message' => 'Debes estar autenticado para acceder a este recurso'
            ], Response::HTTP_UNAUTHORIZED);
        }

        // Cargar relación de roles si no están cargados
        if (!$user->relationLoaded('roles')) {
            $user->load('roles');
        }

        // Obtener nombres de roles del usuario (desde la relación cargada)
        $userRoles = $user->roles->pluck('nombre')->toArray();

        // Verificar que el usuario tenga alguno de los roles permitidos
        $hasRole = false;
        foreach ($roles as $role) {
            if (in_array($role, $userRoles)) {
                $hasRole = true;
                break;
            }
        }

        if (!$hasRole) {
            return response()->json([
                'error' => 'Acceso prohibido',
                'message' => 'No tienes permisos para acceder a este recurso',
                'required_roles' => $roles,
                'user_roles' => $userRoles
            ], Response::HTTP_FORBIDDEN);
        }

        return $next($request);
    }
}
