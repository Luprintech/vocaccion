/**
 * InformeVocacional.jsx  (Página unificada – Dashboard + Resultados)
 * -------------------------------------------------------------------
 * Combina la lógica de carga de datos de ResultadosTest con el dashboard
 * visual de InformeVocacional en un solo archivo.
 *
 * - Carga resultados desde location.state o desde el backend (getUserResults)
 * - Parsea el markdown generado por Gemini a una estructura RIASEC detallada
 * - Renderiza el dashboard premium con TOC, radar chart, career cards, etc.
 * - Gestiona la selección de profesión objetivo (guardar/cambiar/eliminar)
 * - Incluye descarga PDF y secciones informativas
 */
import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  Zap, Briefcase, BookOpen, TrendingUp, Star,
  Download, UserCheck, Brain, Target, Lightbulb,
  ArrowRight, CheckCircle, GraduationCap, MapPin,
  Flame, Sparkles, Eye, Target as TargetIcon,
  ChevronRight, Check, RotateCcw
} from 'lucide-react';
import {
  getUserResults,
  getObjetivoProfesional,
  saveObjetivoProfesional,
  deleteObjetivoProfesional,
  generateImageForProfession
} from '../../api';
import { useToast } from '@/components/ToastProvider';
import PantallaEsperaResultados from '@/components/PantallaEsperaResultados';

// ─── Constants ────────────────────────────────────────────

const RIASEC_COLOURS = {
  R: { text: '#ea580c', bar: '#f97316', bg: '#fff7ed', border: '#ffedd5' },
  I: { text: '#2563eb', bar: '#3b82f6', bg: '#eff6ff', border: '#dbeafe' },
  A: { text: '#db2777', bar: '#ec4899', bg: '#fdf2f8', border: '#fce7f3' },
  S: { text: '#16a34a', bar: '#22c55e', bg: '#f0fdf4', border: '#dcfce7' },
  E: { text: '#9333ea', bar: '#a855f7', bg: '#faf5ff', border: '#f3e8ff' },
  C: { text: '#ca8a04', bar: '#eab308', bg: '#fefce8', border: '#fef08a' },
};
const RIASEC_LABELS = { R:'Realista', I:'Investigador', A:'Artístico', S:'Social', E:'Emprendedor', C:'Convencional' };

const SP_SLOTS = [
  { Icon: Brain,     accent: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' },
  { Icon: Zap,       accent: '#0284c7', bg: '#f0f9ff', border: '#bae6fd' },
  { Icon: Target,    accent: '#059669', bg: '#ecfdf5', border: '#a7f3d0' },
  { Icon: Flame,     accent: '#d97706', bg: '#fffbeb', border: '#fde68a' },
  { Icon: Lightbulb, accent: '#db2777', bg: '#fdf2f8', border: '#fbcfe8' },
];

const RIASEC_DETAILS = {
  R: {
    description: "Las personas realistas son prácticas, físicas y concretas. Prefieren trabajar con sus manos, usar herramientas, manejar maquinaria e interactuar con el entorno físico.",
    workStyle: "Práctico, orientado a la acción y centrado en resultados tangibles.",
    tasks: "Construir, reparar, operar equipos, trabajar al aire libre o con tecnología aplicada.",
    environment: "Talleres, obras, espacios al aire libre, plantas industriales o laboratorios técnicos.",
    strengths: "Habilidad motriz, sentido común, resolutividad mecánica y practicidad."
  },
  I: {
    description: "El perfil investigador se enfoca en comprender el mundo. Son personas curiosas, intelectuales y racionales a las que les fascina resolver problemas complejos.",
    workStyle: "Independiente, analítico, metódico y orientado al razonamiento.",
    tasks: "Diseñar experimentos, analizar datos, programar, investigar fuentes y resolver enigmas lógicos.",
    environment: "Laboratorios, centros de I+D, universidades, think tanks o startups innovadoras.",
    strengths: "Pensamiento crítico, lógica matemática, curiosidad intelectual y objetividad."
  },
  A: {
    description: "El perfil artístico valora la autoexpresión, la originalidad y la estética. Buscan entornos donde puedan crear, emocionar y romper con estructuras rígidas.",
    workStyle: "Flexible, intuitivo, no estructurado y altamente creativo.",
    tasks: "Diseñar, escribir, componer, actuar o idear conceptos visuales y narrativos.",
    environment: "Estudios creativos, agencias de diseño, compañías de cine, museos o startups de contenido.",
    strengths: "Innovación, sensibilidad estética, imaginación e inteligencia emocional."
  },
  S: {
    description: "Las personas sociales están orientadas hacia el bienestar de los demás. Encuentran propósito en educar, ayudar, curar o facilitar el desarrollo humano.",
    workStyle: "Colaborativo, empático, comunicativo y de apoyo mutuo.",
    tasks: "Enseñar, orientar, mediar en conflictos, cuidar a pacientes o liderar equipos humanos.",
    environment: "Colegios, hospitales, ONGs, centros de orientación o departamentos de Recursos Humanos.",
    strengths: "Empatía, escucha activa, comunicación interpersonal y paciencia."
  },
  E: {
    description: "Los emprendedores son persuasivos, ambiciosos y líderes naturales. Disfrutan tomando la iniciativa para iniciar proyectos y alcanzar objetivos estratégicos.",
    workStyle: "Dinámico, persuasivo, competitivo y orientado a metas.",
    tasks: "Vender, negociar, liderar equipos, tomar decisiones de riesgo y gestionar negocios.",
    environment: "Startups, empresas de ventas, departamentos directivos, consultoras o cualquier entorno de alto dinamismo.",
    strengths: "Liderazgo, persuasión, confianza en sí mismos y visión de negocio."
  },
  C: {
    description: "El perfil convencional es organizado, detallista y eficiente. Sobresalen en entornos estructurados donde la precisión y el manejo de información son clave.",
    workStyle: "Ordenado, metódico, predecible y altamente estructurado.",
    tasks: "Gestionar bases de datos, organizar archivos, realizar cálculos contables y seguir protocolos.",
    environment: "Oficinas administrativas, entidades financieras, administraciones públicas o departamentos de contabilidad.",
    strengths: "Atención al detalle, organización, eficiencia administrativa y confiabilidad."
  }
};

function compatColour(pct) {
  if (pct >= 88) return { bg: '#d1fae5', text: '#065f46', bar: '#10b981', label: 'Excelente match' };
  if (pct >= 74) return { bg: '#dbeafe', text: '#1e40af', bar: '#3b82f6', label: 'Alto match' };
  return              { bg: '#fef3c7', text: '#92400e', bar: '#f59e0b', label: 'Buen match' };
}

// ─── Markdown parser ───────────────────────────────────────

function parseMarkdown(md) {
  if (!md) return null;

  const result = {
    title: '', riasecScores: [], riasecCode: '', hollandExplicacion: '',
    hollandDimensions: {}, hollandIntro: '', hollandConclusion: '',
    psicologico: '', superpowers: [], careers: [],
    growthIntro: '', growthAreas: [], message: '',
  };

  const lines = md.split('\n');
  let cur = null;
  const sections = {};
  for (const line of lines) {
    if (line.startsWith('# ') && !line.startsWith('## ')) {
      result.title = line.replace(/^#\s*/, '').trim();
    } else if (line.startsWith('## ')) {
      cur = line.replace(/^##\s*/, '').trim().toLowerCase();
      sections[cur] = [];
    } else if (cur) {
      sections[cur].push(line);
    }
  }

  const sectionText = (key) => {
    const entry = Object.entries(sections).find(([k]) => k.includes(key));
    return entry ? entry[1].join('\n').trim() : '';
  };

  // 1. RIASEC
  const hollandText = sectionText('holland') || sectionText('análisis') || sectionText('codigo') || sectionText('analisis');
  const scoreMap = {};

  const scoreRegex = /([RIASEC])\s*\([^)]+\)[:\s]+(\d+)\s*pts[^(]*\((\d+(?:\.\d+)?)%\)/gi;
  let m;
  while ((m = scoreRegex.exec(hollandText)) !== null) {
    scoreMap[m[1].toUpperCase()] ??= { value: +m[2], pct: +m[3] };
  }

  const tableRowRx = /\|\s*([RIASEC])\s*\|[^|]*\|\s*(\d+)\s*\|\s*(\d+(?:\.\d+)?)%/gi;
  while ((m = tableRowRx.exec(hollandText)) !== null) {
    scoreMap[m[1].toUpperCase()] ??= { value: +m[2], pct: +m[3] };
  }

  const keywordPercentRx = /(Realista|Investigador|Art[íi]stico|Social|Emprendedor|Convencional)[^\d%]{0,30}?(\d+(?:\.\d+)?)\s*%/gi;
  const labelToDim = { 'realista':'R', 'investigador':'I', 'artístico':'A', 'artistico':'A', 'social':'S', 'emprendedor':'E', 'convencional':'C' };
  
  while ((m = keywordPercentRx.exec(hollandText)) !== null) {
    const dim = labelToDim[m[1].toLowerCase()];
    if (dim && !scoreMap[dim]) {
      scoreMap[dim] = { value: 0, pct: +m[2] };
    }
  }

  if (Object.keys(scoreMap).length > 0) {
    result.riasecScores = ['R','I','A','S','E','C'].map(d => ({
      dim: d, label: RIASEC_LABELS[d], value: scoreMap[d]?.value ?? 0, pct: scoreMap[d]?.pct ?? 0,
    }));
    result.riasecCode = [...result.riasecScores].sort((a, b) => b.pct - a.pct).filter(d => d.pct > 5).slice(0, 3).map(d => d.dim).join('');
  }
  
  const codePatterns = [
    /c[oó]digo\s*(?:holland)?[\s:.]*\*?\*?([RIASEC]{2,3})\b/i,
    /\*\*([RIASEC]{2,3})\*\*\s*(?:\([^)]+\))?/,
    /perfil\s+(?:dominante\s+)?[:\s]*\*?\*?([RIASEC]{2,3})\b/i,
    /tipo\s+(?:holland\s+)?[:\s]*\*?\*?([RIASEC]{2,3})\b/i,
    /\b([RIASEC]{2,3})\s*(?:\([A-Za-záéíóúÁÉÍÓÚ\-\s,]+\))/,
  ];
  let explicitCode = null;
  for (const rx of codePatterns) {
    const m2 = hollandText.match(rx);
    if (m2 && /^[RIASEC]{2,3}$/.test(m2[1])) {
      explicitCode = m2[1].toUpperCase();
      break;
    }
  }

  if (explicitCode) {
    result.riasecCode = explicitCode;
  } else if (Object.keys(scoreMap).length > 0) {
    const sorted = [...result.riasecScores].sort((a, b) => b.pct - a.pct).filter(d => d.pct > 0);
    const selected = [sorted[0]];
    for (let i = 1; i < sorted.length && i < 3; i++) {
      const gap = sorted[i - 1].pct - sorted[i].pct;
      if (sorted[i].pct < 12 || gap > 12) break;
      selected.push(sorted[i]);
    }
    result.riasecCode = selected.map(d => d.dim).join('');
  }

  result.hollandExplicacion = hollandText
    .split('\n')
    .filter(line => {
      if (scoreRegex.test(line) || tableRowRx.test(line) || keywordPercentRx.test(line)) return false;
      if (line.match(/^\s*\|.*\|.*\s*$/) || line.match(/\|\s*[:-]+\s*\|/)) return false;
      if (line.match(/A continuación.*(desglose|puntuaciones|tabla)/i)) return false;
      if (line.match(/Aqu[íi] tienes un resumen/i)) return false;
      if (line.includes('pts') || line.match(/\d+%\s*\|/)) return false;
      return true;
    })
    .join('\n')
    .replace(/^#+.*$/mg, '')
    .trim();

  const hollandParsed = parseHollandDimensions(result.hollandExplicacion);
  result.hollandDimensions = hollandParsed.dims;
  result.hollandIntro      = hollandParsed.intro;
  result.hollandConclusion = hollandParsed.conclusion;

  // Integrar párrafos narrativos del intro/conclusion dentro de cada dimensión
  const dimLabelMap = {
    'R': /\b(?:realista|manual)\b/i,
    'I': /\b(?:investigador|anal[ií]tic)/i,
    'A': /\b(?:art[ií]stic|creativ)/i,
    'S': /\b(?:social|humanist)/i,
    'E': /\b(?:emprendedor|l[ií]der)/i,
    'C': /\b(?:convencional|met[óo]dic)/i,
  };
  const narrativeSource = [result.hollandIntro, result.hollandConclusion].filter(Boolean).join('\n\n');
  if (narrativeSource) {
    const paragraphs = narrativeSource.split(/\n{2,}/).filter(p => p.trim());
    const generalParts = [];
    for (const para of paragraphs) {
      // Detectar si el párrafo es específico de una dimensión
      const isDimSpecific = /\b(?:dimensi[oó]n|rasgo|componente)\s+(?:del?\s+)?(?:tipo\s+)?/i.test(para);
      let matched = false;
      if (isDimSpecific) {
        for (const [dim, rx] of Object.entries(dimLabelMap)) {
          if (rx.test(para)) {
            if (!result.hollandDimensions[dim]) {
              result.hollandDimensions[dim] = { description: '', workStyle: null, tasks: null, environment: null, strengths: null };
            }
            // Prepend narrative description (richer than static) — preserve existing if any
            const existing = result.hollandDimensions[dim].description || '';
            result.hollandDimensions[dim].description = para.replace(/\*\*/g, '').trim() + (existing ? '\n\n' + existing : '');
            matched = true;
            break;
          }
        }
      }
      if (!matched) {
        generalParts.push(para);
      }
    }
    // Keep only the general (non-dimension-specific) text as intro
    result.hollandIntro = generalParts.join('\n\n').trim();
  }

  // 2. Retrato
  result.psicologico = sectionText('retrato') || sectionText('psicol') || sectionText('descripción');

  // 3. Superpowers
  const spText = sectionText('superpod') || sectionText('habilidades clave');
  if (spText) {
    const spBlocks = spText.split(/\n(?=^[ \t]*[-*\d]+\.?\s*\*\*(?!\s*(?:Por qu[ée]|C[óo]mo|Qu[ée] significa)))/im);
    
    result.superpowers = spBlocks.map((block, index) => {
      const nameMatch = block.match(/(?:^|\n)[ \t]*[-*\d]+\.?\s*\*\*([^*]+)\*\*/);
      if (!nameMatch) {
         if (index === 0) return null;
         return null;
      }
      
      const name = nameMatch[1].replace(/^[\d.]+\s*/, '').replace(/:$/, '').trim();
      const rest = block.replace(nameMatch[0], '').trim();

      const extractSub = (labelRegexStr) => {
        const rx = new RegExp(`(?:\\*?\\*?${labelRegexStr}\\*?\\*?\\s*:?)\\s*([\\s\\S]*?)(?=\\n[ \\t]*(?:[-*]|\\d+\\.)?\\s*\\*?\\*?(?:Por qu[ée]|C[óo]mo|Qu[ée] significa)\\b|$)`, 'i');
        const match = rest.match(rx);
        if (match && match[1]) {
          return match[1].replace(/^[ \t]*[-*][ \t]*/gm, '').replace(/\*\*/g, '').replace(/^[:\s]+/, '').trim();
        }
        return '';
      };

      let meaning = extractSub('Qué significa|Qué es|Definición') || '';
      let reason  = extractSub('Por qué lo tienes|Por qué la tienes|Por qué|Tienes esta|Por qué encaja') || '';
      let how     = extractSub('Cómo puedes potenciarla|Cómo potenciarla|Cómo potenciar|Cómo puedes potenciarlo|Aprovecha|Cómo desarrollarla') || '';

      if (!meaning && !reason && !how) {
        const sentences = rest.split(/(?<=[.!?])\s+/).filter(Boolean);
        const chunk = Math.max(1, Math.ceil(sentences.length / 3));
        meaning = sentences.slice(0, chunk).join(' ').replace(/\*\*/g, '');
        reason = sentences.slice(chunk, chunk * 2).join(' ').replace(/\*\*/g, '');
        how = sentences.slice(chunk * 2).join(' ').replace(/\*\*/g, '');
      }

      return { name, meaning, reason, how };
    }).filter(Boolean).slice(0, 5);
  }

  // 4. Careers
  const careerText = sectionText('caminos') || sectionText('profesion') || sectionText('top 3') || sectionText('recomendados');
  if (careerText) {
    const careerBlocks = careerText.split(/\n(?=###|\*\*[A-ZÁÉÍÓÚÜÑ])/);
    result.careers = careerBlocks.map(block => {
      const titleMatch = block.match(/###\s*(.+?)$|^\s*\d+\.\s*\*\*(.+?)\*\*|^\*\*(.+?)\*\*/m);
      if (!titleMatch) return null;
      const title = (titleMatch[1] || titleMatch[2] || titleMatch[3] || '').replace(/\*\*/g, '').trim();
      
      const cleanBlock = block.replace(/\*\*/g, '');
      const lineMatch = cleanBlock.match(/[Cc]ompatibilidad[^:]*:?\s*([^\n]+)/);
      let compat = 75;
      let compatDetails = '';

      if (lineMatch) {
        const line = lineMatch[1];
        const percMatch = line.match(/(\d+)\s*%/);
        if (percMatch) {
          compat = +percMatch[1];
          compatDetails = line.replace(new RegExp(`\\(?${compat}\\s*%\\)?`, 'gi'), '').trim();
          compatDetails = compatDetails.replace(/^[-\s:()]+|[-\s:()]+$/g, '').trim();
          if (compatDetails && !compatDetails.startsWith('(')) {
             compatDetails = `(${compatDetails})`;
          }
        }
      }

      const extractSub = (labels) => {
        const rx = new RegExp(`(?:\\*\\*|###)?\\s*(?:${labels})[^\\n:]*:?\\*?\\*?\\s*\\n?([\\s\\S]*?)(?=\\n[ \\t]*[-*]*\\s*\\*?\\*?(?:Por qu[ée] encaja|Salidas laborales|Formaci[óo]n recomendada|Primeros 3 pasos|Primeros pasos|Compatibilidad)(?:[\\s:]|$)|$)`, 'i');
        const match = block.match(rx);
        return match ? match[1].trim() : '';
      };

      const whyRaw = extractSub('Por qu[ée] encaja');
      const why = whyRaw.replace(/^[ \t]*[-*]\s*/gm, '').replace(/\*\*/g, '').trim();

      const salidasRaw = extractSub('Salidas laborales');
      const salidas = salidasRaw.split(/\n/)
        .map(l => l.replace(/^[ \t]*[-*]\s*/, '').replace(/\*\*/g, '').trim())
        .filter(l => l && l !== '*' && l !== '-');

      const formacionRaw = extractSub('Formaci[óo]n recomendada');
      const formacionLines = formacionRaw.split(/\n/)
        .map(l => l.replace(/^[ \t]*[-*]\s*/, '').replace(/\*\*/g, '').trim())
        .filter(l => l && l !== '*' && l !== '-');
      
      let formacion = formacionLines;
      if (formacionLines.length === 1 && formacionLines[0]) {
        const sentences = formacionLines[0].split(/(?<=[.!?])\s+/).filter(Boolean);
        if (sentences.length > 1) {
          formacion = sentences;
        }
      }

      const stepsRaw = extractSub('Primeros(?: 3)? pasos');
      const steps = stepsRaw.split(/\n/)
        .map(l => l.replace(/^[ \t]*(?:\d+\.|\*|-)\s*/, '').replace(/\*\*/g, '').trim())
        .filter(l => l && l !== '*' && l !== '-');

      return { title, compat, compatDetails, why, salidas, formacion, steps };
    }).filter(b => b && b.title).slice(0, 6);
  }

  // 5. Growth
  const growthText = sectionText('crecimiento') || sectionText('áreas de') || sectionText('areas de');
  if (growthText) {
    // Separate intro (text before first numbered area) from area blocks
    const firstAreaIdx = growthText.search(/\n\s*\d+\.\s*\*\*/);
    if (firstAreaIdx > 0) {
      result.growthIntro = growthText.slice(0, firstAreaIdx).replace(/\*\*/g, '').trim();
    }
    const areasText = firstAreaIdx > 0 ? growthText.slice(firstAreaIdx) : growthText;
    const areaBlocks = areasText.split(/\n(?=\s*\d+\.\s*\*\*)/).filter(b => b.trim());
    const parsed = areaBlocks.map(block => {
      const nameMatch = block.match(/\*\*([^*]+)\*\*/);
      const name = nameMatch ? nameMatch[1].replace(/^[\d.]+\s*/, '').replace(/:$/, '').trim() : '';
      const description = block.replace(/^\s*\d+\.\s*/, '').replace(/\*\*[^*]+\*\*/, '').replace(/^[:\s]+/, '').trim();
      return { title: name, description };
    }).filter(b => b.title && b.description);
    result.growthAreas = parsed.slice(0, 2);
  }

  // 6. Mentor
  result.message = sectionText('mensaje') || sectionText('mentor');
  return result;
}

// ─── Holland dimension text parser ───────────────────────

function parseHollandDimensions(text) {
  if (!text) return { dims: {}, intro: '', conclusion: '' };

  const KNOWN_LABELS = [
    { key: 'I', pattern: 'Investigador' },
    { key: 'R', pattern: 'Realista' },
    { key: 'A', pattern: 'Art[íi]stico' },
    { key: 'S', pattern: 'Social' },
    { key: 'E', pattern: 'Emprendedor' },
    { key: 'C', pattern: 'Convencional' },
  ];

  const dims = {};
  const cleanText = text.replace(/\*\*/g, '');

  // Build a single regex alternative that matches any dimension header
  // Gemini formats:  * I (Investigador/Analítico):  |  * Investigador (I):  |  * Investigador:
  const dimNamesGroup = KNOWN_LABELS.map(l => l.pattern).join('|');
  const dimHeaderSrc =
    `\\s*[*\\-]?\\s*(?:` +
    `[RIASEC]\\s*\\((?:${dimNamesGroup})[^)]*\\)` +
    `|(?:${dimNamesGroup})\\s*(?:\\([RIASEC]\\))?` +
    `)\\s*[:\\-\\.]`;
  const dimHeaderRxG = new RegExp(`(?:^|\\n)${dimHeaderSrc}`, 'gi');

  // 1) Find ALL dimension header positions so we can extract trailing conclusion
  const allHeaders = [];
  let hm;
  while ((hm = dimHeaderRxG.exec(cleanText)) !== null) {
    allHeaders.push({ index: hm.index, length: hm[0].length });
  }

  if (allHeaders.length === 0) {
    return { dims: {}, intro: cleanText.trim(), conclusion: '' };
  }

  // intro = everything before first dimension header
  const intro = cleanText.substring(0, allHeaders[0].index).trim();

  // conclusion = everything after the block of the LAST dimension header
  //   We find the last header and grab its textAfter, then strip its block content.
  let conclusion = '';

  // 2) Parse each dimension
  KNOWN_LABELS.forEach(({key, pattern}) => {
    const startRx = new RegExp(
      `(?:^|\\n)\\s*[*\\-]?\\s*(?:` +
      `${key}\\s*\\(${pattern}[^)]*\\)` +
      `|${pattern}\\s*(?:\\(${key}\\))?` +
      `)\\s*[:\\-\\.]`,
      'i'
    );
    const startMatch = cleanText.match(startRx);
    if (!startMatch) return;

    let textAfter = cleanText.substring(startMatch.index + startMatch[0].length);

    const otherKeys = KNOWN_LABELS.filter(l => l.key !== key);
    const otherAlts = otherKeys.map(l =>
      `${l.key}\\s*\\(${l.pattern}[^)]*\\)|${l.pattern}\\s*(?:\\(${l.key}\\))?`
    ).join('|');
    const cutRx = new RegExp(`(?:^|\\n)\\s*[*\\-]?\\s*(?:${otherAlts})\\s*[:\\-\\.]`, 'i');
    const cutMatch = textAfter.match(cutRx);

    let blockText = cutMatch
      ? textAfter.substring(0, cutMatch.index)
      : textAfter;

    // Sub-field extraction
    const ALL_FIELDS = 'Estilo de trabajo[^:]*|Tipo de tareas[^:]*|Tipo de actividades[^:]*|Entorno laboral[^:]*|Entorno ideal[^:]*|Fortalezas naturales[^:]*|Fortalezas[^:]*';

    const extractField = (labels) => {
      const rx = new RegExp(
        `(?:${labels})[^:]*:\\s*([\\s\\S]*?)(?=\\s*\\*\\s*(?:${ALL_FIELDS}):|$)`,
        'i'
      );
      const m = blockText.match(rx);
      return m ? m[1].replace(/\*\*/g, '').replace(/^\s+|\s+$/g, '').trim() || null : null;
    };

    const workStyle   = extractField('Estilo de trabajo');
    const tasks       = extractField('Tipo de tareas|Tipo de actividades');
    const environment = extractField('Entorno laboral|Entorno ideal');
    const strengths   = extractField('Fortalezas naturales|Fortalezas');

    // Description = everything before first field marker
    const firstFieldRx = new RegExp(`\\s*\\*\\s*(?:${ALL_FIELDS}):`, 'i');
    const firstFieldMatch = blockText.match(firstFieldRx);
    const descRaw = firstFieldMatch ? blockText.substring(0, firstFieldMatch.index) : blockText;
    const description = descRaw.replace(/^[*\s]+|[*\s]+$/g, '').trim();

    dims[key] = { description, workStyle, tasks, environment, strengths };
  });

  // 3) Extract conclusion: text AFTER the last dimension's block
  //    Find how far the last dimension extends (up to last field like Fortalezas)
  const lastH = allHeaders[allHeaders.length - 1];
  const textAfterLastDim = cleanText.substring(lastH.index + lastH.length);

  // The dimension's content ends where its sub-fields end.
  // Look for any paragraph that doesn't start with * (field marker) and isn't a field label.
  const fieldLabelsRx = /Estilo de trabajo|Tipo de tareas|Tipo de actividades|Entorno laboral|Entorno ideal|Fortalezas/i;
  const paragraphs = textAfterLastDim.split(/\n\s*\n/);
  const conclusionParts = [];
  let insideDimFields = true;

  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (!trimmed) continue;

    // If it looks like a dimension field, we're still inside the last dim's content
    if (insideDimFields && (trimmed.match(/^\s*\*\s*/) || fieldLabelsRx.test(trimmed))) {
      continue;
    }

    // Once we hit a paragraph that doesn't look like a field, everything after is conclusion
    insideDimFields = false;
    // Skip filler lines like "Aquí tienes un resumen..."
    if (trimmed.match(/Aqu[íi] tienes un resumen/i)) continue;
    conclusionParts.push(trimmed);
  }

  conclusion = conclusionParts.join('\n\n').trim();

  const cleanFinale = (t) => t.replace(/^#+.*$/mg, '').trim();
  return { dims, intro: cleanFinale(intro), conclusion: cleanFinale(conclusion) };
}

// ─── Helpers ──────────────────────────────────────────────

function clean(s = '') {
  return s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/\n/g, ' ').trim();
}

function highlightPortrait(text) {
  let html = clean(text);
  
  const matchBolds = html.match(/<strong>/g);
  if (matchBolds && matchBolds.length > 3) {
    return html.replace(/<strong>/g, '<strong class="text-gray-900 font-extrabold">');
  }

  const keywords = [
    'Realista', 'Investigador', 'Art[íi]stico', 'Social', 'Emprendedor', 'Convencional',
    'mente', 'curiosidad', 'dinamismo', 'estrategia', 'estrat[ée]gic[oa]', 'liderazgo',
    'análisis', 'anal[íi]tic[oa]', 'impacto', 'autonom[íi]a', 'innovador', 'innovaci[óo]n',
    'proyectos', 'comunicaci[óo]n', 'empat[íi]a', 'visi[óo]n', 'creativ[oa]', 'creatividad',
    'l[óo]gica', 'resoluci[óo]n', 'eficiencia', 'planificaci[óo]n', 'datos'
  ];

  keywords.forEach(kw => {
    const rx = new RegExp(`(?<!<[^>]*)(\\b${kw}\\b)(?![^<]*>)`, 'gi');
    html = html.replace(rx, '<strong class="text-gray-900 font-extrabold">$1</strong>');
  });

  return html;
}

// ─── Document Components ──────────────────────────────────

function DocSection({ id, title, icon: Icon, children }) {
  return (
    <section id={id} className="scroll-mt-24 mb-20">
      <div className="flex items-center gap-3 mb-8 border-b border-gray-100 pb-4">
        {Icon && <Icon className="w-6 h-6 text-purple-600" />}
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">{title}</h2>
      </div>
      <div className="text-gray-700 leading-relaxed space-y-6">
        {children}
      </div>
    </section>
  );
}

function RiasecRadar({ scores }) {
  if (!scores?.length) return null;
  const data = scores.map(s => ({ shortLabel: s.dim, value: s.pct, fullMark: 100 }));

  return (
    <div className="flex flex-col md:flex-row gap-12 items-center bg-gray-50/50 rounded-2xl p-8 border border-gray-100">
      <div className="w-full md:w-[350px] h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
            <PolarGrid stroke="#e5e7eb" />
            <PolarAngleAxis dataKey="shortLabel" tick={{ fill: '#6b7280', fontSize: 13, fontWeight: 700 }} />
            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
            <Radar name="Perfil" dataKey="value" stroke="#7c3aed" fill="#7c3aed" fillOpacity={0.15} strokeWidth={2.5} />
            <Tooltip formatter={v => [`${(+v).toFixed(1)}%`, 'Puntuación']}
              contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
      <div className="flex-1 w-full flex flex-col gap-4">
        {scores.map(s => {
          const col = RIASEC_COLOURS[s.dim];
          return (
            <div key={s.dim} className="flex items-center gap-4">
              <span className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0"
                    style={{ background: col.bg, color: col.text, border: `1px solid ${col.border}` }}>
                {s.dim}
              </span>
              <div className="flex-1">
                <div className="flex justify-between items-end mb-1.5">
                  <span className="text-sm font-semibold text-gray-700">{s.label}</span>
                  <span className="text-sm font-bold" style={{ color: col.text }}>{s.pct.toFixed(1)}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${s.pct}%`, backgroundColor: col.bar }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function HollandDimensionCard({ score, dynamicDetails }) {
  const { dim, label, pct } = score;
  const col = RIASEC_COLOURS[dim];
  const staticDet = RIASEC_DETAILS[dim] || {};
  const dyn = dynamicDetails || {};

  const description  = dyn.description  || staticDet.description  || '';
  const workStyle    = dyn.workStyle    || staticDet.workStyle    || '';
  const tasks        = dyn.tasks        || staticDet.tasks        || '';
  const environment  = dyn.environment  || staticDet.environment  || '';
  const strengths    = dyn.strengths    || staticDet.strengths    || '';

  const subBlocks = [
    { icon: <Zap size={15} />,        iconColor: '#ca8a04', label: 'Estilo de trabajo',    text: workStyle   },
    { icon: <TargetIcon size={15} />, iconColor: '#059669', label: 'Tareas que disfruta',  text: tasks       },
    { icon: <MapPin size={15} />,     iconColor: '#2563eb', label: 'Entorno laboral ideal', text: environment },
    { icon: <Sparkles size={15} />,   iconColor: '#7c3aed', label: 'Fortalezas naturales', text: strengths   },
  ].filter(b => b.text);

  const halfLen = Math.ceil(subBlocks.length / 2);
  const leftBlocks  = subBlocks.slice(0, halfLen);
  const rightBlocks = subBlocks.slice(halfLen);

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: col.bar }} />
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 md:px-8 pt-8 pb-6">
        <div className="flex items-center gap-4">
          <span
            className="w-12 h-12 rounded-xl flex items-center justify-center text-xl font-black shadow-sm flex-shrink-0"
            style={{ background: col.bg, color: col.text, border: `1.5px solid ${col.border}` }}
          >
            {dim}
          </span>
          <div>
            <h4 className="text-2xl font-extrabold text-gray-900 m-0 leading-tight tracking-tight">
              {label} ({dim})
            </h4>
          </div>
        </div>
        <div
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg font-extrabold text-base flex-shrink-0"
          style={{ background: col.bg, color: col.text, border: `1px solid ${col.border}` }}
        >
          {pct.toFixed(1)}%
        </div>
      </div>

      {description && (
        <p className="px-6 md:px-8 pb-6 text-base text-gray-700 leading-relaxed text-justify">
          {description}
        </p>
      )}

      {subBlocks.length > 0 && (
        <div
          className="px-6 md:px-8 pb-8 grid grid-cols-1 md:grid-cols-2 gap-4"
          style={{ borderTop: '1px solid #f1f5f9' }}
        >
          {[leftBlocks, rightBlocks].map((col2, ci) =>
            col2.map((block, bi) => (
              <div
                key={`${ci}-${bi}`}
                className="mt-4 rounded-xl p-5 border border-slate-100 bg-slate-50 flex flex-col gap-2"
              >
                <h5 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 m-0">
                  <span style={{ color: block.iconColor }}>{block.icon}</span>
                  {block.label}
                </h5>
                <p className="text-sm text-slate-800 leading-relaxed m-0 text-justify">
                  {block.text}
                </p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function SuperpowerBlock({ power, index }) {
  const slot = SP_SLOTS[index % SP_SLOTS.length];
  const { Icon } = slot;

  return (
    <div className="border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-sm mb-6">
      <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-4" style={{ backgroundColor: slot.bg }}>
        <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-white shadow-sm" style={{ border: `1px solid ${slot.border}` }}>
          <Icon size={20} color={slot.accent} />
        </div>
        <h3 className="text-lg font-bold text-gray-900 m-0">{power.name}</h3>
      </div>
      <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
        <div className="space-y-3">
          <h4 className="text-sm font-bold uppercase tracking-wider mb-3 flex items-center gap-2" style={{ color: slot.accent }}>
            <TargetIcon size={16} /> Por qué lo tienes
          </h4>
          <p className="text-base text-gray-700 leading-relaxed text-justify" dangerouslySetInnerHTML={{ __html: clean(power.reason) }} />
        </div>
        <div className="space-y-3">
          <h4 className="text-sm font-bold uppercase tracking-wider text-emerald-600 mb-3 flex items-center gap-2">
            <TrendingUp size={16} /> Cómo potenciarlo
          </h4>
          <p className="text-base text-gray-700 leading-relaxed text-justify" dangerouslySetInnerHTML={{ __html: clean(power.how) }} />
        </div>
      </div>
    </div>
  );
}

function CareerBlock({ career, rank, isSelected, isActionLoading, onSelect, onClearSelection }) {
  const col = compatColour(career.compat);
  const navigate = useNavigate();
  const [careerImage, setCareerImage] = React.useState(null);
  const [imageLoading, setImageLoading] = React.useState(true);

  React.useEffect(() => {
    let mounted = true;
    const cacheKey = `career_image_v2_${career.title.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`;

    const fetchImage = async () => {
      try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          if (mounted) {
            setCareerImage(cached);
            setImageLoading(false);
          }
          return;
        }

        const data = await generateImageForProfession({ profesion: career.title });
        const imageUrl = data?.imagenUrl || null;
        if (imageUrl) {
          localStorage.setItem(cacheKey, imageUrl);
          if (mounted) {
            setCareerImage(imageUrl);
          }
        }
      } catch (err) {
        console.error('Error fetching career image:', err);
      } finally {
        if (mounted) {
          setImageLoading(false);
        }
      }
    };

    fetchImage();
    return () => {
      mounted = false;
    };
  }, [career.title]);

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-8 mb-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2 block">
            Opción recomendada #{rank}
          </span>
          <h3 className="text-2xl font-extrabold text-gray-900 m-0 leading-tight">
            {career.title}
          </h3>
        </div>
        <div className="flex flex-col items-end flex-shrink-0 md:max-w-xs text-right">
          <span className="px-3 py-1 rounded-full text-xs font-bold mb-2 inline-flex"
                style={{ background: col.bg, color: col.text }}>
            {career.compat}% · {col.label}
          </span>
          <div className="w-32 h-1.5 bg-gray-100 rounded-full overflow-hidden mb-2">
            <div className="h-full rounded-full" style={{ width: `${career.compat}%`, backgroundColor: col.bar }} />
          </div>
          {career.compatDetails && (
            <p className="text-xs text-gray-500 leading-tight">
              {career.compatDetails}
            </p>
          )}
        </div>
      </div>

      {/* Imagen representativa */}
      {careerImage && (
        <div className="mb-8 rounded-xl overflow-hidden border border-gray-100 h-64 bg-gray-100">
          <img
            src={careerImage}
            alt={career.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.src = '/images/default-profession.jpg';
            }}
          />
        </div>
      )}
      {imageLoading && (
        <div className="mb-8 rounded-xl overflow-hidden border border-gray-100 h-64 bg-gradient-to-r from-gray-100 to-gray-200 animate-pulse" />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 text-justify">

        {/* Columna Izquierda: Por qué encaja + Salidas */}
        <div className="space-y-8">
          {career.why && (
            <div>
              <h4 className="flex items-center gap-2 text-sm font-bold text-gray-900 mb-3 border-b border-gray-100 pb-2">
                <CheckCircle className="w-5 h-5 text-purple-600" />
                Por qué encaja con tu perfil
              </h4>
              <p className="text-base text-gray-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: clean(career.why) }} />
            </div>
          )}

          {career.salidas?.length > 0 && (
            <div>
              <h4 className="flex items-center gap-2 text-sm font-bold text-gray-900 mb-3 border-b border-gray-100 pb-2">
                <Briefcase className="w-5 h-5 text-emerald-600" />
                Salidas Laborales Reales
              </h4>
              <ul className="space-y-3 m-0 p-0 list-none text-base text-gray-700 leading-relaxed">
                {career.salidas.map((s, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="text-emerald-500 mt-0.5 font-bold text-lg">•</span>
                    <span dangerouslySetInnerHTML={{ __html: clean(s) }} />
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="pt-2">
            {!isSelected ? (
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={() => onSelect(career, careerImage)}
                  disabled={isActionLoading}
                  className="inline-flex items-center justify-center gap-2 min-w-[220px] px-7 py-3.5 rounded-xl bg-purple-600 text-white text-base font-bold hover:bg-purple-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors shadow-lg"
                >
                  {isActionLoading ? 'Guardando...' : 'Elegir profesión'}
                </button>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row justify-center gap-3">
                <button
                  type="button"
                  onClick={() => navigate('/mi-profesion')}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-green-500 text-white text-sm font-semibold hover:bg-green-600 transition-colors shadow"
                >
                  <Check size={16} /> Ir a Mi Profesión
                </button>
                <button
                  type="button"
                  onClick={onClearSelection}
                  disabled={isActionLoading}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-300 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                >
                  <RotateCcw size={16} /> Cambiar
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Columna Derecha: Formación + Primeros Pasos */}
        <div className="space-y-8">
          {career.formacion && (
            <div>
              <h4 className="flex items-center gap-2 text-sm font-bold text-gray-900 mb-3 border-b border-gray-100 pb-2">
                <GraduationCap className="w-5 h-5 text-blue-600" />
                Formación Recomendada
              </h4>
              {Array.isArray(career.formacion) ? (
                <ul className="space-y-3 m-0 p-0 list-none text-base text-gray-700 leading-relaxed">
                  {career.formacion.map((f, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <span className="text-blue-500 mt-0.5 font-bold text-lg">•</span>
                      <span dangerouslySetInnerHTML={{ __html: clean(f) }} />
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-base text-gray-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: clean(career.formacion) }} />
              )}
            </div>
          )}

          {career.steps?.length > 0 && (
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
              <h4 className="flex items-center gap-2 text-sm font-bold text-slate-900 mb-5">
                <ArrowRight className="w-5 h-5 text-slate-700" />
                Primeros Pasos de Acción
              </h4>
              <div className="space-y-4">
                {career.steps.map((step, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-md bg-white border border-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center flex-shrink-0 shadow-sm mt-0.5">
                      {i + 1}
                    </span>
                    <p className="text-base text-slate-800 leading-relaxed m-0" dangerouslySetInnerHTML={{ __html: clean(step) }} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function GrowthBlock({ area, index }) {
  const colours = [
    { bg: '#fffbeb', border: '#fde68a', text: '#92400e', icon: '#d97706', accent: '#fef3c7' },
    { bg: '#eef2ff', border: '#c7d2fe', text: '#3730a3', icon: '#4f46e5', accent: '#e0e7ff' }
  ];
  const slot = colours[index % colours.length];

  return (
    <div className="rounded-2xl p-6 md:p-8" style={{ backgroundColor: slot.bg, border: `1px solid ${slot.border}` }}>
      <h3 className="text-lg font-bold mb-4 flex items-center gap-3" style={{ color: slot.text }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white" style={{ border: `1px solid ${slot.border}` }}>
          <TrendingUp size={16} color={slot.icon} />
        </div>
        {area.title}
      </h3>
      <p className="text-sm leading-relaxed m-0" style={{ color: slot.text }} dangerouslySetInnerHTML={{ __html: clean(area.description || '') }} />
    </div>
  );
}

// ─── TOC (Table of Contents) Component ────────────────────

function TableOfContents() {
  const [activeId, setActiveId] = useState('');

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setActiveId(entry.target.id);
        }
      });
    }, { rootMargin: '-20% 0px -60% 0px' });

    document.querySelectorAll('section[id]').forEach(s => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  const links = [
    { id: 'riasec', label: '1. Modelo Holland RIASEC' },
    { id: 'portrait', label: '2. Retrato Psicológico' },
    { id: 'superpowers', label: '3. Superpoderes Clave' },
    { id: 'careers', label: '4. Caminos Profesionales Recomendados' },
    { id: 'growth', label: '5. Áreas de Crecimiento' },
    { id: 'message', label: '6. Mensaje del Mentor' },
  ];

  const handleClick = (e, id) => {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <nav className="sticky top-8 overflow-y-auto max-h-[calc(100vh-4rem)] pr-4 font-medium">
      <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-6 pl-3">
        Índice del Informe
      </h3>
      <ul className="space-y-1 relative before:content-[''] before:absolute before:left-0 before:top-0 before:bottom-0 before:w-px before:bg-gray-200">
        {links.map((link) => {
          const isActive = activeId === link.id;
          return (
            <li key={link.id} className="relative">
              {isActive && (
                <div className="absolute left-[-1px] top-0 bottom-0 w-0.5 bg-purple-600 rounded-r-full" />
              )}
              <a
                href={`#${link.id}`}
                onClick={(e) => handleClick(e, link.id)}
                className={`block py-2 pl-4 pr-2 text-sm transition-colors ${
                  isActive ? 'text-purple-700 font-bold bg-purple-50/50 rounded-r-lg' : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                {link.label}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

// ─── PDF Download helper ──────────────────────────────────

function generatePdfDownload(text, showToast) {
  if (!text || text === 'Respuesta truncada.') {
    showToast('error', 'El informe aún no está disponible. Intenta actualizar la página.');
    return;
  }

  const mdToHtml = (md) => {
    return md
      .replace(/^# (.+)$/gm, '<h1>$1</h1>')
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/^- (.+)$/gm, '<li>$1</li>')
      .replace(/(<li>.*<\/li>\n?)+/gs, '<ul>$&</ul>')
      .replace(/^\|(.+)\|$/gm, (match) => {
        const cells = match.split('|').filter(c => c.trim());
        return '<tr>' + cells.map(c => `<td>${c.trim()}</td>`).join('') + '</tr>';
      })
      .replace(/(<tr>.*<\/tr>\n?)+/gs, '<table>$&</table>')
      .replace(/^(?!<[hulist]).+$/gm, (line) => line.trim() ? `<p>${line}</p>` : '')
      .replace(/<\/ul>\n<ul>/g, '');
  };

  const htmlContent = mdToHtml(text);
  const fecha = new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });

  const printWindow = window.open('', '_blank', 'width=900,height=700');
  if (!printWindow) {
    showToast('error', 'El navegador bloqueó la ventana emergente. Permite las ventanas emergentes e inténtalo de nuevo.');
    return;
  }

  printWindow.document.write(`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Informe Vocacional – VocAcción</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700;800&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', sans-serif; color: #1a1a2e; background: #ffffff; padding: 48px; max-width: 820px; margin: 0 auto; font-size: 14px; line-height: 1.7; }
    .pdf-header { display: flex; align-items: center; justify-content: space-between; border-bottom: 3px solid #7c3aed; padding-bottom: 20px; margin-bottom: 32px; }
    .logo-brand { font-size: 24px; font-weight: 800; background: linear-gradient(135deg, #7c3aed, #16a34a); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .pdf-meta { font-size: 12px; color: #6b7280; text-align: right; line-height: 1.5; }
    h1 { font-size: 22px; font-weight: 800; color: #7c3aed; margin: 28px 0 12px; padding-bottom: 6px; border-bottom: 2px solid #ede9fe; }
    h2 { font-size: 17px; font-weight: 700; color: #5b21b6; margin: 22px 0 10px; }
    h3 { font-size: 15px; font-weight: 600; color: #374151; margin: 16px 0 8px; }
    p { margin-bottom: 10px; color: #374151; }
    ul { margin: 8px 0 12px 20px; color: #374151; }
    li { margin-bottom: 5px; }
    strong { color: #1f2937; font-weight: 700; }
    table { width: 100%; border-collapse: collapse; margin: 14px 0; font-size: 13px; }
    td, th { border: 1px solid #e5e7eb; padding: 8px 12px; text-align: left; }
    tr:nth-child(even) td { background: #f9fafb; }
    tr:first-child td { background: #ede9fe; font-weight: 600; }
    .pdf-footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 11px; color: #9ca3af; }
    .print-btn { position: fixed; bottom: 24px; right: 24px; background: linear-gradient(135deg, #7c3aed, #16a34a); color: white; border: none; padding: 12px 24px; border-radius: 50px; font-size: 14px; font-weight: 600; cursor: pointer; box-shadow: 0 4px 20px rgba(124,58,237,0.4); z-index: 100; }
    .print-btn:hover { opacity: 0.9; transform: scale(1.02); }
    @media print { .print-btn { display: none !important; } body { padding: 20px; font-size: 12px; } h1 { font-size: 18px; } h2 { font-size: 15px; } }
  </style>
</head>
<body>
  <div class="pdf-header">
    <div>
      <div class="logo-brand">VocAcción</div>
      <div style="font-size:12px;color:#6b7280;margin-top:4px;">Tu futuro profesional</div>
    </div>
    <div class="pdf-meta">
      <div><strong>Informe Vocacional RIASEC</strong></div>
      <div>Generado el ${fecha}</div>
      <div>Confidencial – Uso personal</div>
    </div>
  </div>
  <div class="report-content">${htmlContent}</div>
  <div class="pdf-footer">© ${new Date().getFullYear()} VocAcción · Tu orientador vocacional con Inteligencia Artificial · informe generado automáticamente con tecnología Gemini AI</div>
  <button class="print-btn" onclick="window.print()">🖨️ Guardar como PDF</button>
  <script>setTimeout(() => window.print(), 800);</script>
</body>
</html>`);

  printWindow.document.close();
}

// ─── Dashboard Report (internal component) ────────────────

function ReportDashboard({ report, informeMarkdown, selectedCareerTitle, careerActionLoading, handleSelectCareer, handleClearCareerSelection, onDownload }) {

  if (!informeMarkdown) return null;

  const hasStructure = report && (
    report.riasecScores.length > 0 || report.superpowers.length > 0 || report.careers.length > 0
  );

  // Fallback simple view
  if (!hasStructure) {
    return (
      <div className="w-full max-w-4xl mx-auto prose prose-purple bg-white p-8 md:p-12 rounded-2xl shadow-sm border border-gray-200">
        <div dangerouslySetInnerHTML={{ __html: informeMarkdown.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>') }} />
      </div>
    );
  }

  return (
    <div className="w-full bg-white rounded-3xl shadow-xl shadow-purple-900/5 ring-1 ring-gray-200 font-sans">
      
      {/* ── Big Hero Header ── */}
      <div className="bg-gray-900 text-white rounded-t-3xl px-8 md:px-16 py-12 md:py-16 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-purple-600/20 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-emerald-600/20 blur-3xl pointer-events-none" />
        
        <div className="relative z-10 max-w-7xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white/90 text-xs font-bold uppercase tracking-wider mb-6 border border-white/20">
              <Star size={14} className="text-yellow-400" /> Assessment VocAcción
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 leading-tight">
              {report?.title || 'Reporte de Orientación Profesional'}
            </h1>
            {report?.riasecCode && (
              <div className="flex items-center gap-3 mt-2">
                <span className="text-sm font-medium text-white/70">Perfil dominante identificado:</span>
                <span
                  className="px-4 py-1.5 rounded-lg text-base font-black tracking-widest shadow-lg"
                  style={{
                    background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
                    color: '#fff',
                    boxShadow: '0 0 0 1px rgba(255,255,255,0.15), 0 4px 12px rgba(124,58,237,0.5)',
                  }}
                >
                  {report.riasecCode}
                </span>
              </div>
            )}
          </div>
          {onDownload && (
            <button
              onClick={onDownload}
              className="inline-flex items-center gap-2 bg-white text-gray-900 hover:bg-gray-50 px-6 py-3 rounded-xl text-sm font-bold shadow-lg shadow-black/20 transition-all border border-gray-100 flex-shrink-0"
            >
              <Download size={18} className="text-purple-600" />
              Descargar PDF
            </button>
          )}
        </div>
      </div>

      {/* ── Dashboard Layout Body ── */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-0 md:gap-12 relative px-4 md:px-8 py-12 bg-white">
        
        {/* Left Sidebar (Desktop Only) */}
        <div className="hidden md:block w-64 flex-shrink-0">
          <TableOfContents />
        </div>

        {/* Right Content Area */}
        <div className="flex-1 min-w-0">
          <div className="max-w-4xl mr-auto">
            
            <DocSection id="riasec" title="1. Análisis de tu Código Holland" icon={UserCheck}>

              {report.hollandIntro ? (
                <div className="text-base text-gray-700 leading-relaxed space-y-3 mb-8 text-justify">
                  {report.hollandIntro.split(/\n{2,}/).filter(Boolean).map((p, i) => (
                    <p key={i} className="text-justify" dangerouslySetInnerHTML={{ __html: clean(p) }} />
                  ))}
                </div>
              ) : (
                <p className="text-base text-gray-600 mb-8 text-justify">
                  El modelo Holland clasifica tu personalidad en 6 dimensiones (RIASEC). A continuación se muestran las dimensiones relevantes de tu perfil.
                </p>
              )}

              {report.riasecScores?.length > 0 && (() => {
                const sorted = [...report.riasecScores].sort((a, b) => b.pct - a.pct);
                const dominantDims = new Set(report.riasecCode?.split('') ?? []);
                const dominant  = sorted.filter(s => dominantDims.has(s.dim) && s.pct > 0);
                const secondary = sorted.filter(s => !dominantDims.has(s.dim) && s.pct > 5);

                return (
                  <div className="mt-10 space-y-10">

                    {dominant.length > 0 && (
                      <div>
                        <div className="flex items-center gap-3 mb-6 border-t border-gray-100 pt-8">
                          <span
                            className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-white"
                            style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)' }}
                          >
                            Dimensiones Dominantes
                          </span>
                          <span className="text-xs text-gray-400">Tu núcleo de personalidad vocacional</span>
                        </div>
                        <div className="space-y-6">
                          {dominant.map(score => (
                            <HollandDimensionCard
                              key={score.dim}
                              score={score}
                              dynamicDetails={report.hollandDimensions?.[score.dim]}
                              featured
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {secondary.length > 0 && (
                      <div>
                        <div className="flex items-center gap-3 mb-6 pt-4">
                          <div className="flex-1 h-px bg-gray-100" />
                          <span className="px-3 py-1 rounded-full text-xs font-semibold text-gray-500 bg-gray-100 uppercase tracking-wider whitespace-nowrap">
                            Dimensiones Complementarias
                          </span>
                          <div className="flex-1 h-px bg-gray-100" />
                        </div>
                        <div className="space-y-4">
                          {secondary.map(score => (
                            <HollandDimensionCard
                              key={score.dim}
                              score={score}
                              dynamicDetails={report.hollandDimensions?.[score.dim]}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Radar chart */}
                    <div className="pt-6">
                      <h3 className="text-lg font-bold text-gray-900 mb-4">
                        Gráfico de tu Perfil
                      </h3>
                      <RiasecRadar scores={report.riasecScores} />
                    </div>

                  </div>
                );
              })()}

            </DocSection>

            {report.psicologico && (
              <DocSection id="portrait" title="2. Retrato Psicológico-Vocacional" icon={Brain}>
                <div className="text-lg leading-relaxed space-y-5 text-gray-700">
                  {report.psicologico.split(/\n{2,}/).filter(Boolean).map((p, i) => (
                    <p key={i} dangerouslySetInnerHTML={{ __html: highlightPortrait(p) }} className="text-justify" />
                  ))}
                </div>
              </DocSection>
            )}

            {report.superpowers.length > 0 && (
              <DocSection id="superpowers" title="3. Superpoderes Profesionales Confirmados" icon={Zap}>
                <p className="text-base text-gray-600 mb-8">
                  Estas son las competencias transversales donde sobresales naturalmente. Comprenderlas te ayudará a destacarte en entrevistas y en tu día a día laboral.
                </p>
                {report.superpowers.map((p, i) => <SuperpowerBlock key={i} power={p} index={i} />)}
              </DocSection>
            )}

            {report.careers.length > 0 && (
              <DocSection id="careers" title="4. Tus Caminos Profesionales Recomendados" icon={Briefcase}>
                <p className="text-base text-gray-600 mb-8">
                  Profesiones seleccionadas por nuestro algoritmo de matching RIASEC a partir de un catálogo de profesiones reales (clasificación CNO/ESCO). Incluyen compatibilidad, salidas concretas y ruta formativa.
                </p>
                {report.careers.map((c, i) => (
                  <CareerBlock
                    key={i}
                    career={c}
                    rank={i + 1}
                    isSelected={selectedCareerTitle === c.title}
                    isActionLoading={careerActionLoading}
                    onSelect={handleSelectCareer}
                    onClearSelection={handleClearCareerSelection}
                  />
                ))}
              </DocSection>
            )}

            {report.growthAreas.length > 0 && (
              <DocSection id="growth" title="5. Áreas Estratégicas de Crecimiento" icon={TrendingUp}>
                <p className="text-base text-gray-600 mb-8">
                  {report.growthIntro || 'Dimensiones transversales que potenciarán tu empleabilidad y te permitirán alcanzar puestos de mayor responsabilidad u opciones de carrera más complejas.'}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {report.growthAreas.map((area, i) => <GrowthBlock key={i} area={area} index={i} />)}
                </div>
              </DocSection>
            )}

            {report.message && (
              <DocSection id="message" title="6. Veredicto del Mentor" icon={Star}>
                <div className="bg-gray-900 rounded-3xl p-8 md:p-12 relative overflow-hidden shadow-xl text-white">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500 rounded-full blur-[100px] opacity-20 pointer-events-none" />
                  <p
                    className="relative z-10 text-xl font-medium leading-relaxed italic text-white/90"
                    dangerouslySetInnerHTML={{
                      __html: `"${clean(report.message.replace(/^[-*#\s]+/, '')).replace(/<(?!\/?strong\b)[^>]*>/g, '')}"`,
                    }}
                  />
                </div>
              </DocSection>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// ─── Main Page Export ─────────────────────────────────────
// ═══════════════════════════════════════════════════════════

export default function InformeVocacional() {
  const location = useLocation();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [informeMarkdown, setInformeMarkdown] = useState('');
  const [cargando, setCargando] = useState(true);
  const [frase, setFrase] = useState('');
  const [isFallback, setIsFallback] = useState(false);
  // Structured RIASEC scores from API — eliminates markdown regex parsing fragility (REQ-1.2)
  const [apiRiasecScores, setApiRiasecScores] = useState(null);

  // Career selection state
  const [selectedCareerTitle, setSelectedCareerTitle] = useState(null);
  const [careerActionLoading, setCareerActionLoading] = useState(false);

  const vieneDelTest = useRef(!!location.state?.resultadoTexto);

  // Parse markdown into structured report
  const report = useMemo(() => {
    const parsed = parseMarkdown(informeMarkdown);

    // Priority 1: Use structured riasec_scores from API (avoids fragile markdown regex)
    // Priority 2: Fall back to parseMarkdown regex extraction (older cached results)
    if (parsed && apiRiasecScores) {
      const RIASEC_KEYS = ['R', 'I', 'A', 'S', 'E', 'C'];
      const total = RIASEC_KEYS.reduce((sum, k) => sum + (apiRiasecScores[k] ?? 0), 0);
      const normalizer = total > 0 ? total : 1;

      const structuredScores = RIASEC_KEYS.map(dim => ({
        dim,
        label: RIASEC_LABELS[dim],
        value: apiRiasecScores[dim] ?? 0,
        pct: +((( apiRiasecScores[dim] ?? 0) / normalizer) * 100).toFixed(1),
      }));

      // Derive RIASEC code from highest scoring dimensions
      const sorted = [...structuredScores].sort((a, b) => b.pct - a.pct).filter(s => s.pct > 0);
      const selected = [sorted[0]];
      for (let i = 1; i < sorted.length && i < 3; i++) {
        const gap = sorted[i - 1].pct - sorted[i].pct;
        if (sorted[i].pct < 12 || gap > 12) break;
        selected.push(sorted[i]);
      }

      parsed.riasecScores = structuredScores;
      parsed.riasecCode = selected.map(s => s.dim).join('');
    }

    return parsed;
  }, [informeMarkdown, apiRiasecScores]);

  // ── Load results ──────────────────────────────────────────
  useEffect(() => {
    async function generarResultados() {
      try {
        // Fast path: we come from the test with results already calculated
        const stateResultado = location.state?.resultadoTexto;
        if (stateResultado) {
          setInformeMarkdown(stateResultado);
          // Store structured RIASEC scores if provided (eliminates markdown regex dependency)
          if (location.state?.riasec_scores) {
            setApiRiasecScores(location.state.riasec_scores);
          }
          setFrase('Tu elemento está donde se cruzan tus pasiones con tus talentos. Basado en tus respuestas, podría encontrarse en...');
          setCargando(false);
          return;
        }

        // Try to get the last saved result
        const res = await getUserResults();
        if (res?.success && res.results && res.results.length > 0) {
          const latest = res.results[0];
          setInformeMarkdown(latest.result_text || '');
          setFrase('Estos son tus resultados guardados:');
          setCargando(false);
          return;
        }

        // Fallback flag
        const fallbackFlag = localStorage.getItem('result_fallback');
        if (fallbackFlag === 'true') {
          setIsFallback(true);
        }

        // No results available
        setCargando(false);
      } catch (error) {
        console.error('Error cargando resultados:', error);
        setCargando(false);
      }
    }

    generarResultados();
  }, [location.state]);

  // ── Load selected career from backend ─────────────────────
  useEffect(() => {
    let mounted = true;

    const loadSelectedCareer = async () => {
      try {
        const res = await getObjetivoProfesional();
        if (!mounted) return;
        const title = res?.objetivo?.profesion?.titulo || null;
        setSelectedCareerTitle(title);
      } catch (err) {
        if (mounted) setSelectedCareerTitle(null);
      }
    };

    loadSelectedCareer();
    return () => { mounted = false; };
  }, []);

  // ── Listen for cross-tab changes ──────────────────────────
  useEffect(() => {
    function onStorage(e) {
      if (e.key === 'objetivo_changed') {
        getObjetivoProfesional().then(objRes => {
          if (objRes?.success && objRes.objetivo) {
            setSelectedCareerTitle(objRes.objetivo.profesion?.titulo || null);
          } else {
            setSelectedCareerTitle(null);
          }
        }).catch(() => {});
      }
    }
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // ── Career selection handlers ─────────────────────────────
  const handleSelectCareer = async (career, imageUrl) => {
    setCareerActionLoading(true);
    try {
      const payload = {
        profesion: {
          titulo: career.title,
          descripcion: career.why || '',
          salidas: Array.isArray(career.salidas) ? career.salidas : [],
          formacion_recomendada: Array.isArray(career.formacion)
            ? career.formacion
            : (career.formacion ? [career.formacion] : []),
          imagen_url: imageUrl || '/images/default-profession.jpg'
        }
      };

      let res = await saveObjetivoProfesional(payload);

      // Si 409 (ya tiene otra profesión), borrar la anterior y reintentar
      if (!res?.success && res?.message?.includes('Ya tienes')) {
        const delRes = await deleteObjetivoProfesional();
        if (delRes?.success) {
          res = await saveObjetivoProfesional(payload);
        }
      }
      
      if (res?.success) {
        setSelectedCareerTitle(career.title);
        showToast('success', 'Profesión guardada en tu perfil.');
        try {
          localStorage.setItem('objetivo_changed', Date.now().toString());
        } catch (e) {
          // ignore storage failures
        }
      } else {
        showToast('error', res?.message || 'No se pudo guardar la profesión.');
      }
    } catch (err) {
      console.error('No se pudo guardar la profesion objetivo', err);
      showToast('error', 'No se pudo guardar. Intenta nuevamente.');
    } finally {
      setCareerActionLoading(false);
    }
  };

  const handleClearCareerSelection = async () => {
    setCareerActionLoading(true);
    try {
      const res = await deleteObjetivoProfesional();
      if (res?.success) {
        setSelectedCareerTitle(null);
        showToast('success', '¡Listo! Ahora puedes elegir otra profesión.');
        try {
          localStorage.setItem('objetivo_changed', Date.now().toString());
        } catch (e) {
          // ignore storage failures
        }
      } else {
        showToast('error', 'No se pudo cambiar la elección.');
      }
    } catch (err) {
      console.error('No se pudo limpiar la profesion objetivo', err);
      showToast('error', 'Error al cambiar la elección. Intenta nuevamente.');
    } finally {
      setCareerActionLoading(false);
    }
  };

  // ── PDF download handler ──────────────────────────────────
  const handleDownloadReport = () => {
    generatePdfDownload(informeMarkdown, showToast);
  };

  const volverARealizarTest = () => {
    navigate('/test');
  };

  // ── Loading state ─────────────────────────────────────────
  if (cargando) {
    if (vieneDelTest.current) {
      return <PantallaEsperaResultados />;
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-green-50">
        <div className="text-center space-y-6 p-8">
          <div className="relative inline-block">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-transparent bg-gradient-to-r from-purple-600 to-green-600 bg-clip-padding"></div>
            <div className="absolute inset-0 m-1 rounded-full bg-gradient-to-br from-purple-50 via-white to-green-50"></div>
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-green-600 bg-clip-text text-transparent">
              Cargando tus resultados...
            </h3>
            <p className="text-gray-600 text-sm">
              Preparando tus profesiones recomendadas
            </p>
          </div>
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      </div>
    );
  }

  // ── Empty state (no results) ──────────────────────────────
  if (!informeMarkdown) {
    return (
      <div className="min-h-screen px-4 py-10 bg-gradient-to-br from-purple-50 via-white to-green-50">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12 animate-fadeIn">
            <div className="inline-flex items-center justify-center p-2 bg-purple-100 rounded-full mb-4">
              <Lightbulb className="w-8 h-8 text-purple-600" />
            </div>
            <h2 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-purple-600 to-green-600 bg-clip-text text-transparent mb-4">
              Tu Camino Profesional
            </h2>
            <div className="mt-6 flex items-center justify-center gap-2">
              <div className="h-1 w-20 bg-gradient-to-r from-purple-500 to-transparent rounded-full"></div>
              <div className="h-1 w-1 bg-purple-400 rounded-full"></div>
              <div className="h-1 w-1 bg-green-400 rounded-full"></div>
              <div className="h-1 w-1 bg-purple-400 rounded-full"></div>
              <div className="h-1 w-20 bg-gradient-to-l from-green-500 to-transparent rounded-full"></div>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 border-2 border-purple-100">
            <div className="text-center space-y-6">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-green-500 rounded-full mx-auto flex items-center justify-center shadow-lg">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>

              <h3 className="text-2xl md:text-3xl font-bold text-gray-800">
                ¡Aún no has realizado el test!
              </h3>

              <p className="text-lg text-gray-600 leading-relaxed max-w-2xl mx-auto">
                Para descubrir las profesiones que mejor se adaptan a tu perfil, intereses y habilidades,
                necesitas completar nuestro <span className="font-semibold text-purple-700">test vocacional</span>.
              </p>

              <div className="bg-gradient-to-br from-purple-50 to-green-50 rounded-2xl p-6 space-y-3 text-left">
                <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  ¿Qué obtendrás al realizar el test?
                </h4>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span><strong>Análisis personalizado</strong> basado en tus intereses y habilidades</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span><strong>Profesiones recomendadas</strong> con imágenes reales y salidas laborales</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span><strong>Orientación inteligente</strong> para tu futuro profesional</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={volverARealizarTest}
                className="group w-full mt-8 flex items-center justify-center gap-3 bg-gradient-to-r from-purple-600 to-green-600 hover:from-purple-700 hover:to-green-700 text-white px-8 py-5 rounded-2xl font-bold text-lg shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] cursor-pointer"
              >
                <svg className="w-6 h-6 transform group-hover:rotate-12 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Realizar el test vocacional
                <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>

              <p className="text-sm text-gray-500 italic">
                Solo te tomará unos minutos y abrirá puertas hacia tu futuro profesional
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Main results view ─────────────────────────────────────
  return (
    <div className="min-h-screen px-4 py-10 bg-gradient-to-br from-purple-50 via-white to-green-50">
      <div className="max-w-[1400px] mx-auto">

        {/* Aviso de resultado fallback */}
        {isFallback && (
          <div className="mb-8 bg-yellow-50 border-l-4 border-yellow-400 p-6 rounded-lg shadow-md">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">Análisis Preliminar</h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>
                    Este es un análisis vocacional preliminar del sistema. Para obtener recomendaciones
                    personalizadas completas, inténtalo de nuevo en 10-15 minutos o
                    <a href="/contacto" className="font-semibold underline ml-1">agenda una sesión con un orientador</a>.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="text-center mb-16 animate-fadeIn">
          <div className="inline-flex items-center justify-center p-2 bg-purple-100 rounded-full mb-4">
            <Star className="w-8 h-8 text-purple-600" />
          </div>
          <h2 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-purple-600 to-green-600 bg-clip-text text-transparent mb-4">
            Tu Camino Profesional
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">{frase}</p>
          <div className="mt-6 flex items-center justify-center gap-2">
            <div className="h-1 w-20 bg-gradient-to-r from-purple-500 to-transparent rounded-full"></div>
            <div className="h-1 w-1 bg-purple-400 rounded-full"></div>
            <div className="h-1 w-1 bg-green-400 rounded-full"></div>
            <div className="h-1 w-1 bg-purple-400 rounded-full"></div>
            <div className="h-1 w-20 bg-gradient-to-l from-green-500 to-transparent rounded-full"></div>
          </div>
        </div>

        {/* Tarjeta informativa */}
        <div className="max-w-4xl mx-auto mb-12">
          <div className="bg-gradient-to-br from-purple-50 via-white to-green-50 rounded-2xl p-6 md:p-8 border-2 border-purple-100 shadow-lg">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-purple-600" />
                  Sobre tus resultados
                </h3>
                <p className="text-gray-600 leading-relaxed text-sm md:text-base text-justify">
                  Este informe analiza tu personalidad vocacional utilizando el modelo RIASEC de Holland, uno de los sistemas más utilizados en orientación profesional.
                  Tu perfil combina diferentes dimensiones (Realista, Investigador, Artístico, Social, Emprendedor y Convencional) que revelan los entornos laborales, 
                  habilidades y roles donde puedes destacar naturalmente. Puedes elegir una de las profesiones que te indicamos y 
                  <strong className="text-purple-700"> puedes cambiar tu elección en cualquier momento</strong> desde esta misma página o desde "Mi Profesión".
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Perfil vocacional basado en RIASEC</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span>Análisis de tus fortalezas profesionales</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Caminos profesionales compatibles</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Informe RIASEC Dashboard */}
        <div className="w-full mb-16 animate-fadeIn">
          <ReportDashboard
            report={report}
            informeMarkdown={informeMarkdown}
            selectedCareerTitle={selectedCareerTitle}
            careerActionLoading={careerActionLoading}
            handleSelectCareer={handleSelectCareer}
            handleClearCareerSelection={handleClearCareerSelection}
            onDownload={handleDownloadReport}
          />
        </div>

        {/* Sección: Comparte tu experiencia */}
        <div className="max-w-4xl mx-auto mt-16 mb-12">
          <div className="bg-white rounded-2xl shadow-lg border-2 border-purple-100 p-8 md:p-10 hover:shadow-xl transition-shadow duration-300">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-purple-500 to-green-500 rounded-full flex items-center justify-center shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-600 to-green-600 bg-clip-text text-transparent mb-2">
                  ¿Cómo ha sido tu experiencia?
                </h3>
                <p className="text-gray-600 text-base md:text-lg leading-relaxed">
                  Ayuda a otros estudiantes dejando una reseña sobre tu proceso en VocAcción.
                </p>
              </div>
              <div className="flex-shrink-0">
                <button
                  onClick={() => navigate('/testimonios')}
                  className="group flex items-center gap-2 bg-gradient-to-r from-purple-600 to-green-600 hover:from-purple-700 hover:to-green-700 text-white px-6 py-3 rounded-full font-semibold shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105"
                >
                  <svg className="w-5 h-5 transform group-hover:rotate-12 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Dejar reseña
                  <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Botón repetir test */}
        <div className="mt-16 text-center space-y-6">
          <div className="inline-flex flex-col items-center gap-4">
            <div className="w-16 h-1 bg-gradient-to-r from-transparent via-purple-300 to-transparent rounded-full"></div>
            <button
              onClick={volverARealizarTest}
              className="group flex items-center gap-3 bg-white hover:bg-gradient-to-r hover:from-blue-600 hover:to-blue-700 text-blue-600 hover:text-white px-8 py-4 rounded-full font-semibold shadow-lg hover:shadow-xl border-2 border-blue-200 hover:border-transparent transition-all duration-300 transform hover:scale-105 cursor-pointer"
            >
              <svg className="w-5 h-5 transform group-hover:rotate-180 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Realizar el test nuevamente
            </button>
            <p className="text-sm text-gray-500 max-w-md">
              ¿Quieres explorar otras opciones? Repite el test con diferentes respuestas para descubrir más profesiones.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
