import React from 'react';

/**
 * PhaseTransition - Interstitial screen shown between test phases
 * 
 * @param {Object} props
 * @param {string} props.nextPhase - The phase we're transitioning to ('checklist' or 'comparative')
 * @param {Function} props.onContinue - Callback when user clicks continue
 */
const PhaseTransition = ({ nextPhase, onContinue }) => {
  const phaseInfo = {
    checklist: {
      title: '¡Excelente progreso! 🎯',
      subtitle: 'Fase 2: Actividades e Intereses',
      description: 'Ahora te presentaremos listas de actividades. Selecciona todas las que te resulten interesantes o atractivas.',
      instruction: 'Puedes seleccionar varias opciones en cada pregunta.',
      icon: '☑️',
      color: 'green'
    },
    comparative: {
      title: '¡Casi terminamos! 🚀',
      subtitle: 'Fase 3: Comparaciones Directas',
      description: 'Para finalizar, te pediremos que compares diferentes tipos de actividades entre sí.',
      instruction: 'Elige cuál de las dos opciones prefieres en cada caso.',
      icon: '⚖️',
      color: 'purple'
    }
  };

  const info = phaseInfo[nextPhase] || phaseInfo.checklist;
  const colorClasses = {
    green: {
      bg: 'bg-green-50',
      border: 'border-green-300',
      accent: 'bg-green-500',
      text: 'text-green-700',
      button: 'bg-green-600 hover:bg-green-700'
    },
    purple: {
      bg: 'bg-purple-50',
      border: 'border-purple-300',
      accent: 'bg-purple-500',
      text: 'text-purple-700',
      button: 'bg-purple-600 hover:bg-purple-700'
    }
  };

  const colors = colorClasses[info.color];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header with icon */}
        <div className={`${colors.bg} ${colors.border} border-b-4 p-8 text-center`}>
          <div className="text-6xl mb-4">{info.icon}</div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            {info.title}
          </h1>
          <h2 className={`text-xl font-semibold ${colors.text}`}>
            {info.subtitle}
          </h2>
        </div>

        {/* Content */}
        <div className="p-8">
          <div className="mb-6">
            <p className="text-lg text-gray-700 leading-relaxed">
              {info.description}
            </p>
          </div>

          <div className={`${colors.bg} rounded-lg p-4 mb-6 border-l-4 ${colors.border}`}>
            <p className="text-sm font-semibold text-gray-800 mb-1">
              📋 Instrucciones:
            </p>
            <p className="text-sm text-gray-700">
              {info.instruction}
            </p>
          </div>

          {/* Progress indicator */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-gray-600 font-medium">Progreso del test</span>
              <span className="text-xs text-gray-600 font-medium">
                {nextPhase === 'checklist' ? '~50%' : '~85%'} completado
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div 
                className={`${colors.accent} h-3 rounded-full transition-all duration-500`}
                style={{ width: nextPhase === 'checklist' ? '50%' : '85%' }}
              ></div>
            </div>
          </div>

          {/* Continue button */}
          <button
            onClick={onContinue}
            className={`
              w-full ${colors.button} text-white font-bold py-4 px-6 rounded-lg
              transition-all duration-200 transform hover:scale-105
              shadow-lg hover:shadow-xl
              flex items-center justify-center space-x-2
            `}
          >
            <span>Continuar</span>
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>

          {/* Estimated time */}
          <p className="text-center text-xs text-gray-500 mt-4">
            ⏱️ Tiempo estimado restante: {nextPhase === 'checklist' ? '5-7' : '2-3'} minutos
          </p>
        </div>
      </div>
    </div>
  );
};

export default PhaseTransition;
