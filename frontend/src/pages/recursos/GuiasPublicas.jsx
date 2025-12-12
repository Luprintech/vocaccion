import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getGuiasPublicas, descargarGuiaPublica } from '../../api';
import { useAuth } from '../../context/AuthContextFixed';
import { FileText, Download, AlertCircle, Eye } from 'lucide-react';

function GuiasPublicas() {
    // Obtener usuario del contexto de autenticación
    const { user, getRoles } = useAuth();
    
    // Estado para guías y filtros
    const [guias, setGuias] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filtro, setFiltro] = useState('');
    const [ordenamiento, setOrdenamiento] = useState('recent');

    // Cargar guías cuando cambian filtros u ordenamiento
    useEffect(() => {
        fetchGuias();
    }, [filtro, ordenamiento]);

    // Obtener guías públicas con filtros
    const fetchGuias = async () => {
        try {
            setLoading(true);
            setError(null);

            // Usar función centralizada de api.js
            const data = await getGuiasPublicas(filtro, ordenamiento);
            setGuias(data.data || data);
        } catch (err) {
            console.error('Error:', err);
            setError(err.message || 'Error al cargar guías');
        } finally {
            setLoading(false);
        }
    };

    // Descargar guía con validación de sesión
    const handleDownload = async (guiaId) => {
        try {
            // Usar función de api.js, crear URL temporal y simular descarga
            const blob = await descargarGuiaPublica(guiaId);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `guia-${guiaId}.pdf`;
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Error:', err);
            setError(err.message || 'Error al descargar la guía');
        }
    };

    return (
        <div className="space-y-6">
            {/* Filtros y ordenamiento */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Filtrar por categoría */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Filtrar por categoría</label>
                    <select
                        value={filtro}
                        onChange={(e) => setFiltro(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-600 focus:border-transparent outline-none"
                    >
                        <option value="">Todas las categorías</option>
                        <option value="profesiones">Profesiones</option>
                        <option value="estudios">Estudios y Formación</option>
                        <option value="competencias">Competencias</option>
                        <option value="tecnicas">Técnicas de Búsqueda</option>
                        <option value="otro">Otro</option>
                    </select>
                </div>

                {/* Ordenar resultados */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Ordenar por</label>
                    <select
                        value={ordenamiento}
                        onChange={(e) => setOrdenamiento(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-600 focus:border-transparent outline-none"
                    >
                        <option value="recent">Más recientes</option>
                        <option value="popular">Más descargadas</option>
                        <option value="rating">Mejor valoradas</option>
                    </select>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded text-red-700 flex gap-2">
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />{error}
                </div>
            )}

            {/* Loading */}
            {loading && (
                <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                </div>
            )}

            {/* Estado vacío */}
            {!loading && guias.length === 0 && (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No hay guías disponibles en esta categoría</p>
                </div>
            )}

            {/* Grid de Guías */}
            {!loading && guias.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {guias.map((guia) => (
                        <div
                            key={guia.id}
                            className="bg-white rounded-lg shadow hover:shadow-lg transition overflow-hidden flex flex-col h-full"
                        >

                            {/* Portada */}
                            {guia.imagen_portada_url && (
                                <div className="h-40 bg-gradient-to-br from-indigo-100 to-purple-100 overflow-hidden flex items-center justify-center">
                                    <img
                                        src={guia.imagen_portada_url}
                                        alt={guia.titulo}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            )}

                            {!guia.imagen_portada_url && (
                                <div className="h-40 bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
                                    <FileText className="w-12 h-12 text-indigo-300" />
                                </div>
                            )}

                            {/* Contenido */}
                            <div className="p-4 flex-1 flex flex-col">
                                <div className="flex justify-between items-start gap-2 mb-2">
                                    <h3 className="text-lg font-bold text-gray-900 line-clamp-2 flex-1">
                                        {guia.titulo}
                                    </h3>
                                    {guia.visibilidad === 'privado' && (
                                        <span className="flex-shrink-0 text-xs font-semibold bg-purple-100 text-purple-700 px-2 py-1 rounded">
                                        Premium
                                        </span>
                                    )}
                                </div>

                                {/* Categoría */}
                                <p className="text-xs text-gray-500 mb-2 capitalize">
                                    {guia.categoria}
                                </p>

                                {/* Descripción */}
                                <p className="text-gray-600 text-sm mb-3 line-clamp-2 flex-1">
                                    {guia.descripcion}
                                </p>

                                {/* Metadatos: páginas, tamaño, descargas */}
                                <div className="text-xs text-gray-500 space-y-1 mb-4 pb-4 border-b border-gray-100">
                                    <p>{guia.numero_paginas || 0} páginas</p>
                                    <p>{guia.tamanio_archivo_formateado || '0 KB'}</p>
                                    <p>{guia.descargas || 0} descargas</p>
                                </div>

                                {/* Botones: Ver detalles y Descargar */}
                                <div className="flex gap-2">
                                    {/* Botón Ver detalles para todos los usuarios */}
                                    <Link
                                        to={`/recursos/guias/${guia.id}`}
                                        className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded text-sm font-medium transition"
                                    >
                                        <Eye className="w-4 h-4" />
                                        Ver en línea
                                    </Link>

                                    {/* Botón Descargar */}
                                    <button
                                        onClick={() => handleDownload(guia.id)}
                                        className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded text-sm font-medium transition"
                                    >
                                        <Download className="w-4 h-4" />
                                        Descargar
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

export default GuiasPublicas;