import { Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

/**
 * RequireRole
 * 
 * Componente protector de rutas que valida que el usuario tenga el rol requerido.
 * 
 * Uso:
 * <RequireRole roles={["estudiante"]} fallback={<AccessDenied />}>
 *   <EstudianteDashboard />
 * </RequireRole>
 * 
 * Props:
 * - roles: string | array de strings con los roles permitidos
 * - children: componente a renderizar si el usuario tiene permiso
 * - fallback: componente opcional a mostrar si acceso denegado
 * 
 * @component
 */
function RequireRole({ roles, children, fallback }) {
  const [loading, setLoading] = useState(true);
  const [hasRole, setHasRole] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const checkRole = async () => {
      try {
        // Obtener usuario del localStorage (incluye roles desde login)
        const userData = localStorage.getItem('user');
        if (!userData) {
          setHasRole(false);
          setLoading(false);
          return;
        }

        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);

        // Normalizar roles a array
        const allowedRoles = Array.isArray(roles) ? roles : [roles];
        
        // Obtener roles del usuario
        const userRoles = parsedUser.roles || [];
        const userRoleNames = userRoles.map(r => {
          // Si es objeto con propiedad 'nombre', usarlo
          return typeof r === 'object' ? r.nombre : r;
        });

        // Verificar si el usuario tiene alguno de los roles permitidos
        const userHasRole = allowedRoles.some(role => 
          userRoleNames.includes(role)
        );

        setHasRole(userHasRole);
      } catch (error) {
        console.error('❌ Error al verificar rol:', error);
        setHasRole(false);
      } finally {
        setLoading(false);
      }
    };

    checkRole();
  }, [roles]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600">Verificando permisos...</p>
        </div>
      </div>
    );
  }

  if (!hasRole) {
    if (fallback) {
      return fallback;
    }

    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="rounded-lg bg-white p-8 shadow-lg">
            <svg 
              className="mx-auto h-12 w-12 text-red-600 mb-4" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 9v2m0 4v2m0 4v2M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" 
              />
            </svg>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Acceso Denegado</h1>
            <p className="text-gray-600 mb-6">
              No tienes permisos para acceder a este recurso.
              {user && user.roles && (
                <span className="block mt-2 text-sm">
                  Tu rol: <span className="font-semibold">{user.roles.map(r => r.nombre || r).join(', ')}</span>
                </span>
              )}
            </p>
            <a 
              href="/" 
              className="inline-block bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition"
            >
              Volver a inicio
            </a>
          </div>
        </div>
      </div>
    );
  }

  return children;
}

export default RequireRole;
