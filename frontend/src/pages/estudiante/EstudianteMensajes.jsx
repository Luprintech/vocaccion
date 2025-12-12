import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageCircle, 
  Send, 
  ArrowLeft,
  Paperclip, 
  Smile, 
  Download, 
  X,
  Trash2,
  MoreVertical,
  AlertTriangle,
  Crown,
  Check,
  CheckCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContextFixed';
import { API_URL, STORAGE_URL } from '../../api';
import { Link } from 'react-router-dom';

/**
 * EstudianteMensajes
 * 
 * Página de chat para estudiantes Pro Plus para comunicarse con su orientador asignado.
 * Solo accesible para usuarios con suscripción Pro Plus activa.
 */
const EstudianteMensajes = () => {
  const { user, token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [orientador, setOrientador] = useState(null);
  const [mensajes, setMensajes] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [esProPlus, setEsProPlus] = useState(false);
  const [error, setError] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  
  // Estados para UI Personalizada
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const emojis = ['😊', '👍', '👋', '🎉', '❤️', '🤔', '😂', '🔥', '👏', '🙌', '💪', '🤝'];

  useEffect(() => {
    checkAccesoYCargarMensajes();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [mensajes]);

  // Auto-hide toast
  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => {
        setToast({ ...toast, show: false });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast.show]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const showToastNotification = (message, type = 'success') => {
      setToast({ show: true, message, type });
  };

  const checkAccesoYCargarMensajes = async () => {
    try {
      setLoading(true);
      
      // Verificar suscripción
      const subResponse = await fetch(`${API_URL}/estudiante/mi-suscripcion`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
      });
      const subData = await subResponse.json();
      
      if (!subData.data?.es_pro_plus) {
        setEsProPlus(false);
        setLoading(false);
        return;
      }
      
      setEsProPlus(true);
      
      // Cargar mensajes y orientador
      const msgResponse = await fetch(`${API_URL}/estudiante/mensajes`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
      });
      const msgData = await msgResponse.json();
      
      if (msgData.success) {
        setOrientador(msgData.data.orientador);
        setMensajes(msgData.data.mensajes || []);
      } else {
        setError(msgData.message);
      }
      
    } catch (err) {
      console.error('Error:', err);
      setError('Error al cargar los mensajes');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e) => {
      const file = e.target.files[0];
      if (file) {
          if (file.size > 10 * 1024 * 1024) {
              showToastNotification("El archivo es demasiado grande (Máx 10MB)", "error");
              return;
          }
          setSelectedFile(file);
      }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if ((!newMessage.trim() && !selectedFile) || sending) return;

    setSending(true);
    
    // Guardar referencias para limpiar UI
    const fileToSend = selectedFile;
    const textToSend = newMessage;
    
    // Reset UI optimista
    setNewMessage('');
    setSelectedFile(null);
    setShowEmojiPicker(false);
    if(fileInputRef.current) fileInputRef.current.value = '';

    try {
      const formData = new FormData();
      if (textToSend.trim()) formData.append('contenido', textToSend);
      if (fileToSend) formData.append('archivo', fileToSend);

      const response = await fetch(`${API_URL}/estudiante/mensajes`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          // No Content-Type, fetch lo pone automático con boundary para FormData
          'Accept': 'application/json'
        },
        body: formData
      });
      
      const data = await response.json();
      
      if (data.success) {
        setMensajes(prev => [...prev, data.data]);
      } else {
        console.error('Error server:', data.message);
        showToastNotification("Error al enviar mensaje", "error");
      }
    } catch (err) {
      console.error('Error enviando mensaje:', err);
      showToastNotification("Error de conexión", "error");
    } finally {
      setSending(false);
    }
  };

  const handleClearChatRequest = () => {
    setShowOptions(false);
    setShowDeleteConfirm(true);
  };

  const confirmClearChat = async () => {
    setShowDeleteConfirm(false);
    
    // UI Optimista
    const previousMessages = [...mensajes];
    setMensajes([]);

    try {
        const res = await fetch(`${API_URL}/estudiante/mensajes/vaciar`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.message);
        
        showToastNotification("Chat vaciado correctamente");
        
    } catch (err) {
        console.error("Error vaciando chat:", err);
        setMensajes(previousMessages); // Revertir en fallo
        showToastNotification("No se pudo vaciar el chat", "error");
    }
  };

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Hoy';
    if (date.toDateString() === yesterday.toDateString()) return 'Ayer';
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  };

  // Agrupar mensajes por fecha
  const mensajesAgrupados = mensajes.reduce((acc, msg) => {
    const fecha = new Date(msg.fecha).toDateString();
    if (!acc[fecha]) acc[fecha] = [];
    acc[fecha].push(msg);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-600 font-medium">Cargando conversación...</p>
        </div>
      </div>
    );
  }

  // Si no es Pro Plus
  if (!esProPlus) {
    return (
      <div className="min-h-screen bg-linear-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center border border-white/50 backdrop-blur-sm">
            {/* Contenido existente simplificado para evitar errores */}
            <Crown className="w-20 h-20 text-amber-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Función Exclusiva Pro Plus</h2>
            <p className="text-gray-600 mb-6">Accede a asesoramiento personalizado con un orientador experto.</p>
            <Link to="/planes" className="block w-full py-3 bg-amber-500 text-white rounded-xl font-bold hover:bg-amber-600 transition">
                Ver Planes
            </Link>
            <Link to="/perfil" className="block mt-3 text-gray-500 hover:text-gray-800 font-medium">
                Volver
            </Link>
        </div>
      </div>
    );
  }

  // Si no tiene orientador asignado
  if (!orientador) {
    return (
      <div className="min-h-screen bg-linear-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center border border-white/50 backdrop-blur-sm">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Asignando Orientador...</h2>
            <p className="text-gray-600 mb-6">Estamos buscando el mejor orientador para ti.</p>
            <Link to="/perfil" className="text-indigo-600 font-medium hover:underline">Volver al perfil</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-indigo-50 via-purple-50 to-pink-50 flex flex-col items-center justify-start pt-4 md:pt-12 pb-4 font-sans">
      
      {/* Toast Notification */}
      {toast.show && (
          <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded-full shadow-lg flex items-center gap-2 animate-fade-in-down ${
              toast.type === 'error' ? 'bg-red-500 text-white' : 'bg-green-600 text-white'
          }`}>
              {toast.type === 'success' ? <CheckCheck size={18} /> : <AlertTriangle size={18} />}
              <span className="font-medium text-sm">{toast.message}</span>
          </div>
      )}

      {/* Confirmation Modal - Styled with Corporate Colors */}
      {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
              <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full transform transition-all scale-100 border border-purple-100">
                  <div className="bg-purple-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Trash2 className="h-6 w-6 text-purple-600" />
                  </div>
                  <h3 className="text-lg font-bold text-center text-gray-900 mb-2">¿Vaciar conversación?</h3>
                  <p className="text-sm text-center text-gray-500 mb-6">
                      Esta acción eliminará todos los mensajes de este chat permanentemente. No podrás deshacer esta acción.
                  </p>
                  <div className="flex gap-3">
                      <button 
                          onClick={() => setShowDeleteConfirm(false)}
                          className="flex-1 py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors"
                      >
                          Cancelar
                      </button>
                      <button 
                          onClick={confirmClearChat}
                          className="flex-1 py-2.5 px-4 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-xl transition-colors shadow-lg shadow-purple-200"
                      >
                          Sí, vaciar
                      </button>
                  </div>
              </div>
          </div>
      )}

      <div className="w-full max-w-6xl flex flex-col h-[85vh] md:h-[80vh] bg-white rounded-2xl shadow-2xl overflow-hidden border border-white/50 relative">
        {/* Header del chat */}
        <div className="bg-white border-b border-gray-100 flex-shrink-0 z-20 shadow-sm relative">
            <div className="px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link to="/perfil" className="p-2 -ml-2 hover:bg-gray-50 rounded-full transition-colors group" title="Volver al perfil">
                        <ArrowLeft className="h-5 w-5 text-gray-500 group-hover:text-purple-600" />
                    </Link>
                    
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            {orientador.profile_image ? (
                                <img 
                                    src={orientador.profile_image.startsWith('http') ? orientador.profile_image : `${STORAGE_URL}/${orientador.profile_image}`} 
                                    alt={orientador.nombre}
                                    className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-md"
                                />
                            ) : (
                                <div className="w-12 h-12 rounded-full bg-linear-to-tr from-purple-400 to-indigo-500 flex items-center justify-center text-white font-bold text-lg shadow-md border-2 border-white">
                                {orientador.nombre?.charAt(0) || 'O'}
                                </div>
                            )}
                            <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full shadow-sm"></span>
                        </div>
                        
                        <div>
                            <h1 className="font-bold text-gray-800 text-lg leading-tight flex items-center gap-2">
                                {orientador.nombre}
                                <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] uppercase font-bold tracking-wider rounded-full flex items-center gap-1">
                                    <Crown size={10} strokeWidth={3} /> Pro Plus
                                </span>
                            </h1>
                            <p className="text-xs text-gray-500 font-medium">En línea · Orientador Vocacional</p>
                        </div>
                    </div>
                </div>

                {/* Menú Opciones */}
                <div className="relative">
                    <button 
                        onClick={() => setShowOptions(!showOptions)}
                        className={`p-2 rounded-full transition-all duration-200 ${showOptions ? 'bg-purple-50 text-purple-600' : 'hover:bg-gray-50 text-gray-400'}`}
                    >
                        <MoreVertical className="h-5 w-5" />
                    </button>
                    
                    {showOptions && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={() => setShowOptions(false)}></div>
                            <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-gray-100 rounded-2xl shadow-xl z-20 py-2 overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                                <div className="px-4 py-2 border-b border-gray-50">
                                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Opciones</p>
                                </div>
                                <button
                                    onClick={handleClearChatRequest}
                                    className="w-full text-left px-4 py-3 text-red-600 hover:bg-red-50 flex items-center gap-3 text-sm font-medium transition-colors"
                                >
                                    <div className="p-1.5 bg-red-100 rounded-lg">
                                        <Trash2 className="h-4 w-4" />
                                    </div>
                                    Vaciar historial
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>

        {/* Área de mensajes */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-gray-50/50 relative">
            {/* Background Pattern */}
             <div className="absolute inset-0 opacity-[0.4] pointer-events-none" style={{
                backgroundImage: `radial-gradient(#e5e7eb 1px, transparent 1px)`,
                backgroundSize: '20px 20px'
            }}></div>

            {mensajes.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center z-10 relative">
                    <div className="w-24 h-24 bg-linear-to-br from-purple-100 to-indigo-100 rounded-3xl flex items-center justify-center mb-6 shadow-sm transform rotate-3">
                        <MessageCircle className="h-12 w-12 text-purple-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Tu espacio de orientación</h3>
                    <p className="text-gray-500 max-w-sm leading-relaxed">
                        Envía un mensaje para comenzar a planificar tu futuro. Tu orientador te ayudará a resolver dudas y tomar mejores decisiones.
                    </p>
                </div>
            ) : (
                <div className="space-y-8 z-10 relative max-w-3xl mx-auto">
                    {Object.entries(mensajesAgrupados).map(([fecha, msgs]) => (
                        <div key={fecha}>
                            <div className="flex justify-center mb-6">
                                <span className="px-4 py-1.5 bg-gray-200/60 backdrop-blur-sm text-gray-600 text-xs font-semibold rounded-full shadow-sm border border-white/50">
                                    {formatDate(fecha)}
                                </span>
                            </div>
                            
                            <div className="space-y-4">
                                {msgs.map((msg) => (
                                    <div key={msg.id} className={`flex ${msg.es_mio ? 'justify-end' : 'justify-start'} group`}>
                                        <div className={`max-w-[85%] md:max-w-[75%] rounded-2xl px-5 py-4 shadow-sm transition-all duration-200 hover:shadow-md ${
                                            msg.es_mio
                                                ? 'bg-linear-to-br from-green-500 to-emerald-600 text-white rounded-tr-none'  // ESTUDIANTE: VERDE
                                                : 'bg-linear-to-br from-purple-600 to-indigo-600 text-white rounded-tl-none' // ORIENTADOR: MORADO
                                        }`}>
                                            <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{msg.contenido}</p>
                                            
                                            {/* Archivos */}
                                            {msg.archivo && (
                                                <div className="mt-3">
                                                    {msg.tipo_archivo?.startsWith('image/') || (msg.nombre_archivo && /\.(jpg|jpeg|png|gif|webp)$/i.test(msg.nombre_archivo)) ? (
                                                        <div className="relative group/img overflow-hidden rounded-xl border border-black/10">
                                                            <a href={`${STORAGE_URL}/${msg.archivo}`} target="_blank" rel="noopener noreferrer">
                                                                <img 
                                                                    src={`${STORAGE_URL}/${msg.archivo}`} 
                                                                    alt="Adjunto" 
                                                                    className="max-w-full max-h-64 object-cover hover:scale-105 transition-transform duration-500" 
                                                                />
                                                            </a>
                                                            
                                                            {/* Botón descarga overlay */}
                                                            <button 
                                                                onClick={async (e) => {
                                                                    e.preventDefault(); e.stopPropagation();
                                                                    try {
                                                                        const response = await fetch(`${API_URL}/estudiante/mensajes/${msg.id}/descargar`, {
                                                                            headers: { 'Authorization': `Bearer ${token}` }
                                                                        });
                                                                        if (!response.ok) throw new Error('Error');
                                                                        const blob = await response.blob();
                                                                        const url = window.URL.createObjectURL(blob);
                                                                        const a = document.createElement('a');
                                                                        a.href = url;
                                                                        a.download = msg.nombre_archivo || 'archivo';
                                                                        document.body.appendChild(a);
                                                                        a.click();
                                                                        a.remove();
                                                                    } catch (err) {
                                                                        window.open(`${STORAGE_URL}/${msg.archivo}`, '_blank');
                                                                    }
                                                                }}
                                                                className="absolute bottom-3 right-3 p-2 bg-black/60 hover:bg-black/80 text-white rounded-full opacity-0 group-hover/img:opacity-100 transition-all duration-200 backdrop-blur-sm"
                                                            >
                                                                <Download size={16} />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <a 
                                                            href={`${STORAGE_URL}/${msg.archivo}`} 
                                                            target="_blank" 
                                                            rel="noopener noreferrer"
                                                            className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                                                                 'bg-white/10 border-white/20 hover:bg-white/20' // Ambos tienen texto blanco ahora
                                                            }`}
                                                        >
                                                            <div className={`p-2 rounded-lg bg-white/20`}>
                                                                <Paperclip size={18} />
                                                            </div>
                                                            <div className="flex flex-col overflow-hidden">
                                                                <span className="truncate max-w-[180px] text-sm font-semibold">{msg.nombre_archivo || 'Archivo'}</span>
                                                                <span className="text-[10px] opacity-80 uppercase tracking-widest">Documento</span>
                                                            </div>
                                                        </a>
                                                    )}
                                                </div>
                                            )}

                                            <div className={`flex items-center justify-end gap-1.5 mt-2 text-white/70`}>
                                                <span className="text-[10px] uppercase font-medium tracking-wide">{formatTime(msg.fecha)}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>
            )}
        </div>

        {/* Input Area */}
        <div className="flex-shrink-0 bg-white border-t border-gray-100 p-4 md:p-6 z-20">
            {selectedFile && (
                <div className="absolute bottom-24 left-6 md:left-10 flex items-center gap-3 bg-white px-4 py-3 rounded-2xl shadow-xl border border-gray-100 animate-fade-in-up z-50 ring-1 ring-black/5">
                    <div className="p-2.5 bg-purple-50 rounded-xl">
                        <Paperclip size={18} className="text-purple-600" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-gray-800 truncate max-w-[150px]">{selectedFile.name}</p>
                        <p className="text-[10px] text-gray-500 font-medium">Click en enviar para adjuntar</p>
                    </div>
                    <button onClick={() => { setSelectedFile(null); if(fileInputRef.current) fileInputRef.current.value = ''; }} className="p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-lg transition-colors ml-2">
                        <X size={16} />
                    </button>
                </div>
            )}

            <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto flex items-end gap-3">
                <div className="flex-1 bg-gray-50 border border-gray-200 rounded-3xl flex items-center p-1.5 focus-within:ring-2 focus-within:ring-purple-500/50 focus-within:border-purple-500 transition-all shadow-inner">
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="p-3 text-gray-400 hover:text-purple-600 hover:bg-white rounded-full transition-all"
                        title="Adjuntar archivo"
                    >
                        <Paperclip size={20} />
                    </button>
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        onChange={handleFileSelect}
                    />
                    
                    <textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Escribe un mensaje..."
                        rows={1}
                        className="w-full bg-transparent border-none focus:ring-0 text-gray-700 placeholder-gray-400 py-3 px-2 resize-none max-h-32"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSendMessage(e);
                            }
                        }}
                    />
                    
                    <div className="relative">
                        <button 
                            type="button"
                            className="p-3 text-gray-400 hover:text-purple-500 hover:bg-white rounded-full transition-all"
                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        >
                            <Smile size={20} />
                        </button>
                        
                        {showEmojiPicker && (
                            <div className="absolute bottom-12 right-0 bg-white shadow-2xl rounded-2xl border border-gray-100 p-3 grid grid-cols-4 gap-2 w-56 animate-fade-in-up z-50">
                                {emojis.map(emoji => (
                                    <button 
                                        key={emoji}
                                        type="button"
                                        onClick={() => {
                                            setNewMessage(prev => prev + emoji);
                                            setShowEmojiPicker(false);
                                        }}
                                        className="text-2xl hover:bg-gray-50 p-2.5 rounded-xl transition-transform active:scale-90"
                                    >
                                        {emoji}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={(!newMessage.trim() && !selectedFile) || sending}
                    className="p-4 bg-linear-to-br from-green-500 to-emerald-600 text-white rounded-full shadow-lg hover:shadow-green-500/30 transform hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                    <Send className={`h-5 w-5 ${sending ? 'animate-pulse' : ''}`} />
                </button>
            </form>
        </div>
      </div>
    </div>
  );
};

export default EstudianteMensajes;
