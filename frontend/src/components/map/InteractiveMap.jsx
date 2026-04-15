import React, { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap, LayersControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Loader2, MapPin, X, Navigation } from 'lucide-react';
import { getMapCenterFilters, getMapCenters } from '@/api';

// Fix for default Leaflet marker icons not showing in React Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// ─── Colored circle icons per category ────────────────────────────────────────
function makeCircleIcon(color) {
  return L.divIcon({
    className: '',
    html: `<div style="background:${color}; width:18px; height:18px; border-radius:50%; border:2.5px solid white; box-shadow:0 2px 5px rgba(0,0,0,0.35);"></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
    popupAnchor: [0, -10],
  });
}

const ICONS = {
  university:     makeCircleIcon('#4F46E5'), // indigo
  non_university: makeCircleIcon('#10B981'), // emerald
  fp:             makeCircleIcon('#F97316'), // orange
  user:           L.divIcon({
    className: 'custom-user-marker',
    html: `<div style="background:#3B82F6; width:24px; height:24px; border-radius:50%; border:3px solid white; box-shadow:0 2px 6px rgba(0,0,0,0.3); display:flex; align-items:center; justify-content:center;">
      <div style="width:8px; height:8px; background:white; border-radius:50%;"></div>
    </div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  }),
};

function getIcon(center) {
  if (center._source === 'fp')             return ICONS.fp;
  if (center._source === 'non_university') return ICONS.non_university;
  return ICONS.university;
}

// ─── Map auto-bounds ───────────────────────────────────────────────────────────
function MapBounds({ markers }) {
  const map = useMap();
  useEffect(() => {
    if (markers.length > 0) {
      const bounds = L.latLngBounds(markers.map(m => [m.lat, m.lng]));
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [markers, map]);
  return null;
}

// ─── Haversine distance (km) ───────────────────────────────────────────────────
function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function InteractiveMap() {
  const [searchParams] = useSearchParams();
  const [centers, setCenters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search / filter state
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [provinceFilter, setProvinceFilter] = useState(searchParams.get('province') || '');

  // Center search autocomplete
  const [centerSuggestions, setCenterSuggestions] = useState([]);
  const [showCenterSuggestions, setShowCenterSuggestions] = useState(false);
  const centerSearchTimeoutRef = useRef(null);

  // User location
  const [userLocation, setUserLocation] = useState(null);
  const [userAddress, setUserAddress] = useState('');
  const [searchingLocation, setSearchingLocation] = useState(false);
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionTimeoutRef = useRef(null);

  // Categories
  const [categories, setCategories] = useState({
    universities:    Boolean(searchParams.get('search') || searchParams.get('province')),
    non_universities: false,
    fp:              false,
    certificates:    false,
  });

  const [provinces, setProvinces] = useState([]);

  // ── Load provinces on mount ─────────────────────────────────────────────────
  useEffect(() => {
    getMapCenterFilters()
      .then(data => { if (data?.success) setProvinces(data.provinces || []); })
      .catch(err => { console.error(err); setError('No se pudieron cargar los filtros del mapa.'); })
      .finally(() => setLoading(false));
  }, []);

  // ── Fetch centers when categories / filters change ──────────────────────────
  useEffect(() => {
    const hasActiveCategory =
      categories.universities || categories.non_universities ||
      categories.fp || categories.certificates;

    if (!hasActiveCategory) {
      setCenters([]);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    const limit = userLocation ? 300 : 200;
    const fetches = [];

    if (categories.universities) {
      fetches.push(
        getMapCenters({ search, province: provinceFilter, limit, type: 'universities' })
          .then(d => (d?.success ? (d.centers || []).map(c => ({ ...c, _source: 'university' })) : []))
          .catch(() => [])
      );
    }

    if (categories.non_universities) {
      fetches.push(
        getMapCenters({ search, province: provinceFilter, limit, type: 'non_universities' })
          .then(d => (d?.success ? (d.centers || []).map(c => ({ ...c, _source: 'non_university' })) : []))
          .catch(() => [])
      );
    }

    if (categories.fp) {
      fetches.push(
        getMapCenters({ search, province: provinceFilter, limit, type: 'fp' })
          .then(d => (d?.success ? (d.centers || []).map(c => ({ ...c, _source: 'fp' })) : []))
          .catch(() => [])
      );
    }

    // certificates: not yet implemented — placeholder
    if (categories.certificates) {
      fetches.push(Promise.resolve([]));
    }

    Promise.all(fetches)
      .then(results => {
        if (cancelled) return;
        setCenters(results.flat());
      })
      .catch(err => {
        console.error(err);
        if (!cancelled) setError('No se pudieron cargar los centros en el mapa.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [categories, search, provinceFilter, userLocation]);

  // ── Close suggestions on outside click ─────────────────────────────────────
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.autocomplete-container')) setShowSuggestions(false);
      if (!e.target.closest('.center-search-container')) setShowCenterSuggestions(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ── Center autocomplete ─────────────────────────────────────────────────────
  const handleCenterSearch = (value) => {
    setSearch(value);
    if (!value || value.length < 2) {
      setCenterSuggestions([]);
      setShowCenterSuggestions(false);
      return;
    }
    if (centerSearchTimeoutRef.current) clearTimeout(centerSearchTimeoutRef.current);
    centerSearchTimeoutRef.current = setTimeout(() => {
      const lv = value.toLowerCase();
      const matches = centers.filter(c =>
        c.name?.toLowerCase().includes(lv) ||
        c.locality?.toLowerCase().includes(lv) ||
        c.municipality?.toLowerCase().includes(lv) ||
        c.province?.toLowerCase().includes(lv)
      ).slice(0, 10);
      setCenterSuggestions(matches);
      setShowCenterSuggestions(matches.length > 0);
    }, 200);
  };

  const selectCenterSuggestion = (center) => {
    setSearch(center.name);
    setShowCenterSuggestions(false);
    setCenterSuggestions([]);
  };

  // ── Address suggestions ─────────────────────────────────────────────────────
  const fetchAddressSuggestions = async (query) => {
    if (!query || query.length < 3) { setAddressSuggestions([]); return; }
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query + ', España')}&format=json&limit=5&addressdetails=1`,
        { headers: { 'User-Agent': 'VocaccionApp/1.0 (contact@vocaccion.es)' } }
      );
      setAddressSuggestions(await res.json() || []);
    } catch { setAddressSuggestions([]); }
  };

  const handleAddressChange = (value) => {
    setUserAddress(value);
    setShowSuggestions(true);
    if (suggestionTimeoutRef.current) clearTimeout(suggestionTimeoutRef.current);
    suggestionTimeoutRef.current = setTimeout(() => fetchAddressSuggestions(value), 300);
  };

  const selectSuggestion = (s) => {
    setUserLocation({ lat: parseFloat(s.lat), lng: parseFloat(s.lon), address: s.display_name });
    setUserAddress(s.display_name);
    setShowSuggestions(false);
    setAddressSuggestions([]);
  };

  const searchUserAddress = async () => {
    if (!userAddress.trim()) return;
    setSearchingLocation(true);
    setShowSuggestions(false);
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
      const res = await fetch(`${API_URL}/geocode?q=${encodeURIComponent(userAddress + ', España')}`);
      const data = await res.json();
      if (data.success && data.lat && data.lng) {
        setUserLocation({ lat: data.lat, lng: data.lng, address: data.display_name || userAddress });
      } else {
        alert('No se encontró la dirección. Prueba con otra más específica.');
      }
    } catch { alert('Error al buscar la dirección.'); }
    finally { setSearchingLocation(false); }
  };

  // ── Derived data ────────────────────────────────────────────────────────────
  const centersWithDistance = userLocation
    ? centers.map(c => ({ ...c, distance: haversine(userLocation.lat, userLocation.lng, c.lat, c.lng) }))
              .sort((a, b) => a.distance - b.distance)
    : centers;

  const hasActiveCategory =
    categories.universities || categories.non_universities ||
    categories.fp || categories.certificates;

  const toggleCategory = (key) => setCategories(prev => ({ ...prev, [key]: !prev[key] }));

  // ── Loading / error states ──────────────────────────────────────────────────
  if (loading && centers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 bg-gray-50 rounded-xl border border-gray-200">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mb-4" />
        <p className="text-gray-600 font-medium">Cargando mapa interactivo...</p>
      </div>
    );
  }

  if (error && centers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 bg-red-50 rounded-xl border border-red-200 text-red-600 p-6 text-center">
        <p className="font-semibold text-lg mb-2">Error</p>
        <p>{error}</p>
      </div>
    );
  }

  const centerOfSpain = [40.4168, -3.7038];
  const displayCenters = userLocation ? centersWithDistance.slice(0, 50) : centers;

  return (
    <div className="flex flex-col gap-4 h-full">

      {/* ── Category buttons ── */}
      <div className="flex flex-wrap gap-2 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <button
          onClick={() => toggleCategory('universities')}
          className={`px-4 py-2 rounded-full font-medium transition-all text-sm border-2 flex items-center gap-2 ${
            categories.universities
              ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
              : 'bg-white border-gray-200 text-gray-600 hover:border-indigo-300'
          }`}
        >
          <span className="w-3 h-3 rounded-full bg-indigo-500 inline-block" />
          Universidades y Centros
        </button>
        <button
          onClick={() => toggleCategory('non_universities')}
          className={`px-4 py-2 rounded-full font-medium transition-all text-sm border-2 flex items-center gap-2 ${
            categories.non_universities
              ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
              : 'bg-white border-gray-200 text-gray-600 hover:border-emerald-300'
          }`}
        >
          <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
          Centros no universitarios
        </button>
        <button
          onClick={() => toggleCategory('fp')}
          className={`px-4 py-2 rounded-full font-medium transition-all text-sm border-2 flex items-center gap-2 ${
            categories.fp
              ? 'bg-orange-50 border-orange-500 text-orange-700'
              : 'bg-white border-gray-200 text-gray-600 hover:border-orange-300'
          }`}
        >
          <span className="w-3 h-3 rounded-full bg-orange-500 inline-block" />
          Formación Profesional
        </button>
        <button
          onClick={() => toggleCategory('certificates')}
          className={`px-4 py-2 rounded-full font-medium transition-all text-sm border-2 flex items-center gap-2 ${
            categories.certificates
              ? 'bg-purple-50 border-purple-500 text-purple-700'
              : 'bg-white border-gray-200 text-gray-600 hover:border-purple-300'
          }`}
        >
          <span className="w-3 h-3 rounded-full bg-purple-500 inline-block" />
          Certificados Profesionales
        </button>

        {loading && (
          <div className="flex items-center gap-1 text-xs text-gray-400 ml-2">
            <Loader2 className="w-3 h-3 animate-spin" /> Cargando...
          </div>
        )}
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        {/* Center name search */}
        <div className="flex-1 relative center-search-container">
          <input
            type="text"
            placeholder="Buscar centro o localidad..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
            value={search}
            onChange={(e) => handleCenterSearch(e.target.value)}
            onFocus={() => search.length >= 2 && setShowCenterSuggestions(centerSuggestions.length > 0)}
          />
          {showCenterSuggestions && centerSuggestions.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-80 overflow-y-auto">
              {centerSuggestions.map((center, idx) => (
                <button
                  key={idx}
                  onClick={() => selectCenterSuggestion(center)}
                  className="w-full px-4 py-3 text-left hover:bg-indigo-50 transition-colors border-b border-gray-100 last:border-b-0"
                >
                  <div className="font-semibold text-gray-900 text-sm mb-1">{center.name}</div>
                  <div className="text-xs text-gray-600 flex items-center gap-2">
                    <span>{center.center_type || 'Centro'}</span>
                    <span className="text-gray-400">•</span>
                    <span>{center.municipality || center.locality}, {center.province}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* My location */}
        <div className="flex-1 relative">
          <div className="flex gap-2">
            <div className="relative flex-1 autocomplete-container">
              <input
                type="text"
                placeholder="Escribe tu dirección o ciudad..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                value={userAddress}
                onChange={(e) => handleAddressChange(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && searchUserAddress()}
                onFocus={() => userAddress.length >= 3 && setShowSuggestions(true)}
              />
              {showSuggestions && addressSuggestions.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {addressSuggestions.map((s, idx) => (
                    <button
                      key={idx}
                      onClick={() => selectSuggestion(s)}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-indigo-50 transition-colors border-b border-gray-100 last:border-b-0"
                    >
                      <div className="font-medium text-gray-900">{s.display_name}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={searchUserAddress}
              disabled={searchingLocation || !userAddress.trim()}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-1"
            >
              {searchingLocation ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
            </button>
            {userLocation && (
              <button
                onClick={() => { setUserLocation(null); setUserAddress(''); setShowSuggestions(false); }}
                className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all"
                title="Limpiar ubicación"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Province filter */}
        <div className="md:w-64">
          <select
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white"
            value={provinceFilter}
            onChange={(e) => setProvinceFilter(e.target.value)}
          >
            <option value="">Todas las provincias</option>
            {provinces.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
      </div>

      {/* ── Results count ── */}
      <div className="text-sm text-gray-500 font-medium px-1 flex items-center justify-between">
        <span>
          Mostrando {userLocation ? Math.min(centersWithDistance.length, 50) : centers.length} centros
          {userLocation && ' ordenados por distancia'}
        </span>
        {!hasActiveCategory && (
          <span className="text-amber-600 flex items-center gap-1">
            ⚠️ Selecciona al menos una categoría
          </span>
        )}
        {hasActiveCategory && centers.length === 0 && !loading && (
          <span className="text-amber-600 text-xs">
            Sin centros geocodificados aún en esta categoría. Ejecuta <code>php artisan catalog:geocode-centers</code>
          </span>
        )}
      </div>

      {/* ── Map + Distance list ── */}
      <div className="flex-1 flex gap-4 min-h-0">

        {/* Nearest centers list */}
        {userLocation && centersWithDistance.length > 0 && (
          <div className="w-80 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
            <div className="p-4 bg-indigo-50 border-b border-indigo-100">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <Navigation className="w-5 h-5 text-indigo-600" />
                Centros más cercanos
              </h3>
              <p className="text-xs text-gray-600 mt-1">
                Desde: {userLocation.address.split(',').slice(0, 2).join(',')}
              </p>
            </div>
            <div className="flex-1 overflow-y-auto">
              {centersWithDistance.slice(0, 20).map((center, idx) => (
                <div key={`${center._source}-${center.id}-${idx}`} className="p-3 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm text-gray-900 truncate">{center.name}</div>
                      <div className="text-xs text-gray-600 mt-1">
                        {center.municipality || center.locality}, {center.province}
                      </div>
                    </div>
                    <div className="flex-shrink-0 px-2 py-1 bg-indigo-100 rounded-lg">
                      <div className="text-xs font-bold text-indigo-700">
                        {center.distance < 1
                          ? `${Math.round(center.distance * 1000)} m`
                          : `${center.distance.toFixed(1)} km`}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Leaflet map */}
        <div className="flex-1 rounded-xl overflow-hidden border border-gray-200 shadow-inner relative z-0 min-h-0">
          <MapContainer
            center={centerOfSpain}
            zoom={6}
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom={true}
          >
            <LayersControl position="topright">
              <LayersControl.BaseLayer checked name="Mapa Estándar">
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
              </LayersControl.BaseLayer>
              <LayersControl.BaseLayer name="Satélite (Esri)">
                <TileLayer
                  attribution="Tiles &copy; Esri"
                  url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                />
              </LayersControl.BaseLayer>
            </LayersControl>

            <MapBounds markers={displayCenters} />

            {/* User location marker */}
            {userLocation && (
              <Marker position={[userLocation.lat, userLocation.lng]} icon={ICONS.user}>
                <Popup>
                  <div className="p-1">
                    <h3 className="font-bold text-gray-900 text-sm mb-1">Tu ubicación</h3>
                    <p className="text-xs text-gray-600">{userLocation.address}</p>
                  </div>
                </Popup>
              </Marker>
            )}

            {/* Centers */}
            {displayCenters.map((center, idx) => (
              <Marker
                key={`${center._source}-${center.id}-${idx}`}
                position={[center.lat, center.lng]}
                icon={getIcon(center)}
              >
                <Popup maxWidth={260}>
                  <CenterPopup center={center} userLocation={userLocation} />
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>
    </div>
  );
}

// ─── Center popup component ────────────────────────────────────────────────────
function CenterPopup({ center, userLocation }) {
  const isCatalog = center.source === 'catalog';

  return (
    <div className="p-1 min-w-[220px]">
      <h3 className="font-bold text-gray-900 text-sm mb-1">{center.name}</h3>

      <p className="text-xs font-semibold text-gray-600 mb-2">
        {isCatalog ? (
          <span className={`px-1.5 py-0.5 rounded text-xs font-semibold ${
            center._source === 'fp'
              ? 'bg-orange-100 text-orange-700'
              : 'bg-emerald-100 text-emerald-700'
          }`}>
            {center.center_type || 'Centro'}
          </span>
        ) : (
          <span className="px-1.5 py-0.5 rounded text-xs font-semibold bg-indigo-100 text-indigo-700">
            {center.center_type || 'Centro universitario'}
          </span>
        )}
      </p>

      {userLocation && center.distance !== undefined && (
        <div className="mb-2 px-2 py-1 bg-indigo-50 rounded-lg text-xs font-semibold text-indigo-700 flex items-center gap-1">
          <Navigation className="w-3 h-3" />
          {center.distance < 1
            ? `${Math.round(center.distance * 1000)} m`
            : `${center.distance.toFixed(1)} km`}
        </div>
      )}

      <div className="text-xs text-gray-700 flex flex-col gap-1">
        {center.ownership_type && (
          <span>🏢 <span className="capitalize">{center.ownership_type.replace(/_/g, ' ')}</span></span>
        )}
        {center.address && <span>📍 {center.address}</span>}
        {(center.municipality || center.locality) && (
          <span>🏙️ {center.municipality || center.locality}</span>
        )}
        {center.province && <span>🗺️ {center.province}</span>}
        {center.studies_count > 0 && (
          <span>🎓 {center.studies_count} {isCatalog ? 'enseñanzas' : 'estudios'}</span>
        )}
      </div>

      {center.studies_preview?.length > 0 && (
        <div className="mt-2 pt-2 border-t border-gray-200 text-xs text-gray-600 flex flex-col gap-1">
          {center.studies_preview.map((s, i) => <span key={i}>• {s}</span>)}
        </div>
      )}

      {(center.website || center.email || center.phone) && (
        <div className="mt-2 pt-2 border-t border-gray-200 text-xs flex flex-col gap-1">
          {center.website && (
            <a href={center.website} target="_blank" rel="noopener noreferrer"
               className="text-indigo-600 hover:underline break-all">
              🌐 Web oficial
            </a>
          )}
          {center.email && <span>✉️ {center.email}</span>}
          {center.phone && <span>📞 {center.phone}</span>}
        </div>
      )}

      <div className="mt-3 pt-2 border-t border-gray-200 flex flex-col gap-2">
        {isCatalog ? (
          <Link
            to={`/estudios?catalog_center_id=${center.id}`}
            className="rounded-lg bg-orange-600 px-3 py-2 text-center text-xs font-semibold text-white hover:bg-orange-700"
          >
            Ver enseñanzas de este centro
          </Link>
        ) : (
          <Link
            to={`/estudios?center_id=${center.id}`}
            className="rounded-lg bg-indigo-600 px-3 py-2 text-center text-xs font-semibold text-white hover:bg-indigo-700"
          >
            Ver estudios de este centro
          </Link>
        )}
      </div>
    </div>
  );
}
