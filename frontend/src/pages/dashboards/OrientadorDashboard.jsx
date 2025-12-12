import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, BookOpen, MessageCircle, BarChart3, ChevronRight, 
  TrendingUp, Sparkles, GraduationCap, Calendar, CheckCircle,
  Clock, AlertCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContextFixed';
import { API_URL } from '../../api';
import HeaderOrientador from '../../components/HeaderOrientador';

/**
 * OrientadorDashboard
 * 
 * Dashboard para orientadores con diseño moderno
 * Paleta de colores: Naranja/Amber (cálido y profesional)
 * 
 * Funcionalidades:
 * - Ver estudiantes asignados
 * - Análisis de tests
 * - Chat interno
 * - Recursos educativos
 * 
 * @component
 */
function OrientadorDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [statsData, setStatsData] = useState(null);
  const [estudiantes, setEstudiantes] = useState([]);
  const [error, setError] = useState(null);
  
  // Partículas decorativas con colores naranjas
  const [particles] = useState(() => {
    return Array.from({ length: 20 }, (_, i) => ({
      id: i,
      top: Math.random() * 100,
      left: Math.random() * 100,
      size: Math.random() * 4 + 2,
      opacity: Math.random() * 0.4 + 0.2,
      delay: Math.random() * 5000,
      color: Math.random() > 0.5 ? 'orange' : 'amber',
      shade: Math.random() > 0.5 ? '400' : '500',
    }));
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('No autenticado');
          setLoading(false);
          return;
        }

        // Obtener estadísticas del dashboard
        const statsResponse = await fetch(`${API_URL}/orientador/dashboard`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        });

        if (statsResponse.ok) {
          const stats = await statsResponse.json();
          // Las estadísticas están en data.estadisticas
          setStatsData(stats.data?.estadisticas || stats.data || {});
        }

        // Intentar obtener estudiantes asignados
        try {
          const estudiantesResponse = await fetch(`${API_URL}/orientador/estudiantes`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/json'
            }
          });
          if (estudiantesResponse.ok) {
            const data = await estudiantesResponse.json();
            setEstudiantes(data.data || []);
          }
        } catch (e) {
          // Si no hay endpoint, usar datos de ejemplo
          setEstudiantes([]);
        }

      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const widgets = [
    {
      title: 'Mis Estudiantes',
      description: 'Gestiona a tus estudiantes asignados',
      icon: Users,
      gradient: 'from-orange-500 to-orange-600',
      link: '/orientador/estudiantes',
      label: 'Ver estudiantes',
      count: statsData?.estudiantes_asignados || 0
    },
    {
      title: 'Análisis de Tests',
      description: 'Revisa los resultados de tus estudiantes',
      icon: BarChart3,
      gradient: 'from-amber-500 to-yellow-500',
      link: '/orientador/analisis',
      label: 'Ver análisis',
      count: statsData?.tests_analizados || 0
    },
    {
      title: 'Chat Interno',
      description: 'Comunícate con tus estudiantes',
      icon: MessageCircle,
      gradient: 'from-orange-400 to-amber-500',
      link: '/orientador/chat',
      label: 'Abrir chat'
    },
    {
      title: 'Recursos',
      description: 'Accede a materiales educativos',
      icon: BookOpen,
      gradient: 'from-amber-600 to-orange-600',
      link: '/orientador/recursos',
      label: 'Ver recursos'
    }
  ];

  // Tareas pendientes simuladas
  const tareasPendientes = [
    { id: 1, texto: 'Revisar tests pendientes de análisis', completada: false, prioridad: 'alta' },
    { id: 2, texto: 'Enviar recomendaciones a estudiantes', completada: false, prioridad: 'media' },
    { id: 3, texto: 'Planificar tutoría con estudiantes', completada: false, prioridad: 'baja' },
    { id: 4, texto: 'Actualizar recursos educativos', completada: true, prioridad: 'media' },
  ];

  if (loading) {
    return (
      <>
        <HeaderOrientador />
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-orange-200 border-t-orange-600"></div>
            <p className="mt-4 text-gray-600 font-medium">Cargando panel de orientación...</p>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <HeaderOrientador />
        <div className="min-h-screen bg-white p-8 flex items-center justify-center">
          <div className="rounded-xl bg-red-50 border border-red-200 p-6 max-w-md">
            <h3 className="text-lg font-bold text-red-900 mb-2">Error al cargar</h3>
            <p className="text-red-800 mb-4">{error}</p>
            <button
              onClick={() => navigate('/login')}
              className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold transition-colors"
            >
              Volver al login
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-linear-to-br from-orange-50 via-white to-amber-50 flex flex-col">
      {/* Header de orientador */}
      <HeaderOrientador />

      {/* FONDO ANIMADO */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Círculos animados (blobs) */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-orange-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-amber-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-1/3 w-72 h-72 bg-yellow-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>
        
        {/* Partículas flotantes */}
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
        
        {/* Ondas SVG animadas */}
        <svg className="absolute top-0 left-0 w-full h-full" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
          <defs>
            <linearGradient id="orientadorGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#f97316', stopOpacity: 0.3 }} />
              <stop offset="100%" style={{ stopColor: '#f59e0b', stopOpacity: 0.3 }} />
            </linearGradient>
            <linearGradient id="orientadorGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#f59e0b', stopOpacity: 0.3 }} />
              <stop offset="100%" style={{ stopColor: '#f97316', stopOpacity: 0.3 }} />
            </linearGradient>
          </defs>
          <path d="M0,100 Q400,50 800,100 T1600,100 T2400,100" stroke="url(#orientadorGrad1)" strokeWidth="2" fill="none" className="animate-wave" style={{ animationDelay: '0s' }} />
          <path d="M0,250 Q350,200 700,250 T1400,250 T2100,250" stroke="url(#orientadorGrad2)" strokeWidth="2" fill="none" className="animate-wave" style={{ animationDelay: '-1.2s' }} />
          <path d="M0,400 Q450,350 900,400 T1800,400 T2700,400" stroke="url(#orientadorGrad1)" strokeWidth="2" fill="none" className="animate-wave" style={{ animationDelay: '-2.4s' }} />
        </svg>
      </div>

      {/* CONTENIDO PRINCIPAL */}
      <main className="relative z-10 grow flex flex-col">
        {/* Hero Section */}
        <section className="py-16 lg:py-20">
          <div className="container mx-auto px-4 text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-orange-300 bg-white/80 backdrop-blur-sm mb-8">
              <Sparkles className="w-4 h-4 text-orange-500" />
              <span className="text-sm font-medium text-orange-700">Panel de Orientación</span>
            </div>

            {/* Título principal */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
              <span className="italic bg-linear-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                Guía el futuro.
              </span>
            </h1>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Inspira a tus estudiantes.
            </h2>

            {/* Descripción */}
            <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-10">
              Bienvenido, <span className="font-semibold text-orange-700">{user?.nombre || 'Orientador'}</span>. 
              Gestiona a tus estudiantes, analiza sus resultados y proporciona orientación personalizada.
            </p>

            {/* Botones de acción */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate('/orientador/estudiantes')}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-linear-to-r from-orange-500 to-amber-500 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 cursor-pointer"
              >
                <Users className="w-5 h-5" />
                Ver mis estudiantes
              </button>
              <button
                onClick={() => navigate('/orientador/analisis')}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 border-2 border-orange-500 text-orange-600 rounded-lg font-semibold hover:bg-orange-50 transition-all duration-300 cursor-pointer"
              >
                Analizar resultados
              </button>
            </div>
          </div>
        </section>

        {/* Estadísticas */}
        <section className="py-12 border-t border-gray-100">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {/* Estudiantes Asignados */}
              <div className="text-center group bg-white rounded-2xl p-6 border border-orange-200 shadow-sm hover:shadow-md hover:border-orange-300 transition-all duration-300">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-orange-100 flex items-center justify-center group-hover:bg-orange-200 transition-colors">
                  <Users className="w-8 h-8 text-orange-600" strokeWidth={1.5} />
                </div>
                <p className="text-3xl md:text-4xl font-bold bg-linear-to-r from-orange-600 to-orange-700 bg-clip-text text-transparent">
                  {statsData?.estudiantes_asignados || 0}
                </p>
                <p className="text-sm text-gray-500 mt-1">Estudiantes asignados</p>
              </div>

              {/* Tests Analizados */}
              <div className="text-center group bg-white rounded-2xl p-6 border border-amber-200 shadow-sm hover:shadow-md hover:border-amber-300 transition-all duration-300">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-amber-50 flex items-center justify-center group-hover:bg-amber-100 transition-colors">
                  <BarChart3 className="w-8 h-8 text-amber-600" strokeWidth={1.5} />
                </div>
                <p className="text-3xl md:text-4xl font-bold bg-linear-to-r from-amber-600 to-yellow-600 bg-clip-text text-transparent">
                  {statsData?.tests_analizados || 0}
                </p>
                <p className="text-sm text-gray-500 mt-1">Tests analizados</p>
              </div>

              {/* Nuevos Estudiantes */}
              <div className="text-center group bg-white rounded-2xl p-6 border border-yellow-200 shadow-sm hover:shadow-md hover:border-yellow-300 transition-all duration-300">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-yellow-50 flex items-center justify-center group-hover:bg-yellow-100 transition-colors">
                  <TrendingUp className="w-8 h-8 text-yellow-600" strokeWidth={1.5} />
                </div>
                <p className="text-3xl md:text-4xl font-bold bg-linear-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
                  {statsData?.nuevos_estudiantes || 0}
                </p>
                <p className="text-sm text-gray-500 mt-1">Nuevos esta semana</p>
              </div>

              {/* Mensajes Pendientes */}
              <div className="text-center group bg-white rounded-2xl p-6 border border-orange-200 shadow-sm hover:shadow-md hover:border-orange-300 transition-all duration-300">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-orange-50 flex items-center justify-center group-hover:bg-orange-100 transition-colors">
                  <MessageCircle className="w-8 h-8 text-orange-500" strokeWidth={1.5} />
                </div>
                <p className="text-3xl md:text-4xl font-bold bg-linear-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">
                  {statsData?.mensajes_pendientes || 0}
                </p>
                <p className="text-sm text-gray-500 mt-1">Mensajes pendientes</p>
              </div>
            </div>
          </div>
        </section>

        {/* Widgets de acciones */}
        <section className="py-16 bg-gray-50/50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
                Herramientas de orientación
              </h3>
              <p className="text-gray-600 max-w-xl mx-auto">
                Accede a las funciones principales para guiar a tus estudiantes
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
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
                    <h4 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-orange-600 transition-colors">
                      {widget.title}
                    </h4>

                    {/* Descripción */}
                    <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                      {widget.description}
                    </p>

                    {/* Count si existe */}
                    {widget.count !== undefined && (
                      <p className="text-2xl font-bold text-orange-600 mb-3">
                        {widget.count}
                      </p>
                    )}

                    {/* Link */}
                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-600 group-hover:text-orange-600 transition-colors">
                      <span>{widget.label}</span>
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
        </section>

        {/* Sección de contenido adicional: Estudiantes recientes y Tareas */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
              
              {/* Estudiantes Recientes */}
              <div className="bg-white rounded-2xl border border-orange-200 p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
                    <GraduationCap className="w-5 h-5 text-orange-600" />
                  </div>
                  <h4 className="font-bold text-gray-900 text-lg">Estudiantes Recientes</h4>
                </div>
                
                <div className="space-y-4">
                  {estudiantes.length > 0 ? (
                    estudiantes.slice(0, 5).map((est, idx) => (
                      <div key={idx} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-linear-to-br from-orange-400 to-amber-400 flex items-center justify-center text-white font-semibold">
                            {est.nombre?.charAt(0) || 'E'}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{est.nombre}</p>
                            <p className="text-sm text-gray-500">{est.email}</p>
                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          est.test_completado 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {est.test_completado ? 'Test completado' : 'Pendiente'}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">No hay estudiantes asignados</p>
                      <p className="text-sm text-gray-400">Los estudiantes aparecerán aquí cuando te sean asignados</p>
                    </div>
                  )}
                </div>
                
                <button 
                  onClick={() => navigate('/orientador/estudiantes')}
                  className="w-full mt-4 py-3 text-orange-600 font-semibold hover:bg-orange-50 rounded-lg transition-colors cursor-pointer"
                >
                  Ver todos los estudiantes →
                </button>
              </div>

              {/* Próximas Tareas */}
              <div className="bg-white rounded-2xl border border-amber-200 p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-amber-600" />
                  </div>
                  <h4 className="font-bold text-gray-900 text-lg">Próximas Tareas</h4>
                </div>
                
                <div className="space-y-3">
                  {tareasPendientes.map((tarea) => (
                    <div 
                      key={tarea.id} 
                      className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                        tarea.completada 
                          ? 'bg-gray-50 border-gray-200' 
                          : 'bg-orange-50/50 border-orange-200 hover:bg-orange-50'
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                        tarea.completada 
                          ? 'bg-green-500' 
                          : tarea.prioridad === 'alta' 
                            ? 'bg-red-100 border-2 border-red-300' 
                            : tarea.prioridad === 'media'
                              ? 'bg-yellow-100 border-2 border-yellow-300'
                              : 'bg-gray-100 border-2 border-gray-300'
                      }`}>
                        {tarea.completada && <CheckCircle className="w-4 h-4 text-white" />}
                        {!tarea.completada && tarea.prioridad === 'alta' && <AlertCircle className="w-3 h-3 text-red-500" />}
                        {!tarea.completada && tarea.prioridad === 'media' && <Clock className="w-3 h-3 text-yellow-600" />}
                      </div>
                      <span className={`flex-1 ${tarea.completada ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                        {tarea.texto}
                      </span>
                      {!tarea.completada && (
                        <span className={`text-xs font-medium px-2 py-1 rounded ${
                          tarea.prioridad === 'alta' 
                            ? 'bg-red-100 text-red-700' 
                            : tarea.prioridad === 'media'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-gray-100 text-gray-600'
                        }`}>
                          {tarea.prioridad}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Info box */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto bg-white rounded-2xl border-2 border-orange-200 p-6 lg:p-8 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center shrink-0">
                  <GraduationCap className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 mb-2">Centro de orientación</h4>
                  <p className="text-gray-600 leading-relaxed">
                    Como orientador, tu rol es fundamental para guiar a los estudiantes en su camino vocacional. 
                    Utiliza las herramientas disponibles para analizar resultados, comunicarte con ellos y 
                    proporcionarles recursos educativos personalizados. Para soporte técnico, 
                    <a href="/contacto" className="text-orange-600 hover:text-amber-600 font-medium ml-1">
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

export default OrientadorDashboard;
