import React from 'react';
import { Sparkles, Quote } from 'lucide-react';

export default function ConsejoMotivadorSection({ consejo }) {
  if (!consejo) return null;

  return (
    <div className="relative w-full mt-8">
      <div className="
        relative overflow-hidden
        bg-gradient-to-r from-[#F3E8FF] to-[#ECFDF5] 
        rounded-[24px] 
        shadow-[0_4px_20px_-4px_rgba(124,58,237,0.1)] 
        border border-white/50
        p-8 md:p-10
        flex flex-col md:flex-row items-center justify-center gap-6
        transition-transform duration-300 hover:scale-[1.01]
      ">
        
        {/* Decoración de fondo sutil */}
        <div className="absolute top-0 left-0 w-full h-full opacity-30 pointer-events-none">
          <div className="absolute -top-10 -left-10 w-40 h-40 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-50"></div>
          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-emerald-200 rounded-full mix-blend-multiply filter blur-3xl opacity-50"></div>
        </div>



        {/* Texto */}
        <div className="relative z-10 w-full text-center px-4">
           <p className="text-lg md:text-xl font-medium text-gray-700 italic leading-relaxed font-sans">
             "{consejo}"
           </p>
        </div>

      </div>
    </div>
  );
}
