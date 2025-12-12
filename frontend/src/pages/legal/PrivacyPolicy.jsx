import React, { useState } from "react";
import { Shield, ArrowLeft, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button.tsx";

/**
 * Política de Privacidad - VocAcción
 * 
 * Página que detalla la política de privacidad y protección de datos
 * de la plataforma VocAcción, conforme a RGPD.
 */

const PrivacyPolicy = () => {
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
      title: "1. Responsable del Tratamiento",
      content: "VocAcción es el responsable del tratamiento de tus datos personales. Nos comprometemos a proteger tu privacidad y a cumplir con la Ley Orgánica 3/2018, de 5 de diciembre, de Protección de Datos Personales y garantía de los derechos digitales (LOPDGDD) y el Reglamento (UE) 2016/679 del Parlamento Europeo (RGPD)."
    },
    {
      title: "2. Datos que Recopilamos",
      content: "Recopilamos información que voluntariamente nos proporcionas, como nombre, correo electrónico, teléfono y datos sobre tus intereses académicos y profesionales. También podemos recopilar información sobre cómo utilizas nuestra plataforma mediante cookies y tecnologías similares."
    },
    {
      title: "3. Cómo Utilizamos tus Datos",
      content: "Utilizamos tus datos para: (a) proporcionar y mejorar nuestros servicios; (b) personalizar tu experiencia; (c) comunicarnos contigo; (d) procesamiento de pagos; (e) cumplir obligaciones legales; (f) prevenir fraude y garantizar la seguridad."
    },
    {
      title: "4. Base Legal para el Tratamiento",
      content: "El tratamiento de tus datos se basa en: (a) tu consentimiento explícito; (b) ejecución de un contrato; (c) obligaciones legales; (d) intereses legítimos de VocAcción; (e) protección de intereses vitales."
    },
    {
      title: "5. Compartición de Datos",
      content: "No compartimos tus datos personales con terceros sin tu consentimiento, excepto cuando sea necesario para proporcionar nuestros servicios o cumplir con obligaciones legales. Nuestros proveedores de servicios están obligados por contrato a proteger tu privacidad."
    },
    {
      title: "6. Retención de Datos",
      content: "Conservamos tus datos personales durante el tiempo necesario para cumplir con los fines para los que fueron recopilados. Una vez que ya no sea necesario, eliminaremos tus datos de forma segura."
    },
    {
      title: "7. Tus Derechos",
      content: "Tienes derecho a: (a) acceder a tus datos; (b) rectificar datos incorrectos; (c) solicitar la eliminación; (d) limitar el tratamiento; (e) portabilidad de datos; (f) oposición al tratamiento; (g) no ser sometido a decisiones automatizadas."
    },
    {
      title: "8. Seguridad de Datos",
      content: "Implementamos medidas técnicas y organizativas robustas para proteger tus datos contra acceso no autorizado, alteración, divulgación o destrucción. Utilizamos encriptación SSL/TLS en todas las transmisiones de datos."
    },
    {
      title: "9. Contacto para Privacidad",
      content: "Si tienes preguntas sobre nuestra política de privacidad o deseas ejercer tus derechos, puedes contactarnos en: privacidad@vocaccion.es o escribir a nuestra dirección postal: Calle de la Orientación, 123, 28001 Madrid, España."
    },
    {
      title: "10. Cambios en la Política",
      content: "Nos reservamos el derecho a actualizar esta política de privacidad en cualquier momento. Te notificaremos de cambios significativos a través de tu correo electrónico o mediante un aviso prominente en nuestra plataforma."
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
              <Shield className="h-4 w-4" />
              Política de Privacidad
            </div>

            <h1 className="text-5xl md:text-6xl font-extrabold bg-linear-to-r from-purple-600 via-purple-700 to-green-600 bg-clip-text text-transparent mb-6 leading-tight animate-gradientShift">
              🔒 Tu Privacidad es Importante para Nosotros
            </h1>

            <p className="text-xl text-gray-700 leading-relaxed font-medium">
              En VocAcción nos comprometemos a proteger tus datos personales. Esta política explica cómo recopilamos, utilizamos y protegemos tu información.
            </p>
          </section>

          {/* Contenido */}
          <section className="space-y-6 mb-12">
            {sections.map((section, index) => (
              <div
                key={index}
                className="group relative overflow-hidden rounded-2xl bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-white hover:border-purple-200 p-8"
              >
                {/* Borde superior animado */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-purple-500 to-green-600 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>

                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-linear-to-br from-purple-500 to-green-500 flex items-center justify-center text-white font-bold text-sm shrink-0 mt-1">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-purple-600 transition-colors">
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

export default PrivacyPolicy;
