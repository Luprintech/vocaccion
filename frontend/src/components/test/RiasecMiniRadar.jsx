import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  ResponsiveContainer,
} from 'recharts';

/**
 * RiasecMiniRadar - Compact real-time hexagon radar chart shown during the test.
 *
 * @param {{ R, I, A, S, E, C }} scores  Normalized 0-100 scores per dimension
 * @param {string}               size    'xs' | 'sm' (default 'sm')
 */
const RIASEC_LABELS = { R: 'R', I: 'I', A: 'A', S: 'S', E: 'E', C: 'C' };

const RIASEC_INFO = [
  { key: 'R', label: 'Realista',      emoji: '🔧', desc: 'Trabajo manual, técnico y al aire libre. Te gustan las máquinas, herramientas y actividades prácticas.' },
  { key: 'I', label: 'Investigador',  emoji: '🔬', desc: 'Análisis, investigación y resolución de problemas complejos. Disfrutas pensar, observar y experimentar.' },
  { key: 'A', label: 'Artístico',     emoji: '🎨', desc: 'Creatividad, expresión y originalidad. Te atraen el arte, la música, la escritura y el diseño.' },
  { key: 'S', label: 'Social',        emoji: '🤝', desc: 'Ayudar, enseñar y colaborar con personas. Valoras las relaciones humanas y el trabajo en equipo.' },
  { key: 'E', label: 'Emprendedor',   emoji: '🚀', desc: 'Liderazgo, persuasión y toma de decisiones. Te motiva gestionar proyectos y convencer a otros.' },
  { key: 'C', label: 'Convencional',  emoji: '📋', desc: 'Organización, precisión y seguimiento de procesos. Prefieres entornos estructurados y datos ordenados.' },
];

const DIMS = ['R', 'I', 'A', 'S', 'E', 'C'];

export default function RiasecMiniRadar({ scores = {}, size = 'sm' }) {
  const [open, setOpen] = useState(false);
  const [panelStyle, setPanelStyle] = useState({});
  const btnRef = useRef(null);

  const data = DIMS.map((d) => ({ dim: RIASEC_LABELS[d], value: scores[d] ?? 0 }));
  const hasAnyScore = DIMS.some((d) => (scores[d] ?? 0) > 0);

  const dim = size === 'xs' ? 80 : 100;
  const outerRadius = size === 'xs' ? 26 : 32;
  const fontSize = size === 'xs' ? 7 : 9;

  const handleToggle = () => {
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      const panelWidth = 280;
      // Abre hacia abajo desde el botón i
      // Se alinea a la derecha del botón pero sin salirse de la pantalla
      const rightEdge = rect.right;
      const left = Math.max(8, rightEdge - panelWidth);
      setPanelStyle({
        position: 'fixed',
        top: rect.bottom + 8,
        left,
        width: panelWidth,
        zIndex: 9999,
      });
    }
    setOpen((v) => !v);
  };

  // Close on scroll / resize
  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    return () => {
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
    };
  }, [open]);

  return (
    <div className="relative flex flex-col items-center" style={{ width: dim, minWidth: dim }}>
      {/* Info button */}
      <button
        ref={btnRef}
        onClick={handleToggle}
        className="absolute top-0 right-0 w-4 h-4 rounded-full bg-gray-100 border border-gray-300 text-gray-400 hover:text-purple-600 hover:border-purple-400 hover:bg-purple-50 transition flex items-center justify-center z-10"
        title="¿Qué significa cada letra?"
        aria-label="Información de dimensiones RIASEC"
        style={{ fontSize: 9, lineHeight: 1 }}
      >
        i
      </button>

      <ResponsiveContainer width={dim} height={dim}>
        <RadarChart data={data} outerRadius={outerRadius} margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
          <PolarGrid stroke="#e5e7eb" />
          <PolarAngleAxis dataKey="dim" tick={{ fontSize, fill: '#6b7280' }} />
          <Radar
            dataKey="value"
            stroke={hasAnyScore ? '#7c3aed' : '#d1d5db'}
            fill={hasAnyScore ? '#7c3aed' : '#d1d5db'}
            fillOpacity={hasAnyScore ? 0.25 : 0.1}
            dot={false}
          />
        </RadarChart>
      </ResponsiveContainer>
      <span className="text-[10px] text-gray-400 leading-tight text-center" style={{ maxWidth: dim }}>
        {hasAnyScore ? 'Perfil en curso' : 'Empieza a responder'}
      </span>

      {/* Portal — renderizado en body, por encima de todo */}
      {open && createPortal(
        <>
          <div className="fixed inset-0" style={{ zIndex: 9998 }} onClick={() => setOpen(false)} />
          <div
            style={panelStyle}
            className="bg-white rounded-xl shadow-2xl border border-gray-100 p-3 max-h-[70vh] overflow-y-auto"
          >
            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Dimensiones RIASEC
            </p>
            <div className="flex flex-col gap-2.5">
              {RIASEC_INFO.map(({ key, label, emoji, desc }) => (
                <div key={key} className="flex gap-2">
                  <span className="text-base leading-none mt-0.5 shrink-0">{emoji}</span>
                  <div>
                    <p className="text-xs font-semibold text-gray-800">
                      <span className="text-purple-600 mr-1">{key}</span>{label}
                    </p>
                    <p className="text-[11px] text-gray-500 leading-snug text-justify">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
  );
}
