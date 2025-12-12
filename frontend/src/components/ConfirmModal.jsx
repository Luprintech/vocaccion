import React from 'react';

export default function ConfirmModal({ open, onCancel, onConfirm, title = 'Confirmar', children, cancelLabel = 'Cancelar', confirmLabel = 'Confirmar', confirmClass = 'bg-red-600 text-white', cancelRef = null, loading = false }) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50"
      aria-modal="true"
      role="dialog"
      onMouseDown={(e) => {
        // click outside closes
        if (e.target === e.currentTarget) onCancel && onCancel();
      }}
    >
      <div className="bg-white rounded-lg shadow-md max-w-md w-full p-6 mx-4">
        <h3 className="text-lg font-semibold">{title}</h3>
        <div className="mt-3 text-sm text-gray-600">{children}</div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            ref={cancelRef}
            onClick={onCancel}
            className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
            disabled={loading}
          >
            {cancelLabel}
          </button>

          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded hover:opacity-95 ${confirmClass} disabled:opacity-50`}
            disabled={loading}
          >
            {loading ? 'Procesando...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
