import { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'

const API = import.meta.env.VITE_API || ''

/**
 * Verifica que haya sesión real antes de renderizar una ruta protegida.
 *
 * Antes existía un bypass para `import.meta.env.DEV` que dejaba pasar sin
 * sesión y fabricaba un usuario falso `{rol:'programador'}` en localStorage.
 * Producía un estado híbrido confuso: la UI se comportaba como admin mientras
 * el backend respondía 401 a cada request (nunca hubo cookie de sesión, y el
 * endpoint /auth/dev-info que intentaba consultar tampoco existe).
 *
 * Se eliminó: en local se entra con login real usando el desplegable DEV del
 * modal, que trae las cuentas sembradas por `npm run db:setup`.
 */
export default function ProtectedRoute({ children }) {
  const [status, setStatus] = useState('checking')

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch(`${API}/api/v1/auth/me`, { credentials: 'include' })
        if (res.ok) {
          // Sincronizar plan_id y campos clave desde el servidor al localStorage
          try {
            const data = await res.json()
            const fresh = data.usuario || data.user
            if (fresh) {
              const stored = JSON.parse(localStorage.getItem('user') || '{}')
              localStorage.setItem('user', JSON.stringify({
                ...stored,
                plan_id: fresh.plan_id,
                tipo_cuenta: fresh.tipo_cuenta,
                vende_productos: fresh.vende_productos,
                ofrece_servicios: fresh.ofrece_servicios,
                ofrece_arriendos: fresh.ofrece_arriendos,
              }))
            }
          } catch {}
          setStatus('ok')
          return
        }
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
