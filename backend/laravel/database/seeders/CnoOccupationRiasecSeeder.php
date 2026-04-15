<?php

namespace Database\Seeders;

use App\Models\CareerCatalog;
use App\Models\CnoOccupation;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class CnoOccupationRiasecSeeder extends Seeder
{
    /**
     * Estima vectores RIASEC para cno_occupations (muestra)
     * usando carreras del catálogo como fuente de referencia.
     */
    public function run(): void
    {
        $careers = CareerCatalog::query()
            ->where('activo', true)
            ->whereNotNull('codigo_cno')
            ->get();

        if ($careers->isEmpty()) {
            $this->command?->warn('No hay carreras activas con codigo_cno para inferir RIASEC.');
            return;
        }

        $occupations = CnoOccupation::query()->where('activo', true)->get();
        if ($occupations->isEmpty()) {
            $this->command?->warn('No hay ocupaciones CNO activas para actualizar.');
            return;
        }

        DB::transaction(function () use ($occupations, $careers) {
            foreach ($occupations as $occupation) {
                [$vector, $bestCareerId, $method] = $this->inferVector($occupation, $careers);

                $occupation->update([
                    'riasec_r' => $vector['r'],
                    'riasec_i' => $vector['i'],
                    'riasec_a' => $vector['a'],
                    'riasec_s' => $vector['s'],
                    'riasec_e' => $vector['e'],
                    'riasec_c' => $vector['c'],
                    'career_catalog_id' => $bestCareerId,
                    'notas' => "RIASEC estimado por {$method}",
                ]);
            }
        });

        $this->command?->info('✅ CnoOccupationRiasecSeeder: vectores RIASEC estimados para ' . $occupations->count() . ' ocupaciones');
    }

    private function inferVector(CnoOccupation $occupation, $careers): array
    {
        $code = (string) $occupation->codigo_cno;
        $prefix2 = substr($code, 0, 2);
        $prefix1 = substr($code, 0, 1);

        $exact = $careers->filter(fn ($c) => (string) $c->codigo_cno === $code)->values();
        if ($exact->isNotEmpty()) {
            $v = $this->weightedAverage($occupation->denominacion, $exact);
            return [$v, $exact->first()->id, 'match exacto codigo_cno'];
        }

        $same2 = $careers->filter(function ($c) use ($prefix2) {
            $cc = (string) $c->codigo_cno;
            return strlen($cc) >= 2 && substr($cc, 0, 2) === $prefix2;
        })->values();

        if ($same2->count() >= 2) {
            $v = $this->weightedAverage($occupation->denominacion, $same2);
            $best = $this->bestCareer($occupation->denominacion, $same2);
            return [$v, $best?->id, 'cluster prefijo 2 dígitos'];
        }

        $same1 = $careers->filter(function ($c) use ($prefix1) {
            $cc = (string) $c->codigo_cno;
            return strlen($cc) >= 1 && substr($cc, 0, 1) === $prefix1;
        })->values();

        if ($same1->count() >= 4) {
            $v = $this->weightedAverage($occupation->denominacion, $same1);
            $best = $this->bestCareer($occupation->denominacion, $same1);
            return [$v, $best?->id, 'cluster gran grupo 1 dígito'];
        }

        // Fallback: todo el catálogo
        $v = $this->weightedAverage($occupation->denominacion, $careers);
        $best = $this->bestCareer($occupation->denominacion, $careers);
        return [$v, $best?->id, 'fallback catálogo completo'];
    }

    private function weightedAverage(string $occupationName, $candidateCareers): array
    {
        $scored = $candidateCareers
            ->map(function ($career) use ($occupationName) {
                $sim = $this->similarity($occupationName, $career->titulo . ' ' . ($career->sector ?? '') . ' ' . ($career->familia_profesional ?? ''));

                // Piso para no anular carreras con baja similitud textual.
                $weight = 0.20 + ($sim * 0.80);

                return [
                    'career' => $career,
                    'weight' => $weight,
                    'sim' => $sim,
                ];
            })
            ->sortByDesc('sim')
            ->take(6)
            ->values();

        $sumW = max(0.0001, $scored->sum('weight'));

        $r = $scored->sum(fn ($s) => $s['career']->riasec_r * $s['weight']) / $sumW;
        $i = $scored->sum(fn ($s) => $s['career']->riasec_i * $s['weight']) / $sumW;
        $a = $scored->sum(fn ($s) => $s['career']->riasec_a * $s['weight']) / $sumW;
        $s = $scored->sum(fn ($s) => $s['career']->riasec_s * $s['weight']) / $sumW;
        $e = $scored->sum(fn ($s) => $s['career']->riasec_e * $s['weight']) / $sumW;
        $c = $scored->sum(fn ($s) => $s['career']->riasec_c * $s['weight']) / $sumW;

        // Re-normalización por seguridad
        $total = max(0.0001, $r + $i + $a + $s + $e + $c);

        return [
            'r' => round($r / $total, 2),
            'i' => round($i / $total, 2),
            'a' => round($a / $total, 2),
            's' => round($s / $total, 2),
            'e' => round($e / $total, 2),
            'c' => round($c / $total, 2),
        ];
    }

    private function bestCareer(string $occupationName, $candidateCareers): ?CareerCatalog
    {
        return $candidateCareers
            ->map(function ($career) use ($occupationName) {
                return [
                    'career' => $career,
                    'sim' => $this->similarity($occupationName, $career->titulo . ' ' . ($career->sector ?? '') . ' ' . ($career->familia_profesional ?? '')),
                ];
            })
            ->sortByDesc('sim')
            ->first()['career'] ?? null;
    }

    private function similarity(string $a, string $b): float
    {
        $ta = $this->tokenize($a);
        $tb = $this->tokenize($b);

        if (empty($ta) || empty($tb)) {
            return 0.0;
        }

        $inter = array_intersect($ta, $tb);
        $union = array_unique(array_merge($ta, $tb));

        return count($inter) / max(1, count($union));
    }

    private function tokenize(string $text): array
    {
        $text = Str::lower(Str::ascii($text));
        $text = preg_replace('/[^a-z0-9\s]/', ' ', $text) ?? '';
        $parts = preg_split('/\s+/', trim($text)) ?: [];

        $stopwords = [
            'de', 'del', 'la', 'el', 'los', 'las', 'y', 'en', 'con', 'para', 'por', 'a', 'o', 'u', 'un', 'una',
            'tecnico', 'tecnica', 'profesional', 'trabajadores', 'trabajador', 'empleados', 'empleado',
            'director', 'directores', 'auxiliares', 'actividades', 'servicios', 'sistemas', 'otras', 'otros',
            'clasificados', 'epigrafes', 'asalariados', 'asalariado',
        ];

        return array_values(array_filter($parts, fn ($w) => strlen($w) > 2 && !in_array($w, $stopwords, true)));
    }
}
