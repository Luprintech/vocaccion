<?php

namespace Database\Seeders;

use App\Models\OfficialUniversity;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

require_once __DIR__ . '/helpers.php';

class OfficialUniversitySeeder extends Seeder
{
    /**
     * Seed listado oficial base de universidades/entidades desde RUCT.
     */
    public function run(): void
    {
        $payload = require_data('catalog/universities/raw/ruct_universities.json');
        $details = collect(require_data('catalog/universities/raw/ruct_university_details.json'))->keyBy('ruct_code');
        $rows = [];

        foreach (($payload['universities'] ?? []) as $item) {
            $name = (string) ($item['name'] ?? '');
            $detail = $details->get((string) ($item['code'] ?? ''));

            $rows[] = [
                'ruct_code' => (string) $item['code'],
                'name' => (string) ($detail['name'] ?? $name),
                'acronym' => $detail['acronym'] ?? null,
                'responsible_administration_code' => null,
                'responsible_administration_name' => $detail['responsible_administration_name'] ?? null,
                'ownership_type' => $detail['ownership_type'] ?? $this->inferOwnershipType($name),
                'cif' => $detail['cif'] ?? null,
                'erasmus_code' => $detail['erasmus_code'] ?? null,
                'for_profit' => $this->normalizeBoolean($detail['for_profit'] ?? null),
                'address' => $detail['address'] ?? null,
                'postal_code' => $detail['postal_code'] ?? null,
                'locality' => $detail['locality'] ?? null,
                'municipality' => $detail['municipality'] ?? null,
                'province' => $detail['province'] ?? null,
                'autonomous_community_name' => $detail['autonomous_community_name'] ?? null,
                'website' => $detail['website'] ?? null,
                'email' => $detail['email'] ?? null,
                'phone_1' => $detail['phone_1'] ?? null,
                'phone_2' => $detail['phone_2'] ?? null,
                'fax' => $detail['fax'] ?? null,
                'is_university' => $this->inferIsUniversity($name),
                'is_special_entity' => !$this->inferIsUniversity($name),
                'active' => true,
                'source_system' => 'RUCT',
                'source_url' => $detail['source_url'] ?? ($payload['source_url'] ?? null),
                'last_seen_at' => now(),
                'raw_payload' => json_encode([
                    'listing' => $item,
                    'detail' => $detail,
                ], JSON_UNESCAPED_UNICODE),
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        OfficialUniversity::upsert(
            $rows,
            ['ruct_code'],
            [
                'name',
                'acronym',
                'responsible_administration_code',
                'responsible_administration_name',
                'ownership_type',
                'cif',
                'erasmus_code',
                'for_profit',
                'address',
                'postal_code',
                'locality',
                'municipality',
                'province',
                'autonomous_community_name',
                'website',
                'email',
                'phone_1',
                'phone_2',
                'fax',
                'is_university',
                'is_special_entity',
                'active',
                'source_system',
                'source_url',
                'last_seen_at',
                'raw_payload',
                'updated_at',
            ]
        );

        $this->command?->info('✅ OfficialUniversitySeeder: ' . count($rows) . ' entidades RUCT procesadas');
    }

    private function inferIsUniversity(string $name): bool
    {
        $normalized = Str::lower(Str::ascii($name));

        return str_contains($normalized, 'universidad')
            || str_contains($normalized, 'universitat')
            || str_contains($normalized, 'unibertsitatea');
    }

    private function inferOwnershipType(string $name): string
    {
        $normalized = Str::lower(Str::ascii($name));

        if (str_contains($normalized, 'ministerio de defensa')) {
            return 'especial';
        }

        if (str_contains($normalized, 'centros extranjeros')) {
            return 'extranjera';
        }

        if (str_contains($normalized, 'publica') || str_contains($normalized, 'politecnica') || str_contains($normalized, 'complutense')) {
            return 'publica';
        }

        return 'por_clasificar';
    }

    private function normalizeBoolean(?string $value): ?bool
    {
        if ($value === null || $value === '') {
            return null;
        }

        $normalized = Str::lower(Str::ascii($value));

        return match ($normalized) {
            'si', 'sí', 'true', '1' => true,
            'no', 'false', '0' => false,
            default => null,
        };
    }
}
