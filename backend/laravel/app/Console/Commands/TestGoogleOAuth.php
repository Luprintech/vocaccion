<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Laravel\Socialite\Facades\Socialite;
use Exception;

class TestGoogleOAuth extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'test:google-oauth';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Probar la configuración de Google OAuth';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('🔍 Probando configuración de Google OAuth...');

        // Verificar variables de entorno
        $this->checkEnvVariables();

        // Verificar configuración de servicios
        $this->checkServicesConfig();

        // Probar generación de URL
        $this->testUrlGeneration();

        $this->info('✅ Prueba de configuración completada.');
    }

    private function checkEnvVariables()
    {
        $this->info("\n📋 Verificando variables de entorno:");

        $requiredVars = [
            'GOOGLE_CLIENT_ID',
            'GOOGLE_CLIENT_SECRET', 
            'GOOGLE_REDIRECT_URL',
            'FRONTEND_URL'
        ];

        foreach ($requiredVars as $var) {
            $value = env($var);
            if ($value) {
                $this->line("✓ {$var}: " . $this->maskSensitive($var, $value));
            } else {
                $this->error("✗ {$var}: NO DEFINIDA");
            }
        }
    }

    private function checkServicesConfig()
    {
        $this->info("\n⚙️ Verificando configuración de servicios:");

        $googleConfig = config('services.google');
        
        if ($googleConfig) {
            $this->line("✓ Configuración de Google encontrada");
            $this->line("  - Client ID: " . $this->maskSensitive('GOOGLE_CLIENT_ID', $googleConfig['client_id'] ?? 'NO DEFINIDO'));
            $this->line("  - Client Secret: " . ($googleConfig['client_secret'] ? '[DEFINIDO]' : 'NO DEFINIDO'));
            $this->line("  - Redirect: " . ($googleConfig['redirect'] ?? 'NO DEFINIDO'));
        } else {
            $this->error("✗ No se encontró configuración de Google en services.php");
        }
    }

    private function testUrlGeneration()
    {
        $this->info("\n🌐 Probando generación de URL de Google:");

        try {
            // Intentar generar URL (esto no hace redirect real en CLI)
            $url = Socialite::driver('google')->redirect()->getTargetUrl();
            $this->line("✓ URL de Google generada correctamente");
            $this->line("  URL: " . substr($url, 0, 80) . "...");
        } catch (Exception $e) {
            $this->error("✗ Error generando URL: " . $e->getMessage());
        }
    }

    private function maskSensitive($var, $value)
    {
        if (str_contains($var, 'SECRET') || str_contains($var, 'CLIENT_ID')) {
            return substr($value, 0, 8) . str_repeat('*', max(0, strlen($value) - 12)) . substr($value, -4);
        }
        return $value;
    }
}