import { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'

const API = import.meta.env.VITE_API || ''

const DEFAULT_DEV_USER = {
  id: 1,
  nombre: 'Dev Programador',
  email: 'dev@local',
  rol: 'programador',
  plan_id: 3,
  tipo_cuenta: 'general',
  vende_productos: 1,
  ofrece_servicios: 1,
  ofrece_arriendos: 1,
}

export default function ProtectedRoute({ children }) {
  // --- Modo Desarrollo: bypass completo ---
  if (import.meta.env.DEV) {
    const [devUser, setDevUser] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
      async function loadDevUser() {
        // Login real (LoginModal): respetar user de localStorage sin consultar dev-info
        const authMode = localStorage.getItem('auth_mode')
        if (authMode === 'real') {
          const stored = localStorage.getItem('user')
          if (stored) {
            try {
              setDevUser(JSON.parse(stored))
              setLoading(false)
              return
            } catch {}
          }
        }

        // Si el switcher seleccionó un perfil mock, respetarlo sin consultar el backend
        const savedId = localStorage.getItem('dev_user_id')
        if (savedId && savedId.startsWith('mock-')) {
          const stored = localStorage.getItem('user')
          if (stored) {
            try {
              setDevUser(JSON.parse(stored))
              setLoading(false)
              return
            } catch {}
          }
        }

        try {
          // Intentar obtener usuarios reales desde el backend (dev-info endpoint)
          const res = await fetch(`${API}/api/v1/auth/dev-info`)
          if (res.ok) {
            const data = await res.json()
            if (data.users && data.users.length > 0) {
              // Usar el primer usuario disponible (o el guardado en localStorage)
              let user = data.users[0]
              if (savedId) {
                const found = data.users.find(u => u.id === parseInt(savedId))
                if (found) user = found
              }
              const userData = {
                id: user.id,
                nombre: user.nombre,
                email: user.email,
                rol: user.rol,
                plan_id: user.plan_id,
                tipo_cuenta: user.tipo_cuenta,
                vende_productos: user.vende_productos,
                ofrece_servicios: user.ofrece_servicios,
                ofrece_arriendos: user.ofrece_arriendos,
              }
              localStorage.setItem('user', JSON.stringify(userData))
              localStorage.setItem('token', 'dev-bypass')
              localStorage.setItem('dev_user_id', String(user.id))
              setDevUser(userData)
              setLoading(false)
              return
            }
          }
        } catch {
          // Backend no disponible o dev-info deshabilitado — usar usuario por defecto
        }

        // Fallback: usuario por defecto
        localStorage.setItem('user', JSON.stringify(DEFAULT_DEV_USER))
        localStorage.setItem('token', 'dev-bypass')
        localStorage.setItem('dev_user_id', String(DEFAULT_DEV_USER.id))
        setDevUser(DEFAULT_DEV_USER)
        setLoading(false)
      }
      loadDevUser()
    }, [])

    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
          <div className="text-slate-400 text-sm">Cargando usuario de desarrollo...</div>
        </div>
      )
    }

    return children
  }

  // --- Modo Producción: verificación real de sesión ---
  const [status, setStatus] = useState('checking')

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch(`${API}/api/v1/auth/me`, { credentials: 'include' })
        if (res.ok) {
          setStatus('ok')
          return
        }
        // access_token expirado → intentar refresh
        const refreshRes = await fetch(`${API}/api/v1/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
        })
        setStatus(refreshRes.ok ? 'ok' : 'redirect')
      } catch {
        setStatus('redirect')
      }
    }
    checkAuth()
  }, [])

  if (status === 'checking') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-slate-400 text-sm">Verificando sesión...</div>
      </div>
    )
  }

  if (status === 'redirect') return <Navigate to="/" replace />

  return children
}
