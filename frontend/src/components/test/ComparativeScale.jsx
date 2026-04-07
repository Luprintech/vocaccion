import React from 'react';

/**
 * ComparativeScale - Paired comparison component for v2 test
 * Compares two RIASEC dimensions with a -1, 0, 1 scale
 * 
 * @param {Object} props
 * @param {Object} props.item - Question item with dimension and dimension_b
 * @param {number|null} props.value - Current selected value (-1, 0, 1)
 * @param {Function} props.onChange - Callback when value changes
 * @param {boolean} props.disabled - Whether the scale is disabled
 */
const ComparativeScale = ({ item, value, onChange, disabled = false }) => {
  const dimensionLabels = {
    R: 'Realista',
    I: 'Investigador',
    A: 'Artístico',
    S: 'Social',
    E: 'Emprendedor',
    C: 'Convencional'
  };

  const dimensionA = item.dimension;
  const dimensionB = item.dimension_b;

  const options = [
    { value: -1, label: `Prefiero ${dimensionLabels[dimensionB]}`, icon: '←' },
    { value: 0, label: 'Ambas por igual', icon: '↔' },
    { value: 1, label: `Prefiero ${dimensionLabels[dimensionA]}`, icon: '→' }
  ];

  const handleSelect = (selectedValue) => {
    if (!disabled) {
      onChange(selectedValue);
    }
  };

  return (
    <div className="comparative-scale-container">
      {/* Question text */}
      <div className="mb-3">
        <h3 className="text-base md:text-lg font-semibold text-gray-800 mb-2 leading-snug">
          {item.text_es}
        </h3>
        {item.context_es && (
          <p className="text-xs md:text-sm text-gray-500 italic mb-2 leading-snug line-clamp-2">
            {item.context_es}
          </p>
        )}
        <p className="text-xs md:text-sm text-purple-600 font-medium">
          Elige cuál de estas opciones te representa mejor
        </p>
      </div>

      {/* Dimension comparison header */}
      <div className="mb-3 p-2.5 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border border-purple-200">
        <div className="flex items-center justify-between">
          <div className="text-center flex-1">
            <div className="text-xl font-bold text-purple-600">{dimensionB}</div>
            <div className="text-xs md:text-sm text-gray-700 mt-1">{dimensionLabels[dimensionB]}</div>
          </div>
          <div className="px-3 text-xl text-gray-400">vs</div>
          <div className="text-center flex-1">
            <div className="text-xl font-bold text-blue-600">{dimensionA}</div>
            <div className="text-xs md:text-sm text-gray-700 mt-1">{dimensionLabels[dimensionA]}</div>
          </div>
        </div>
      </div>

      {/* Comparison options */}
      <div className="space-y-1.5">
        {options.map((option) => (
          <button
            key={option.value}
            onClick={() => handleSelect(option.value)}
            disabled={disabled}
            className={`
              w-full px-3 py-2.5 rounded-xl border-2 transition-all duration-200
              ${value === option.value
                ? 'border-purple-500 bg-purple-50 shadow-lg scale-105'
                : 'border-gray-300 bg-white hover:border-purple-300 hover:bg-purple-50'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              flex items-center justify-between
            `}
          >
            <span className="text-xl">{option.icon}</span>
            <span className="text-center flex-1 font-medium text-gray-800 text-sm leading-snug px-2">
              {option.label}
            </span>
            <div className={`
              w-5 h-5 rounded-full border-2 flex items-center justify-center
              ${value === option.value
                ? 'border-purple-500 bg-purple-500'
                : 'border-gray-400'
              }
            `}>
              {value === option.value && (
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Help text */}
      <div className="mt-3 pt-2 border-t border-gray-100">
        <div className="bg-gray-50 rounded-lg p-2.5">
          <p className="text-[11px] md:text-xs text-gray-600 leading-snug">
            💡 <strong>Tip:</strong> No hay respuestas correctas o incorrectas. 
            Elige la opción que mejor refleje tus preferencias personales o intereses.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ComparativeScale;
