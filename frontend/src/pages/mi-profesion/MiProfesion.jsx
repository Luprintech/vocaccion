import React, { useEffect, useState, useRef } from 'react';
import { getObjetivoProfesional, deleteObjetivoProfesional } from '../../api';
import { useToast } from '@/components/ToastProvider';
import { useNavigate } from 'react-router-dom';
import ConfirmModal from '@/components/ConfirmModal';
import MiProfesionCard from '@/components/MiProfesionCard';
import { Target, Sparkles } from 'lucide-react';

export default function MiProfesion() {
  const [objetivo, setObjetivo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const cancelBtnRef = useRef(null);

  const navigate = useNavigate();
  const { showToast } = useToast();

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const res = await getObjetivoProfesional();
        if (!mounted) return;
        if (res?.success) {
          setObjetivo(res.objetivo);
        } else {
          setObjetivo(null);
        }
      } catch (err) {
        console.error('Error cargando objetivo profesional', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  // Navegar a resultados para elegir otra profesión
  const cambiar = () => {
    navigate('/resultados');
  };

  // Navegar al itinerario académico
  const verItinerario = () => {
    navigate('/itinerario');
  };

  // Abrir modal de confirmación
  const eliminar = () => {
    setConfirmOpen(true);
  };

  // Ejecutar eliminación confirmada
  const confirmDelete = async () => {
    setDeleting(true);
    try {
      const res = await deleteObjetivoProfesional();
      if (res?.success) {
        setObjetivo(null);
        showToast('success', 'Profesión objetivo eliminada.');
        // Cerrar modal y notificar otras pestañas
        setConfirmOpen(false);
        try {
          localStorage.setItem('objetivo_changed', Date.now().toString());
        } catch (e) { /* ignore */ }
        // Redirigir al listado de resultados para elegir otra profesión
        navigate('/resultados');
      } else {
        showToast('error', 'No se pudo eliminar la profesión.');
      }
    } catch (err) {
      console.error('Error eliminando objetivo profesional', err);
      showToast('error', 'No se pudo eliminar. Intenta más tarde.');
    } finally {
      setDeleting(false);
    }
  };

  const cancelDelete = () => {
    setConfirmOpen(false);
  };

  // Focus management: cuando el modal se abre, mover focus al botón Cancel
  useEffect(() => {
    if (confirmOpen && cancelBtnRef.current) {
      cancelBtnRef.current.focus();
    }
  }, [confirmOpen]);

  if (loading) {
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
              Cargando tu profesión...
            </h3>
            <p className="text-gray-600 text-sm">
              Preparando tu objetivo profesional
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-green-50 px-4 md:px-6 py-8 md:py-12">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header decorativo */}
        <div className="text-center relative">
          <div className="absolute inset-x-0 top-1/2 h-px bg-gradient-to-r from-transparent via-purple-300 to-transparent"></div>
          <div className="relative inline-flex items-center gap-3 bg-white px-6 py-3 rounded-full shadow-md border-2 border-purple-100">
            <Target className="w-6 h-6 text-purple-600" strokeWidth={2.5} />
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-600 to-green-600 bg-clip-text text-transparent">
              Mi Profesión Objetivo
            </h1>
            <Sparkles className="w-6 h-6 text-green-500" strokeWidth={2.5} />
          </div>
        </div>

        {/* Mensaje sin profesión */}
        {!objetivo && (
          <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12 text-center border-2 border-purple-100">
            <div className="max-w-md mx-auto space-y-6">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-green-100 rounded-full flex items-center justify-center mx-auto">
                <Target className="w-10 h-10 text-purple-600" strokeWidth={2} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  Aún no tienes una profesión objetivo
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Descubre cuál es tu camino profesional ideal realizando nuestro test vocacional o explorando las profesiones disponibles.
                </p>
              </div>
              <button
                onClick={cambiar}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-green-600 hover:from-purple-700 hover:to-green-700 text-white px-8 py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer"
              >
                <Target className="w-5 h-5" strokeWidth={2.5} />
                Elegir mi profesión
              </button>
            </div>
          </div>
        )}

        {/* Tarjeta de profesión */}
        {objetivo && objetivo.profesion && (
          <div className="animate-fadeIn">
            <MiProfesionCard
              profesion={{
                titulo: objetivo.profesion.titulo,
                descripcion: objetivo.profesion.descripcion,
                salidas: objetivo.profesion.salidas,
                imagen_url: objetivo.profesion.imagen_url || objetivo.profesion.imagenUrl || '/images/default-profession.jpg',
                formacion_recomendada: objetivo.profesion.formacion_recomendada,
                habilidades: objetivo.profesion.habilidades,
                habilidades_comparadas: objetivo.profesion.habilidades_comparadas || [],
                estudios_comparados: objetivo.profesion.estudios_comparados || []
              }}
              onCambiar={cambiar}
              onEliminar={eliminar}
              onVerItinerario={verItinerario}
            />
          </div>
        )}
      </div>

      {/* Modal de confirmación */}
      <ConfirmModal
        open={confirmOpen}
        onCancel={cancelDelete}
        onConfirm={confirmDelete}
        title="Confirmar eliminación"
        cancelRef={cancelBtnRef}
        confirmLabel={deleting ? 'Eliminando...' : 'Eliminar'}
        confirmClass="bg-red-600 text-white hover:bg-red-700"
        loading={deleting}
      >
        <p className="text-sm text-gray-600 leading-relaxed">
          ¿Estás seguro de que deseas eliminar tu profesión objetivo? Podrás elegir otra profesión en cualquier momento desde la sección de resultados.
        </p>
      </ConfirmModal>
    </div>
  );
}
