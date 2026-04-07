/**
 * Componente: TestIntro
 * ---------------------------------------------
 * Pantalla de introducción al test vocacional.
 *
 * 🔹 Verifica si el usuario está autenticado; si no, lo redirige al login.
 * 🔹 Presenta un mensaje motivacional e información inicial del test.
 * 🔹 Contiene un botón “Empezar Test” que lleva a la ruta `/test`.
 * 🔹 Utiliza animaciones suaves y fondos decorativos con Tailwind.
 *
 * Objetivo: servir como punto de partida visual y emocional antes de realizar el test.
 *
 * 💾 Relación con backend:
 * No tiene relación directa con el backend.
 * Solo comprueba el estado de autenticación del usuario (controlado desde el backend de Laravel),
 * pero no realiza llamadas a la API ni consume datos.
 */

import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContextFixed";
import { getProfile } from "../../api";
import ConfirmStartModal from '@/components/ConfirmStartModal';
import { Sparkles, Lightbulb, GraduationCap, RefreshCw } from "lucide-react";

export default function TestIntro() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [testPendiente, setTestPendiente] = useState(false);
  const [testFinalizado, setTestFinalizado] = useState(false);
  const [loading, setLoading] = useState(true);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [inlineMessage, setInlineMessage] = useState(null);
  
  // V2: Age group selection
  const [selectedAgeGroup, setSelectedAgeGroup] = useState(null);
  const [showAgeSelector, setShowAgeSelector] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [profileAge, setProfileAge] = useState(null);
  const [showAgeConfirmation, setShowAgeConfirmation] = useState(false);

  useEffect(() => {
    if (location.state?.savedForLater) {
      setInlineMessage({
        type: 'success',
        text: 'Tu progreso se ha guardado. Puedes continuar el test cuando quieras o empezarlo de nuevo.',
      });
    }
  }, [location.state]);

  useEffect(() => {
    async function comprobarSesion() {
      try {
        const profileRes = await getProfile().catch(() => null);
        const profile = profileRes?.data || null;
        const birthDate = profile?.fecha_nacimiento || null;
        const nombre = profile?.nombre || '';

        if (nombre) setProfileName(nombre);
        if (birthDate) {
          const age = calculateAge(birthDate);
          if (age !== null) {
            setProfileAge(age);
            setSelectedAgeGroup(mapAgeToGroup(age));
          }
        }

        const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";
        const token = localStorage.getItem("token");
        if (!token) return;

        // Consulta el estado real del motor RIASEC (vocational_sessions).
        // Read-only: no crea sesión ni llama a Gemini.
        const res = await fetch(`${API_URL}/test/estado`, {
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, Accept: "application/json" },
        }).catch(() => null);

        if (!res || !res.ok) return;

        const data = await res.json().catch(() => null);
        if (!data) return;

        if (data.estado === 'completado') {
          setTestFinalizado(true);
          setTestPendiente(false);
        } else if (data.estado === 'en_progreso') {
          setTestPendiente(true);
          setTestFinalizado(false);
        } else {
          // estado === 'nuevo' — no hay test guardado
          setTestPendiente(false);
          setTestFinalizado(false);
        }
      } catch (error) {
        console.error("Error al comprobar sesión de test:", error);
      } finally {
        setLoading(false);
      }
    }

    comprobarSesion();
  }, []);

  const handleStart = () => {
    setInlineMessage(null);

    if (profileAge !== null && !testPendiente) {
      setShowAgeConfirmation(true);
      return;
    }

    if (!selectedAgeGroup && !testPendiente) {
      setShowAgeSelector(true);
    } else {
      navigate("/test", { state: { ageGroup: selectedAgeGroup } });
    }
  };

  const handleConfirmProfileAge = () => {
    setInlineMessage(null);
    setShowAgeConfirmation(false);
    navigate("/test", { state: { ageGroup: selectedAgeGroup } });
  };

  const handleRejectProfileAge = () => {
    setInlineMessage(null);
    setShowAgeConfirmation(false);
    setShowAgeSelector(true);
  };
  
  const handleAgeGroupSelect = (ageGroup) => {
    setInlineMessage(null);
    setSelectedAgeGroup(ageGroup);
    setShowAgeSelector(false);
    // Navigate to test with age group
    navigate("/test", { state: { ageGroup } });
  };
  const openConfirm = () => setConfirmOpen(true);
  const cancelConfirm = () => setConfirmOpen(false);

  // Ejecutar reinicio: llama al endpoint clear y limpia localStorage
  const confirmRestart = async () => {
    setConfirmLoading(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";
      const token = localStorage.getItem("token");

      const res = await fetch(`${API_URL}/user/test/clear`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        try { localStorage.removeItem('test-progress'); } catch (e) { }
        try { localStorage.removeItem('result'); } catch (e) { }
        try { localStorage.setItem('objetivo_changed', Date.now().toString()); } catch (e) { }
        try { localStorage.setItem('results_changed', Date.now().toString()); } catch (e) { }

        setTestPendiente(false);
        setTestFinalizado(false);
        setConfirmOpen(false);
        setSelectedAgeGroup(profileAge !== null ? mapAgeToGroup(profileAge) : null);
        setShowAgeSelector(profileAge === null);
        setShowAgeConfirmation(profileAge !== null);
        setInlineMessage({
          type: 'success',
          text: 'Tu test anterior se ha eliminado correctamente. Ya puedes empezar uno nuevo.',
        });
      } else {
        const err = await res.json().catch(() => null);
        console.error('Error clearing results', err);
        setInlineMessage({
          type: 'error',
          text: 'No se pudieron borrar los resultados. Intenta de nuevo.',
        });
      }
    } catch (err) {
      console.error(err);
      setInlineMessage({
        type: 'error',
        text: 'Error al reiniciar el test.',
      });
    } finally {
      setConfirmLoading(false);
    }
  };

  if (!isAuthenticated) {
    navigate("/login");
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-green-50">
        <div className="bg-white p-8 rounded-2xl shadow-lg animate-pulse">
          <div className="w-10 h-10 border-4 border-purple-300 border-t-purple-600 rounded-full mx-auto animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <>
      <section className="relative w-full min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-green-50 overflow-hidden px-4 py-10 md:py-14">
        {/* Círculos decorativos */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-green-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>

        <div className={`relative bg-white shadow-2xl rounded-3xl w-full text-center space-y-6 z-10 transition-all duration-300 ${testPendiente || testFinalizado ? 'max-w-5xl px-8 md:px-14 py-12 md:py-14' : 'max-w-3xl px-10 py-12'}`}>
          {inlineMessage && (
            <div className={`rounded-2xl px-5 py-4 text-sm font-medium border ${inlineMessage.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
              {inlineMessage.text}
            </div>
          )}

          {testPendiente ? (
            <>
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
                Tienes un test guardado en curso. Puedes retomarlo desde la última
                respuesta guardada o empezar uno nuevo desde cero.
              </p>

              <div className="flex flex-col md:flex-row gap-4 justify-center mt-6">
                <button
                  onClick={handleStart}
                  className="bg-green-500 hover:bg-green-600 text-white px-8 py-3 rounded-full font-semibold shadow-md transition cursor-pointer"
                >
                  Continuar test
                </button>
                <button
                  onClick={openConfirm}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-8 py-3 rounded-full font-semibold shadow-md transition cursor-pointer"
                >
                  Empezar de nuevo
                </button>
              </div>

            </>
          ) : testFinalizado ? (
            <>
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
                  onClick={() => setConfirmOpen(true)}
                  className="bg-green-500 hover:bg-green-600 text-white px-8 py-3 rounded-full font-semibold shadow-md transition"
                >
                  {confirmLoading ? 'Procesando...' : 'Reiniciar test'}
                </button>
              </div>

            </>
          ) : (
            <>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-purple-100 shadow-lg animate-float">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-semibold text-purple-600">
                  ¡Estás a punto de comenzar!
                </span>
              </div>

              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
                <span className="bg-gradient-to-r from-purple-600 to-green-600 bg-clip-text text-transparent">
                  Este es el primer paso hacia tu futuro
                </span>
              </h1>

              <p className="text-lg text-gray-600 leading-relaxed">
                Tómate tu tiempo para responder con sinceridad. Este test te
                guiará hacia decisiones importantes para tu camino profesional.
              </p>

              <p className="text-md italic text-gray-500">
                "Tu futuro no es casualidad, es una elección.{" "}
                <strong>¡Elige sabiamente!</strong>"
              </p>

              {/* Age confirmation from profile */}
              {showAgeConfirmation ? (
                <div className="mt-6 p-6 bg-white rounded-lg shadow-lg border-2 border-green-200">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">
                    {profileName ? `${profileName}, según tu perfil tienes ${profileAge} años.` : `Según tu perfil tienes ${profileAge} años.`}
                  </h3>
                  <p className="text-sm text-gray-600 mb-6">
                    ¿Es correcto? Usaremos esa edad para adaptar el test a tu momento vital.
                  </p>
                  <div className="flex flex-col md:flex-row gap-3 justify-center">
                    <button
                      onClick={handleConfirmProfileAge}
                      className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition"
                    >
                      Sí, es correcto
                    </button>
                    <button
                      onClick={handleRejectProfileAge}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-6 py-3 rounded-lg font-semibold transition"
                    >
                      No, elegir otra franja
                    </button>
                  </div>
                </div>
              ) : showAgeSelector ? (
                <div className="mt-6 p-6 bg-white rounded-lg shadow-lg border-2 border-purple-200">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    Antes de comenzar, cuéntanos tu edad
                  </h3>
                  <p className="text-sm text-gray-600 mb-6">
                    Esto nos ayuda a personalizar las preguntas para tu rango de edad
                  </p>
                  <div className="space-y-3">
                    <button
                      onClick={() => handleAgeGroupSelect('teen')}
                      className="w-full p-4 rounded-lg border-2 border-purple-300 hover:border-purple-500 hover:bg-purple-50 transition-all text-left group"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-gray-800 group-hover:text-purple-700">15-17 años</div>
                          <div className="text-sm text-gray-600">Estudiante de secundaria</div>
                        </div>
                        <span className="text-2xl">🎓</span>
                      </div>
                    </button>
                    <button
                      onClick={() => handleAgeGroupSelect('young_adult')}
                      className="w-full p-4 rounded-lg border-2 border-purple-300 hover:border-purple-500 hover:bg-purple-50 transition-all text-left group"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-gray-800 group-hover:text-purple-700">18-25 años</div>
                          <div className="text-sm text-gray-600">Universidad o primeros trabajos</div>
                        </div>
                        <span className="text-2xl">🎯</span>
                      </div>
                    </button>
                    <button
                      onClick={() => handleAgeGroupSelect('adult')}
                      className="w-full p-4 rounded-lg border-2 border-purple-300 hover:border-purple-500 hover:bg-purple-50 transition-all text-left group"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-gray-800 group-hover:text-purple-700">26+ años</div>
                          <div className="text-sm text-gray-600">Profesional o cambio de carrera</div>
                        </div>
                        <span className="text-2xl">💼</span>
                      </div>
                    </button>
                  </div>
                  <button
                    onClick={() => {
                      setShowAgeSelector(false);
                      setShowAgeConfirmation(profileAge !== null);
                    }}
                    className="mt-4 text-sm text-gray-500 hover:text-gray-700"
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleStart}
                  className="mt-4 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-8 py-4 rounded-full text-lg font-semibold shadow-xl hover:shadow-2xl hover:scale-105 transition-all cursor-pointer"
                >
                  Empezar Test
                </button>
              )}
            </>
          )}

          {/* Iconos decorativos */}
          <div className="absolute top-8 left-8 opacity-10 animate-float hidden md:block">
            <Lightbulb className="w-12 h-12 text-purple-500" />
          </div>
          <div className="absolute bottom-8 right-8 opacity-10 animate-float animation-delay-3000 hidden md:block">
            <GraduationCap className="w-16 h-16 text-green-500" />
          </div>
        </div>
      </section>
      <ConfirmStartModal
        isOpen={confirmOpen}
        onClose={cancelConfirm}
        onConfirm={confirmRestart}
      />
    </>
  );
}

function calculateAge(birthDate) {
  const dob = new Date(birthDate);
  if (Number.isNaN(dob.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }

  return age >= 0 ? age : null;
}

function mapAgeToGroup(age) {
  if (age >= 15 && age <= 17) return 'teen';
  if (age >= 18 && age <= 25) return 'young_adult';
  return 'adult';
}

// Modal local de confirmación (misma apariencia que 'Eliminar Profesión')
// RestartConfirmModal removed: using shared ConfirmModal component instead
