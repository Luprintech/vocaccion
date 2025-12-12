import React from 'react';
import { Lightbulb } from 'lucide-react';

export default function ConfirmStartModal({ isOpen, onClose, onConfirm }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center animate-fadeIn p-4">
            <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl animate-fadeInUp relative overflow-hidden">
                {/* Fondo decorativo sutil */}
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-purple-500 to-green-500"></div>

                <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mb-6">
                        <Lightbulb className="w-8 h-8 text-purple-600" />
                    </div>

                    <h3 className="text-2xl font-bold text-gray-900 mb-3">
                        ¿Quieres empezar un nuevo test?
                    </h3>

                    <p className="text-gray-500 mb-8 leading-relaxed">
                        Si comienzas de nuevo, tu progreso actual se perderá.
                        Podrás volver a realizar el test desde la primera pregunta.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-3 w-full">
                        <button
                            onClick={onClose}
                            className="flex-1 px-6 py-3 rounded-full border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={onConfirm}
                            className="flex-1 px-6 py-3 rounded-full bg-gradient-to-r from-purple-600 to-green-600 text-white font-bold shadow-lg hover:shadow-xl hover:scale-[1.03] transition-all"
                        >
                            Empezar nuevo test
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
