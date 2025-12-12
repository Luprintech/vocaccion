/**
 * HEADER ORIENTADOR - Componente de navegación para orientadores
 * 
 * Header específico para el panel de orientación de VocAcción.
 * Paleta de colores: Naranja/Amber (cálido y profesional)
 * 
 * Navegación: Dashboard, Mis Estudiantes, Análisis, Chat, Recursos
 * 
 * @component
 */

import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContextFixed";
import { Lightbulb, Sparkles, LogOut, ChevronDown, User, Home, Users, BarChart3, MessageCircle, BookOpen, Video } from "lucide-react";
import { API_URL } from "../api";

export default function HeaderOrientador() {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { user, logout, token } = useAuth();
  const mobileMenuRef = useRef(null);
  const hamburgerRef = useRef(null);
  const profileMenuRef = useRef(null);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);

  // Cerrar menú móvil al hacer click fuera
  useEffect(() => {
    function handleOutsideClick(e) {
      if (isMenuOpen && mobileMenuRef.current && hamburgerRef.current) {
        const isClickOnMenu = mobileMenuRef.current.contains(e.target);
        const isClickOnHamburger = hamburgerRef.current.contains(e.target);
        
        if (!isClickOnMenu && !isClickOnHamburger) {
          setIsMenuOpen(false);
        }
      }
      if (isProfileOpen && profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setIsProfileOpen(false);
      }
    }

    function handleEscape(e) {
      if (e.key === 'Escape') {
        setIsMenuOpen(false);
        setIsProfileOpen(false);
      }
    }

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isMenuOpen, isProfileOpen]);

  const handleLogout = async () => {
    try {
      await fetch(`${API_URL}/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
    } catch (err) {
      console.error('Error en logout:', err);
    } finally {
      logout();
      localStorage.clear();
      navigate('/login');
    }
  };

  // Enlaces de navegación del orientador
  const navLinks = [
    { to: '/orientador/dashboard', label: 'Dashboard', icon: Home },
    { to: '/orientador/estudiantes', label: 'Mis Estudiantes', icon: Users },
    { to: '/orientador/analisis', label: 'Análisis', icon: BarChart3 },
    { to: '/orientador/chat', label: 'Chat', icon: MessageCircle },
    { to: '/orientador/videollamada', label: 'Videollamada', icon: Video },
    { to: '/orientador/recursos', label: 'Recursos', icon: BookOpen },
  ];

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-50">
      <nav className="container mx-auto px-4 py-3">
        {/* BARRA PRINCIPAL */}
        <div className="flex items-center justify-between">

          {/* LOGO ORIENTADOR */}
          <Link
            to="/orientador/dashboard"
            className="flex items-center gap-2 group"
            onClick={closeMenu}
          >
            {/* Icono con gradiente naranja */}
            <div className="relative">
              {/* Resplandor de fondo */}
              <div className="absolute inset-0 bg-linear-to-br from-orange-400 to-amber-400 rounded-full blur-md opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>

              {/* Contenedor del icono */}
              <div className="relative bg-linear-to-br from-orange-500 to-amber-500 p-2 rounded-lg group-hover:scale-110 transition-transform duration-300">
                <Lightbulb className="w-6 h-6 text-white" strokeWidth={2.5} />
              </div>

              {/* Partícula brillante animada */}
              <Sparkles className="absolute -top-1 -right-1 w-4 h-4 text-amber-400 animate-pulse opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>

            {/* Texto del logo */}
            <div className="flex flex-col">
              <span className="text-2xl font-extrabold bg-linear-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                VocAcción
              </span>
              <span className="text-[10px] font-medium text-orange-500 -mt-1 tracking-wide">
                Panel de Orientación
              </span>
            </div>
          </Link>

          {/* NAVEGACIÓN DESKTOP */}
          <div className="hidden md:flex items-center space-x-6">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="relative text-gray-600 hover:text-orange-600 transition-colors font-semibold group"
              >
                {link.label}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-linear-to-r from-orange-500 to-amber-500 group-hover:w-full transition-all duration-300"></span>
              </Link>
            ))}
          </div>

          {/* PERFIL USUARIO - Desktop */}
          <div className="hidden md:flex items-center gap-3">
            {/* Menú de perfil */}
            <div className="relative" ref={profileMenuRef}>
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-orange-50 transition-colors cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full bg-linear-to-br from-orange-500 to-amber-500 flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-gray-800">{user?.nombre || 'Orientador'}</p>
                  <p className="text-xs text-orange-500">Orientador</p>
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown del perfil */}
              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-orange-100 py-2 z-50">
                  <div className="px-4 py-2 border-b border-orange-100">
                    <p className="text-sm font-semibold text-gray-800">{user?.nombre}</p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                  </div>
                  <Link
                    to="/perfil"
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-orange-50 transition-colors"
                    onClick={() => setIsProfileOpen(false)}
                  >
                    <User className="w-4 h-4" />
                    Mi perfil
                  </Link>
                  <Link
                    to="/orientador/dashboard"
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-orange-50 transition-colors"
                    onClick={() => setIsProfileOpen(false)}
                  >
                    <Home className="w-4 h-4" />
                    Dashboard
                  </Link>
                  <div className="border-t border-orange-100 mt-1 pt-1">
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      Cerrar sesión
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* BOTÓN HAMBURGUESA - Móvil */}
          <button
            ref={hamburgerRef}
            onClick={toggleMenu}
            className="md:hidden flex flex-col justify-center items-center w-8 h-8 space-y-1 cursor-pointer"
            aria-label="Abrir menú"
          >
            <span className={`block w-6 h-0.5 bg-gray-600 transition-transform duration-300 ${isMenuOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
            <span className={`block w-6 h-0.5 bg-gray-600 transition-opacity duration-300 ${isMenuOpen ? 'opacity-0' : ''}`}></span>
            <span className={`block w-6 h-0.5 bg-gray-600 transition-transform duration-300 ${isMenuOpen ? '-rotate-45 -translate-y-2' : ''}`}></span>
          </button>
        </div>

        {/* MENÚ MÓVIL */}
        <div 
          ref={mobileMenuRef} 
          className={`md:hidden transition-all duration-300 ease-in-out ${isMenuOpen ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}
        >
          <div className="pt-4 pb-4 px-4 border-t border-gray-100 mt-4 bg-white">
            
            {/* CUADRÍCULA DE 2 COLUMNAS */}
            <div className="grid grid-cols-2 gap-4">
              
              {/* COLUMNA IZQUIERDA: Navegación */}
              <div className="flex flex-col space-y-1">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 pl-2">Navegación</span>
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  return (
                    <Link
                      key={link.to}
                      to={link.to}
                      className="flex items-center gap-2 text-gray-600 hover:text-orange-600 hover:bg-orange-50 transition-all font-semibold py-2 px-3 rounded-lg text-sm"
                      onClick={closeMenu}
                    >
                      <Icon className="w-4 h-4" />
                      {link.label}
                    </Link>
                  );
                })}
              </div>

              {/* COLUMNA DERECHA: Perfil y opciones */}
              <div className="flex flex-col space-y-1 border-l border-gray-100 pl-4">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 pl-2">Perfil</span>
                <Link
                  to="/perfil"
                  className="text-gray-600 hover:text-orange-600 hover:bg-orange-50 transition-all font-semibold py-2 px-3 rounded-lg text-sm flex items-center gap-2"
                  onClick={closeMenu}
                >
                  <User className="w-4 h-4" />
                  Mi perfil
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    closeMenu();
                  }}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 transition-all font-semibold py-2 px-3 rounded-lg text-sm flex items-center gap-2 justify-start cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  Cerrar sesión
                </button>
              </div>

            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}
