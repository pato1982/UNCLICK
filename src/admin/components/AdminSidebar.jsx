import { useState, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import ConfirmDialog from '../../components/ConfirmDialog.jsx'

const API = import.meta.env.VITE_API || ''

const menuGeneral = [
  { label: 'Mi Negocio', icon: 'storefront', path: '/admin/negocio' },
  { label: 'Productos', icon: 'inventory_2', path: '/admin' },
  { label: 'Banner', icon: 'photo_library', path: '/admin/banner', minPlan: 3 },
  { label: 'Estadísticas', icon: 'bar_chart', path: '/admin/estadisticas', minPlan: 3 },
  { label: 'Facturación', icon: 'receipt_long', path: '/admin/facturacion' },
]

const menuTurismo = [
  { label: 'Mi Negocio', icon: 'storefront', path: '/admin/negocio' },
  { label: 'Portada', icon: 'home', path: '/admin/portada' },
  { label: 'Mi Página', icon: 'web', path: '/admin/pagina', minPlan: 5, countKey: 'pagina' },
  { label: 'Tour', icon: 'tour', path: '/admin/tour', minPlan: 5, countKey: 'tours' },
  { label: 'Estadísticas', icon: 'bar_chart', path: '/admin/estadisticas', minPlan: 5 },
  { label: 'Facturación', icon: 'receipt_long', path: '/admin/facturacion' },
]

const menuProgramador = [
  { label: 'Locales de Barrio', icon: 'store', path: '/admin/programador/locales' },
  { label: 'Próximos Eventos', icon: 'event', path: '/admin/programador/eventos' },
  { label: 'Estadísticas', icon: 'bar_chart', path: '/admin/programador/estadisticas' },
  { label: 'Servidor', icon: 'dns', path: '/admin/programador/servidor' },
  // La ruta se registra como /admin/monitor en main.jsx, no bajo programador/.
  { label: 'Monitor', icon: 'monitor_heart', path: '/admin/monitor' },
  { label: 'Roadmap', icon: 'map', path: '/admin/programador/roadmap' },
]

const menuLocal = [
  { label: 'Mi Local', icon: 'local_grocery_store', path: '/admin/mi-local' },
]

const menuEvento = [
  { label: 'Mis Eventos', icon: 'event', path: '/admin/mis-eventos' },
]

const PLAN_NAMES = { 2: 'Normal', 3: 'Premium', 5: 'Premium' }

export default function AdminSidebar({ open, onClose }) {
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const planId = user.plan_id || 1
  const tipoCuenta = user.tipo_cuenta || 'general'
  const rol = user.rol || 'usuario'
  const isProg = rol === 'programador'
  const menuItems = isProg ? menuProgramador
    : tipoCuenta === 'turismo' ? menuTurismo
    : tipoCuenta === 'local'   ? menuLocal
    : tipoCuenta === 'evento'  ? menuEvento
    : menuGeneral
  const [lockedPopup, setLockedPopup] = useState(null)
  const [counts, setCounts] = useState(null)
  const [confirmLogout, setConfirmLogout] = useState(false)
  const location = useLocation()

  const doLogout = async () => {
    try { await fetch(`${API}/api/v1/auth/logout`, { method: 'POST', credentials: 'include' }) } catch {}
    localStorage.removeItem('token'); localStorage.removeItem('user')
    localStorage.removeItem('auth_mode'); localStorage.removeItem('dev_user_id')
    window.location.href = '/'
  }

  useEffect(() => {
    if (isProg) return

        const hasLocked = menuItems.some(item => item.minPlan && item.countKey && planId < item.minPlan)
    if (!hasLocked) return
    fetch(`${API}/api/v1/auth/profile/counts`, { credentials: 'include' })
      .then(r => r.json())
      .then(data => setCounts(data))
      .catch(() => {})
  }, [planId])

  return (
    <>
    {/* Overlay mobile/tablet */}
    {open && (
      <div className="md:hidden fixed inset-0 z-30 bg-black/40" onClick={onClose}></div>
    )}
    <aside
      className={`fixed top-16 left-0 bottom-0 z-40 w-64 border-r shadow-sm transition-transform duration-300 ${
        isProg ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-200'
      } ${open ? 'translate-x-0' : '-translate-x-full'}`}
    >
      {/* Header del sidebar */}
      <div className={`p-4 border-b ${isProg ? 'border-slate-700' : 'border-gray-100'}`}>
        {isProg ? (
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-emerald-400 text-base">terminal</span>
            </div>
            <span className="text-[11px] font-black text-emerald-400 uppercase tracking-wider">Modo Programador</span>
          </div>
        ) : (
          <a href="/" className="hidden sm:flex items-center gap-2 text-xs text-primary hover:text-accent transition-colors font-semibold">
            <span className="material-symbols-outlined text-sm">open_in_new</span>
            Ver sitio público
          </a>
        )}
      </div>

      {/* Navegación */}
      <nav className="p-3 flex flex-col gap-1">
        {menuItems.map((item) => {
          const locked = !isProg && item.minPlan && planId < item.minPlan

          if (locked) {
            const savedCount = item.countKey && counts ? counts[item.countKey] || 0 : 0
            return (
              <button
                key={item.path}
                onClick={() => setLockedPopup({ label: item.label, minPlan: item.minPlan, savedCount })}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors text-gray-400 hover:bg-gray-100 hover:text-gray-500 w-full"
              >
                <span className="material-symbols-outlined text-xl">{item.icon}</span>
                <span className="flex-1 text-left">{item.label}</span>
                {savedCount > 0 && (
                  <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" title="Contenido guardado"></span>
                )}
                <span className="material-symbols-outlined text-sm">lock</span>
              </button>
            )
          }

          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/admin'}
              onClick={() => { if (window.innerWidth < 1101 && onClose) onClose() }}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isProg
                    ? (isActive
                      ? 'bg-emerald-500/20 text-emerald-400 shadow-lg shadow-emerald-500/10 border border-emerald-500/30'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-emerald-300')
                    : (isActive
                      ? 'bg-primary text-white shadow-md'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-primary')
                }`
              }
            >
              <span className="material-symbols-outlined text-xl">{item.icon}</span>
              {item.label}
            </NavLink>
          )
        })}
      </nav>

      {/* Botón Ver Turismo para usuarios turismo */}
      {tipoCuenta === 'turismo' && !isProg && (
        <div className="px-3 mt-2">
          <a
            href="/"
            onClick={() => { localStorage.setItem('navTo', 'turismo'); localStorage.setItem('turismo_scroll_to', user.id) }}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-xs font-bold text-white bg-accent hover:bg-accent/90 transition-colors shadow-sm"
          >
            <span className="material-symbols-outlined text-base">visibility</span>
            Ver Turismo
          </a>
        </div>
      )}

      {/* Enlace al sitio para programador */}
      {isProg && (
        <div className="px-4 mt-3 pt-3 mx-3 border-t border-slate-700">
          <a href="/" className="flex items-center gap-2 text-[11px] text-slate-500 hover:text-emerald-400 transition-colors font-semibold">
            <span className="material-symbols-outlined text-sm">open_in_new</span>
            Ver sitio público
          </a>
        </div>
      )}

      {/* Pie del sidebar (solo admin normal) */}
      {!isProg && (
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-100 bg-white">
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-primary text-lg">person</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-700 truncate">{user.nombre || 'Administrador'}</p>
              <p className="text-[10px] text-gray-400 truncate">{user.email || ''}</p>
            </div>
            <button
              onClick={() => setConfirmLogout(true)}
              className="shrink-0 p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
              title="Cerrar sesión"
            >
              <span className="material-symbols-outlined text-xl">logout</span>
            </button>
          </div>
        </div>
      )}

      {/* Popup contenido bloqueado */}
      {lockedPopup && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50" onClick={() => setLockedPopup(null)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm mx-4 p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex flex-col items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center">
                <span className="material-symbols-outlined text-3xl text-amber-500">workspace_premium</span>
              </div>
              <h3 className="text-sm font-bold text-gray-800">Contenido exclusivo {PLAN_NAMES[lockedPopup.minPlan] || 'Premium'}</h3>
              <p className="text-xs text-gray-500 text-center leading-relaxed">
                La sección <strong className="text-primary">{lockedPopup.label}</strong> está disponible a partir del <strong>Plan {PLAN_NAMES[lockedPopup.minPlan] || 'Premium'}</strong>. Actualiza tu plan para acceder a esta funcionalidad.
              </p>
              {lockedPopup.savedCount > 0 && (
                <div className="w-full bg-green-50 border border-green-200 rounded-lg px-3 py-2 flex items-center gap-2">
                  <span className="material-symbols-outlined text-green-500 text-base">inventory_2</span>
                  <p className="text-[11px] text-green-700 leading-snug">
                    Tienes contenido guardado en esta sección. Al subir de plan se mostrará automáticamente.
                  </p>
                </div>
              )}
              <button onClick={() => setLockedPopup(null)} className="w-full py-2.5 rounded-lg text-xs font-semibold text-white bg-primary hover:bg-primary/90 transition-colors mt-1">
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

    </aside>

    {/* Fuera del <aside>: su transform crearía un containing block y el modal (fixed) quedaría confinado */}
    <ConfirmDialog
      open={confirmLogout}
      icon="logout"
      title="¿Cerrar sesión?"
      message="Vas a salir de tu cuenta. Podrás volver a ingresar cuando quieras."
      confirmLabel="Cerrar sesión"
      onConfirm={() => { setConfirmLogout(false); doLogout() }}
      onCancel={() => setConfirmLogout(false)}
    />
    </>
  )
}
