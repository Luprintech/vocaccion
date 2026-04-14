<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PublicCompetition extends Model
{
    protected $fillable = [
        'boe_id',
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
    ];

    protected $casts = [
        'active' => 'boolean',
        'publication_date' => 'date',
        'last_seen_at' => 'datetime',
        'raw_payload' => 'array',
        'positions' => 'integer',
    ];

    /**
     * Scope para filtrar por tipo de acceso
     */
    public function scopeAccessType($query, string $type)
    {
        return $query->where('access_type', $type);
    }

    /**
     * Scope para filtrar por ámbito
     */
    public function scopeScope($query, string $scope)
    {
        return $query->where('scope', $scope);
    }

    /**
     * Scope para filtrar por grupo
     */
    public function scopeGroup($query, string $group)
    {
        return $query->where('group', $group);
    }

    /**
     * Scope para oposiciones recientes
     */
    public function scopeRecent($query, int $days = 30)
    {
        return $query->where('active', true)
            ->where('publication_date', '>=', now()->subDays($days))
            ->orderByDesc('publication_date');
    }

    /**
     * Scope para búsqueda de texto
     */
    public function scopeSearch($query, string $search)
    {
        return $query->where(function ($q) use ($search) {
            $q->where('title', 'like', "%{$search}%")
              ->orWhere('organism', 'like', "%{$search}%")
              ->orWhere('description', 'like', "%{$search}%");
        });
    }

    // ─── Accessors para limpiar URLs corruptas (dominio duplicado del scraper) ─

    public function getUrlPdfAttribute(?string $value): ?string
    {
        return $this->cleanBoeUrl($value);
    }

    public function getUrlHtmlAttribute(?string $value): ?string
    {
        return $this->cleanBoeUrl($value);
    }

    public function getUrlXmlAttribute(?string $value): ?string
    {
        return $this->cleanBoeUrl($value);
    }

    private function cleanBoeUrl(?string $url): ?string
    {
        if (!$url) {
            return null;
        }

        // Elimina dominio duplicado: "https://www.boe.eshttps://www.boe.es/..." → "https://www.boe.es/..."
        return preg_replace('#^https?://[^/]+(?=https?://)#', '', $url);
    }
}
