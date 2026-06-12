import { useState, useEffect } from 'react'
import {
  STORE_HEADER_PRESETS,
  NAV_STYLES,
  BAR_MODES,
  MENU_STYLES,
  DEFAULT_HEADER,
  HEADER_PAD_MIN,
  HEADER_PAD_MAX,
  HEADER_PAD_DEFAULT,
  getStoreHeaderStyle,
  softenColor,
  menuAccent,
} from '../../lib/storeHeaderPresets'
import StoreHeaderThemed from '../../components/StoreHeaderThemes'
import { StoreBanner, mapListing } from '../../components/StorePage'
import StoreServicesCollage from '../../components/StoreServicesCollage'

const API = import.meta.env.VITE_API || ''

// Vista previa del header (usa el mismo componente que la tienda real) + barra.
function HeaderPreview({ cfg, name, slogan, mini }) {
  const hdr = getStoreHeaderStyle(cfg)
  const integrated = hdr.barIntegrated
  const previewActions = (
    <span className={`flex items-center gap-1.5 ${hdr.actionText}`}>
      {/* En móvil con barra integrada, el "Volver" pasa a ser flecha flotante (abajo) */}
      <span className="hidden sm:inline text-[7px] font-bold text-accent border border-accent rounded-full px-1.5 py-0.5">← Volver</span>
      <span className="material-symbols-outlined text-sm">dashboard</span>
      <span className="material-symbols-outlined text-sm">logout</span>
    </span>
  )
  return (
    <div className="rounded-lg overflow-hidden shadow-sm border border-gray-100">
      <StoreHeaderThemed
        store={cfg}
        name={name || 'Mi Tienda'}
        slogan={slogan}
        mini={mini}
        actions={integrated ? previewActions : null}
      />
      {!integrated && (
        <div className={`px-3 ${mini ? 'py-1' : 'py-1.5'} flex items-center justify-between ${hdr.navBorderClass}`} style={hdr.navStyle}>
          <span className="text-[8px] font-bold text-accent border border-accent rounded-full px-1.5 py-0.5">← Volver</span>
          <span className={`flex items-center gap-1.5 ${hdr.navText}`}>
            {!mini && <span className={`text-[8px] ${hdr.navTextSoft}`}>Hola</span>}
            <span className="material-symbols-outlined text-sm">dashboard</span>
            <span className="material-symbols-outlined text-sm">logout</span>
          </span>
        </div>
      )}
      {/* Móvil + barra integrada: refleja la página real — flecha flotante (solo flecha)
          bajo el header, a la izquierda, sobre el inicio del contenido. */}
      {integrated && (
        <div className={`sm:hidden relative bg-slate-100 ${mini ? 'h-4' : 'h-6'}`}>
          <span
            className={`absolute left-1.5 flex items-center justify-center rounded-full bg-accent text-primary shadow ring-1 ring-black/10 ${mini ? 'h-4 w-4 -top-1.5' : 'h-6 w-6 -top-3'}`}
          >
            <span className="material-symbols-outlined leading-none" style={{ fontSize: mini ? 9 : 14 }}>arrow_back</span>
          </span>
        </div>
      )}
    </div>
  )
}

// Vista previa del banner: usa el MISMO componente que la tienda real (StoreBanner).
function BannerPreview({ color, items = [] }) {
  if (items.length === 0) {
    return (
      <div className="rounded-xl overflow-hidden border border-gray-200">
        <div className="h-32 sm:h-44 flex items-center justify-center" style={{ background: color === 'transparent' ? '#1a1220' : color }}>
          <span className="material-symbols-outlined text-3xl text-white/40">wallpaper</span>
        </div>
        <p className="text-[10px] text-slate-400 px-2 py-1 bg-white">Aún no cargaste imágenes en el banner (sección "Banner" del panel).</p>
      </div>
    )
  }
  return (
    <StoreBanner
      store={{ banner_color: color }}
      bannerItems={items}
      products={[]}
      phone=""
      storeUserId={null}
    />
  )
}

// Tarjeta del menú de categorías (compartida por todas las vistas previas).
function MenuCard({ bg, accent, border, className = '' }) {
  return (
    <div className={`text-white shadow-lg p-2 rounded-lg ${className}`} style={{ background: bg }}>
      <div className="border-2 rounded-lg p-2 pt-2.5" style={{ borderColor: border }}>
        <h3 className="text-xs font-black uppercase tracking-tight mb-2">Categorías</h3>
        <p className="text-[9px] font-black uppercase tracking-wider mb-1" style={{ color: accent }}>Productos</p>
        <div className="flex items-center gap-1.5 px-1.5 py-1 rounded-md bg-white/10 text-[11px]" style={{ color: accent }}>
          <span className="material-symbols-outlined text-xs">expand_more</span>
          Ropa y Calzado
        </div>
        <div className="flex items-center gap-1.5 pl-4 py-0.5 text-[10px] text-white/60">
          <span className="w-1 h-1 rounded-full" style={{ background: accent }} />
          Zapatillas
        </div>
        <div className="flex items-center gap-1.5 px-1.5 py-1 text-[11px] text-white/50">
          <span className="material-symbols-outlined text-xs">chevron_right</span>
          Tecnología
        </div>
      </div>
    </div>
  )
}

// Bloques que simulan el contenido (productos) de la página.
function FakeContent() {
  return (
    <div className="flex-1 grid grid-cols-3 gap-1.5">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-md bg-slate-200 h-9" />
      ))}
    </div>
  )
}

// Vista previa del menú lateral de categorías según el estilo elegido.
function SidebarPreview({ bg, accent, border, style = 'izquierda' }) {
  // Modal central: marco de página con el menú flotando en el centro.
  if (style === 'modal') {
    return (
      <div className="relative rounded-xl border border-gray-200 bg-white p-2 overflow-hidden min-h-[230px] sm:min-h-[200px]">
        <div className="flex items-center gap-1.5 mb-2">
          <span className="text-[9px] font-bold text-white bg-slate-700 rounded px-1.5 py-0.5 flex items-center gap-1">
            <span className="material-symbols-outlined text-[11px]">menu</span>Categorías
          </span>
          <div className="flex-1 h-2 rounded bg-slate-100" />
        </div>
        <div className="grid grid-cols-3 gap-1.5 opacity-40">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-md bg-slate-200 h-9" />
          ))}
        </div>
        {/* Overlay + menú centrado (refleja el modal real) */}
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center">
          <div className="w-48 rounded-xl overflow-hidden shadow-2xl text-white" style={{ background: bg }}>
            <div className="flex items-center gap-1.5 px-2.5 py-2" style={{ borderBottom: `2px solid ${border}` }}>
              <span className="flex items-center justify-center h-5 w-5 rounded-md" style={{ background: accent }}>
                <span className="material-symbols-outlined text-[12px] text-white">category</span>
              </span>
              <span className="text-[11px] font-black uppercase tracking-tight">Categorías</span>
              <span className="material-symbols-outlined text-white/50 text-sm ml-auto">close</span>
            </div>
            <div className="px-2 py-2 space-y-1">
              <p className="text-[8px] font-black uppercase tracking-wider" style={{ color: accent }}>Productos</p>
              <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-white/10 text-[11px]" style={{ color: accent }}>
                <span className="material-symbols-outlined text-xs">expand_more</span>Ropa y Calzado
              </div>
              <div className="flex items-center gap-1.5 ml-3 px-2 py-1 text-[10px] text-white/60">
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: accent }} />Zapatillas
              </div>
            </div>
            <div className="px-2 pb-2">
              <div className="w-full text-center py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wide text-white" style={{ background: accent }}>Ver todo</div>
            </div>
          </div>
        </div>
      </div>
    )
  }
  // Izquierda / Derecha: menú dentro del flujo, a un lado del contenido.
  return (
    <div className={`flex gap-2 items-start rounded-xl border border-gray-200 bg-white p-2 ${style === 'derecha' ? 'flex-row-reverse' : ''}`}>
      <MenuCard bg={bg} accent={accent} border={border} className="w-44 shrink-0" />
      <FakeContent />
    </div>
  )
}

export default function AdminApariencia() {
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const isPremium = (user.plan_id || 1) >= 3
  // Capacidades del plan: definen qué pestañas de estilo se muestran
  const ofreceServicios = !!user.ofrece_servicios
  const ofreceArriendos = !!user.ofrece_arriendos

  const [form, setForm] = useState(DEFAULT_HEADER)
  const [tab, setTab] = useState('header')
  const [negocio, setNegocio] = useState({ nombre_negocio: '', slogan: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [bannerItems, setBannerItems] = useState([])
  const [serviceItems, setServiceItems] = useState([])
  const [arriendoItems, setArriendoItems] = useState([])

  useEffect(() => {
    fetch(`${API}/api/v1/business`, { credentials: 'include' })
      .then(r => r.json())
      .then(data => {
        const b = data.business || {}
        setNegocio({ nombre_negocio: b.nombre_negocio || '', slogan: b.slogan || '' })
        setForm({
          header_preset: b.header_preset || DEFAULT_HEADER.header_preset,
          header_color: b.header_color || DEFAULT_HEADER.header_color,
          header_height: typeof b.header_height === 'number' ? b.header_height : HEADER_PAD_DEFAULT,
          header_bar: b.header_bar || DEFAULT_HEADER.header_bar,
          banner_color: b.banner_color || DEFAULT_HEADER.banner_color,
          services_color: b.services_color || DEFAULT_HEADER.services_color,
          arriendos_color: b.arriendos_color || DEFAULT_HEADER.arriendos_color,
          sidebar_style: b.sidebar_style || DEFAULT_HEADER.sidebar_style,
          nav_color: b.nav_color || DEFAULT_HEADER.nav_color,
          nav_style: b.nav_style || DEFAULT_HEADER.nav_style,
        })
      })
      .catch(() => {})
      .finally(() => setLoading(false))

    // Imágenes reales del banner del usuario (ítems con banner_orden)
    fetch(`${API}/api/v1/listings/mine`, { credentials: 'include' })
      .then(r => r.json())
      .then(data => {
        const list = data.listings || []
        const items = list
          .filter(l => l.banner_orden)
          .sort((a, b) => a.banner_orden - b.banner_orden)
          .map(l => ({ ...mapListing(l), banner_orden: l.banner_orden }))
        setBannerItems(items)
        setServiceItems(list.filter(l => !l.banner_orden && l.tipo === 'servicio').map(mapListing))
        setArriendoItems(list.filter(l => !l.banner_orden && l.tipo === 'arriendo').map(mapListing))
      })
      .catch(() => {})
  }, [])

  const update = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }))
    setSaved(false)
  }

  // Campos que controla cada pestaña (para restaurar su diseño original).
  const TAB_FIELDS = {
    header: ['header_preset', 'header_color', 'header_height', 'header_bar', 'nav_color', 'nav_style'],
    banner: ['banner_color'],
    servicios: ['services_color'],
    arriendos: ['arriendos_color'],
    menu: ['sidebar_style'],
  }
  const resetTab = (id) => {
    const fields = TAB_FIELDS[id] || []
    setForm(prev => {
      const next = { ...prev }
      fields.forEach(f => { next[f] = DEFAULT_HEADER[f] })
      return next
    })
    setSaved(false)
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`${API}/api/v1/business`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(form),
      })
      if (res.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      } else {
        const data = await res.json().catch(() => ({}))
        setError(data.error || 'Error al guardar')
      }
    } catch {
      setError('Error de conexión al guardar')
    }
    setSaving(false)
  }

  const cfgFull = { ...form }

  if (!isPremium) {
    return (
      <div className="p-4 sm:p-6">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
          <span className="material-symbols-outlined text-4xl text-amber-400">lock</span>
          <h2 className="text-base font-bold text-slate-800 mt-2">Función Premium</h2>
          <p className="text-sm text-slate-500 mt-1">La personalización del header está disponible para el plan Premium.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <span className="material-symbols-outlined text-primary text-3xl animate-spin">progress_activity</span>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto overflow-x-hidden">
      <div className="flex items-center gap-2 mb-1">
        <span className="material-symbols-outlined text-primary">palette</span>
        <h1 className="text-lg sm:text-xl font-black text-slate-800">Apariencia de la tienda</h1>
      </div>
      <p className="text-xs sm:text-sm text-slate-500 mb-4">Personalizá el header y el banner de tu tienda. Cada cambio se refleja en la vista previa.</p>

      {/* Pestañas (scroll horizontal en móvil con barra fina visible: indica que hay más opciones) */}
      <div className="flex gap-1 border-b border-gray-200 mb-5 overflow-x-auto tabs-scroll pb-1">
        {[
          { id: 'header', label: 'Header', icon: 'view_headline' },
          { id: 'banner', label: 'Banner', icon: 'wallpaper' },
          ...(ofreceServicios ? [{ id: 'servicios', label: 'Servicios', icon: 'work' }] : []),
          ...(ofreceArriendos ? [{ id: 'arriendos', label: 'Arriendos', icon: 'home' }] : []),
          { id: 'menu', label: 'Menú lateral', icon: 'menu' },
        ].map(t => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 text-xs sm:text-sm font-bold border-b-2 -mb-px transition-colors shrink-0 whitespace-nowrap ${tab === t.id ? 'border-primary text-primary' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
          >
            <span className="material-symbols-outlined text-base">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'header' && (<>
      {/* Vista previa grande */}
      <div className="mb-6">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Vista previa</span>
        <div className="mt-1.5">
          <HeaderPreview cfg={cfgFull} name={negocio.nombre_negocio} slogan={negocio.slogan} />
        </div>
      </div>

      {/* FILA 2: dos columnas (lado a lado en modo normal) — izq: tipos · der: colores y estilos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Columna izquierda: tipos de header y de barra */}
        <div className="space-y-5">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Tipo de header</span>
            <div className="grid grid-cols-1 gap-3 mt-1.5">
              {STORE_HEADER_PRESETS.map(p => {
                const selected = form.header_preset === p.id
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => update('header_preset', p.id)}
                    className={`text-left rounded-xl border-2 p-2 transition-all ${selected ? 'border-primary ring-2 ring-primary/20' : 'border-gray-200 hover:border-primary/40'}`}
                  >
                    <HeaderPreview cfg={{ ...cfgFull, header_preset: p.id }} name={negocio.nombre_negocio} slogan={negocio.slogan} mini />
                    <div className="flex items-center justify-between mt-1.5 px-0.5">
                      <span className="text-xs font-bold text-slate-700">{p.label}</span>
                      {selected && <span className="material-symbols-outlined text-primary text-base">check_circle</span>}
                    </div>
                    <p className="text-[10px] text-slate-400 px-0.5 leading-tight">{p.desc}</p>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Columna derecha: colores, estilos de texto y demás */}
        <div className="space-y-5">
          {/* Colores: header y barra, lado a lado */}
          <div className="grid grid-cols-2 gap-4">
          {/* Color de marca (header) */}
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Color del header</span>
            <div className="flex items-center gap-2 mt-1.5">
              <input
                type="color"
                value={form.header_color}
                onChange={(e) => update('header_color', e.target.value)}
                className="h-9 w-12 rounded border border-gray-300 cursor-pointer bg-white p-0.5"
              />
              <input
                type="text"
                value={form.header_color}
                onChange={(e) => update('header_color', e.target.value)}
                className="w-28 border border-gray-300 rounded-lg px-2 py-1.5 text-sm font-mono focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
              />
            </div>
          </div>

          {/* Color de la barra */}
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Color de la barra</span>
            <div className="flex items-center gap-2 mt-1.5">
              <input
                type="color"
                value={form.nav_color}
                onChange={(e) => update('nav_color', e.target.value)}
                className="h-9 w-12 rounded border border-gray-300 cursor-pointer bg-white p-0.5"
              />
              <input
                type="text"
                value={form.nav_color}
                onChange={(e) => update('nav_color', e.target.value)}
                className="w-28 border border-gray-300 rounded-lg px-2 py-1.5 text-sm font-mono focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
              />
            </div>
          </div>
          </div>

          {/* Altura (slider) */}
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Altura del header</span>
              <span className="text-[11px] font-mono text-slate-400">{form.header_height}px</span>
            </div>
            <input
              type="range"
              min={HEADER_PAD_MIN}
              max={HEADER_PAD_MAX}
              step={2}
              value={form.header_height}
              onChange={(e) => update('header_height', Number(e.target.value))}
              className="w-full mt-2 accent-primary"
            />
            <div className="flex justify-between text-[9px] text-slate-400 mt-0.5">
              <span>Compacto</span><span>Alto</span>
            </div>
          </div>

          {/* Modo de barra — separada o integrada en el header */}
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Barra de navegación</span>
            <div className="flex flex-wrap gap-2 mt-1.5">
              {BAR_MODES.map(b => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => update('header_bar', b.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border-2 transition-all ${form.header_bar === b.id ? 'border-primary bg-primary/5 text-primary' : 'border-gray-200 text-slate-500 hover:border-primary/40'}`}
                >
                  {b.label}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-slate-400 mt-1">"Integrada" mueve Volver / panel / salir adentro del header y quita la barra de abajo.</p>
          </div>

          {/* Tipo de barra — solo aplica cuando la barra está separada */}
          {form.header_bar !== 'integrada' && (
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Tipo de barra</span>
              <div className="flex flex-wrap gap-2 mt-1.5">
                {NAV_STYLES.map(s => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => update('nav_style', s.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border-2 transition-all ${form.nav_style === s.id ? 'border-primary bg-primary/5 text-primary' : 'border-gray-200 text-slate-500 hover:border-primary/40'}`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      </>)}

      {tab === 'banner' && (<>
      {/* Vista previa del banner */}
      <div className="mb-5">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Vista previa</span>
        {/* Encuadre tamaño móvil: el banner se ve como en el celular */}
        <div className="mt-1.5 mx-auto w-full max-w-[380px] rounded-2xl border border-gray-200 p-1 bg-white">
          <BannerPreview color={form.banner_color} items={bannerItems} />
        </div>
        <p className="text-[10px] text-slate-400 mt-1 text-center">Vista en tamaño móvil</p>
      </div>

      {/* Fondo del banner promocional */}
      <div>
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Fondo del banner</span>
        <p className="text-[10px] text-slate-400 mb-1.5">Color de fondo del banner promocional de tu tienda (detrás de las imágenes).</p>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => update('banner_color', 'transparent')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border-2 transition-all ${form.banner_color === 'transparent' ? 'border-primary bg-primary/5 text-primary' : 'border-gray-200 text-slate-500 hover:border-primary/40'}`}
          >
            <span
              className="h-4 w-4 rounded border border-gray-300"
              style={{ backgroundImage: 'linear-gradient(45deg,#ccc 25%,transparent 25%,transparent 75%,#ccc 75%),linear-gradient(45deg,#ccc 25%,#fff 25%,#fff 75%,#ccc 75%)', backgroundSize: '8px 8px', backgroundPosition: '0 0,4px 4px' }}
            />
            Transparente
          </button>
          <input
            type="color"
            value={form.banner_color === 'transparent' ? '#1a1220' : form.banner_color}
            onChange={(e) => update('banner_color', e.target.value)}
            className="h-9 w-12 rounded border border-gray-300 cursor-pointer bg-white p-0.5"
          />
          <input
            type="text"
            value={form.banner_color}
            onChange={(e) => update('banner_color', e.target.value)}
            className="w-32 border border-gray-300 rounded-lg px-2 py-1.5 text-sm font-mono focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
          />
        </div>
      </div>

      </>)}

      {tab === 'servicios' && (<>
      {/* Vista previa de servicios */}
      <div className="mb-5">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Vista previa</span>
        <div className="mt-1.5">
          {serviceItems.length > 0 ? (
            <StoreServicesCollage items={serviceItems} bgColor={form.services_color} />
          ) : (
            <div className="rounded-xl overflow-hidden border border-gray-200">
              <div className="h-32 sm:h-44 flex items-center justify-center" style={{ background: form.services_color === 'transparent' ? '#0f1a2e' : form.services_color }}>
                <span className="material-symbols-outlined text-3xl text-white/40">work</span>
              </div>
              <p className="text-[10px] text-slate-400 px-2 py-1 bg-white">Esta cuenta no tiene servicios cargados.</p>
            </div>
          )}
        </div>
      </div>

      {/* Fondo de la sección de servicios */}
      <div>
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Fondo de servicios</span>
        <p className="text-[10px] text-slate-400 mb-1.5">Color de fondo del collage de servicios de tu tienda.</p>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => update('services_color', 'transparent')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border-2 transition-all ${form.services_color === 'transparent' ? 'border-primary bg-primary/5 text-primary' : 'border-gray-200 text-slate-500 hover:border-primary/40'}`}
          >
            <span
              className="h-4 w-4 rounded border border-gray-300"
              style={{ backgroundImage: 'linear-gradient(45deg,#ccc 25%,transparent 25%,transparent 75%,#ccc 75%),linear-gradient(45deg,#ccc 25%,#fff 25%,#fff 75%,#ccc 75%)', backgroundSize: '8px 8px', backgroundPosition: '0 0,4px 4px' }}
            />
            Transparente
          </button>
          <input
            type="color"
            value={form.services_color === 'transparent' ? '#0f1a2e' : form.services_color}
            onChange={(e) => update('services_color', e.target.value)}
            className="h-9 w-12 rounded border border-gray-300 cursor-pointer bg-white p-0.5"
          />
          <input
            type="text"
            value={form.services_color}
            onChange={(e) => update('services_color', e.target.value)}
            className="w-32 border border-gray-300 rounded-lg px-2 py-1.5 text-sm font-mono focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
          />
        </div>
      </div>

      </>)}

      {tab === 'arriendos' && (<>
      {/* Vista previa de arriendos */}
      <div className="mb-5">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Vista previa</span>
        <div className="mt-1.5">
          {arriendoItems.length > 0 ? (
            <StoreServicesCollage items={arriendoItems} bgColor={form.arriendos_color} />
          ) : (
            <div className="rounded-xl overflow-hidden border border-gray-200">
              <div className="h-32 sm:h-44 flex items-center justify-center" style={{ background: form.arriendos_color === 'transparent' ? '#14241c' : form.arriendos_color }}>
                <span className="material-symbols-outlined text-3xl text-white/40">home</span>
              </div>
              <p className="text-[10px] text-slate-400 px-2 py-1 bg-white">Esta cuenta no tiene arriendos cargados.</p>
            </div>
          )}
        </div>
      </div>

      {/* Fondo de la sección de arriendos */}
      <div>
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Fondo de arriendos</span>
        <p className="text-[10px] text-slate-400 mb-1.5">Color de fondo del collage de arriendos de tu tienda.</p>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => update('arriendos_color', 'transparent')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border-2 transition-all ${form.arriendos_color === 'transparent' ? 'border-primary bg-primary/5 text-primary' : 'border-gray-200 text-slate-500 hover:border-primary/40'}`}
          >
            <span
              className="h-4 w-4 rounded border border-gray-300"
              style={{ backgroundImage: 'linear-gradient(45deg,#ccc 25%,transparent 25%,transparent 75%,#ccc 75%),linear-gradient(45deg,#ccc 25%,#fff 25%,#fff 75%,#ccc 75%)', backgroundSize: '8px 8px', backgroundPosition: '0 0,4px 4px' }}
            />
            Transparente
          </button>
          <input
            type="color"
            value={form.arriendos_color === 'transparent' ? '#14241c' : form.arriendos_color}
            onChange={(e) => update('arriendos_color', e.target.value)}
            className="h-9 w-12 rounded border border-gray-300 cursor-pointer bg-white p-0.5"
          />
          <input
            type="text"
            value={form.arriendos_color}
            onChange={(e) => update('arriendos_color', e.target.value)}
            className="w-32 border border-gray-300 rounded-lg px-2 py-1.5 text-sm font-mono focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
          />
        </div>
      </div>

      </>)}

      {tab === 'menu' && (<>
      {/* Vista previa del menú lateral */}
      <div className="mb-5">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Vista previa</span>
        <div className="mt-1.5 p-4 bg-slate-100 rounded-xl">
          <SidebarPreview bg={softenColor(form.header_color)} accent={menuAccent(form.header_color)} border={form.header_color} style={form.sidebar_style} />
        </div>
      </div>
      <p className="text-[11px] text-slate-500 mb-4 flex items-start gap-1.5">
        <span className="material-symbols-outlined text-sm text-primary">auto_awesome</span>
        El menú usa automáticamente el color de tu header, así combina con el aspecto de la página. Para cambiar su color, ajustá el color del header en la pestaña "Header".
      </p>

      {/* Estilo / posición del menú — cada tienda puede tener uno distinto */}
      <div className="mb-6">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Estilo del menú</span>
        <p className="text-[10px] text-slate-400 mb-2">Elegí cómo se muestra el menú de categorías en tu tienda. No tiene que ser igual al resto.</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {MENU_STYLES.map(s => {
            const selected = form.sidebar_style === s.id
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => update('sidebar_style', s.id)}
                className={`text-left rounded-xl border-2 p-3 transition-all ${selected ? 'border-primary ring-2 ring-primary/20' : 'border-gray-200 hover:border-primary/40'}`}
              >
                <div className="flex items-center justify-between">
                  <span className="material-symbols-outlined text-primary">{s.icon}</span>
                  {selected && <span className="material-symbols-outlined text-primary text-base">check_circle</span>}
                </div>
                <span className="block text-xs font-bold text-slate-700 mt-1">{s.label}</span>
                <p className="text-[10px] text-slate-400 leading-tight mt-0.5">{s.desc}</p>
              </button>
            )
          })}
        </div>
      </div>

      </>)}

      {/* Guardar */}
      <div className="mt-6 flex flex-wrap items-center gap-2 sm:gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-primary text-white font-bold px-3 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-1.5 sm:gap-2"
        >
          <span className="material-symbols-outlined text-base sm:text-lg">save</span>
          {saving ? 'Guardando...' : (<><span className="sm:hidden">Guardar</span><span className="hidden sm:inline">Guardar cambios</span></>)}
        </button>
        <button
          type="button"
          onClick={() => resetTab(tab)}
          className="flex items-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-bold border-2 border-gray-200 text-slate-500 hover:border-primary/40 hover:text-primary transition-colors"
          title="Restaurar esta pestaña al diseño original"
        >
          <span className="material-symbols-outlined text-base sm:text-lg">restart_alt</span>
          <span className="sm:hidden">Volver al original</span><span className="hidden sm:inline">Volver al diseño original</span>
        </button>
        {saved && <span className="text-xs sm:text-sm font-semibold text-green-600 flex items-center gap-1 w-full sm:w-auto"><span className="material-symbols-outlined text-base">check_circle</span>Guardado</span>}
        {error && <span className="text-xs sm:text-sm font-semibold text-red-600 w-full sm:w-auto">{error}</span>}
      </div>
    </div>
  )
}
