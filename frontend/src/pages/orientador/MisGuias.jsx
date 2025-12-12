import React, { useState, useEffect } from 'react';
import Header from '../../components/Header';
import { getMisGuias, createGuia, updateGuia, deleteGuia, downloadGuia, getPalabrasClavePopulares } from '../../api';
import { Plus, Trash2, FileText, Download, X, AlertCircle, Tag, CheckCircle, Book, HardDrive, Edit2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContextFixed';

function MisGuias() {
    //  Obtener token de autenticación del contexto
    const { token } = useAuth();

    //  Estados para datos y UI
    const [guias, setGuias] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [submitError, setSubmitError] = useState(null);
    const [editingId, setEditingId] = useState(null);
    const [propuestasPalabrasClave, setPropuestasPalabrasClave] = useState([]);
    const [palabraClaveInput, setPalabraClaveInput] = useState('');
    const [erroresValidacion, setErroresValidacion] = useState({});
    const [notificacion, setNotificacion] = useState(null);

    const [formData, setFormData] = useState({
        titulo: '',
        descripcion: '',
        categoria: '',
        visibilidad: 'publico',
        esta_publicado: false,
        palabras_clave: [],
    });

    //  Estado de los archivos (PDF e imagen)
    const [files, setFiles] = useState({
        pdf: null,
        imagen_portada: null,
    });

    //  Cargar guías y palabras clave al crear el componente
    useEffect(() => {
        fetchGuias();
        fetchPropuestasPalabrasClave();
    }, []);

    //  Función para mostrar notificaciones que desaparecen automáticamente
    const mostrarNotificacion = (mensaje, tipo = 'exito') => {
        setNotificacion({ mensaje, tipo });
        //  El mensaje desaparece después de 3 segundos
        setTimeout(() => {
            setNotificacion(null);
        }, 3000);
    };

    //  Cargar palabras clave sugeridas desde el backend
    const fetchPropuestasPalabrasClave = async () => {
        try {
            //  Usar función centralizada de api.js
            const data = await getPalabrasClavePopulares();
            setPropuestasPalabrasClave(data.palabras_clave || []);
        } catch (err) {
            console.error('Error cargando palabras clave:', err);
        }
    };

    //  Cargar todas las guías del orientador autenticado
    const fetchGuias = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await getMisGuias();
            setGuias(data || []);
        } catch (err) {
            console.error('Error completo:', err);
            //  Capturar mensaje de error del servidor o mensaje genérico
            setError(err.message || err.errors?.message || 'Error al cargar guías');
        } finally {
            setLoading(false);
        }
    };

    //  Maneja cambios en los inputs del formulario
    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));

        //  Limpiar error del campo cuando el usuario empieza a escribir
        if (erroresValidacion[name]) {
            setErroresValidacion(prev => ({
                ...prev,
                [name]: null
            }));
        }
    };

    //  Maneja selección de archivos (PDF e imagen de portada)
    const handleFileChange = (e) => {
        const { name, files: fileList } = e.target;
        if (fileList.length > 0) {
            setFiles(prev => ({
                ...prev,
                [name]: fileList[0]
            }));

            //  Limpiar error del archivo cuando se selecciona uno
            if (erroresValidacion[name]) {
                setErroresValidacion(prev => ({
                    ...prev,
                    [name]: null
                }));
            }
        }
    };

    //  Añade o sugiere palabras clave al formulario
    const agregarPalabraClave = (palabra) => {
        const palabraLimpia = palabra.trim().toLowerCase();

        //  No agregar si ya existe o está vacía
        if (palabraLimpia && !formData.palabras_clave.includes(palabraLimpia)) {
            setFormData(prev => ({
                ...prev,
                palabras_clave: [...prev.palabras_clave, palabraLimpia]
            }));
            setPalabraClaveInput('');
        }
    };

    //  Captura cuando el usuario presiona Enter al escribir palabras clave
    const handlePalabraClave = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            agregarPalabraClave(palabraClaveInput);
        }
    };

    //  Elimina una palabra clave del array
    const removePalabraClave = (palabra) => {
        setFormData(prev => ({
            ...prev,
            palabras_clave: prev.palabras_clave.filter(p => p !== palabra)
        }));
    };

    //  Valida que los campos obligatorios estén completos
    const validarFormulario = () => {
        const errores = {};

        if (!formData.titulo.trim()) {
            errores.titulo = 'El título es requerido';
        }
        if (!formData.categoria) {
            errores.categoria = 'La categoría es requerida';
        }
        if (!formData.descripcion.trim()) {
            errores.descripcion = 'La descripción es requerida';
        }
        //  En modo creación los archivos son obligatorios
        if (!editingId && !files.pdf) {
            errores.pdf = 'El archivo PDF es requerido';
        }
        if (!editingId && !files.imagen_portada) {
            errores.imagen_portada = 'La imagen de portada es requerida';
        }
        return errores;
    };

    //  Maneja el envío del formulario de creación/edición de guías
    const handleSubmit = async (e) => {
        e.preventDefault();

        //  Validar formulario localmente primero
        const errores = validarFormulario();
        if (Object.keys(errores).length > 0) {
            setErroresValidacion(errores);
            return;
        }

        setSubmitError(null);
        setSubmitLoading(true);
        
        try {
            //  Determinar si hay archivos nuevos (para decidir cómo enviar)
            const tieneArchivosPdf = files.pdf !== null && files.pdf !== undefined;
            const tieneArchivosImagen = files.imagen_portada !== null && files.imagen_portada !== undefined;
            const usarFormData = !editingId || tieneArchivosPdf || tieneArchivosImagen;

            let respuesta;

            if (usarFormData) {
                //  Crear FormData con los campos y archivos
                const payload = new FormData();
                payload.append('titulo', formData.titulo);
                payload.append('descripcion', formData.descripcion);
                payload.append('categoria', formData.categoria);
                payload.append('visibilidad', formData.visibilidad);
                payload.append('esta_publicado', formData.esta_publicado ? '1' : '0');
                payload.append('palabras_clave', formData.palabras_clave.join(','));

                //  Adjuntar archivos si existen
                if (tieneArchivosPdf) {
                    payload.append('pdf', files.pdf);
                }
                if (tieneArchivosImagen) {
                    payload.append('imagen_portada', files.imagen_portada);
                }

                //  Usar createGuia o updateGuia según corresponda
                if (editingId) {
                    respuesta = await updateGuia(editingId, payload);
                } else {
                    respuesta = await createGuia(payload);
                }
            } else {
                //  Modo edición SIN archivos nuevos: crear FormData sin archivos (updateGuia manejará el método PUT automáticamente)
                const payload = new FormData();
                payload.append('titulo', formData.titulo);
                payload.append('descripcion', formData.descripcion);
                payload.append('categoria', formData.categoria);
                payload.append('visibilidad', formData.visibilidad);
                payload.append('esta_publicado', formData.esta_publicado ? '1' : '0');
                payload.append('palabras_clave', formData.palabras_clave.join(','));

                //  Usar updateGuia de api.js sin archivos nuevos
                respuesta = await updateGuia(editingId, payload);
            }

            //  Procesar la respuesta
            const guiaActualizada = respuesta.data || respuesta;

            if (editingId) {
                //  En modo edición: reemplazar la guía en la lista
                const nuevasGuias = guias.map(g => g.id === editingId ? guiaActualizada : g);
                setGuias(nuevasGuias);
                setEditingId(null);
            } else {
                //  En modo creación: agregar a la lista
                setGuias(prev => [guiaActualizada, ...prev]);
            }

            //  Limpiar formulario
            setFormData({
                titulo: '',
                descripcion: '',
                categoria: '',
                visibilidad: 'publico',
                esta_publicado: false,
                palabras_clave: [],
            });
            setFiles({ pdf: null, imagen_portada: null });
            setPalabraClaveInput('');
            setErroresValidacion({});
            setShowForm(false);
            
            //  Mostrar notificación de éxito
            const accion = editingId ? 'actualizada' : 'creada';
            mostrarNotificacion(`Guía ${accion} correctamente`, 'exito');
            
            //  Actualizar palabras clave sugeridas
            fetchPropuestasPalabrasClave();
        } catch (err) {
            console.error('Error:', err);
            
            //  Capturar errores de validación del servidor
            if (err.errors && typeof err.errors === 'object') {
                setErroresValidacion(err.errors);
                setSubmitError('Por favor, revisa los errores en el formulario');
            } else {
                setSubmitError(err.message || 'Error al guardar la guía');
            }
        } finally {
            setSubmitLoading(false);
        }
    };

    //  Elimina una guía después de confirmar
    const handleDelete = async (guiaId) => {
        if (!window.confirm('¿Estás seguro de que deseas eliminar esta guía?')) {
            return;
        }

        try {
            await deleteGuia(guiaId);
            //  Eliminar de la lista local
            setGuias(prev => prev.filter(g => g.id !== guiaId));

            //  Mostrar notificación de éxito
            mostrarNotificacion('Guía eliminada correctamente', 'exito');
        } catch (err) {
            console.error('Error:', err);
            setError(err.message || err.errors?.message || 'Error al eliminar la guía');
        }
    };

    //  Retorna la etiqueta legible de la categoría
    const getLabelCategoria = (categoria) => {
        const categorias = {
            'profesiones': 'Profesiones',
            'estudios': 'Estudios',
            'competencias': 'Competencias',
            'tecnicas': 'Técnicas',
            'otro': 'Otro'
        };
        return categorias[categoria] || categoria;
    };

    //  Descarga el PDF de una guía
    const handleDownload = async (guia) => {
        try {
            //  Usar función centralizada de api.js que retorna blob
            const blob = await downloadGuia(guia.id);
            
            //  Crear URL temporal y simular descarga
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${guia.slug}.pdf`;
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Error:', err);
            setError(err.message || 'Error al descargar la guía');
        }
    };

    //  Carga una guía en el formulario para editar
    const handleEdit = (guia) => {
        setFormData({
            titulo: guia.titulo,
            descripcion: guia.descripcion,
            categoria: guia.categoria,
            visibilidad: guia.visibilidad,
            esta_publicado: guia.esta_publicado,
            palabras_clave: guia.palabras_clave ? guia.palabras_clave.split(',').map(p => p.trim()) : [],
        });
        setFiles({ pdf: null, imagen_portada: null });
        setEditingId(guia.id);
        setShowForm(true);
        setSubmitError(null);
        setPalabraClaveInput('');
    };

    return (
    <>
        <Header />
        
        {/* Notificación flotante */}
        {notificacion && (
            <div className={`fixed top-20 left-1/2 transform -translate-x-1/2 z-50 p-4 rounded-lg shadow-lg flex items-center gap-2 animate-fade-in-out ${
                notificacion.tipo === 'exito' 
                    ?   'bg-green-100 text-green-700 border border-green-300' 
                    :   'bg-red-100 text-red-700 border border-red-300'
            }`}>
                {notificacion.tipo === 'exito' ? (
                    <CheckCircle className="w-5 h-5 flex-shrink-0" />
                ) : (
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                )}
                <span className="font-medium">{notificacion.mensaje}</span>
            </div>
        )}
        
        <main className="min-h-screen bg-gray-50">
            <div className="container mx-auto px-4 py-8">
                <div className="space-y-6">
                    {/* Header interno */}
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Mis Guías</h1>
                            <p className="text-gray-600 mt-1">Gestiona tus guías educativas</p>
                        </div>
                        <button
                            onClick={() => setShowForm(!showForm)}
                            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
                        >
                            {showForm ? (
                                <>
                                    <X className="w-5 h-5" />
                                    Cerrar Guía
                                </>
                            ) : (
                                <>
                                    <Plus className="w-5 h-5" />
                                    Nueva Guía
                                </>
                            )}
                        </button>
                    </div>

                    {/* Formulario */}
                    {showForm && (
                    <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-indigo-600">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-gray-900">
                                {editingId ? 'Editar Guía' : 'Crear Nueva Guía'}
                            </h2>
                            <button
                                onClick={() => {
                                    setShowForm(false);
                                    setEditingId(null);
                                }}
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
                                        className={`w-full px-4 py-2 border rounded-lg focus:ring-indigo-600 focus:border-transparent outline-none ${erroresValidacion.titulo ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                                    />
                                    {erroresValidacion.titulo && (
                                    <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                                        <AlertCircle className="w-4 h-4" /> {erroresValidacion.titulo}
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
                                        className={`w-full px-4 py-2 border rounded-lg focus:ring-indigo-600 focus:border-transparent outline-none ${erroresValidacion.categoria ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                                    >
                                        <option value="">Selecciona una categoría</option>
                                        <option value="profesiones">Profesiones</option>
                                        <option value="estudios">Estudios y Formación</option>
                                        <option value="competencias">Competencias</option>
                                        <option value="tecnicas">Técnicas de Búsqueda</option>
                                        <option value="otro">Otro</option>
                                    </select>
                                    {erroresValidacion.categoria && (
                                    <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                                        <AlertCircle className="w-4 h-4" /> {erroresValidacion.categoria}
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
                                    className={`w-full px-4 py-2 border rounded-lg focus:ring-indigo-600 focus:border-transparent outline-none ${erroresValidacion.descripcion ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                                />
                                {erroresValidacion.descripcion && (
                                <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                                    <AlertCircle className="w-4 h-4" /> {erroresValidacion.descripcion}
                                </p>
                                )}
                            </div>

                            {/* PALABRAS CLAVE */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                    <Tag className="w-4 h-4" /> Palabras clave *
                                </label>
                                <div className="space-y-2">
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={palabraClaveInput}
                                            onChange={(e) => setPalabraClaveInput(e.target.value)}
                                            onKeyDown={handlePalabraClave}
                                            placeholder="Escribe una palabra y presiona Enter..."
                                            className={`w-full px-4 py-2 border rounded-lg focus:ring-indigo-600 focus:border-transparent outline-none ${erroresValidacion.palabras_clave ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                                        />
                                    </div>

                                    {/* Palabras clave añadidas */}
                                    {formData.palabras_clave.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                        {formData.palabras_clave.map((palabra, id) => (
                                        <span key={id} className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm">
                                            {palabra}
                                            <button
                                                type="button"
                                                onClick={() => removePalabraClave(palabra)}
                                                className="hover:text-indigo-900 transition"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </span>
                                        ))}
                                    </div>
                                    )}

                                    {/* Sugerencias */}
                                    {propuestasPalabrasClave.length > 0 && formData.palabras_clave.length < 5 && (
                                    <div className="mt-2 pt-2 border-t border-gray-200">
                                        <p className="text-xs text-gray-600 mb-2">Palabras clave populares:</p>
                                        <div className="flex flex-wrap gap-2">
                                            {propuestasPalabrasClave
                                                .filter(p => !formData.palabras_clave.includes(p.toLowerCase()))
                                                .slice(0, 5)
                                                .map((palabra, id) => (
                                                <button
                                                    key={id}
                                                    type="button"
                                                    onClick={() => agregarPalabraClave(palabra)}
                                                    className="text-xs bg-gray-100 hover:bg-indigo-100 text-gray-700 hover:text-indigo-700 px-2 py-1 rounded transition"
                                                >
                                                    + {palabra}
                                                </button>
                                                ))}
                                        </div>
                                    </div>
                                    )}

                                    {erroresValidacion.palabras_clave && (
                                    <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                                        <AlertCircle className="w-4 h-4" /> {erroresValidacion.palabras_clave}
                                    </p>
                                    )}
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Archivo PDF {!editingId && '*'}
                                    </label>
                                    <input
                                        type="file"
                                        name="pdf"
                                        accept=".pdf"
                                        onChange={handleFileChange}
                                        required={!editingId}
                                        className={`w-full px-4 py-2 border rounded-lg focus:ring-indigo-600 focus:border-transparent outline-none text-sm ${erroresValidacion.pdf ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                                    />
                                    {files.pdf ? (
                                    <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                                        <CheckCircle className="w-4 h-4" /> {files.pdf.name}
                                    </p>
                                    ) : erroresValidacion.pdf ? (
                                    <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                                        <AlertCircle className="w-4 h-4" /> {erroresValidacion.pdf}
                                    </p>
                                    ) : editingId ? (
                                    <p className="text-xs text-indigo-600 mt-1">✓ PDF actual guardado</p>
                                    ) : null}
                                    {editingId && (
                                    <p className="text-xs text-gray-500 mt-1">Selecciona uno nuevo para reemplazar</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Imagen de Portada {!editingId && '*'}
                                    </label>
                                    <input
                                        type="file"
                                        name="imagen_portada"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        required={!editingId}
                                        className={`w-full px-4 py-2 border rounded-lg focus:ring-indigo-600 focus:border-transparent outline-none text-sm ${erroresValidacion.imagen_portada ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                                    />
                                    {files.imagen_portada ? (
                                    <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                                        <CheckCircle className="w-4 h-4" /> {files.imagen_portada.name}
                                    </p>
                                    ) : erroresValidacion.imagen_portada ? (
                                    <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                                        <AlertCircle className="w-4 h-4" /> {erroresValidacion.imagen_portada}
                                    </p>
                                    ) : editingId ? (
                                    <p className="text-xs text-indigo-600 mt-1">✓ Imagen actual guardada</p>
                                    ) : null}
                                    {editingId && (
                                    <p className="text-xs text-gray-500 mt-1">Selecciona una nueva para reemplazar</p>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
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

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Estado de Publicación</label>
                                    <button
                                        type="button"
                                        onClick={() => setFormData(prev => ({...prev, esta_publicado: !prev.esta_publicado}))}
                                        className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
                                            formData.esta_publicado
                                                ? 'bg-green-100 text-green-700 border-2 border-green-400'
                                                : 'bg-gray-100 text-gray-700 border-2 border-gray-300 hover:border-green-300'
                                        }`}
                                    >
                                        {formData.esta_publicado ? (
                                            <>
                                                <CheckCircle className="w-5 h-5" />
                                                Publicar ahora
                                            </>
                                        ) : (
                                            <>
                                                <FileText className="w-5 h-5" />
                                                Borrador
                                            </>
                                        )}
                                    </button>
                                    <p className="text-xs text-gray-600 mt-1">
                                        {formData.esta_publicado ? 'La guía será visible inmediatamente' : 'La guía se guardará como borrador'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-2 pt-2">
                                <button
                                    type="submit"
                                    disabled={submitLoading}
                                    className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
                                >
                                    {submitLoading ? 'Guardando...' : editingId ? 'Actualizar Guía' : 'Crear Guía'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowForm(false);
                                        setEditingId(null);
                                    }}
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

                    {/* Empty State */}
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
                        {guia.imagen_portada_url && (
                            <div className="h-40 bg-gray-200 overflow-hidden">
                                <img
                                    src={guia.imagen_portada_url}
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

                                <p className="text-gray-600 text-base mb-4 line-clamp-2">{guia.descripcion}</p>

                                {/* Metadatos */}
                                <div className="space-y-3 mb-4">
                                    {/* Categoría */}
                                    <div className="flex items-center gap-2">
                                        <Book className="w-4 h-4 text-indigo-600" />
                                        <span className="inline-block bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-sm font-medium">
                                            {getLabelCategoria(guia.categoria)}
                                        </span>
                                    </div>

                                    {/* Información del archivo */}
                                    <div className="flex items-center gap-4 text-gray-600 text-sm">
                                        <span className="flex items-center gap-1">
                                            <FileText className="w-4 h-4" />
                                            {guia.numero_paginas} {guia.numero_paginas === 1 ? 'página' : 'páginas'}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <HardDrive className="w-4 h-4" />
                                            {guia.tamanio_archivo_formateado || 'Sin info'}
                                        </span>
                                    </div>
                                </div>

                                {guia.visibilidad === 'privado' && (
                                <p className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded mb-3">
                                    Solo para usuarios premium
                                </p>
                                )}

                                {/* Botones */}
                                <div className="mt-auto flex gap-2 pt-3 border-t border-gray-200">
                                    <button
                                        onClick={() => handleEdit(guia)}
                                        className="flex-1 flex items-center justify-center gap-1 bg-blue-50 text-blue-600 px-3 py-2 rounded text-sm font-medium hover:bg-blue-100 transition"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                        Editar
                                    </button>
                                    <button
                                        onClick={() => handleDelete(guia.id)}
                                        className="flex-1 flex items-center justify-center gap-1 bg-red-50 text-red-600 px-3 py-2 rounded hover:bg-red-100 transition text-sm font-medium"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        Eliminar
                                    </button>
                                    <button
                                        onClick={() => handleDownload(guia)}
                                        className="flex items-center justify-center gap-1 bg-indigo-600 text-white px-3 py-2 rounded text-sm font-medium hover:bg-indigo-700 transition"
                                        title="Descargar PDF"
                                    >
                                        <Download className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
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

export default MisGuias;
