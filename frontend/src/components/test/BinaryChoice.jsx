import React from 'react';

/**
 * BinaryChoice - Two-option choice for competencies/occupations phases
 *
 * @param {Object}      props
 * @param {Object}      props.item     - Question item from API
 * @param {number|null} props.value    - Current selected value (0|1)
 * @param {Function}    props.onChange - Callback when value changes
 * @param {boolean}     props.disabled - Whether choice is disabled
 * @param {string[]}    props.labels   - Labels for [0, 1] options
 * @param {string|null} props.imageUrl - Optional Pexels image URL (occupations phase)
 */
const BinaryChoice = ({
  item,
  value,
  onChange,
  disabled = false,
  labels = ['No', 'Sí'],
  imageUrl = null,
}) => {
  const handleSelect = (selectedValue) => {
    if (!disabled) {
      onChange(selectedValue);
    }
  };

  // ── Occupation card variant (image present) ───────────────────────────────
  if (imageUrl) {
    return (
      <div className="w-full flex flex-col sm:flex-row items-stretch rounded-2xl overflow-hidden shadow-md border border-gray-100 bg-white">
        {/* Image — fixed width square on desktop, full-width on mobile */}
        <div className="relative w-full sm:w-56 shrink-0 aspect-square">
          <img
            src={imageUrl}
            alt={item.text_es}
            className="absolute inset-0 w-full h-full object-cover object-center rounded-none sm:rounded-l-2xl"
            loading="eager"
            fetchPriority="high"
          />
        </div>

        {/* Content */}
        <div className="flex flex-col justify-center flex-1 p-5">
          <div className="flex flex-col gap-5">
            {/* Title + description */}
            <div className="text-center">
            <p className="font-bold text-lg md:text-xl text-gray-900 leading-snug">
              {item.text_es}
            </p>
            {item.context_es && (
              <p className="text-sm md:text-base text-gray-500 mt-2 leading-snug">
                {item.context_es}
              </p>
            )}
            </div>

            {/* Choice buttons */}
            <div className="flex flex-row justify-center gap-3">
              {[
                { v: 0, label: labels[0], icon: '✕', sel: 'border-red-400 bg-red-50', hover: 'hover:border-red-300 hover:bg-red-50', text: 'text-red-700' },
                { v: 1, label: labels[1], icon: '♥', sel: 'border-green-500 bg-green-50', hover: 'hover:border-green-400 hover:bg-green-50', text: 'text-green-700' },
              ].map(({ v, label, icon, sel, hover, text }) => (
                <button
                  key={v}
                  onClick={() => handleSelect(v)}
                  disabled={disabled}
                  className={`
                    flex-1 max-w-[220px] px-6 py-3 rounded-xl border-2 transition-all duration-200
                    ${value === v ? `${sel} shadow-sm -translate-y-0.5` : `border-gray-200 bg-white ${hover}`}
                    ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                    flex items-center justify-center gap-1.5
                  `}
                >
                  <span className="text-lg leading-none">{icon}</span>
                  <span className={`font-semibold text-base leading-none ${value === v ? text : 'text-gray-700'}`}>
                    {label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Default variant (competencies) ────────────────────────────────────────
  const options = [
    { value: 0, label: labels[0] },
    { value: 1, label: labels[1] },
  ];

  return (
    <div className="w-full h-full flex flex-col gap-4">
      <div className="mb-4">
        <h3 className="text-lg md:text-xl font-semibold text-gray-800 mb-2 leading-snug">
          {item.text_es}
        </h3>
        {item.context_es && (
          <p className="text-xs md:text-sm text-gray-500 italic leading-snug">
            {item.context_es}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {options.map((option) => (
          <button
            key={option.value}
            onClick={() => handleSelect(option.value)}
            disabled={disabled}
            className={`
              w-full min-h-[76px] md:min-h-[84px] rounded-xl border-2 transition-all duration-200
              ${value === option.value
                ? 'border-indigo-600 bg-indigo-50 shadow-md -translate-y-0.5'
                : 'border-gray-300 bg-white hover:border-indigo-300 hover:bg-indigo-50 hover:scale-[1.01]'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              flex items-center justify-between px-4
            `}
          >
            <span className="font-medium text-gray-800 text-sm md:text-base leading-snug text-left pr-2">
              {option.label}
            </span>
            <div className={`
              w-5 h-5 rounded-full border-2 flex items-center justify-center ml-3 shrink-0
              ${value === option.value ? 'border-indigo-500 bg-indigo-500' : 'border-gray-400'}
            `}>
              {value === option.value && (
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default BinaryChoice;
