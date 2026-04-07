/**
 * TestVocacional - V2 Curated Bank Flow
 * 
 * Manages the v2 test experience with phase-driven UI:
 * - Likert phase (18 questions)
 * - Checklist phase (10 questions)
 * - Comparative phase (6 questions)
 * 
 * Backend determines version, frontend adapts.
 */

import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContextFixed';
import { startTest, responderPregunta, anteriorPregunta, getTestEstado } from '@/api';
import LikertScale from '@/components/test/LikertScale';
import ChecklistQuestion from '@/components/test/ChecklistQuestion';
import ComparativeScale from '@/components/test/ComparativeScale';
import PhaseTransition from '@/components/test/PhaseTransition';
import { Loader2, ArrowLeft, CheckCircle, ChevronLeft } from 'lucide-react';

export default function TestVocacional() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Session state
  const [loading, setLoading] = useState(true);
  const [sessionId, setSessionId] = useState(null);
  const [version, setVersion] = useState(null);
  
  // V2 state
  const [currentItem, setCurrentItem] = useState(null);
  const [currentPhase, setCurrentPhase] = useState('likert');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [totalItems, setTotalItems] = useState(34);
  const [phaseTransition, setPhaseTransition] = useState(null);
  
  // Answer state
  const [currentAnswer, setCurrentAnswer] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [startTime, setStartTime] = useState(Date.now());
  
  // Error state
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    initializeTest();
  }, [isAuthenticated]);

  const initializeTest = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check if resuming or starting new
      const estadoRes = await getTestEstado();
      
      if (estadoRes.estado === 'completado') {
        navigate('/resultados');
        return;
      }

      // Get age_group from location state (passed from TestIntro)
      const ageGroup = location.state?.ageGroup;

      // Start or resume session
      const res = await startTest(ageGroup);
      
      if (!res.success) {
        setError(res.error || 'Error al iniciar el test');
        return;
      }

      // Detect version
      const sessionVersion = res.version || 1;
      setVersion(sessionVersion);

      if (sessionVersion === 1) {
        // V1 legacy flow - redirect to old component or handle here
        // For now, show error asking to restart
        setError('Sesión v1 detectada. Por favor, reinicia el test desde el inicio.');
        return;
      }

      // V2 flow
      setSessionId(res.session_id);
      setCurrentItem(res.item);
      setCurrentPhase(res.phase);
      setCurrentIndex(res.current_index);
      setTotalItems(res.total_items);
      setCurrentAnswer(res.answer ?? null);
      setStartTime(Date.now());
      
    } catch (err) {
      console.error('Error initializing test:', err);
      setError('Error al cargar el test. Por favor, intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (value) => {
    setCurrentAnswer(value);
  };

  const handleSubmit = async () => {
    if (currentAnswer === null || currentAnswer === undefined) {
      return; // No answer selected
    }

    setIsSubmitting(true);
    
    try {
      const responseTime = Date.now() - startTime;
      
      const serializedValue = currentPhase === 'checklist'
        ? ((Array.isArray(currentAnswer) && currentAnswer.length > 0) ? 1 : 0)
        : currentAnswer;

      const payload = {
        session_id: sessionId,
        item_id: currentItem.id,
        value: serializedValue,
        response_payload: currentPhase === 'checklist' ? { selected_options: Array.isArray(currentAnswer) ? currentAnswer : [] } : null,
        response_time_ms: responseTime
      };

      const res = await responderPregunta(payload);

      if (!res.success) {
        setError(res.error || 'Error al enviar respuesta');
        setIsSubmitting(false);
        return;
      }

      // Check if test is complete
      if (res.test_complete) {
        navigate('/analisis-test', { state: { session_id: sessionId } });
        return;
      }

      // Check for phase transition
      if (res.phase_transition) {
        setPhaseTransition(res.phase_transition);
        // Store next item data for after transition
        setCurrentItem(res.item);
        setCurrentPhase(res.phase);
        setCurrentIndex(res.current_index);
        setCurrentAnswer(res.answer ?? null);
        setStartTime(Date.now());
        setIsSubmitting(false);
        return;
      }

      // Move to next item
      setCurrentItem(res.item);
      setCurrentPhase(res.phase);
      setCurrentIndex(res.current_index);
      setCurrentAnswer(res.answer ?? null);
      setStartTime(Date.now());
      
    } catch (err) {
      console.error('Error submitting answer:', err);
      setError('Error al enviar respuesta. Por favor, intenta de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleContinueAfterTransition = () => {
    setPhaseTransition(null);
  };

  const handlePrevious = async () => {
    if (currentIndex <= 0 || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const res = await anteriorPregunta({ session_id: sessionId });

      if (!res.success) {
        setError(res.error || 'No se pudo volver a la pregunta anterior');
        return;
      }

      setPhaseTransition(null);
      setCurrentItem(res.item);
      setCurrentPhase(res.phase);
      setCurrentIndex(res.current_index);
      setCurrentAnswer(res.answer ?? null);
      setStartTime(Date.now());
    } catch (err) {
      console.error('Error going to previous question:', err);
      setError('Error al volver a la pregunta anterior.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveForLater = () => {
    navigate('/testintro', {
      state: {
        savedForLater: true,
        sessionId,
      },
    });
  };

  const getProgress = () => {
    return Math.round((currentIndex / totalItems) * 100);
  };

  const canSubmit = () => {
    if (currentPhase === 'checklist') {
      // Checklist allows empty answers
      return true;
    }
    return currentAnswer !== null && currentAnswer !== undefined;
  };

  // Show phase transition modal
  if (phaseTransition) {
    return <PhaseTransition nextPhase={phaseTransition} onContinue={handleContinueAfterTransition} />;
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Cargando test...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-100 p-4">
        <div className="max-w-md bg-white rounded-lg shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/testintro')}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  // No item loaded yet
  if (!currentItem) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <p className="text-gray-600">Cargando pregunta...</p>
        </div>
      </div>
    );
  }

  // Main test UI
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 px-3 py-3 md:px-4 md:py-5 flex items-center justify-center">
      <div className="max-w-3xl w-full mx-auto">
        {/* Header with progress */}
        <div className="bg-white rounded-t-2xl shadow-lg px-4 py-3 md:px-5 md:py-3">
          <div className="flex items-start justify-between gap-3 mb-3">
            <button
              onClick={handleSaveForLater}
              className="text-gray-600 hover:text-gray-800 flex items-center space-x-2 transition text-left"
            >
              <ArrowLeft className="w-4 h-4 mt-0.5 shrink-0" />
              <span className="text-xs md:text-sm font-medium leading-tight">Guardar para más tarde</span>
            </button>
            <div className="flex items-center space-x-2 shrink-0 rounded-full bg-green-50 px-3 py-1.5 border border-green-100">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-xs md:text-sm font-semibold text-gray-700">
                {currentIndex} / {totalItems}
              </span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-purple-500 to-blue-500 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${getProgress()}%` }}
            ></div>
          </div>
          <div className="flex justify-between items-center mt-2 gap-2">
            <p className="text-xs text-gray-500">Progreso: {getProgress()}%</p>
            <p className="text-[11px] md:text-xs font-semibold text-purple-600 uppercase text-right leading-tight">
              Fase: {currentPhase === 'likert' ? 'Escala de Acuerdo' : currentPhase === 'checklist' ? 'Selección Múltiple' : 'Comparación'}
            </p>
          </div>
        </div>

        {/* Question content */}
        <div className="bg-white shadow-lg px-4 py-3 md:px-5 md:py-3">
          {currentPhase === 'likert' && (
            <LikertScale
              item={currentItem}
              value={currentAnswer}
              onChange={handleAnswerChange}
              disabled={isSubmitting}
            />
          )}
          
          {currentPhase === 'checklist' && (
            <ChecklistQuestion
              item={currentItem}
              selectedOptions={currentAnswer || []}
              onChange={handleAnswerChange}
              disabled={isSubmitting}
            />
          )}
          
          {currentPhase === 'comparative' && (
            <ComparativeScale
              item={currentItem}
              value={currentAnswer}
              onChange={handleAnswerChange}
              disabled={isSubmitting}
            />
          )}
        </div>

        {/* Footer with submit button */}
        <div className="bg-white rounded-b-2xl shadow-lg px-4 py-3 md:px-5 md:py-3 border-t border-gray-100">
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handlePrevious}
              type="button"
              disabled={currentIndex <= 0 || isSubmitting}
              className={`w-full py-3 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${currentIndex > 0 && !isSubmitting ? 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 shadow-sm' : 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-100'}`}
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Anterior</span>
            </button>

            <button
              onClick={handleSubmit}
              disabled={!canSubmit() || isSubmitting}
              className={`
              w-full py-3 rounded-xl font-bold text-base md:text-lg transition-all duration-200
              ${canSubmit() && !isSubmitting
                ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transform hover:scale-[1.02]'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }
              flex items-center justify-center space-x-2
            `}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Enviando...</span>
                </>
              ) : (
                <>
                  <span>Siguiente</span>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </>
              )}
            </button>
          </div>
           
          {currentPhase === 'checklist' && (
            <p className="text-center text-xs text-gray-500 mt-2">
              Puedes continuar sin seleccionar ninguna opción si ninguna aplica
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
