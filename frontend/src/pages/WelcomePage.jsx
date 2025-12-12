import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContextFixed';
import { useNavigate } from 'react-router-dom';
import { Sparkles, BookOpen, TrendingUp, User, Target, Zap, ArrowRight, CheckCircle, Lightbulb } from 'lucide-react';

const WelcomePage = () => {
  const { user, getPrimaryRole } = useAuth();
  const navigate = useNavigate();
  
  // Redirigir admins y orientadores a sus dashboards
  useEffect(() => {
    const userRole = getPrimaryRole();
    if (userRole === 'administrador') {
      navigate('/admin/dashboard', { replace: true });
    } else if (userRole === 'orientador') {
      navigate('/orientador/dashboard', { replace: true });
    }
  }, [getPrimaryRole, navigate]);

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

  return (
    <div className="min-h-screen bg-linear-to-br from-purple-50 via-white to-green-50 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* FONDO ANIMADO */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        {/* Círculos animados de fondo */}
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

      <div className="max-w-6xl mx-auto relative z-10">
        {/* HERO SECTION */}
        <div className="text-center mb-16">
          {/* Badge superior */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm border border-purple-200 text-purple-700 text-sm font-semibold mb-8 shadow-lg hover:shadow-xl transition-all duration-300 animate-float">
            <Sparkles className="h-4 w-4" />
            ¡Bienvenido de vuelta!
          </div>

          {/* Título principal */}
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold mb-6 leading-tight">
            <span className="bg-linear-to-r from-purple-600 via-purple-700 to-green-600 bg-clip-text text-transparent animate-gradientShift">
              Hola, {user?.nombre || 'Estudiante'}! 👋
            </span>
          </h1>

          {/* Subtítulo */}
          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Estás a un paso de descubrir tu verdadera vocación. 
            <span className="font-bold text-purple-700"> Elige tu próximo paso</span> y comienza tu transformación.
          </p>
        </div>

        {/* CARDS PRINCIPALES */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-16">
          {/* Card 1: Test Vocacional */}
          <div className="group relative overflow-hidden rounded-2xl bg-white/80 backdrop-blur-sm shadow-xl hover:shadow-3xl transition-all duration-500 hover:-translate-y-3 border-2 border-transparent hover:border-purple-300 hover:bg-white">
            {/* Borde superior animado */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-linear-to-r from-purple-500 to-purple-600 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
            
            <div className="p-8 relative">
              {/* Icono con gradiente */}
              <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-purple-100 to-purple-200 flex items-center justify-center mb-6 group-hover:shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                <Target className="w-8 h-8 text-purple-600" />
              </div>

              <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-purple-700 transition-colors duration-300">
                Test Vocacional
              </h3>
              
              <p className="text-gray-600 mb-6 leading-relaxed group-hover:text-gray-700 transition-colors duration-300">
                Descubre tus intereses, aptitudes y talentos con nuestro test adaptativo potenciado por IA.
              </p>

              {/* Beneficios */}
              <ul className="space-y-2 mb-6">
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                  <span>5-10 minutos</span>
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                  <span>100% personalizado</span>
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                  <span>Resultados inmediatos</span>
                </li>
              </ul>

              <a
                href="/testintro"
                className="inline-flex items-center gap-2 px-6 py-3 bg-linear-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group/btn"
              >
                Comenzar test
                <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
              </a>

              {/* Efecto de brillo */}
              <div className="absolute inset-0 bg-linear-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-10 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-all duration-1000"></div>
            </div>
          </div>

          {/* Card 2: Explorar Recursos */}
          <div className="group relative overflow-hidden rounded-2xl bg-white/80 backdrop-blur-sm shadow-xl hover:shadow-3xl transition-all duration-500 hover:-translate-y-3 border-2 border-transparent hover:border-green-300 hover:bg-white">
            {/* Borde superior animado */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-linear-to-r from-green-500 to-green-600 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
            
            <div className="p-8 relative">
              {/* Icono con gradiente */}
              <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-green-100 to-green-200 flex items-center justify-center mb-6 group-hover:shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                <BookOpen className="w-8 h-8 text-green-600" />
              </div>

              <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-green-700 transition-colors duration-300">
                Explorar Recursos
              </h3>
              
              <p className="text-gray-600 mb-6 leading-relaxed group-hover:text-gray-700 transition-colors duration-300">
                Accede a guías, artículos especializados y recursos curados por expertos en orientación vocacional.
              </p>

              {/* Beneficios */}
              <ul className="space-y-2 mb-6">
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                  <span>500+ artículos</span>
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                  <span>Actualizado regularmente</span>
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                  <span>Filtrado por interés</span>
                </li>
              </ul>

              <a
                href="/recursos"
                className="inline-flex items-center gap-2 px-6 py-3 bg-linear-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group/btn"
              >
                Ver recursos
                <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
              </a>

              {/* Efecto de brillo */}
              <div className="absolute inset-0 bg-linear-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-10 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-all duration-1000"></div>
            </div>
          </div>

          {/* Card 3: Tu Perfil */}
          <div className="group relative overflow-hidden rounded-2xl bg-white/80 backdrop-blur-sm shadow-xl hover:shadow-3xl transition-all duration-500 hover:-translate-y-3 border-2 border-transparent hover:border-pink-300 hover:bg-white">
            {/* Borde superior animado */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-linear-to-r from-pink-500 to-purple-600 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
            
            <div className="p-8 relative">
              {/* Icono con gradiente */}
              <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-pink-100 to-purple-200 flex items-center justify-center mb-6 group-hover:shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                <User className="w-8 h-8 text-pink-600" />
              </div>

              <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-pink-700 transition-colors duration-300">
                Tu Perfil
              </h3>
              
              <p className="text-gray-600 mb-6 leading-relaxed group-hover:text-gray-700 transition-colors duration-300">
                Personaliza tu perfil, revisa tu progreso y accede a tus resultados guardados en la plataforma.
              </p>

              {/* Beneficios */}
              <ul className="space-y-2 mb-6">
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                  <span>Historial completo</span>
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                  <span>Análisis detallado</span>
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                  <span>Datos seguros</span>
                </li>
              </ul>

              <a
                href="/perfil"
                className="inline-flex items-center gap-2 px-6 py-3 bg-linear-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group/btn"
              >
                Ver perfil
                <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
              </a>

              {/* Efecto de brillo */}
              <div className="absolute inset-0 bg-linear-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-10 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-all duration-1000"></div>
            </div>
          </div>
        </div>

        {/* SECCIÓN INFORMATIVA */}
        <div className="bg-linear-to-r from-purple-600 via-purple-700 to-green-600 rounded-3xl p-8 md:p-12 shadow-2xl relative overflow-hidden mb-16">
          {/* Decoración de fondo */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
          </div>

          <div className="relative z-10 grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm text-white font-semibold text-sm mb-6 border border-white/30">
                <Lightbulb className="w-4 h-4" />
                Consejos útiles
              </div>
              
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 leading-tight">
                Maximiza tu experiencia en VocAcción
              </h2>
              
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-white/30 flex items-center justify-center shrink-0 mt-1">
                    <span className="text-white font-bold text-sm">1</span>
                  </div>
                  <div>
                    <p className="text-white font-semibold">Sé honesto en tus respuestas</p>
                    <p className="text-purple-100 text-sm">Cuanto más precisas sean tus respuestas, mejor serán tus recomendaciones.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-white/30 flex items-center justify-center shrink-0 mt-1">
                    <span className="text-white font-bold text-sm">2</span>
                  </div>
                  <div>
                    <p className="text-white font-semibold">Explora todos los recursos</p>
                    <p className="text-purple-100 text-sm">Los artículos y guías pueden ampliar tus horizontes profesionales.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-white/30 flex items-center justify-center shrink-0 mt-1">
                    <span className="text-white font-bold text-sm">3</span>
                  </div>
                  <div>
                    <p className="text-white font-semibold">Revisa tu perfil regularmente</p>
                    <p className="text-purple-100 text-sm">Tus intereses pueden evolucionar, así que actualiza tu información.</p>
                  </div>
                </li>
              </ul>
            </div>

            <div className="relative">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/30">
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                      <Zap className="w-6 h-6 text-yellow-300" />
                    </div>
                    <div>
                      <p className="text-white font-semibold">Rápido y sencillo</p>
                      <p className="text-purple-100 text-sm">Completa el test en menos de 10 minutos</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-green-300" />
                    </div>
                    <div>
                      <p className="text-white font-semibold">Basado en datos</p>
                      <p className="text-purple-100 text-sm">Recomendaciones respaldadas por IA e investigación</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-blue-300" />
                    </div>
                    <div>
                      <p className="text-white font-semibold">Gratuito siempre</p>
                      <p className="text-purple-100 text-sm">Acceso a todas las funciones básicas sin costo</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* MOTIVACIÓN FINAL */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-100 text-purple-700 font-semibold text-sm mb-6">
            <Sparkles className="w-4 h-4" />
            Tu futuro te espera
          </div>
          
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            ¿Listo para comenzar tu viaje?
          </h2>
          
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
            Descubre las profesiones y estudios que mejor se adaptan a ti. Solo necesitas 10 minutos para cambiar tu perspectiva del futuro.
          </p>

          <a
            href="/testintro"
            className="inline-flex items-center gap-2 px-8 py-4 bg-linear-to-r from-purple-600 to-green-600 hover:from-purple-700 hover:to-green-700 text-white font-bold rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 group"
          >
            <Target className="w-5 h-5" />
            Empezar el test ahora
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </a>
        </div>
      </div>
    </div>
  );
};

export default WelcomePage;