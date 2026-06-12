import { useState, useEffect } from 'react'

const API = import.meta.env.VITE_API || ''

function KpiCard({ label, value, color }) {
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl p-3 flex flex-col items-center gap-1.5 text-center">
      <p className={`text-2xl font-black ${color}`}>{value}</p>
      <p className="text-[10px] text-slate-400 font-semibold leading-tight">{label}</p>
    </div>
  )
}

export default function ProgramadorEstadisticas() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)


  const fetchData = () => {
    setLoading(true)
    fetch(`${API}/api/v1/servidor/estadisticas`, { credentials: 'include' })
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => { fetchData() }, [])

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
        <p className="text-sm text-slate-400">Error al cargar estadísticas</p>
      </div>
    )
  }

  const { kpis, visitas } = data

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-black text-emerald-400 flex items-center gap-2">
          <span className="material-symbols-outlined text-2xl">bar_chart</span>
          Estadísticas
        </h1>
        <button
          onClick={fetchData}
          className="flex items-center gap-1.5 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs font-bold rounded-lg transition-colors"
        >
          <span className="material-symbols-outlined text-sm">refresh</span>
          Actualizar
        </button>
      </div>

      {/* KPIs Usuarios */}
      <div className="mb-6">
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Usuarios registrados</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 sm:gap-3">
          <KpiCard label="Total registrados" value={kpis.total} color="text-emerald-400" />
          <KpiCard label="Plan Gratuito" value={kpis.general_gratis} color="text-slate-300" />
          <KpiCard label="Plan Normal" value={kpis.general_normal} color="text-blue-400" />
          <KpiCard label="Plan Premium" value={kpis.general_premium} color="text-amber-400" />
          <KpiCard label="Turismo Gratis" value={kpis.turismo_gratis} color="text-teal-400" />
          <KpiCard label="Turismo Premium" value={kpis.turismo_premium} color="text-purple-400" />
        </div>
      </div>

      {/* KPIs Visitas */}
      <div className="mb-6">
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Visitas al sitio</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 sm:gap-3">
          <KpiCard label="Visitas hoy" value={visitas.hoy} color="text-green-400" />
          <KpiCard label="Promedio diario" value={visitas.promedio_diario} color="text-emerald-400" />
          <KpiCard label="Visitas semanales" value={visitas.semanales} color="text-blue-400" />
          <KpiCard label="Visitas mensuales" value={visitas.mensuales} color="text-indigo-400" />
          <KpiCard label="Total histórico" value={visitas.total} color="text-amber-400" />
          <KpiCard label="Visitantes únicos" value={visitas.visitantes_unicos} color="text-cyan-400" />
          <KpiCard label="Visitantes reiterados" value={visitas.reiterados} color="text-rose-400" />
        </div>
      </div>
    </div>
  )
}
