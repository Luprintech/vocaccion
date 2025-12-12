import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginUser } from "../api";
import { useAuth } from "../context/AuthContextFixed";
import { Mail, Lock, CheckCircle, AlertCircle, Eye, EyeOff, LogIn, Lightbulb } from "lucide-react";
import GoogleAuthButton from "../components/GoogleAuthButton";
import AuthDivider from "../components/AuthDivider";

export default function Login() {
  const navigate = useNavigate();
  const { login: authLogin } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [verificado, setVerificado] = useState(null);

  // Generar partículas aleatorias (solo una vez al montar el componente)
  const [particles] = useState(() => {
    return Array.from({ length: 20 }, (_, i) => ({
      id: i,
      top: Math.random() * 100,
      left: Math.random() * 100,
      size: Math.random() * 4 + 4, // 2-5px
      opacity: Math.random() * 0.3 + 0.5, // 0.5-0.8
      delay: Math.random() * 5000,
      color: Math.random() > 0.5 ? 'purple' : 'green',
      shade: Math.random() > 0.5 ? '300' : '400'
    }));
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    // Limpiar error del campo al escribir
    if (errors[name]) {
      setErrors({ ...errors, [name]: null });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setSuccessMessage("");
    setIsLoading(true);

    try {
      const res = await loginUser(form);
      
      if (res.error || res.errors) {
        setErrors({ 
          general: res.error || "Error en las credenciales. Verifica tus datos." 
        });
        setVerificado(null);
      } else {
        setSuccessMessage("¡Bienvenido a VocAcción!");
        setVerificado(res.email_verificado);
        
        // Guardar el token de Sanctum
        if (res.token) {
          localStorage.setItem('token', res.token);
        }
        
        // Extraer roles y guardar el rol primario
        let rol = "estudiante";
        if (res.usuario && res.usuario.roles && res.usuario.roles.length > 0) {
          rol = res.usuario.roles[0].nombre;
        }
        localStorage.setItem("rol", rol);
        
        // Actualizar el estado de autenticación global (SPA) con roles
        const userObj = {
          ...(res.usuario || { email: res.email }),
          roles: res.usuario?.roles || []
        };
        try {
          await authLogin({ user: userObj, token: res.token });
        } catch (err) {
          console.error('authLogin error', err);
        }
        
        // Redirigir según el rol del usuario
        if (res.email_verificado) {
          setTimeout(() => {
            if (rol === "administrador") {
              navigate('/admin/dashboard');
            } else if (rol === "orientador") {
              navigate('/orientador/dashboard');
            } else {
              // estudiante por defecto
              navigate('/welcome');
            }
          }, 1500);
        } else {
          setErrors({ 
            general: 'Tu email no está verificado. Revisa tu correo y haz clic en el enlace de verificación.'
          });
        }
      }
    } catch {
      setErrors({ 
        general: "Error de conexión. Verifica que el servidor esté ejecutándose." 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-linear-to-br from-purple-50 via-white to-green-50 flex flex-col">
      
      {/* Fondo animado con burbujas/partículas flotantes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Círculos grandes animados */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-green-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-1/3 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>
        
        {/* Partículas pequeñas flotantes - POSICIONES ALEATORIAS */}
        {particles.map((particle) => (
          <div
            key={particle.id}
            className={`absolute bg-${particle.color}-${particle.shade} rounded-full animate-float`}
            style={{
              top: `${particle.top}%`,
              left: `${particle.left}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              opacity: particle.opacity,
              animationDelay: `${particle.delay}ms`
            }}
          />
        ))}
        
        {/* Ondas decorativas dinámicas que ocupan todo el ancho */}
        <svg className="absolute top-0 left-0 w-full h-full" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
          <defs>
            <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#a855f7', stopOpacity: 0.5 }} />
              <stop offset="100%" style={{ stopColor: '#22c55e', stopOpacity: 0.5 }} />
            </linearGradient>
            <linearGradient id="grad2" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#22c55e', stopOpacity: 0.5 }} />
              <stop offset="100%" style={{ stopColor: '#a855f7', stopOpacity: 0.5 }} />
            </linearGradient>
          </defs>
          {/* Ondas horizontales que se expanden por toda la pantalla con animación suave */}
          <path d="M0,100 Q400,50 800,100 T1600,100 T2400,100" stroke="url(#grad1)" strokeWidth="2" fill="none" className="animate-wave" style={{ animationDelay: '0s' }} />
          <path d="M0,250 Q350,200 700,250 T1400,250 T2100,250" stroke="url(#grad2)" strokeWidth="2" fill="none" className="animate-wave" style={{ animationDelay: '-1.2s' }} />
          <path d="M0,400 Q450,350 900,400 T1800,400 T2700,400" stroke="url(#grad1)" strokeWidth="2" fill="none" className="animate-wave" style={{ animationDelay: '-2.4s' }} />
          <path d="M0,550 Q500,480 1000,550 T2000,550 T3000,550" stroke="url(#grad2)" strokeWidth="2" fill="none" className="animate-wave" style={{ animationDelay: '-3.6s' }} />
          <path d="M0,700 Q420,630 840,700 T1680,700 T2520,700" stroke="url(#grad1)" strokeWidth="2" fill="none" className="animate-wave" style={{ animationDelay: '-4.8s' }} />
        </svg>
      </div>

      {/* Contenido principal con flex-grow para empujar el footer */}
      <div className="grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 relative z-10">
        
        {/* Header con logo mejorado */}
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="relative">
              {/* Círculo de fondo con gradiente */}
              <div className="absolute inset-0 bg-linear-to-br from-purple-400 to-green-400 rounded-full blur-lg opacity-30 animate-pulse"></div>
              
              {/* Icono de bombilla */}
              <div className="relative bg-white rounded-full p-4 shadow-lg">
                <Lightbulb className="w-12 h-12 text-purple-500" strokeWidth={2} />
              </div>
            </div>
          </div>
          <h2 className="text-4xl font-extrabold gradient-title mb-2">
            Bienvenido a VocA(c)ción
          </h2>
          <p className="text-gray-600 text-sm font-medium">
            Inicia sesión para continuar tu camino profesional
          </p>
        </div>

        {/* Formulario */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 border-t-4 border-purple-400">
          
          {/* Mensaje de éxito */}
          {successMessage && (
            <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-400 rounded-r-lg flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
              <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-green-800 font-medium">{successMessage}</p>
                <p className="text-green-600 text-sm mt-1">Redirigiendo...</p>
              </div>
            </div>
          )}

          {/* Error general */}
          {errors.general && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-400 rounded-r-lg flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <p className="text-red-800 text-sm">{errors.general}</p>
            </div>
          )}

          {/* Advertencia de email no verificado */}
          {verificado === false && (
            <div className="mb-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-r-lg flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-yellow-800 text-sm font-medium">Email no verificado</p>
                <p className="text-yellow-700 text-sm mt-1">
                  Revisa tu correo y haz clic en el enlace de verificación para acceder a todas las funcionalidades.
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Campo Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  name="email"
                  placeholder="tu@email.com"
                  value={form.email}
                  onChange={handleChange}
                  className={`block w-full pl-10 pr-3 py-3 border ${
                    errors.email ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-purple-500 focus:border-purple-500'
                  } rounded-lg focus:outline-none focus:ring-2 transition-colors`}
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            {/* Campo Contraseña */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Tu contraseña"
                  value={form.password}
                  onChange={handleChange}
                  className={`block w-full pl-10 pr-10 py-3 border ${
                    errors.password ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-purple-500 focus:border-purple-500'
                  } rounded-lg focus:outline-none focus:ring-2 transition-colors`}
                  disabled={isLoading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
            </div>

            {/* Link de olvido de contraseña */}
            <div className="flex items-center justify-between">
              <div className="text-sm">
                <button 
                  type="button"
                  onClick={() => navigate("/forgot-password")}
                  className="font-medium text-purple-600 hover:text-purple-500 transition-colors bg-transparent border-0 cursor-pointer p-0"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
            </div>

            {/* Botón de login */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-lg shadow-lg text-white bg-linear-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 font-semibold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98] hover:shadow-xl enabled:cursor-pointer"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Iniciando sesión...
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  Iniciar sesión
                </>
              )}
            </button>
          </form>

          {/* Separador y botón de Google */}
          <AuthDivider />
          <GoogleAuthButton 
            disabled={isLoading}
            text="Continuar con Google"
            className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-gray-300 rounded-lg shadow-lg text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 font-semibold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98] hover:shadow-xl"
          />

          {/* Link a registro */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              ¿No tienes una cuenta?{" "}
              <Link
                to="/register"
                className="font-semibold text-purple-600 hover:text-purple-500 transition-colors"
              >
                Regístrate aquí
              </Link>
            </p>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            ¿Necesitas ayuda?{" "}
            <Link to="/contacto" className="text-purple-600 hover:underline">
              Contáctanos
            </Link>
          </p>
        </div>
      </div>
      </div>
    </div>
  );
}
