import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, MapPin, Users, GraduationCap, Building, ExternalLink, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

/**
 * Página de Comunidades Autónomas - VocAcción
 * 
 * Vista que organiza recursos específicos por comunidades autónomas:
 * - Información educativa por región
 * - Centros de orientación
 * - Becas y ayudas autonómicas
 * - Enlaces a organismos oficiales
 */

const ComunidadesListado = () => {
  const [searchTerm, setSearchTerm] = useState("");
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

  // Base de datos de comunidades autónomas con sus recursos
  const comunidades = [
    {
      id: 1,
      nombre: "Andalucía",
      slug: "andalucia",
      capital: "Sevilla",
      poblacion: "8.4M habitantes",
      universidades: 12,
      centrosFP: 180,
      recursosDisponibles: 24,
      color: "green",
      descripcion: "La comunidad con mayor oferta educativa de España",
      organismos: [
        { nombre: "Consejería de Educación", enlace: "#" },
        { nombre: "Distrito Único Andaluz", enlace: "#" }
      ],
      becasEspecificas: [
        "Beca 6000 - Ayuda para estudios universitarios",
        "Beca Adriano - Estudiantes con discapacidad",
        "Programa ERACMUS+ Andalucía"
      ]
    },
    {
      id: 2,
      nombre: "Cataluña",
      slug: "cataluna", 
      capital: "Barcelona",
      poblacion: "7.7M habitantes",
      universidades: 12,
      centrosFP: 150,
      recursosDisponibles: 22,
      color: "blue",
      descripcion: "Hub tecnológico y empresarial del mediterráneo",
      organismos: [
        { nombre: "Departament d'Educació", enlace: "#" },
        { nombre: "Generalitat de Catalunya", enlace: "#" }
      ],
      becasEspecificas: [
        "Beca Equitat - Ayudas al estudio",
        "Beca Batxillerat - Bachillerato",
        "Programa Erasmus+ Catalunya"
      ]
    },
    {
      id: 3,
      nombre: "Madrid",
      slug: "madrid",
      capital: "Madrid",
      poblacion: "6.8M habitantes", 
      universidades: 15,
      centrosFP: 120,
      recursosDisponibles: 28,
      color: "red",
      descripcion: "Centro económico y educativo de España",
      organismos: [
        { nombre: "Consejería de Educación", enlace: "#" },
        { nombre: "Comunidad de Madrid", enlace: "#" }
      ],
      becasEspecificas: [
        "Beca Excelencia Académica Madrid",
        "Ayudas para libros de texto",
        "Programa bilingüe Madrid"
      ]
    },
    {
      id: 4,
      nombre: "Valencia",
      slug: "valencia",
      capital: "Valencia",
      poblacion: "5.0M habitantes",
      universidades: 9,
      centrosFP: 95,
      recursosDisponibles: 18,
      color: "orange",
      descripcion: "Importante polo industrial y educativo mediterráneo",
      organismos: [
        { nombre: "Conselleria d'Educació", enlace: "#" },
        { nombre: "Generalitat Valenciana", enlace: "#" }
      ],
      becasEspecificas: [
        "Beca Xarxa Llibres - Material escolar",
        "Programa Erasmus+ Valencia",
        "Ayudas transporte escolar"
      ]
    },
    {
      id: 5,
      nombre: "País Vasco",
      slug: "pais-vasco",
      capital: "Vitoria-Gasteiz",
      poblacion: "2.2M habitantes",
      universidades: 3,
      centrosFP: 45,
      recursosDisponibles: 16,
      color: "purple",
      descripcion: "Referente en innovación educativa y tecnológica",
      organismos: [
        { nombre: "Departamento de Educación", enlace: "#" },
        { nombre: "Gobierno Vasco", enlace: "#" }
      ],
      becasEspecificas: [
        "Programa de becas Euskadi",
        "Ayuda Tutoretza - Apoyo académico",
        "Beca euskera - Inmersión lingüística"
      ]
    },
    {
      id: 6,
      nombre: "Galicia",
      slug: "galicia",
      capital: "Santiago de Compostela",
      poblacion: "2.7M habitantes",
      universidades: 4,
      centrosFP: 65,
      recursosDisponibles: 14,
      color: "teal",
      descripcion: "Tradición universitaria e investigación marina",
      organismos: [
        { nombre: "Consellería de Educación", enlace: "#" },
        { nombre: "Xunta de Galicia", enlace: "#" }
      ],
      becasEspecificas: [
        "Axudas ao estudo - Becas autonómicas",
        "Programa Conecta con Galicia",
        "Beca idiomas Galicia"
      ]
    },
    // Añadir más comunidades según sea necesario
    {
      id: 17,
      nombre: "Otras comunidades",
      slug: "otras",
      capital: "Varias",
      poblacion: "Consultar individualmente",
      universidades: "Ver listado",
      centrosFP: "Ver listado", 
      recursosDisponibles: 45,
      color: "gray",
      descripcion: "Información de las demás comunidades autónomas",
      organismos: [
        { nombre: "Ver listado completo", enlace: "#" }
      ],
      becasEspecificas: [
        "Consultar por comunidad específica"
      ]
    }
  ];

  // Filtrar comunidades basado en búsqueda
  const comunidadesFiltradas = comunidades.filter(comunidad =>
    comunidad.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    comunidad.capital.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getColorClasses = (color) => {
    const colors = {
      green: "border-green-200 bg-green-50",
      blue: "border-blue-200 bg-blue-50", 
      red: "border-red-200 bg-red-50",
      orange: "border-orange-200 bg-orange-50",
      purple: "border-purple-200 bg-purple-50",
      teal: "border-teal-200 bg-teal-50",
      gray: "border-gray-200 bg-gray-50"
    };
    return colors[color] || colors.gray;
  };

  const getIconColor = (color) => {
    const colors = {
      green: "text-green-600",
      blue: "text-blue-600",
      red: "text-red-600", 
      orange: "text-orange-600",
      purple: "text-purple-600",
      teal: "text-teal-600",
      gray: "text-gray-600"
    };
    return colors[color] || colors.gray;
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
            <span className="font-bold text-purple-700">Por Comunidades</span>
          </nav>

          {/* Encabezado */}
          <header className="mb-12">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
              <div>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm border border-purple-200 text-purple-700 text-sm font-semibold mb-4 shadow-lg">
                  <Sparkles className="h-4 w-4" />
                  Recursos Autonómicos
                </div>
                <h1 className="text-4xl lg:text-5xl font-extrabold bg-linear-to-r from-purple-600 via-purple-700 to-green-600 bg-clip-text text-transparent mb-4 animate-gradientShift">
                  Comunidades Autónomas
                </h1>
                <p className="text-lg text-gray-700 font-medium max-w-2xl">
                  Información específica, becas autonómicas y centros educativos organizados por región
                </p>
              </div>
              
              <Link to="/recursos">
                <Button className="bg-linear-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-semibold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Volver
                </Button>
              </Link>
            </div>

            {/* Barra de búsqueda */}
            <div className="max-w-md bg-white/80 backdrop-blur-sm rounded-xl border-2 border-purple-200 shadow-lg overflow-hidden">
              <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 text-purple-400 h-5 w-5" />
              <Input
                type="text"
                placeholder="🔍 Buscar por comunidad o capital..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 py-3 border-0 bg-transparent focus:ring-0 placeholder-gray-500 font-medium"
              />
            </div>
          </header>

          {/* Información general */}
          <section className="mb-12">
            <Card className="border-l-4 border-l-blue-500 bg-linear-to-r from-blue-50 to-indigo-50 shadow-lg hover:shadow-xl transition-all">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                  <MapPin className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-blue-900 mb-2">
                    ¿Por qué buscar por comunidad autónoma?
                  </h3>
                  <p className="text-blue-800 leading-relaxed">
                    Cada comunidad autónoma tiene competencias educativas propias, lo que significa 
                    diferentes sistemas de becas, calendarios académicos, requisitos de acceso y 
                    centros especializados. Encuentra los recursos específicos de tu región.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Listado de comunidades */}
        <section>
          {comunidadesFiltradas.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No se encontraron comunidades
              </h3>
              <p className="text-gray-600 mb-4">
                Prueba con otros términos de búsqueda.
              </p>
              <Button onClick={() => setSearchTerm("")}>
                Mostrar todas
              </Button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {comunidadesFiltradas.map((comunidad) => (
                <Card key={comunidad.id} className={`${getColorClasses(comunidad.color)} hover:shadow-lg transition-all duration-300 group cursor-pointer`}>
                  <CardHeader>
                    <div className="flex items-center justify-between mb-3">
                      <div className={`w-10 h-10 bg-white/80 rounded-full flex items-center justify-center ${getIconColor(comunidad.color)}`}>
                        <MapPin className="h-5 w-5" />
                      </div>
                      <span className="bg-white/60 px-2 py-1 rounded text-xs font-medium text-gray-700">
                        {comunidad.recursosDisponibles} recursos
                      </span>
                    </div>
                    
                    <CardTitle className="text-xl group-hover:text-opacity-80 transition-colors">
                      {comunidad.nombre}
                    </CardTitle>
                    
                    <p className="text-sm text-gray-700 mb-3">
                      Capital: {comunidad.capital}
                    </p>
                  </CardHeader>
                  
                  <CardContent>
                    <p className="text-sm text-gray-700 leading-relaxed mb-4">
                      {comunidad.descripcion}
                    </p>
                    
                    {/* Estadísticas rápidas */}
                    <div className="grid grid-cols-3 gap-2 mb-4 text-xs">
                      <div className="text-center bg-white/60 rounded p-2">
                        <Users className="h-4 w-4 mx-auto mb-1 text-gray-600" />
                        <div className="font-medium">{comunidad.poblacion}</div>
                      </div>
                      <div className="text-center bg-white/60 rounded p-2">
                        <GraduationCap className="h-4 w-4 mx-auto mb-1 text-gray-600" />
                        <div className="font-medium">{comunidad.universidades} Universidades</div>
                      </div>
                      <div className="text-center bg-white/60 rounded p-2">
                        <Building className="h-4 w-4 mx-auto mb-1 text-gray-600" />
                        <div className="font-medium">{comunidad.centrosFP} Centros FP</div>
                      </div>
                    </div>
                    
                    {/* Becas específicas (resumen) */}
                    <div className="mb-4">
                      <h4 className="font-semibold text-sm text-gray-800 mb-2">
                        Becas autonómicas destacadas:
                      </h4>
                      <ul className="text-xs text-gray-700 space-y-1">
                        {comunidad.becasEspecificas.slice(0, 2).map((beca, index) => (
                          <li key={index} className="flex items-start gap-1">
                            <span className="w-1 h-1 bg-gray-400 rounded-full mt-1.5 shrink-0"></span>
                            <span>{beca}</span>
                          </li>
                        ))}
                        {comunidad.becasEspecificas.length > 2 && (
                          <li className="text-gray-500 italic">
                            +{comunidad.becasEspecificas.length - 2} más...
                          </li>
                        )}
                      </ul>
                    </div>
                    
                    {/* Organismos oficiales */}
                    <div className="mb-4">
                      <h4 className="font-semibold text-sm text-gray-800 mb-2">
                        Organismos oficiales:
                      </h4>
                      <div className="space-y-1">
                        {comunidad.organismos.map((organismo, index) => (
                          <div key={index} className="flex items-center gap-2 text-xs text-gray-700">
                            <ExternalLink className="h-3 w-3" />
                            <span>{organismo.nombre}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Link to={`/recursos/comunidades/${comunidad.slug}`} className="flex-1">
                        <Button size="sm" className="w-full">
                          Ver recursos
                        </Button>
                      </Link>
                      <Button size="sm" variant="outline">
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Enlaces útiles adicionales */}
        <section className="mt-16 pt-8 border-t border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Enlaces de interés
          </h2>
          
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <Card className="hover:shadow-lg transition-shadow duration-300">
              <CardContent className="p-6 text-center">
                <GraduationCap className="h-8 w-8 text-primary mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Ministerio de Educación</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Información oficial sobre el sistema educativo español
                </p>
                <Button variant="outline" size="sm">
                  <ExternalLink className="h-3 w-3 mr-2" />
                  Visitar
                </Button>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-lg transition-shadow duration-300">
              <CardContent className="p-6 text-center">
                <MapPin className="h-8 w-8 text-primary mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Mapa Interactivo</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Explora centros educativos por ubicación geográfica
                </p>
                <Link to="/recursos/mapa">
                  <Button variant="outline" size="sm">
                    <MapPin className="h-3 w-3 mr-2" />
                    Ver mapa
                  </Button>
                </Link>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-lg transition-shadow duration-300">
              <CardContent className="p-6 text-center">
                <Building className="h-8 w-8 text-primary mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Directorio de Centros</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Listado completo de universidades y centros de FP
                </p>
                <Button variant="outline" size="sm">
                  <ExternalLink className="h-3 w-3 mr-2" />
                  Explorar
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
      </div>
    </main>
  );
};

export default ComunidadesListado;