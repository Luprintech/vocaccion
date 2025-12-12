/**
 * Componente: ProfesionCardHorizontal
 * =====================================================
 * Tarjeta de profesión con imagen horizontal (landscape) de Pexels API
 * 
 * CARACTERÍSTICAS PRINCIPALES:
 * ============================
 * ✅ Imágenes horizontales de alta calidad desde Pexels
 * ✅ Orientación landscape optimizada
 * ✅ Aspect ratio >= 1.3 (más ancho que alto)
 * ✅ Calidad "large" de Pexels (~940x650px)
 * ✅ Badge "Tu elección" en verde si está seleccionada
 * ✅ Diseño responsive con TailwindCSS
 * ✅ Animaciones suaves y transiciones
 * 
 * INTEGRACIÓN CON PEXELS API:
 * ===========================
 * Backend (Laravel):
 * - Endpoint: https://api.pexels.com/v1/search
 * - Parámetros: ?query={profesion}&per_page=20&orientation=landscape
 * - Headers: Authorization: {PEXELS_API_KEY}
 * - Filtrado: aspect_ratio >= 1.3 para garantizar horizontalidad
 * - Prioridad URLs: large → large2x → landscape
 * 
 * Contexto Visual por Profesión:
 * - Diseñador UX → "UX designer, working on digital interface design"
 * - Técnico Mantenimiento → "maintenance technician, working with tools and equipment"
 * - Integrador Social → "social worker, helping people in community center"
 * - Dinamizador → "cultural animator, organizing activities with people"
 * 
 * PROPS:
 * ======
 * @param {Object} profesion - Objeto con datos de la profesión
 * @param {string} profesion.titulo - Nombre de la profesión
 * @param {string} profesion.descripcion - Descripción detallada
 * @param {string} profesion.salidas - Salidas laborales separadas por comas
 * @param {string} profesion.imagenUrl - URL de imagen de Pexels (landscape)
 * @param {number} profesion.id - ID único de la profesión
 * @param {boolean} isChosen - Si esta profesión está seleccionada
 * @param {boolean} hasAnyObjective - Si ya hay alguna profesión guardada
 * @param {Function} onGuardar - Callback para guardar profesión
 * @param {Function} onCambiarEleccion - Callback para cambiar selección
 * @param {Function} showToast - Callback para mostrar notificaciones
 * 
 * EJEMPLO DE USO:
 * ===============
 * ```jsx
 * <ProfesionCardHorizontal
 *   profesion={{
 *     titulo: "Diseñador/a de Experiencias de Usuario (UX)",
 *     descripcion: "Crea experiencias digitales intuitivas...",
 *     salidas: "Empresas tecnológicas, agencias de marketing digital, startups",
 *     imagenUrl: "https://images.pexels.com/photos/.../large.jpg",
 *     id: 1
 *   }}
 *   isChosen={false}
 *   hasAnyObjective={false}
 *   onGuardar={(profesion) => console.log('Guardada:', profesion)}
 *   onCambiarEleccion={() => console.log('Cambiando...')}
 *   showToast={(type, msg) => console.log(type, msg)}
 * />
 * ```
 */

import React from 'react';
import { Briefcase, Check, Lock, RefreshCw } from 'lucide-react';

export default function ProfesionCardHorizontal({ 
  profesion, 
  isChosen, 
  hasAnyObjective, 
  onGuardar,
  onCambiarEleccion,
  showToast 
}) {
  const { titulo, descripcion, salidas, imagenUrl } = profesion;

  // Mejorar descripción si es muy corta
  const getDescripcionMejorada = (desc) => {
    if (!desc) return "Esta profesión ofrece múltiples oportunidades de desarrollo profesional y personal en un campo dinámico con alta demanda.";
    if (desc.length < 100) {
      return `${desc} Esta carrera te permitirá desarrollar habilidades valiosas y abrirte camino en un sector con grandes oportunidades.`;
    }
    return desc;
  };

  const descripcionMejorada = getDescripcionMejorada(descripcion);

  return (
    <article className="group bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden border-2 border-transparent hover:border-purple-100 transform hover:-translate-y-2 flex flex-col h-full">
      
      {/* ===================== IMAGEN HORIZONTAL (LANDSCAPE) ===================== */}
      <div className="relative h-64 md:h-72 overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 flex-shrink-0">
        <img
          src={imagenUrl}
          alt={`${titulo} - Imagen representativa de Pexels`}
          referrerPolicy="no-referrer"
          onError={(e) => {
            // Fallback en cascada
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
            }
          }}
          className="w-full h-full object-cover object-center transform group-hover:scale-110 transition-transform duration-700 ease-out"
          style={{ objectPosition: 'center center' }}
          loading="lazy"
        />
        
        {/* Overlay gradiente en hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" 
             aria-hidden="true" />
        
        {/* ===================== BADGE "TU ELECCIÓN" ===================== */}
        {isChosen && (
          <div 
            className="absolute top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-full shadow-xl flex items-center gap-2 animate-fadeIn backdrop-blur-sm"
            role="status"
            aria-label="Profesión seleccionada"
          >
            <Check className="w-5 h-5" strokeWidth={3} aria-hidden="true" />
            <span className="font-semibold text-sm">Tu elección</span>
          </div>
        )}

        {/* Título superpuesto en hover */}
        <div className="absolute bottom-0 left-0 right-0 p-6 transform translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out">
          <h3 className="text-2xl md:text-3xl font-bold text-white drop-shadow-2xl">
            {titulo}
          </h3>
        </div>
      </div>

      {/* ===================== CONTENIDO DE LA TARJETA ===================== */}
      <div className="p-6 md:p-8 flex flex-col flex-1">
        
        {/* Título visible */}
        <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 leading-tight tracking-tight group-hover:text-purple-700 transition-colors duration-300">
          {titulo}
        </h3>

        {/* Descripción */}
        <div className="mb-6">
          <p className="text-gray-700 text-base leading-relaxed tracking-normal">
            {descripcionMejorada}
          </p>
        </div>

        {/* ===================== SALIDAS LABORALES ===================== */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 mb-6 border-2 border-green-100 shadow-sm flex-1">
          <div className="flex items-start gap-4 h-full">
            <div className="flex-shrink-0 w-11 h-11 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-md">
              <Briefcase className="w-6 h-6 text-white" strokeWidth={2.5} aria-hidden="true" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-green-900 text-sm uppercase tracking-wide mb-3 flex items-center gap-2">
                Salidas Laborales
                <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-semibold text-green-700 bg-green-200 rounded-full">
                  {salidas.split(',').length}
                </span>
              </h4>
              <ul className="space-y-3" role="list">
                {salidas.split(',').map((salida, i) => (
                  <li key={i} className="flex items-start gap-3 group/item">
                    <span 
                      className="flex-shrink-0 w-2 h-2 bg-green-600 rounded-full mt-1.5 group-hover/item:scale-150 group-hover/item:bg-green-700 transition-all duration-200"
                      aria-hidden="true"
                    />
                    <span className="text-gray-700 text-sm leading-relaxed tracking-normal flex-1">
                      {salida.trim()}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* ===================== BOTONES DE ACCIÓN ===================== */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 mt-auto pt-4">
          {isChosen ? (
            <>
              <button
                disabled
                className="flex items-center justify-center gap-2 bg-green-500 text-white px-5 py-3 rounded-xl font-semibold shadow-lg opacity-90 cursor-default flex-1 sm:flex-initial"
                aria-label="Profesión ya seleccionada"
              >
                <Check className="w-5 h-5" strokeWidth={2.5} aria-hidden="true" />
                Profesión elegida
              </button>
              <button
                onClick={onCambiarEleccion}
                className="flex items-center justify-center gap-2 bg-gray-200 hover:bg-gray-300 text-gray-700 hover:text-gray-900 px-5 py-3 rounded-xl font-semibold shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95 transition-all duration-300 flex-1 sm:flex-initial"
                aria-label="Cambiar profesión elegida"
              >
                <RefreshCw className="w-5 h-5" strokeWidth={2.5} aria-hidden="true" />
                Cambiar elección
              </button>
            </>
          ) : hasAnyObjective ? (
            <button
              onClick={() => showToast('error', 'Ya tienes una profesión elegida. Usa "Cambiar elección" para elegir otra.')}
              className="flex items-center justify-center gap-2 bg-gray-300 text-gray-600 px-6 py-3 rounded-xl font-semibold cursor-not-allowed opacity-70 hover:opacity-80 transition-opacity"
              aria-label="Ya tienes un objetivo profesional guardado"
            >
              <Lock className="w-5 h-5" aria-hidden="true" />
              Ya tienes objetivo
            </button>
          ) : (
            <button
              onClick={() => onGuardar(profesion)}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 transition-all duration-300"
              aria-label={`Elegir ${titulo} como profesión objetivo`}
            >
              <Check className="w-5 h-5" aria-hidden="true" />
              Elegir profesión
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

/**
 * NOTAS TÉCNICAS DE IMPLEMENTACIÓN:
 * ==================================
 * 
 * 1. BACKEND (Laravel - TestController.php):
 *    - Endpoint Pexels: GET https://api.pexels.com/v1/search
 *    - Query params: ?query={profesion+contexto}&per_page=20&orientation=landscape
 *    - Header: Authorization: {PEXELS_API_KEY}
 *    - Filtrado adicional: aspect_ratio >= 1.3
 *    - Prioridad: large > large2x > landscape
 *    - Caché: IDs usados en Redis/Cache (7 días)
 * 
 * 2. FRONTEND (React + TailwindCSS):
 *    - Componente funcional con hooks
 *    - Props tipadas (TypeScript recomendado)
 *    - Lazy loading de imágenes
 *    - Fallback en cascada (jpg → svg)
 *    - Accesibilidad (ARIA labels, roles)
 * 
 * 3. OPTIMIZACIONES:
 *    - object-fit: cover para imágenes landscape
 *    - aspect-ratio controlado desde backend
 *    - Transiciones GPU-accelerated (transform)
 *    - Skeleton loading (opcional)
 * 
 * 4. PROFESIONES DE EJEMPLO:
 *    - Diseñador UX: personas trabajando con wireframes, tablets
 *    - Técnico Mantenimiento: técnicos con herramientas, overol azul
 *    - Integrador Social: trabajadores sociales en centros comunitarios
 *    - Dinamizador: animadores organizando eventos culturales
 */
