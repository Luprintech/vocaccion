import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  GraduationCap,
  AlertCircle,
  MapPin,
  Target,
  Sparkles,
  Clock3,
  Briefcase,
  BookOpen,
  ChevronDown,
  CheckCircle2,
  Layers3,
  Search,
  Filter,
  RefreshCw,
  ExternalLink,
  ListChecks,
} from "lucide-react";

import {
  generateImageForProfession,
  generarItinerarioByTitulo,
  getCualificacionesByProfesionTitulo,
  getObjetivoProfesional,
} from "../../api";
import ItinerarioEmptyState from "@/components/itinerario/ItinerarioEmptyState";

// Color/label mapping for via types
const VIA_CONFIG = {
  universitaria: {
    label: "Vía Universitaria",
    bg: "bg-purple-50",
    border: "border-purple-200",
    text: "text-purple-700",
  },
  fp: {
    label: "Formación Profesional",
    bg: "bg-green-50",
    border: "border-green-200",
    text: "text-green-700",
  },
  autodidacta: {
    label: "Vía Autodidacta",
    bg: "bg-blue-50",
    border: "border-blue-200",
    text: "text-blue-700",
  },
};

export default function ItinerarioAcademico() {
  const location = useLocation();
  const navigate = useNavigate();
  const mountedRef = useRef(true);

  const prefill = useMemo(() => {
    const statePrefill = location.state?.itinerarioPrefill;
    if (!statePrefill?.objetivo?.profesion?.titulo) return null;
    return statePrefill;
  }, [location.state]);

  const [loading, setLoading] = useState(!prefill);
  const [refreshing, setRefreshing] = useState(Boolean(prefill));
  const [objetivo, setObjetivo] = useState(prefill?.objetivo || null);
  const [itinerario, setItinerario] = useState(null);
  const [cached, setCached] = useState(false);
  const [notasCorte, setNotasCorte] = useState({});
  const [error, setError] = useState(null);
  const [profesionImage, setProfesionImage] = useState(null);
  const [qualifications, setQualifications] = useState(prefill?.qualifications || []);
  const [activeTab, setActiveTab] = useState("rutas");
  const [expandedRoute, setExpandedRoute] = useState(0);
  const [qSearch, setQSearch] = useState("");
  const [qNivel, setQNivel] = useState("all");
  const [qTipo, setQTipo] = useState("all");

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const loadData = useCallback(async ({ silent = false } = {}) => {
    if (silent) {
      if (mountedRef.current) setRefreshing(true);
    } else {
      if (mountedRef.current) setLoading(true);
      if (mountedRef.current) setError(null);
    }

    try {
      const objetivoRes = await getObjetivoProfesional();
      if (!objetivoRes?.success || !objetivoRes?.objetivo?.profesion?.titulo) {
        if (mountedRef.current) {
          setObjetivo(null);
          setItinerario(null);
          setQualifications([]);
        }
        return;
      }

      const objetivoData = objetivoRes.objetivo;
      const tituloProfesion = objetivoData.profesion.titulo;

      if (mountedRef.current) setObjetivo(objetivoData);

      const [itinerarioRes, qualificationsRes] = await Promise.allSettled([
        generarItinerarioByTitulo({
          titulo: tituloProfesion,
          ccaa: objetivoData.comunidad_autonoma,
        }),
        getCualificacionesByProfesionTitulo({ titulo: tituloProfesion }),
      ]);

      if (itinerarioRes.status === "fulfilled" && itinerarioRes.value?.success) {
        if (mountedRef.current) {
          setItinerario(itinerarioRes.value.itinerario);
          setCached(Boolean(itinerarioRes.value.cached));
          setNotasCorte(itinerarioRes.value.notas_corte || {});
        }
      } else {
        const itineraryError =
          itinerarioRes.status === "rejected"
            ? itinerarioRes.reason
            : itinerarioRes.value?.error || "No se pudo generar el itinerario";
        throw new Error(itineraryError?.message || itineraryError);
      }

      if (qualificationsRes.status === "fulfilled" && qualificationsRes.value?.success) {
        if (mountedRef.current) setQualifications(qualificationsRes.value.qualifications || []);
      } else {
        if (mountedRef.current) setQualifications([]);
      }
    } catch (err) {
      if (!silent && mountedRef.current) {
        setError(err?.message || "No se pudo cargar el itinerario");
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    loadData({ silent: Boolean(prefill) });
  }, [loadData, prefill]);

  const profesion =
    itinerario?.profesion_titulo || itinerario?.profesion || objetivo?.profesion?.titulo;
  const vias = itinerario?.vias_formativas || [];

  const stats = useMemo(
    () => ({
      totalVias: vias.length,
      totalQuals: qualifications.length,
      totalNotas: Object.keys(notasCorte).length,
    }),
    [vias, qualifications, notasCorte]
  );

  const filteredQualifications = useMemo(() => {
    return qualifications.filter((q) => {
      const text = `${q.codigo_cncp} ${q.denominacion} ${q.familia_profesional}`.toLowerCase();
      const bySearch = qSearch.trim() ? text.includes(qSearch.trim().toLowerCase()) : true;
      const byNivel = qNivel === "all" ? true : String(q.nivel) === qNivel;
      const byTipo = qTipo === "all" ? true : q.relacion_tipo === qTipo;
      return bySearch && byNivel && byTipo;
    });
  }, [qualifications, qSearch, qNivel, qTipo]);

  useEffect(() => {
    if (!profesion || profesion === "No especificada") return;

    generateImageForProfession({ profesion })
      .then((res) => {
        if (res?.success && res.imagenUrl) {
          setProfesionImage(res.imagenUrl);
        }
      })
      .catch(() => {
        setProfesionImage(null);
      });
  }, [profesion]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-green-50">
        <div className="text-center space-y-6 p-8">
          <div className="relative inline-block">
            <div className="animate-spin rounded-full h-20 w-20 border-4 border-transparent bg-gradient-to-r from-purple-600 to-green-600"></div>
            <div className="absolute inset-0 m-1 rounded-full bg-gradient-to-br from-purple-50 via-white to-green-50"></div>
          </div>
          <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-green-600 bg-clip-text text-transparent">
            Generando tu itinerario académico...
          </h3>
          <p className="text-gray-600 text-sm">
            Estamos creando un plan personalizado para tu futuro profesional
          </p>
        </div>
      </div>
    );
  }

  if (!objetivo || !objetivo?.profesion?.titulo) {
    return (
      <ItinerarioEmptyState
        title="Aún no tienes una profesión objetivo"
        message="Selecciona una profesión desde tu informe vocacional para crear un itinerario completo y personalizado."
      />
    );
  }

  if (error || !profesion || profesion === "No especificada") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-green-50 px-4 py-10">
        <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-lg border border-red-100 p-8 text-center">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">No pudimos cargar tu itinerario</h2>
          <p className="text-gray-600 mb-6">{error || "Ocurrió un error inesperado."}</p>
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <button
              onClick={() => loadData()}
              className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-green-600 text-white px-6 py-3 rounded-xl font-semibold shadow hover:opacity-95 transition cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              Reintentar
            </button>
            <button
              onClick={() => navigate("/mi-profesion")}
              className="inline-flex items-center justify-center gap-2 bg-white border border-purple-200 text-purple-700 px-6 py-3 rounded-xl font-semibold shadow hover:bg-purple-50 transition cursor-pointer"
            >
              <Target className="w-4 h-4" />
              Volver a Mi Profesión
            </button>
          </div>
        </div>
      </div>
    );
  }

  const tabClass = (id) =>
    `px-4 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer border ${
      activeTab === id
        ? "bg-gradient-to-r from-purple-600 to-green-600 text-white border-transparent shadow"
        : "bg-white text-gray-700 border-gray-200 hover:border-purple-300 hover:text-purple-700"
    }`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-green-50 px-4 py-10">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* Header */}
        <header className="text-center relative">
          <div className="absolute inset-x-0 top-1/2 h-px bg-gradient-to-r from-transparent via-purple-300 to-transparent"></div>
          <div className="relative inline-flex items-center gap-3 bg-white px-6 py-3 rounded-full shadow-lg border-2 border-purple-100">
            <GraduationCap className="w-7 h-7 text-purple-600" strokeWidth={2.5} />
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-600 to-green-600 bg-clip-text text-transparent">
              Itinerario Académico Inteligente
            </h1>
            <Sparkles className="w-7 h-7 text-green-500" strokeWidth={2.5} />
          </div>
        </header>

        {/* Hero card */}
        <section className="bg-white rounded-3xl border border-purple-100 shadow-xl p-6 md:p-8">
          <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 border border-purple-100 text-purple-700 text-xs font-bold uppercase tracking-wider">
                <Target className="w-3.5 h-3.5" /> Profesión objetivo
              </div>
              <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 leading-tight">
                {profesion}
              </h2>
              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" /> {itinerario?.ccaa || "España"}
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${
                    cached
                      ? "bg-green-50 border-green-200 text-green-700"
                      : "bg-blue-50 border-blue-200 text-blue-700"
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {cached ? "Itinerario cacheado" : "Itinerario actualizado"}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 w-full lg:w-auto">
              <div className="bg-purple-50 border border-purple-100 rounded-xl px-4 py-3 text-center">
                <p className="text-xs text-gray-500 uppercase">Vías</p>
                <p className="text-xl font-bold text-purple-700">{stats.totalVias}</p>
              </div>
              <div className="bg-green-50 border border-green-100 rounded-xl px-4 py-3 text-center">
                <p className="text-xs text-gray-500 uppercase">Cualificaciones</p>
                <p className="text-xl font-bold text-green-700">{stats.totalQuals}</p>
              </div>
              <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-center">
                <p className="text-xs text-gray-500 uppercase">Notas corte</p>
                <p className="text-xl font-bold text-amber-700">{stats.totalNotas}</p>
              </div>
            </div>
          </div>

          {profesionImage && (
            <div className="mt-6 rounded-2xl overflow-hidden border border-purple-100 shadow-lg">
              <img
                src={profesionImage}
                alt={`Imagen representativa de ${profesion}`}
                className="w-full h-64 md:h-80 object-cover"
              />
            </div>
          )}

          {refreshing && (
            <div className="mt-4 inline-flex items-center gap-2 rounded-full px-3 py-1.5 bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              Sincronizando datos actualizados...
            </div>
          )}

          {itinerario?.resumen && (
            <div className="mt-6 bg-gradient-to-r from-purple-50 to-green-50 rounded-xl border border-purple-100 p-4">
              <p className="text-sm text-gray-700 leading-relaxed">{itinerario.resumen}</p>
            </div>
          )}
        </section>

        {/* Tabs */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-lg p-4 md:p-5">
          <div className="flex flex-wrap gap-2" role="tablist" aria-label="Secciones del itinerario">
            <button
              role="tab"
              aria-selected={activeTab === "rutas"}
              className={tabClass("rutas")}
              onClick={() => setActiveTab("rutas")}
            >
              <Layers3 className="w-4 h-4 inline-block mr-1" /> Rutas formativas
            </button>
            <button
              role="tab"
              aria-selected={activeTab === "cncp"}
              className={tabClass("cncp")}
              onClick={() => setActiveTab("cncp")}
            >
              <BookOpen className="w-4 h-4 inline-block mr-1" /> Cualificaciones CNCP
            </button>
            <button
              role="tab"
              aria-selected={activeTab === "extras"}
              className={tabClass("extras")}
              onClick={() => setActiveTab("extras")}
            >
              <Briefcase className="w-4 h-4 inline-block mr-1" /> Recursos y recomendaciones
            </button>
          </div>
        </section>

        {/* Tab: Rutas formativas */}
        {activeTab === "rutas" && (
          <section className="space-y-4" role="tabpanel" aria-label="Rutas formativas">
            {vias.length === 0 ? (
              <div className="bg-white rounded-2xl border border-yellow-100 shadow p-6 text-center">
                <AlertCircle className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                <p className="text-gray-700">No hay rutas detalladas disponibles aún para esta profesión.</p>
              </div>
            ) : (
              vias.map((via, idx) => {
                const isOpen = expandedRoute === idx;
                const cfg = VIA_CONFIG[via.id] || VIA_CONFIG.autodidacta;
                return (
                  <article
                    key={`${via.id}-${idx}`}
                    className="bg-white rounded-2xl border border-purple-100 shadow-lg overflow-hidden"
                  >
                    <button
                      onClick={() => setExpandedRoute(isOpen ? -1 : idx)}
                      className="w-full text-left px-5 py-4 flex items-center justify-between gap-4 hover:bg-purple-50/60 transition cursor-pointer"
                      aria-expanded={isOpen}
                    >
                      <div>
                        <div
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold mb-1 ${cfg.bg} ${cfg.border} border ${cfg.text}`}
                        >
                          {cfg.label}
                        </div>
                        <h3 className="text-lg md:text-xl font-bold text-gray-900">
                          {via.titulo || `Vía ${idx + 1}`}
                        </h3>
                        {via.descripcion && (
                          <p className="mt-1 text-sm text-gray-500 line-clamp-1">{via.descripcion}</p>
                        )}
                      </div>
                      <ChevronDown
                        className={`w-5 h-5 text-purple-600 transition-transform flex-shrink-0 ${
                          isOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {isOpen && (
                      <div className="px-5 pb-5 border-t border-purple-100 bg-gradient-to-b from-white to-purple-50/30">
                        {/* Descripción completa */}
                        {via.descripcion && (
                          <p className="mt-4 text-sm text-gray-700 leading-relaxed">{via.descripcion}</p>
                        )}

                        {/* Requisitos de acceso */}
                        {Array.isArray(via.requisitos) && via.requisitos.length > 0 && (
                          <div className="mt-4 bg-amber-50 border border-amber-100 rounded-xl p-3">
                            <p className="text-xs uppercase text-amber-700 font-bold mb-2 flex items-center gap-1">
                              <ListChecks className="w-3.5 h-3.5" /> Requisitos de acceso
                            </p>
                            <ul className="space-y-1">
                              {via.requisitos.map((req, rIdx) => (
                                <li key={rIdx} className="text-sm text-gray-700 flex items-start gap-2">
                                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0"></span>
                                  {req}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Pasos */}
                        <ol className="space-y-3 mt-4">
                          {(via.pasos || []).map((paso, pasoIdx) => (
                            <li
                              key={`${paso.titulo}-${pasoIdx}`}
                              className={`relative rounded-xl p-4 border ${
                                paso.completado
                                  ? "bg-green-50 border-green-200"
                                  : "bg-white border-gray-200"
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <div
                                  className={`flex-shrink-0 w-8 h-8 rounded-full text-white text-sm font-bold flex items-center justify-center ${
                                    paso.completado
                                      ? "bg-green-500"
                                      : "bg-gradient-to-r from-purple-600 to-green-600"
                                  }`}
                                >
                                  {paso.completado ? (
                                    <CheckCircle2 className="w-4 h-4" />
                                  ) : (
                                    paso.orden || pasoIdx + 1
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h4 className="font-semibold text-gray-900">{paso.titulo}</h4>
                                    {paso.completado && (
                                      <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 border border-green-200 text-green-700 font-semibold">
                                        Completado
                                      </span>
                                    )}
                                    {paso.duracion_estimada && (
                                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 border border-gray-200 text-gray-600 inline-flex items-center gap-1">
                                        <Clock3 className="w-3 h-3" /> {paso.duracion_estimada}
                                      </span>
                                    )}
                                  </div>

                                  {paso.descripcion && (
                                    <p className="text-sm text-gray-600 mt-1">{paso.descripcion}</p>
                                  )}

                                  {/* Opciones del paso con notas de corte por universidad */}
                                  {Array.isArray(paso.opciones) && paso.opciones.length > 0 && (
                                    <div className="mt-3">
                                      <p className="text-xs font-bold uppercase text-gray-500 mb-2">
                                        Opciones disponibles
                                      </p>
                                      <ul className="space-y-3">
                                        {paso.opciones.map((opcion, opIdx) => {
                                          const nc = notasCorte[opcion.nombre]; // array de universidades
                                          return (
                                            <li
                                              key={opIdx}
                                              className={`rounded-xl border overflow-hidden ${
                                                opcion.completado
                                                  ? "border-green-200"
                                                  : "border-gray-200"
                                              }`}
                                            >
                                              {/* Cabecera de la opción */}
                                              <div
                                                className={`flex items-center gap-2 px-3 py-2 text-sm ${
                                                  opcion.completado
                                                    ? "bg-green-50 text-green-800"
                                                    : "bg-gray-50 text-gray-800"
                                                }`}
                                              >
                                                {opcion.completado && (
                                                  <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                                                )}
                                                <span className="font-medium flex-1">{opcion.nombre}</span>
                                                {nc && nc.length > 0 && (
                                                  <span className="ml-auto flex-shrink-0 text-xs px-2 py-0.5 rounded-full bg-amber-100 border border-amber-200 text-amber-700 font-semibold">
                                                    {nc.length} {nc.length === 1 ? "universidad" : "universidades"} · {nc[0].nota}–{nc[nc.length - 1].nota}
                                                  </span>
                                                )}
                                              </div>

                                              {/* Tabla de universidades con nota de corte */}
                                              {nc && nc.length > 0 && (
                                                <div className="max-h-52 overflow-y-auto border-t border-amber-100">
                                                  <table className="w-full text-xs">
                                                    <thead className="sticky top-0 bg-amber-50 border-b border-amber-100">
                                                      <tr>
                                                        <th className="px-3 py-1.5 text-left text-amber-900 font-semibold">Universidad</th>
                                                        <th className="px-3 py-1.5 text-left text-amber-700 font-medium hidden sm:table-cell">Provincia</th>
                                                        <th className="px-3 py-1.5 text-right text-amber-900 font-semibold">Nota corte</th>
                                                      </tr>
                                                    </thead>
                                                    <tbody>
                                                      {nc.map((u, uIdx) => (
                                                        <tr
                                                          key={uIdx}
                                                          className="border-t border-amber-50 hover:bg-amber-50/60 transition-colors"
                                                        >
                                                          <td className="px-3 py-1.5 text-gray-800 font-medium leading-snug">
                                                            {u.universidad}
                                                            {u.centro && u.centro !== u.universidad && (
                                                              <span className="block text-gray-500 font-normal">{u.centro}</span>
                                                            )}
                                                          </td>
                                                          <td className="px-3 py-1.5 text-gray-600 hidden sm:table-cell">
                                                            {u.provincia ?? u.ccaa ?? "—"}
                                                          </td>
                                                          <td className="px-3 py-1.5 text-right font-bold text-amber-700">
                                                            {u.nota}
                                                          </td>
                                                        </tr>
                                                      ))}
                                                    </tbody>
                                                  </table>
                                                  {nc[0]?.anio && (
                                                    <p className="px-3 py-1 text-right text-xs text-gray-400 border-t border-amber-50">
                                                      Datos QEDU {nc[0].anio}
                                                    </p>
                                                  )}
                                                </div>
                                              )}
                                            </li>
                                          );
                                        })}
                                      </ul>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </li>
                          ))}
                        </ol>

                        {/* Enlaces útiles */}
                        {Array.isArray(via.enlaces_utiles) && via.enlaces_utiles.length > 0 && (
                          <div className="mt-4 pt-4 border-t border-purple-100">
                            <p className="text-xs font-bold uppercase text-gray-500 mb-2 flex items-center gap-1">
                              <ExternalLink className="w-3.5 h-3.5" /> Enlaces útiles
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {via.enlaces_utiles.map((link, lIdx) => (
                                <a
                                  key={lIdx}
                                  href={link.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs px-3 py-1.5 rounded-full bg-purple-50 border border-purple-200 text-purple-700 hover:bg-purple-100 transition inline-flex items-center gap-1"
                                >
                                  <ExternalLink className="w-3 h-3" /> {link.titulo}
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </article>
                );
              })
            )}

            {/* Habilidades necesarias */}
            {Array.isArray(itinerario?.habilidades_necesarias) &&
              itinerario.habilidades_necesarias.length > 0 && (
                <article className="bg-white rounded-2xl border border-gray-100 shadow-lg p-5">
                  <h3 className="text-lg font-bold text-gray-900 mb-3 inline-flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-600" /> Habilidades clave para este perfil
                  </h3>
                  <ul className="grid md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {itinerario.habilidades_necesarias.map((h, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2 text-sm text-gray-700 bg-purple-50 border border-purple-100 rounded-xl px-3 py-2"
                      >
                        <span className="mt-1 w-1.5 h-1.5 rounded-full bg-purple-500 flex-shrink-0"></span>
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                </article>
              )}

            {/* Consejo final */}
            {itinerario?.consejo_final && (
              <article className="bg-gradient-to-r from-purple-50 to-green-50 border border-purple-100 rounded-2xl p-5">
                <h3 className="text-lg font-bold text-gray-900 mb-2 inline-flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-green-600" /> Consejo final
                </h3>
                <p className="text-sm text-gray-700 leading-relaxed">{itinerario.consejo_final}</p>
              </article>
            )}
          </section>
        )}

        {/* Tab: CNCP */}
        {activeTab === "cncp" && (
          <section className="space-y-4" role="tabpanel" aria-label="Cualificaciones CNCP">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-lg p-4 md:p-5">
              <div className="grid md:grid-cols-4 gap-3">
                <label className="md:col-span-2">
                  <span className="sr-only">Buscar cualificación</span>
                  <div className="relative">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Buscar por código o nombre..."
                      value={qSearch}
                      onChange={(e) => setQSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-200 focus:border-purple-400 outline-none"
                    />
                  </div>
                </label>

                <label className="relative">
                  <Filter className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <select
                    value={qNivel}
                    onChange={(e) => setQNivel(e.target.value)}
                    className="w-full appearance-none pl-9 pr-8 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-200 focus:border-purple-400 outline-none bg-white"
                  >
                    <option value="all">Todos los niveles</option>
                    <option value="1">Nivel 1</option>
                    <option value="2">Nivel 2</option>
                    <option value="3">Nivel 3</option>
                  </select>
                </label>

                <label className="relative">
                  <Filter className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <select
                    value={qTipo}
                    onChange={(e) => setQTipo(e.target.value)}
                    className="w-full appearance-none pl-9 pr-8 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-200 focus:border-purple-400 outline-none bg-white"
                  >
                    <option value="all">Todos los tipos</option>
                    <option value="obligatoria">Obligatoria</option>
                    <option value="recomendada">Recomendada</option>
                    <option value="complementaria">Complementaria</option>
                  </select>
                </label>
              </div>
            </div>

            <div className="text-sm text-gray-600 px-1">
              Mostrando {filteredQualifications.length} de {qualifications.length} cualificaciones.
            </div>

            {filteredQualifications.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 shadow p-6 text-center text-gray-600">
                No hay cualificaciones que coincidan con los filtros aplicados.
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {filteredQualifications.map((q) => (
                  <article
                    key={q.codigo_cncp}
                    className="bg-white rounded-2xl border border-purple-100 shadow-lg p-5 hover:shadow-xl transition"
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <p className="text-xs font-bold uppercase text-purple-700">{q.codigo_cncp}</p>
                        <h3 className="text-base font-semibold text-gray-900 leading-snug">
                          {q.denominacion}
                        </h3>
                      </div>
                      <span className="text-xs px-2 py-1 rounded-full border border-gray-200 bg-gray-50 text-gray-700">
                        Nivel {q.nivel}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-3">
                      <span className="text-xs px-2 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-700">
                        {q.familia_profesional}
                      </span>
                      {q.relacion_tipo && (
                        <span
                          className={`text-xs px-2 py-1 rounded-full border ${
                            q.relacion_tipo === "obligatoria"
                              ? "bg-red-50 border-red-100 text-red-700"
                              : q.relacion_tipo === "recomendada"
                              ? "bg-green-50 border-green-100 text-green-700"
                              : "bg-yellow-50 border-yellow-100 text-yellow-700"
                          }`}
                        >
                          {q.relacion_tipo}
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-gray-600">
                      Relevancia estimada:{" "}
                      <span className="font-semibold text-gray-800">{q.relacion_relevancia ?? 0}%</span>
                    </p>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Tab: Extras */}
        {activeTab === "extras" && (
          <section className="grid lg:grid-cols-2 gap-4" role="tabpanel" aria-label="Recursos y recomendaciones">
            <article className="bg-white rounded-2xl border border-gray-100 shadow-lg p-5">
              <h3 className="text-lg font-bold text-gray-900 mb-3 inline-flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-purple-600" /> Recomendaciones estratégicas
              </h3>
              {Array.isArray(itinerario?.recomendaciones) && itinerario.recomendaciones.length > 0 ? (
                <ul className="space-y-2 text-sm text-gray-700">
                  {itinerario.recomendaciones.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>
                        {typeof item === "object"
                          ? `${item.titulo}: ${item.descripcion}`
                          : item}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500">No hay recomendaciones disponibles.</p>
              )}
            </article>

            <article className="bg-white rounded-2xl border border-gray-100 shadow-lg p-5">
              <h3 className="text-lg font-bold text-gray-900 mb-3 inline-flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-green-600" /> Certificaciones opcionales
              </h3>
              {(itinerario?.certificaciones_opcionales || []).length > 0 ? (
                <ul className="space-y-2 text-sm text-gray-700">
                  {itinerario.certificaciones_opcionales.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500">
                  No hay certificaciones opcionales propuestas para esta ruta.
                </p>
              )}
            </article>

            {itinerario?.observaciones_especiales && (
              <article className="lg:col-span-2 bg-gradient-to-r from-purple-50 to-green-50 border border-purple-100 rounded-2xl p-5">
                <h3 className="text-lg font-bold text-gray-900 mb-2 inline-flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-600" /> Observaciones especiales
                </h3>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {itinerario.observaciones_especiales}
                </p>
              </article>
            )}
          </section>
        )}

        {/* Footer actions */}
        <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
          <button
            onClick={() => navigate("/mi-profesion")}
            className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-3 rounded-xl font-semibold shadow hover:opacity-95 transition cursor-pointer"
          >
            <Target className="w-4 h-4" /> Volver a Mi Profesión
          </button>
          <button
            onClick={() => loadData()}
            className="inline-flex items-center justify-center gap-2 bg-white border border-purple-200 text-purple-700 px-6 py-3 rounded-xl font-semibold shadow hover:bg-purple-50 transition cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" /> Actualizar itinerario
          </button>
          <button
            onClick={() => navigate("/resultados")}
            className="inline-flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 px-6 py-3 rounded-xl font-semibold shadow hover:bg-gray-50 transition cursor-pointer"
          >
            <Sparkles className="w-4 h-4" /> Ver resultados
          </button>
        </div>
      </div>
    </div>
  );
}
