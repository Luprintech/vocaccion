/**
 * empleo_sectores.js
 * ──────────────────────────────────────────────────────────────────────────
 * Datos de inserción laboral por sector vocacional.
 *
 * Fuente: QEDU — Ministerio de Ciencia, Innovación y Universidades
 *   https://www.ciencia.gob.es/qedu.html
 *
 * Métrica:
 *   - tasa_afiliacion  → % de titulados dados de alta en la SS a los 4 años
 *   - salario_medio    → base de cotización media anual (€), "Ambos sexos"
 *
 * Cálculo: promedio de los ámbitos ISCED asociados a cada sector VocAcción.
 * Fecha de extracción de datos: 2026-04-13 (convocatoria 2018-2022).
 */

export const EMPLEO_SECTORES = {
  'Tecnología e Informática': {
    tasa_afiliacion: 86.5,
    salario_medio: 36814,
    isced_refs: ['Informática (480)', 'Matemáticas y estadística (460)'],
  },
  'Ciencia e Investigación': {
    tasa_afiliacion: 78.9,
    salario_medio: 30916,
    isced_refs: [
      'Ciencias biológicas y bioquímica (420)',
      'Ciencias físicas, químicas y geológicas (440)',
      'Matemáticas y estadística (460)',
    ],
  },
  'Construcción, Arquitectura e Ingeniería': {
    tasa_afiliacion: 82.1,
    salario_medio: 34071,
    isced_refs: ['Ingeniería y profesiones afines (509)', 'Arquitectura y construcción (580)'],
  },
  'Salud y Bienestar': {
    tasa_afiliacion: 83.2,
    salario_medio: 37062,
    isced_refs: [
      'Medicina (especialidades clínicas) (721)',
      'Enfermería y cuidados (723)',
      'Salud (otras) (729)',
    ],
  },
  'Educación y Formación': {
    tasa_afiliacion: 79.0,
    salario_medio: 29402,
    isced_refs: [
      'Formación de docentes de educación infantil (143)',
      'Formación de docentes de enseñanza primaria (144)',
      'Educación (otros) (149)',
    ],
  },
  'Arte, Diseño y Creatividad': {
    tasa_afiliacion: 66.9,
    salario_medio: 26304,
    isced_refs: ['Bellas Artes (213)', 'Artes (otras) (219)'],
  },
  'Negocios, Finanzas y Derecho': {
    tasa_afiliacion: 73.7,
    salario_medio: 30784,
    isced_refs: [
      'Administración y dirección de empresas (345)',
      'Negocios (otros) (349)',
      'Derecho (380)',
    ],
  },
  'Comunicación y Medios': {
    tasa_afiliacion: 76.9,
    salario_medio: 26941,
    isced_refs: ['Periodismo e información (320)'],
  },
  'Servicios Sociales y Comunitarios': {
    tasa_afiliacion: 70.1,
    salario_medio: 29652,
    isced_refs: ['Psicología (311)', 'Ciencias sociales (otras) (319)'],
  },
  'Administración Pública y Gestión': {
    tasa_afiliacion: 77.7,
    salario_medio: 31616,
    isced_refs: [
      'Administración y dirección de empresas (345)',
      'Sociología y estudios culturales (314)',
    ],
  },
  'Agricultura, Medio Ambiente y Sostenibilidad': {
    tasa_afiliacion: 76.5,
    salario_medio: 28790,
    isced_refs: [
      'Agricultura, silvicultura y pesca (620)',
      'Veterinaria (640)',
      'Ciencias biológicas y bioquímica (420)',
    ],
  },
  'Industria y Manufactura': {
    tasa_afiliacion: 84.1,
    salario_medio: 35609,
    isced_refs: ['Ingeniería y profesiones afines (509)'],
  },
  'Logística y Transporte': {
    tasa_afiliacion: 78.0,
    salario_medio: 29803,
    isced_refs: [
      'Administración y dirección de empresas (345)',
      'Negocios (otros) (349)',
    ],
  },
  'Marketing y Ventas': {
    tasa_afiliacion: 78.0,
    salario_medio: 29803,
    isced_refs: [
      'Administración y dirección de empresas (345)',
      'Negocios (otros) (349)',
    ],
  },
  'Deporte y Actividad Física': {
    tasa_afiliacion: 78.4,
    salario_medio: 27892,
    isced_refs: ['Deportes (813)'],
  },
  'Turismo, Hostelería y Gastronomía': {
    tasa_afiliacion: 70.1,
    salario_medio: 26143,
    isced_refs: ['Servicios (otros) / Turismo y Hostelería (819)'],
  },
};

// ─── Lookup utility ───────────────────────────────────────────────────────────

/**
 * Normaliza una cadena para búsqueda flexible:
 * minúsculas, sin tildes, sin puntuación extra.
 */
function normaliza(str) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9 ]/g, '')
    .trim();
}

// Mapa interno con claves normalizadas
const MAPA_NORMALIZADO = Object.fromEntries(
  Object.entries(EMPLEO_SECTORES).map(([k, v]) => [normaliza(k), v])
);

/**
 * Devuelve los datos de empleo para el sector dado, o null si no se encuentra.
 *
 * @param {string} sectorStr  Nombre del sector (puede tener variaciones de tilde/capitalización)
 * @returns {{ tasa_afiliacion: number, salario_medio: number, isced_refs: string[] } | null}
 *
 * @example
 * getEmpleoBySector('Tecnología e Informática')
 * // → { tasa_afiliacion: 86.5, salario_medio: 36814, isced_refs: [...] }
 */
export function getEmpleoBySector(sectorStr) {
  if (!sectorStr) return null;

  const norm = normaliza(sectorStr);

  // 1. Coincidencia exacta
  if (MAPA_NORMALIZADO[norm]) return MAPA_NORMALIZADO[norm];

  // 2. El sector buscado está contenido en una clave conocida o viceversa
  for (const [key, val] of Object.entries(MAPA_NORMALIZADO)) {
    if (norm.includes(key) || key.includes(norm)) return val;
  }

  // 3. Coincidencia por palabra clave (primera palabra significativa del sector)
  const palabras = norm.split(' ').filter((p) => p.length > 4);
  for (const palabra of palabras) {
    for (const [key, val] of Object.entries(MAPA_NORMALIZADO)) {
      if (key.includes(palabra)) return val;
    }
  }

  return null;
}

/**
 * Formatea el salario para mostrar en UI.
 * Ej: 36814 → "36.814 €/año"
 */
export function formatSalario(salario) {
  return `${salario.toLocaleString('es-ES')} €/año`;
}

// ─── Lookup por título de profesión ──────────────────────────────────────────

/**
 * Palabras clave por sector para inferir el sector desde un título de profesión.
 * Usadas como fallback cuando no se dispone del campo `sector` directamente.
 */
const KEYWORDS_SECTOR = {
  'Tecnología e Informática': [
    'programador', 'desarrollador', 'software', 'informatico', 'informatica',
    'tecnologia', 'datos', 'ciberseguridad', 'inteligencia artificial',
    'machine learning', 'devops', 'frontend', 'backend', 'fullstack', 'sysadmin',
    'cloud', 'redes', 'telecomunicaciones', 'ia ',
  ],
  'Ciencia e Investigación': [
    'cientifico', 'investigador', 'biologo', 'bioquimico', 'quimico', 'fisico',
    'matematico', 'estadistico', 'laboratorio', 'geoloco', 'astronomo',
  ],
  'Construcción, Arquitectura e Ingeniería': [
    'ingeniero', 'arquitecto', 'construccion', 'obras', 'estructural',
    'civil', 'mecanico', 'electrico', 'electronico', 'telecomunicacion',
    'topografo',
  ],
  'Salud y Bienestar': [
    'medico', 'enfermero', 'enfermera', 'farmaceutico', 'fisioterapeuta',
    'psicologo', 'nutricionista', 'dentista', 'odontologo', 'sanitario',
    'terapeuta', 'salud', 'clinico', 'radiologia', 'optometrista',
  ],
  'Educación y Formación': [
    'maestro', 'profesor', 'docente', 'educador', 'pedagogia', 'formacion',
    'educacion', 'orientador',
  ],
  'Arte, Diseño y Creatividad': [
    'disenador', 'artista', 'fotografo', 'musico', 'actor', 'actriz',
    'diseño', 'creativo', 'animador', 'ilustrador', 'moda', 'grafismo',
    'audiovisual', 'cineasta', 'director de arte',
  ],
  'Negocios, Finanzas y Derecho': [
    'abogado', 'economista', 'financiero', 'contable', 'auditor', 'notario',
    'fiscal', 'asesor', 'derecho', 'juridico', 'finanzas', 'actuario',
    'controller',
  ],
  'Comunicación y Medios': [
    'periodista', 'comunicacion', 'periodismo', 'publicidad', 'relaciones publicas',
    'community manager', 'comunicador', 'redactor', 'locutor',
  ],
  'Servicios Sociales y Comunitarios': [
    'trabajador social', 'integracion social', 'animador sociocultural',
    'mediador', 'cooperacion', 'ong', 'desarrollo comunitario',
  ],
  'Administración Pública y Gestión': [
    'administrador', 'funcionario', 'gestor publico', 'secretario',
    'administrativo', 'tecnico de administracion',
  ],
  'Agricultura, Medio Ambiente y Sostenibilidad': [
    'agronomo', 'agricultor', 'forestal', 'medioambiental', 'ecologista',
    'veterinario', 'sostenibilidad', 'biologia marina', 'oceanografo',
  ],
  'Industria y Manufactura': [
    'tecnico industrial', 'produccion industrial', 'manufactura', 'soldador',
    'operario', 'electromecanico', 'mantenimiento industrial',
  ],
  'Logística y Transporte': [
    'logistico', 'transportista', 'supply chain', 'almacenista',
    'distribucion', 'compras', 'aprovisionamiento',
  ],
  'Marketing y Ventas': [
    'marketing', 'ventas', 'comercial', 'vendedor', 'seo', 'sem',
    'ecommerce', 'e-commerce', 'growth', 'brand',
  ],
  'Deporte y Actividad Física': [
    'deportista', 'entrenador', 'deporte', 'actividad fisica',
    'preparador fisico', 'monitor deportivo',
  ],
  'Turismo, Hostelería y Gastronomía': [
    'turismo', 'hosteleria', 'gastronomia', 'chef', 'cocinero', 'camarero',
    'hotelero', 'restauracion', 'sommelier', 'pastelero',
  ],
};

// Mapa normalizado de keywords por sector
const KEYWORDS_MAP = Object.fromEntries(
  Object.entries(KEYWORDS_SECTOR).map(([sector, kws]) => [
    sector,
    kws.map(normaliza),
  ])
);

/**
 * Devuelve los datos de empleo inferidos a partir del TÍTULO de la profesión.
 * Útil cuando no se dispone del campo `sector` directamente.
 *
 * @param {string} titulo  Título de la profesión (e.g. "Programador Full Stack")
 * @returns {{ tasa_afiliacion, salario_medio, isced_refs } | null}
 *
 * @example
 * getEmpleoByCareTitle('Ingeniero de Software')
 * // → datos de "Tecnología e Informática"
 */
export function getEmpleoByCareerTitle(titulo) {
  if (!titulo) return null;
  const normTitulo = normaliza(titulo);

  for (const [sector, keywords] of Object.entries(KEYWORDS_MAP)) {
    for (const kw of keywords) {
      if (normTitulo.includes(kw)) {
        return EMPLEO_SECTORES[sector] ?? null;
      }
    }
  }
  return null;
}
