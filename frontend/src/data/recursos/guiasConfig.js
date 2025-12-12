/**
 * Configuración de Guías Descargables - VocAcción
 * 
 * Base de datos centralizada de todas las guías y recursos descargables
 * con metadatos, información de archivos y configuración para descargas
 */

export const guiasConfig = [
  {
    id: 1,
    slug: "guia-becas-2025",
    titulo: "Guía Completa de Becas 2025",
    descripcion: "Todas las becas disponibles para estudiantes españoles: requisitos, plazos, cuantías y cómo solicitarlas paso a paso.",
    categoria: "ayudas",
    formato: "PDF",
    tamano: "2.4 MB",
    paginas: 24,
    fechaCreacion: "15 de Enero, 2025",
    fechaActualizacion: "Enero 2025",
    descargas: 1247,
    valoracion: 4.8,
    popular: true,
    gratuito: true,
    autor: "Equipo de Orientación VocAcción",
    preview: "/previews/guia-becas-2025.jpg",
    archivoUrl: "/downloads/guia-becas-2025.pdf", // URL de descarga
    tags: ["becas", "ayudas", "financiación", "estudiantes"],
    contenido: [
      "1. Introducción al sistema de becas en España",
      "2. Beca General del Ministerio de Educación", 
      "3. Becas autonómicas por comunidades",
      "4. Becas de fundaciones privadas",
      "5. Becas para estudios en el extranjero",
      "6. Calendario de solicitudes 2025",
      "7. Documentación necesaria",
      "8. Consejos para completar la solicitud",
      "9. Criterios de baremación", 
      "10. Qué hacer si te deniegan la beca",
      "Anexos: Formularios y enlaces útiles"
    ],
    descripcionLarga: `Esta guía comprehensiva te ayudará a navegar el complejo mundo de las becas educativas en España. 
    
    Incluye información actualizada sobre todos los tipos de ayudas disponibles, desde las becas generales del Ministerio de Educación hasta las específicas de cada comunidad autónoma y las ofrecidas por fundaciones privadas.
    
    Además de enumerar las becas disponibles, la guía te proporciona estrategias prácticas para maximizar tus posibilidades de obtener financiación, incluyendo consejos sobre cómo completar las solicitudes, qué documentación preparar y cómo interpretar los criterios de baremación.`
  },
  {
    id: 2,
    slug: "comparativa-carreras-tecnologicas",
    titulo: "Comparativa de Carreras Tecnológicas",
    descripcion: "Análisis detallado de 15 carreras tecnológicas: salarios, empleabilidad, competencias requeridas y salidas profesionales.",
    categoria: "carreras",
    formato: "PDF",
    tamano: "3.1 MB",
    paginas: 32,
    fechaCreacion: "10 de Diciembre, 2024",
    fechaActualizacion: "Diciembre 2024",
    descargas: 892,
    valoracion: 4.6,
    popular: true,
    gratuito: true,
    autor: "Tech Careers Research Team",
    preview: "/previews/carreras-tecnologicas.jpg",
    archivoUrl: "/downloads/comparativa-carreras-tech.pdf",
    tags: ["tecnología", "carreras", "salarios", "empleabilidad"],
    contenido: [
      "1. Metodología del estudio",
      "2. Ingeniería Informática",
      "3. Desarrollo de Aplicaciones Web",
      "4. Desarrollo de Aplicaciones Multiplataforma",
      "5. Ciberseguridad", 
      "6. Inteligencia Artificial",
      "7. Ciencia de Datos",
      "8. Ingeniería de Telecomunicaciones",
      "9. Robótica y Automatización",
      "10. Diseño UX/UI",
      "11. DevOps y Cloud Computing",
      "12. Blockchain y Criptomonedas", 
      "13. Realidad Virtual y Aumentada",
      "14. IoT (Internet de las Cosas)",
      "15. Biotecnología Digital",
      "Conclusiones y recomendaciones"
    ],
    descripcionLarga: `Un estudio exhaustivo que compara 15 de las carreras tecnológicas más demandadas en el mercado laboral actual.
    
    Para cada carrera se analizan factores clave como rangos salariales, tasas de empleabilidad, competencias técnicas requeridas, posibilidades de teletrabajo, proyección de crecimiento a 5 años y principales empleadores.
    
    Los datos están basados en estadísticas oficiales, estudios sectoriales y encuestas a más de 500 profesionales en activo, proporcionando una visión realista y actualizada del panorama tecnológico español.`
  },
  {
    id: 3,
    slug: "checklist-selectividad",
    titulo: "Checklist para Selectividad (EBAU)",
    descripcion: "Lista de verificación completa para preparar la selectividad: documentación, fechas, estrategias de estudio y consejos.",
    categoria: "examenes",
    formato: "PDF",
    tamano: "1.2 MB",
    paginas: 12,
    fechaCreacion: "10 de Enero, 2025",
    fechaActualizacion: "Enero 2025",
    descargas: 2156,
    valoracion: 4.9,
    popular: true,
    gratuito: true,
    autor: "Equipo Pedagógico VocAcción",
    preview: "/previews/checklist-selectividad.jpg",
    archivoUrl: "/downloads/checklist-selectividad-2025.pdf",
    tags: ["selectividad", "ebau", "preparación", "examenes"],
    contenido: [
      "1. Qué es la EBAU y para qué sirve",
      "2. Fechas importantes por comunidades",
      "3. Documentación necesaria",
      "4. Inscripción paso a paso", 
      "5. Estructura del examen",
      "6. Estrategias de estudio efectivas",
      "7. Gestión del tiempo durante el examen",
      "8. Cálculo de notas de admisión",
      "9. Qué hacer después de los resultados",
      "10. Recursos adicionales y enlaces útiles",
      "Checklist final imprimible"
    ],
    descripcionLarga: `Una guía práctica e indispensable para todos los estudiantes que van a presentarse a la selectividad.
    
    Incluye toda la información necesaria para preparar exitosamente la EBAU, desde los trámites administrativos hasta estrategias de estudio probadas. La guía está diseñada como un checklist que puedes ir marcando conforme avances en tu preparación.
    
    Contiene información actualizada para el curso 2024-2025, con fechas específicas por comunidades autónomas y todos los cambios normativos más recientes.`
  },
  {
    id: 4,
    slug: "guia-fp-superior",
    titulo: "Guía de Ciclos de FP Superior",
    descripcion: "Directorio completo de todos los ciclos de Grado Superior disponibles en España con requisitos y centros.",
    categoria: "fp",
    formato: "PDF", 
    tamano: "4.2 MB",
    paginas: 48,
    fechaCreacion: "8 de Enero, 2025",
    fechaActualizacion: "Enero 2025",
    descargas: 756,
    valoracion: 4.5,
    popular: false,
    gratuito: true,
    autor: "Observatorio de FP España",
    preview: "/previews/fp-superior.jpg",
    archivoUrl: "/downloads/guia-fp-superior-2025.pdf",
    tags: ["fp", "grado superior", "ciclos", "formación"],
    contenido: [
      "1. Introducción a la FP de Grado Superior",
      "2. Requisitos de acceso",
      "3. Ciclos por familias profesionales",
      "4. Administración y Gestión",
      "5. Informática y Comunicaciones",
      "6. Sanidad",
      "7. Servicios Socioculturales",
      "8. Comercio y Marketing",
      "9. Electrónica Industrial", 
      "10. Fabricación Mecánica",
      "... (todas las familias)",
      "Directorio de centros por comunidades",
      "Calendario académico y fechas importantes"
    ],
    descripcionLarga: `El directorio más completo de ciclos formativos de Grado Superior disponibles en España.
    
    Organizado por familias profesionales, incluye información detallada sobre cada ciclo: competencias que se adquieren, salidas profesionales, requisitos específicos de acceso y centros donde se puede estudiar.
    
    Ideal para estudiantes que quieren explorar todas las opciones de FP Superior disponibles y tomar una decisión informada sobre su futuro formativo.`
  },
  {
    id: 5,
    slug: "test-autoconocimiento",
    titulo: "Test de Autoconocimiento Vocacional",
    descripcion: "Cuestionario interactivo imprimible para explorar tus intereses, valores y habilidades de forma estructurada.",
    categoria: "tests",
    formato: "PDF",
    tamano: "800 KB",
    paginas: 8,
    fechaCreacion: "15 de Diciembre, 2024",
    fechaActualizacion: "Diciembre 2024",
    descargas: 1543,
    valoracion: 4.7,
    popular: false,
    gratuito: true,
    autor: "Dra. Carmen López, Psicóloga Educativa",
    preview: "/previews/test-autoconocimiento.jpg", 
    archivoUrl: "/downloads/test-autoconocimiento-vocacional.pdf",
    tags: ["test", "autoconocimiento", "vocación", "intereses"],
    contenido: [
      "1. Introducción al autoconocimiento",
      "2. Instrucciones para completar el test",
      "3. Sección A: Explorando tus intereses",
      "4. Sección B: Identificando tus valores",
      "5. Sección C: Evaluando tus habilidades",
      "6. Sección D: Tu personalidad profesional",
      "7. Interpretación de resultados",
      "8. Próximos pasos y recursos adicionales"
    ],
    descripcionLarga: `Un test científicamente fundamentado para ayudarte a conocerte mejor y tomar decisiones vocacionales más acertadas.
    
    Basado en teorías reconocidas de orientación vocacional, este cuestionario te guía a través de una reflexión estructurada sobre tus intereses, valores, habilidades y tipo de personalidad.
    
    El formato imprimible te permite completarlo a tu ritmo y conservarlo como referencia para futuras decisiones educativas y profesionales.`
  },
  // Más guías...
];

// Categorías disponibles para filtrado
export const categoriasGuias = [
  { id: "todos", nombre: "Todas las guías" },
  { id: "ayudas", nombre: "Becas y Ayudas" },
  { id: "carreras", nombre: "Carreras y Grados" },
  { id: "fp", nombre: "Formación Profesional" },
  { id: "examenes", nombre: "Exámenes" },
  { id: "tests", nombre: "Tests Vocacionales" },
  { id: "empleo", nombre: "Empleo" },
  { id: "internacional", nombre: "Internacional" }
];

// Utilidades para trabajar con guías
export const getGuiaBySlug = (slug) => {
  return guiasConfig.find(guia => guia.slug === slug);
};

export const getGuiasByCategoria = (categoria) => {
  if (categoria === "todos") return guiasConfig;
  return guiasConfig.filter(guia => guia.categoria === categoria);
};

export const getGuiasPopulares = () => {
  return guiasConfig.filter(guia => guia.popular);
};

export const getGuiasRelacionadas = (guiaActual, limite = 3) => {
  return guiasConfig
    .filter(guia => 
      guia.id !== guiaActual.id && 
      (guia.categoria === guiaActual.categoria || 
       guia.tags.some(tag => guiaActual.tags.includes(tag)))
    )
    .slice(0, limite);
};

export const getEstadisticasDescarga = () => {
  return {
    totalDescargas: guiasConfig.reduce((total, guia) => total + guia.descargas, 0),
    totalGuias: guiasConfig.length,
    valoracionPromedio: (guiasConfig.reduce((total, guia) => total + guia.valoracion, 0) / guiasConfig.length).toFixed(1)
  };
};

export default guiasConfig;