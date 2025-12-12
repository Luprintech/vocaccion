import React, { useState, useEffect } from 'react';
import Header from '../../components/Header';
import { API_URL } from '../../api';
import { Plus, Trash2, FileText, Video, Link as LinkIcon, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContextFixed';

/**
 * Recursos - Aula Virtual del Orientador
 * 
 * Permite al orientador:
 * - Ver sus recursos compartidos
 * - Crear nuevos recursos (PDF, video, enlace, documento)
 * - Editar recursos existentes
 * - Eliminar recursos
 * 
 * @component
 */
function Recursos() {
  const { token } = useAuth();
  const [recursos, setRecursos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    url_archivo: '',
    tipo: 'enlace'
  });
  const [submitError, setSubmitError] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);

  // Cargar recursos al montar
  useEffect(() => {
    fetchRecursos();
  }, []);

  const fetchRecursos = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${API_URL}/orientador/recursos`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Error al cargar recursos');
      }

      const data = await response.json();
      setRecursos(data.data || []);
    } catch (err) {
      console.error('Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitLoading(true);

    try {
      const response = await fetch(`${API_URL}/orientador/recursos`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al crear recurso');
      }

      // Agregar el nuevo recurso a la lista
      const newData = await response.json();
      setRecursos(prev => [newData.data, ...prev]);
      
      // Limpiar formulario
      setFormData({
        titulo: '',
        descripcion: '',
        url_archivo: '',
        tipo: 'enlace'
      });
      setShowForm(false);
    } catch (err) {
      console.error('Error:', err);
      setSubmitError(err.message);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (recursoId) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este recurso?')) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/orientador/recursos/${recursoId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Error al eliminar recurso');
      }

      setRecursos(prev => prev.filter(r => r.id !== recursoId));
    } catch (err) {
      console.error('Error:', err);
      setError(err.message);
    }
  };

  const getIconForType = (tipo) => {
    switch (tipo) {
      case 'pdf':
        return <FileText className="w-6 h-6 text-red-500" />;
      case 'video':
        return <Video className="w-6 h-6 text-blue-500" />;
      case 'enlace':
        return <LinkIcon className="w-6 h-6 text-green-500" />;
      case 'documento':
        return <FileText className="w-6 h-6 text-orange-500" />;
      default:
        return <FileText className="w-6 h-6 text-gray-500" />;
    }
  };

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="space-y-6">
            {/* Header interno */}
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Aula Virtual</h1>
                <p className="text-gray-600 mt-1">Comparte recursos y materiales con tus estudiantes</p>
              </div>
              <button
                onClick={() => setShowForm(!showForm)}
                className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
              >
                <Plus className="w-5 h-5" />
                Agregar Recurso
              </button>
            </div>

      {/* Formulario */}
      {showForm && (
        <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-indigo-600">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">Nuevo Recurso</h2>
            <button
              onClick={() => setShowForm(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {submitError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                {submitError}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Título *
              </label>
              <input
                type="text"
                name="titulo"
                value={formData.titulo}
                onChange={handleInputChange}
                required
                placeholder="Ej: Guía de Profesiones"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-600 focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción
              </label>
              <textarea
                name="descripcion"
                value={formData.descripcion}
                onChange={handleInputChange}
                placeholder="Describe el recurso..."
                rows="3"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-600 focus:border-transparent outline-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo *
                </label>
                <select
                  name="tipo"
                  value={formData.tipo}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-600 focus:border-transparent outline-none"
                >
                  <option value="enlace">Enlace Web</option>
                  <option value="pdf">Documento PDF</option>
                  <option value="video">Vídeo</option>
                  <option value="documento">Documento</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL del Archivo *
                </label>
                <input
                  type="url"
                  name="url_archivo"
                  value={formData.url_archivo}
                  onChange={handleInputChange}
                  required
                  placeholder="https://ejemplo.com/archivo"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-600 focus:border-transparent outline-none"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                disabled={submitLoading}
                className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
              >
                {submitLoading ? 'Guardando...' : 'Guardar Recurso'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="flex-1 bg-gray-300 text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-400 transition"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Mensajes de error/loading */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded text-red-700">
          {error}
        </div>
      )}

      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      )}

      {/* Lista de Recursos */}
      {!loading && recursos.length === 0 && !showForm && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">Aún no tienes recursos compartidos</p>
          <button
            onClick={() => setShowForm(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
          >
            Crear Primer Recurso
          </button>
        </div>
      )}

      {!loading && recursos.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recursos.map((recurso) => (
            <div
              key={recurso.id}
              className="bg-white rounded-lg shadow hover:shadow-lg transition p-6 flex flex-col"
            >
              {/* Icono y Tipo */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  {getIconForType(recurso.tipo)}
                </div>
                <span className="text-xs font-semibold text-gray-500 uppercase bg-gray-100 px-2 py-1 rounded">
                  {recurso.tipo}
                </span>
              </div>

              {/* Contenido */}
              <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
                {recurso.titulo}
              </h3>
              {recurso.descripcion && (
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {recurso.descripcion}
                </p>
              )}

              {/* Botones */}
              <div className="mt-auto flex gap-2 pt-4 border-t border-gray-200">
                <a
                  href={recurso.url_archivo}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 text-center bg-indigo-50 text-indigo-600 px-3 py-2 rounded text-sm font-medium hover:bg-indigo-100 transition"
                >
                  Abrir
                </a>
                <button
                  onClick={() => handleDelete(recurso.id)}
                  className="bg-red-50 text-red-600 px-3 py-2 rounded hover:bg-red-100 transition"
                  title="Eliminar"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Fecha */}
              <p className="text-xs text-gray-500 mt-2">
                {new Date(recurso.created_at).toLocaleDateString('es-ES')}
              </p>
            </div>
          ))}
        </div>
      )}
          </div>
        </div>
      </main>
    </>
  );
}

export default Recursos;
