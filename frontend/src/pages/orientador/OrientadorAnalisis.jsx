import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  ClipboardCheck, 
  Clock, 
  Award,
  Download,
  RefreshCw,
  GraduationCap,
  Brain,
  Target,
  Briefcase,
  Lightbulb,
  FileText,
  Map,
  Search
} from 'lucide-react';
import { useAuth } from '../../context/AuthContextFixed';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../../api';
import HeaderOrientador from '../../components/HeaderOrientador';

/**
 * OrientadorAnalisis
 * 
 * Página de análisis con datos REALES de los estudiantes asignados.
 * Muestra estadísticas de tests completados, perfiles vocacionales y resultados.
 */
const OrientadorAnalisis = () => {
  const { user, token } = useAuth();
  const STORAGE_URL = API_URL.replace('/api', '/storage');
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [estudiantes, setEstudiantes] = useState([]);
  const [resultados, setResultados] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
  }, []);


  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Obtener token (desde contexto o localStorage)
      const authToken = token || localStorage.getItem('token');
      
      if (!authToken) {
        console.error('No hay token de autenticación');
        return;
      }
      
      // Obtener estudiantes asignados
      const estResponse = await fetch(`${API_URL}/orientador/estudiantes`, {
        headers: { 'Authorization': `Bearer ${authToken}`, 'Accept': 'application/json' }
      });
      const estData = await estResponse.json();
      setEstudiantes(estData.data || []);
      
      // Obtener resultados de tests
      const resResponse = await fetch(`${API_URL}/orientador/analisis`, {
        headers: { 'Authorization': `Bearer ${authToken}`, 'Accept': 'application/json' }
      });
      const resData = await resResponse.json();
      setResultados(resData.data || []);
      
    } catch (err) {
      console.error('Error en fetchData:', err);
    } finally {
      setLoading(false);
    }
  };

  // Calcular estadísticas reales
  const stats = {
    totalEstudiantes: estudiantes.length,
    testCompletados: estudiantes.filter(e => e.test_completado === 1 || e.test_completado === true).length,
    testPendientes: estudiantes.filter(e => e.test_completado === 0 || e.test_completado === false).length,
    promedioProgreso: estudiantes.length > 0 
      ? Math.round((estudiantes.filter(e => e.test_completado).length / estudiantes.length) * 100) 
      : 0
  };

  // Agrupar por carreras/profesiones de los resultados
  const getDistribucionCarreras = () => {
    const carreras = {};
    resultados.forEach(r => {
      try {
        const profesiones = typeof r.profesiones === 'string' ? JSON.parse(r.profesiones) : r.profesiones;
        if (Array.isArray(profesiones)) {
          profesiones.slice(0, 2).forEach(p => {
            // Extraer el nombre correctamente del objeto o string
            const nombre = (typeof p === 'object' && p !== null) 
              ? (p.titulo || p.nombre || p.profesion || JSON.stringify(p))
              : String(p);
            carreras[nombre] = (carreras[nombre] || 0) + 1;
          });
        }
      } catch (e) {
        // Error procesando profesiones
      }
    });
    
    const total = Object.values(carreras).reduce((a, b) => a + b, 0) || 1;
    const colores = ['bg-orange-500', 'bg-amber-500', 'bg-yellow-500', 'bg-orange-400', 'bg-amber-400'];
    
    return Object.entries(carreras)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([nombre, cantidad], idx) => ({
        nombre,
        cantidad,
        porcentaje: Math.round((cantidad / total) * 100),
        color: colores[idx] || 'bg-gray-400'
      }));
  };

  // Exportar datos a CSV
  const handleExportar = () => {
    const headers = ['Nombre', 'Email', 'Test Completado', 'Fecha Asignación'];
    const rows = estudiantes.map(e => [
      e.nombre,
      e.email,
      e.test_completado ? 'Sí' : 'No',
      e.fecha_asignacion || '-'
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.map(c => `"${c}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `analisis_orientador_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const StatCard = ({ title, value, subtitle, icon: Icon, color = 'orange' }) => (
    <div className="bg-white rounded-2xl p-6 shadow-lg border border-orange-100 hover:shadow-xl transition-all">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-800">{value}</p>
          {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-3 bg-linear-to-br from-${color}-500 to-amber-500 rounded-xl`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-orange-50 via-amber-50 to-yellow-50">
        <HeaderOrientador />
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-600 font-medium">Cargando análisis...</p>
          </div>
        </div>
      </div>
    );
  }

  const distribucion = getDistribucionCarreras();

  const filteredEstudiantes = estudiantes.filter(est => 
    est.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    est.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-linear-to-br from-orange-50 via-amber-50 to-yellow-50">
      <HeaderOrientador />
      
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-orange-100">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                <div className="p-2 bg-linear-to-br from-orange-500 to-amber-500 rounded-xl">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
                Análisis de Tests Vocacionales
              </h1>
              <p className="text-gray-500 mt-1">Estadísticas y resultados de tus estudiantes asignados</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={fetchData}
                className="p-2 bg-white border border-orange-200 rounded-xl hover:bg-orange-50 transition-colors cursor-pointer"
                title="Actualizar datos"
              >
                <RefreshCw className="h-5 w-5 text-gray-600" />
              </button>
              <button
                onClick={handleExportar}
                className="flex items-center gap-2 bg-linear-to-r from-orange-500 to-amber-500 text-white px-4 py-2 rounded-xl hover:from-orange-600 hover:to-amber-600 transition-all shadow-lg cursor-pointer"
              >
                <Download className="h-4 w-4" />
                Exportar CSV
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Estudiantes"
            value={stats.totalEstudiantes}
            subtitle="Asignados a ti"
            icon={Users}
          />
          <StatCard
            title="Tests Completados"
            value={stats.testCompletados}
            subtitle={`${stats.totalEstudiantes > 0 ? Math.round((stats.testCompletados / stats.totalEstudiantes) * 100) : 0}% del total`}
            icon={ClipboardCheck}
          />
          <StatCard
            title="Tests Pendientes"
            value={stats.testPendientes}
            subtitle="Por completar"
            icon={Clock}
          />
          <StatCard
            title="Progreso General"
            value={`${stats.promedioProgreso}%`}
            subtitle="Tasa de completado"
            icon={TrendingUp}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Distribución de Carreras */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-orange-100">
            <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-orange-500" />
              Carreras Más Recomendadas
            </h3>
            {distribucion.length > 0 ? (
              <div className="space-y-4">
                {distribucion.map((carrera, idx) => (
                  <div key={idx} className="flex items-center gap-4">
                    <div className="min-w-[200px] text-sm font-medium text-gray-700" title={carrera.nombre}>
                      {carrera.nombre}
                    </div>
                    <div className="flex-1 h-8 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${carrera.color} rounded-full transition-all duration-500 flex items-center justify-end pr-3`}
                        style={{ width: `${Math.max(carrera.porcentaje, 10)}%` }}
                      >
                        {carrera.porcentaje >= 20 && (
                          <span className="text-xs font-bold text-white">{carrera.cantidad}</span>
                        )}
                      </div>
                    </div>
                    <div className="w-12 text-right text-sm font-semibold text-gray-600">
                      {carrera.porcentaje}%
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Brain className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>Aún no hay resultados de tests</p>
              </div>
            )}
          </div>

          {/* Resumen de resultados */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-orange-100">
            <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
              <FileText className="h-5 w-5 text-orange-500" />
              Últimos Resultados
            </h3>
            {resultados.length > 0 ? (
              <div className="space-y-3">
                {resultados.slice(0, 5).map((resultado, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 bg-orange-50 rounded-xl">
                    <div className="w-10 h-10 rounded-full bg-linear-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white font-bold overflow-hidden">
                      {resultado.profile_image ? (
                        <img 
                          src={`${STORAGE_URL}/${resultado.profile_image}`} 
                          alt={resultado.nombre} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        resultado.nombre?.charAt(0) || 'E'
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-800 truncate">{resultado.nombre}</p>
                      <p className="text-sm text-gray-500 truncate">
                        {new Date(resultado.fecha_resultado).toLocaleDateString('es-ES')}
                      </p>
                    </div>
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                      Completado
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <ClipboardCheck className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No hay resultados de tests aún</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-orange-100">
          <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <Users className="h-5 w-5 text-orange-500" />
                  Todos los Estudiantes
                </h3>
                <span className="text-sm text-gray-500">{filteredEstudiantes.length} estudiantes</span>
            </div>
            
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input 
                    type="text" 
                    placeholder="Buscar estudiante..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-hidden w-full md:w-64"
                />
            </div>
          </div>
          
          {filteredEstudiantes.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Estudiante</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Email</th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Estado Test</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Fecha Asignación</th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredEstudiantes.map((est, idx) => (
                    <tr key={idx} className="hover:bg-orange-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-linear-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white font-bold text-sm overflow-hidden">
                            {est.profile_image ? (
                              <img 
                                src={`${STORAGE_URL}/${est.profile_image}`} 
                                alt={est.nombre} 
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              est.nombre?.charAt(0) || 'E'
                            )}
                          </div>
                          <span className="font-medium text-gray-800">{est.nombre}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{est.email}</td>
                      <td className="px-6 py-4 text-center">
                        {est.test_completado ? (
                          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                            ✓ Completado
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full">
                            Pendiente
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-500 text-sm">
                        {est.fecha_asignacion ? new Date(est.fecha_asignacion).toLocaleDateString('es-ES') : '-'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => navigate(`/orientador/estudiante/${est.id}/test`)}
                            disabled={!est.test_completado}
                            className={`p-2 rounded-lg transition-colors ${
                              est.test_completado
                                ? 'bg-blue-50 text-blue-600 hover:bg-blue-100 cursor-pointer'
                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            }`}
                            title={est.test_completado ? 'Ver Test' : 'Test no completado'}
                          >
                            <FileText className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => navigate(`/orientador/estudiante/${est.id}/profesiones`)}
                            disabled={!est.test_completado}
                            className={`p-2 rounded-lg transition-colors ${
                              est.test_completado
                                ? 'bg-purple-50 text-purple-600 hover:bg-purple-100 cursor-pointer'
                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            }`}
                            title={est.test_completado ? 'Ver Profesiones' : 'Test no completado'}
                          >
                            <Briefcase className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => navigate(`/orientador/estudiante/${est.id}/itinerario`)}
                            disabled={!est.test_completado}
                            className={`p-2 rounded-lg transition-colors ${
                              est.test_completado
                                ? 'bg-green-50 text-green-600 hover:bg-green-100 cursor-pointer'
                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            }`}
                            title={est.test_completado ? 'Ver Itinerario' : 'Test no completado'}
                          >
                            <Map className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center">
              <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No hay estudiantes asignados</h3>
              <p className="text-gray-500">Solicita al administrador que te asigne estudiantes</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrientadorAnalisis;
