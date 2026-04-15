<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ImportNonUniversityCenters extends Command
{
    protected $signature = 'catalog:import-non-university
                            {--community= : Only import centers from this community (e.g. andalucia)}
                            {--dry-run : Show counts without saving}
                            {--force : Re-import/update existing records}';

    protected $description = 'Import non-university educational centers from MECD JSON files into catalog_centers';

    // Keywords in center type that mean we should EXCLUDE (infantil/guardería/primaria puro)
    private const EXCLUDE_KEYWORDS = [
        'Infantil',
        'Primaria',
        'Guardería',
        'Guarderia',
        'Primer Ciclo',
        'Segundo Ciclo',
        'Rural',       // Colegio Público Rural = infantil + primaria
        'Hogar',       // Escuela Hogar = residencia para alumnos rurales
    ];

    // Keywords that FORCE KEEP even if an exclude keyword matches
    // (e.g. "Centro Integrado de FP" contains nothing from exclude, but "Secundaria" does not match exclude either)
    private const FORCE_KEEP_KEYWORDS = [
        'Integrado',
        'Formaci',          // Formación Profesional
        'Secundaria',
        'Bachiller',
        'Superior',
        'Conservatorio',
        'Arte',
        'Idiomas',
        'Adultos',
        'Deportivas',
        'Música',
        'Musica',
        'Danza',
    ];

    private const DATA_DIR = 'database/data/catalog/non_university_centers/raw/por_comunidad';

    private const COMMUNITY_MAP = [
        'andalucia'       => 'Andalucía',
        'aragon'          => 'Aragón',
        'asturias'        => 'Asturias',
        'baleares'        => 'Islas Baleares',
        'canarias'        => 'Canarias',
        'cantabria'       => 'Cantabria',
        'castilla-leon'   => 'Castilla y León',
        'castilla-mancha' => 'Castilla-La Mancha',
        'cataluna'        => 'Cataluña',
        'ceuta'           => 'Ceuta',
        'extremadura'     => 'Extremadura',
        'galicia'         => 'Galicia',
        'la-rioja'        => 'La Rioja',
        'madrid'          => 'Comunidad de Madrid',
        'melilla'         => 'Melilla',
        'murcia'          => 'Región de Murcia',
        'navarra'         => 'Navarra',
        'pais-vasco'      => 'País Vasco',
        'valencia'        => 'Comunidad Valenciana',
    ];

    public function handle(): int
    {
        $dataDir  = base_path(self::DATA_DIR);
        $isDryRun = $this->option('dry-run');
        $onlyComm = $this->option('community');

        $files = glob("{$dataDir}/*.json");
        if (!$files) {
            $this->error("No JSON files found in {$dataDir}");
            return 1;
        }

        if ($onlyComm) {
            $files = array_values(array_filter(
                $files,
                fn ($f) => str_contains(basename($f, '.json'), $onlyComm)
            ));
            if (empty($files)) {
                $this->error("No file found for community: {$onlyComm}");
                return 1;
            }
        }

        $totalImported = 0;
        $totalSkipped  = 0;

        foreach ($files as $file) {
            $communitySlug = basename($file, '.json');
            $communityName = self::COMMUNITY_MAP[$communitySlug] ?? $communitySlug;

            $this->info("Processing {$communityName}...");

            $json    = file_get_contents($file);
            $centers = json_decode($json, true);

            if (!is_array($centers)) {
                $this->warn("  Could not parse {$file}");
                continue;
            }

            $batch   = [];
            $skipped = 0;
            $now     = now()->toDateTimeString();

            foreach ($centers as $center) {
                if (!isset($center['codigo']) || !isset($center['nombre'])) {
                    $skipped++;
                    continue;
                }

                // Skip centers with scraping errors
                if (!empty($center['error'])) {
                    $skipped++;
                    continue;
                }

                $tipo = $center['tipo'] ?? '';

                if ($this->shouldExclude($tipo)) {
                    $skipped++;
                    continue;
                }

                $ensenanzas = $center['ensenanzas'] ?? [];

                // Skip if no programs at all
                if (empty($ensenanzas)) {
                    $skipped++;
                    continue;
                }

                $sourceCode   = $center['codigo'];
                $name         = $this->cleanStr($center['nombre'] ?? '');
                $localidad    = $this->cleanStr($center['localidad'] ?? '');
                $provincia    = $this->cleanStr($center['provincia'] ?? '');
                $domicilio    = $this->cleanStr($center['domicilio'] ?? '');
                $cp           = $this->cleanNan($center['cp'] ?? '');
                $telefono     = $this->cleanNan($center['telefono'] ?? '');
                $email        = $this->cleanEmail($center['email'] ?? '');
                $website      = $this->cleanUrl($center['web_centro'] ?? '');
                $naturaleza   = $this->cleanStr($center['naturaleza'] ?? '');
                $ownershipType = $this->parseOwnership($naturaleza);

                // Use "mecd-{codigo}" as slug — MECD codes are unique nationwide
                $slug = 'mecd-' . $sourceCode;

                $batch[] = [
                    'slug'               => $slug,
                    'name'               => mb_substr($name, 0, 255),
                    'center_type'        => mb_substr($tipo, 0, 150),
                    'ownership_type'     => $ownershipType,
                    'source_system'      => 'mecd',
                    'source_code'        => $sourceCode,
                    'address'            => $domicilio ? mb_substr($domicilio, 0, 255) : null,
                    'postal_code'        => $cp ? mb_substr($cp, 0, 20) : null,
                    'locality'           => $localidad ? mb_substr($localidad, 0, 255) : null,
                    'municipality'       => $localidad ? mb_substr($localidad, 0, 255) : null,
                    'province'           => $provincia ? mb_substr($provincia, 0, 100) : null,
                    'autonomous_community' => $communityName,
                    'website'            => $website ? mb_substr($website, 0, 500) : null,
                    'email'              => $email ? mb_substr($email, 0, 255) : null,
                    'phone'              => $telefono ? mb_substr($telefono, 0, 30) : null,
                    'active'             => 1,
                    'raw_payload'        => json_encode([
                        'ensenanzas' => $ensenanzas,
                        'tipo'       => $tipo,
                        'naturaleza' => $naturaleza,
                    ]),
                    'created_at'  => $now,
                    'updated_at'  => $now,
                ];

                // Flush in batches of 500
                if (count($batch) >= 500) {
                    if (!$isDryRun) {
                        $this->upsertBatch($batch);
                    }
                    $totalImported += count($batch);
                    $batch = [];
                    $this->output->write('.');
                }
            }

            if (!empty($batch)) {
                if (!$isDryRun) {
                    $this->upsertBatch($batch);
                }
                $totalImported += count($batch);
            }

            $totalSkipped += $skipped;
            $this->line("  → imported: " . count($batch) . " (pending flush) | skipped: {$skipped}");
        }

        $this->newLine();
        $this->info("✅ Total imported: {$totalImported} | Total skipped: {$totalSkipped}");

        if ($isDryRun) {
            $this->warn("(Dry run — nothing was saved to the database)");
        } else {
            $this->info("💡 Run 'php artisan catalog:geocode-centers' to geocode imported centers.");
        }

        return 0;
    }

    // -----------------------------------------------------------------------
    // Helpers
    // -----------------------------------------------------------------------

    private function upsertBatch(array $batch): void
    {
        try {
            DB::table('catalog_centers')->upsert(
                $batch,
                ['source_system', 'source_code'],
                [
                    'name', 'center_type', 'ownership_type',
                    'address', 'postal_code', 'locality', 'municipality',
                    'province', 'autonomous_community',
                    'website', 'email', 'phone',
                    'active', 'raw_payload', 'updated_at',
                ]
            );
        } catch (\Exception $e) {
            // Fallback: one by one
            foreach ($batch as $item) {
                try {
                    DB::table('catalog_centers')->updateOrInsert(
                        ['source_system' => $item['source_system'], 'source_code' => $item['source_code']],
                        $item
                    );
                } catch (\Exception) {
                    // Skip
                }
            }
        }
    }

    private function shouldExclude(string $tipo): bool
    {
        // Force-keep overrides
        foreach (self::FORCE_KEEP_KEYWORDS as $kw) {
            if (mb_stripos($tipo, $kw) !== false) {
                return false;
            }
        }

        // Exclusion check
        foreach (self::EXCLUDE_KEYWORDS as $kw) {
            if (mb_stripos($tipo, $kw) !== false) {
                return true;
            }
        }

        return false;
    }

    private function cleanStr(string $s): string
    {
        $s = trim($s);
        return in_array(strtolower($s), ['nan', 'null', 'none', '']) ? '' : $s;
    }

    private function cleanNan(string $s): string
    {
        $s = trim($s);
        return in_array(strtolower($s), ['nan', 'null', 'none', '']) ? '' : $s;
    }

    private function cleanEmail(string $email): string
    {
        $email = trim($email);
        if (in_array(strtolower($email), ['nan', 'null', 'none', ''])) {
            return '';
        }
        return filter_var($email, FILTER_VALIDATE_EMAIL) ? strtolower($email) : '';
    }

    private function cleanUrl(string $url): string
    {
        $url = trim($url);
        if (in_array(strtolower($url), ['nan', 'null', 'none', ''])) {
            return '';
        }
        return filter_var($url, FILTER_VALIDATE_URL) ? $url : '';
    }

    private function parseOwnership(string $naturaleza): string
    {
        if (mb_stripos($naturaleza, 'público') !== false || mb_stripos($naturaleza, 'publico') !== false) {
            return 'public';
        }
        if (mb_stripos($naturaleza, 'concertado') !== false) {
            return 'concertado';
        }
        if (mb_stripos($naturaleza, 'privado') !== false || mb_stripos($naturaleza, 'privada') !== false) {
            return 'private';
        }
        return 'unknown';
    }
}
