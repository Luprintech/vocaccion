import React, { useState } from "react";
import { FileText, ArrowLeft, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button.tsx";

/**
 * Términos de Servicio - VocAcción
 * 
 * Página que detalla los términos y condiciones de uso de la plataforma VocAcción.
 */

const TermsOfService = () => {
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
      title: "1. Aceptación de Términos",
      content: "Al acceder y utilizar la plataforma VocAcción, aceptas estos términos y condiciones en su totalidad. Si no estás de acuerdo con cualquier parte de estos términos, no debes utilizar nuestra plataforma. Nos reservamos el derecho a modificar estos términos en cualquier momento."
    },
    {
      title: "2. Requisitos de Registro",
      content: "Para acceder a ciertos servicios de VocAcción, necesitas registrarte con información precisa y completa. Eres responsable de mantener la confidencialidad de tu contraseña y de todas las actividades bajo tu cuenta. Debes tener al menos 13 años (o edad de consentimiento digital en tu jurisdicción) para utilizar nuestros servicios."
    },
    {
      title: "3. Uso Aceptable",
      content: "Aceptas utilizar VocAcción solo para propósitos legales y de acuerdo con estos términos. No debes: (a) utilizar la plataforma de manera que viole leyes; (b) acosar o dañar a otros usuarios; (c) intentar acceder sin autorización; (d) cargar contenido ofensivo o ilegal; (e) usar bots o automatización no autorizada."
    },
    {
      title: "4. Licencia de Uso",
      content: "VocAcción te otorga una licencia limitada, no exclusiva y revocable para acceder y utilizar nuestra plataforma. No puedes reproducir, distribuir, transmitir, exhibir, ejecutar o publicar ningún contenido de VocAcción sin nuestro permiso previo."
    },
    {
      title: "5. Propiedad Intelectual",
      content: "Todo el contenido en VocAcción, incluyendo textos, gráficos, logos, imágenes y software, es propiedad de VocAcción o de nuestros proveedores de contenido. Está protegido por leyes de derechos de autor internacionales. No tienes permiso para utilizarlo sin autorización explícita."
    },
    {
      title: "6. Contenido del Usuario",
      content: "Al enviar contenido a VocAcción, nos otorgas una licencia no exclusiva, royalty-free, mundial y perpetua para usar, copiar, modificar y distribuir ese contenido. Eres responsable de cualquier contenido que subas y aseguras que tienes todos los derechos necesarios."
    },
    {
      title: "7. Servicios de Pago",
      content: "Para acceder a servicios premium, debes proporcionar información de pago válida. Aceptas pagar los honorarios indicados en el momento del suscripción. Los precios pueden cambiar con previo aviso. Las suscripciones se renuevan automáticamente a menos que canceles antes de la fecha de renovación."
    },
    {
      title: "8. Renuncia de Responsabilidad",
      content: "VocAcción se proporciona 'tal cual' sin garantías de ningún tipo. No garantizamos que nuestros servicios sean ininterrumpidos, seguros o libres de errores. No somos responsables por daños indirectos, incidentales, especiales o consecuentes derivados del uso de nuestra plataforma."
    },
    {
      title: "9. Limitación de Responsabilidad",
      content: "En la medida permitida por la ley, la responsabilidad total de VocAcción no excederá la cantidad que pagaste en los últimos 12 meses. Algunos lugares no permiten la limitación de responsabilidad, por lo que esta limitación puede no aplicarse a ti."
    },
    {
      title: "10. Indemnización",
      content: "Aceptas indemnizar y mantener indemne a VocAcción, sus oficiales, directores y empleados de cualquier reclamo, daño, pérdida o gasto (incluyendo honorarios legales) derivados de tu violación de estos términos o tu uso de la plataforma."
    },
    {
      title: "11. Terminación",
      content: "VocAcción puede terminar tu acceso a la plataforma en cualquier momento, por cualquier razón, sin previo aviso. Esto incluye violaciones de estos términos, actividad fraudulenta o ilegal. Al terminar, debes dejar de usar la plataforma."
    },
    {
      title: "12. Ley Aplicable",
      content: "Estos términos se rigen por las leyes de España, sin considerar sus conflictos de disposiciones legales. Cualquier disputa se resolverá en los juzgados competentes de Madrid, España."
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
              <FileText className="h-4 w-4" />
              Términos de Servicio
            </div>

            <h1 className="text-5xl md:text-6xl font-extrabold bg-linear-to-r from-purple-600 via-purple-700 to-green-600 bg-clip-text text-transparent mb-6 leading-tight animate-gradientShift">
              📋 Términos y Condiciones
            </h1>

            <p className="text-xl text-gray-700 leading-relaxed font-medium">
              Por favor, lee atentamente estos términos y condiciones antes de utilizar VocAcción. Al acceder a nuestra plataforma, aceptas cumplir con todos los términos aquí establecidos.
            </p>
          </section>

          {/* Contenido */}
          <section className="space-y-6 mb-12">
            {sections.map((section, index) => (
              <div
                key={index}
                className="group relative overflow-hidden rounded-2xl bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-white hover:border-green-200 p-8"
              >
                {/* Borde superior animado */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-green-500 to-purple-600 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>

                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-linear-to-br from-green-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm shrink-0 mt-1">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-green-600 transition-colors">
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
              <Button className="bg-white/80 backdrop-blur-sm border-2 border-green-200 text-green-700 hover:bg-green-50 font-bold py-6 rounded-xl">
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

export default TermsOfService;
