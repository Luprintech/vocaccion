<?php
namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Support\Facades\URL;
use Laravel\Cashier\Cashier;
use App\Models\Usuario;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // Registrar el servicio Gemini como singleton
        $this->app->singleton(\App\Services\GeminiService::class, function ($app) {
            return new \App\Services\GeminiService();
        });
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Personalizar el enlace de verificación para que apunte a /email/verify/...
        VerifyEmail::$createUrlCallback = function ($notifiable) {
            return URL::temporarySignedRoute(
                'verification.verify',
                now()->addMinutes(60),
                [
                    'id' => $notifiable->getKey(),
                    'hash' => sha1($notifiable->getEmailForVerification()),
                ]
            );
        };

        Cashier::useCustomerModel(Usuario::class);
    }
}
