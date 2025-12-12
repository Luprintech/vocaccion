import React, { useState, useCallback } from 'react';
import { Route, CheckCircle2, ChevronDown, BookOpen, GraduationCap, Briefcase, Cpu, Clock, BarChart, User, Award, Timer } from 'lucide-react';
import PasoItem from './PasoItem';

export default function ViaFormativaCard({ via, index, isSelected, isAnySelected, onSelect }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [manualStepsState, setManualStepsState] = useState({});

  const handleStepToggle = useCallback((idx, isComplete) => {
     setManualStepsState(prev => {
         if (prev[idx] === isComplete) return prev;
         return { ...prev, [idx]: isComplete };
     });
  }, []);

  const getViaInfo = (id, nombreOriginal) => {
    const idLower = id?.toLowerCase() || '';
    const nombreLower = nombreOriginal?.toLowerCase() || '';

    if (idLower === 'universitaria' || nombreLower.includes('universitaria')) {
      return {
        titulo: "Vía Universitaria",
        subtitulo: "Formación universitaria reglada",
        icono: GraduationCap,
      };
    } else if (idLower === 'fp' || nombreLower.includes('fp') || nombreLower.includes('ciclo')) {
      return {
        titulo: "Vía FP",
        subtitulo: "Formación profesional técnica",
        icono: Briefcase,
      };
    } else if (idLower === 'autodidacta' || nombreLower.includes('autodidacta')) {
      return {
        titulo: "Vía Autodidacta",
        subtitulo: "Aprendizaje autónomo y certificaciones",
        icono: Cpu,
      };
    }
    
    return {
      titulo: nombreOriginal,
      subtitulo: "Opción formativa",
      icono: Route,
    };
  };

  const info = getViaInfo(via.id, via.titulo || via.nombre_via || via.nombre);
  const Icon = info.icono;

  const isStepDone = (paso, idx) => {
     if (manualStepsState[idx] !== undefined) return manualStepsState[idx];
     if (paso.completado) return true;
     return localStorage.getItem(`paso_${idx}`) === 'true';
  };

  const handleClick = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div 
      className={`
        relative overflow-visible rounded-2xl bg-white transition-all duration-300
        ${isSelected 
          ? 'border-2 border-purple-500 shadow-[0_0_12px_rgba(168,85,247,0.35)] scale-[1.01] z-10' 
          : `border border-gray-100 hover:border-gray-300 hover:shadow-xl hover:scale-[1.01] shadow-sm ${isAnySelected ? 'opacity-60 grayscale-[0.3]' : ''}`
        }
      `}
    >
      {/* Badge Flotante "Seleccionada" */}
      {isSelected && (
        <div className="absolute -top-3 -right-3 z-20">
          <span className="bg-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            Seleccionada
          </span>
        </div>
      )}

      {/* HEADER DE LA VÍA */}
      <div 
        className="p-6 flex flex-col md:flex-row items-center gap-6 cursor-pointer"
        onClick={handleClick}
      >
        {/* Icono Redondeado Grande */}
        <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm group-hover:bg-purple-200 transition-colors">
          <Icon className="w-8 h-8" strokeWidth={2} />
        </div>

        {/* Títulos y Subtítulos */}
        <div className="flex-1 text-center md:text-left min-w-0">
          <h3 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-purple-600 to-green-600 bg-clip-text text-transparent truncate pb-1">
            {info.titulo}
          </h3>
          <p className="text-sm text-gray-500 font-medium">
            {info.subtitulo}
          </p>
        </div>

        {/* Acciones (Botón y Chevron) */}
        <div className="flex items-center gap-4 w-full md:w-auto mt-4 md:mt-0 justify-between md:justify-end">
          {/* Botón de Selección */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelect();
            }}
            className={`
              flex-1 md:flex-none px-6 py-3 rounded-xl text-sm font-bold transition-all shadow-md active:scale-95 cursor-pointer
              ${isSelected 
                ? 'bg-purple-100 text-purple-700 cursor-default' 
                : 'bg-gradient-to-r from-purple-600 to-green-600 text-white hover:shadow-lg hover:scale-105'
              }
            `}
          >
            {isSelected ? 'Tu elección' : 'Elegir esta vía'}
          </button>

          {/* Indicador expansión */}
          <div className={`p-2 rounded-full transition-colors ${isExpanded ? 'bg-purple-50 text-purple-600' : 'bg-gray-50 text-gray-400'}`}>
             <ChevronDown className={`w-6 h-6 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
          </div>
        </div>
      </div>

      {/* CONTENIDO EXPANDIBLE */}
      <div className={`
          overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]
          ${isExpanded ? 'max-h-[3000px] opacity-100' : 'max-h-0 opacity-0'}
      `}>
        <div className="px-6 pb-8 pt-2 border-t border-purple-50/50">
          
          {/* Descripción */}
          <div className="mb-8 mt-4 text-gray-600 text-sm leading-relaxed bg-gray-50/50 p-4 rounded-xl border border-gray-100">
            {via.descripcion}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Columna Izquierda: Requisitos y Enlaces */}
            <div className="lg:col-span-4 space-y-6 order-2 lg:order-1">
               {/* Requisitos */}
               {via.requisitos && via.requisitos.length > 0 && (
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                  <h4 className="flex items-center gap-2 text-sm font-bold mb-4 text-purple-700">
                    <BookOpen className="w-4 h-4" />
                    Requisitos de Acceso
                  </h4>
                  <ul className="space-y-3">
                    {via.requisitos.map((req, idx) => (
                      <li key={idx} className="text-sm text-gray-600 flex items-start gap-3">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-1.5 flex-shrink-0" />
                        {req}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Enlaces */}
              {via.enlaces_utiles && via.enlaces_utiles.length > 0 && (
                <div className="bg-blue-50/50 p-5 rounded-2xl border border-blue-100">
                  <h4 className="text-xs font-bold text-blue-800 uppercase tracking-wider mb-4">
                    Enlaces de Interés
                  </h4>
                  <div className="space-y-2">
                    {via.enlaces_utiles.map((link, idx) => (
                      <a 
                        key={idx}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 rounded-xl bg-white border border-blue-100 hover:border-blue-300 hover:shadow-md transition-all group"
                      >
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs group-hover:scale-110 transition-transform">
                          🔗
                        </div>
                        <span className="text-sm text-gray-700 font-medium group-hover:text-blue-700 truncate">
                          {link.titulo}
                        </span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* RESUMEN DE LA VÍA (Nuevo Componente) */}
              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden">
                {/* Decoración de fondo */}
                <div className="absolute top-0 right-0 w-20 h-20 bg-gray-50 rounded-full -mr-10 -mt-10 opacity-50"></div>
                
                <h4 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2 relative z-10">
                  <BarChart className="w-4 h-4 text-purple-600" />
                  Resumen de la Vía
                </h4>

                <div className="space-y-4 relative z-10">
                  
                  {/* Duración (Reutilizando lógica) */}
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center flex-shrink-0">
                      <Timer className="w-4 h-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Duración</p>
                      <p className="text-sm font-bold text-gray-700">
                        {(() => {
                            let totalYears = 0;
                            const isAutodidacta = via.id === 'autodidacta' || via.titulo?.toLowerCase().includes('autodidacta');
                            (via.pasos || []).forEach((paso, idx) => {
                               if (!isStepDone(paso, idx)) {
                                  const t = (typeof paso === 'object' ? paso.titulo : paso).toLowerCase();
                                  if (t.includes('grado superior') || t.includes('técnico superior')) totalYears += 2;
                                  else if (t.includes('grado medio') || t.includes('ciclo formativo')) totalYears += 2;
                                  else if (t.includes('bachiller')) totalYears += 2;
                                  else if (t.includes('universidad') || t.includes('grado ') || t.includes('carrera')) totalYears += 4;
                                  else if (t.includes('máster') || t.includes('master')) totalYears += 1.5;
                                  else if (t.includes('especialización')) totalYears += 1;
                                  else if (t.includes('doctorado')) totalYears += 3;
                                  else if (t.includes('ebau')) totalYears += 0.5;
                                  else if (t.includes('curso') || t.includes('certifica')) totalYears += 0.5;
                                  else if (t.includes('fundamento') || t.includes('básico')) totalYears += 0.3;
                                  else if (t.includes('avanzado') || t.includes('profundización')) totalYears += 0.5;
                                  else if (t.includes('proyecto') || t.includes('portfolio') || t.includes('práctica')) totalYears += 0.3;
                                  else if (isAutodidacta) totalYears += 0.5;
                               }
                            });
                            if (totalYears <= 0) return 'Ritmo propio';
                            if (totalYears < 1) return `${Math.ceil(totalYears * 12)} meses (aprox)`;
                            return `${totalYears} años (aprox)`;
                        })()}
                      </p>
                    </div>
                  </div>

                  {/* Datos Inferidos según tipo de vía */}
                  {(() => {
                    const idLower = via.id?.toLowerCase() || '';
                    const tituloLower = via.titulo?.toLowerCase() || '';
                    
                    let data = {
                      nivel: "Certificación Profesional",
                      dificultad: "Media",
                      perfil: "Práctico y dinámico",
                      competencias: ["Habilidades técnicas", "Resolución de problemas"]
                    };

                    if (idLower === 'universitaria' || tituloLower.includes('universitaria') || tituloLower.includes('universidad')) {
                      data = {
                         nivel: "Grado / Máster Oficial",
                         dificultad: "Alta",
                         perfil: "Analítico e Investigador",
                         competencias: ["Pensamiento crítico", "Base teórica profunda", "Investigación", "Gestión de proyectos complejos"]
                      };
                    } else if (idLower === 'fp' || tituloLower.includes('fp') || tituloLower.includes('ciclo') || tituloLower.includes('téc')) {
                       data = {
                         nivel: "Técnico / Técnico Superior",
                         dificultad: "Media",
                         perfil: "Técnico y Práctico",
                         competencias: ["Inserción laboral rápida", "Destreza técnica", "Trabajo en equipo", "Aplicación directa"]
                      };
                    } else if (idLower === 'autodidacta' || tituloLower.includes('autodidacta')) {
                       data = {
                         nivel: "Portfolio / Certificaciones",
                         dificultad: "Alta (Autodisciplina)",
                         perfil: "Proactivo y Autónomo",
                         competencias: ["Autogestión", "Adaptabilidad", "Aprendizaje continuo", "Marca personal"]
                      };
                    }

                    return (
                      <>
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                            <Award className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Nivel y Dificultad</p>
                            <p className="text-sm font-bold text-gray-700">{data.nivel}</p>
                            <span className="inline-block mt-1 text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-500">
                              Dificultad: {data.dificultad}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0">
                            <User className="w-4 h-4 text-green-600" />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Perfil Recomendado</p>
                            <p className="text-sm text-gray-600 leading-snug">{data.perfil}</p>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-gray-50 mt-2">
                           <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Competencias Clave</p>
                           <ul className="space-y-1">
                             {data.competencias.slice(0, 3).map((comp, i) => (
                               <li key={i} className="flex items-center gap-2 text-xs text-gray-600">
                                 <span className="w-1 h-1 rounded-full bg-purple-400" />
                                 {comp}
                               </li>
                             ))}
                           </ul>
                        </div>
                      </>
                    );
                  })()}
                  
                </div>
              </div>

            </div>

            {/* Columna Derecha: Timeline de Pasos */}
            <div className="lg:col-span-8 order-1 lg:order-2">
              <div className="relative pl-2">
                <h4 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                   <span className="bg-green-100 text-green-700 px-3 py-1 rounded-lg text-sm">Paso a paso</span>
                </h4>
                
                {/* Línea del timeline */}
                <div className="absolute left-6 top-12 bottom-12 w-0.5 bg-gradient-to-b from-purple-200 to-green-100" />
                
                <div className="space-y-2">
                  {(via.pasos || []).map((paso, idx) => (
                    <PasoItem 
                      key={idx} 
                      paso={paso} 
                      index={idx}
                      numero={idx + 1}
                      totalPasos={via.pasos.length}
                      onToggle={handleStepToggle} 
                    />
                  ))}
                </div>



              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
