import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, GraduationCap, Loader, Target, Sparkles, MapPin } from 'lucide-react';
import { useAuth } from '../../context/AuthContextFixed';
import { API_URL, generateImageForProfession } from '../../api';
import HeaderOrientador from '../../components/HeaderOrientador';
import ViasFormativasSection from '../../components/itinerario/ViasFormativasSection';
import RequisitosSection from '../../components/itinerario/RequisitosSection';
import RecomendacionesSection from '../../components/itinerario/RecomendacionesSection';
import ConsejoMotivadorSection from '../../components/itinerario/ConsejoMotivadorSection';

export default function OrientadorVerItinerario() {
  const { id } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [profesionImage, setProfesionImage] = useState(null);


  /**
   * Cargar datos y PRE-CARGAR imagen antes de mostrar nada.
   */
  useEffect(() => {
    async function loadAllData() {
      try {
        setLoading(true);

        // 1. Cargar itinerario
        const response = await fetch(`${API_URL}/orientador/estudiantes/${id}/itinerario`, {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        });
        
        const result = await response.json();
        
        if (!result.success) {
          setError(result.message || 'No se pudo cargar el itinerario');
          setLoading(false);
          return;
        }

        const itinerarioData = result.data;
        setData(itinerarioData);

        // 2. Generar y Pre-cargar imagen de la profesión
        if (itinerarioData?.itinerario?.profesion && itinerarioData.itinerario.profesion !== "No especificada") {
          try {
            const res = await generateImageForProfession({ profesion: itinerarioData.itinerario.profesion });
            if (res.success && res.imagenUrl) {
              setProfesionImage(res.imagenUrl);
              
              // Esperar a que la imagen se cargue en el navegador
              await new Promise((resolve) => {
                  const img = new Image();
                  img.src = res.imagenUrl;
                  img.onload = resolve;
                  img.onerror = resolve; // Proceder aunque falle
              });
            }
          } catch (err) {
            console.error('Error generando imagen:', err);
          }
        }

      } catch (err) {
        console.error('Error:', err);
        setError('Error al cargar el itinerario del estudiante');
      } finally {
        setLoading(false);
      }
    }

    loadAllData();
  }, [id, token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
        <HeaderOrientador />
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <div className="flex flex-col items-center gap-4">
            <Loader className="w-12 h-12 text-green-500 animate-spin" />
            <p className="text-gray-600 font-medium">Cargando itinerario del estudiante...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data || !data.itinerario) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
        <HeaderOrientador />
        <div className="max-w-4xl mx-auto px-6 py-12">
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Error</h2>
            <p className="text-gray-600 mb-6">{error || 'No hay itinerario disponible para este estudiante'}</p>
            <button
              onClick={() => navigate('/orientador/analisis')}
              className="inline-flex items-center gap-2 bg-orange-500 text-white px-6 py-3 rounded-xl hover:bg-orange-600 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              Volver a Análisis
            </button>
          </div>
        </div>
      </div>
    );
  }

  const itinerario = data.itinerario;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      <HeaderOrientador />
      
      {/* Banner de información */}
      <div className="bg-green-50 border-b border-green-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-sm text-green-600 font-medium">Viendo información de:</p>
            <p className="text-lg font-bold text-green-900">{data.estudiante?.nombre}</p>
          </div>
          <button
            onClick={() => navigate('/orientador/analisis')}
            className="flex items-center gap-2 bg-white text-green-600 px-4 py-2 rounded-lg hover:bg-green-100 transition-colors border border-green-200"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a Análisis
          </button>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 bg-white px-6 py-3 rounded-full shadow-lg border-2 border-green-100">
            <GraduationCap className="w-8 h-8 text-green-600" />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
              Itinerario Académico
            </h1>
          </div>
        </div>

        {/* Profesión objetivo con imagen */}
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-green-100 relative overflow-hidden">
          {/* Decoración de fondo */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-50 rounded-bl-full opacity-50 -mr-10 -mt-10 pointer-events-none"></div>
          
          <div className="flex flex-col items-center z-10 relative">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center shadow-sm text-green-600">
                <Target className="w-5 h-5" strokeWidth={2.5} />
              </div>
              <span className="text-sm font-bold text-green-600 tracking-wider uppercase bg-green-50 px-3 py-1 rounded-full border border-green-100">
                Profesión Objetivo
              </span>
            </div>
            
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 tracking-tight leading-tight max-w-4xl mx-auto text-center">
              {itinerario.profesion}
            </h2>

            {/* Comunidad Autónoma (Si existe) */}
            {itinerario.contenido?.comunidad_autonoma && (
              <div className="flex flex-col items-center mt-4 bg-gray-50 px-6 py-3 rounded-xl border border-gray-100">
                <div className="flex items-center gap-2 text-gray-500 mb-1">
                  <MapPin className="w-4 h-4" />
                  <span className="text-xs uppercase font-semibold tracking-wide">Ubicación</span>
                </div>
                <p className="text-lg font-bold text-gray-800">
                  {itinerario.contenido.comunidad_autonoma}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Imagen de la profesión */}
        {profesionImage && (
          <div className="w-full rounded-3xl overflow-hidden shadow-xl shadow-green-100/50 border-4 border-white bg-white">
            <img 
              src={profesionImage} 
              alt={`Imagen representativa de ${itinerario.profesion}`} 
              className="w-full h-64 md:h-80 lg:h-96 object-cover hover:scale-105 transition-transform duration-700 ease-out"
            />
          </div>
        )}

        {/* Contenido del itinerario */}
        <div className="space-y-8">
          {/* Vías Formativas con Acordeones */}
          {itinerario.contenido?.vias_formativas && itinerario.contenido.vias_formativas.length > 0 && (
            <ViasFormativasSection 
              vias={itinerario.contenido.vias_formativas.map(via => ({
                ...via,
                id: via.id || via.titulo || via.nombre,
                nombre_via: via.titulo || via.nombre,
                requisitos: via.requisitos || []
              }))} 
            />
          )}

          {/* Habilidades/Requisitos */}
          {(itinerario.contenido?.habilidades_necesarias || itinerario.contenido?.requisitos_comunes) && (
            <RequisitosSection 
              requisitos={itinerario.contenido.habilidades_necesarias || itinerario.contenido.requisitos_comunes} 
              titulo="Habilidades Técnicas y Blandas" 
            />
          )}

          {/* Recomendaciones */}
          {(itinerario.contenido?.recomendaciones || itinerario.contenido?.alternativas) && (
            <RecomendacionesSection 
              recomendaciones={itinerario.contenido.recomendaciones || itinerario.contenido.alternativas} 
            />
          )}

          {/* Consejo Final */}
          {itinerario.contenido?.consejo_final && (
            <ConsejoMotivadorSection consejo={itinerario.contenido.consejo_final} />
          )}
        </div>

        {/* Botón de volver */}
        <div className="mt-8 text-center">
          <button
            onClick={() => navigate('/orientador/analisis')}
            className="inline-flex items-center gap-2 bg-orange-500 text-white px-8 py-4 rounded-xl hover:bg-orange-600 transition-colors shadow-lg"
          >
            <ArrowLeft className="h-5 w-5" />
            Volver a Análisis
          </button>
        </div>
      </div>
    </div>
  );
}
