/**
 * Componente: TestVocacional
 * ---------------------------------------------
 * Versión 4.3: Rediseño Visual + Flujo de Reanudación (Diseño TestIntro)
 */

import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContextFixed";
import {
  ArrowRight,
  ArrowLeft,
  Save,
  RotateCcw,
  CheckCircle,
  AlertCircle,
  Award,
  RefreshCw,
  Lightbulb,
  GraduationCap,
  Sparkles
} from "lucide-react";
import ConfirmStartModal from "../../components/ConfirmStartModal";
import PantallaEsperaResultados from "../../components/PantallaEsperaResultados";
import TransitionModal from "../../components/TransitionModal";
import ConvergenceWidget from "../../components/ConvergenceWidget";

export default function TestVocacional() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Estados de la aplicación
  const [viewState, setViewState] = useState('loading'); // loading, landing, active, finished, error
  const [sessionData, setSessionData] = useState(null); // Datos temporales para el landing

  // Estado del Test Activo
  const [sessionId, setSessionId] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(20);

  // Historiales
  const [questionHistory, setQuestionHistory] = useState([]);
  const [answerHistory, setAnswerHistory] = useState([]);

  // Premium Features State
  const [transitionData, setTransitionData] = useState(null); // { insight: string }
  const [showTransition, setShowTransition] = useState(false);
  const [semanticAreas, setSemanticAreas] = useState({});
  const [showReasoning, setShowReasoning] = useState(false); // Toggle para botón "Por qué"

  // UI States
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [showStartOverModal, setShowStartOverModal] = useState(false);
  const [analyzingResults, setAnalyzingResults] = useState(false);
  const [loadingImages, setLoadingImages] = useState(false); // Nuevo estado para precarga de imágenes

  // Ref para idempotencia
  const lastReqRef = useRef(null);

  // Estado para Widget Draggable
  const [widgetPos, setWidgetPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return;
      setWidgetPos({
        x: e.clientX - dragStartRef.current.x,
        y: e.clientY - dragStartRef.current.y
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const handleWidgetMouseDown = (e) => {
    // Evitar drag si interactúa con algo dentro del widget (opcional, pero buena práctica)
    // if (e.target.closest('button')) return; 
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX - widgetPos.x,
      y: e.clientY - widgetPos.y
    };
  };

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    checkSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 1. Verificar sesión al cargar
  const checkSession = async () => {
    setViewState('loading');
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/test/iniciar`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      if (!res.ok) throw new Error("Error al conectar con el servidor");

      const data = await res.json();

      if (data.success) {
        if (data.estado === 'completado') {
          setViewState('finished');
          return;
        }

        // Si hay progreso (índice > 0), mostramos Landing de "Reanudar"
        if (data.current_index > 0) {
          setSessionData(data);
          setViewState('landing');
        } else {
          // Si es nuevo (índice 0), iniciamos directamente
          initializeActiveTest(data);
        }
      } else {
        throw new Error(data.error || "Error desconocido");
      }
    } catch (err) {
      setError(err.message);
      setViewState('error');
    }
  };

  // 2. Iniciar el test con los datos recibidos
  const initializeActiveTest = (data) => {
    setSessionId(data.session_id);
    setCurrentQuestion(data.pregunta_actual);
    setCurrentIndex(data.current_index);
    setTotalQuestions(data.total_questions || 20);

    // Historial
    if (data.questions && Array.isArray(data.questions) && data.questions.length > 0) {
      setQuestionHistory(data.questions);
    } else {
      setQuestionHistory([data.pregunta_actual]);
    }

    setViewState('active');
  };

  // 3. Acción: Empezar de nuevo (Abre modal)
  const handleStartOver = () => {
    setShowStartOverModal(true);
  };

  // 3.1 Acción confirmada: Borrar sesión y reiniciar
  const confirmStartOverAction = async () => {
    setShowStartOverModal(false);
    setViewState('loading');
    try {
      const token = localStorage.getItem("token");
      // 1. Borrar sesión
      await fetch(`${API_URL}/user/test/clear`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });

      // 2. Iniciar nuevo
      checkSession();
    } catch (err) {
      setError("No se pudo reiniciar el test.");
      setViewState('error');
    }
  };

  // 4. Acción: Continuar
  const handleResume = () => {
    if (sessionData) {
      initializeActiveTest(sessionData);
    }
  };

  // 5. Acción: Guardar y Salir
  // 5. Acción: Guardar y Salir
  const handleSaveAndExit = () => {
    navigate("/welcome");
  };

  // 6. Acción: Continuar desde Modal de Transición
  const handleTransitionContinue = () => {
    setShowTransition(false);
    // El siguiente paso ya está cargado en currentQuestion, solo revelamos UI
  };

  const handleOptionSelect = (value) => {
    if (generating) return;
    setSelectedOption(value);
  };

  const handleNext = async () => {
    if (!selectedOption || generating) return;

    // IDEMPOTENCIA: Generar ID único para esta petición
    const requestId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    lastReqRef.current = requestId;

    setGenerating(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      const isEditing = currentIndex < (questionHistory.length - 1); // Definir isEditing AQUÍ

      // PAYLOAD EXACTO SOLICITADO
      const payload = {
        session_id: sessionId,
        pregunta_id: currentQuestion.id,
        respuesta: selectedOption,
        editar: isEditing,
        request_id: requestId
      };

      const res = await fetch(`${API_URL}/test/siguiente-pregunta`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      // Verificar respuesta obsoleta
      if (data.request_id && data.request_id !== lastReqRef.current) {
        return;
      }

      if (!data.success) {
        throw new Error(data.error || "Error al obtener siguiente pregunta");
      }

      // Si el backend dice que ha finalizado
      if (data.finalizado) {
        try {
          setAnalyzingResults(true);
          const analysisRes = await fetch(`${API_URL}/test/analizar-respuestas`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ session_id: sessionId }),
          });

          if (analysisRes.ok) {
            navigate("/resultados");
          } else {
            navigate("/resultados");
          }
        } catch (e) {
          navigate("/resultados");
        }
        return;
      }




      // Actualizar preguntas
      if (data.pregunta) {
        // PREMIUM: Gestión de Convergence Data
        if (data.semantic_areas) {
            setSemanticAreas(data.semantic_areas);
        }

        // PREMIUM: Gestión de Transition Insight
        if (data.transition_insight) {
            setTransitionData(data.transition_insight);
            setShowTransition(true);
        }

        const nextQuestion = data.pregunta;
        
        // --- PRECARGA DE IMÁGENES (Premium UI) - Backend Pexels ---
        if (nextQuestion.tipo === 'imagen' && nextQuestion.opciones) {
            setLoadingImages(true);
            setGenerating(true); // Mantener generating visualmente

            // Preparar promesas de fetch al backend
            const token = localStorage.getItem("token");
            const imagePromises = nextQuestion.opciones.slice(0, 4).map(async (opcion) => {
                try {
                    const res = await fetch(`${API_URL}/test/generar-imagen`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`,
                        },
                        body: JSON.stringify({ profesion: opcion }),
                    });
                    
                    if (!res.ok) throw new Error("Backend error");
                    
                    const dataImg = await res.json();
                    return dataImg.success ? dataImg.imagenUrl : null;
                } catch (e) {
                    return null; 
                }
            });

            // Esperar a todas (con timeout de seguridad 25s)
            const timeoutPromise = new Promise(resolve => setTimeout(resolve, 25000));
            
            Promise.race([Promise.all(imagePromises), timeoutPromise]).then((results) => {
                // Verificar resultados y rellenar fallbacks
                const finalUrls = (Array.isArray(results) ? results : []).map(url => 
                    url || 'https://placehold.co/800x600?text=Imagen+No+Disponible'
                );

                // Asegurar 4 imágenes
                while(finalUrls.length < 4) {
                    finalUrls.push('https://placehold.co/800x600?text=Imagen+No+Disponible');
                }

                // Guardamos las URLs generadas
                nextQuestion.cachedImages = finalUrls;

                // Actualizamos el estado de la pregunta
                updateStateWithQuestion(data, nextQuestion, true); 
                
                // Forzamos un pequeño delay
                setTimeout(() => {
                    setLoadingImages(false);
                    setGenerating(false);
                }, 100);
            });
        } else {
            updateStateWithQuestion(data, nextQuestion);
        }
      }

    } catch (err) {
      setError(err.message);
      setGenerating(false);
      setLoadingImages(false);
    } finally {
       // El finally original limpiaba generating, pero ahora lo controlamos manualmente en el flujo de imagen
       if (lastReqRef.current === requestId && !loadingImages) {
          // setGenerating(false); // Comentado porque lo manejamos arriba
       }
    }
  };

  // Helper para actualizar el estado una vez listo (o si es texto)
  const updateStateWithQuestion = (data, nextQuestion, keepGenerating = false) => {
      // Solo desactivamos generating si no nos piden mantenerlo
      if (!keepGenerating) {
        setGenerating(false);
      }
      
      if (data.regenerada) {
        setCurrentQuestion(nextQuestion);
        const newHistory = [...questionHistory];
        newHistory[currentIndex] = nextQuestion;
        setQuestionHistory(newHistory);
        setSelectedOption(null);
        setShowReasoning(false); 
      } else {
        let newQHistory = [...questionHistory];
        let newAHistory = [...answerHistory];

        if (currentIndex < (questionHistory.length - 1)) {
           newQHistory = newQHistory.slice(0, currentIndex + 1);
           newAHistory = newAHistory.slice(0, currentIndex);
        }

        newAHistory[currentIndex] = selectedOption;
        setAnswerHistory(newAHistory);

        setCurrentQuestion(nextQuestion);
        setCurrentIndex(data.current_index);

        newQHistory.push(nextQuestion);
        setQuestionHistory(newQHistory);

        setSelectedOption(null);
        setShowReasoning(false); 
      }
  };

  const handleBack = () => {
    if (generating) return;
    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      setCurrentIndex(prevIndex);
      setCurrentQuestion(questionHistory[prevIndex]);
      setSelectedOption(answerHistory[prevIndex] || null);
    }
  };

  if (viewState === 'loading') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-gray-500 font-medium">Cargando...</p>
      </div>
    );
  }

  if (viewState === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md text-center">
          <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={32} />
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">Algo salió mal</h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <button onClick={checkSession} className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition w-full">
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  // VISTA: ANALIZANDO RESULTADOS (Pantalla de Espera)
  // Se muestra si el estado explícito es analyzingResults O si estamos generando respuesta en la última pregunta
  const isLastQuestion = currentIndex + 1 >= totalQuestions;
  if (analyzingResults || (generating && isLastQuestion)) {
    return <PantallaEsperaResultados />;
  }

  // VISTA: TEST FINALIZADO (Diseño TestIntro)
  if (viewState === 'finished') {
    return (
      <section className="relative w-full min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-green-50 overflow-hidden px-4 py-16">
        {/* Círculos decorativos */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-green-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>

        <div className="relative bg-white shadow-2xl rounded-3xl max-w-3xl w-full px-10 py-12 text-center space-y-6 z-10">

          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-50 border border-green-200 shadow-lg">
            <Sparkles className="w-4 h-4 text-green-600" />
            <span className="text-sm font-semibold text-green-600">Has completado el test</span>
          </div>

          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight">
            <span className="bg-gradient-to-r from-purple-600 to-green-600 bg-clip-text text-transparent">Ya realizaste el test</span>
          </h1>

          <p className="text-lg text-gray-600 leading-relaxed">
            Ya tenemos resultados guardados para tu perfil. Puedes verlos ahora o volver a realizar el test si quieres actualizar tu informe.
          </p>

          <div className="flex flex-col md:flex-row gap-4 justify-center mt-6">
            <button
              onClick={() => navigate('/resultados')}
              className="bg-yellow-500 hover:bg-yellow-600 text-white px-8 py-3 rounded-full font-semibold shadow-md transition"
            >
              Ver resultados
            </button>
            <button
              onClick={handleStartOver}
              className="bg-green-500 hover:bg-green-600 text-white px-8 py-3 rounded-full font-semibold shadow-md transition"
            >
              Reiniciar test
            </button>
          </div>
        </div>
      </section>
    );
  }

  // VISTA: LANDING / REANUDAR (Diseño TestIntro)
  if (viewState === 'landing') {
    return (
      <section className="relative w-full min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-green-50 overflow-hidden px-4 py-16">
        {/* Círculos decorativos */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-green-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>

        <div className="relative bg-white shadow-2xl rounded-3xl max-w-3xl w-full px-10 py-12 text-center space-y-6 z-10">

          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-50 border border-yellow-200 shadow-lg">
            <RefreshCw className="w-4 h-4 text-yellow-600" />
            <span className="text-sm font-semibold text-yellow-600">
              ¡Tienes un test pendiente!
            </span>
          </div>

          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight">
            <span className="bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-transparent">
              Retoma donde lo dejaste
            </span>
          </h1>

          <p className="text-lg text-gray-600 leading-relaxed">
            Ya habías comenzado un test vocacional. Puedes continuarlo desde
            la última pregunta respondida o empezar uno nuevo.
          </p>

          <div className="flex flex-col md:flex-row gap-4 justify-center mt-6">
            <button
              onClick={handleResume}
              className="bg-green-500 hover:bg-green-600 text-white px-8 py-3 rounded-full font-semibold shadow-md transition"
            >
              Continuar test
            </button>
            <button
              onClick={handleStartOver}
              className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-8 py-3 rounded-full font-semibold shadow-md transition"
            >
              Empezar de nuevo
            </button>
          </div>

          {/* Iconos decorativos */}
          <div className="absolute top-8 left-8 opacity-10 animate-float hidden md:block">
            <Lightbulb className="w-12 h-12 text-purple-500" />
          </div>
          <div className="absolute bottom-8 right-8 opacity-10 animate-float animation-delay-3000 hidden md:block">
            <GraduationCap className="w-16 h-16 text-green-500" />
          </div>
        </div>
      </section>
    );
  }

  // VISTA ACTIVA (Test)
  const progress = Math.round(((currentIndex) / totalQuestions) * 100);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 pt-6 pb-6 px-4 flex flex-col items-center">

      {/* Texto motivacional */}
      <div className="text-center text-gray-500/80 text-sm mb-2 font-medium animate-fadeIn flex items-center justify-center gap-2">
        <Sparkles size={18} className="text-amber-400" />
        <p>Este test te ayudará a descubrir tu camino profesional. Responde con sinceridad.</p>
        <Sparkles size={18} className="text-amber-400" />
      </div>

      {/* Barra de progreso y Controles Superiores */}
      <div className="w-full max-w-5xl flex flex-col gap-2 mb-4">
        {/* Barra */}
        <div className="w-full h-3 rounded-full bg-gray-200/50 overflow-hidden backdrop-blur-sm shadow-inner">
          <div
            className="h-full bg-gradient-to-r from-purple-600 to-green-500 transition-all duration-500 ease-out shadow-[0_0_10px_rgba(147,51,234,0.3)]"
            style={{ width: `${progress}%` }}
          ></div>
        </div>

        {/* Info y Botón Salir */}
        <div className="flex justify-between items-center px-1">
          <span className="text-sm font-semibold text-gray-500">
            Pregunta {currentIndex + 1} de {totalQuestions}
          </span>

          <button
            onClick={handleSaveAndExit}
            className="flex items-center gap-2 px-4 py-1.5 bg-white border border-purple-300 rounded-full text-sm font-medium text-gray-600 hover:text-purple-700 hover:bg-gradient-to-r hover:from-purple-50 hover:to-green-50 hover:scale-[1.03] transition-all shadow-sm group cursor-pointer"
          >
            <Save size={18} className="text-purple-400 group-hover:text-purple-600 transition-colors" />
            <span>Guardar y salir</span>
          </button>
        </div>
      </div>

      {/* Tarjeta Principal */}
      <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl w-full max-w-5xl overflow-hidden relative min-h-[500px] flex flex-col transition-all duration-500 animate-fadeInUp border border-white/50">
 
        {/* Loading Overlay Moderno (Incluye carga de imágenes) */}
        {(generating || loadingImages) && (
          <div className="absolute inset-0 bg-white/95 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-8 text-center animate-fadeIn">
            <div className="relative mb-6">
              <div className="w-20 h-20 border-4 border-purple-100 rounded-full animate-ping absolute inset-0"></div>
              <div className="w-20 h-20 border-4 border-purple-600 border-t-transparent rounded-full animate-spin relative z-10"></div>
              <Sparkles className="w-8 h-8 text-purple-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-pulse" />
            </div>

            <h3 className="text-2xl font-bold text-gray-800 mb-2 animate-slideUp">
              {currentIndex === totalQuestions
                ? "Analizando tu perfil..."
                : "Procesando respuesta..."}
            </h3>

            <p className="text-gray-500 max-w-xs animate-slideUp delay-100">
               {currentIndex === totalQuestions
                 ? "Estamos conectando tus intereses con las mejores oportunidades laborales."
                 : "Estamos adaptando el test a tus intereses."}
            </p>
          </div>
        )}

        {/* Contenido (Solo visible si NO estamos cargando imágenes para evitar "pop-in") */}
        <div className={`p-8 md:p-12 flex-1 flex flex-col transition-opacity duration-300 ${loadingImages ? 'opacity-0' : 'opacity-100'}`}>

          {/* Contenedor animado para pregunta y opciones */}
          <div key={currentIndex} className="flex-1 flex flex-col animate-[fadeInUp_0.4s_ease-out]">

            <div className="mb-8">
              <div className="flex items-start justify-between gap-4">
                <h2 className="text-xl md:text-2xl font-bold text-gray-800 leading-snug">
                  {currentQuestion?.texto}
                </h2>
                
                {/* PREMIUM: Botón Por Qué */}
                {currentQuestion?.razonamiento && (
                  <div className="relative">
                    <button
                      onClick={() => setShowReasoning(!showReasoning)}
                      className="p-2 rounded-full hover:bg-purple-50 text-purple-400 hover:text-purple-600 transition-colors cursor-pointer"
                      title="¿Por qué me preguntan esto?"
                    >
                      <AlertCircle size={20} />
                    </button>
                    
                    {showReasoning && (
                      <div className="absolute right-0 top-10 w-64 bg-white p-4 rounded-xl shadow-xl border border-purple-100 z-20 animate-fadeIn">
                        <div className="text-xs font-bold text-purple-600 uppercase mb-1">Motivo de la pregunta</div>
                        <p className="text-sm text-gray-600 leading-relaxed">
                          {currentQuestion.razonamiento}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4 flex-1">
              {/* PREMIUM: Grid de Imágenes si es tipo imagen */}
              {currentQuestion?.tipo === 'imagen' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4">
                  {currentQuestion.opciones.slice(0, 4).map((opcion, idx) => {
                    const isSelected = selectedOption === opcion;
                    // Generación semántica usando Backend (Pexels) o Fallback
                    // Usamos la URL precargada si existe (DEBERÍA EXISTIR SIEMPRE por la precarga)
                    const imgUrl = currentQuestion.cachedImages && currentQuestion.cachedImages[idx]
                        ? currentQuestion.cachedImages[idx]
                        : `https://placehold.co/800x600?text=${encodeURIComponent(opcion)}`;

                    return (
                      <button
                        key={idx}
                        onClick={() => handleOptionSelect(opcion)}
                        className={`
                          group relative w-full h-40 rounded-2xl overflow-hidden shadow-sm transition-all duration-500 cursor-pointer
                          ${isSelected ? 'ring-4 ring-purple-600 shadow-2xl scale-[1.02]' : 'hover:shadow-xl hover:scale-[1.01]'}
                        `}
                      >
                         <img 
                            src={imgUrl} 
                            alt={opcion} 
                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                            loading="lazy"
                         />
                         
                         {/* Gradiente y Texto */}
                         <div className={`absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex flex-col justify-end p-6 transition-all duration-300 ${isSelected ? 'opacity-100' : 'opacity-90'}`}>
                            <p className="text-white font-bold text-lg md:text-xl text-left leading-tight drop-shadow-md">
                                {opcion}
                            </p>
                         </div>

                         {/* Indicador de selección */}
                         {isSelected && (
                           <div className="absolute top-4 right-4 bg-purple-600 text-white p-2 rounded-full shadow-lg animate-bounceIn">
                             <CheckCircle size={20} strokeWidth={3} />
                           </div>
                         )}
                      </button>
                    );
                  })}
                </div>
              ) : (
                // Renderizado normal de texto
                currentQuestion?.opciones.map((opcion, idx) => {
                  const isSelected = selectedOption === opcion;
                  const isEscape = opcion === '[EXPLORAR_OTRAS_OPCIONES]';
                  // ... (resto del código de opción normal, omitido en replacement pero mantenido en lógica)
                  
                  // Renderizar opción escape con estilo diferente
                  if (isEscape) {
                    return (
                      <button
                        key={idx}
                        onClick={() => handleOptionSelect('[EXPLORAR_OTRAS_OPCIONES]')}
                        className={`
                          w-full text-center p-4 rounded-xl border-2 border-dashed transition-all duration-200 mt-4 cursor-pointer
                          ${selectedOption === '[EXPLORAR_OTRAS_OPCIONES]'
                            ? 'border-orange-500 bg-orange-50 text-orange-900 shadow-md'
                            : 'border-gray-300 text-gray-600 hover:text-orange-700 hover:border-orange-400 hover:bg-orange-50'}
                        `}
                      >
                        <div className="flex items-center justify-center gap-2">
                          <RefreshCw size={16} className="text-orange-500" />
                          <span className="text-sm font-medium">
                            Ninguna de las anteriores / Prefiero otras opciones
                          </span>
                        </div>
                      </button>
                    );
                  }
  
                  return (
                    <button
                      key={idx}
                      onClick={() => handleOptionSelect(opcion)}
                      className={`
                        w-full text-left p-3 rounded-xl border-2 transition-all duration-300 group relative overflow-hidden cursor-pointer
                        ${isSelected
                          ? 'border-purple-500 bg-purple-50 shadow-md ring-2 ring-purple-200'
                          : 'border-gray-100 bg-white hover:border-purple-200 hover:bg-purple-50 hover:shadow-md'}
                      `}
                    >
                      <div className="flex items-center justify-between relative z-10">
                        <span className={`text-base font-medium transition-colors ${isSelected ? 'text-purple-900' : 'text-gray-700 group-hover:text-purple-800'}`}>
                          {opcion}
                        </span>
                        <div className={`
                          w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300
                          ${isSelected ? 'border-purple-600 bg-purple-600 scale-110' : 'border-gray-300 group-hover:border-purple-400'}
                        `}>
                          {isSelected && <CheckCircle size={14} className="text-white" />}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}

              {/* Opción Escape (SIEMPRE VISIBLE, incluso en imágenes) - ESTILO UNIFICADO */}
              {(currentQuestion?.tipo === 'imagen' || !currentQuestion?.opciones.includes('[EXPLORAR_OTRAS_OPCIONES]')) && (
                <button
                  onClick={() => handleOptionSelect('[EXPLORAR_OTRAS_OPCIONES]')}
                  className={`
                   w-full text-center p-4 rounded-xl border-2 border-dashed transition-all duration-200 mt-6 text-sm flex items-center justify-center gap-2 cursor-pointer
                   ${selectedOption === '[EXPLORAR_OTRAS_OPCIONES]'
                      ? 'border-orange-500 bg-orange-50 text-orange-900 shadow-md'
                      : 'border-gray-300 text-gray-600 hover:text-orange-700 hover:border-orange-400 hover:bg-orange-50'}
                 `}
                >
                   <RefreshCw size={18} className="text-orange-500" />
                   <span className="font-medium">Ninguna de las anteriores / Prefiero otras opciones</span>
                </button>
              )}
            </div>
          </div>

          {/* Botones de Navegación */}
          <div className="flex items-center justify-between mt-10 pt-6 border-t border-gray-100">
            <button
              onClick={handleBack}
              disabled={currentIndex === 0 || generating}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer
                ${currentIndex === 0
                  ? 'text-gray-300 cursor-not-allowed'
                  : 'text-gray-500 hover:text-purple-600 hover:bg-purple-50'}
              `}
            >
              <ArrowLeft size={18} />
              Anterior
            </button>

            <button
              onClick={handleNext}
              disabled={!selectedOption || generating}
              className={`
                group flex items-center gap-2 px-8 py-3.5 rounded-full font-bold text-white shadow-lg transition-all duration-300 transform cursor-pointer
                ${!selectedOption || generating
                  ? 'bg-gray-200 cursor-not-allowed shadow-none text-gray-400'
                  : 'bg-gradient-to-r from-purple-600 to-green-600 hover:shadow-xl hover:scale-[1.03] hover:shadow-purple-200/50'}
              `}
            >
              {generating ? 'Procesando...' : 'Siguiente'}
              {!generating && (
                <ArrowRight size={20} className="transition-transform duration-300 group-hover:translate-x-1" />
              )}
            </button>
          </div>

        </div>
      </div>

      <ConfirmStartModal
        isOpen={showStartOverModal}
        onClose={() => setShowStartOverModal(false)}
        onConfirm={confirmStartOverAction}
      />

      {/* PREMIUM: Modal de Transición */}
      <TransitionModal
        isOpen={showTransition}
        insight={transitionData}
        onContinue={handleTransitionContinue}
      />

      {/* PREMIUM: Widget de Convergencia (Solo Desktop por espacio) */}
      {/* PREMIUM: Widget de Convergencia (Solo Desktop por espacio) */}
      <div 
        className="hidden lg:block fixed top-48 right-28 w-64 z-50 cursor-grab active:cursor-grabbing hover:shadow-xl transition-shadow rounded-xl select-none"
        style={{ transform: `translate(${widgetPos.x}px, ${widgetPos.y}px)` }}
        onMouseDown={handleWidgetMouseDown}
      >
         <ConvergenceWidget areas={semanticAreas} />
      </div>

    </div>
  );
}
