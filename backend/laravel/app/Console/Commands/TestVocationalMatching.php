<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\CareerMatchingService;
use App\Models\Usuario;
use App\Models\VocationalProfile;

/**
 * Prueba determinista del matching RIASEC.
 *
 * Ejecuta CareerMatchingService con scores predefinidos que representan
 * perfiles "puros" y mixtos para verificar la coherencia de los resultados.
 *
 * También permite cargar los scores reales de un usuario existente via --email.
 *
 * NO llama a Gemini ni a Pexels.
 *
 * Uso:
 *   php artisan vocacional:test-matching                                  → todos los perfiles predefinidos
 *   php artisan vocacional:test-matching --perfil=A                       → perfil artístico predefinido
 *   php artisan vocacional:test-matching --perfil=IS                      → perfil mixto Investigador-Social
 *   php artisan vocacional:test-matching --email=estudiante@vocaccion.es  → scores reales del usuario
 *   php artisan vocacional:test-matching --email=est@voc.es --perfil=RI   → usuario + comparar contra RI
 *   php artisan vocacional:test-matching --scores=R:80,I:60,A:10,S:10,E:20,C:20
 */
class TestVocationalMatching extends Command
{
    protected $signature = 'vocacional:test-matching
        {--perfil= : Código de perfil predefinido (R, I, A, S, E, C, RI, SA, IE, EC, ...)}
        {--email=  : Email de un usuario existente — usa sus scores RIASEC reales}
        {--scores= : Scores custom en formato R:80,I:60,A:10,S:10,E:20,C:20}
        {--verbose-scores : Muestra el vector normalizado y el boost por profesión}';

    protected $description = 'Prueba el matching RIASEC con perfiles controlados y verifica coherencia de resultados';

    /**
     * Perfiles predefinidos: nombre => [R, I, A, S, E, C]
     * Los valores son absolutos (0-100); el servicio los normaliza internamente.
     */
    private array $predefinedProfiles = [
        'R'  => ['label' => 'Realista puro',           'scores' => ['R'=>90,'I'=>20,'A'=>10,'S'=>10,'E'=>20,'C'=>30]],
        'I'  => ['label' => 'Investigador puro',        'scores' => ['R'=>15,'I'=>95,'A'=>15,'S'=>15,'E'=>10,'C'=>10]],
        'A'  => ['label' => 'Artístico puro',           'scores' => ['R'=>10,'I'=>20,'A'=>90,'S'=>25,'E'=>15,'C'=> 5]],
        'S'  => ['label' => 'Social puro',              'scores' => ['R'=>10,'I'=>20,'A'=>20,'S'=>90,'E'=>15,'C'=>10]],
        'E'  => ['label' => 'Emprendedor puro',         'scores' => ['R'=>15,'I'=>15,'A'=>15,'S'=>20,'E'=>90,'C'=>20]],
        'C'  => ['label' => 'Convencional puro',        'scores' => ['R'=>20,'I'=>20,'A'=> 5,'S'=>15,'E'=>20,'C'=>90]],
        'RI' => ['label' => 'Realista-Investigador',    'scores' => ['R'=>75,'I'=>80,'A'=>20,'S'=>15,'E'=>20,'C'=>25]],
        'IA' => ['label' => 'Investigador-Artístico',   'scores' => ['R'=>10,'I'=>75,'A'=>70,'S'=>20,'E'=>15,'C'=>10]],
        'AS' => ['label' => 'Artístico-Social',         'scores' => ['R'=>10,'I'=>20,'A'=>70,'S'=>70,'E'=>20,'C'=>10]],
        'SE' => ['label' => 'Social-Emprendedor',       'scores' => ['R'=>10,'I'=>15,'A'=>15,'S'=>70,'E'=>70,'C'=>20]],
        'EC' => ['label' => 'Emprendedor-Convencional', 'scores' => ['R'=>15,'I'=>15,'A'=> 5,'S'=>20,'E'=>75,'C'=>75]],
        'RC' => ['label' => 'Realista-Convencional',    'scores' => ['R'=>80,'I'=>15,'A'=> 5,'S'=>10,'E'=>20,'C'=>75]],
        'IS' => ['label' => 'Investigador-Social',      'scores' => ['R'=>10,'I'=>80,'A'=>20,'S'=>75,'E'=>15,'C'=>15]],
    ];

    /**
     * Sectores esperados por código RIASEC dominante (para validación de coherencia).
     */
    private array $expectedSectors = [
        'R' => ['Industria y Manufactura', 'Construcción, Arquitectura e Ingeniería',
                'Agricultura, Medio Ambiente y Sostenibilidad', 'Logística y Transporte',
                'Tecnología e Informática'],
        'I' => ['Ciencia e Investigación', 'Salud y Bienestar', 'Tecnología e Informática',
                'Agricultura, Medio Ambiente y Sostenibilidad'],
        'A' => ['Arte, Diseño y Creatividad', 'Comunicación y Medios', 'Educación y Formación'],
        'S' => ['Educación y Formación', 'Servicios Sociales y Comunitarios', 'Salud y Bienestar'],
        'E' => ['Negocios, Finanzas y Derecho', 'Marketing y Ventas',
                'Administración Pública y Gestión', 'Tecnología e Informática'],
        'C' => ['Administración Pública y Gestión', 'Logística y Transporte',
                'Negocios, Finanzas y Derecho', 'Tecnología e Informática'],
    ];

    public function handle(CareerMatchingService $matcher): int
    {
        $customScores = $this->option('scores');
        $perfilOption = $this->option('perfil');
        $emailOption  = $this->option('email');

        // ── Opción --scores: scores manuales ──────────────────────────────────
        if ($customScores) {
            $scores = $this->parseCustomScores($customScores);
            if (!$scores) {
                $this->error('Formato incorrecto. Usa: --scores=R:80,I:60,A:10,S:10,E:20,C:20');
                return 1;
            }
            $this->runProfile('CUSTOM', 'Perfil personalizado', $scores, $matcher);
            return 0;
        }

        // ── Opción --email: scores reales de un usuario ───────────────────────
        if ($emailOption) {
            return $this->handleUserEmail($emailOption, $perfilOption, $matcher);
        }

        // ── Opción --perfil: perfil predefinido ───────────────────────────────
        if ($perfilOption) {
            $key = strtoupper($perfilOption);
            if (!isset($this->predefinedProfiles[$key])) {
                $this->error("Perfil '{$key}' no encontrado. Disponibles: " . implode(', ', array_keys($this->predefinedProfiles)));
                return 1;
            }
            $p = $this->predefinedProfiles[$key];
            $this->runProfile($key, $p['label'], $p['scores'], $matcher);
            return 0;
        }

        // ── Sin opciones: todos los perfiles predefinidos ─────────────────────
        $this->line('');
        $this->info('╔══════════════════════════════════════════════════════════════╗');
        $this->info('║      VOCACCIÓN — TEST DE COHERENCIA DEL MATCHING RIASEC     ║');
        $this->info('╚══════════════════════════════════════════════════════════════╝');
        $this->line('');

        $issues = 0;
        foreach ($this->predefinedProfiles as $key => $profile) {
            $issues += $this->runProfile($key, $profile['label'], $profile['scores'], $matcher);
            $this->line('');
        }

        $this->line('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        if ($issues === 0) {
            $this->info('✅  Todos los perfiles producen resultados coherentes.');
        } else {
            $this->warn("⚠️   Se detectaron {$issues} resultado(s) potencialmente incoherentes.");
        }
        $this->line('');

        return 0;
    }

    /**
     * Carga los scores RIASEC reales de un usuario por email y ejecuta el matching.
     */
    private function handleUserEmail(string $email, ?string $perfilOption, CareerMatchingService $matcher): int
    {
        $user = Usuario::where('email', $email)->first();

        if (!$user) {
            $this->error("Usuario no encontrado: {$email}");
            return 1;
        }

        $this->line('');
        $this->info("👤  Usuario: {$user->nombre} ({$user->email})  [ID: {$user->id}]");

        // Buscar perfil vocacional
        $profile = VocationalProfile::where('usuario_id', $user->id)->first();

        if (!$profile) {
            $this->error("El usuario {$email} no tiene perfil vocacional (VocationalProfile). Necesita haber completado el test.");
            return 1;
        }

        $scores = [
            'R' => (int) round($profile->realistic_score    ?? 0),
            'I' => (int) round($profile->investigative_score ?? 0),
            'A' => (int) round($profile->artistic_score     ?? 0),
            'S' => (int) round($profile->social_score       ?? 0),
            'E' => (int) round($profile->enterprising_score ?? 0),
            'C' => (int) round($profile->conventional_score ?? 0),
        ];

        // Calcular arquetipo (top-2 dimensiones)
        arsort($scores);
        $top2   = array_slice(array_keys($scores), 0, 2);
        $arquetipo = implode('', $top2);
        arsort($scores); // re-ordenar para mostrar

        $this->info("📊  Perfil RIASEC real → Arquetipo dominante: [{$arquetipo}]");
        $this->line('    ' . $this->formatScores($scores));
        $this->line('');

        $label = "Perfil real de {$user->nombre} [{$arquetipo}]";
        $this->runProfile("USER:{$user->id}", $label, $scores, $matcher);

        // Si también se pidió un perfil predefinido, comparar
        if ($perfilOption) {
            $key = strtoupper($perfilOption);
            if (isset($this->predefinedProfiles[$key])) {
                $this->line('');
                $this->line("── Comparación con perfil predefinido [{$key}] ─────────────────");
                $p = $this->predefinedProfiles[$key];
                $this->runProfile($key, $p['label'] . ' (predefinido)', $p['scores'], $matcher);
            }
        }

        return 0;
    }

    /**
     * Ejecuta el matching para un perfil y muestra los resultados.
     * Devuelve el número de inconsistencias detectadas.
     */
    private function runProfile(string $key, string $label, array $scores, CareerMatchingService $matcher): int
    {
        $this->line("┌─ [{$key}] {$label}");
        $this->line('│  Input RIASEC: ' . $this->formatScores($scores));

        $results = $matcher->match($scores);

        if (empty($results)) {
            $this->error('│  ERROR: el matcher no devolvió resultados.');
            return 1;
        }

        // Tabla de resultados
        $rows = [];
        foreach ($results as $i => $career) {
            $rows[] = [
                $i + 1,
                $career['titulo'],
                $career['sector'],
                $career['match_porcentaje'] . '%',
                $career['nivel_formacion'] ?? '-',
                $career['nivel_salarial'] ?? '-',
                $career['tipo_profesion'] ?? '-',
            ];
        }

        $this->table(
            ['#', 'Profesión', 'Sector', 'Match', 'Formación', 'Salario', 'Tipo'],
            $rows
        );

        // ── Validación de coherencia ───────────────────────────────────────────
        $issues = $this->validateCoherence($key, $results, $scores);

        if (empty($issues)) {
            $this->line('│  ✅  Resultados coherentes con el perfil.');
        } else {
            foreach ($issues as $issue) {
                $this->warn('│  ⚠️  ' . $issue);
            }
        }

        return count($issues);
    }

    /**
     * Verifica que las profesiones devueltas sean coherentes con el perfil RIASEC.
     */
    private function validateCoherence(string $profileKey, array $results, array $scores): array
    {
        $issues = [];

        // Detectar letras dominantes del perfil
        arsort($scores);
        $dominantLetters = array_slice(array_keys($scores), 0, 2);

        // Sectores aceptables para este perfil
        $acceptableSectors = [];
        foreach ($dominantLetters as $letter) {
            $acceptableSectors = array_merge($acceptableSectors, $this->expectedSectors[$letter] ?? []);
        }
        $acceptableSectors = array_unique($acceptableSectors);

        // Comprobar que al menos 4 de 6 resultados están en sectores esperados
        $inExpectedSector = 0;
        foreach ($results as $career) {
            if (in_array($career['sector'], $acceptableSectors)) {
                $inExpectedSector++;
            }
        }

        if ($inExpectedSector < 4) {
            $issues[] = "Solo {$inExpectedSector}/6 profesiones están en sectores esperados para perfil {$profileKey}."
                      . " Esperados: " . implode(', ', $acceptableSectors);
        }

        // Comprobar que el score mínimo no sea demasiado bajo (< 40%)
        $minScore = min(array_column($results, 'match_porcentaje'));
        if ($minScore < 35) {
            $issues[] = "Score mínimo muy bajo: {$minScore}% (¿perfil demasiado disperso o catálogo con hueco?)";
        }

        // Comprobar score máximo razonable (> 55% para perfiles puros)
        $maxScore = max(array_column($results, 'match_porcentaje'));
        $isPure = strlen($profileKey) === 1;
        if ($isPure && $maxScore < 55) {
            $issues[] = "Score máximo bajo para perfil puro {$profileKey}: {$maxScore}% (vector RIASEC del catálogo puede necesitar revisión)";
        }

        // Comprobar diversidad: no más de 3 del mismo sector
        $sectorCounts = array_count_values(array_column($results, 'sector'));
        foreach ($sectorCounts as $sector => $count) {
            if ($count > 3) {
                $issues[] = "Demasiadas profesiones del mismo sector '{$sector}': {$count}/6";
            }
        }

        return $issues;
    }

    private function formatScores(array $scores): string
    {
        $parts = [];
        foreach (['R', 'I', 'A', 'S', 'E', 'C'] as $dim) {
            $parts[] = "{$dim}:{$scores[$dim]}";
        }
        return implode('  ', $parts);
    }

    private function parseCustomScores(string $raw): ?array
    {
        $scores = ['R' => 0, 'I' => 0, 'A' => 0, 'S' => 0, 'E' => 0, 'C' => 0];
        $parts = explode(',', $raw);
        foreach ($parts as $part) {
            [$dim, $val] = explode(':', trim($part)) + [null, null];
            $dim = strtoupper(trim($dim ?? ''));
            if (!array_key_exists($dim, $scores) || !is_numeric($val)) {
                return null;
            }
            $scores[$dim] = (int) $val;
        }
        return $scores;
    }
}
