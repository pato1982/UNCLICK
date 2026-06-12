import { useState, useEffect } from 'react'
import DevQuickLogin from './DevQuickLogin'
import { QA_PASSWORD, resolveQaUser, loginAsQaUser } from '../lib/qaUsers'

const API = import.meta.env.VITE_API || ''

function ForgotPasswordView({ onBack }) {
  const [step, setStep] = useState('email') // email | reset | done
  const [email, setEmail] = useState('')
  const [token, setToken] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  // Detectar token en URL al montar
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const resetToken = params.get('reset')
    if (resetToken) {
      setToken(resetToken)
      setStep('reset')
      // Limpiar URL
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

  const handleRequestReset = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch(`${API}/api/v1/password-reset/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Error al procesar solicitud')
      } else {
        setSuccess(data.message)
      }
    } catch {
      setError('Error de conexión')
    }
    setLoading(false)
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()
    setError('')

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`${API}/api/v1/password-reset/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Error al cambiar contraseña')
      } else {
        setStep('done')
      }
    } catch {
      setError('Error de conexión')
    }
    setLoading(false)
  }

  return (
    <>
      <div className="bg-primary px-6 py-4 flex items-center justify-between">
        <h2 className="text-white font-bold text-lg flex items-center gap-2">
          <span className="material-symbols-outlined">lock_reset</span>
          {step === 'done' ? 'Listo' : step === 'reset' ? 'Nueva contraseña' : 'Recuperar contraseña'}
        </h2>
        <button onClick={onBack} className="text-white/70 hover:text-white transition-colors">
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>

      <div className="p-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-2 flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-base">error</span>
            {error}
          </div>
        )}

        {step === 'email' && !success && (
          <form onSubmit={handleRequestReset} className="space-y-4">
            <p className="text-sm text-gray-500">Ingresa tu email y te enviaremos instrucciones para restablecer tu contraseña.</p>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
                placeholder="tu@email.com"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white font-bold py-2.5 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {loading ? 'Enviando...' : 'Enviar instrucciones'}
            </button>
            <button type="button" onClick={onBack} className="w-full text-sm text-gray-500 hover:text-primary transition-colors">
              Volver al login
            </button>
          </form>
        )}

        {step === 'email' && success && (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-3xl text-green-600">mark_email_read</span>
            </div>
            <p className="text-sm text-gray-600">{success}</p>
            <p className="text-xs text-gray-400">Revisa tu bandeja de entrada y spam.</p>
            <button onClick={onBack} className="text-sm text-primary font-bold hover:underline">
              Volver al login
            </button>
          </div>
        )}

        {step === 'reset' && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <p className="text-sm text-gray-500">Ingresa tu nueva contraseña.</p>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Nueva contraseña</label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
                placeholder="Mínimo 6 caracteres"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Confirmar contraseña</label>
              <input
                type="password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
                placeholder="Repite la contraseña"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white font-bold py-2.5 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {loading ? 'Cambiando...' : 'Cambiar contraseña'}
            </button>
          </form>
        )}

        {step === 'done' && (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-3xl text-green-600">check_circle</span>
            </div>
            <p className="text-sm font-semibold text-gray-700">Contraseña actualizada</p>
            <p className="text-xs text-gray-400">Ya puedes iniciar sesión con tu nueva contraseña.</p>
            <button onClick={onBack} className="bg-primary text-white font-bold py-2 px-6 rounded-lg hover:bg-primary/90 transition-colors text-sm">
              Ir a login
            </button>
          </div>
        )}
      </div>
    </>
  )
}

function MfaVerifyView({ mfaToken, onSuccess, onCancel }) {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch(`${API}/api/v1/auth/mfa/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ mfa_token: mfaToken, code }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Código incorrecto')
        setLoading(false)
        return
      }
      localStorage.setItem('user', JSON.stringify(data.user))
      onSuccess(data.user)
    } catch {
      setError('Error de conexión')
      setLoading(false)
    }
  }

  return (
    <>
      <div className="bg-primary px-6 py-4 flex items-center justify-between">
        <h2 className="text-white font-bold text-lg flex items-center gap-2">
          <span className="material-symbols-outlined">security</span>
          Verificación en 2 pasos
        </h2>
        <button onClick={onCancel} className="text-white/70 hover:text-white transition-colors">
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
          <span className="material-symbols-outlined text-blue-500">smartphone</span>
          <p className="text-sm text-blue-700">Abre tu app de autenticación (Google Authenticator, Authy) e ingresa el código de 6 dígitos.</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-2 flex items-center gap-2">
            <span className="material-symbols-outlined text-base">error</span>
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Código de autenticación</label>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9A-Fa-f]{6,10}"
            maxLength={10}
            required
            autoFocus
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\s/g, ''))}
            className="w-full border border-gray-300 rounded-lg px-3 py-3 text-center text-xl font-mono tracking-widest focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
            placeholder="000000"
          />
          <p className="text-xs text-gray-400 mt-1 text-center">También puedes usar un código de recuperación</p>
        </div>

        <button
          type="submit"
          disabled={loading || code.length < 6}
          className="w-full bg-primary text-white font-bold py-2.5 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {loading ? 'Verificando...' : 'Verificar'}
        </button>

        <button type="button" onClick={onCancel} className="w-full text-sm text-gray-500 hover:text-primary transition-colors">
          Volver al login
        </button>
      </form>
    </>
  )
}

export default function LoginModal({ onClose, onSwitchToRegister, onLoginSuccess }) {
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showForgot, setShowForgot] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [mfaToken, setMfaToken] = useState(null)

  // Si hay ?reset= en la URL, abrir directamente el formulario de reset
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('reset')) {
      setShowForgot(true)
    }
  }, [])

  // Inicia sesión local (mock) con una cuenta de prueba QA, sin backend.
  const loginLocalQa = (user) => {
    loginAsQaUser(user)
    onLoginSuccess(user)
    onClose()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // En desarrollo, las cuentas de prueba QA inician sesión en local sin backend.
    if (import.meta.env.DEV) {
      const qaUser = resolveQaUser(form.email, form.password)
      if (qaUser) {
        loginLocalQa(qaUser)
        return
      }
    }

    try {
      const res = await fetch(`${API}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(form)
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Error al iniciar sesión')
        setLoading(false)
        return
      }

      // Segundo factor requerido
      if (data.mfa_required) {
        setMfaToken(data.mfa_token)
        setLoading(false)
        return
      }

      const u = data.usuario || data.user
      localStorage.removeItem('token')
      localStorage.removeItem('dev_user_id')
      localStorage.setItem('auth_mode', 'real')
      localStorage.setItem('user', JSON.stringify(u))
      onLoginSuccess(u)
      onClose()
    } catch {
      setError('Error de conexión')
      setLoading(false)
    }
  }

  const handleMfaSuccess = (user) => {
    localStorage.removeItem('token')
    localStorage.removeItem('dev_user_id')
    localStorage.setItem('auth_mode', 'real')
    onLoginSuccess(user)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {showForgot ? (
          <ForgotPasswordView onBack={() => setShowForgot(false)} />
        ) : mfaToken ? (
          <MfaVerifyView
            mfaToken={mfaToken}
            onSuccess={handleMfaSuccess}
            onCancel={() => { setMfaToken(null); setForm({ email: form.email, password: '' }) }}
          />
        ) : (
          <>
            {/* Header */}
            <div className="bg-primary px-6 py-4 flex items-center justify-between">
              <h2 className="text-white font-bold text-lg flex items-center gap-2">
                <span className="material-symbols-outlined">login</span>
                Ingresar
              </h2>
              <button onClick={onClose} className="text-white/70 hover:text-white transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Formulario */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-2 flex items-center gap-2">
                  <span className="material-symbols-outlined text-base">error</span>
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
                  placeholder="tu@email.com"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-gray-600">Contraseña</label>
                  <button
                    type="button"
                    onClick={() => setShowForgot(true)}
                    className="text-[11px] text-primary/70 hover:text-primary font-medium transition-colors"
                  >
                    Olvidé mi contraseña
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
                    placeholder="Tu contraseña"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <span className="material-symbols-outlined text-xl">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

<button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-white font-bold py-2.5 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {loading ? 'Ingresando...' : 'Ingresar'}
              </button>

              <p className="text-center text-sm text-gray-500">
                ¿No tienes cuenta?{' '}
                <button type="button" onClick={onSwitchToRegister} className="text-primary font-bold hover:underline">
                  Regístrate
                </button>
              </p>

              {import.meta.env.DEV && (
                <DevQuickLogin
                  onSelect={(email, password) => setForm({ email, password })}
                  onLogin={async (email) => {
                    // Intentar login real contra el backend primero
                    try {
                      const res = await fetch(`${API}/api/v1/auth/login`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                        body: JSON.stringify({ email, password: QA_PASSWORD }),
                      })
                      const data = await res.json()
                      if (res.ok && (data.usuario || data.user)) {
                        const u = data.usuario || data.user
                        localStorage.removeItem('dev_user_id')
                        localStorage.setItem('auth_mode', 'real')
                        localStorage.setItem('user', JSON.stringify(u))
                        onLoginSuccess(u)
                        onClose()
                        return
                      }
                    } catch {}
                    // Fallback: login mock si el backend no está disponible
                    const qaUser = resolveQaUser(email, QA_PASSWORD)
                    if (qaUser) loginLocalQa(qaUser)
                  }}
                />
              )}
            </form>
          </>
        )}
      </div>
    </div>
  )
}
