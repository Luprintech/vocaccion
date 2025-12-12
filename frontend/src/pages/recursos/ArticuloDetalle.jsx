import React, { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Clock, Share2, Crown, Lock, Eye, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from '@/context/AuthContextFixed';

// Importación de componentes de artículos legacy
import ArticuloQueEstudiar from "@/components/articulos/ArticuloQueEstudiar";
import ArticuloUniversidadFP from "@/components/articulos/ArticuloUniversidadFP";
import ArticuloCarreraUniversitaria from "@/components/articulos/ArticuloCarreraUniversitaria";
import ArticuloFPDual from "@/components/articulos/ArticuloFPDual";
import ArticuloTestsVocacionales from "@/components/articulos/ArticuloTestsVocacionales";
import ArticuloSalidasTech from "@/components/articulos/ArticuloSalidasTech";
import ArticuloCartaPresentacion from "@/components/articulos/ArticuloCartaPresentacion";
import ArticuloCurriculum from "@/components/articulos/ArticuloCurriculum";

const API_URL = import.meta.env.VITE_API_URL;

// Mapa de componentes antiguos para artículos predefinidos
const LEGACY_COMPONENTS = {
    "que-hacer-si-no-se-que-estudiar": ArticuloQueEstudiar,
    "universidad-fp-cursos-como-elegir": ArticuloUniversidadFP,
    "como-elegir-carrera-universitaria": ArticuloCarreraUniversitaria,
    "fp-dual-que-es-ventajas": ArticuloFPDual,
    "test-orientacion-vocacional-como-funciona": ArticuloTestsVocacionales,
    "salidas-profesionales-tecnologia-2025": ArticuloSalidasTech,
    "carta-presentacion-estructura-ejemplos": ArticuloCartaPresentacion,
    "guia-definitiva-curriculum-2025-plantilla": ArticuloCurriculum
};

/**
 * Página de Artículo Individual - VocAcción
 */
const ArticuloDetalle = () => {
  const { slug } = useParams();
  const { user } = useAuth();
  const [downloading, setDownloading] = useState(false);
  const [userPlanInfo, setUserPlanInfo] = useState({ tipo_plan: 'gratuito', es_pro_plus: false, loaded: false });
  const [metrics, setMetrics] = useState({ visualizaciones: 0, descargas: 0 });
  const [articulo, setArticulo] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Ref para evitar doble conteo en React Strict Mode
  const viewTracked = React.useRef(false);

  const [particles] = useState(() => {
    return Array.from({ length: 20 }, (_, i) => ({
      id: i,
      top: Math.random() * 100,
      left: Math.random() * 100,
      size: Math.random() * 4 + 2,
      opacity: Math.random() * 0.3 + 0.2,
      delay: Math.random() * 5000,
      color: Math.random() > 0.5 ? 'purple' : 'green',
      shade: Math.random() > 0.5 ? '300' : '400'
    }));
  });

    // Fetch Articulo Details from API
    useEffect(() => {
        setLoading(true);
        fetch(`${API_URL}/recursos/${slug}`)
            .then(res => res.json())
            .then(data => {
                if (data.success && data.data) {
                    setArticulo(data.data);
                    setMetrics({
                        visualizaciones: data.data.visualizaciones || 0,
                        descargas: data.data.descargas || 0
                    });
                } else {
                    setArticulo(null);
                }
            })
            .catch(err => {
                console.error("Error fetching article:", err);
                setArticulo(null);
            })
            .finally(() => setLoading(false));
    }, [slug]);


  // Track Views (Incrementar)
  useEffect(() => {
    if (viewTracked.current === slug || loading || !articulo) return; 

    if (slug) {
        viewTracked.current = slug; 
        fetch(`${API_URL}/recursos/${slug}/view`, { method: 'POST' })
            .then(res => res.json())
            .then(data => {
                if (data.success && data.data) {
                    setMetrics(data.data);
                }
            })
            .catch(err => console.error("Error tracking view:", err));
    }
  }, [slug, loading, articulo]);

  // Fetch plan status
  useEffect(() => {
    const fetchPlan = async () => {
      if (!user) return;
      
      // Si es admin u orientador, acceso total
      if (user.roles && (user.roles.some(r => r === 'administrador' || r === 'orientador' || (typeof r === 'object' && (r.nombre === 'administrador' || r.nombre === 'orientador'))))) {
          setUserPlanInfo({ tipo_plan: 'pro_plus', es_pro_plus: true, loaded: true });
          return;
      }

      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/estudiante/mi-suscripcion`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        if (res.ok) {
            const data = await res.json();
            if (data.success && data.data) {
                setUserPlanInfo({ 
                    tipo_plan: data.data.tipo_plan, 
                    es_pro_plus: data.data.es_pro_plus, 
                    loaded: true 
                });
            }
        }
      } catch (e) { console.error(e); }
    };
    
    fetchPlan();
  }, [user]);
  
  const hasAccess = (planRequerido) => {
    if (!planRequerido || planRequerido === 'gratuito') return true;
    if (!user) return false;
    if (user.roles && (user.roles.some(r => r === 'administrador' || r === 'orientador' || (typeof r === 'object' && (r.nombre === 'administrador' || r.nombre === 'orientador'))))) return true;

    const { tipo_plan, es_pro_plus } = userPlanInfo;
    const planNormalizado = tipo_plan?.toLowerCase().replace(' ', '_');
    
    if (planRequerido === 'pro') return planNormalizado === 'pro' || planNormalizado === 'pro_plus' || es_pro_plus;
    if (planRequerido === 'pro_plus') return planNormalizado === 'pro_plus' || es_pro_plus;
    
    return false;
  };

  const handleDownloadPDF = async () => {
      // Implementación similar a listado, usando slug
      if (downloading) return;
      setDownloading(true);
      try {
          const token = localStorage.getItem('token');
          const response = await fetch(`${API_URL}/recursos/articulos/${slug}/pdf`, {
              headers: { Authorization: `Bearer ${token}` }
          });
          if (!response.ok) throw new Error('Error descarga');
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${slug}.pdf`;
          document.body.appendChild(a); a.click(); a.remove(); window.URL.revokeObjectURL(url);
          
          // Actualizar métrica descarga sin recargar
          setMetrics(prev => ({...prev, descargas: prev.descargas + 1}));
      } catch (e) {
          console.error(e);
          alert('Error al descargar PDF');
      } finally {
          setDownloading(false);
      }
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: articulo?.titulo,
          text: articulo?.descripcion,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        alert('Enlace copiado');
      }
    } catch (e) {}
  };

  if (loading) {
      return <div className="min-h-screen flex items-center justify-center bg-gray-50"><p className="text-xl text-gray-500">Cargando artículo...</p></div>;
  }

  if (!articulo) {
    return (
      <main className="min-h-screen bg-linear-to-br from-purple-50 via-white to-green-50 relative overflow-hidden flex items-center justify-center">
        <div className="relative z-10 px-6 md:px-20 py-16 text-center">
            <h1 className="text-4xl font-bold mb-4">Artículo no encontrado</h1>
            <Link to="/recursos"><Button>Volver a recursos</Button></Link>
        </div>
      </main>
    );
  }

  // Determinar plan y acceso
  const planName = articulo.plan_requerido || 'gratuito';
  const userHasAccess = hasAccess(planName);

  // Determinar componente a renderizar (Legacy vs Contenido BD)
  const LegacyComponent = LEGACY_COMPONENTS[slug];
  
  return (
    <main className="min-h-screen bg-linear-to-br from-purple-50 via-white to-green-50 relative overflow-hidden">
      {/* FONDO ANIMADO */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        {particles.map((particle) => (
          <div key={particle.id} className={`absolute bg-${particle.color}-${particle.shade} rounded-full animate-float`}
            style={{ top: `${particle.top}%`, left: `${particle.left}%`, width: `${particle.size}px`, height: `${particle.size}px`, opacity: particle.opacity, animationDelay: `${particle.delay}ms` }}
          />
        ))}
      </div>

      <div className="relative z-10 w-full px-4 md:px-8 lg:px-12 py-8">
        <div className="mx-auto w-full max-w-[1600px]">
        {/* Navegación */}
        <nav className="flex items-center gap-2 text-sm text-gray-600 mb-8">
          <Link to="/recursos" className="hover:text-purple-600">Recursos</Link>
          <span className="text-purple-400">/</span>
          <Link to="/recursos/articulos" className="hover:text-purple-600">Artículos</Link>
          <span className="text-purple-400">/</span>
          <span className="font-bold text-purple-700">{articulo.titulo}</span>
        </nav>

        {/* Encabezado */}
        <header className="mb-12">
          <div className="flex flex-wrap items-center gap-3 mb-6">
            {articulo.destacado && <span className="flex items-center gap-1.5 bg-amber-500 text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg">⭐ Popular</span>}
            {planName !== 'gratuito' && (
              <span className="flex items-center gap-1.5 bg-purple-600 text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg">
                <Crown className="w-3 h-3" /> {planName === 'pro' ? 'PRO' : 'PRO+'}
              </span>
            )}
            {/* Tags (si existen, placeholder si no) */}
            <span className="bg-white/80 border border-purple-200 text-purple-700 px-3 py-1.5 rounded-full text-xs font-medium">#{articulo.tipo || 'educación'}</span>
          </div>

          <h1 className="text-4xl lg:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-green-600 mb-6">{articulo.titulo}</h1>
          <p className="text-xl text-gray-700 mb-8 font-medium">{articulo.descripcion}</p>

          <div className="bg-white/80 backdrop-blur-sm border-2 border-purple-200 rounded-3xl p-6 shadow-lg">
             <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <div className="flex flex-wrap items-center gap-6 text-sm">
                   <div className="flex items-center gap-2 font-medium"><Clock className="h-5 w-5 text-purple-600"/> <span>{articulo.tiempo_lectura || '5 min'}</span></div>
                   <div className="flex items-center gap-4 border-l border-gray-300 pl-4">
                      <div className="flex items-center gap-1.5" title="Vistas"><Eye className="h-4 w-4 text-purple-500"/> <span>{metrics.visualizaciones}</span></div>
                      <div className="flex items-center gap-1.5" title="Descargas"><Download className="h-4 w-4 text-green-500"/> <span>{metrics.descargas}</span></div>
                   </div>
                   <div>📅 {new Date(articulo.created_at).toLocaleDateString()}</div>
                   <div>✍️ {articulo.autor_nombre || 'Equipo VocAcción'}</div>
                </div>
                <div className="flex gap-2">
                   <Button onClick={handleShare} className="bg-green-500 text-white hover:bg-green-600 rounded-2xl"><Share2 className="h-4 w-4 mr-2"/> Compartir</Button>
                   <Button onClick={hasAccess(planName) ? handleDownloadPDF : undefined} className={`bg-blue-500 text-white hover:bg-blue-600 rounded-2xl ${!hasAccess(planName) && 'opacity-50'}`}>
                      {!hasAccess(planName) ? <Lock className="h-4 w-4 mr-2"/> : <Download className="h-4 w-4 mr-2"/>} {downloading ? 'Descargando...' : 'Descargar PDF'}
                   </Button>
                </div>
             </div>
          </div>
        </header>

        {/* Contenido Artículo */}
        <article className="prose prose-lg prose-gray max-w-none bg-white/70 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-white mb-12 relative overflow-hidden">
             {!userHasAccess && (
                 <div className="absolute inset-0 bg-white/60 backdrop-blur-md flex flex-col items-center justify-center z-20 text-center p-8">
                     <div className="bg-white p-8 rounded-2xl shadow-xl border border-purple-100 max-w-md">
                         <Crown className="w-10 h-10 text-purple-600 mx-auto mb-4"/>
                         <h3 className="text-2xl font-bold mb-2">Contenido Exclusivo</h3>
                         <p className="mb-6 text-gray-600">Actualiza tu plan para ver este recurso.</p>
                         <Link to="/planes"><Button className="w-full bg-purple-600 hover:bg-purple-700 text-white">Ver Planes</Button></Link>
                     </div>
                 </div>
             )}
             
             <div className={!userHasAccess ? 'blur-md select-none h-96 overflow-hidden' : ''}>
                 {LegacyComponent ? (
                     <LegacyComponent />
                 ) : (
                     <div 
                        className="prose prose-lg prose-purple max-w-none text-gray-800 font-sans"
                        dangerouslySetInnerHTML={{ __html: articulo.contenido || '<p>Sin contenido disponible.</p>' }} 
                     />
                  )}
             </div>
        </article>
        
        {/* Navigation & Related (Simplificado para esta versión) */}
        <div className="mt-8 text-center">
            <Link to="/recursos"><Button variant="outline">Volver al listado</Button></Link>
        </div>

      </div>
      </div>
    </main>
  );
};

export default ArticuloDetalle;