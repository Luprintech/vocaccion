<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AdminDashboardController;

// Rutas protegidas para Administrador
Route::middleware(['auth:sanctum', 'role:administrador'])->prefix('admin')->group(function () {

    // Dashboard
    Route::get('/dashboard', [AdminDashboardController::class, 'index']);
    Route::get('/stats', [AdminDashboardController::class, 'stats']);

    // Estadísticas detalladas
    Route::get('/estadisticas', [AdminDashboardController::class, 'estadisticas']);

    // Gestión de Usuarios (Estudiantes)
    Route::get('/usuarios', [AdminDashboardController::class, 'listarUsuarios']);
    Route::get('/usuarios/{id}', [AdminDashboardController::class, 'verUsuario']);
    Route::put('/usuarios/{id}', [AdminDashboardController::class, 'actualizarUsuario']);
    Route::put('/usuarios/{id}/plan', [AdminDashboardController::class, 'actualizarPlanUsuario']);
    Route::delete('/usuarios/{id}', [AdminDashboardController::class, 'eliminarUsuario']); // Soft delete

    // Detalles de Test del Estudiante (NUEVO)
    Route::get('/estudiantes/{id}/test', [AdminDashboardController::class, 'verTestEstudiante']);
    Route::get('/estudiantes/{id}/profesiones', [AdminDashboardController::class, 'verProfesionesEstudiante']);
    Route::get('/estudiantes/{id}/itinerario', [AdminDashboardController::class, 'verItinerarioEstudiante']);
    Route::get('/estudiantes/{id}/perfil', [AdminDashboardController::class, 'verPerfilEstudiante']);
    Route::put('/estudiantes/{id}/perfil', [AdminDashboardController::class, 'actualizarPerfilEstudiante']);
    Route::delete('/estudiantes/{id}/foto', [AdminDashboardController::class, 'eliminarFotoPerfilEstudiante']);

    // Gestión de Orientadores
    Route::get('/orientadores', [AdminDashboardController::class, 'listarOrientadores']);
    Route::post('/orientadores', [AdminDashboardController::class, 'crearOrientador']);
    Route::put('/orientadores/{id}', [AdminDashboardController::class, 'actualizarOrientador']);
    Route::delete('/orientadores/{id}', [AdminDashboardController::class, 'eliminarOrientador']); // Soft delete
    Route::get('/orientadores/disponibles', [AdminDashboardController::class, 'listarOrientadoresDisponibles']);

    // Asignación de Orientadores
    Route::post('/asignar-orientador', [AdminDashboardController::class, 'asignarOrientador']);
    Route::post('/desasignar-orientador', [AdminDashboardController::class, 'desasignarOrientador']);

    // Gestión de Testimonios
    Route::get('/testimonios', [AdminDashboardController::class, 'listarTestimonios']);
    Route::patch('/testimonios/{id}/toggle-visibilidad', [AdminDashboardController::class, 'toggleVisibilidadTestimonio']);
    Route::delete('/testimonios/{id}', [AdminDashboardController::class, 'eliminarTestimonio']);
});
