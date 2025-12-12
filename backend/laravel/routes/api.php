<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Log;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\GoogleAuthController;
use App\Http\Controllers\TestController;
use App\Http\Controllers\UserTestController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\PasswordResetController;
use App\Http\Controllers\ContactoController;
use App\Http\Controllers\SubscriptionController;
use App\Http\Controllers\StripeWebhookController;
use App\Http\Controllers\GuiaController;


// Rutas públicas (sin autenticación)
Route::post('register', [AuthController::class, 'register']);
Route::get('testimonios', [App\Http\Controllers\TestimonioController::class, 'index']);

// Recursos públicos
Route::get('/recursos', [App\Http\Controllers\RecursoController::class, 'index']);
Route::get('/recursos/{slug}', [App\Http\Controllers\RecursoController::class, 'showPublic']);
Route::post('/recursos/{slug}/view', [App\Http\Controllers\RecursoController::class, 'incrementarVisualizacion']);
Route::post('/recursos/{slug}/download', [App\Http\Controllers\RecursoController::class, 'incrementarDescarga']);

// =====================================================
// STRIPE WEBHOOK (Público - Stripe IP validated)
// =====================================================
Route::post('stripe/webhook', [StripeWebhookController::class, 'handleWebhook']);
Route::post('login', [AuthController::class, 'login']);

// Alias público para generar imagen por profesión (sin OAuth con Unsplash Source)
Route::post('generar-imagen', [TestController::class, 'generarImagenPorProfesion']);

// Rutas de recuperación de contraseña
Route::post('forgot-password', [PasswordResetController::class, 'forgotPassword']);
Route::post('verify-reset-token', [PasswordResetController::class, 'verifyResetToken']);
Route::post('reset-password', [PasswordResetController::class, 'resetPassword']);

// Rutas de verificación de email
Route::get('email/verify/{id}/{hash}', [AuthController::class, 'verifyEmail'])
    ->middleware(['signed'])
    ->name('verification.verify');
Route::post('email/resend', [AuthController::class, 'resendVerification']);
Route::post('email/check', [AuthController::class, 'checkEmailVerification']);

// Rutas de autenticación con Google OAuth - necesitan sesiones web
Route::middleware(['web'])->group(function () {
    Route::get('auth/google', [GoogleAuthController::class, 'redirectToGoogle']);
    Route::get('auth/google/callback', [GoogleAuthController::class, 'handleGoogleCallback']);
    Route::get('auth/google/url', [GoogleAuthController::class, 'getGoogleUrl']); // Para SPAs
});


// Rutas protegidas (requieren autenticación con Sanctum)
Route::middleware('auth:sanctum')->group(function () {

    // Itinerario Académico
    Route::post('itinerario/generar', [App\Http\Controllers\ItinerarioController::class, 'generar']);
    Route::get('test-vocacional/pdf/{id}', [App\Http\Controllers\ItinerarioController::class, 'descargarPDF']);

    // =====================================================
    // PERFIL Y AUTENTICACIÓN
    // =====================================================
    Route::get('profile', [AuthController::class, 'profile']);
    Route::put('profile', [AuthController::class, 'updateProfile']);
    Route::post('profile', [AuthController::class, 'updateProfile']); // Para soportar FormData con imagen
    Route::delete('profile/image', [AuthController::class, 'deleteProfileImage']); // Eliminar imagen de perfil
    Route::post('logout', [AuthController::class, 'logout']);

    // Testimonios (crear, editar, eliminar)
    Route::post('testimonios', [App\Http\Controllers\TestimonioController::class, 'store']);
    Route::put('testimonios/{id}', [App\Http\Controllers\TestimonioController::class, 'update']);
    Route::delete('testimonios/{id}', [App\Http\Controllers\TestimonioController::class, 'destroy']);

    // ==============================================
    // ENDPOINTS DE TEST DEL USUARIO (PROGRESO Y RESULTADOS)
    // ==============================================
    Route::prefix('user/test')->group(function () {
        Route::post('/save-progress', [UserTestController::class, 'saveProgress']); // Guarda progreso parcial
        Route::get('/progress', [UserTestController::class, 'getProgress']);        // Recupera progreso guardado
        Route::post('/save-result', [UserTestController::class, 'saveResult']);     // Guarda resultado final
        Route::get('/results', [UserTestController::class, 'listResults']);        // Lista resultados guardados del usuario
        Route::get('/', [UserTestController::class, 'getTest']);                    // Consulta general del test del usuario
        Route::get('/estado', [UserTestController::class, 'stateTest']);       // Consulta estado del test del usuario
        Route::post('/cancelar', [UserTestController::class, 'cancelTest']); // Cancela test en curso
        Route::post('/clear', [UserTestController::class, 'clearResults']); // Borra resultados/sesiones y objetivo al reiniciar
    });

    // Endpoints para objetivo profesional
    Route::post('objetivo-profesional', [App\Http\Controllers\ObjetivoProfesionalController::class, 'store']);
    Route::get('objetivo-profesional', [App\Http\Controllers\ObjetivoProfesionalController::class, 'show']);
    Route::delete('objetivo-profesional', [App\Http\Controllers\ObjetivoProfesionalController::class, 'destroy']);

    // ==============================================
    // ENDPOINTS DEL TEST VOCACIONAL (IA)
    // ==============================================
    Route::prefix('test')->group(function () {
        // SISTEMA PROGRESIVO NUEVO
        Route::post('/iniciar', [TestController::class, 'iniciar']); // Inicia sesión y devuelve pregunta 1
        Route::post('/siguiente-pregunta', [TestController::class, 'siguientePregunta']); // Genera siguiente pregunta

        // Rutas de análisis y resultados
        Route::post('/analizar-respuestas', [TestController::class, 'analizarResultados']); // Analiza respuestas finales
        Route::post('/procesar-resultados', [TestController::class, 'procesarResultados']); // Procesa profesiones (si se mantiene)
        Route::post('/generar-imagen', [TestController::class, 'generarImagenPorProfesion']); // Genera imagen IA
    });


    // Endpoints del perfil vocacional
    Route::prefix('profile')->group(function () {
        // Route::get('/', [ProfileController::class, 'show']);           // COMENTADO: Conflicto con AuthController->profile (línea 45)
        // Route::post('/', [ProfileController::class, 'store']);      // COMENTADO: Conflicto con AuthController->updateProfile
        Route::get('/stats', [ProfileController::class, 'stats']);     // GET /api/profile/stats - Estadísticas
    });

    // =====================================================
    // Rutas de Guías
    // =====================================================
    Route::prefix('guias')->middleware('metodo-http')->group(function () {
        Route::get('/visible', [GuiaController::class, 'visible']);
        Route::get('/mis-guias', [GuiaController::class, 'myGuides']);
        Route::get('/palabras-clave', [GuiaController::class, 'getPalabrasClaves']);
        Route::post('/', [GuiaController::class, 'store']);
        Route::get('/{guia}', [GuiaController::class, 'show']);
        Route::put('/{guia}', [GuiaController::class, 'update']);
        Route::delete('/{guia}', [GuiaController::class, 'destroy']);
        Route::get('/{guia}/download', [GuiaController::class, 'download']);
        Route::get('/{guia}/preview', [GuiaController::class, 'preview']);
    });

    Route::get('/recursos/articulos/{slug}/pdf', [App\Http\Controllers\RecursoPDFController::class, 'generarPDF']);
    Route::get('/recursos/descargar-plantilla/{archivo}', [App\Http\Controllers\RecursoController::class, 'descargarPlantilla']);

    // =====================================================
    // Rutas de Guías
    // =====================================================
    Route::prefix('guias')->middleware('metodo-http')->group(function () {
        Route::get('/visible', [GuiaController::class, 'visible']);
        Route::get('/mis-guias', [GuiaController::class, 'myGuides']);
        Route::get('/palabras-clave', [GuiaController::class, 'getPalabrasClaves']);
        Route::post('/', [GuiaController::class, 'store']);
        Route::get('/{guia}', [GuiaController::class, 'show']);
        Route::put('/{guia}', [GuiaController::class, 'update']);
        Route::delete('/{guia}', [GuiaController::class, 'destroy']);
        Route::get('/{guia}/download', [GuiaController::class, 'download']);
        Route::get('/{guia}/preview', [GuiaController::class, 'preview']);
    });

    // =====================================================
    // TEST ENDPOINT - Para debuggear autenticación
    // =====================================================
    Route::get('/test-auth', function (Request $request) {
        $user = $request->user();
        Log::info('Usuario:', ['user' => $user ? $user->id : 'null']);
        return response()->json([
            'message' => 'Autenticación funcionando',
            'user_id' => $user?->id,
            'user_email' => $user?->email,
        ]);
    });

    Route::get('/admin/stats/simple', function (Request $request) {
        // Endpoint simple sin middleware role
        $user = $request->user();
        Log::info('Stats request from user:', ['user_id' => $user?->id]);

        return response()->json([
            'total_usuarios' => \App\Models\Usuario::count(),
            'tests_completados' => 45,
            'nuevos_registros' => 12,
            'success' => true,
            'user_id' => $user?->id
        ]);
    });

    // =====================================================
    // SUBSCRIPTIONS (STRIPE)
    // CRITICAL: Explicitly use auth:sanctum middleware on each route
    // This ensures Sanctum processes Bearer tokens correctly
    // =====================================================
    Route::post('/subscription/checkout', [SubscriptionController::class, 'checkout'])
        ->middleware('auth:sanctum');
    Route::post('/subscription/portal', [SubscriptionController::class, 'portal'])
        ->middleware('auth:sanctum');
    Route::get('/subscription/status', [SubscriptionController::class, 'status'])
        ->middleware('auth:sanctum');

    Route::get('/subscription/details', [SubscriptionController::class, 'details'])
        ->middleware('auth:sanctum');

    Route::delete('/account/destroy', [SubscriptionController::class, 'destroy'])
        ->middleware('auth:sanctum');

    // =====================================================
    // DASHBOARDS POR ROL
    // =====================================================
    // Rutas protegidas por middleware role
    require __DIR__ . '/admin.php';
    require __DIR__ . '/orientador.php';
    require __DIR__ . '/estudiante.php';
    require __DIR__ . '/admin.php';
    require __DIR__ . '/orientador.php';
    require __DIR__ . '/estudiante.php';
});

// Ruta para enviar los datos del formulario de contacto
Route::post('/contacto', [ContactoController::class, 'enviar']);
