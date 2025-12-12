import React, { useState } from "react";
import { useToast } from '@/components/ToastProvider';
import { 
  Mail, Phone, MapPin, Send, MessageSquare, Users, 
  ChevronDown, ChevronUp, ExternalLink, Clock, Shield, Sparkles, Lightbulb, CheckCircle, Zap, ArrowRight, Loader2, AlertCircle,
  Facebook, X, Linkedin, Instagram
} from "lucide-react";
import { enviarFormularioContacto } from '@/api.js';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/**
 * Página de Contacto - VocAcción
 * 
 * Página pública que incluye:
 * - Formulario de contacto general
 * - Información de contacto directo
 * - Sección de preguntas frecuentes (FAQ)
 * - Enlaces a redes sociales
 */

const Contacto = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    tipoConsulta: '',
    mensaje: '',
    prueba_spam: '',
  });
  
  const [errors, setErrors] = useState({});
  const [faqAbierto, setFaqAbierto] = useState(null);
  
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
  const { showToast } = useToast();

  // Opciones para el tipo de consulta
  const tiposConsulta = [
    { value: '', label: 'Selecciona el tipo de consulta' },
    { value: 'orientacion', label: 'Orientación vocacional personalizada' },
    { value: 'tecnico', label: 'Soporte técnico de la plataforma' },
    { value: 'planes', label: 'Información sobre planes y precios' },
    { value: 'colaboracion', label: 'Colaboración y partnerships' },
    { value: 'prensa', label: 'Consultas de prensa y medios' },
    { value: 'otro', label: 'Otra consulta' }
  ];

  // Preguntas frecuentes
  const faqs = [
    {
      pregunta: "¿Cómo funciona la orientación vocacional con IA de VocAcción?",
      respuesta: "Nuestro sistema de IA analiza tus respuestas a un cuestionario detallado sobre tus intereses, habilidades, valores y preferencias. Basándose en algoritmos avanzados y una base de datos actualizada del mercado laboral, te proporciona recomendaciones personalizadas sobre carreras, estudios y rutas formativas que mejor se adapten a tu perfil único."
    },
    {
      pregunta: "¿Cuánto tiempo toma completar el test vocacional?",
      respuesta: "El test completo toma aproximadamente 15-20 minutos. Está diseñado para ser exhaustivo pero no tedioso. Puedes guardar tu progreso y continuar más tarde si necesitas un descanso. Una vez completado, recibirás tu informe personalizado de forma inmediata."
    },
    {
      pregunta: "¿Los resultados son realmente precisos y confiables?",
      respuesta: "Sí, nuestros algoritmos están basados en investigación psicométrica reconocida y se actualizan continuamente con datos del mercado laboral actual. Sin embargo, los resultados deben considerarse como una guía orientativa muy valiosa, no como una decisión definitiva. Recomendamos complementar los resultados con nuestras sesiones de orientación personalizada."
    },
    {
      pregunta: "¿Qué diferencia hay entre el plan gratuito y los planes premium?",
      respuesta: "El plan gratuito incluye acceso al test básico y recursos generales. Los planes premium ofrecen tests más detallados, informes personalizados en profundidad, sesiones de orientación con expertos, seguimiento continuo, acceso a recursos exclusivos y actualizaciones periódicas de tu perfil vocacional según evolucione el mercado laboral."
    }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.prueba_spam) {
        console.log('Un bot salvaje apareció.');
        return;
    }

    // NORMALIZAR TODOS LOS CAMPOS antes de validar
    const normalizedData = {
      nombre: formData.nombre.replace(/\s+/g, ' ').trim(),
      email: formData.email.trim(),
      tipoConsulta: formData.tipoConsulta,
      mensaje: formData.mensaje.replace(/\s+/g, ' ').trim(),
      prueba_spam: formData.prueba_spam
    };

    // Actualizar el estado con datos normalizados
    setFormData(normalizedData);

    // Validar con los datos ya normalizados
    const newErrors = {};
    
    // Validar nombre
    if (!normalizedData.nombre) {
      newErrors.nombre = 'El nombre es obligatorio';
    } else if (normalizedData.nombre.length < 3) {
      newErrors.nombre = 'El nombre debe tener al menos 3 caracteres';
    } else if (normalizedData.nombre.length > 255) {
      newErrors.nombre = 'El nombre no puede exceder 255 caracteres';
    }
    
    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!normalizedData.email) {
      newErrors.email = 'El correo electrónico es obligatorio';
    } else if (!emailRegex.test(normalizedData.email)) {
      newErrors.email = 'El correo electrónico no es válido';
    } else if (normalizedData.email.length > 255) {
      newErrors.email = 'El correo electrónico no puede exceder 255 caracteres';
    }
    
    // Validar tipo de consulta
    if (!normalizedData.tipoConsulta) {
      newErrors.tipoConsulta = 'Debes seleccionar un tipo de consulta';
    }
    
    // Validar mensaje
    if (!normalizedData.mensaje) {
      newErrors.mensaje = 'El mensaje es obligatorio';
    } else if (normalizedData.mensaje.length < 10) {
      newErrors.mensaje = 'El mensaje debe tener al menos 10 caracteres';
    } else if (normalizedData.mensaje.length > 2000) {
      newErrors.mensaje = 'El mensaje no puede exceder 2000 caracteres';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      showToast('error', 'Por favor, corrige los errores antes de enviar');
      return;
    }

    setIsSubmitting(true);

    try {
        // Enviar normalizedData (ya está normalizado arriba)
        const response = await enviarFormularioContacto(normalizedData);
        
        if (response.success) {
            showToast('success', '¡Consulta enviada con éxito! Te responderemos pronto.');
            setFormData({
                nombre: '',
                email: '',
                tipoConsulta: '',
                mensaje: '',
                prueba_spam: ''
            });
            setErrors({});
        } else {
            showToast('error', response.message || 'Hubo un error al enviar el mensaje. Inténtalo más tarde.');
        }
    } catch (error) {
        console.error("Error envío: ", error);
        
        let errorMessage = 'Hubo un error al enviar el mensaje. Inténtalo más tarde.';
        
        if (error.statusCode === 422) {
            errorMessage = 'Por favor, verifica que los campos estén correctamente rellenos antes de continuar.';
        } else if (error.statusCode >= 500) {
            errorMessage = 'Error del servidor. Nuestro equipo ha sido notificado. Por favor, inténtalo más tarde.';
        } else if (error.message) {
            errorMessage = error.message;
        }
        
        showToast('error', errorMessage);
    } finally {
        setIsSubmitting(false);
    }
  };

  const toggleFaq = (index) => {
    setFaqAbierto(faqAbierto === index ? null : index);
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
      {/* Encabezado */}
      <section className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm border border-purple-200 text-purple-700 text-sm font-semibold mb-8 shadow-lg hover:shadow-xl transition-all duration-300 animate-float">
            <MessageSquare className="h-4 w-4" />
            ¿Necesitas ayuda?
          </div>
          
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold mb-6 leading-tight">
            <span className="bg-linear-to-r from-purple-600 via-purple-700 to-green-600 bg-clip-text text-transparent animate-gradientShift">
              Estamos aquí para ti
            </span>
          </h1>
          
          <p className="text-xl text-gray-600 leading-relaxed" id="contact-form">
            ¿Tienes dudas sobre tu futuro académico o profesional? 
            <span className="font-bold text-purple-700"> Nuestros orientadores especializados</span> están listos para guiarte.
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 mb-16">
          
          {/* Formulario de contacto */}
          <div className="group h-full">
            <div className="relative overflow-hidden rounded-2xl bg-white/80 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-500 border-2 border-white hover:border-purple-200 h-full flex flex-col">
              {/* Borde superior */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-linear-to-r from-purple-500 to-purple-600"></div>

              <div className="p-8 md:p-10 flex-1">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-purple-100 to-purple-200 flex items-center justify-center">
                    <Send className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Envíanos tu consulta</h2>
                    <p className="text-sm text-gray-600">Responderemos en menos de 24 horas</p>
                  </div>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="nombre" className="block text-sm font-semibold text-gray-700 mb-2">
                      Nombre completo *
                    </label>
                    <input
                      id="nombre"
                      name="nombre"
                      type="text"
                      value={formData.nombre}
                      onChange={handleInputChange}
                      placeholder="Tu nombre y apellidos"
                      className={`w-full px-4 py-3 border ${
                        errors.nombre ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-purple-500 focus:border-purple-500'
                      } rounded-xl focus:outline-none focus:ring-2 transition-all`}
                    />
                    {errors.nombre && (
                      <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.nombre}
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                      Correo electrónico *
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="tu@email.com"
                      className={`w-full px-4 py-3 border ${
                        errors.email ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-purple-500 focus:border-purple-500'
                      } rounded-xl focus:outline-none focus:ring-2 transition-all`}
                    />
                    {errors.email && (
                      <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.email}
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="tipoConsulta" className="block text-sm font-semibold text-gray-700 mb-2">
                      Tipo de consulta *
                    </label>
                    <div className="relative">
                      <select
                        id="tipoConsulta"
                        name="tipoConsulta"
                        value={formData.tipoConsulta}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 border ${
                          errors.tipoConsulta ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-purple-500 focus:border-purple-500'
                        } rounded-xl focus:outline-none focus:ring-2 bg-white appearance-none transition-all`}
                      >
                        {tiposConsulta.map((tipo) => (
                          <option key={tipo.value} value={tipo.value}>
                            {tipo.label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                    </div>
                    {errors.tipoConsulta && (
                      <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.tipoConsulta}
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="mensaje" className="block text-sm font-semibold text-gray-700 mb-2">
                      Mensaje *
                    </label>
                    <textarea
                      id="mensaje"
                      name="mensaje"
                      rows={5}
                      value={formData.mensaje}
                      onChange={handleInputChange}
                      placeholder="Cuéntanos en detalle tu consulta o situación..."
                      className={`w-full px-4 py-3 border ${
                        errors.mensaje ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-purple-500 focus:border-purple-500'
                      } rounded-xl focus:outline-none focus:ring-2 resize-vertical min-h-[120px] transition-all`}
                    />
                    {errors.mensaje && (
                      <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.mensaje}
                      </p>
                    )}
                  </div>

                  {/* CAMPO TRAMPA */}
                  <div className="opacity-0 absolute top-0 -left-[9999px] -z-50 w-0 h-0 overflow-hidden">
                        <label htmlFor="prueba_spam">No rellenes esto</label>
                        <input
                            type='text'
                            name='prueba_spam'
                            id='prueba_spam'
                            value={formData.prueba_spam} 
                            onChange={handleInputChange}
                            tabIndex='-1'
                            autoComplete='off'
                        />
                </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <Shield className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                      <div className="text-sm text-blue-800">
                        <p className="font-semibold mb-1">Protegemos tu privacidad</p>
                        <p>Tus datos están seguros y solo los usaremos para responder a tu consulta.</p>
                      </div>
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-linear-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer"
                  >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Enviando...
                        </>
                    ) : (
                        <>
                            <Send className="h-4 w-4" />
                            Enviar consulta
                        </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* Información de contacto directo */}
          <div className="space-y-6 h-full flex flex-col">
            
            {/* Contacto directo */}
            <div className="group relative overflow-hidden rounded-2xl bg-linear-to-br from-purple-50 to-green-50 border-2 border-purple-200 shadow-lg hover:shadow-xl transition-all duration-300 flex-1">
              {/* Borde superior */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-linear-to-r from-purple-500 to-green-600"></div>

              <div className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-purple-100 flex items-center justify-center">
                    <Users className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Contacto directo</h3>
                    <p className="text-sm text-gray-600">Canales de comunicación oficiales</p>
                  </div>
                </div>
              
                <div className="space-y-4">
                  <a href="mailto:info.vocaccion@gmail.com" className="flex items-center gap-4 p-4 bg-white rounded-xl hover:shadow-lg transition-all duration-300 hover:scale-105 group/link">
                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center shrink-0 group-hover/link:scale-110 transition-transform">
                      <Mail className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Correo oficial</p>
                      <p className="text-sm text-purple-600 hover:underline">info.vocaccion@gmail.com</p>
                    </div>
                  </a>

                  <a href="tel:+34900123456" className="flex items-center gap-4 p-4 bg-white rounded-xl hover:shadow-lg transition-all duration-300 hover:scale-105 group/link">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center shrink-0 group-hover/link:scale-110 transition-transform">
                      <Phone className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Teléfono</p>
                      <p className="text-sm text-green-600 hover:underline">+34 900 123 456</p>
                    </div>
                  </a>

                  <div className="flex items-center gap-4 p-4 bg-white rounded-xl">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                      <Clock className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Horario</p>
                      <p className="text-xs text-gray-600">Lun-Vie: 9:00-18:00 | Sab: 10:00-14:00</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 p-4 bg-white rounded-xl">
                    <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center shrink-0">
                      <MapPin className="h-5 w-5 text-pink-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Oficina</p>
                      <p className="text-xs text-gray-600">Calle Ejemplo 123, 28001 Madrid</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Redes sociales */}
            <div className="relative overflow-hidden rounded-2xl bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-white hover:border-purple-200">
              {/* Borde superior */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-linear-to-r from-blue-500 to-purple-600"></div>

              <div className="p-8 md:p-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center">
                    <Sparkles className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Síguenos</h3>
                    <p className="text-sm text-gray-600">Mantente actualizado</p>
                  </div>
                </div>
              
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { name: 'Facebook', handle: '@VocAccion', icon: Facebook, color: 'from-blue-500 to-blue-600' },
                    { name: 'X', handle: '@VocAccion_es', icon: X, color: 'from-gray-800 to-black' },
                    { name: 'LinkedIn', handle: 'VocAcción', icon: Linkedin, color: 'from-blue-700 to-blue-800' },
                    { name: 'Instagram', handle: '@vocaccion.es', icon: Instagram, color: 'from-purple-600 to-pink-600' }
                  ].map((social, idx) => (
                    <a 
                      key={idx}
                      href="#" 
                      className="flex items-center gap-2 p-3 border border-gray-200 rounded-xl hover:shadow-lg transition-all duration-300 hover:scale-105 group/social"
                    >
                      <div className={`w-8 h-8 bg-linear-to-r ${social.color} rounded flex items-center justify-center shrink-0 group-hover/social:scale-110 transition-transform`}>
                        <social.icon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{social.name}</p>
                        <p className="text-xs text-gray-500">{social.handle}</p>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sección de preguntas frecuentes */}
        <section id="faq" className="mb-16">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-100 text-green-700 text-sm font-semibold mb-6">
              <Zap className="h-4 w-4" />
              Preguntas frecuentes
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 leading-tight">
              <span className="bg-linear-to-r from-purple-600 to-green-600 bg-clip-text text-transparent">
                Respuestas a tus dudas
              </span>
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Resolvemos las dudas más comunes sobre VocAcción y orientación vocacional.
            </p>
          </div>

          <div className="max-w-4xl mx-auto space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="group relative overflow-hidden rounded-2xl bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-white hover:border-purple-200">
                {/* Borde superior */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-purple-500 to-green-600 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>

                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full p-6 text-left flex items-center justify-between hover:bg-purple-50/50 transition-colors"
                >
                  <h3 className="text-lg font-bold text-gray-900 pr-4">
                    {faq.pregunta}
                  </h3>
                  {faqAbierto === index ? (
                    <ChevronUp className="h-6 w-6 text-purple-500 shrink-0 transform transition-transform duration-300" />
                  ) : (
                    <ChevronDown className="h-6 w-6 text-gray-400 shrink-0 group-hover:text-purple-400 transition-colors duration-300" />
                  )}
                </button>
                
                {faqAbierto === index && (
                  <div className="px-6 pb-6 border-t border-gray-100 animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-start gap-4">
                      <CheckCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                      <p className="text-gray-700 leading-relaxed">
                        {faq.respuesta}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="text-center mt-8">
            <p className="text-gray-600 mb-6">
              ¿No encuentras respuesta a tu pregunta?
            </p>
            <a 
              href="#contact-form" 
              className="inline-flex items-center gap-2 px-8 py-3 bg-linear-to-r from-purple-500 to-green-500 hover:from-purple-600 hover:to-green-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group"
            >
              <MessageSquare className="h-5 w-5" />
              Contacta con nosotros
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </a>
          </div>
        </section>
      </div>
      </div>
    </main>
  );
};

export default Contacto;