import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  BookOpen, Building2, ChevronDown, ChevronUp, ExternalLink,
  Filter, GraduationCap, Loader2, Mail, MapPin, Moon, Phone, Search,
  Shield, Sun, Users, Wifi, X,
} from 'lucide-react';
import { getCatalogCenterPrograms, getCenterStudies, getLocalitySuggestions, getSearchSuggestions, getStudyFilters, searchPublicCompetitions, searchPublicStudies } from '../api';

// Iconos y labels para las modalidades de turno de bachillerato
const MODALITY_META = {
  Diurno:        { icon: Sun,   color: 'bg-yellow-100 text-yellow-700' },
  Nocturno:      { icon: Moon,  color: 'bg-indigo-100 text-indigo-700' },
  Vespertino:    { icon: Sun,   color: 'bg-orange-100 text-orange-700' },
  Distancia:     { icon: Wifi,  color: 'bg-sky-100    text-sky-700' },
  Semipresencial:{ icon: Wifi,  color: 'bg-teal-100   text-teal-700' },
  Virtual:       { icon: Wifi,  color: 'bg-purple-100 text-purple-700' },
};

// Niveles FP que activan los filtros secundarios de familia y titulación
const FP_LEVELS = ['FP Grado Superior', 'FP Grado Medio', 'FP Básica', 'Curso de Especialización'];

// Labels para los chips activos del sub-filtro de Otras enseñanzas
const ENS_TYPE_LABELS = {
  eso:               '📚 ESO',
  idiomas:           '🌍 Idiomas',
  musica:            '🎵 Música',
  danza:             '💃 Danza',
  teatro:            '🎭 Teatro',
  artes_plasticas:   '🎨 Artes Plásticas',
  deportivas:        '⚽ Deportivas',
  adultos:           '👤 Para adultos',
  acceso_fp_medio:   'Acceso FP Medio',
  acceso_fp_superior:'Acceso FP Superior',
  prueba_mayores_25: 'Mayores de 25 años',
  educacion_especial:'🧩 Educación Especial / NEE',
};

const IDIOMAS_EOI = [
  'Alemán', 'Árabe', 'Chino', 'Danés', 'Español para Extranjeros',
  'Finés', 'Francés', 'Griego', 'Inglés', 'Italiano', 'Japonés',
  'Neerlandés', 'Portugués', 'Ruso', 'Sueco',
];

// ---------------------------------------------------------------------------
// AutocompleteInput — input con desplegable de sugerencias filtradas
// ---------------------------------------------------------------------------
function AutocompleteInput({ value, onChange, onSelect, suggestions, placeholder, inputClassName = '' }) {
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);
  const containerRef = useRef(null);

  const filtered = useMemo(
    () =>
      value.length > 0
        ? suggestions.filter((s) => s.toLowerCase().includes(value.toLowerCase())).slice(0, 30)
        : suggestions.slice(0, 30),
    [value, suggestions],
  );

  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleKeyDown = (e) => {
    if (!open || filtered.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlighted((h) => Math.min(h + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlighted((h) => Math.max(h - 1, 0));
    } else if (e.key === 'Enter' && highlighted >= 0) {
      e.preventDefault();
      onSelect(filtered[highlighted]);
      onChange(filtered[highlighted]);
      setOpen(false);
      setHighlighted(-1);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          value={value}
          onChange={(e) => { onChange(e.target.value); setOpen(true); setHighlighted(-1); }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`w-full rounded-xl border bg-white py-2.5 pl-10 pr-8 text-sm outline-none focus:ring-2 ${inputClassName}`}
        />
        {value && (
          <button
            type="button"
            onClick={() => { onChange(''); onSelect(''); setOpen(false); }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      {open && filtered.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full rounded-xl border border-gray-200 bg-white py-1 shadow-lg max-h-60 overflow-y-auto">
          {filtered.map((s, i) => (
            <li
              key={s}
              onMouseDown={() => { onSelect(s); onChange(s); setOpen(false); setHighlighted(-1); }}
              className={`cursor-pointer px-4 py-2 text-sm ${highlighted === i ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'}`}
            >
              {s}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// CenterDetailModal — panel lateral con ficha completa del centro FP
// ---------------------------------------------------------------------------
function CenterDetailModal({ center, loading, onClose }) {
  const [programSearch, setProgramSearch] = useState('');

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', handleKey);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      {/* Panel slide-over desde la derecha */}
      <div className="relative ml-auto h-full w-full max-w-2xl bg-white shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-gray-200 px-6 py-4 shrink-0">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-orange-600 mb-1">Ficha del centro</p>
            <h2 className="text-xl font-bold text-gray-900 leading-snug">
              {loading ? 'Cargando...' : (center?.name || 'Centro')}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 rounded-xl border border-gray-200 p-2 text-gray-500 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="flex flex-1 items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
          </div>
        ) : !center ? (
          <div className="flex flex-1 items-center justify-center text-gray-500 text-sm">
            No se pudo cargar la información del centro.
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
            {/* Datos de contacto */}
            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 space-y-2.5 text-sm text-gray-700">
              {(center.address || center.municipality || center.locality || center.province) && (
                <p className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                  <span>{[center.address, center.municipality || center.locality, center.province].filter(Boolean).join(', ')}</span>
                </p>
              )}
              {center.autonomous_community && (
                <p className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-orange-500 shrink-0" />
                  <span>{center.autonomous_community}</span>
                </p>
              )}
              {center.phone && (
                <a href={`tel:${center.phone}`} className="flex items-center gap-2 hover:text-orange-700 transition-colors">
                  <Phone className="w-4 h-4 text-orange-500 shrink-0" />
                  <span>{center.phone}</span>
                </a>
              )}
              {center.email && (
                <a href={`mailto:${center.email}`} className="flex items-center gap-2 hover:text-orange-700 transition-colors">
                  <Mail className="w-4 h-4 text-orange-500 shrink-0" />
                  <span>{center.email}</span>
                </a>
              )}
              {center.website && (
                <a href={center.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 font-medium text-orange-700 hover:text-orange-800 hover:underline">
                  <ExternalLink className="w-4 h-4 shrink-0" />
                  <span>Web oficial</span>
                </a>
              )}
              {center.center_type && (
                <p className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-orange-500 shrink-0" />
                  <span>{center.center_type}</span>
                </p>
              )}
              {center.ownership && (
                <p className="flex items-center gap-2 text-gray-600">
                  <Building2 className="w-4 h-4 text-gray-400 shrink-0" />
                  <span>Titularidad: {center.ownership}</span>
                </p>
              )}
            </div>

            {/* Estudios ofertados */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="font-semibold text-gray-900">
                  Estudios ofertados
                  {center.programs_total != null && (
                    <span className="ml-2 text-xs font-normal text-gray-500">({center.programs_total} en total)</span>
                  )}
                </p>
              </div>

              {/* Buscador interno de programas */}
              <div className="relative mb-4">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  value={programSearch}
                  onChange={(e) => setProgramSearch(e.target.value)}
                  placeholder="Buscar en los estudios de este centro..."
                  className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-8 text-sm outline-none focus:ring-2 focus:ring-orange-400"
                />
                {programSearch && (
                  <button onClick={() => setProgramSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Grupos por nivel educativo */}
              {Object.entries(center.programs_grouped || {}).map(([level, programs]) => {
                const filteredPrograms = programSearch
                  ? programs.filter(
                      (p) =>
                        p.ensenanza?.toLowerCase().includes(programSearch.toLowerCase()) ||
                        p.familia?.toLowerCase().includes(programSearch.toLowerCase()),
                    )
                  : programs;
                if (filteredPrograms.length === 0) return null;

                return (
                  <div key={level} className="mb-5">
                    <p className="text-xs font-bold uppercase tracking-wide text-orange-700 mb-2">{level}</p>
                    <div className="space-y-2">
                      {filteredPrograms.map((p, idx) => (
                        <div key={idx} className="rounded-xl border border-orange-100 bg-orange-50/60 px-4 py-2.5">
                          <p className="text-sm font-semibold text-gray-900 leading-snug">{p.ensenanza}</p>
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            {p.familia && (
                              <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs text-orange-700">{p.familia}</span>
                            )}
                            {p.modalidad && (
                              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">{p.modalidad}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
              {center.programs_grouped && Object.keys(center.programs_grouped).length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">No hay estudios registrados para este centro.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Plataformas de matriculación por comunidad autónoma (datos estáticos)
// ─────────────────────────────────────────────────────────────────────────────
const MATRICULACION_DATA = [
  {
    ccaa: 'Nacional',
    emoji: '🇪🇸',
    color: 'border-purple-200 bg-purple-50',
    labelColor: 'text-purple-700',
    plataformas: [
      { label: 'TodoFP — Inscripciones y matrículas (Ministerio)', url: 'https://www.todofp.es/sobre-fp/actualidad/inscripciones-matriculas.html', tipo: 'FP' },
      { label: 'RUCT — Registro Universidades y Títulos Oficiales', url: 'https://www.educacion.gob.es/ruct/home', tipo: 'Universidad' },
    ],
  },
  {
    ccaa: 'Andalucía',
    emoji: '🌿',
    color: 'border-green-200 bg-green-50',
    labelColor: 'text-green-700',
    plataformas: [
      { label: 'Secretaría Virtual (FP, Bachillerato, otras enseñanzas)', url: 'https://secretariavirtual.juntadeandalucia.es/secretariavirtual/', tipo: 'FP / Bach.' },
      { label: 'Distrito Único Andaluz — Acceso a universidades', url: 'https://www.distritounicoandaluz.org/', tipo: 'Universidad' },
    ],
  },
  {
    ccaa: 'Comunidad de Madrid',
    emoji: '🏛️',
    color: 'border-red-200 bg-red-50',
    labelColor: 'text-red-700',
    plataformas: [
      { label: 'Raíces — Secretaría Virtual (FP, Bachillerato)', url: 'https://raices.madrid.org/secretariavirtual/', tipo: 'FP / Bach.' },
      { label: 'Preinscripción universitaria — Comunidad de Madrid', url: 'https://www.comunidad.madrid/servicios/educacion/solicitud-plaza-universitaria-preinscripcion', tipo: 'Universidad' },
    ],
  },
  {
    ccaa: 'Cataluña',
    emoji: '🔴',
    color: 'border-yellow-200 bg-yellow-50',
    labelColor: 'text-yellow-700',
    plataformas: [
      { label: 'Preinscripció FP i Batxillerat (Gencat)', url: 'https://preinscripcio.gencat.cat/', tipo: 'FP / Bach.' },
      { label: 'Accés Universitat — Canal Universitats', url: 'https://accesuniversitat.gencat.cat/', tipo: 'Universidad' },
    ],
  },
  {
    ccaa: 'Comunitat Valenciana',
    emoji: '🟠',
    color: 'border-orange-200 bg-orange-50',
    labelColor: 'text-orange-700',
    plataformas: [
      { label: 'Admisión FP — GVA Conselleria Educació', url: 'https://ceice.gva.es/es/web/formacion-profesional/admision-alumnado-en-ciclos-formativos', tipo: 'FP' },
      { label: 'Preinscripción universitaria (GVA)', url: 'https://www.gva.es/es/inici/procediments?id_proc=1109', tipo: 'Universidad' },
    ],
  },
  {
    ccaa: 'Galicia',
    emoji: '🌊',
    color: 'border-sky-200 bg-sky-50',
    labelColor: 'text-sky-700',
    plataformas: [
      { label: 'Admisión FP — Sede electrónica Xunta de Galicia', url: 'https://sede.xunta.gal/es/detalle-procedemento?codtram=ED519A', tipo: 'FP' },
      { label: 'CIUG — Comisión Interuniversitaria de Galicia', url: 'https://ciug.gal/', tipo: 'Universidad' },
    ],
  },
  {
    ccaa: 'País Vasco / Euskadi',
    emoji: '🟢',
    color: 'border-emerald-200 bg-emerald-50',
    labelColor: 'text-emerald-700',
    plataformas: [
      { label: 'Admisión FP — Hezkuntza (Eusko Jaurlaritza)', url: 'https://www.hezkuntza.eus/es/fp', tipo: 'FP' },
      { label: 'Preinscripción UPV/EHU (GAUR)', url: 'https://gestion-servicios.ehu.eus/', tipo: 'Universidad' },
    ],
  },
  {
    ccaa: 'Castilla y León',
    emoji: '🏰',
    color: 'border-amber-200 bg-amber-50',
    labelColor: 'text-amber-700',
    plataformas: [
      { label: 'Tramita CyL — Admisión FP virtual (Junta CyL)', url: 'https://www.tramitacastillayleon.jcyl.es/', tipo: 'FP / Bach.' },
    ],
  },
  {
    ccaa: 'Aragón',
    emoji: '⚔️',
    color: 'border-stone-200 bg-stone-50',
    labelColor: 'text-stone-700',
    plataformas: [
      { label: 'Admisión FP y Bachillerato — Gobierno de Aragón', url: 'https://www.aragon.es/tramitador/-/tramite/admision-alumnos-centros-educativos', tipo: 'FP / Bach.' },
    ],
  },
  {
    ccaa: 'Canarias',
    emoji: '🌋',
    color: 'border-teal-200 bg-teal-50',
    labelColor: 'text-teal-700',
    plataformas: [
      { label: 'Admisión FP — Consejería Educación Canarias', url: 'https://www3.gobiernodecanarias.org/medusa/eforma/eva/course/view.php?id=1', tipo: 'FP' },
      { label: 'Distrito Universitario Canario (ANECA)', url: 'https://www.gobiernodecanarias.org/educacion/web/universidad/preinscripcion/', tipo: 'Universidad' },
    ],
  },
];

function MatriculacionPlatforms() {
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-10 rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-purple-50 shadow-sm">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left"
      >
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-indigo-100 p-2.5 text-indigo-600">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <p className="font-bold text-gray-900">¿Listo para matricularte?</p>
            <p className="text-sm text-gray-500 mt-0.5">Accede a las plataformas oficiales de admisión de tu comunidad autónoma</p>
          </div>
        </div>
        <ChevronDown className={`w-5 h-5 text-indigo-500 shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="px-6 pb-6 border-t border-indigo-100 pt-4">
          <p className="text-xs text-gray-400 mb-4">
            ℹ️ Los plazos de preinscripción y matrícula varían cada curso. Consulta siempre la plataforma oficial de tu CCAA.
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {MATRICULACION_DATA.map((ccaa) => (
              <div key={ccaa.ccaa} className={`rounded-2xl border ${ccaa.color} p-4`}>
                <p className={`font-bold text-sm mb-2 flex items-center gap-1.5 ${ccaa.labelColor}`}>
                  <span>{ccaa.emoji}</span> {ccaa.ccaa}
                </p>
                <div className="space-y-2">
                  {ccaa.plataformas.map((p) => (
                    <a
                      key={p.url}
                      href={p.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-start gap-2 text-xs text-gray-700 hover:text-indigo-700 group"
                    >
                      <ExternalLink className="w-3 h-3 shrink-0 mt-0.5 text-gray-400 group-hover:text-indigo-500" />
                      <span className="group-hover:underline leading-snug">
                        {p.label}
                        <span className="ml-1.5 rounded-full bg-white/80 border border-gray-200 px-1.5 py-0.5 text-[10px] text-gray-500 not-italic">{p.tipo}</span>
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function StudySearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState({
    provinces: [],
    autonomous_communities: [],
    academic_levels: [],
    universities: [],
    bachillerato_vias: [],
    bachillerato_modalities: [],
    fp_families: [],
    fp_titles: [],
    certificate_families: [],
    modalities: [],
  });
  const [loading, setLoading] = useState(true);
  const [centerLoading, setCenterLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [selectedCenter, setSelectedCenter] = useState(null);
  const [expandedProgram, setExpandedProgram] = useState(null);
  const [centerFilter, setCenterFilter] = useState('');
  // Input local para la vía de bachillerato (texto libre antes de enviarlo al backend)
  const [viaInput, setViaInput] = useState('');
  // Inputs locales para los filtros de FP
  const [fpFamilyInput, setFpFamilyInput] = useState('');
  const [fpTitleInput, setFpTitleInput] = useState('');
  // Inputs locales para comunidad autónoma y localidad (con autocomplete)
  const [communityInput, setCommunityInput] = useState('');
  const [localityInput, setLocalityInput] = useState('');
  const [localitySuggestionsData, setLocalitySuggestionsData] = useState([]);
  const [searchSuggestionsData, setSearchSuggestionsData] = useState([]);

  // Estado para el tab de Oposiciones (endpoint separado)
  const [compResults, setCompResults] = useState([]);
  const [compPagination, setCompPagination] = useState(null);
  const [compLoading, setCompLoading] = useState(false);
  const [compFilters, setCompFilters] = useState({ scopes: [], access_types: [], groups: [] });


  const query = useMemo(() => ({
    search: searchParams.get('search') || '',
    province: searchParams.get('province') || '',
    academic_level: searchParams.get('academic_level') || '',
    source: searchParams.get('source') || 'all',
    university: searchParams.get('university') || '',
    center_id: searchParams.get('center_id') || '',
    catalog_center_id: searchParams.get('catalog_center_id') || '',
    page: searchParams.get('page') || '1',
    via: searchParams.get('via') || '',
    bachi_modality: searchParams.get('bachi_modality') || '',
    bachi_adults: searchParams.get('bachi_adults') === '1',
    fp_family: searchParams.get('fp_family') || '',
    fp_title: searchParams.get('fp_title') || '',
    cert_family: searchParams.get('cert_family') || '',
    ownership: searchParams.get('ownership') || '',
    modality: searchParams.get('modality') || '',
    locality: searchParams.get('locality') || '',
    community: searchParams.get('community') || '',
    double_degree: searchParams.get('double_degree') || '',
    distance_mode: searchParams.get('distance_mode') || '',
    university_offer: searchParams.get('university_offer') || '',
    university_modality: searchParams.get('university_modality') || '',
    ens_type: searchParams.get('ens_type') || '',
    idioma_name: searchParams.get('idioma_name') || '',
    // Oposiciones
    comp_scope: searchParams.get('comp_scope') || '',
    comp_access_type: searchParams.get('comp_access_type') || '',
    comp_group: searchParams.get('comp_group') || '',
    comp_date_from: searchParams.get('comp_date_from') || '',
    comp_date_to: searchParams.get('comp_date_to') || '',
    comp_page: searchParams.get('comp_page') || '1',
  }), [searchParams]);

  // Sincronizar viaInput con el param de la URL
  useEffect(() => {
    setViaInput(query.via);
  }, [query.via]);

  // Sincronizar fpFamilyInput y fpTitleInput con la URL
  useEffect(() => { setFpFamilyInput(query.fp_family); }, [query.fp_family]);
  useEffect(() => { setFpTitleInput(query.fp_title); }, [query.fp_title]);
  useEffect(() => { setCommunityInput(query.community); }, [query.community]);
  useEffect(() => { setLocalityInput(query.locality); }, [query.locality]);

  // Sugerencias de localidad — se recalculan al cambiar provincia o source
  useEffect(() => {
    getLocalitySuggestions(query.province, query.source).then((data) => {
      if (data?.success) setLocalitySuggestionsData(data.localities || []);
    });
  }, [query.province, query.source]);

  // Sugerencias del buscador principal — debounce 300 ms
  useEffect(() => {
    if (!query.search || query.search.length < 2) {
      setSearchSuggestionsData([]);
      return;
    }
    const timer = setTimeout(() => {
      getSearchSuggestions(query.search, query.source).then((data) => {
        if (data?.success) setSearchSuggestionsData(data.suggestions || []);
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [query.search, query.source]);

  useEffect(() => {
    getStudyFilters().then((data) => {
      if (data?.success) {
        setFilters({
          provinces: [],
          academic_levels: [],
          universities: [],
          bachillerato_vias: [],
          bachillerato_modalities: [],
          ...data.filters,
        });
      }
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    // Las oposiciones usan su propio endpoint y useEffect
    if (query.source === 'oposiciones') {
      setLoading(false);
      setResults([]);
      return;
    }

    searchPublicStudies(query)
      .then((data) => {
        if (cancelled) return;
        const payload = data?.results;
        setResults(payload?.data || []);
        setPagination(payload ? {
          current_page: payload.current_page,
          last_page: payload.last_page,
          total: payload.total,
        } : null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [query]);

  // useEffect exclusivo para el tab Oposiciones
  useEffect(() => {
    if (query.source !== 'oposiciones') return;
    let cancelled = false;
    setCompLoading(true);
    searchPublicCompetitions({
      search: query.search,
      scope: query.comp_scope,
      access_type: query.comp_access_type,
      group: query.comp_group,
      date_from: query.comp_date_from,
      date_to: query.comp_date_to,
      page: query.comp_page,
    }).then((data) => {
      if (cancelled) return;
      setCompResults(data?.results?.data || []);
      setCompPagination(data?.results ? {
        current_page: data.results.current_page,
        last_page: data.results.last_page,
        total: data.results.total,
      } : null);
      if (data?.filters) setCompFilters(data.filters);
    }).finally(() => {
      if (!cancelled) setCompLoading(false);
    });
    return () => { cancelled = true; };
  }, [query.source, query.search, query.comp_scope, query.comp_access_type, query.comp_group, query.comp_date_from, query.comp_date_to, query.comp_page]);


  // Cerrar panel expandido al cambiar búsqueda
  useEffect(() => {
    setExpandedProgram(null);
    setCenterFilter('');
  }, [query.search, query.province, query.academic_level, query.source, query.page, query.via, query.bachi_modality, query.bachi_adults, query.fp_family, query.fp_title, query.ownership, query.modality, query.locality, query.community, query.double_degree, query.distance_mode, query.university_offer, query.university_modality, query.ens_type, query.idioma_name]);

  useEffect(() => {
    if (!query.center_id && !query.catalog_center_id) {
      setSelectedCenter(null);
      return;
    }

    setCenterLoading(true);
    const request = query.catalog_center_id
      ? getCatalogCenterPrograms(query.catalog_center_id)
      : getCenterStudies(query.center_id);

    request
      .then((data) => {
        if (query.catalog_center_id) {
          setSelectedCenter(data?.success ? {
            ...data.center,
            source: 'catalog',
            degrees: Object.values(data.programs_grouped || {}).flat(),
            programs_grouped: data.programs_grouped || {},
            programs_total: data.programs_total || 0,
          } : null);
          return;
        }
        setSelectedCenter(data?.success ? { ...data.center, source: 'university' } : null);
      })
      .finally(() => setCenterLoading(false));
  }, [query.center_id, query.catalog_center_id]);

  const updateParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);

    if (key !== 'page') next.set('page', '1');

    // Al cambiar el nivel académico, limpiar filtros de bachillerato
    if (key === 'academic_level' && value !== 'Bachillerato') {
      next.delete('via');
      next.delete('bachi_modality');
      next.delete('bachi_adults');
    }

    // Al cambiar el nivel académico, limpiar filtros de FP si ya no es un nivel FP
    if (key === 'academic_level' && !FP_LEVELS.includes(value)) {
      next.delete('fp_family');
      next.delete('fp_title');
    }

    setSearchParams(next);
  };

  const updateSource = (value) => {
    const next = new URLSearchParams(searchParams);
    if (value && value !== 'all') next.set('source', value);
    else next.delete('source');

    // Limpiar filtros dependientes del tipo al cambiar fuente
    next.delete('center_id');
    next.delete('catalog_center_id');
    next.delete('via');
    next.delete('bachi_modality');
    next.delete('bachi_adults');
    next.delete('fp_family');
    next.delete('fp_title');
    next.delete('cert_family');
    next.delete('ownership');
    next.delete('modality');
    next.delete('locality');
    next.delete('community');
    next.delete('double_degree');
    next.delete('distance_mode');
    next.delete('university_offer');
    next.delete('university_modality');
    next.delete('ens_type');
    next.delete('idioma_name');
    next.delete('comp_scope');
    next.delete('comp_access_type');
    next.delete('comp_group');
    next.delete('comp_date_from');
    next.delete('comp_date_to');
    next.delete('comp_page');

    // Limpiar universidad en todos los casos excepto university/all
    if (!['university', 'all'].includes(value)) {
      next.delete('university');
      if (['Grado', 'Máster', 'Doctorado'].includes(query.academic_level)) {
        next.delete('academic_level');
      }
    }

    if (value === 'certificates' || value === 'bachillerato') {
      next.delete('academic_level');
    }

    if (value === 'fp') {
      // Mantener niveles FP, limpiar niveles no-FP
      if (!FP_LEVELS.includes(query.academic_level)) {
        next.delete('academic_level');
      }
    }

    if (value === 'educacion_secundaria') {
      const incompatible = [...FP_LEVELS, 'Bachillerato', 'Grado', 'Máster', 'Doctorado'];
      if (incompatible.includes(query.academic_level)) {
        next.delete('academic_level');
      }
    }

    if (value === 'university' && query.academic_level && !['Grado', 'Máster', 'Doctorado'].includes(query.academic_level)) {
      next.delete('academic_level');
    }

    next.set('page', '1');
    setSearchParams(next);
  };

  const toggleExpanded = (key) => {
    if (expandedProgram === key) {
      setExpandedProgram(null);
    } else {
      setExpandedProgram(key);
    }
    setCenterFilter('');
  };

  // Aplica la vía desde el input de texto
  const applyViaInput = () => {
    updateParam('via', viaInput.trim());
  };

  const visibleAcademicLevels = useMemo(() => {
    const uniLevels = ['Grado', 'Máster', 'Doctorado'];
    const fpLevels  = ['FP Grado Superior', 'FP Grado Medio', 'FP Básica', 'Curso de Especialización'];
    if (query.source === 'university')           return filters.academic_levels.filter((l) => uniLevels.includes(l));
    if (query.source === 'fp')                   return filters.academic_levels.filter((l) => fpLevels.includes(l));
    if (query.source === 'bachillerato')         return filters.academic_levels.filter((l) => l === 'Bachillerato');
    if (query.source === 'educacion_secundaria') return filters.academic_levels.filter((l) => !uniLevels.includes(l) && !fpLevels.includes(l) && l !== 'Bachillerato');
    if (query.source === 'catalog')              return filters.academic_levels.filter((l) => !uniLevels.includes(l));
    if (query.source === 'certificates')         return [];
    if (query.source === 'oposiciones')          return [];
    return filters.academic_levels;
  }, [filters.academic_levels, query.source]);

  const levelPlaceholder = query.source === 'university'
    ? 'Grado, máster o doctorado'
    : query.source === 'fp'
      ? 'Grado Superior, Medio, Básico o Especialización'
      : query.source === 'bachillerato'
        ? 'Vía académica (opcional)'
        : query.source === 'educacion_secundaria'
          ? 'Idiomas, artes, deportivas, adultos...'
          : query.source === 'catalog'
            ? 'FP, bachillerato o enseñanzas especiales'
            : query.source === 'certificates'
              ? 'Sin filtro de nivel (todos los niveles SEPE)'
              : query.source === 'oposiciones'
                ? 'No aplica (convocatorias del BOE)'
                : 'Universidad, FP o bachillerato';

  const sourceSummary = {
    all: 'Compara en una sola búsqueda estudios universitarios y opciones de FP o formación no universitaria.',
    university: 'Explora grados, másteres y doctorados impartidos por universidades y centros universitarios.',
    fp: 'Ciclos formativos de Formación Profesional: Grado Superior, Medio, Básico y Cursos de Especialización.',
    bachillerato: 'Bachillerato presencial, nocturno, a distancia y para adultos en centros de toda España.',
    educacion_secundaria: 'ESO, escuelas de idiomas, enseñanzas artísticas, deportivas, educación para adultos, pruebas de acceso y más.',
    catalog: 'Consulta ciclos formativos, bachillerato y otras enseñanzas oficiales no universitarias.',
    certificates: 'Certificados de Profesionalidad del catálogo SEPE — formación oficial acreditada por el SEPE.',
    oposiciones: 'Convocatorias de oposiciones y concursos de provisión publicados en el Boletín Oficial del Estado (BOE).',
  };

  // ¿Se muestran los filtros secundarios de bachillerato?
  const showBachFilters = (query.academic_level === 'Bachillerato' || query.source === 'bachillerato') && query.source !== 'university';
  // ¿Se muestran los filtros secundarios de FP?
  const showFpFilters = (FP_LEVELS.includes(query.academic_level) || query.source === 'fp') && query.source !== 'university';
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Cabecera + selectores de tipo */}
      <div className="mb-8 rounded-3xl border border-purple-100 bg-gradient-to-br from-purple-50 via-white to-green-50 p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-3">
          <div className="rounded-2xl bg-white p-3 shadow-sm border border-purple-100">
            <BookOpen className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Buscador de estudios</h1>
            <p className="text-gray-600">Encuentra qué puedes estudiar y en qué centros se imparte.</p>
          </div>
        </div>

        {/* Selector de tipo de estudio */}
        <div className="mt-6 rounded-2xl border border-white/80 bg-white/90 p-2 shadow-sm">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-5">
            {[
              { value: 'all',                  label: 'Todos',            description: 'Todo el catálogo',                  icon: BookOpen },
              { value: 'university',           label: 'Universidad',      description: 'Grado, Máster, Doctorado',           icon: GraduationCap },
              { value: 'fp',                   label: 'FP',               description: 'Ciclos y especialización',            icon: Building2 },
              { value: 'bachillerato',         label: 'Bachillerato',     description: 'Presencial, nocturno, distancia',    icon: GraduationCap },
              { value: 'educacion_secundaria', label: 'Otras enseñanzas', description: 'ESO, Idiomas, Artes, Deportivas...', icon: Users },
            ].map((option) => {
              const Icon = option.icon;
              const active = query.source === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => updateSource(option.value)}
                  className={`w-full rounded-2xl border px-4 py-4 text-left transition-all ${active ? 'border-purple-300 bg-linear-to-r from-purple-600 to-indigo-600 text-white shadow-lg' : 'border-gray-200 bg-white text-gray-700 hover:border-purple-200 hover:bg-purple-50'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`rounded-xl p-2 ${active ? 'bg-white/20' : 'bg-purple-100 text-purple-700'}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold">{option.label}</p>
                      <p className={`text-xs ${active ? 'text-purple-100' : 'text-gray-500'}`}>{option.description}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
          <p className="mt-3 px-2 text-sm text-gray-600">{sourceSummary[query.source] || sourceSummary.all}</p>
          <p className="mt-1.5 px-2 text-xs text-gray-400">
            ℹ️ Datos extraídos de fuentes oficiales del Ministerio de Educación y el SEPE. Actualizados periódicamente.
          </p>
        </div>

        {/* Filtros principales — Fila 1: comunidad autónoma, provincia, localidad */}
        <div className="grid gap-3 grid-cols-1 md:grid-cols-3 mt-6">
          <AutocompleteInput
            value={communityInput}
            onChange={(v) => { setCommunityInput(v); if (!v) updateParam('community', ''); }}
            onSelect={(v) => { setCommunityInput(v); updateParam('community', v); }}
            suggestions={filters.autonomous_communities || []}
            placeholder="Comunidad autónoma..."
            inputClassName="border-gray-300 focus:ring-purple-500"
          />

          <select
            value={query.province}
            onChange={(e) => updateParam('province', e.target.value)}
            className="rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="">Todas las provincias</option>
            {filters.provinces.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>

          <AutocompleteInput
            value={localityInput}
            onChange={(v) => { setLocalityInput(v); if (!v) updateParam('locality', ''); }}
            onSelect={(v) => { setLocalityInput(v); updateParam('locality', v); }}
            suggestions={localitySuggestionsData}
            placeholder="Localidad..."
            inputClassName="border-gray-300 focus:ring-purple-500"
          />
        </div>

        {/* Filtros principales — Fila 2: estudio, nivel académico, titularidad, modalidad */}
        <div className="grid gap-3 grid-cols-1 md:grid-cols-4 mt-3">
          <AutocompleteInput
            value={query.search}
            onChange={(v) => updateParam('search', v)}
            onSelect={(v) => updateParam('search', v)}
            suggestions={searchSuggestionsData}
            placeholder={query.source === 'catalog' ? 'Ej: Administración, laboratorio...' : 'Ej: Enfermería, Ingeniería Informática...'}
            inputClassName="border-gray-300 focus:ring-purple-500"
          />

          <select
            value={query.academic_level}
            onChange={(e) => updateParam('academic_level', e.target.value)}
            className="rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="">Todos los niveles</option>
            {visibleAcademicLevels.map((level) => <option key={level} value={level}>{level}</option>)}
          </select>

          {query.source !== 'certificates' ? (
            <select
              value={query.ownership}
              onChange={(e) => updateParam('ownership', e.target.value)}
              className="rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">Pública y privada</option>
              <option value="public">Pública</option>
              <option value="private">Privada</option>
            </select>
          ) : <div />}

          {!['university', 'certificates'].includes(query.source) ? (
            <select
              value={query.modality}
              onChange={(e) => updateParam('modality', e.target.value)}
              className="rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">Todas las modalidades</option>
              {(filters.modalities.length
                ? filters.modalities
                : ['Diurno', 'Vespertino', 'Nocturno', 'Distancia', 'Semipresencial', 'Dual', 'Virtual', 'En línea']
              ).map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          ) : <div />}
        </div>

        {/* ─── Filtros secundarios de Universidad ─── */}
        {query.source === 'university' && (
          <div className="mt-5 rounded-2xl border border-purple-200 bg-purple-50 p-4 space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <p className="text-sm font-semibold text-purple-900 flex items-center gap-2">
                <GraduationCap className="w-4 h-4" /> Filtros de Universidad
              </p>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 sm:justify-end">
                <a
                  href="https://www.educacion.gob.es/ruct/home"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-700 hover:text-purple-900 hover:underline"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> RUCT
                </a>
                <a
                  href="https://www.ciencia.gob.es/qedu.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-700 hover:text-purple-900 hover:underline"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> QEDU
                </a>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-purple-800 mb-1.5">Tipo de oferta</label>
                <select
                  value={query.university_offer}
                  onChange={(e) => {
                    const next = new URLSearchParams(searchParams);
                    if (e.target.value) next.set('university_offer', e.target.value);
                    else next.delete('university_offer');
                    next.delete('double_degree');
                    next.set('page', '1');
                    setSearchParams(next);
                  }}
                  className="w-full rounded-xl border border-purple-200 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-purple-400 text-sm text-gray-700"
                >
                  <option value="">Todos los tipos</option>
                  <option value="grado">Grado</option>
                  <option value="master">Máster</option>
                  <option value="doctorado">Doctorado</option>
                  <option value="doble_grado">Doble grado</option>
                  <option value="doble_master">Doble máster</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-purple-800 mb-1.5">Modalidad de impartición</label>
                <select
                  value={query.university_modality}
                  onChange={(e) => {
                    const next = new URLSearchParams(searchParams);
                    if (e.target.value) next.set('university_modality', e.target.value);
                    else next.delete('university_modality');
                    next.delete('distance_mode');
                    next.set('page', '1');
                    setSearchParams(next);
                  }}
                  className="w-full rounded-xl border border-purple-200 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-purple-400 text-sm text-gray-700"
                >
                  <option value="">Todas las modalidades</option>
                  <option value="online">Online</option>
                  <option value="presencial">Presencial</option>
                </select>
              </div>
            </div>
          </div>
        )}

        <p className="mt-3 text-sm text-gray-500">Nivel académico agrupado de forma inteligente: {levelPlaceholder}.</p>

        {/* ─── Filtros secundarios de Bachillerato ─── */}
        {showBachFilters && (
          <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <p className="text-sm font-semibold text-amber-900 flex items-center gap-2">
                <GraduationCap className="w-4 h-4" /> Filtros de Bachillerato
              </p>
              <a
                href="https://www.educacion.gob.es/centros/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 hover:text-amber-900 hover:underline sm:self-start"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Buscador oficial de centros educativos
              </a>
            </div>

            {/* Input vía + chips */}
            <div>
              <label className="block text-xs font-medium text-amber-800 mb-1.5">Vía / modalidad académica</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    value={viaInput}
                    onChange={(e) => setViaInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') applyViaInput(); }}
                    placeholder="Ej: Artes, Ciencias, Humanidades..."
                    className="w-full rounded-xl border border-amber-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
                {viaInput !== query.via && (
                  <button
                    onClick={applyViaInput}
                    className="rounded-xl border border-amber-300 bg-amber-100 px-3 py-2 text-sm font-semibold text-amber-800 hover:bg-amber-200"
                  >
                    Buscar
                  </button>
                )}
                {query.via && (
                  <button
                    onClick={() => { setViaInput(''); updateParam('via', ''); }}
                    className="rounded-xl border border-amber-200 bg-white px-3 py-2 text-sm text-amber-700 hover:bg-amber-50"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Chips de vías predefinidas */}
              <div className="flex flex-wrap gap-2 mt-2">
                {filters.bachillerato_vias.map((v) => (
                  <button
                    key={v}
                    onClick={() => { setViaInput(v); updateParam('via', v); }}
                    className={`rounded-full border px-3 py-1 text-xs font-semibold transition-all ${
                      query.via === v
                        ? 'border-amber-400 bg-amber-400 text-white'
                        : 'border-amber-200 bg-white text-amber-700 hover:bg-amber-100'
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>

            {/* Turno / modalidad horaria */}
            <div>
              <label className="block text-xs font-medium text-amber-800 mb-1.5">Turno</label>
              <div className="flex flex-wrap gap-2">
                {(filters.bachillerato_modalities.length ? filters.bachillerato_modalities : ['Diurno', 'Nocturno', 'Vespertino', 'Distancia', 'Semipresencial', 'Virtual']).map((m) => {
                  const meta = MODALITY_META[m] || { color: 'bg-gray-100 text-gray-700' };
                  const Icon = meta.icon;
                  const active = query.bachi_modality === m;
                  return (
                    <button
                      key={m}
                      onClick={() => updateParam('bachi_modality', active ? '' : m)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5 transition-all ${
                        active
                          ? 'border-amber-400 bg-amber-400 text-white'
                          : `border-transparent ${meta.color} hover:opacity-80`
                      }`}
                    >
                      {Icon && <Icon className="w-3 h-3" />} {m}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Para adultos / mayores */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => updateParam('bachi_adults', query.bachi_adults ? '' : '1')}
                className={`rounded-full border px-4 py-1.5 text-xs font-semibold flex items-center gap-2 transition-all ${
                  query.bachi_adults
                    ? 'border-amber-400 bg-amber-400 text-white'
                    : 'border-amber-200 bg-white text-amber-700 hover:bg-amber-100'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                Solo para adultos / mayores de 25
              </button>
            </div>
          </div>
        )}

        {/* ─── Filtros secundarios de FP ─── */}
        {showFpFilters && (
          <div className="mt-5 rounded-2xl border border-blue-200 bg-blue-50 p-4 space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <p className="text-sm font-semibold text-blue-900 flex items-center gap-2">
                <GraduationCap className="w-4 h-4" /> Filtros de {query.academic_level}
              </p>
              <a
                href="https://www.educacion.gob.es/centros/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-700 hover:text-blue-900 hover:underline sm:self-start"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Buscador oficial de centros educativos
              </a>
            </div>

            {/* Familia profesional */}
            <div>
              <label className="block text-xs font-medium text-blue-800 mb-1.5">Familia profesional</label>
              <AutocompleteInput
                value={fpFamilyInput}
                onChange={(v) => {
                  setFpFamilyInput(v);
                  if (!v) updateParam('fp_family', '');
                }}
                onSelect={(v) => { setFpFamilyInput(v); updateParam('fp_family', v); }}
                suggestions={filters.fp_families}
                placeholder="Ej: Informática, Sanidad, Administración..."
                inputClassName="border-blue-200 focus:ring-blue-400"
              />
            </div>

            {/* Titulación */}
            <div>
              <label className="block text-xs font-medium text-blue-800 mb-1.5">Titulación (nombre del ciclo)</label>
              <AutocompleteInput
                value={fpTitleInput}
                onChange={(v) => {
                  setFpTitleInput(v);
                  if (!v) updateParam('fp_title', '');
                }}
                onSelect={(v) => { setFpTitleInput(v); updateParam('fp_title', v); }}
                suggestions={filters.fp_titles}
                placeholder="Ej: Desarrollo de Aplicaciones Web, Enfermería..."
                inputClassName="border-blue-200 focus:ring-blue-400"
              />
            </div>
          </div>
        )}

        {/* ─── Sub-filtros de Otras enseñanzas (educacion_secundaria) ─── */}
        {query.source === 'educacion_secundaria' && (
          <div className="mt-5 rounded-2xl border border-teal-200 bg-teal-50 p-4 space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <p className="text-sm font-semibold text-teal-900 flex items-center gap-2">
                <BookOpen className="w-4 h-4" /> Filtros de Otras enseñanzas
              </p>
              <a
                href="https://www.educacion.gob.es/centros/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-teal-700 hover:text-teal-900 hover:underline sm:self-start"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Buscador oficial de centros educativos
              </a>
            </div>

            {/* Select: tipo de enseñanza */}
            <div>
              <label className="block text-xs font-medium text-teal-800 mb-1.5">Tipo de enseñanza</label>
              <select
                value={query.ens_type}
                onChange={(e) => {
                  const p = new URLSearchParams(searchParams);
                  e.target.value ? p.set('ens_type', e.target.value) : p.delete('ens_type');
                  p.delete('idioma_name');
                  p.delete('page');
                  setSearchParams(p);
                }}
                className="w-full rounded-xl border border-teal-200 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-teal-400 text-sm text-gray-700"
              >
                <option value="">Todas las enseñanzas</option>
                <option value="eso">📚 ESO</option>
                <option value="idiomas">🌍 Idiomas</option>
                <optgroup label="Artes">
                  <option value="artes_plasticas">🎨 Artes Plásticas y Diseño</option>
                  <option value="musica">🎵 Música</option>
                  <option value="danza">💃 Danza</option>
                  <option value="teatro">🎭 Teatro / Arte Dramático</option>
                </optgroup>
                <optgroup label="Otras">
                  <option value="deportivas">⚽ Enseñanzas Deportivas</option>
                  <option value="adultos">👤 Para adultos</option>
                  <option value="educacion_especial">🧩 Educación Especial / NEE</option>
                </optgroup>
                <optgroup label="Pruebas de acceso">
                  <option value="acceso_fp_medio">Acceso a FP Grado Medio</option>
                  <option value="acceso_fp_superior">Acceso a FP Grado Superior</option>
                  <option value="prueba_mayores_25">Mayores de 25 años</option>
                </optgroup>
              </select>
            </div>

            {/* Select: idioma específico (solo cuando ens_type=idiomas) */}
            {query.ens_type === 'idiomas' && (
              <div>
                <label className="block text-xs font-medium text-teal-800 mb-1.5">Idioma</label>
                <select
                  value={query.idioma_name}
                  onChange={(e) => updateParam('idioma_name', e.target.value)}
                  className="w-full rounded-xl border border-teal-200 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-teal-400 text-sm text-gray-700"
                >
                  <option value="">Todos los idiomas</option>
                  {IDIOMAS_EOI.map((idioma) => (
                    <option key={idioma} value={idioma}>{idioma}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}

        {/* ─── Filtros secundarios de Oposiciones ─── */}
        {query.source === 'oposiciones' && (
          <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-4">
            <p className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <Shield className="w-4 h-4" /> Filtros de Oposiciones
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Ámbito */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Ámbito</label>
                <select
                  value={query.comp_scope}
                  onChange={(e) => {
                    const next = new URLSearchParams(searchParams);
                    e.target.value ? next.set('comp_scope', e.target.value) : next.delete('comp_scope');
                    next.delete('comp_page');
                    setSearchParams(next);
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-slate-400 text-sm text-gray-700"
                >
                  <option value="">Todos los ámbitos</option>
                  {(compFilters.scopes?.length ? compFilters.scopes : ['estatal', 'autonómico', 'local', 'otro']).map((s) => (
                    <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                  ))}
                </select>
              </div>

              {/* Tipo de acceso */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Tipo de proceso</label>
                <select
                  value={query.comp_access_type}
                  onChange={(e) => {
                    const next = new URLSearchParams(searchParams);
                    e.target.value ? next.set('comp_access_type', e.target.value) : next.delete('comp_access_type');
                    next.delete('comp_page');
                    setSearchParams(next);
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-slate-400 text-sm text-gray-700"
                >
                  <option value="">Todos los tipos</option>
                  {(compFilters.access_types?.length ? compFilters.access_types : ['oposición', 'concurso', 'concurso-oposición']).map((t) => (
                    <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                  ))}
                </select>
              </div>

              {/* Grupo */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Grupo (A1, A2, C1…)</label>
                <select
                  value={query.comp_group}
                  onChange={(e) => {
                    const next = new URLSearchParams(searchParams);
                    e.target.value ? next.set('comp_group', e.target.value) : next.delete('comp_group');
                    next.delete('comp_page');
                    setSearchParams(next);
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-slate-400 text-sm text-gray-700"
                >
                  <option value="">Todos los grupos</option>
                  {(compFilters.groups?.filter(Boolean).length ? compFilters.groups.filter(Boolean) : ['A1', 'A2', 'C1', 'C2']).map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Rango de fechas */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Publicado desde</label>
                <input
                  type="date"
                  value={query.comp_date_from}
                  onChange={(e) => {
                    const next = new URLSearchParams(searchParams);
                    e.target.value ? next.set('comp_date_from', e.target.value) : next.delete('comp_date_from');
                    next.delete('comp_page');
                    setSearchParams(next);
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-slate-400 text-sm text-gray-700"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Publicado hasta</label>
                <input
                  type="date"
                  value={query.comp_date_to}
                  onChange={(e) => {
                    const next = new URLSearchParams(searchParams);
                    e.target.value ? next.set('comp_date_to', e.target.value) : next.delete('comp_date_to');
                    next.delete('comp_page');
                    setSearchParams(next);
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-slate-400 text-sm text-gray-700"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200">
              <a
                href="https://www.boe.es/diario_boe/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 hover:underline"
              >
                <ExternalLink className="w-3.5 h-3.5" /> BOE — Boletín Oficial del Estado (fuente oficial)
              </a>
            </div>
          </div>
        )}

        {/* Chips de filtros activos */}
        <div className="flex flex-wrap gap-2 mt-4 text-sm">
          {query.source !== 'all' && (
            <button onClick={() => updateSource('all')} className="rounded-full bg-gray-100 px-3 py-1 text-gray-700">
              Vista: {{
                university: 'Universidad',
                fp: 'FP',
                bachillerato: 'Bachillerato',
                educacion_secundaria: 'Otras enseñanzas',
                catalog: 'FP y no universitario',
                certificates: 'Certificados',
                oposiciones: 'Oposiciones',
              }[query.source] || query.source} ✕
            </button>
          )}
          {query.center_id && (
            <button onClick={() => updateParam('center_id', '')} className="rounded-full bg-indigo-100 px-3 py-1 text-indigo-700">
              Centro filtrado activo ✕
            </button>
          )}
          {query.catalog_center_id && (
            <button onClick={() => updateParam('catalog_center_id', '')} className="rounded-full bg-orange-100 px-3 py-1 text-orange-700">
              Centro FP filtrado activo ✕
            </button>
          )}
          {query.university && (
            <button onClick={() => updateParam('university', '')} className="rounded-full bg-purple-100 px-3 py-1 text-purple-700">
              Universidad: {query.university} ✕
            </button>
          )}
          {query.via && (
            <button onClick={() => { setViaInput(''); updateParam('via', ''); }} className="rounded-full bg-amber-100 px-3 py-1 text-amber-700">
              Vía: {query.via} ✕
            </button>
          )}
          {query.bachi_modality && (
            <button onClick={() => updateParam('bachi_modality', '')} className="rounded-full bg-amber-100 px-3 py-1 text-amber-700">
              Turno: {query.bachi_modality} ✕
            </button>
          )}
          {query.bachi_adults && (
            <button onClick={() => updateParam('bachi_adults', '')} className="rounded-full bg-amber-100 px-3 py-1 text-amber-700">
              Solo adultos ✕
            </button>
          )}
          {query.fp_family && (
            <button onClick={() => { setFpFamilyInput(''); updateParam('fp_family', ''); }} className="rounded-full bg-blue-100 px-3 py-1 text-blue-700">
              Familia: {query.fp_family} ✕
            </button>
          )}
          {query.fp_title && (
            <button onClick={() => { setFpTitleInput(''); updateParam('fp_title', ''); }} className="rounded-full bg-blue-100 px-3 py-1 text-blue-700">
              Titulación: {query.fp_title} ✕
            </button>
          )}
          {query.ownership && (
            <button onClick={() => updateParam('ownership', '')} className="rounded-full bg-gray-100 px-3 py-1 text-gray-700">
              Titularidad: {query.ownership === 'public' ? 'Pública' : 'Privada'} ✕
            </button>
          )}
          {query.modality && (
            <button onClick={() => updateParam('modality', '')} className="rounded-full bg-violet-100 px-3 py-1 text-violet-700">
              Modalidad: {query.modality} ✕
            </button>
          )}
          {query.locality && (
            <button onClick={() => { setLocalityInput(''); updateParam('locality', ''); }} className="rounded-full bg-gray-100 px-3 py-1 text-gray-700">
              Localidad: {query.locality} ✕
            </button>
          )}
          {query.community && (
            <button onClick={() => { setCommunityInput(''); updateParam('community', ''); }} className="rounded-full bg-teal-100 px-3 py-1 text-teal-700">
              Comunidad: {query.community} ✕
            </button>
          )}
          {query.university_offer && (
            <button onClick={() => updateParam('university_offer', '')} className="rounded-full bg-purple-100 px-3 py-1 text-purple-700">
              Tipo: {({ grado: 'Grado', master: 'Máster', doctorado: 'Doctorado', doble_grado: 'Doble grado', doble_master: 'Doble máster' })[query.university_offer] ?? query.university_offer} ✕
            </button>
          )}
          {query.university_modality && (
            <button onClick={() => updateParam('university_modality', '')} className="rounded-full bg-sky-100 px-3 py-1 text-sky-700">
              Modalidad: {query.university_modality === 'online' ? 'Online' : 'Presencial'} ✕
            </button>
          )}
          {query.ens_type && (
            <button onClick={() => { updateParam('ens_type', ''); updateParam('idioma_name', ''); }} className="rounded-full bg-teal-100 px-3 py-1 text-teal-700">
              {ENS_TYPE_LABELS[query.ens_type] ?? query.ens_type} ✕
            </button>
          )}
          {query.idioma_name && (
            <button onClick={() => updateParam('idioma_name', '')} className="rounded-full bg-teal-100 px-3 py-1 text-teal-700">
              Idioma: {query.idioma_name} ✕
            </button>
          )}
          {query.comp_scope && (
            <button onClick={() => { const next = new URLSearchParams(searchParams); next.delete('comp_scope'); setSearchParams(next); }} className="rounded-full bg-slate-200 px-3 py-1 text-slate-700">
              Ámbito: {query.comp_scope} ✕
            </button>
          )}
          {query.comp_access_type && (
            <button onClick={() => { const next = new URLSearchParams(searchParams); next.delete('comp_access_type'); setSearchParams(next); }} className="rounded-full bg-slate-200 px-3 py-1 text-slate-700">
              Tipo: {query.comp_access_type} ✕
            </button>
          )}
          {query.comp_group && (
            <button onClick={() => { const next = new URLSearchParams(searchParams); next.delete('comp_group'); setSearchParams(next); }} className="rounded-full bg-slate-200 px-3 py-1 text-slate-700">
              Grupo: {query.comp_group} ✕
            </button>
          )}
          {query.comp_date_from && (
            <button onClick={() => { const next = new URLSearchParams(searchParams); next.delete('comp_date_from'); setSearchParams(next); }} className="rounded-full bg-slate-200 px-3 py-1 text-slate-700">
              Desde: {query.comp_date_from} ✕
            </button>
          )}
          {query.comp_date_to && (
            <button onClick={() => { const next = new URLSearchParams(searchParams); next.delete('comp_date_to'); setSearchParams(next); }} className="rounded-full bg-slate-200 px-3 py-1 text-slate-700">
              Hasta: {query.comp_date_to} ✕
            </button>
          )}
        </div>
      </div>

      {/* Cuerpo — sidebar de filtros + resultados */}
      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <aside className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm h-fit">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-4 h-4 text-purple-600" />
            <h2 className="font-semibold text-gray-900">Filtros</h2>
          </div>

          {/* Filtro Universidad — solo visible en pestaña Universidad */}
          {query.source === 'university' && (
            <>
              <label className="block text-sm font-medium text-gray-700 mb-2">Universidad</label>
              <select
                value={query.university}
                onChange={(e) => updateParam('university', e.target.value)}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-purple-500 mb-4"
              >
                <option value="">Todas</option>
                {filters.universities.map((uni) => <option key={uni} value={uni}>{uni}</option>)}
              </select>
            </>
          )}

          <div className="mb-4 rounded-xl border border-purple-100 bg-purple-50 p-4 text-sm text-gray-700">
            <p className="font-semibold text-gray-900">Tipo de resultados</p>
            <p className="mt-1">{sourceSummary[query.source]}</p>
          </div>

          <div className="rounded-xl bg-gray-50 p-4 text-sm text-gray-600">
            <p className="font-semibold text-gray-800 mb-2">Consejo</p>
            <p>Primero elige el tipo de estudio. Después filtra por nombre, provincia o nivel. Si seleccionas Bachillerato, aparecen filtros adicionales de vía y turno.</p>
          </div>

          {(selectedCenter?.source === 'university' || (centerLoading && !query.catalog_center_id)) && (
            <div className="mt-4 rounded-xl border border-indigo-100 bg-indigo-50 p-4">
              <p className="text-sm font-semibold text-indigo-900 mb-2">Centro seleccionado</p>
              {centerLoading ? (
                <div className="flex items-center gap-2 text-sm text-indigo-700"><Loader2 className="w-4 h-4 animate-spin" /> Cargando centro...</div>
              ) : selectedCenter ? (
                <>
                  <p className="font-semibold text-gray-900">{selectedCenter.name}</p>
                  <p className="text-sm text-gray-700 mt-1">{selectedCenter.address}</p>
                  <p className="text-sm text-gray-700">{selectedCenter.municipality || selectedCenter.locality}, {selectedCenter.province}</p>
                  <p className="text-xs text-indigo-700 mt-2">{selectedCenter.degrees?.length || 0} estudios disponibles</p>
                  <div className="mt-3 space-y-2 text-sm text-gray-700">
                    {selectedCenter.phone && <p className="flex items-center gap-2"><Phone className="h-4 w-4 text-indigo-600" /> {selectedCenter.phone}</p>}
                    {selectedCenter.website && (
                      <a href={selectedCenter.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 font-medium text-indigo-700 hover:text-indigo-800 hover:underline">
                        <ExternalLink className="h-4 w-4" /> Web oficial
                      </a>
                    )}
                  </div>
                </>
              ) : null}
            </div>
          )}
        </aside>

        <section>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Resultados</h2>
              <p className="text-sm text-gray-600">
                {query.source === 'oposiciones'
                  ? (compPagination ? `${compPagination.total} convocatorias encontradas` : 'Buscando...')
                  : (pagination ? `${pagination.total} estudios encontrados` : 'Buscando...')}
              </p>
            </div>
            {query.source !== 'oposiciones' && (
              <Link to="/mapa" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">Ir al mapa</Link>
            )}
          </div>

          {query.source === 'oposiciones' ? (
            /* ── Tab Oposiciones ── */
            compLoading ? (
              <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center text-gray-600 shadow-sm">
                <Loader2 className="w-8 h-8 mx-auto mb-3 animate-spin text-slate-600" />
                Cargando convocatorias...
              </div>
            ) : compResults.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center text-gray-600 shadow-sm">
                No hay convocatorias con esos filtros. Prueba a cambiar el ámbito o el rango de fechas.
              </div>
            ) : (
              <div className="space-y-4">
                {compResults.map((comp) => (
                  <article key={comp.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="flex-1 min-w-0">
                        {/* Badges */}
                        <div className="flex flex-wrap gap-2 mb-3">
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 flex items-center gap-1">
                            <Shield className="w-3 h-3" /> {comp.access_type ? comp.access_type.charAt(0).toUpperCase() + comp.access_type.slice(1) : 'Oposición / Concurso'}
                          </span>
                          {comp.scope && (
                            <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                              📍 {comp.scope.charAt(0).toUpperCase() + comp.scope.slice(1)}
                            </span>
                          )}
                          {comp.group && (
                            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                              Grupo {comp.group}
                            </span>
                          )}
                          {comp.positions != null && (
                            <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                              {comp.positions} {comp.positions === 1 ? 'plaza' : 'plazas'}
                            </span>
                          )}
                          {comp.publication_date && (
                            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
                              📅 {new Date(comp.publication_date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </span>
                          )}
                        </div>

                        {/* Título */}
                        <h3 className="text-base font-bold text-gray-900 leading-snug">{comp.title}</h3>
                        {comp.organism && (
                          <p className="mt-1 text-sm text-gray-500">{comp.organism}</p>
                        )}
                        {comp.description && (
                          <p className="mt-2 text-sm text-gray-600 line-clamp-3">{comp.description}</p>
                        )}
                      </div>

                      {/* Links BOE */}
                      <div className="flex flex-col gap-2 lg:w-48 lg:shrink-0">
                        {comp.url_html && (
                          <a
                            href={comp.url_html}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-xl bg-slate-700 px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-slate-800 flex items-center justify-center gap-2"
                          >
                            <ExternalLink className="w-4 h-4" /> Leer en BOE ↗
                          </a>
                        )}
                        {comp.url_pdf && (
                          <a
                            href={comp.url_pdf}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-xl border border-slate-300 px-4 py-2.5 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-2"
                          >
                            📄 Descargar PDF
                          </a>
                        )}
                      </div>
                    </div>
                  </article>
                ))}

                {/* Paginación de oposiciones */}
                {compPagination && compPagination.last_page > 1 && (
                  <div className="flex items-center justify-center gap-2 pt-4">
                    <button
                      disabled={compPagination.current_page <= 1}
                      onClick={() => {
                        const next = new URLSearchParams(searchParams);
                        next.set('comp_page', String(compPagination.current_page - 1));
                        setSearchParams(next);
                      }}
                      className="rounded-xl border border-gray-300 px-4 py-2 text-sm disabled:opacity-50"
                    >Anterior</button>
                    <span className="text-sm text-gray-600">Página {compPagination.current_page} de {compPagination.last_page}</span>
                    <button
                      disabled={compPagination.current_page >= compPagination.last_page}
                      onClick={() => {
                        const next = new URLSearchParams(searchParams);
                        next.set('comp_page', String(compPagination.current_page + 1));
                        setSearchParams(next);
                      }}
                      className="rounded-xl border border-gray-300 px-4 py-2 text-sm disabled:opacity-50"
                    >Siguiente</button>
                  </div>
                )}
              </div>
            )
          ) : (
            /* ── Tabs de estudios normales ── */
            loading ? (
              <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center text-gray-600 shadow-sm">
                <Loader2 className="w-8 h-8 mx-auto mb-3 animate-spin text-purple-600" />
                Cargando estudios...
              </div>
            ) : results.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center text-gray-600 shadow-sm">
                No hay resultados con esos filtros.
              </div>
            ) : (
              <div className="space-y-4">
                {results.map((study) => {
                  const programKey = `${study.source}-${study.id}`;
                  const isExpanded = expandedProgram === programKey;
                  const isBach = study.canonical_via != null;

                  return (
                    <article
                      key={programKey}
                      className={`rounded-2xl border bg-white p-5 shadow-sm transition-shadow hover:shadow-md ${
                        study.source === 'certificate' ? 'border-emerald-200' :
                        study.source === 'catalog' ? 'border-orange-200' : 'border-gray-200'
                      }`}
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="flex-1">
                          {/* Badges */}
                          <div className="flex flex-wrap gap-2 mb-3">
                            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              study.source === 'certificate' ? 'bg-emerald-100 text-emerald-700' :
                              study.source === 'catalog' ? 'bg-orange-100 text-orange-700' :
                              'bg-indigo-100 text-indigo-700'
                            }`}>
                              {study.source === 'certificate' ? 'Certificado Prof.' : study.source === 'catalog' ? 'FP / no universitario' : 'Universidad'}
                            </span>
                            {study.academic_level_name && (
                              <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-700">
                                {study.academic_level_name}
                              </span>
                            )}
                            {study.branch_name && !isBach && (
                              <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                                {study.branch_name}
                              </span>
                            )}
                            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              study.source === 'certificate' ? 'bg-emerald-100 text-emerald-700' :
                              study.source === 'catalog' ? 'bg-orange-100 text-orange-700' :
                              'bg-indigo-100 text-indigo-700'
                            }`}>
                              {study.source === 'certificate'
                                ? `${study.total_hours || '?'} h totales`
                                : `${study.centers_count} ${study.centers_count === 1 ? 'centro' : 'centros'}`}
                            </span>
                            {study.nota_corte_min != null && (
                              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                                Nota corte: {study.nota_corte_min}{study.nota_corte_max != null && study.nota_corte_max !== study.nota_corte_min ? `–${study.nota_corte_max}` : ''}{study.nota_corte_anio ? ` (${study.nota_corte_anio})` : ''}
                              </span>
                            )}
                            {study.tiene_insercion && (
                              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                                Inserción: {study.insercion_tasa_afiliacion_min}%{study.insercion_tasa_afiliacion_max != null && study.insercion_tasa_afiliacion_max !== study.insercion_tasa_afiliacion_min ? `–${study.insercion_tasa_afiliacion_max}%` : ''}
                              </span>
                            )}
                            {study.insercion_salario_medio_min != null && (
                              <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700">
                                Salario: {Math.round(study.insercion_salario_medio_min).toLocaleString('es-ES')}€{study.insercion_salario_medio_max != null && study.insercion_salario_medio_max !== study.insercion_salario_medio_min ? `–${Math.round(study.insercion_salario_medio_max).toLocaleString('es-ES')}€` : ''}
                              </span>
                            )}
                          </div>

                          {/* Título */}
                          <h3 className="text-xl font-bold text-gray-900">{study.name}</h3>
                          {study.university?.name && (
                            <p className="mt-1 text-sm text-gray-600 flex items-center gap-2">
                              <Building2 className="w-4 h-4" /> {study.university.name}
                            </p>
                          )}
                          {study.field_name && !isBach && (
                            <p className="mt-2 text-sm text-gray-600">Área: {study.field_name}</p>
                          )}
                          {study.summary && <p className="mt-2 text-sm text-gray-600">{study.summary}</p>}
                          {study.tiene_insercion && (
                            <p className="mt-2 text-sm text-gray-600">
                              Datos QEDU disponibles en {study.qedu_centers_count || study.qedu_offers_count} centro{(study.qedu_centers_count || study.qedu_offers_count) === 1 ? '' : 's'}.
                            </p>
                          )}

                          {/* Info específica de certificados de profesionalidad */}
                          {study.source === 'certificate' && (
                            <div className="mt-3 flex flex-wrap gap-3 text-sm text-gray-600">
                              {study.online_hours > 0 && (
                                <span className="flex items-center gap-1.5 rounded-lg bg-sky-50 border border-sky-100 px-2.5 py-1 text-xs text-sky-700">
                                  <Wifi className="w-3 h-3" /> {study.online_hours} h teleformación
                                </span>
                              )}
                              {study.is_modular && (
                                <span className="flex items-center gap-1.5 rounded-lg bg-violet-50 border border-violet-100 px-2.5 py-1 text-xs text-violet-700">
                                  Modular
                                </span>
                              )}
                              {study.sepe_code && (
                                <span className="rounded-lg bg-gray-50 border border-gray-200 px-2.5 py-1 text-xs text-gray-500 font-mono">
                                  {study.sepe_code}
                                </span>
                              )}
                            </div>
                          )}

                          {/* Mini-grid centros (solo universidad) */}
                          {study.source === 'university' && study.centers.length > 0 && (
                            <div className="mt-4 grid gap-3 md:grid-cols-2">
                              {study.centers.slice(0, 4).map((center) => (
                                <div key={center.id} className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                                  <p className="font-semibold text-gray-900 text-sm">{center.name}</p>
                                  <p className="text-sm text-gray-600 mt-1">{center.address}</p>
                                  <p className="text-sm text-gray-600 flex items-center gap-1 mt-1"><MapPin className="w-3 h-3" /> {center.municipality || center.locality}, {center.province}</p>
                                  <div className="mt-2 space-y-1 text-sm text-gray-600">
                                    {center.phone && <p className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-indigo-600" /> {center.phone}</p>}
                                    {center.website && (
                                      <a href={center.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 font-medium text-indigo-700 hover:text-indigo-800 hover:underline">
                                        <ExternalLink className="h-3.5 w-3.5" /> Web del centro
                                      </a>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Columna derecha */}
                        {study.source === 'certificate' ? (
                          <div className="lg:w-56 flex flex-col gap-2 lg:shrink-0">
                            {study.detail_url && (
                              <a
                                href={study.detail_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="rounded-xl bg-emerald-600 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-emerald-700 flex items-center justify-center gap-2"
                              >
                                 <ExternalLink className="w-4 h-4" /> Buscar en SEPE ↗
                              </a>
                            )}
                          </div>
                        ) : study.source === 'catalog' ? (
                          <div className="lg:w-56 flex flex-col gap-2 lg:shrink-0">
                            <button
                              onClick={() => toggleExpanded(programKey)}
                              className={`rounded-xl border px-4 py-3 text-sm font-semibold transition-all flex items-center justify-center gap-2 ${isExpanded ? 'border-orange-300 bg-orange-100 text-orange-800' : 'border-orange-200 bg-white text-orange-700 hover:bg-orange-50'}`}
                            >
                              {isExpanded ? (
                                <><ChevronUp className="w-4 h-4" /> Ocultar centros</>
                              ) : (
                                <><ChevronDown className="w-4 h-4" /> Ver los {study.centers_count} centros</>
                              )}
                            </button>
                            {study.centers[0] && (
                              <Link
                                to={`/mapa?search=${encodeURIComponent(study.centers[0].name)}&province=${encodeURIComponent(study.centers[0].province || '')}`}
                                className="rounded-xl bg-orange-600 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-orange-700"
                              >
                                Ver en el mapa
                              </Link>
                            )}
                          </div>
                        ) : (
                          <div className="lg:w-60 flex flex-col gap-2 lg:shrink-0">
                            {study.centers[0] && (
                              <Link
                                to={`/mapa?search=${encodeURIComponent(study.centers[0].name)}&province=${encodeURIComponent(study.centers[0].province || '')}`}
                                className="rounded-xl bg-indigo-600 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-indigo-700"
                              >
                                Ver centro en mapa
                              </Link>
                            )}
                            {study.centers[0] && (
                              <button
                                onClick={() => updateParam('center_id', study.centers[0].id)}
                                className="rounded-xl border border-indigo-200 px-4 py-3 text-sm font-semibold text-indigo-700 hover:bg-indigo-50"
                              >
                                Filtrar por este centro
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Panel colapsable de centros (FP / Bachillerato) — no para certificados */}
                      {study.source === 'catalog' && isExpanded && (() => {
                        const lowerFilter = centerFilter.toLowerCase();
                        const filteredCenters = centerFilter
                          ? study.centers.filter((c) =>
                              c.name?.toLowerCase().includes(lowerFilter) ||
                              c.locality?.toLowerCase().includes(lowerFilter) ||
                              c.municipality?.toLowerCase().includes(lowerFilter) ||
                              c.province?.toLowerCase().includes(lowerFilter)
                            )
                          : study.centers;

                        return (
                          <div className="mt-4 border-t border-orange-100 pt-4">
                            {/* Filtro de texto */}
                            <div className="mb-4 relative">
                              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                              <input
                                value={centerFilter}
                                onChange={(e) => setCenterFilter(e.target.value)}
                                placeholder="Filtrar por nombre, localidad o provincia..."
                                className="w-full rounded-xl border border-orange-200 bg-white py-2.5 pl-10 pr-9 text-sm outline-none focus:ring-2 focus:ring-orange-400"
                              />
                              {centerFilter && (
                                <button
                                  onClick={() => setCenterFilter('')}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              )}
                            </div>

                            {filteredCenters.length === 0 ? (
                              <p className="text-center py-6 text-sm text-gray-500">
                                Ningún centro coincide con &quot;{centerFilter}&quot;
                              </p>
                            ) : (
                              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                                {filteredCenters.map((center) => (
                                  <div key={center.id} className="rounded-xl border border-orange-100 bg-orange-50 p-3 flex flex-col gap-1.5">
                                    <p className="font-semibold text-gray-900 text-sm leading-snug">{center.name}</p>
                                    <p className="text-xs text-gray-600 flex items-center gap-1">
                                      <MapPin className="w-3 h-3 shrink-0" />
                                      {center.municipality || center.locality}, {center.province}
                                    </p>
                                    {center.address && (
                                      <p className="text-xs text-gray-500 truncate">{center.address}</p>
                                    )}

                                    {/* Modalidades de turno (bachillerato) */}
                                    {isBach && center.modalities?.length > 0 && (
                                      <div className="flex flex-wrap gap-1 mt-1">
                                        {center.modalities.map((mod) => {
                                          const meta = MODALITY_META[mod] || { color: 'bg-gray-100 text-gray-700' };
                                          const Icon = meta.icon;
                                          return (
                                            <span key={mod} className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium ${meta.color}`}>
                                              {Icon && <Icon className="w-2.5 h-2.5" />} {mod}
                                            </span>
                                          );
                                        })}
                                        {center.has_adults && (
                                          <span className="inline-flex items-center gap-0.5 rounded-full bg-rose-100 px-2 py-0.5 text-xs font-medium text-rose-700">
                                            <Users className="w-2.5 h-2.5" /> Adultos
                                          </span>
                                        )}
                                      </div>
                                    )}

                                    {center.phone && (
                                      <p className="text-xs text-gray-700 flex items-center gap-1.5">
                                        <Phone className="h-3 w-3 text-orange-600 shrink-0" /> {center.phone}
                                      </p>
                                    )}
                                    {center.website && (
                                      <a
                                        href={center.website}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs font-medium text-orange-700 hover:text-orange-800 hover:underline flex items-center gap-1.5"
                                      >
                                        <ExternalLink className="h-3 w-3 shrink-0" /> Web del centro
                                      </a>
                                    )}
                                    <Link
                                      to={`/mapa?search=${encodeURIComponent(center.name)}&province=${encodeURIComponent(center.province || '')}`}
                                      className="text-xs font-medium text-orange-700 hover:text-orange-800 hover:underline flex items-center gap-1.5"
                                    >
                                      <MapPin className="h-3 w-3 shrink-0" /> Ver en el mapa
                                    </Link>
                                    <button
                                      onClick={() => updateParam('catalog_center_id', center.id)}
                                      className="mt-auto w-full rounded-lg border border-orange-200 bg-white px-3 py-1.5 text-xs font-semibold text-orange-700 hover:bg-orange-100 transition-colors"
                                    >
                                      Ver ficha completa →
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}

                            {centerFilter && filteredCenters.length > 0 && (
                              <p className="mt-3 text-xs text-gray-500 text-center">
                                {filteredCenters.length} de {study.centers_count} centros
                              </p>
                            )}
                          </div>
                        );
                      })()}
                    </article>
                  );
                })}

                {pagination && pagination.last_page > 1 && (
                  <div className="flex items-center justify-center gap-2 pt-4">
                    <button
                      disabled={pagination.current_page <= 1}
                      onClick={() => updateParam('page', String(pagination.current_page - 1))}
                      className="rounded-xl border border-gray-300 px-4 py-2 text-sm disabled:opacity-50"
                    >Anterior</button>
                    <span className="text-sm text-gray-600">Página {pagination.current_page} de {pagination.last_page}</span>
                    <button
                      disabled={pagination.current_page >= pagination.last_page}
                      onClick={() => updateParam('page', String(pagination.current_page + 1))}
                      className="rounded-xl border border-gray-300 px-4 py-2 text-sm disabled:opacity-50"
                    >Siguiente</button>
                  </div>
                )}
              </div>
            )
          )}
        </section>
      </div>

      {/* Modal de ficha completa del centro FP */}
      {query.catalog_center_id && (
        <CenterDetailModal
          center={selectedCenter?.source === 'catalog' ? selectedCenter : null}
          loading={centerLoading}
          onClose={() => updateParam('catalog_center_id', '')}
        />
      )}

      {/* Plataformas de matriculación por CCAA */}
      <MatriculacionPlatforms />
    </div>
  );
}
