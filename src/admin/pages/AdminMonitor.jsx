import React, { useState, useCallback } from 'react'

const API = import.meta.env.VITE_API || ''

const TIPO_BADGE = {
  producto: { label: 'Producto', color: 'bg-blue-50 text-blue-700' },
  servicio: { label: 'Servicio', color: 'bg-emerald-50 text-emerald-700' },
  arriendo: { label: 'Arriendo', color: 'bg-amber-50 text-amber-700' },
}

const PLAN_BADGE = {
  1: { label: 'Gratis', color: 'bg-slate-100 text-slate-500' },
  2: { label: 'Normal', color: 'bg-indigo-50 text-indigo-600' },
  3: { label: 'Premium', color: 'bg-purple-50 text-purple-700' },
}

function formatRelative(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'hace un momento'
  if (m < 60) return `hace ${m} min`
  const h = Math.floor(m / 60)
  if (h < 24) return `hace ${h}h`
  const d = Math.floor(h / 24)
  return `hace ${d}d`
}

function JsonToken({ value }) {
  if (value === null) return <span className="text-rose-500">null</span>
  if (typeof value === 'boolean') return <span className="text-amber-600">{String(value)}</span>
  if (typeof value === 'number') return <span className="text-sky-600">{value}</span>
  if (typeof value === 'string') return <span className="text-emerald-600">"{value}"</span>
  return <span className="text-slate-600">{String(value)}</span>
}

function JsonViewer({ data }) {
  const entries = Object.entries(data)
  return (
    <div className="font-mono text-xs leading-relaxed">
      <span className="text-slate-400">{'{'}</span>
      {entries.map(([key, val], i) => (
        <div key={key} className="ml-4">
          <span className="text-violet-600">"{key}"</span>
          <span className="text-slate-400">: </span>
          <JsonToken value={val} />
          {i < entries.length - 1 && <span className="text-slate-400">,</span>}
        </div>
      ))}
      <span className="text-slate-400">{'}'}</span>
    </div>
  )
}

export default function AdminMonitor() {
  const [listings, setListings] = useState([])
  const [businesses, setBusinesses] = useState([])
  const [meta, setMeta] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [fetched, setFetched] = useState(false)
  const [filter, setFilter] = useState('')
  const [tipoFilter, setTipoFilter] = useState('todos')
  const [expandedId, setExpandedId] = useState(null)
  const [expandedBizId, setExpandedBizId] = useState(null)
  const [copied, setCopied] = useState(false)
  const [activeTab, setActiveTab] = useState('listings')
  const [bizFilter, setBizFilter] = useState('')

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    setExpandedId(null)
    setExpandedBizId(null)
    try {
      const res = await fetch(`${API}/api/v1/monitor?limit=100`, {
        credentials: 'include',
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || `Error ${res.status}`)
      }
      const data = await res.json()
      setListings(data.listings || [])
      setBusinesses(data.businesses || [])
      setMeta({ total: data.total, generado: data.generado, businesses_total: data.businesses_total })
      setFetched(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  const filtered = listings.filter((l) => {
    const matchTipo = tipoFilter === 'todos' || l.tipo === tipoFilter
    const q = filter.toLowerCase()
    const matchQ = !q || l.nombre?.toLowerCase().includes(q) || l.usuario_nombre?.toLowerCase().includes(q) || l.usuario_email?.toLowerCase().includes(q) || l.categoria?.toLowerCase().includes(q)
    return matchTipo && matchQ
  })

  const filteredBiz = businesses.filter(b => {
    const q = bizFilter.toLowerCase()
    return !q || b.nombre_negocio?.toLowerCase().includes(q) || b.usuario_nombre?.toLowerCase().includes(q) || b.usuario_email?.toLowerCase().includes(q)
  })

  function toggleRow(id) {
    setExpandedId(prev => prev === id ? null : id)
    setCopied(false)
  }

  function toggleBizRow(id) {
    setExpandedBizId(prev => prev === id ? null : id)
    setCopied(false)
  }

  function copyJson(data) {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2)).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="-m-3 sm:-m-4 md:-m-6 min-h-[calc(100vh-56px)] bg-gray-50 p-3 sm:p-4 md:p-6">
    <div className="max-w-7xl mx-auto px-1">

      {/* ── Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Monitor de Plataforma</h1>
          <p className="text-sm text-slate-500 mt-1">
            Revisión de listings y negocios en tiempo real
          </p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm"
        >
          <span className={`material-symbols-outlined text-base ${loading ? 'animate-spin' : ''}`}>
            {loading ? 'progress_activity' : 'refresh'}
          </span>
          {loading ? 'Cargando...' : 'Actualizar'}
        </button>
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center gap-2 mb-5">
          <span className="material-symbols-outlined text-red-400 text-base">error</span>
          <p className="text-sm text-red-600 font-medium">{error}</p>
        </div>
      )}

      {/* ── Estado inicial ── */}
      {!fetched && !loading && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-16 text-center">
          <span className="material-symbols-outlined text-5xl text-slate-300 block mb-4">monitoring</span>
          <p className="text-base font-semibold text-slate-600 mb-1">Sin datos cargados</p>
          <p className="text-sm text-slate-400 mb-6">
            Presiona el botón para cargar las publicaciones y negocios del marketplace
          </p>
          <button
            onClick={fetchData}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary hover:bg-primary/90 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm"
          >
            <span className="material-symbols-outlined text-base">download</span>
            Cargar datos
          </button>
        </div>
      )}

      {/* ── Stats bar ── */}
      {fetched && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-5 py-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-primary text-xl">inventory_2</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{listings.length}</p>
              <p className="text-xs text-slate-500 mt-0.5">Total publicaciones</p>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-5 py-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-indigo-500 text-xl">storefront</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{businesses.length}</p>
              <p className="text-xs text-slate-500 mt-0.5">Total negocios</p>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-5 py-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-slate-500 text-xl">schedule</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-700">
                {meta?.generado ? formatRelative(meta.generado) : '—'}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">Última actualización</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Card principal ── */}
      {fetched && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

          {/* Tabs */}
          <div className="flex gap-0 border-b border-slate-200 px-4">
            {[
              { id: 'listings', label: 'Publicaciones', count: listings.length, icon: 'inventory_2' },
              { id: 'businesses', label: 'Negocios', count: businesses.length, icon: 'storefront' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3.5 text-sm font-medium border-b-2 transition-colors -mb-px
                  ${activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-slate-400 hover:text-slate-600 hover:border-slate-300'}`}
              >
                <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
                {tab.label}
                <span className={`ml-0.5 px-2 py-0.5 rounded-full text-[11px] font-semibold
                  ${activeTab === tab.id ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-slate-400'}`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* ── Filtros — Publicaciones ── */}
          {activeTab === 'listings' && (
            <div className="flex flex-wrap items-center gap-3 px-4 py-3 border-b border-slate-100 bg-slate-50/60">
              <div className="relative flex-1 min-w-[200px]">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 text-[18px]">search</span>
                <input
                  value={filter}
                  onChange={e => setFilter(e.target.value)}
                  placeholder="Buscar por nombre, usuario, categoría..."
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
                />
              </div>
              <select
                value={tipoFilter}
                onChange={e => setTipoFilter(e.target.value)}
                className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="todos">Todos los tipos</option>
                <option value="producto">Productos</option>
                <option value="servicio">Servicios</option>
                <option value="arriendo">Arriendos</option>
              </select>
              <span className="text-xs text-slate-400 ml-auto">
                {filtered.length} resultado{filtered.length !== 1 ? 's' : ''}
              </span>
            </div>
          )}

          {/* ── Filtros — Negocios ── */}
          {activeTab === 'businesses' && (
            <div className="flex flex-wrap items-center gap-3 px-4 py-3 border-b border-slate-100 bg-slate-50/60">
              <div className="relative flex-1 min-w-[200px]">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 text-[18px]">search</span>
                <input
                  value={bizFilter}
                  onChange={e => setBizFilter(e.target.value)}
                  placeholder="Buscar por nombre de negocio o usuario..."
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
                />
              </div>
              <span className="text-xs text-slate-400 ml-auto">
                {filteredBiz.length} resultado{filteredBiz.length !== 1 ? 's' : ''}
              </span>
            </div>
          )}

          {/* ── Tabla Publicaciones ── */}
          {activeTab === 'listings' && filtered.length === 0 && (
            <div className="py-16 text-center">
              <span className="material-symbols-outlined text-4xl text-slate-200 block mb-3">search_off</span>
              <p className="text-sm text-slate-400">No hay publicaciones que coincidan con los filtros.</p>
            </div>
          )}

          {activeTab === 'listings' && filtered.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left px-3 py-3 font-semibold text-slate-400 uppercase tracking-wider text-[11px] w-8"></th>
                    <th className="text-left px-3 py-3 font-semibold text-slate-400 uppercase tracking-wider text-[11px] w-14">Img</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-400 uppercase tracking-wider text-[11px]">Publicación</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-400 uppercase tracking-wider text-[11px] hidden md:table-cell">Tipo</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-400 uppercase tracking-wider text-[11px] hidden sm:table-cell">Sección</th>
                    <th className="text-right px-4 py-3 font-semibold text-slate-400 uppercase tracking-wider text-[11px] hidden sm:table-cell">Precio</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-400 uppercase tracking-wider text-[11px] hidden lg:table-cell">Usuario</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-400 uppercase tracking-wider text-[11px] hidden lg:table-cell">Plan</th>
                    <th className="text-right px-4 py-3 font-semibold text-slate-400 uppercase tracking-wider text-[11px]">Ingresado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filtered.map((l) => {
                    const tipo = TIPO_BADGE[l.tipo] || { label: l.tipo, color: 'bg-gray-50 text-gray-500' }
                    const plan = PLAN_BADGE[l.plan_id] || PLAN_BADGE[1]
                    const isExpanded = expandedId === l.id

                    return (
                      <React.Fragment key={l.id}>
                        <tr
                          onClick={() => toggleRow(l.id)}
                          className={`cursor-pointer transition-colors select-none
                            ${isExpanded ? 'bg-primary/5' : 'hover:bg-slate-50'}`}
                        >
                          <td className="px-3 py-3 w-8">
                            <span className={`material-symbols-outlined text-base transition-transform duration-200
                              ${isExpanded ? 'rotate-90 text-primary' : 'text-slate-300'}`}>
                              chevron_right
                            </span>
                          </td>
                          <td className="px-3 py-3">
                            {l.imagen ? (
                              <img
                                src={`${API}${l.imagen}`}
                                alt={l.nombre}
                                className="w-9 h-9 rounded-lg object-cover border border-slate-200"
                              />
                            ) : (
                              <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center border border-slate-200">
                                <span className="material-symbols-outlined text-slate-300 text-base">image</span>
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 max-w-[220px]">
                            <p className={`font-semibold truncate ${'text-slate-800'}`}>{l.nombre}</p>
                            {l.categoria && (
                              <p className="text-xs text-slate-400 truncate mt-0.5">
                                {l.categoria}{l.subcategoria ? ` / ${l.subcategoria}` : ''}
                              </p>
                            )}
                            {l.badge && (
                              <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary">{l.badge}</span>
                            )}
                          </td>
                          <td className="px-4 py-3 hidden md:table-cell">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${tipo.color}`}>
                              {tipo.label}
                            </span>
                          </td>
                          <td className={`px-4 py-3 hidden sm:table-cell capitalize text-xs ${'text-slate-500'}`}>
                            {l.seccion || '—'}
                          </td>
                          <td className="px-4 py-3 text-right hidden sm:table-cell">
                            {l.precio > 0 ? (
                              <span className={`font-semibold text-xs ${'text-slate-700'}`}>
                                ${l.precio.toLocaleString('es-CL')}
                              </span>
                            ) : (
                              <span className="text-slate-300 text-xs">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 hidden lg:table-cell max-w-[160px]">
                            <p className={`font-medium text-xs truncate ${'text-slate-700'}`}>{l.usuario_nombre}</p>
                            <p className="text-[11px] text-slate-400 truncate">{l.usuario_email}</p>
                          </td>
                          <td className="px-4 py-3 hidden lg:table-cell">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${plan.color}`}>
                              {plan.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right whitespace-nowrap text-xs text-slate-400">
                            {formatRelative(l.created_at)}
                          </td>
                        </tr>

                        {isExpanded && (
                          <tr key={`json-${l.id}`} className="bg-primary/5 border-b border-slate-100">
                            <td colSpan={9} className="px-6 py-4">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                  <span className="material-symbols-outlined text-primary text-sm">data_object</span>
                                  <span className="text-[11px] font-bold text-primary uppercase tracking-widest">
                                    Payload completo · ID {l.id}
                                  </span>
                                </div>
                                <button
                                  onClick={e => { e.stopPropagation(); copyJson(l) }}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-800"
                                >
                                  <span className="material-symbols-outlined text-xs">{copied ? 'check' : 'content_copy'}</span>
                                  {copied ? 'Copiado' : 'Copiar JSON'}
                                </button>
                              </div>
                              <div className="bg-white rounded-xl p-4 overflow-x-auto max-h-80 overflow-y-auto border border-slate-200 shadow-inner">
                                <JsonViewer data={l} />
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* ── Tabla Negocios ── */}
          {activeTab === 'businesses' && filteredBiz.length === 0 && (
            <div className="py-16 text-center">
              <span className="material-symbols-outlined text-4xl text-slate-200 block mb-3">storefront</span>
              <p className="text-sm text-slate-400">No hay negocios registrados.</p>
            </div>
          )}

          {activeTab === 'businesses' && filteredBiz.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left px-3 py-3 font-semibold text-slate-400 uppercase tracking-wider text-[11px] w-8"></th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-400 uppercase tracking-wider text-[11px]">Negocio</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-400 uppercase tracking-wider text-[11px] hidden md:table-cell">Contacto</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-400 uppercase tracking-wider text-[11px] hidden lg:table-cell">Usuario</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-400 uppercase tracking-wider text-[11px] hidden lg:table-cell">Plan</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-400 uppercase tracking-wider text-[11px] hidden sm:table-cell">Estado</th>
                    <th className="text-right px-4 py-3 font-semibold text-slate-400 uppercase tracking-wider text-[11px]">Ingresado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredBiz.map((b) => {
                    const plan = PLAN_BADGE[b.plan_id] || PLAN_BADGE[1]
                    const isExpanded = expandedBizId === b.id
                    return (
                      <React.Fragment key={b.id}>
                        <tr
                          onClick={() => toggleBizRow(b.id)}
                          className={`cursor-pointer transition-colors select-none
                            ${isExpanded ? 'bg-primary/5' : 'hover:bg-slate-50'}`}
                        >
                          <td className="px-3 py-3 w-8">
                            <span className={`material-symbols-outlined text-base transition-transform duration-200
                              ${isExpanded ? 'rotate-90 text-primary' : 'text-slate-300'}`}>
                              chevron_right
                            </span>
                          </td>
                          <td className="px-4 py-3 max-w-[200px]">
                            <p className={`font-semibold truncate ${'text-slate-800'}`}>{b.nombre_negocio}</p>
                            {b.slogan && <p className="text-xs text-slate-400 truncate italic mt-0.5">"{b.slogan}"</p>}
                            {b.descripcion && <p className="text-xs text-slate-400 truncate mt-0.5">{b.descripcion}</p>}
                          </td>
                          <td className="px-4 py-3 hidden md:table-cell max-w-[160px]">
                            {b.whatsapp && <p className={`truncate text-xs ${'text-slate-600'}`}>📱 {b.whatsapp}</p>}
                            {b.correo && <p className="truncate text-xs text-slate-400">{b.correo}</p>}
                            {b.direccion && <p className="truncate text-xs text-slate-400">📍 {b.direccion}</p>}
                          </td>
                          <td className="px-4 py-3 hidden lg:table-cell max-w-[160px]">
                            <p className={`font-medium text-xs truncate ${'text-slate-700'}`}>{b.usuario_nombre}</p>
                            <p className="text-[11px] text-slate-400 truncate">{b.usuario_email}</p>
                          </td>
                          <td className="px-4 py-3 hidden lg:table-cell">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${plan.color}`}>{plan.label}</span>
                          </td>
                          <td className="px-4 py-3 hidden sm:table-cell">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold
                              ${b.activo ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>
                              {b.activo ? 'Activo' : 'Inactivo'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right whitespace-nowrap text-xs text-slate-400">
                            {formatRelative(b.created_at)}
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr key={`json-biz-${b.id}`} className="bg-primary/5 border-b border-slate-100">
                            <td colSpan={7} className="px-6 py-4">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                  <span className="material-symbols-outlined text-primary text-sm">data_object</span>
                                  <span className="text-[11px] font-bold text-primary uppercase tracking-widest">
                                    Payload completo · Negocio ID {b.id}
                                  </span>
                                </div>
                                <button
                                  onClick={e => { e.stopPropagation(); copyJson(b) }}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-800"
                                >
                                  <span className="material-symbols-outlined text-xs">{copied ? 'check' : 'content_copy'}</span>
                                  {copied ? 'Copiado' : 'Copiar JSON'}
                                </button>
                              </div>
                              <div className="bg-white rounded-xl p-4 overflow-x-auto max-h-80 overflow-y-auto border border-slate-200 shadow-inner">
                                <JsonViewer data={b} />
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

        </div>
      )}
    </div>
    </div>
  )
}
