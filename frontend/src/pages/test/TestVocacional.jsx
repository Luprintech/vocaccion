/**
 * TestVocacional - V2 Curated Bank Flow
 * 
 * Manages the v2 test experience with phase-driven UI:
 * - Activities phase (30 questions)
 * - Competencies phase (18 questions)
 * - Occupations phase (18 questions)
 * - Comparative phase (6 questions)
 * 
 * Backend determines version, frontend adapts.
 */

import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContextFixed';
import { startTest, responderPregunta, anteriorPregunta, getTestEstado, preloadOccupationImages } from '@/api';
import LikertScale from '@/components/test/LikertScale';
import BinaryChoice from '@/components/test/BinaryChoice';
import ComparativeScale from '@/components/test/ComparativeScale';
import PhaseTransition from '@/components/test/PhaseTransition';
import TestViewportShell from '@/components/test/TestViewportShell';
import RiasecMiniRadar from '@/components/test/RiasecMiniRadar';
import { Loader2, ArrowLeft, ChevronLeft } from 'lucide-react';

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
  const [currentPhase, setCurrentPhase] = useState('activities');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [totalItems, setTotalItems] = useState(72);
  const [phaseTransition, setPhaseTransition] = useState(null);
  
  // Answer state
  const [currentAnswer, setCurrentAnswer] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [startTime, setStartTime] = useState(Date.now());

  // Occupation images: { item_id: image_url }
  const [occupationImages, setOccupationImages] = useState({});

  // Partial RIASEC scores for the live hexagon: { R, I, A, S, E, C } 0-100
  const DIMS = ['R', 'I', 'A', 'S', 'E', 'C'];
  const [scoreAccum, setScoreAccum] = useState(() =>
    Object.fromEntries(DIMS.map((d) => [d, { raw: 0, max: 0 }]))
  );
  const partialScores = Object.fromEntries(
    DIMS.map((d) => [
      d,
      scoreAccum[d].max > 0
        ? Math.round((scoreAccum[d].raw / scoreAccum[d].max) * 100)
        : 0,
    ])
  );

  // Error state
  const [error, setError] = useState(null);

  const normalizePhase = (phase) => {
    if (phase === 'likert') return 'activities';
    if (phase === 'checklist') return 'competencies';
    return phase;
  };

  const phaseLabels = {
    activities: 'Actividades',
    competencies: 'Competencias',
    occupations: 'Ocupaciones',
    comparative: 'Comparación',
  };

  const phaseHelperCopy = {
    activities: 'Indica cuánto te identificas con cada afirmación.',
    competencies: 'Responde con sinceridad si hoy podrías realizar cada acción.',
    occupations: 'Responde de forma intuitiva si te atrae cada ocupación.',
    comparative: 'Elige la opción que más se acerque a ti.',
  };

  const warmOccupationImages = useCallback((imagesMap = {}) => {
    Object.values(imagesMap)
      .filter((url) => typeof url === 'string' && url.length > 0)
      .forEach((url) => {
        const img = new Image();
        img.src = url;
      });
  }, []);

  const preloadOccupationAssets = useCallback(async () => {
    if (!sessionId || Object.keys(occupationImages).length > 0) return;
    try {
      const r = await preloadOccupationImages(sessionId);
      if (r?.success && r?.images && typeof r.images === 'object') {
        setOccupationImages(r.images);
        warmOccupationImages(r.images);
      }
    } catch {
      // silent fallback
    }
  }, [sessionId, occupationImages, warmOccupationImages]);

  // Restore accumulated scores from localStorage when sessionId is known
  useEffect(() => {
    if (!sessionId) return;
    const saved = localStorage.getItem(`riasec_accum_${sessionId}`);
    if (saved) {
      try {
        setScoreAccum(JSON.parse(saved));
      } catch (_) {}
    }
  }, [sessionId]);

  // Persist accumulated scores to localStorage on every change
  useEffect(() => {
    if (!sessionId) return;
    localStorage.setItem(`riasec_accum_${sessionId}`, JSON.stringify(scoreAccum));
  }, [scoreAccum, sessionId]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    initializeTest();
  }, [isAuthenticated]);

  useEffect(() => {
    if (currentPhase === 'occupations') {
      preloadOccupationAssets();
    }
  }, [currentPhase, preloadOccupationAssets]);

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
      setCurrentPhase(normalizePhase(res.phase));
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
      
      const serializedValue = currentAnswer;

      const payload = {
        session_id: sessionId,
        item_id: currentItem.id,
        value: serializedValue,
        response_payload: null,
        response_time_ms: responseTime
      };

      const res = await responderPregunta(payload);

      if (!res.success) {
        setError(res.error || 'Error al enviar respuesta');
        setIsSubmitting(false);
        return;
      }

      // Accumulate partial RIASEC score for the live hexagon
      if (currentItem?.dimension) {
        const dim = currentItem.dimension;
        const weight = currentItem.weight ?? 1.0;
        const phase = currentItem.phase;
        let contribution = 0;
        let maxContrib = weight;
        if (phase === 'activities' || phase === 'likert') {
          contribution = ((serializedValue - 1) / 4) * weight;
        } else if (phase === 'competencies' || phase === 'occupations' || phase === 'checklist') {
          contribution = serializedValue * weight;
        } else if (phase === 'comparative') {
          contribution = ((serializedValue + 1) / 2) * weight;
          const dimB = currentItem.dimension_b;
          if (dimB) {
            const invContrib = (1 - (serializedValue + 1) / 2) * weight;
            setScoreAccum((prev) => ({
              ...prev,
              [dimB]: { raw: (prev[dimB]?.raw ?? 0) + invContrib, max: (prev[dimB]?.max ?? 0) + maxContrib },
            }));
          }
        }
        setScoreAccum((prev) => ({
          ...prev,
          [dim]: { raw: (prev[dim]?.raw ?? 0) + contribution, max: (prev[dim]?.max ?? 0) + maxContrib },
        }));
      }

      // Check if test is complete
      if (res.test_complete) {
        localStorage.removeItem(`riasec_accum_${sessionId}`);
        navigate('/analisis-test', { state: { session_id: sessionId } });
        return;
      }

      // Preload occupation images when entering occupations phase
      if ((res.phase_transition === 'occupations' || res.phase === 'occupations') && Object.keys(occupationImages).length === 0) {
        preloadOccupationImages(sessionId)
          .then((r) => {
            if (r?.success && r?.images && typeof r.images === 'object') {
              setOccupationImages(r.images);
              warmOccupationImages(r.images);
            }
          })
          .catch(() => {});
      }

      // Check for phase transition
      if (res.phase_transition || res.early_stopped) {
        // early_stopped uses special 'early_stop' key so PhaseTransition shows the right message
        setPhaseTransition(res.early_stopped ? 'early_stop' : normalizePhase(res.phase_transition));
        // Store next item data for after transition
        setCurrentItem(res.item);
        setCurrentPhase(normalizePhase(res.phase));
        setCurrentIndex(res.current_index);
        setCurrentAnswer(res.answer ?? null);
        setStartTime(Date.now());
        setIsSubmitting(false);
        return;
      }

      // Move to next item
      setCurrentItem(res.item);
      setCurrentPhase(normalizePhase(res.phase));
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
      setCurrentPhase(normalizePhase(res.phase));
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

  const getQuestionCounter = () => {
    return `${Math.min(currentIndex + 1, totalItems)} / ${totalItems}`;
  };

  const canSubmit = () => {
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
    <TestViewportShell
      className="min-h-screen md:min-h-0"
      contentClassName="overflow-y-auto py-3"
      fillHeight={false}
      contentGrow={false}
      centered={true}
      header={(
        <>
          {/* Top row: save button only */}
          <div className="flex items-center justify-between gap-3 mb-3">
            <button
              onClick={handleSaveForLater}
              className="text-gray-600 hover:text-gray-800 flex items-center space-x-2 transition text-left"
            >
              <ArrowLeft className="w-4 h-4 mt-0.5 shrink-0" />
              <span className="text-xs md:text-sm font-medium leading-tight">Guardar para más tarde</span>
            </button>
            <p className="text-[11px] md:text-xs font-semibold text-purple-600 uppercase leading-tight shrink-0">
              Fase: {phaseLabels[currentPhase] || currentPhase}
            </p>
          </div>

          {/* Progress bar + radar side by side */}
          <div className="flex items-center gap-4">
            <div className="flex-1 min-w-0">
              <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-purple-500 to-blue-500 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${getProgress()}%` }}
                />
              </div>
              <div className="flex justify-between items-center mt-1.5 gap-2">
                <p className="text-xs text-gray-500">Progreso: {getProgress()}%</p>
              </div>
              <p className="mt-1 text-[11px] md:text-xs text-gray-600 leading-snug">
                {phaseHelperCopy[currentPhase]}
              </p>
            </div>
            <div className="shrink-0">
              <RiasecMiniRadar scores={partialScores} size="sm" />
            </div>
          </div>
        </>
      )}
      footer={(
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
      )}
    >
      <div className="flex items-start">
        {currentPhase === 'activities' && (
          <LikertScale
            item={currentItem}
            value={currentAnswer}
            onChange={handleAnswerChange}
            disabled={isSubmitting}
          />
        )}

        {(currentPhase === 'competencies' || currentPhase === 'occupations') && (
          <BinaryChoice
            item={currentItem}
            value={currentAnswer}
            onChange={handleAnswerChange}
            disabled={isSubmitting}
            imageUrl={currentPhase === 'occupations' ? (occupationImages[currentItem?.id] ?? null) : null}
            labels={currentPhase === 'competencies'
              ? ['No, todavía no', 'Sí, podría hacerlo']
              : ['No me atrae', 'Me atrae']}
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
    </TestViewportShell>
  );
}
