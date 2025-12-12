import React from 'react';
import { 
  Lightbulb, 
  Rocket, 
  Target, 
  Zap, 
  Award,
  Briefcase,
  TrendingUp, 
  Users,
  Star,
  Compass
} from 'lucide-react';

export default function RecomendacionesSection({ recomendaciones }) {
  // Configuración de iconos y estilos por categoría simulada
  const getIconAndStyle = (index) => {
    // Array de iconos variados para dar dinamismo
    const icons = [Lightbulb, Rocket, Users, Target, TrendingUp, Compass, Award, Briefcase, Star, Zap];
    const Icon = icons[index % icons.length];
    
    // Colores pastel variados para los fondos de iconos
    const styles = [
      { bg: "bg-amber-50", text: "text-amber-600" },
      { bg: "bg-blue-50", text: "text-blue-600" },
      { bg: "bg-purple-50", text: "text-purple-600" },
      { bg: "bg-emerald-50", text: "text-emerald-600" },
      { bg: "bg-rose-50", text: "text-rose-600" },
      { bg: "bg-cyan-50", text: "text-cyan-600" },
    ];
    const style = styles[index % styles.length];
    
    return { Icon, style };
  };

  // Procesar items para asegurar título/descripción y limitar a 6
  const processItems = (items) => {
    if (!items) return [];
    
    // Aplanar y limpiar
    let processed = items.map((item, index) => {
      let titulo = "";
      let descripcion = "";

      if (typeof item === 'object' && item !== null) {
        titulo = item.titulo || "";
        descripcion = item.descripcion || item.texto || "";
      } else if (typeof item === 'string') {
        // Intentar separar título: descripción si existe
        if (item.includes(':')) {
           const parts = item.split(':');
           if (parts[0].length < 40) { // Asumir es título si es corto
             titulo = parts[0].trim();
             descripcion = parts.slice(1).join(':').trim();
           } else {
             descripcion = item;
           }
        } else {
           descripcion = item;
        }
      }

      // Títulos fallback creativos si no se detectó uno
      if (!titulo) {
        const fallbacks = ["Consejo Clave", "Estrategia", "Networking", "Skill Boost", "Diferenciación", "Visión"];
        titulo = fallbacks[index % fallbacks.length];
      }

      // Limpiar descripción
      if (descripcion.length > 120) {
        descripcion = descripcion.substring(0, 117) + "...";
      }

      return { titulo, descripcion };
    });

    // Limitar estrictamente a 6
    return processed.slice(0, 6);
  };

  const finalItems = processItems(recomendaciones);

  if (finalItems.length === 0) return null;

  return (
    <div className="bg-white rounded-3xl shadow-lg p-6 md:p-8 border border-gray-100 relative overflow-hidden">
      
      {/* Header Unificado (Estilo Habilidades) */}
      <div className="flex flex-col md:flex-row md:items-center gap-5 mb-8">
        <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center shadow-inner text-amber-600 border border-amber-100 flex-shrink-0">
          <Lightbulb className="w-8 h-8" strokeWidth={1.5} />
        </div>
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight mb-1">
            Recomendaciones Estratégicas
          </h2>
          <p className="text-gray-500 font-medium text-sm md:text-base">
            Sugerencias clave para impulsar tu perfil profesional
          </p>
        </div>
      </div>

      {/* Grid compacta (Gap reducido) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {finalItems.map((item, idx) => {
          const { Icon, style } = getIconAndStyle(idx);

          return (
            <div 
              key={idx}
              className="group bg-gray-50 hover:bg-white rounded-2xl p-5 border border-gray-200/60 hover:border-gray-200 hover:shadow-md transition-all duration-300 flex flex-col items-start h-full"
            >
              {/* Icono + Título Row */}
              <div className="flex items-center gap-3 mb-3 w-full">
                  <div className={`w-10 h-10 rounded-full ${style.bg} ${style.text} flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300 flex-shrink-0`}>
                    <Icon className="w-5 h-5" strokeWidth={2} />
                  </div>
                  <h3 className="text-base font-bold text-gray-900 leading-tight group-hover:text-purple-700 transition-colors line-clamp-2">
                    {item.titulo}
                  </h3>
              </div>

              {/* Descripción */}
              <p className="text-gray-600 text-sm leading-relaxed pl-1">
                {item.descripcion}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
