import React from 'react';
import { ClipboardList, Brain, Briefcase, Scale, Timer } from 'lucide-react';
import TestViewportShell from './TestViewportShell';

/**
 * PhaseTransition - Interstitial screen shown between test phases
 * 
 * @param {Object} props
 * @param {string} props.nextPhase - The phase we're transitioning to ('competencies'|'occupations'|'comparative')
 * @param {Function} props.onContinue - Callback when user clicks continue
 */
const PhaseTransition = ({ nextPhase, onContinue }) => {
  const phaseInfo = {
    competencies: {
      title: 'Excelente progreso',
      subtitle: 'Fase 2: Competencias',
      description: 'Ahora evaluaremos tus habilidades autopercibidas. Responde con honestidad si hoy podrías realizar cada acción.',
      instruction: 'Elige entre “Sí, podría hacerlo” o “No, todavía no”.',
      icon: Brain,
      color: 'blue'
    },
    occupations: {
      title: 'Muy bien, seguimos',
      subtitle: 'Fase 3: Ocupaciones',
      description: 'Ahora verás profesiones concretas. Responde de forma intuitiva si te atrae o no la idea de trabajar en ellas.',
      instruction: 'Elige entre “Me atrae” y “No me atrae”.',
      icon: Briefcase,
      color: 'green'
    },
    comparative: {
      title: 'Casi terminamos',
      subtitle: 'Fase 4: Comparaciones Directas',
      description: 'Para finalizar, te pediremos que compares diferentes tipos de actividades entre sí.',
      instruction: 'Elige cuál de las dos opciones prefieres en cada caso.',
      icon: Scale,
      color: 'purple'
    },
    early_stop: {
      title: '¡Tu perfil ya está definido!',
      subtitle: 'Solo quedan 6 preguntas',
      description: 'Tus respuestas muestran un perfil vocacional claro. Hemos saltado las fases intermedias para no hacerte repetir lo evidente.',
      instruction: 'Para terminar, compara directamente estos pares de opciones. Son las más importantes para afinar tu resultado.',
      icon: Scale,
      color: 'purple'
    }
  };

  const info = phaseInfo[nextPhase] || phaseInfo.competencies;
  const colorClasses = {
    blue: {
      bg: 'bg-blue-50',
      border: 'border-blue-300',
      accent: 'bg-blue-500',
      text: 'text-blue-700',
      button: 'bg-blue-600 hover:bg-blue-700'
    },
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
  const Icon = info.icon;

  return (
    <TestViewportShell
      className="min-h-screen md:min-h-[calc(100vh-72px)]"
      fillHeight={false}
      contentGrow={false}
      centered={true}
      header={(
        <div className={`${colors.bg} ${colors.border} rounded-xl border px-4 py-3 md:px-5 md:py-3 text-center`}>
          <div className="inline-flex items-center gap-4 text-left mx-auto">
            <div className="w-12 h-12 rounded-xl bg-white/70 backdrop-blur-sm flex items-center justify-center shrink-0">
              <Icon className={`w-7 h-7 ${colors.text}`} />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-800 mb-0.5 leading-tight">{info.title}</h1>
              <h2 className={`text-base md:text-lg font-semibold ${colors.text} leading-tight`}>{info.subtitle}</h2>
            </div>
          </div>
        </div>
      )}
      footer={(
        <>
          <button
            onClick={onContinue}
            className={`
              w-full ${colors.button} text-white font-bold py-3.5 px-6 rounded-xl
              transition-all duration-200 transform hover:scale-[1.01]
              shadow-lg hover:shadow-xl
              flex items-center justify-center space-x-2
            `}
          >
            <span>Continuar</span>
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
          <p className="text-center text-xs text-gray-500 mt-3 flex items-center justify-center gap-1.5">
            <Timer className="w-3.5 h-3.5" />
            Tiempo estimado restante: {nextPhase === 'competencies' ? '8-10' : nextPhase === 'occupations' ? '4-6' : '2-3'} minutos
          </p>
          {nextPhase === 'early_stop' && (
            <p className="text-center text-xs text-purple-600 font-semibold mt-1">
              Test completo en ~2 minutos en lugar de ~15
            </p>
          )}
        </>
      )}
    >
      <div className="h-full flex flex-col justify-start gap-4">
        <p className="text-base md:text-lg text-gray-700 leading-relaxed text-center md:text-left">
          {info.description}
        </p>

        <div className={`${colors.bg} rounded-lg p-3 border-l-4 ${colors.border}`}>
          <p className="text-sm font-semibold text-gray-800 mb-1 flex items-center gap-2">
            <ClipboardList className="w-4 h-4" />
            Instrucciones:
          </p>
          <p className="text-sm text-gray-700">{info.instruction}</p>
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-gray-600 font-medium">Progreso del test</span>
              <span className="text-xs text-gray-600 font-medium">
                {nextPhase === 'competencies' ? '~42%' : nextPhase === 'occupations' ? '~67%' : '~92%'} completado
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className={`${colors.accent} h-3 rounded-full transition-all duration-500`}
                style={{ width: nextPhase === 'competencies' ? '42%' : nextPhase === 'occupations' ? '67%' : (nextPhase === 'early_stop' ? '92%' : '92%') }}
              />
            </div>
          </div>
      </div>
    </TestViewportShell>
  );
};

export default PhaseTransition;
