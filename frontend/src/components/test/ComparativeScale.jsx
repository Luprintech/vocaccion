import React from 'react';
import { Wrench, FlaskConical, Palette, Handshake, Rocket, ClipboardList, Check, MoveHorizontal } from 'lucide-react';

/**
 * ComparativeScale - Visual paired-comparison cards for the comparative phase.
 * Each RIASEC dimension gets its own color, emoji, and tagline.
 *
 * @param {Object}      props
 * @param {Object}      props.item     - Item with dimension and dimension_b
 * @param {number|null} props.value    - Current value: -1 (prefer B), 0 (both), 1 (prefer A)
 * @param {Function}    props.onChange - Callback
 * @param {boolean}     props.disabled
 */
const DIM_META = {
  R: { label: 'Realista',       icon: Wrench,        tagline: 'Hacer cosas concretas',   bg: '#fff7ed', border: '#fdba74', text: '#c2410c', pill: 'bg-orange-100 text-orange-700' },
  I: { label: 'Investigador',   icon: FlaskConical,  tagline: 'Analizar y descubrir',    bg: '#eff6ff', border: '#93c5fd', text: '#1d4ed8', pill: 'bg-blue-100 text-blue-700' },
  A: { label: 'Artístico',      icon: Palette,       tagline: 'Crear y expresar',        bg: '#fdf2f8', border: '#f9a8d4', text: '#be185d', pill: 'bg-pink-100 text-pink-700' },
  S: { label: 'Social',         icon: Handshake,     tagline: 'Ayudar a las personas',   bg: '#f0fdf4', border: '#86efac', text: '#15803d', pill: 'bg-green-100 text-green-700' },
  E: { label: 'Emprendedor',    icon: Rocket,        tagline: 'Liderar y convencer',     bg: '#faf5ff', border: '#c4b5fd', text: '#7e22ce', pill: 'bg-purple-100 text-purple-700' },
  C: { label: 'Convencional',   icon: ClipboardList, tagline: 'Organizar y estructurar', bg: '#fefce8', border: '#fde047', text: '#a16207', pill: 'bg-yellow-100 text-yellow-700' },
};

const ComparativeScale = ({ item, value, onChange, disabled = false }) => {
  const dimA = item.dimension;
  const dimB = item.dimension_b;
  const metaA = DIM_META[dimA] ?? {};
  const metaB = DIM_META[dimB] ?? {};

  const handleSelect = (v) => { if (!disabled) onChange(v); };

  // ── Dimension card ─────────────────────────────────────────────────────────
  const DimCard = ({ meta, selValue, currentValue }) => {
    const selected = currentValue === selValue;
    const Icon = meta.icon;
    return (
      <button
        onClick={() => handleSelect(selValue)}
        disabled={disabled}
        className={`
          w-full min-h-[130px] md:min-h-[150px] rounded-2xl border-2 transition-all duration-200 p-4
          flex flex-col items-center justify-center gap-2 text-center
          ${selected
            ? 'shadow-lg -translate-y-1 scale-[1.02]'
            : 'bg-white border-gray-200 hover:scale-[1.01]'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
        style={selected ? { background: meta.bg, borderColor: meta.border } : {}}
      >
        {Icon && <Icon className="w-8 h-8" style={selected ? { color: meta.text } : { color: '#4b5563' }} />}
        <div>
          <p className={`font-bold text-sm md:text-base leading-snug ${selected ? '' : 'text-gray-800'}`}
             style={selected ? { color: meta.text } : {}}>
            {meta.label}
          </p>
          <p className={`text-xs leading-snug mt-0.5 ${selected ? 'opacity-80' : 'text-gray-500'}`}
             style={selected ? { color: meta.text } : {}}>
            {meta.tagline}
          </p>
        </div>
        <div
          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center`}
          style={selected ? { borderColor: meta.border, background: meta.border } : { borderColor: '#d1d5db' }}
        >
          {selected && (
            <Check className="w-3 h-3 text-white" />
          )}
        </div>
      </button>
    );
  };

  return (
    <div className="w-full h-full flex flex-col gap-3">
      {/* Question text */}
      <div>
        <h3 className="text-base md:text-lg font-semibold text-gray-800 mb-1 leading-snug">
          {item.text_es}
        </h3>
        <p className="text-xs text-purple-600 font-medium">
          ¿Cuál de estas dos orientaciones te representa más?
        </p>
      </div>

      {/* Two dimension cards + "both" in the middle */}
      <div className="grid grid-cols-2 gap-3">
        <DimCard meta={metaB} selValue={-1} currentValue={value} />
        <DimCard meta={metaA} selValue={1}  currentValue={value} />
      </div>

      {/* Both equally */}
      <button
        onClick={() => handleSelect(0)}
        disabled={disabled}
        className={`
          w-full py-2.5 rounded-xl border-2 transition-all duration-200 text-sm font-medium
          ${value === 0
            ? 'border-gray-400 bg-gray-100 text-gray-800 shadow-sm'
            : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:bg-gray-50'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        <span className="inline-flex items-center justify-center gap-2">
          <MoveHorizontal className="w-4 h-4" />
          <span>Ambas me representan por igual</span>
        </span>
      </button>
    </div>
  );
};

export default ComparativeScale;
