import React from 'react';

export default function ConvergenceWidget({ areas }) {
  if (!areas || Object.keys(areas).length === 0) return null;

  // Calcular peso total para porcentajes reales
  const totalWeight = Object.values(areas).reduce((acc, curr) => acc + (curr.weight || 0), 0);

  // Ordenar áreas por peso de mayor a menor
  const sortedAreas = Object.entries(areas)
    .sort(([, a], [, b]) => (b.weight || 0) - (a.weight || 0))
    .slice(0, 5); // Mostrar top 5

  return (
    <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl shadow-sm border border-purple-100 animate-fadeIn transition-all">
      <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></span>
        Tu Perfil en Tiempo Real
      </h4>
      <div className="space-y-3">
        {sortedAreas.map(([area, data]) => {
          const weight = data.weight || 0;
          // Evitar división por cero
          const percentage = totalWeight > 0 ? Math.round((weight / totalWeight) * 100) : 0;
          
          return (
            <div key={area} className="group">
              <div className="flex justify-between text-xs text-gray-600 mb-1">
                <span className="font-medium truncate max-w-[120px] capitalize" title={area}>{area}</span>
                <span className="font-bold text-purple-600">{percentage}%</span>
              </div>
              <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all duration-700 ease-out group-hover:from-purple-400 group-hover:to-indigo-400"
                  style={{ width: `${Math.min(percentage, 100)}%` }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
