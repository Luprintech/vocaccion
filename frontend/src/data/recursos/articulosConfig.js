/**
 * Configuración de Artículos - VocAcción
 * 
 * Base de datos centralizada de todos los artículos disponibles
 * con metadatos, categorización y configuración para routing
 */

export const articulosConfig = [
  {
    id: 1,
    slug: "que-hacer-si-no-se-que-estudiar", 
    titulo: "¿Qué hacer si no sé qué estudiar?",
    descripcion: "Una guía completa para descubrir tu vocación y elegir la mejor formación para tu futuro profesional.",
    autor: "Equipo de Orientación VocAcción",
    fechaPublicacion: "15 de Enero, 2025",
    tiempoLectura: "8 min",
    categoria: "orientación",
    tags: ["vocación", "decisiones", "futuro", "autoconocimiento"],
    popular: true,
    imagen: "/images/articulos/que-estudiar.jpg",
    componente: "ArticuloQueEstudiar", // Nombre del componente React
    resumen: "Estrategias prácticas para descubrir tus intereses, evaluar tus habilidades y tomar decisiones informadas sobre tu futuro educativo y profesional.",
    temas: [
      "Autoconocimiento personal",
      "Evaluación de intereses y habilidades", 
      "Exploración de opciones educativas",
      "Toma de decisiones estratégicas"
    ]
  },
  {
    id: 2,
    slug: "universidad-fp-cursos-como-elegir",
    titulo: "Universidad vs FP vs Cursos: Cómo elegir",
    descripcion: "Comparativa completa para ayudarte a decidir qué tipo de formación se adapta mejor a tu perfil y objetivos.",
    autor: "María González, Orientadora Educativa", 
    fechaPublicacion: "12 de Enero, 2025",
    tiempoLectura: "12 min",
    categoria: "formación",
    tags: ["universidad", "fp", "comparativa", "educación", "tipos de formación"],
    popular: true,
    imagen: "/images/articulos/universidad-fp.jpg",
    componente: "ArticuloUniversidadFP",
    resumen: "Análisis detallado de las diferencias entre educación universitaria, formación profesional y cursos especializados, con criterios para elegir la mejor opción.",
    temas: [
      "Características de cada modalidad",
      "Ventajas y desventajas", 
      "Empleabilidad y salidas profesionales",
      "Criterios de decisión personalizados"
    ]
  },
  {
    id: 3,
    slug: "como-elegir-carrera-universitaria",
    titulo: "Cómo elegir la carrera universitaria perfecta",
    descripción: "Factores clave a considerar al elegir qué carrera estudiar en la universidad: salidas profesionales, aptitudes y más.",
    autor: "Carlos Ruiz, Psicólogo Educativo",
    fechaPublicacion: "8 de Enero, 2025", 
    tiempoLectura: "10 min",
    categoria: "universidad",
    tags: ["universidad", "carrera", "elección", "futuro"],
    popular: false,
    imagen: "/images/articulos/carrera-universitaria.jpg",
    componente: "ArticuloCarreraUniversitaria", // Por crear
    resumen: "Guía práctica para evaluar carreras universitarias considerando aptitudes personales, mercado laboral y proyección profesional.",
    temas: [
      "Evaluación de aptitudes e intereses",
      "Análisis del mercado laboral",
      "Factores económicos y geográficos",
      "Proceso de toma de decisiones"
    ]
  },
  {
    id: 4,
    slug: "fp-dual-que-es-ventajas",
    titulo: "FP Dual: Qué es y cuáles son sus ventajas",
    descripcion: "Todo lo que necesitas saber sobre la Formación Profesional Dual: cómo funciona, beneficios y cómo acceder.",
    autor: "Ana Martín, Experta en FP",
    fechaPublicacion: "5 de Enero, 2025",
    tiempoLectura: "7 min", 
    categoria: "fp",
    tags: ["fp", "dual", "formación", "prácticas", "empresa"],
    popular: false,
    imagen: "/images/articulos/fp-dual.jpg",
    componente: "ArticuloFPDual", // Por crear
    resumen: "Explicación completa del sistema de FP Dual, sus beneficios para estudiantes y empresas, y cómo acceder a estos programas.",
    temas: [
      "Qué es la FP Dual",
      "Diferencias con la FP tradicional",
      "Ventajas para estudiantes y empresas", 
      "Proceso de acceso y requisitos"
    ]
  },
  {
    id: 5,
    slug: "test-orientacion-vocacional-como-funciona",
    titulo: "Tests de orientación vocacional: ¿Realmente funcionan?",
    descripcion: "Análisis de la efectividad de los tests vocacionales y cómo pueden ayudarte en tu proceso de decisión.",
    autor: "Dr. Luis Fernández, Psicólogo",
    fechaPublicacion: "2 de Enero, 2025",
    tiempoLectura: "6 min",
    categoria: "orientación",
    tags: ["tests", "vocación", "psicología", "autoconocimiento"],
    popular: false,
    imagen: "/images/articulos/test-vocacional.jpg",
    componente: "ArticuloTestsVocacionales", // Por crear
    resumen: "Evaluación crítica de los tests vocacionales, sus limitaciones, ventajas y cómo interpretarlos correctamente.",
    temas: [
      "Tipos de tests vocacionales",
      "Validez científica y limitaciones",
      "Cómo interpretar los resultados",
      "Complementar con otras herramientas"
    ]
  },
  {
    id: 6,
    slug: "salidas-profesionales-tecnologia-2025",
    titulo: "Salidas profesionales en tecnología 2025",
    descripcion: "Las profesiones tecnológicas más demandadas y con mejor proyección de futuro en el mercado laboral actual.",
    autor: "Tech Careers Team",
    fechaPublicacion: "28 de Diciembre, 2024",
    tiempoLectura: "9 min",
    categoria: "profesional",
    tags: ["tecnología", "empleo", "futuro", "profesiones", "tendencias"],
    popular: true,
    imagen: "/images/articulos/salidas-tech.jpg",
    componente: "ArticuloSalidasTech", // Por crear
    resumen: "Análisis de las profesiones tecnológicas con mayor demanda, salarios competitivos y mejores perspectivas de crecimiento.",
    temas: [
      "Profesiones más demandadas",
      "Rangos salariales por especialidad",
      "Competencias técnicas requeridas",
      "Tendencias del mercado tecnológico"
    ]
  }
];

// Categorías disponibles para filtrado
export const categoriasArticulos = [
  { id: "todos", nombre: "Todos los artículos" },
  { id: "orientación", nombre: "Orientación vocacional" },
  { id: "formación", nombre: "Tipos de formación" },
  { id: "universidad", nombre: "Universidad" },
  { id: "fp", nombre: "Formación Profesional" },
  { id: "profesional", nombre: "Mundo profesional" }
];

// Utilidades para trabajar con artículos
export const getArticuloBySlug = (slug) => {
  return articulosConfig.find(articulo => articulo.slug === slug);
};

export const getArticulosByCategoria = (categoria) => {
  if (categoria === "todos") return articulosConfig;
  return articulosConfig.filter(articulo => articulo.categoria === categoria);
};

export const getArticulosPopulares = () => {
  return articulosConfig.filter(articulo => articulo.popular);
};

export const getArticulosRelacionados = (articuloActual, limite = 3) => {
  return articulosConfig
    .filter(articulo => 
      articulo.id !== articuloActual.id && 
      (articulo.categoria === articuloActual.categoria || 
       articulo.tags.some(tag => articuloActual.tags.includes(tag)))
    )
    .slice(0, limite);
};

export default articulosConfig;