/**
 * ADMIN ESTADÍSTICAS - Panel de estadísticas de la plataforma
 * 
 * Muestra métricas y datos relevantes:
 * - Totales de usuarios, estudiantes, orientadores
 * - Estado de tests vocacionales
 * - Registros por período
 * - Asignaciones orientador-estudiante
 * - Top profesiones elegidas
 * - Estado de verificación de cuentas
 */

import { useState, useEffect } from 'react';
import { 
  BarChart3, Users, UserCheck, GraduationCap, TrendingUp, Calendar,
  CheckCircle, XCircle, Briefcase, Clock, AlertCircle, RefreshCw,
  ArrowUpRight, ArrowDownRight, Download
} from 'lucide-react';
import { useAuth } from '../../context/AuthContextFixed';
import { API_URL } from '../../api';
import HeaderAdmin from '../../components/HeaderAdmin';

export default function AdminEstadisticas() {
  const { token } = useAuth();
  
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_URL}/admin/estadisticas`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        setStats(data.data);
      } else {
        setError(data.message || 'Error al cargar estadísticas');
      }
    } catch (err) {
      console.error('Error:', err);
      setError('Error de conexión al cargar estadísticas');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (!stats) return;

    // Convertir objeto stats a formato CSV plano
    // Estructura: Categoria, Metrica, Valor, Detalle
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Categoria,Metrica,Valor,Detalle\n";

    // Totales
    csvContent += `Totales,Usuarios,${stats.totales?.usuarios || 0},\n`;
    csvContent += `Totales,Estudiantes,${stats.totales?.estudiantes || 0},\n`;
    csvContent += `Totales,Orientadores,${stats.totales?.orientadores || 0},\n`;

    // Tests
    csvContent += `Tests,Completados,${stats.tests?.completados || 0},\n`;
    csvContent += `Tests,En Progreso,${stats.tests?.en_progreso || 0},\n`;

    // Registros
    csvContent += `Registros,Hoy,${stats.registros?.hoy || 0},\n`;
    csvContent += `Registros,Semana,${stats.registros?.semana || 0},\n`;
    csvContent += `Registros,Mes,${stats.registros?.mes || 0},\n`;
    
    // Asignaciones
    csvContent += `Asignaciones,Con Orientador,${stats.asignaciones?.asignados || 0},\n`;
    csvContent += `Asignaciones,Sin Asignar,${stats.asignaciones?.sin_asignar || 0},\n`;

    // Verificación
    csvContent += `Verificacion,Verificados,${stats.verificacion?.verificados || 0},\n`;
    csvContent += `Verificacion,Pendientes,${stats.verificacion?.no_verificados || 0},\n`;

    // Top Profesiones
    if (stats.top_profesiones && stats.top_profesiones.length > 0) {
        stats.top_profesiones.forEach((p, index) => {
            csvContent += `Top Profesiones,${index + 1},${p.count},${p.profesion}\n`;
        });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `estadisticas_vocaccion_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Componente de tarjeta de estadística
  const StatCard = ({ icon: Icon, title, value, subtitle, color = 'cyan', trend }) => (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between">
        <div className={`p-3 rounded-xl bg-${color}-100`}>
          <Icon className={`w-6 h-6 text-${color}-600`} />
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-sm font-medium ${trend >= 0 ? 'text-green-600' : 'text-red-500'}`}>
            {trend >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div className="mt-4">
        <p className="text-3xl font-bold text-slate-800">{value}</p>
        <p className="text-sm text-slate-500 mt-1">{title}</p>
        {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-cyan-50">
        <HeaderAdmin />
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-slate-200 border-t-cyan-500"></div>
            <p className="mt-4 text-slate-500">Cargando estadísticas...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-cyan-50">
        <HeaderAdmin />
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-md mx-auto text-center bg-white rounded-2xl border border-slate-200 p-8">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-800 mb-2">Error al cargar</h2>
            <p className="text-slate-500 mb-6">{error}</p>
            <button
              onClick={fetchStats}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-cyan-500 text-white rounded-xl font-medium hover:bg-cyan-600 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-cyan-50">
      <HeaderAdmin />

      <main className="container mx-auto px-4 py-8">
        {/* Encabezado */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-linear-to-br from-cyan-500 to-teal-600 rounded-xl">
              <BarChart3 className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-800">Estadísticas</h1>
              <p className="text-slate-500">Métricas y datos de la plataforma</p>
            </div>
          </div>
          <button
            onClick={fetchStats}
            className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium transition-colors cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            Actualizar
          </button>
          
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl font-medium transition-colors ml-2 shadow-sm"
          >
            <Download className="w-4 h-4" />
            Exportar CSV
          </button>
        </div>

        {/* Tarjetas principales */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={Users}
            title="Total Usuarios"
            value={stats?.totales?.usuarios || 0}
            color="slate"
          />
          <StatCard
            icon={GraduationCap}
            title="Estudiantes"
            value={stats?.totales?.estudiantes || 0}
            color="cyan"
          />
          <StatCard
            icon={UserCheck}
            title="Orientadores"
            value={stats?.totales?.orientadores || 0}
            color="indigo"
          />
          <StatCard
            icon={CheckCircle}
            title="Tests Completados"
            value={stats?.tests?.completados || 0}
            color="green"
          />
        </div>

        {/* Grid de secciones */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Tests */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-cyan-500" />
              Estado de Tests
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-green-700 font-medium">Completados</span>
                </div>
                <span className="text-2xl font-bold text-green-600">{stats?.tests?.completados || 0}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-amber-50 rounded-xl">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-amber-500" />
                  <span className="text-amber-700 font-medium">En progreso</span>
                </div>
                <span className="text-2xl font-bold text-amber-600">{stats?.tests?.en_progreso || 0}</span>
              </div>
            </div>
          </div>

          {/* Registros por período */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-cyan-500" />
              Nuevos Registros
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <span className="text-slate-600">Hoy</span>
                <span className="font-bold text-slate-800">{stats?.registros?.hoy || 0}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <span className="text-slate-600">Esta semana</span>
                <span className="font-bold text-slate-800">{stats?.registros?.semana || 0}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-slate-600">Este mes</span>
                <span className="font-bold text-slate-800">{stats?.registros?.mes || 0}</span>
              </div>
            </div>
          </div>

          {/* Asignaciones */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-cyan-500" />
              Asignaciones
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-cyan-50 rounded-xl">
                <span className="text-cyan-700 font-medium">Con orientador</span>
                <span className="text-2xl font-bold text-cyan-600">{stats?.asignaciones?.asignados || 0}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-600 font-medium">Sin asignar</span>
                <span className="text-2xl font-bold text-slate-700">{stats?.asignaciones?.sin_asignar || 0}</span>
              </div>
              {/* Barra de progreso */}
              <div className="mt-2">
                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-linear-to-r from-cyan-500 to-teal-500 rounded-full transition-all"
                    style={{ 
                      width: `${stats?.totales?.estudiantes > 0 
                        ? ((stats?.asignaciones?.asignados || 0) / stats.totales.estudiantes * 100) 
                        : 0}%` 
                    }}
                  ></div>
                </div>
                <p className="text-xs text-slate-500 mt-1 text-right">
                  {stats?.totales?.estudiantes > 0 
                    ? Math.round((stats?.asignaciones?.asignados || 0) / stats.totales.estudiantes * 100)
                    : 0}% asignados
                </p>
              </div>
            </div>
          </div>

          {/* Verificación de cuentas */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-cyan-500" />
              Verificación de Email
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-green-700 font-medium">Verificados</span>
                </div>
                <span className="text-2xl font-bold text-green-600">{stats?.verificacion?.verificados || 0}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-xl">
                <div className="flex items-center gap-2">
                  <XCircle className="w-5 h-5 text-red-400" />
                  <span className="text-red-600 font-medium">Pendientes</span>
                </div>
                <span className="text-2xl font-bold text-red-500">{stats?.verificacion?.no_verificados || 0}</span>
              </div>
            </div>
          </div>

          {/* Top Profesiones */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 md:col-span-2">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-cyan-500" />
              Top Profesiones Elegidas
            </h3>
            {stats?.top_profesiones && stats.top_profesiones.length > 0 ? (
              <div className="space-y-3">
                {stats.top_profesiones.map((prof, index) => {
                  const maxCount = stats.top_profesiones[0]?.count || 1;
                  const percentage = (prof.count / maxCount) * 100;
                  
                  return (
                    <div key={index} className="relative">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-slate-700 flex items-center gap-2">
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            index === 0 ? 'bg-amber-100 text-amber-700' :
                            index === 1 ? 'bg-slate-200 text-slate-600' :
                            index === 2 ? 'bg-orange-100 text-orange-700' :
                            'bg-slate-100 text-slate-500'
                          }`}>
                            {index + 1}
                          </span>
                          {prof.profesion || 'Sin definir'}
                        </span>
                        <span className="text-sm text-slate-500">{prof.count} usuario{prof.count !== 1 ? 's' : ''}</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all ${
                            index === 0 ? 'bg-linear-to-r from-cyan-500 to-teal-500' :
                            index === 1 ? 'bg-linear-to-r from-slate-400 to-slate-500' :
                            'bg-linear-to-r from-slate-300 to-slate-400'
                          }`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">Aún no hay datos de profesiones</p>
              </div>
            )}
          </div>
        </div>

        {/* Gráfico de registros por mes */}
        <div className="mt-6 bg-white rounded-2xl border border-slate-200 p-6">
          <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-cyan-500" />
            Registros últimos 6 meses
          </h3>
          {stats?.registros?.por_mes && stats.registros.por_mes.length > 0 ? (
            <div className="flex items-end justify-between gap-4 h-48">
              {stats.registros.por_mes.map((item, index) => {
                const maxCount = Math.max(...stats.registros.por_mes.map(m => m.count), 1);
                const height = (item.count / maxCount) * 100;
                
                return (
                  <div key={index} className="flex-1 flex flex-col items-center gap-2">
                    <span className="text-sm font-bold text-slate-700">{item.count}</span>
                    <div className="w-full flex justify-center">
                      <div 
                        className="w-12 bg-linear-to-t from-cyan-500 to-teal-400 rounded-t-lg transition-all hover:from-cyan-600 hover:to-teal-500"
                        style={{ height: `${Math.max(height, 5)}%`, minHeight: '8px' }}
                      ></div>
                    </div>
                    <span className="text-xs text-slate-500 text-center">{item.mes}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <TrendingUp className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No hay datos de registros</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
