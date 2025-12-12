import React from "react";
import { Clock, ArrowRight, Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Componente ArticuloCard - VocAcción
 * 
 * Componente reutilizable para mostrar artículos en formato tarjeta.
 * Acepta props para personalizar el contenido y apariencia.
 * 
 * Props:
 * @param {string} id - Identificador único del artículo
 * @param {string} title - Título del artículo
 * @param {string} summary - Descripción breve del artículo
 * @param {string} tiempoLectura - Tiempo estimado de lectura
 * @param {string} categoria - Categoría del artículo
 * @param {ReactNode} icono - Icono a mostrar
 * @param {boolean} popular - Si el artículo es popular
 * @param {string} image - URL de la imagen (opcional)
 * @param {function} onSelect - Función callback al hacer clic
 */

const ArticuloCard = ({
  id,
  title,
  summary,
  tiempoLectura,
  categoria,
  icono,
  popular = false,
  image = null,
  onSelect
}) => {
  return (
    <Card 
      className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-0 shadow-lg"
      onClick={() => onSelect(id)}
    >
      {/* Imagen del artículo (si se proporciona) */}
      {image && (
        <div className="relative overflow-hidden rounded-t-lg">
          <img
            src={image}
            alt={title}
            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-linear-to-t from-black/20 to-transparent" />
        </div>
      )}

      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4 flex-1">
            {/* Icono del artículo */}
            <div className="shrink-0 w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center group-hover:bg-primary/20 transition-colors duration-300">
              {icono}
            </div>
            
            <div className="flex-1">
              {/* Metadatos del artículo */}
              <div className="flex items-center gap-3 mb-3 flex-wrap">
                <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium">
                  {categoria}
                </span>
                {popular && (
                  <div className="flex items-center gap-1 text-amber-600">
                    <Star className="h-4 w-4" />
                    <span className="text-sm font-medium">Popular</span>
                  </div>
                )}
                <div className="flex items-center gap-1 text-gray-500">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm">{tiempoLectura}</span>
                </div>
              </div>
              
              {/* Título del artículo */}
              <CardTitle className="text-xl font-bold text-gray-900 group-hover:text-primary transition-colors duration-300 mb-2">
                {title}
              </CardTitle>
              
              {/* Resumen del artículo */}
              <p className="text-gray-600 leading-relaxed">
                {summary}
              </p>
            </div>
          </div>
          
          {/* Icono de flecha */}
          <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-primary group-hover:translate-x-1 transition-all duration-300 shrink-0" />
        </div>
      </CardHeader>
    </Card>
  );
};

export default ArticuloCard;