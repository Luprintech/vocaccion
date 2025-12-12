import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  BookOpen, 
  FileText, 
  MapPin, 
  Download, 
  Users, 
  ExternalLink,
  Search,
  Filter,
  Eye,
  Clock,
  Star,
  Folder,
  Plus,
  Edit,
  Trash2,
  X,
  AlertCircle,
  CheckCircle,
  Tag,
  BarChart3,
  TrendingUp
} from 'lucide-react';
import { useAuth } from '../../context/AuthContextFixed';
import HeaderOrientador from '../../components/HeaderOrientador';
import { API_URL } from '../../api';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

/**
 * OrientadorRecursos
 * 
 * Página de gestión de recursos educativos.
 * Permite listar, crear, editar y eliminar recursos.
 */
const OrientadorRecursos = () => {
  const { token } = useAuth();
  
  // Estados para TAB
  const [activeTab, setActiveTab] = useState('recursos'); // 'recursos' o 'guias'
  
  // Estados para RECURSOS
  const [recursos, setRecursos] = useState([]);
  const [loadingRecursos, setLoadingRecursos] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('todos');

  // Estados para GUÍAS
  const [guias, setGuias] = useState([]);
  const [loadingGuias, setLoadingGuias] = useState(false);
  const [searchGuias, setSearchGuias] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  
  // Delete Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Form state
  // Form state
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    tipo: 'artículo',
    enlace: '',
    tiempo_lectura: '',
    destacado: false,
    plan_requerido: 'gratuito',
    contenido: '', // Contenido del artículo
    // Para guías
    categoria: 'profesiones',
    visibilidad: 'publico',
    esta_publicado: false,
    pdf: null,
    imagen_portada: null
  });
  
  // Stats
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);
  
  const [notificacion, setNotificacion] = useState(null);

  // Mostrar notificación temporal
  const mostrarNotificacion = (mensaje, tipo = 'exito') => {
    setNotificacion({ mensaje, tipo });
    setTimeout(() => setNotificacion(null), 5000);
  };

  // FETCH RECURSOS
  useEffect(() => {
    fetchRecursos();
  }, []);

  const fetchRecursos = async () => {
    setLoadingRecursos(true);
    try {
      const response = await fetch(`${API_URL}/orientador/recursos`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success || Array.isArray(data)) {
        setRecursos(Array.isArray(data) ? data : data.data || []);
      }
    } catch (error) {
      console.error('Error cargando recursos', error);
      mostrarNotificacion('Error al cargar recursos', 'error');
    } finally {
      setLoadingRecursos(false);
    }
  };

  // FETCH GUÍAS
  const fetchGuias = async () => {
    setLoadingGuias(true);
    try {
      // Cargar tanto guías (PDF) como recursos propios (Artículos/Videos)
      const [resGuias, resRecursos] = await Promise.all([
          fetch(`${API_URL}/orientador/guias`, { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch(`${API_URL}/orientador/recursos?mine=true`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      const dataGuias = await resGuias.json();
      const dataRecursos = await resRecursos.json();

      let listaGuias = [];
      if (Array.isArray(dataGuias)) {
        listaGuias = dataGuias;
      } else if (dataGuias.data) {
        listaGuias = dataGuias.data;
      }

      let listaRecursos = [];
      if (dataRecursos.success && Array.isArray(dataRecursos.data)) {
         listaRecursos = dataRecursos.data.map(r => ({
             ...r,
             es_recurso: true,
             esta_publicado: true, // Recursos se asumen publicados
             visibilidad: r.plan_requerido === 'gratuito' ? 'publico' : 'privado',
             categoria: r.tipo,
             titulo: r.titulo,
             descripcion: r.descripcion
         }));
      }

      setGuias([...listaGuias, ...listaRecursos]);

    } catch (error) {
      console.error('Error cargando guías', error);
      mostrarNotificacion('Error al cargar contenido', 'error');
    } finally {
      setLoadingGuias(false);
    }
  };

  // Cargar guías cuando se cambia a tab de guías
  useEffect(() => {
    if (activeTab === 'guias') {
      fetchGuias();
    } else if (activeTab === 'estadisticas') {
      fetchStats();
    }
  }, [activeTab]);

  const fetchStats = async () => {
    setLoadingStats(true);
    try {
        const response = await fetch(`${API_URL}/orientador/recursos-stats`, {
             headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (data.success) {
            setStats(data.data);
        } else {
            setStats(null); // Asegurar null si falla
            mostrarNotificacion('No se pudieron obtener datos', 'error');
        }
    } catch (error) {
        console.error('Error stats', error);
        mostrarNotificacion('Error de conexión', 'error');
        setStats(null);
    } finally {
        setLoadingStats(false);
    }
  };

  const handleOpenModal = (item = null) => {
    if (item) {
      setCurrentItem(item);
      if (activeTab === 'guias') {
        setFormData({
          titulo: item.titulo,
          descripcion: item.descripcion,
          categoria: item.categoria || 'profesiones',
          visibilidad: item.visibilidad || 'publico',
          esta_publicado: !!item.esta_publicado,
          pdf: null,
          imagen_portada: null,
          contenido: ''
        });
      } else {
        setFormData({
          titulo: item.titulo,
          descripcion: item.descripcion,
          tipo: item.tipo,
          enlace: item.enlace,
          tiempo_lectura: item.tiempo_lectura || '',
          destacado: !!item.destacado,
          plan_requerido: item.plan_requerido || 'gratuito',
          contenido: item.contenido || '', // Cargar contenido si existe
          pdf: null,
          imagen_portada: null // Reset imagen
        });
      }
    } else {
      setCurrentItem(null);
      if (activeTab === 'guias') {
        setFormData({
          titulo: '',
          descripcion: '',
          categoria: 'profesiones',
          visibilidad: 'publico',
          esta_publicado: false,
          pdf: null,
          imagen_portada: null,
          contenido: ''
        });
      } else {
        setFormData({
          titulo: '',
          descripcion: '',
          tipo: 'artículo',
          enlace: '',
          tiempo_lectura: '',
          destacado: false,
          plan_requerido: 'gratuito',
          contenido: '',
          pdf: null,
          imagen_portada: null
        });
      }
    }
    setIsModalOpen(true);
  };

  const handleDelete = async (id, type = 'recursos') => {
    if (!window.confirm(`¿Estás seguro de eliminar esto?`)) return;
    try {
      const endpoint = type === 'guias' ? 'guias' : 'recursos';
      const response = await fetch(`${API_URL}/orientador/${endpoint}/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        mostrarNotificacion('Eliminado correctamente', 'exito');
        if (type === 'guias') {
          fetchGuias();
        } else {
          fetchRecursos();
        }
      } else {
        mostrarNotificacion('Error al eliminar', 'error');
      }
    } catch (e) {
      console.error(e);
      mostrarNotificacion('Error de conexión', 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Validaciones básicas
      if (!formData.titulo.trim()) {
          mostrarNotificacion('El título es obligatorio', 'error');
          setIsSubmitting(false);
          return;
      }

      if (activeTab === 'guias') {
        if (!currentItem && !formData.pdf) {
          mostrarNotificacion('Debes subir un archivo PDF', 'error');
          setIsSubmitting(false);
          return;
        }
        if (!currentItem && !formData.imagen_portada) {
          mostrarNotificacion('Debes subir una imagen de portada', 'error');
          setIsSubmitting(false);
          return;
        }
      } else {
         // Validación recursos
         // Si es artículo, validar que tenga enlace O contenido
         if (formData.tipo === 'artículo' && !formData.enlace.trim() && !formData.contenido.trim()) {
             mostrarNotificacion('Debes proporcionar un enlace o contenido', 'error');
             setIsSubmitting(false);
             return;
         }
      }

      const isRecursoMode = activeTab === 'recursos' || (currentItem && currentItem.es_recurso);
      const endpoint = isRecursoMode ? 'recursos' : 'guias';
      const url = currentItem 
        ? `${API_URL}/orientador/${endpoint}/${currentItem.id}`
        : `${API_URL}/orientador/${endpoint}`;
      
      let method = currentItem ? 'PUT' : 'POST';
      let body;
      let headers = { 'Authorization': `Bearer ${token}` };

      // Detectar si necesitamos enviar como FormData (si hay archivos)
      const hasFiles = (formData.pdf instanceof File) || (formData.imagen_portada instanceof File);

      if (hasFiles) {
        method = 'POST'; // Laravel requiere POST para multipart form data
        const formDataObj = new FormData();
        
        // Método spoofing para PUT con archivos en Laravel
        if (currentItem) {
            formDataObj.append('_method', 'PUT');
        }
        
        // Campos comunes
        formDataObj.append('titulo', formData.titulo);
        formDataObj.append('descripcion', formData.descripcion);
        
        if (!isRecursoMode) {
            // GUÍAS (PDF)
            formDataObj.append('categoria', formData.categoria);
            formDataObj.append('visibilidad', formData.visibilidad);
            formDataObj.append('esta_publicado', formData.esta_publicado ? '1' : '0');
            if (formData.pdf instanceof File) formDataObj.append('pdf', formData.pdf);
            if (formData.imagen_portada instanceof File) formDataObj.append('imagen_portada', formData.imagen_portada);
        } else {
            // RECURSOS
            formDataObj.append('tipo', formData.tipo);
            formDataObj.append('enlace', formData.enlace || ''); // Puede estar vacío si hay contenido
            formDataObj.append('contenido', formData.contenido || '');
            formDataObj.append('tiempo_lectura', formData.tiempo_lectura || '');
            formDataObj.append('destacado', formData.destacado ? '1' : '0');
            formDataObj.append('plan_requerido', formData.plan_requerido);
            if (formData.imagen_portada instanceof File) formDataObj.append('imagen_portada', formData.imagen_portada);
        }
        
        body = formDataObj;
      } else {
        // Envío JSON estándar
        headers['Content-Type'] = 'application/json';
        const bodyData = { ...formData };
        
        // Ajustes de tipos
        if (!isRecursoMode) {
            bodyData.esta_publicado = bodyData.esta_publicado ? 1 : 0;
        }
        // Limpiamos objetos File del JSON para evitar errores
        delete bodyData.pdf;
        if (bodyData.imagen_portada instanceof File) delete bodyData.imagen_portada;
        
        body = JSON.stringify(bodyData);
      }
      
      const response = await fetch(url, {
        method,
        headers,
        body
      });

      const data = await response.json();
      
      if (!response.ok) {
        if (data.errors) {
           const firstError = Object.values(data.errors)[0];
           throw new Error(Array.isArray(firstError) ? firstError[0] : firstError);
        }
        throw new Error(data.message || 'Error al guardar');
      }

      setIsModalOpen(false);
      const tipo = activeTab === 'guias' ? 'Guía' : 'Recurso';
      const accion = currentItem ? 'actualizada' : 'creada';
      mostrarNotificacion(`${tipo} ${accion} correctamente`, 'exito');
      
      if (activeTab === 'guias') {
        fetchGuias();
      } else {
        fetchRecursos();
      }
    } catch (e) {
      console.error(e);
      mostrarNotificacion(e.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredRecursos = recursos.filter(recurso => {
    const matchesSearch = recurso.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          recurso.descripcion.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'todos' || recurso.tipo === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const filteredGuias = guias.filter(guia =>
    guia.titulo.toLowerCase().includes(searchGuias.toLowerCase()) ||
    guia.descripcion.toLowerCase().includes(searchGuias.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-linear-to-br from-orange-50 via-white to-amber-50 relative">
      <HeaderOrientador />

      {/* Notificación */}
      {notificacion && (
        <div className={`fixed top-8 left-1/2 transform -translate-x-1/2 z-[9999] px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-fade-in-out backdrop-blur-md border font-medium text-base max-w-md ${
            notificacion.tipo === 'exito' 
                ? 'bg-green-500/95 text-white border-green-400 shadow-green-500/30' 
                : 'bg-red-500/95 text-white border-red-400 shadow-red-500/30'
        }`}>
            {notificacion.tipo === 'exito' ? (
                <CheckCircle className="w-6 h-6 shrink-0" />
            ) : (
                <AlertCircle className="w-6 h-6 shrink-0" />
            )}
            <span>{notificacion.mensaje}</span>
        </div>
      )}
      
      {/* Header de página */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-orange-100 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                <div className="p-2 bg-linear-to-br from-orange-500 to-amber-500 rounded-xl">
                  <BookOpen className="h-6 w-6 text-white" />
                </div>
                Materiales Educativos
              </h1>
              <p className="text-gray-500 mt-1">Gestiona tus recursos y guías educativas</p>
            </div>
            
            {/* Acciones */}
            <div className="flex items-center gap-3">
               <button 
                 onClick={() => handleOpenModal()}
                 className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2.5 rounded-xl hover:bg-orange-700 shadow-md transition-colors font-medium cursor-pointer"
               >
                 <Plus className="w-5 h-5" />
                 {activeTab === 'guias' ? 'Nueva Guía' : 'Nuevo Recurso'}
               </button>
            </div>
          </div>

          {/* TABS */}
          <div className="flex gap-2 border-b border-orange-200">
            <button
              onClick={() => setActiveTab('recursos')}
              className={`px-4 py-3 font-medium transition-colors border-b-2 ${
                activeTab === 'recursos'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
            >
              <FileText className="w-4 h-4 inline mr-2" />
              Recursos ({recursos.length})
            </button>
            <button
              onClick={() => setActiveTab('guias')}
              className={`px-4 py-3 font-medium transition-colors border-b-2 ${
                activeTab === 'guias'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
            >
              <Download className="w-4 h-4 inline mr-2" />
              Mis Guías ({guias.length})
            </button>
            <button
              onClick={() => setActiveTab('estadisticas')}
              className={`px-4 py-3 font-medium transition-colors border-b-2 ${
                activeTab === 'estadisticas'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
            >
              <BarChart3 className="w-4 h-4 inline mr-2" />
              Estadísticas
            </button>
          </div>

          {/* Filtros - Solo para RECURSOS */}
          {activeTab === 'recursos' && (
            <div className="mt-6 flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar recursos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 w-full border border-orange-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-4 py-2 w-full md:w-48 border border-orange-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="todos">Todos los tipos</option>
                  <option value="artículo">Artículos</option>
                  <option value="guía">Guías</option>
                  <option value="video">Videos</option>
                </select>
            </div>
          )}

          {/* Filtros - Solo para GUÍAS */}
          {activeTab === 'guias' && (
            <div className="mt-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar guías..."
                    value={searchGuias}
                    onChange={(e) => setSearchGuias(e.target.value)}
                    className="pl-10 pr-4 py-2 w-full border border-orange-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        
        {/* TAB: RECURSOS */}
        {activeTab === 'recursos' && (
          <div className="bg-white rounded-2xl shadow-lg border border-orange-100 p-6 min-h-[400px]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <FileText className="h-5 w-5 text-orange-500" />
                Recursos Disponibles
              </h2>
              <span className="text-sm text-gray-500">{filteredRecursos.length} recursos</span>
            </div>

          {loadingRecursos ? (
             <div className="flex justify-center py-12">
               <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
             </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredRecursos.map((recurso) => (
                <div
                    key={recurso.id}
                    className="group relative flex flex-col p-5 bg-white rounded-xl border border-orange-100 hover:border-orange-300 hover:shadow-lg transition-all"
                >
                    <div className="flex items-start justify-between mb-3">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        recurso.tipo === 'artículo' 
                        ? 'bg-orange-100 text-orange-700' 
                        : 'bg-amber-100 text-amber-700'
                    }`}>
                        {recurso.tipo === 'artículo' ? <FileText className="h-3 w-3 inline mr-1" /> : <Download className="h-3 w-3 inline mr-1" />}
                        {recurso.tipo}
                    </span>
                    <div className="flex gap-2">
                        {recurso.destacado && (
                            <Star className="h-4 w-4 text-amber-500 fill-amber-500" title="Destacado" />
                        )}
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleOpenModal(recurso)} className="p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-blue-600 cursor-pointer">
                                <Edit className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDelete(recurso.id)} className="p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-red-600 cursor-pointer">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                    </div>
                    
                    <a href={recurso.enlace} target="_blank" rel="noopener noreferrer" className="block grow">
                        <h4 className="font-bold text-lg text-gray-800 mb-2 group-hover:text-orange-600 transition-colors line-clamp-2">
                            {recurso.titulo}
                        </h4>
                        <p className="text-sm text-gray-500 mb-4 line-clamp-3">{recurso.descripcion}</p>
                    </a>

                      <div className="mt-auto pt-3 border-t border-gray-50 flex items-center justify-between text-xs text-gray-400">
                          <div className="flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              {recurso.tiempo_lectura || 'Variable'}
                          </div>
                          <a href={recurso.enlace} target="_blank" rel="noopener noreferrer" className="flex items-center hover:text-orange-600">
                              Ver recurso <ExternalLink className="ml-1 h-3 w-3" />
                          </a>
                      </div>
                  </div>
                  ))}
              </div>
            )}

          {!loadingRecursos && filteredRecursos.length === 0 && (
            <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
              <Folder className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">No se encontraron recursos</p>
              <button onClick={() => handleOpenModal()} className="text-orange-600 font-medium hover:underline cursor-pointer">
                Crear el primero
              </button>
            </div>
          )}
        </div>
        )}

        {/* TAB: GUÍAS */}
        {activeTab === 'guias' && (
          <div className="bg-white rounded-2xl shadow-lg border border-orange-100 p-6 min-h-[400px]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Download className="h-5 w-5 text-orange-500" />
                Mis Guías y Contenido
              </h2>
              <span className="text-sm text-gray-500">{filteredGuias.length} guías</span>
            </div>

            {loadingGuias ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredGuias.map((guia) => (
                  <div
                    key={guia.id}
                    className="group relative flex flex-col p-5 bg-white rounded-xl border border-orange-100 hover:border-orange-300 hover:shadow-lg transition-all"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        guia.esta_publicado 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {guia.esta_publicado ? 'Publicada' : 'Borrador'}
                      </span>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleOpenModal(guia)} className="p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-blue-600 cursor-pointer">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(guia.id, guia.es_recurso ? 'recursos' : 'guias')} className="p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-red-600 cursor-pointer">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    <h4 className="font-bold text-lg text-gray-800 mb-2 line-clamp-2">
                      {guia.titulo}
                    </h4>
                    <p className="text-sm text-gray-500 mb-4 line-clamp-3">{guia.descripcion}</p>

                    <div className="mt-auto pt-3 border-t border-gray-50 flex items-center justify-between text-xs text-gray-400">
                      <div className="flex items-center">
                        <Tag className="h-3 w-3 mr-1" />
                        {guia.categoria || guia.tipo}
                      </div>
                      <div className="flex items-center">
                        {guia.visibilidad === 'publico' ? 'Público' : 'Premium'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!loadingGuias && filteredGuias.length === 0 && (
              <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                <Folder className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-2">No se encontraron guías</p>
                <button onClick={() => handleOpenModal()} className="text-orange-600 font-medium hover:underline cursor-pointer">
                  Crear la primera
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB: ESTADÍSTICAS */}
        {activeTab === 'estadisticas' && (
          <div className="space-y-6">
            {loadingStats ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
              </div>
            ) : stats ? (
              <>
                {/* Resumen General */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white rounded-2xl shadow-lg border border-orange-100 p-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-orange-100 rounded-xl">
                        <FileText className="h-6 w-6 text-orange-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Total Recursos</p>
                        <p className="text-2xl font-bold text-gray-800">{stats.total_recursos || 0}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl shadow-lg border border-orange-100 p-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-green-100 rounded-xl">
                        <Download className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Total Guías</p>
                        <p className="text-2xl font-bold text-gray-800">{stats.total_guias || 0}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl shadow-lg border border-orange-100 p-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-blue-100 rounded-xl">
                        <Eye className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Total Vistas</p>
                        <p className="text-2xl font-bold text-gray-800">{stats.total_vistas || 0}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recursos Más Vistos */}
                {stats.recursos_mas_vistos && stats.recursos_mas_vistos.length > 0 && (
                  <div className="bg-white rounded-2xl shadow-lg border border-orange-100 p-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-orange-500" />
                      Recursos Más Vistos
                    </h3>
                    <div className="space-y-3">
                      {stats.recursos_mas_vistos.map((recurso, index) => (
                        <div key={recurso.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <span className="flex items-center justify-center w-8 h-8 bg-orange-100 text-orange-600 rounded-full font-bold text-sm">
                              {index + 1}
                            </span>
                            <div>
                              <p className="font-medium text-gray-800">{recurso.titulo}</p>
                              <p className="text-xs text-gray-500">{recurso.tipo}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <Eye className="h-4 w-4" />
                            <span className="font-semibold">{recurso.vistas || 0}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                <BarChart3 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No hay estadísticas disponibles</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal Crear/Editar */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-scale-in max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
                    <h3 className="text-xl font-bold text-gray-800">
                        {activeTab === 'guias' 
                          ? (currentItem ? 'Editar Guía' : 'Nueva Guía')
                          : (currentItem ? 'Editar Recurso' : 'Nuevo Recurso')
                        }
                    </h3>
                    <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                        <X className="w-6 h-6" />
                    </button>
                </div>
                
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Campos comunes */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
                        <input
                            required
                            type="text"
                            value={formData.titulo}
                            onChange={e => setFormData({...formData, titulo: e.target.value})}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                            placeholder="Ej: Guía de Estudios 2025"
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Descripción *</label>
                        <textarea
                            required
                            rows="3"
                            value={formData.descripcion}
                            onChange={e => setFormData({...formData, descripcion: e.target.value})}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                            placeholder="Breve descripción del contenido..."
                        />
                    </div>

                    {/* CAMPOS PARA RECURSOS */}
                    {(activeTab === 'recursos' || (currentItem && currentItem.es_recurso)) && (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo *</label>
                                <select
                                    required
                                    value={formData.tipo}
                                    onChange={e => setFormData({...formData, tipo: e.target.value})}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                                >
                                    <option value="artículo">Artículo</option>
                                    <option value="guía">Guía</option>
                                    <option value="video">Video</option>
                                    <option value="otro">Otro</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Plan Requerido *</label>
                                <select
                                    required
                                    value={formData.plan_requerido}
                                    onChange={e => setFormData({...formData, plan_requerido: e.target.value})}
                                    className="w-full px-4 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-blue-50/30"
                                >
                                    <option value="gratuito">Gratuito (Todos)</option>
                                    <option value="pro">Plan PRO</option>
                                    <option value="pro_plus">Plan PRO PLUS</option>
                                </select>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Imagen Portada</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={e => setFormData({...formData, imagen_portada: e.target.files?.[0] || null})}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-sm"
                                />
                                {currentItem && (
                                    <p className="text-xs text-gray-400 mt-1">Opcional. Deja vacío para mantener actual.</p>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Enlace / URL {(!formData.contenido) ? '*' : '(Opcional)'}</label>
                                <input
                                    required={!formData.contenido}
                                    type="url"
                                    value={formData.enlace}
                                    onChange={e => setFormData({...formData, enlace: e.target.value})}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                                    placeholder={formData.contenido ? "Opcional si hay contenido" : "https://..."}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tiempo Lectura</label>
                                <input
                                    type="text"
                                    value={formData.tiempo_lectura}
                                    onChange={e => setFormData({...formData, tiempo_lectura: e.target.value})}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                                    placeholder="Ej: 10 min"
                                />
                            </div>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Contenido del Artículo</label>
                             <ReactQuill
                                theme="snow"
                                value={formData.contenido}
                                onChange={(value) => setFormData({...formData, contenido: value})}
                                className="bg-white h-64 mb-12" // Altura y margen para la toolbar
                                placeholder="Escribe aquí el contenido completo del artículo con formato..."
                                modules={{
                                    toolbar: [
                                        [{ 'header': [1, 2, 3, false] }],
                                        ['bold', 'italic', 'underline', 'strike'],
                                        [{ 'color': [] }, { 'background': [] }],
                                        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                                        ['link', 'image', 'clean']
                                    ]
                                }}
                            />
                        </div>

                        <div className="flex items-center gap-2 pt-2">
                            <input
                                type="checkbox"
                                id="destacado"
                                checked={formData.destacado}
                                onChange={e => setFormData({...formData, destacado: e.target.checked})}
                                className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
                            />
                            <label htmlFor="destacado" className="text-sm text-gray-700 select-none cursor-pointer">
                                Destacar este recurso (aparecerá primero)
                            </label>
                        </div>
                      </>
                    )}

                    {/* CAMPOS PARA GUÍAS */}
                    {(activeTab === 'guias' && !(currentItem && currentItem.es_recurso)) && (
                      <>
                        {/* Categoría - IMPORTANTE, justo después del título */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Categoría *</label>
                            <select
                                required
                                value={formData.categoria}
                                onChange={e => setFormData({...formData, categoria: e.target.value})}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                            >
                                <option value="profesiones">Profesiones</option>
                                <option value="estudios">Estudios</option>
                                <option value="competencias">Competencias</option>
                                <option value="tecnicas">Técnicas</option>
                                <option value="otro">Otro</option>
                            </select>
                        </div>

                        {/* Archivos */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Archivo PDF {!currentItem && '*'}
                                </label>
                                <input
                                    type="file"
                                    accept=".pdf"
                                    onChange={e => setFormData({...formData, pdf: e.target.files?.[0] || null})}
                                    required={!currentItem}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-sm"
                                />
                                {currentItem && (
                                  <p className="text-xs text-gray-500 mt-1">Dejar vacío para mantener el PDF actual</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Imagen Portada {!currentItem && '*'}
                                </label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={e => setFormData({...formData, imagen_portada: e.target.files?.[0] || null})}
                                    required={!currentItem}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-sm"
                                />
                                {currentItem && (
                                  <p className="text-xs text-gray-500 mt-1">Dejar vacío para mantener la imagen actual</p>
                                )}
                            </div>
                        </div>

                        {/* Visibilidad */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Visibilidad</label>
                            <select
                                value={formData.visibilidad}
                                onChange={e => setFormData({...formData, visibilidad: e.target.value})}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                            >
                                <option value="publico">Público</option>
                                <option value="privado">Premium</option>
                            </select>
                        </div>

                        {/* Estado de Publicación - Botón grande */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Estado de Publicación</label>
                            <button
                                type="button"
                                onClick={() => setFormData(prev => ({...prev, esta_publicado: !prev.esta_publicado}))}
                                className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold transition ${
                                    formData.esta_publicado
                                        ? 'bg-green-100 text-green-700 border-2 border-green-400 hover:bg-green-200'
                                        : 'bg-gray-100 text-gray-700 border-2 border-gray-300 hover:border-orange-300 hover:bg-gray-50'
                                }`}
                            >
                                {formData.esta_publicado ? (
                                    <>
                                        <CheckCircle className="w-5 h-5" />
                                        Publicada ahora
                                    </>
                                ) : (
                                    <>
                                        <FileText className="w-5 h-5" />
                                        Guardar como borrador
                                    </>
                                )}
                            </button>
                            <p className="text-xs text-gray-600 mt-2">
                                {formData.esta_publicado ? 'La guía será visible inmediatamente' : 'La guía se guardará sin publicar'}
                            </p>
                        </div>
                      </>
                    )}

                    <div className="pt-4 flex gap-3 justify-end border-t border-gray-100">
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium cursor-pointer"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium shadow-md disabled:opacity-50 enabled:cursor-pointer"
                        >
                            {isSubmitting ? 'Guardando...' : activeTab === 'guias' ? 'Guardar Guía' : 'Guardar Recurso'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}

    </div>
  );
};

export default OrientadorRecursos;
