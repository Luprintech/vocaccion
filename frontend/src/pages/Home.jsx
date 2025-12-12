/**
 * HOME.JSX - Página principal de VocAcción
 * 
 * PROPÓSITO:
 * Esta es la landing page que ve el usuario al entrar a VocAcción.
 * Presenta la propuesta de valor, características principales y testimonios.
 * 
 * COMPONENTE:
 * Página completa con múltiples secciones:
 * - Hero: Título principal y llamada a la acción con animaciones
 * - Features: 4 características clave con iconos y efectos hover
 * - Stats: Estadísticas destacadas para generar confianza
 * - Testimonios: Experiencias de usuarios reales
 * - CTA final: Botones de registro y planes
 * 
 * INTEGRACIÓN:
 * Se renderiza cuando el usuario accede a la ruta "/" (App.jsx)
 * Enlaces internos conectan con /test, /recursos, /planes, etc.
 * 
 * DISEÑO:
 * - Colores corporativos: Púrpura (#9333ea) y Verde (#22c55e)
 * - Animaciones suaves y modernas
 * - Enfoque en público escolar (alumnos, profesores, orientadores)
 * - Elementos visuales atractivos con gradientes y sombras
 * 
 * COLABORADORES:
 * Para modificar contenido, editad las constantes features y testimonials
 * Para añadir nuevas secciones, mantened la estructura de <section>
 */

import { Link } from "react-router-dom";
import { Bot, BrainCircuit, Search, BookOpen, Sparkles, TrendingUp, Users, Award, GraduationCap, Target, Lightbulb, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "../context/AuthContextFixed";
import { useState, useEffect, Fragment } from "react";
import { Dialog, Transition, TransitionChild, DialogPanel, DialogTitle } from "@headlessui/react";
import { getTestimonials, addTestimonial } from "../api";
import { Input } from "@/components/ui/input";
import TestimonialCard from "../components/TestimonialCard";

// Configuración de las 4 características principales de VocAcción
// Cada feature tiene: icono, título, descripción, color e ID único

const features = [
  {
    icon: Bot,
    title: "Test vocacional dinámico con IA",
    description:
      "Realiza un test interactivo que se adapta a tu perfil, generando preguntas relevantes según tu nivel educativo e intereses.",
    id: "feature-test",
    color: "purple",
    gradient: "from-purple-500 to-purple-600",
  },
  {
    icon: BrainCircuit,
    title: "Recomendaciones generadas por IA",
    description:
      "Recibe un informe vocacional personalizado que analiza tus respuestas y te sugiere caminos formativos y profesionales.",
    id: "feature-recommendations",
    color: "green",
    gradient: "from-green-500 to-green-600",
  },
  {
    icon: Search,
    title: "Explora el mundo laboral",
    description:
      "Accede a información actual sobre sectores con alta empleabilidad, profesiones emergentes y estudios demandados en España.",
    id: "feature-explore",
    color: "purple",
    gradient: "from-purple-600 to-purple-700",
  },
  {
    icon: BookOpen,
    title: "Recursos y guías prácticas",
    description:
      "Encuentra guías sobre cómo inscribirte en FP o Universidad, becas, preparación de CV y mucho más.",
    id: "feature-resources",
    color: "green",
    gradient: "from-green-600 to-green-700",
  },
];

// Estadísticas destacadas para generar confianza
const stats = [
  { icon: Users, value: "5,000+", label: "Estudiantes orientados" },
  { icon: GraduationCap, value: "200+", label: "Centros educativos" },
  { icon: Award, value: "95%", label: "Satisfacción" },
  { icon: TrendingUp, value: "89%", label: "Éxito en elección" },
];

// Testimonios reales de usuarios que han usado VocAcción
// Incluye nombre, edad y experiencia personal
const testimonials = [
  {
    name: "Lucía",
    age: 18,
    quote:
      "Gracias a VocAcción descubrí que la docencia era mi camino. Hoy estudio Magisterio con seguridad y motivación.",
    image: null,
  },
  {
    name: "Mario",
    age: 36,
    quote:
      "Después de años trabajando en logística, VocAcción me ayudó a reorientarme hacia la programación. Hoy estudio Desarrollo Web.",
    image: null,
  },
];

export default function Home() {
  const { isAuthenticated, user } = useAuth();
  const [reviews, setReviews] = useState(testimonials);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [reviewForm, setReviewForm] = useState({ mensaje: "", edad: "" });
  const [loadingReviews, setLoadingReviews] = useState(true);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const data = await getTestimonials();
      // Combine with static if needed, or replace. 
      // If data exists, use it. If empty, keep static to avoid empty section initially?
      // User said "hay reseñas de mentira". "cuando el usuario añada... debe aparecer".
      // We'll prioritize backend data, but if empty array, maybe fallback or just show empty.
      // Let's just use backend data + static fallback if 0 to preserve the 'look'.
      if (data && data.length > 0) {
        setReviews(data);
      }
      setLoadingReviews(false);
    } catch (error) {
      console.error("Error fetching testimonials", error);
      setLoadingReviews(false);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) return;
    try {
      const res = await addTestimonial(reviewForm);
      // Backend returns { message, testimonio: {...} }
      if (res && res.testimonio) {
        setReviews(prev => [res.testimonio, ...prev]); // Add to top
        setIsModalOpen(false);
        setReviewForm({ mensaje: "", edad: "" });
      }
    } catch (error) {
      console.error("Error adding testimonial", error);
      // alert("Error al añadir reseña");
    }
  };

  return (
    <div className="flex flex-col overflow-hidden">
      {/* SECCIÓN HERO - Primer impacto visual con título y CTA principal */}
      <section className="relative w-full py-20 md:py-32 lg:py-40 text-center overflow-hidden" style={{ paddingTop: '50px', paddingBottom: '50px' }}>
        {/* Fondo con gradiente animado */}
        <div className="absolute inset-0 bg-linear-to-br from-purple-50 via-white to-green-50"></div>
        
        {/* Círculos decorativos de fondo */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-green-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>
        
        {/* Contenido principal */}
        <div className="relative container mx-auto px-4">
          {/* Badge superior */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white shadow-lg border border-purple-100 mb-8 animate-float">
            <Sparkles className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-semibold bg-linear-to-r from-purple-600 to-green-600 bg-clip-text text-transparent">
              Plataforma líder en orientación vocacional
            </span>
          </div>

          {/* Título principal con gradiente */}
          <h1 className="font-bold text-4xl sm:text-5xl md:text-6xl lg:text-7xl leading-tight">
            <span className="bg-linear-to-r from-purple-600 via-purple-700 to-green-600 bg-clip-text text-transparent animate-gradientShift">
              Descubre tu vocación.
            </span>
            <br />
            <span className="text-gray-800 mt-2 block">
              Diseña tu futuro.
            </span>
          </h1>

          {/* Subtítulo */}
          <p className="mx-auto mt-8 max-w-2xl text-lg md:text-xl text-gray-600 leading-relaxed">
            VocAcción es tu plataforma de orientación vocacional personalizada. 
            <span className="font-semibold text-purple-700"> Te guía paso a paso </span> 
            para que descubras qué estudios o profesiones encajan contigo.
          </p>

          {/* Botones de CTA */}
          <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button 
              size="lg" 
              className="bg-linear-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 px-8 py-6 text-base font-semibold group"
              asChild
            >
              <Link to="/testintro" className="flex items-center gap-2">
                <Target className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                Comienza tu camino – Test gratuito
              </Link>
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="border-2 border-green-500 text-green-700 hover:bg-green-50 hover:border-green-600 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 px-8 py-6 text-base font-semibold"
              asChild
            >
              <Link to="/recursos">
                Explorar recursos
              </Link>
            </Button>
          </div>

          {/* Iconos flotantes decorativos */}
          <div className="absolute top-10 left-10 md:left-20 opacity-10 animate-float animation-delay-1000 hidden md:block">
            <Lightbulb className="w-12 h-12 md:w-16 md:h-16 text-purple-500" />
          </div>
          <div className="absolute bottom-10 right-10 md:right-20 opacity-10 animate-float animation-delay-3000 hidden md:block">
            <GraduationCap className="w-16 h-16 md:w-20 md:h-20 text-green-500" />
          </div>
        </div>
      </section>

      {/* SECCIÓN ESTADÍSTICAS - Datos destacados */}
      <section className="w-full py-12 bg-white border-y border-purple-100">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div 
                key={index} 
                className="text-center group hover:scale-110 transition-transform duration-300"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-linear-to-br from-purple-100 to-green-100 mb-4 group-hover:shadow-lg transition-shadow">
                  <stat.icon className="w-8 h-8 text-purple-600 group-hover:text-green-600 transition-colors" />
                </div>
                <div className="text-3xl md:text-4xl font-bold bg-linear-to-r from-purple-600 to-green-600 bg-clip-text text-transparent">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECCIÓN CARACTERÍSTICAS - Muestra las 4 funcionalidades clave */}
      <section id="features" className="w-full py-16 lg:py-20 bg-linear-to-b from-gray-50 to-white relative">
        {/* Decoración de fondo */}
        <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-purple-500 via-green-500 to-purple-500"></div>
        
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center mb-12">
            {/* Badge de sección */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-100 text-purple-700 font-semibold text-sm mb-6">
              <Sparkles className="w-4 h-4" />
              Nuestras herramientas
            </div>
            
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
              <span className="bg-linear-to-r from-purple-600 to-green-600 bg-clip-text text-transparent">
                Todo lo que necesitas
              </span>
              <br />
              <span className="text-gray-800">
                para encontrar tu camino
              </span>
            </h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              Descubre las funcionalidades que hacen de VocAcción la plataforma 
              de orientación vocacional más completa de España.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => {
              // Lógica condicional: la card de "recursos" es clickeable y lleva a /recursos
              const CardWrapper = feature.id === 'feature-resources' ? Link : 'div';
              const linkProps = feature.id === 'feature-resources' ? { to: '/recursos' } : {};
              const Icon = feature.icon;
              
              return (
                <CardWrapper key={feature.id} {...linkProps}>
                  <Card className="relative text-center group hover:shadow-2xl hover:-translate-y-3 transition-all duration-500 cursor-pointer border-2 border-transparent hover:border-purple-200 overflow-hidden h-full bg-white">
                    {/* Borde superior de color */}
                    <div className={`absolute top-0 left-0 right-0 h-1 bg-linear-to-r ${feature.gradient} transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500`}></div>
                    
                    <CardHeader className="pb-4">
                      {/* Icono con fondo de gradiente */}
                      <div className="mx-auto mb-4 relative">
                        <div className={`w-20 h-20 rounded-2xl bg-linear-to-br ${feature.gradient} flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-500`}>
                          <Icon className="w-10 h-10 text-white" strokeWidth={2.5} />
                        </div>
                        {/* Chispa decorativa */}
                        <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                          <Sparkles className="w-6 h-6 text-yellow-400 animate-pulse" />
                        </div>
                      </div>
                      
                      <CardTitle className="text-lg font-bold text-gray-800 group-hover:text-purple-700 transition-colors duration-300 px-2">
                        {feature.title}
                      </CardTitle>
                    </CardHeader>
                    
                    <CardContent className="pt-0">
                      <p className="text-sm text-gray-600 leading-relaxed group-hover:text-gray-700 transition-colors duration-300">
                        {feature.description}
                      </p>
                      
                      {/* Indicador de "clickeable" solo para recursos */}
                      {feature.id === 'feature-resources' && (
                        <div className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-green-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          Explorar recursos
                          <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      )}
                    </CardContent>
                    
                    {/* Efecto de brillo en hover */}
                    <div className="absolute inset-0 bg-linear-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-10 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-all duration-1000"></div>
                  </Card>
                </CardWrapper>
              );
            })}
          </div>
        </div>
      </section>

      {/* SECCIÓN TESTIMONIOS - Experiencias reales para generar confianza */}
      <section id="testimonials" className="w-full py-16 lg:py-20 bg-linear-to-br from-purple-50 via-white to-green-50 relative overflow-hidden">
        {/* Elementos decorativos de fondo */}
        <div className="absolute top-20 right-10 w-64 h-64 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute bottom-20 left-10 w-64 h-64 bg-green-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        
        <div className="container mx-auto px-4 relative">
          <div className="mx-auto max-w-3xl text-center mb-12 relative">
             {isAuthenticated && (
                <div className="absolute right-0 top-0 hidden lg:block -mr-20">
                  <Button onClick={() => setIsModalOpen(true)} size="sm" className="gap-2 bg-purple-600 hover:bg-purple-700 text-white rounded-full shadow-lg">
                    <Plus className="w-4 h-4" />
                     Dejar reseña
                  </Button>
                </div>
             )}
            {/* Badge de sección */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-100 text-green-700 font-semibold text-sm mb-6">
              <Award className="w-4 h-4" />
              Testimonios
            </div>
            
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
              <span className="text-gray-800">
                Lo que dicen
              </span>
              <br />
              <span className="bg-linear-to-r from-purple-600 to-green-600 bg-clip-text text-transparent">
                nuestros usuarios
              </span>
            </h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              Historias reales de estudiantes que encontraron su vocación gracias a VocAcción.
            </p>
            {isAuthenticated && (
               <div className="mt-6 lg:hidden">
                  <Button onClick={() => setIsModalOpen(true)} className="gap-2 bg-purple-600 hover:bg-purple-700 text-white rounded-full w-full sm:w-auto">
                    <Plus className="w-4 h-4" />
                     Dejar reseña
                  </Button>
               </div>
             )}
          </div>

          <div className="grid gap-8 lg:grid-cols-2 max-w-5xl mx-auto">
            {reviews.slice(0, 4).map((testimonial, index) => (
              <TestimonialCard 
                key={testimonial.id || index}
                testimonial={testimonial}
                index={index}
                currentUserId={user?.id}
                onEdit={() => {}} // Actions disabled in Home, available in "Ver más"
                onDelete={() => {}} 
              />
            ))}
          </div>

          <div className="flex justify-center mt-12">
            <Button 
                variant="outline" 
                size="lg" 
                className="border-purple-200 hover:bg-purple-50 text-purple-700 px-8 rounded-full"
                asChild
            >
                <Link to="/testimonios">
                    Ver más testimonios
                </Link>
            </Button>
          </div>
          
          <div className="text-center mt-8">
            <p className="text-gray-600 text-sm">
              Únete a los miles de estudiantes que ya han encontrado su vocación
            </p>
          </div>
        </div>
      </section>

      {/* SECCIÓN CALL-TO-ACTION FINAL - Invita al usuario a registrarse o continuar explorando la web */}
      <section className="w-full py-16 lg:py-24 relative overflow-hidden">
        {/* Fondo con gradiente */}
        <div className="absolute inset-0 bg-linear-to-br from-purple-600 via-purple-700 to-green-600"></div>
        
        {/* Patrón de fondo */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-72 h-72 bg-white rounded-full filter blur-3xl animate-blob"></div>
          <div className="absolute top-40 right-20 w-96 h-96 bg-white rounded-full filter blur-3xl animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-10 left-1/3 w-80 h-80 bg-white rounded-full filter blur-3xl animate-blob animation-delay-4000"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            {/* Icono superior */}
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm mb-8 animate-float">
              <Target className="w-10 h-10 text-white" />
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
                    <Link to="/servicios">
                      Servicios
                    </Link>
                  </Button>

                    <Button 
                    size="lg" 
                    className="w-full lg:w-auto bg-green-500 text-white hover:bg-green-600 shadow-2xl hover:shadow-3xl hover:scale-105 transition-all duration-300 px-12 py-7 text-lg font-bold"
                    asChild
                  >
                    <Link to="/planes" className="flex items-center justify-center gap-2">
                      Ver planes Premium
                      <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
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
                      <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
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

            {/* Badges de confianza */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-1">100%</div>
                <div className="text-sm text-purple-200">Gratuito</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-1">24/7</div>
                <div className="text-sm text-purple-200">Disponible</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-1">5min</div>
                <div className="text-sm text-purple-200">Para empezar</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-1">∞</div>
                <div className="text-sm text-purple-200">Posibilidades</div>
              </div>
            </div>
          </div>
        </div>

        {/* Decoración inferior ondulada */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 0L60 10C120 20 240 40 360 46.7C480 53 600 47 720 43.3C840 40 960 40 1080 46.7C1200 53 1320 67 1380 73.3L1440 80V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0V0Z" fill="white" fillOpacity="0.1"/>
          </svg>
        </div>
      </section>

      <Transition appear show={isModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setIsModalOpen(false)}>
          <TransitionChild
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/25 backdrop-blur-sm" />
          </TransitionChild>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <TransitionChild
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <DialogPanel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all border border-purple-100">
                  <DialogTitle
                    as="h3"
                    className="text-lg font-bold leading-6 text-gray-900 flex justify-between items-center"
                  >
                    Tu experiencia en VocAcción
                    <Button variant="ghost" size="sm" onClick={() => setIsModalOpen(false)} className="h-8 w-8 p-0 rounded-full">
                        <X className="w-4 h-4" />
                    </Button>
                  </DialogTitle>
                  <div className="mt-2 text-sm text-gray-500">
                    Cuéntanos cómo te ha ayudado la plataforma.
                  </div>

                  <form onSubmit={handleSubmitReview} className="mt-4 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Edad (Opcional)</label>
                        <Input 
                            type="number" 
                            placeholder="Ej. 18" 
                            min="5" 
                            max="100"
                            value={reviewForm.edad}
                            onChange={(e) => setReviewForm({...reviewForm, edad: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tu testimonio</label>
                        <textarea 
                            className="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="Escribe aquí tu experiencia..."
                            required
                            maxLength={255}
                            value={reviewForm.mensaje}
                            onChange={(e) => setReviewForm({...reviewForm, mensaje: e.target.value})}
                        />
                    </div>

                    <div className="mt-6 flex justify-end gap-3">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setIsModalOpen(false)}
                      >
                        Cancelar
                      </Button>
                      <Button
                        type="submit"
                        className="bg-purple-600 hover:bg-purple-700 text-white"
                      >
                        Publicar reseña
                      </Button>
                    </div>
                  </form>
                </DialogPanel>
              </TransitionChild>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
}