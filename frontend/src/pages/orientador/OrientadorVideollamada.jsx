import React, { useState, useEffect } from 'react';
import { 
  Video, 
  Clock, 
  Plus,
  X,
  Check,
  Crown,
  Copy,
  Users,
  Calendar,
  AlertCircle,
  CalendarDays
} from 'lucide-react';
import { useAuth } from '../../context/AuthContextFixed';
import { API_URL } from '../../api';
import HeaderOrientador from '../../components/HeaderOrientador';

/**
 * OrientadorVideollamada
 * 
 * Página para gestionar videollamadas con estudiantes Pro Plus.
 * Muestra próximas sesiones (reservas) e historial.
 * Permite programar nuevas sesiones o iniciar inmediatas.
 */
const OrientadorVideollamada = () => {
  const { user, token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [citas, setCitas] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [estudiantes, setEstudiantes] = useState([]);
  const [copiedLink, setCopiedLink] = useState(null);
  const [modoProgramar, setModoProgramar] = useState(false); // false: Ahora, true: Programar

  const [nuevaCita, setNuevaCita] = useState({
    estudiante_id: '',
    duracion: 30,
    notas: '',
    fecha: '',
    hora: ''
  });

  useEffect(() => {
    fetchCitas();
    fetchEstudiantes();
  }, []);

  const fetchCitas = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/orientador/videollamadas`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
      });
      const data = await response.json();
      setCitas(data.data || []);
    } catch (err) {
      console.error('Error al cargar videollamadas:', err);
      setCitas([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchEstudiantes = async () => {
    try {
      const response = await fetch(`${API_URL}/orientador/chat/estudiantes`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
      });
      const data = await response.json();
      setEstudiantes(data.data || []);
    } catch (err) {
      console.error('Error al cargar estudiantes:', err);
      setEstudiantes([]);
    }
  };

  const handleCrearVideollamada = async () => {
    if (!nuevaCita.estudiante_id) return;
    
    try {
      let fechaEnvio, horaEnvio;

      if (modoProgramar) {
        if (!nuevaCita.fecha || !nuevaCita.hora) {
            alert("Por favor selecciona una fecha y una hora.");
            return;
        }
        fechaEnvio = nuevaCita.fecha;
        horaEnvio = nuevaCita.hora;
      } else {
        const ahora = new Date();
        fechaEnvio = ahora.getFullYear() + '-' + String(ahora.getMonth()+1).padStart(2,'0') + '-' + String(ahora.getDate()).padStart(2,'0');
        horaEnvio = String(ahora.getHours()).padStart(2,'0') + ':' + String(ahora.getMinutes()).padStart(2,'0');
      }

      const response = await fetch(`${API_URL}/orientador/videollamadas`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ 
            estudiante_id: nuevaCita.estudiante_id,
            duracion: nuevaCita.duracion,
            notas: nuevaCita.notas,
            fecha: fechaEnvio, 
            hora: horaEnvio 
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
          // Si NO es programada (es inmediata), abrir Jitsi
          if (!modoProgramar) {
            const estudiante = estudiantes.find(e => e.id == nuevaCita.estudiante_id);
            const timestamp = Date.now();
            const random = Math.random().toString(36).substring(2, 7).toUpperCase();
            const roomName = `Vocaccion-${timestamp}-${random}`;
            const enlaceJitsi = `https://meet.jit.si/${roomName}?userInfo.displayName=${encodeURIComponent(user?.nombre || 'Orientador')}`;
            window.open(enlaceJitsi, '_blank');
          } else {
              alert("Sesión programada correctamente.");
          }
          
          setShowModal(false);
          setNuevaCita({ estudiante_id: '', duracion: 30, notas: '', fecha: '', hora: '' });
          fetchCitas();
      } else {
          alert(data.message || 'Error al crear la videollamada');
      }
    } catch (err) {
      console.error('Error al crear videollamada:', err);
      alert('Error de conexión');
    }
  };

  const handleCancelarCita = async (citaId) => {
    if (!window.confirm('¿Estás seguro de cancelar esta videollamada?')) return;
    try {
      await fetch(`${API_URL}/orientador/videollamadas/${citaId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
      });
      fetchCitas();
    } catch (err) {
      console.error('Error al cancelar videollamada:', err);
    }
  };

  const copyToClipboard = (enlace, id) => {
    navigator.clipboard.writeText(enlace);
    setCopiedLink(id);
    setTimeout(() => setCopiedLink(null), 2000);
  };

  const generarEnlaceJitsi = (cita) => {
    const roomName = `Vocaccion-${cita.id}-${cita.estudiante?.nombre?.replace(/\s+/g, '') || 'Sesion'}`;
    return `https://meet.jit.si/${roomName}?userInfo.displayName=${encodeURIComponent(user?.nombre || 'Orientador')}`;
  };

  const iniciarVideollamada = (cita) => {
    // Usar el enlace guardado si existe, si no generar uno de Jitsi on-the-fly (fallback)
    const enlace = cita.enlace || generarEnlaceJitsi(cita);
    window.open(enlace, '_blank');
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
  };

  // Separar citas
  const now = new Date();
  
  const proximasCitas = citas.filter(c => {
    if (c.estado !== 'programada') return false;
    const fechaCita = new Date(`${c.fecha}T${c.hora}`);
    return fechaCita > now;
  });

  const historialCitas = citas.filter(c => {
    if (c.estado !== 'programada') return true;
    const fechaCita = new Date(`${c.fecha}T${c.hora}`);
    return fechaCita <= now;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-orange-50 via-amber-50 to-yellow-50">
        <HeaderOrientador />
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-600 font-medium">Cargando videollamadas...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-orange-50 via-amber-50 to-yellow-50">
      <HeaderOrientador />
      
      <div className="bg-white/80 backdrop-blur-sm border-b border-orange-100">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                <div className="p-2 bg-linear-to-br from-orange-500 to-amber-500 rounded-xl">
                  <Video className="h-6 w-6 text-white" />
                </div>
                Videollamadas
                <span className="ml-2 px-3 py-1 bg-amber-100 text-amber-700 text-sm font-medium rounded-full flex items-center gap-1">
                  <Crown className="h-4 w-4" /> Pro Plus
                </span>
              </h1>
              <p className="text-gray-500 mt-1">Gestiona las sesiones de orientación con tus estudiantes.</p>
            </div>
            <button 
                onClick={() => { setShowModal(true); setModoProgramar(false); }} 
                className="flex items-center gap-2 bg-linear-to-r from-orange-500 to-amber-500 text-white px-6 py-3 rounded-xl hover:from-orange-600 hover:to-amber-600 transition-all shadow-lg font-medium cursor-pointer"
            >
              <Plus className="h-5 w-5" />
              Nueva Videollamada
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-orange-100">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-100 rounded-xl"><Calendar className="h-6 w-6 text-orange-600" /></div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{proximasCitas.length}</p>
                <p className="text-sm text-gray-500">Próximas Sesiones</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-orange-100">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-xl"><Check className="h-6 w-6 text-green-600" /></div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{citas.filter(c => c.estado === 'completada').length}</p>
                <p className="text-sm text-gray-500">Completadas</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-orange-100">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-100 rounded-xl"><Users className="h-6 w-6 text-amber-600" /></div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{estudiantes.length}</p>
                <p className="text-sm text-gray-500">Estudiantes Asignados</p>
              </div>
            </div>
          </div>
        </div>

        {/* PRÓXIMAS SESIONES */}
        <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Calendar className="h-6 w-6 text-orange-600" />
                Próximas Sesiones Programadas
            </h2>
            
            {proximasCitas.length > 0 ? (
                <div className="bg-white rounded-2xl shadow-lg border border-orange-200 overflow-hidden divide-y divide-gray-100">
                    {proximasCitas.map((cita) => (
                        <div key={cita.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between hover:bg-orange-50/30 transition-colors gap-4">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-full bg-linear-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white font-bold text-xl shadow-md">
                                    {cita.estudiante?.nombre?.charAt(0) || 'E'}
                                </div>
                                <div>
                                    <h4 className="font-bold text-lg text-gray-800">{cita.estudiante?.nombre}</h4>
                                    <p className="text-sm text-orange-600 font-medium flex items-center gap-2">
                                        <Calendar className="h-4 w-4" />
                                        {formatDate(cita.fecha)} - {cita.hora.slice(0, 5)}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full border border-gray-200 flex items-center gap-1">
                                            <Clock className="w-3 h-3" /> {cita.duracion} min
                                        </span>
                                        {cita.notas && (
                                            <span className="text-sm text-gray-500 italic max-w-md truncate">"{cita.notas}"</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-3">
                                <button 
                                    onClick={() => iniciarVideollamada(cita)} 
                                    className="flex items-center gap-2 px-5 py-2.5 bg-linear-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all font-semibold shadow-md cursor-pointer"
                                >
                                    <Video className="h-4 w-4" /> Unirse
                                </button>
                                <button 
                                    onClick={() => copyToClipboard(cita.enlace || generarEnlaceJitsi(cita), cita.id)} 
                                    className="p-2.5 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded-xl transition-colors border border-gray-200 cursor-pointer" 
                                    title="Copiar enlace"
                                >
                                    {copiedLink === cita.id ? <Check className="h-5 w-5 text-green-500" /> : <Copy className="h-5 w-5" />}
                                </button>
                                <button 
                                    onClick={() => handleCancelarCita(cita.id)} 
                                    className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors border border-transparent hover:border-red-100 cursor-pointer" 
                                    title="Cancelar"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Calendar className="h-8 w-8 text-gray-300" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-600">No hay sesiones programadas</h3>
                    <p className="text-gray-400">Tus estudiantes (o tú mismo) pueden agendar nuevas citas.</p>
                </div>
            )}
        </div>

        {/* HISTORIAL */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-700 flex items-center gap-2">
              <Clock className="h-5 w-5 text-gray-400" />
              Historial de Videollamadas
            </h2>
          </div>
          
          {historialCitas.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {historialCitas.map((cita) => (
                <div key={cita.id} className="p-4 md:p-6 flex flex-col md:flex-row md:items-center justify-between hover:bg-gray-50 transition-colors opacity-75 hover:opacity-100">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white bg-gray-400">
                      {cita.estudiante?.nombre?.charAt(0) || 'E'}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-700">{cita.estudiante?.nombre || 'Estudiante'}</h4>
                      <p className="text-sm text-gray-500 flex items-center gap-2">
                        {formatDate(cita.fecha)} - {cita.hora}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 md:mt-0">
                    {cita.estado === 'completada' && (
                      <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full flex items-center gap-1 w-fit">
                        <Check className="h-3 w-3" /> Completada
                      </span>
                    )}
                    {cita.estado === 'cancelada' && (
                      <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full flex items-center gap-1 w-fit">
                        <X className="h-3 w-3" /> Cancelada
                      </span>
                    )}
                    {cita.estado === 'programada' && (
                      <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-bold rounded-full flex items-center gap-1 w-fit">
                        <Clock className="h-3 w-3" /> No completada
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-gray-400">
              <p>No hay historial de videollamadas anteriores.</p>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-fade-in">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Video className="h-5 w-5 text-orange-500" />Nueva Videollamada
              </h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            
            {/* TABS PROGRAMAR / INMEDIATA */}
            <div className="flex border-b border-gray-100">
                <button 
                  onClick={() => setModoProgramar(false)}
                  className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 cursor-pointer ${!modoProgramar ? 'border-orange-500 text-orange-600 bg-orange-50/50' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                  Iniciar Ahora
                </button>
                <button 
                  onClick={() => setModoProgramar(true)}
                  className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 cursor-pointer ${modoProgramar ? 'border-orange-500 text-orange-600 bg-orange-50/50' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                  Programar Sesión
                </button>
            </div>

            <div className="p-6 space-y-4">
              
              {!modoProgramar && (
                  <div className="bg-amber-50 p-3 rounded-lg flex gap-2">
                    <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                    <p className="text-sm text-amber-700">Se creará un enlace de Jitsi y se abrirá inmediatamente.</p>
                  </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Seleccionar Estudiante</label>
                <select value={nuevaCita.estudiante_id} onChange={(e) => setNuevaCita({...nuevaCita, estudiante_id: e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500">
                  <option value="">Elegir estudiante...</option>
                  {estudiantes.map(est => (
                    <option key={est.id} value={est.id}>{est.nombre} - {est.email}</option>
                  ))}
                </select>
              </div>

              {modoProgramar && (
                  <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Fecha</label>
                        <input 
                            type="date" 
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                            min={new Date().toISOString().split('T')[0]}
                            value={nuevaCita.fecha}
                            onChange={(e) => setNuevaCita({...nuevaCita, fecha: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Hora</label>
                        <input 
                            type="time" 
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                            value={nuevaCita.hora}
                            onChange={(e) => setNuevaCita({...nuevaCita, hora: e.target.value})}
                        />
                      </div>
                  </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Duración estimada</label>
                <div className="flex gap-2">
                  {[15, 30, 45, 60].map(min => (
                    <button key={min} onClick={() => setNuevaCita({...nuevaCita, duracion: min})} className={`flex-1 py-2 rounded-lg font-medium transition-all cursor-pointer ${nuevaCita.duracion === min ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                      {min} min
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notas</label>
                <textarea value={nuevaCita.notas} onChange={(e) => setNuevaCita({...nuevaCita, notas: e.target.value})} placeholder="Tema a tratar..." rows={3} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none" />
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 flex gap-3">
              <button onClick={() => setShowModal(false)} className="flex-1 px-4 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium cursor-pointer">Cancelar</button>
              <button 
                  onClick={handleCrearVideollamada} 
                  disabled={!nuevaCita.estudiante_id || (modoProgramar && (!nuevaCita.fecha || !nuevaCita.hora))} 
                  className="flex-1 px-4 py-3 bg-linear-to-r from-orange-500 to-amber-500 text-white rounded-xl hover:from-orange-600 hover:to-amber-600 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 enabled:cursor-pointer"
              >
                {modoProgramar ? (
                    <><CalendarDays className="h-5 w-5" /> Programar</>
                ) : (
                    <><Video className="h-5 w-5" /> Iniciar Ya</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrientadorVideollamada;
