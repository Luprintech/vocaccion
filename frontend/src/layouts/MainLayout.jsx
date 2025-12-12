/**
 * MAIN LAYOUT - Estructura común para todas las páginas
 * 
 * Este componente define la estructura base que comparten todas las páginas:
 * - Header (navegación) en la parte superior
 * - Main (contenido de cada página) en el centro
 * - Footer (información de contacto) en la parte inferior
 */

import { Outlet, useLocation } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ToastProvider from "@/components/ToastProvider";
import { useEffect, useState } from "react";
import { useAuth } from '../context/AuthContextFixed';
import "../styles/layout.css";

export default function MainLayout() {
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const [rol, setRol] = useState("estudiante");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Obtener el rol del usuario desde localStorage tras login
    const r = localStorage.getItem("rol") || "estudiante";
    setRol(r);
  }, [location]);

  return (
    <ToastProvider>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header
          showSidebar={false} // Sidebar desactivado globalmente
          onToggleSidebar={() => { }}
        />

        {/* Layout principal sin sidebar */}
        <div className="flex flex-1 items-stretch relative">

          {/* Contenido principal - Ancho completo */}
          <main className="flex-1 min-h-0 transition-all duration-300">
            <div className="w-full">
              <Outlet />
            </div>
          </main>
        </div>

        {/* Footer al final */}
        <Footer />
      </div>
    </ToastProvider>
  );
}

