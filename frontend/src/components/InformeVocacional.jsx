/**
 * InformeVocacional.jsx  (v4 – SaaS Premium / Dashboard Layout)
 * -----------------------------------------------------------
 * Transforms raw Gemini Markdown into a structure inspired by
 * Stripe / Linear / Notion / McKinsey reports.
 * 
 * Features:
 * - Two-column layout (Left: Sticky TOC, Right: Report body)
 * - Maximum width utilisation while preserving line-length readability
 * - Beautiful typography, subtle rulers, minimalist aesthetics
 * -----------------------------------------------------------
 */
import React, { useMemo, useState, useEffect } from 'react';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  Zap, Briefcase, BookOpen, TrendingUp, Star,
  Download, UserCheck, Brain, Target, Lightbulb, 
  ArrowRight, CheckCircle, GraduationCap, MapPin, 
  Flame, Sparkles, Eye, Target as TargetIcon,
  ChevronRight
} from 'lucide-react';

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
    strengths: "Habilidad motriz, sentido común, resolutividad mecánica y practicidad."
  },
  I: {
    description: "El perfil investigador se enfoca en comprender el mundo. Son personas curiosas, intelectuales y racionales a las que les fascina resolver problemas complejos.",
    workStyle: "Independiente, analítico, metódico y orientado al razonamiento.",
    tasks: "Diseñar experimentos, analizar datos, programar, investigar fuentes y resolver enigmas lógicos.",
    strengths: "Pensamiento crítico, lógica matemática, curiosidad intelectual y objetividad."
  },
  A: {
    description: "El perfil artístico valora la autoexpresión, la originalidad y la estética. Buscan entornos donde puedan crear, emocionar y romper con estructuras rígidas.",
    workStyle: "Flexible, intuitivo, no estructurado y altamente creativo.",
    tasks: "Diseñar, escribir, componer, actuar o idear conceptos visuales y narrativos.",
    strengths: "Innovación, sensibilidad estética, imaginación e inteligencia emocional."
  },
  S: {
    description: "Las personas sociales están orientadas hacia el bienestar de los demás. Encuentran propósito en educar, ayudar, curar o facilitar el desarrollo humano.",
    workStyle: "Colaborativo, empático, comunicativo y de apoyo mutuo.",
    tasks: "Enseñar, orientar, mediar en conflictos, cuidar a pacientes o liderar equipos humanos.",
    strengths: "Empatía, escucha activa, comunicación interpersonal y paciencia."
  },
  E: {
    description: "Los emprendedores son persuasivos, ambiciosos y líderes naturales. Disfrutan tomando la iniciativa para iniciar proyectos y alcanzar objetivos estratégicos.",
    workStyle: "Dinámico, persuasivo, competitivo y orientado a metas.",
    tasks: "Vender, negociar, liderar equipos, tomar decisiones de riesgo y gestionar negocios.",
    strengths: "Liderazgo, persuasión, confianza en sí mismos y visión de negocio."
  },
  C: {
    description: "El perfil convencional es organizado, detallista y eficiente. Sobresalen en entornos estructurados donde la precisión y el manejo de información son clave.",
    workStyle: "Ordenado, metódico, predecible y altamente estructurado.",
    tasks: "Gestionar bases de datos, organizar archivos, realizar cálculos contables y seguir protocolos.",
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
    psicologico: '', superpowers: [], careers: [],
    growthAreas: [], message: '',
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

  // 1. Intentar atrapar formato con puntos: R (Realista/Manual): 21 pts (38.2%)
  const scoreRegex = /([RIASEC])\s*\([^)]+\)[:\s]+(\d+)\s*pts[^(]*\((\d+(?:\.\d+)?)%\)/gi;
  let m;
  while ((m = scoreRegex.exec(hollandText)) !== null) {
    scoreMap[m[1].toUpperCase()] ??= { value: +m[2], pct: +m[3] };
  }

  // 2. Intentar atrapar formato tabla antiguo: | R | Realista | 21 | 38.2% |
  const tableRowRx = /\|\s*([RIASEC])\s*\|[^|]*\|\s*(\d+)\s*\|\s*(\d+(?:\.\d+)?)%/gi;
  while ((m = tableRowRx.exec(hollandText)) !== null) {
    scoreMap[m[1].toUpperCase()] ??= { value: +m[2], pct: +m[3] };
  }

  // 3. Intentar atrapar formato tabla nuevo o texto libre: | Realista (R) | 15.4% |
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
  
  // Extraer código explícito de frases como "código **IE (Investigador..."
  const codeMatch = hollandText.match(/código\s*(?:holland)?[\s:.]*\*?\*?([RIASEC]{2,3})\b/i);
  if (codeMatch) {
    result.riasecCode = codeMatch[1].toUpperCase();
  } else if (!result.riasecCode && Object.keys(scoreMap).length > 0) {
    result.riasecCode = [...result.riasecScores]
      .sort((a, b) => b.pct - a.pct)
      .filter(d => d.pct > 5)
      .slice(0, 3)
      .map(d => d.dim)
      .join('');
  }

  // Extract explanation lines by ignoring table score rows
  result.hollandExplicacion = hollandText
    .split('\n')
    .filter(line => {
      // Ignorar filas que matem puntuaciones
      if (scoreRegex.test(line) || tableRowRx.test(line) || keywordPercentRx.test(line)) return false;
      // Ignorar cabeceras y separadores de tablas markdown genéricas (| Rasgo RIASEC | ... |)
      if (line.match(/^\s*\|.*\|.*\s*$/) || line.match(/\|\s*[:-]+\s*\|/)) return false;
      // Ignorar frases introductorias a la tabla
      if (line.match(/A continuación.*(desglose|puntuaciones|tabla)/i)) return false;
      // Ignorar restos huérfanos con "pts" o porcentajes dentro de barras
      if (line.includes('pts') || line.match(/\d+%\s*\|/)) return false;
      return true;
    })
    .join('\n')
    .replace(/^#+.*$/mg, '') // remove headings
    .trim();

  // 2. Retrato
  result.psicologico = sectionText('retrato') || sectionText('psicol') || sectionText('descripción');

  // 3. Superpowers
  const spText = sectionText('superpod') || sectionText('habilidades clave');
  if (spText) {
    // Dividir usando un regex que solo corta cuando aparece un item de lista cuyo texto en negrita NO es "Por qué..." o "Cómo..."
    // Esto previene que se fragmente la tarjeta si la IA usa viñetas anidadas para el Por qué y el Cómo.
    const spBlocks = spText.split(/\n(?=^[ \t]*[-*\d]+\.?\s*\*\*(?!\s*(?:Por qu[ée]|C[óo]mo|Qu[ée] significa)))/im);
    
    result.superpowers = spBlocks.map((block, index) => {
      // Intentar extraer el título del superpoder
      const nameMatch = block.match(/(?:^|\n)[ \t]*[-*\d]+\.?\s*\*\*([^*]+)\*\*/);
      if (!nameMatch) {
         if (index === 0) return null; // Ignorar el párrafo introductorio si lo hay
         return null;
      }
      
      const name = nameMatch[1].replace(/^[\d.]+\s*/, '').replace(/:$/, '').trim();
      const rest = block.replace(nameMatch[0], '').trim();

      // Función robusta de extracción para las subsecciones
      const extractSub = (labelRegexStr) => {
        // Busca la etiqueta (ej "Por qué lo tienes:") y atrapa todo hasta otra etiqueta o el final
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

      // Fallback si la IA no estructuró las secciones con títulos
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
  const careerText = sectionText('caminos') || sectionText('profesion') || sectionText('top 3');
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
      const formacionText = formacionRaw.replace(/^[ \t]*[-*]\s*/gm, '').replace(/\*\*/g, '').trim();
      const formacionLines = formacionRaw.split(/\n/)
        .map(l => l.replace(/^[ \t]*[-*]\s*/, '').replace(/\*\*/g, '').trim())
        .filter(l => l && l !== '*' && l !== '-');
      const formacion = formacionLines.length > 1 ? formacionLines : formacionText;

      const stepsRaw = extractSub('Primeros(?: 3)? pasos');
      const steps = stepsRaw.split(/\n/)
        .map(l => l.replace(/^[ \t]*(?:\d+\.|\*|-)\s*/, '').replace(/\*\*/g, '').trim())
        .filter(l => l && l !== '*' && l !== '-');

      return { title, compat, compatDetails, why, salidas, formacion, steps };
    }).filter(b => b && b.title).slice(0, 3);
  }

  // 5. Growth
  const growthText = sectionText('crecimiento') || sectionText('áreas de') || sectionText('areas de');
  if (growthText) {
    const areaBlocks = growthText.split(/\n(?=\s*\d+\.\s*\*\*|\s*\*\*[A-ZÁÉÍÓÚÜÑ]|\s*###)/);
    const parsed = areaBlocks.map(block => {
      const nameMatch = block.match(/\*\*([^*]+)\*\*/);
      const name = nameMatch ? nameMatch[1].replace(/^[\d.]+\s*/, '').trim() : '';
      const rest = block.replace(/\*\*[^*]+\*\*/, '').trim();
      const extractSub = (label, text) => {
        const rx = new RegExp(`${label}[:\\s]+([\\s\\S]+?)(?=\\n\\s*[-*]|\\n\\s*\\*\\*|$)`, 'i');
        return text.match(rx)?.[1]?.replace(/\*\*/g, '').trim() || '';
      };
      const why = extractSub('por qué|importancia|relevancia|impacto', rest);
      const how = extractSub('cómo mejorar|cómo trabajar|cómo desarrollar|cómo|pasos', rest);
      
      const sentences = rest.split(/(?<=[.!?])\s+/).filter(Boolean);
      const half = Math.ceil(sentences.length / 2);
      return { title: name || `Área de desarrollo`, why: why || sentences.slice(0, half).join(' '), how: how || sentences.slice(half).join(' ') };
    }).filter(b => b.title && (b.why || b.how));
    result.growthAreas = parsed.slice(0, 2);
  }

  // 6. Mentor
  result.message = sectionText('mensaje') || sectionText('mentor');
  return result;
}

// ─── Helpers ──────────────────────────────────────────────

function clean(s = '') {
  return s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/\n/g, ' ').trim();
}

function highlightPortrait(text) {
  let html = clean(text);
  
  // Si el texto ya vino súper enriquecido de Gemini (>3 negritas), lo dejamos casi como está
  const matchBolds = html.match(/<strong>/g);
  if (matchBolds && matchBolds.length > 3) {
    return html.replace(/<strong>/g, '<strong class="text-gray-900 font-extrabold">');
  }

  // Lista de términos vocacionales potentes a enfatizar automáticamente
  const keywords = [
    'Realista', 'Investigador', 'Art[íi]stico', 'Social', 'Emprendedor', 'Convencional',
    'mente', 'curiosidad', 'dinamismo', 'estrategia', 'estrat[ée]gic[oa]', 'liderazgo',
    'análisis', 'anal[íi]tic[oa]', 'impacto', 'autonom[íi]a', 'innovador', 'innovaci[óo]n',
    'proyectos', 'comunicaci[óo]n', 'empat[íi]a', 'visi[óo]n', 'creativ[oa]', 'creatividad',
    'l[óo]gica', 'resoluci[óo]n', 'eficiencia', 'planificaci[óo]n', 'datos'
  ];

  keywords.forEach(kw => {
    // Regex que busca la palabra completa exacta, fuera de tags HTML, insensible a mayúsculas
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

function RiasecCard({ score }) {
  const { dim, label, pct } = score;
  const col = RIASEC_COLOURS[dim];
  const details = RIASEC_DETAILS[dim];

  if (!details) return null;

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-1.5" style={{ backgroundColor: col.bar }} />
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 mt-2">
        <div className="flex items-center gap-4">
          <span className="w-12 h-12 rounded-xl flex items-center justify-center text-xl font-black shadow-sm"
                style={{ background: col.bg, color: col.text, border: `1px solid ${col.border}` }}>
            {dim}
          </span>
          <div>
            <h4 className="text-2xl font-extrabold text-gray-900 m-0 tracking-tight">
              {label} ({dim})
            </h4>
          </div>
        </div>
        <div className="inline-flex items-center px-4 py-2 rounded-lg font-bold text-lg" style={{ background: col.bg, color: col.text }}>
          {pct.toFixed(1)}%
        </div>
      </div>
      
      <p className="text-base text-gray-700 mb-8 leading-relaxed">
        {details.description}
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
          <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
            <Zap size={16} className="text-yellow-500" /> Estilo de trabajo
          </h5>
          <p className="text-sm text-slate-800 font-medium leading-relaxed">
            {details.workStyle}
          </p>
        </div>
        
        <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
          <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
            <TargetIcon size={16} className="text-emerald-500" /> Tareas que disfruta
          </h5>
          <p className="text-sm text-slate-800 font-medium leading-relaxed">
            {details.tasks}
          </p>
        </div>
        
        <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
          <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
            <Sparkles size={16} className="text-purple-500" /> Fortalezas naturales
          </h5>
          <p className="text-sm text-slate-800 font-medium leading-relaxed">
            {details.strengths}
          </p>
        </div>
      </div>
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

function CareerBlock({ career, rank }) {
  const col = compatColour(career.compat);

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
      <h3 className="text-lg font-bold mb-6 flex items-center gap-3" style={{ color: slot.text }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white" style={{ border: `1px solid ${slot.border}` }}>
          <TrendingUp size={16} color={slot.icon} />
        </div>
        {area.title}
      </h3>
      <div className="space-y-6">
        {area.why && (
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider mb-2 opacity-75" style={{ color: slot.text }}>
              Por qué es fundamental
            </h4>
            <p className="text-sm leading-relaxed" style={{ color: slot.text }} dangerouslySetInnerHTML={{ __html: clean(area.why) }} />
          </div>
        )}
        {area.how && (
          <div className="rounded-xl p-5 bg-white/60" style={{ border: `1px solid ${slot.border}66` }}>
            <h4 className="text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-2" style={{ color: slot.text }}>
              <Sparkles size={14} /> Acciones recomendadas
            </h4>
            {area.how.includes('\n') ? (
              <ul className="space-y-3 m-0 p-0 list-none">
                {area.how.split('\n').filter(Boolean).map((line, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm leading-relaxed" style={{ color: slot.text }}>
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: slot.icon }} />
                    <span dangerouslySetInnerHTML={{ __html: clean(line.replace(/^[-*]\s*/, '')) }} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm leading-relaxed m-0" style={{ color: slot.text }} dangerouslySetInnerHTML={{ __html: clean(area.how) }} />
            )}
          </div>
        )}
      </div>
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
    { id: 'careers', label: '4. Caminos Profesionales' },
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

// ─── Main export ──────────────────────────────────────────

export default function InformeVocacional({ markdown, onDownload }) {
  const report = useMemo(() => parseMarkdown(markdown), [markdown]);
  const hasStructure = report && (
    report.riasecScores.length > 0 || report.superpowers.length > 0 || report.careers.length > 0
  );

  if (!markdown) return null;

  // Fallback simple view
  if (!hasStructure) {
    return (
      <div className="w-full max-w-4xl mx-auto prose prose-purple bg-white p-8 md:p-12 rounded-2xl shadow-sm border border-gray-200">
        <div dangerouslySetInnerHTML={{ __html: markdown.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>') }} />
      </div>
    );
  }

  return (
    <div className="w-full bg-white rounded-3xl shadow-xl shadow-purple-900/5 ring-1 ring-gray-200 font-sans">
      
      {/* ── Big Hero Header ── */}
      <div className="bg-gray-900 text-white rounded-t-3xl px-8 md:px-16 py-12 md:py-16 relative overflow-hidden">
        {/* Subtle decorative background element */}
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
              <div className="flex items-center gap-3 text-white/80">
                <span className="text-sm font-medium">Perfil dominante identificado:</span>
                <span className="px-3 py-1 bg-white text-gray-900 rounded-lg text-sm font-black tracking-widest shadow-sm">
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
              {report.hollandExplicacion ? (
                <div className="text-lg leading-relaxed space-y-5 text-gray-700 mb-10">
                  {report.hollandExplicacion.split(/\n{2,}/).filter(Boolean).map((p, i) => (
                    <p key={i} dangerouslySetInnerHTML={{ __html: clean(p) }} className="text-justify" />
                  ))}
                </div>
              ) : (
                <p className="text-lg leading-relaxed mb-10 text-gray-700">
                  El modelo Holland clasifica tu personalidad en 6 dimensiones. Tu combinación única revela qué entornos laborales te resultarán más naturales y gratificantes.
                </p>
              )}
              
              <h3 className="text-xl font-bold text-gray-900 mb-6 border-t border-gray-100 pt-8">
                Desglose Dimensional y Gráfico
              </h3>
              <RiasecRadar scores={report.riasecScores} />

              {report.riasecScores?.length > 0 && (
                <div className="mt-12 space-y-8">
                  <h3 className="text-xl font-bold text-gray-900 mb-6 border-t border-gray-100 pt-8">
                    Tus Dimensiones en Detalle
                  </h3>
                  {[...report.riasecScores]
                    .sort((a, b) => b.pct - a.pct)
                    .map((score) => (
                      <RiasecCard key={score.dim} score={score} />
                  ))}
                </div>
              )}
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
              <DocSection id="careers" title="4. Caminos Profesionales de Alto Impacto" icon={Briefcase}>
                <p className="text-base text-gray-600 mb-8">
                  Perfiles profesionales analizados exhaustivamente contra tu código Holland. Incluyen porcentajes de compatibilidad, salidas reales y la hoja de ruta académica necesaria.
                </p>
                {report.careers.map((c, i) => <CareerBlock key={i} career={c} rank={i + 1} />)}
              </DocSection>
            )}

            {report.growthAreas.length > 0 && (
              <DocSection id="growth" title="5. Áreas Estratégicas de Crecimiento" icon={TrendingUp}>
                <p className="text-base text-gray-600 mb-8">
                  Dimensiones transversales que potenciarán tu empleabilidad y te permitirán alcanzar puestos de mayor responsabilidad u opciones de carrera más complejas.
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
                  <p className="relative z-10 text-xl font-medium leading-relaxed italic text-white/90">
                    "{clean(report.message.replace(/^[-*#\s]+/, ''))}"
                  </p>
                </div>
              </DocSection>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}
