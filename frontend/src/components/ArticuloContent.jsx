import React from "react";
import { Card, CardContent } from "@/components/ui/card";

/**
 * Componente ArticuloContent - VocAcción
 * 
 * Componente reutilizable para mostrar el contenido completo de un artículo.
 * Proporciona estructura y estilos consistentes para artículos.
 * 
 * Props:
 * @param {string} title - Título principal del artículo
 * @param {string} tiempoLectura - Tiempo estimado de lectura
 * @param {string} categoria - Categoría del artículo
 * @param {ReactNode} content - Contenido JSX del artículo
 * @param {string} image - URL de imagen principal (opcional)
 */

const ArticuloContent = ({
  title,
  tiempoLectura,
  categoria,
  content,
  image = null
}) => {
  return (
    <article className="prose prose-lg mx-auto">
      {/* Header del artículo */}
      <header className="mb-8">
        {/* Imagen principal (si se proporciona) */}
        {image && (
          <div className="relative mb-8">
            <img
              src={image}
              alt={title}
              className="w-full h-64 md:h-80 object-cover rounded-xl shadow-lg"
            />
            <div className="absolute inset-0 bg-linear-to-t from-black/40 to-transparent rounded-xl" />
            <div className="absolute bottom-6 left-6 text-white">
              <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium mb-2">
                {categoria}
              </div>
            </div>
          </div>
        )}

        {/* Título principal */}
        <h1 className="text-4xl font-bold text-gray-900 mb-4">{title}</h1>
        
        {/* Metadatos */}
        <div className="flex items-center gap-4 text-gray-600">
          <span>{tiempoLectura} de lectura</span>
          <span>•</span>
          <span>{categoria}</span>
        </div>
      </header>

      {/* Contenido del artículo */}
      <div className="article-content">
        {content}
      </div>
    </article>
  );
};

/**
 * Componente ArticuloSection - Sección reutilizable para artículos
 * 
 * Props:
 * @param {string} title - Título de la sección
 * @param {ReactNode} children - Contenido de la sección
 * @param {string} className - Clases CSS adicionales
 */
export const ArticuloSection = ({ title, children, className = "" }) => (
  <section className={`mb-8 ${className}`}>
    <h2 className="text-2xl font-bold text-gray-900 mb-4">{title}</h2>
    {children}
  </section>
);

/**
 * Componente ArticuloHighlight - Caja destacada para contenido importante
 * 
 * Props:
 * @param {ReactNode} children - Contenido
 * @param {string} type - Tipo de highlight (info, warning, success, tip)
 * @param {ReactNode} icon - Icono opcional
 * @param {string} title - Título opcional
 */
export const ArticuloHighlight = ({ 
  children, 
  type = "info", 
  icon = null, 
  title = null 
}) => {
  const typeStyles = {
    info: "bg-blue-50 border-blue-400 text-blue-800",
    warning: "bg-amber-50 border-amber-400 text-amber-800", 
    success: "bg-green-50 border-green-400 text-green-800",
    tip: "bg-purple-50 border-purple-400 text-purple-800"
  };

  const iconStyles = {
    info: "text-blue-600",
    warning: "text-amber-600",
    success: "text-green-600", 
    tip: "text-purple-600"
  };

  return (
    <Card className={`${typeStyles[type]} border-l-4 p-6 mb-6`}>
      <CardContent className="p-0">
        <div className="flex items-start gap-3">
          {icon && (
            <div className={`shrink-0 mt-1 ${iconStyles[type]}`}>
              {icon}
            </div>
          )}
          <div className="flex-1">
            {title && (
              <h3 className="font-semibold mb-2">{title}</h3>
            )}
            <div>{children}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * Componente ArticuloList - Lista con viñetas estilizada
 * 
 * Props:
 * @param {Array} items - Array de elementos de la lista
 * @param {string} type - Tipo de lista (check, bullet, number)
 */
export const ArticuloList = ({ items, type = "bullet" }) => {
  const getListIcon = (type, index) => {
    switch (type) {
      case "check":
        return "✓";
      case "number":
        return `${index + 1}.`;
      default:
        return "•";
    }
  };

  return (
    <ul className="space-y-2 mb-4">
      {items.map((item, index) => (
        <li key={index} className="flex items-start gap-2">
          <span className={`shrink-0 font-medium ${
            type === "check" ? "text-green-600" : "text-primary"
          }`}>
            {getListIcon(type, index)}
          </span>
          <span className="text-gray-700">{item}</span>
        </li>
      ))}
    </ul>
  );
};

/**
 * Componente ArticuloGrid - Grid responsive para contenido
 * 
 * Props:
 * @param {ReactNode} children - Elementos del grid
 * @param {number} cols - Número de columnas (1-4)
 */
export const ArticuloGrid = ({ children, cols = 2 }) => {
  const gridCols = {
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
  };

  return (
    <div className={`grid ${gridCols[cols]} gap-4 mb-4`}>
      {children}
    </div>
  );
};

export default ArticuloContent;