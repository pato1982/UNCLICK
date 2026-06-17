import { useState, useRef, useEffect } from 'react'
import { QA_PASSWORD, QA_USERS } from '../lib/qaUsers'

const PROG_EMAIL    = import.meta.env.VITE_PROG_EMAIL    ?? ''
const PROG_PASSWORD = import.meta.env.VITE_PROG_PASSWORD ?? ''

const PLAN_LABEL = { 1: 'Gratis', 2: 'Normal', 3: 'Premium' }
const PLAN_COLOR = { 1: 'bg-slate-500', 2: 'bg-amber-500', 3: 'bg-emerald-600' }
const CAP_COLOR = {
  P: 'bg-blue-500',
  S: 'bg-fuchsia-500',
  A: 'bg-orange-500',
}
const CAP_LABEL = { P: 'Prod', S: 'Serv', A: 'Arr' }

export default function DevQuickLogin({ onSelect, onLogin }) {
  const [open, setOpen] = useState(false)
  const panelRef = useRef(null)

  useEffect(() => {
    if (!open) return
    function onKey(e) { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  function handlePick(user) {
    onSelect(user.email, QA_PASSWORD)
    setOpen(false)
  }

  function handleEnter(user) {
    onLogin?.(user.email)
    setOpen(false)
  }

  function handleEnterProg() {
    onLogin?.(PROG_EMAIL, PROG_PASSWORD)
    setOpen(false)
  }

  function handleFillProg() {
    onSelect(PROG_EMAIL, PROG_PASSWORD)
    setOpen(false)
  }

  const generalP1 = QA_USERS.filter(u => u.tipo === 'general' && u.plan === 1)
  const generalP2 = QA_USERS.filter(u => u.tipo === 'general' && u.plan === 2)
  const generalP3 = QA_USERS.filter(u => u.tipo === 'general' && u.plan === 3)
  const turismo   = QA_USERS.filter(u => u.tipo === 'turismo')

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full mt-2 flex items-center justify-center gap-2 text-xs font-semibold py-2 rounded-lg border border-dashed border-amber-400 bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors"
        title="Solo visible en DEV — autocompleta credenciales QA"
      >
        <span className="material-symbols-outlined text-base">science</span>
        Cuentas de prueba (DEV)
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-end p-4 bg-black/40"
          onClick={() => setOpen(false)}
        >
          <div
            ref={panelRef}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-sm max-h-[90vh] overflow-hidden flex flex-col"
          >
            <div className="bg-amber-500 px-4 py-3 flex items-center justify-between shrink-0">
              <h3 className="text-white font-bold text-sm flex items-center gap-2">
                <span className="material-symbols-outlined text-base">science</span>
                Cuentas QA · DEV
              </h3>
              <button
                onClick={() => setOpen(false)}
                className="text-white/80 hover:text-white transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="px-4 py-2 bg-amber-50 border-b border-amber-200 text-[11px] text-amber-800">
              Pulsa una cuenta para <strong>iniciar sesión en local</strong> · Password: <code className="font-mono font-bold">{QA_PASSWORD}</code>
            </div>

            <div className="overflow-y-auto p-3 space-y-3">
              {/* Programador */}
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-white px-1.5 py-0.5 rounded bg-slate-900">DEV</span>
                  <span className="text-[11px] font-semibold text-gray-600 uppercase tracking-wide">Programador</span>
                </div>
                <div className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg bg-slate-50 border border-slate-200 hover:border-primary/40 transition-colors">
                  <button type="button" onClick={handleEnterProg} className="flex-1 min-w-0 flex items-center gap-2 text-left">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-gray-800">Patricio</div>
                      <div className="text-[10px] text-gray-500 font-mono truncate">{PROG_EMAIL}</div>
                    </div>
                    <span className="text-[9px] font-bold text-white px-1.5 py-0.5 rounded bg-slate-900">PROG</span>
                  </button>
                  <button type="button" onClick={handleFillProg} title="Solo rellenar formulario" className="shrink-0 text-gray-400 hover:text-primary transition-colors">
                    <span className="material-symbols-outlined text-base">edit</span>
                  </button>
                </div>
              </div>

              <Group title="General · Plan 1 (Gratis)"  plan={1} users={generalP1} onPick={handleEnter} onFill={handlePick} />
              <Group title="General · Plan 2 (Normal)"  plan={2} users={generalP2} onPick={handleEnter} onFill={handlePick} />
              <Group title="General · Plan 3 (Premium)" plan={3} users={generalP3} onPick={handleEnter} onFill={handlePick} />
              <Group title="Turismo"                    plan={null} users={turismo}   onPick={handleEnter} onFill={handlePick} />
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function Group({ title, plan, users, onPick, onFill }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-1.5">
        {plan != null && (
          <span className={`text-[9px] font-bold uppercase tracking-wider text-white px-1.5 py-0.5 rounded ${PLAN_COLOR[plan]}`}>
            {PLAN_LABEL[plan]}
          </span>
        )}
        <span className="text-[11px] font-semibold text-gray-600 uppercase tracking-wide">{title}</span>
      </div>
      <div className="space-y-1">
        {users.map(u => (
          <div
            key={u.email}
            className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg bg-gray-50 border border-gray-200 hover:border-primary/40 transition-colors"
          >
            <button
              type="button"
              onClick={() => onPick(u)}
              title="Iniciar sesión con esta cuenta"
              className="flex-1 min-w-0 flex items-center gap-2 text-left"
            >
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-gray-800 truncate">{u.nombre}</div>
                <div className="text-[10px] text-gray-500 font-mono truncate">{u.email}</div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {u.caps.length === 0 ? (
                  <span className="text-[9px] text-gray-400 italic">—</span>
                ) : (
                  u.caps.map(c => (
                    <span
                      key={c}
                      className={`text-[9px] font-bold text-white px-1.5 py-0.5 rounded ${CAP_COLOR[c]}`}
                      title={CAP_LABEL[c]}
                    >
                      {c}
                    </span>
                  ))
                )}
              </div>
            </button>
            <button
              type="button"
              onClick={() => onFill(u)}
              title="Solo rellenar el formulario (no iniciar sesión)"
              className="shrink-0 text-gray-400 hover:text-primary transition-colors"
            >
              <span className="material-symbols-outlined text-base">edit</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
