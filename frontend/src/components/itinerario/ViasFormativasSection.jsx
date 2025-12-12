import React, { useState } from 'react';
import { Route, Sparkles } from 'lucide-react';
import ViaFormativaCard from './ViaFormativaCard';

export default function ViasFormativasSection({ vias }) {
  const [selectedPath, setSelectedPath] = useState(null);

  const handleSelect = (id) => {
    if (selectedPath === id) {
      setSelectedPath(null); // Deseleccionar si ya está activo
    } else {
      setSelectedPath(id);
    }
  };

  if (!vias || vias.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl flex items-center justify-center shadow-md">
            <Route className="w-6 h-6 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Vías Formativas</h2>
            <p className="text-sm text-gray-500">Elige el camino que mejor se adapte a ti</p>
          </div>
        </div>

        {/* Descripción */}
        <div className="bg-gradient-to-r from-purple-50 to-green-50 rounded-xl p-4 border border-purple-100">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-gray-700 leading-relaxed">
              Cada profesión puede alcanzarse por diferentes caminos. Explora las vías disponibles y selecciona la que mejor se ajuste a tu situación actual y objetivos futuros.
            </p>
          </div>
        </div>
      </div>

      {/* Vías */}
      <div className="space-y-4">
        {vias.map((via, index) => (
          <ViaFormativaCard
            key={index}
            via={via}
            index={index}
            isSelected={selectedPath === via.id}
            isAnySelected={selectedPath !== null}
            onSelect={() => handleSelect(via.id)}
          />
        ))}
      </div>

      {/* Mensaje informativo */}
      {selectedPath !== null && (
        <div className="mt-6 p-4 bg-purple-50 rounded-xl border border-purple-100">
          <p className="text-sm text-purple-800 text-center font-medium">
            💡 Marca los pasos completados para seguir tu progreso en esta vía
          </p>
        </div>
      )}
    </div>
  );
}
