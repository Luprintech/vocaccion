import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Search, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import RecursoCard from "@/components/RecursoCard";

/**
 * Página de Listado de Artículos - VocAcción
 * 
 * Vista que muestra todos los artículos disponibles con:
 * - Búsqueda por título/contenido
 * - Filtrado por categorías
 * - Ordenación por fecha/popularidad
 */

const ArticulosListado = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("todos");
  const [articulos, setArticulos] = useState([]);
  const [loading, setLoading] = useState(true);
  const API_URL = import.meta.env.VITE_API_URL;
  
  // Helper para categorizar basado en tipo o título
  const mapTipoCategoria = (tipo, titulo) => {
      const t = (tipo || '').toLowerCase();
      const tit = (titulo || '').toLowerCase();
      
      if (t === 'guía' || t === 'guia') return 'orientacion';
      if (t === 'video') return 'formacion';
      if (tit.includes('universidad')) return 'universidad';
      if (tit.includes('fp') || tit.includes('ciclo')) return 'fp';
      if (tit.includes('empleo') || tit.includes('trabajo') || tit.includes('curriculum')) return 'empleo';
      
      return 'orientacion'; // Default
  };

  // Fetch recursos desde Backend
  React.useEffect(() => {
    setLoading(true);
    fetch(`${API_URL}/recursos`)
      .then(res => res.json())
      .then(data => {
         console.log('Respuesta del backend:', data); // Debug
         
         // Verificar si hay datos
         if (data.success && Array.isArray(data.data)) {
             const rawData = data.data;
             
             const mappedData = rawData.map(item => {
                 // Resolver URL completa para imágenes del backend
                 let imageUrl = item.imagen_portada || item.imagen_portada_url || '/images/bannertest.png';
                 if (imageUrl && imageUrl.startsWith('/storage')) {
                     const baseUrl = API_URL.replace('/api', '');
                     imageUrl = `${baseUrl}${imageUrl}`;
                 }

                 return {
                 ...item,
                 // Normalización de campos para la UI
                 id: item.id,
                 slug: item.slug,
                 titulo: item.titulo,
                 descripcion: item.descripcion,
                 // Imagen: fallback chain
                 imagen: imageUrl,
                 // Categoría: mapping temporal mientras no haya campo categoría en BD recursos
                 categoria: mapTipoCategoria(item.tipo, item.titulo),
                 plan_requerido: item.plan_requerido || 'gratuito',
                 autor_nombre: item.autor_nombre || 'Equipo VocAcción', 
                 tiempo_lectura: item.tiempo_lectura || '5 min',
                 fechaPublicacion: new Date(item.created_at).toLocaleDateString(),
                 tags: [item.tipo, 'educación'], 
                 visualizaciones: item.visualizaciones || 0,
                 descargas: item.descargas || 0,
                 popular: !!item.destacado
             }});
             setArticulos(mappedData);
             console.log('Recursos cargados:', mappedData.length); // Debug
         } else {
             console.error('Formato de respuesta inesperado:', data);
             setArticulos([]);
         }
      })
      .catch(e => {
          console.error("Error fetching resources", e);
          setArticulos([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const [particles] = useState(() => {
    return Array.from({ length: 25 }, (_, i) => ({
      id: i,
      top: Math.random() * 100,
      left: Math.random() * 100,
      size: Math.random() * 4 + 2,
      opacity: Math.random() * 0.3 + 0.2,
      delay: Math.random() * 5000,
      color: Math.random() > 0.5 ? 'purple' : 'green',
      shade: Math.random() > 0.5 ? '300' : '400'
    }));
  });

  // Filtros disponibles (dinámicos con counts reales)
  const filtros = [
    { id: "todos", nombre: "Todos los artículos", count: articulos.length },
    { id: "orientacion", nombre: "Orientación", count: articulos.filter(a => a.categoria === "orientacion").length },
    { id: "formacion", nombre: "Formación", count: articulos.filter(a => a.categoria === "formacion" || a.categoria === "video").length },
    { id: "universidad", nombre: "Universidad", count: articulos.filter(a => a.categoria === "universidad").length },
    { id: "fp", nombre: "FP", count: articulos.filter(a => a.categoria === "fp").length },
    { id: "empleo", nombre: "Empleo", count: articulos.filter(a => a.categoria === "empleo").length }
  ];

  // Filtrar artículos
  const articulosFiltrados = articulos.filter(articulo => {
    const coincideBusqueda = searchTerm === "" || 
      articulo.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      articulo.descripcion?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Categoría coincide si es todos, o si es exacta
    const coincideCategoria = selectedFilter === "todos" || articulo.categoria === selectedFilter;
    
    return coincideBusqueda && coincideCategoria;
  });

  return (
    <div className="w-full">

      {/* Barra de búsqueda y filtros */}
      <div className="flex flex-col lg:flex-row gap-4 bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-purple-200 shadow-lg mb-8">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-purple-400 h-5 w-5" />
          <Input
            type="text"
            placeholder="Buscar artículos por título, contenido o etiquetas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-12 py-3 border-2 border-purple-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
          />
        </div>
        
        <div className="flex gap-2 overflow-x-auto pb-2 lg:pb-0">
          {filtros.map((filtro) => (
            <Button
              key={filtro.id}
              onClick={() => setSelectedFilter(filtro.id)}
              className={`whitespace-nowrap px-4 py-2 rounded-xl font-semibold transition-all duration-300 ${
                selectedFilter === filtro.id
                  ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg hover:shadow-xl'
                  : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-purple-300 hover:text-purple-700'
              }`}
            >
              {filtro.nombre} ({filtro.count})
            </Button>
          ))}
        </div>
      </div>

        {/* Resultados de búsqueda */}
        {searchTerm && (
          <div className="mb-6 p-4 bg-linear-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-xl shadow-md">
            <p className="text-blue-900 font-semibold">
              🔎 Se encontraron <span className="bg-blue-200 px-2 py-1 rounded-lg">{articulosFiltrados.length}</span> artículos 
              para "<span className="font-bold text-blue-700">{searchTerm}</span>"
              {selectedFilter !== "todos" && ` en ${filtros.find(f => f.id === selectedFilter)?.nombre}`}
            </p>
          </div>
        )}

        {/* Listado de artículos */}
        <section>
          {loading ? (
             <div className="text-center py-16">
                <p>Cargando recursos...</p>
             </div>
          ) : articulosFiltrados.length === 0 ? (
            <div className="text-center py-16 bg-white/80 backdrop-blur-sm rounded-2xl border-2 border-purple-200 shadow-lg">
              <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                No se encontraron artículos
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Prueba con otros términos de búsqueda o cambia los filtros aplicados para encontrar lo que buscas.
              </p>
              <Button onClick={() => {setSearchTerm(""); setSelectedFilter("todos");}} className="bg-linear-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-semibold px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
                Limpiar filtros
              </Button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {articulosFiltrados.map((articulo) => (
                <RecursoCard key={articulo.id} recurso={articulo} />
              ))}
            </div>
          )}
        </section>

          {/* Paginación (placeholder para futura implementación) */}
          {articulosFiltrados.length > 6 && (
            <div className="flex justify-center mt-12">
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled>
                  ← Anterior
                </Button>
                <Button variant="default" size="sm">
                  1
                </Button>
                <Button variant="outline" size="sm">
                  2
                </Button>
                <Button variant="outline" size="sm">
                  Siguiente →
                </Button>
              </div>
            </div>
          )}
    </div>
  );
};

export default ArticulosListado;