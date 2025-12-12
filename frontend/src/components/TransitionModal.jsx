import React from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';

export default function TransitionModal({ isOpen, insight, onContinue }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative overflow-hidden animate-bounceIn border border-white/50">
        
        {/* Decoración de fondo */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-100 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl opacity-50"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-green-100 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl opacity-50"></div>

        <div className="relative z-10 text-center">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-200">
            <Sparkles className="text-white w-6 h-6 animate-pulse" />
          </div>

          <h3 className="text-xl font-bold text-gray-800 mb-2">
            Descubriendo tu perfil...
          </h3>
          
          <div className="bg-purple-50 p-4 rounded-xl border border-purple-100 mb-6">
            <p className="text-gray-700 italic font-medium leading-relaxed">
              "{insight}"
            </p>
          </div>

          <button
            onClick={onContinue}
            className="w-full bg-gray-900 hover:bg-black text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all hover:scale-[1.02] shadow-xl cursor-pointer"
          >
            <span>Continuar</span>
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
