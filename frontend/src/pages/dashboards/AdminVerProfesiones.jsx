import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Briefcase, Loader, Sparkles, GraduationCap } from 'lucide-react';
import { useAuth } from '../../context/AuthContextFixed';
import { API_URL, generateImageForProfession } from '../../api';
import HeaderAdmin from '../../components/HeaderAdmin';

export default function AdminVerProfesiones() {
  const { id } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [profesionImages, setProfesionImages] = useState({});


  /**
   * Cargar datos y PRE-CARGAR imágenes antes de mostrar nada.
   */
  useEffect(() => {
    async function loadAllData() {
      try {
        setLoading(true); // Asegurar loading true al inicio
        
        // 1. Cargar datos de profesiones
        const response = await fetch(`${API_URL}/admin/estudiantes/${id}/profesiones`, {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        });
        
        const result = await response.json();
        
        if (!result.success) {
          setError(result.message || 'No se pudieron cargar las profesiones');
          setLoading(false);
          return;
        }

        const profesionesData = result.data;
        setData(profesionesData);

        // 2. Generar y Pre-cargar imágenes
        const imagePromises = [];
        const newImages = {};

        if (profesionesData.profesiones && profesionesData.profesiones.length > 0) {
          // Crear un array de promesas de generación de imagen
          const generationPromises = profesionesData.profesiones.map(async (profesion, index) => {
            const titulo = profesion.titulo || profesion.nombre;
            if (!titulo) return null;

            try {
              const res = await generateImageForProfession({ profesion: titulo });
              if (res.success && res.imagenUrl) {
                newImages[index] = res.imagenUrl;
                
                // Crear promesa de carga de la imagen en navegador
                return new Promise((resolve, reject) => {
                    const img = new Image();
                    img.src = res.imagenUrl;
                    img.onload = resolve;
                    img.onerror = resolve; // Resolvemos igual para no bloquear si falla una imagen
                });
              }
            } catch (err) {
              console.error(`Error generando imagen para ${titulo}:`, err);
            }
            return null;
          });

          // Esperar a que se generen y se CARGUEN todas
          await Promise.all(generationPromises);
        }

        setProfesionImages(newImages);

      } catch (err) {
        console.error('Error:', err);
        setError('Error al cargar las profesiones del estudiante');
      } finally {
        setLoading(false); // Solo aquí quitamos el loading
      }
    }

    loadAllData();
  }, [id, token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-green-50">
        <HeaderAdmin />
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <div className="flex flex-col items-center gap-4">
            <Loader className="w-12 h-12 text-purple-500 animate-spin" />
            <p className="text-gray-600 font-medium">Cargando profesiones del estudiante...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-green-50">
        <HeaderAdmin />
        <div className="max-w-4xl mx-auto px-6 py-12">
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Error</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => navigate('/admin/usuarios')}
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-green-50">
      <HeaderAdmin />
      
      {/* Banner de información */}
      <div className="bg-purple-50 border-b border-purple-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-sm text-purple-600 font-medium">Viendo información de:</p>
            <p className="text-lg font-bold text-purple-900">{data.estudiante?.nombre}</p>
          </div>
          <button
            onClick={() => navigate('/admin/usuarios')}
            className="flex items-center gap-2 bg-white text-purple-600 px-4 py-2 rounded-lg hover:bg-purple-100 transition-colors border border-purple-200"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a Usuarios
          </button>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="max-w-[1400px] mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center p-2 bg-purple-100 rounded-full mb-4">
            <Sparkles className="h-6 w-6 text-purple-600" />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-purple-600 to-green-600 bg-clip-text text-transparent mb-4">
            Profesiones Recomendadas
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Estas son las profesiones recomendadas para {data.estudiante?.nombre} según su test vocacional
          </p>
        </div>

        {/* Grid de profesiones */}
        {data.profesiones && data.profesiones.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 mb-12">
            {data.profesiones.map((profesion, idx) => (
              <div key={idx} className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-purple-100 h-full flex flex-col">
                {/* Imagen */}
                {profesionImages[idx] && (
                  <div className="relative w-full h-48 overflow-hidden bg-gradient-to-br from-purple-100 to-purple-200">
                    <img
                      src={profesionImages[idx]}
                      alt={profesion.titulo || profesion.nombre}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                )}
                
                {/* Contenido */}
                <div className="p-6 flex-1 flex flex-col">
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">
                    {profesion.titulo || profesion.nombre}
                  </h3>
                  
                  {profesion.descripcion && (
                    <p className="text-gray-600 mb-6 leading-relaxed text-justify">
                      {profesion.descripcion}
                    </p>
                  )}
                  
                  <div className="mt-auto space-y-4">
                    {/* Habilidades */}
                    {profesion.habilidades && profesion.habilidades.length > 0 && (
                      <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
                        <h4 className="font-semibold text-purple-900 mb-3 text-sm uppercase tracking-wide flex items-center gap-2">
                          <Sparkles className="w-4 h-4" />
                          Habilidades Requeridas
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {profesion.habilidades.map((hab, hidx) => (
                            <span
                              key={hidx}
                              className="px-3 py-1 bg-white text-purple-700 text-xs font-semibold rounded-full border border-purple-100 shadow-sm"
                            >
                              {typeof hab === 'string' ? hab : hab.nombre}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Estudios */}
                    {profesion.estudios && profesion.estudios.length > 0 && (
                      <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                        <h4 className="font-semibold text-blue-900 mb-3 text-sm uppercase tracking-wide flex items-center gap-2">
                          <GraduationCap className="w-4 h-4" />
                          Formación Necesaria
                        </h4>
                        <ul className="space-y-2">
                          {profesion.estudios.map((est, eidx) => (
                            <li key={eidx} className="flex items-start gap-2 text-sm text-blue-800">
                              <span className="mt-1.5 w-1.5 h-1.5 bg-blue-400 rounded-full flex-shrink-0"></span>
                              <span>{typeof est === 'string' ? est : est.nombre}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {/* Salidas laborales */}
                    {profesion.salidas && (
                      <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                        <h4 className="font-semibold text-green-900 mb-3 text-sm uppercase tracking-wide flex items-center gap-2">
                          <Briefcase className="w-4 h-4" />
                          Salidas Laborales
                        </h4>
                        <ul className="space-y-2">
                          {(Array.isArray(profesion.salidas) ? profesion.salidas : profesion.salidas.split(',')).map((salida, sidx) => (
                            <li key={sidx} className="flex items-start gap-2 text-sm text-green-800">
                              <span className="mt-1.5 w-1.5 h-1.5 bg-green-400 rounded-full flex-shrink-0"></span>
                              <span>{salida.trim()}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Briefcase className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No hay profesiones disponibles para este estudiante</p>
          </div>
        )}

        {/* Botón de volver */}
        <div className="text-center">
          <button
            onClick={() => navigate('/admin/usuarios')}
            className="inline-flex items-center gap-2 bg-orange-500 text-white px-8 py-4 rounded-xl hover:bg-orange-600 transition-colors shadow-lg"
          >
            <ArrowLeft className="h-5 w-5" />
            Volver a Usuarios
          </button>
        </div>
      </div>
    </div>
  );
}
