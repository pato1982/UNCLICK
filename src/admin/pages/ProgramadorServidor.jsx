import { useState, useEffect } from 'react'

const API = import.meta.env.VITE_API || ''

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(i > 1 ? 2 : 0)} ${units[i]}`
}

function ProgressRing({ percent, color, size = 120, stroke = 10 }) {
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (percent / 100) * circumference

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#1e293b" strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={radius} fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="transition-all duration-700"
      />
    </svg>
  )
}

function StatCard({ icon, label, value, sub, color }) {
  return (
    <div className="flex items-center gap-3 bg-slate-800/50 rounded-lg px-3 py-2.5">
      <span className={`material-symbols-outlined text-lg ${color}`}>{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-slate-500 uppercase font-bold">{label}</p>
        <p className="text-sm font-bold text-white">{value}</p>
        {sub && <p className="text-[10px] text-slate-500">{sub}</p>}
      </div>
    </div>
  )
}

export default function ProgramadorServidor() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [uploadsOpen, setUploadsOpen] = useState(false)


  const fetchStats = () => {
    setLoading(true)
    fetch(`${API}/api/v1/servidor/stats`, { credentials: 'include' })
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => { fetchStats() }, [])

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!data || data.error) {
    return (
      <div className="text-center py-20">
        <span className="material-symbols-outlined text-5xl text-red-400 mb-3 block">error</span>
        <p className="text-sm text-slate-400">Error al cargar estadísticas del servidor</p>
      </div>
    )
  }

  const { disco, bd } = data
  const discoPercent = disco.total > 0 ? Math.round((disco.usado / disco.total) * 100) : 0
  const discoColor = discoPercent > 90 ? '#ef4444' : discoPercent > 70 ? '#f59e0b' : '#10b981'

  // BD: estimar contra un límite razonable (ej: 1 GB)
  const bdLimit = 1 * 1024 * 1024 * 1024
  const bdPercent = Math.min(Math.round((bd.total / bdLimit) * 100), 100)
  const bdColor = bdPercent > 80 ? '#ef4444' : bdPercent > 50 ? '#f59e0b' : '#6366f1'

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-black text-emerald-400 flex items-center gap-2">
          <span className="material-symbols-outlined text-2xl">dns</span>
          Servidor
        </h1>
        <button
          onClick={fetchStats}
          className="flex items-center gap-1.5 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs font-bold rounded-lg transition-colors"
        >
          <span className="material-symbols-outlined text-sm">refresh</span>
          Actualizar
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {/* DISCO */}
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-5">
            <span className="material-symbols-outlined text-emerald-400">hard_drive</span>
            <h2 className="text-sm font-bold text-white">Almacenamiento</h2>
          </div>

          <div className="flex items-center gap-6 mb-5">
            <div className="relative shrink-0">
              <ProgressRing percent={discoPercent} color={discoColor} />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-black text-white">{discoPercent}%</span>
                <span className="text-[9px] text-slate-500 font-bold">USADO</span>
              </div>
            </div>
            <div className="flex-1 flex flex-col gap-2">
              <StatCard icon="storage" label="Total" value={formatBytes(disco.total)} color="text-slate-400" />
              <StatCard icon="pie_chart" label="Usado" value={formatBytes(disco.usado)} color="text-amber-400" />
              <StatCard icon="check_circle" label="Disponible" value={formatBytes(disco.disponible)} color="text-emerald-400" />
            </div>
          </div>

          <div className="bg-slate-800/50 rounded-lg overflow-hidden">
            <button
              onClick={() => setUploadsOpen(!uploadsOpen)}
              className="w-full px-3 py-2.5 flex items-center gap-3 hover:bg-slate-700/50 transition-colors"
            >
              <span className="material-symbols-outlined text-lg text-blue-400">folder</span>
              <div className="flex-1 text-left">
                <p className="text-[10px] text-slate-500 uppercase font-bold">Carpeta uploads</p>
                <p className="text-sm font-bold text-white">{formatBytes(disco.uploads)}</p>
              </div>
              <span className={`material-symbols-outlined text-sm text-slate-500 transition-transform duration-200 ${uploadsOpen ? 'rotate-180' : ''}`}>
                expand_more
              </span>
            </button>
            {uploadsOpen && disco.uploadsCarpetas && disco.uploadsCarpetas.length > 0 && (
              <div className="border-t border-slate-700 px-3 py-2 flex flex-col gap-1.5">
                {disco.uploadsCarpetas.map((c) => (
                  <div key={c.nombre} className="flex items-center gap-2.5 px-2 py-1.5 rounded bg-slate-900/50">
                    <span className="material-symbols-outlined text-sm text-slate-500">
                      {c.nombre.includes('raíz') ? 'image' : 'folder_open'}
                    </span>
                    <span className="text-[11px] text-slate-300 flex-1 truncate font-mono">{c.nombre}</span>
                    <span className="text-[11px] text-slate-400 font-bold">{formatBytes(c.bytes)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* BASE DE DATOS */}
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-5">
            <span className="material-symbols-outlined text-indigo-400">database</span>
            <h2 className="text-sm font-bold text-white">Base de Datos</h2>
            <span className="text-[10px] text-slate-500 font-bold ml-auto">aunclick</span>
          </div>

          <div className="flex items-center gap-6 mb-5">
            <div className="relative shrink-0">
              <ProgressRing percent={bdPercent} color={bdColor} />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-black text-white">{formatBytes(bd.total)}</span>
                <span className="text-[9px] text-slate-500 font-bold">TOTAL</span>
              </div>
            </div>
            <div className="flex-1 flex flex-col gap-2">
              <StatCard icon="table_chart" label="Datos" value={formatBytes(bd.datos)} color="text-indigo-400" />
              <StatCard icon="index" label="Índices" value={formatBytes(bd.indices)} color="text-purple-400" />
              <StatCard icon="grid_view" label="Tablas" value={`${bd.tablas.length} tablas`} color="text-slate-400" />
            </div>
          </div>

          {/* Tabla de detalle */}
          <div className="max-h-52 overflow-y-auto rounded-lg border border-slate-700">
            <table className="w-full text-[10px]">
              <thead className="bg-slate-800 sticky top-0">
                <tr>
                  <th className="text-left px-2.5 py-1.5 text-slate-500 font-bold uppercase">Tabla</th>
                  <th className="text-right px-2.5 py-1.5 text-slate-500 font-bold uppercase">Filas</th>
                  <th className="text-right px-2.5 py-1.5 text-slate-500 font-bold uppercase">Tamaño</th>
                </tr>
              </thead>
              <tbody>
                {bd.tablas.map((t, i) => (
                  <tr key={t.tabla} className={`border-t border-slate-800 ${i % 2 === 0 ? '' : 'bg-slate-800/30'}`}>
                    <td className="px-2.5 py-1.5 text-slate-300 font-mono">{t.tabla}</td>
                    <td className="px-2.5 py-1.5 text-slate-400 text-right">{(t.filas || 0).toLocaleString()}</td>
                    <td className="px-2.5 py-1.5 text-slate-400 text-right">{formatBytes(t.total_bytes)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
