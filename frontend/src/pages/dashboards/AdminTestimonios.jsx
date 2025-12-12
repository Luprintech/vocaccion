import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Eye, EyeOff, Trash2, Search, Filter, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import HeaderAdmin from '@/components/HeaderAdmin';
import ConfirmDialog from '@/components/ConfirmDialog';

export default function AdminTestimonios() {
  const navigate = useNavigate();
  const [testimonios, setTestimonios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterVisible, setFilterVisible] = useState('all'); // all, visible, hidden
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [testimonioToDelete, setTestimonioToDelete] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });

  useEffect(() => {
    loadTestimonios();
  }, [currentPage, filterVisible]);

  // Auto-hide toast after 3 seconds
  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => {
        setToast({ show: false, message: '', type: '' });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast.show]);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
  };

  const loadTestimonios = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        page: currentPage,
        per_page: 15,
        ...(filterVisible !== 'all' && { visible: filterVisible === 'visible' ? 'true' : 'false' }),
        ...(searchTerm && { search: searchTerm })
      });

      const response = await fetch(`http://localhost:8000/api/admin/testimonios?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setTestimonios(result.data.data);
          setTotalPages(result.data.last_page);
        }
      }
    } catch (error) {
      console.error('Error loading testimonios:', error);
      showToast('Error al cargar testimonios', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    loadTestimonios();
  };

  const toggleVisibilidad = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/api/admin/testimonios/${id}/toggle-visibilidad`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        }
      });

      if (response.ok) {
        const result = await response.json();
        showToast(result.message, 'success');
        loadTestimonios();
      }
    } catch (error) {
      console.error('Error toggling visibility:', error);
      showToast('Error al cambiar visibilidad', 'error');
    }
  };

  const handleDeleteClick = (id) => {
    setTestimonioToDelete(id);
    setShowDeleteConfirm(true);
  };

  const confirmarEliminacion = async () => {
    if (!testimonioToDelete) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/api/admin/testimonios/${testimonioToDelete}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        }
      });

      if (response.ok) {
        showToast('Testimonio eliminado correctamente', 'success');
        loadTestimonios();
      } else {
        showToast('Error al eliminar testimonio', 'error');
      }
    } catch (error) {
      console.error('Error deleting testimonio:', error);
      showToast('Error al eliminar testimonio', 'error');
    } finally {
      setShowDeleteConfirm(false);
      setTestimonioToDelete(null);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getProfileImageUrl = (profileImage) => {
    if (!profileImage) return null;
    // Si ya es una URL completa, devolverla tal cual
    if (profileImage.startsWith('http')) return profileImage;
    // Si es una ruta relativa, construir la URL completa
    return `http://localhost:8000/storage/${profileImage}`;
  };

  return (
    <>
      <HeaderAdmin />
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <MessageSquare className="w-8 h-8 text-cyan-600" />
              <h1 className="text-3xl font-bold text-slate-900">Gestión de Testimonios</h1>
            </div>
            <p className="text-slate-600">Modera y gestiona las reseñas de los usuarios</p>
          </div>

          {/* Filters and Search */}
          <Card className="mb-6 border-slate-200">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                {/* Search */}
                <div className="flex-1 flex gap-2">
                  <Input
                    placeholder="Buscar por nombre, email o mensaje..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    className="flex-1 border-slate-300 focus:border-cyan-500 focus:ring-cyan-500"
                  />
                  <Button onClick={handleSearch} className="bg-cyan-600 hover:bg-cyan-700 text-white">
                    <Search className="w-4 h-4 mr-2" />
                    Buscar
                  </Button>
                </div>

                {/* Filter */}
                <div className="flex gap-2">
                  <Button
                    variant={filterVisible === 'all' ? 'default' : 'outline'}
                    onClick={() => { setFilterVisible('all'); setCurrentPage(1); }}
                    className={filterVisible === 'all' ? 'bg-slate-600 hover:bg-slate-700' : 'border-slate-300 text-slate-700 hover:bg-slate-50'}
                  >
                    Todos
                  </Button>
                  <Button
                    variant={filterVisible === 'visible' ? 'default' : 'outline'}
                    onClick={() => { setFilterVisible('visible'); setCurrentPage(1); }}
                    className={filterVisible === 'visible' ? 'bg-cyan-600 hover:bg-cyan-700' : 'border-slate-300 text-slate-700 hover:bg-slate-50'}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Visibles
                  </Button>
                  <Button
                    variant={filterVisible === 'hidden' ? 'default' : 'outline'}
                    onClick={() => { setFilterVisible('hidden'); setCurrentPage(1); }}
                    className={filterVisible === 'hidden' ? 'bg-slate-600 hover:bg-slate-700' : 'border-slate-300 text-slate-700 hover:bg-slate-50'}
                  >
                    <EyeOff className="w-4 h-4 mr-2" />
                    Ocultos
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Testimonios List */}
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="w-10 h-10 text-cyan-600 animate-spin" />
            </div>
          ) : testimonios.length === 0 ? (
            <Card className="border-slate-200">
              <CardContent className="p-12 text-center">
                <MessageSquare className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-700 mb-2">No hay testimonios</h3>
                <p className="text-slate-500">No se encontraron testimonios con los filtros seleccionados.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {testimonios.map((testimonio) => (
                <Card key={testimonio.id} className={`border-2 ${testimonio.visible ? 'border-cyan-100 bg-white' : 'border-slate-200 bg-slate-50'}`}>
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row gap-4">
                      {/* User Info */}
                      <div className="flex items-start gap-4 flex-1">
                        {/* Avatar */}
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-600 to-cyan-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0 overflow-hidden">
                          {testimonio.profile_image ? (
                            <img 
                              src={getProfileImageUrl(testimonio.profile_image)} 
                              alt={testimonio.nombre} 
                              className="w-full h-full object-cover" 
                            />
                          ) : (
                            testimonio.nombre?.charAt(0).toUpperCase() || 'U'
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-slate-900">{testimonio.nombre}</h3>
                            {testimonio.edad && (
                              <span className="text-sm text-slate-500">• {testimonio.edad} años</span>
                            )}
                            <span className={`ml-auto px-2 py-1 rounded-full text-xs font-medium ${
                              testimonio.visible 
                                ? 'bg-cyan-100 text-cyan-700' 
                                : 'bg-slate-200 text-slate-700'
                            }`}>
                              {testimonio.visible ? 'Visible' : 'Oculto'}
                            </span>
                          </div>
                          <p className="text-sm text-slate-600 mb-2">{testimonio.email}</p>
                          <p className="text-slate-800 leading-relaxed mb-3 italic">"{testimonio.mensaje}"</p>
                          <p className="text-xs text-slate-500">
                            Publicado el {formatDate(testimonio.created_at)}
                          </p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex md:flex-col gap-2 md:items-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleVisibilidad(testimonio.id)}
                          className={testimonio.visible 
                            ? 'border-slate-300 text-slate-700 hover:bg-slate-50' 
                            : 'border-cyan-300 text-cyan-700 hover:bg-cyan-50'}
                        >
                          {testimonio.visible ? (
                            <>
                              <EyeOff className="w-4 h-4 mr-2" />
                              Ocultar
                            </>
                          ) : (
                            <>
                              <Eye className="w-4 h-4 mr-2" />
                              Mostrar
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteClick(testimonio.id)}
                          className="border-red-300 text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Eliminar
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex justify-center gap-2">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Anterior
              </Button>
              <span className="flex items-center px-4 text-sm text-slate-600">
                Página {currentPage} de {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Siguiente
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onCancel={() => {
          setShowDeleteConfirm(false);
          setTestimonioToDelete(null);
        }}
        onConfirm={confirmarEliminacion}
        title="¿Eliminar testimonio?"
        message="Esta acción no se puede deshacer. El testimonio será eliminado permanentemente."
        confirmText="Eliminar"
        cancelText="Cancelar"
      />

      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed top-20 right-6 z-[60] animate-in slide-in-from-top-5 duration-300">
          <div className={`rounded-lg shadow-lg p-4 pr-12 max-w-md ${
            toast.type === 'success' 
              ? 'bg-slate-600 text-white' 
              : 'bg-red-600 text-white'
          }`}>
            <div className="flex items-center gap-3">
              {toast.type === 'success' ? (
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-white bg-opacity-20 flex items-center justify-center">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              ) : (
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-white bg-opacity-20 flex items-center justify-center">
                  <X className="w-4 h-4" />
                </div>
              )}
              <p className="font-medium">{toast.message}</p>
            </div>
            <button
              onClick={() => setToast({ show: false, message: '', type: '' })}
              className="absolute top-3 right-3 text-white hover:bg-white hover:bg-opacity-20 rounded p-1 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
