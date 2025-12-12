import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Download, BookOpen, Crown, Sparkles, Eye } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL;

/**
 * RecursoCard - Tarjeta de Recurso Educativo
 * 
 * Componente para mostrar guías/recursos en formato tarjeta
 * Incluye badges de acceso, categorías, información del autor y botones de acción
 */

const RecursoCard = ({ recurso }) => {
  const [downloading, setDownloading] = useState(false);
  
  // Estado local para actualizar métricas instantáneamente
  const [localStats, setLocalStats] = useState({
      visualizaciones: recurso.visualizaciones || 0,
      descargas: recurso.descargas || 0
  });

  // Actualizar estado si cambian las props
  React.useEffect(() => {
    setLocalStats({
        visualizaciones: recurso.visualizaciones || 0,
        descargas: recurso.descargas || 0
    });
  }, [recurso.visualizaciones, recurso.descargas]);

  // Determinar el badge de acceso según el plan requerido
  const getBadgeAcceso = (planRequerido) => {
    const badges = {
      'gratuito': {
        text: 'FREE',
        className: 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border border-green-200'
      },
      'pro': {
        text: 'PRO',
        className: 'bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-700 border border-purple-200',
        icon: <Crown className="w-3 h-3" />
      },
      'pro_plus': {
        text: 'PRO+',
        className: 'bg-gradient-to-r from-purple-100 via-pink-100 to-indigo-100 text-purple-700 border border-purple-300',
        icon: <Sparkles className="w-3 h-3" />
      }
    };
    return badges[planRequerido] || badges.gratuito;
  };

  const badgeAcceso = getBadgeAcceso(recurso.plan_requerido || 'gratuito');

  // Mapeo de categorías a colores
  const getCategoriaColor = (categoria) => {
    const colores = {
      'orientacion': 'bg-blue-50 text-blue-700 border-blue-200',
      'formacion': 'bg-purple-50 text-purple-700 border-purple-200',
      'universidad': 'bg-indigo-50 text-indigo-700 border-indigo-200',
      'fp': 'bg-green-50 text-green-700 border-green-200',
      'profesiones': 'bg-orange-50 text-orange-700 border-orange-200',
      'estudios': 'bg-teal-50 text-teal-700 border-teal-200',
      'competencias': 'bg-pink-50 text-pink-700 border-pink-200',
      'tecnicas': 'bg-cyan-50 text-cyan-700 border-cyan-200',
      'otro': 'bg-gray-50 text-gray-700 border-gray-200'
    };
    return colores[categoria?.toLowerCase()] || colores.otro;
  };

  // Función para descargar el PDF de la guía
  const handleDownload = async () => {
    if (downloading) return;
    
    setDownloading(true);

    // Tracking explícito de descarga
    try {
        const trackRes = await fetch(`${API_URL}/recursos/${recurso.slug}/download`, { method: 'POST' });
        const trackData = await trackRes.json();
        if(trackData.success && trackData.data) {
            setLocalStats({
                visualizaciones: trackData.data.visualizaciones,
                descargas: trackData.data.descargas
            });
        }
    } catch (err) {
        console.error("Error tracking download", err);
    }

    try {
      const token = localStorage.getItem('token');
      
      // Fetch del PDF desde el backend
      const response = await fetch(`${API_URL}/recursos/articulos/${recurso.slug}/pdf`, {
        headers: { 
          Authorization: `Bearer ${token}` 
        }
      });

      if (!response.ok) {
        throw new Error('Error al descargar el PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${recurso.slug || 'guia'}-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error al descargar:', error);
      alert('Error al descargar el PDF. Por favor, intenta de nuevo.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="group bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden flex flex-col h-full border border-gray-100">
      {/* Imagen Superior */}
      <div className="relative h-48 bg-gradient-to-br from-purple-100 via-pink-50 to-green-100 overflow-hidden">
        {recurso.imagen_portada_url || recurso.imagen || recurso.imagen_portada ? (
          <img
            src={recurso.imagen_portada_url || recurso.imagen || recurso.imagen_portada}
            alt={recurso.titulo}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <BookOpen className="w-16 h-16 text-purple-300 group-hover:text-purple-400 transition-colors" />
          </div>
        )}
        
        {/* Badge de Acceso - Posición absoluta superior izquierda */}
        <div className="absolute top-3 left-3">
          <div className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold shadow-md backdrop-blur-sm ${badgeAcceso.className}`}>
            {badgeAcceso.icon}
            {badgeAcceso.text}
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div className="p-6 flex-1 flex flex-col">
        {/* Categorías */}
        <div className="flex flex-wrap gap-2 mb-3">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getCategoriaColor(recurso.categoria)}`}>
            {recurso.categoria || 'General'}
          </span>
        </div>

        {/* Título */}
        <h3 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-green-600 bg-clip-text text-transparent mb-3 line-clamp-2 leading-tight">
          {recurso.titulo}
        </h3>

        {/* Descripción */}
        <p className="text-gray-600 text-sm mb-4 line-clamp-3 flex-1">
          {recurso.descripcion}
        </p>

        {/* Información Inferior */}
        <div className="flex items-center justify-between mb-4 pt-4 border-t border-gray-100">
          {/* Tiempo de lectura y Stats */}
          <div className="flex flex-col gap-1">
             <div className="flex items-center gap-2 text-gray-500 text-sm">
                <Clock className="w-4 h-4" />
                <span>{recurso.tiempo_lectura || '8 min'}</span>
             </div>
             
             {/* Métricas de visualización */}
             <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                <div className="flex items-center gap-1" title="Visualizaciones">
                  <Eye className="w-3 h-3" />
                  <span>{localStats.visualizaciones}</span>
                </div>
                <div className="flex items-center gap-1" title="Descargas">
                   <Download className="w-3 h-3" />
                   <span>{localStats.descargas}</span>
                </div>
             </div>
          </div>

          {/* Avatar y Nombre del Orientador */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-green-400 flex items-center justify-center text-white text-xs font-bold shadow-md">
              {recurso.autor_nombre ? recurso.autor_nombre.charAt(0).toUpperCase() : 'V'}
            </div>
            <span className="text-xs text-gray-600 font-medium">
              {recurso.autor_nombre || 'Equipo VocAcción'}
            </span>
          </div>
        </div>

        {/* Botones de Acción */}
        <div className="flex gap-2">
          <Link
            to={`/recursos/articulos/${recurso.slug || recurso.id}`}
            className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-4 py-3 rounded-2xl font-semibold text-sm transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
          >
            <BookOpen className="w-4 h-4" />
            Leer artículo
          </Link>

          <button
            onClick={handleDownload}
            disabled={downloading}
            className={`flex items-center justify-center gap-2 px-4 py-3 rounded-2xl font-semibold text-sm transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 ${
              downloading 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white'
            }`}
          >
            {downloading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                Descargando...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RecursoCard;
