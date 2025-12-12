import React, { useEffect, useState } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Users, Clock, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export default function MetricsDashboard() {
  const [metricas, setMetricas] = useState(null);
  const [evolucion, setEvolucion] = useState([]);
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState(30);

  useEffect(() => {
    cargarMetricas();
  }, [periodo]);

  const cargarMetricas = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      // Cargar métricas generales
      const resMetricas = await fetch(`${API_URL}/metricas?days=${periodo}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      // Cargar evolución temporal
      const resEvolucion = await fetch(`${API_URL}/metricas/evolucion?days=${periodo}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      if (resMetricas.ok && resEvolucion.ok) {
        const dataMetricas = await resMetricas.json();
        const dataEvolucion = await resEvolucion.json();

        setMetricas(dataMetricas);
        setEvolucion(dataEvolucion.evolucion || []);
      }
    } catch (error) {
      console.error('Error cargando métricas:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!metricas) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">No hay datos disponibles</p>
      </div>
    );
  }

  const COLORS = ['#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#3b82f6'];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">📊 Dashboard de Métricas del Test</h1>
          <p className="text-gray-600">Análisis detallado del comportamiento y rendimiento del test vocacional</p>
          
          {/* Selector de período */}
          <div className="mt-4 flex gap-2">
            {[7, 30, 90].map(days => (
              <button
                key={days}
                onClick={() => setPeriodo(days)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  periodo === days
                    ? 'bg-purple-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {days} días
              </button>
            ))}
          </div>
        </div>

        {/* Métricas principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            icon={<CheckCircle className="w-6 h-6" />}
            title="Tests Completados"
            value={metricas.metricas.tests_completados}
            subtitle={`de ${metricas.metricas.total_tests} totales`}
            color="green"
          />
          <MetricCard
            icon={<TrendingUp className="w-6 h-6" />}
            title="Tasa de Completación"
            value={`${metricas.metricas.tasa_completacion}%`}
            subtitle="Usuarios que terminan"
            color="purple"
          />
          <MetricCard
            icon={<Clock className="w-6 h-6" />}
            title="Tiempo Promedio"
            value={`${metricas.metricas.tiempo_promedio_minutos} min`}
            subtitle="Duración del test"
            color="blue"
          />
          <MetricCard
            icon={<RefreshCw className="w-6 h-6" />}
            title="Tasa de Regeneración"
            value={`${metricas.metricas.tasa_regeneracion}%`}
            subtitle="Preguntas regeneradas"
            color="orange"
          />
        </div>

        {/* Gráficas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Evolución temporal */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Evolución Temporal</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={evolucion}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="fecha" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="total" stroke="#8b5cf6" name="Total Tests" />
                <Line type="monotone" dataKey="completados" stroke="#10b981" name="Completados" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Áreas más detectadas */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Áreas Más Detectadas</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={metricas.graficas.areas_detectadas}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ area_detected, count }) => `${area_detected}: ${count}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                  nameKey="area_detected"
                >
                  {metricas.graficas.areas_detectadas.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tiempo por pregunta */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Tiempo Promedio por Pregunta</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={metricas.graficas.tiempo_por_pregunta}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="question_number" label={{ value: 'Pregunta', position: 'insideBottom', offset: -5 }} />
              <YAxis label={{ value: 'Segundos', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Bar dataKey="avg_time" fill="#8b5cf6" name="Tiempo Promedio (seg)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Información adicional */}
        {metricas.metricas.pregunta_mas_regenerada && (
          <div className="mt-6 bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-yellow-400" />
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  <strong>Pregunta con más regeneraciones:</strong> Pregunta #{metricas.metricas.pregunta_mas_regenerada.question_number} 
                  ({metricas.metricas.pregunta_mas_regenerada.count} regeneraciones)
                </p>
                <p className="text-xs text-yellow-600 mt-1">
                  Considera revisar esta pregunta para mejorar su claridad o relevancia.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Componente de tarjeta de métrica
function MetricCard({ icon, title, value, subtitle, color }) {
  const colorClasses = {
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    blue: 'bg-blue-100 text-blue-600',
    orange: 'bg-orange-100 text-orange-600'
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          {icon}
        </div>
      </div>
      <h3 className="text-sm font-medium text-gray-600 mb-1">{title}</h3>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
    </div>
  );
}
