/**
 * PLANES.JSX - Página de planes de suscripción de VocAcción
 * 
 * PROPÓSITO:
 * Presenta los diferentes niveles de servicio disponibles con
 * pricing claro y comparativa de características incluidas.
 * 
 * COMPONENTE:
 * Landing de precios con 3 planes diferenciados:
 * - Gratuito: Funcionalidad básica del test vocacional
 * - Pro: Test + itinerario formativo personalizado
 * - Pro Plus: Todo lo anterior + orientador personal asignado
 * 
 * INTEGRACIÓN:
 * Accesible desde el header principal (/planes)
 * Enlaces de CTA conectan con registro y contacto
 * FAQ section enlaza con la página de contacto (#faq)
 * 
 * COLABORADORES:
 * Para modificar precios o características, editad la constante 'planes'
 * Para añadir nuevos planes, mantened la misma estructura de objeto
 */

import React, { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Check, X, Star, Zap, Crown, Users, Target,
  MessageCircle, BookOpen, Award, Sparkles, ArrowRight, Lightbulb, Loader
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AuthContext } from "@/context/AuthContextFixed";
import { createCheckoutSession, getSubscriptionStatus, getBillingPortalUrl } from "@/api";

// Configuración de los tres planes de suscripción con todas sus características
const planes = [
  {
    id: "gratuito",
    nombre: "Gratuito",
    precio: "0€",
    periodo: "/mes",
    descripcion: "Perfecto para empezar a descubrir tu vocación",
    icono: <Target className="h-8 w-8" />,
    color: "gray",
    popular: false,
    caracteristicas: [
      { incluido: true, texto: "Test vocacional completo con IA" },
      { incluido: true, texto: "Resultados básicos personalizados" },
      { incluido: true, texto: "Recomendaciones generales de carreras" },
      { incluido: false, texto: "Itinerario formativo detallado" },
      { incluido: false, texto: "Seguimiento con orientador" },
      { incluido: false, texto: "Recursos premium" },
      { incluido: false, texto: "Soporte prioritario" }
    ],
    boton: {
      texto: "Empezar Gratis",
      estilo: "outline"
    }
  },
  {
    id: "pro",
    nombre: "Pro",
    precio: "9€",
    periodo: "/mes",
    descripcion: "Para quienes buscan un plan de acción claro",
    icono: <Zap className="h-8 w-8" />,
    color: "blue",
    popular: true,
    caracteristicas: [
      { incluido: true, texto: "Test vocacional completo con IA" },
      { incluido: true, texto: "Resultados detallados y análisis profundo" },
      { incluido: true, texto: "Recomendaciones personalizadas de carreras" },
      { incluido: true, texto: "Itinerario formativo paso a paso" },
      { incluido: true, texto: "Recursos educativos premium" },
      { incluido: false, texto: "Seguimiento con orientador" },
      { incluido: false, texto: "Soporte prioritario" }
    ],
    boton: {
      texto: "Elegir Pro",
      estilo: "primary"
    }
  },
  {
    id: "pro-plus",
    nombre: "Pro Plus",
    precio: "19€",
    periodo: "/mes",
    descripcion: "La experiencia completa con acompañamiento profesional",
    icono: <Crown className="h-8 w-8" />,
    color: "purple",
    popular: false,
    caracteristicas: [
      { incluido: true, texto: "Test vocacional completo con IA" },
      { incluido: true, texto: "Resultados detallados y análisis profundo" },
      { incluido: true, texto: "Recomendaciones personalizadas de carreras" },
      { incluido: true, texto: "Itinerario formativo paso a paso" },
      { incluido: true, texto: "Recursos educativos premium" },
      { incluido: true, texto: "Seguimiento personalizado con orientador" },
      { incluido: true, texto: "Soporte prioritario 24/7" }
    ],
    boton: {
      texto: "Elegir Pro Plus",
      estilo: "primary"
    }
  }
];

// Componente principal de la página Planes
const Planes = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated: isLoggedIn } = useContext(AuthContext);
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

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Stripe Price IDs mapping
  const PRICE_IDS = {
    'pro': 'price_1SZ8xR4hgbVBtEJuqyvbNioD',
    'pro-plus': 'price_1SZ8yD4hgbVBtEJuiv4Jjy3w'
  };

  const handlePlanClick = async (planId) => {
    setError(null);

    // If user is not logged in, redirect to login
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }

    // If free plan, just redirect to dashboard
    if (planId === 'gratuito') {
      navigate('/estudiante/dashboard');
      return;
    }

    // For paid plans, create checkout session
    setLoading(true);
    try {
      const priceId = PRICE_IDS[planId];
      if (!priceId) {
        setError('Plan no válido');
        setLoading(false);
        return;
      }

      const response = await createCheckoutSession(priceId);

      if (response.success) {
        // Redirect to Stripe checkout
        window.location.href = response.url;
      } else if (response.status === 'already_subscribed') {
        // User is already subscribed, redirect to portal
        const portalResponse = await getBillingPortalUrl();
        if (portalResponse.success) {
          window.location.href = portalResponse.url;
        } else {
          setError('Error al acceder al portal de facturación');
        }
      } else {
        setError(response.message || 'Error al crear sesión de checkout');
      }
    } catch (err) {
      console.error('Checkout error:', err);
      setError('Error al procesar tu solicitud');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-linear-to-br from-purple-50 via-white to-green-50 relative overflow-hidden">
      {/* FONDO ANIMADO */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        {/* Círculos animados */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-1/2 right-0 w-96 h-96 bg-green-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>

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

      <div className="relative z-10 px-6 md:px-20 py-16">
        {/* Encabezado de la página */}
        <section className="container mx-auto px-4 py-12 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm border border-purple-200 text-purple-700 text-sm font-semibold mb-8 shadow-lg hover:shadow-xl transition-all duration-300 animate-float">
            <Sparkles className="h-4 w-4" />
            Planes y Precios
          </div>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold mb-6 leading-tight">
            <span className="bg-linear-to-r from-purple-600 via-purple-700 to-green-600 bg-clip-text text-transparent animate-gradientShift">
              Elige el plan perfecto
            </span>
            <br />
            <span className="text-gray-800">para tu futuro</span>
          </h1>

          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Desde el acceso gratuito hasta el acompañamiento completo con orientadores profesionales.
            <span className="font-bold text-purple-700"> Tu futuro, tu decisión.</span>
          </p>
        </section>

        {/* Tarjetas de planes */}
        <section className="container mx-auto px-4 py-16">
          {error && (
            <div className="max-w-6xl mx-auto mb-8 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-2">
              <span className="text-sm font-medium">{error}</span>
              <button onClick={() => setError(null)} className="ml-auto text-red-500 hover:text-red-700">✕</button>
            </div>
          )}
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {planes.map((plan, index) => (
              <div
                key={plan.id}
                className={`group relative overflow-hidden rounded-2xl bg-white/80 backdrop-blur-sm shadow-xl hover:shadow-3xl transition-all duration-500 hover:-translate-y-3 border-2 ${plan.popular
                    ? 'border-purple-300 md:scale-105 z-10'
                    : 'border-white hover:border-purple-200'
                  }`}
              >
                {/* Borde superior animado */}
                <div className={`absolute top-0 left-0 right-0 h-1.5 bg-linear-to-r ${plan.color === 'gray' ? 'from-gray-500 to-gray-600' :
                    plan.color === 'blue' ? 'from-blue-500 to-blue-600' :
                      'from-purple-500 to-purple-600'
                  } transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500`}></div>

                {/* Etiqueta de "Popular" */}
                {plan.popular && (
                  <div className="absolute top-4 right-4 bg-linear-to-r from-purple-500 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-bold flex items-center gap-1 shadow-lg">
                    <Star className="h-4 w-4" />
                    Más Popular
                  </div>
                )}

                <div className="p-8">
                  {/* Icono del plan */}
                  <div className={`w-16 h-16 rounded-2xl mb-6 flex items-center justify-center group-hover:shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 ${plan.color === 'gray' ? 'bg-gray-100 text-gray-600' :
                      plan.color === 'blue' ? 'bg-blue-100 text-blue-600' :
                        'bg-purple-100 text-purple-600'
                    }`}>
                    {plan.icono}
                  </div>

                  {/* Nombre del plan */}
                  <h3 className="text-2xl font-bold text-gray-900 mb-2 group-hover:text-purple-700 transition-colors duration-300">
                    {plan.nombre}
                  </h3>

                  {/* Precio */}
                  <div className="mb-4 leading-none">
                    <span className="text-5xl font-extrabold bg-linear-to-r from-purple-600 to-green-600 bg-clip-text text-transparent">{plan.precio}</span>
                    <span className="text-gray-600 text-lg ml-2">{plan.periodo}</span>
                  </div>

                  {/* Descripción */}
                  <p className="text-gray-600 text-sm leading-relaxed mb-8 group-hover:text-gray-700 transition-colors duration-300">
                    {plan.descripcion}
                  </p>

                  {/* Lista de características */}
                  <div className="space-y-3 mb-8">
                    {plan.caracteristicas.map((caracteristica, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <div className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${caracteristica.incluido
                            ? 'bg-green-100 text-green-600'
                            : 'bg-gray-100 text-gray-400'
                          }`}>
                          {caracteristica.incluido ? (
                            <Check className="h-3 w-3" />
                          ) : (
                            <X className="h-3 w-3" />
                          )}
                        </div>
                        <span className={`text-sm font-medium ${caracteristica.incluido ? 'text-gray-700' : 'text-gray-400'}`}>
                          {caracteristica.texto}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Botón de acción */}
                  <button
                    onClick={() => handlePlanClick(plan.id)}
                    disabled={loading}
                    className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group/btn cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 ${plan.popular
                        ? 'bg-linear-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white'
                        : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-purple-300 hover:text-purple-700'
                      }`}
                  >
                    {loading ? (
                      <>
                        <Loader className="w-4 h-4 animate-spin" />
                        Procesando...
                      </>
                    ) : (
                      <>
                        {plan.boton.texto}
                        <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>

                  {/* Efecto de brillo */}
                  <div className="absolute inset-0 bg-linear-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-10 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-all duration-1000"></div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Sección de información adicional */}
        <section className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto">
            <div className="relative overflow-hidden bg-linear-to-r from-purple-600 via-purple-700 to-green-600 rounded-3xl p-8 md:p-12 shadow-2xl">
              {/* Decoración de fondo */}
              <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
              </div>

              <div className="relative z-10 text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm text-white font-semibold text-sm mb-6 border border-white/30">
                  <Lightbulb className="h-4 w-4" />
                  ¿Necesitas ayuda?
                </div>

                <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 leading-tight">
                  ¿No sabes qué plan elegir?
                </h2>

                <p className="text-lg text-purple-100 leading-relaxed mb-8 max-w-2xl mx-auto">
                  Nuestro equipo de orientadores profesionales está aquí para ayudarte a encontrar
                  el plan que mejor se adapte a tus necesidades y objetivos académicos.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                  <a
                    href="/contacto"
                    className="inline-flex items-center gap-2 px-8 py-3 bg-white text-purple-700 hover:bg-purple-50 font-semibold rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 group"
                  >
                    <MessageCircle className="h-5 w-5" />
                    Hablar con un orientador
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </a>

                  <a
                    href="/contacto#faq"
                    className="inline-flex items-center gap-2 px-8 py-3 bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 font-semibold rounded-xl border border-white/30 transition-all duration-300 hover:scale-105 group"
                  >
                    <BookOpen className="h-5 w-5" />
                    Ver preguntas frecuentes
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Garantía y beneficios */}
        <section className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { icon: Award, title: 'Garantía de satisfacción', desc: '30 días o devolución total' },
                { icon: Users, title: 'Orientadores certificados', desc: 'Profesionales con experiencia' },
                { icon: Sparkles, title: 'Actualización constante', desc: 'Contenido siempre actualizado' }
              ].map((item, idx) => (
                <div key={idx} className="group text-center p-6 rounded-2xl bg-white/80 backdrop-blur-sm border border-transparent hover:border-purple-200 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-2">
                  <div className="w-14 h-14 bg-linear-to-br from-purple-100 to-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:shadow-lg group-hover:scale-110 transition-all duration-300">
                    <item.icon className="h-7 w-7 text-purple-600" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2 group-hover:text-purple-700 transition-colors">{item.title}</h3>
                  <p className="text-gray-600 text-sm">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
};

export default Planes;