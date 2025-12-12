/**
 * ADMIN USUARIOS - Gestión de estudiantes
 * 
 * Panel para administrar las cuentas de estudiantes:
 * - Listar todos los estudiantes con paginación
 * - Buscar por nombre o email
 * - Ver detalle de cada estudiante
 * - Editar información básica
 * - Eliminar cuentas
 * - Ver estado del test y orientador asignado
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, Search, Eye, Edit2, Trash2, ChevronLeft, ChevronRight,
  CheckCircle, XCircle, UserCheck, AlertCircle, X, Save, Mail, Calendar,
  FileText, Briefcase, Map, User
} from 'lucide-react';
import { useAuth } from '../../context/AuthContextFixed';
import { API_URL } from '../../api';
import HeaderAdmin from '../../components/HeaderAdmin';

export default function AdminUsuarios() {
  const navigate = useNavigate();
  const { token } = useAuth();
  
  // Estados principales
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  
  // Búsqueda y filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');
  
  // Modal de detalle
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [userDetail, setUserDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  
  // Modal de edición
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({ nombre: '', email: '' });
  const [saving, setSaving] = useState(false);
  
  // Modal de eliminación
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Cargar usuarios
  useEffect(() => {
    fetchUsuarios();
  }, [currentPage, searchTerm]);

  const fetchUsuarios = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage,
        per_page: 10,
        ...(searchTerm && { search: searchTerm })
      });

      const response = await fetch(`${API_URL}/admin/usuarios?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        setUsuarios(data.data.data || []);
        setTotalPages(data.data.last_page || 1);
        setTotalItems(data.data.total || 0);
      } else {
        setError(data.message || 'Error al cargar usuarios');
      }
    } catch (err) {
      console.error('Error:', err);
      setError('Error de conexión al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  // Buscar
  const handleSearch = (e) => {
    e.preventDefault();
    setSearchTerm(searchInput);
    setCurrentPage(1);
  };

  // Ver detalle
  const handleViewDetail = async (usuario) => {
    setSelectedUser(usuario);
    setShowDetailModal(true);
    setLoadingDetail(true);

    try {
      const response = await fetch(`${API_URL}/admin/usuarios/${usuario.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success) {
        setUserDetail(data.data);
      }
    } catch (err) {
      console.error('Error cargando detalle:', err);
    } finally {
      setLoadingDetail(false);
    }
  };

  // Abrir modal de edición
  const handleOpenEdit = (usuario) => {
    setSelectedUser(usuario);
    setEditForm({ 
      nombre: usuario.nombre, 
      email: usuario.email,
      plan: usuario.plan || 'gratuito'
    });
    setShowEditModal(true);
  };

  // Guardar edición
  const handleSaveEdit = async () => {
    setSaving(true);
    try {
      // 1. Actualizar datos básicos
      const response = await fetch(`${API_URL}/admin/usuarios/${selectedUser.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ nombre: editForm.nombre, email: editForm.email })
      });
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Error al actualizar usuario');
      }

      // 2. Actualizar plan si ha cambiado
      if (editForm.plan !== (selectedUser.plan || 'gratuito')) {
        const planResponse = await fetch(`${API_URL}/admin/usuarios/${selectedUser.id}/plan`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ plan: editForm.plan })
        });
        const planData = await planResponse.json();
        
        if (!planData.success) {
           console.error('Error al actualizar plan:', planData.message);
           // No lanzamos error para no bloquear la actualización de datos básicos, 
           // pero podríamos mostrar una alerta.
        }
      }

      setShowEditModal(false);
      fetchUsuarios();
      
    } catch (err) {
      console.error('Error:', err);
      alert(err.message || 'Error de conexión');
    } finally {
      setSaving(false);
    }
  };

  // Confirmar eliminación
  const handleConfirmDelete = (usuario) => {
    setSelectedUser(usuario);
    setShowDeleteModal(true);
  };

  // Eliminar usuario
  const handleDelete = async () => {
    setDeleting(true);
    try {
      const response = await fetch(`${API_URL}/admin/usuarios/${selectedUser.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success) {
        setShowDeleteModal(false);
        fetchUsuarios();
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

  // Formatear fecha
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-cyan-50">
      <HeaderAdmin />

      <main className="container mx-auto px-4 py-8">
        {/* Encabezado */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-linear-to-br from-slate-600 to-cyan-500 rounded-xl">
              <Users className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-800">Gestión de Usuarios</h1>
              <p className="text-slate-500">Administra las cuentas de estudiantes</p>
            </div>
          </div>
        </div>

        {/* Barra de búsqueda y stats */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* Búsqueda */}
            <form onSubmit={handleSearch} className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar por nombre o email..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                />
              </div>
            </form>

            {/* Stats rápidas */}
            <div className="flex items-center gap-4 text-sm">
              <span className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg font-medium">
                Total: {totalItems} estudiantes
              </span>
            </div>
          </div>
        </div>

        {/* Tabla de usuarios */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-slate-200 border-t-cyan-500"></div>
              <p className="mt-4 text-slate-500">Cargando usuarios...</p>
            </div>
          ) : error ? (
            <div className="p-12 text-center">
              <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
              <p className="text-red-600">{error}</p>
            </div>
          ) : usuarios.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">No se encontraron usuarios</p>
            </div>
          ) : (
            <>
              {/* Tabla */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Usuario</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Plan</th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Verificado</th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Test</th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Orientador</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Registro</th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Acciones</th>
                  </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {usuarios.map((usuario) => (
                      <tr key={usuario.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-linear-to-br from-slate-400 to-cyan-400 flex items-center justify-center text-white font-bold">
                              {usuario.nombre?.charAt(0).toUpperCase() || '?'}
                            </div>
                            <span className="font-medium text-slate-800">{usuario.nombre}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-600">{usuario.email}</td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex px-2 py-1 rounded-full text-xs font-bold border ${
                            usuario.plan === 'pro_plus' 
                              ? 'bg-purple-50 text-purple-700 border-purple-100'
                              : usuario.plan === 'pro'
                                ? 'bg-blue-50 text-blue-700 border-blue-100'
                                : 'bg-slate-50 text-slate-600 border-slate-200'
                          }`}>
                            {usuario.plan === 'pro_plus' ? 'Pro Plus' : usuario.plan === 'pro' ? 'Pro' : 'Gratuito'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                      {usuario.email_verified_at ? (
                            <CheckCircle className="w-5 h-5 text-green-500 mx-auto" />
                          ) : usuario.google_id ? (
                            <span className="inline-flex items-center justify-center px-2 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full border border-blue-100">
                              Google
                            </span>
                          ) : (
                            <XCircle className="w-5 h-5 text-red-400 mx-auto" />
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {usuario.test_completado ? (
                            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                              Completado
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-slate-100 text-slate-500 text-xs font-medium rounded-full">
                              Pendiente
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {usuario.orientador_id ? (
                            <UserCheck className="w-5 h-5 text-cyan-500 mx-auto" />
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-slate-500 text-sm">
                          {formatDate(usuario.created_at)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleViewDetail(usuario)}
                              className="p-2 text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors cursor-pointer"
                              title="Ver detalle"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleOpenEdit(usuario)}
                              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                              title="Editar"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleConfirmDelete(usuario)}
                              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                              title="Eliminar"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Paginación */}
              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
                  <p className="text-sm text-slate-500">
                    Página {currentPage} de {totalPages}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed enabled:cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed enabled:cursor-pointer"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Modal de Detalle */}
      {showDetailModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-800">Detalle del Usuario</h2>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-2 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {loadingDetail ? (
              <div className="p-12 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-cyan-500"></div>
              </div>
            ) : userDetail ? (
              <div className="p-6 space-y-6">
                {/* Info básica */}
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-linear-to-br from-slate-500 to-cyan-500 flex items-center justify-center text-white text-2xl font-bold">
                    {userDetail.usuario?.nombre?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-800">{userDetail.usuario?.nombre}</h3>
                    <p className="text-slate-500 flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      {userDetail.usuario?.email}
                    </p>
                  </div>
                </div>

                {/* Estado de verificación y Plan */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 rounded-xl">
                    <p className="text-sm text-slate-500 mb-1">Email verificado</p>
                    <p className="font-semibold flex items-center gap-2">
                      {userDetail.usuario?.email_verified_at ? (
                        <>
                          <CheckCircle className="w-5 h-5 text-green-500" />
                          <span className="text-green-700">Sí</span>
                        </>
                      ) : userDetail.usuario?.google_id ? (
                        <>
                          <span className="flex items-center justify-center w-5 h-5 bg-blue-100 text-blue-600 font-bold rounded-full text-xs">G</span>
                          <span className="text-blue-700 font-medium">Google</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-5 h-5 text-red-400" />
                          <span className="text-red-600">No</span>
                        </>
                      )}
                    </p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl">
                    <p className="text-sm text-slate-500 mb-1">Plan Actual</p>
                    <p className="font-semibold text-slate-800 flex items-center gap-2 capitalize">
                      {userDetail.usuario?.plan === 'pro_plus' ? 'Pro Plus' : userDetail.usuario?.plan || 'Gratuito'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 rounded-xl">
                    <p className="text-sm text-slate-500 mb-1">Fecha de registro</p>
                    <p className="font-semibold text-slate-800 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {formatDate(userDetail.usuario?.created_at)}
                    </p>
                  </div>
                </div>

                {/* Test vocacional */}
                <div className="p-4 bg-cyan-50 rounded-xl border border-cyan-100">
                  <h4 className="font-semibold text-cyan-800 mb-2">Test Vocacional</h4>
                  {userDetail.test_session ? (
                    <div className="space-y-2 text-sm">
                      <p><span className="text-cyan-600">Estado:</span> {userDetail.test_session.completed_at ? 'Completado' : 'En progreso'}</p>
                      <p><span className="text-cyan-600">Iniciado:</span> {formatDate(userDetail.test_session.created_at)}</p>
                      {userDetail.test_session.completed_at && (
                        <p><span className="text-cyan-600">Completado:</span> {formatDate(userDetail.test_session.completed_at)}</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-cyan-600 text-sm">No ha iniciado el test</p>
                  )}
                </div>

                {/* Orientador asignado */}
                <div className="p-4 bg-slate-50 rounded-xl">
                  <h4 className="font-semibold text-slate-800 mb-2">Orientador Asignado</h4>
                  {userDetail.orientador_asignado ? (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-linear-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold">
                        {userDetail.orientador_asignado.nombre?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium">{userDetail.orientador_asignado.nombre}</p>
                        <p className="text-sm text-slate-500">{userDetail.orientador_asignado.email}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-slate-500 text-sm">Sin orientador asignado</p>
                  )}
                </div>

                {/* Objetivo profesional */}
                {userDetail.usuario?.objetivo_profesional && (
                  <div className="p-4 bg-green-50 rounded-xl border border-green-100">
                    <h4 className="font-semibold text-green-800 mb-2">Objetivo Profesional</h4>
                    <p className="text-green-700">{userDetail.usuario.objetivo_profesional.profesion}</p>
                  </div>
                )}

                {/* Acciones */}
                <div className="pt-4 border-t border-slate-100">
                  <h4 className="font-semibold text-slate-800 mb-3">Acciones Rápidas</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {/* Botón Ver Perfil (Siempre visible) */}
                    <button
                      onClick={() => {
                        setShowDetailModal(false);
                        navigate(`/admin/estudiantes/${userDetail.usuario.id}/perfil`);
                      }}
                      className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl bg-orange-50 text-orange-600 hover:bg-orange-100 transition-colors border border-orange-100"
                      title="Ver/Editar perfil completo"
                    >
                      <User className="w-5 h-5" />
                      <span className="text-xs font-semibold">Ver Perfil</span>
                    </button>

                    {/* Botones del Test (Solo si completado) */}
                    {userDetail.test_session?.completed_at && (
                      <>
                        <button
                          onClick={() => {
                            setShowDetailModal(false);
                            navigate(`/admin/estudiantes/${userDetail.usuario.id}/test`);
                          }}
                          className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors border border-blue-100"
                          title="Ver respuestas del test"
                        >
                          <FileText className="w-5 h-5" />
                          <span className="text-xs font-semibold">Ver Test</span>
                        </button>
                        
                        <button
                          onClick={() => {
                            setShowDetailModal(false);
                            navigate(`/admin/estudiantes/${userDetail.usuario.id}/profesiones`);
                          }}
                          className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl bg-purple-50 text-purple-600 hover:bg-purple-100 transition-colors border border-purple-100"
                          title="Ver profesiones recomendadas"
                        >
                          <Briefcase className="w-5 h-5" />
                          <span className="text-xs font-semibold">Profesiones</span>
                        </button>
                        
                        <button
                          onClick={() => {
                            setShowDetailModal(false);
                            navigate(`/admin/estudiantes/${userDetail.usuario.id}/itinerario`);
                          }}
                          className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl bg-green-50 text-green-600 hover:bg-green-100 transition-colors border border-green-100"
                          title="Ver itinerario académico"
                        >
                          <Map className="w-5 h-5" />
                          <span className="text-xs font-semibold">Itinerario</span>
                        </button>
                      </>
                    )}
                  </div>
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

      {/* Modal de Edición */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-800">Editar Usuario</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-2 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nombre</label>
                <input
                  type="text"
                  value={editForm.nombre}
                  onChange={(e) => setEditForm({ ...editForm, nombre: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Plan de Suscripción</label>
                <select
                  value={editForm.plan}
                  onChange={(e) => setEditForm({ ...editForm, plan: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white"
                >
                  <option value="gratuito">Gratuito</option>
                  <option value="pro">Pro</option>
                  <option value="pro_plus">Pro Plus</option>
                </select>
                <p className="text-xs text-slate-500 mt-1">Cambiar el plan actualizará la suscripción del usuario.</p>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 flex justify-end gap-3">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={saving}
                className="px-4 py-2 bg-linear-to-r from-slate-600 to-cyan-500 text-white rounded-xl font-medium hover:shadow-lg disabled:opacity-50 enabled:cursor-pointer flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Guardar cambios
                  </>
                )}
              </button>
            </div>
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
                ¿Eliminar usuario?
              </h2>
              <p className="text-slate-500 text-center mb-6">
                Esta acción eliminará permanentemente la cuenta de <strong>{selectedUser?.nombre}</strong> y todos sus datos asociados.
              </p>
              
              <div className="flex gap-3">
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
