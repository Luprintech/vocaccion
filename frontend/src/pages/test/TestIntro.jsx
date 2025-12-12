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

import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContextFixed";
import { useToast } from '@/components/ToastProvider';
import ConfirmStartModal from '@/components/ConfirmStartModal';
import { Sparkles, Lightbulb, GraduationCap, RefreshCw } from "lucide-react";

export default function TestIntro() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [testPendiente, setTestPendiente] = useState(false);
  const [testFinalizado, setTestFinalizado] = useState(false);
  const [loading, setLoading] = useState(true);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const { showToast } = useToast();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const cancelBtnRef = useRef(null);

  useEffect(() => {
    async function comprobarSesion() {
      try {
        const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";
        const token = localStorage.getItem("token");
        if (!token) return;

        // Llamadas en paralelo: estado de sesión y resultados guardados
        const [resEstado, resResults] = await Promise.all([
          fetch(`${API_URL}/user/test/estado`, {
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, Accept: "application/json" },
          }).catch(() => null),
          fetch(`${API_URL}/user/test/results`, {
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, Accept: "application/json" },
          }).catch(() => null),
        ]);

        const estadoData = resEstado ? await resEstado.json().catch(() => null) : null;
        const resultsData = resResults ? await resResults.json().catch(() => null) : null;

        const hasResults = resResults && resResults.ok && Array.isArray(resultsData?.results) && resultsData.results.length > 0;
        const enCurso = resEstado && resEstado.ok && !!estadoData?.enCurso;

        // Priorizar mostrar que el test está finalizado si existen resultados guardados.
        if (hasResults) {
          setTestFinalizado(true);
          setTestPendiente(false);
        } else if (enCurso) {
          setTestPendiente(true);
          setTestFinalizado(false);
        } else {
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

  const handleStart = () => navigate("/test");
  const handleCancelar = async () => {
    try {
      const API_URL =
        import.meta.env.VITE_API_URL || "http://localhost:8000/api";
      const token = localStorage.getItem("token");
      await fetch(`${API_URL}/user/test/cancelar`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });
      setTestPendiente(false);
    } catch (err) {
      console.error("Error al cancelar test:", err);
    }
  };

  // Confirm modal handlers for reiniciar
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

        showToast('success', 'Se han eliminado tus resultados. Ahora puedes realizar el test de nuevo.');
        setConfirmOpen(false);
        navigate('/test');
      } else {
        const err = await res.json().catch(() => null);
        console.error('Error clearing results', err);
        showToast('error', 'No se pudieron borrar los resultados. Intenta de nuevo.');
      }
    } catch (err) {
      console.error(err);
      showToast('error', 'Error al reiniciar el test.');
    } finally {
      setConfirmLoading(false);
    }
  };

  // focus management: cuando se abre el modal, mover foco al botón cancelar
  useEffect(() => {
    if (confirmOpen && cancelBtnRef.current) {
      cancelBtnRef.current.focus();
    }
  }, [confirmOpen]);

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
      <section className="relative w-full min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-green-50 overflow-hidden px-4 py-16">
        {/* Círculos decorativos */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-green-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>

        <div className="relative bg-white shadow-2xl rounded-3xl max-w-3xl w-full px-10 py-12 text-center space-y-6 z-10">
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
                Ya habías comenzado un test vocacional. Puedes continuarlo desde
                la última pregunta respondida o empezar uno nuevo.
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

              <button
                onClick={handleStart}
                className="mt-4 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-8 py-4 rounded-full text-lg font-semibold shadow-xl hover:shadow-2xl hover:scale-105 transition-all cursor-pointer"
              >
                Empezar Test
              </button>
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
      {/* Restart confirm modal - reutiliza ConfirmStartModal */}
      <ConfirmStartModal
        isOpen={confirmOpen}
        onClose={cancelConfirm}
        onConfirm={confirmRestart}
      />
    </>
  );
}

// Modal local de confirmación (misma apariencia que 'Eliminar Profesión')
// RestartConfirmModal removed: using shared ConfirmModal component instead
