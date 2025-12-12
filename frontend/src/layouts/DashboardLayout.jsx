import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Menu, X, LogOut, Home } from 'lucide-react';

/**
 * DashboardLayout
 * 
 * Layout base para todos los dashboards.
 * Proporciona sidebar, header y estructura común.
 * 
 * Props:
 * - children: contenido del dashboard
 * - title: título del dashboard
 * - userRole: rol del usuario (estudiante, orientador, administrador)
 * 
 * @component
 */
function DashboardLayout({ children, title, userRole }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const getSidebarItems = () => {
    const baseItems = [
      { label: 'Inicio', href: '/', icon: '🏠' }
    ];

    switch (userRole) {
      case 'estudiante':
        return [
          ...baseItems,
          { label: 'Dashboard', href: '/estudiante/dashboard', icon: '📊' },
          { label: 'Test Vocacional', href: '/test', icon: '📝' },
          { label: 'Mis Resultados', href: '/resultados', icon: '📈' },
          { label: 'Mi Profesión', href: '/mi-profesion', icon: '💼' },
          { label: 'Perfil', href: '/perfil', icon: '👤' },
        ];
      case 'orientador':
        return [
          ...baseItems,
          { label: 'Dashboard', href: '/orientador/dashboard', icon: '📊' },
          { label: 'Mis Estudiantes', href: '/orientador/estudiantes', icon: '👥' },
          { label: 'Análisis', href: '/orientador/analisis', icon: '📈' },
          { label: 'Aula Virtual', href: '/orientador/recursos', icon: '📚' },
          { label: 'Videollamadas', href: '/orientador/videollamada', icon: '🎥' },
          { label: 'Chat', href: '/chat', icon: '💬' },
          { label: 'Perfil', href: '/perfil', icon: '👤' },
        ];
      case 'administrador':
        return [
          ...baseItems,
          { label: 'Dashboard', href: '/admin/dashboard', icon: '📊' },
          { label: 'Usuarios', href: '/admin/usuarios', icon: '👥' },
          { label: 'Roles', href: '/admin/roles', icon: '🔐' },
          { label: 'Orientadores', href: '/admin/orientadores', icon: '👨‍🏫' },
          { label: 'Estadísticas', href: '/admin/estadisticas', icon: '📊' },
          { label: 'Perfil', href: '/perfil', icon: '👤' },
        ];
      default:
        return baseItems;
    }
  };

  const sidebarItems = getSidebarItems();

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Main Content - Full Width */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
          <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
        </div>

        {/* Content */}
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;
