/**
 * Componente: MiProfesionCard
 * ---------------------------------------------
 * Tarjeta visual para mostrar la profesión guardada del usuario
 * con imagen, descripción detallada y acciones.
 * 
 * Props:
 * - profesion: objeto con {titulo, descripcion, salidas, imagen_url, formacion_recomendada, habilidades}
 * - onCambiar: función callback para cambiar de profesión
 * - onEliminar: función callback para eliminar la profesión
 * - onVerItinerario: función callback para ver el itinerario académico
 */

import React from 'react';
import { Star, Briefcase, GraduationCap, Lightbulb, Edit3, Trash2, Check, BookOpen, BadgeCheck, ArrowRight, UserCheck, TrendingUp } from 'lucide-react';
import { getEmpleoByCareerTitle, formatSalario } from '@/data/empleo_sectores';

export default function MiProfesionCard({ profesion, onCambiar, onEliminar, onVerItinerario }) {
  const {
    titulo,
    descripcion,
    salidas,
    imagen_url,
    formacion_recomendada,
    habilidades,
    estudios_comparados,
    habilidades_comparadas,
    cualificaciones_cncp,
    cncp_loading,
  } = profesion;

  const cncpArray = React.useMemo(() => {
    if (!Array.isArray(cualificaciones_cncp)) return [];
    return cualificaciones_cncp;
  }, [cualificaciones_cncp]);

  // Datos reales de inserción laboral (fuente: QEDU — Ministerio de Ciencia)
  const empleoData = React.useMemo(() => getEmpleoByCareerTitle(titulo), [titulo]);

  // Convertir habilidades a array con comparación
  const habilidadesArray = React.useMemo(() => {
    // Si vienen habilidades comparadas del backend, usarlas
    if (habilidades_comparadas && Array.isArray(habilidades_comparadas)) {
      return habilidades_comparadas;
    }

    // Sino, convertir habilidades simples a formato comparado
    if (!habilidades) return [];
    if (Array.isArray(habilidades)) {
      return habilidades.map(h => ({
        nombre: typeof h === 'string' ? h : h.nombre || '',
        usuario_la_tiene: false
      }));
    }
    if (typeof habilidades === 'string') {
      try {
        const parsed = JSON.parse(habilidades);
        if (Array.isArray(parsed)) {
          return parsed.map(h => ({
            nombre: typeof h === 'string' ? h : h.nombre || '',
            usuario_la_tiene: false
          }));
        }
      } catch {
        return habilidades.split(',').map(h => ({ nombre: h.trim(), posee_usuario: false })).filter(h => h.nombre);
      }
    }
    return [];
  }, [habilidades]);

  // Convertir formación a array si viene como string JSON
  const formacionArray = React.useMemo(() => {
    if (!formacion_recomendada) return [];
    if (Array.isArray(formacion_recomendada)) return formacion_recomendada;
    try {
      const parsed = JSON.parse(formacion_recomendada);
      return Array.isArray(parsed) ? parsed : [formacion_recomendada];
    } catch {
      return [formacion_recomendada];
    }
  }, [formacion_recomendada]);

  // Definir estudiosArray para la sección de Formación Recomendada
  const estudiosArray = React.useMemo(() => {
    if (estudios_comparados && Array.isArray(estudios_comparados)) {
      return estudios_comparados;
    }
    // Fallback usando formacionArray
    return formacionArray.map(item => ({
      nombre: item,
      usuario_lo_tiene: false
    }));
  }, [estudios_comparados, formacionArray]);

  // Helper para obtener el nombre de la habilidad o estudio
  const getNombre = (item) => {
    if (typeof item === 'string') return item;
    if (typeof item === 'object' && item.nombre) return item.nombre;
    return JSON.stringify(item);
  };

  // Helper para saber si el usuario tiene la habilidad o estudio
  const tieneItem = (item) => {
    if (typeof item === 'object') {
      return item.posee_usuario || item.usuario_lo_tiene || item.usuario_la_tiene;
    }
    return false;
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl overflow-hidden border-2 border-purple-100 hover:border-purple-200 transition-all duration-300">
      {/* Header con ícono y título */}
      <div className="bg-gradient-to-r from-purple-600 to-green-600 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
            <Star className="w-7 h-7 text-white" fill="white" strokeWidth={2} />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-white">Tu Profesión Objetivo</h2>
            <p className="text-white/80 text-sm">Camino profesional seleccionado</p>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="p-6 space-y-6">
        {/* Título de la profesión */}
        <div className="text-center">
          <h3 className="text-3xl font-bold text-purple-800 tracking-tight leading-tight mb-3">
            {titulo}
          </h3>
          <div className="h-1 w-20 bg-gradient-to-r from-purple-500 to-green-500 rounded-full mx-auto"></div>

          {/* Datos reales de empleabilidad (QEDU) */}
          {empleoData && (
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              <span
                title="% de titulados dados de alta en la Seguridad Social 4 años tras graduarse (fuente: QEDU — Ministerio de Ciencia)"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 cursor-help"
              >
                <UserCheck size={12} />
                Empleabilidad {empleoData.tasa_afiliacion}%
                <span className="text-blue-400 font-normal">· QEDU</span>
              </span>
              <span
                title="Base de cotización media anual de titulados en este sector, 4 años tras graduarse (fuente: QEDU — Ministerio de Ciencia)"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-violet-50 text-violet-700 border border-violet-200 cursor-help"
              >
                <TrendingUp size={12} />
                ~{formatSalario(empleoData.salario_medio)}
                <span className="text-violet-400 font-normal">· datos reales</span>
              </span>
            </div>
          )}
        </div>

        {/* Imagen de la profesión */}
        <div className="max-w-2xl mx-auto">
          <div className="relative rounded-2xl overflow-hidden shadow-md bg-gradient-to-br from-gray-100 to-gray-200" style={{ aspectRatio: '16 / 9' }}>
            <img
              src={imagen_url || '/images/default-profession.jpg'}
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
              className="absolute inset-0 w-full h-full object-cover"
              style={{ objectPosition: 'center center', objectFit: 'cover' }}
            />
            {/* Badge flotante */}
            <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg backdrop-blur-sm flex items-center gap-1">
              <Star className="w-3 h-3" fill="white" />
              <span>Objetivo actual</span>
            </div>
          </div>
        </div>

        {/* Contenido de información */}
        <div className="space-y-6">

          {/* Descripción */}
          <div>
            <p className="text-gray-700 text-base leading-relaxed tracking-normal text-justify">
              {descripcion}
            </p>
          </div>

          {/* Salidas laborales */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-5 border-2 border-green-100">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-md">
                <Briefcase className="w-5 h-5 text-white" strokeWidth={2.5} />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-green-900 text-sm uppercase tracking-wide mb-3">
                  Salidas Laborales
                </h4>
                <ul className="space-y-2">
                  {(Array.isArray(salidas) ? salidas : (salidas ? salidas.split(',') : [])).map((salida, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="flex-shrink-0 w-1.5 h-1.5 bg-green-600 rounded-full mt-2"></span>
                      <span className="text-gray-700 text-sm leading-relaxed flex-1">
                        {salida.trim()}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Habilidades Necesarias (Reemplazando Ruta Formativa duplicada si es necesario, pero mantendremos la estructura solicitada) */}
          {/* Nota: El bloque original de Ruta Formativa (lines 176-197) usaba formacionArray. 
              El bloque de abajo (200-234) usaba estudiosArray pero iteraba habilidadesArray.
              Vamos a corregir el bloque de abajo para usar estudiosArray.
          */}

          {/* Habilidades (Renderizado correcto) */}
          {habilidadesArray && habilidadesArray.length > 0 && (
            <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-2xl p-5 border-2 border-purple-100">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
                  <Lightbulb className="w-5 h-5 text-white" strokeWidth={2.5} />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-purple-900 text-sm uppercase tracking-wide mb-3">
                    Habilidades Necesarias
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {habilidadesArray.map((habilidad, i) => {
                      const nombre = getNombre(habilidad);
                      const posee = tieneItem(habilidad);
                      return (
                        <span
                          key={i}
                          className={`
                            inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-full shadow-sm border
                            ${posee
                              ? 'bg-green-100 text-green-700 border-green-200'
                              : 'bg-gray-100 text-gray-500 border-gray-200 opacity-80'}
                          `}
                          title={posee ? '¡Tienes esta habilidad!' : 'Habilidad a desarrollar'}
                        >
                          {nombre}
                          {posee && <Check className="w-3 h-3 ml-1" />}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Formación Recomendada (Corregido) */}
          {/* Formación Recomendada (Estilo Lista igual a ProfesionCard) */}
          {estudiosArray && estudiosArray.length > 0 && (
            <div className="bg-blue-50 rounded-2xl p-5 border border-blue-100">
              <h4 className="font-bold text-blue-900 text-sm uppercase tracking-wide mb-3 flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-blue-600" />
                Ruta Formativa
              </h4>
              <ul className="space-y-2">
                {estudiosArray.map((estudio, i) => {
                  const nombre = getNombre(estudio);
                  return (
                    <li key={i} className="flex items-start gap-2 text-sm text-blue-800">
                      <span className="mt-1.5 w-1.5 h-1.5 bg-blue-400 rounded-full flex-shrink-0"></span>
                      <span>{nombre}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* Cualificaciones oficiales CNCP asociadas */}
          <div className="bg-gradient-to-br from-purple-50 to-green-50 rounded-2xl p-5 border-2 border-purple-100" aria-live="polite">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-purple-600 to-green-600 rounded-xl flex items-center justify-center shadow-md">
                <BookOpen className="w-5 h-5 text-white" strokeWidth={2.5} />
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <h4 className="font-bold text-purple-900 text-sm uppercase tracking-wide inline-flex items-center gap-2">
                    Cualificaciones Oficiales (CNCP)
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white border border-purple-200 text-purple-700">
                      {cncp_loading ? 'Cargando…' : `${cncpArray.length} asociadas`}
                    </span>
                  </h4>
                </div>

                {cncp_loading ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-10 bg-white/70 rounded-lg border border-purple-100 animate-pulse" />
                    ))}
                  </div>
                ) : cncpArray.length > 0 ? (
                  <>
                    <div className="grid gap-2 mb-3">
                      {cncpArray.slice(0, 4).map((q) => (
                        <article key={q.codigo_cncp} className="bg-white rounded-xl border border-purple-100 p-3 shadow-sm">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-[11px] font-bold uppercase text-purple-700 tracking-wide">{q.codigo_cncp}</p>
                              <p className="text-sm text-gray-800 leading-snug">{q.denominacion}</p>
                            </div>
                            {q.relacion_tipo && (
                              <span
                                className={`text-[10px] px-2 py-1 rounded-full border whitespace-nowrap ${
                                  q.relacion_tipo === 'obligatoria'
                                    ? 'bg-red-50 text-red-700 border-red-200'
                                    : q.relacion_tipo === 'recomendada'
                                    ? 'bg-green-50 text-green-700 border-green-200'
                                    : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                                }`}
                              >
                                {q.relacion_tipo}
                              </span>
                            )}
                          </div>
                          <div className="mt-2 flex items-center justify-between text-xs text-gray-600">
                            <span className="inline-flex items-center gap-1"><BadgeCheck className="w-3.5 h-3.5" /> Nivel {q.nivel}</span>
                            <span>Relevancia: <strong className="text-gray-800">{q.relacion_relevancia ?? 0}%</strong></span>
                          </div>
                        </article>
                      ))}
                    </div>

                    <p className="text-xs text-gray-600 leading-relaxed">
                      Estas cualificaciones oficiales se incorporan al itinerario para darte rutas más precisas y alineadas con el sistema educativo español.
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-gray-600">
                    Aún no hay cualificaciones CNCP asociadas visibles para esta profesión. Puedes abrir el itinerario para generar contexto actualizado.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <button
              onClick={onCambiar}
              className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer"
            >
              <Edit3 className="w-5 h-5" strokeWidth={2.5} />
              Cambiar profesión
            </button>
            <button
              onClick={onEliminar}
              className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer"
            >
              <Trash2 className="w-5 h-5" strokeWidth={2.5} />
              Eliminar
            </button>
            <button
              onClick={onVerItinerario}
              className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer"
            >
              <GraduationCap className="w-5 h-5" strokeWidth={2.5} />
              Ver itinerario completo
              <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
