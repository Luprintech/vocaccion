import { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { BookOpen, Zap, Award, Target } from 'lucide-react';
import { API_URL } from '../../api';

/**
 * EstudianteDashboard
 * 
 * Dashboard para estudiantes con acceso a:
 * - Realizar test vocacional
 * - Ver resultados
 * - Recomendaciones de IA
 * - Fichas de profesiones
 * - Plan premium
 * 
 * @component
 */
function EstudianteDashboard() {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('No autenticado');
          setLoading(false);
          return;
        }

        const response = await fetch(`${API_URL}/estudiante/dashboard/simple`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Error al cargar el dashboard');
        }

        const data = await response.json();
        setDashboardData({
          tests_realizados: data.tests_realizados || 0,
          resultados_disponibles: data.resultados_disponibles || 0,
          recomendaciones_nuevas: data.recomendaciones_nuevas || 0
        });
      } catch (err) {
        console.error('Error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  const widgets = [
    {
      title: 'Realizar Test',
      description: 'Descubre tu vocación profesional',
      icon: BookOpen,
      color: 'bg-blue-500',
      link: '/test',
      label: 'Comenzar test'
    },
    {
      title: 'Mis Resultados',
      description: 'Revisa tus análisis anteriores',
      icon: Zap,
      color: 'bg-yellow-500',
      link: '/resultados',
      label: 'Ver resultados'
    },
    {
      title: 'Mi Profesión',
      description: 'Información sobre tu carrera',
      icon: Target,
      color: 'bg-green-500',
      link: '/mi-profesion',
      label: 'Ver detalles'
    },
    {
      title: 'Plan Premium',
      description: 'Desbloquea funcionalidades avanzadas',
      icon: Award,
      color: 'bg-purple-500',
      link: '/planes',
      label: 'Ver planes'
    }
  ];

  if (loading) {
    return (
        <>
            <Header />
            <DashboardLayout title="Dashboard" userRole="estudiante">
                <div className="flex items-center justify-center h-full">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                    <p className="mt-4 text-gray-600">Cargando dashboard...</p>
                </div>
                </div>
            </DashboardLayout>
        </>
    );
  }

  if (error) {
    return (
        <>
            <Header />
            <DashboardLayout title="Dashboard" userRole="estudiante">
                <div className="rounded-lg bg-red-50 border border-red-200 p-4">
                <p className="text-red-800">Error: {error}</p>
                </div>
            </DashboardLayout>
        </>
    );
  }

  return (
    <>
        <Header />
        <DashboardLayout title="Dashboard Estudiante" userRole="estudiante">
            <div className="space-y-6">
                {/* Bienvenida */}
                <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 rounded-lg shadow-lg p-6 text-white">
                <h1 className="text-3xl font-bold mb-2">
                    ¡Bienvenido, {dashboardData?.nombre}!
                </h1>
                <p className="text-indigo-100">
                    Aquí puedes acceder a tus herramientas de orientación vocacional
                </p>
                </div>

                {/* Estado del Test */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Estado del Test</h3>
                    <div className="space-y-3">
                    <div className="flex justify-between items-center">
                        <span className="text-gray-600">Completado:</span>
                        <span className="font-semibold text-lg">
                        {dashboardData?.test?.completado ? '✅ Sí' : '⏳ No'}
                        </span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-gray-600">Progreso:</span>
                        <span className="font-semibold text-lg">
                        {dashboardData?.test?.porcentaje_avance}%
                        </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                        className="bg-indigo-600 h-2.5 rounded-full transition-all"
                        style={{ width: `${dashboardData?.test?.porcentaje_avance}%` }}
                        ></div>
                    </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Acciones Rápidas</h3>
                    <div className="space-y-2">
                    <a 
                        href="/perfil" 
                        className="block text-indigo-600 hover:text-indigo-700 font-medium"
                    >
                        ✏️ Completar perfil
                    </a>
                    <a 
                        href="/recursos" 
                        className="block text-indigo-600 hover:text-indigo-700 font-medium"
                    >
                        📚 Ver recursos
                    </a>
                    <a 
                        href="/contacto" 
                        className="block text-indigo-600 hover:text-indigo-700 font-medium"
                    >
                        💬 Contactar orientador
                    </a>
                    </div>
                </div>
                </div>

                {/* Widgets principales */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {widgets.map((widget, index) => {
                    const Icon = widget.icon;
                    return (
                    <a
                        key={index}
                        href={widget.link}
                        className="bg-white rounded-lg shadow hover:shadow-lg transition-all transform hover:scale-105 overflow-hidden"
                    >
                        <div className={`${widget.color} text-white p-4`}>
                        <Icon size={32} />
                        </div>
                        <div className="p-4">
                        <h3 className="font-semibold text-gray-900 mb-1">{widget.title}</h3>
                        <p className="text-sm text-gray-600 mb-3">{widget.description}</p>
                        <button className="text-indigo-600 hover:text-indigo-700 font-medium text-sm">
                            {widget.label} →
                        </button>
                        </div>
                    </a>
                    );
                })}
                </div>

                {/* Próximas acciones */}
                <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">📋 Próximas Acciones</h3>
                <ul className="space-y-3">
                    <li className="flex items-center space-x-3">
                    <input type="checkbox" className="rounded" disabled />
                    <span className="text-gray-700">Completar test vocacional</span>
                    </li>
                    <li className="flex items-center space-x-3">
                    <input type="checkbox" className="rounded" disabled />
                    <span className="text-gray-700">Revisar resultados del test</span>
                    </li>
                    <li className="flex items-center space-x-3">
                    <input type="checkbox" className="rounded" disabled />
                    <span className="text-gray-700">Descargar informe de recomendaciones</span>
                    </li>
                </ul>
                </div>
            </div>
        </DashboardLayout>
    </>
  );
}

export default EstudianteDashboard;
