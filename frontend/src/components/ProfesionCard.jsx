/**
 * Componente: ProfesionCard
 * ---------------------------------------------
 * Tarjeta reutilizable para mostrar información de una profesión
 * en los resultados del test vocacional.
 * 
 * Props:
 * - profesion: objeto con {titulo, descripcion, salidas, imagenUrl, id}
 * - isChosen: boolean que indica si esta profesión ya está elegida
 * - hasAnyObjective: boolean que indica si ya hay alguna profesión guardada
 * - onGuardar: función callback para guardar la profesión
 * - onCambiarEleccion: función callback para desmarcar la profesión elegida
 * - showToast: función para mostrar notificaciones
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, Check, Lock, RefreshCw, GraduationCap, Zap, ArrowRight } from 'lucide-react';

export default function ProfesionCard({
  profesion,
  isChosen,
  hasAnyObjective,
  onGuardar,
  onCambiarEleccion,
  showToast
}) {
  const navigate = useNavigate();
  const { titulo, descripcion, salidas, imagenUrl, habilidades, estudios } = profesion;

  // Mejorar la descripción si es muy corta (menos de 100 caracteres)
  const getDescripcionMejorada = (desc) => {
    if (!desc) return "Esta profesión ofrece múltiples oportunidades de desarrollo profesional y personal. Ideal para quienes buscan un campo dinámico y con alta demanda en el mercado laboral actual.";

    if (desc.length < 100) {
      return `${desc} Esta carrera te permitirá desarrollar habilidades valiosas y abrirte camino en un sector con grandes oportunidades profesionales.`;
    }

    return desc;
  };

  const descripcionMejorada = getDescripcionMejorada(descripcion);

  return (
    <div className="group bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden border-2 border-transparent hover:border-purple-100 transform hover:-translate-y-2 flex flex-col h-full">
      {/* Imagen optimizada horizontal (landscape) - Fuerza aspecto 16:9 */}
      {/* Imagen optimizada horizontal (landscape) - Altura fija para consistencia */}
      <div className="relative w-full h-56 overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 flex-shrink-0">
        <img
          src={imagenUrl}
          alt={titulo}
          referrerPolicy="no-referrer"
          onError={(e) => {
            const jpg = '/images/default-profession.jpg';
            const svg = '/images/default-profession.svg';
            if (!e.currentTarget.dataset.fallbackJpg) {
              e.currentTarget.dataset.fallbackJpg = 'true';
              e.currentTarget.src = jpg;
              return;
            }
            if (!e.currentTarget.dataset.fallbackSvg) {
              e.currentTarget.dataset.fallbackSvg = 'true';
              e.currentTarget.src = svg;
              return;
            }
          }}
          className="absolute inset-0 w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700 ease-out"
          style={{ objectPosition: 'center center', objectFit: 'cover' }}
          loading="lazy"
        />

        {/* Overlay gradiente sutil que aparece en hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

        {/* Badge si está elegida */}
        {isChosen && (
          <div className="absolute top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-full shadow-xl flex items-center gap-2 animate-fadeIn backdrop-blur-sm">
            <Check className="w-5 h-5" strokeWidth={3} />
            <span className="font-semibold text-sm">Tu elección</span>
          </div>
        )}

        {/* Título superpuesto en hover (efecto visual avanzado) */}
        <div className="absolute bottom-0 left-0 right-0 p-6 transform translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out">
          <h3 className="text-2xl md:text-3xl font-bold text-white drop-shadow-2xl">
            {titulo}
          </h3>
        </div>
      </div>

      {/* Contenido de la tarjeta con mejor espaciado */}
      <div className="p-6 md:p-8 flex flex-col flex-1">
        {/* Título (visible siempre, oculto en hover por el overlay) */}
        <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 leading-tight tracking-tight group-hover:text-purple-700 transition-colors duration-300">
          {titulo}
        </h3>

        {/* Descripción mejorada con mejor legibilidad */}
        <div className="mb-6">
          <p className="text-gray-700 text-base leading-relaxed tracking-normal text-justify">
            {descripcionMejorada}
          </p>
        </div>

        {/* Salidas laborales con iconos y bullets perfectamente alineados */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 mb-6 border-2 border-green-100 shadow-sm flex-1">
          <div className="flex items-start gap-4 h-full">
            <div className="flex-shrink-0 w-11 h-11 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-md">
              <Briefcase className="w-6 h-6 text-white" strokeWidth={2.5} />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-green-900 text-sm uppercase tracking-wide mb-3 flex items-center gap-2">
                Salidas Laborales
                <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-semibold text-green-700 bg-green-200 rounded-full">
                  {Array.isArray(salidas) ? salidas.length : (salidas ? salidas.split(',').length : 0)}
                </span>
              </h4>
              <ul className="space-y-3">
                {(Array.isArray(salidas) ? salidas : (salidas ? salidas.split(',') : [])).map((salida, i) => (
                  <li key={i} className="flex items-start gap-3 group/item">
                    {/* Bullet point perfectamente alineado con el texto */}
                    <span className="flex-shrink-0 w-2 h-2 bg-green-600 rounded-full mt-1.5 group-hover/item:scale-150 group-hover/item:bg-green-700 transition-all duration-200"></span>
                    <span className="text-gray-700 text-sm leading-relaxed tracking-normal flex-1">
                      {salida.trim()}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* SECCIÓN DE HABILIDADES REQUERIDAS */}
        {habilidades && habilidades.length > 0 && (
          <div className="mb-6">
            <h4 className="font-bold text-gray-800 text-sm uppercase tracking-wide mb-3 flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-500" />
              Habilidades Requeridas
            </h4>
            <div className="flex flex-wrap gap-2">
              {habilidades.map((hab, idx) => (
                <span
                  key={idx}
                  className={`
                    px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all
                    ${hab.posee_usuario
                      ? 'bg-green-100 text-green-700 border-green-200 shadow-sm'
                      : 'bg-gray-100 text-gray-500 border-gray-200 opacity-80'}
                  `}
                  title={hab.posee_usuario ? '¡Tienes esta habilidad!' : 'Habilidad a desarrollar'}
                >
                  {hab.nombre}
                  {hab.posee_usuario && <Check className="w-3 h-3 inline-block ml-1" />}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* SECCIÓN DE RUTA FORMATIVA (ESTUDIOS) */}
        {estudios && estudios.length > 0 && (
          <div className="bg-blue-50 rounded-2xl p-5 mb-6 border border-blue-100">
            <h4 className="font-bold text-blue-900 text-sm uppercase tracking-wide mb-3 flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-blue-600" />
              Ruta Formativa
            </h4>
            <ul className="space-y-2">
              {estudios.map((estudio, idx) => {
                // Manejar tanto strings como objetos {nombre, usuario_lo_tiene}
                const nombreEstudio = typeof estudio === 'string' ? estudio : (estudio.nombre || estudio);
                return (
                  <li key={idx} className="flex items-start gap-2 text-sm text-blue-800">
                    <span className="mt-1.5 w-1.5 h-1.5 bg-blue-400 rounded-full flex-shrink-0"></span>
                    <span>{nombreEstudio}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* Botones de acción con estados claros y opción de cambiar - siempre al final */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 mt-auto pt-4">
          {isChosen ? (
            <>
              <button
                onClick={() => navigate('/mi-profesion')}
                className="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white px-5 py-3 rounded-xl font-semibold shadow-lg transform hover:scale-105 active:scale-95 transition-all duration-300 flex-1 sm:flex-initial cursor-pointer"
              >
                <Check className="w-5 h-5" strokeWidth={2.5} />
                Ir a Mi Profesión
              </button>
              <button
                onClick={onCambiarEleccion}
                className="flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-800 px-5 py-3 rounded-xl font-semibold shadow-sm hover:shadow-md transition-all duration-300 flex-1 sm:flex-initial border border-gray-200 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" strokeWidth={2.5} />
                Cambiar
              </button>
            </>
          ) : hasAnyObjective ? (
            <button
              onClick={() => showToast('error', 'Ya tienes una profesión elegida. Usa "Cambiar elección" para elegir otra.')}
              className="flex items-center justify-center gap-2 bg-gray-300 text-gray-600 px-6 py-3 rounded-xl font-semibold cursor-not-allowed opacity-70 hover:opacity-80 transition-opacity"
            >
              <Lock className="w-5 h-5" />
              Ya tienes objetivo
            </button>
          ) : (
            <button
              onClick={() => onGuardar(profesion)}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer"
            >
              <Check className="w-5 h-5" />
              Elegir profesión
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
