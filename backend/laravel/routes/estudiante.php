<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\EstudianteDashboardController;

/**
 * Rutas del estudiante
 * 
 * Protegidas por: auth:sanctum, role:estudiante
 * Prefijo: /api/estudiante
 * 
 * El estudiante puede:
 * - Ver dashboard de estudiante
 * - Realizar el test vocacional
 * - Ver sus resultados
 * - Acceder a recomendaciones de IA
 * - Ver fichas de profesiones
 * - Gestionar su plan premium
 */

// Endpoint simple sin el middleware de rol (para evitar problemas con loading de relaciones)
Route::middleware('auth:sanctum')->prefix('estudiante')->group(function () {
    Route::get('/dashboard/simple', function () {
        return response()->json([
            'tests_realizados' => 2,
            'resultados_disponibles' => 2,
            'recomendaciones_nuevas' => 5,
            'success' => true
        ]);
    });

    // Suscripción del estudiante (Accesible para cualquier usuario autenticado)
    Route::get('/mi-suscripcion', [EstudianteDashboardController::class, 'miSuscripcion'])
        ->name('estudiante.mi-suscripcion');
});


Route::middleware(['auth:sanctum', 'role:estudiante'])->prefix('estudiante')->group(function () {

    // Dashboard del estudiante
    Route::get('/dashboard', [EstudianteDashboardController::class, 'index'])
        ->name('estudiante.dashboard');

    // Orientador asignado (Pro Plus)
    Route::get('/mi-orientador', [EstudianteDashboardController::class, 'miOrientador'])
        ->name('estudiante.mi-orientador');

    // Chat con orientador (Pro Plus)
    Route::get('/mensajes/conteo', [EstudianteDashboardController::class, 'conteoMensajesSinLeer'])
        ->name('estudiante.mensajes.conteo');
    Route::get('/mensajes', [EstudianteDashboardController::class, 'mensajes'])
        ->name('estudiante.mensajes');
    Route::post('/mensajes', [EstudianteDashboardController::class, 'enviarMensaje'])
        ->name('estudiante.enviar-mensaje');
    Route::get('/mensajes/{id}/descargar', [EstudianteDashboardController::class, 'descargarAdjunto'])
        ->name('estudiante.mensajes.descargar');
    Route::delete('/mensajes/vaciar', [EstudianteDashboardController::class, 'vaciarChat'])
        ->name('estudiante.mensajes.vaciar');

    // Reservas de sesiones / Videollamadas
    Route::get('/reservas', [EstudianteDashboardController::class, 'reservas']);
    Route::get('/reservas/disponibilidad-mensual', [EstudianteDashboardController::class, 'disponibilidadMensual']);
    Route::get('/reservas/disponibilidad', [EstudianteDashboardController::class, 'disponibilidad'])
        ->name('estudiante.disponibilidad');
    Route::post('/reservas', [EstudianteDashboardController::class, 'reservar'])
        ->name('estudiante.reservar');
    Route::delete('/reservas/{id}', [EstudianteDashboardController::class, 'cancelarReserva'])
        ->name('estudiante.cancelar-reserva');

    // Otros endpoints de estudiante se agregarán aquí (la mayoría ya existen en /api/)
    // Los tests, resultados, recomendaciones ya están en rutas sin prefijo
    // Estos son principalmente para consolidar datos en el dashboard
});
