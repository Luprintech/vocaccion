import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../api";
import { Mail, Lock, User, CheckCircle, AlertCircle, Eye, EyeOff, Lightbulb } from "lucide-react";
import GoogleAuthButton from "../components/GoogleAuthButton";
import AuthDivider from "../components/AuthDivider";

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ nombre: "", email: "", password: "", confirmPassword: "" });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

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

  // Validación en tiempo real
  const validateField = (name, value) => {
    const newErrors = { ...errors };
    delete newErrors.general;

    switch (name) {
      case "nombre":
        if (!value.trim()) {
          newErrors.nombre = "El nombre es obligatorio";
        } else if (value.length < 3) {
          newErrors.nombre = "El nombre debe tener al menos 3 caracteres";
        } else if (value.length > 255) {
          newErrors.nombre = "El nombre no puede exceder 255 caracteres";
        } else {
          delete newErrors.nombre;
        }
        break;

      case "email": {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!value.trim()) {
          newErrors.email = "El email es obligatorio";
        } else if (!emailRegex.test(value)) {
          newErrors.email = "El email no tiene un formato válido";
        } else if (value.length > 255) {
          newErrors.email = "El email no puede exceder 255 caracteres";
        } else {
          delete newErrors.email;
        }
        break;
      }

      case "password":
        if (!value) {
          newErrors.password = "La contraseña es obligatoria";
        } else if (value.length < 6) {
          newErrors.password = "La contraseña debe tener al menos 6 caracteres";
        } else if (!/(?=.*[a-z])/.test(value)) {
          newErrors.password = "Debe contener al menos una letra minúscula";
        } else if (!/(?=.*[A-Z])/.test(value)) {
          newErrors.password = "Debe contener al menos una letra mayúscula";
        } else if (!/(?=.*\d)/.test(value)) {
          newErrors.password = "Debe contener al menos un número";
        } else {
          delete newErrors.password;
        }
        
        // Validar confirmación si ya existe
        if (form.confirmPassword && value !== form.confirmPassword) {
          newErrors.confirmPassword = "Las contraseñas no coinciden";
        } else if (form.confirmPassword) {
          delete newErrors.confirmPassword;
        }
        break;

      case "confirmPassword":
        if (!value) {
          newErrors.confirmPassword = "Debes confirmar tu contraseña";
        } else if (value !== form.password) {
          newErrors.confirmPassword = "Las contraseñas no coinciden";
        } else {
          delete newErrors.confirmPassword;
        }
        break;

      default:
        break;
    }

    setErrors(newErrors);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    validateField(name, value);
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    validateField(name, value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMessage("");

    // Validar todos los campos
    validateField("nombre", form.nombre);
    validateField("email", form.email);
    validateField("password", form.password);
    validateField("confirmPassword", form.confirmPassword);

    // Verificar si hay errores
    if (Object.keys(errors).length > 0 || !form.nombre || !form.email || !form.password || !form.confirmPassword) {
      setErrors(prev => ({ ...prev, general: "Por favor, corrige los errores antes de continuar" }));
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const { confirmPassword: _confirmPassword, ...dataToSend } = form;
      const res = await registerUser(dataToSend);

      if (res.errors) {
        // Errores de validación del backend
        const backendErrors = {};
        Object.keys(res.errors).forEach(key => {
          backendErrors[key] = Array.isArray(res.errors[key]) 
            ? res.errors[key][0] 
            : res.errors[key];
        });
        setErrors(backendErrors);
      } else if (res.error) {
        // Error general del backend
        setErrors({ general: res.error });
      } else {
        // Éxito
        setSuccessMessage(res.message || "¡Registro exitoso! 🎉 Revisa tu email para verificar tu cuenta.");
        setForm({ nombre: "", email: "", password: "", confirmPassword: "" });
        
        // Redirigir al login después de 3 segundos
        setTimeout(() => {
          navigate("/login");
        }, 3000);
      }
    } catch {
      setErrors({ 
        general: "Error de conexión. Verifica que el servidor esté ejecutándose." 
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Indicador de fuerza de contraseña
  const getPasswordStrength = () => {
    const password = form.password;
    if (!password) return { strength: 0, label: "", color: "" };

    let strength = 0;
    if (password.length >= 6) strength++;
    if (password.length >= 10) strength++;
    if (/(?=.*[a-z])(?=.*[A-Z])/.test(password)) strength++;
    if (/(?=.*\d)/.test(password)) strength++;
    if (/(?=.*[!@#$%^&*])/.test(password)) strength++;

    const levels = [
      { label: "Muy débil", color: "bg-red-500" },
      { label: "Débil", color: "bg-orange-500" },
      { label: "Aceptable", color: "bg-yellow-500" },
      { label: "Fuerte", color: "bg-lime-500" },
      { label: "Muy fuerte", color: "bg-green-500" }
    ];

    return { strength: (strength / 5) * 100, ...levels[strength - 1] || levels[0] };
  };

  const passwordStrength = getPasswordStrength();

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
            <linearGradient id="grad1-register" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#a855f7', stopOpacity: 0.5 }} />
              <stop offset="100%" style={{ stopColor: '#22c55e', stopOpacity: 0.5 }} />
            </linearGradient>
            <linearGradient id="grad2-register" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#22c55e', stopOpacity: 0.5 }} />
              <stop offset="100%" style={{ stopColor: '#a855f7', stopOpacity: 0.5 }} />
            </linearGradient>
          </defs>
          {/* Ondas horizontales que se expanden por toda la pantalla con animación suave */}
          <path d="M0,100 Q400,50 800,100 T1600,100 T2400,100" stroke="url(#grad1-register)" strokeWidth="2" fill="none" className="animate-wave" style={{ animationDelay: '0s' }} />
          <path d="M0,250 Q350,200 700,250 T1400,250 T2100,250" stroke="url(#grad2-register)" strokeWidth="2" fill="none" className="animate-wave" style={{ animationDelay: '-1.2s' }} />
          <path d="M0,400 Q450,350 900,400 T1800,400 T2700,400" stroke="url(#grad1-register)" strokeWidth="2" fill="none" className="animate-wave" style={{ animationDelay: '-2.4s' }} />
          <path d="M0,550 Q500,480 1000,550 T2000,550 T3000,550" stroke="url(#grad2-register)" strokeWidth="2" fill="none" className="animate-wave" style={{ animationDelay: '-3.6s' }} />
          <path d="M0,700 Q420,630 840,700 T1680,700 T2520,700" stroke="url(#grad1-register)" strokeWidth="2" fill="none" className="animate-wave" style={{ animationDelay: '-4.8s' }} />
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
              
              {/* Badge decorativo */}
              {/* <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-linear-to-r from-green-400 to-green-500 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-md">
                ¡Descubre tu pasión!
              </div> */}
            </div>
          </div>
          <h2 className="text-4xl font-extrabold gradient-title mb-2">
            Únete a VocA(c)ción
          </h2>
          <p className="text-gray-600 text-sm font-medium">
            Crea tu cuenta y descubre tu futuro profesional
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
                <p className="text-green-600 text-sm mt-1">Redirigiendo al login...</p>
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

          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Campo Nombre */}
            <div>
              <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-2">
                Nombre completo
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="nombre"
                  type="text"
                  name="nombre"
                  placeholder="Ej: María García López"
                  value={form.nombre}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`block w-full pl-10 pr-3 py-3 border ${
                    errors.nombre ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-purple-500 focus:border-purple-500'
                  } rounded-lg focus:outline-none focus:ring-2 transition-colors`}
                  disabled={isLoading}
                />
              </div>
              {errors.nombre && (
                <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.nombre}
                </p>
              )}
            </div>

            {/* Campo Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email institucional o personal
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  name="email"
                  placeholder="estudiante@ejemplo.com"
                  value={form.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`block w-full pl-10 pr-3 py-3 border ${
                    errors.email ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-purple-500 focus:border-purple-500'
                  } rounded-lg focus:outline-none focus:ring-2 transition-colors`}
                  disabled={isLoading}
                />
              </div>
              {errors.email && (
                <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.email}
                </p>
              )}
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
                  placeholder="Mínimo 6 caracteres"
                  value={form.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`block w-full pl-10 pr-10 py-3 border ${
                    errors.password ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-purple-500 focus:border-purple-500'
                  } rounded-lg focus:outline-none focus:ring-2 transition-colors`}
                  disabled={isLoading}
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
              
              {/* Indicador de fuerza */}
              {form.password && (
                <div className="mt-2">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full ${passwordStrength.color} transition-all duration-300`}
                        style={{ width: `${passwordStrength.strength}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-gray-600">{passwordStrength.label}</span>
                  </div>
                </div>
              )}
              
              {errors.password && (
                <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.password}
                </p>
              )}
            </div>

            {/* Campo Confirmar Contraseña */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirmar contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  placeholder="Repite tu contraseña"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`block w-full pl-10 pr-10 py-3 border ${
                    errors.confirmPassword ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-purple-500 focus:border-purple-500'
                  } rounded-lg focus:outline-none focus:ring-2 transition-colors`}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            {/* Botón de registro */}
            <button
              type="submit"
              disabled={isLoading || Object.keys(errors).filter(key => key !== 'general').length > 0}
              className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-lg shadow-lg text-white bg-linear-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 font-semibold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98] hover:shadow-xl enabled:cursor-pointer"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Registrando...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Crear mi cuenta
                </>
              )}
            </button>
          </form>

          {/* Separador y botón de Google */}
          <AuthDivider />
          <GoogleAuthButton 
            disabled={isLoading}
            text="Registrarse con Google"
            className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-gray-300 rounded-lg shadow-lg text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 font-semibold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98] hover:shadow-xl"
          />

          {/* Link a login */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              ¿Ya tienes una cuenta?{" "}
              <Link
                to="/login"
                className="font-semibold text-purple-600 hover:text-purple-500 transition-colors"
              >
                Inicia sesión aquí
              </Link>
            </p>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            Al registrarte, aceptas nuestros{" "}
            <a href="#" className="text-purple-600 hover:underline">Términos de Servicio</a>
            {" "}y{" "}
            <a href="#" className="text-purple-600 hover:underline">Política de Privacidad</a>
          </p>
        </div>
      </div>
      </div>
    </div>
  );
}
