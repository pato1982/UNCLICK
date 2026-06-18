import { useState, useEffect, useRef } from 'react'

const API = import.meta.env.VITE_API || ''

const btnClass = 'flex items-center gap-2 px-2 py-1 rounded-md transition-colors text-xs font-normal text-white/50 hover:text-accent w-full text-left'
const catBtnClass = 'flex items-center gap-2 px-2 py-1 rounded-md transition-colors text-xs font-normal text-white/50 hover:text-accent w-full'
const subBtnClass = 'flex items-center gap-2 pl-2 pr-2 py-0.5 rounded-md text-xs font-normal text-white/50 hover:text-accent w-full text-left'

const TURISMO_ICON_MAP = {
  'Aventura': 'kayaking',
  'Cabalgatas': 'pets',
  'Gastronómico': 'restaurant',
  'Gastronomía': 'restaurant',
  'Lagos': 'water',
  'Naturaleza': 'forest',
  'Nocturno': 'nightlife',
  'Rafting': 'rowing',
  'Spa': 'spa',
  'Termas': 'pool',
  'Trekking': 'hiking',
  'Volcanes': 'terrain',
  'Cultural': 'museum',
  'Familiar': 'family_restroom',
  'Deportivo': 'sports_soccer',
  'Relax': 'self_improvement',
  'Fotografía': 'photo_camera',
  'Acuático': 'pool',
  'Nieve': 'ac_unit',
  'Adrenalina': 'bolt',
}

const SIDEBAR_TITLES = {
  productos: 'Productos',
  servicios: 'Servicios',
  arriendos: 'Arriendos',
}

export default function Sidebar({ activeNav, open = false, onClose, onGoHome, showInicio, onFilterSelect, activeFilter, onMapClick, mapMode = false, onCategorySelect, turismoCategorias = [], listingSubcategorias = [], sidebarCategorias = [], onSidebarHeight }) {
  const [expandedCat, setExpandedCat] = useState(null)
  const [localeCategorias, setLocaleCategorias] = useState([])
  const [eventoCategorias, setEventoCategorias] = useState([])
  const [headerHeight, setHeaderHeight] = useState(150)
  const [bottomOffset, setBottomOffset] = useState(0)
  const mobileRef = useRef(null)

  // Medir header con ResizeObserver + recalcular al cambiar sección
  useEffect(() => {
    const headerEl = document.getElementById('main-header')
    if (!headerEl) return
    const update = () => setHeaderHeight(headerEl.offsetHeight + 4)
    update()
    const ro = new ResizeObserver(update)
    ro.observe(headerEl)
    return () => ro.disconnect()
  }, [activeNav])

  // Calcular bottom según visibilidad del footer - siempre activo mientras sidebar abierto
  useEffect(() => {
    if (!activeNav || !open) {
      setBottomOffset(0)
      return
    }
    const measure = () => {
      const footerEl = document.getElementById('main-footer')
      if (footerEl) {
        const footerRect = footerEl.getBoundingClientRect()
        const viewH = window.visualViewport?.height ?? window.innerHeight
        if (footerRect.top < viewH) {
          setBottomOffset(viewH - footerRect.top + 8)
        } else {
          setBottomOffset(0)
        }
      }
    }
    measure()
    window.addEventListener('scroll', measure, { passive: true })
    window.addEventListener('resize', measure)
    window.visualViewport?.addEventListener('resize', measure)
    return () => {
      window.removeEventListener('scroll', measure)
      window.removeEventListener('resize', measure)
      window.visualViewport?.removeEventListener('resize', measure)
    }
  }, [activeNav, open])

  const handleMobileClose = () => {
    if (onSidebarHeight) onSidebarHeight(0)
    onClose()
  }

  // Medir altura del sidebar y reportar al padre
  const [sidebarH, setSidebarH] = useState(0)
  useEffect(() => {
    if (mobileRef.current && open && activeNav) {
      const h = mobileRef.current.offsetHeight
      setSidebarH(h)
      if (onSidebarHeight) onSidebarHeight(h + 8)
    } else {
      setSidebarH(0)
      if (onSidebarHeight) onSidebarHeight(0)
    }
  })

  // Click fuera del menú se maneja con el overlay en el JSX

  useEffect(() => {
    if (activeNav === 'locales') {
      fetch(`${API}/api/v1/locales/categorias`)
        .then(r => r.json())
        .then(data => setLocaleCategorias(data.categorias || []))
        .catch(() => {})
    } else if (activeNav === 'eventos') {
      fetch(`${API}/api/v1/eventos/categorias`)
        .then(r => r.json())
        .then(data => setEventoCategorias(data.categorias || []))
        .catch(() => {})
    }
  }, [activeNav])

  if (!activeNav) return null
  // Menú cerrado por defecto: solo se muestra cuando se abre con la hamburguesa
  if (!open) return null

  let panel = null

  // Turismo: categorías dinámicas desde portadas
  if (activeNav === 'turismo') {
    panel = {
      title: 'Turismo',
      items: turismoCategorias.map(label => ({
        icon: TURISMO_ICON_MAP[label] || 'tour',
        label,
      })),
    }
  }
  // Productos, servicios, arriendos: categorías desde la BD con subcategorías
  else if (activeNav === 'productos' || activeNav === 'servicios' || activeNav === 'arriendos') {
    const tipoMap = { productos: 'producto', servicios: 'servicio', arriendos: 'arriendo' }
    const tipo = tipoMap[activeNav]
    const catsDelTipo = sidebarCategorias.filter(c => c.tipo === tipo)

    if (catsDelTipo.length > 0) {
      panel = {
        title: SIDEBAR_TITLES[activeNav],
        categories: catsDelTipo.map(c => ({
          icon: 'category',
          label: c.nombre,
          subcategories: c.subcategorias.map(s => s.nombre),
        })),
      }
    } else {
      panel = {
        title: SIDEBAR_TITLES[activeNav],
        categories: [],
      }
    }
  }
  // Locales: categorías desde API
  else if (activeNav === 'locales') {
    panel = {
      title: 'Negocios',
      items: localeCategorias.map(c => ({ icon: c.icono || 'storefront', label: c.nombre })),
    }
  }
  // Eventos: categorías desde API
  else if (activeNav === 'eventos') {
    panel = {
      title: 'Eventos',
      items: eventoCategorias.map(c => ({ icon: c.icono || 'event', label: c.nombre })),
    }
  }

  if (!panel) return null

  const isMobile = () => window.innerWidth < 1101

  const handleCatClick = (cat) => {
    setExpandedCat(expandedCat === cat.label ? null : cat.label)
    if (onCategorySelect) onCategorySelect(cat.label, cat.subcategories)
  }

  // Contenido de categorías (compartido entre mobile y desktop)
  const categoryList = (
    <>
      {/* Ver todos — resaltado cuando no hay filtro activo */}
      <button
        className={`${catBtnClass} mb-1 ${!activeFilter ? 'bg-white/10 text-accent' : ''}`}
        onClick={() => { onFilterSelect && onFilterSelect(null); setExpandedCat(null) }}
      >
        <span className="material-symbols-outlined text-sm">grid_view</span>
        <span className="flex-1 text-left">Ver todos</span>
      </button>
      {panel.categories ? (
        panel.categories.map((cat) => {
          const isExpanded = expandedCat === cat.label
          const visibleSubs = cat.subcategories

          return (
            <div key={cat.label}>
              <button
                className={`${catBtnClass} ${isExpanded || (activeFilter?.category === cat.label) ? 'bg-white/10 text-accent' : ''}`}
                onClick={() => handleCatClick(cat)}
              >
                <span className="material-symbols-outlined text-sm">{cat.icon}</span>
                <span className="flex-1 text-left">{cat.label}</span>
              </button>
              {isExpanded && (
                <div className="flex flex-col">
                  {visibleSubs.map((sub) => (
                    <button
                      key={sub}
                      className={`${subBtnClass} ${activeFilter === sub ? 'text-white font-bold' : ''}`}
                      onClick={() => onFilterSelect && onFilterSelect(activeFilter === sub ? null : sub)}
                    >
                      {activeFilter === sub
                        ? <span className="material-symbols-outlined text-white text-xs shrink-0">check</span>
                        : <span className="w-1 h-1 rounded-full bg-accent shrink-0"></span>
                      }
                      <span>{sub}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )
        })
      ) : panel.items && panel.items.length > 0 ? (
        panel.items.map((item) => (
          <button
            key={item.label}
            className={`${btnClass} ${activeFilter === item.label ? 'bg-white/20 text-white font-bold' : ''}`}
            onClick={() => onFilterSelect && onFilterSelect(activeFilter === item.label ? null : item.label)}
          >
            <span className="material-symbols-outlined text-sm">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))
      ) : (
        <p className="text-[10px] text-white/30 text-center py-3">Sin categorías aún</p>
      )}
    </>
  )

  return (
    <>
      {/* ===== Mobile/Tablet: barra vertical inline debajo del header ===== */}
      <div ref={mobileRef} className="md:hidden fixed left-0 right-0 z-40 flex" style={{ top: headerHeight + 'px', bottom: bottomOffset + 'px' }}>
        {/* Overlay para cerrar al tocar fuera */}
        <div className="absolute inset-0 bg-black/20" onClick={handleMobileClose}></div>
        {/* Panel del menú */}
        <div className="relative w-fit h-full bg-primary text-white shadow-lg flex flex-col border-r-2 border-accent">
        {/* Título + cerrar */}
        <div className="flex items-center justify-between gap-3 px-3 pt-2 pb-1 shrink-0">
          <h3 className="text-xs font-black uppercase tracking-tight whitespace-nowrap">{panel.title}</h3>
          <button onClick={handleMobileClose} className="hover:bg-white/10 rounded-full p-0.5 transition-colors shrink-0">
            <span className="material-symbols-outlined text-white/60 text-base hover:text-white">close</span>
          </button>
        </div>

        {/* Categorías en lista vertical con scroll */}
        <div className="flex-1 min-h-0 flex flex-col gap-0.5 px-2 pb-2 overflow-y-auto sidebar-scroll">
          {/* Ver todos — resaltado cuando no hay filtro activo */}
          <button
            onClick={() => { onFilterSelect && onFilterSelect(null); setExpandedCat(null); handleMobileClose() }}
            className={`flex items-center gap-1.5 w-full px-2 py-1 rounded-md text-[11px] font-medium transition-colors mb-1 ${
              !activeFilter ? 'bg-white/10 text-accent' : 'text-white/60 hover:text-accent'
            }`}
          >
            <span className="material-symbols-outlined text-xs">grid_view</span>
            <span className="whitespace-nowrap">Ver todos</span>
          </button>
          {panel.categories ? (
            panel.categories.map((cat) => {
              const isExpanded = expandedCat === cat.label
              return (
                <div key={cat.label}>
                  <button
                    onClick={() => handleCatClick(cat)}
                    className={`flex items-center gap-1.5 w-full px-2 py-1 rounded-md text-[11px] font-medium transition-colors ${
                      isExpanded || activeFilter?.category === cat.label
                        ? 'bg-white/10 text-accent'
                        : 'text-white/60 hover:text-accent'
                    }`}
                  >
                    <span className="material-symbols-outlined text-xs">{cat.icon}</span>
                    <span className="whitespace-nowrap">{cat.label}</span>
                  </button>
                  {isExpanded && cat.subcategories && cat.subcategories.length > 0 && (
                    <div className="flex flex-col ml-4">
                      {cat.subcategories.map((sub) => (
                        <button
                          key={sub}
                          onClick={() => { onFilterSelect && onFilterSelect(activeFilter === sub ? null : sub); handleMobileClose() }}
                          className={`flex items-center gap-1.5 px-1.5 py-0.5 rounded text-[10px] transition-colors ${
                            activeFilter === sub ? 'text-white font-bold' : 'text-white/40 hover:text-accent'
                          }`}
                        >
                          {activeFilter === sub
                            ? <span className="material-symbols-outlined text-white text-[10px] shrink-0">check</span>
                            : <span className="w-1 h-1 rounded-full bg-accent shrink-0"></span>
                          }
                          <span className="whitespace-nowrap">{sub}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )
            })
          ) : panel.items && panel.items.length > 0 ? (
            panel.items.map((item) => (
              <button
                key={item.label}
                onClick={() => { onFilterSelect && onFilterSelect(activeFilter === item.label ? null : item.label); handleMobileClose() }}
                className={`flex items-center gap-1.5 w-full px-2 py-1 rounded-md text-[11px] font-medium transition-colors ${
                  activeFilter === item.label
                    ? 'bg-white/10 text-accent font-bold'
                    : 'text-white/60 hover:text-accent'
                }`}
              >
                <span className="material-symbols-outlined text-xs">{item.icon}</span>
                <span className="whitespace-nowrap">{item.label}</span>
              </button>
            ))
          ) : (
            <p className="text-[10px] text-white/30 py-1">Sin categorías aún</p>
          )}
        </div>

        {/* Botón de acción */}
        <div className="px-2 pb-2 shrink-0 flex flex-col gap-1.5">
          <button
            onClick={() => {
              onFilterSelect && onFilterSelect(null)
              setExpandedCat(null)
              handleMobileClose && handleMobileClose()
            }}
            className={`w-full py-1 rounded-md text-[9px] font-black uppercase tracking-wide transition-all text-center ${
              !activeFilter ? 'bg-accent text-primary ring-2 ring-accent/50' : 'bg-accent/70 text-primary hover:bg-accent'
            }`}
          >
            Todas
          </button>
          {activeNav === 'locales' && (
            <button
              onClick={() => onMapClick && onMapClick()}
              className="w-full bg-white/10 hover:bg-white/20 text-white py-1 rounded-md text-[9px] font-black uppercase tracking-wide transition-all text-center"
            >
              {mapMode ? 'Volver' : 'Buscar en mapa'}
            </button>
          )}
        </div>
        </div>
      </div>

      {/* ===== Desktop: sidebar vertical normal (sin cambios) ===== */}
      <aside className="hidden md:block shrink-0 w-max sticky top-[112px] self-start mt-3 ml-1 z-30 mb-6">
        <div className="bg-primary text-white animate-slide-in shadow-lg p-2">
          <div className="border-2 border-accent rounded-lg p-2 pt-3">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-black uppercase tracking-tight">{panel.title}</h3>
              <button onClick={onClose} className="hover:bg-white/10 rounded-full p-0.5 transition-colors" title="Cerrar menú">
                <span className="material-symbols-outlined text-white/60 text-lg hover:text-white">close</span>
              </button>
            </div>
            <div className="flex flex-col gap-0 max-h-[330px] overflow-y-auto sidebar-scroll pr-1">
              {categoryList}
            </div>
            <div className="mt-3 pt-3 border-t border-white/20 flex flex-col gap-1.5">
              <button
                onClick={() => { onFilterSelect && onFilterSelect(null); setExpandedCat(null) }}
                className={`w-full py-1.5 rounded-md text-[10px] font-black uppercase tracking-wide transition-all text-center leading-tight ${
                  !activeFilter ? 'bg-accent text-primary ring-2 ring-accent/50' : 'bg-accent/70 text-primary hover:bg-accent'
                }`}
              >
                Todas
              </button>
              {activeNav === 'locales' && (
                <button
                  onClick={() => onMapClick && onMapClick()}
                  className="w-full bg-white/10 hover:bg-white/20 text-white py-1.5 rounded-md text-[10px] font-black uppercase tracking-wide transition-all text-center leading-tight"
                >
                  {mapMode ? 'Volver' : 'Buscar en mapa'}
                </button>
              )}
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
