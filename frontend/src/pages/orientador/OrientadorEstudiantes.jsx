import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, Search, Eye, MessageCircle, BarChart3, 
  CheckCircle, Clock, AlertCircle, ChevronLeft, ChevronRight, UserMinus,
  GraduationCap, Mail, Calendar, Filter, RefreshCw, FileText, Briefcase, Award, Globe, Heart
} from 'lucide-react';
import { useAuth } from '../../context/AuthContextFixed';
import { API_URL } from '../../api';
import HeaderOrientador from '../../components/HeaderOrientador';

/**
 * OrientadorEstudiantes
 * 
 * Página para ver y gestionar los estudiantes asignados al orientador.
 * Muestra información del estudiante, estado del test y permite acceder
 * al chat (solo para estudiantes Pro Plus).
 * 
 * @component
 */
export default function OrientadorEstudiantes() {
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const STORAGE_URL = API_URL.replace('/api', '/storage');
  
  const [estudiantes, setEstudiantes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTest, setFilterTest] = useState('todos'); // todos, completado, pendiente
  
  // Modal de detalle
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [studentDetail, setStudentDetail] = useState(null);
  
  // Modal de perfil completo
  const [showProfileModal, setShowProfileModal] = useState(false);
  
  // Modal de asignación
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [estudiantesDisponibles, setEstudiantesDisponibles] = useState([]);
  const [loadingModal, setLoadingModal] = useState(false);
  const [asignando, setAsignando] = useState(null);
  const [assignSearchTerm, setAssignSearchTerm] = useState('');
  const [filterPlanAsignacion, setFilterPlanAsignacion] = useState('todos');
  
  // Notificación toast
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    fetchEstudiantes();
  }, []);

  const fetchEstudiantes = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/orientador/estudiantes`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      const data = await response.json();
      
      if (data.success) {
        setEstudiantes(data.data || []);
      } else {
        setError('Error al cargar estudiantes');
      }
    } catch (err) {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentDetail = async (id) => {
    setLoadingDetail(true);
    try {
      const response = await fetch(`${API_URL}/orientador/estudiantes/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      const data = await response.json();
      
      if (data.success) {
        setStudentDetail(data.data);
      }
    } catch (err) {
    } finally {
      setLoadingDetail(false);
    }
  };

  const openDetailModal = (student) => {
    setSelectedStudent(student);
    setShowDetailModal(true);
    fetchStudentDetail(student.id);
  };

  const openProfileModal = (student) => {
    setSelectedStudent(student);
    setShowProfileModal(true);
    fetchStudentDetail(student.id);
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const fetchEstudiantesDisponibles = async () => {
    try {
      setLoadingModal(true);
      const response = await fetch(`${API_URL}/orientador/estudiantes-disponibles`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
      });
      const data = await response.json();
      setEstudiantesDisponibles(data.data || []);
    } catch (err) {
    } finally {
      setLoadingModal(false);
    }
  };

  const asignarEstudiante = async (estudianteId) => {
    try {
      setAsignando(estudianteId);
      const response = await fetch(`${API_URL}/orientador/asignar-estudiante`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`, 
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ estudiante_id: estudianteId })
      });
      
      const data = await response.json();
      
      if (data.success) {
        await fetchEstudiantes();
        await fetchEstudiantesDisponibles();
        showNotification(data.message || 'Estudiante asignado correctamente', 'success');
      } else {
        showNotification(data.message || 'Error al asignar estudiante', 'error');
      }
    } catch (err) {
      showNotification('Error al asignar estudiante', 'error');
    } finally {
      setAsignando(null);
    }
  };

  const desasignarEstudiante = async (estudianteId) => {
    try {
      setAsignando(estudianteId);
      const response = await fetch(`${API_URL}/orientador/desasignar-estudiante`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`, 
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ estudiante_id: estudianteId })
      });
      
      const data = await response.json();
      
      if (data.success) {
        await fetchEstudiantes();
        await fetchEstudiantesDisponibles();
        showNotification(data.message || 'Estudiante desasignado correctamente', 'success');
      } else {
        showNotification(data.message || 'Error al desasignar estudiante', 'error');
      }
    } catch (err) {
      showNotification('Error al desasignar estudiante', 'error');
    } finally {
      setAsignando(null);
    }
  };

  // Filtrar estudiantes
  const filteredStudents = estudiantes.filter(est => {
    const matchesSearch = 
      est.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      est.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = 
      filterTest === 'todos' ||
      (filterTest === 'completado' && est.test_completado) ||
      (filterTest === 'pendiente' && !est.test_completado);
    
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <>
        <HeaderOrientador />
        <div className="min-h-screen bg-linear-to-br from-orange-50 via-white to-amber-50 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-orange-200 border-t-orange-600"></div>
            <p className="mt-4 text-gray-600 font-medium">Cargando estudiantes...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-orange-50 via-white to-amber-50">
      <HeaderOrientador />
      
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-orange-500 to-amber-500 flex items-center justify-center">
              <Users className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Mis Estudiantes</h1>
              <p className="text-gray-600">Gestiona y supervisa a tus estudiantes asignados</p>
            </div>
          </div>
          <button
            onClick={() => {
              setShowAssignModal(true);
              fetchEstudiantesDisponibles();
            }}
            className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-xl hover:bg-orange-600 transition-all shadow-lg cursor-pointer"
          >
            <Users className="h-4 w-4" />
            Asignar Estudiantes
          </button>
        </div>

        {/* Barra de búsqueda y filtros */}
        <div className="bg-white rounded-2xl shadow-sm border border-orange-100 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Búsqueda */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nombre o email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
            
            {/* Filtro de estado */}
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={filterTest}
                onChange={(e) => setFilterTest(e.target.value)}
                className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="todos">Todos</option>
                <option value="completado">Test completado</option>
                <option value="pendiente">Test pendiente</option>
              </select>
            </div>

            {/* Contador */}
            <div className="flex items-center px-4 py-2 bg-orange-100 rounded-xl">
              <span className="text-orange-700 font-semibold">
                {filteredStudents.length} estudiante{filteredStudents.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>

        {/* Lista de estudiantes */}
        {error ? (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
            <p className="text-red-700">{error}</p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="bg-white border border-orange-100 rounded-2xl p-12 text-center">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No hay estudiantes</h3>
            <p className="text-gray-500">
              {searchTerm || filterTest !== 'todos' 
                ? 'No se encontraron estudiantes con esos criterios'
                : 'Aún no tienes estudiantes asignados'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStudents.map((estudiante) => (
              <div
                key={estudiante.id}
                className="bg-white rounded-2xl shadow-sm border border-orange-100 overflow-hidden hover:shadow-lg transition-all duration-300 group"
              >
                {/* Header de la card */}
                <div className="bg-linear-to-r from-orange-500 to-amber-500 p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-lg overflow-hidden">
                      {estudiante.profile_image ? (
                        <img 
                          src={`${STORAGE_URL}/${estudiante.profile_image}`} 
                          alt={estudiante.nombre} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        estudiante.nombre?.charAt(0).toUpperCase() || 'E'
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white truncate">{estudiante.nombre}</h3>
                      <p className="text-orange-100 text-sm truncate">{estudiante.email}</p>
                    </div>
                  </div>
                </div>

                {/* Contenido */}
                <div className="p-4 space-y-3">
                  {/* Estado del test */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Estado del test:</span>
                    {estudiante.test_completado ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm font-medium">
                        <CheckCircle className="w-4 h-4" />
                        Completado
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-yellow-100 text-yellow-700 text-sm font-medium">
                        <Clock className="w-4 h-4" />
                        Pendiente
                      </span>
                    )}
                  </div>

                  {/* Fecha de asignación */}
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Calendar className="w-4 h-4" />
                    <span>Asignado: {new Date(estudiante.fecha_asignacion).toLocaleDateString('es-ES')}</span>
                  </div>

                  {/* Plan del estudiante */}
                  {estudiante.plan && (
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-lg text-xs font-bold uppercase tracking-wide ${
                        estudiante.plan === 'pro_plus' || estudiante.plan === 'Pro Plus'
                          ? 'bg-purple-100 text-purple-700' 
                          : estudiante.plan === 'pro' || estudiante.plan === 'Pro'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-600'
                      }`}>
                        {estudiante.plan === 'pro_plus' || estudiante.plan === 'Pro Plus' ? '⭐ Pro Plus' : 
                         estudiante.plan === 'pro' || estudiante.plan === 'Pro' ? 'Pro' : 'Gratuito'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Acciones */}
                <div className="border-t border-gray-100 p-4 flex gap-2">
                  <button
                    onClick={() => openDetailModal(estudiante)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-orange-50 text-orange-600 rounded-xl hover:bg-orange-100 transition-colors font-medium cursor-pointer"
                  >
                    <Eye className="w-4 h-4" />
                    Ver detalle
                  </button>
                  
                  <button
                    onClick={() => openProfileModal(estudiante)}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors cursor-pointer"
                    title="Ver perfil completo"
                  >
                    <FileText className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => navigate(`/orientador/analisis?estudiante=${estudiante.id}`)}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-amber-50 text-amber-600 rounded-xl hover:bg-amber-100 transition-colors cursor-pointer"
                    title="Ver análisis"
                  >
                    <BarChart3 className="w-4 h-4" />
                  </button>
                  
                  <button
                    onClick={() => navigate(`/orientador/chat?estudiante=${estudiante.id}`)}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-green-50 text-green-600 rounded-xl hover:bg-green-100 transition-colors cursor-pointer"
                    title="Abrir chat"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modal de detalle */}
      {showDetailModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header del modal */}
            <div className="bg-linear-to-r from-orange-500 to-amber-500 p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-2xl overflow-hidden">
                    {selectedStudent?.profile_image ? (
                        <img 
                          src={`${STORAGE_URL}/${selectedStudent.profile_image}`} 
                          alt={selectedStudent.nombre} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        selectedStudent?.nombre?.charAt(0).toUpperCase() || 'E'
                      )}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">{selectedStudent?.nombre}</h2>
                    <p className="text-orange-100">{selectedStudent?.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-white/80 hover:text-white text-2xl font-bold"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Contenido del modal */}
            <div className="p-6">
              {loadingDetail ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-orange-200 border-t-orange-600"></div>
                  <p className="mt-2 text-gray-500">Cargando información...</p>
                </div>
              ) : studentDetail ? (
                <div className="space-y-6">
                  {/* Información del estudiante */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <GraduationCap className="w-5 h-5 text-orange-500" />
                      Información del Estudiante
                    </h3>
                    <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                      {studentDetail.estudiante?.perfil && (
                        <p><span className="text-gray-500">Nombre completo:</span> <span className="font-medium">{studentDetail.estudiante.perfil.nombre} {studentDetail.estudiante.perfil.apellidos}</span></p>
                      )}
                      <p><span className="text-gray-500">Email:</span> <span className="font-medium">{studentDetail.estudiante?.email}</span></p>
                      <p><span className="text-gray-500">Registrado:</span> <span className="font-medium">{new Date(studentDetail.estudiante?.created_at).toLocaleDateString('es-ES')}</span></p>
                      <p><span className="text-gray-500">Asignado:</span> <span className="font-medium">{new Date(studentDetail.asignacion?.fecha_asignacion).toLocaleDateString('es-ES')}</span></p>
                      {studentDetail.asignacion?.notas && (
                        <p><span className="text-gray-500">Notas:</span> <span className="font-medium">{studentDetail.asignacion.notas}</span></p>
                      )}
                      
                      <div className="pt-2 mt-2 border-t border-gray-200 flex items-center justify-between">
                        <span className="text-gray-500">Plan actual:</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                          studentDetail.plan === 'pro_plus' || studentDetail.plan === 'Pro Plus'
                            ? 'bg-purple-100 text-purple-700 ring-1 ring-purple-200' 
                            : studentDetail.plan === 'pro' || studentDetail.plan === 'Pro'
                              ? 'bg-blue-100 text-blue-700 ring-1 ring-blue-200'
                              : 'bg-gray-100 text-gray-600 ring-1 ring-gray-200'
                        }`}>
                          {studentDetail.plan === 'pro_plus' ? 'Pro Plus' : studentDetail.plan || 'Gratuito'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Estado del test */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-amber-500" />
                      Estado del Test Vocacional
                    </h3>
                    {studentDetail.test_session ? (
                      <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                          <span className="font-semibold text-green-700">Test Completado</span>
                        </div>
                        <p className="text-sm text-green-600">
                          Completado el: {new Date(studentDetail.test_session.completed_at).toLocaleDateString('es-ES')}
                        </p>
                      </div>
                    ) : (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                        <div className="flex items-center gap-2">
                          <Clock className="w-5 h-5 text-yellow-600" />
                          <span className="font-semibold text-yellow-700">Test Pendiente</span>
                        </div>
                        <p className="text-sm text-yellow-600 mt-1">
                          El estudiante aún no ha completado el test vocacional
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Resultados del test */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Resultados del Test</h3>
                    {studentDetail.test_result ? (
                      <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                        {studentDetail.profesion_elegida ? (
                          <div>
                            <p className="text-sm text-gray-600 mb-3 font-medium">Profesión elegida:</p>
                            <div className="flex items-center gap-3 bg-white p-4 rounded-lg border-2 border-orange-300">
                              <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-500 rounded-full flex items-center justify-center">
                                <GraduationCap className="h-6 w-6 text-white" />
                              </div>
                              <div className="flex-1">
                                <p className="text-lg font-bold text-gray-900">{studentDetail.profesion_elegida}</p>
                                <p className="text-sm text-gray-500">Objetivo profesional del estudiante</p>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-4">
                            <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                            <p className="text-gray-500">El estudiante aún no ha seleccionado una profesión</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 text-center">
                        <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-600 font-medium">El estudiante aún no ha realizado el test vocacional</p>
                        <p className="text-sm text-gray-500 mt-1">Los resultados aparecerán una vez complete el test</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No se pudo cargar la información</p>
              )}
            </div>

            {/* Footer del modal */}
            <div className="border-t border-gray-100 p-4 flex gap-3">
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  navigate(`/orientador/chat?estudiante=${selectedStudent?.id}`);
                }}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors font-semibold cursor-pointer"
              >
                <MessageCircle className="w-5 h-5" />
                Abrir Chat
              </button>
              {studentDetail?.test_result && (
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    navigate(`/orientador/analisis?estudiante=${selectedStudent?.id}`);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors font-semibold cursor-pointer"
                >
                  <BarChart3 className="w-5 h-5" />
                  Ver Análisis
                </button>
              )}
              <button
                 onClick={() => {
                    desasignarEstudiante(selectedStudent.id);
                    setShowDetailModal(false);
                 }}
                 className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl transition-colors font-semibold cursor-pointer"
                 title="Liberar estudiante"
              >
                <UserMinus className="w-5 h-5" />
                Liberar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de asignación de estudiantes */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
            {/* Header del Modal */}
            <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Users className="h-6 w-6" />
                Asignar Estudiantes
              </h2>
              <button
                onClick={() => setShowAssignModal(false)}
                className="text-white/80 hover:text-white text-2xl font-bold transition-colors cursor-pointer"
              >
                ×
              </button>
            </div>

            {/* Contenido del modal */}
            <div className="bg-gray-50 p-4 border-b border-gray-100 flex flex-col md:flex-row gap-3">
               <div className="relative flex-1">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                 <input
                   type="text"
                   placeholder="Buscar estudiante..."
                   value={assignSearchTerm}
                   onChange={(e) => setAssignSearchTerm(e.target.value)}
                   className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-hidden bg-white"
                 />
               </div>
               <select
                  value={filterPlanAsignacion}
                  onChange={(e) => setFilterPlanAsignacion(e.target.value)}
                  className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-hidden bg-white"
               >
                  <option value="todos">Todos los planes</option>
                  <option value="pro_plus">Pro Plus</option>
                  <option value="pro">Pro</option>
                  <option value="gratuito">Gratuito</option>
               </select>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(80vh-160px)]">
              {loadingModal ? (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw className="h-8 w-8 text-orange-500 animate-spin" />
                </div>
              ) : estudiantesDisponibles.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600 font-medium">No hay estudiantes disponibles</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {estudiantesDisponibles
                    .filter(est => {
                      const matchesSearch = 
                        est.nombre?.toLowerCase().includes(assignSearchTerm.toLowerCase()) ||
                        est.email?.toLowerCase().includes(assignSearchTerm.toLowerCase());

                      const estPlan = est.plan?.toLowerCase() || 'gratuito';
                      const matchesPlan = 
                        filterPlanAsignacion === 'todos' ||
                        (filterPlanAsignacion === 'pro_plus' && (estPlan === 'pro_plus' || estPlan === 'pro plus')) ||
                        (filterPlanAsignacion === 'pro' && estPlan === 'pro') ||
                        (filterPlanAsignacion === 'gratuito' && (estPlan !== 'pro_plus' && estPlan !== 'pro plus' && estPlan !== 'pro'));

                      return matchesSearch && matchesPlan;
                    })
                    .map((est) => (
                    <div
                      key={est.id}
                      className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                        est.ya_asignado
                          ? 'bg-gray-50 border-gray-200'
                          : 'bg-white border-orange-200 hover:border-orange-400'
                      }`}
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-amber-500 rounded-full flex items-center justify-center text-white font-bold text-lg overflow-hidden">
                          {est.profile_image ? (
                            <img 
                              src={`${STORAGE_URL}/${est.profile_image}`} 
                              alt={est.nombre} 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            est.nombre?.charAt(0)?.toUpperCase() || 'E'
                          )}
                        </div>
                        <div className="flex-1">
                             <div>
                                <p className="font-semibold text-gray-800">{est.nombre}</p>
                                <p className="text-sm text-gray-500">{est.email}</p>
                             </div>
                          <div className="flex gap-2 mt-1">
                            {est.test_completado === 1 && (
                              <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full font-medium">
                                ✓ Test Completado
                              </span>
                            )}
                            {est.ya_asignado === 1 && (
                              <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-medium">
                                ✓ Ya Asignado
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                         <span className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider shadow-xs ${
                           est.plan === 'pro_plus' || est.plan === 'Pro Plus'
                             ? 'bg-purple-100 text-purple-700 ring-1 ring-purple-200' 
                             : est.plan === 'pro' || est.plan === 'Pro'
                               ? 'bg-blue-100 text-blue-700 ring-1 ring-blue-200'
                               : 'bg-gray-100 text-gray-600 ring-1 ring-gray-200'
                         }`}>
                           {est.plan === 'pro_plus' || est.plan === 'Pro Plus' ? 'Pro Plus' : 
                            est.plan === 'pro' || est.plan === 'Pro' ? 'Pro' : 'Gratuito'}
                         </span>

                      <button
                        onClick={() => est.ya_asignado === 1 ? desasignarEstudiante(est.id) : asignarEstudiante(est.id)}
                        disabled={asignando === est.id || (est.ya_asignado !== 1 && !(est.plan === 'pro_plus' || est.plan === 'Pro Plus'))}
                        className={`px-4 py-2 rounded-lg font-medium transition-all ${
                          asignando === est.id
                            ? 'bg-gray-400 text-white cursor-wait'
                            : est.ya_asignado === 1
                            ? 'bg-red-500 text-white hover:bg-red-600 shadow-lg cursor-pointer'
                            : (est.plan === 'pro_plus' || est.plan === 'Pro Plus')
                              ? 'bg-orange-500 text-white hover:bg-orange-600 shadow-lg cursor-pointer'
                              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                        title={est.ya_asignado !== 1 && !(est.plan === 'pro_plus' || est.plan === 'Pro Plus') ? 'Solo se pueden asignar estudiantes Pro Plus' : ''}
                      >
                        {asignando === est.id ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : est.ya_asignado === 1 ? (
                          'Liberar'
                        ) : (
                          'Asignar'
                        )}
                      </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer del modal */}
            <div className="border-t border-gray-100 p-4 flex justify-end">
              <button
                onClick={() => setShowAssignModal(false)}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notificación Toast */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 animate-fade-in">
          <div className={`rounded-xl shadow-2xl p-4 flex items-center gap-3 min-w-[300px] ${
            notification.type === 'success' 
              ? 'bg-green-500 text-white' 
              : 'bg-red-500 text-white'
          }`}>
            {notification.type === 'success' ? (
              <CheckCircle className="h-6 w-6 flex-shrink-0" />
            ) : (
              <AlertCircle className="h-6 w-6 flex-shrink-0" />
            )}
            <p className="font-medium flex-1">{notification.message}</p>
          </div>
        </div>
      )}
      {/* Modal de perfil completo */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header del modal */}
            <div className="bg-linear-to-r from-blue-500 to-indigo-500 p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <FileText className="h-6 w-6" />
                  Perfil Completo
                </h2>
                <button
                  onClick={() => setShowProfileModal(false)}
                  className="text-white/80 hover:text-white text-2xl font-bold"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-6 space-y-8">
              {loadingDetail ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-200 border-t-blue-600"></div>
                  <p className="mt-2 text-gray-500">Cargando perfil...</p>
                </div>
              ) : studentDetail?.estudiante?.perfil ? (
                <>
                  {/* Datos Personales */}
                  <div className="flex flex-col md:flex-row gap-6 items-start">
                    <div className="w-32 h-32 rounded-2xl bg-gray-100 flex-shrink-0 overflow-hidden border-4 border-white shadow-lg mx-auto md:mx-0">
                      {studentDetail.estudiante.perfil.profile_image || studentDetail.estudiante.profile_image ? (
                        <img 
                          src={`${STORAGE_URL}/${studentDetail.estudiante.perfil.profile_image || studentDetail.estudiante.profile_image}`} 
                          alt={studentDetail.estudiante.perfil.nombre} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-blue-100 text-blue-500 text-4xl font-bold">
                          {studentDetail.estudiante.perfil.nombre?.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 space-y-4 w-full text-center md:text-left">
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900">
                          {studentDetail.estudiante.perfil.nombre} {studentDetail.estudiante.perfil.apellidos}
                        </h3>
                        <p className="text-gray-500">{studentDetail.estudiante.email}</p>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm mt-4">
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <span className="block text-gray-500 text-xs uppercase tracking-wide">Ciudad</span>
                          <span className="font-medium">{studentDetail.estudiante.perfil.ciudad || 'No especificada'}</span>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <span className="block text-gray-500 text-xs uppercase tracking-wide">Teléfono</span>
                          <span className="font-medium">{studentDetail.estudiante.perfil.telefono || 'No especificado'}</span>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <span className="block text-gray-500 text-xs uppercase tracking-wide">Fecha Nacimiento</span>
                          <span className="font-medium">
                            {studentDetail.estudiante.perfil.fecha_nacimiento 
                              ? new Date(studentDetail.estudiante.perfil.fecha_nacimiento).toLocaleDateString() 
                              : 'No especificada'}
                          </span>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <span className="block text-gray-500 text-xs uppercase tracking-wide">DNI</span>
                          <span className="font-medium">{studentDetail.estudiante.perfil.dni || 'No especificado'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Formación Académica */}
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4 pb-2 border-b border-gray-100">
                      <GraduationCap className="h-5 w-5 text-blue-500" />
                      Formación Académica
                    </h3>
                    {studentDetail.estudiante.perfil.formaciones?.length > 0 ? (
                      <div className="space-y-4">
                        {studentDetail.estudiante.perfil.formaciones.map((formacion, index) => (
                          <div key={index} className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                            <h4 className="font-bold text-gray-800">{formacion.titulo_obtenido || formacion.titulo}</h4>
                            <p className="text-gray-600">{formacion.centro_estudios || formacion.institucion}</p>
                            <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                              <Calendar className="h-3 w-3" />
                              <span>{new Date(formacion.fecha_inicio).getFullYear()} - {formacion.fecha_fin ? new Date(formacion.fecha_fin).getFullYear() : 'Actualidad'}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 italic">No hay formación registrada</p>
                    )}
                  </div>

                  {/* Experiencia Laboral */}
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4 pb-2 border-b border-gray-100">
                      <Briefcase className="h-5 w-5 text-orange-500" />
                      Experiencia Laboral
                    </h3>
                    {studentDetail.estudiante.perfil.experiencias?.length > 0 ? (
                      <div className="space-y-4">
                        {studentDetail.estudiante.perfil.experiencias.map((exp, index) => (
                          <div key={index} className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                            <h4 className="font-bold text-gray-800">{exp.puesto}</h4>
                            <p className="text-gray-600">{exp.empresa}</p>
                            <p className="text-sm text-gray-500 mt-2">{exp.descripcion}</p>
                            <div className="flex items-center gap-2 text-sm text-gray-400 mt-2">
                              <Calendar className="h-3 w-3" />
                              <span>{new Date(exp.fecha_inicio).getFullYear()} - {exp.fecha_fin ? new Date(exp.fecha_fin).getFullYear() : 'Actualidad'}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 italic">No hay experiencia registrada</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Habilidades */}
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4 pb-2 border-b border-gray-100">
                        <Award className="h-5 w-5 text-purple-500" />
                        Habilidades
                      </h3>
                      {studentDetail.estudiante.perfil.habilidades?.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {studentDetail.estudiante.perfil.habilidades.map((skill, index) => (
                            <span key={index} className="px-3 py-1 bg-purple-50 text-purple-700 rounded-lg text-sm font-medium">
                              {skill.nombre}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 italic">No hay habilidades registradas</p>
                      )}
                    </div>

                    {/* Idiomas */}
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4 pb-2 border-b border-gray-100">
                        <Globe className="h-5 w-5 text-green-500" />
                        Idiomas
                      </h3>
                      {studentDetail.estudiante.perfil.idiomas?.length > 0 ? (
                        <div className="space-y-2">
                          {studentDetail.estudiante.perfil.idiomas.map((idioma, index) => (
                            <div key={index} className="flex justify-between items-center bg-gray-50 px-3 py-2 rounded-lg">
                              <span className="font-medium text-gray-700">{idioma.idioma}</span>
                              <span className="text-sm text-gray-500 bg-white px-2 py-0.5 rounded border border-gray-200">{idioma.nivel}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 italic">No hay idiomas registrados</p>
                      )}
                    </div>
                  </div>

                  {/* Intereses */}
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4 pb-2 border-b border-gray-100">
                      <Heart className="h-5 w-5 text-red-500" />
                      Intereses Personales
                    </h3>
                    {studentDetail.estudiante.perfil.intereses?.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {studentDetail.estudiante.perfil.intereses.map((interes, index) => (
                          <span key={index} className="px-3 py-1 bg-red-50 text-red-700 rounded-full text-sm">
                            {interes.nombre}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 italic">No hay intereses registrados</p>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">Este estudiante aún no ha completado su perfil</p>
                </div>
              )}
            </div>
            
            <div className="bg-gray-50 p-4 rounded-b-2xl border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setShowProfileModal(false)}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
