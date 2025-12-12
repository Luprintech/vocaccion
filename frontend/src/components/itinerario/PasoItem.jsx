import React, { useState, useEffect } from 'react';
import { Circle, CheckCircle2 } from 'lucide-react';
import MotivationalToast from '../common/MotivationalToast';

export default function PasoItem({ paso, index, numero, totalPasos, onToggle }) {
  // Inicializar estado: Prioridad Backend > LocalStorage > Default
  const [completado, setCompletado] = useState(() => {
    // 1. Si el backend dice que está completado (porque tiene titulación), es true.
    if (paso.completado) return true;
    
    // 2. Si no es definitivo por backend, miramos localStorage (persistencia manual)
    const key = `paso_${index}`;
    const saved = localStorage.getItem(key);
    return saved === 'true';
  });

  const [showToast, setShowToast] = useState(false);

  // Efecto para sincronizar si la prop cambia dinámicamente (ej: recarga sin desmontar)
  useEffect(() => {
    if (paso.completado) {
        setCompletado(true);
    }
  }, [paso.completado]);

  // Efecto para sincronizar con el padre (ViaFormativaCard) para recálculo de tiempo
  useEffect(() => {
    if (onToggle) {
        onToggle(index, completado);
    }
  }, [completado, index, onToggle]);

  // Guardar estado en localStorage (efecto secundario al cambiar estado manual)
  useEffect(() => {
     if (!paso.completado) { // Solo persistir manual si no viene forzado por backend
         const key = `paso_${index}`;
         localStorage.setItem(key, completado.toString());
     }
  }, [completado, index, paso.completado]);

  // Guardar estado en localStorage y activar toast si se marca
  const toggleCompletado = () => {
    const nuevoEstado = !completado;
    setCompletado(nuevoEstado);
    const key = `paso_${index}`;
    localStorage.setItem(key, nuevoEstado.toString());

    // Activar toast solo si se marca como completado
    if (nuevoEstado) {
      setShowToast(true);
    } else {
      setShowToast(false); // Ocultar si se desmarca
    }
  };

  const esUltimo = numero === totalPasos;

  return (
    <>
      <MotivationalToast isVisible={showToast} onClose={() => setShowToast(false)} />
      
      <div className="relative flex gap-4">
        {/* Timeline vertical */}
        <div className="flex flex-col items-center">
          {/* Checkbox circular */}
          <button
            onClick={toggleCompletado}
            className={`
              relative z-10 w-8 h-8 rounded-full border-2 flex items-center justify-center
              transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2
              ${completado 
                ? 'bg-green-500 border-green-500 focus:ring-green-500' 
                : 'bg-white border-purple-400 hover:border-purple-500 focus:ring-purple-500'
              }
            `}
            aria-label={completado ? 'Marcar como no completado' : 'Marcar como completado'}
          >
            {completado && (
              <CheckCircle2 className="w-5 h-5 text-white" strokeWidth={3} />
            )}
          </button>

          {/* Línea conectora */}
          {!esUltimo && (
            <div className={`w-0.5 flex-1 min-h-[40px] transition-colors duration-300 ${
              completado ? 'bg-green-300' : 'bg-gray-200'
            }`} />
          )}
        </div>

        {/* Contenido del paso */}
        <div
          className={`
            flex-1 pb-8 transition-all duration-300
          `}
        >
          <div
            className={`
              p-4 rounded-xl border-l-4 transition-all duration-300
              ${completado 
                ? 'bg-green-50/50 border-green-400' 
                : 'bg-white border-purple-400 shadow-sm hover:shadow-md'
              }
            `}
          >
            {/* Número del paso */}
            <div className="flex items-start gap-3">
              <span className={`
                flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                ${completado 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-purple-100 text-purple-700'
                }
              `}>
                {numero}
              </span>

              {/* Contenido del paso (Título y Descripción) */}
              <div className="flex-1">
                <p
                  className={`
                    text-sm font-semibold transition-all duration-300
                    ${completado ? 'text-gray-500 line-through' : 'text-gray-900'}
                  `}
                >
                  {typeof paso === 'object' ? paso.titulo : paso}
                </p>
                {typeof paso === 'object' && paso.descripcion && (
                  <p 
                    className={`
                      mt-1 text-sm transition-all duration-300
                      ${completado ? 'text-gray-400' : 'text-gray-600'}
                    `}
                  >
                    {paso.descripcion}
                  </p>
                )}

                {/* OPCIONES SELECCIONABLES (Sub-lista) - SOL VISIBLE SI HAY OPCIONES */}
                {typeof paso === 'object' && paso.opciones && paso.opciones.length >= 1 && (
                  <div className="mt-3 space-y-2">
                    {paso.opciones.map((opcion, idx) => (
                      <PasoOption 
                        key={idx}
                        index={index}
                        optIndex={idx}
                        nombre={opcion.nombre}
                        // Aquí usamos opcion.completado (del backend) O paso.completado global si no hay granularidad
                        // La modificación del backend ahora inyecta 'completado' en opciones específicas.
                        autoCompleted={!!opcion.completado || (!!paso.completado && !/* Solo si no hay opciones marcadas? No, fallback a paso */ false)}
                        onToggle={(nuevoEstadoLocal) => {
                          if (nuevoEstadoLocal && !completado) {
                             // Si marco una opción y el padre no estaba completo, marcar padre y toast
                             setCompletado(true);
                             localStorage.setItem(`paso_${index}`, 'true');
                             setShowToast(true);
                          }
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// Sub-componente para manejar el estado individual de cada opción
function PasoOption({ index, optIndex, nombre, onToggle, autoCompleted }) {
  const [optCompletada, setOptCompletada] = useState(() => {
     // Prioridad: Backend > LocalStorage
     if (autoCompleted) return true;
     
     const key = `paso_${index}_opcion_${optIndex}`;
     return localStorage.getItem(key) === 'true';
  });

  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    if (autoCompleted) {
        setOptCompletada(true);
    }
  }, [autoCompleted]);

  useEffect(() => {
    const key = `paso_${index}_opcion_${optIndex}`;
    localStorage.setItem(key, optCompletada.toString());
  }, [optCompletada, index, optIndex]);

  const toggleOpcion = (e) => {
    e.stopPropagation();
    const nuevo = !optCompletada;
    setOptCompletada(nuevo);
    
    if (nuevo) setShowToast(true);

    if (onToggle) {
      onToggle(nuevo);
    }
  };

  return (
    <>
      <MotivationalToast isVisible={showToast} onClose={() => setShowToast(false)} />
      <div 
        onClick={toggleOpcion}
        className={`
          flex items-center gap-3 p-2 rounded-lg cursor-pointer border transition-all
          ${optCompletada 
            ? 'bg-blue-50 border-blue-200 shadow-sm' 
            : 'bg-gray-50 border-transparent hover:bg-gray-100'
          }
        `}
      >
        <div className={`
          w-5 h-5 rounded border flex items-center justify-center transition-colors
          ${optCompletada ? 'bg-blue-500 border-blue-500' : 'bg-white border-gray-300'}
        `}>
          {optCompletada && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
        </div>
        <span className={`text-sm ${optCompletada ? 'text-blue-700 font-medium' : 'text-gray-600'}`}>
          {nombre}
        </span>
      </div>
    </>
  );
}
