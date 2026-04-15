import React from 'react';
import InteractiveMap from '../components/map/InteractiveMap';
import { MapPin } from 'lucide-react';

export default function MapaCentros() {
  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 rounded-t-2xl shadow-sm p-4 md:p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <MapPin className="w-5 h-5 text-indigo-600" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Explorador de Centros Educativos
          </h1>
        </div>
        <p className="text-sm text-gray-600">
          Descubre universidades, facultades y centros de formación con ubicación verificada. 
          Activa la categoría superior para cargar resultados, filtra por provincia y entra al detalle de los estudios impartidos.
        </p>
      </div>

      {/* Map Container */}
      <div className="bg-white rounded-b-2xl shadow-xl border border-t-0 border-gray-100 p-2 md:p-3">
        <div className="h-[600px] md:h-[700px]">
          <InteractiveMap />
        </div>
      </div>
    </div>
  );
}
