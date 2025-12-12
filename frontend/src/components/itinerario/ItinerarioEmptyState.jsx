import React from "react";
import { useNavigate } from "react-router-dom";
import { GraduationCap, Target, Sparkles } from "lucide-react";

export default function ItinerarioEmptyState({ message, title = "Aún no tienes una profesión objetivo" }) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-green-50 px-4">
      <div className="max-w-2xl w-full text-center bg-white p-12 rounded-2xl shadow-xl border border-gray-100">
        <div className="inline-flex items-center gap-3 bg-white px-8 py-4 rounded-full shadow-lg border-2 border-purple-100 mb-6">
          <GraduationCap className="w-8 h-8 text-purple-600" />
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-green-600 bg-clip-text text-transparent">
            Mi Itinerario Académico
          </h1>
        </div>

        <div className="w-24 h-24 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Target className="w-12 h-12 text-purple-600" />
        </div>

        <h2 className="text-2xl font-bold text-gray-800 mb-4">{title}</h2>

        <p className="text-gray-600 mb-8 max-w-md mx-auto leading-relaxed">
          {message ||
            "Realiza el test vocacional o selecciona manualmente una profesión para generar un itinerario académico personalizado."}
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => navigate("/test")}
            className="px-8 py-4 rounded-xl bg-gradient-to-r from-purple-600 to-green-600 text-white font-semibold shadow-lg hover:scale-105 transition flex items-center gap-2"
          >
            <Sparkles className="w-5 h-5" />
            Realizar Test Vocacional
          </button>

          <button
            onClick={() => navigate("/resultados")}
            className="px-8 py-4 rounded-xl bg-white border-2 border-purple-200 text-purple-600 font-semibold shadow-lg hover:scale-105 transition flex items-center gap-2"
          >
            <Target className="w-5 h-5" />
            Elegir mi Profesión
          </button>
        </div>
      </div>
    </div>
  );
}
