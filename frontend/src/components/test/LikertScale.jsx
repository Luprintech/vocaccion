import React from 'react';

/**
 * LikertScale - 5-point Likert scale component for v2 test
 * 
 * @param {Object} props
 * @param {Object} props.item - Question item from API
 * @param {number|null} props.value - Current selected value (1-5)
 * @param {Function} props.onChange - Callback when value changes
 * @param {boolean} props.disabled - Whether the scale is disabled
 */
const LikertScale = ({ item, value, onChange, disabled = false }) => {
  const options = [
    { value: 1, label: 'Muy en desacuerdo' },
    { value: 2, label: 'En desacuerdo' },
    { value: 3, label: 'Neutral' },
    { value: 4, label: 'De acuerdo' },
    { value: 5, label: 'Muy de acuerdo' }
  ];

  const handleSelect = (selectedValue) => {
    if (!disabled) {
      onChange(selectedValue);
    }
  };

  return (
    <div className="likert-scale-container">
      {/* Question text */}
      <div className="mb-3">
        <h3 className="text-base md:text-lg font-semibold text-gray-800 mb-2 leading-snug">
          {item.text_es}
        </h3>
        {item.context_es && (
          <p className="text-xs md:text-sm text-gray-500 italic leading-snug line-clamp-2">
            {item.context_es}
          </p>
        )}
      </div>

      {/* Likert scale options */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
        {options.map((option) => (
          <button
            key={option.value}
            onClick={() => handleSelect(option.value)}
            disabled={disabled}
            className={`
              px-3 py-2.5 rounded-xl border-2 transition-all duration-200 min-h-[62px] md:min-h-[74px]
              ${value === option.value
                ? 'border-blue-500 bg-blue-50 shadow-md'
                : 'border-gray-300 bg-white hover:border-blue-300 hover:bg-blue-50'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              flex flex-col items-center justify-center text-center gap-1
            `}
          >
            <span className="text-center font-medium text-gray-800 text-xs md:text-sm leading-tight">
              {option.label}
            </span>
            <div className={`
              w-4 h-4 rounded-full border-2 flex items-center justify-center
              ${value === option.value
                ? 'border-blue-500 bg-blue-500'
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

      {/* Visual scale indicator */}
      <div className="mt-2 pt-2 border-t border-gray-100">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-red-400"></div>
            <span className="text-[11px] text-gray-500">En desacuerdo</span>
          </div>
          <div className="flex-1 mx-2 h-1.5 bg-gradient-to-r from-red-200 via-gray-200 to-green-200 rounded-full"></div>
          <div className="flex items-center space-x-2">
            <span className="text-[11px] text-gray-500">De acuerdo</span>
            <div className="w-3 h-3 rounded-full bg-green-400"></div>
          </div>
        </div>
        {value && (
          <div className="text-center mt-1">
            <span className="text-xs md:text-sm text-gray-600">
              Seleccionado: <strong>{options[value - 1].label}</strong>
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default LikertScale;
