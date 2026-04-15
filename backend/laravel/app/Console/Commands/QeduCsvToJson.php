<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

/**
 * Convierte el CSV de notas de corte QEDU a JSON normalizado.
 *
 * El CSV no incluye códigos QEDU oficiales, por lo que se generan
 * hashes MD5 deterministas idénticos a los que usa UniversityCutoffGradeSeeder,
 * garantizando consistencia entre el JSON y la tabla de BD.
 *
 * Uso:
 *   php artisan qedu:csv-to-json
 *   php artisan qedu:csv-to-json --output=catalog/notas_de_corte/normalized/custom.json
 */
class QeduCsvToJson extends Command
{
    protected $signature = 'qedu:csv-to-json
                            {--output= : Ruta de salida del JSON (relativa a database/data/)}';

    protected $description = 'Convierte database/data/catalog/notas_de_corte/qedu.csv → JSON normalizado';

    private const CSV_PATH    = 'catalog/notas_de_corte/qedu.csv';
    private const OUTPUT_PATH = 'catalog/notas_de_corte/normalized/qedu_latest.json';

    public function handle(): int
    {
        $csvPath = database_path('data/' . self::CSV_PATH);

        if (!file_exists($csvPath)) {
            $this->error("CSV no encontrado: {$csvPath}");
            return self::FAILURE;
        }

        $outputRelative = $this->option('output') ?? self::OUTPUT_PATH;
        $outputPath     = database_path('data/' . $outputRelative);

        // Crear directorio de salida si no existe
        $outputDir = dirname($outputPath);
        if (!is_dir($outputDir)) {
            mkdir($outputDir, 0755, true);
        }

        $handle = fopen($csvPath, 'rb');
        if (!$handle) {
            $this->error("No se pudo abrir el CSV.");
            return self::FAILURE;
        }

        // Saltar BOM UTF-8 (EF BB BF)
        $bom = fread($handle, 3);
        if ($bom !== "\xEF\xBB\xBF") {
            rewind($handle);
        }

        // Leer cabecera y normalizar nombres de columna
        $header    = fgetcsv($handle, 0, ',', '"');
        $headerMap = [];
        foreach ($header as $i => $col) {
            $headerMap[mb_strtolower(trim($col))] = $i;
        }

        $this->info('Leyendo CSV…');

        $datos   = [];
        $skipped = 0;

        while (($line = fgetcsv($handle, 0, ',', '"')) !== false) {
            if (count($line) < count($header)) {
                $skipped++;
                continue;
            }

            $get = fn(string $name): string =>
                isset($headerMap[$name]) ? trim($line[$headerMap[$name]] ?? '') : '';

            $titulacion  = $get('titulación');
            $universidad = $get('universidad');
            $centro      = $get('centro');

            if (empty($titulacion) || empty($universidad)) {
                $skipped++;
                continue;
            }

            // Hashes MD5 deterministas — idénticos a UniversityCutoffGradeSeeder
            $codTitulacion  = substr(md5(mb_strtolower($titulacion)), 0, 12);
            $codCentro      = substr(md5(mb_strtolower($centro . '|' . $universidad)), 0, 12);
            $codUniversidad = substr(md5(mb_strtolower($universidad)), 0, 10);

            // Nivel → mayúsculas
            $nivel = mb_strtoupper($get('nivel de estudios')) ?: 'GRADO';

            // Modalidad: Presencial → 1, Online → 2, Semipresencial → 3
            $modalidadStr = mb_strtolower($get('modalidad'));
            $modalidad    = match (true) {
                str_contains($modalidadStr, 'online') => 2,
                str_contains($modalidadStr, 'semi')   => 3,
                default                               => 1,
            };

            // Idioma extranjero: Sí/Si/Yes → true
            $idiomaStr   = mb_strtolower($get('idioma extranjero'));
            $idiomaExtra = in_array($idiomaStr, ['sí', 'si', 'yes', '1', 'true']);

            // Nota de corte → float o null
            $notaStr   = $get('nota de corte');
            $notaCorte = is_numeric($notaStr) ? (float) $notaStr : null;

            $datos[] = [
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
                'modalidad'          => $modalidad,
                'idioma_extranjero'  => $idiomaExtra,
                'nota_corte'         => $notaCorte,
                'anio'               => '2025-2026',
            ];
        }

        fclose($handle);

        $payload = [
            'fuente'           => 'QEDU — Ministerio de Ciencia, Innovación y Universidades',
            'url'              => 'https://www.ciencia.gob.es/qedu.html',
            'fecha_extraccion' => now()->toDateString(),
            'niveles'          => 'GRADO, DOBLE GRADO, MASTER, DOBLE MÁSTER, DOCTOR',
            'total'            => count($datos),
            'con_nota_corte'   => count(array_filter($datos, fn($r) => $r['nota_corte'] !== null)),
            'nota'             => 'cod_titulacion/cod_centro/cod_universidad son hashes MD5 deterministas (no códigos QEDU oficiales). Idénticos a los usados en UniversityCutoffGradeSeeder.',
            'datos'            => $datos,
        ];

        $json = json_encode($payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

        file_put_contents($outputPath, $json);

        $sizeMb = round(filesize($outputPath) / 1024 / 1024, 2);

        $this->info("✅  {$payload['total']} registros exportados ({$payload['con_nota_corte']} con nota de corte, {$skipped} omitidos).");
        $this->info("📄  Guardado en: {$outputPath} ({$sizeMb} MB)");

        return self::SUCCESS;
    }
}
