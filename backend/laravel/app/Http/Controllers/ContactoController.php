<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\RateLimiter;
use App\Mail\Contacto;

class ContactoController extends Controller
{
    //  Procesa el envío del formulario de contacto
    public function enviar (Request $request) {
        if ($request->filled('prueba_spam')) {
            return response()->json([
                'success' => true,
                'message' => 'Mensaje enviado con éxito.'
            ]);
        }

        // Rate limiting: 1 mensaje cada 10 minutos por IP
        $ip = $request->ip();
        $key = 'contacto:' . $ip;

        if (RateLimiter::tooManyAttempts($key, 1)) {
            $seconds = RateLimiter::availableIn($key);
            $minutes = ceil($seconds / 60);

            return response()->json([
                'success' => false,
                'message' => "Has enviado un mensaje recientemente. Por favor, espera {$minutes} minuto(s) antes de enviar otro.",
                'retry_after_seconds' => $seconds,
                'retry_after_minutes' => $minutes
            ], 429);
        }

        $datosValidados = $request->validate([
            'nombre' => 'required|string|max:75',
            'email' => 'required|email|max:100',
            'tipoConsulta' => 'required|in:orientacion,tecnico,planes,colaboracion,prensa,otro',
            'mensaje' => 'required|string|max:500',
        ]);

        try {
            Mail::mailer('gmail')->to('info.vocaccion@gmail.com')->send(new Contacto($datosValidados));

            // Registrar el intento exitoso (bloquea por 10 minutos)
            RateLimiter::hit($key, 600);

            return response()->json([
                'success' => true,
                'message' => 'Mensaje enviado con éxito'
            ], 200);
        } catch (\Exception $e) {
            Log::error('Error al enviar correo de contacto', [
                'exception' => get_class($e),
                'message' => $e->getMessage(),
                'file' => $e->getFile() . ':' . $e->getLine()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error al enviar el mensaje. Por favor, inténtalo de nuevo más tarde.'
            ], 500);
        }
    }
}
