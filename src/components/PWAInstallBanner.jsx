import { useState, useEffect, useRef } from 'react'

const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent)
const isInStandalone =
  window.matchMedia('(display-mode: standalone)').matches ||
  window.navigator.standalone === true

export default function PWAInstallBanner() {
  const [visible, setVisible] = useState(false)
  const [showIOSHint, setShowIOSHint] = useState(false)
  const [showGenericHint, setShowGenericHint] = useState(false)
  const deferredPrompt = useRef(null)

  useEffect(() => {
    // No mostrar si ya está instalada o si el usuario ya la cerró
    if (isInStandalone) return
    if (localStorage.getItem('pwa_dismissed')) return

    if (isIOS) {
      // iOS: mostrar siempre (el usuario instala manualmente)
      setVisible(true)
    } else {
      // Android/Chrome/Desktop: intentar capturar el prompt nativo
      const handler = (e) => {
        e.preventDefault()
        deferredPrompt.current = e
      }
      window.addEventListener('beforeinstallprompt', handler)

      // Mostrar el banner igual después de 1 segundo,
      // con o sin prompt nativo disponible
      const timer = setTimeout(() => setVisible(true), 1000)

      return () => {
        window.removeEventListener('beforeinstallprompt', handler)
        clearTimeout(timer)
      }
    }
  }, [])

  // Auto-cierre a los 7 segundos
  useEffect(() => {
    if (!visible) return
    const timer = setTimeout(() => dismiss(), 7000)
    return () => clearTimeout(timer)
  }, [visible])

  const dismiss = () => {
    localStorage.setItem('pwa_dismissed', '1')
    setVisible(false)
    setShowIOSHint(false)
    setShowGenericHint(false)
  }

  const handleInstall = async () => {
    if (isIOS) {
      setShowIOSHint(true)
      return
    }
    if (deferredPrompt.current) {
      // Chrome con prompt nativo disponible
      deferredPrompt.current.prompt()
      const { outcome } = await deferredPrompt.current.userChoice
      deferredPrompt.current = null
      if (outcome === 'accepted') dismiss()
    } else {
      // Desktop o Chrome sin prompt: mostrar instrucción manual
      setShowGenericHint(true)
    }
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] flex flex-col items-center gap-2 pointer-events-none">

      {/* Tooltip iOS */}
      {showIOSHint && (
        <div
          className="pointer-events-auto bg-white text-slate-800 rounded-xl shadow-2xl px-4 py-3 text-xs font-medium max-w-[260px] text-center border border-slate-200"
          onClick={() => setShowIOSHint(false)}
        >
          Toca{' '}
          <span className="inline-flex items-center gap-0.5 font-bold text-primary">
            <span className="material-symbols-outlined text-sm">ios_share</span> Compartir
          </span>{' '}
          y luego{' '}
          <span className="font-bold text-primary">"Añadir a pantalla de inicio"</span>
        </div>
      )}

      {/* Tooltip Chrome/Desktop genérico */}
      {showGenericHint && (
        <div
          className="pointer-events-auto bg-white text-slate-800 rounded-xl shadow-2xl px-4 py-3 text-xs font-medium max-w-[260px] text-center border border-slate-200"
          onClick={() => setShowGenericHint(false)}
        >
          En Chrome toca el menú{' '}
          <span className="font-bold text-primary">⋮</span>{' '}
          y selecciona{' '}
          <span className="font-bold text-primary">"Instalar aplicación"</span>
        </div>
      )}

      {/* Banner principal */}
      <div
        className="pointer-events-auto flex items-center gap-2 px-4 py-2.5 rounded-full shadow-2xl"
        style={{
          background: '#3B1969',
          border: '2px solid #F5C842',
          boxShadow: '0 8px 32px rgba(59,25,105,0.45)',
        }}
      >
        <button
          onClick={handleInstall}
          className="flex items-center gap-2 text-white"
        >
          <span className="material-symbols-outlined text-xl" style={{ color: '#F5C842' }}>
            install_mobile
          </span>
          <span className="text-xs font-bold tracking-wide text-white">
            {isIOS ? '📲 Añadir a inicio' : '📲 Instalar LocalClick'}
          </span>
        </button>

        <div className="w-px h-4 bg-white/20 mx-1" />

        <button
          onClick={dismiss}
          className="text-white/60 hover:text-white transition-colors"
          aria-label="Cerrar"
        >
          <span className="material-symbols-outlined text-base">close</span>
        </button>
      </div>
    </div>
  )
}
