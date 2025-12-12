import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  ChevronLeft, 
  ChevronRight,
  Info,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContextFixed';
import { API_URL } from '../../api';

const DAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

// Slots definidos fijamente (coinciden con backend)
const SLOTS_TEORICOS = [
  '09:00:00', '10:00:00', '11:00:00', '12:00:00', '13:00:00',
  '16:00:00', '17:00:00', '18:00:00', '19:00:00', '20:00:00'
];

const ReservarSesion = () => {
  const { token, user } = useAuth();
  const navigate = useNavigate();

  // Estados Calendario
  const [currentDate, setCurrentDate] = useState(new Date()); // Para mostrar mes actual
  const [selectedDate, setSelectedDate] = useState(null); // Fecha clickada 'YYYY-MM-DD'
  const [monthlyAssessment, setMonthlyAssessment] = useState({}); // { '2025-12-09': 'libre' }
  const [loadingCalendar, setLoadingCalendar] = useState(false);

  // Estados Reserva
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]); // Slots reales disponibles del día
  const [notas, setNotas] = useState('');
  
  // Estados UI
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Cargar disponibilidad mensual al cambiar de mes
  useEffect(() => {
    fetchMonthlyAvailability();
  }, [currentDate]);

  // Cargar slots al seleccionar fecha
  useEffect(() => {
    if (selectedDate) {
      fetchDailySlots(selectedDate);
    } else {
      setAvailableSlots([]);
      setSelectedSlot(null);
    }
  }, [selectedDate]);

  const fetchMonthlyAvailability = async () => {
    setLoadingCalendar(true);
    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      
      const response = await fetch(`${API_URL}/estudiante/reservas/disponibilidad-mensual?year=${year}&month=${month}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setMonthlyAssessment(data.data);
      }
    } catch (err) {
      console.error('Error cargando calendario', err);
    } finally {
      setLoadingCalendar(false);
    }
  };

  const fetchDailySlots = async (dateStr) => {
    setLoadingSlots(true);
    setSelectedSlot(null);
    try {
      const response = await fetch(`${API_URL}/estudiante/reservas/disponibilidad?fecha=${dateStr}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        // La API devuelve solo los slots disponibles (ej: 09:00:00)
        setAvailableSlots(data.data);
      } else {
        setAvailableSlots([]);
      }
    } catch (err) {
      console.error('Error slots', err);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };
  
  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleReservar = async () => {
    if (!selectedDate || !selectedSlot) return;
    
    setSubmitting(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_URL}/estudiante/reservas`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          fecha: selectedDate,
          hora: selectedSlot,
          notas
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        navigate('/estudiante/reservas');
      } else {
        setError(data.message || 'Error al reservar');
      }
    } catch (err) {
      setError('Error de conexión');
    } finally {
      setSubmitting(false);
    }
  };

  // Generación Visual del Calendario
  const renderCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1).getDay(); // 0=Dom
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    // Ajustar Lunes = 0, Domingo = 6
    // JS getDay(): 0=Dom, 1=Lun ... 6=Sab
    // Transformar a: 0=Lun ... 6=Dom
    /*
      Dom(0) -> 6
      Lun(1) -> 0
      Mar(2) -> 1
    */
    const startDay = firstDay === 0 ? 6 : firstDay - 1;
    
    const days = [];
    
    // Relleno inicial
    for (let i = 0; i < startDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-10 md:h-14" />);
    }
    
    // Días del mes
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const status = monthlyAssessment[dateStr]; // 'libre', 'lleno', 'cerrado', 'pasado'
      const isSelected = selectedDate === dateStr;
      
      let bgClass = "bg-gray-50 text-gray-400"; // Default / pasado
      let cursorClass = "cursor-default";
      let onClick = null;
      
      if (status === 'libre') {
        bgClass = isSelected 
          ? "bg-blue-600 text-white shadow-lg scale-105 ring-2 ring-blue-300" // Seleccionado
          : "bg-green-100 text-green-700 hover:bg-green-200 border border-green-200"; // Libre (Verde)
        cursorClass = "cursor-pointer transition-all hover:scale-105 active:scale-95";
        onClick = () => setSelectedDate(dateStr);
      } else if (status === 'lleno') {
        bgClass = "bg-red-100 text-red-400 border border-red-100"; // Lleno (Rojo suave)
      } else if (status === 'cerrado') {
        bgClass = "bg-gray-100 text-gray-300"; // Finde
      }
      
      days.push(
        <div 
          key={d}
          onClick={onClick}
          className={`h-10 md:h-14 rounded-xl flex items-center justify-center text-sm md:text-base font-bold select-none ${bgClass} ${cursorClass}`}
        >
          {d}
        </div>
      );
    }
    
    return days;
  };

  const renderSlots = () => {
    if (loadingSlots) {
        return <div className="p-8 text-center text-gray-500">Cargando horarios...</div>;
    }

    if (!availableSlots && !selectedSlot) return null;

    // Generar TODOS los slots y marcarlos
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {SLOTS_TEORICOS.map(slot => {
                const isToday = selectedDate === new Date().toISOString().split('T')[0];
                const currentHour = new Date().getHours();
                const slotHour = parseInt(slot.split(':')[0], 10);

                // Si es hoy, permitir solo horas futuras (hora actual + 1 de margen)
                const isPastTime = isToday && slotHour <= (currentHour + 1);

                const isAvailable = availableSlots.includes(slot) && !isPastTime;
                const isSelected = selectedSlot === slot;
                const timeLabel = slot.substring(0, 5); // 09:00
                
                let btnClass = "";
                
                if (isAvailable) {
                    btnClass = isSelected 
                        ? "bg-blue-600 text-white shadow-md ring-2 ring-blue-200 cursor-pointer"
                        : "bg-white border-2 border-green-400 text-green-700 hover:bg-green-50 hover:border-green-500 cursor-pointer";
                } else {
                    // Ocupado o Pasado -> Rojo/Gris
                    btnClass = "bg-gray-50 border border-gray-200 text-gray-300 cursor-not-allowed opacity-60";
                    if (availableSlots.includes(slot) && isPastTime) {
                         // Era un slot válido pero ya pasó la hora
                         btnClass = "bg-gray-100 border border-gray-200 text-gray-400 cursor-not-allowed";
                    } else if (!availableSlots.includes(slot)) {
                         // Ocupado realmente
                         btnClass = "bg-red-50 border border-red-100 text-red-300 cursor-not-allowed opacity-60";
                    }
                }

                return (
                    <button
                        key={slot}
                        disabled={!isAvailable}
                        onClick={() => setSelectedSlot(slot)}
                        className={`py-3 px-4 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${btnClass}`}
                    >
                        <Clock className="w-4 h-4" />
                        {timeLabel}
                    </button>
                );
            })}
        </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
            <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-gray-700 mb-4 flex items-center gap-2">
                <ChevronLeft className="w-4 h-4" /> Volver
            </button>
            <h1 className="text-3xl font-bold text-gray-900">Reservar Sesión de Orientación</h1>
            <p className="text-gray-600 mt-2">Selecciona un día disponible (verde) y luego elige tu hora.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            
            {/* Columna Izquierda: Calendario */}
            <div className="md:col-span-7 space-y-6">
                <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
                    {/* Header Mes */}
                    <div className="flex items-center justify-between mb-6">
                        <button onClick={handlePrevMonth} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600">
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <h2 className="text-xl font-bold text-gray-800 capitalize">
                            {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
                        </h2>
                        <button onClick={handleNextMonth} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600">
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Días Semana */}
                    <div className="grid grid-cols-7 mb-4">
                        {DAYS.map(d => (
                            <div key={d} className="text-center text-xs font-semibold text-gray-400 uppercase">
                                {d}
                            </div>
                        ))}
                    </div>

                    {/* Grid Dias */}
                    <div className="grid grid-cols-7 gap-2 md:gap-3">
                        {renderCalendarDays()}
                    </div>

                    {/* Leyenda */}
                    <div className="mt-6 flex items-center justify-center gap-4 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                            <div className="w-3 h-3 rounded-full bg-green-100 border border-green-200"></div> Libre
                        </div>
                        <div className="flex items-center gap-1">
                            <div className="w-3 h-3 rounded-full bg-red-100 border border-red-100"></div> Ocupado
                        </div>
                        <div className="flex items-center gap-1">
                            <div className="w-3 h-3 rounded-full bg-gray-100"></div> No disp.
                        </div>
                    </div>
                </div>
            </div>

            {/* Columna Derecha: Horas y Confirmación */}
            <div className="md:col-span-5 space-y-6">
                
                {selectedDate ? (
                    <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100 animate-fade-in">
                        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <Clock className="w-5 h-5 text-blue-600" />
                            Horarios para el {new Date(selectedDate).toLocaleDateString()}
                        </h3>
                        
                        {renderSlots()}

                        {/* Formulario Confirmación */}
                        {selectedSlot && (
                            <div className="mt-8 pt-6 border-t border-gray-100 animate-fade-in-up">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Notas para el orientador (opcional)</label>
                                <textarea
                                    value={notas}
                                    onChange={(e) => setNotas(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-sm"
                                    rows="3"
                                    placeholder="¿Sobre qué quieres hablar?"
                                />
                                
                                {error && (
                                    <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-xl text-sm flex items-center gap-2">
                                        <AlertCircle className="w-4 h-4" /> {error}
                                    </div>
                                )}

                                <button
                                    onClick={handleReservar}
                                    disabled={submitting}
                                    className="w-full mt-4 bg-linear-to-r from-blue-600 to-indigo-600 text-white font-bold py-3.5 rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                                >
                                    {submitting ? 'Confirmando...' : 'Confirmar Reserva'}
                                    {!submitting && <CheckCircle className="w-5 h-5" />}
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 bg-white/50 rounded-2xl border border-gray-100 border-dashed">
                        <CalendarIcon className="w-12 h-12 text-gray-300 mb-3" />
                        <p className="text-gray-500 font-medium">Selecciona un día en el calendario para ver los horarios disponibles.</p>
                    </div>
                )}

            </div>

        </div>
      </div>
    </div>
  );
};

export default ReservarSesion;
