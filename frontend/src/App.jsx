/**
 * APP.JSX - Componente principal de la aplicación VocAcción
 * 
 * Este archivo configura todas las rutas de la aplicación.
 * Utiliza React Router para la navegación y MainLayout para 
 * que todas las páginas tengan Header y Footer consistentes.
 * 
 * COLABORADORES: Para añadir nuevas páginas:
 * 1. Importad el componente aquí arriba
 * 2. Añadid una nueva <Route> dentro del MainLayout
 * 3. Aseguraos de que la ruta coincida con el enlace del Header
 * 
 * ESTRUCTURA:
 * - MainLayout envuelve todas las rutas (Header + contenido + Footer)
 * - Cada Route renderiza un componente específico
 * - Sistema de rutas anidadas para recursos organizados
 */

import { Routes, Route } from 'react-router-dom'
import './App.css'

// Páginas principales
import Home from "./pages/Home.jsx";
import MainLayout from "./layouts/MainLayout.jsx";
import DashboardLayout from "./layouts/DashboardLayout.jsx";
import Servicios from "./pages/Servicios.jsx";
import Planes from "./pages/Planes.jsx";
import Contacto from "./pages/Contacto.jsx";
import Testimonios from "./pages/Testimonios.jsx"; // Import Testimonios

// Páginas de recursos organizadas
import RecursosIndex from "./pages/recursos/RecursosIndex.jsx";
import ArticulosListado from "./pages/recursos/ArticulosListado.jsx";
import ArticuloDetalle from "./pages/recursos/ArticuloDetalle.jsx";
import GuiasListado from "./pages/recursos/GuiasListado.jsx";
import GuiaDetalle from "./pages/recursos/GuiaDetalleNueva.jsx";
import ComunidadesListado from "./pages/recursos/ComunidadesListado.jsx";


// Páginas de autenticación
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import OAuthCallback from "./components/OAuthCallback.jsx";
import Perfil from "./pages/Perfil.jsx";
import MySubscription from "./pages/perfil/MySubscription.jsx";
import WelcomePage from "./pages/WelcomePage.jsx";
import ProtectedRoute from "./components/ProtectedRoute";
import RequireRole from "./components/RequireRole";

// Páginas legales
import PrivacyPolicy from "./pages/legal/PrivacyPolicy.jsx";
import TermsOfService from "./pages/legal/TermsOfService.jsx";
import CookiePolicy from "./pages/legal/CookiePolicy.jsx";
import LegalNotice from "./pages/legal/LegalNotice.jsx";

//Test
import TestVocacional from "./pages/test/TestVocacional.jsx";
import TestIntro from "./pages/test/TestIntro.jsx";
import ResultadosTest from "./pages/test/ResultadosTest.jsx";
import MiProfesion from "./pages/mi-profesion/MiProfesion.jsx";
import ItinerarioAcademico from "./pages/itinerario/ItinerarioAcademico";

// Dashboards por rol
import EstudianteDashboard from "./pages/dashboards/EstudianteDashboard.jsx";
import OrientadorDashboard from "./pages/dashboards/OrientadorDashboard.jsx";
import AdminDashboard from "./pages/dashboards/AdminDashboard.jsx";
import AdminUsuarios from "./pages/dashboards/AdminUsuarios.jsx";
import AdminOrientadores from "./pages/dashboards/AdminOrientadores.jsx";
import AdminEstadisticas from "./pages/dashboards/AdminEstadisticas.jsx";
import AdminTestimonios from "./pages/dashboards/AdminTestimonios.jsx";
import AdminVerTest from "./pages/dashboards/AdminVerTest.jsx";
import AdminVerProfesiones from "./pages/dashboards/AdminVerProfesiones.jsx";
import AdminVerItinerario from "./pages/dashboards/AdminVerItinerario.jsx";
import AdminVerPerfil from "./pages/dashboards/AdminVerPerfil.jsx";

// Páginas del Orientador
import OrientadorRecursos from "./pages/orientador/OrientadorRecursos.jsx";
import OrientadorEstudiantes from "./pages/orientador/OrientadorEstudiantes.jsx";
import OrientadorAnalisis from "./pages/orientador/OrientadorAnalisis.jsx";
import OrientadorChat from "./pages/orientador/OrientadorChat.jsx";
import OrientadorVideollamada from "./pages/orientador/OrientadorVideollamada.jsx";
import OrientadorVerTest from "./pages/orientador/OrientadorVerTest.jsx";
import OrientadorVerProfesiones from "./pages/orientador/OrientadorVerProfesiones.jsx";
import OrientadorVerItinerario from "./pages/orientador/OrientadorVerItinerario.jsx";
import Chat from "./pages/Chat.jsx";

import Recursos from "./pages/orientador/Recursos.jsx";
import MisGuias from "./pages/orientador/MisGuias.jsx";
import Videollamada from "./pages/orientador/Videollamada.jsx";

// Páginas del Estudiante
import EstudianteMensajes from "./pages/estudiante/EstudianteMensajes.jsx";
import ReservarSesion from "./pages/estudiante/ReservarSesion.jsx";
import MisReservas from "./pages/estudiante/MisReservas.jsx";

import ScrollAlInicio from './components/ScrollAlInicio';



function App() {
  return (
    <>
      <ScrollAlInicio />
      <Routes>
        {/* LAYOUT PRINCIPAL - Todas las rutas heredan Header y Footer */}
        <Route element={<MainLayout />}>

          {/* PÁGINA PRINCIPAL - Completamente desarrollada */}
          <Route path="/" element={<Home />} />
          
          <Route path="/testimonios" element={<Testimonios />} />

          {/* PÁGINA SERVICIOS - Completamente desarrollada */}
          <Route path="/servicios" element={<Servicios />} />

          {/* PÁGINA PLANES - Completamente desarrollada */}
          <Route path="/planes" element={<Planes />} />

          {/* SECCIÓN RECURSOS - Sistema completo con rutas anidadas */}

          {/* Nueva estructura de recursos organizados */}
          <Route path="/recursos" element={<RecursosIndex />} />

          {/* Artículos */}
          <Route path="/recursos/articulos" element={<ArticulosListado />} />
          <Route path="/recursos/articulos/:slug" element={<ArticuloDetalle />} />

          {/* Guías descargables */}
          <Route path="/recursos/guias" element={<GuiasListado />} />
          <Route path="/recursos/guias/:id" element={<GuiaDetalle />} />

          {/* Recursos por comunidades */}
          <Route path="/recursos/comunidades" element={<ComunidadesListado />} />
          <Route path="/recursos/comunidades/:slug" element={
            <div className="container mx-auto px-4 py-16 text-center">
              <h1 className="text-3xl font-bold text-gray-800 mb-4">Recursos de Comunidad</h1>
              <p className="text-lg text-gray-600">Información específica por comunidad próximamente</p>
            </div>
          } />

          {/* Mapa interactivo */}


          {/* PÁGINA TEST - protegida */}
          {/* /testintro: Página introductoria que explica el propósito del test */}
          {/* /test: Test vocacional real con las 20 preguntas */}
          <Route path="/testintro" element={<ProtectedRoute><TestIntro /></ProtectedRoute>} />
          <Route path="/test" element={<ProtectedRoute><TestVocacional /></ProtectedRoute>} />
          <Route path="/resultados" element={<ProtectedRoute><ResultadosTest /></ProtectedRoute>} />
          <Route path="/mi-profesion" element={<ProtectedRoute><MiProfesion /></ProtectedRoute>} />
          
          {/* Rutas requeridas para Plan PRO o superior */}
          <Route path="/itinerario" element={<ProtectedRoute requiredPlan="pro"><ItinerarioAcademico /></ProtectedRoute>} />

          {/* Rutas requeridas para Plan PRO PLUS */}
          {/* Chat con orientador para estudiantes Pro Plus */}
          <Route path="/estudiante/mensajes" element={<ProtectedRoute requiredPlan="pro_plus"><EstudianteMensajes /></ProtectedRoute>} />

          <Route path="/perfil" element={<ProtectedRoute><Perfil /></ProtectedRoute>} />
          <Route path="/mi-suscripcion" element={<ProtectedRoute><MySubscription /></ProtectedRoute>} />
          <Route path="/contacto" element={<Contacto />} />

          {/* Reservas para estudiantes Pro Plus */}
          <Route path="/reservar" element={<ProtectedRoute requiredPlan="pro_plus"><ReservarSesion /></ProtectedRoute>} />
          <Route path="/estudiante/reservas" element={<ProtectedRoute requiredPlan="pro_plus"><MisReservas /></ProtectedRoute>} />

          {/* Páginas legales */}
          <Route path="/legal/privacidad" element={<PrivacyPolicy />} />
          <Route path="/legal/terminos" element={<TermsOfService />} />
          <Route path="/legal/cookies" element={<CookiePolicy />} />
          <Route path="/legal/aviso-legal" element={<LegalNotice />} />

          {/* Rutas de autenticación */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ForgotPassword />} />
          <Route path="/oauth/callback" element={<OAuthCallback />} />
          <Route path="/welcome" element={<ProtectedRoute><WelcomePage /></ProtectedRoute>} />
        </Route>

        {/* DASHBOARDS - Rutas sin MainLayout (tienen su propio layout con sidebar) */}
        <Route
          path="/estudiante/dashboard"
          element={
            <ProtectedRoute>
              <RequireRole roles="estudiante">
                <EstudianteDashboard />
              </RequireRole>
            </ProtectedRoute>
          }
        />
        <Route
          path="/orientador/dashboard"
          element={
            <ProtectedRoute>
              <RequireRole roles={["orientador", "administrador"]}>
                <OrientadorDashboard />
              </RequireRole>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute>
              <RequireRole roles="administrador">
                <AdminDashboard />
              </RequireRole>
            </ProtectedRoute>
          }
        />

        {/* RUTAS DE ADMINISTRADOR - Gestión de usuarios, orientadores y estadísticas */}
        <Route
          path="/admin/usuarios"
          element={
            <ProtectedRoute>
              <RequireRole roles="administrador">
                <AdminUsuarios />
              </RequireRole>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/orientadores"
          element={
            <ProtectedRoute>
              <RequireRole roles="administrador">
                <AdminOrientadores />
              </RequireRole>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/estadisticas"
          element={
            <ProtectedRoute>
              <RequireRole roles="administrador">
                <AdminEstadisticas />
              </RequireRole>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/testimonios"
          element={
            <ProtectedRoute>
              <RequireRole roles="administrador">
                <AdminTestimonios />
              </RequireRole>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/estudiantes/:id/test"
          element={
            <ProtectedRoute>
              <RequireRole roles="administrador">
                <AdminVerTest />
              </RequireRole>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/estudiantes/:id/profesiones"
          element={
            <ProtectedRoute>
              <RequireRole roles="administrador">
                <AdminVerProfesiones />
              </RequireRole>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/estudiantes/:id/itinerario"
          element={
            <ProtectedRoute>
              <RequireRole roles="administrador">
                <AdminVerItinerario />
              </RequireRole>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/estudiantes/:id/perfil"
          element={
            <ProtectedRoute>
              <RequireRole roles="administrador">
                <AdminVerPerfil />
              </RequireRole>
            </ProtectedRoute>
          }
        />

        {/* RUTAS DEL ORIENTADOR - Aula Virtual y Videollamadas */}
        <Route
          path="/orientador/estudiantes"
          element={
            <ProtectedRoute>
              <RequireRole roles={["orientador", "administrador"]}>
                <OrientadorEstudiantes />
              </RequireRole>
            </ProtectedRoute>
          }
        />
        <Route
          path="/orientador/estudiante/:id/test"
          element={
            <ProtectedRoute>
              <RequireRole roles={["orientador", "administrador"]}>
                <OrientadorVerTest />
              </RequireRole>
            </ProtectedRoute>
          }
        />
        <Route
          path="/orientador/estudiante/:id/profesiones"
          element={
            <ProtectedRoute>
              <RequireRole roles={["orientador", "administrador"]}>
                <OrientadorVerProfesiones />
              </RequireRole>
            </ProtectedRoute>
          }
        />
        <Route
          path="/orientador/estudiante/:id/itinerario"
          element={
            <ProtectedRoute>
              <RequireRole roles={["orientador", "administrador"]}>
                <OrientadorVerItinerario />
              </RequireRole>
            </ProtectedRoute>
          }
        />
        <Route
          path="/orientador/analisis"
          element={
            <ProtectedRoute>
              <RequireRole roles={["orientador", "administrador"]}>
                <OrientadorAnalisis />
              </RequireRole>
            </ProtectedRoute>
          }
        />
        <Route
          path="/orientador/chat"
          element={
            <ProtectedRoute>
              <RequireRole roles={["orientador", "administrador"]}>
                <OrientadorChat />
              </RequireRole>
            </ProtectedRoute>
          }
        />
        <Route
          path="/orientador/videollamada"
          element={
            <ProtectedRoute>
              <RequireRole roles={["orientador", "administrador"]}>
                <OrientadorVideollamada />
              </RequireRole>
            </ProtectedRoute>
          }
        />
        <Route
          path="/orientador/recursos"
          element={
            <ProtectedRoute>
              <RequireRole roles={["orientador", "administrador"]}>
                <OrientadorRecursos />
              </RequireRole>
            </ProtectedRoute>
          }
        />

        {/* RUTA DEL CHAT - Mensajería interna */}
        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <RequireRole roles={["orientador", "administrador"]}>
                <Chat />
              </RequireRole>
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  );
}

export default App;
