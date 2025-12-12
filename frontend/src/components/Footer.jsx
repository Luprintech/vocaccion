// src/components/Footer.jsx
/**
 * FOOTER - Componente del pie de página
 * 
 * Footer moderno y completo que aparece en todas las páginas gracias al MainLayout.
 * Incluye enlaces importantes, redes sociales y copyright.
 * 
 * COLABORADORES: Aquí podéis añadir:
 * - Enlaces a redes sociales
 * - Información de contacto adicional
 * - Enlaces legales (Política de privacidad, etc.)
 * - Información del equipo de desarrollo
 */

import { Link } from "react-router-dom";
import { Lightbulb, Mail, MapPin, Phone, Facebook, Twitter, Instagram, Linkedin, Heart } from "lucide-react";

const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

export default function Footer() {
  return (
    <footer className="bg-linear-to-br from-gray-50 via-purple-50/30 to-green-50/30 border-t border-purple-100">
      <div className="container mx-auto px-4 py-12">
        
        {/* Sección principal del footer */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          
          {/* Columna 1: Logo y descripción */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="bg-linear-to-br from-purple-500 to-green-500 p-2 rounded-lg shadow-md">
                <Lightbulb className="w-5 h-5 text-white" strokeWidth={2.5} />
              </div>
              <span className="text-xl font-bold bg-linear-to-r from-purple-600 to-green-600 bg-clip-text text-transparent">
                VocAcción
              </span>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">
              Descubre tu vocación y construye tu futuro profesional con nuestras herramientas de orientación vocacional.
            </p>
            {/* Redes sociales */}
            <div className="flex gap-3">
              <a href="#" className="w-9 h-9 rounded-full bg-purple-100 hover:bg-purple-500 text-purple-600 hover:text-white flex items-center justify-center transition-all duration-300 transform hover:scale-110">
                <Facebook className="w-4 h-4" />
              </a>
              <a href="#" className="w-9 h-9 rounded-full bg-blue-100 hover:bg-blue-500 text-blue-600 hover:text-white flex items-center justify-center transition-all duration-300 transform hover:scale-110">
                <Twitter className="w-4 h-4" />
              </a>
              <a href="#" className="w-9 h-9 rounded-full bg-pink-100 hover:bg-pink-500 text-pink-600 hover:text-white flex items-center justify-center transition-all duration-300 transform hover:scale-110">
                <Instagram className="w-4 h-4" />
              </a>
              <a href="#" className="w-9 h-9 rounded-full bg-green-100 hover:bg-green-600 text-green-600 hover:text-white flex items-center justify-center transition-all duration-300 transform hover:scale-110">
                <Linkedin className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Columna 2: Enlaces rápidos */}
          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="w-1 h-6 bg-linear-to-b from-purple-500 to-purple-600 rounded-full"></span>
              Enlaces Rápidos
            </h3>
            <ul className="space-y-2.5">
              <li>
                <Link to="/" onClick={scrollToTop} className="text-gray-600 hover:text-purple-600 transition-colors text-sm flex items-center gap-2 group">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400 group-hover:scale-150 transition-transform"></span>
                  Inicio
                </Link>
              </li>
              <li>
                <Link to="/servicios" onClick={scrollToTop} className="text-gray-600 hover:text-purple-600 transition-colors text-sm flex items-center gap-2 group">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400 group-hover:scale-150 transition-transform"></span>
                  Servicios
                </Link>
              </li>
              <li>
                <Link to="/planes" onClick={scrollToTop} className="text-gray-600 hover:text-purple-600 transition-colors text-sm flex items-center gap-2 group">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400 group-hover:scale-150 transition-transform"></span>
                  Planes
                </Link>
              </li>
              <li>
                <Link to="/recursos" onClick={scrollToTop} className="text-gray-600 hover:text-purple-600 transition-colors text-sm flex items-center gap-2 group">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400 group-hover:scale-150 transition-transform"></span>
                  Recursos
                </Link>
              </li>
              <li>
                <Link to="/contacto" onClick={scrollToTop} className="text-gray-600 hover:text-purple-600 transition-colors text-sm flex items-center gap-2 group">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400 group-hover:scale-150 transition-transform"></span>
                  Contacto
                </Link>
              </li>
            </ul>
          </div>

          {/* Columna 3: Legal */}
          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="w-1 h-6 bg-linear-to-b from-green-500 to-green-600 rounded-full"></span>
              Legal
            </h3>
            <ul className="space-y-2.5">
              <li>
                <Link to="/legal/privacidad" onClick={scrollToTop} className="text-gray-600 hover:text-green-600 transition-colors text-sm flex items-center gap-2 group">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 group-hover:scale-150 transition-transform"></span>
                  Política de Privacidad
                </Link>
              </li>
              <li>
                <Link to="/legal/terminos" onClick={scrollToTop} className="text-gray-600 hover:text-green-600 transition-colors text-sm flex items-center gap-2 group">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 group-hover:scale-150 transition-transform"></span>
                  Términos de Servicio
                </Link>
              </li>
              <li>
                <Link to="/legal/cookies" onClick={scrollToTop} className="text-gray-600 hover:text-green-600 transition-colors text-sm flex items-center gap-2 group">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 group-hover:scale-150 transition-transform"></span>
                  Política de Cookies
                </Link>
              </li>
              <li>
                <Link to="/legal/aviso-legal" onClick={scrollToTop} className="text-gray-600 hover:text-green-600 transition-colors text-sm flex items-center gap-2 group">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 group-hover:scale-150 transition-transform"></span>
                  Aviso Legal
                </Link>
              </li>
            </ul>
          </div>

          {/* Columna 4: Contacto */}
          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="w-1 h-6 bg-linear-to-b from-purple-500 to-green-500 rounded-full"></span>
              Contacto
            </h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3 text-sm text-gray-600">
                <Mail className="w-4 h-4 mt-0.5 text-purple-500 shrink-0" />
                <a href="mailto:info@vocaccion.com" className="hover:text-purple-600 transition-colors">
                  info@vocaccion.com
                </a>
              </li>
              <li className="flex items-start gap-3 text-sm text-gray-600">
                <Phone className="w-4 h-4 mt-0.5 text-green-500 shrink-0" />
                <a href="tel:+34900123456" className="hover:text-green-600 transition-colors">
                  +34 900 123 456
                </a>
              </li>
              <li className="flex items-start gap-3 text-sm text-gray-600">
                <MapPin className="w-4 h-4 mt-0.5 text-purple-500 shrink-0" />
                <span>
                  Calle de la Orientación, 123<br />
                  28001 Madrid, España
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Separador decorativo */}
        <div className="relative mb-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-purple-200"></div>
          </div>
          <div className="relative flex justify-center">
            <span className="bg-linear-to-r from-purple-500 to-green-500 w-12 h-1 rounded-full"></span>
          </div>
        </div>

        {/* Copyright */}
        <div className="text-center">
          <p className="text-sm text-gray-600 flex items-center justify-center gap-2 flex-wrap">
            <span>© {new Date().getFullYear()} VocAcción. Todos los derechos reservados.</span>
            <span className="hidden sm:inline">•</span>
            <span className="flex items-center gap-1">
              Hecho con amor en España 
              <Heart className="w-4 h-4 animate-pulse" style={{
                fill: 'url(#spanishFlag)',
                stroke: 'url(#spanishFlag)'
              }} />
              <svg width="0" height="0" className="absolute">
                <defs>
                  <linearGradient id="spanishFlag" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#AA151B" />
                    <stop offset="25%" stopColor="#AA151B" />
                    <stop offset="25%" stopColor="#F1BF00" />
                    <stop offset="75%" stopColor="#F1BF00" />
                    <stop offset="75%" stopColor="#AA151B" />
                    <stop offset="100%" stopColor="#AA151B" />
                  </linearGradient>
                </defs>
              </svg>
            </span>
          </p>
        </div>
      </div>
    </footer>
  );
}
