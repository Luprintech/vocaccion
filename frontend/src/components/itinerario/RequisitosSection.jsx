import React, { useState, useMemo } from 'react';
import { 
  Code2, 
  Database, 
  MessageCircle, 
  Users, 
  Lightbulb, 
  Puzzle,
  Globe,
  Cpu,
  BarChart,
  BrainCircuit,
  CheckCircle2,
  Clock,
  Zap,
  Target
} from 'lucide-react';

export default function RequisitosSection({ requisitos = [], titulo = "Habilidades Técnicas y Blandas" }) {
  const [selectedSkills, setSelectedSkills] = useState({});

  const items = useMemo(() => {
    // ESTRICTO: Usar solo lo que viene de la API. 
    //Backend está configurado para mandar siempre 9.
    return (requisitos || []).map(req => {
       if (typeof req === 'string') return { titulo: req, descripcion: "Competencia clave recomendada para tu perfil." };
       return { 
         titulo: req.titulo || req.nombre || "Habilidad", 
         descripcion: req.descripcion || req.desc || "Competencia clave recomendada para tu perfil."
       };
    });
  }, [requisitos]);

  const toggleSkill = (index) => {
    setSelectedSkills(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const getIcon = (text) => {
    const t = (text || '').toLowerCase();
    if (t.includes('program') || t.includes('código') || t.includes('dev')) return Code2;
    if (t.includes('dato') || t.includes('analis') || t.includes('sql')) return Database;
    if (t.includes('comunic') || t.includes('idioma') || t.includes('hablar')) return MessageCircle;
    if (t.includes('equip') || t.includes('colab') || t.includes('lider')) return Users;
    if (t.includes('creat') || t.includes('diseño') || t.includes('innov')) return Lightbulb;
    if (t.includes('prob') || t.includes('logic') || t.includes('criti')) return Puzzle;
    if (t.includes('web') || t.includes('net') || t.includes('digit')) return Globe;
    if (t.includes('herram') || t.includes('tec') || t.includes('soft')) return Cpu;
    if (t.includes('gest') || t.includes('org') || t.includes('agil')) return BarChart;
    if (t.includes('tiempo') || t.includes('plan')) return Clock;
    if (t.includes('adap') || t.includes('flex')) return Zap;
    if (t.includes('emoc') || t.includes('intel')) return BrainCircuit;
    
    return Target;
  };

  if (!items || items.length === 0) return null;

  return (
    <div className="bg-white rounded-3xl shadow-lg p-8 border border-gray-100 relative overflow-hidden">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center gap-5 mb-8">
        <div className="w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center shadow-inner text-purple-600 border border-purple-100">
          <BrainCircuit className="w-8 h-8" strokeWidth={1.5} />
        </div>
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight mb-1">{titulo}</h2>
          <p className="text-gray-500 font-medium text-sm md:text-base">Selecciona las competencias que ya tienes</p>
        </div>
      </div>

      {/* Grid 3x3 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {items.map((item, index) => {
          const isSelected = !!selectedSkills[index];
          const Icon = getIcon(item.titulo);

          return (
            <div
              key={index}
              onClick={() => toggleSkill(index)}
              className={`
                group cursor-pointer relative p-5 rounded-2xl border-2 text-left transition-all duration-300 w-full h-full flex items-start gap-4 select-none
                ${isSelected 
                  ? 'border-[#7b3fe4] bg-[#f7f0ff] shadow-md scale-[1.02]' 
                  : 'border-transparent bg-gray-50 hover:bg-white hover:border-gray-200 hover:shadow-lg hover:-translate-y-1'
                }
              `}
            >
              {isSelected && (
                <div className="absolute top-3 right-3 text-[#7b3fe4] animate-in fade-in zoom-in duration-200">
                  <CheckCircle2 className="w-5 h-5 fill-purple-100" />
                </div>
              )}

              <div className={`
                w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 transition-colors duration-300
                ${isSelected ? 'bg-purple-100 text-[#7b3fe4]' : 'bg-white text-gray-400 group-hover:text-[#7b3fe4] group-hover:bg-purple-50 shadow-sm'}
              `}>
                <Icon className="w-6 h-6" strokeWidth={2} />
              </div>

              <div className="flex-1 pr-4 pt-1">
                <h3 className={`font-bold text-sm mb-1 leading-snug transition-colors ${isSelected ? 'text-[#7b3fe4]' : 'text-gray-800'}`}>
                  {item.titulo}
                </h3>
                <p className={`text-xs leading-relaxed line-clamp-2 ${isSelected ? 'text-purple-800/70' : 'text-gray-500'}`}>
                   {item.descripcion}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
