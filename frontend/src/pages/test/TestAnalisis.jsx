/**
 * TestAnalisis - Processing screen after test completion
 * 
 * Calls analyzeTestResults API and redirects to results page
 */

import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { analyzeTestResults } from '@/api';
import { Loader2, Sparkles, Award } from 'lucide-react';

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
      
      // Navigate to results
      navigate('/resultados');
      
    } catch (err) {
      console.error('Error analyzing results:', err);
      navigate('/testintro');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-blue-100 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-white rounded-2xl shadow-2xl p-8">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center animate-pulse">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
            <div className="absolute top-0 right-0">
              <Award className="w-8 h-8 text-yellow-400 animate-bounce" />
            </div>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-2">
          Procesando tus resultados
        </h1>
        <p className="text-center text-gray-600 mb-8">
          Estamos analizando tus respuestas para encontrar las mejores opciones profesionales para ti
        </p>

        {/* Progress bar */}
        <div className="mb-6">
          <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden mb-2">
            <div
              className="bg-gradient-to-r from-purple-500 via-blue-500 to-indigo-500 h-4 rounded-full transition-all duration-500 animate-shimmer"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">{Math.round(progress)}%</span>
            <span className="text-sm font-semibold text-purple-600">{status}</span>
          </div>
        </div>

        {/* Processing steps */}
        <div className="space-y-3">
          <ProcessingStep 
            icon="🧠" 
            label="Análisis de perfil RIASEC" 
            completed={progress > 30} 
            active={progress <= 30}
          />
          <ProcessingStep 
            icon="🎯" 
            label="Búsqueda de profesiones" 
            completed={progress > 60} 
            active={progress > 30 && progress <= 60}
          />
          <ProcessingStep 
            icon="📊" 
            label="Generación de informe" 
            completed={progress > 90} 
            active={progress > 60 && progress <= 90}
          />
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-500 mt-8">
          Esto puede tardar unos segundos...
        </p>
      </div>
    </div>
  );
}

function ProcessingStep({ icon, label, completed, active }) {
  return (
    <div className={`
      flex items-center space-x-3 p-3 rounded-lg transition-all
      ${completed ? 'bg-green-50 border border-green-200' : 
        active ? 'bg-blue-50 border border-blue-200' : 
        'bg-gray-50 border border-gray-200'}
    `}>
      <span className="text-2xl">{icon}</span>
      <span className={`
        flex-1 font-medium
        ${completed ? 'text-green-700' : active ? 'text-blue-700' : 'text-gray-500'}
      `}>
        {label}
      </span>
      {completed && (
        <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      )}
      {active && (
        <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
      )}
    </div>
  );
}
