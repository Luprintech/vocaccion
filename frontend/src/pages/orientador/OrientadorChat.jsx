import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageCircle, 
  Send, 
  Search, 
  Check, 
  CheckCheck,
  Paperclip,
  Smile,
  Crown,
  Lock,
  ArrowLeft,

  User,
  MoreVertical,
  Trash2,
  X,
  Download
} from 'lucide-react';
import { useAuth } from '../../context/AuthContextFixed';
import { API_URL, STORAGE_URL } from '../../api';
import HeaderOrientador from '../../components/HeaderOrientador';
import ModalPerfilEstudiante from '../../components/ModalPerfilEstudiante';

const OrientadorChat = () => {
  const { user, token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [estudiantes, setEstudiantes] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 768);
  const [showChatList, setShowChatList] = useState(true);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);

  // Estados para Modal Perfil
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [studentDetail, setStudentDetail] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  // Estados para Emojis
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showOptions, setShowOptions] = useState(false); // Estado para menú de opciones (3 puntos)
  const emojis = ['😊', '👍', '👋', '🎉', '❤️', '🤔', '😂', '🔥', '👏', '🙌', '💪', '🤝'];

  // Estados para borrado de mensaje individual
  const [showDeleteMessageModal, setShowDeleteMessageModal] = useState(false);
  const [messageToDeleteId, setMessageToDeleteId] = useState(null);

  // Estados restaurados para Toast y Confirmación General
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Helper para mostrar toast
  const showToastNotification = (message, type = 'success') => {
      setToast({ show: true, message, type });
      setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  useEffect(() => {
    fetchEstudiantes();
    
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    let interval;
    if (selectedChat) {
      fetchMessages(selectedChat.id);
      if (isMobileView) setShowChatList(false);
      
      // Polling para nuevos mensajes cada 3 segundos
      interval = setInterval(() => {
        fetchMessages(selectedChat.id, true);
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [selectedChat]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchEstudiantes = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/orientador/chat/estudiantes`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      const data = await response.json();
      setEstudiantes(data.data || []);
    } catch (err) {
      console.error('Error al cargar estudiantes:', err);
      setEstudiantes([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (estudianteId, silent = false) => {
    try {
      // Añadir timestamp para evitar caché en polling
      const url = `${API_URL}/orientador/chat/mensajes/${estudianteId}?t=${Date.now()}`;
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      const data = await response.json();
      const newMessages = data.data || [];
      
      setMessages(prev => {
        if (JSON.stringify(prev) === JSON.stringify(newMessages)) {
            return prev;
        }
        return newMessages;
      });
    } catch (err) {
      console.error('Error al cargar mensajes:', err);
      if (!silent) setMessages([]);
    }
  };

  // Polling para actualizar lista de estudiantes
  useEffect(() => {
    const interval = setInterval(() => {
        fetchEstudiantesSilent();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchEstudiantesSilent = async () => {
      try {
        const response = await fetch(`${API_URL}/orientador/chat/estudiantes`, {
            headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
        });
        const data = await response.json();
        if (data.success) {
            setEstudiantes(prev => {
                if (JSON.stringify(prev) === JSON.stringify(data.data)) return prev;
                return data.data;
            });
            if (selectedChat) {
                const updatedSelected = data.data.find(e => e.id === selectedChat.id);
                if (updatedSelected) setSelectedChat(prev => ({...prev, ...updatedSelected}));
            }
        }
      } catch (err) { console.error(err); }
  };

  const sendMessage = async () => {
    if ((!newMessage.trim() && !selectedFile) || !selectedChat) return;

    const fileToSend = selectedFile;
    const textToSend = newMessage;

    const tempMessage = {
      id: Date.now(),
      texto: textToSend,
      archivo: fileToSend ? URL.createObjectURL(fileToSend) : null,
      nombre_archivo: fileToSend?.name,
      tipo_archivo: fileToSend?.type,
      emisor: 'orientador',
      fecha: new Date().toISOString(),
      leido: false,
      pending: true
    };

    setMessages(prev => [...prev, tempMessage]);
    setNewMessage('');
    setSelectedFile(null);
    setShowEmojiPicker(false);
    
    if (fileInputRef.current) fileInputRef.current.value = '';

    try {
      const formData = new FormData();
      formData.append('estudiante_id', selectedChat.id);
      if (textToSend.trim()) formData.append('mensaje', textToSend);
      if (fileToSend) formData.append('archivo', fileToSend);

      const res = await fetch(`${API_URL}/orientador/chat/enviar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
        body: formData
      });
      
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Error al enviar');

    } catch (err) {
      console.error('Error al enviar mensaje:', err);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleDeleteMessageRequest = (mensajeId) => {
    setMessageToDeleteId(mensajeId);
    setShowDeleteMessageModal(true);
  };

  const confirmDeleteMessage = async (mode) => {
    // mode: 'me' | 'all'
    if (!messageToDeleteId) return;
    setShowDeleteMessageModal(false);

    // UI Optimista
    const previousMessages = [...messages];
    setMessages(prev => prev.filter(m => m.id !== messageToDeleteId));

    try {
        const res = await fetch(`${API_URL}/orientador/chat/mensajes/${messageToDeleteId}?mode=${mode}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.message);
        
        showToastNotification("Mensaje eliminado");
    } catch (err) {
        console.error("Error eliminando mensaje:", err);
        setMessages(previousMessages);
        showToastNotification("No se pudo eliminar el mensaje", "error");
    } finally {
        setMessageToDeleteId(null);
    }
  };

  const handleClearChatRequest = () => {
    if (!selectedChat) return;
    setShowOptions(false);
    setShowDeleteConfirm(true);
  };

  const confirmClearChat = async () => {
    if (!selectedChat) return;
    setShowDeleteConfirm(false);

    const previousMessages = [...messages];
    setMessages([]);

    try {
        const res = await fetch(`${API_URL}/orientador/chat/conversacion/${selectedChat.id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.message);
        
        showToastNotification("Chat vaciado correctamente");
        
    } catch (err) {
        setMessages(previousMessages); // Revertir en fallo
        console.error("Error vaciando chat:", err);
        showToastNotification("No se pudo vaciar el chat", "error");
    }
  };

  // Manejo de Perfil
  const handleViewProfile = async () => {
    if (!selectedChat) return;
    setLoadingProfile(true);
    setShowProfileModal(true);
    try {
        const res = await fetch(`${API_URL}/orientador/estudiantes/${selectedChat.id}`, { 
            headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
        });
        const data = await res.json();
        if (data.success) {
            const est = data.data?.estudiante || data.estudiante;
            if (est) {
                setStudentDetail(est);
            }
        }
    } catch (e) {
        console.error('Error cargando perfil:', e);
    } finally {
        setLoadingProfile(false);
    }
  };

  const handleFileSelect = (e) => {
      const file = e.target.files[0];
      if (file) {
          if (file.size > 10 * 1024 * 1024) {
              alert("El archivo es demasiado grande (Máx 10MB)");
              return;
          }
          setSelectedFile(file);
      }
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 86400000) { // Menos de 24 horas
      return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    } else if (diff < 604800000) { // Menos de una semana
      return date.toLocaleDateString('es-ES', { weekday: 'short' });
    }
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
  };

  const filteredEstudiantes = estudiantes.filter(est =>
    est.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    est.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const ChatListItem = ({ estudiante, isSelected, onClick }) => (
    <div
      onClick={() => !estudiante.bloqueado && onClick(estudiante)}
      className={`flex items-center gap-3 p-4 cursor-pointer transition-all border-b border-gray-100 ${
        isSelected ? 'bg-orange-50 border-l-4 border-l-orange-500' : 'hover:bg-gray-50'
      } ${estudiante.bloqueado ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <div className="relative">
        {estudiante.avatar ? (
          <img 
            src={estudiante.avatar.startsWith('http') ? estudiante.avatar : `${STORAGE_URL}/${estudiante.avatar}`} 
            alt={estudiante.nombre}
            className="w-12 h-12 rounded-full object-cover"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-linear-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white font-bold text-lg">
            {estudiante.nombre.charAt(0)}
          </div>
        )}
        {estudiante.online && (
          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white animate-pulse" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-gray-800 truncate">{estudiante.nombre}</h4>
          {estudiante.fechaUltimoMensaje && (
            <span className="text-xs text-gray-400">{formatTime(estudiante.fechaUltimoMensaje)}</span>
          )}
        </div>
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500 truncate max-w-[180px]">
            {estudiante.bloqueado ? (
              <span className="flex items-center gap-1 text-gray-400">
                <Lock className="h-3 w-3" /> Plan Básico
              </span>
            ) : (
              estudiante.ultimoMensaje || 'Sin mensajes'
            )}
          </p>
          {estudiante.sinLeer > 0 && (
            <span className="px-2 py-0.5 bg-orange-500 text-white text-xs font-bold rounded-full">
              {estudiante.sinLeer}
            </span>
          )}
        </div>
      </div>

      {estudiante.plan === 'Pro Plus' && (
        <Crown className="h-4 w-4 text-amber-500 shrink-0" />
      )}
    </div>
  );

  const MessageBubble = ({ message }) => {
    const isOrientador = message.emisor === 'orientador';
    
    return (
      <div className={`flex ${isOrientador ? 'justify-end' : 'justify-start'} mb-3 group/message`}>
        <div className={`max-w-[70%] ${isOrientador ? 'order-2' : 'order-1'} animate-fade-in-up relative`}>
          <div
            className={`px-4 py-3 rounded-2xl ${
              isOrientador
                ? 'bg-linear-to-r from-orange-500 to-amber-500 text-white rounded-br-md shadow-md'
                : 'bg-white text-gray-800 rounded-bl-md shadow-sm border border-gray-100'
            }`}
          >
            <p className="text-sm whitespace-pre-wrap">{message.texto}</p>
            {message.archivo && (
                <div className="mt-2 text-xs">
                    {message.tipo_archivo?.startsWith('image/') || (message.nombre_archivo && /\.(jpg|jpeg|png|gif|webp)$/i.test(message.nombre_archivo)) ? (
                        <div className="relative group/image">
                            <a href={message.archivo.startsWith('blob:') ? message.archivo : `${STORAGE_URL}/${message.archivo}`} target="_blank" rel="noopener noreferrer">
                                <img 
                                    src={message.archivo.startsWith('blob:') ? message.archivo : `${STORAGE_URL}/${message.archivo}`} 
                                    alt="Adjunto" 
                                    className="max-w-full rounded-lg border border-white/20 max-h-64 object-cover"
                                />
                            </a>
                            <button 
                                onClick={async (e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    try {
                                        const response = await fetch(`${API_URL}/orientador/chat/mensajes/${message.id}/descargar`, {
                                            headers: { 'Authorization': `Bearer ${token}` }
                                        });
                                        if(!response.ok) throw new Error("Error server");
                                        const blob = await response.blob();
                                        const blobUrl = window.URL.createObjectURL(blob);
                                        const link = document.createElement('a');
                                        link.href = blobUrl;
                                        link.download = message.nombre_archivo || 'archivo';
                                        document.body.appendChild(link);
                                        link.click();
                                        document.body.removeChild(link);
                                        window.URL.revokeObjectURL(blobUrl);
                                    } catch (err) {
                                        console.error(err);
                                        window.open(`${STORAGE_URL}/${message.archivo}`, '_blank');
                                    }
                                }}
                                className="absolute bottom-2 right-2 p-2 bg-black/50 text-white rounded-full opacity-0 group-hover/image:opacity-100 transition-opacity hover:bg-black/70 cursor-pointer border-none"
                                title="Descargar imagen"
                            >
                                <Download size={16} />
                            </button>
                        </div>
                    ) : (
                        <a 
                            href={message.archivo.startsWith('blob:') ? message.archivo : `${STORAGE_URL}/${message.archivo}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className={`flex items-center gap-2 p-2 rounded-lg text-sm font-medium transition-colors ${
                                isOrientador 
                                    ? 'bg-white/20 text-white hover:bg-white/30' 
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            <Paperclip className="h-4 w-4" />
                            <span className="truncate max-w-[200px]">{message.nombre_archivo || 'Archivo adjunto'}</span>
                        </a>
                    )}
                </div>
            )}
            
            <button
                onClick={() => handleDeleteMessageRequest(message.id)}
                className={`absolute top-0 -right-8 p-1.5 text-gray-400 hover:text-red-500 rounded-full bg-white shadow-sm opacity-0 group-hover/message:opacity-100 transition-opacity ${isOrientador ? '-left-8 right-auto' : '-right-8'}`}
                title="Eliminar mensaje"
            >
                <Trash2 className="h-4 w-4" />
            </button>
            
          </div>

          <div className={`flex items-center gap-1 mt-1 ${isOrientador ? 'justify-end' : 'justify-start'}`}>
            <span className="text-xs text-gray-400">{formatTime(message.fecha)}</span>
            {isOrientador && (
              message.leido ? (
                <CheckCheck className="h-3 w-3 text-blue-500" />
              ) : (
                <Check className="h-3 w-3 text-gray-400" />
              )
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <>
        <HeaderOrientador />
        <div className="min-h-screen bg-linear-to-br from-orange-50 via-amber-50 to-yellow-50 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-600 font-medium">Cargando conversaciones...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="h-screen bg-white font-sans flex flex-col overflow-hidden">
      
      {/* Toast Notification */}
      {toast.show && (
          <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded-full shadow-lg flex items-center gap-2 animate-fade-in-down ${
              toast.type === 'error' ? 'bg-red-500 text-white' : 'bg-green-600 text-white'
          }`}>
              {toast.type === 'success' ? <CheckCheck size={18} /> : <span>!</span>}
              <span className="font-medium text-sm">{toast.message}</span>
          </div>
      )}

      {/* Confirmation Modal - Clear Chat */}
      {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
              <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full transform transition-all scale-100 border border-orange-100">
                  <div className="bg-orange-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Trash2 className="h-6 w-6 text-orange-600" />
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
                          className="flex-1 py-2.5 px-4 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-xl transition-colors shadow-lg shadow-orange-200"
                      >
                          Sí, vaciar
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* Confirmation Modal - Delete Single Message */}
      {showDeleteMessageModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
              <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full transform transition-all scale-100 border border-orange-100">
                  <div className="bg-orange-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Trash2 className="h-6 w-6 text-orange-600" />
                  </div>
                  <h3 className="text-lg font-bold text-center text-gray-900 mb-2">Eliminar mensaje</h3>
                  <p className="text-sm text-center text-gray-500 mb-6">
                      ¿Cómo quieres eliminar este mensaje?
                  </p>
                  <div className="flex flex-col gap-2">
                      <button 
                          onClick={() => confirmDeleteMessage('me')}
                          className="w-full py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors"
                      >
                          Eliminar para mí
                      </button>
                      <button 
                          onClick={() => confirmDeleteMessage('all')}
                          className="w-full py-2.5 px-4 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-xl transition-colors shadow-lg shadow-orange-200"
                      >
                          Eliminar para todos
                      </button>
                      <button 
                          onClick={() => setShowDeleteMessageModal(false)}
                          className="w-full py-2 px-4 text-gray-400 hover:text-gray-600 font-medium text-sm transition-colors mt-2"
                      >
                          Cancelar
                      </button>
                  </div>
              </div>
          </div>
      )}

      <HeaderOrientador />
      
      {/* Main Container - Full Screen */}
      <div className="flex-1 flex overflow-hidden">

          {/* Chat List */}
          <div className={`w-full md:w-80 lg:w-96 bg-white border-r border-orange-100 flex flex-col ${
            isMobileView && !showChatList ? 'hidden' : 'flex'
          }`}>
            {/* Search */}
            <div className="p-4 border-b border-gray-100">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar estudiante..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                />
              </div>
            </div>

            {/* Students List */}
            <div className="flex-1 overflow-y-auto">
              {filteredEstudiantes.length === 0 ? (
                <div className="p-8 text-center">
                  <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No hay estudiantes Pro Plus asignados</p>
                </div>
              ) : (
                filteredEstudiantes.map(est => (
                  <ChatListItem
                    key={est.id}
                    estudiante={est}
                    isSelected={selectedChat?.id === est.id}
                    onClick={setSelectedChat}
                  />
                ))
              )}
            </div>
            
            {/* Info Note */}
            <div className="p-4 bg-amber-50 border-t border-amber-100">
              <p className="text-xs text-amber-700 flex items-center gap-2">
                <Crown className="h-4 w-4" />
                Solo estudiantes con plan Pro Plus tienen acceso al chat
              </p>
            </div>
          </div>

          {/* Chat Area */}
          <div className={`flex-1 flex flex-col bg-slate-50 relative ${
            isMobileView && showChatList ? 'hidden' : 'flex'
          }`}>
            {selectedChat ? (
              <>
                {/* Chat Header */}
                <div className="px-6 py-4 bg-white border-b border-gray-100 flex items-center justify-between shrink-0 shadow-sm z-10">
                  <div className="flex items-center gap-3">
                    {isMobileView && (
                      <button
                        onClick={() => setShowChatList(true)}
                        className="p-2 hover:bg-gray-100 rounded-lg mr-2"
                      >
                        <ArrowLeft className="h-5 w-5 text-gray-600" />
                      </button>
                    )}
                    <div className="relative">
                      {selectedChat.avatar ? (
                        <img 
                          src={selectedChat.avatar.startsWith('http') ? selectedChat.avatar : `${STORAGE_URL}/${selectedChat.avatar}`} 
                          alt={selectedChat.nombre}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-linear-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white font-bold">
                          {selectedChat.nombre.charAt(0)}
                        </div>
                      )}
                      {selectedChat.online && (
                        <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white animate-pulse" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">{selectedChat.nombre}</h3>
                      <p className={`text-sm ${selectedChat.online ? 'text-green-600 font-medium' : 'text-gray-500'}`}>
                        {selectedChat.online ? 'En línea' : 'Desconectado'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button 
                        onClick={handleViewProfile}
                        className="flex items-center gap-2 px-3 py-2 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors font-medium border border-indigo-100"
                        title="Ver Perfil Completo"
                    >
                      <User className="h-4 w-4" />
                      <span className="hidden md:inline">Ver Perfil</span>
                    </button>
                    
                    {/* Botón de opciones (3 puntos) */}
                    <div className="relative">
                        <button 
                            onClick={() => setShowOptions(!showOptions)}
                            className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
                        >
                            <MoreVertical className="h-5 w-5" />
                        </button>
                        
                        {showOptions && (
                            <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-100 rounded-xl shadow-lg z-30 py-1 overflow-hidden">
                                <button
                                    onClick={handleClearChatRequest}
                                    className="w-full text-left px-4 py-3 text-red-600 hover:bg-red-50 flex items-center gap-2 text-sm font-medium transition-colors"
                                >
                                    <Trash2 className="h-4 w-4" />
                                    Vaciar chat
                                </button>
                            </div>
                        )}
                        {/* Overlay para cerrar menú al hacer click fuera */}
                        {showOptions && (
                            <div className="fixed inset-0 z-20" onClick={() => setShowOptions(false)}></div>
                        )}
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-6 bg-[url('https://subtlepatterns.com/patterns/subtle_white_feathers.png')]">
                  <div className="max-w-3xl mx-auto">
                    {messages.map(msg => (
                      <MessageBubble key={msg.id} message={msg} />
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                </div>

                {/* Preview de archivo seleccionado */}
                {selectedFile && (
                    <div className="absolute bottom-20 left-4 flex items-center gap-2 bg-white px-3 py-2 rounded-lg shadow-lg border border-orange-100 animate-fade-in-up z-20">
                        <div className="p-2 bg-orange-100 rounded-lg">
                            <Paperclip className="h-4 w-4 text-orange-600" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs font-semibold text-gray-700 truncate max-w-[200px]">{selectedFile.name}</span>
                            <span className="text-[10px] text-gray-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</span>
                        </div>
                        <button 
                            onClick={() => {
                                setSelectedFile(null);
                                if (fileInputRef.current) fileInputRef.current.value = '';
                            }}
                            className="p-1 hover:bg-gray-100 rounded-full text-gray-400 hover:text-red-500 transition-colors"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                )}

                {/* Input Area */}
                <div className="p-4 bg-white border-t border-gray-100 shrink-0 relative">
                  <div className="max-w-3xl mx-auto flex items-center gap-3">
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 hover:text-orange-500"
                        title="Adjuntar archivo"
                    >
                      <Paperclip className="h-5 w-5" />
                    </button>
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        onChange={handleFileSelect}
                        accept="image/*,.pdf,.doc,.docx"
                    />
                    
                    <div className="flex-1 relative">
                      <textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Escribe un mensaje..."
                        rows={1}
                        className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-xl resize-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        style={{ minHeight: '48px', maxHeight: '120px' }}
                      />
                      <button 
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-orange-500"
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      >
                        <Smile className="h-5 w-5" />
                      </button>
                      
                      {/* Emoji Picker Popover */}
                      {showEmojiPicker && (
                          <div className="absolute bottom-14 right-0 bg-white shadow-xl rounded-xl border border-gray-100 p-3 grid grid-cols-4 gap-2 w-48 animate-fade-in-up z-20">
                              {emojis.map(emoji => (
                                  <button 
                                    key={emoji}
                                    onClick={() => {
                                        setNewMessage(prev => prev + emoji);
                                        setShowEmojiPicker(false);
                                    }}
                                    className="text-2xl hover:bg-gray-100 p-2 rounded-lg transition-colors"
                                  >
                                      {emoji}
                                  </button>
                              ))}
                          </div>
                      )}
                    </div>
                    
                    <button
                      onClick={sendMessage}
                      disabled={!newMessage.trim() && !selectedFile}
                      className={`p-3 rounded-xl transition-all transform hover:scale-105 active:scale-95 ${
                        (newMessage.trim() || selectedFile)
                          ? 'bg-linear-to-r from-orange-500 to-amber-500 text-white shadow-lg hover:shadow-orange-200'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      <Send className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              /* Empty State */
              <div className="flex-1 flex items-center justify-center bg-linear-to-br from-orange-50/50 to-amber-50/50">
                <div className="text-center max-w-md px-8">
                  <div className="w-24 h-24 bg-linear-to-br from-orange-100 to-amber-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                    <MessageCircle className="h-12 w-12 text-orange-500" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">
                    Selecciona una conversación
                  </h3>
                  <p className="text-gray-500 mb-6">
                    Elige un estudiante de la lista para comenzar a chatear. Solo los estudiantes con plan Pro Plus tienen acceso al chat.
                  </p>
                  <div className="flex items-center justify-center gap-2 text-amber-600 bg-amber-50 py-2 px-4 rounded-full mx-auto w-fit">
                    <Crown className="h-5 w-5" />
                    <span className="font-medium">Función exclusiva Pro Plus</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      
        {/* Modal Profile */}
        <ModalPerfilEstudiante 
          isOpen={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          estudiante={studentDetail}
          loading={loadingProfile}
        />
      </div>
  );
};

export default OrientadorChat;
