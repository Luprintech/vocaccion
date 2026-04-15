<?php

namespace Database\Seeders;

use App\Models\UniversityCutoffGrade;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * UniversityCutoffGradeSeeder
 *
 * Importa las notas de corte desde el CSV completo de QEDU
 * (todos los niveles: GRADO, DOBLE GRADO, MÁSTER, DOCTORADO, DOBLE MÁSTER…).
 *
 * Fuente:  database/data/catalog/notas_de_corte/qedu.csv
 * Encoding: UTF-8 con BOM
 * Columnas: Nivel de estudios | Comunidad Autónoma | Tipo de universidad |
 *           Universidad | Modalidad | Tipo de centro | Provincia | Centro |
 *           Titulación | Idioma extranjero | Nota de corte
 *
 * Los códigos QEDU no están en el CSV → se generan como hashes MD5 deterministas
 * a partir de los campos de texto, lo que garantiza idempotencia en upsert.
 */
class UniversityCutoffGradeSeeder extends Seeder
{
    private const CSV_PATH = __DIR__ . '/../data/catalog/notas_de_corte/qedu.csv';
    private const ANIO     = '2025-2026';
    private const SOURCE   = 'QEDU_CSV';
    private const CHUNK    = 500;

    public function run(): void
    {
        $csvPath = realpath(self::CSV_PATH);

        if (!$csvPath || !file_exists($csvPath)) {
            $this->command->error('CSV no encontrado: ' . self::CSV_PATH);
            return;
        }

        $handle = fopen($csvPath, 'rb');
        if (!$handle) {
            $this->command->error('No se pudo abrir el CSV.');
            return;
        }

        // Saltar BOM UTF-8 (EF BB BF) si está presente
        $bom = fread($handle, 3);
        if ($bom !== "\xEF\xBB\xBF") {
            rewind($handle); // No tiene BOM, volver al inicio
        }

        // Leer cabecera
        $header = fgetcsv($handle, 0, ',', '"');
        if (!$header) {
            $this->command->error('CSV vacío o cabecera no encontrada.');
            fclose($handle);
            return;
        }

        // Normalizar nombres de columna (trim + lowercase como clave interna)
        $headerMap = [];
        foreach ($header as $i => $col) {
            $headerMap[mb_strtolower(trim($col))] = $i;
        }

        $this->command->info(sprintf(
            'Importando notas de corte desde CSV QEDU (%s)…',
            basename($csvPath)
        ));

        $now     = now();
        $rows    = [];
        $total   = 0;
        $skipped = 0;

        $col = fn(string $name): int => $headerMap[$name] ?? -1;

        while (($line = fgetcsv($handle, 0, ',', '"')) !== false) {
            // Ignorar líneas incompletas
            if (count($line) < count($header)) {
                $skipped++;
                continue;
            }

            $get = fn(string $name): string => isset($headerMap[$name])
                ? trim($line[$headerMap[$name]] ?? '')
                : '';

            $titulacion  = $get('titulación');
            $universidad = $get('universidad');
            $centro      = $get('centro');

            // Datos obligatorios
            if (empty($titulacion) || empty($universidad)) {
                $skipped++;
                continue;
            }

            // Generar códigos hash deterministas:
            // cod_titulacion/cod_centro → VARCHAR(20) en migración → 12 hex chars
            // cod_universidad           → VARCHAR(10) en migración → 10 hex chars
            $codTitulacion  = substr(md5(mb_strtolower($titulacion)), 0, 12);
            $codCentro      = substr(md5(mb_strtolower($centro . '|' . $universidad)), 0, 12);
            $codUniversidad = substr(md5(mb_strtolower($universidad)), 0, 10);

            // Nivel: normalizar a mayúsculas
            $nivel = mb_strtoupper($get('nivel de estudios')) ?: 'GRADO';

            // Modalidad: Presencial → 1, Online → 2, Semipresencial → 3
            $modalidadStr = mb_strtolower($get('modalidad'));
            $modalidad    = match (true) {
                str_contains($modalidadStr, 'online')       => 2,
                str_contains($modalidadStr, 'semi')         => 3,
                default                                     => 1,
            };

            // Idioma extranjero: Sí/Si/Yes → true
            $idiomaStr      = mb_strtolower($get('idioma extranjero'));
            $idiomaExtra    = in_array($idiomaStr, ['sí', 'si', 'yes', '1', 'true']);

            // Nota de corte → float o null
            $notaStr  = $get('nota de corte');
            $notaCorte = is_numeric($notaStr) ? (float) $notaStr : null;

            $rows[] = [
                'cod_titulacion'     => $codTitulacion,
                'cod_centro'         => $codCentro,
                'cod_universidad'    => $codUniversidad,
                'titulacion'         => $titulacion,
                'nivel'              => $nivel,
                'tipo_universidad'   => $get('tipo de universidad') ?: null,
                'tipo_centro'        => $get('tipo de centro') ?: null,
                'nombre_centro'      => $centro ?: null,
                'nombre_universidad' => $universidad,
                'ccaa'               => $get('comunidad autónoma') ?: null,
                'provincia'          => $get('provincia') ?: null,
                'cod_provincia'      => null,
                'modalidad'          => $modalidad,
                'idioma_extranjero'  => $idiomaExtra,
                'nota_corte'         => $notaCorte,
                'anio'               => self::ANIO,
                'source'             => self::SOURCE,
                'created_at'         => $now,
                'updated_at'         => $now,
            ];

            $total++;

            if (count($rows) >= self::CHUNK) {
                $this->upsertChunk($rows);
                $rows = [];
                $this->command->info("  … {$total} filas procesadas");
            }
        }

        fclose($handle);

        if (!empty($rows)) {
            $this->upsertChunk($rows);
        }

        $conNota = UniversityCutoffGrade::where('source', self::SOURCE)
            ->whereNotNull('nota_corte')
            ->count();

        $this->command->info(sprintf(
            '✅  %d registros importados (%d con nota de corte, %d omitidos).',
            $total,
            $conNota,
            $skipped
        ));
    }

    private function upsertChunk(array $rows): void
    {
        UniversityCutoffGrade::upsert(
            $rows,
            ['cod_titulacion', 'cod_centro', 'cod_universidad', 'anio'],
            [
                'nota_corte', 'titulacion', 'nivel',
                'nombre_centro', 'nombre_universidad',
                'tipo_universidad', 'tipo_centro',
                'ccaa', 'provincia', 'modalidad', 'idioma_extranjero',
                'updated_at',
            ]
        );
    }
}
