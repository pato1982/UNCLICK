import { useState, useEffect } from 'react'

const API = import.meta.env.VITE_API || ''

const ALL_SECCIONES = [
  { id: 'destacados', label: 'Destacados', icon: 'star', color: 'amber', requiere: 'vende_productos' },
  { id: 'ofertas', label: 'Ofertas', icon: 'local_offer', color: 'red', requiere: 'vende_productos' },
  { id: 'novedades', label: 'Novedades', icon: 'new_releases', color: 'blue', requiere: 'vende_productos' },
  { id: 'liquidacion', label: 'Liquidación', icon: 'savings', color: 'green', requiere: 'vende_productos' },
  { id: 'tecnologia', label: 'Tecnología', icon: 'devices', color: 'purple', requiere: 'vende_productos' },
  { id: 'servicios', label: 'Servicios', icon: 'build', color: 'orange', requiere: 'ofrece_servicios' },
  { id: 'arriendos', label: 'Arriendos', icon: 'home', color: 'teal', requiere: 'ofrece_arriendos' },
]

const PLAN_LIMITS = { 1: 5, 2: 25, 3: 100 }
const PLAN_BANNER = { 1: 0, 2: 0, 3: 10 }
const PLAN_NAMES = { 1: 'Gratuito', 2: 'Normal', 3: 'Premium' }

const COLOR_MAP = {
  amber: { bg: 'bg-amber-50', text: 'text-amber-600', icon: 'bg-amber-100' },
  red: { bg: 'bg-red-50', text: 'text-red-600', icon: 'bg-red-100' },
  blue: { bg: 'bg-blue-50', text: 'text-blue-600', icon: 'bg-blue-100' },
  green: { bg: 'bg-green-50', text: 'text-green-600', icon: 'bg-green-100' },
  purple: { bg: 'bg-purple-50', text: 'text-purple-600', icon: 'bg-purple-100' },
  orange: { bg: 'bg-orange-50', text: 'text-orange-600', icon: 'bg-orange-100' },
  teal: { bg: 'bg-teal-50', text: 'text-teal-600', icon: 'bg-teal-100' },
}

const EMPTY_CHART = [{ mes: '-', valor: 0 }]

function BarChart({ data }) {
  const max = Math.max(...data.map(d => d.valor), 1)
  const w = 300, h = 150
  const barW = (w - 10) / data.length
  const barArea = h - 25 // espacio para barras (dejando margen arriba para números y abajo para labels)

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="block w-full h-full">
      {data.map((d, i) => {
        const barH = (d.valor / max) * (barArea - 12)
        const x = 5 + i * barW
        const bx = x + barW * 0.15
        const bw = barW * 0.7
        return (
          <g key={i}>
            <rect x={bx} y={h - 14 - barH} width={bw} height={barH} rx="3" fill="#3B1969" opacity="0.8" />
            <text x={x + barW / 2} y={h - 16 - barH} textAnchor="middle" fill="#3B1969" style={{ fontSize: '9px', fontWeight: 700 }}>{d.valor}</text>
            <text x={x + barW / 2} y={h - 2} textAnchor="middle" fill="#6b7280" style={{ fontSize: '9px', fontWeight: 600 }}>{d.mes}</text>
          </g>
        )
      })}
    </svg>
  )
}

function LineChart({ data }) {
  if (!data || data.length < 2) {
    return (
      <svg viewBox="0 0 300 150" className="block w-full h-full">
        <text x="150" y="80" textAnchor="middle" fill="#d1d5db" style={{ fontSize: '11px', fontWeight: 600 }}>Sin datos aún</text>
      </svg>
    )
  }
  const max = Math.max(...data.map(d => d.valor), 1)
  const w = 300, h = 150
  const padX = 15, padTop = 15, padBot = 18
  const usableW = w - padX * 2, usableH = h - padTop - padBot
  const px = usableW / (data.length - 1)
  const points = data.map((d, i) => ({ x: padX + i * px, y: padTop + usableH - (d.valor / max) * usableH }))
  const polyline = points.map(p => `${p.x},${p.y}`).join(' ')

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="block w-full h-full">
      {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => (
        <line key={i} x1={padX} y1={padTop + usableH - pct * usableH} x2={w - padX} y2={padTop + usableH - pct * usableH} stroke="#f1f5f9" strokeWidth="0.5" />
      ))}
      <polygon points={`${padX},${padTop + usableH} ${polyline} ${w - padX},${padTop + usableH}`} fill="url(#accentGrad)" opacity="0.3" />
      <polyline points={polyline} fill="none" stroke="#E5B800" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="3" fill="#E5B800" stroke="white" strokeWidth="1.5" />
          <text x={p.x} y={p.y - 7} textAnchor="middle" fill="#b45309" style={{ fontSize: '8px', fontWeight: 700 }}>{data[i].valor}</text>
          <text x={p.x} y={h - 4} textAnchor="middle" fill="#6b7280" style={{ fontSize: '9px', fontWeight: 600 }}>{data[i].mes}</text>
        </g>
      ))}
      <defs>
        <linearGradient id="accentGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#E5B800" />
          <stop offset="100%" stopColor="#E5B800" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  )
}

export default function AdminEstadisticas() {
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  const planId = user.plan_id || 1
  const esTurismo = user.tipo_cuenta === 'turismo'

  // Filtrar secciones según permisos del usuario
  const secciones = ALL_SECCIONES.filter(sec => {
    if (esTurismo) return false
    if (sec.requiere === 'vende_productos') return user.vende_productos
    if (sec.requiere === 'ofrece_servicios') return user.ofrece_servicios
    if (sec.requiere === 'ofrece_arriendos') return user.ofrece_arriendos
    return true
  })

  const [listings, setListings] = useState([])
  const [tours, setTours] = useState([])
  const [portada, setPortada] = useState(null)
  const [visitas, setVisitas] = useState(EMPTY_CHART)
  const [clicks, setClicks] = useState(EMPTY_CHART)
  const [cardClicks, setCardClicks] = useState(EMPTY_CHART)
  const [resumen, setResumen] = useState({ visitas_mes: 0, visitantes_unicos: 0, clicks_mes: 0, por_pagina: {} })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const headers = { }

    if (esTurismo) {
      Promise.all([
        fetch(`${API}/api/v1/tours`, { credentials: 'include' }).then(r => r.json()),
        fetch(`${API}/api/v1/portada`, { credentials: 'include' }).then(r => r.json()),
        fetch(`${API}/api/v1/analytics/stats`, { credentials: 'include' }).then(r => r.json()),
      ])
        .then(([toursData, portadaData, statsData]) => {
          if (toursData.tours) setTours(toursData.tours)
          if (portadaData.portada) setPortada(portadaData.portada)
          if (statsData.visitas?.length) setVisitas(statsData.visitas)
          if (statsData.clicks?.length) setClicks(statsData.clicks)
          if (statsData.card_clicks?.length) setCardClicks(statsData.card_clicks)
          if (statsData.resumen) setResumen(statsData.resumen)
        })
        .catch(err => console.error('Error:', err))
        .finally(() => setLoading(false))
    } else {
      Promise.all([
        fetch(`${API}/api/v1/listings/mine`, { credentials: 'include' }).then(r => r.json()),
        fetch(`${API}/api/v1/analytics/stats`, { credentials: 'include' }).then(r => r.json()),
      ])
        .then(([listData, statsData]) => {
          if (listData.listings) setListings(listData.listings)
          if (statsData.visitas?.length) setVisitas(statsData.visitas)
          if (statsData.clicks?.length) setClicks(statsData.clicks)
          if (statsData.resumen) setResumen(statsData.resumen)
        })
        .catch(err => console.error('Error:', err))
        .finally(() => setLoading(false))
    }
  }, [])

  // --- Datos comercio ---
  const productos = listings.filter(l => !l.banner_orden)
  const bannerItems = listings.filter(l => l.banner_orden)

  const conteoSecciones = {}
  secciones.forEach(s => { conteoSecciones[s.id] = 0 })
  productos.forEach(l => {
    const sec = l.seccion || 'destacados'
    if (conteoSecciones[sec] !== undefined) conteoSecciones[sec]++
  })

  const maxProd = PLAN_LIMITS[planId] || 5
  const maxBanner = PLAN_BANNER[planId] || 0
  const totalMax = esTurismo ? 12 : maxProd + maxBanner
  const totalUsado = esTurismo ? tours.length : listings.length

  const pctProd = Math.min((productos.length / maxProd) * 100, 100)
  const pctBanner = maxBanner > 0 ? Math.min((bannerItems.length / maxBanner) * 100, 100) : 0
  const pctTotal = Math.min((totalUsado / totalMax) * 100, 100)

  // --- Datos turismo ---
  const totalImagenesTours = tours.reduce((acc, t) => {
    const imgs = t.imagenes
    const arr = typeof imgs === 'string' ? (function() { try { return JSON.parse(imgs) } catch { return [] } })() : (imgs || [])
    return acc + arr.length
  }, 0)
  const portadaImgsRaw = portada?.imagenes
  const portadaImgsArr = typeof portadaImgsRaw === 'string' ? (function() { try { return JSON.parse(portadaImgsRaw) } catch { return [] } })() : (portadaImgsRaw || [])
  const portadaImagenes = portadaImgsArr.length
  const pctTours = Math.min((tours.length / 12) * 100, 100)
  const pctImgTours = Math.min((totalImagenesTours / 36) * 100, 100)
  const pctPortada = Math.min((portadaImagenes / 3) * 100, 100)

  if (loading) return <div className="flex items-center justify-center py-20"><span className="material-symbols-outlined text-primary text-3xl animate-spin">progress_activity</span></div>

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-black text-gray-800">Estadísticas</h1>
        <p className="text-xs text-gray-400 mt-0.5">Resumen de tu cuenta — Plan {PLAN_NAMES[planId]}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-5">
        {/* KPIs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4">
          {esTurismo ? (
            <>
              <h2 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-lg text-primary">tour</span>
                Resumen de turismo
              </h2>
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                <div className="bg-purple-50 rounded-xl p-2 sm:p-3 flex items-center gap-2 sm:gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-xl text-purple-600">tour</span>
                  </div>
                  <div>
                    <span className="text-xl font-black text-purple-600 leading-none">{tours.length}</span>
                    <p className="text-[10px] font-semibold text-gray-500 leading-tight">Tours</p>
                  </div>
                </div>
                <div className="bg-blue-50 rounded-xl p-2 sm:p-3 flex items-center gap-2 sm:gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-xl text-blue-600">photo_library</span>
                  </div>
                  <div>
                    <span className="text-xl font-black text-blue-600 leading-none">{totalImagenesTours}</span>
                    <p className="text-[10px] font-semibold text-gray-500 leading-tight">Imgs Tours</p>
                  </div>
                </div>
                <div className="bg-amber-50 rounded-xl p-2 sm:p-3 flex items-center gap-2 sm:gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-xl text-amber-600">home</span>
                  </div>
                  <div>
                    <span className="text-xl font-black text-amber-600 leading-none">{portadaImagenes}</span>
                    <p className="text-[10px] font-semibold text-gray-500 leading-tight">Imgs Portada</p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <h2 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-lg text-primary">inventory_2</span>
                Productos por sección
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                {secciones.map(sec => {
                  const c = COLOR_MAP[sec.color]
                  const count = conteoSecciones[sec.id]
                  return (
                    <div key={sec.id} className={`${c.bg} rounded-xl p-2 sm:p-3 flex items-center gap-2 sm:gap-3`}>
                      <div className={`w-10 h-10 rounded-lg ${c.icon} flex items-center justify-center shrink-0`}>
                        <span className={`material-symbols-outlined text-xl ${c.text}`}>{sec.icon}</span>
                      </div>
                      <div>
                        <span className={`text-xl font-black ${c.text} leading-none`}>{count}</span>
                        <p className="text-[10px] font-semibold text-gray-500 leading-tight">{sec.label}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>

        {/* Barras de uso */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4">
          <h2 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-lg text-primary">donut_small</span>
            Uso del plan
          </h2>
          {esTurismo ? (
            <div className="space-y-3">
              {/* Tours */}
              <div>
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[11px] font-semibold text-gray-600">Tours</span>
                  <span className="text-[11px] font-bold text-primary">{tours.length} / 12</span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-500 ${pctTours >= 90 ? 'bg-red-500' : pctTours >= 70 ? 'bg-amber-500' : 'bg-primary'}`} style={{ width: `${pctTours}%` }} />
                </div>
              </div>

              {/* Imágenes de tours */}
              <div>
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[11px] font-semibold text-gray-600">Imágenes de tours</span>
                  <span className="text-[11px] font-bold text-primary">{totalImagenesTours} / 36</span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-500 ${pctImgTours >= 90 ? 'bg-red-500' : pctImgTours >= 70 ? 'bg-amber-500' : 'bg-accent'}`} style={{ width: `${pctImgTours}%` }} />
                </div>
              </div>

              {/* Portada */}
              <div>
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[11px] font-semibold text-gray-600">Portada</span>
                  <span className="text-[11px] font-bold text-primary">{portadaImagenes} / 3</span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-500 ${pctPortada >= 90 ? 'bg-red-500' : pctPortada >= 70 ? 'bg-amber-500' : 'bg-green-500'}`} style={{ width: `${pctPortada}%` }} />
                </div>
              </div>

              {/* Total */}
              <div className="border-t border-gray-100 pt-3">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-xs font-bold text-gray-800">Total imágenes</span>
                  <span className="text-xs font-black text-primary">{totalImagenesTours + portadaImagenes} / 39</span>
                </div>
                <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-500 bg-primary`} style={{ width: `${Math.min(((totalImagenesTours + portadaImagenes) / 39) * 100, 100)}%` }} />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Publicaciones */}
              <div>
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[11px] font-semibold text-gray-600">Publicaciones</span>
                  <span className="text-[11px] font-bold text-primary">{productos.length} / {maxProd}</span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-500 ${pctProd >= 90 ? 'bg-red-500' : pctProd >= 70 ? 'bg-amber-500' : 'bg-primary'}`} style={{ width: `${pctProd}%` }} />
                </div>
              </div>

              {/* Banner */}
              <div>
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[11px] font-semibold text-gray-600">Banner</span>
                  {maxBanner > 0
                    ? <span className="text-[11px] font-bold text-primary">{bannerItems.length} / {maxBanner}</span>
                    : <span className="text-[9px] font-semibold text-gray-400">No disponible</span>
                  }
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  {maxBanner > 0 ? (
                    <div className={`h-full rounded-full transition-all duration-500 ${pctBanner >= 90 ? 'bg-red-500' : pctBanner >= 70 ? 'bg-amber-500' : 'bg-green-500'}`} style={{ width: `${pctBanner}%` }} />
                  ) : (
                    <div className="h-full rounded-full bg-gray-200" style={{ width: '100%' }} />
                  )}
                </div>
              </div>

              {/* Total */}
              <div className="border-t border-gray-100 pt-3">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-xs font-bold text-gray-800">Total</span>
                  <span className="text-xs font-black text-primary">{totalUsado} / {totalMax}</span>
                </div>
                <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-500 ${pctTotal >= 90 ? 'bg-red-500' : pctTotal >= 70 ? 'bg-amber-500' : 'bg-primary'}`} style={{ width: `${pctTotal}%` }} />
                </div>
                <p className="text-[9px] text-gray-400 mt-1 text-right">
                  {totalMax - totalUsado > 0 ? `${totalMax - totalUsado} imágenes disponibles` : 'Límite alcanzado'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Gráfico de barras — Visitas a la página */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4 overflow-hidden">
          <h2 className="text-sm font-bold text-gray-800 mb-1 flex items-center gap-2">
            <span className="material-symbols-outlined text-lg text-primary">visibility</span>
            Visitas a tu página
          </h2>
          <p className="text-[9px] text-gray-400 mb-2">Últimos 6 meses</p>
          <div className="bg-gray-50 rounded-lg border border-gray-100 p-1 overflow-hidden">
            <BarChart data={visitas} />
          </div>
        </div>

        {/* Gráfico de líneas — Clicks en productos */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4 overflow-hidden">
          <h2 className="text-sm font-bold text-gray-800 mb-1 flex items-center gap-2">
            <span className="material-symbols-outlined text-lg text-accent">touch_app</span>
            {esTurismo ? 'Clicks en tu tarjeta' : 'Clicks en productos'}
          </h2>
          <p className="text-[9px] text-gray-400 mb-2">Últimos 6 meses — {esTurismo ? 'iconos y botón Ver más' : 'página principal y tu página'}</p>
          <div className="bg-gray-50 rounded-lg border border-gray-100 p-1 overflow-hidden">
            <LineChart data={esTurismo ? cardClicks : clicks} />
          </div>
        </div>

        {/* Resumen de visitas del mes */}
        <div className="sm:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4">
          <h2 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-lg text-primary">groups</span>
            Resumen de visitas — Mes actual
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
            <div className="bg-indigo-50 rounded-xl p-3 sm:p-4 flex items-center gap-3">
              <div className="w-11 h-11 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-xl text-indigo-600">visibility</span>
              </div>
              <div>
                <span className="text-xl sm:text-2xl font-black text-indigo-600 leading-none">{resumen.visitas_mes}</span>
                <p className="text-[10px] font-semibold text-gray-500 leading-tight">Visitas totales</p>
              </div>
            </div>
            <div className="bg-emerald-50 rounded-xl p-3 sm:p-4 flex items-center gap-3">
              <div className="w-11 h-11 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-xl text-emerald-600">person</span>
              </div>
              <div>
                <span className="text-xl sm:text-2xl font-black text-emerald-600 leading-none">{resumen.visitantes_unicos}</span>
                <p className="text-[10px] font-semibold text-gray-500 leading-tight">Visitantes únicos</p>
              </div>
            </div>
            <div className="bg-rose-50 rounded-xl p-3 sm:p-4 flex items-center gap-3">
              <div className="w-11 h-11 rounded-lg bg-rose-100 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-xl text-rose-600">touch_app</span>
              </div>
              <div>
                <span className="text-xl sm:text-2xl font-black text-rose-600 leading-none">{esTurismo ? resumen.card_clicks_mes : resumen.clicks_mes}</span>
                <p className="text-[10px] font-semibold text-gray-500 leading-tight">{esTurismo ? 'Clicks en tarjeta' : 'Clicks en productos'}</p>
              </div>
            </div>
            <div className="bg-amber-50 rounded-xl p-3 sm:p-4 flex items-center gap-3">
              <div className="w-11 h-11 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-xl text-amber-600">web</span>
              </div>
              <div>
                {Object.keys(resumen.por_pagina).length > 0 ? (
                  <div className="flex flex-col gap-0.5">
                    {Object.entries(resumen.por_pagina).map(([pag, total]) => (
                      <div key={pag} className="flex items-center gap-2">
                        <span className="text-xl sm:text-2xl font-black text-amber-600 leading-none">{total}</span>
                        <span className="text-[10px] text-gray-500 capitalize">{pag}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <>
                    <span className="text-xl sm:text-2xl font-black text-amber-600 leading-none">0</span>
                    <p className="text-[10px] font-semibold text-gray-500 leading-tight">Por página</p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
