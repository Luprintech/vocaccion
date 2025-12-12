import React, { useState } from "react";
import { Sparkles } from "lucide-react";
import ArticulosListado from './ArticulosListado';

/**
 * Página Principal de Recursos - VocAcción
 * 
 * Vista principal que muestra los recursos educativos disponibles
 */

const RecursosIndex = () => {
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
        {/* Encabezado */}
        <section className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm border border-purple-200 text-purple-700 text-sm font-semibold mb-8 shadow-lg animate-float">
              <Sparkles className="h-4 w-4" />
              Centro de Recursos
            </div>
            
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold bg-linear-to-r from-purple-600 via-purple-700 to-green-600 bg-clip-text text-transparent mb-6 leading-tight animate-gradientShift">
              Todos los recursos para tu futuro
            </h1>
            
            <p className="text-xl text-gray-700 leading-relaxed mb-8 max-w-2xl mx-auto font-medium">
              Explora guías descargables y recursos educativos para tomar las mejores decisiones sobre tu educación y carrera profesional.
            </p>
          </div>
        </section>

        {/* Contenido de recursos */}
        <ArticulosListado />
      </div>
    </main>
  );
};

export default RecursosIndex;