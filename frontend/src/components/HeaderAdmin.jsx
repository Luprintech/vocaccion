/**
 * HEADER ADMIN - Componente de navegación para administradores
 * 
 * Header específico para el panel de administración de VocAcción.
 * Mantiene la misma estructura que Header.jsx pero con:
 * - Paleta de colores: Slate/Cyan (azul oscuro y cian)
 * - Navegación específica para admin: Dashboard, Usuarios, Orientadores, Roles, Estadísticas
 * - Perfil de usuario con logout
 * 
 * @component
 */

import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContextFixed";
import { Lightbulb, Sparkles, LogOut, ChevronDown, User, Home } from "lucide-react";
import { API_URL } from "../api";

export default function HeaderAdmin() {
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

  // Enlaces de navegación del admin
  const navLinks = [
    { to: '/admin/dashboard', label: 'Dashboard' },
    { to: '/admin/usuarios', label: 'Usuarios' },
    { to: '/admin/orientadores', label: 'Orientadores' },
    { to: '/admin/estadisticas', label: 'Estadísticas' },
    { to: '/admin/testimonios', label: 'Testimonios' },
  ];

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-50">
      <nav className="container mx-auto px-4 py-3">
        {/* BARRA PRINCIPAL */}
        <div className="flex items-center justify-between">

          {/* LOGO ADMIN */}
          <Link
            to="/admin/dashboard"
            className="flex items-center gap-2 group shrink-0"
            onClick={closeMenu}
          >
            {/* Icono con gradiente slate/cyan */}
            <div className="relative">
              {/* Resplandor de fondo */}
              <div className="absolute inset-0 bg-linear-to-br from-slate-400 to-cyan-400 rounded-full blur-md opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>

            {/* Contenedor del icono */}
            <div className="relative bg-linear-to-br from-slate-600 to-cyan-500 p-2 rounded-lg group-hover:scale-110 transition-transform duration-300">
                <Lightbulb className="w-6 h-6 text-white" strokeWidth={2.5} />
            </div>

            {/* Partícula brillante animada */}
              <Sparkles className="absolute -top-1 -right-1 w-4 h-4 text-cyan-400 animate-pulse opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>

            {/* Texto del logo */}
            <div className="flex flex-col">
              <span className="text-2xl font-extrabold bg-linear-to-r from-slate-700 to-cyan-600 bg-clip-text text-transparent">
                VocAcción
              </span>
              <span className="text-[10px] font-medium text-slate-500 -mt-1 tracking-wide">
                Panel de Administración
              </span>
            </div>
          </Link>

          {/* NAVEGACIÓN DESKTOP */}
          <div className="hidden md:flex items-center space-x-6 flex-1 justify-center">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="relative text-gray-600 hover:text-cyan-600 transition-colors font-semibold group"
              >
                {link.label}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-linear-to-r from-slate-600 to-cyan-500 group-hover:w-full transition-all duration-300"></span>
              </Link>
            ))}
          </div>

          {/* PERFIL USUARIO - Desktop */}
          <div className="hidden md:flex items-center gap-3 shrink-0">
            {/* Menú de perfil */}
            <div className="relative" ref={profileMenuRef}>
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <div className="text-right">
                  <p className="text-sm font-semibold text-slate-800">{user?.nombre || 'Admin'}</p>
                  <p className="text-xs text-slate-500">Administrador</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-linear-to-br from-slate-600 to-cyan-500 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 text-white" />
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform shrink-0 ${isProfileOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown del perfil */}
              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-100 py-2 z-50">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="text-sm font-semibold text-slate-800">{user?.nombre}</p>
                    <p className="text-xs text-slate-500">{user?.email}</p>
                  </div>
                  <Link
                    to="/perfil"
                    className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                    onClick={() => setIsProfileOpen(false)}
                  >
                    <User className="w-4 h-4" />
                    Mi perfil
                  </Link>
                  <Link
                    to="/admin/dashboard"
                    className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                    onClick={() => setIsProfileOpen(false)}
                  >
                    <Home className="w-4 h-4" />
                    Dashboard
                  </Link>
                  <div className="border-t border-slate-100 mt-1 pt-1">
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
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
            className="md:hidden flex flex-col justify-center items-center w-8 h-8 space-y-1 cursor-pointer shrink-0"
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
                {navLinks.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className="text-gray-600 hover:text-cyan-600 hover:bg-cyan-50 transition-all font-semibold py-2 px-3 rounded-lg text-sm"
                    onClick={closeMenu}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>

              {/* COLUMNA DERECHA: Perfil y opciones */}
              <div className="flex flex-col space-y-1 border-l border-gray-100 pl-4">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 pl-2">Perfil</span>
                <Link
                  to="/perfil"
                  className="text-gray-600 hover:text-cyan-600 hover:bg-cyan-50 transition-all font-semibold py-2 px-3 rounded-lg text-sm flex items-center gap-2 cursor-pointer"
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
