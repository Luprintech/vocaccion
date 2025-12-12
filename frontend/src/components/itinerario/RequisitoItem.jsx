import React from 'react';
import { CheckCircle2, GraduationCap, BookOpen, Award, FileCheck } from 'lucide-react';

// Iconos rotativos para variedad visual
const iconos = [CheckCircle2, GraduationCap, BookOpen, Award, FileCheck];

export default function RequisitoItem({ requisito, index }) {
  // Seleccionar icono basado en el índice
  const IconComponent = iconos[index % iconos.length];

  return (
    <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300">
      <div className="flex items-start gap-3">
        {/* Icono en círculo morado */}
        <div className="flex-shrink-0 w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
          <IconComponent className="w-5 h-5 text-purple-600" strokeWidth={2} />
        </div>

        {/* Texto del requisito */}
        <div className="flex-1 pt-1">
          <p className="text-sm text-gray-700 leading-relaxed">
            {requisito}
          </p>
        </div>
      </div>
    </div>
  );
}
