<?php

namespace Database\Seeders;

use App\Models\CareerCatalog;
use App\Models\ProfessionalQualification;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class CareerQualificationMappingSeeder extends Seeder
{
    /**
     * Genera mapeo automático career_catalog <-> professional_qualifications
     * usando familia profesional + similitud léxica + nivel formativo.
     */
    public function run(): void
    {
        $careers = CareerCatalog::query()->where('activo', true)->get();
        $qualifications = ProfessionalQualification::query()->where('activo', true)->get();

        if ($careers->isEmpty() || $qualifications->isEmpty()) {
            $this->command?->warn('No hay datos suficientes para mapear (career_catalog o professional_qualifications vacío).');
            return;
        }

        $byFamily = $qualifications->groupBy('codigo_familia');

        DB::transaction(function () use ($careers, $qualifications, $byFamily) {
            DB::table('career_qualifications')->delete();

            $rows = [];

            foreach ($careers as $career) {
                $familyCodes = $this->resolveFamilyCodes((string) $career->familia_profesional, (string) $career->sector, (string) $career->titulo);

                $candidatePool = collect();
                foreach ($familyCodes as $code) {
                    $candidatePool = $candidatePool->merge($byFamily->get($code, collect()));
                }

                if ($candidatePool->isEmpty()) {
                    $candidatePool = $qualifications;
                }

                $levelWeights = $this->levelWeights((string) $career->nivel_formacion);
                $contextTokens = $this->tokenize(implode(' ', [
                    (string) $career->titulo,
                    (string) $career->sector,
                    (string) $career->familia_profesional,
                    (string) $career->descripcion_corta,
                    (string) $career->ruta_formativa,
                ]));

                $scored = $candidatePool
                    ->map(function (ProfessionalQualification $q) use ($contextTokens, $levelWeights, $familyCodes) {
                        $titleTokens = $this->tokenize($q->denominacion);
                        $overlap = $this->overlapScore($contextTokens, $titleTokens);
                        $levelScore = $levelWeights[$q->nivel] ?? 0.4;
                        $familyBonus = in_array($q->codigo_familia, $familyCodes, true) ? 0.5 : 0.0;

                        $score = ($overlap * 2.0) + $levelScore + $familyBonus;

                        return [
                            'id' => $q->id,
                            'code' => $q->codigo_cncp,
                            'score' => $score,
                            'nivel' => $q->nivel,
                            'family' => $q->codigo_familia,
                        ];
                    })
                    ->sortByDesc('score')
                    ->values();

                $selected = $scored->take(3)->values();

                if ($selected->isEmpty()) {
                    continue;
                }

                foreach ($selected as $idx => $item) {
                    [$tipo, $relevancia] = $this->pivotMetadata($idx, (float) $item['score']);

                    $rows[] = [
                        'career_catalog_id' => $career->id,
                        'professional_qualification_id' => $item['id'],
                        'tipo' => $tipo,
                        'relevancia' => $relevancia,
                        'observaciones' => sprintf(
                            'AUTO: mapeo por familia (%s), nivel formativo y similitud léxica',
                            implode(',', $familyCodes)
                        ),
                        'created_at' => now(),
                        'updated_at' => now(),
                    ];
                }
            }

            if (!empty($rows)) {
                DB::table('career_qualifications')->insert($rows);
            }
        });

        $count = DB::table('career_qualifications')->count();
        $this->command?->info("✅ CareerQualificationMappingSeeder: {$count} relaciones generadas");
    }

    private function pivotMetadata(int $index, float $score): array
    {
        if ($index === 0) {
            return ['obligatoria', max(70, min(95, (int) round(70 + ($score * 10))))];
        }

        if ($index === 1) {
            return ['recomendada', max(55, min(85, (int) round(55 + ($score * 10))))];
        }

        return ['complementaria', max(40, min(75, (int) round(40 + ($score * 10))))];
    }

    private function levelWeights(string $nivelFormacion): array
    {
        $n = Str::lower(Str::ascii($nivelFormacion));

        if (str_contains($n, 'basica') || str_contains($n, 'medio')) {
            return [1 => 1.0, 2 => 0.8, 3 => 0.2];
        }

        if (str_contains($n, 'fp superior')) {
            return [1 => 0.4, 2 => 1.0, 3 => 0.9];
        }

        return [1 => 0.2, 2 => 0.6, 3 => 1.0];
    }

    private function overlapScore(array $a, array $b): float
    {
        if (empty($a) || empty($b)) {
            return 0.0;
        }

        $setA = array_values(array_unique($a));
        $setB = array_values(array_unique($b));
        $intersection = array_intersect($setA, $setB);

        return count($intersection) / max(1, count($setB));
    }

    private function tokenize(string $text): array
    {
        $text = Str::lower(Str::ascii($text));
        $text = preg_replace('/[^a-z0-9\s]/', ' ', $text) ?? '';
        $parts = preg_split('/\s+/', trim($text)) ?: [];

        $stopwords = [
            'de', 'del', 'la', 'el', 'los', 'las', 'y', 'en', 'con', 'para', 'por', 'a', 'o', 'u', 'un', 'una',
            'tecnico', 'tecnica', 'profesional', 'especialista', 'gestion', 'servicios', 'actividades', 'sistemas',
        ];

        return array_values(array_filter($parts, fn ($w) => strlen($w) > 2 && !in_array($w, $stopwords, true)));
    }

    private function resolveFamilyCodes(string $familia, string $sector, string $titulo): array
    {
        $source = Str::upper(Str::ascii(implode(' / ', [$familia, $sector, $titulo])));

        $map = [
            'ACTIVIDADES FISICAS' => ['AFD'],
            'ADMINISTRACION Y GESTION' => ['ADG'],
            'AGRARIA' => ['AGA'],
            'ARTES GRAFICAS' => ['ARG'],
            'ARTES Y ARTESANIAS' => ['ART'],
            'COMERCIO Y MARKETING' => ['COM'],
            'EDIFICACION Y OBRA CIVIL' => ['EOC'],
            'ELECTRICIDAD Y ELECTRONICA' => ['ELE'],
            'ENERGIA Y AGUA' => ['ENA'],
            'FABRICACION MECANICA' => ['FME'],
            'HOSTELERIA Y TURISMO' => ['HOT'],
            'IMAGEN PERSONAL' => ['IMP'],
            'IMAGEN Y SONIDO' => ['IMS'],
            'INDUSTRIAS ALIMENTARIAS' => ['INA'],
            'INDUSTRIAS EXTRACTIVAS' => ['IEX'],
            'INFORMATICA Y COMUNICACIONES' => ['IFC'],
            'INSTALACION Y MANTENIMIENTO' => ['IMA'],
            'MADERA, MUEBLE Y CORCHO' => ['MAM'],
            'MARITIMO-PESQUERA' => ['MAP'],
            'QUIMICA' => ['QUI'],
            'SANIDAD' => ['SAN'],
            'SEGURIDAD Y MEDIO AMBIENTE' => ['SEA'],
            'SERVICIOS SOCIOCULTURALES Y A LA COMUNIDAD' => ['SSC'],
            'TEXTIL, CONFECCION Y PIEL' => ['TCP'],
            'TRANSPORTE Y MANTENIMIENTO DE VEHICULOS' => ['TMV'],
            'VIDRIO Y CERAMICA' => ['VIC'],
            // Familias del catálogo vocacional que no son CNCP exactas
            'CIENCIAS NATURALES' => ['QUI', 'SEA', 'AGA'],
            'DOCENCIA' => ['SSC', 'ADG'],
            'COMUNICACION' => ['IMS', 'ARG', 'COM'],
            'JURIDICA' => ['ADG', 'SEA'],
            'ARTE MUSICAL' => ['IMS', 'ART'],
            'SANIDAD ANIMAL' => ['AGA', 'SAN'],
        ];

        $codes = [];
        foreach ($map as $needle => $targets) {
            if (str_contains($source, $needle)) {
                $codes = array_merge($codes, $targets);
            }
        }

        $codes = array_values(array_unique($codes));

        return !empty($codes) ? $codes : ['ADG', 'COM', 'SSC'];
    }
}
