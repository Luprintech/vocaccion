import React, { useEffect, useState } from 'react';
import { Sparkles, Trophy, Star, ThumbsUp } from 'lucide-react';

const FRASES_MOTIVADORAS = [
  "¡Excelente trabajo! 🚀 Un paso más cerca de tu meta.",
  "¡Sigue así! Tu esfuerzo está dando frutos. 💪",
  "Cada paso cuenta. ¡Lo estás haciendo genial! ✨",
  "¡Fantástico! Estás construyendo tu futuro. 🎓",
  "¡Bien hecho! La constancia es la clave del éxito. 🌟",
  "¡Vamos! Ya te queda menos para lograrlo. 🔥",
  "¡Gran avance! Tu dedicación es inspiradora. 💫",
  "¡Objetivo cumplido! A por el siguiente desafío. 🏆"
];

const ICONS = [Sparkles, Trophy, Star, ThumbsUp];

export default function MotivationalToast({ isVisible, onClose }) {
  const [frase, setFrase] = useState('');
  const [Icon, setIcon] = useState(null);

  useEffect(() => {
    if (isVisible) {
      // Elegir frase e icono aleatorios cada vez que se muestra
      setFrase(FRASES_MOTIVADORAS[Math.floor(Math.random() * FRASES_MOTIVADORAS.length)]);
      setIcon(ICONS[Math.floor(Math.random() * ICONS.length)]);
      
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 border-2 border-white/20 backdrop-blur-md">
        <div className="bg-white/20 p-2 rounded-full">
            {Icon && <Icon className="w-6 h-6 text-yellow-300 animate-pulse" />}
        </div>
        <div>
            <h4 className="font-bold text-sm text-purple-100 uppercase tracking-wider mb-0.5">¡Paso Completado!</h4>
            <p className="font-medium text-white text-base text-nowrap">{frase}</p>
        </div>
      </div>
    </div>
  );
}
