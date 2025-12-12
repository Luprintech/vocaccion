import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getGuiaDetalle, getGuiaPDF, downloadGuia } from '../../api';
import { FileText, Download, Eye, AlertCircle, Loader, ArrowLeft, Calendar, Users, Star } from 'lucide-react';

function GuiaDetalle() {
    const { id } = useParams();
    const navigate = useNavigate();

    //    Estado para los datos de la guía
    const [guia, setGuia] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showPDF, setShowPDF] = useState(false);
    const [pdfUrl, setPdfUrl] = useState(null);
    const [loadingPDF, setLoadingPDF] = useState(false);

    //    Cargar datos de la guía al montar el componente
    useEffect(() => {
        if (!id) {
            console.warn('⚠️ No se proporcionó ID de guía');
            setError('ID de guía no válido');
            return;
        }
        fetchGuiaData();
    }, [id]);

    //    Obtener datos de la guía del API
    const fetchGuiaData = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await getGuiaDetalle(id);
            setGuia(data);
            console.log('Guía cargada:', data);
        } catch (err) {
            console.error('Error al cargar guía:', err);
            setError(err.message || 'Error al cargar la guía');
        } finally {
            setLoading(false);
        }
    };

    //  Cargar y mostrar PDF en línea
    const handleViewPDF = async () => {
        if (pdfUrl) {
            setShowPDF(true);
            return;
        }

        try {
            setLoadingPDF(true);
            const blob = await getGuiaPDF(id);
            const url = URL.createObjectURL(blob);
            setPdfUrl(url);
            setShowPDF(true);
        } catch (err) {
            console.error('Error al cargar PDF:', err);
            setError(err.message || 'Error al cargar el PDF');
        } finally {
            setLoadingPDF(false);
        }
    };

    //  Descargar guía
    const handleDownload = async () => {
        try {
            setLoadingPDF(true);
            const blob = await downloadGuia(id);
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${guia.titulo}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Error al descargar:', err);
            setError('Error al descargar la guía');
        } finally {
            setLoadingPDF(false);
        }
    };

    //  Loading
    if (loading) {
        return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-green-50 flex items-center justify-center">
            <div className="text-center">
                <Loader className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
                <p className="text-gray-600">Cargando guía...</p>
            </div>
        </div>
        );
    }

    // Error
    if (error || !guia) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-green-50 flex items-center justify-center px-4">
                <div className="text-center">
                    <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Error</h1>
                    <p className="text-gray-600 mb-6">{error || 'Guía no encontrada'}</p>
                    <button
                        onClick={() => navigate('/recursos')}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 mx-auto"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Volver a Recursos
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-green-50">
            {/* Botón volver */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Volver
                    </button>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Contenido principal */}
                    <div className="lg:col-span-2">
                    {/* Portada */}
                    {guia.imagen_portada_url && (
                        <div className="mb-6 rounded-lg overflow-hidden shadow-lg h-64 bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center">
                            <img
                                src={guia.imagen_portada_url}
                                alt={guia.titulo}
                                className="w-full h-full object-cover"
                            />
                        </div>
                    )}

                    {!guia.imagen_portada_url && (
                        <div className="mb-6 rounded-lg overflow-hidden shadow-lg h-64 bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
                            <FileText className="w-24 h-24 text-indigo-300" />
                        </div>
                    )}

                        {/* Título y descripción */}
                        <h1 className="text-4xl font-bold text-gray-900 mb-4">{guia.titulo}</h1>

                        {/* Categoría y badges */}
                        <div className="flex flex-wrap gap-2 mb-6">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-700 capitalize">
                                📚 {guia.categoria}
                            </span>
                            {guia.esta_publicado && (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700">
                                ✓ Publicado
                                </span>
                            )}
                            {guia.visibilidad === 'privado' && (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-700">
                                🔒 Premium
                                </span>
                            )}
                        </div>

                        {/* Descripción */}
                        <p className="text-lg text-gray-700 mb-8 leading-relaxed">{guia.descripcion}</p>

                        {/* Metadatos */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 p-4 bg-white rounded-lg border border-gray-200">
                        {guia.numero_paginas && (
                            <div className="flex items-center gap-2">
                                <FileText className="w-5 h-5 text-indigo-600" />
                                <div>
                                    <p className="text-xs text-gray-600">Páginas</p>
                                    <p className="font-bold text-gray-900">{guia.numero_paginas}</p>
                                </div>
                            </div>
                        )}
                
                        {guia.tamanio && (
                            <div className="flex items-center gap-2">
                            <Download className="w-5 h-5 text-green-600" />
                                <div>
                                    <p className="text-xs text-gray-600">Tamaño</p>
                                    <p className="font-bold text-gray-900">
                                    {(guia.tamanio / 1024 / 1024).toFixed(2)} MB
                                    </p>
                                </div>
                            </div>
                        )}

                        {guia.descargas !== undefined && (
                            <div className="flex items-center gap-2">
                                <Users className="w-5 h-5 text-blue-600" />
                                <div>
                                    <p className="text-xs text-gray-600">Descargas</p>
                                    <p className="font-bold text-gray-900">{guia.descargas}</p>
                                </div>
                            </div>
                        )}

                        {guia.vistas !== undefined && (
                            <div className="flex items-center gap-2">
                                <Eye className="w-5 h-5 text-purple-600" />
                                <div>
                                    <p className="text-xs text-gray-600">Vistas</p>
                                    <p className="font-bold text-gray-900">{guia.vistas}</p>
                                </div>
                            </div>
                        )}

                        {guia.valoracion_media && (
                            <div className="flex items-center gap-2">
                                <Star className="w-5 h-5 text-amber-500" />
                                <div>
                                    <p className="text-xs text-gray-600">Valoración</p>
                                    <p className="font-bold text-gray-900">{guia.valoracion_media.toFixed(1)}/5</p>
                                </div>
                            </div>
                        )}
                        </div>

                        {/* Botones de acción */}
                        <div className="flex flex-col sm:flex-row gap-4 mb-12">
                            <button
                                onClick={handleViewPDF}
                                disabled={loadingPDF}
                                className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium transition"
                            >
                                {loadingPDF ? (
                                <>
                                    <Loader className="w-5 h-5 animate-spin" />Cargando...
                                </>
                                ) : (
                                <>
                                    <Eye className="w-5 h-5" />Ver en línea
                                </>
                                )}
                            </button>

                            <button
                                onClick={handleDownload}
                                disabled={loadingPDF}
                                className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium transition"
                            >
                                {loadingPDF ? (
                                <>
                                    <Loader className="w-5 h-5 animate-spin" />Descargando...
                                </>
                                ) : (
                                <>
                                    <Download className="w-5 h-5" />
                                    Descargar
                                </>
                                )}
                            </button>
                        </div>

                        {/* Vista previa del PDF */}
                        {showPDF && pdfUrl && (
                        <div className="mb-12 p-4 bg-white rounded-lg border border-gray-200">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-semibold text-gray-900">Vista previa</h3>
                                <button
                                    onClick={() => setShowPDF(false)}
                                    className="text-gray-500 hover:text-gray-700 text-lg"
                                >
                                    ✕
                                </button>
                            </div>
                            <div className="bg-gray-100 rounded overflow-hidden">
                            <iframe
                                src={pdfUrl}
                                title={guia.titulo}
                                className="w-full h-96"
                            />
                            </div>
                        </div>
                        )}

                        {/* Información del autor */}
                        {guia.author && (
                        <div className="p-4 bg-white rounded-lg border border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Autor</h3>
                            <p className="text-gray-700">{guia.author.nombre}</p>
                            {guia.author.email && (
                            <p className="text-gray-600 text-sm">{guia.author.email}</p>
                            )}
                        </div>
                        )}
                    </div>

                    {/* Sidebar derecho */}
                    <div className="lg:col-span-1">
                        {/* Tarjeta de información */}
                        <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200 sticky top-8">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">Información</h3>

                            <div className="space-y-4">
                                {guia.created_at && (
                                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded">
                                    <Calendar className="w-5 h-5 text-gray-600" />
                                    <div>
                                        <p className="text-xs text-gray-600">Creado</p>
                                        <p className="font-medium text-gray-900 text-sm">
                                            {new Date(guia.created_at).toLocaleDateString('es-ES')}
                                        </p>
                                    </div>
                                </div>
                                )}

                                {guia.updated_at && (
                                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded">
                                    <Calendar className="w-5 h-5 text-gray-600" />
                                    <div>
                                        <p className="text-xs text-gray-600">Actualizado</p>
                                        <p className="font-medium text-gray-900 text-sm">
                                            {new Date(guia.updated_at).toLocaleDateString('es-ES')}
                                        </p>
                                    </div>
                                </div>
                                )}

                                {guia.tags && guia.tags.length > 0 && (
                                <div className="pt-4 border-t border-gray-200">
                                    <p className="text-xs text-gray-600 mb-2">Etiquetas</p>
                                    <div className="flex flex-wrap gap-2">
                                    {guia.tags.map((tag) => (
                                        <span
                                        key={tag.id}
                                        className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-indigo-100 text-indigo-700 font-medium"
                                        >
                                        #{tag.nombre}
                                        </span>
                                    ))}
                                    </div>
                                </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default GuiaDetalle;
