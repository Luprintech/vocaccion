import { useState, useEffect } from 'react';
import { Users, UserPlus, BarChart3, ChevronRight, TrendingUp, Shield, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContextFixed';
import { API_URL } from '../../api';
import HeaderAdmin from '../../components/HeaderAdmin';

/**
 * AdminDashboard
 * 
 * Dashboard para administradores con diseño moderno
 * Paleta de colores: Azul Oscuro (Slate/Indigo) y Cian/Teal (diferenciado del resto)
 * 
 * Funcionalidades:
 * - Gestión de usuarios
 * - Crear orientadores
 * - Asignar roles
 * - Ver estadísticas generales
 * 
 * @component
 */
function AdminDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [statsData, setStatsData] = useState(null);
  const [error, setError] = useState(null);
  
  // Partículas decorativas con colores variados (igual que Login.jsx)
  const [particles] = useState(() => {
    return Array.from({ length: 20 }, (_, i) => ({
      id: i,
      top: Math.random() * 100,
      left: Math.random() * 100,
      size: Math.random() * 4 + 2,
      opacity: Math.random() * 0.4 + 0.2,
      delay: Math.random() * 5000,
      color: Math.random() > 0.5 ? 'cyan' : 'slate',
      shade: Math.random() > 0.5 ? '400' : '500',
    }));
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('No autenticado');
          setLoading(false);
          return;
        }

        const response = await fetch(`${API_URL}/admin/stats/simple`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Error al cargar estadísticas');
        }

        const data = await response.json();
        setStatsData(data);
      } catch (err) {
        console.error('Error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const widgets = [
    {
      title: 'Gestión de Usuarios',
      description: 'Administra las cuentas de estudiantes',
      icon: Users,
      color: 'slate',
      gradient: 'from-slate-700 to-slate-800',
      link: '/admin/usuarios',
      label: 'Gestionar usuarios',
      count: statsData?.total_usuarios
    },
    {
      title: 'Orientadores',
      description: 'Gestiona orientadores y asigna estudiantes',
      icon: UserPlus,
      color: 'cyan',
      gradient: 'from-cyan-500 to-teal-600',
      link: '/admin/orientadores',
      label: 'Gestionar orientadores',
      count: statsData?.orientadores_activos
    },
    {
      title: 'Estadísticas',
      description: 'Análisis y métricas del sistema',
      icon: BarChart3,
      color: 'cyan',
      gradient: 'from-teal-500 to-cyan-600',
      link: '/admin/estadisticas',
      label: 'Ver estadísticas',
      count: statsData?.tests_completados
    }
  ];

  if (loading) {
    return (
      <>
        <HeaderAdmin />
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-slate-200 border-t-slate-700"></div>
            <p className="mt-4 text-gray-600 font-medium">Cargando panel administrativo...</p>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <HeaderAdmin />
        <div className="min-h-screen bg-white p-8 flex items-center justify-center">
          <div className="rounded-xl bg-red-50 border border-red-200 p-6 max-w-md">
            <h3 className="text-lg font-bold text-red-900 mb-2">Error al cargar</h3>
            <p className="text-red-800 mb-4">{error}</p>
            <button
              onClick={() => navigate('/login')}
              className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold transition-colors cursor-pointer"
            >
              Volver al login
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-linear-to-br from-slate-50 via-white to-cyan-50 flex flex-col">
      {/* Header administrativo */}
      <HeaderAdmin />

      {/* FONDO ANIMADO - Igual que Login.jsx */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Círculos animados (blobs) */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-slate-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-cyan-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-1/3 w-72 h-72 bg-indigo-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>
        
        {/* Partículas flotantes con colores */}
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
        
        {/* Ondas SVG animadas - Igual que Login.jsx */}
        <svg className="absolute top-0 left-0 w-full h-full" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
          <defs>
            <linearGradient id="adminGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#475569', stopOpacity: 0.5 }} />
              <stop offset="100%" style={{ stopColor: '#06b6d4', stopOpacity: 0.5 }} />
            </linearGradient>
            <linearGradient id="adminGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#06b6d4', stopOpacity: 0.5 }} />
              <stop offset="100%" style={{ stopColor: '#475569', stopOpacity: 0.5 }} />
            </linearGradient>
          </defs>
          {/* Ondas */}
          <path d="M0,100 Q400,50 800,100 T1600,100 T2400,100" stroke="url(#adminGrad1)" strokeWidth="2" fill="none" className="animate-wave" style={{ animationDelay: '0s' }} />
          <path d="M0,250 Q350,200 700,250 T1400,250 T2100,250" stroke="url(#adminGrad2)" strokeWidth="2" fill="none" className="animate-wave" style={{ animationDelay: '-1.2s' }} />
          <path d="M0,400 Q450,350 900,400 T1800,400 T2700,400" stroke="url(#adminGrad1)" strokeWidth="2" fill="none" className="animate-wave" style={{ animationDelay: '-2.4s' }} />
          <path d="M0,550 Q500,480 1000,550 T2000,550 T3000,550" stroke="url(#adminGrad2)" strokeWidth="2" fill="none" className="animate-wave" style={{ animationDelay: '-3.6s' }} />
          <path d="M0,700 Q420,630 840,700 T1680,700 T2520,700" stroke="url(#adminGrad1)" strokeWidth="2" fill="none" className="animate-wave" style={{ animationDelay: '-4.8s' }} />
        </svg>
      </div>

      {/* CONTENIDO PRINCIPAL */}
      <main className="relative z-10 grow flex flex-col">
        {/* Hero Section - Panel Admin */}
        <section className="py-16 lg:py-20">
          <div className="container mx-auto px-4 text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-slate-300 bg-white/80 backdrop-blur-sm mb-8">
              <Sparkles className="w-4 h-4 text-cyan-500" />
              <span className="text-sm font-medium text-slate-700">Panel de Administración</span>
            </div>

            {/* Título principal */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
              <span className="italic bg-linear-to-r from-slate-700 to-cyan-600 bg-clip-text text-transparent">
                Centro de control.
              </span>
            </h1>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Gestiona tu plataforma.
            </h2>

            {/* Descripción */}
            <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-10">
              Bienvenido, <span className="font-semibold text-slate-800">{user?.nombre}</span>. 
              Desde aquí puedes administrar usuarios, orientadores y ver las estadísticas del sistema.
            </p>

            {/* Botones de acción */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate('/admin/usuarios')}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-linear-to-r from-slate-700 to-slate-900 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 cursor-pointer"
              >
                <Users className="w-5 h-5" />
                Gestionar usuarios
              </button>
              <button
                onClick={() => navigate('/admin/estadisticas')}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 border-2 border-cyan-500 text-cyan-600 rounded-lg font-semibold hover:bg-cyan-50 transition-all duration-300 cursor-pointer"
              >
                Ver estadísticas
              </button>
            </div>
          </div>
        </section>

        {/* Estadísticas - Similar a la sección de stats de Home */}
        <section className="py-12 border-t border-gray-100">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {/* Total Usuarios */}
              <div className="text-center group bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-300">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-100 flex items-center justify-center group-hover:bg-slate-200 transition-colors">
                  <Users className="w-8 h-8 text-slate-700" strokeWidth={1.5} />
                </div>
                <p className="text-3xl md:text-4xl font-bold bg-linear-to-r from-slate-700 to-slate-800 bg-clip-text text-transparent">
                  {statsData?.total_usuarios || 0}
                </p>
                <p className="text-sm text-gray-500 mt-1">Total usuarios</p>
              </div>

              {/* Tests Completados */}
              <div className="text-center group bg-white rounded-2xl p-6 border border-cyan-200 shadow-sm hover:shadow-md hover:border-cyan-300 transition-all duration-300">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-cyan-50 flex items-center justify-center group-hover:bg-cyan-100 transition-colors">
                  <BarChart3 className="w-8 h-8 text-cyan-600" strokeWidth={1.5} />
                </div>
                <p className="text-3xl md:text-4xl font-bold bg-linear-to-r from-cyan-600 to-teal-600 bg-clip-text text-transparent">
                  {statsData?.tests_completados || 0}
                </p>
                <p className="text-sm text-gray-500 mt-1">Tests completados</p>
              </div>

              {/* Nuevos Registros */}
              <div className="text-center group bg-white rounded-2xl p-6 border border-indigo-200 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all duration-300">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-indigo-50 flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
                  <TrendingUp className="w-8 h-8 text-indigo-600" strokeWidth={1.5} />
                </div>
                <p className="text-3xl md:text-4xl font-bold bg-linear-to-r from-indigo-600 to-indigo-700 bg-clip-text text-transparent">
                  {statsData?.nuevos_registros || 0}
                </p>
                <p className="text-sm text-gray-500 mt-1">Nuevos registros</p>
              </div>

              {/* Orientadores */}
              <div className="text-center group bg-white rounded-2xl p-6 border border-teal-200 shadow-sm hover:shadow-md hover:border-teal-300 transition-all duration-300">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-teal-50 flex items-center justify-center group-hover:bg-teal-100 transition-colors">
                  <UserPlus className="w-8 h-8 text-teal-600" strokeWidth={1.5} />
                </div>
                <p className="text-3xl md:text-4xl font-bold bg-linear-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
                  {statsData?.orientadores_activos || 0}
                </p>
                <p className="text-sm text-gray-500 mt-1">Orientadores</p>
              </div>
            </div>
          </div>
        </section>

        {/* Widgets de acciones - Estilo cards como en Home */}
        <section className="py-16 bg-gray-50/50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
                Herramientas de administración
              </h3>
              <p className="text-gray-600 max-w-xl mx-auto">
                Accede a las principales funciones de gestión del sistema
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {widgets.map((widget, index) => {
                const Icon = widget.icon;
                return (
                  <a
                    key={index}
                    href={widget.link}
                    className="group bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100 cursor-pointer"
                  >
                    {/* Icono */}
                    <div className={`w-14 h-14 rounded-xl bg-linear-to-br ${widget.gradient} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="w-7 h-7 text-white" strokeWidth={1.5} />
                    </div>

                    {/* Título */}
                    <h4 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-cyan-600 transition-colors">
                      {widget.title}
                    </h4>

                    {/* Descripción */}
                    <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                      {widget.description}
                    </p>

                    {/* Count si existe */}
                    {widget.count !== undefined && (
                      <p className={`text-2xl font-bold mb-3 ${widget.color === 'slate' ? 'text-slate-700' : 'text-cyan-600'}`}>
                        {widget.count}
                      </p>
                    )}

                    {/* Link */}
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-600 group-hover:text-cyan-600 transition-colors">
                      <span>{widget.label}</span>
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
        </section>

        {/* Info box */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto bg-white rounded-2xl border-2 border-slate-200 p-6 lg:p-8 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                  <Shield className="w-6 h-6 text-slate-700" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 mb-2">Centro de administración</h4>
                  <p className="text-gray-600 leading-relaxed">
                    Desde este panel puedes gestionar todos los aspectos del sistema VocAcción. 
                    Las funcionalidades de gestión de usuarios, creación de orientadores y asignación 
                    de roles están siendo constantemente mejoradas. Para soporte técnico, 
                    <a href="/contacto" className="text-cyan-600 hover:text-teal-600 font-medium ml-1 cursor-pointer">
                      contacta con el equipo
                    </a>.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default AdminDashboard;
