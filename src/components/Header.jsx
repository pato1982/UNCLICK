import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import PlansModal from './PlansModal'
import LoginModal from './LoginModal'
import RegisterModal from './RegisterModal'
const API = import.meta.env.VITE_API || ''

export default function Header({ activeNav, toggleNav, onToggleSidebar, sidebarOpen, onGoHome, showInicio, onSearchSelect, user, onLoginSuccess, onLogout }) {
  const [showPlans, setShowPlans] = useState(false)
  const [showLogin, setShowLogin] = useState(() => {
    const params = new URLSearchParams(window.location.search)
    return !!params.get('reset')
  })
  const [showRegister, setShowRegister] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [showResults, setShowResults] = useState(false)
  const [searchIndex, setSearchIndex] = useState([])
  const searchRef = useRef(null)

  // Cargar índice de búsqueda desde la BD
  useEffect(() => {
    async function loadSearchIndex() {
      try {
        const [catRes, locRes, evRes] = await Promise.all([
          fetch(`${API}/api/v1/categorias`).then(r => r.json()),
          fetch(`${API}/api/v1/locales/categorias`).then(r => r.json()),
          fetch(`${API}/api/v1/eventos/categorias`).then(r => r.json()),
        ])
        const tipoNav = { producto: 'productos', servicio: 'servicios', arriendo: 'arriendos', turismo: 'turismo' }
        const tipoLabel = { producto: 'Productos', servicio: 'Servicios', arriendo: 'Arriendos', turismo: 'Turismo' }
        const index = []
        // Categorías de productos/servicios/arriendos/turismo
        ;(catRes.categorias || []).forEach(cat => {
          const nav = tipoNav[cat.tipo] || cat.tipo
          const section = tipoLabel[cat.tipo] || cat.tipo
          index.push({ icon: cat.icono || 'category', label: cat.nombre, section, type: 'category', nav, subcategories: cat.subcategorias.map(s => s.nombre) })
          cat.subcategorias.forEach(sub => {
            index.push({ icon: cat.icono || 'category', label: sub.nombre, section: `${section} → ${cat.nombre}`, type: 'subcategory', nav })
          })
        })
        // Locales de barrio
        ;(locRes.categorias || []).forEach(cat => {
          index.push({ icon: cat.icono || 'storefront', label: cat.nombre, section: 'Negocios', type: 'subcategory', nav: 'locales' })
        })
        // Eventos
        ;(evRes.categorias || []).forEach(cat => {
          index.push({ icon: cat.icono || 'event', label: cat.nombre, section: 'Eventos', type: 'subcategory', nav: 'eventos' })
        })
        setSearchIndex(index)
      } catch (err) {
        console.error('Error cargando índice de búsqueda:', err)
      }
    }
    loadSearchIndex()
  }, [])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowResults(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSearch = (value) => {
    setQuery(value)
    if (value.length >= 3) {
      const q = value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      const matches = searchIndex.filter((item) => {
        const label = item.label.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        return label.includes(q)
      })
      setResults(matches.slice(0, 8))
      setShowResults(true)
    } else {
      setResults([])
      setShowResults(false)
    }
  }

  const handleSelect = (item) => {
    setQuery('')
    setResults([])
    setShowResults(false)
    if (onSearchSelect) onSearchSelect(item)
  }

  const navItems = [
    { label: 'Productos', icon: 'inventory_2' },
    { label: 'Servicios', icon: 'work' },
    { label: 'Arriendos', icon: 'home' },
    { label: 'Turismo', icon: 'tour' },
    { label: 'Negocios', icon: 'storefront' },
  ]

  return (
    <div id="main-header" className="sticky top-0 z-50">
      {/* === HEADER PRINCIPAL === */}
      <header className="bg-primary text-white px-3 sm:px-4 md:px-6 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center gap-2 sm:gap-4 md:gap-8 md:justify-center relative py-4 sm:py-5 md:py-7">
          {/* Logo */}
          <div className="flex items-center gap-2 sm:gap-2 md:absolute md:left-0 shrink-0">
            <div className="bg-accent p-1.5 sm:p-2 md:p-1.5 rounded-lg text-primary">
              <span className="material-symbols-outlined block text-2xl sm:text-3xl md:text-2xl font-bold">ads_click</span>
            </div>
            <span className="text-lg sm:text-xl md:text-xl font-black tracking-tight">
              Local<span className="text-accent">Click</span>
            </span>
          </div>

          {/* Buscador - oculto en mobile, visible en tablet/desktop */}
          <div className="hidden sm:block sm:flex-initial w-full sm:max-w-[280px] md:max-w-lg relative group md:flex-none sm:mx-auto" ref={searchRef}>
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
              <span className="material-symbols-outlined text-slate-400 group-focus-within:text-primary text-sm sm:text-base">search</span>
            </div>
            <input
              className="w-full rounded-full bg-white text-slate-900 py-1.5 md:py-2 pl-8 sm:pl-10 pr-10 sm:pr-24 focus:ring-4 focus:ring-primary-light/40 border-none transition-all placeholder:text-slate-400 text-[10px] sm:text-xs md:text-sm"
              placeholder="Buscar..."
              type="text"
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              onFocus={() => query.length >= 3 && setShowResults(true)}
            />
            <button className="absolute right-1 top-1 bottom-1 bg-accent text-primary px-2 sm:px-4 rounded-full font-bold text-[10px] sm:text-sm hover:brightness-110 hover:scale-105 transition-all">
              <span className="hidden sm:inline">Buscar</span>
              <span className="material-symbols-outlined sm:hidden text-sm">search</span>
            </button>
            {showResults && results.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-50">
                {results.map((item, i) => (
                  <button
                    key={i}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors text-left border-b border-slate-100 last:border-0"
                    onClick={() => handleSelect(item)}
                  >
                    <span className="material-symbols-outlined text-primary text-lg">{item.icon}</span>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-bold text-slate-800 block">{item.label}</span>
                      <span className="text-[10px] text-slate-400">{item.section}</span>
                    </div>
                    <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      item.type === 'category' ? 'bg-primary/10 text-primary' : 'bg-accent/20 text-primary'
                    }`}>{item.type === 'category' ? 'Categoría' : 'Subcategoría'}</span>
                  </button>
                ))}
              </div>
            )}
            {showResults && query.length >= 3 && results.length === 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-2xl border border-slate-200 z-50 px-4 py-3 text-center text-sm text-slate-400">
                No se encontraron resultados
              </div>
            )}
          </div>

          {/* Espacio para mantener layout en tablet */}
          <div className="hidden sm:flex md:hidden items-center ml-auto" />

          {/* Recuadro: espacio publicitario disponible (estirado dentro del header, todos los modos) */}
          <div className="absolute right-0 top-1.5 bottom-1.5 flex items-center">
            <div className="flex items-center gap-2 h-full border-2 border-dashed border-white/40 rounded-lg px-3 sm:px-4 md:px-6 text-white/70 hover:border-accent/70 hover:text-accent transition-colors">
              <span className="material-symbols-outlined text-base sm:text-xl md:text-3xl shrink-0">campaign</span>
              <span className="text-[9px] sm:text-[10px] md:text-xs font-bold uppercase tracking-wide leading-tight max-w-[120px] sm:max-w-[150px] md:max-w-none">
                Espacio publicitario disponible
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* === NAV BAR Mobile: siempre visible === */}
      <nav className="sm:hidden bg-[#4A2070] px-2 py-2 border-y-2 border-accent shadow-md min-h-[36px]">
        {/* Hamburguesa + Buscador + Sesión + Planes */}
        <div className="flex items-center gap-1.5">
          {/* Botón hamburguesa — abre/cierra el menú lateral de categorías */}
          {activeNav && (
            <button
              onClick={onToggleSidebar}
              className="shrink-0 p-0.5 rounded-md hover:bg-white/10 transition-colors"
              title={sidebarOpen ? 'Cerrar menú' : 'Abrir menú'}
            >
              <span className="material-symbols-outlined text-xl text-white/70">{sidebarOpen ? 'menu_open' : 'menu'}</span>
            </button>
          )}
          {/* Buscador (angosto) */}
          <div className="relative group flex-1 min-w-0">
            <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none z-10">
              <span className="material-symbols-outlined text-slate-400 group-focus-within:text-primary text-xs">search</span>
            </div>
            <input
              className="w-full rounded-full bg-white/90 text-slate-900 py-1 pl-7 pr-2 border-none placeholder:text-slate-400 text-[10px] focus:ring-2 focus:ring-accent/40 transition-all"
              placeholder="Buscar..."
              type="text"
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              onFocus={() => query.length >= 3 && setShowResults(true)}
            />
            {showResults && results.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-50">
                {results.map((item, i) => (
                  <button
                    key={i}
                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-50 transition-colors text-left border-b border-slate-100 last:border-0"
                    onClick={() => handleSelect(item)}
                  >
                    <span className="material-symbols-outlined text-primary text-sm">{item.icon}</span>
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-bold text-slate-800 block">{item.label}</span>
                      <span className="text-[9px] text-slate-400">{item.section}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
            {showResults && query.length >= 3 && results.length === 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-2xl border border-slate-200 z-50 px-3 py-2 text-center text-xs text-slate-400">
                No se encontraron resultados
              </div>
            )}
          </div>
          {/* Iconos sesión + Planes */}
          <div className="flex items-center gap-1 shrink-0">
            {user ? (
              <>
                <Link to="/admin" className="p-1 text-white/70 hover:text-accent rounded-full hover:bg-white/10 transition-colors">
                  <span className="material-symbols-outlined text-base">{user.rol === 'programador' ? 'terminal' : 'dashboard'}</span>
                </Link>
                <button onClick={onLogout} className="p-1 text-white/70 hover:text-accent rounded-full hover:bg-white/10 transition-colors">
                  <span className="material-symbols-outlined text-base">logout</span>
                </button>
              </>
            ) : (
              <>
                <button onClick={() => setShowRegister(true)} className="p-1 text-white/70 hover:text-accent rounded-full hover:bg-white/10 transition-colors" title="Registrarse">
                  <span className="material-symbols-outlined text-base">person_add</span>
                </button>
                <button onClick={() => setShowLogin(true)} className="p-1 text-white/70 hover:text-accent rounded-full hover:bg-white/10 transition-colors" title="Ingresar">
                  <span className="material-symbols-outlined text-base">login</span>
                </button>
              </>
            )}
            <button onClick={() => setShowPlans(true)} className="flex items-center gap-0.5 text-[9px] font-bold bg-accent text-primary px-1.5 py-0.5 rounded-full hover:brightness-110 transition-all">
              <span className="material-symbols-outlined text-xs">star</span>
              Planes
            </button>
          </div>
        </div>
      </nav>

      {/* === NAV BAR - Tablet y Desktop === */}
      <nav className="hidden sm:block bg-[#4A2070] px-3 sm:px-4 md:px-6 border-y-2 border-accent shadow-md min-h-[40px]">
        <div className="max-w-7xl mx-auto flex items-center justify-end gap-3 sm:gap-4 md:gap-8 min-h-[40px]">
          {/* Grupo izquierdo: Hamburguesa */}
          <div className="mr-auto flex items-center gap-2 sm:gap-3">
            {activeNav && (
              <button
                onClick={onToggleSidebar}
                className="flex items-center gap-1.5 text-[10px] sm:text-xs font-bold text-white/80 hover:text-accent transition-colors"
                title={sidebarOpen ? 'Cerrar menú' : 'Abrir menú'}
              >
                <span className="material-symbols-outlined text-base sm:text-lg">{sidebarOpen ? 'menu_open' : 'menu'}</span>
                <span className="hidden md:inline">{sidebarOpen ? 'Cerrar' : 'Categorías'}</span>
              </button>
            )}
          </div>
          {showInicio && (
            <button
              onClick={onGoHome}
              className="flex items-center gap-1 text-[10px] sm:text-xs font-bold bg-accent text-primary px-2 sm:px-3 py-1 rounded-full hover:brightness-110 transition-all"
            >
              <span className="material-symbols-outlined text-sm sm:text-base">home</span>
              Inicio
            </button>
          )}

          {/* Desktop: Registrarse, Ingresar y Planes */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <>
                {user.rol !== 'programador' && (
                  <>
                    <span className="text-xs text-white/70">Hola, <span className="font-bold text-accent">{(() => { const n = user.nombre.split(' ')[0]; return n.length > 10 ? n.slice(0, 10) + '...' : n })()}</span>
                    </span>
                    <Link to="/admin" className="flex items-center text-white/90 hover:text-accent transition-colors" title="Panel de administrador">
                      <span className="material-symbols-outlined text-xl">dashboard</span>
                    </Link>
                  </>
                )}
                {user.rol === 'programador' && (
                  <Link to="/admin" className="flex items-center text-white/90 hover:text-accent transition-colors" title="Panel programador">
                    <span className="material-symbols-outlined text-xl">terminal</span>
                  </Link>
                )}
                <button onClick={onLogout} className="flex items-center text-white/90 hover:text-accent transition-colors" title="Salir">
                  <span className="material-symbols-outlined text-xl">logout</span>
                </button>
              </>
            ) : (
              <>
                <button onClick={() => setShowRegister(true)} className="flex items-center gap-1 text-xs font-bold text-white/90 hover:text-accent transition-colors">
                  <span className="material-symbols-outlined text-base">person_add</span>
                  Registrarse
                </button>
                <button onClick={() => setShowLogin(true)} className="flex items-center gap-1 text-xs font-bold text-white/90 hover:text-accent transition-colors">
                  <span className="material-symbols-outlined text-base">login</span>
                  Ingresar
                </button>
              </>
            )}
            <button onClick={() => setShowPlans(true)} className="flex items-center gap-1 text-xs font-bold bg-accent text-primary px-3 py-1 rounded-full hover:brightness-110 transition-all">
              <span className="material-symbols-outlined text-base">star</span>
              Planes
            </button>
          </div>

          {/* Tablet: solo iconos de sesión compactos */}
          <div className="flex sm:flex md:hidden items-center gap-2">
            {user ? (
              <>
                <Link to="/admin" className="flex items-center text-white/90 hover:text-accent transition-colors" title="Panel">
                  <span className="material-symbols-outlined text-lg">{user.rol === 'programador' ? 'terminal' : 'dashboard'}</span>
                </Link>
                <button onClick={onLogout} className="flex items-center text-white/90 hover:text-accent transition-colors" title="Salir">
                  <span className="material-symbols-outlined text-lg">logout</span>
                </button>
              </>
            ) : (
              <>
                <button onClick={() => setShowRegister(true)} className="flex items-center text-white/90 hover:text-accent transition-colors" title="Registrarse">
                  <span className="material-symbols-outlined text-lg">person_add</span>
                </button>
                <button onClick={() => setShowLogin(true)} className="flex items-center text-white/90 hover:text-accent transition-colors" title="Ingresar">
                  <span className="material-symbols-outlined text-lg">login</span>
                </button>
              </>
            )}
            <button onClick={() => setShowPlans(true)} className="flex items-center gap-1 text-[10px] font-bold bg-accent text-primary px-2 py-0.5 rounded-full hover:brightness-110 transition-all">
              <span className="material-symbols-outlined text-sm">star</span>
              Planes
            </button>
          </div>
        </div>
      </nav>

      {showPlans && <PlansModal onClose={() => setShowPlans(false)} />}
      {showLogin && (
        <LoginModal
          onClose={() => setShowLogin(false)}
          onSwitchToRegister={() => { setShowLogin(false); setShowRegister(true) }}
          onLoginSuccess={onLoginSuccess}
        />
      )}
      {showRegister && (
        <RegisterModal
          onClose={() => setShowRegister(false)}
          onSwitchToLogin={() => { setShowRegister(false); setShowLogin(true) }}
          onRegisterSuccess={onLoginSuccess}
        />
      )}
    </div>
  )
}
