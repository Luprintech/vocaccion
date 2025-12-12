/**
 * Índice de Artículos - VocAcción
 * 
 * Archivo central que exporta todos los componentes de artículos disponibles.
 * Facilita la importación y gestión de nuevos artículos.
 * 
 */

// Importación de todos los artículos disponibles
import ArticuloQueEstudiar from "./ArticuloQueEstudiar";
import ArticuloUniversidadFP from "./ArticuloUniversidadFP";

// Exportación individual de componentes
export { ArticuloQueEstudiar, ArticuloUniversidadFP };

// Exportación como objeto para fácil acceso
export const articulosDisponibles = {
  "que-estudiar": ArticuloQueEstudiar,
  "universidad-fp-cursos": ArticuloUniversidadFP
};

// Configuración base para nuevos artículos (plantilla)
export const plantillaArticulo = {
  id: "nuevo-articulo",
  titulo: "Título del nuevo artículo",
  descripcion: "Descripción breve del artículo",
  tiempoLectura: "X min",
  categoria: "Categoría",
  icono: null, // Importar icono de lucide-react
  popular: false,
  image: null, // URL opcional de imagen
  componente: null // Componente React
};

/**
 * Función helper para validar configuración de artículo
 * 
 * @param {Object} config - Configuración del artículo
 * @returns {boolean} - True si la configuración es válida
 */
export const validarConfigArticulo = (config) => {
  const camposRequeridos = ['id', 'titulo', 'descripcion', 'tiempoLectura', 'categoria', 'componente'];
  return camposRequeridos.every(campo => config[campo] != null);
};

export default articulosDisponibles;