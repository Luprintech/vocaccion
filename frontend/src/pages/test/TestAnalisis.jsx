/**
 * TestAnalisis - Processing screen after test completion
 * 
 * Calls analyzeTestResults API and redirects to results page
 */

import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { analyzeTestResults } from '@/api';
import { Loader2, Sparkles, Award, Brain, Briefcase, FileText } from 'lucide-react';
import TestViewportShell from '@/components/test/TestViewportShell';

export default function TestAnalisis() {
  const navigate = useNavigate();
  const location = useLocation();
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('Analizando tus respuestas...');
  
  useEffect(() => {
    analyzeResults();
    
    // Progress animation
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 10;
      });
    }, 500);
    
    return () => clearInterval(interval);
  }, []);

  const analyzeResults = async () => {
    try {
      const sessionId = location.state?.session_id;
      
      if (!sessionId) {
        console.error('No session_id provided');
        navigate('/testintro');
        return;
      }

      setStatus('Procesando respuestas...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setStatus('Calculando perfiles RIASEC...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setStatus('Buscando profesiones compatibles...');
      const res = await analyzeTestResults({ session_id: sessionId });
      
      if (!res.success) {
        console.error('Analysis failed:', res.error);
        navigate('/testintro');
        return;
      }

      setProgress(100);
      setStatus('¡Análisis completado!');
      
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Navigate to results — pass riasec_scores for structured display (Phase 1 REQ-1.2)
      navigate('/resultados', {
        state: {
          resultadoTexto: res.report_markdown,
          riasec_scores: res.riasec_scores ?? null,
        },
      });
      
    } catch (err) {
      console.error('Error analyzing results:', err);
      navigate('/testintro');
    }
  };

  return (
    <TestViewportShell
      className="min-h-screen md:min-h-[calc(100vh-72px)] bg-gradient-to-br from-purple-100 via-blue-100 to-indigo-100"
      fillHeight={false}
      contentGrow={false}
      header={(
        <div className="flex items-center justify-center gap-2.5">
          <div className="relative">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center animate-pulse">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div className="absolute -top-1 -right-1">
              <Award className="w-4 h-4 text-yellow-400 animate-bounce" />
            </div>
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-800 leading-tight">Procesando tus resultados</h1>
            <p className="text-xs md:text-sm text-gray-600 leading-tight">Estamos generando tu informe vocacional</p>
          </div>
        </div>
      )}
      footer={<p className="text-center text-xs text-gray-500">Esto puede tardar unos segundos...</p>}
    >
      <div className="flex flex-col justify-start gap-3.5">
        <div className="mb-1">
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden mb-1.5">
            <div
              className="bg-gradient-to-r from-purple-500 via-blue-500 to-indigo-500 h-3 rounded-full transition-all duration-500 animate-shimmer"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs md:text-sm text-gray-600">{Math.round(progress)}%</span>
            <span className="text-xs md:text-sm font-semibold text-purple-600 text-right">{status}</span>
          </div>
        </div>

        <div className="space-y-2.5">
          <ProcessingStep
            icon={Brain}
            label="Análisis de perfil RIASEC"
            completed={progress > 30}
            active={progress <= 30}
          />
          <ProcessingStep
            icon={Briefcase}
            label="Búsqueda de profesiones"
            completed={progress > 60}
            active={progress > 30 && progress <= 60}
          />
          <ProcessingStep
            icon={FileText}
            label="Generación de informe"
            completed={progress > 90}
            active={progress > 60 && progress <= 90}
          />
        </div>
      </div>
    </TestViewportShell>
  );
}

function ProcessingStep({ icon: Icon, label, completed, active }) {
  return (
    <div className={`
      flex items-center space-x-2.5 p-2.5 rounded-lg transition-all
      ${completed ? 'bg-green-50 border border-green-200' : 
        active ? 'bg-blue-50 border border-blue-200' : 
        'bg-gray-50 border border-gray-200'}
    `}>
      <div className={`w-8 h-8 rounded-md flex items-center justify-center ${completed ? 'bg-green-100 text-green-700' : active ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
        <Icon className="w-4 h-4" />
      </div>
      <span className={`
        flex-1 font-medium text-sm md:text-base leading-tight
        ${completed ? 'text-green-700' : active ? 'text-blue-700' : 'text-gray-500'}
      `}>
        {label}
      </span>
      {completed && (
        <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      )}
      {active && (
        <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
      )}
    </div>
  );
}
