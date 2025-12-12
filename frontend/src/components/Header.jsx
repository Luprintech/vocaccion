
import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContextFixed";
import { logoutUser } from "../api";
import { Lightbulb, Sparkles, Map, Calendar, MessageCircle } from "lucide-react";

export default function Header({ onToggleSidebar, showSidebar = false }) {
  // Estado para controlar si el menú móvil está abierto o cerrado
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Obtener roles del contexto de autenticación
  const { user, getPrimaryRole } = useAuth();

  // Usar el rol del contexto o el prop (para compatibilidad hacia atrás)
  const rol = getPrimaryRole() || "estudiante";

  // Función para alternar la apertura/cierre del menú móvil
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // Función para cerrar el menú (útil cuando se hace clic en un enlace)
  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  // Ref para detectar clicks fuera del menú móvil y cerrarlo
  const mobileMenuRef = useRef(null);
  const hamburgerRef = useRef(null);

  useEffect(() => {
    function handleOutsideClick(e) {
      // Si el menú está abierto y el clic no es en el menú ni en el botón hamburguesa, cerrar
      if (isMenuOpen && mobileMenuRef.current && hamburgerRef.current) {
        const isClickOnMenu = mobileMenuRef.current.contains(e.target);
        const isClickOnHamburger = hamburgerRef.current.contains(e.target);
        
        if (!isClickOnMenu && !isClickOnHamburger) {
          setIsMenuOpen(false);
        }
      }
    }

    function handleEscape(e) {
      if (e.key === 'Escape' && isMenuOpen) setIsMenuOpen(false);
    }

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isMenuOpen]);

  return (
    // Header fijo en la parte superior con sombra y borde
    <header className="bg-white shadow-sm border-b sticky top-0 z-50">
      <nav className="container mx-auto px-4 py-3">

        {/* BARRA PRINCIPAL DEL HEADER */}
        <div className="flex items-center justify-between">

          {/* LOGO - Lado izquierdo con animación */}
          <Link
            to={rol === "orientador" ? "/orientador/dashboard" : "/"}
            className="flex items-center gap-2 group"
            onClick={closeMenu}
          >
            {/* Icono de bombilla con gradiente y animación */}
            <div className="relative">
              {/* Resplandor de fondo */}
              <div className="absolute inset-0 bg-linear-to-br from-purple-400 to-green-400 rounded-full blur-md opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>

              {/* Contenedor del icono */}
              <div className="relative bg-linear-to-br from-purple-500 to-green-500 p-2 rounded-lg group-hover:scale-110 transition-transform duration-300">
                <Lightbulb className="w-6 h-6 text-white" strokeWidth={2.5} />
              </div>

              {/* Partícula brillante animada */}
              <Sparkles className="absolute -top-1 -right-1 w-4 h-4 text-yellow-400 animate-pulse opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>

            {/* Texto del logo */}
            <div className="flex flex-col">
              <span className="text-2xl font-extrabold bg-linear-to-r from-purple-600 to-green-600 bg-clip-text text-transparent">
                VocAcción
              </span>
              <span className="text-[10px] font-medium text-gray-500 -mt-1 tracking-wide">
                Tu futuro profesional
              </span>
            </div>
          </Link>

          {/* MENÚ DE NAVEGACIÓN - Centro (solo visible en desktop) */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              to={rol === "orientador" ? "/orientador/dashboard" : "/"}
              className="relative text-gray-600 hover:text-purple-600 transition-colors font-semibold group"
            >
              Inicio
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-linear-to-r from-purple-600 to-green-600 group-hover:w-full transition-all duration-300"></span>
            </Link>
            <Link
              to="/servicios"
              className="relative text-gray-600 hover:text-purple-600 transition-colors font-semibold group"
            >
              Servicios
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-linear-to-r from-purple-600 to-green-600 group-hover:w-full transition-all duration-300"></span>
            </Link>
            <Link
              to="/planes"
              className="relative text-gray-600 hover:text-purple-600 transition-colors font-semibold group"
            >
              Planes
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-linear-to-r from-purple-600 to-green-600 group-hover:w-full transition-all duration-300"></span>
            </Link>
            <Link
              to="/recursos"
              className="relative text-gray-600 hover:text-purple-600 transition-colors font-semibold group"
            >
              Recursos
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-linear-to-r from-purple-600 to-green-600 group-hover:w-full transition-all duration-300"></span>
            </Link>
            <Link
              to="/contacto"
              className="relative text-gray-600 hover:text-purple-600 transition-colors font-semibold group"
            >
              Contacto
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-linear-to-r from-purple-600 to-green-600 group-hover:w-full transition-all duration-300"></span>
            </Link>
          </div>

          {/* BOTONES DE AUTENTICACIÓN - Lado derecho (solo desktop) */}
          <div className="flex items-center gap-3">
            {/* Botón de sidebar para móvil */}
            {showSidebar && (
              <button
                onClick={onToggleSidebar}
                className="lg:hidden p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                aria-label="Abrir menú lateral"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            )}

            <AuthButtonsDesktop />

            {/* BOTÓN HAMBURGUESA - Solo visible en móvil */}
            <button
              ref={hamburgerRef}
              onClick={toggleMenu}
              className="md:hidden flex flex-col justify-center items-center w-8 h-8 space-y-1 cursor-pointer"
              aria-label="Abrir menú"
            >
              {/* Las 3 líneas del menú hamburguesa con animación */}
              <span className={`block w-6 h-0.5 bg-gray-600 transition-transform duration-300 ${isMenuOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
              <span className={`block w-6 h-0.5 bg-gray-600 transition-opacity duration-300 ${isMenuOpen ? 'opacity-0' : ''}`}></span>
              <span className={`block w-6 h-0.5 bg-gray-600 transition-transform duration-300 ${isMenuOpen ? '-rotate-45 -translate-y-2' : ''}`}></span>
            </button>
          </div>
        </div>

        {/* MENÚ DESPLEGABLE MÓVIL */}
        {/* Se muestra/oculta con animación según el estado isMenuOpen */}
        {/* MENÚ DESPLEGABLE MÓVIL */}
        <div ref={mobileMenuRef} className={`md:hidden transition-all duration-300 ease-in-out ${isMenuOpen ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
          <div className="pt-4 pb-4 px-4 border-t border-gray-100 mt-4 bg-white">
            
            {/* CREAMOS UNA CUADRÍCULA DE 2 COLUMNAS */}
            <div className="grid grid-cols-2 gap-4">
              
              {/* COLUMNA IZQUIERDA: Menú Principal */}
              <div className="flex flex-col space-y-1">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 pl-2">Menú</span>
                <Link
                  to="/"
                  className="text-gray-600 hover:text-purple-600 hover:bg-purple-50 transition-all font-semibold py-2 px-3 rounded-lg text-sm"
                  onClick={closeMenu}
                >
                  Inicio
                </Link>
                <Link
                  to="/servicios"
                  className="text-gray-600 hover:text-purple-600 hover:bg-purple-50 transition-all font-semibold py-2 px-3 rounded-lg text-sm"
                  onClick={closeMenu}
                >
                  Servicios
                </Link>
                <Link
                  to="/planes"
                  className="text-gray-600 hover:text-purple-600 hover:bg-purple-50 transition-all font-semibold py-2 px-3 rounded-lg text-sm"
                  onClick={closeMenu}
                >
                  Planes
                </Link>
                <Link
                  to="/recursos"
                  className="text-gray-600 hover:text-purple-600 hover:bg-purple-50 transition-all font-semibold py-2 px-3 rounded-lg text-sm"
                  onClick={closeMenu}
                >
                  Recursos
                </Link>
                <Link
                  to="/contacto"
                  className="text-gray-600 hover:text-purple-600 hover:bg-purple-50 transition-all font-semibold py-2 px-3 rounded-lg text-sm"
                  onClick={closeMenu}
                >
                  Contacto
                </Link>
              </div>

              {/* COLUMNA DERECHA: Opciones de Usuario */}
              <div className="flex flex-col space-y-1 border-l border-gray-100 pl-4">
                <AuthButtonsMobile closeMenu={closeMenu} />
              </div>

            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}

// Botones de autenticación para desktop (muestran usuario si está logueado)
function AuthButtonsDesktop() {
  const { user, logout, token } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const menuRef = useRef(null);
  const [profileData, setProfileData] = useState(null);
  const [esProPlus, setEsProPlus] = useState(false);
  const [esPro, setEsPro] = useState(false); // Estado para detectar si es Pro o superior
  const [unreadCount, setUnreadCount] = useState(0);

  const role = (user && user.roles && user.roles.length > 0) ? user.roles[0].nombre : (typeof window !== 'undefined' ? localStorage.getItem('rol') : null)

  // Cargar datos del perfil (nombre e imagen) cuando el usuario está autenticado
  useEffect(() => {
    const fetchProfileData = async () => {
      if (!user || !token) return;

      try {
        const response = await fetch('http://localhost:8000/api/profile', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          }
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            setProfileData({
              nombre: result.data.nombre,
              profile_image: result.profile_image
            });
          }
        }

        // Verificar si es Pro Plus (solo para estudiantes)
        if (role === 'estudiante') {
          const subResponse = await fetch('http://localhost:8000/api/estudiante/mi-suscripcion', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/json',
            }
          });
          if (subResponse.ok) {
            const subResult = await subResponse.json();
            const tipoPlan = subResult.data?.tipo_plan || '';
            const isProPlus = tipoPlan === 'pro_plus' || tipoPlan === 'Pro Plus';
            const isPro = tipoPlan === 'pro' || tipoPlan === 'Pro' || isProPlus;

            setEsProPlus(isProPlus);
            setEsPro(isPro);
          }
        }
      } catch (error) {
        // Error silencioso
      }
    };

    fetchProfileData();
  }, [user, token, role]);

  // Polling para mensajes sin leer (solo Pro Plus)
  useEffect(() => {
    let interval;
    if (esProPlus && token) {
      const fetchUnread = async () => {
        try {
          const res = await fetch('http://localhost:8000/api/estudiante/mensajes/conteo', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/json',
            }
          });
          if (res.ok) {
            const data = await res.json();
            if (data.success) {
              setUnreadCount(data.count);
            }
          }
        } catch (e) {
          // Silent error
        }
      };
      
      fetchUnread();
      interval = setInterval(fetchUnread, 10000); // Check every 10s
    }
    return () => clearInterval(interval);
  }, [esProPlus, token]);

  const handleLogout = async () => {
    try {
      await logoutUser()
    } catch {
      // ignore
    }
    logout()
    navigate('/')
  }

  useEffect(() => {
    function handleDocClick(e) {
      if (open && menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    }

    function handleEscape(e) {
      if (e.key === 'Escape' && open) setOpen(false);
    }

    document.addEventListener('mousedown', handleDocClick);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleDocClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  if (user) {
    // URL de la imagen de perfil desde el backend (ya viene con la URL completa)
    const profileImageUrl = profileData?.profile_image || null;

    // Nombre a mostrar: prioridad al nombre del perfil, luego email sin dominio
    const displayName = profileData?.nombre || user.email.split('@')[0];

    return (
      <div ref={menuRef} className="hidden md:flex items-center space-x-3 relative">
        {/* Avatar circular con imagen de perfil */}
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-3 hover:opacity-80 transition-all duration-300 group cursor-pointer"
          aria-label="Menú de opciones"
        >
          {/* Imagen de perfil o placeholder */}
          {profileImageUrl ? (
            <img
              src={profileImageUrl}
              alt="Perfil"
              className="w-9 h-9 rounded-full object-cover border-2 border-purple-500 shadow-md group-hover:shadow-lg group-hover:scale-105 transition-all duration-300"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-linear-to-br from-purple-500 to-green-500 flex items-center justify-center text-white font-bold text-sm border-2 border-purple-500 shadow-md group-hover:shadow-lg group-hover:scale-105 transition-all duration-300">
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}

          {/* Nombre del usuario */}
          <span className="text-gray-700 font-semibold">
            Hola, <strong className="text-purple-600">{displayName}</strong>
          </span>

          {/* Indicador de menú */}
          <svg className="w-4 h-4 text-gray-500 group-hover:text-purple-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        <div className="relative">
          {open && (
            <div className="absolute right-0 top-full mt-8 bg-white border border-gray-200 rounded-md shadow-lg z-50 min-w-[220px]">
              <ul className="list-none p-2 m-0">
                {/* ORDEN REORGANIZADO: Perfil siempre primero */}
                <li><Link to="/perfil" className="block px-3 py-2 text-gray-600 hover:text-purple-600 transition-colors font-semibold">Perfil</Link></li>

                {/* Opciones específicas por rol */}
                {role === 'estudiante' && (
                  <>
                    <li><Link to="/mi-suscripcion" className="block px-3 py-2 text-gray-600 hover:text-purple-600 transition-colors font-semibold">Mi Suscripción</Link></li>
                    <li><Link to="/testintro" className="block px-3 py-2 text-gray-600 hover:text-purple-600 transition-colors font-semibold">Realizar Test</Link></li>
                    <li><Link to="/resultados" className="block px-3 py-2 text-gray-600 hover:text-purple-600 transition-colors font-semibold">Mis Resultados</Link></li>
                    <li><Link to="/mi-profesion" className="block px-3 py-2 text-gray-600 hover:text-purple-600 transition-colors font-semibold">Mi Profesión</Link></li>
                    {esPro && (
                      <li><Link to="/itinerario" className="flex items-center gap-2 px-3 py-2 text-green-600 hover:text-green-700 transition-colors font-semibold"><Map className="w-4 h-4" /> Mi Itinerario <span className="ml-auto text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">Pro</span></Link></li>
                    )}
                    {esProPlus && (
                      <>
                        <li>
                          <Link to="/estudiante/reservas" className="flex items-center gap-2 px-3 py-2 text-purple-600 hover:text-purple-700 transition-colors font-semibold">
                            <Calendar className="w-4 h-4" /> Mis Reservas
                            <span className="ml-auto text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full">Pro+</span>
                          </Link>
                        </li>
                        <li>
                          <Link to="/estudiante/mensajes" className="flex items-center gap-2 px-3 py-2 text-purple-600 hover:text-purple-700 transition-colors font-semibold">
                            <div className="relative">
                              <MessageCircle className="w-4 h-4" />
                              {unreadCount > 0 && (
                                <span className="absolute -top-1 -right-1 h-2.5 w-2.5">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                                </span>
                              )}
                            </div>
                            Mis Mensajes
                            <span className="ml-auto text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full">Pro+</span>
                          </Link>
                        </li>
                      </>
                    )}
                  </>
                )}

                {role === 'orientador' && (
                  <>
                    <li><Link to="/orientador/dashboard" className="block px-3 py-2 text-gray-600 hover:text-purple-600 transition-colors font-semibold">Dashboard</Link></li>
                    <li><Link to="/orientador/estudiantes" className="block px-3 py-2 text-gray-600 hover:text-purple-600 transition-colors font-semibold">Mis Estudiantes</Link></li>
                    <li><Link to="/orientador/analisis" className="block px-3 py-2 text-gray-600 hover:text-purple-600 transition-colors font-semibold">Análisis</Link></li>
                    <li><Link to="/orientador/chat" className="block px-3 py-2 text-gray-600 hover:text-purple-600 transition-colors font-semibold">Chat</Link></li>
                    <li><Link to="/orientador/recursos" className="block px-3 py-2 text-gray-600 hover:text-purple-600 transition-colors font-semibold">Recursos</Link></li>
                  </>
                )}

                {(role === 'admin' || role === 'administrador') && (
                  <>
                    <li><Link to="/admin/dashboard" className="block px-3 py-2 text-gray-600 hover:text-purple-600 transition-colors font-semibold">Dashboard</Link></li>
                    <li><Link to="/admin/usuarios" className="block px-3 py-2 text-gray-600 hover:text-purple-600 transition-colors font-semibold">Usuarios</Link></li>
                    <li><Link to="/admin/orientadores" className="block px-3 py-2 text-gray-600 hover:text-purple-600 transition-colors font-semibold">Orientadores</Link></li>
                    <li><Link to="/admin/estadisticas" className="block px-3 py-2 text-gray-600 hover:text-purple-600 transition-colors font-semibold">Estadísticas</Link></li>
                  </>
                )}

                {/* Soporte siempre visible para todos */}
                <li><Link to="/contacto" className="block px-3 py-2 text-gray-600 hover:text-purple-600 transition-colors font-semibold">Soporte / Ayuda</Link></li>
                
                {/* Dejar Reseña */}
                <li><Link to="/testimonios" className="block px-3 py-2 text-gray-600 hover:text-purple-600 transition-colors font-semibold">Dejar Reseña</Link></li>

                {/* Separador antes del logout */}
                <li><div className="my-1 border-t border-gray-100" /></li>

                <li>
                  <button onClick={handleLogout} className="w-full text-left px-3 py-2 font-bold text-black rounded hover:bg-linear-to-r hover:from-purple-600 hover:to-green-600 hover:text-white transition-colors cursor-pointer">Cerrar sesión</button>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="hidden md:flex items-center space-x-4">
      <Link
        to="/login"
        className="text-gray-600 hover:text-purple-600 transition-colors font-semibold px-4 py-2 rounded-lg hover:bg-purple-50"
      >
        Login
      </Link>
      <Link
        to="/register"
        className="relative overflow-hidden bg-linear-to-r from-purple-600 to-green-600 text-white px-6 py-2.5 rounded-lg font-semibold shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-300 group"
      >
        <span className="relative z-10">Registro</span>
        {/* Efecto de brillo al hover */}
        <div className="absolute inset-0 bg-linear-to-r from-purple-500 to-green-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      </Link>
    </div>
  )
}

function AuthButtonsMobile({ closeMenu }) {
  const { user, logout, token } = useAuth()
  const navigate = useNavigate()
  // Ya no necesitamos cargar profileData para la imagen/nombre si no los vamos a mostrar,
  // pero mantenemos la lógica de la suscripción ProPlus.
  const [esProPlus, setEsProPlus] = useState(false);
  const [esPro, setEsPro] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const role = (user && user.roles && user.roles.length > 0) ? user.roles[0].nombre : (typeof window !== 'undefined' ? localStorage.getItem('rol') : null)

  // Estilo de los enlaces (alineados a la derecha y compactos)
  const userLinkClass = "block text-gray-500 hover:text-purple-600 transition-colors font-medium py-2 px-0 text-sm text-right";

  useEffect(() => {
    const fetchSubscription = async () => {
      if (!user || !token || role !== 'estudiante') return;
      try {
        const subResponse = await fetch('http://localhost:8000/api/estudiante/mi-suscripcion', {
          headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
        });
        if (subResponse.ok) {
          const subResult = await subResponse.json();
          const tipoPlan = subResult.data?.tipo_plan || '';
          const isProPlus = tipoPlan === 'pro_plus' || tipoPlan === 'Pro Plus';
          const isPro = tipoPlan === 'pro' || tipoPlan === 'Pro' || isProPlus;
          
          setEsProPlus(isProPlus);
          setEsPro(isPro);
        }
      } catch (error) {}
    };
    fetchSubscription();
  }, [user, token, role]);

  // Polling para mensajes sin leer en movil
  useEffect(() => {
    let interval;
    if (esProPlus && token) {
      const fetchUnread = async () => {
        try {
          const res = await fetch('http://localhost:8000/api/estudiante/mensajes/conteo', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/json',
            }
          });
          if (res.ok) {
            const data = await res.json();
            if (data.success) {
              setUnreadCount(data.count);
            }
          }
        } catch (e) {
          // Silent
        }
      };
      
      fetchUnread();
      interval = setInterval(fetchUnread, 10000);
    }
    return () => clearInterval(interval);
  }, [esProPlus, token]);

  const handleLogout = async () => {
    try { await logoutUser() } catch (err) { console.error(err) }
    logout()
    navigate('/')
    if (closeMenu) closeMenu()
  }

  if (user) {
    return (
      <>
        {/* LISTA DE ENLACES DIRECTA (Sin saludo ni avatar) */}
        {/* Agregamos 'pt-0' para asegurar que se alinee arriba con 'Inicio' */}
        
        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Mi Perfil</span>
        <Link to="/perfil" onClick={closeMenu} className={userLinkClass}>Mi Perfil</Link>

        {role === 'estudiante' && (
          <>
            <Link to="/mi-suscripcion" onClick={closeMenu} className={userLinkClass}>Suscripción</Link>
            <Link to="/testintro" onClick={closeMenu} className={userLinkClass}>Realizar Test</Link>
            <Link to="/resultados" onClick={closeMenu} className={userLinkClass}>Resultados</Link>
            <Link to="/mi-profesion" onClick={closeMenu} className={userLinkClass}>Profesión</Link>
            {esPro && (
              <Link to="/itinerario" onClick={closeMenu} className="flex items-center justify-end gap-2 text-green-600 hover:text-green-700 transition-colors font-medium py-2 px-0 text-sm">
                <Map className="w-4 h-4" /> Itinerario
              </Link>
            )}
            {esProPlus && (
              <>
                <Link to="/estudiante/reservas" onClick={closeMenu} className="flex items-center justify-end gap-2 text-purple-600 hover:text-purple-700 transition-colors font-medium py-2 px-0 text-sm">
                  <Calendar className="w-4 h-4" /> Mis Reservas
                </Link>
                <Link to="/estudiante/mensajes" onClick={closeMenu} className="flex items-center justify-end gap-2 text-purple-600 hover:text-purple-700 transition-colors font-medium py-2 px-0 text-sm">
                  <div className="relative">
                    <MessageCircle className="w-4 h-4" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                      </span>
                    )}
                  </div>
                  Mis Mensajes
                </Link>
              </>
            )}
          </>
        )}

        {role === 'orientador' && (
          <>
            <Link to="/orientador/dashboard" onClick={closeMenu} className={userLinkClass}>Dashboard</Link>
            <Link to="/orientador/estudiantes" onClick={closeMenu} className={userLinkClass}>Estudiantes</Link>
            <Link to="/orientador/analisis" onClick={closeMenu} className={userLinkClass}>Análisis</Link>
            <Link to="/orientador/chat" onClick={closeMenu} className={userLinkClass}>Chat</Link>
            <Link to="/orientador/recursos" onClick={closeMenu} className={userLinkClass}>Recursos</Link>
          </>
        )}

        {(role === 'admin' || role === 'administrador') && (
            <Link to="/admin/dashboard" onClick={closeMenu} className={userLinkClass}>Admin Panel</Link>
        )}

        {/* Soporte y Reseña - Disponibles para todos */}
        <Link to="/contacto" onClick={closeMenu} className={userLinkClass}>Soporte / Ayuda</Link>
        <Link to="/testimonios" onClick={closeMenu} className={userLinkClass}>Dejar Reseña</Link>

        {/* Separador y Cerrar sesión */}
        <div className="mt-2 border-t border-gray-100 pt-2">
            <button onClick={handleLogout} className="text-xs font-bold text-red-500 hover:text-red-600 w-full text-right cursor-pointer">
            Cerrar sesión
            </button>
        </div>
      </>
    )
  }

  // Vista para usuarios no logueados (Login/Registro)
  return (
    <div className="flex flex-col gap-2 mt-1">
      <Link to="/login" className="text-center text-gray-600 hover:text-purple-600 font-semibold text-sm py-2 border border-gray-200 rounded-lg" onClick={closeMenu}>
        Login
      </Link>
      <Link to="/register" className="text-center bg-purple-600 text-white font-semibold text-sm py-2 rounded-lg shadow-sm" onClick={closeMenu}>
        Registro
      </Link>
    </div>
  )
}