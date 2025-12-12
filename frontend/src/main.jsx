/**
 * MAIN.JSX - Punto de entrada de la aplicación React
 * 
 * Este archivo inicializa la aplicación y configura:
 * - BrowserRouter: Enrutamiento del navegador para React Router
 * - Renderizado en el elemento HTML con id="root"
 * 
 * COLABORADORES: NO modificar este archivo salvo casos excepcionales.
 * Si necesitáis configurar providers globales (contextos, temas, etc.),
 * añadidlos aquí envolviendo el componente App.
 */

import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css';
import './bootstrap'; // Import bootstrap config (Axios defaults)
import App from './App.jsx'

// Context
import { AuthProvider } from './context/AuthContextFixed'

// Renderiza la aplicación en el DOM
// StrictMode eliminado para compatibilidad con React Quill
createRoot(document.getElementById('root')).render(
  <AuthProvider>
    <BrowserRouter> {/* Habilita el enrutamiento de React Router */}
      <App />
    </BrowserRouter>
  </AuthProvider>,
)
