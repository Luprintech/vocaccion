import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * ConfirmDialog - Componente de confirmación estilo toast modal
 * 
 * @param {boolean} isOpen - Controla la visibilidad del modal
 * @param {function} onCancel - Callback al cancelar
 * @param {function} onConfirm - Callback al confirmar
 * @param {string} title - Título del modal (opcional)
 * @param {string} message - Mensaje del modal (opcional)
 * @param {string} confirmText - Texto del botón de confirmación (opcional)
 * @param {string} cancelText - Texto del botón de cancelación (opcional)
 */
export default function ConfirmDialog({
  isOpen,
  onCancel,
  onConfirm,
  title = '¿Eliminar testimonio?',
  message = 'Esta acción no se puede deshacer. El testimonio será eliminado permanentemente.',
  confirmText = 'Eliminar',
  cancelText = 'Cancelar'
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
      {/* Modal Card - Sin overlay, aparece directamente sobre el contenido */}
      <div 
        className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 pointer-events-auto border-2 border-slate-200"
        style={{
          animation: 'fadeInScale 0.2s ease-out'
        }}
      >
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          
          {/* Content */}
          <div className="flex-1 pt-1">
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              {title}
            </h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              {message}
            </p>
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex gap-3 justify-end mt-6">
          <Button
            variant="outline"
            onClick={onCancel}
            className="border-slate-300 text-slate-700 hover:bg-slate-50"
          >
            {cancelText}
          </Button>
          <Button
            onClick={onConfirm}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {confirmText}
          </Button>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeInScale {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
}
