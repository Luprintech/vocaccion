<?php

namespace App\Console\Commands;

use App\Models\CatalogCenter;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class NormalizeCatalogPrograms extends Command
{
    protected $signature = 'catalog:normalize-programs {--fresh : Rebuild catalog_programs and pivot table from scratch}';

    protected $description = 'Normalize non-university programs from catalog_centers.raw_payload into catalog_programs and catalog_center_program';

    public function handle(): int
    {
        if ($this->option('fresh')) {
            DB::table('catalog_center_program')->delete();
            DB::table('catalog_programs')->delete();
            $this->info('Tables catalog_programs and catalog_center_program emptied.');
        }

        $centers = CatalogCenter::query()
            ->where('source_system', 'mecd')
            ->whereNotNull('raw_payload')
            ->select('id', 'source_code', 'raw_payload')
            ->get();

        $programRows = [];
        $pivotIndex = [];
        $now = now();

        foreach ($centers as $center) {
            $payload = is_array($center->raw_payload) ? $center->raw_payload : [];
            $ensenanzas = $payload['ensenanzas'] ?? [];

            foreach ($ensenanzas as $ensenanza) {
                $name = trim((string) ($ensenanza['ensenanza'] ?? ''));

                if ($name === '') {
                    continue;
                }

                $family = $this->cleanNullable($ensenanza['familia'] ?? null);
                $level = $this->normalizeLevel($ensenanza['grado'] ?? null, $name);
                $modality = $this->cleanNullable($ensenanza['modalidad'] ?? null);
                $sourceCode = $this->buildSourceCode($level, $family, $name, $modality);

                $programRows[$sourceCode] = [
                    'slug' => Str::slug($sourceCode),
                    'name' => Str::limit($name, 255, ''),
                    'program_type' => $this->resolveProgramType($level, $family, $name),
                    'official_code' => null,
                    'source_system' => 'mecd',
                    'source_code' => $sourceCode,
                    'family_name' => $family,
                    'education_level' => $level,
                    'duration_hours' => null,
                    'duration_years' => null,
                    'modality' => $modality,
                    'official' => true,
                    'official_degree_code' => null,
                    'official_degree_id' => null,
                    'summary' => $this->buildSummary($level, $family, $modality),
                    'source_updated_at' => null,
                    'last_seen_at' => $now,
                    'source_url' => null,
                    'raw_payload' => json_encode($ensenanza, JSON_UNESCAPED_UNICODE),
                    'created_at' => $now,
                    'updated_at' => $now,
                ];

                $pivotKey = $center->id . '|' . $sourceCode;
                $pivotIndex[$pivotKey] = [
                    'center_id' => $center->id,
                    'source_code' => $sourceCode,
                    'academic_year' => null,
                    'shift' => null,
                    'modality' => $modality,
                    'vacancies' => null,
                    'price_range' => null,
                    'official_url' => null,
                    'active' => true,
                    'source_system' => 'mecd',
                    'last_seen_at' => $now,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }
        }

        if (empty($programRows)) {
            $this->warn('No non-university programs found to normalize.');
            return self::SUCCESS;
        }

        foreach (array_chunk(array_values($programRows), 250) as $chunk) {
            DB::table('catalog_programs')->upsert(
                $chunk,
                ['source_system', 'source_code'],
                ['name', 'program_type', 'family_name', 'education_level', 'modality', 'official', 'summary', 'raw_payload', 'last_seen_at', 'updated_at']
            );
        }

        $programIdsByCode = DB::table('catalog_programs')
            ->where('source_system', 'mecd')
            ->whereIn('source_code', array_keys($programRows))
            ->pluck('id', 'source_code');

        $pivotRows = [];
        foreach ($pivotIndex as $item) {
            $programId = $programIdsByCode[$item['source_code']] ?? null;

            if (!$programId) {
                continue;
            }

            unset($item['source_code']);
            $item['program_id'] = $programId;
            $pivotRows[] = $item;
        }

        foreach ($pivotRows as $row) {
            DB::table('catalog_center_program')->updateOrInsert(
                [
                    'center_id' => $row['center_id'],
                    'program_id' => $row['program_id'],
                    'academic_year' => $row['academic_year'],
                ],
                [
                    'shift' => $row['shift'],
                    'modality' => $row['modality'],
                    'vacancies' => $row['vacancies'],
                    'price_range' => $row['price_range'],
                    'official_url' => $row['official_url'],
                    'active' => $row['active'],
                    'source_system' => $row['source_system'],
                    'last_seen_at' => $row['last_seen_at'],
                    'updated_at' => $row['updated_at'],
                    'created_at' => $row['created_at'],
                ]
            );
        }

        $this->info('✅ Programs normalized: ' . count($programRows));
        $this->info('✅ Center-program relations synced: ' . count($pivotRows));

        return self::SUCCESS;
    }

    private function cleanNullable(?string $value): ?string
    {
        $value = trim((string) $value);
        return $value !== '' ? Str::limit($value, 255, '') : null;
    }

    private function normalizeLevel(?string $grado, string $name): string
    {
        $grado = trim((string) $grado);
        $combined   = mb_strtolower($grado . ' ' . $name);
        $lowerName  = mb_strtolower($name);
        $lowerGrado = mb_strtolower($grado);

        // Guard: Educación Especial / NEE — debe ir ANTES de 'especializaci'
        // porque el campo grado de estos programas puede contener "Especialización".
        if (
            str_contains($combined, 'necesidades educativas')
            || str_contains($combined, 'educación especial inespecífica')
            || str_contains($combined, 'educacion especial inespecifica')
            || str_contains($combined, 'transición a la vida adulta')
            || str_contains($combined, 'transicion a la vida adulta')
            || (str_contains($combined, 'básica obligatoria') && str_contains($combined, 'alumnos'))
        ) {
            return 'Educación Especial';
        }

        // Guard: pruebas de acceso y preparación — no deben clasificarse como
        // Cursos de Especialización aunque su grado contenga esa palabra.
        if (
            str_contains($lowerName, 'prueba libre')
            || str_contains($lowerName, 'prueba de acceso')
            || str_contains($lowerName, 'preparación para la prueba')
            || str_contains($lowerName, 'preparacion para la prueba')
            || str_contains($lowerName, 'acceso a ciclos')
            || str_contains($lowerName, 'curso de acceso')
            || str_contains($lowerName, 'mayores de 25')
            || str_contains($lowerName, 'mayores de 18')
        ) {
            if (str_contains($combined, 'bachiller')) return 'Bachillerato';
            return 'Pruebas de Acceso';
        }

        // Cursos de Especialización deben detectarse antes que "grado superior/medio"
        // porque su grado contiene "Especialización d Formación Profesional d Grado Superior"
        if (str_contains($combined, 'especializaci')) return 'Curso de Especialización';
        if (str_contains($combined, 'grado superior')) return 'FP Grado Superior';
        if (str_contains($combined, 'grado medio')) return 'FP Grado Medio';
        // Enseñanzas Deportivas — check sobre el campo grado directamente (no combined)
        // para evitar que "Actividades Físicas y Deportivas — Grado Básico" se clasifique
        // como FP Grado Básico por el check siguiente.
        if (
            str_contains($lowerGrado, 'técnico deportivo')
            || str_contains($lowerGrado, 'tecnico deportivo')
            || str_contains($lowerGrado, 'enseñanzas deportivas')
            || str_contains($lowerGrado, 'ensenanzas deportivas')
        ) {
            return 'Enseñanzas Deportivas';
        }
        if (str_contains($combined, 'grado básico') || str_contains($combined, 'fp básica')) return 'FP Grado Básico';
        if (str_contains($combined, 'bachiller')) return 'Bachillerato';
        // ESO — antes de 'idioma' para evitar colisiones
        if (str_contains($combined, 'secundaria obligatoria')) return 'ESO';
        if (str_contains($combined, 'idioma')) return 'Idiomas';
        // Danza y Música — antes de 'arte'/'art' para evitar captura genérica
        if (str_contains($combined, 'danza')) return 'Danza';
        if (str_contains($combined, 'música') || str_contains($combined, 'musica')) return 'Música';
        if (str_contains($combined, 'arte') || str_contains($combined, 'art')) return 'Enseñanzas Artísticas';
        if (str_contains($combined, 'deport')) return 'Enseñanzas Deportivas';
        if (str_contains($combined, 'adult')) return 'Educación para Adultos';

        return $grado !== '' ? Str::limit($grado, 100, '') : 'Otras enseñanzas';
    }

    private function resolveProgramType(string $level, ?string $family, string $name): string
    {
        $normalized = mb_strtolower($level . ' ' . ($family ?? '') . ' ' . $name);

        if (str_contains($normalized, 'especializ')) return 'especializacion';
        if (str_contains($normalized, 'fp')) return 'fp';
        if (str_contains($normalized, 'bachiller')) return 'bachillerato';
        if (str_contains($normalized, 'idioma')) return 'idiomas';
        if (str_contains($normalized, 'art')) return 'artisticas';
        if (str_contains($normalized, 'deport')) return 'deportivas';
        if (str_contains($normalized, 'adult')) return 'adultos';

        return 'otros';
    }

    private function buildSourceCode(string $level, ?string $family, string $name, ?string $modality): string
    {
        $normalized = implode('|', array_map(
            fn ($part) => Str::slug((string) $part, '-'),
            array_filter([$level, $family, $name, $modality])
        ));

        return 'mecd-' . substr(md5($normalized), 0, 24);
    }

    private function buildSummary(string $level, ?string $family, ?string $modality): string
    {
        return trim(collect([$level, $family, $modality])->filter()->implode(' · '));
    }
}
