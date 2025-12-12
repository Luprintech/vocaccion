/**
 * SERVICIOS.JSX - Página de servicios de VocAcción
 * 
 * PROPÓSITO:
 * Explica en detalle qué ofrece VocAcción, cómo funciona el sistema
 * de orientación vocacional y quiénes son nuestros usuarios objetivo.
 * 
 * COMPONENTE:
 * Página informativa con múltiples secciones:
 * - Hero con imagen impactante
 * - Beneficios clave del servicio  
 * - Público objetivo detallado
 * - Proceso paso a paso del test vocacional
 * - Tecnología y metodología empleada
 * 
 * INTEGRACIÓN:
 * Se accede desde el header navegando a /servicios
 * Enlaces internos conectan con otras páginas relevantes
 * 
 * COLABORADORES:
 * Las constantes (beneficios, audiencia, proceso, tecnologia) contienen
 * todo el contenido. Para modificar textos, editad esos arrays.
 */

import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContextFixed";
import { 
  Gift, User, RefreshCw, Bot, GraduationCap, Briefcase, Users,
  UserPlus, Search, Target, Award, Cpu, Database, Filter, MessageCircle,
  Sparkles, ArrowRight, CheckCircle, Zap, Lightbulb
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import imagenFuturo from "../assets/images/pensando-en-futuro.jpg";

// Beneficios principales que ofrece VocAcción a los usuarios
const beneficios = [
  {
    icon: <Gift className="h-8 w-8 text-primary" />,
    titulo: "Gratuito",
    texto: "Acceso completo a todas las herramientas sin coste.",
    id: "beneficio-gratuito"
  },
  {
    icon: <User className="h-8 w-8 text-primary" />,
    titulo: "Personalizado",
    texto: "Recomendaciones adaptadas a tu perfil único.",
    id: "beneficio-personalizado"
  },
  {
    icon: <RefreshCw className="h-8 w-8 text-primary" />,
    titulo: "Actualizado",
    texto: "Información laboral y académica al día.",
    id: "beneficio-actualizado"
  },
  {
    icon: <Bot className="h-8 w-8 text-primary" />,
    titulo: "Con IA",
    texto: "Tecnología inteligente para guiarte mejor.",
    id: "beneficio-ia"
  }
];

// Público objetivo: tres grupos principales de usuarios
const audiencia = [
  {
    icon: <GraduationCap className="h-8 w-8 text-primary" />,
    titulo: "Estudiantes",
    texto: "Jóvenes de ESO y Bachillerato explorando su futuro académico y profesional.",
    id: "audiencia-estudiantes"
  },
  {
    icon: <Briefcase className="h-8 w-8 text-primary" />,
    titulo: "Adultos en reconversión",
    texto: "Profesionales que buscan un cambio de carrera o quieren reorientar su trayectoria.",
    id: "audiencia-adultos"
  },
  {
    icon: <Users className="h-8 w-8 text-primary" />,
    titulo: "Orientadores",
    texto: "Educadores que necesitan herramientas de apoyo para guiar a sus estudiantes.",
    id: "audiencia-orientadores"
  }
];

const comoFunciona = [
  {
    icon: <UserPlus className="h-6 w-6 text-primary" />,
    titulo: "Regístrate",
    descripcion: "Regístrate gratuitamente en la plataforma.",
    numero: "01"
  },
  {
    icon: <Search className="h-6 w-6 text-primary" />,
    titulo: "Realiza el test",
    descripcion: "Realiza nuestro test vocacional adaptativo con IA.",
    numero: "02"
  },
  {
    icon: <Target className="h-6 w-6 text-primary" />,
    titulo: "Recibe recomendaciones",
    descripcion: "Recibe recomendaciones personalizadas de estudios y profesiones.",
    numero: "03"
  },
  {
    icon: <Award className="h-6 w-6 text-primary" />,
    titulo: "Accede a recursos",
    descripcion: "Accede a recursos, guías y asesoramiento humano si eliges la versión premium.",
    numero: "04"
  }
];

const herramientas = [
  {
    icon: <Cpu className="h-8 w-8 text-primary" />,
    titulo: "Test adaptativo con IA",
    descripcion: "Test que evoluciona según tus respuestas para mayor precisión.",
    id: "herramienta-ia"
  },
  {
    icon: <Database className="h-8 w-8 text-primary" />,
    titulo: "Datos reales del mercado",
    descripcion: "Recomendaciones basadas en información actual del mercado laboral y educativo.",
    id: "herramienta-datos"
  },
  {
    icon: <Filter className="h-8 w-8 text-primary" />,
    titulo: "Recursos filtrados",
    descripcion: "Acceso a recursos organizados por sector, nivel educativo y habilidades.",
    id: "herramienta-recursos"
  }
];

const Servicios = () => {
  const { isAuthenticated } = useAuth();
  
  const [particles] = useState(() => {
    return Array.from({ length: 30 }, (_, i) => ({
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

  return (
    <main className="w-full overflow-hidden">
      {/* FONDO ANIMADO GLOBAL */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        {/* Círculos animados de fondo */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-1/2 right-0 w-96 h-96 bg-green-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
        
        {/* Partículas flotantes */}
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

      <div className="px-6 md:px-20 py-16 space-y-24 relative z-10">
      
      {/* 1. ¿Qué es VocAcción? */}
      <section className="container mx-auto px-4 py-20">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="order-2 lg:order-1">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm border border-purple-200 text-purple-700 text-sm font-semibold mb-6 shadow-lg hover:shadow-xl transition-all duration-300 animate-float">
              <Sparkles className="h-4 w-4" />
              Orientación vocacional con IA
            </div>
            <h2 className="text-4xl lg:text-5xl font-bold mb-8 leading-tight">
              <span className="bg-linear-to-r from-purple-600 to-green-600 bg-clip-text text-transparent">
                ¿Qué es VocAcción?
              </span>
            </h2>
            
            <Card className="bg-linear-to-br from-purple-50 to-green-50 border-l-4 border-purple-500 mb-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <CardContent className="p-6">
                <p className="text-lg text-gray-700 leading-relaxed">
                  VocAcción es una <span className="font-bold text-purple-700">aplicación web moderna potenciada con IA</span> que combina orientación vocacional, análisis inteligente y recursos educativos actualizados.
                </p>
              </CardContent>
            </Card>

            <div className="space-y-4 mb-8">
              <div className="flex items-start gap-3 group">
                <div className="shrink-0 w-6 h-6 bg-linear-to-br from-purple-500 to-green-500 rounded-full flex items-center justify-center mt-1 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Target className="h-3 w-3 text-white" />
                </div>
                <p className="text-gray-700 group-hover:text-gray-900 transition-colors">
                  Está diseñada para ayudarte a encontrar una ruta formativa o profesional que realmente conecte con tus <span className="font-bold text-purple-700">intereses, habilidades y valores</span>.
                </p>
              </div>
              
              <div className="flex items-start gap-3 group">
                <div className="shrink-0 w-6 h-6 bg-linear-to-br from-green-500 to-purple-500 rounded-full flex items-center justify-center mt-1 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Users className="h-3 w-3 text-white" />
                </div>
                <p className="text-gray-700 group-hover:text-gray-900 transition-colors">
                  Tanto si estás en <span className="font-bold text-green-700">ESO o Bachillerato</span>, como si estás considerando un <span className="font-bold text-green-700">cambio profesional</span>, VocAcción te ofrece herramientas precisas.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2 bg-white border-2 border-purple-200 px-4 py-2 rounded-xl shadow-md hover:shadow-lg hover:border-purple-400 transition-all duration-300 hover:scale-105 group cursor-default">
                <Search className="h-4 w-4 text-purple-600 group-hover:text-purple-700" />
                <span className="text-sm font-semibold text-gray-700">Herramientas precisas</span>
              </div>
              <div className="flex items-center gap-2 bg-white border-2 border-green-200 px-4 py-2 rounded-xl shadow-md hover:shadow-lg hover:border-green-400 transition-all duration-300 hover:scale-105 group cursor-default">
                <RefreshCw className="h-4 w-4 text-green-600 group-hover:text-green-700" />
                <span className="text-sm font-semibold text-gray-700">Información actual</span>
              </div>
              <div className="flex items-center gap-2 bg-white border-2 border-purple-200 px-4 py-2 rounded-xl shadow-md hover:shadow-lg hover:border-purple-400 transition-all duration-300 hover:scale-105 group cursor-default">
                <Zap className="h-4 w-4 text-purple-600 group-hover:text-purple-700" />
                <span className="text-sm font-semibold text-gray-700">Potenciado por IA</span>
              </div>
            </div>
          </div>
          
          <div className="order-1 lg:order-2">
            <div className="relative group">
              <div className="absolute inset-0 bg-linear-to-br from-purple-400/30 to-green-400/30 rounded-3xl transform rotate-6 group-hover:rotate-12 transition-transform duration-500 blur-xl"></div>
              <div className="relative bg-white p-2 rounded-3xl shadow-2xl group-hover:shadow-3xl transition-all duration-300 group-hover:scale-105">
                <img
                  src={imagenFuturo}
                  alt="Mujer pensando sobre su futuro profesional"
                  className="rounded-2xl w-full h-auto"
                />
              </div>
              <div className="absolute -bottom-4 -right-4 bg-linear-to-r from-purple-500 to-green-500 rounded-2xl p-4 shadow-xl border-2 border-white group-hover:scale-110 transition-transform duration-300">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                  <span className="text-sm font-bold text-white">Tu futuro te espera</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Beneficios de VocAcción */}
      <section className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-100 text-purple-700 font-semibold text-sm mb-6">
            <Sparkles className="w-4 h-4" />
            Nuestros beneficios
          </div>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
            <span className="bg-linear-to-r from-purple-600 to-green-600 bg-clip-text text-transparent">
              Ventajas de VocAcción
            </span>
          </h2>
          <p className="text-lg text-gray-600 leading-relaxed">
            Descubre todo lo que te ofrecemos para tu desarrollo profesional
          </p>
        </div>
        <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {beneficios.map((beneficio, index) => (
            <Card 
              key={beneficio.id}
              className="text-center group relative overflow-hidden hover:shadow-2xl hover:-translate-y-3 transition-all duration-500 border-2 border-transparent hover:border-purple-200 bg-white/80 backdrop-blur-sm"
            >
              {/* Borde superior animado */}
              <div className={`absolute top-0 left-0 right-0 h-1 bg-linear-to-r ${index % 2 === 0 ? 'from-purple-500 to-purple-600' : 'from-green-500 to-green-600'} transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500`}></div>
              
              <CardHeader className="pb-4">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-linear-to-br from-purple-100 to-green-100 group-hover:shadow-xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 mb-2">
                  <div className={`text-primary group-hover:scale-125 transition-transform duration-500 ${index % 2 === 0 ? 'text-purple-600' : 'text-green-600'}`}>
                    {React.cloneElement(beneficio.icon, { className: "h-10 w-10" })}
                  </div>
                </div>
                <CardTitle className="mt-4 text-lg font-bold text-gray-800 group-hover:text-purple-700 transition-colors duration-300">
                  {beneficio.titulo}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 group-hover:text-gray-700 transition-colors duration-300">
                  {beneficio.texto}
                </p>
              </CardContent>

              {/* Efecto de brillo */}
              <div className="absolute inset-0 bg-linear-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-10 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-all duration-1000"></div>
            </Card>
          ))}
        </div>
      </section>

      {/* 3. ¿A quién va dirigido? */}
      <section className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-100 text-green-700 font-semibold text-sm mb-6">
            <Users className="w-4 h-4" />
            Público objetivo
          </div>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
            <span className="text-gray-800">¿A quién</span>
            <br />
            <span className="bg-linear-to-r from-purple-600 to-green-600 bg-clip-text text-transparent">
              va dirigido?
            </span>
          </h2>
          <p className="text-lg text-gray-600 leading-relaxed">
            Nuestras herramientas están pensadas para diferentes perfiles de usuarios
          </p>
        </div>
        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {audiencia.map((perfil, index) => (
            <Card 
              key={perfil.id}
              className="text-center group relative overflow-hidden hover:shadow-2xl hover:-translate-y-3 transition-all duration-500 border-l-4 border-purple-200 hover:border-purple-400 bg-white/80 backdrop-blur-sm"
            >
              {/* Borde superior */}
              <div className={`absolute top-0 left-0 right-0 h-1.5 bg-linear-to-r ${index === 0 ? 'from-purple-500 to-purple-600' : index === 1 ? 'from-green-500 to-green-600' : 'from-purple-600 to-green-600'}`}></div>
              
              <CardHeader className="pb-4 pt-8">
                <div className={`mx-auto flex h-24 w-24 items-center justify-center rounded-2xl group-hover:shadow-xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 mb-4 ${index === 0 ? 'bg-linear-to-br from-purple-100 to-purple-200' : index === 1 ? 'bg-linear-to-br from-green-100 to-green-200' : 'bg-linear-to-br from-purple-100 to-green-100'}`}>
                  <div className={index === 0 ? 'text-purple-600' : index === 1 ? 'text-green-600' : 'text-purple-700'}>
                    {React.cloneElement(perfil.icon, { className: "h-12 w-12" })}
                  </div>
                </div>
                <CardTitle className="mt-4 text-lg font-bold text-gray-800 group-hover:text-purple-700 transition-colors duration-300">
                  {perfil.titulo}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 group-hover:text-gray-700 transition-colors duration-300 leading-relaxed">
                  {perfil.texto}
                </p>
              </CardContent>

              {/* Efecto de brillo */}
              <div className="absolute inset-0 bg-linear-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-10 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-all duration-1000"></div>
            </Card>
          ))}
        </div>
      </section>

      {/* 4. ¿Cómo funciona VocAcción? */}
      <section className="container mx-auto px-4">
        <div className="bg-linear-to-br from-purple-50 via-white to-green-50 py-20 rounded-3xl border-2 border-purple-100 shadow-2xl">
          <div className="mx-auto max-w-3xl text-center mb-16 px-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-100 text-purple-700 font-semibold text-sm mb-6">
              <Target className="w-4 h-4" />
              Proceso paso a paso
            </div>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
              <span className="text-gray-800">¿Cómo</span>
              <br />
              <span className="bg-linear-to-r from-purple-600 to-green-600 bg-clip-text text-transparent">
                funciona VocAcción?
              </span>
            </h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              Sigue estos sencillos pasos para descubrir tu camino profesional
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4 px-4">
            {comoFunciona.map((paso, index) => (
              <div key={index} className="relative group">
                <Card className="h-full border-2 border-white hover:border-purple-300 transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 bg-white/90 backdrop-blur-sm group overflow-hidden">
                  {/* Borde superior animado */}
                  <div className={`absolute top-0 left-0 right-0 h-1 bg-linear-to-r ${index % 2 === 0 ? 'from-purple-500 to-purple-600' : 'from-green-500 to-green-600'}`}></div>
                  
                  <CardHeader className="text-center pb-4 pt-6">
                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-linear-to-br from-purple-100 to-green-100 mb-4 relative group-hover:shadow-lg group-hover:scale-110 transition-all duration-500">
                      <div className={`${index % 2 === 0 ? 'text-purple-600' : 'text-green-600'}`}>
                        {React.cloneElement(paso.icon, { className: "h-10 w-10" })}
                      </div>
                      <div className="absolute -top-3 -right-3 bg-linear-to-r from-purple-500 to-green-500 text-white text-xs font-bold rounded-full h-8 w-8 flex items-center justify-center shadow-lg group-hover:scale-125 transition-transform duration-300">
                        {paso.numero}
                      </div>
                    </div>
                    <CardTitle className="text-lg font-bold text-gray-800 group-hover:text-purple-700 transition-colors duration-300">
                      {paso.titulo}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-center pb-6">
                    <p className="text-sm text-gray-600 group-hover:text-gray-700 transition-colors duration-300 leading-relaxed">
                      {paso.descripcion}
                    </p>
                  </CardContent>

                  {/* Efecto de brillo */}
                  <div className="absolute inset-0 bg-linear-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-all duration-1000"></div>
                </Card>
                
                {/* Flecha conectora */}
                {index < comoFunciona.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-6 text-purple-300 group-hover:text-purple-500 transition-colors duration-300 transform -translate-y-1/2">
                    <ArrowRight className="h-8 w-8 animate-pulse" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Herramientas y tecnologías */}
      <section className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-100 text-green-700 font-semibold text-sm mb-6">
            <Zap className="w-4 h-4" />
            Tecnología
          </div>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
            <span className="text-gray-800">Herramientas y</span>
            <br />
            <span className="bg-linear-to-r from-purple-600 to-green-600 bg-clip-text text-transparent">
              tecnologías
            </span>
          </h2>
          <p className="text-lg text-gray-600 leading-relaxed">
            Tecnología avanzada e inteligencia artificial al servicio de tu orientación vocacional
          </p>
        </div>
        <div className="grid gap-8 md:grid-cols-3">
          {herramientas.map((herramienta, index) => (
            <Card 
              key={herramienta.id}
              className="group relative overflow-hidden hover:shadow-3xl transition-all duration-500 border-0 bg-white shadow-xl hover:-translate-y-3"
            >
              {/* Borde superior */}
              <div className={`absolute top-0 left-0 right-0 h-1.5 bg-linear-to-r ${index % 2 === 0 ? 'from-purple-500 via-purple-600 to-purple-500' : 'from-green-500 via-green-600 to-green-500'}`}></div>
              
              <CardHeader className="text-center pb-4 pt-8">
                <div className={`mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-linear-to-br ${index % 2 === 0 ? 'from-purple-100 to-purple-200 group-hover:from-purple-200 group-hover:to-purple-300' : 'from-green-100 to-green-200 group-hover:from-green-200 group-hover:to-green-300'} group-hover:shadow-lg group-hover:scale-125 group-hover:rotate-12 transition-all duration-500 mb-4`}>
                  <div className={index % 2 === 0 ? 'text-purple-700' : 'text-green-700'}>
                    {React.cloneElement(herramienta.icon, { className: "h-10 w-10" })}
                  </div>
                </div>
                <CardTitle className="text-xl font-bold text-gray-900 group-hover:text-purple-700 transition-colors duration-300">
                  {herramienta.titulo}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center pb-6">
                <p className="text-gray-600 group-hover:text-gray-700 transition-colors duration-300 leading-relaxed">
                  {herramienta.descripcion}
                </p>
              </CardContent>

              {/* Efecto de brillo */}
              <div className="absolute inset-0 bg-linear-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-all duration-1000"></div>
            </Card>
          ))}
        </div>
      </section>

      {/* Sección adicional: Orientadores humanos */}
      <section className="container mx-auto px-4">
        <Card className="relative overflow-hidden bg-linear-to-r from-purple-600 via-purple-700 to-green-600 border-0 shadow-2xl p-8 md:p-12 group">
          {/* Círculos decorativos de fondo */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-500"></div>
            <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-500"></div>
          </div>

          <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
            <div className="shrink-0">
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm shadow-xl group-hover:scale-110 group-hover:rotate-12 transition-all duration-500">
                <MessageCircle className="h-12 w-12 text-white" />
              </div>
            </div>
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-6 text-white leading-tight">
                Orientadores humanos<br />
                <span className="text-yellow-300">especializados</span>
              </h2>
              <p className="text-lg text-purple-100 leading-relaxed mb-6">
                Si necesitas apoyo más allá del test, puedes acceder a <span className="font-bold text-white">orientación personalizada</span> con un profesional especializado que te guiará paso a paso.
              </p>
              <p className="text-purple-100 leading-relaxed mb-8">
                Nuestros orientadores estarán contigo durante todo el proceso, ayudándote a aclarar dudas, 
                descubrir opciones reales y trazar el camino formativo que mejor se adapte a ti.
              </p>
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-semibold border border-white/30 hover:bg-white/30 transition-colors duration-300">
                <Award className="h-4 w-4" />
                Asesoramiento profesional disponible
              </div>
            </div>
          </div>
        </Card>
      </section>

      {/* SECCIÓN CALL-TO-ACTION FINAL */}
      <section className="container mx-auto px-4 relative overflow-hidden">
        <div className="bg-linear-to-br from-purple-600 via-purple-700 to-green-600 rounded-3xl p-12 md:p-16 relative overflow-hidden shadow-2xl">
          {/* Patrón de fondo */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/5 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/5 rounded-full blur-3xl"></div>
          </div>

          <div className="relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              {/* Icono superior */}
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm mb-8 animate-float">
                <Lightbulb className="w-10 h-10 text-white" />
              </div>

              {isAuthenticated ? (
                // Contenido para usuarios autenticados
                <>
                  <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
                    Descubre todo el potencial
                    <br />
                    <span className="text-yellow-300">de VocAcción Premium</span>
                  </h2>

                  <p className="text-xl text-purple-100 mb-12 max-w-2xl mx-auto leading-relaxed">
                    Accede a funcionalidades avanzadas, informes detallados y orientación personalizada para llevar tu futuro al siguiente nivel.
                  </p>

                  {/* Botones principales para usuarios autenticados */}
                  <div className="flex flex-col lg:flex-row justify-center items-center gap-8 lg:gap-12 mb-12 max-w-5xl mx-auto">
                    <Button 
                      size="lg" 
                      className="w-full lg:w-auto bg-white text-purple-700 hover:bg-purple-50 shadow-2xl hover:shadow-3xl hover:scale-105 transition-all duration-300 px-12 py-7 text-lg font-bold group"
                      asChild
                    >
                      <Link to="/recursos">
                        Recursos
                      </Link>
                    </Button>

                    <Button 
                      size="lg" 
                      className="w-full lg:w-auto bg-green-500 text-white hover:bg-green-600 shadow-2xl hover:shadow-3xl hover:scale-105 transition-all duration-300 px-12 py-7 text-lg font-bold"
                      asChild
                    >
                      <Link to="/planes" className="flex items-center justify-center gap-2">
                        Ver planes Premium
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </Link>
                    </Button>
                  </div>
                </>
              ) : (
                // Contenido para usuarios no autenticados
                <>
                  <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
                    ¿Listo para descubrir
                    <br />
                    <span className="text-yellow-300">tu verdadera vocación?</span>
                  </h2>

                  <p className="text-xl text-purple-100 mb-12 max-w-2xl mx-auto leading-relaxed">
                    Crea una cuenta gratuita y da el primer paso hacia el futuro que deseas. 
                    Más de 5,000 estudiantes ya han encontrado su camino.
                  </p>

                  {/* Botones de acción */}
                  <div className="flex flex-col lg:flex-row justify-center items-center gap-8 lg:gap-12 mb-12 max-w-5xl mx-auto">
                    <Button 
                      size="lg" 
                      className="w-full lg:w-auto bg-white text-purple-700 hover:bg-purple-50 shadow-2xl hover:shadow-3xl hover:scale-105 transition-all duration-300 px-12 py-7 text-lg font-bold group"
                      asChild
                    >
                      <Link to="/register" className="flex items-center justify-center gap-2">
                        Registrarse gratis
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </Link>
                    </Button>
                    
                    <Button 
                      size="lg" 
                      className="w-full lg:w-auto bg-green-500 text-white hover:bg-green-600 shadow-2xl hover:shadow-3xl hover:scale-105 transition-all duration-300 px-12 py-7 text-lg font-bold"
                      asChild
                    >
                      <Link to="/planes" className="flex items-center justify-center gap-2">
                        Ver planes Premium
                      </Link>
                    </Button>
                  </div>

                  {/* Enlaces secundarios */}
                  <div className="flex items-center justify-center gap-6 text-purple-100 mb-12">
                    <Link 
                      to="/login" 
                      className="hover:text-white transition-colors duration-300 flex items-center gap-2 group"
                    >
                      ¿Ya tienes cuenta? 
                      <span className="font-semibold group-hover:underline">Inicia sesión</span>
                    </Link>
                    <span className="text-purple-300">•</span>
                    <Link 
                      to="/testintro" 
                      className="hover:text-white transition-colors duration-300 flex items-center gap-2 group"
                    >
                      <span className="font-semibold group-hover:underline">Prueba el test sin registro</span>
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Cierre de div principal */}
      </div>
    </main>
  );
};

export default Servicios;
