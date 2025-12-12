import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, Video, XCircle, AlertCircle, ArrowLeft, Trash2, Copy, Check } from 'lucide-react';
import Header from '../../components/Header';
import { useAuth } from '../../context/AuthContextFixed';
import { API_URL } from '../../api';

export default function MisReservas() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [reservas, setReservas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchReservas();
  }, []);

  const fetchReservas = async () => {
    try {
      const response = await fetch(`${API_URL}/estudiante/reservas`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      const data = await response.json();
      if (data.success) {
        setReservas(data.data);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Error cargando reservas');
    } finally {
      setLoading(false);
    }
  };

  const cancelarReserva = async (id) => {
    if (!window.confirm('¿Estás seguro de que quieres cancelar esta sesión?')) return;

    try {
      const response = await fetch(`${API_URL}/estudiante/reservas/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        fetchReservas(); // Recargar lista
      } else {
        alert(data.message || 'No se pudo cancelar la reserva');
      }
    } catch (err) {
      alert('Error al conectar con el servidor');
    }
  };

  const EstadoBadge = ({ estado }) => {
    const styles = {
      programada: 'bg-blue-100 text-blue-800',
      en_curso: 'bg-green-100 text-green-800',
      completada: 'bg-gray-100 text-gray-800',
      cancelada: 'bg-red-100 text-red-800'
    };
    
    const labels = {
      programada: 'Programada',
      en_curso: 'En Curso',
      completada: 'Completada',
      cancelada: 'Cancelada'
    };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${styles[estado] || styles.programada}`}>
        {labels[estado] || estado}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-gray-800">Mis Sesiones</h1>
            <button
                onClick={() => navigate('/reservar')}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-lg cursor-pointer"
            >
                <Calendar className="w-5 h-5" />
                Nueva Reserva
            </button>
        </div>

        {loading ? (
           <div className="flex justify-center py-12">
             <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
           </div>
        ) : reservas.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl shadow-sm">
                <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-gray-900">No tienes sesiones reservadas</h3>
                <p className="text-gray-500 mt-2 mb-6">Agenda una cita con tu orientador para recibir ayuda personalizada.</p>
                <button
                    onClick={() => navigate('/reservar')}
                    className="text-blue-600 font-medium hover:text-blue-800"
                >
                    Reservar ahora &rarr;
                </button>
            </div>
        ) : (
            <div className="grid gap-6">
                {reservas.map((reserva) => (
                    <div key={reserva.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow border border-gray-100">
                        <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-blue-50 rounded-xl">
                                    <Video className="w-6 h-6 text-blue-600" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-bold text-gray-800">Sesión con {reserva.orientador_nombre}</h3>
                                        <EstadoBadge estado={reserva.estado} />
                                    </div>
                                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 text-sm text-gray-500">
                                        <div className="flex items-center gap-1">
                                            <Calendar className="w-4 h-4" />
                                            {new Date(reserva.fecha).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Clock className="w-4 h-4" />
                                            {reserva.hora.slice(0, 5)} ({reserva.duracion} min)
                                        </div>
                                    </div>
                                    {reserva.notas && (
                                        <p className="mt-2 text-sm text-gray-600 italic bg-gray-50 p-2 rounded-lg border border-gray-100">
                                            "{reserva.notas}"
                                        </p>
                                    )}
                                    {reserva.enlace && (reserva.estado === 'programada' || reserva.estado === 'en_curso') && (
                                        <div className="mt-4 flex flex-wrap gap-2">
                                            <a 
                                                href={reserva.enlace} 
                                                target="_blank" 
                                                rel="noopener noreferrer" 
                                                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl shadow-md hover:bg-blue-700 hover:shadow-lg transition-all font-semibold cursor-pointer"
                                            >
                                                <Video className="w-5 h-5" />
                                                Unirse a la Videollamada
                                            </a>
                                            <button 
                                                onClick={() => {
                                                    navigator.clipboard.writeText(reserva.enlace);
                                                    alert('Enlace copiado');
                                                }}
                                                className="p-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-500 hover:text-blue-600 transition-colors cursor-pointer"
                                                title="Copiar enlace"
                                            >
                                                <Copy className="w-5 h-5" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {reserva.estado === 'programada' && (
                                <button
                                    onClick={() => cancelarReserva(reserva.id)}
                                    className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm font-medium flex items-center gap-2 border border-transparent hover:border-red-100 cursor-pointer"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Cancelar
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        )}
      </div>
    </div>
  );
}
