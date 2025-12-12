import React, { useState } from "react";
import { useToast } from '@/components/ToastProvider';
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Download, FileText, Calendar, Star, Users, Eye, Share2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Página de Detalle de Guía Descargable - VocAcción
 * 
 * Muestra información completa de una guía específica:
 * - Descripción detallada
 * - Contenido de la guía
 * - Estadísticas y valoraciones  
 * - Descarga directa
 */

const GuiaDetalle = () => {
  const { slug } = useParams();
  
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
  
  // Base de datos de guías con información detallada
  const guias = {
    "guia-becas-2025": {
      titulo: "Guía Completa de Becas 2025",
      descripcion: "El recurso más completo para encontrar y solicitar becas de estudio en España durante el curso 2024-2025.",
      categoria: "ayudas",
      formato: "PDF",
      tamano: "2.4 MB",
      paginas: 24,
      fechaActualizacion: "15 de Enero, 2025",
      descargas: 1247,
      valoracion: 4.8,
      popular: true,
      gratuito: true,
      autor: "Equipo de Orientación VocAcción",
      preview: "/previews/guia-becas-2025.jpg",
      tags: ["becas", "ayudas", "financiación", "estudiantes"],
      contenido: [
        "1. Introducción al sistema de becas en España",
        "2. Beca General del Ministerio de Educación",
        "3. Becas autonómicas por comunidades",
        "4. Becas de fundaciones privadas",
        "5. Becas para estudios en el extranjero",
        "6. Calendario de solicitudes 2025",
        "7. Documentación necesaria",
        "8. Consejos para completar la solicitud",
        "9. Criterios de baremación",
        "10. Qué hacer si te deniegan la beca",
        "Anexos: Formularios y enlaces útiles"
      ],
      descripcionLarga: `Esta guía comprehensiva te ayudará a navegar el complejo mundo de las becas educativas en España. 
      
      Incluye información actualizada sobre todos los tipos de ayudas disponibles, desde las becas generales del Ministerio de Educación hasta las específicas de cada comunidad autónoma y las ofrecidas por fundaciones privadas.
      
      Además de enumerar las becas disponibles, la guía te proporciona estrategias prácticas para maximizar tus posibilidades de obtener financiación, incluyendo consejos sobre cómo completar las solicitudes, qué documentación preparar y cómo interpretar los criterios de baremación.`
    },
    "comparativa-carreras-tecnologicas": {
      titulo: "Comparativa de Carreras Tecnológicas",
      descripcion: "Análisis detallado de 15 carreras tecnológicas con datos de salarios, empleabilidad y proyección profesional.",
      categoria: "carreras",
      formato: "PDF", 
      tamano: "3.1 MB",
      paginas: 32,
      fechaActualizacion: "10 de Diciembre, 2024",
      descargas: 892,
      valoracion: 4.6,
      popular: true,
      gratuito: true,
      autor: "Tech Careers Research Team",
      preview: "/previews/carreras-tecnologicas.jpg",
      tags: ["tecnología", "carreras", "salarios", "empleabilidad"],
      contenido: [
        "1. Metodología del estudio",
        "2. Ingeniería Informática",
        "3. Desarrollo de Aplicaciones Web",
        "4. Desarrollo de Aplicaciones Multiplataforma", 
        "5. Ciberseguridad",
        "6. Inteligencia Artificial",
        "7. Ciencia de Datos",
        "8. Ingeniería de Telecomunicaciones",
        "9. Robótica y Automatización",
        "10. Diseño UX/UI",
        "11. DevOps y Cloud Computing",
        "12. Blockchain y Criptomonedas",
        "13. Realidad Virtual y Aumentada",
        "14. IoT (Internet de las Cosas)",
        "15. Biotecnología Digital",
        "Conclusiones y recomendaciones"
      ],
      descripcionLarga: `Un estudio exhaustivo que compara 15 de las carreras tecnológicas más demandadas en el mercado laboral actual.
      
      Para cada carrera se analizan factores clave como rangos salariales, tasas de empleabilidad, competencias técnicas requeridas, posibilidades de teletrabajo, proyección de crecimiento a 5 años y principales empleadores.
      
      Los datos están basados en estadísticas oficiales, estudios sectoriales y encuestas a más de 500 profesionales en activo, proporcionando una visión realista y actualizada del panorama tecnológico español.`
    }
  };

  // Obtener la guía actual
  const guia = guias[slug];
  const { showToast } = useToast();
  
  // Si no existe la guía, mostrar error 404
  if (!guia) {
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
          <div className="container mx-auto px-4 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm border border-purple-200 text-purple-700 text-sm font-semibold mb-8 shadow-lg">
              <Sparkles className="h-4 w-4" />
              404 - No encontrada
            </div>

            <h1 className="text-5xl md:text-6xl font-extrabold bg-linear-to-r from-purple-600 to-green-600 bg-clip-text text-transparent mb-6 leading-tight">
              Guía no encontrada
            </h1>
            <p className="text-xl text-gray-700 mb-8 max-w-2xl mx-auto font-medium">
              La guía que buscas no existe o ha sido movida.
            </p>
            <Link to="/recursos/guias">
              <Button className="bg-linear-to-r from-purple-600 to-green-600 hover:from-purple-700 hover:to-green-700 text-white">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver a guías
              </Button>
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const handleDownload = () => {
    // Simular descarga (en producción sería una URL real)
    showToast('info', `Descargando: ${guia.titulo}`);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: guia.titulo,
        text: guia.descripcion,
        url: window.location.href,
      });
    } else {
      // Fallback para navegadores que no soportan Web Share API
      navigator.clipboard.writeText(window.location.href);
      showToast('success', 'Enlace copiado al portapapeles');
    }
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

      <div className="relative z-10 px-6 md:px-20 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
        {/* Navegación breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-700 mb-8">
          <Link to="/recursos" className="hover:text-purple-600 transition-colors font-medium">
            Recursos
          </Link>
          <span className="text-purple-400">›</span>
          <Link to="/recursos/guias" className="hover:text-purple-600 transition-colors font-medium">
            Guías
          </Link>
          <span className="text-purple-400">›</span>
          <span className="font-bold text-purple-700">
            {guia.titulo}
          </span>
        </nav>

        {/* Encabezado de la guía */}
        <header className="mb-12">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Información principal */}
            <div className="lg:flex-1">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm border border-green-200 text-green-700 text-sm font-semibold mb-6 shadow-lg animate-float">
                <Sparkles className="h-4 w-4" />
                Guía Descargable
              </div>

              <h1 className="text-4xl lg:text-5xl font-extrabold bg-linear-to-r from-purple-600 via-purple-700 to-green-600 bg-clip-text text-transparent mb-6 leading-tight animate-gradientShift">
                {guia.titulo}
              </h1>

              <p className="text-xl text-gray-700 leading-relaxed mb-6 font-medium">
                {guia.descripcion}
              </p>

              {/* Badges de categoría */}
              <div className="flex flex-wrap gap-3 mb-6">
                <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-bold shadow-md ${
                  guia.categoria === 'ayudas' ? 'bg-linear-to-r from-green-500 to-green-600 text-white' :
                  'bg-linear-to-r from-blue-500 to-blue-600 text-white'
                }`}>
                  📚 {guia.categoria.charAt(0).toUpperCase() + guia.categoria.slice(1)}
                </span>
                {guia.popular && (
                  <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-bold bg-linear-to-r from-amber-500 to-amber-600 text-white shadow-md">
                    ⭐ Popular
                  </span>
                )}
                {guia.gratuito && (
                  <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-bold bg-linear-to-r from-purple-500 to-purple-600 text-white shadow-md">
                    🎁 Gratis
                  </span>
                )}
              </div>

              {/* Etiquetas */}
              <div className="flex flex-wrap gap-2 mb-8">
                {guia.tags.map((tag) => (
                  <span key={tag} className="bg-white/60 backdrop-blur-sm text-purple-700 px-3 py-1 rounded-full text-sm font-medium border border-purple-200">
                    #{tag}
                  </span>
                ))}
              </div>

              {/* Metadatos */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 p-4 rounded-2xl bg-white/40 backdrop-blur-sm border border-white">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Páginas</p>
                    <p className="font-bold text-gray-900">{guia.paginas}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Actualizado</p>
                    <p className="font-bold text-gray-900 text-sm">{guia.fechaActualizacion}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Descargas</p>
                    <p className="font-bold text-gray-900">{guia.descargas.toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                    <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Valoración</p>
                    <p className="font-bold text-gray-900">{guia.valoracion}/5</p>
                  </div>
                </div>
              </div>

              {/* Botones de acción */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  onClick={handleDownload} 
                  className="bg-linear-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold text-base py-6 rounded-xl shadow-lg hover:shadow-xl transition-all"
                >
                  <Download className="h-5 w-5 mr-2" />
                  Descargar {guia.formato} ({guia.tamano})
                </Button>
                
                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    onClick={handleShare}
                    className="bg-white/80 backdrop-blur-sm border-2 border-purple-200 text-purple-700 hover:bg-purple-50 font-bold py-6 rounded-xl"
                  >
                    <Share2 className="h-5 w-5 mr-2" />
                    Compartir
                  </Button>
                  <Button 
                    variant="outline"
                    className="bg-white/80 backdrop-blur-sm border-2 border-green-200 text-green-700 hover:bg-green-50 font-bold py-6 rounded-xl"
                  >
                    <Eye className="h-5 w-5 mr-2" />
                    Vista previa
                  </Button>
                </div>
              </div>
            </div>

            {/* Tarjeta de información adicional */}
            <div className="lg:w-80">
              <Card className="rounded-2xl bg-white/80 backdrop-blur-sm border-2 border-white shadow-lg overflow-hidden">
                {/* Borde superior animado */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-green-500 to-green-600"></div>
                
                <CardHeader className="bg-linear-to-br from-green-50 to-transparent pb-4">
                  <CardTitle className="text-lg font-bold bg-linear-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                    📋 Información del archivo
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                    <span className="text-gray-700 font-medium">Formato:</span>
                    <span className="font-bold text-purple-700">{guia.formato}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <span className="text-gray-700 font-medium">Tamaño:</span>
                    <span className="font-bold text-green-700">{guia.tamano}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                    <span className="text-gray-700 font-medium">Páginas:</span>
                    <span className="font-bold text-blue-700">{guia.paginas}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                    <span className="text-gray-700 font-medium">Autor:</span>
                    <span className="font-bold text-orange-700 text-sm text-right">{guia.autor}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-amber-50 rounded-lg">
                    <span className="text-gray-700 font-medium">Actualizado:</span>
                    <span className="font-bold text-amber-700 text-sm">{guia.fechaActualizacion}</span>
                  </div>
                  
                  <div className="pt-4 border-t-2 border-purple-200 mt-6">
                    <Button 
                      onClick={handleDownload} 
                      className="w-full bg-linear-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold py-6 rounded-xl shadow-lg hover:shadow-xl transition-all"
                    >
                      <Download className="h-5 w-5 mr-2" />
                      Descargar ahora
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </header>

        {/* Descripción detallada */}
        <section className="mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center">
            <span className="bg-linear-to-r from-purple-600 to-green-600 bg-clip-text text-transparent">📖 Descripción detallada</span>
          </h2>
          <div className="prose prose-lg prose-gray max-w-none p-8 rounded-2xl bg-white/80 backdrop-blur-sm border-2 border-white shadow-lg">
            {guia.descripcionLarga.split('\n').map((parrafo, index) => (
              <p key={index} className="text-gray-700 leading-relaxed mb-4 text-lg">
                {parrafo.trim()}
              </p>
            ))}
          </div>
        </section>

        {/* Contenido de la guía */}
        <section className="mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center">
            <span className="bg-linear-to-r from-purple-600 to-green-600 bg-clip-text text-transparent">📑 Contenido de la guía</span>
          </h2>
          <Card className="rounded-2xl bg-white/80 backdrop-blur-sm border-2 border-white shadow-lg overflow-hidden">
            {/* Borde superior animado */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-purple-500 to-green-600"></div>
            
            <CardHeader className="bg-linear-to-br from-purple-50 to-transparent pb-4">
              <CardTitle className="flex items-center gap-3 text-lg font-bold bg-linear-to-r from-purple-600 to-green-600 bg-clip-text text-transparent">
                <FileText className="h-6 w-6 text-purple-600" />
                Índice de contenidos
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <ol className="space-y-3">
                {guia.contenido.map((item, index) => (
                  <li key={index} className="flex items-start gap-4 p-3 rounded-lg hover:bg-purple-50 transition-colors group">
                    <span className="bg-linear-to-r from-purple-500 to-purple-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 shadow-md group-hover:shadow-lg transition-all">
                      {index + 1}
                    </span>
                    <span className="text-gray-700 font-medium group-hover:text-purple-700 transition-colors pt-1">{item}</span>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </section>

        {/* Navegación */}
        <section className="mt-16 pt-8 border-t-2 border-purple-200">
          <div className="flex flex-col sm:flex-row sm:justify-between gap-4">
            <Link to="/recursos/guias">
              <Button className="bg-linear-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-bold py-6 rounded-xl shadow-lg hover:shadow-xl transition-all">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver a guías
              </Button>
            </Link>
            
            <Link to="/recursos">
              <Button className="bg-white/80 backdrop-blur-sm border-2 border-green-200 text-green-700 hover:bg-green-50 font-bold py-6 rounded-xl">
                Ver todos los recursos →
              </Button>
            </Link>
          </div>
        </section>
        </div>
      </div>
    </main>
  );
};

export default GuiaDetalle;