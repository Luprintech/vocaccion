import React, { useState } from "react";
import { useToast } from '@/components/ToastProvider';
import { Link } from "react-router-dom";
import { ArrowLeft, Search, Download, FileText, Calendar, Star, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

/**
 * Página de Listado de Guías Descargables - VocAcción
 * 
 * Vista que muestra todas las guías y recursos descargables disponibles
 * con funcionalidad de búsqueda, filtrado y descarga directa
 */

const GuiasListado = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("todos");
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
  const { showToast } = useToast();

  // Base de datos de guías descargables
  const guias = [
    {
      id: 1,
      slug: "guia-becas-2025",
      titulo: "Guía Completa de Becas 2025",
      descripcion: "Todas las becas disponibles para estudiantes españoles: requisitos, plazos, cuantías y cómo solicitarlas paso a paso.",
      categoria: "ayudas",
      formato: "PDF",
      tamano: "2.4 MB",
      paginas: 24,
      fechaActualizacion: "Enero 2025",
      descargas: 1247,
      valoracion: 4.8,
      popular: true,
      gratuito: true,
      preview: "/previews/guia-becas-2025.jpg",
      tags: ["becas", "ayudas", "financiación", "estudiantes"]
    },
    {
      id: 2,
      slug: "comparativa-carreras-tecnologicas",
      titulo: "Comparativa de Carreras Tecnológicas",
      descripcion: "Análisis detallado de 15 carreras tecnológicas: salarios, empleabilidad, competencias requeridas y salidas profesionales.",
      categoria: "carreras",
      formato: "PDF",
      tamano: "3.1 MB",
      paginas: 32,
      fechaActualizacion: "Diciembre 2024",
      descargas: 892,
      valoracion: 4.6,
      popular: true,
      gratuito: true,
      preview: "/previews/carreras-tecnologicas.jpg", 
      tags: ["tecnología", "carreras", "salarios", "empleabilidad"]
    },
    {
      id: 3,
      slug: "checklist-selectividad",
      titulo: "Checklist para Selectividad (EBAU)",
      descripcion: "Lista de verificación completa para preparar la selectividad: documentación, fechas, estrategias de estudio y consejos.",
      categoria: "examenes",
      formato: "PDF",
      tamano: "1.2 MB", 
      paginas: 12,
      fechaActualizacion: "Enero 2025",
      descargas: 2156,
      valoracion: 4.9,
      popular: true,
      gratuito: true,
      preview: "/previews/checklist-selectividad.jpg",
      tags: ["selectividad", "ebau", "preparación", "examenes"]
    },
    {
      id: 4,
      slug: "guia-fp-superior",
      titulo: "Guía de Ciclos de FP Superior",
      descripcion: "Directorio completo de todos los ciclos de Grado Superior disponibles en España con requisitos y centros.",
      categoria: "fp",
      formato: "PDF",
      tamano: "4.2 MB",
      paginas: 48,
      fechaActualizacion: "Enero 2025",
      descargas: 756,
      valoracion: 4.5,
      popular: false,
      gratuito: true,
      preview: "/previews/fp-superior.jpg",
      tags: ["fp", "grado superior", "ciclos", "formación"]
    },
    {
      id: 5,
      slug: "test-autoconocimiento",
      titulo: "Test de Autoconocimiento Vocacional",
      descripcion: "Cuestionario interactivo imprimible para explorar tus intereses, valores y habilidades de forma estructurada.",
      categoria: "tests",
      formato: "PDF",
      tamano: "800 KB",
      paginas: 8,
      fechaActualizacion: "Diciembre 2024",
      descargas: 1543,
      valoracion: 4.7,
      popular: false,
      gratuito: true,
      preview: "/previews/test-autoconocimiento.jpg",
      tags: ["test", "autoconocimiento", "vocación", "intereses"]
    },
    {
      id: 6,
      slug: "calendario-academico-2024-25",
      titulo: "Calendario Académico 2024-25",
      descripcion: "Fechas importantes de todas las comunidades autónomas: inicio de curso, vacaciones, selectividad y preinscripciones.",
      categoria: "calendario", 
      formato: "PDF",
      tamano: "1.8 MB",
      paginas: 16,
      fechaActualizacion: "Septiembre 2024",
      descargas: 634,
      valoracion: 4.4,
      popular: false,
      gratuito: true,
      preview: "/previews/calendario-academico.jpg",
      tags: ["calendario", "fechas", "curso", "ccaa"]
    },
    {
      id: 7,
      slug: "plantillas-cv-estudiantes",
      titulo: "Plantillas de CV para Estudiantes",
      descripcion: "5 plantillas de currículum optimizadas para estudiantes sin experiencia laboral, con ejemplos y consejos de redacción.",
      categoria: "empleo",
      formato: "ZIP (Word + PDF)",
      tamano: "2.6 MB",
      paginas: "5 plantillas",
      fechaActualizacion: "Enero 2025",
      descargas: 1098,
      valoracion: 4.3,
      popular: false,
      gratuito: true,
      preview: "/previews/plantillas-cv.jpg",
      tags: ["cv", "plantillas", "empleo", "estudiantes"]
    },
    {
      id: 8,
      slug: "guia-estudiar-extranjero",
      titulo: "Guía para Estudiar en el Extranjero",
      descripcion: "Todo lo que necesitas saber para estudiar fuera de España: programas, becas, trámites y experiencias reales.",
      categoria: "internacional",
      formato: "PDF",
      tamano: "3.7 MB", 
      paginas: 36,
      fechaActualizacion: "Noviembre 2024",
      descargas: 423,
      valoracion: 4.6,
      popular: false,
      gratuito: true,
      preview: "/previews/estudiar-extranjero.jpg",
      tags: ["extranjero", "erasmus", "internacional", "becas"]
    }
  ];

  // Filtros disponibles
  const filtros = [
    { id: "todos", nombre: "Todas las guías", count: guias.length },
    { id: "ayudas", nombre: "Becas y Ayudas", count: guias.filter(g => g.categoria === "ayudas").length },
    { id: "carreras", nombre: "Carreras y Grados", count: guias.filter(g => g.categoria === "carreras").length },
    { id: "fp", nombre: "Formación Profesional", count: guias.filter(g => g.categoria === "fp").length },
    { id: "examenes", nombre: "Exámenes", count: guias.filter(g => g.categoria === "examenes").length },
    { id: "tests", nombre: "Tests Vocacionales", count: guias.filter(g => g.categoria === "tests").length },
    { id: "empleo", nombre: "Empleo", count: guias.filter(g => g.categoria === "empleo").length },
    { id: "internacional", nombre: "Internacional", count: guias.filter(g => g.categoria === "internacional").length }
  ];

  // Filtrar guías basado en búsqueda y filtros
  const guiasFiltradas = guias.filter(guia => {
    const coincideBusqueda = searchTerm === "" || 
      guia.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      guia.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
      guia.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const coincideCategoria = selectedFilter === "todos" || guia.categoria === selectedFilter;
    
    return coincideBusqueda && coincideCategoria;
  });

  const handleDownload = (guia) => {
    // Simular descarga (en producción sería una URL real)
    showToast('info', `Descargando: ${guia.titulo}`);
  };

  return (
    <main className="min-h-screen bg-linear-to-br from-purple-50 via-white to-green-50 relative overflow-hidden">
      {/* FONDO ANIMADO */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-1/2 right-0 w-96 h-96 bg-green-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
        {particles.map((particle) => (
          <div
            key={particle.id}
            className={`absolute bg-${particle.color}-${particle.shade} rounded-full animate-float`}
            style={{
              top: `${particle.top}%`,
              left: `${particle.left}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              opacity: particle.opacity,
              animationDelay: `${particle.delay}ms`
            }}
          />
        ))}
      </div>

      <div className="relative z-10 px-6 md:px-20 py-16">
        <div className="container mx-auto px-4">
          {/* Navegación breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-gray-600 mb-8">
            <Link to="/recursos" className="hover:text-purple-600 transition-colors font-medium">
              Recursos
            </Link>
            <span className="text-purple-400">/</span>
            <span className="font-bold text-purple-700">Guías Descargables</span>
          </nav>

          {/* Encabezado */}
          <header className="mb-12">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
              <div>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm border border-purple-200 text-purple-700 text-sm font-semibold mb-4 shadow-lg">
                  <Sparkles className="h-4 w-4" />
                  Recursos Descargables
                </div>
                <h1 className="text-4xl lg:text-5xl font-extrabold bg-linear-to-r from-purple-600 via-purple-700 to-green-600 bg-clip-text text-transparent mb-4 animate-gradientShift">
                  Guías y Recursos
                </h1>
                <p className="text-lg text-gray-700 font-medium max-w-2xl">
                  Documentos PDF listos para descargar, consultar offline y compartir con familia y amigos
                </p>
              </div>
              
              <Link to="/recursos">
                <Button className="bg-linear-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-semibold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Volver
                </Button>
              </Link>
            </div>

            {/* Barra de búsqueda y filtros */}
            <div className="flex flex-col lg:flex-row gap-4 bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-purple-200 shadow-lg">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-purple-400 h-5 w-5" />
                <Input
                  type="text"
                  placeholder="🔍 Buscar guías por título, contenido o etiquetas..."
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
                        ? 'bg-linear-to-r from-purple-500 to-purple-600 text-white shadow-lg hover:shadow-xl'
                        : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-purple-300 hover:text-purple-700'
                    }`}
                  >
                    {filtro.nombre} ({filtro.count})
                  </Button>
                ))}
              </div>
            </div>
          </header>

        {/* Resultados de búsqueda */}
        {searchTerm && (
          <div className="mb-6 p-4 bg-linear-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-xl shadow-md">
            <p className="text-blue-900 font-semibold">
              🔎 Se encontraron <span className="bg-blue-200 px-2 py-1 rounded-lg">{guiasFiltradas.length}</span> guías 
              para "<span className="font-bold text-blue-700">{searchTerm}</span>"
              {selectedFilter !== "todos" && ` en <strong>${filtros.find(f => f.id === selectedFilter)?.nombre}</strong>`}
            </p>
          </div>
        )}

        {/* Listado de guías */}
        <section>
          {guiasFiltradas.length === 0 ? (
            <div className="text-center py-16 bg-white/80 backdrop-blur-sm rounded-2xl border-2 border-purple-200 shadow-lg">
              <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                No se encontraron guías
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Prueba con otros términos de búsqueda o cambia los filtros aplicados para encontrar lo que buscas.
              </p>
              <Button onClick={() => {setSearchTerm(""); setSelectedFilter("todos");}} className="bg-linear-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-semibold px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
                Limpiar filtros
              </Button>
            </div>
          ) : (
            <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {guiasFiltradas.map((guia) => (
                <Card key={guia.id} className="group relative overflow-hidden rounded-2xl bg-white/80 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 hover:scale-105 border border-white hover:border-purple-200 h-full flex flex-col shadow-lg hover:-translate-y-2">
                  {/* Borde superior animado */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-purple-500 to-green-600 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>

                  <CardHeader className="grow">
                    <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className="bg-linear-to-r from-purple-500 to-purple-600 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-md">
                          📂 {guia.categoria}
                        </span>
                        {guia.popular && (
                          <span className="bg-linear-to-r from-amber-500 to-orange-500 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-md">
                            ⭐ Popular
                          </span>
                        )}
                        {guia.gratuito && (
                          <span className="bg-linear-to-r from-green-500 to-green-600 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-md">
                            ✓ Gratis
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-1.5 text-xs text-purple-700 font-semibold bg-purple-100 px-2.5 py-1.5 rounded-lg">
                        <FileText className="h-3.5 w-3.5" />
                        {guia.formato}
                      </div>
                    </div>
                    
                    <CardTitle className="text-lg group-hover:text-purple-700 transition-colors leading-tight mb-3 font-bold">
                      {guia.titulo}
                    </CardTitle>
                    
                    <p className="text-gray-600 text-sm leading-relaxed mb-4 grow font-medium">
                      {guia.descripcion}
                    </p>
                    
                    <div className="flex flex-wrap gap-2 mb-4">
                      {guia.tags.map((tag, index) => (
                        <span key={index} className="bg-white border border-purple-300 text-purple-700 px-2.5 py-1 rounded-full text-xs font-semibold hover:bg-purple-50 transition-colors">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      {/* Estadísticas de la guía */}
                      <div className="flex items-center justify-between text-xs text-gray-700 bg-linear-to-r from-purple-50 to-green-50 p-3.5 rounded-xl border border-purple-200 font-semibold">
                        <div className="flex items-center gap-4">
                          <span>📄 {guia.paginas} págs.</span>
                          <span>📦 {guia.tamano}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                          <span className="text-amber-700 font-bold">{guia.valoracion}</span>
                        </div>
                      </div>
                      
                      {/* Información adicional */}
                      <div className="flex items-center justify-between text-xs text-gray-600 font-semibold bg-gray-50 p-3 rounded-xl">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>{guia.fechaActualizacion}</span>
                        </div>
                        <span>⬇️ {guia.descargas.toLocaleString()}</span>
                      </div>
                      
                      {/* Botones de acción */}
                      <div className="flex gap-2 pt-2">
                        <Link to={`/recursos/guias/${guia.id}`} className="flex-1">
                          <Button className="w-full bg-white border-2 border-purple-300 text-purple-700 hover:bg-purple-50 font-semibold px-4 py-2.5 rounded-xl hover:shadow-md transition-all duration-300">
                            Ver detalles
                          </Button>
                        </Link>
                        <Button 
                          onClick={() => handleDownload(guia)}
                          className="flex-1 bg-linear-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold px-4 py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105"
                        >
                          <Download className="h-4 w-4 mr-1.5" />
                          Descargar
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Paginación (placeholder para futura implementación) */}
        {guiasFiltradas.length > 9 && (
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
      </div>
    </main>
  );
};

export default GuiasListado;