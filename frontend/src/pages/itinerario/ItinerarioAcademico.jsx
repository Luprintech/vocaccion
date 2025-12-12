import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  GraduationCap,
  AlertCircle,
  Lightbulb,
  MapPin,
  ArrowRight,
  Target,
  Sparkles,
  FileText // Import para el icono PDF
} from "lucide-react";

import RequisitosSection from "@/components/itinerario/RequisitosSection";
import ViasFormativasSection from "@/components/itinerario/ViasFormativasSection";
import RecomendacionesSection from "@/components/itinerario/RecomendacionesSection";
import ConsejoMotivadorSection from "@/components/itinerario/ConsejoMotivadorSection";
import CTAOrientadorSection from "@/components/itinerario/CTAOrientadorSection";
import { generateImageForProfession } from "../../api";
import ItinerarioEmptyState from "@/components/itinerario/ItinerarioEmptyState";

const API_URL = import.meta.env.VITE_API_URL;

export default function ItinerarioAcademico() {
  const [loading, setLoading] = useState(true);
  const [itinerario, setItinerario] = useState(null);
  const [error, setError] = useState(null);
  const [profesionImage, setProfesionImage] = useState(null); // Nuevo estado imagen
  const hasFetched = useRef(false);
  const navigate = useNavigate();

  /* =============================
        CARGA DEL ITINERARIO
     ============================= */
  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    async function cargar() {
      try {
        const token = localStorage.getItem("token");

        const res = await fetch(`${API_URL}/itinerario/generar`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();

        if (!data.success) throw new Error(data.message || "Error desconocido");

        setItinerario(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    cargar();
  }, []);

  const data = itinerario?.itinerario || {};
  const profesion = data.profesion || itinerario?.profesion;

  /* =============================
        CARGA DE IMAGEN PEXELS
     ============================= */
  useEffect(() => {
    if (profesion && profesion !== "No especificada") {
      generateImageForProfession({ profesion: profesion })
        .then(res => {
          if (res.success && res.imagenUrl) {
            setProfesionImage(res.imagenUrl);
          }
        })
        .catch(err => {});
    }
  }, [profesion]);

  const handleDownloadPDF = () => {
   // Ahora el test_id (session_id) viene en la raíz de la respuesta
   if (itinerario?.test_id) {
      // Abrir en nueva pestaña para descargar
      const token = localStorage.getItem("token");
      
      // Opción robusta: Fetch Blob
      setLoading(true); 
      fetch(`${API_URL}/test-vocacional/pdf/${itinerario.test_id}`, {
          headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => res.blob())
      .then(blob => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `informe-vocacional-${new Date().toISOString().split('T')[0]}.pdf`;
          document.body.appendChild(a);
          a.click();
          a.remove();
          setLoading(false);
      })
      .catch(e => {
        setLoading(false);
      });
   }
  };

  /* =============================
          ESTADOS VISUALES
     ============================= */

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-green-50">
        <div className="text-center space-y-6 p-8">
          <div className="relative inline-block">
            <div className="animate-spin rounded-full h-20 w-20 border-4 border-transparent bg-gradient-to-r from-purple-600 to-green-600"></div>
            <div className="absolute inset-0 m-1 rounded-full bg-gradient-to-br from-purple-50 via-white to-green-50"></div>
          </div>
          <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-green-600 bg-clip-text text-transparent">
            Generando tu itinerario académico...
          </h3>
          <p className="text-gray-600 text-sm">
            Estamos creando un plan personalizado para tu futuro profesional
          </p>
        </div>
      </div>
    );
  }

  // SI FALTA PROFESIÓN O HAY ERROR -> MOSTRAR EMPTY STATE (Invitar a hacer test)
  if (error || !profesion || profesion === "No especificada") {
     return <ItinerarioEmptyState 
         title={error ? "No se encontró un itinerario" : "Aún no tienes una profesión objetivo"}
         message="Parece que aún no has completado tu test vocacional o no has seleccionado una profesión. Realiza el test para obtener tu ruta personalizada."
     />;
  }


  /* =============================
          INTERFAZ PRINCIPAL
     ============================= */
return (
  <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-green-50 px-4 py-12">
    <div className="max-w-5xl mx-auto space-y-10">

      {/* HEADER PRINCIPAL */}
      <div className="text-center relative mb-4">
        <div className="absolute inset-x-0 top-1/2 h-px bg-gradient-to-r from-transparent via-purple-300 to-transparent"></div>
        <div className="relative inline-flex items-center gap-3 bg-white px-6 py-3 md:px-8 md:py-4 rounded-full shadow-lg border-2 border-purple-100">
          <GraduationCap className="w-6 h-6 md:w-8 md:h-8 text-purple-600" strokeWidth={2.5} />
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-purple-600 to-green-600 bg-clip-text text-transparent">
            Tu Itinerario Académico
          </h1>
          <Sparkles className="w-6 h-6 md:w-8 md:h-8 text-green-500" strokeWidth={2.5} />
        </div>
      </div>

      {/* TARJETA 1: PROFESIÓN OBJETIVO */}
      {/* TARJETA 1: PROFESIÓN OBJETIVO */}
      <div className="bg-white rounded-2xl shadow-lg shadow-purple-100 p-6 md:p-8 border border-purple-50 flex flex-col items-center justify-center gap-6 relative overflow-hidden text-center">
        {/* Decoración de fondo */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-50 rounded-bl-full opacity-50 -mr-10 -mt-10 pointer-events-none"></div>

        <div className="flex flex-col items-center z-10">
           <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center shadow-sm text-purple-600">
                <Target className="w-5 h-5" strokeWidth={2.5} />
              </div>
              <span className="text-sm font-bold text-purple-600 tracking-wider uppercase bg-purple-50 px-3 py-1 rounded-full border border-purple-100">
                Profesión Objetivo
              </span>
           </div>
           
           <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 tracking-tight leading-tight max-w-4xl mx-auto">
             {profesion}
           </h2>
        </div>

        {/* Comunidad Autónoma (Si existe) */}
        {data.comunidad_autonoma && (
          <div className="flex flex-col items-center z-10 bg-gray-50 px-6 py-3 rounded-xl border border-gray-100">
             <div className="flex items-center gap-2 text-gray-500 mb-1">
               <MapPin className="w-4 h-4" />
               <span className="text-xs uppercase font-semibold tracking-wide">Ubicación</span>
             </div>
             <p className="text-lg font-bold text-gray-800">
               {data.comunidad_autonoma}
             </p>
          </div>
        )}
      </div>

      {/* TARJETA 2: IMAGEN DE LA PROFESIÓN (Separada) */}
      {profesionImage && (
        <div className="w-full rounded-3xl overflow-hidden shadow-xl shadow-purple-100/50 border-4 border-white bg-white">
           <img 
              src={profesionImage} 
              alt={`Imagen representativa de ${profesion}`} 
              className="w-full h-64 md:h-80 lg:h-96 object-cover hover:scale-105 transition-transform duration-700 ease-out"
           />
        </div>
      )}

      {/* VÍAS FORMATIVAS */}
      {data.vias_formativas && data.vias_formativas.length > 0 && (
        <ViasFormativasSection 
          vias={data.vias_formativas.map(via => ({
            ...via,
            nombre_via: via.titulo || via.nombre, 
            requisitos: via.requisitos || data.requisitos_acceso_por_via?.[via.id] || []
          }))} 
        />
      )}

      {/* RECOMENDACIONES (Componente Nuevo) */}
      {(data.recomendaciones?.length > 0 || data.alternativas?.length > 0) && (
        <RecomendacionesSection 
          recomendaciones={data.recomendaciones || data.alternativas} 
        />
      )}

      {/* HABILIDADES RECOMENDADAS */}
      {(data.habilidades_necesarias?.length > 0 || data.requisitos_comunes?.length > 0) && (
        <RequisitosSection 
          requisitos={data.habilidades_necesarias || data.requisitos_comunes} 
          titulo="Habilidades Técnicas y Blandas" 
        />
      )}

      {/* CONSEJO MOTIVADOR (Componente Rediseñado) */}
      {data.consejo_final && (
        <ConsejoMotivadorSection consejo={data.consejo_final} />
      )}

      {/* CTA ORIENTADOR (Nuevo) */}
      <CTAOrientadorSection />

      {/* BOTONES */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
        <button
          onClick={() => navigate("/mi-profesion")}
          className="flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white px-8 py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all cursor-pointer"
        >
          <Target className="w-5 h-5" />
          Volver a Mi Profesión
        </button>

        <button
          onClick={() => navigate("/resultados")}
          className="flex items-center justify-center gap-2 bg-white text-purple-600 px-8 py-4 rounded-xl font-semibold shadow-lg border border-purple-200 hover:bg-gray-50 transform hover:scale-105 transition-all cursor-pointer"
        >
          <Sparkles className="w-5 h-5" />
          Ver Resultados del Test
        </button>
      <button
          onClick={handleDownloadPDF}
          className="flex items-center justify-center gap-2 bg-gray-900 text-white px-8 py-4 rounded-xl font-semibold shadow-lg hover:bg-black transform hover:scale-105 transition-all cursor-pointer"
        >
          <FileText className="w-5 h-5" />
          Descargar Informe PDF
        </button>
      </div>
    </div>
  </div>
);

  
  
}
