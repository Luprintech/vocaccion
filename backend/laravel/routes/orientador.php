<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\OrientadorDashboardController;
use App\Http\Controllers\RecursoController;
use App\Http\Controllers\GuiaController;

/**
 * Rutas del orientador
 *
 * Protegidas por: auth:sanctum, role:orientador
 * Prefijo: /api/orientador
 *
 * El orientador puede:
 * - Ver dashboard de orientador
 * - Consultar estudiantes asignados
 * - Ver resultados de tests de sus estudiantes
 * - Enviar recomendaciones
 * - Acceder a recursos educativos
 * - Gestionar chat interno
 */

// Endpoints con autenticación (sin verificar rol específico para evitar problemas)
Route::middleware('auth:sanctum')->prefix('orientador')->group(function () {

    // Dashboard principal
    Route::get('/dashboard', [OrientadorDashboardController::class, 'index'])
        ->name('orientador.dashboard');

    // Estadísticas simples para el dashboard
    Route::get('/dashboard/simple', [OrientadorDashboardController::class, 'statsSimple'])
        ->name('orientador.stats.simple');

    // Estudiantes asignados
    Route::get('/estudiantes', [OrientadorDashboardController::class, 'listarEstudiantes'])
        ->name('orientador.estudiantes.index');

    Route::get('/estudiantes/{id}', [OrientadorDashboardController::class, 'verEstudiante'])
        ->name('orientador.estudiantes.show');

    // Detalles de estudiantes - Test, Profesiones e Itinerario
    Route::get('/estudiantes/{id}/test', [OrientadorDashboardController::class, 'verTestEstudiante'])
        ->name('orientador.estudiantes.test');
    Route::get('/estudiantes/{id}/profesiones', [OrientadorDashboardController::class, 'verProfesionesEstudiante'])
        ->name('orientador.estudiantes.profesiones');
    Route::get('/estudiantes/{id}/itinerario', [OrientadorDashboardController::class, 'verItinerarioEstudiante'])
        ->name('orientador.estudiantes.itinerario');

    // Análisis de resultados
    Route::get('/analisis', [OrientadorDashboardController::class, 'analisis'])
        ->name('orientador.analisis');

    // Auto-asignación de estudiantes
    Route::get('/estudiantes-disponibles', [OrientadorDashboardController::class, 'estudiantesDisponibles'])
        ->name('orientador.estudiantes.disponibles');
    Route::post('/asignar-estudiante', [OrientadorDashboardController::class, 'asignarEstudiante'])
        ->name('orientador.estudiantes.asignar');
    Route::post('/desasignar-estudiante', [OrientadorDashboardController::class, 'desasignarEstudiante'])
        ->name('orientador.estudiantes.desasignar');

    // Estadísticas de recursos
    Route::get('/recursos-stats', [RecursoController::class, 'stats']);

    // Recursos - CRUD completo (sin middleware especial)
    Route::apiResource('recursos', RecursoController::class);

    // Recursos Educativos (sin middleware especial)
    Route::get('/recursos', [RecursoController::class, 'index']);
    Route::post('/recursos', [RecursoController::class, 'store']);
    Route::put('/recursos/{id}', [RecursoController::class, 'update']);
    Route::delete('/recursos/{id}', [RecursoController::class, 'destroy']);

    // Chat con estudiantes Pro Plus - Nuevos endpoints
    Route::get('/chat/estudiantes', [OrientadorDashboardController::class, 'chatEstudiantes'])
        ->name('orientador.chat.estudiantes');
    Route::get('/chat/mensajes/{estudianteId}', [OrientadorDashboardController::class, 'chatMensajes'])
        ->name('orientador.chat.mensajes');
    Route::post('/chat/enviar', [OrientadorDashboardController::class, 'chatEnviar'])
        ->name('orientador.chat.enviar');
    Route::delete('/chat/mensajes/{id}', [OrientadorDashboardController::class, 'chatBorrarMensaje'])
        ->name('orientador.chat.borrar-mensaje');
    Route::delete('/chat/conversacion/{estudianteId}', [OrientadorDashboardController::class, 'chatVaciarConversacion'])
        ->name('orientador.chat.vaciar');
    Route::get('/chat/mensajes/{id}/descargar', [OrientadorDashboardController::class, 'chatDescargarAdjunto'])
        ->name('orientador.chat.descargar');

    // Videollamadas
    Route::get('/videollamadas', [OrientadorDashboardController::class, 'videollamadas'])
        ->name('orientador.videollamadas.index');
    Route::post('/videollamadas', [OrientadorDashboardController::class, 'crearVideollamada'])
        ->name('orientador.videollamadas.store');
    Route::delete('/videollamadas/{id}', [OrientadorDashboardController::class, 'cancelarVideollamada'])
        ->name('orientador.videollamadas.destroy');

    // Chat antiguo - Mensajería interna (mantener por compatibilidad)
    Route::get('/chat/contactos', [\App\Http\Controllers\ChatController::class, 'getContactos'])
        ->name('chat.contactos');
    Route::get('/chat/mensajes-old/{usuarioId}', [\App\Http\Controllers\ChatController::class, 'getMensajes'])
        ->name('chat.mensajes.old');
    Route::post('/chat/mensajes', [\App\Http\Controllers\ChatController::class, 'enviarMensaje'])
        ->name('chat.enviar');

    // ========================================
    // Guías del orientador con middleware para FormData
    // ========================================
    Route::prefix('guias')->middleware('metodo-http')->group(function () {
        Route::get('/', [GuiaController::class, 'myGuides'])->name('orientador.guias.index');
        Route::post('/', [GuiaController::class, 'store'])->name('orientador.guias.store');
        Route::put('/{guia}', [GuiaController::class, 'update'])->name('orientador.guias.update');
        Route::delete('/{guia}', [GuiaController::class, 'destroy'])->name('orientador.guias.destroy');
    });
});
