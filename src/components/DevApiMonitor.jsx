import { useEffect, useState, useSyncExternalStore } from 'react'
import { subscribe, getEntries, clearEntries } from '../lib/devApiLog'

const STORAGE_OPEN = 'devApiMonitor.open'
const STORAGE_HEIGHT = 'devApiMonitor.height'

function useApiLog() {
  return useSyncExternalStore(subscribe, getEntries, getEntries)
}

// ─── Diagnóstico automático de causa probable por entrada ────────────────────
function diagnoseCause(entry) {
  const { status, ok, error, responseBody, responseHeaders } = entry
  const ct = responseHeaders?.['content-type'] || ''

  if (status === null) return null

  if (status === 0 || error) {
    return { level: 'error', icon: '🔌', text: 'Error de red — el servidor no responde en absoluto' }
  }

  // Vite proxy error: 500 + text/plain + body vacío o HTML → tunnel caído
  if (status === 500 && (ct.includes('text/plain') || ct.includes('text/html'))) {
    const bodyStr = typeof responseBody === 'string' ? responseBody : ''
    if (!bodyStr || bodyStr.includes('connect ECONNREFUSED') || bodyStr.includes('502') || bodyStr.length < 50) {
      return {
        level: 'error',
        icon: '🔒',
        text: 'Vite proxy error — el tunnel SSH a localhost:3002 probablemente está caído. Ejecutar: ssh -N -L 3002:localhost:3001 root@VPS',
      }
    }
  }

  if (status === 401) {
    return {
      level: 'warn',
      icon: '👤',
      text: 'Sin autenticación — verificar que dev_user_id esté en localStorage o iniciar sesión',
    }
  }

  if (status === 403) {
    return {
      level: 'warn',
      icon: '🚫',
      text: 'Sin permisos — el usuario seleccionado no tiene el rol o plan requerido para este endpoint',
    }
  }

  if (status === 404) {
    return { level: 'warn', icon: '🔍', text: 'Recurso no encontrado — verificar que el ID o la ruta sean correctos' }
  }

  if (status === 400) {
    const msg = typeof responseBody === 'object' ? responseBody?.error : responseBody
    return {
      level: 'warn',
      icon: '⚠️',
      text: msg ? `Validación: "${msg}"` : 'Datos inválidos — revisar el Request Body para ver qué campo falló',
    }
  }

  if (status === 429) {
    return { level: 'warn', icon: '⏱️', text: 'Rate limit alcanzado — demasiadas solicitudes en poco tiempo' }
  }

  if (status >= 500) {
    const msg = typeof responseBody === 'object' ? responseBody?.error : responseBody
    return {
      level: 'error',
      icon: '💥',
      text: msg ? `Error del servidor: "${msg}"` : 'Error interno del servidor — revisar logs en VPS (pm2 logs soloaunclick)',
    }
  }

  return null
}

// ─── Banner global cuando parece que el tunnel está caído ────────────────────
function detectTunnelDown(entries) {
  const recent = entries.slice(0, 10)
  if (recent.length < 2) return false
  const allProxy500 = recent.every(e => {
    if (e.status === null) return true
    const ct = e.responseHeaders?.['content-type'] || ''
    return e.status === 500 && (ct.includes('text/plain') || ct.includes('text/html'))
  })
  return allProxy500 && recent.some(e => e.status === 500)
}

function statusColor(status, ok) {
  if (status === null) return 'bg-slate-500/20 text-slate-300 border-slate-500/30'
  if (status === 0) return 'bg-rose-500/20 text-rose-300 border-rose-500/40'
  if (ok) return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
  if (status >= 400 && status < 500) return 'bg-amber-500/20 text-amber-300 border-amber-500/40'
  if (status >= 500) return 'bg-rose-500/20 text-rose-300 border-rose-500/40'
  return 'bg-slate-500/20 text-slate-300 border-slate-500/30'
}

function methodColor(method) {
  switch (method) {
    case 'GET': return 'text-sky-300'
    case 'POST': return 'text-emerald-300'
    case 'PUT': return 'text-amber-300'
    case 'PATCH': return 'text-violet-300'
    case 'DELETE': return 'text-rose-300'
    default: return 'text-slate-300'
  }
}

function formatTime(epoch) {
  const d = new Date(epoch)
  return d.toTimeString().slice(0, 8)
}

function JsonBlock({ data }) {
  if (data === null || data === undefined || data === '') {
    return <pre className="text-slate-600 text-xs italic">(sin contenido)</pre>
  }
  const text = typeof data === 'string' ? data : JSON.stringify(data, null, 2)
  return (
    <pre className="text-xs text-slate-200 whitespace-pre-wrap break-all font-mono leading-relaxed">
      {text}
    </pre>
  )
}

function DiagnoseBadge({ entry }) {
  const d = diagnoseCause(entry)
  if (!d) return null
  const bg = d.level === 'error' ? 'bg-rose-950/60 border-rose-500/30 text-rose-200' : 'bg-amber-950/60 border-amber-500/30 text-amber-200'
  return (
    <div className={`border rounded-lg px-3 py-2 text-xs leading-snug ${bg}`}>
      <span className="mr-1.5">{d.icon}</span>
      <strong>Causa probable:</strong> {d.text}
    </div>
  )
}

export default function DevApiMonitor() {
  const entries = useApiLog()
  const [open, setOpen] = useState(() => localStorage.getItem(STORAGE_OPEN) === '1')
  const [height, setHeight] = useState(() => Number(localStorage.getItem(STORAGE_HEIGHT)) || 340)
  const [selectedId, setSelectedId] = useState(null)
  const [filterText, setFilterText] = useState('')
  const [onlyErrors, setOnlyErrors] = useState(false)

  useEffect(() => { localStorage.setItem(STORAGE_OPEN, open ? '1' : '0') }, [open])
  useEffect(() => { localStorage.setItem(STORAGE_HEIGHT, String(height)) }, [height])

  const errorCount = entries.filter(e => e.status !== null && !e.ok).length
  const pendingCount = entries.filter(e => e.status === null).length
  const tunnelDown = detectTunnelDown(entries)

  const filtered = entries.filter(e => {
    if (onlyErrors && (e.ok || e.status === null)) return false
    if (!filterText) return true
    const q = filterText.toLowerCase()
    return (
      e.path.toLowerCase().includes(q) ||
      e.method.toLowerCase().includes(q) ||
      String(e.status || '').includes(q)
    )
  })

  const selected = entries.find(e => e.id === selectedId) || null

  function onDragStart(e) {
    e.preventDefault()
    const startY = e.clientY
    const startH = height
    const onMove = (ev) => {
      const next = Math.min(window.innerHeight - 80, Math.max(180, startH + (startY - ev.clientY)))
      setHeight(next)
    }
    const onUp = () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-36 z-[9999] flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-900 text-slate-100 text-xs font-mono shadow-lg border border-slate-700 hover:bg-slate-800 transition-colors"
        title="Abrir monitor de APIs (DEV)"
      >
        <span className="material-symbols-outlined text-sm">network_check</span>
        <span className="font-semibold">API</span>
        {errorCount > 0 && (
          <span className="px-1.5 py-0.5 rounded bg-rose-500 text-white text-[10px] font-bold">
            {errorCount}
          </span>
        )}
        {pendingCount > 0 && (
          <span className="px-1.5 py-0.5 rounded bg-amber-500 text-white text-[10px] font-bold animate-pulse">
            {pendingCount}
          </span>
        )}
        <span className="text-slate-500">({entries.length})</span>
      </button>
    )
  }

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-[9999] bg-slate-900 border-t-2 border-slate-700 text-slate-100 flex flex-col shadow-2xl"
      style={{ height }}
    >
      {/* Resize handle */}
      <div
        onMouseDown={onDragStart}
        className="h-1 cursor-ns-resize bg-slate-700 hover:bg-emerald-500 transition-colors"
      />

      {/* Banner: tunnel caído */}
      {tunnelDown && (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-rose-950 border-b border-rose-500/40 text-rose-200 text-xs">
          <span className="text-base">🔒</span>
          <strong>SSH Tunnel caído</strong>
          <span className="text-rose-300">— Todos los requests fallan con 500. El proxy de Vite no puede conectar a localhost:3002.</span>
          <code className="ml-2 px-2 py-0.5 rounded bg-rose-900/60 text-rose-100 font-mono text-[10px]">
            ssh -N -L 3002:localhost:3001 root@158.220.123.58 -i ~/.ssh/villarrica
          </code>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-800 bg-slate-950 flex-wrap">
        <span className="material-symbols-outlined text-emerald-400 text-base">network_check</span>
        <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">DEV · API Monitor</span>
        <span className="text-[10px] text-slate-500 ml-1">{entries.length} total</span>
        {errorCount > 0 && (
          <span className="px-1.5 py-0.5 rounded bg-rose-500/20 border border-rose-500/40 text-rose-300 text-[10px] font-bold">
            {errorCount} error{errorCount > 1 ? 'es' : ''}
          </span>
        )}
        <input
          value={filterText}
          onChange={e => setFilterText(e.target.value)}
          placeholder="Filtrar por path, método, status…"
          className="ml-2 flex-1 min-w-[140px] max-w-xs px-2 py-1 text-xs bg-slate-800 border border-slate-700 rounded text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
        />
        <label className="flex items-center gap-1 text-[10px] text-slate-400 cursor-pointer whitespace-nowrap">
          <input type="checkbox" checked={onlyErrors} onChange={e => setOnlyErrors(e.target.checked)} className="accent-rose-500" />
          Solo errores
        </label>
        <button
          onClick={() => { clearEntries(); setSelectedId(null) }}
          className="px-2 py-1 text-[10px] font-bold text-slate-400 hover:text-slate-100 border border-slate-700 rounded hover:bg-slate-800 whitespace-nowrap"
        >
          Limpiar
        </button>
        <button onClick={() => setOpen(false)} className="p-1 text-slate-400 hover:text-slate-100">
          <span className="material-symbols-outlined text-base">close</span>
        </button>
      </div>

      {/* Body split: list + detail */}
      <div className="flex-1 min-h-0 flex overflow-hidden">
        {/* Tabla */}
        <div className={`${selected ? 'w-1/2' : 'flex-1'} min-w-0 overflow-auto`}>
          <table className="w-full text-xs font-mono">
            <thead className="sticky top-0 bg-slate-950 border-b border-slate-800 z-10">
              <tr className="text-[10px] uppercase tracking-wider text-slate-500">
                <th className="text-left px-2 py-1.5 w-16">Hora</th>
                <th className="text-left px-2 py-1.5 w-14">Método</th>
                <th className="text-left px-2 py-1.5 w-14">Status</th>
                <th className="text-right px-2 py-1.5 w-12">ms</th>
                <th className="text-left px-2 py-1.5">Path</th>
                {!selected && <th className="text-left px-2 py-1.5">Causa</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="text-center py-8 text-slate-500 text-[11px]">
                  {entries.length === 0
                    ? '📡 Sin requests aún — haz alguna acción en la app'
                    : 'Sin resultados para el filtro actual'}
                </td></tr>
              )}
              {filtered.map(e => {
                const isSelected = e.id === selectedId
                const cause = diagnoseCause(e)
                return (
                  <tr
                    key={e.id}
                    onClick={() => setSelectedId(isSelected ? null : e.id)}
                    className={`border-b border-slate-800/60 cursor-pointer transition-colors select-none
                      ${isSelected ? 'bg-slate-700/80' : 'hover:bg-slate-800/40'}`}
                  >
                    <td className="px-2 py-1 text-slate-500">{formatTime(e.startedAt)}</td>
                    <td className={`px-2 py-1 font-bold ${methodColor(e.method)}`}>{e.method}</td>
                    <td className="px-2 py-1">
                      <span className={`inline-block px-1.5 rounded border text-[10px] font-bold ${statusColor(e.status, e.ok)}`}>
                        {e.status === null ? '…' : e.status === 0 ? 'ERR' : e.status}
                      </span>
                    </td>
                    <td className="px-2 py-1 text-right text-slate-400">{e.durationMs != null ? e.durationMs : '—'}</td>
                    <td className="px-2 py-1 text-slate-200 truncate max-w-[200px]">{e.path}</td>
                    {!selected && (
                      <td className="px-2 py-1 text-slate-400 text-[10px] truncate max-w-[300px]">
                        {cause ? <span>{cause.icon} {cause.text}</span> : null}
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Detalle */}
        {selected && (
          <div className="w-1/2 border-l border-slate-800 overflow-auto bg-slate-950 flex flex-col">
            {/* Header del detalle */}
            <div className="px-3 py-2 border-b border-slate-800 flex items-center gap-2 sticky top-0 bg-slate-950 z-10">
              <span className={`font-bold font-mono text-xs ${methodColor(selected.method)}`}>{selected.method}</span>
              <span className={`px-1.5 rounded border text-[10px] font-bold ${statusColor(selected.status, selected.ok)}`}>
                {selected.status === null ? '…' : selected.status === 0 ? 'ERR' : selected.status}
              </span>
              {selected.durationMs != null && (
                <span className="text-[10px] text-slate-500">{selected.durationMs}ms</span>
              )}
              <span className="text-[10px] text-slate-400 truncate flex-1 font-mono">{selected.path}</span>
              <button
                onClick={() => navigator.clipboard.writeText(JSON.stringify(selected, null, 2))}
                className="text-[10px] text-slate-400 hover:text-slate-100 px-2 py-0.5 border border-slate-700 rounded shrink-0"
              >
                Copiar JSON
              </button>
              <button onClick={() => setSelectedId(null)} className="text-slate-500 hover:text-slate-200 shrink-0">
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>

            <div className="p-3 space-y-3 overflow-auto">
              {/* Diagnóstico prominente arriba */}
              <DiagnoseBadge entry={selected} />

              <Section title="URL">
                <code className="text-xs text-slate-300 break-all font-mono">{selected.url}</code>
              </Section>

              <Section title={`Request Headers (${Object.keys(selected.requestHeaders).length})`}>
                <JsonBlock data={selected.requestHeaders} />
              </Section>

              <Section title="Request Body" tone={selected.requestBody ? 'neutral' : 'muted'}>
                <JsonBlock data={selected.requestBody} />
              </Section>

              {selected.error && (
                <Section title="Error de red" tone="error">
                  <pre className="text-xs text-rose-300 whitespace-pre-wrap font-mono">{selected.error}</pre>
                </Section>
              )}

              <Section
                title={selected.responseHeaders ? `Response Headers (${Object.keys(selected.responseHeaders).length})` : 'Response Headers'}
                tone="muted"
              >
                <JsonBlock data={selected.responseHeaders} />
              </Section>

              <Section title="Response Body" tone={selected.ok ? 'ok' : (selected.status ? 'error' : 'muted')}>
                <JsonBlock data={selected.responseBody} />
              </Section>

              <div className="text-[10px] text-slate-500 pt-2 border-t border-slate-800">
                Iniciado {new Date(selected.startedAt).toLocaleString('es-CL')} · Duración {selected.durationMs ?? '—'} ms
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function Section({ title, children, tone }) {
  const border =
    tone === 'error' ? 'border-rose-500/30' :
    tone === 'ok' ? 'border-emerald-500/30' :
    tone === 'muted' ? 'border-slate-800/60' :
    'border-slate-800'
  return (
    <div className={`border ${border} rounded-lg p-2 bg-slate-900/40`}>
      <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1.5">{title}</div>
      {children}
    </div>
  )
}
