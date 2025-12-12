/**
 * ADMIN ORIENTADORES - Gestión de orientadores
 * 
 * Panel para administrar los orientadores:
 * - Listar todos los orientadores
 * - Crear nuevas cuentas de orientador
 * - Ver estudiantes asignados a cada orientador
 * - Asignar/desasignar estudiantes
 * - Eliminar orientadores
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, UserPlus, Search, Eye, Trash2, UserCheck, UserMinus,
  Plus, X, Mail, Lock, AlertCircle, CheckCircle, ChevronDown
} from 'lucide-react';
import { useAuth } from '../../context/AuthContextFixed';
import { API_URL } from '../../api';
import HeaderAdmin from '../../components/HeaderAdmin';

export default function AdminOrientadores() {
  const navigate = useNavigate();
  const { token } = useAuth();
  
  // Estados principales
  const [orientadores, setOrientadores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Modal de crear orientador
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({ nombre: '', email: '', password: '' });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  
  // Modal de detalle/estudiantes
  const [selectedOrientador, setSelectedOrientador] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [orientadorDetail, setOrientadorDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  
  // Modal de asignación
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [estudiantesSinAsignar, setEstudiantesSinAsignar] = useState([]);
  const [loadingEstudiantes, setLoadingEstudiantes] = useState(false);
  const [selectedEstudiante, setSelectedEstudiante] = useState(null);
  const [assigning, setAssigning] = useState(false);
  
  // Modal de eliminación
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Cargar orientadores
  useEffect(() => {
    fetchOrientadores();
  }, []);

  const fetchOrientadores = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/admin/orientadores`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        setOrientadores(data.data || []);
      } else {
        setError(data.message || 'Error al cargar orientadores');
      }
    } catch (err) {
      console.error('Error:', err);
      setError('Error de conexión al cargar orientadores');
    } finally {
      setLoading(false);
    }
  };

  // Crear orientador
  const handleCreateOrientador = async (e) => {
    e.preventDefault();
    setCreating(true);
    setCreateError('');

    try {
      const response = await fetch(`${API_URL}/admin/orientadores`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(createForm)
      });

      const data = await response.json();

      if (data.success) {
        setShowCreateModal(false);
        setCreateForm({ nombre: '', email: '', password: '' });
        fetchOrientadores();
      } else {
        setCreateError(data.message || data.errors?.email?.[0] || 'Error al crear orientador');
      }
    } catch (err) {
      console.error('Error:', err);
      setCreateError('Error de conexión');
    } finally {
      setCreating(false);
    }
  };

  // Ver detalle del orientador
  const handleViewDetail = async (orientador) => {
    setSelectedOrientador(orientador);
    setShowDetailModal(true);
    setLoadingDetail(true);

    try {
      const response = await fetch(`${API_URL}/admin/orientadores/${orientador.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success) {
        setOrientadorDetail(data.data);
      }
    } catch (err) {
      console.error('Error cargando detalle:', err);
    } finally {
      setLoadingDetail(false);
    }
  };

  // Abrir modal de asignación
  const handleOpenAssign = async (orientador) => {
    setSelectedOrientador(orientador);
    setShowAssignModal(true);
    setLoadingEstudiantes(true);

    try {
      const response = await fetch(`${API_URL}/admin/estudiantes-sin-orientador`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success) {
        setEstudiantesSinAsignar(data.data || []);
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoadingEstudiantes(false);
    }
  };

  // Asignar estudiante
  const handleAssignEstudiante = async () => {
    if (!selectedEstudiante) return;
    
    setAssigning(true);
    try {
      const response = await fetch(`${API_URL}/admin/asignar-estudiante`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          orientador_id: selectedOrientador.id,
          estudiante_id: selectedEstudiante
        })
      });

      const data = await response.json();
      if (data.success) {
        setShowAssignModal(false);
        setSelectedEstudiante(null);
        fetchOrientadores();
        // Actualizar detalle si está abierto
        if (showDetailModal) {
          handleViewDetail(selectedOrientador);
        }
      } else {
        alert(data.message || 'Error al asignar');
      }
    } catch (err) {
      console.error('Error:', err);
      alert('Error de conexión');
    } finally {
      setAssigning(false);
    }
  };

  // Desasignar estudiante
  const handleDesasignarEstudiante = async (estudianteId) => {
    if (!confirm('¿Desasignar este estudiante del orientador?')) return;

    try {
      const response = await fetch(`${API_URL}/admin/desasignar-estudiante/${estudianteId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success) {
        handleViewDetail(selectedOrientador);
        fetchOrientadores();
      } else {
        alert(data.message || 'Error al desasignar');
      }
    } catch (err) {
      console.error('Error:', err);
      alert('Error de conexión');
    }
  };

  // Confirmar eliminación
  const handleConfirmDelete = (orientador) => {
    setSelectedOrientador(orientador);
    setShowDeleteModal(true);
  };

  // Eliminar orientador
  const handleDelete = async () => {
    setDeleting(true);
    try {
      const response = await fetch(`${API_URL}/admin/orientadores/${selectedOrientador.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success) {
        setShowDeleteModal(false);
        fetchOrientadores();
      } else {
        alert(data.message || 'Error al eliminar');
      }
    } catch (err) {
      console.error('Error:', err);
      alert('Error de conexión');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-cyan-50">
      <HeaderAdmin />

      <main className="container mx-auto px-4 py-8">
        {/* Encabezado */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-linear-to-br from-slate-600 to-cyan-500 rounded-xl">
              <Users className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-800">Gestión de Orientadores</h1>
              <p className="text-slate-500">Crea y administra cuentas de orientadores</p>
            </div>
          </div>
          
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-linear-to-r from-slate-600 to-cyan-500 text-white rounded-xl font-semibold hover:shadow-lg transition-shadow cursor-pointer"
          >
            <UserPlus className="w-5 h-5" />
            Crear Orientador
          </button>
        </div>

        {/* Grid de orientadores */}
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-slate-200 border-t-slate-700"></div>
            <p className="mt-4 text-slate-500">Cargando orientadores...</p>
          </div>
        ) : error ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <p className="text-red-600">{error}</p>
          </div>
        ) : orientadores.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
            <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-700 mb-2">Sin orientadores</h3>
            <p className="text-slate-500 mb-6">Aún no hay orientadores registrados en el sistema</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-linear-to-r from-slate-600 to-cyan-500 text-white rounded-xl font-semibold hover:shadow-lg cursor-pointer"
            >
              <UserPlus className="w-5 h-5" />
              Crear primer orientador
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {orientadores.map((orientador) => (
              <div
                key={orientador.id}
                className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-lg transition-shadow"
              >
                {/* Cabecera */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-full bg-linear-to-br from-slate-600 to-cyan-500 flex items-center justify-center text-white text-xl font-bold">
                      {orientador.nombre?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800">{orientador.nombre}</h3>
                      <p className="text-sm text-slate-500">{orientador.email}</p>
                    </div>
                  </div>
                </div>

                {/* Estadística de estudiantes */}
                <div className="p-4 bg-cyan-50 rounded-xl mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-cyan-700 font-medium">Estudiantes asignados</span>
                    <span className="text-2xl font-bold text-cyan-600">
                      {orientador.estudiantes_count || 0}
                    </span>
                  </div>
                </div>

                {/* Acciones */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleViewDetail(orientador)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-medium transition-colors cursor-pointer"
                  >
                    <Eye className="w-4 h-4" />
                    Ver
                  </button>
                  <button
                    onClick={() => handleOpenAssign(orientador)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-cyan-100 text-cyan-700 rounded-xl hover:bg-cyan-200 font-medium transition-colors cursor-pointer"
                  >
                    <UserPlus className="w-4 h-4" />
                    Asignar
                  </button>
                  <button
                    onClick={() => handleConfirmDelete(orientador)}
                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                    title="Eliminar"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modal Crear Orientador */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-800">Crear Orientador</h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setCreateError('');
                }}
                className="p-2 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleCreateOrientador} className="p-6 space-y-4">
              {createError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                  {createError}
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Nombre completo
                </label>
                <input
                  type="text"
                  required
                  value={createForm.nombre}
                  onChange={(e) => setCreateForm({ ...createForm, nombre: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  placeholder="Juan García"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={createForm.email}
                    onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    placeholder="orientador@ejemplo.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={createForm.password}
                    onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    placeholder="Mínimo 8 caracteres"
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setCreateError('');
                  }}
                  className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl font-medium hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 px-4 py-2.5 bg-linear-to-r from-slate-600 to-cyan-500 text-white rounded-xl font-medium hover:shadow-lg disabled:opacity-50 enabled:cursor-pointer flex items-center justify-center gap-2"
                >
                  {creating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Creando...
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      Crear
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Detalle Orientador */}
      {showDetailModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-xl font-bold text-slate-800">Detalle del Orientador</h2>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-2 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {loadingDetail ? (
              <div className="p-12 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-slate-700"></div>
              </div>
            ) : orientadorDetail ? (
              <div className="p-6 space-y-6">
                {/* Info del orientador */}
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-linear-to-br from-slate-600 to-cyan-500 flex items-center justify-center text-white text-2xl font-bold">
                    {orientadorDetail.orientador?.nombre?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-800">{orientadorDetail.orientador?.nombre}</h3>
                    <p className="text-slate-500 flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      {orientadorDetail.orientador?.email}
                    </p>
                  </div>
                </div>

                {/* Lista de estudiantes asignados */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-slate-800">
                      Estudiantes asignados ({orientadorDetail.estudiantes?.length || 0})
                    </h4>
                    <button
                      onClick={() => handleOpenAssign(selectedOrientador)}
                      className="text-sm text-cyan-600 hover:text-cyan-700 font-medium flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      Asignar estudiante
                    </button>
                  </div>

                  {orientadorDetail.estudiantes?.length > 0 ? (
                    <div className="space-y-3">
                      {orientadorDetail.estudiantes.map((estudiante) => (
                        <div
                          key={estudiante.id}
                          className="flex items-center justify-between p-4 bg-slate-50 rounded-xl"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-linear-to-br from-slate-400 to-cyan-400 flex items-center justify-center text-white font-bold">
                              {estudiante.nombre?.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium text-slate-800">{estudiante.nombre}</p>
                              <p className="text-sm text-slate-500">{estudiante.email}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleDesasignarEstudiante(estudiante.id)}
                            className="p-2 text-red-400 hover:text-red-600 hover:bg-red-100 rounded-lg transition-colors cursor-pointer"
                            title="Desasignar"
                          >
                            <UserMinus className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 text-center bg-slate-50 rounded-xl">
                      <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                      <p className="text-slate-500">Sin estudiantes asignados</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-slate-500">
                No se pudo cargar la información
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Asignar Estudiante */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-800">Asignar Estudiante</h2>
              <button
                onClick={() => {
                  setShowAssignModal(false);
                  setSelectedEstudiante(null);
                }}
                className="p-2 hover:bg-slate-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 border-b border-slate-100 bg-cyan-50">
              <p className="text-sm text-cyan-700">
                Asignar a: <strong>{selectedOrientador?.nombre}</strong>
              </p>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              {loadingEstudiantes ? (
                <div className="py-8 text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-slate-700"></div>
                </div>
              ) : estudiantesSinAsignar.length === 0 ? (
                <div className="py-8 text-center">
                  <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
                  <p className="text-slate-600 font-medium">Todos los estudiantes tienen orientador</p>
                  <p className="text-sm text-slate-500">No hay estudiantes disponibles para asignar</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {estudiantesSinAsignar.map((estudiante) => (
                    <label
                      key={estudiante.id}
                      className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${
                        selectedEstudiante === estudiante.id
                          ? 'bg-cyan-100 border-2 border-cyan-400'
                          : 'bg-slate-50 hover:bg-slate-100 border-2 border-transparent'
                      }`}
                    >
                      <input
                        type="radio"
                        name="estudiante"
                        value={estudiante.id}
                        checked={selectedEstudiante === estudiante.id}
                        onChange={() => setSelectedEstudiante(estudiante.id)}
                        className="sr-only"
                      />
                      <div className="w-10 h-10 rounded-full bg-linear-to-br from-slate-400 to-cyan-400 flex items-center justify-center text-white font-bold">
                        {estudiante.nombre?.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-slate-800">{estudiante.nombre}</p>
                        <p className="text-sm text-slate-500">{estudiante.email}</p>
                      </div>
                      {selectedEstudiante === estudiante.id && (
                        <CheckCircle className="w-5 h-5 text-cyan-600" />
                      )}
                    </label>
                  ))}
                </div>
              )}
            </div>

            {estudiantesSinAsignar.length > 0 && (
              <div className="p-4 border-t border-slate-100 flex gap-3">
                <button
                  onClick={() => {
                    setShowAssignModal(false);
                    setSelectedEstudiante(null);
                  }}
                  className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl font-medium hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAssignEstudiante}
                  disabled={!selectedEstudiante || assigning}
                  className="flex-1 px-4 py-2.5 bg-linear-to-r from-slate-600 to-cyan-500 text-white rounded-xl font-medium hover:shadow-lg disabled:opacity-50 enabled:cursor-pointer flex items-center justify-center gap-2"
                >
                  {assigning ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Asignando...
                    </>
                  ) : (
                    <>
                      <UserCheck className="w-4 h-4" />
                      Asignar
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal de Eliminación */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="p-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
                <Trash2 className="w-8 h-8 text-red-500" />
              </div>
              <h2 className="text-xl font-bold text-slate-800 text-center mb-2">
                ¿Eliminar orientador?
              </h2>
              <p className="text-slate-500 text-center mb-2">
                Esta acción eliminará la cuenta de <strong>{selectedOrientador?.nombre}</strong>.
              </p>
              {selectedOrientador?.estudiantes_count > 0 && (
                <p className="text-amber-600 text-center text-sm mb-4 p-2 bg-amber-50 rounded-lg">
                  ⚠️ Este orientador tiene {selectedOrientador.estudiantes_count} estudiantes asignados que serán desasignados.
                </p>
              )}
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl font-medium hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 disabled:opacity-50 enabled:cursor-pointer"
                >
                  {deleting ? 'Eliminando...' : 'Sí, eliminar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
