import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Award, Building2, CalendarDays, ChevronDown, ExternalLink,
  FileText, Filter, Loader2, Search, Shield, X,
} from 'lucide-react';
import { searchPublicCompetitions } from '../../api';

// ─── AutocompleteInput reutilizable ───────────────────────────────────────────
function SearchInput({ value, onChange, placeholder }) {
  return (
    <div className="relative">
      <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-gray-300 bg-white py-3 pl-10 pr-9 text-sm outline-none focus:ring-2 focus:ring-orange-400"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

const SCOPE_LABELS = { estatal: 'Estatal', autonómico: 'Autonómico', local: 'Local' };
const ACCESS_LABELS = { 'oposición': 'Oposición', 'concurso': 'Concurso', 'concurso-oposición': 'Concurso-oposición' };

export default function OposicionesPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const query = useMemo(() => ({
    search:      searchParams.get('search') || '',
    scope:       searchParams.get('scope') || '',
    access_type: searchParams.get('access_type') || '',
    group:       searchParams.get('group') || '',
    page:        searchParams.get('page') || '1',
  }), [searchParams]);

  const [results, setResults]       = useState([]);
  const [pagination, setPagination] = useState(null);
  const [filters, setFilters]       = useState({ scopes: [], access_types: [], groups: [] });
  const [loading, setLoading]       = useState(true);
  const [searchInput, setSearchInput] = useState(query.search);

  // Sincronizar input con URL
  useEffect(() => { setSearchInput(query.search); }, [query.search]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    searchPublicCompetitions(query).then((data) => {
      if (cancelled) return;
      const payload = data?.results;
      setResults(payload?.data || []);
      setPagination(payload ? {
        current_page: payload.current_page,
        last_page:    payload.last_page,
        total:        payload.total,
      } : null);
      if (data?.filters) setFilters(data.filters);
    }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [query]);

  const updateParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    value ? next.set(key, value) : next.delete(key);
    if (key !== 'page') next.set('page', '1');
    setSearchParams(next);
  };

  const applySearch = () => updateParam('search', searchInput.trim());

  const activeFilters = [
    query.scope       && { key: 'scope',       label: `Ámbito: ${SCOPE_LABELS[query.scope] ?? query.scope}` },
    query.access_type && { key: 'access_type', label: `Tipo: ${ACCESS_LABELS[query.access_type] ?? query.access_type}` },
    query.group       && { key: 'group',        label: `Grupo: ${query.group}` },
    query.search      && { key: 'search',       label: `"${query.search}"` },
  ].filter(Boolean);

  return (
    <div className="container mx-auto px-4 py-8">

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div className="mb-8 rounded-3xl border border-orange-100 bg-gradient-to-br from-orange-50 via-white to-amber-50 p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-5">
          <div className="rounded-2xl bg-white p-3 shadow-sm border border-orange-100">
            <Shield className="w-6 h-6 text-orange-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Oposiciones públicas</h1>
            <p className="text-gray-500 text-sm mt-0.5">
              Convocatorias publicadas en el BOE — actualizadas periódicamente
            </p>
          </div>
        </div>

        {/* Buscador principal */}
        <div className="flex gap-2">
          <div className="flex-1">
            <SearchInput
              value={searchInput}
              onChange={setSearchInput}
              placeholder="Buscar por nombre de convocatoria u organismo..."
            />
          </div>
          <button
            onClick={applySearch}
            className="rounded-xl bg-orange-600 px-5 py-3 text-sm font-semibold text-white hover:bg-orange-700 transition-colors"
          >
            Buscar
          </button>
        </div>

        {/* Filtros: ámbito / tipo / grupo */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">

          {/* Ámbito */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Ámbito</p>
            <div className="flex flex-wrap gap-2">
              {(filters.scopes.length ? filters.scopes : ['estatal', 'autonómico', 'local']).map((s) => (
                <button
                  key={s}
                  onClick={() => updateParam('scope', query.scope === s ? '' : s)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold capitalize transition-all ${
                    query.scope === s
                      ? 'border-orange-400 bg-orange-500 text-white shadow-sm'
                      : 'border-orange-200 bg-white text-orange-700 hover:bg-orange-50'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Tipo de convocatoria */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Tipo</p>
            <div className="flex flex-wrap gap-2">
              {(filters.access_types.length
                ? filters.access_types
                : ['oposición', 'concurso', 'concurso-oposición']
              ).map((t) => (
                <button
                  key={t}
                  onClick={() => updateParam('access_type', query.access_type === t ? '' : t)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold capitalize transition-all ${
                    query.access_type === t
                      ? 'border-amber-400 bg-amber-500 text-white shadow-sm'
                      : 'border-amber-200 bg-white text-amber-700 hover:bg-amber-50'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Grupo */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Grupo</p>
            <div className="flex flex-wrap gap-2">
              {(filters.groups.length ? filters.groups : ['A1', 'A2', 'C1', 'C2', 'E']).map((g) => (
                <button
                  key={g}
                  onClick={() => updateParam('group', query.group === g ? '' : g)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-all ${
                    query.group === g
                      ? 'border-indigo-400 bg-indigo-500 text-white shadow-sm'
                      : 'border-indigo-200 bg-white text-indigo-700 hover:bg-indigo-50'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Chips de filtros activos */}
        {activeFilters.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {activeFilters.map((f) => (
              <button
                key={f.key}
                onClick={() => updateParam(f.key, '')}
                className="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700 hover:bg-orange-200 transition-colors"
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

        {/* Nota BOE */}
        <p className="mt-4 text-xs text-gray-400">
          ℹ️ Datos extraídos del BOE (Boletín Oficial del Estado). Para convocatorias autonómicas consulta también el BOJA, BORM, DOGC, etc.
          {' '}
          <a
            href="https://www.boe.es/buscar/boe.php"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-orange-600"
          >
            Buscar directamente en el BOE →
          </a>
        </p>
      </div>

      {/* ── Resultados ───────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-600">
          {loading
            ? 'Buscando convocatorias...'
            : pagination
              ? `${pagination.total.toLocaleString('es-ES')} convocatorias encontradas`
              : ''}
        </p>
        <a
          href="https://www.boe.es/buscar/boe.php"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-semibold text-orange-600 hover:text-orange-700 flex items-center gap-1"
        >
          <ExternalLink className="w-3.5 h-3.5" /> BOE oficial
        </a>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-16 text-center shadow-sm">
          <Loader2 className="w-8 h-8 mx-auto mb-3 animate-spin text-orange-500" />
          <p className="text-gray-600">Cargando convocatorias...</p>
        </div>
      ) : results.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-16 text-center shadow-sm">
          <Shield className="w-10 h-10 mx-auto mb-3 text-gray-300" />
          <p className="font-semibold text-gray-700">Sin resultados con esos filtros</p>
          <p className="text-sm text-gray-500 mt-1">Prueba a cambiar el ámbito, el grupo o ampliar el texto de búsqueda.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {results.map((comp) => (
            <article
              key={comp.id}
              className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex-1 min-w-0">
                  {/* Badges */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {comp.scope && (
                      <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700 capitalize">
                        {comp.scope}
                      </span>
                    )}
                    {comp.access_type && (
                      <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700 capitalize">
                        {comp.access_type}
                      </span>
                    )}
                    {comp.group && (
                      <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">
                        Grupo {comp.group}
                      </span>
                    )}
                    {comp.positions != null && (
                      <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                        {comp.positions.toLocaleString('es-ES')} {comp.positions === 1 ? 'plaza' : 'plazas'}
                      </span>
                    )}
                  </div>

                  {/* Título */}
                  <h2 className="text-base font-bold text-gray-900 leading-snug">{comp.title}</h2>

                  {/* Organismo */}
                  {comp.organism && (
                    <p className="mt-1.5 text-sm text-gray-600 flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 shrink-0 text-orange-400" />
                      {comp.organism}
                    </p>
                  )}

                  {/* Fecha */}
                  {comp.publication_date && (
                    <p className="mt-1.5 text-xs text-gray-400 flex items-center gap-1.5">
                      <CalendarDays className="w-3.5 h-3.5 shrink-0" />
                      Publicado el {new Date(comp.publication_date).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </p>
                  )}

                  {comp.description && (
                    <p className="mt-2 text-sm text-gray-500 line-clamp-2">{comp.description}</p>
                  )}
                </div>

                {/* Acciones */}
                <div className="lg:w-44 flex flex-col gap-2 lg:shrink-0">
                  {comp.url_html && (
                    <a
                      href={comp.url_html}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-xl bg-orange-600 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-orange-700 flex items-center justify-center gap-2 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" /> Ver en BOE
                    </a>
                  )}
                  {comp.url_pdf && (
                    <a
                      href={comp.url_pdf}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-xl border border-orange-200 px-4 py-2.5 text-center text-sm font-semibold text-orange-700 hover:bg-orange-50 flex items-center justify-center gap-2 transition-colors"
                    >
                      <FileText className="w-4 h-4" /> PDF oficial
                    </a>
                  )}
                  {comp.boe_id && (
                    <p className="text-center text-xs text-gray-400 font-mono">{comp.boe_id}</p>
                  )}
                </div>
              </div>
            </article>
          ))}

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
