import React from 'react';
import { Headset } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function CTAOrientadorSection() {
  const navigate = useNavigate();

  return (
    <div className="w-full mt-8">
      <div className="
        bg-white rounded-2xl border border-purple-100 shadow-lg 
        p-6 md:p-10 
        flex flex-col md:flex-row items-center gap-8 
        transition-all duration-300 hover:shadow-xl hover:scale-[1.005]
      ">
        
        {/* Icono */}
        <div className="flex-shrink-0">
          <div className="w-16 h-16 rounded-full bg-[#F5F0FF] flex items-center justify-center text-[#A855F7] shadow-sm">
            <Headset className="w-8 h-8" strokeWidth={2} />
          </div>
        </div>

        {/* Texto */}
        <div className="flex-1 text-center md:text-left">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
            ¿Necesitas orientación personalizada?
          </h2>
          <p className="text-gray-600 text-sm md:text-base leading-relaxed">
            Reserva una sesión con un orientador profesional para ayudarte a definir y mejorar tu itinerario académico.
          </p>
        </div>

        {/* Botón */}
        <div className="flex-shrink-0 w-full md:w-auto">
          <button 
            onClick={() => navigate('/reservar')}
            className="
              w-full md:w-auto
              bg-gradient-to-r from-purple-600 to-green-500 
              text-white font-bold text-sm md:text-base
              px-8 py-4 rounded-xl shadow-md 
              hover:shadow-lg hover:to-green-400 hover:scale-105 
              transform transition-all duration-300 cursor-pointer
            "
          >
            Reservar sesión con un orientador
          </button>
        </div>

      </div>
    </div>
  );
}
