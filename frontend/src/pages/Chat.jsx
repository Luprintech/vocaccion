import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { API_URL, STORAGE_URL } from '../api';
import { Send, Search, X, Paperclip, FileText, Smile, Download } from 'lucide-react';
import { useAuth } from '../context/AuthContextFixed';

/**
 * Chat.jsx
 * 
 * Sistema de mensajería interna entre orientadores y estudiantes.
 * Diseño de 2 columnas:
 * - Izquierda: Lista de contactos (estudiantes asignados)
 * - Derecha: Área de mensajes y input
 */
function Chat() {
  const { user } = useAuth();
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojis = ['😊', '👍', '👋', '🎉', '❤️', '🤔', '😂', '🔥', '👏', '🙌', '💪', '🤝'];

  // Estados
  const [contactos, setContactos] = useState([]);
  const [mensajes, setMensajes] = useState([]);
  const [contactoSeleccionado, setContactoSeleccionado] = useState(null);
  const [nuevoMensaje, setNuevoMensaje] = useState('');
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [error, setError] = useState(null);

  const token = localStorage.getItem('token');

  // Cargar contactos al montar y polling cada 10s
  useEffect(() => {
    cargarContactos();
    const interval = setInterval(() => cargarContactos(true), 10000);
    return () => clearInterval(interval);
  }, []);

  // Cargar mensajes cuando se selecciona un contacto
  // Cargar mensajes cuando se selecciona un contacto
  useEffect(() => {
    let interval;
    if (contactoSeleccionado) {
      cargarMensajes(contactoSeleccionado.id);
      interval = setInterval(() => cargarMensajes(contactoSeleccionado.id, true), 3000);
    }
    return () => clearInterval(interval);
  }, [contactoSeleccionado]);

  // Auto-scroll al final de mensajes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensajes]);

  /**
   * Cargar lista de contactos (estudiantes asignados)
   */
  const cargarContactos = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const response = await axios.get(`${API_URL}/orientador/chat/contactos?t=${Date.now()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setContactos(prev => JSON.stringify(prev) === JSON.stringify(response.data.contactos) ? prev : response.data.contactos);
      }
    } catch (err) {
      console.error('Error al cargar contactos:', err);
      setError('No se pudieron cargar los contactos');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Cargar mensajes con un estudiante específico
   */
  const cargarMensajes = async (usuarioId, silent = false) => {
    try {
      const response = await axios.get(
        `${API_URL}/orientador/chat/mensajes/${usuarioId}?t=${Date.now()}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setMensajes(prev => JSON.stringify(prev) === JSON.stringify(response.data.mensajes) ? prev : response.data.mensajes);
      }
    } catch (err) {
      console.error('Error al cargar mensajes:', err);
      setError('No se pudieron cargar los mensajes');
    }
  };

  /**
   * Enviar nuevo mensaje
   */
  /**
   * Enviar nuevo mensaje
   */
  const handleEnviarMensaje = async (e) => {
    e.preventDefault();

    if ((!nuevoMensaje.trim() && !selectedFile) || !contactoSeleccionado) {
      return;
    }

    // Guardar ref para el envío
    const fileToSend = selectedFile;
    const textToSend = nuevoMensaje;

    // Reset UI inmediato
    setNuevoMensaje('');
    setSelectedFile(null);
    setShowEmojiPicker(false);
    if (fileInputRef.current) fileInputRef.current.value = '';

    try {
      setEnviando(true);
      
      const formData = new FormData();
      formData.append('receptor_id', contactoSeleccionado.id);
      if (textToSend.trim()) formData.append('contenido', textToSend);
      if (fileToSend) formData.append('archivo', fileToSend);

      const response = await axios.post(
        `${API_URL}/orientador/chat/mensajes`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        // Agregar mensaje a la lista local
        setMensajes([...mensajes, response.data.mensaje]);
        
        // Recargar contactos
        cargarContactos(true);
      }
    } catch (err) {
      console.error('Error al enviar mensaje:', err);
      setError('No se pudo enviar el mensaje');
    } finally {
      setEnviando(false);
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

  /**
   * Filtrar contactos por búsqueda
   */
  const contactosFiltrados = contactos.filter(c =>
    c.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    c.email.toLowerCase().includes(busqueda.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* COLUMNA IZQUIERDA - Lista de contactos */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Mensajes</h2>

          {/* Barra de búsqueda */}
          <div className="relative">
            <Search size={18} className="absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar estudiante..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Lista de contactos */}
        <div className="flex-1 overflow-y-auto">
          {contactosFiltrados.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <p>No hay estudiantes asignados</p>
            </div>
          ) : (
            contactosFiltrados.map((contacto) => (
              <div
                key={contacto.id}
                onClick={() => setContactoSeleccionado(contacto)}
                className={`p-4 border-b border-gray-100 cursor-pointer transition-colors ${
                  contactoSeleccionado?.id === contacto.id
                    ? 'bg-indigo-50 border-l-4 border-l-indigo-600'
                    : 'hover:bg-gray-50'
                }`}
              >
                {/* Nombre y última actualización */}
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-semibold text-gray-800 truncate">
                    {contacto.nombre}
                  </h3>
                  {contacto.no_leidos > 0 && (
                    <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {contacto.no_leidos}
                    </span>
                  )}
                </div>

                {/* Último mensaje */}
                <p className="text-sm text-gray-600 truncate">
                  {contacto.ultimo_mensaje || 'No hay mensajes'}
                </p>

                {/* Fecha */}
                {contacto.fecha_ultimo_mensaje && (
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(contacto.fecha_ultimo_mensaje).toLocaleDateString('es-ES', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* COLUMNA DERECHA - Área de mensajes */}
      {contactoSeleccionado ? (
        <div className="flex-1 flex flex-col bg-white">
          {/* Header del chat */}
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <div>
              <h3 className="text-lg font-bold text-gray-800">
                {contactoSeleccionado.nombre}
              </h3>
              <p className="text-sm text-gray-500">{contactoSeleccionado.email}</p>
            </div>
            <button
              onClick={() => {
                setContactoSeleccionado(null);
                setMensajes([]);
              }}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <X size={20} className="text-gray-600" />
            </button>
          </div>

          {/* Área de mensajes */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded text-sm">
                {error}
              </div>
            )}

            {mensajes.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-500">
                <p>Inicia la conversación</p>
              </div>
            ) : (
              mensajes.map((msg) => {
                const esPropio = msg.emisor_id === user?.id;
                return (
                  <div
                    key={msg.id}
                    className={`flex ${esPropio ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        esPropio
                          ? 'bg-indigo-600 text-white rounded-br-none'
                          : 'bg-gray-200 text-gray-900 rounded-bl-none'
                      }`}
                    >
                      <p className="text-sm break-words">{msg.contenido}</p>
                      {msg.archivo && (
                        <div className="mt-2 text-xs">
                           {msg.tipo_archivo?.startsWith('image/') || (msg.nombre_archivo && /\.(jpg|jpeg|png|gif|webp)$/i.test(msg.nombre_archivo)) ? (
                              <div className="relative group">
                                <a href={`${STORAGE_URL}/${msg.archivo}`} target="_blank" rel="noopener noreferrer">
                                  <img src={`${STORAGE_URL}/${msg.archivo}`} alt="Adjunto" className="max-w-full rounded border border-white/20 max-h-56 object-cover" />
                                </a>
                                <a 
                                  href={`${STORAGE_URL}/${msg.archivo}`} 
                                  download={msg.nombre_archivo || 'download'}
                                  className="absolute bottom-2 right-2 p-2 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
                                  title="Descargar"
                                >
                                  <Download size={16} />
                                </a>
                              </div>
                           ) : (
                              <a href={`${STORAGE_URL}/${msg.archivo}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-white/20 p-2 rounded hover:bg-white/30 transition border border-indigo-200/50">
                                <Paperclip size={16} />
                                <div className="flex flex-col overflow-hidden">
                                  <span className="truncate max-w-[150px] font-medium">{msg.nombre_archivo || 'Archivo adjunto'}</span>
                                  <span className="text-[10px] opacity-75">Descargar</span>
                                </div>
                                <Download size={14} className="ml-auto" />
                              </a>
                           )}
                        </div>
                      )}
                      <p
                        className={`text-xs mt-1 ${
                          esPropio ? 'text-indigo-100' : 'text-gray-500'
                        }`}
                      >
                        {new Date(msg.created_at).toLocaleTimeString('es-ES', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input para enviar mensaje */}
          <div className="p-4 border-t border-gray-200 bg-white relative">
            {/* Preview Archivo */}
            {selectedFile && (
                <div className="absolute bottom-full left-4 mb-2 flex items-center gap-2 bg-white px-3 py-2 rounded-lg shadow-lg border border-indigo-100 animate-fade-in-up">
                    <Paperclip size={14} className="text-indigo-600" />
                    <span className="text-xs font-medium text-gray-700 truncate max-w-[200px]">{selectedFile.name}</span>
                    <button onClick={() => { setSelectedFile(null); if(fileInputRef.current) fileInputRef.current.value = ''; }} className="text-gray-400 hover:text-red-500">
                        <X size={14} />
                    </button>
                </div>
            )}
            
            <form
              onSubmit={handleEnviarMensaje}
              className="flex gap-2 items-center"
            >
              <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  onChange={handleFileSelect}
              />
              <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-gray-100 rounded-full transition"
                  title="Adjuntar archivo"
              >
                  <Paperclip size={20} />
              </button>
            <div className="relative flex-1">
              <input
                type="text"
                value={nuevoMensaje}
                onChange={(e) => setNuevoMensaje(e.target.value)}
                placeholder="Escribe un mensaje..."
                disabled={enviando}
                className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
              />
              <button 
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-indigo-600 p-1 rounded-full hover:bg-gray-100"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              >
                <Smile size={20} />
              </button>

              {/* Emoji Picker Popover */}
              {showEmojiPicker && (
                  <div className="absolute bottom-12 right-0 bg-white shadow-xl rounded-xl border border-gray-200 p-3 grid grid-cols-4 gap-2 w-48 animate-fade-in-up z-20">
                      {emojis.map(emoji => (
                          <button 
                            key={emoji}
                            type="button"
                            onClick={() => {
                                setNuevoMensaje(prev => prev + emoji);
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
              type="submit"
              disabled={enviando || (!nuevoMensaje.trim() && !selectedFile)}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition disabled:bg-gray-400 flex items-center gap-2 shadow-base"
            >
              {enviando ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Send size={18} />
              )}
            </button>
          </form>
        </div>
        </div>
      ) : (
        // Estado vacío si no hay contacto seleccionado
        <div className="flex-1 flex items-center justify-center bg-white">
          <div className="text-center text-gray-500">
            <div className="text-5xl mb-4">💬</div>
            <p className="text-lg font-medium">Selecciona un estudiante para chatear</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default Chat;
