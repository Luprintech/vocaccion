import React, { useState } from 'react';
import { Target, Award, Layout, Zap, CheckCircle, XCircle, FileText, Briefcase, Eye, Download, Lock, BadgeCheck } from 'lucide-react';
import { useAuth } from '@/context/AuthContextFixed';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const ArticuloCurriculum = () => {
    const { user, token } = useAuth();
    const [downloading, setDownloading] = useState(false);
    const [hasAccess, setHasAccess] = useState(false);
    const [checkingAccess, setCheckingAccess] = useState(true);

    // Verificar acceso real con el backend al montar el componente
    React.useEffect(() => {
        const checkSubscriptionStatus = async () => {
            if (!user || !token) {
                setHasAccess(false);
                setCheckingAccess(false);
                return;
            }

            // Acceso inmediato para roles privilegiados
            const userRol = user.rol || (user.roles && user.roles[0]?.name);
             if (userRol === 'administrador' || userRol === 'orientador') {
                setHasAccess(true);
                setCheckingAccess(false);
                return;
            }

            try {
                const response = await fetch(`${API_URL}/estudiante/mi-suscripcion`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    // Normalizar plan: puede venir como "Pro Plus", "pro_plus", "pro", etc.
                    // Ajuste: la respuesta viene envuelta en 'data' pro Laravels standard response
                    const subscriptionData = data.data || {};
                    const plan = (subscriptionData.tipo_plan || '').toLowerCase().replace(/\s+/g, '_');
                    const esPro = plan === 'pro';
                    const esProPlus = plan === 'pro_plus' || !!subscriptionData.es_pro_plus;
                    
                    // Permitir acceso a PRO y PRO PLUS
                    setHasAccess(esPro || esProPlus);
                }
            } catch (error) {
                console.error("Error verificando suscripción:", error);
                // Fallback a info local solo si falla el backend
                const localPlan = (user.tipo_plan || '').toLowerCase().replace(' ', '_');
                setHasAccess(localPlan === 'pro' || localPlan === 'pro_plus');
            } finally {
                setCheckingAccess(false);
            }
        };

        checkSubscriptionStatus();
    }, [user, token]);

  const handleDownloadTemplate = async () => {
    if (!user) return;
    
    setDownloading(true);
    try {
        // Al estar en la carpeta public del frontend, usamos una ruta relativa a la raíz del sitio
        // Esto evita CORS y errores de servidor backend
        const fileUrl = '/plantillas/plantilla_curriculum_2025.pdf';

        const link = document.createElement('a');
        link.href = fileUrl;
        link.setAttribute('download', 'plantilla_curriculum_2025.pdf');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Pequeño delay para feedback visual
        setTimeout(() => setDownloading(false), 500);

    } catch (error) {
         console.error('Error en descarga:', error);
         alert('Hubo un problema iniciando la descarga.');
         setDownloading(false);
    }
   };

  return (
    <div className="space-y-12 font-sans text-gray-800">
      
      {/* Intro Box */}
      <div className="bg-linear-to-r from-blue-50 to-indigo-50 p-8 rounded-2xl border border-blue-100 shadow-xs">
        <div className="flex items-start gap-4">
          <div className="bg-white p-3 rounded-full shadow-sm text-2xl hidden sm:block">
            🚀
          </div>
          <div>
            <h3 className="text-xl font-bold text-blue-900 mb-2">El Arte de Destacar en 6 Segundos</h3>
            <p className="text-blue-800 leading-relaxed">
              ¿Sabías que los reclutadores dedican una media de <strong>6 a 10 segundos</strong> a escanear un currículum antes de decidir si seguir leyendo? Tu objetivo no es contarlo todo, sino contar lo relevante de forma instantánea. En 2025, la clave es el impacto visual y la claridad.
            </p>
          </div>
        </div>
      </div>

     {/* Bloque de descarga de plantilla (Premium) */}
      <div className="bg-linear-to-br from-purple-50 to-indigo-50 border border-purple-100 rounded-2xl p-8 shadow-sm relative overflow-hidden group">
         <div className="absolute top-0 right-0 w-32 h-32 bg-purple-200/20 rounded-full blur-2xl -mr-10 -mt-10 transition-transform group-hover:scale-150 duration-700"></div>
         
         <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
            <div>
               <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold mb-3 ${hasAccess ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'}`}>
                  {hasAccess ? <BadgeCheck className="w-3 h-3" /> : <Award className="w-3 h-3" />} 
                  {hasAccess ? 'ACCESO DESBLOQUEADO' : 'RECURSO PREMIUM'}
               </div>
               <h3 className="text-2xl font-bold text-gray-900 mb-2">Plantilla CV "Impacto 2025"</h3>
               <p className="text-gray-600 max-w-lg">
                  Descarga nuestra plantilla exclusiva. 
               </p>
            </div>
            
            <button 
               onClick={handleDownloadTemplate}
               disabled={downloading || !hasAccess || checkingAccess}
               className={`flex items-center gap-3 px-8 py-4 rounded-xl font-bold shadow-lg transition-all transform hover:-translate-y-1 ${
                  hasAccess 
                  ? 'bg-linear-to-r from-purple-600 to-indigo-600 text-white hover:shadow-purple-500/30 cursor-pointer' 
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
               }`}
            >
               {checkingAccess ? (
                  <span className="animate-pulse">Verificando...</span>
               ) : downloading ? (
                  <span className="animate-pulse">Descargando...</span>
               ) : !hasAccess ? (
                   <>
                     <Lock className="w-5 h-5" /> <span>Solo PRO</span>
                   </>
               ) : (
                   <>
                     <Download className="w-5 h-5" /> <span>Descargar Plantilla</span>
                   </>
               )}
            </button>
         </div>
      </div>

      {/* Section 1: Philosophy */}
      <section>
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-indigo-100 p-2 rounded-lg">
            <Target className="w-6 h-6 text-indigo-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Menos es Más: La Nueva Regla</h2>
        </div>
        
        <p className="mb-6 text-lg text-gray-600 leading-relaxed">
          Olvídate de las listas interminables de tareas aburridas. El mercado laboral actual valora los <strong>logros cuantificables</strong>, las habilidades blandas (soft skills) validadas, y la capacidad de síntesis.
        </p>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-red-50 p-6 rounded-2xl border border-red-100">
            <h3 className="font-bold text-red-700 mb-3 flex items-center gap-2">
              <XCircle className="w-5 h-5" /> Lo que ya NO funciona
            </h3>
            <ul className="space-y-2 text-red-800/80 text-sm">
              <li>• Diseños sobrecargados o "barrocos".</li>
              <li>• Fotos informales o selfies.</li>
              <li>• Listas de tareas genéricas ("Responsable de ventas").</li>
              <li>• Incluir dirección postal completa o DNI (ya no es necesario).</li>
            </ul>
          </div>
          
          <div className="bg-green-50 p-6 rounded-2xl border border-green-100">
            <h3 className="font-bold text-green-700 mb-3 flex items-center gap-2">
              <CheckCircle className="w-5 h-5" /> Lo que triunfa en 2025
            </h3>
            <ul className="space-y-2 text-green-800/80 text-sm">
              <li>• Diseño limpio, aireado y con buena jerarquía.</li>
              <li>• Enlaces a LinkedIn o Portafolio.</li>
              <li>• Verbos de acción ("Lideré", "Creé", "Optimicé").</li>
              <li>• Palabras clave adaptadas a la oferta (ATS friendly).</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Section 2: Structure */}
      <section>
         <div className="flex items-center gap-3 mb-8">
          <div className="bg-purple-100 p-2 rounded-lg">
            <Layout className="w-6 h-6 text-purple-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Anatomía de un CV Perfecto</h2>
        </div>

        <div className="relative border-l-4 border-purple-200 ml-4 space-y-12">
          {/* Step 1 */}
          <div className="relative pl-8">
            <div className="absolute -left-[22px] top-0 bg-purple-600 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold shadow-lg border-4 border-white">1</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Perfil Profesional (El Gancho)</h3>
            <div className="bg-white p-6 rounded-xl shadow-xs border border-gray-100">
              <p className="text-gray-600 mb-4">
                Un párrafo de 3-4 líneas justo debajo de tu nombre. Es tu "Elevator Pitch". Debe responder: <strong>¿Quién eres? ¿Qué has conseguido? ¿Qué buscas aportar?</strong>
              </p>
              <div className="bg-gray-50 p-4 rounded-lg text-sm italic border-l-4 border-purple-400">
                "Desarrollador Full Stack con 3 años de experiencia especializado en React y Node.js. He liderado la migración de sistemas legacy reduciendo los tiempos de carga un 40%. Busco aplicar mi pasión por la UX en proyectos de alto impacto."
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="relative pl-8">
            <div className="absolute -left-[22px] top-0 bg-purple-600 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold shadow-lg border-4 border-white">2</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Experiencia: Impacto Real</h3>
            <div className="bg-white p-6 rounded-xl shadow-xs border border-gray-100">
              <p className="text-gray-600 mb-4">
                No listes responsabilidades, lista <strong>logros</strong>. Usa la fórmula: <span className="font-semibold text-purple-600">Verbo de Acción + Tarea + Resultado (Número)</span>.
              </p>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div className="bg-red-50 p-3 rounded-lg text-red-700">
                  <span className="font-bold block mb-1">Antes:</span>
                  "Encargado de gestionar las redes sociales de la empresa."
                </div>
                <div className="bg-green-50 p-3 rounded-lg text-green-700">
                  <span className="font-bold block mb-1">Ahora:</span>
                  "Aumenté la comunidad en Instagram un 150% en 6 meses mediante estrategias de contenido viral."
                </div>
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="relative pl-8">
            <div className="absolute -left-[22px] top-0 bg-purple-600 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold shadow-lg border-4 border-white">3</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Habilidades: Hard & Soft</h3>
            <div className="bg-white p-6 rounded-xl shadow-xs border border-gray-100">
              <p className="text-gray-600 mb-4">
                Separa claramente tus conocimientos técnicos de tus habilidades interpersonales.
              </p>
              <div className="flex flex-wrap gap-2">
                 <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold">Python</span>
                 <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold">Figma</span>
                 <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold">Gestión de Proyectos</span>
                 <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-semibold">Liderazgo</span>
                 <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-semibold">Comunicación Asertiva</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: Design Tips */}
      <section>
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-pink-100 p-2 rounded-lg">
            <Eye className="w-6 h-6 text-pink-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Consejos de Diseño Visual</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow text-center group">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-gray-200 transition-colors">
              <span className="text-xl">🎨</span>
            </div>
            <h4 className="font-bold text-gray-900 mb-2">Color con Propósito</h4>
            <p className="text-sm text-gray-600">
              Usa un color de acento (azul oscuro, verde bosque, burdeos) para títulos o líneas. Mantén el texto principal en gris oscuro o negro para máxima legibilidad.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow text-center group">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-gray-200 transition-colors">
              <span className="text-xl">🔤</span>
            </div>
            <h4 className="font-bold text-gray-900 mb-2">Tipografía Limpia</h4>
            <p className="text-sm text-gray-600">
              Opta por fuentes sans-serif modernas como Roboto, Open Sans, Lato o Arial. Tamaño 10-12pt para cuerpo y 14-16pt para títulos.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow text-center group">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-gray-200 transition-colors">
              <span className="text-xl">📄</span>
            </div>
            <h4 className="font-bold text-gray-900 mb-2">Espacio en Blanco</h4>
            <p className="text-sm text-gray-600">
              No llenes la hoja hasta los bordes. Deja márgenes generosos y espacio entre secciones. El ojo necesita descansar para leer bien.
            </p>
          </div>
        </div>
      </section>

      {/* Call to Action for Pro Tools if needed, otherwise just conclusion */}
      <section className="bg-linear-to-br from-indigo-900 to-purple-800 text-white p-10 rounded-3xl text-center shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-pink-500 opacity-10 rounded-full -ml-32 -mb-32 blur-3xl"></div>
        
        <div className="relative z-10">
          <Zap className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
          <h3 className="text-2xl font-bold mb-4">¿Listo para crear tu CV?</h3>
          <p className="border-t border-white/20 pt-6 mt-6 max-w-2xl mx-auto text-indigo-100">
             Recuerda: Tu currículum es un documento vivo. Actualízalo con cada nuevo logro, curso o proyecto. ¡Mucho éxito en tu búsqueda!
          </p>
        </div>
      </section>

      {/* Sources */}
      <section className="border-t border-gray-100 pt-8 mt-12">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <BookOpenIcon className="w-5 h-5 text-gray-400" /> Fuentes y Referencias
        </h3>
        <ul className="list-disc pl-5 space-y-2 text-sm text-gray-500">
          <li>
            <a href="https://europass.europa.eu/es" target="_blank" rel="noopener noreferrer" className="hover:text-purple-600 transition-colors underline decoration-dotted">
              Europass Unión Europea
            </a> - Estándares oficiales de movilidad laboral.
          </li>
          <li>
             Informes de Tendencias de Talento de LinkedIn y InfoJobs (2024-2025).
          </li>
        </ul>
      </section>
    </div>
  );
};

// Helper icon component for sources section since it wasn't imported at top
const BookOpenIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
  </svg>
);

export default ArticuloCurriculum;
