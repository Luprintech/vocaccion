<?php

namespace App\Http\Controllers;

use App\Jobs\RunDataUpdateJob;
use App\Models\DataUpdateRun;
use Illuminate\Http\Request;

class DataUpdateController extends Controller
{
    public function index(Request $request)
    {
        return response()->json([
            'success' => true,
            'runs' => DataUpdateRun::query()->latest()->limit(20)->get(),
        ]);
    }

    public function store(Request $request)
    {
        $payload = $request->validate([
            'type' => 'required|string|in:refresh_courses,refresh_official_catalog,geocode_precise',
            'options' => 'array',
        ]);

        $run = DataUpdateRun::create([
            'type' => $payload['type'],
            'status' => 'queued',
            'options' => $payload['options'] ?? [],
            'usuario_id' => $request->user()?->id,
        ]);

        RunDataUpdateJob::dispatch($run->id);

        return response()->json([
            'success' => true,
            'run' => $run,
            'message' => 'Actualización encolada. Requiere `php artisan queue:work` para ejecutarse en segundo plano.',
        ], 202);
    }

    public function show(int $id)
    {
        $run = DataUpdateRun::findOrFail($id);

        return response()->json([
            'success' => true,
            'run' => $run,
        ]);
    }
}
