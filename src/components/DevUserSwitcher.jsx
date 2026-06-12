import { useState, useEffect, useRef } from 'react'

const API = import.meta.env.VITE_API || ''

const MOCK_PROFILES = [
  { id: 'mock-prog',    nombre: 'Dev Programador',      email: 'prog@dev',    rol: 'programador', plan_id: 3, tipo_cuenta: 'general', vende_productos: 1, ofrece_servicios: 1, ofrece_arriendos: 1 },
  { id: 'mock-gen1',   nombre: 'Usuario General Gratis', email: 'gen1@dev',   rol: null,          plan_id: 1, tipo_cuenta: 'general', vende_productos: 1, ofrece_servicios: 0, ofrece_arriendos: 0 },
  { id: 'mock-gen2',   nombre: 'Usuario General Normal', email: 'gen2@dev',   rol: null,          plan_id: 2, tipo_cuenta: 'general', vende_productos: 1, ofrece_servicios: 1, ofrece_arriendos: 0 },
  { id: 'mock-gen3',   nombre: 'Usuario General Premium','email': 'gen3@dev', rol: null,          plan_id: 3, tipo_cuenta: 'general', vende_productos: 1, ofrece_servicios: 1, ofrece_arriendos: 1 },
  { id: 'mock-tur1',   nombre: 'Turismo Plan Gratis',    email: 'tur1@dev',   rol: null,          plan_id: 1, tipo_cuenta: 'turismo', vende_productos: 0, ofrece_servicios: 0, ofrece_arriendos: 0 },
  { id: 'mock-tur3',   nombre: 'Turismo Plan Premium',   email: 'tur3@dev',   rol: null,          plan_id: 3, tipo_cuenta: 'turismo', vende_productos: 0, ofrece_servicios: 0, ofrece_arriendos: 0 },
]

const PLAN_LABELS = { 1: 'Gratis', 2: 'Normal', 3: 'Premium' }
const ROL_COLOR = {
  programador: 'bg-purple-600',
  turismo: 'bg-sky-600',
  general: 'bg-emerald-600',
}

function getBadgeColor(user) {
  if (user?.rol === 'programador') return 'bg-purple-600'
  if (user?.tipo_cuenta === 'turismo') return 'bg-sky-600'
  return 'bg-emerald-600'
}

function getTag(user) {
  if (!user) return '?'
  if (user.rol === 'programador') return 'PROG'
  return `${user.tipo_cuenta === 'turismo' ? 'TUR' : 'GEN'} P${user.plan_id}`
}

export default function DevUserSwitcher() {
  const [open, setOpen] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)
  const [realUsers, setRealUsers] = useState([])
  const panelRef = useRef(null)

  useEffect(() => {
    const stored = localStorage.getItem('user')
    if (stored) {
      try { setCurrentUser(JSON.parse(stored)) } catch {}
    }
  }, [])

  useEffect(() => {
    if (!open) return
    fetch(`${API}/api/v1/auth/dev-info`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.users) setRealUsers(data.users) })
      .catch(() => {})
  }, [open])

  useEffect(() => {
    function onClickOutside(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [open])

  function switchUser(user) {
    const userData = {
      id: user.id,
      nombre: user.nombre,
      email: user.email,
      rol: user.rol || null,
      plan_id: user.plan_id,
      tipo_cuenta: user.tipo_cuenta,
      vende_productos: user.vende_productos ?? 1,
      ofrece_servicios: user.ofrece_servicios ?? 0,
      ofrece_arriendos: user.ofrece_arriendos ?? 0,
    }
    localStorage.setItem('user', JSON.stringify(userData))
    localStorage.setItem('token', 'dev-bypass')
    localStorage.setItem('dev_user_id', String(user.id))
    localStorage.setItem('auth_mode', 'mock')
    window.location.reload()
  }

  const badgeColor = getBadgeColor(currentUser)

  return (
    <div ref={panelRef} className="fixed bottom-4 right-4 z-[10000] font-mono text-xs select-none">
      {/* Floating badge */}
      <button
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-white shadow-lg ${badgeColor} hover:opacity-90 transition-opacity`}
        title="Dev User Switcher"
      >
        <span className="text-[10px] font-bold tracking-widest opacity-70">DEV</span>
        <span className="font-semibold">{getTag(currentUser)}</span>
        <span className="opacity-80 max-w-[120px] truncate">{currentUser?.nombre || '—'}</span>
        <span className={`transition-transform ${open ? 'rotate-180' : ''}`}>▲</span>
      </button>

      {/* Switcher panel */}
      {open && (
        <div className="absolute bottom-10 right-0 w-80 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden">
          <div className="px-4 py-2.5 border-b border-slate-700 flex items-center justify-between">
            <span className="text-slate-300 font-semibold tracking-wide">Dev User Switcher</span>
            <span className="text-slate-500 text-[10px]">solo en DEV</span>
          </div>

          {/* Current user info */}
          <div className="px-4 py-2 bg-slate-800 border-b border-slate-700">
            <div className="text-slate-400 text-[10px] uppercase tracking-widest mb-1">Activo</div>
            <div className="text-white font-semibold truncate">{currentUser?.nombre || '—'}</div>
            <div className="text-slate-400 text-[10px]">
              {currentUser?.email} · {currentUser?.tipo_cuenta} · Plan {currentUser?.plan_id} ({PLAN_LABELS[currentUser?.plan_id] || '?'}) · {currentUser?.rol || 'usuario'}
            </div>
          </div>

          {/* Mock profiles */}
          <div className="px-3 pt-3 pb-1">
            <div className="text-slate-500 text-[10px] uppercase tracking-widest mb-1.5 px-1">Perfiles mock</div>
            <div className="space-y-1">
              {MOCK_PROFILES.map(p => (
                <ProfileRow
                  key={p.id}
                  user={p}
                  active={currentUser?.email === p.email}
                  onSwitch={switchUser}
                />
              ))}
            </div>
          </div>

          {/* Real users from DB */}
          {realUsers.length > 0 && (
            <div className="px-3 pt-2 pb-3 border-t border-slate-700 mt-2">
              <div className="text-slate-500 text-[10px] uppercase tracking-widest mb-1.5 px-1">Usuarios reales (BD)</div>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {realUsers.map(u => (
                  <ProfileRow
                    key={u.id}
                    user={u}
                    active={String(localStorage.getItem('dev_user_id')) === String(u.id) && !currentUser?.email?.endsWith('@dev')}
                    onSwitch={switchUser}
                    real
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function ProfileRow({ user, active, onSwitch, real }) {
  const color = getBadgeColor(user)
  return (
    <button
      onClick={() => onSwitch(user)}
      disabled={active}
      className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-colors
        ${active ? 'bg-slate-700 cursor-default' : 'hover:bg-slate-800 cursor-pointer'}`}
    >
      <span className={`shrink-0 w-12 text-center text-[9px] font-bold tracking-wider text-white rounded px-1 py-0.5 ${color}`}>
        {getTag(user)}
      </span>
      <span className={`flex-1 truncate ${active ? 'text-white font-semibold' : 'text-slate-300'}`}>
        {user.nombre}
        {real && <span className="text-slate-500 ml-1">#{user.id}</span>}
      </span>
      {active && <span className="text-emerald-400 text-[10px] font-bold">✓</span>}
    </button>
  )
}
