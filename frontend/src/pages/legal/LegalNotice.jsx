import React, { useState } from "react";
import { AlertCircle, ArrowLeft, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button.tsx";

/**
 * Aviso Legal - VocAcción
 * 
 * Página que contiene la información legal requerida sobre la plataforma VocAcción.
 */

const LegalNotice = () => {
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
      title: "1. Identificación",
      content: "VocAcción es una plataforma de orientación vocacional desarrollada y operada por VocAcción Educativo S.L. Domicilio social: Calle de la Orientación, 123, 28001 Madrid, España. CIF: A12345678. Correo electrónico: legal@vocaccion.es."
    },
    {
      title: "2. Objeto y Naturaleza",
      content: "VocAcción es una plataforma digital que proporciona servicios de orientación vocacional, tests de evaluación profesional, recursos educativos y asesoramiento académico. Los servicios son de naturaleza informativa y orientativa, no constituyen consejo profesional específico."
    },
    {
      title: "3. Derechos de Propiedad Intelectual",
      content: "Todos los contenidos de VocAcción, incluyendo pero no limitado a textos, imágenes, gráficos, logos, videos y software, están protegidos por derechos de autor y leyes de propiedad intelectual. La reproducción, distribución o transmisión sin permiso está prohibida."
    },
    {
      title: "4. Exención de Responsabilidad",
      content: "VocAcción proporciona su contenido e información 'tal cual' sin garantías de ningún tipo. Aunque nos esforzamos por proporcionar información precisa, no garantizamos la exactitud, integridad o actualidad del contenido. Los usuarios utilizan la plataforma bajo su propio riesgo."
    },
    {
      title: "5. Limitación de Responsabilidad",
      content: "VocAcción no será responsable por daños directos, indirectos, incidentales, especiales o consecuentes derivados del uso o la incapacidad de usar la plataforma. Esto incluye pérdida de datos, interrupciones de servicio o daños causados por terceros."
    },
    {
      title: "6. Enlaces a Sitios Externos",
      content: "VocAcción puede contener enlaces a sitios web de terceros. No somos responsables por el contenido, precisión o prácticas de privacidad de estos sitios externos. El acceso a enlaces externos está bajo tu propio riesgo y responsabilidad."
    },
    {
      title: "7. Servicios de Terceros",
      content: "VocAcción integra servicios de terceros como procesadores de pago, proveedores de análisis y plataformas de comunicación. No somos responsables por los servicios o contenido proporcionado por terceros. Consulta sus términos y políticas de privacidad."
    },
    {
      title: "8. Regulación y Cumplimiento Legal",
      content: "VocAcción se rige por las leyes españolas, incluyendo LOPDGDD y RGPD para protección de datos, Ley de Servicios de la Sociedad de la Información (LSSI-CE), y otras leyes aplicables. Cumplimos con regulaciones de protección al consumidor."
    },
    {
      title: "9. Prohibiciones de Uso",
      content: "Se prohibe: (a) acceso no autorizado o hacking; (b) interferencia con funcionamiento del servidor; (c) recopilación de datos sin permiso; (d) envío de contenido ilegal o ofensivo; (e) suplantación de identidad; (f) transmisión de malware; (g) acoso o amenazas."
    },
    {
      title: "10. Impuestos y Honorarios",
      content: "Los precios mostrados pueden no incluir impuestos aplicables (IVA). Es responsabilidad del usuario determinar qué impuestos se aplican. VocAcción no asume responsabilidad por la exactitud de información fiscal. Consulta con autoridades fiscales si es necesario."
    },
    {
      title: "11. Validez y Alcance de los Tests",
      content: "Los tests de orientación vocacional de VocAcción están diseñados para proporcionar orientación informativa. Los resultados son orientativos y no constituyen diagnóstico profesional de aptitudes o recomendaciones personalizadas de carreras. Se recomienda consultar con orientadores calificados."
    },
    {
      title: "12. Modificación de Servicios",
      content: "VocAcción se reserva el derecho de modificar, suspender o discontinuar cualquier servicio con o sin previo aviso. También podemos actualizar estos términos legales en cualquier momento. El uso continuado implica aceptación de cambios."
    },
    {
      title: "13. Jurisdicción y Resolución de Disputas",
      content: "Estos términos legales se rigen por la ley española. Cualquier disputa, conflicto o reclamación derivada de VocAcción será resuelta ante los juzgados competentes de Madrid, España, de acuerdo con las leyes españolas."
    },
    {
      title: "14. Contacto para Asuntos Legales",
      content: "Para consultas legales, reclamaciones o notificaciones oficiales, contacta a: VocAcción Educativo S.L., Calle de la Orientación 123, 28001 Madrid, o envía un correo a legal@vocaccion.es. Responderemos en el plazo legal establecido."
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
              <AlertCircle className="h-4 w-4" />
              Aviso Legal
            </div>

            <h1 className="text-5xl md:text-6xl font-extrabold bg-linear-to-r from-purple-600 via-purple-700 to-green-600 bg-clip-text text-transparent mb-6 leading-tight animate-gradientShift">
              ⚖️ Aviso Legal VocAcción
            </h1>

            <p className="text-xl text-gray-700 leading-relaxed font-medium">
              Este aviso legal contiene información importante sobre la identificación, responsabilidades y términos legales de VocAcción. Por favor, léelo cuidadosamente.
            </p>
          </section>

          {/* Contenido */}
          <section className="space-y-6 mb-12">
            {sections.map((section, index) => (
              <div
                key={index}
                className="group relative overflow-hidden rounded-2xl bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-white hover:border-red-200 p-8"
              >
                {/* Borde superior animado */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-red-500 to-orange-600 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>

                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-linear-to-br from-red-500 to-orange-500 flex items-center justify-center text-white font-bold text-sm shrink-0 mt-1">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-red-600 transition-colors">
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

          {/* Información de contacto importante */}
          <section className="mb-12 p-8 rounded-2xl bg-linear-to-br from-red-50 to-orange-50 shadow-lg border-2 border-red-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Información de Contacto para Asuntos Legales</h2>
            <div className="space-y-4">
              <div>
                <p className="font-semibold text-gray-900">Empresa:</p>
                <p className="text-gray-700">VocAcción Educativo S.L.</p>
              </div>
              <div>
                <p className="font-semibold text-gray-900">Domicilio:</p>
                <p className="text-gray-700">Calle de la Orientación, 123, 28001 Madrid, España</p>
              </div>
              <div>
                <p className="font-semibold text-gray-900">CIF:</p>
                <p className="text-gray-700">A12345678</p>
              </div>
              <div>
                <p className="font-semibold text-gray-900">Correo Electrónico:</p>
                <p className="text-gray-700">legal@vocaccion.es</p>
              </div>
              <div>
                <p className="font-semibold text-gray-900">Teléfono:</p>
                <p className="text-gray-700">+34 900 123 456</p>
              </div>
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

export default LegalNotice;
