import { useState } from 'react'

const API = import.meta.env.VITE_API || ''

// Paso 1: Inicia setup → obtiene QR
function SetupStep({ onNext, onCancel }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [setupData, setSetupData] = useState(null)

  const handleStart = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${API}/api/v1/auth/mfa/setup`, {
        method: 'POST',
        credentials: 'include',
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Error iniciando configuración MFA')
        setLoading(false)
        return
      }
      setSetupData(data)
    } catch {
      setError('Error de conexión')
    }
    setLoading(false)
  }

  if (!setupData) {
    return (
      <div className="space-y-4">
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg p-4">
          <span className="material-symbols-outlined text-amber-500 mt-0.5">info</span>
          <div className="text-sm text-amber-800">
            <p className="font-semibold mb-1">¿Qué necesitas?</p>
            <ul className="space-y-1 text-xs list-disc list-inside">
              <li>App de autenticación: Google Authenticator, Authy o similar</li>
              <li>Instálala en tu teléfono antes de continuar</li>
            </ul>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-2">
            {error}
          </div>
        )}

        <button
          onClick={handleStart}
          disabled={loading}
          className="w-full bg-primary text-white font-bold py-2.5 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {loading ? 'Cargando...' : 'Comenzar configuración'}
        </button>

        <button type="button" onClick={onCancel} className="w-full text-sm text-gray-500 hover:text-primary transition-colors">
          Cancelar
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">Escanea este código QR con tu app de autenticación:</p>

      <div className="flex justify-center">
        <img
          src={setupData.qr_code}
          alt="Código QR para MFA"
          className="w-48 h-48 border border-gray-200 rounded-lg p-2"
        />
      </div>

      <details className="text-sm">
        <summary className="cursor-pointer text-gray-500 hover:text-primary">¿No puedes escanear el QR?</summary>
        <div className="mt-2 p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-500 mb-1">Clave manual:</p>
          <code className="text-xs font-mono bg-white border border-gray-200 rounded px-2 py-1 block break-all select-all">
            {setupData.secret}
          </code>
        </div>
      </details>

      <button
        onClick={() => onNext(setupData)}
        className="w-full bg-primary text-white font-bold py-2.5 rounded-lg hover:bg-primary/90 transition-colors"
      >
        Ya lo escaneé → Verificar
      </button>
    </div>
  )
}

// Paso 2: Verificar código TOTP
function VerifyStep({ onSuccess, onBack }) {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleVerify = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch(`${API}/api/v1/auth/mfa/enable`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ code }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Código incorrecto')
        setLoading(false)
        return
      }
      onSuccess(data.backup_codes)
    } catch {
      setError('Error de conexión')
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handleVerify} className="space-y-4">
      <p className="text-sm text-gray-600">Ingresa el código de 6 dígitos que aparece en tu app para verificar la configuración:</p>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-2">
          {error}
        </div>
      )}

      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]{6}"
        maxLength={6}
        required
        autoFocus
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
        className="w-full border border-gray-300 rounded-lg px-3 py-3 text-center text-2xl font-mono tracking-widest focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
        placeholder="000000"
      />

      <button
        type="submit"
        disabled={loading || code.length !== 6}
        className="w-full bg-primary text-white font-bold py-2.5 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
      >
        {loading ? 'Verificando...' : 'Activar MFA'}
      </button>

      <button type="button" onClick={onBack} className="w-full text-sm text-gray-500 hover:text-primary transition-colors">
        Volver
      </button>
    </form>
  )
}

// Paso 3: Mostrar backup codes
function BackupCodesStep({ codes, onDone }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(codes.join('\n'))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg p-4">
        <span className="material-symbols-outlined text-amber-500 mt-0.5">warning</span>
        <div className="text-sm text-amber-800">
          <p className="font-semibold">Guarda estos códigos de recuperación</p>
          <p className="text-xs mt-1">Úsalos si pierdes acceso a tu app. Cada código es de un solo uso. No se mostrarán de nuevo.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {codes.map((code) => (
          <div key={code} className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-center font-mono text-sm font-semibold text-gray-700">
            {code}
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={handleCopy}
        className="w-full flex items-center justify-center gap-2 border border-gray-300 text-gray-700 font-semibold py-2 rounded-lg hover:bg-gray-50 transition-colors text-sm"
      >
        <span className="material-symbols-outlined text-base">{copied ? 'check' : 'content_copy'}</span>
        {copied ? 'Copiado' : 'Copiar todos'}
      </button>

      <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-4 py-3">
        <span className="material-symbols-outlined text-green-500">check_circle</span>
        <p className="text-sm font-semibold text-green-700">MFA activado correctamente</p>
      </div>

      <button
        onClick={onDone}
        className="w-full bg-primary text-white font-bold py-2.5 rounded-lg hover:bg-primary/90 transition-colors"
      >
        Finalizar
      </button>
    </div>
  )
}

// Componente principal exportado
export default function MFASetup({ onDone, onCancel }) {
  const [step, setStep] = useState('intro') // intro | verify | backup
  const [backupCodes, setBackupCodes] = useState([])

  const handleSetupNext = () => setStep('verify')
  const handleVerifySuccess = (codes) => {
    setBackupCodes(codes)
    setStep('backup')
  }

  const stepLabels = { intro: 'Configurar', verify: 'Verificar', backup: 'Códigos' }
  const stepNumbers = { intro: 1, verify: 2, backup: 3 }

  return (
    <div className="space-y-0">
      {/* Header */}
      <div className="bg-primary px-6 py-4 flex items-center justify-between">
        <h2 className="text-white font-bold text-lg flex items-center gap-2">
          <span className="material-symbols-outlined">security</span>
          Activar verificación en 2 pasos
        </h2>
        {step !== 'backup' && (
          <button onClick={onCancel} className="text-white/70 hover:text-white transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        )}
      </div>

      {/* Steps indicator */}
      <div className="flex border-b border-gray-100">
        {['intro', 'verify', 'backup'].map((s, i) => (
          <div
            key={s}
            className={`flex-1 py-2 text-center text-xs font-semibold border-b-2 transition-colors ${
              step === s
                ? 'border-primary text-primary'
                : stepNumbers[s] < stepNumbers[step]
                ? 'border-green-400 text-green-600'
                : 'border-transparent text-gray-400'
            }`}
          >
            {stepNumbers[s] < stepNumbers[step] ? '✓' : stepNumbers[s]}. {stepLabels[s]}
          </div>
        ))}
      </div>

      <div className="p-6">
        {step === 'intro' && (
          <SetupStep onNext={handleSetupNext} onCancel={onCancel} />
        )}
        {step === 'verify' && (
          <VerifyStep onSuccess={handleVerifySuccess} onBack={() => setStep('intro')} />
        )}
        {step === 'backup' && (
          <BackupCodesStep codes={backupCodes} onDone={onDone} />
        )}
      </div>
    </div>
  )
}

// Componente para desactivar MFA desde el perfil
export function MFADisable({ onDone, onCancel }) {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleDisable = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch(`${API}/api/v1/auth/mfa/disable`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ code }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Código incorrecto')
        setLoading(false)
        return
      }
      onDone()
    } catch {
      setError('Error de conexión')
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handleDisable} className="space-y-4">
      <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg p-4">
        <span className="material-symbols-outlined text-red-500 mt-0.5">warning</span>
        <p className="text-sm text-red-700">Al desactivar MFA, tu cuenta estará protegida solo por contraseña.</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-2">
          {error}
        </div>
      )}

      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">Código de autenticación (TOTP o backup)</label>
        <input
          type="text"
          maxLength={10}
          required
          autoFocus
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\s/g, ''))}
          className="w-full border border-gray-300 rounded-lg px-3 py-3 text-center font-mono text-xl tracking-widest focus:ring-2 focus:ring-red-200 focus:border-red-400 outline-none"
          placeholder="000000"
        />
      </div>

      <button
        type="submit"
        disabled={loading || code.length < 6}
        className="w-full bg-red-600 text-white font-bold py-2.5 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
      >
        {loading ? 'Desactivando...' : 'Desactivar MFA'}
      </button>

      <button type="button" onClick={onCancel} className="w-full text-sm text-gray-500 hover:text-primary transition-colors">
        Cancelar
      </button>
    </form>
  )
}
