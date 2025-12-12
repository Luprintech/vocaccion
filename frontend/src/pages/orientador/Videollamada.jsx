import React, { useState, useEffect } from 'react';
import Header from '../../components/Header';
import { useAuth } from '../../context/AuthContextFixed';
import { Copy, RefreshCw, Video, Users } from 'lucide-react';

/**
 * Videollamada - Sala de Videollamadas Jitsi
 * 
 * Permite al orientador:
 * - Iniciar una sala de videollamada privada
 * - Generar nombres de sala aleatorios
 * - Compartir el link con estudiantes
 * - Copiar automáticamente el link
 * 
 * Integración: Jitsi Meet (iframe)
 * Seguridad: Sala única por sesión (aleatoria)
 * 
 * @component
 */
function Videollamada() {
  const { user } = useAuth();
  const [roomName, setRoomName] = useState('');
  const [showConferencia, setShowConferencia] = useState(false);
  const [copied, setCopied] = useState(false);

  // Generar nombre de sala aleatorio al montar
  useEffect(() => {
    generarNuevaSala();
  }, []);

  /**
   * Generar un nombre de sala único y aleatorio
   * Formato: Vocaccion-{timestamp}-{random}
   */
  const generarNuevaSala = () => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 9).toUpperCase();
    const nuevoNombre = `Vocaccion-${timestamp}-${random}`;
    setRoomName(nuevoNombre);
    setCopied(false);
  };

  /**
   * Copiar el link de la sala al portapapeles
   */
  const copiarLink = async () => {
    const link = `${window.location.origin}/videollamada/${roomName}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      console.error('Error al copiar:', err);
    }
  };

  const urlConferencia = `https://meet.jit.si/${roomName}?userInfo.displayName=${encodeURIComponent(user?.nombre || 'Orientador')}`;

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="space-y-6">
            {/* Header*/}
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Sala de Videollamadas</h1>
                <p className="text-gray-600 mt-1">Realiza sesiones de video con tus estudiantes</p>
              </div>
            </div>

      {/* Sección de Control */}
      <div className="bg-white rounded-lg shadow-lg p-8 border-l-4 border-blue-600">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Panel de Información */}
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Información de la Sala</h2>
              
              {/* Nombre de la Sala */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre de la Sala
                </label>
                <div className="bg-gray-50 border border-gray-300 rounded-lg p-3 font-mono text-sm text-gray-900 break-all">
                  {roomName}
                </div>
              </div>

              {/* Link Completo */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Link para Compartir
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={`${window.location.origin}/videollamada/${roomName}`}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm font-mono"
                  />
                  <button
                    onClick={copiarLink}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition font-medium ${
                      copied
                        ? 'bg-green-500 text-white'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700'
                    }`}
                  >
                    <Copy className="w-4 h-4" />
                    {copied ? '¡Copiado!' : 'Copiar'}
                  </button>
                </div>
              </div>

              {/* Botones de Acción */}
              <div className="space-y-3">
                <button
                  onClick={() => setShowConferencia(!showConferencia)}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition font-medium"
                >
                  <Video className="w-5 h-5" />
                  {showConferencia ? 'Cerrar Videollamada' : 'Iniciar Videollamada'}
                </button>

                <button
                  onClick={generarNuevaSala}
                  className="w-full flex items-center justify-center gap-2 bg-gray-200 text-gray-900 px-4 py-3 rounded-lg hover:bg-gray-300 transition font-medium"
                >
                  <RefreshCw className="w-5 h-5" />
                  Generar Nueva Sala
                </button>
              </div>

              {/* Información de Ayuda */}
              <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Cómo Usar
                </h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>✓ Comparte el link con tus estudiantes</li>
                  <li>✓ Cada sala es única y privada</li>
                  <li>✓ Puedes generar nuevas salas cuando quieras</li>
                  <li>✓ No requiere registro para los participantes</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Vista Previa */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4">Vista Previa</h3>
            <div className="bg-gray-100 rounded-lg p-6 text-center">
              <Video className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">
                {showConferencia
                  ? 'La videollamada se abrirá en el área inferior'
                  : 'Haz clic en "Iniciar Videollamada" para comenzar'}
              </p>
              {showConferencia && (
                <p className="text-sm text-green-600 font-medium">
                  ✓ Videollamada activa
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Iframe de Jitsi */}
      {showConferencia && (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="h-96 md:h-screen-half">
            <iframe
              src={urlConferencia}
              title="Jitsi Meet"
              allow="camera; microphone; display-capture"
              className="w-full h-full"
            />
          </div>
        </div>
      )}

      {/* Instrucciones */}
      {!showConferencia && (
        <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg p-6 border border-indigo-200">
          <h3 className="font-semibold text-indigo-900 mb-3">📋 Instrucciones de Uso</h3>
          <ol className="space-y-2 text-sm text-indigo-800">
            <li><strong>1.</strong> Se ha generado automáticamente un nombre de sala único</li>
            <li><strong>2.</strong> Haz clic en "Copiar" para guardar el link en tu portapapeles</li>
            <li><strong>3.</strong> Envía el link a tus estudiantes por correo o mensaje</li>
            <li><strong>4.</strong> Cuando estés listo, haz clic en "Iniciar Videollamada"</li>
            <li><strong>5.</strong> Tus estudiantes podrán acceder usando el link compartido</li>
            <li><strong>6.</strong> Para una nueva sesión, genera una nueva sala</li>
          </ol>
        </div>
      )}
          </div>
        </div>
      </main>
    </>
  );
}

export default Videollamada;
