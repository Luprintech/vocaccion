import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContextFixed';

const OAuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    handleOAuthCallback();
  }, []);

  const handleOAuthCallback = async () => {
    try {
      const error = searchParams.get('error');
      const message = searchParams.get('message');
      const token = searchParams.get('token');
      const userParam = searchParams.get('user');
      const isNewUser = searchParams.get('new_user') === '1';
      const provider = searchParams.get('provider');

      if (error) {
        // Manejar diferentes tipos de errores
        let errorMessage = message;
        
        switch (error) {
          case 'email_already_registered':
            errorMessage = 'Este correo ya está registrado. Por favor, inicia sesión con tu contraseña.';
            break;
          case 'user_inactive':
            errorMessage = 'Tu cuenta está inactiva. Contacta al administrador.';
            break;
          case 'oauth_error':
            errorMessage = 'Error durante la autenticación con Google. Inténtalo de nuevo.';
            break;
          case 'invalid_google_response':
            errorMessage = 'No se pudieron obtener los datos de Google. Inténtalo de nuevo.';
            break;
          case 'user_creation_failed':
            errorMessage = 'No se pudo crear tu cuenta. Inténtalo de nuevo.';
            break;
          default:
            errorMessage = message || 'Error desconocido durante la autenticación.';
        }
        
        setError(errorMessage);
        setLoading(false);
        
        // Redirigir al login después de 3 segundos
        setTimeout(() => {
          navigate('/login', { 
            state: { 
              error: errorMessage,
              provider: provider 
            }
          });
        }, 3000);
        
        return;
      }

      if (!token || !userParam) {
        throw new Error('Token o datos de usuario faltantes en la respuesta');
      }

      // Decodificar datos del usuario
      const userData = JSON.parse(atob(userParam));
      
      // Usar el contexto de auth para hacer login
      await login(token, userData);
      
      // Mostrar mensaje de éxito
      setLoading(false);
      
      // Redirigir siempre a welcome
      setTimeout(() => {
        const message = isNewUser 
          ? `¡Bienvenido ${userData.nombre}! Tu cuenta ha sido creada exitosamente con ${provider}.`
          : `¡Hola de nuevo ${userData.nombre}! Has iniciado sesión con ${provider}.`;
          
        navigate('/welcome', { 
          state: { 
            message: message,
            isNewUser: isNewUser,
            provider: provider
          }
        });
      }, 1000);
      
    } catch (err) {
      console.error('Error procesando callback OAuth:', err);
      setError('Error procesando la respuesta de autenticación. Inténtalo de nuevo.');
      setLoading(false);
      
      setTimeout(() => {
        navigate('/login', { 
          state: { 
            error: 'Error procesando la respuesta de autenticación.'
          }
        });
      }, 3000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Procesando autenticación...
          </h2>
          <p className="text-gray-600">
            Por favor espera mientras completamos tu inicio de sesión.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 text-center">
          <div className="w-12 h-12 mx-auto mb-4 text-red-500">
            <svg fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Error de Autenticación
          </h2>
          <p className="text-red-600 mb-4">
            {error}
          </p>
          <p className="text-gray-600 text-sm">
            Serás redirigido al login en unos segundos...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 text-center">
        <div className="w-12 h-12 mx-auto mb-4 text-green-500">
          <svg fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          ¡Autenticación Exitosa!
        </h2>
        <p className="text-gray-600">
          Iniciando sesión, por favor espera...
        </p>
      </div>
    </div>
  );
};

export default OAuthCallback;