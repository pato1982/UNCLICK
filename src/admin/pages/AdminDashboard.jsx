import { useState, useEffect } from 'react'

function PWAInstallCard() {
  const [state, setState] = useState('idle') // idle | installing | installed | dismissed
  const [showHint, setShowHint] = useState(false)
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent)
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true

  useEffect(() => {
    if (isStandalone) setState('installed')
  }, [])

  const handleInstall = async () => {
    if (isIOS) { setShowHint(true); return }
    const prompt = window.__pwaPrompt
    if (prompt) {
      setState('installing')
      prompt.prompt()
      const { outcome } = await prompt.userChoice
      window.__pwaPrompt = null
      setState(outcome === 'accepted' ? 'installed' : 'idle')
    } else {
      setShowHint(true)
    }
  }

  if (state === 'dismissed') return null

  if (state === 'installed') {
    return (
      <div className="bg-white rounded-xl p-5 shadow-sm border border-green-100 flex items-center gap-4 mb-6">
        <div className="bg-green-100 p-3 rounded-xl">
          <span className="material-symbols-outlined text-green-600 text-2xl">check_circle</span>
        </div>
        <div>
          <p className="font-bold text-gray-800 text-sm">Panel instalado como acceso directo</p>
          <p className="text-xs text-gray-400 mt-0.5">Ya tienes el ícono en tu dispositivo</p>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl overflow-hidden shadow-sm border border-purple-100 mb-6">
      <div className="flex items-center gap-4 p-5" style={{ background: 'linear-gradient(135deg, #3B1969 0%, #5B2D8E 100%)' }}>
        <img src="/icon-admin-192.png" alt="Panel admin" className="w-14 h-14 rounded-xl shadow-md shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-white font-black text-sm leading-tight">Instala el acceso directo a tu panel</p>
          <p className="text-white/60 text-[11px] mt-1 leading-tight">Ábrelo directamente desde tu celular o escritorio sin pasar por el navegador</p>
        </div>
        <button
          onClick={() => setState('dismissed')}
          className="shrink-0 text-white/30 hover:text-white/60 transition-colors"
        >
          <span className="material-symbols-outlined text-base">close</span>
        </button>
      </div>
      <div className="bg-white px-5 py-4 flex flex-col gap-3">
        <button
          onClick={handleInstall}
          disabled={state === 'installing'}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-black text-sm transition-all hover:brightness-110 active:scale-95 disabled:opacity-60"
          style={{ background: '#F5C842', color: '#3B1969' }}
        >
          <span className="material-symbols-outlined text-lg">install_desktop</span>
          {state === 'installing' ? 'Instalando...' : isIOS ? 'Cómo instalar en iPhone/iPad' : 'Instalar acceso directo'}
        </button>
        {showHint && (
          <div className="rounded-lg px-4 py-3 text-xs text-center border" style={{ background: '#F5C842/10', borderColor: '#F5C842/30', color: '#3B1969' }}>
            {isIOS
              ? <>Toca <strong>⬆ Compartir</strong> en Safari → <strong>"Añadir a pantalla de inicio"</strong></>
              : <>En Chrome toca <strong>⋮</strong> (menú) → <strong>"Instalar aplicación"</strong></>
            }
          </div>
        )}
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Dashboard</h1>
      <PWAInstallCard />

      {/* Tarjetas de resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Productos', value: '0', icon: 'inventory_2', color: 'bg-blue-500' },
          { label: 'Tiendas', value: '0', icon: 'storefront', color: 'bg-emerald-500' },
          { label: 'Pedidos', value: '0', icon: 'shopping_cart', color: 'bg-amber-500' },
          { label: 'Usuarios', value: '0', icon: 'group', color: 'bg-purple-500' },
        ].map((card) => (
          <div key={card.label} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{card.label}</span>
              <div className={`${card.color} p-2 rounded-lg`}>
                <span className="material-symbols-outlined text-white text-xl">{card.icon}</span>
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-800">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Placeholder contenido */}
      <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 text-center">
        <span className="material-symbols-outlined text-6xl text-gray-300 mb-4 block">construction</span>
        <h2 className="text-lg font-semibold text-gray-600 mb-2">Panel en construcción</h2>
        <p className="text-sm text-gray-400">
          Aquí se mostrarán las herramientas de administración para gestionar productos, tiendas y más.
        </p>
      </div>
    </div>
  )
}
