<?php

namespace App\Console\Commands;

use App\Models\QeduDegree;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class ImportQeduDetalle extends Command
{
    protected $signature = 'catalog:import-qedu-detalle
                            {--nivel=ALL : Nivel a importar (GRADO, GRADOD, MASTER, MASTERD, DOCTOR, ALL)}
                            {--dry-run   : Simula la importación sin escribir en BD}
                            {--force     : Actualiza registros existentes aunque ya existan}';

    protected $description = 'Importa datos de titulaciones universitarias y su inserción laboral desde los JSONs QEDU.';

    /**
     * Niveles disponibles y sus ficheros JSON.
     */
    private const NIVELES = [
        'GRADO'   => 'detalle_grado_latest.json',
        'GRADOD'  => 'detalle_gradod_latest.json',
        'MASTER'  => 'detalle_master_latest.json',
        'MASTERD' => 'detalle_masterd_latest.json',
        'DOCTOR'  => 'detalle_doctor_latest.json',
    ];

    private const DATA_DIR = 'database/data/catalog/qedu';
    private const BATCH_SIZE = 500;

    public function handle(): int
    {
        $nivelFiltro = strtoupper($this->option('nivel'));
        $dryRun      = $this->option('dry-run');
        $force       = $this->option('force');

        $niveles = $nivelFiltro === 'ALL'
            ? array_keys(self::NIVELES)
            : [$nivelFiltro];

        // Validar niveles solicitados
        foreach ($niveles as $n) {
            if (!array_key_exists($n, self::NIVELES)) {
                $this->error("Nivel desconocido: {$n}. Opciones: " . implode(', ', array_keys(self::NIVELES)));
                return self::FAILURE;
            }
        }

        $totalImportados = 0;
        $totalActualizados = 0;
        $totalOmitidos = 0;

        foreach ($niveles as $nivel) {
            $archivo = base_path(self::DATA_DIR . '/' . self::NIVELES[$nivel]);

            if (!file_exists($archivo)) {
                $this->warn("  [{$nivel}] Fichero no encontrado: {$archivo} — omitido.");
                continue;
            }

            $this->info("  [{$nivel}] Leyendo " . basename($archivo) . " ...");
            $contenido = file_get_contents($archivo);
            $json = json_decode($contenido, true);

            if (json_last_error() !== JSON_ERROR_NONE) {
                $this->error("  [{$nivel}] JSON inválido: " . json_last_error_msg());
                continue;
            }

            $datos = $json['datos'] ?? [];
            $fechaExtraccion = $json['fecha_extraccion'] ?? now()->toDateString();

            if (empty($datos)) {
                $this->warn("  [{$nivel}] Sin datos en el fichero.");
                continue;
            }

            $this->info("  [{$nivel}] " . count($datos) . " registros a procesar.");

            $importados  = 0;
            $actualizados = 0;
            $omitidos    = 0;
            $batch       = [];

            $bar = $this->output->createProgressBar(count($datos));
            $bar->setFormat(' %current%/%max% [%bar%] %percent:3s%% %elapsed:6s%');
            $bar->start();

            foreach ($datos as $row) {
                $codTitulacion = (string) ($row['cod_titulacion'] ?? '');
                $codCentro     = (string) ($row['cod_centro'] ?? '');

                if (empty($codTitulacion) || empty($codCentro)) {
                    $omitidos++;
                    $bar->advance();
                    continue;
                }

                $record = [
                    'cod_titulacion'            => $codTitulacion,
                    'cod_centro'                => $codCentro,
                    'cod_universidad'           => (string) ($row['cod_universidad'] ?? ''),
                    'titulacion'                => mb_substr((string) ($row['titulacion'] ?? ''), 0, 500),
                    'nivel'                     => $nivel,
                    'tipo_universidad'          => $row['tipo_universidad'] ?? null,
                    'tipo_centro'               => $row['tipo_centro'] ?? null,
                    'nombre_centro'             => mb_substr((string) ($row['nombre_centro'] ?? ''), 0, 500),
                    'nombre_universidad'        => mb_substr((string) ($row['nombre_universidad'] ?? ''), 0, 300),
                    'ccaa'                      => $row['ccaa'] ?? null,
                    'provincia'                 => $row['provincia'] ?? null,
                    'cod_provincia'             => (string) ($row['cod_provincia'] ?? ''),
                    'modalidad'                 => (string) ($row['modalidad'] ?? ''),
                    'idioma_extranjero'         => (bool) ($row['idioma_extranjero'] ?? false),
                    'ambito_isced'              => (string) ($row['ambito_isced'] ?? ''),
                    'plazas'                    => isset($row['plazas']) ? (int) $row['plazas'] : null,
                    'creditos'                  => $this->parseDecimal($row['creditos'] ?? null),
                    'precio_credito'            => $row['precio_credito'] ?? null,
                    'nota_corte'                => $row['nota_corte'] ?? null,
                    'nota_corte_anterior'       => $row['nota_corte_anterior'] ?? null,
                    'nota_admision_media'       => $row['nota_admision_media'] ?? null,
                    'anio'                      => $row['anio'] ?? null,
                    'insercion_tasa_afiliacion' => $row['insercion_tasa_afiliacion'] ?? null,
                    'insercion_pct_autonomos'   => $row['insercion_pct_autonomos'] ?? null,
                    'insercion_pct_indefinidos' => $row['insercion_pct_indefinidos'] ?? null,
                    'insercion_pct_cotizacion'  => $row['insercion_pct_cotizacion'] ?? null,
                    'insercion_salario_medio'   => $row['insercion_salario_medio'] ?? null,
                    'enlace'                    => mb_substr((string) ($row['enlace'] ?? ''), 0, 500),
                    'fuente'                    => 'QEDU',
                    'fecha_extraccion'          => $fechaExtraccion,
                    'created_at'                => now(),
                    'updated_at'                => now(),
                ];

                $batch[] = $record;

                if (count($batch) >= self::BATCH_SIZE) {
                    [$imp, $act] = $this->flushBatch($batch, $force, $dryRun);
                    $importados   += $imp;
                    $actualizados += $act;
                    $batch = [];
                }

                $bar->advance();
            }

            // Último batch
            if (!empty($batch)) {
                [$imp, $act] = $this->flushBatch($batch, $force, $dryRun);
                $importados   += $imp;
                $actualizados += $act;
            }

            $bar->finish();
            $this->newLine();

            $this->info(sprintf(
                "  [%s] ✓ Nuevos: %d | Actualizados: %d | Omitidos: %d",
                $nivel, $importados, $actualizados, $omitidos
            ));

            $totalImportados  += $importados;
            $totalActualizados += $actualizados;
            $totalOmitidos    += $omitidos;
        }

        $this->newLine();
        if ($dryRun) {
            $this->warn('  [DRY RUN] No se escribió nada en la BD.');
        }
        $this->info(sprintf(
            '  TOTAL — Nuevos: %d | Actualizados: %d | Omitidos: %d',
            $totalImportados, $totalActualizados, $totalOmitidos
        ));

        return self::SUCCESS;
    }

    /**
     * Envía un batch a la BD usando upsert.
     * Devuelve [nuevos, actualizados] (aproximados).
     */
    private function flushBatch(array $batch, bool $force, bool $dryRun): array
    {
        if ($dryRun) {
            return [0, 0];
        }

        $updateColumns = $force ? [
            'cod_universidad',
            'titulacion',
            'nivel',
            'tipo_universidad',
            'tipo_centro',
            'nombre_centro',
            'nombre_universidad',
            'ccaa',
            'provincia',
            'cod_provincia',
            'modalidad',
            'idioma_extranjero',
            'ambito_isced',
            'plazas',
            'creditos',
            'precio_credito',
            'nota_corte',
            'nota_corte_anterior',
            'nota_admision_media',
            'anio',
            'insercion_tasa_afiliacion',
            'insercion_pct_autonomos',
            'insercion_pct_indefinidos',
            'insercion_pct_cotizacion',
            'insercion_salario_medio',
            'enlace',
            'fuente',
            'fecha_extraccion',
            'updated_at',
        ] : ['updated_at']; // Sin --force: upsert no destructivo

        // Contamos antes para estimar nuevos vs actualizados
        $keys = array_map(fn ($r) => [$r['cod_titulacion'], $r['cod_centro']], $batch);
        $existingCount = 0;
        foreach (array_chunk($keys, 100) as $chunk) {
            $existingCount += DB::table('qedu_degrees')
                ->where(function ($q) use ($chunk) {
                    foreach ($chunk as [$cod, $centro]) {
                        $q->orWhere(function ($inner) use ($cod, $centro) {
                            $inner->where('cod_titulacion', $cod)->where('cod_centro', $centro);
                        });
                    }
                })
                ->count();
        }

        DB::table('qedu_degrees')->upsert(
            $batch,
            ['cod_titulacion', 'cod_centro'],
            $updateColumns
        );

        $nuevos       = count($batch) - $existingCount;
        $actualizados = $existingCount;

        return [$nuevos, $actualizados];
    }

    private function parseDecimal(mixed $value): ?float
    {
        if ($value === null) {
            return null;
        }

        $value = trim((string) $value);
        if ($value === '' || strtoupper($value) === 'N/D' || $value === '?') {
            return null;
        }

        $normalized = str_replace(',', '.', $value);

        return is_numeric($normalized) ? (float) $normalized : null;
    }
}
