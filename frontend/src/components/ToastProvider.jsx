import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';

const ToastContext = createContext(null);

export function useToast() {
  return useContext(ToastContext);
}

export default function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [confirmState, setConfirmState] = useState({ open: false, title: '', message: '', resolve: null });

  const showToast = useCallback((type, message, duration = 4000) => {
    const id = Date.now() + Math.random();
    const t = { id, type, message };
    setToasts((s) => [t, ...s]);
    if (duration > 0) {
      setTimeout(() => {
        setToasts((s) => s.filter((x) => x.id !== id));
      }, duration);
    }
  }, []);

  const showConfirm = useCallback((title, message) => {
    return new Promise((resolve) => {
      setConfirmState({ open: true, title, message, resolve });
    });
  }, []);

  const handleConfirm = (value) => {
    if (confirmState.resolve) confirmState.resolve(value);
    setConfirmState({ open: false, title: '', message: '', resolve: null });
  };

  // Modal portal container
  const [modalContainer] = useState(() => typeof document !== 'undefined' ? document.createElement('div') : null);

  useEffect(() => {
    if (!modalContainer) return;
    modalContainer.setAttribute('id', 'toast-modal-root');
    document.body.appendChild(modalContainer);
    return () => {
      try { document.body.removeChild(modalContainer); } catch (e) {}
    };
  }, [modalContainer]);

  // context value
  const value = {
    showToast,
    showConfirm,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}

      {/* Toast container */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 items-end">
        {toasts.map((t) => (
          <div key={t.id} className={`max-w-xs w-full px-4 py-3 rounded-xl shadow-lg text-white font-medium ${
            t.type === 'success' ? 'bg-emerald-600' : t.type === 'error' ? 'bg-red-600' : 'bg-indigo-600'
          }`}>
            {t.message}
          </div>
        ))}
      </div>

      {/* Confirm modal (rendered in a portal; semi-transparent blurred background, click outside or Escape to cancel) */}
      {modalContainer && confirmState.open && createPortal(
        <div className="fixed inset-0 z-60 flex items-center justify-center pointer-events-none">
          {/* background layer: subtle, semi-transparent + blur */}
          <div
            className="absolute inset-0 bg-black/20 backdrop-blur-sm pointer-events-auto"
            onMouseDown={() => handleConfirm(false)}
            aria-hidden="true"
          />

          {/* dialog */}
          <div className="relative z-10 pointer-events-auto max-w-lg w-full px-6">
            <div className="bg-white/90 dark:bg-gray-900/90 rounded-2xl p-6 shadow-xl" role="dialog" aria-modal="true" aria-label={confirmState.title || 'Confirmar'}>
              <h3 className="text-lg font-bold mb-2">{confirmState.title || 'Confirmar'}</h3>
              <p className="text-gray-700 mb-4">{confirmState.message}</p>
              <div className="flex justify-end gap-3">
                <button className="px-4 py-2 rounded-lg bg-gray-100" onClick={() => handleConfirm(false)}>Cancelar</button>
                <button className="px-4 py-2 rounded-lg bg-emerald-600 text-white" onClick={() => handleConfirm(true)}>Confirmar</button>
              </div>
            </div>
          </div>
        </div>,
        modalContainer
      )}

      {/* Close on Escape key when modal is open */}
      {confirmState.open && typeof window !== 'undefined' && (
        <EscapeHandler onEscape={() => handleConfirm(false)} />
      )}
    </ToastContext.Provider>
  );
}

// pequeño componente que escucha Escape y llama onEscape
function EscapeHandler({ onEscape }) {
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onEscape();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onEscape]);
  return null;
}
