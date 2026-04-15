import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Award, ChevronDown, ExternalLink, FileText, Loader2,
  MapPin, Search, Wifi, X,
} from 'lucide-react';
import { getLocalitySuggestions, getStudyFilters, searchPublicStudies } from '../../api';

// ─── AutocompleteInput (misma lógica que StudySearchPage) ────────────────────
function AutocompleteInput({ value, onChange, onSelect, suggestions, placeholder, inputClassName = '' }) {
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);
  const containerRef = useRef(null);

  const filtered = useMemo(
    () => value.length > 0
      ? suggestions.filter((s) => s.toLowerCase().includes(value.toLowerCase())).slice(0, 30)
      : suggestions.slice(0, 30),
    [value, suggestions],
  );

  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleKeyDown = (e) => {
    if (!open || filtered.length === 0) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setHighlighted((h) => Math.min(h + 1, filtered.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setHighlighted((h) => Math.max(h - 1, 0)); }
    else if (e.key === 'Enter' && highlighted >= 0) { e.preventDefault(); onSelect(filtered[highlighted]); onChange(filtered[highlighted]); setOpen(false); setHighlighted(-1); }
    else if (e.key === 'Escape') setOpen(false);
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
          className={`w-full rounded-xl border bg-white py-3 pl-10 pr-9 text-sm outline-none focus:ring-2 ${inputClassName}`}
        />
        {value && (
          <button type="button" onClick={() => { onChange(''); onSelect(''); setOpen(false); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
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
              className={`cursor-pointer px-4 py-2 text-sm ${highlighted === i ? 'bg-emerald-50 text-emerald-700' : 'text-gray-700 hover:bg-gray-50'}`}
            >
              {s}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const NIVEL_LABELS = { 1: 'Nivel 1', 2: 'Nivel 2', 3: 'Nivel 3' };

export default function CertificadosPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const query = useMemo(() => ({
    search:      searchParams.get('search') || '',
    cert_family: searchParams.get('cert_family') || '',
    community:   searchParams.get('community') || '',
    province:    searchParams.get('province') || '',
    locality:    searchParams.get('locality') || '',
    page:        searchParams.get('page') || '1',
    source:      'certificates',
  }), [searchParams]);

  const [results, setResults]         = useState([]);
  const [pagination, setPagination]   = useState(null);
  const [filters, setFilters]         = useState({ certificate_families: [], provinces: [], autonomous_communities: [] });
  const [loading, setLoading]         = useState(true);

  // inputs locales con autocomplete
  const [searchInput,    setSearchInput]    = useState(query.search);
  const [certFamilyInput, setCertFamilyInput] = useState(query.cert_family);
  const [communityInput, setCommunityInput] = useState(query.community);
  const [localityInput,  setLocalityInput]  = useState(query.locality);
  const [localitySuggestions, setLocalitySuggestions] = useState([]);

  useEffect(() => { setSearchInput(query.search); },        [query.search]);
  useEffect(() => { setCertFamilyInput(query.cert_family); }, [query.cert_family]);
  useEffect(() => { setCommunityInput(query.community); },   [query.community]);
  useEffect(() => { setLocalityInput(query.locality); },    [query.locality]);

  useEffect(() => {
    getStudyFilters().then((data) => {
      if (data?.success) setFilters(data.filters);
    });
  }, []);

  useEffect(() => {
    getLocalitySuggestions(query.province, 'certificates').then((data) => {
      if (data?.success) setLocalitySuggestions(data.localities || []);
    });
  }, [query.province]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    searchPublicStudies(query).then((data) => {
      if (cancelled) return;
      const payload = data?.results;
      setResults(payload?.data || []);
      setPagination(payload ? {
        current_page: payload.current_page,
        last_page:    payload.last_page,
        total:        payload.total,
      } : null);
    }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [query]);

  const updateParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    value ? next.set(key, value) : next.delete(key);
    if (key !== 'page') next.set('page', '1');
    setSearchParams(next);
  };

  const activeFilters = [
    query.search      && { key: 'search',      label: `"${query.search}"` },
    query.cert_family && { key: 'cert_family', label: `Familia: ${query.cert_family}` },
    query.community   && { key: 'community',   label: `CCAA: ${query.community}` },
    query.province    && { key: 'province',    label: `Provincia: ${query.province}` },
    query.locality    && { key: 'locality',    label: `Localidad: ${query.locality}` },
  ].filter(Boolean);

  return (
    <div className="container mx-auto px-4 py-8">

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div className="mb-8 rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-5">
          <div className="rounded-2xl bg-white p-3 shadow-sm border border-emerald-100">
            <Award className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Certificados de Profesionalidad</h1>
            <p className="text-gray-500 text-sm mt-0.5">
              Catálogo oficial del SEPE — formación acreditada reconocida en toda España
            </p>
          </div>
        </div>

        {/* Filtros */}
        <div className="grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
          <AutocompleteInput
            value={searchInput}
            onChange={(v) => { setSearchInput(v); if (!v) updateParam('search', ''); }}
            onSelect={(v) => { setSearchInput(v); updateParam('search', v); }}
            suggestions={[]}
            placeholder="Buscar certificado..."
            inputClassName="border-gray-300 focus:ring-emerald-400"
          />
          <AutocompleteInput
            value={certFamilyInput}
            onChange={(v) => { setCertFamilyInput(v); if (!v) updateParam('cert_family', ''); }}
            onSelect={(v) => { setCertFamilyInput(v); updateParam('cert_family', v); }}
            suggestions={filters.certificate_families}
            placeholder="Familia profesional..."
            inputClassName="border-gray-300 focus:ring-emerald-400"
          />
          <AutocompleteInput
            value={communityInput}
            onChange={(v) => { setCommunityInput(v); if (!v) updateParam('community', ''); }}
            onSelect={(v) => { setCommunityInput(v); updateParam('community', v); }}
            suggestions={filters.autonomous_communities || []}
            placeholder="Comunidad autónoma..."
            inputClassName="border-gray-300 focus:ring-emerald-400"
          />
          <select
            value={query.province}
            onChange={(e) => updateParam('province', e.target.value)}
            className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-emerald-400"
          >
            <option value="">Todas las provincias</option>
            {filters.provinces.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>

        {/* Búsqueda al presionar Enter en el input principal */}
        <div className="mt-3 flex justify-end">
          <button
            onClick={() => updateParam('search', searchInput.trim())}
            className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors"
          >
            Buscar
          </button>
        </div>

        {/* Chips activos */}
        {activeFilters.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {activeFilters.map((f) => (
              <button
                key={f.key}
                onClick={() => updateParam(f.key, '')}
                className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-200 transition-colors"
              >
                {f.label} ✕
              </button>
            ))}
            <button
              onClick={() => setSearchParams(new URLSearchParams())}
              className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-500 hover:bg-gray-200 transition-colors"
            >
              Limpiar todo
            </button>
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-400">
          <p>ℹ️ Datos del catálogo oficial del SEPE. Los centros de impartición se están integrando progresivamente.</p>
          <a
            href="https://sede.sepe.gob.es/especialidadesformativas/RXBuscadorEFRED/EntradaBuscadorCertificadosFormDual.do"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 underline hover:text-emerald-600"
          >
            <ExternalLink className="w-3 h-3" /> Buscador oficial SEPE
          </a>
        </div>
      </div>

      {/* ── Resultados ───────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-600">
          {loading
            ? 'Buscando certificados...'
            : pagination
              ? `${pagination.total.toLocaleString('es-ES')} certificados encontrados`
              : ''}
        </p>
        <a
          href="https://sede.sepe.gob.es/especialidadesformativas/RXBuscadorEFRED/EntradaBuscadorCertificadosFormDual.do"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
        >
          <ExternalLink className="w-3.5 h-3.5" /> SEPE oficial
        </a>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-16 text-center shadow-sm">
          <Loader2 className="w-8 h-8 mx-auto mb-3 animate-spin text-emerald-500" />
          <p className="text-gray-600">Cargando certificados...</p>
        </div>
      ) : results.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-16 text-center shadow-sm">
          <Award className="w-10 h-10 mx-auto mb-3 text-gray-300" />
          <p className="font-semibold text-gray-700">Sin resultados con esos filtros</p>
          <p className="text-sm text-gray-500 mt-1">Prueba a cambiar la familia profesional o ampliar la búsqueda.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {results.map((cert) => {
            const programKey = `${cert.source}-${cert.id}`;
            return (
              <article
                key={programKey}
                className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex-1 min-w-0">
                    {/* Badges */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                        Certificado Prof.
                      </span>
                      {cert.academic_level_name && (
                        <span className="rounded-full bg-teal-100 px-3 py-1 text-xs font-semibold text-teal-700">
                          {cert.academic_level_name}
                        </span>
                      )}
                      {cert.branch_name && (
                        <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                          {cert.branch_name}
                        </span>
                      )}
                      <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
                        {cert.total_hours || '?'} h totales
                      </span>
                    </div>

                    {/* Título */}
                    <h2 className="text-base font-bold text-gray-900 leading-snug">{cert.name}</h2>

                    {/* Metadata específica de certificados */}
                    <div className="mt-2 flex flex-wrap gap-2">
                      {cert.online_hours > 0 && (
                        <span className="flex items-center gap-1.5 rounded-lg bg-sky-50 border border-sky-100 px-2.5 py-1 text-xs text-sky-700">
                          <Wifi className="w-3 h-3" /> {cert.online_hours} h teleformación
                        </span>
                      )}
                      {cert.is_modular && (
                        <span className="rounded-lg bg-violet-50 border border-violet-100 px-2.5 py-1 text-xs text-violet-700">
                          Modular
                        </span>
                      )}
                      {cert.sepe_code && (
                        <span className="rounded-lg bg-gray-50 border border-gray-200 px-2.5 py-1 text-xs text-gray-500 font-mono">
                          {cert.sepe_code}
                        </span>
                      )}
                      {cert.centers_count > 0 && (
                        <span className="flex items-center gap-1 rounded-lg bg-emerald-50 border border-emerald-100 px-2.5 py-1 text-xs text-emerald-700">
                          <MapPin className="w-3 h-3" /> {cert.centers_count} {cert.centers_count === 1 ? 'centro' : 'centros'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Acción */}
                  <div className="lg:w-44 flex flex-col gap-2 lg:shrink-0">
                    {cert.detail_url && (
                      <a
                        href={cert.detail_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-xl bg-emerald-600 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-emerald-700 flex items-center justify-center gap-2 transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" /> Ver en SEPE
                      </a>
                    )}
                  </div>
                </div>
              </article>
            );
          })}

          {/* Paginación */}
          {pagination && pagination.last_page > 1 && (
            <div className="flex items-center justify-center gap-3 pt-4">
              <button
                disabled={pagination.current_page <= 1}
                onClick={() => updateParam('page', String(pagination.current_page - 1))}
                className="rounded-xl border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50 disabled:opacity-40 transition-colors"
              >
                Anterior
              </button>
              <span className="text-sm text-gray-600">
                Página {pagination.current_page} de {pagination.last_page}
              </span>
              <button
                disabled={pagination.current_page >= pagination.last_page}
                onClick={() => updateParam('page', String(pagination.current_page + 1))}
                className="rounded-xl border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50 disabled:opacity-40 transition-colors"
              >
                Siguiente
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
