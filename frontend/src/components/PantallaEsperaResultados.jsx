import React, { useState, useEffect } from 'react';
import { Sparkles } from "lucide-react";

export default function PantallaEsperaResultados() {
    const [progress, setProgress] = useState(0);
    const [phraseIndex, setPhraseIndex] = useState(0);

    const phrases = [
        "Analizando tus respuestas…",
        "Construyendo tu perfil vocacional…",
        "Buscando coincidencias con tus talentos…",
        "Preparando tu informe personalizado…"
    ];

    // Efecto para la barra de progreso (0 a 100% en ~7 segundos)
    useEffect(() => {
        const duration = 7000; // 7 segundos
        const intervalTime = 50; // actualización cada 50ms
        const steps = duration / intervalTime;
        const increment = 100 / steps;

        const timer = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 100) {
                    clearInterval(timer);
                    return 100;
                }
                return Math.min(prev + increment, 100);
            });
        }, intervalTime);

        return () => clearInterval(timer);
    }, []);

    // Efecto para rotar frases cada 2 segundos
    useEffect(() => {
        const phraseTimer = setInterval(() => {
            setPhraseIndex((prev) => (prev + 1) % phrases.length);
        }, 2000);

        return () => clearInterval(phraseTimer);
    }, []);

    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-purple-100 via-white to-green-100 p-4">

            {/* Contenedor principal con animación de entrada */}
            <div className="w-full max-w-md flex flex-col items-center animate-fadeInUp">

                {/* Animación CSS (Reemplazo de Lottie) */}
                <div className="relative mb-12">
                    <div className="w-32 h-32 border-4 border-purple-100 rounded-full animate-ping absolute inset-0"></div>
                    <div className="w-32 h-32 border-4 border-purple-600 border-t-transparent rounded-full animate-spin relative z-10"></div>
                    <Sparkles className="w-12 h-12 text-purple-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                </div>

                {/* Barra de progreso */}
                <div className="w-full h-4 bg-white/50 rounded-full overflow-hidden backdrop-blur-sm shadow-inner mb-4 border border-white/60">
                    <div
                        className="h-full bg-gradient-to-r from-purple-500 to-green-500 rounded-full transition-all duration-300 ease-out shadow-[0_0_15px_rgba(168,85,247,0.4)]"
                        style={{ width: `${progress}%` }}
                    >
                        {/* Brillo animado en la barra */}
                        <div className="w-full h-full absolute top-0 left-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full animate-shimmer"></div>
                    </div>
                </div>

                {/* Porcentaje numérico */}
                <div className="text-purple-600 font-bold text-lg mb-6">
                    {Math.round(progress)}%
                </div>

                {/* Frases motivacionales rotativas */}
                <div className="h-8 relative w-full text-center">
                    {phrases.map((phrase, index) => (
                        <p
                            key={index}
                            className={`absolute inset-0 text-gray-600 font-medium text-lg transition-all duration-500 transform
                ${index === phraseIndex
                                    ? 'opacity-100 translate-y-0 scale-100'
                                    : 'opacity-0 translate-y-4 scale-95 pointer-events-none'
                                }
              `}
                        >
                            {phrase}
                        </p>
                    ))}
                </div>

            </div>
        </div>
    );
}
