import React from 'react';
import { Route } from 'lucide-react';
import PasoItem from './PasoItem';

export default function PasosSection({ pasos = [] }) {
  if (!pasos || pasos.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
      {/* Header de la sección */}
      <div className="flex items-center gap-3 mb-2">
        <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-md">
          <Route className="w-6 h-6 text-white" strokeWidth={2.5} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-800">Pasos Formativos</h2>
        </div>
      </div>

      <p className="text-sm text-gray-500 mb-6 ml-15">
        Marca cada paso cuando lo completes
      </p>

      {/* Timeline de pasos */}
      <div className="mt-6">
        {pasos.map((paso, index) => (
          <PasoItem
            key={index}
            paso={paso}
            index={index}
            totalPasos={pasos.length}
          />
        ))}
      </div>

      {/* Barra de progreso */}
      <ProgressBar pasos={pasos} />
    </div>
  );
}

// Componente de barra de progreso
function ProgressBar({ pasos }) {
  const [completados, setCompletados] = React.useState(0);

  React.useEffect(() => {
    const updateProgress = () => {
      let count = 0;
      for (let i = 0; i < pasos.length; i++) {
        const key = `paso_${i}`;
        if (localStorage.getItem(key) === 'true') {
          count++;
        }
      }
      setCompletados(count);
    };

    updateProgress();
    const interval = setInterval(updateProgress, 300);
    return () => clearInterval(interval);
  }, [pasos.length]);

  const porcentaje = pasos.length > 0 
    ? Math.round((completados / pasos.length) * 100) 
    : 0;

  return (
    <div className="mt-8 pt-6 border-t border-gray-100">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold text-gray-700">
          Progreso del itinerario
        </span>
        <span className="text-lg font-bold text-green-600">
          {porcentaje}%
        </span>
      </div>
      
      {/* Barra de progreso animada */}
      <div className="relative w-full bg-gray-100 rounded-full h-3 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-purple-500 via-purple-400 to-green-400 transition-all duration-700 ease-out rounded-full shadow-sm"
          style={{ width: `${porcentaje}%` }}
        />
      </div>

      {/* Contador */}
      <div className="mt-2 text-center">
        <span className="text-xs text-gray-500">
          {completados} de {pasos.length} pasos completados
        </span>
      </div>

      {/* Mensaje de felicitación */}
      {porcentaje === 100 && (
        <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500 rounded-lg animate-fadeIn">
          <p className="text-sm font-semibold text-green-700 flex items-center gap-2">
            <span className="text-xl">🎉</span>
            ¡Excelente! Has completado todo el itinerario formativo
          </p>
        </div>
      )}
    </div>
  );
}
