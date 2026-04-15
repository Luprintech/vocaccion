<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OfficialDegreeStatistic extends Model
{
    protected $fillable = [
        'official_degree_id',
        'official_university_id',
        'academic_year',
        'metric_type',
        'metric_value',
        'metric_unit',
        'source_system',
        'source_dataset',
        'source_url',
        'dimensions',
        'raw_payload',
    ];

    protected $casts = [
        'metric_value' => 'float',
        'dimensions' => 'array',
        'raw_payload' => 'array',
    ];

    public function degree(): BelongsTo
    {
        return $this->belongsTo(OfficialDegree::class, 'official_degree_id');
    }

    public function university(): BelongsTo
    {
        return $this->belongsTo(OfficialUniversity::class, 'official_university_id');
    }
}
