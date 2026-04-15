<?php

namespace Database\Seeders;

use App\Models\PublicCompetition;
use Illuminate\Database\Seeder;
use Illuminate\Support\Collection;

require_once __DIR__ . '/helpers.php';

class PublicCompetitionSeeder extends Seeder
{
    public function run(): void
    {
        $data = require_data('catalog/public_competitions/raw/boe_public_competitions.json');

        $rows = [];
        foreach ($data as $item) {
            $rows[] = [
                'boe_id' => $item['id_boe'],
                'title' => $item['titulo'],
                'organism' => $item['organismo'] ?? null,
                'url_pdf' => $this->cleanBoeUrl($item['url_pdf'] ?? null),
                'url_xml' => $this->cleanBoeUrl($item['url_xml'] ?? null),
                'url_html' => $this->cleanBoeUrl($item['url_html'] ?? null),
                'publication_date' => $this->parseDate($item['fecha_iso'] ?? $item['fecha_publicacion'] ?? null),
                'positions' => $item['plazas'] ?? null,
                'access_type' => $item['tipo_acceso'] ?? null,
                'scope' => $item['ambito'] ?? null,
                'group' => $item['grupo'] ?? null,
                'description' => null,
                'active' => true,
                'source_system' => 'BOE',
                'last_seen_at' => now(),
                'raw_payload' => json_encode($item, JSON_UNESCAPED_UNICODE),
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        collect($rows)
            ->chunk(100)
            ->each(function (Collection $chunk) {
                PublicCompetition::upsert(
                    $chunk->all(),
                    ['boe_id'],
                    [
                        'title',
                        'organism',
                        'url_pdf',
                        'url_xml',
                        'url_html',
                        'publication_date',
                        'positions',
                        'access_type',
                        'scope',
                        'group',
                        'description',
                        'active',
                        'source_system',
                        'last_seen_at',
                        'raw_payload',
                        'updated_at',
                    ]
                );
            });

        $this->command?->info('✅ PublicCompetitionSeeder: ' . count($rows) . ' oposiciones procesadas');
    }

    private function parseDate(?string $dateString): ?string
    {
        if (!$dateString) {
            return null;
        }

        try {
            // Formato ISO: 2026-03-31
            if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $dateString)) {
                return $dateString;
            }

            // Formato YYYYMMDD: 20260331
            if (preg_match('/^(\d{4})(\d{2})(\d{2})$/', $dateString, $matches)) {
                return "{$matches[1]}-{$matches[2]}-{$matches[3]}";
            }
        } catch (\Exception $e) {
            // Silently fail
        }

        return null;
    }

    /**
     * Elimina el dominio duplicado generado por el scraper:
     * "https://www.boe.eshttps://www.boe.es/..." → "https://www.boe.es/..."
     */
    private function cleanBoeUrl(?string $url): ?string
    {
        if (!$url) {
            return null;
        }

        return preg_replace('#^https?://[^/]+(?=https?://)#', '', $url);
    }
}
