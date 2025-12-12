import React, { useState, useEffect } from 'react';
import { getMisGuias, createGuia, deleteGuia, downloadGuia } from '../../api';
import { Plus, Trash2, FileText, Download, X, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContextFixed';

function Guias() {
    //  Obtener token de autenticación del contexto
    const { token } = useAuth();

    //  Estados para datos y UI
    const [guias, setGuias] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [submitError, setSubmitError] = useState(null);
    const [fieldErrors, setFieldErrors] = useState({});

    const [formData, setFormData] = useState({
        titulo: '',
        descripcion: '',
        categoria: '',
        visibilidad: 'publico',
        esta_publicado: false,
    });
  
    //  Estado de los archivos (PDF e imagen)
    const [files, setFiles] = useState({
        pdf: null,
        imagen_portada: null,
    });

    //  Cargar guías al crear el componente
    useEffect(() => {
        fetchGuias();
    }, []);

    //  Función para obtener las guías del orientador desde la API
    const fetchGuias = async () => {
        try {
            setLoading(true); // Activar spinner
            setError(null); // Limpiar errores previos

            // Llamar a la API centralizada
            const data = await getMisGuias();
            setGuias(data || []); // Actualizar lista de guías
        } catch (err) {
            console.error('Error:', err);
            setError(err.message || 'Error al cargar guías');
        } finally {
            setLoading(false);
        }
    };

    //  Manejar cambios en inputs de texto y checkbox
    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    //  Manejar cambios en inputs de archivo
    const handleFileChange = (e) => {
        const { name, files: fileList } = e.target;
        if (fileList.length > 0) {
            setFiles(prev => ({
                ...prev,
                [name]: fileList[0]
            }));
        }
    };

    //  Enviar formulario para crear nueva guía
    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitError(null);
        setSubmitLoading(true);

        try {
            //  Validar que ambos archivos estén presentes
            if (!files.pdf || !files.imagen_portada) {
                throw new Error('Debes adjuntar tanto el PDF como la imagen de portada');
            }

            //  Construir FormData con todos los campos
            const formDataMultipart = new FormData();
            formDataMultipart.append('titulo', formData.titulo);
            formDataMultipart.append('descripcion', formData.descripcion);
            formDataMultipart.append('categoria', formData.categoria);
            formDataMultipart.append('visibilidad', formData.visibilidad);
            formDataMultipart.append('esta_publicado', formData.esta_publicado);
            formDataMultipart.append('pdf', files.pdf);
            formDataMultipart.append('imagen_portada', files.imagen_portada);

            //  Llamar a la API y agregar la nueva guía si no ocurrió ningun error
            const newData = await createGuia(formDataMultipart);
            setGuias(prev => [newData.data, ...prev]);

            //  Resetear formulario y cerrar modal
            setFormData({
                titulo: '',
                descripcion: '',
                categoria: '',
                visibilidad: 'publico',
                esta_publicado: false,
            });
            setFiles({ pdf: null, imagen_portada: null });
            setShowForm(false);
        } catch (err) {
            console.error('Error:', err);
            
            //  Si es error 422 de validación, guardar errores por campo
            if (err.errors) {
                setFieldErrors(err.errors);
                setSubmitError(err.message || 'Error de validación');
            } else {
                setSubmitError(err.message || 'Error al crear guía');
            }
        } finally {
            setSubmitLoading(false);
        }
    };

    //  Eliminar una guía
    const handleDelete = async (guiaId) => {
        //  Confirmar antes de eliminar
        if (!window.confirm('¿Estás seguro de que deseas eliminar esta guía?')) {
            return;
        }

        try {
            // Llamar a la API y borrar la guía si no ocurrió un error
            await deleteGuia(guiaId);
            
            //  Remover de la lista local
            setGuias(prev => prev.filter(g => g.id !== guiaId));
        } catch (err) {
            console.error('Error:', err);
            setError(err.message || 'Error al eliminar guía');
        }
    };

    //  Descargar PDF de una guía
    const handleDownload = async (guia) => {
        try {
            //  Llamar a la API para descargar el blob, crear URL temporal y elemento invisible para forzar descarga
            const blob = await downloadGuia(guia.id);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${guia.slug}.pdf`;
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            setError('Error al descargar la guía');
        }
    };

    return (
    <div className="space-y-6">
        {/* Header */}
        <Header />
        <div className="flex justify-between items-center">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Guías Educativas</h1>
                <p className="text-gray-600 mt-1">Crea y gestiona guías PDF para tus estudiantes</p>
            </div>
            <button
                onClick={() => setShowForm(!showForm)}
                className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
            >
                <Plus className="w-5 h-5" />
                Nueva Guía
            </button>   
        </div>

        {/* Formulario */}
        {showForm && (
        <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-indigo-600">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">Crear Nueva Guía</h2>
                <button
                    onClick={() => setShowForm(false)}
                    className="text-gray-500 hover:text-gray-700"
                >
                    <X className="w-6 h-6" />
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {submitError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm flex gap-2">
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    {submitError}
                </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
                        <input
                            type="text"
                            name="titulo"
                            value={formData.titulo}
                            onChange={handleInputChange}
                            required
                            placeholder="Ej: Guía de Profesiones Sanitarias"
                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 outline-none ${
                                fieldErrors.titulo 
                                    ? 'border-red-500 focus:ring-red-500' 
                                    : 'border-gray-300 focus:ring-indigo-600 focus:border-transparent'
                            }`}
                        />
                        {fieldErrors.titulo && (
                            <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                                <AlertCircle className="w-4 h-4" />
                                {fieldErrors.titulo[0]}
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Categoría *</label>
                        <select
                            name="categoria"
                            value={formData.categoria}
                            onChange={handleInputChange}
                            required
                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 outline-none ${
                                fieldErrors.categoria 
                                    ? 'border-red-500 focus:ring-red-500' 
                                    : 'border-gray-300 focus:ring-indigo-600 focus:border-transparent'
                            }`}
                        >
                            <option value="">Selecciona una categoría</option>
                            <option value="profesiones">Profesiones</option>
                            <option value="estudios">Estudios y Formación</option>
                            <option value="competencias">Competencias</option>
                            <option value="tecnicas">Técnicas de Búsqueda</option>
                            <option value="otro">Otro</option>
                        </select>
                        {fieldErrors.categoria && (
                            <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                                <AlertCircle className="w-4 h-4" />
                                {fieldErrors.categoria[0]}
                            </p>
                        )}
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Descripción *</label>
                    <textarea
                        name="descripcion"
                        value={formData.descripcion}
                        onChange={handleInputChange}
                        required
                        placeholder="Describe el contenido de la guía..."
                        rows="3"
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 outline-none ${
                            fieldErrors.descripcion 
                                ? 'border-red-500 focus:ring-red-500' 
                                : 'border-gray-300 focus:ring-indigo-600 focus:border-transparent'
                        }`}
                    />
                    {fieldErrors.descripcion && (
                        <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                            <AlertCircle className="w-4 h-4" />
                            {fieldErrors.descripcion[0]}
                        </p>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Archivo PDF *</label>
                        <input
                            type="file"
                            name="pdf"
                            accept=".pdf"
                            onChange={handleFileChange}
                            required
                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 outline-none text-sm ${
                                fieldErrors.pdf 
                                    ? 'border-red-500 focus:ring-red-500' 
                                    : 'border-gray-300 focus:ring-indigo-600 focus:border-transparent'
                            }`}
                        />
                        {files.pdf && (
                        <p className="text-xs text-green-600 mt-1">✓ {files.pdf.name}</p>
                        )}
                        {fieldErrors.pdf && (
                            <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                                <AlertCircle className="w-4 h-4" />
                                {fieldErrors.pdf[0]}
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Imagen de Portada *</label>
                        <input
                            type="file"
                            name="imagen_portada"
                            accept="image/*"
                            onChange={handleFileChange}
                            required
                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 outline-none text-sm ${
                                fieldErrors.imagen_portada 
                                    ? 'border-red-500 focus:ring-red-500' 
                                    : 'border-gray-300 focus:ring-indigo-600 focus:border-transparent'
                            }`}
                        />
                        {files.imagen_portada && (
                        <p className="text-xs text-green-600 mt-1">✓ {files.imagen_portada.name}</p>
                        )}
                        {fieldErrors.imagen_portada && (
                            <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                                <AlertCircle className="w-4 h-4" />
                                {fieldErrors.imagen_portada[0]}
                            </p>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Visibilidad *</label>
                        <select
                            name="visibilidad"
                            value={formData.visibilidad}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-600 focus:border-transparent outline-none"
                        >
                            <option value="publico">Pública (todos ven)</option>
                            <option value="privado">Premium (solo premium)</option>
                        </select>
                    </div>

                    <div className="flex items-end">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                name="esta_publicado"
                                checked={formData.esta_publicado}
                                onChange={handleInputChange}
                                className="rounded"
                            />
                            <span className="text-sm font-medium text-gray-700">Publicar ahora</span>
                        </label>
                    </div>
                </div>

                <div className="flex gap-2 pt-2">
                    <button
                        type="submit"
                        disabled={submitLoading}
                        className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
                    >
                        {submitLoading ? 'Guardando...' : 'Crear Guía'}
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

        {/* Errores */}
        {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded text-red-700 flex gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            {error}
        </div>
        )}

        {/* Loading */}
        {loading && (
        <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
        )}

        {/* Sin guías creadas */}
        {!loading && guias.length === 0 && !showForm && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">Aún no has creado guías educativas</p>
            <button
                onClick={() => setShowForm(true)}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
            >
                Crear Primera Guía
            </button>
        </div>
        )}

        {/* Lista de Guías */}
        {!loading && guias.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {guias.map((guia) => (
            <div
                key={guia.id}
                className="bg-white rounded-lg shadow hover:shadow-lg transition overflow-hidden flex flex-col"
            >
            {/* Portada */}
            {guia.imagen_portada && (
                <div className="h-40 bg-gray-200 overflow-hidden">
                    <img
                        src={guia.imagen_portada}
                        alt={guia.titulo}
                        className="w-full h-full object-cover"
                    />
                </div>
            )}

                {/* Contenido */}
                <div className="p-4 flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-2">
                        <h3 className="text-lg font-bold text-gray-900 line-clamp-2 flex-1">{guia.titulo}</h3>
                        <span className={`text-xs font-semibold px-2 py-1 rounded whitespace-nowrap ml-2 ${
                            guia.esta_publicado
                                ?   'bg-green-100 text-green-700'
                                :   'bg-yellow-100 text-yellow-700'
                        }`}>
                        {guia.esta_publicado ? 'Publicada' : 'Borrador'}
                        </span>
                    </div>

                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                        {guia.descripcion}
                    </p>

                    <div className="text-xs text-gray-500 space-y-1 mb-4">
                        <p>{guia.categoria}</p>
                        <p>{guia.numero_paginas} páginas</p>
                        <p>{guia.tamanio_archivo_formateado}</p>
                    </div>

                    {guia.visibilidad === 'privado' && (
                    <p className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded mb-3">
                        Solo para usuarios premium
                    </p>
                    )}

                    {/* Botones */}
                    <div className="mt-auto flex gap-2 pt-3 border-t border-gray-200">
                        <button
                            onClick={() => handleDownload(guia)}
                            className="flex-1 flex items-center justify-center gap-1 bg-indigo-50 text-indigo-600 px-3 py-2 rounded text-sm font-medium hover:bg-indigo-100 transition"
                        >
                            <Download className="w-4 h-4" />
                            Descargar
                        </button>
                        <button
                            onClick={() => handleDelete(guia.id)}
                            className="bg-red-50 text-red-600 px-3 py-2 rounded hover:bg-red-100 transition"
                            title="Eliminar"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        ))}
        </div>
    )}
    </div>
    );
}

export default Guias;
