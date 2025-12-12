<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\Models\Testimonio;
use Illuminate\Support\Facades\Auth;

class TestimonioController extends Controller
{
    public function index()
    {
        // Removed limit take(6) to allow full listing view.
        // Frontend will slice for home view.
        $testimonios = Testimonio::with(['usuario.perfil'])
            ->where('visible', true)
            ->latest()
            ->get()
            ->map(function ($testimonio) {
                return $this->formatTestimonio($testimonio);
            });

        return response()->json($testimonios);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'mensaje' => 'required|string|max:255',
            'edad' => 'nullable|integer|min:5|max:100',
        ]);

        $testimonio = Testimonio::create([
            'user_id' => Auth::id(),
            'mensaje' => $validated['mensaje'],
            'edad' => $validated['edad'],
            'visible' => true,
        ]);

        $testimonio->load(['usuario.perfil']);

        return response()->json([
            'message' => 'Testimonio creado correctamente',
            'testimonio' => $this->formatTestimonio($testimonio)
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $testimonio = Testimonio::findOrFail($id);

        if ($testimonio->user_id !== Auth::id()) {
            return response()->json(['message' => 'No autorizado'], 403);
        }

        $validated = $request->validate([
            'mensaje' => 'required|string|max:255',
            'edad' => 'nullable|integer|min:5|max:100',
        ]);

        $testimonio->update([
            'mensaje' => $validated['mensaje'],
            'edad' => $validated['edad'],
        ]);

        $testimonio->load(['usuario.perfil']);

        return response()->json([
            'message' => 'Testimonio actualizado correctamente',
            'testimonio' => $this->formatTestimonio($testimonio)
        ]);
    }

    public function destroy($id)
    {
        $testimonio = Testimonio::findOrFail($id);

        if ($testimonio->user_id !== Auth::id()) {
            return response()->json(['message' => 'No autorizado'], 403);
        }

        $testimonio->delete();

        return response()->json(['message' => 'Testimonio eliminado correctamente']);
    }

    private function formatTestimonio($testimonio)
    {
        $name = 'Anónimo';
        $user = $testimonio->usuario;

        if ($user) {
            // Prioritize profile name if available
            if ($user->perfil && $user->perfil->nombre) {
                $name = $user->perfil->nombre . ($user->perfil->apellidos ? ' ' . $user->perfil->apellidos : '');
            } else {
                $name = $user->nombre;
            }
        }

        return [
            'id' => $testimonio->id,
            'user_id' => $testimonio->user_id,
            'name' => $name,
            'age' => $testimonio->edad,
            'quote' => $testimonio->mensaje,
            'image' => $user && $user->profile_image
                ? asset('storage/' . $user->profile_image)
                : null,
        ];
    }
}
