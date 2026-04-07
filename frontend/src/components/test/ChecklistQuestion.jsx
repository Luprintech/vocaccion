import React, { useState, useEffect } from 'react';

/**
 * ChecklistQuestion - Multi-select checklist component for v2 test
 * 
 * @param {Object} props
 * @param {Object} props.item - Question item from API with options array
 * @param {Array} props.selectedOptions - Array of selected option indices
 * @param {Function} props.onChange - Callback when selection changes
 * @param {boolean} props.disabled - Whether the checklist is disabled
 */
const ChecklistQuestion = ({ item, selectedOptions = [], onChange, disabled = false }) => {
  const [selected, setSelected] = useState(selectedOptions);

  useEffect(() => {
    setSelected(selectedOptions);
  }, [selectedOptions]);

  const handleToggle = (index) => {
    if (disabled) return;

    const newSelected = selected.includes(index)
      ? selected.filter(i => i !== index)
      : [...selected, index];
    
    setSelected(newSelected);
    onChange(newSelected);
  };

  const options = item.options || [];

  return (
    <div className="checklist-question-container">
      {/* Question text */}
      <div className="mb-3">
        <h3 className="text-base md:text-lg font-semibold text-gray-800 mb-2 leading-snug">
          {item.text_es}
        </h3>
        {item.context_es && (
          <p className="text-xs md:text-sm text-gray-500 italic mb-1 leading-snug line-clamp-2">
            {item.context_es}
          </p>
        )}
        <p className="text-xs md:text-sm text-blue-600 font-medium">
          Selecciona todas las opciones que apliquen
        </p>
      </div>

      {/* Checklist options */}
      <div className="space-y-1.5">
        {options.map((option, index) => {
          const isSelected = selected.includes(index);
          
          return (
            <button
              key={index}
              onClick={() => handleToggle(index)}
              disabled={disabled}
              className={`
                w-full px-3 py-2.5 rounded-xl border-2 transition-all duration-200
                ${isSelected
                  ? 'border-green-500 bg-green-50 shadow-md'
                  : 'border-gray-300 bg-white hover:border-green-300 hover:bg-green-50'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                flex items-center justify-between text-left
              `}
            >
                <span className="font-medium text-gray-800 flex-1 text-sm leading-snug">
                  {option.label || option.text || `Opción ${index + 1}`}
                </span>
                <div className={`
                w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ml-3
                ${isSelected
                  ? 'border-green-500 bg-green-500'
                  : 'border-gray-400 bg-white'
                }
              `}>
                {isSelected && (
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Selection counter */}
      <div className="mt-3 pt-2 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <span className="text-xs md:text-sm text-gray-600">
            {selected.length === 0 && 'No has seleccionado ninguna opción'}
            {selected.length === 1 && '1 opción seleccionada'}
            {selected.length > 1 && `${selected.length} opciones seleccionadas`}
          </span>
          {selected.length > 0 && (
            <button
              onClick={() => {
                setSelected([]);
                onChange([]);
              }}
              disabled={disabled}
              className="text-xs md:text-sm text-red-600 hover:text-red-700 font-medium"
            >
              Limpiar selección
            </button>
          )}
        </div>
        {selected.length === 0 && (
          <p className="text-[11px] text-gray-500 mt-1.5">
            Puedes dejar sin seleccionar si ninguna opción aplica
          </p>
        )}
      </div>
    </div>
  );
};

export default ChecklistQuestion;
