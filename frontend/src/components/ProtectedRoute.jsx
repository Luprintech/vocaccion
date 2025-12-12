import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContextFixed';

export default function ProtectedRoute({ children, requiredPlan }) {
  const { isAuthenticated, token, user } = useAuth();
  const [currentPlan, setCurrentPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const fetchSubscription = async () => {
      if (!isAuthenticated || !token || !user) {
        setLoading(false);
        return;
      }
      
      // Si el usuario no es estudiante (admin, orientador), asumimos que tiene acceso total
      // o manejamos roles de otra forma. Aquí nos centramos en planes de estudiante.
      const isEstudiante = user.roles && user.roles.some(r => r.nombre === 'estudiante');
      if (!isEstudiante) {
        setCurrentPlan('pro_plus'); // Admin/Orientador 'simula' plan máximo
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('http://localhost:8000/api/estudiante/mi-suscripcion', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          }
        });

        if (response.ok) {
          const result = await response.json();
          // Asumimos que result.data.plan devuelve 'gratuito', 'pro', o 'pro_plus'
          // Ajusta según la respuesta real de tu API.
          // El endpoint devuelve data.tipo_plan directamente, no nested en subscription
          setCurrentPlan(result.data?.tipo_plan || 'gratuito');
        } else {
          setCurrentPlan('gratuito');
        }
      } catch (error) {
        console.error("Error fetching subscription", error);
        setCurrentPlan('gratuito');
      } finally {
        setLoading(false);
      }
    };

    fetchSubscription();
  }, [isAuthenticated, token, user]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (loading) {
    // Puedes poner un spinner aquí
    return <div className="p-8 text-center text-gray-500">Cargando permisos...</div>;
  }

  if (!requiredPlan) {
    return children;
  }

  // Lógica de jerarquía de planes
  // gratuito < pro < pro_plus
  const planLevels = {
    'gratuito': 1,
    'basico': 1, // Por si acaso
    'pro': 2,
    'pro_plus': 3,
    'Pro Plus': 3 // Por variables inconsistentes
  };

  const currentLevel = planLevels[currentPlan] || 1;
  const requiredLevel = planLevels[requiredPlan] || 1;

  if (currentLevel < requiredLevel) {
    // Redirigir a página de planes o mostrar mensaje de upgrade
    return <Navigate to="/planes" replace state={{ 
      message: `Esta funcionalidad requiere un plan ${requiredPlan === 'pro_plus' ? 'Pro Plus' : 'Pro'}.` 
    }} />;
  }

  return children;
}
