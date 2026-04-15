<?php

namespace App\Http\Controllers;

use App\Models\CareerCatalog;
use App\Models\ProfessionalQualification;
use Illuminate\Http\Request;

class ProfessionalQualificationController extends Controller
{
    /**
     * Cualificaciones asociadas a una profesión del catálogo.
     * GET /api/profesion/{profesionId}/cualificaciones
     */
    public function byProfession(int $profesionId)
    {
        $career = CareerCatalog::query()->find($profesionId);

        if (!$career) {
            return response()->json([
                'success' => false,
                'error' => 'Profesión no encontrada',
            ], 404);
        }

        $qualifications = $career->qualifications()
            ->select(
                'professional_qualifications.id',
                'professional_qualifications.codigo_cncp',
                'professional_qualifications.denominacion',
                'professional_qualifications.familia_profesional',
                'professional_qualifications.codigo_familia',
                'professional_qualifications.nivel',
                'professional_qualifications.ambito_profesional',
                'professional_qualifications.sectores_productivos',
                'professional_qualifications.ocupaciones',
                'career_qualifications.tipo as relacion_tipo',
                'career_qualifications.relevancia as relacion_relevancia',
                'career_qualifications.observaciones as relacion_observaciones'
            )
            ->orderByDesc('career_qualifications.relevancia')
            ->get();

        return response()->json([
            'success' => true,
            'career' => [
                'id' => $career->id,
                'titulo' => $career->titulo,
                'sector' => $career->sector,
                'familia_profesional' => $career->familia_profesional,
                'codigo_cno' => $career->codigo_cno,
            ],
            'total' => $qualifications->count(),
            'qualifications' => $qualifications,
        ]);
    }

    /**
     * Cualificaciones asociadas buscando por título exacto (case-insensitive).
     * POST /api/profesion/cualificaciones-by-title
     * Body: { titulo: string }
     */
    public function byTitle(Request $request)
    {
        $request->validate([
            'titulo' => 'required|string|max:255',
        ]);

        $titulo = (string) $request->input('titulo');

        $career = CareerCatalog::query()
            ->whereRaw('LOWER(titulo) = ?', [mb_strtolower($titulo)])
            ->first();

        if (!$career) {
            return response()->json([
                'success' => false,
                'error' => 'Profesión no encontrada en el catálogo',
            ], 404);
        }

        return $this->byProfession((int) $career->id);
    }

    /**
     * Buscador de cualificaciones CNCP con filtros.
     * GET /api/cualificaciones?search=&codigo_familia=&nivel=&limit=
     */
    public function index(Request $request)
    {
        $request->validate([
            'search' => 'nullable|string|max:120',
            'codigo_familia' => 'nullable|string|size:3',
            'nivel' => 'nullable|integer|in:1,2,3',
            'limit' => 'nullable|integer|min:1|max:200',
        ]);

        $limit = (int) ($request->input('limit', 50));

        $query = ProfessionalQualification::query()
            ->where('activo', true)
            ->select(
                'id',
                'codigo_cncp',
                'denominacion',
                'familia_profesional',
                'codigo_familia',
                'nivel'
            );

        if ($request->filled('codigo_familia')) {
            $query->where('codigo_familia', strtoupper((string) $request->input('codigo_familia')));
        }

        if ($request->filled('nivel')) {
            $query->where('nivel', (int) $request->input('nivel'));
        }

        if ($request->filled('search')) {
            $search = trim((string) $request->input('search'));
            $query->where(function ($q) use ($search) {
                $q->where('denominacion', 'like', "%{$search}%")
                    ->orWhere('codigo_cncp', 'like', "%{$search}%");
            });
        }

        $items = $query
            ->orderBy('codigo_familia')
            ->orderBy('nivel')
            ->orderBy('codigo_cncp')
            ->limit($limit)
            ->get();

        return response()->json([
            'success' => true,
            'total' => $items->count(),
            'items' => $items,
        ]);
    }
}
