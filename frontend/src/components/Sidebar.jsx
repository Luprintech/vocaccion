import React from "react";
import { Link } from 'react-router-dom';
// Puedes usar iconos de Heroicons, FontAwesome o SVGs propios
import { FaHome, FaClipboardList, FaChartBar, FaUserCircle, FaUsers } from "react-icons/fa";
import { useAuth } from "../context/AuthContextFixed";

const Sidebar = ({ rol: propRol }) => {
  // Obtener roles del contexto de autenticación
  const { user, getPrimaryRole } = useAuth();

  // Usar el rol del contexto o el prop (para compatibilidad hacia atrás)
  const rol = propRol || getPrimaryRole() || "estudiante";

  let links = [];
  if (rol === "estudiante") {
    links = [
      { label: "Inicio", path: "/welcome", icon: <FaHome /> },
      { label: "Perfil", path: "/perfil", icon: <FaUserCircle /> },
      { label: "Realizar Test", path: "/TestIntro", icon: <FaClipboardList /> },
      { label: "Mis Resultados", path: "/resultados", icon: <FaChartBar /> },
      { label: "Mi Profesión", path: "/mi-profesion", icon: <span>🌟</span> },
    ];
  } else if (rol === "orientador") {
    links = [
      { label: "Inicio", path: "/orientador/dashboard", icon: <FaHome /> },
      { label: "Mis Estudiantes", path: "/estudiantes", icon: <FaUsers /> },
      { label: "Aula Virtual", path: "/orientador/recursos", icon: <FaClipboardList /> },
      { label: "Videollamadas", path: "/orientador/videollamada", icon: <span>🎥</span> },
      { label: "Chat", path: "/chat", icon: <span>💬</span> },
    ];
  } else if (rol === "administrador") {
    links = [
      { label: "Dashboard", path: "/admin/dashboard", icon: <FaChartBar /> },
      { label: "Gestión de Usuarios", path: "/usuarios", icon: <FaUsers /> },
      { label: "Estadísticas", path: "/estadisticas", icon: <FaChartBar /> },
    ];
  }

  // Avatar y nombre de usuario (obtenerlo del contexto primero, luego localStorage)
  const nombre = user?.nombre || localStorage.getItem("nombre") || "Estudiante";

  return (
    // Aside kept in normal flow (not fixed) so footer is not overlapped.
    <aside className="w-60 shrink-0 h-full bg-linear-to-b from-emerald-50 to-green-50 shadow-lg border-r border-emerald-100 flex flex-col justify-between p-6 text-gray-800 z-10 overflow-y-auto">
      {/* Use sticky inside to keep the sidebar content visible while scrolling, but remain in document flow */}
      <div className="flex-1">
        <div className="sticky top-4">
          {/* User Profile Section */}
          <div className="flex items-center mb-6 pb-4 border-b border-emerald-200">
            <FaUserCircle size={36} className="mr-3 text-emerald-400" />
            <div>
              <div className="font-bold text-base text-gray-700 truncate">{nombre}</div>
              <div className="text-sm text-gray-500 capitalize">{rol}</div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="space-y-1 mt-4">
            {links.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className="flex items-center gap-3 px-3 py-2.5 text-gray-700 font-medium rounded-lg transition-all duration-200 hover:bg-emerald-100 hover:text-emerald-700 hover:shadow-sm group"
              >
                <span className="text-emerald-500 group-hover:text-emerald-600 transition-colors duration-200 shrink-0">
                  {link.icon}
                </span>
                <span className="select-none truncate">{link.label}</span>
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
