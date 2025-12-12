import React, { createContext, useContext, useEffect, useState } from 'react'

// Contexto de autenticación y hook helper
// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext({
  user: null,
  token: null,
  login: async () => null,
  logout: () => {},
  isAuthenticated: false,
  getRoles: () => [],
  getPrimaryRole: () => null,
})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem('user')
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  })

  const [token, setToken] = useState(() => {
    try {
      return localStorage.getItem('token') || null
    } catch {
      return null
    }
  })

  useEffect(() => {
    try {
      if (user) {
        localStorage.setItem('user', JSON.stringify(user))
      } else {
        localStorage.removeItem('user')
      }
    } catch {
      // Silenciar errores del localStorage
    }
  }, [user])

  useEffect(() => {
    try {
      if (token) {
        localStorage.setItem('token', token)
      } else {
        localStorage.removeItem('token')
      }
    } catch {
      // Silenciar errores del localStorage
    }
  }, [token])

  const login = async (tokenOrPayload, userData = null) => {
    // Si se pasan dos parámetros, es un login OAuth (token, userData)
    if (typeof tokenOrPayload === 'string' && userData) {
      setToken(tokenOrPayload)
      setUser(userData)
      return userData
    }
    
    // Si es un objeto con user y token (login tradicional)
    if (tokenOrPayload?.user) {
      const userWithRoles = {
        ...tokenOrPayload.user,
        // Asegurar que roles esté disponible para uso en la app
        roles: tokenOrPayload.user.roles || []
      }
      setUser(userWithRoles)
      if (tokenOrPayload?.token) {
        setToken(tokenOrPayload.token)
      }
      return userWithRoles
    }

    // Fallback para demo (mantener compatibilidad)
    const email = tokenOrPayload?.email || 'demo@example.com'
    const fakeUser = { id: 1, name: 'Demo User', email, roles: [] }
    setUser(fakeUser)
    return fakeUser
  }

  const logout = () => {
    setUser(null)
    setToken(null)
  }

  const isAuthenticated = Boolean(user && token)

  // Helper para obtener todos los roles del usuario
  const getRoles = () => {
    if (!user?.roles) return []
    return Array.isArray(user.roles) 
      ? user.roles.map(r => typeof r === 'string' ? r : r.nombre)
      : []
  }

  // Helper para obtener el rol primario (principal)
  const getPrimaryRole = () => {
    const roles = getRoles()
    return roles.length > 0 ? roles[0] : null
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated, getRoles, getPrimaryRole }}>
      {children}
    </AuthContext.Provider>
  )
}

// Hook de conveniencia para consumir el contexto
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return ctx
}

export default AuthContext

