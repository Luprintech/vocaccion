<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * IdempotencyKey
 * ──────────────
 * Thin model around the `idempotency_keys` table.
 * All business logic lives in TestController — this model
 * is intentionally anemic (lookup + insert only).
 */
class IdempotencyKey extends Model
{
    public $timestamps = false;

    protected $table = 'idempotency_keys';

    protected $fillable = ['key', 'response_json', 'expires_at'];

    protected $casts = [
        'expires_at' => 'datetime',
        'created_at' => 'datetime',
    ];

    // ──────────────────────────────────────────────────────────────────────
    // Static helpers used by TestController
    // ──────────────────────────────────────────────────────────────────────

    /**
     * Find a non-expired record by key.
     * Returns null if key doesn't exist or has expired.
     */
    public static function findValid(string $key): ?self
    {
        return static::where('key', $key)
            ->where('expires_at', '>', Carbon::now())
            ->first();
    }

    /**
     * Store a new idempotency record with a 5-minute TTL.
     * Uses insertOrIgnore to handle the (rare) race where two
     * identical requests arrive before either has been stored.
     * The first writer wins; subsequent duplicates are handled
     * by findValid() at the top of the controller.
     */
    public static function store(string $key, array $responseData, int $ttlMinutes = 5): void
    {
        DB::table('idempotency_keys')->insertOrIgnore([
            'key' => $key,
            'response_json' => json_encode($responseData, JSON_UNESCAPED_UNICODE),
            'expires_at' => Carbon::now()->addMinutes($ttlMinutes),
            'created_at' => Carbon::now(),
        ]);
    }
}
