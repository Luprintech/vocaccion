/**
 * Componente: ResultadosTest
 * ---------------------------------------------
 * Muestra los resultados del test vocacional.
 * 
 * 🔹 Recibe el texto de resultado generado por la IA (desde el estado de navegación).
 * 🔹 Llama al backend para procesar las profesiones y obtener imágenes/descripciones.
 * 🔹 Muestra una lista de profesiones recomendadas con:
 *    - Título
 *    - Descripción
 *    - Salidas laborales
 *    - Imagen asociada
 * 🔹 Permite guardar una profesión seleccionada en el perfil del usuario.
 * 🔹 Incluye un modo “fallback” si la IA no puede generar resultados (mensaje alternativo).
 * 
 * Objetivo: presentar los resultados vocacionales de forma clara, visual y motivadora,
 * conectando los datos del backend con una interfaz amigable.
 * 
 * 💾 Relación con backend:
 * Este componente realiza llamadas directas al backend a través de los siguientes endpoints:
 * 
 *   • POST /test/procesar-resultados → Analiza el texto devuelto por Gemini y genera profesiones.
 *   • POST /guardar-profesion        → Guarda la profesión seleccionada en el perfil del usuario.
 * 
 * Ambos endpoints son gestionados por TestController.php en Laravel.
 */

import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Sparkles, Star, Lightbulb, Download, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { getUserResults, saveObjetivoProfesional, getObjetivoProfesional, deleteObjetivoProfesional, generateImageForProfession } from '../../api';
import { useToast } from '@/components/ToastProvider';
import ProfesionCard from '@/components/ProfesionCard';
import PantallaEsperaResultados from '@/components/PantallaEsperaResultados';

// Renderiza Markdown básico a JSX sin dependencias externas
function renderMarkdown(text) {
  if (!text) return null;

  const renderInline = (str) => {
    const parts = str.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) =>
      part.startsWith('**') && part.endsWith('**')
        ? <strong key={i}>{part.slice(2, -2)}</strong>
        : part
    );
  };

  const lines = text.split('\n');
  const elements = [];
  let listBuffer = [];

  const flushList = () => {
    if (listBuffer.length === 0) return;
    elements.push(
      <ul key={`ul-${elements.length}`} className="list-disc pl-5 space-y-1 text-gray-700 mb-3">
        {listBuffer.map((item, i) => <li key={i}>{renderInline(item)}</li>)}
      </ul>
    );
    listBuffer = [];
  };

  lines.forEach((line, i) => {
    if (line.startsWith('# ')) {
      flushList();
      elements.push(<h2 key={i} className="text-xl font-bold text-gray-900 mt-6 mb-2 pb-1 border-b border-purple-100">{renderInline(line.slice(2))}</h2>);
    } else if (line.startsWith('## ')) {
      flushList();
      elements.push(<h3 key={i} className="text-lg font-semibold text-purple-700 mt-4 mb-1">{renderInline(line.slice(3))}</h3>);
    } else if (line.startsWith('### ')) {
      flushList();
      elements.push(<h4 key={i} className="text-base font-semibold text-gray-800 mt-3 mb-1">{renderInline(line.slice(4))}</h4>);
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      listBuffer.push(line.slice(2));
    } else if (line.trim() === '') {
      flushList();
    } else {
      flushList();
      if (line.trim()) elements.push(<p key={i} className="text-gray-700 leading-relaxed mb-2">{renderInline(line)}</p>);
    }
  });

  flushList();
  return elements;
}

export default function ResultadosTest() {
  const location = useLocation();
  const [profesiones, setProfesiones] = useState([]);
  const [informeMarkdown, setInformeMarkdown] = useState('');
  const [cargando, setCargando] = useState(true);
  const [frase, setFrase] = useState('');
  const [isFallback, setIsFallback] = useState(false);
  const [objetivoId, setObjetivoId] = useState(null);
  const [isInformeExpanded, setIsInformeExpanded] = useState(false);
  const { showToast } = useToast();
  // Cache imagenes en memoria para evitar peticiones repetidas en la misma sesión
  const imageCacheRef = useRef({});
  // Flag para saber si venimos del test (para mantener PantallaEsperaResultados)
  const vieneDelTest = useRef(!!location.state?.resultadoTexto);

  useEffect(() => {
    async function generarResultados() {
      try {
        // ── Fast path: venimos del test con los resultados ya calculados ──────
        const stateProfs = location.state?.profesiones;
        if (Array.isArray(stateProfs) && stateProfs.length > 0) {
          setProfesiones(stateProfs);
          setInformeMarkdown(location.state?.resultadoTexto || '');
          setFrase('Tu elemento está donde se cruzan tus pasiones con tus talentos. Basado en tus respuestas, podría encontrarse en...');
          // No quitamos carga aquí; dejamos que el effect de imágenes lo haga
          return;
        }

        // Intentar obtener el último resultado guardado del usuario
        const res = await getUserResults();
        if (res?.success && res.results && res.results.length > 0) {
          const latest = res.results[0];
          // El campo 'profesiones' puede venir como string JSON o ya como objeto/array
          let profs = [];
          try {
            if (typeof latest.profesiones === 'string') {
              profs = JSON.parse(latest.profesiones);
            } else if (Array.isArray(latest.profesiones)) {
              profs = latest.profesiones;
            }
          } catch (e) {
            profs = [];
          }
          setInformeMarkdown(latest.result_text || '');

          // Obtener objetivo actual del usuario para marcar la profesion elegida
          let objetivo = null;
          try {
            const objRes = await getObjetivoProfesional();
            if (objRes?.success && objRes.objetivo) {
              objetivo = objRes.objetivo;
              setObjetivoId(objRes.objetivo.profesion_id || null);
            } else {
              setObjetivoId(null);
            }
          } catch (e) {
            // Error obteniendo objetivo, continuar sin él
          }

          // Si las profesiones no tienen id, intentar emparejar por título con la profesion guardada
          const mapped = profs.map((p) => {
            if ((!p.id || p.id === null) && objetivo && objetivo.profesion && objetivo.profesion.titulo) {
              try {
                const tituloP = (p.titulo || '').trim().toLowerCase();
                const tituloObj = (objetivo.profesion.titulo || '').trim().toLowerCase();
                if (tituloP && tituloObj && tituloP === tituloObj) {
                  return { ...p, id: objetivo.profesion_id };
                }
              } catch (e) {
                // ignore
              }
            }
            return p;
          });

          setProfesiones(mapped);
          setFrase('Estos son tus resultados guardados:');
          setCargando(false);
          return;
        }

        // Si no hay resultados guardados, intentar procesar lo que venga por state (fallback)
        const fallbackFlag = localStorage.getItem('result_fallback');
        if (fallbackFlag === 'true') {
          setIsFallback(true);
        }

        const { resultadoTexto } = location.state || {};
        if (!resultadoTexto) {
          // No hay nada que mostrar
          setCargando(false);
          return;
        }

        // Llamada a backend que extrae profesiones y genera imágenes
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
        const token = localStorage.getItem('token');

        const proc = await fetch(`${API_URL}/test/procesar-resultados`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          },
          body: JSON.stringify({ resultado: resultadoTexto })
        });

        if (!proc.ok) {
          const errorData = await proc.json();
          throw new Error(errorData.error || `Error del servidor: ${proc.status}`);
        }

        const data = await proc.json();
        let profs = data.profesiones || [];
        // Si hay un objetivo guardado, cárgalo para marcar la opción y emparejar por título si falta id
        try {
          const objRes = await getObjetivoProfesional();
          if (objRes?.success && objRes.objetivo) {
            setObjetivoId(objRes.objetivo.profesion_id || null);
            const objetivo = objRes.objetivo;
            profs = profs.map(p => {
              if ((!p.id || p.id === null) && objetivo.profesion && objetivo.profesion.titulo) {
                const tituloP = (p.titulo || '').trim().toLowerCase();
                const tituloObj = (objetivo.profesion.titulo || '').trim().toLowerCase();
                if (tituloP && tituloObj && tituloP === tituloObj) {
                  return { ...p, id: objetivo.profesion_id };
                }
              }
              return p;
            });
          }
        } catch (e) {
          // ignore
        }
        setProfesiones(profs);
        setFrase(
          'Tu elemento está donde se cruzan tus pasiones con tus talentos. Basado en tus respuestas, podría encontrarse en...'
        );
      } catch (error) {
        setCargando(false);
      }
      setCargando(false);
    }

    generarResultados();
  }, [location.state]);



  const guardarProfesion = async (profesion) => {
    try {
      // Antes de guardar, verificar en backend si ya existe un objetivo (evitar race conditions)
      const current = await getObjetivoProfesional();
      if (current?.success && current.objetivo) {
        // Si ya tiene una profesión guardada distinta
        const existingId = current.objetivo.profesion_id;
        if (existingId && (!profesion.id || Number(existingId) !== Number(profesion.id))) {
          showToast('error', 'Ya tienes una profesión elegida. Elimínala en Mi Profesión antes de elegir otra.');
          // actualizar estado local por si cambió en otro tab
          setObjetivoId(existingId);
          return;
        }
      }

      // Intentar guardar enviando el objeto de profesion (backend creará/relacionará)
      const body = { profesion: profesion };
      const res = await saveObjetivoProfesional(body);
      if (res?.success) {
        showToast('success', 'Profesión guardada en tu perfil.');
        // Actualizar estado para deshabilitar el botón en la vista
        const newObjetivoId = res.objetivo?.profesion_id || null;
        if (newObjetivoId) {
          setObjetivoId(newObjetivoId);
          // Si la profesión que venía del AI no tenía id, intentar asignarla por título
          setProfesiones((prev) => prev.map(p => {
            if ((!p.id && p.titulo === profesion.titulo) || Number(p.id) === Number(newObjetivoId)) {
              return { ...p, id: newObjetivoId };
            }
            return p;
          }));
          // Notificar otras pestañas
          try {
            localStorage.setItem('objetivo_changed', Date.now().toString());
          } catch (e) { /* ignore */ }
        }
      } else {
        showToast('error', res?.message || 'No se pudo guardar la profesión.');
      }
    } catch (err) {
      showToast('error', 'No se pudo guardar. Intenta nuevamente.');
    }
  };

  const cambiarEleccion = async () => {
    try {
      const res = await deleteObjetivoProfesional();
      if (res?.success) {
        showToast('success', '¡Listo! Ahora puedes elegir otra profesión.');
        setObjetivoId(null);
        // Notificar otras pestañas
        try {
          localStorage.setItem('objetivo_changed', Date.now().toString());
        } catch (e) { /* ignore */ }
      } else {
        showToast('error', 'No se pudo cambiar la elección.');
      }
    } catch (err) {
      showToast('error', 'Error al cambiar la elección. Intenta nuevamente.');
    }
  };

  const navigate = useNavigate();

  // Escuchar cambios en otras pestañas para mantener consistencia
  React.useEffect(() => {
    function onStorage(e) {
      if (e.key === 'objetivo_changed') {
        // Reconsultar objetivo
        getObjetivoProfesional().then(objRes => {
          if (objRes?.success && objRes.objetivo) {
            setObjetivoId(objRes.objetivo.profesion_id || null);
          } else {
            setObjetivoId(null);
          }
        }).catch(() => { });
      }
    }
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const handleDownloadReport = () => {
    const text = informeMarkdown;
    if (!text || text === 'Respuesta truncada.') {
      showToast('error', 'El informe aún no está disponible. Intenta actualizar la página.');
      return;
    }

    // Convertir Markdown básico a HTML para el PDF
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

    body {
      font-family: 'Inter', sans-serif;
      color: #1a1a2e;
      background: #ffffff;
      padding: 48px;
      max-width: 820px;
      margin: 0 auto;
      font-size: 14px;
      line-height: 1.7;
    }

    .pdf-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 3px solid #7c3aed;
      padding-bottom: 20px;
      margin-bottom: 32px;
    }

    .logo-brand {
      font-size: 24px;
      font-weight: 800;
      background: linear-gradient(135deg, #7c3aed, #16a34a);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .pdf-meta {
      font-size: 12px;
      color: #6b7280;
      text-align: right;
      line-height: 1.5;
    }

    h1 {
      font-size: 22px;
      font-weight: 800;
      color: #7c3aed;
      margin: 28px 0 12px;
      padding-bottom: 6px;
      border-bottom: 2px solid #ede9fe;
    }

    h2 {
      font-size: 17px;
      font-weight: 700;
      color: #5b21b6;
      margin: 22px 0 10px;
    }

    h3 {
      font-size: 15px;
      font-weight: 600;
      color: #374151;
      margin: 16px 0 8px;
    }

    p { margin-bottom: 10px; color: #374151; }

    ul {
      margin: 8px 0 12px 20px;
      color: #374151;
    }

    li { margin-bottom: 5px; }

    strong { color: #1f2937; font-weight: 700; }

    table {
      width: 100%;
      border-collapse: collapse;
      margin: 14px 0;
      font-size: 13px;
    }

    td, th {
      border: 1px solid #e5e7eb;
      padding: 8px 12px;
      text-align: left;
    }

    tr:nth-child(even) td { background: #f9fafb; }
    tr:first-child td { background: #ede9fe; font-weight: 600; }

    .pdf-footer {
      margin-top: 40px;
      padding-top: 16px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      font-size: 11px;
      color: #9ca3af;
    }

    .print-btn {
      position: fixed;
      bottom: 24px;
      right: 24px;
      background: linear-gradient(135deg, #7c3aed, #16a34a);
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 50px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 4px 20px rgba(124,58,237,0.4);
      z-index: 100;
    }

    .print-btn:hover { opacity: 0.9; transform: scale(1.02); }

    @media print {
      .print-btn { display: none !important; }
      body { padding: 20px; font-size: 12px; }
      h1 { font-size: 18px; }
      h2 { font-size: 15px; }
    }
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

  <div class="report-content">
    ${htmlContent}
  </div>

  <div class="pdf-footer">
    © ${new Date().getFullYear()} VocAcción · Tu orientador vocacional con Inteligencia Artificial · informe generado automáticamente con tecnología Gemini AI
  </div>

  <button class="print-btn" onclick="window.print()">
    🖨️ Guardar como PDF
  </button>

  <script>
    // Auto-abrir diálogo de impresión tras un pequeño delay
    setTimeout(() => window.print(), 800);
  </script>
</body>
</html>`);

    printWindow.document.close();
  };


  const volverARealizarTest = () => {
    navigate('/test');
  };

  if (cargando) {
    // Si venimos de realizar el test, mostramos SOLO PantallaEsperaResultados hasta que TODO esté listo
    if (vieneDelTest.current) {
      return <PantallaEsperaResultados />;
    }

    // Si solo estamos cargando resultados guardados (navegación normal), mostramos un mensaje amigable
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-green-50">
        <div className="text-center space-y-6 p-8">
          {/* Spinner animado con gradiente */}
          <div className="relative inline-block">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-transparent bg-gradient-to-r from-purple-600 to-green-600 bg-clip-padding"></div>
            <div className="absolute inset-0 m-1 rounded-full bg-gradient-to-br from-purple-50 via-white to-green-50"></div>
          </div>
          
          {/* Texto animado */}
          <div className="space-y-2">
            <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-green-600 bg-clip-text text-transparent">
              Cargando tus resultados...
            </h3>
            <p className="text-gray-600 text-sm">
              Preparando tus profesiones recomendadas
            </p>
          </div>

          {/* Puntos animados */}
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      </div>
    );
  }

  // Si no hay profesiones generadas, mostrar mensaje para realizar el test
  if (!profesiones || profesiones.length === 0) {
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
                <h3 className="text-sm font-medium text-yellow-800">
                  Análisis Preliminar
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>
                    Este es un análisis vocacional preliminar del sistema. Para obtener recomendaciones
                    personalizadas con inteligencia artificial, inténtalo de nuevo en 10-15 minutos o
                    <a href="/contacto" className="font-semibold underline ml-1">agenda una sesión con un orientador</a>.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Header mejorado con animación */}
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

        {/* Tarjeta informativa (mejora UX) */}
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
                <p className="text-gray-600 leading-relaxed text-sm md:text-base">
                  Estas profesiones se han seleccionado según tus respuestas e intereses.
                  Explora cada una con calma, investiga sus salidas laborales y elige la que más se alinee con tu futuro.
                  Recuerda: <strong className="text-purple-700">puedes cambiar tu elección en cualquier momento</strong> desde esta misma página o desde "Mi Profesión".
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Análisis personalizado</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span>Salidas laborales verificadas</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Imágenes reales de profesiones</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Informe RIASEC en Markdown */}
        {informeMarkdown && (
          <div className="max-w-4xl mx-auto mb-12">
            <div className="bg-white rounded-2xl shadow-lg border-2 border-purple-100 overflow-hidden">
              {/* Header del informe - Clickable to expand */}
              <div 
                onClick={() => setIsInformeExpanded(!isInformeExpanded)}
                className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-purple-600 to-green-600 cursor-pointer select-none"
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-white" />
                  <span className="text-white font-bold text-lg">Tu Informe Vocacional</span>
                </div>
                
                <div className="flex items-center gap-2 text-white/90">
                  <span className="text-sm font-medium hidden sm:inline">
                    {isInformeExpanded ? 'Cerrar informe' : 'Pulsa para leer el informe completo'}
                  </span>
                  {isInformeExpanded ? (
                    <ChevronUp className="w-5 h-5" />
                  ) : (
                    <ChevronDown className="w-5 h-5 animate-bounce" />
                  )}
                </div>
              </div>

              {/* Contenido del informe */}
              {isInformeExpanded && (
                <div className="flex flex-col animate-fadeIn">
                  <div className="px-8 py-6 text-sm md:text-base text-justify markdown-content border-b border-gray-100">
                    {renderMarkdown(informeMarkdown)}
                  </div>
                  
                  {/* Footer del informe - Botón de descarga al final */}
                  <div className="bg-gray-50 px-8 py-4 flex justify-end">
                    <button
                      onClick={handleDownloadReport}
                      className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-6 py-2.5 rounded-full text-sm font-semibold transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                    >
                      <Download className="w-4 h-4" />
                      Descargar informe en PDF
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Grid de tarjetas profesionales con componente reutilizable */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-12">
          {profesiones.map((p, idx) => {
            const isChosen = (objetivoId && p.id && Number(p.id) === Number(objetivoId));
            const hasAnyObjective = Boolean(objetivoId);

            return (
              <ProfesionCard
                key={idx}
                profesion={p}
                isChosen={isChosen}
                hasAnyObjective={hasAnyObjective}
                onGuardar={guardarProfesion}
                onCambiarEleccion={cambiarEleccion}
                showToast={showToast}
              />
            );
          })}
        </div>

        {/* Sección: Comparte tu experiencia */}
        <div className="max-w-4xl mx-auto mt-16 mb-12">
          <div className="bg-white rounded-2xl shadow-lg border-2 border-purple-100 p-8 md:p-10 hover:shadow-xl transition-shadow duration-300">
            <div className="flex flex-col md:flex-row items-center gap-6">
              {/* Icono decorativo */}
              <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-purple-500 to-green-500 rounded-full flex items-center justify-center shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>

              {/* Contenido */}
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-600 to-green-600 bg-clip-text text-transparent mb-2">
                  ¿Cómo ha sido tu experiencia?
                </h3>
                <p className="text-gray-600 text-base md:text-lg leading-relaxed">
                  Ayuda a otros estudiantes dejando una reseña sobre tu proceso en VocAcción.
                </p>
              </div>

              {/* Botón */}
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

        {/* Botón de acción secundaria mejorado */}
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
