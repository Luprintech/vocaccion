import React, { useState } from "react";
import { Cookie, ArrowLeft, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button.tsx";

/**
 * Política de Cookies - VocAcción
 * 
 * Página que detalla el uso de cookies y tecnologías similares en la plataforma VocAcción.
 */

const CookiePolicy = () => {
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

  const sections = [
    {
      title: "1. ¿Qué son las Cookies?",
      content: "Las cookies son pequeños archivos de texto que se almacenan en tu dispositivo cuando visitas nuestro sitio web. Se utilizan para recordar información sobre tu visita y mejorar tu experiencia de usuario. Las cookies no contienen virus ni son software malicioso."
    },
    {
      title: "2. Tipos de Cookies que Utilizamos",
      content: "Utilizamos cuatro tipos principales de cookies: (a) Cookies técnicas: necesarias para el funcionamiento básico; (b) Cookies de funcionalidad: mejoran tu experiencia; (c) Cookies analíticas: nos ayudan a entender cómo usas el sitio; (d) Cookies de marketing: para personalizar publicidad."
    },
    {
      title: "3. Cookies Técnicas (Esenciales)",
      content: "Estas cookies son necesarias para que VocAcción funcione correctamente. Incluyen cookies de sesión, autenticación y preferencias de usuario. Se utilizan independientemente de tu consentimiento, ya que son esenciales para el funcionamiento del sitio."
    },
    {
      title: "4. Cookies de Funcionalidad",
      content: "Estas cookies nos permiten recordar tus preferencias, como idioma seleccionado, zoom de página y opciones de accesibilidad. Mejoran tu experiencia haciendo el sitio más personalizado según tus gustos."
    },
    {
      title: "5. Cookies Analíticas",
      content: "Utilizamos servicios como Google Analytics para recopilar información sobre cómo interactúas con VocAcción. Esta información es anónima y nos ayuda a mejorar la estructura, contenido y rendimiento de nuestro sitio."
    },
    {
      title: "6. Cookies de Marketing",
      content: "Utilizamos cookies para rastrear anuncios relevantes y medir la eficacia de nuestras campañas de marketing. También pueden ser compartidas con redes de publicidad para mostrar anuncios personalizados en otros sitios."
    },
    {
      title: "7. Consentimiento de Cookies",
      content: "Al visitar VocAcción por primera vez, te presentamos un banner de consentimiento de cookies. Puedes aceptar todas las cookies, rechazar las no esenciales, o acceder a una configuración detallada. Respetamos tu preferencia de privacidad."
    },
    {
      title: "8. Gestión de Cookies",
      content: "Puedes controlar y eliminar cookies en cualquier momento a través de la configuración de tu navegador. Ten en cuenta que eliminar cookies puede afectar la funcionalidad de VocAcción. Para instrucciones específicas, consulta la ayuda de tu navegador."
    },
    {
      title: "9. Cookies de Terceros",
      content: "Algunos servicios terceros integrados en VocAcción (como redes sociales y plataformas de análisis) pueden establecer sus propias cookies. No tenemos control total sobre estas cookies de terceros. Consulta sus políticas de privacidad para más información."
    },
    {
      title: "10. Tecnologías Similares",
      content: "Además de cookies, utilizamos tecnologías similares como web beacons, píxeles de seguimiento y almacenamiento local del navegador. Estos cumplen funciones similares a las cookies para mejorar tu experiencia y analizar el uso del sitio."
    },
    {
      title: "11. Privacidad y Seguridad",
      content: "Tus datos recopilados a través de cookies se tratan de acuerdo con nuestra Política de Privacidad. Implementamos medidas de seguridad para proteger esta información. Puedes ejercer tus derechos de privacidad en cualquier momento."
    },
    {
      title: "12. Cambios en Esta Política",
      content: "Nos reservamos el derecho de actualizar esta política de cookies. Los cambios significativos serán notificados mediante un aviso prominente en VocAcción. Tu uso continuado del sitio constituye aceptación de los cambios."
    }
  ];

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
            className="absolute rounded-full animate-float"
            style={{
              top: `${particle.top}%`,
              left: `${particle.left}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              backgroundColor: particle.color === 'purple' ? (particle.shade === '300' ? '#d8b4fe' : '#c084fc') : (particle.shade === '300' ? '#bbf7d0' : '#86efac'),
              opacity: particle.opacity,
              animationDelay: `${particle.delay}ms`
            }}
          />
        ))}
      </div>

      <div className="relative z-10 px-6 md:px-20 py-16">
        <div className="container mx-auto max-w-4xl">
          {/* Encabezado */}
          <section className="mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm border border-purple-200 text-purple-700 text-sm font-semibold mb-6 shadow-lg">
              <Cookie className="h-4 w-4" />
              Política de Cookies
            </div>

            <h1 className="text-5xl md:text-6xl font-extrabold bg-linear-to-r from-purple-600 via-purple-700 to-green-600 bg-clip-text text-transparent mb-6 leading-tight animate-gradientShift">
              🍪 Información sobre Cookies
            </h1>

            <p className="text-xl text-gray-700 leading-relaxed font-medium">
              En VocAcción utilizamos cookies para mejorar tu experiencia de navegación. Esta política explica qué son, cómo las usamos y cómo puedes controlarlas.
            </p>
          </section>

          {/* Contenido */}
          <section className="space-y-6 mb-12">
            {sections.map((section, index) => (
              <div
                key={index}
                className="group relative overflow-hidden rounded-2xl bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-white hover:border-amber-200 p-8"
              >
                {/* Borde superior animado */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-amber-500 to-orange-600 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>

                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-linear-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white font-bold text-sm shrink-0 mt-1">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-amber-600 transition-colors">
                      {section.title}
                    </h2>
                    <p className="text-gray-700 leading-relaxed">
                      {section.content}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </section>

          {/* Tabla comparativa de cookies */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Resumen de Tipos de Cookies</h2>
            <div className="overflow-x-auto rounded-2xl bg-white/80 backdrop-blur-sm shadow-lg border-2 border-white">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-linear-to-r from-purple-50 to-green-50">
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Tipo</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Propósito</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Consentimiento</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-100 hover:bg-purple-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">Técnicas</td>
                    <td className="px-6 py-4 text-sm text-gray-700">Funcionamiento del sitio</td>
                    <td className="px-6 py-4 text-sm"><span className="px-3 py-1 rounded-full bg-green-100 text-green-700 font-medium text-xs">Requerido</span></td>
                  </tr>
                  <tr className="border-b border-gray-100 hover:bg-purple-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">Funcionalidad</td>
                    <td className="px-6 py-4 text-sm text-gray-700">Personalización de experiencia</td>
                    <td className="px-6 py-4 text-sm"><span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 font-medium text-xs">Opcional</span></td>
                  </tr>
                  <tr className="border-b border-gray-100 hover:bg-purple-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">Analítica</td>
                    <td className="px-6 py-4 text-sm text-gray-700">Análisis de uso</td>
                    <td className="px-6 py-4 text-sm"><span className="px-3 py-1 rounded-full bg-purple-100 text-purple-700 font-medium text-xs">Opcional</span></td>
                  </tr>
                  <tr className="hover:bg-purple-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">Marketing</td>
                    <td className="px-6 py-4 text-sm text-gray-700">Publicidad personalizada</td>
                    <td className="px-6 py-4 text-sm"><span className="px-3 py-1 rounded-full bg-orange-100 text-orange-700 font-medium text-xs">Opcional</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Última actualización */}
          <section className="p-8 rounded-2xl bg-white/80 backdrop-blur-sm shadow-lg border-2 border-white mb-12">
            <p className="text-sm text-gray-600">
              <span className="font-bold">Última actualización:</span> {new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </section>

          {/* Botón de regreso */}
          <div className="flex justify-between items-center">
            <Link to="/">
              <Button className="bg-white/80 backdrop-blur-sm border-2 border-purple-200 text-purple-700 hover:bg-purple-50 font-bold py-6 rounded-xl">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver al inicio
              </Button>
            </Link>

            <Link to="/contacto">
              <Button className="bg-linear-to-r from-purple-600 to-green-600 hover:from-purple-700 hover:to-green-700 text-white font-bold py-6 rounded-xl shadow-lg">
                <Sparkles className="h-4 w-4 mr-2" />
                Contacta con nosotros
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
};

export default CookiePolicy;
