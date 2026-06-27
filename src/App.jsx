import { useState, useEffect, useMemo, lazy, Suspense } from 'react'
import { Link } from 'react-router-dom'
import Header from './components/Header'
import Sidebar from './components/Sidebar'
import Breadcrumbs from './components/Breadcrumbs'
import ProductCarousel from './components/ProductCarousel'
import EventsSection from './components/EventsSection'
import StoresCarousel from './components/StoresCarousel'
import TurismoSection from './components/TurismoSection'
import Footer from './components/Footer'
import { ProductModal } from './components/ProductCard'
import CategoryGrid from './components/CategoryGrid'
import HeroBanner from './components/HeroBanner'
import { DEFAULT_HEADER } from './lib/storeHeaderPresets'

// Vistas/paginas secundarias: cargadas bajo demanda (no estan en el primer paint del home)
const TourismPage = lazy(() => import('./components/TourismPage'))
const SectionPage = lazy(() => import('./components/SectionPage'))
const StoresPage = lazy(() => import('./components/StoresPage'))
const EventsPage = lazy(() => import('./components/EventsPage'))
const ArriendosPage = lazy(() => import('./components/ArriendosPage'))
const ServiciosPage = lazy(() => import('./components/ServiciosPage'))
const StorePage = lazy(() => import('./components/StorePage'))
const StoreFooter = lazy(() => import('./components/StorePage').then(m => ({ default: m.StoreFooter })))
const StoreHeader = lazy(() => import('./components/StoreHeader'))

const API = import.meta.env.VITE_API || ''

// Fallback para vistas cargadas perezosamente
const PageFallback = () => (
  <div className="flex items-center justify-center min-h-[50vh] text-primary">
    <span className="material-symbols-outlined animate-spin" style={{ fontSize: 36 }}>progress_activity</span>
  </div>
)

const SECTION_TITLES = {
  destacados: 'Productos Destacados',
  ofertas: 'Productos en Ofertas',
  novedades: 'Novedades',
  liquidacion: 'Productos en Liquidación',
  servicios: 'Servicios',
  arriendos: 'Arriendos',
}

// Tabs "Tendencia" y "Tecnología" retiradas del módulo de producto (MOD-010)
const SECTION_ORDER = ['destacados', 'ofertas', 'arriendos', 'novedades', 'servicios', 'liquidacion']

function mapListingToProduct(l) {
  return {
    id: l.id,
    user_id: l.user_id,
    name: l.nombre,
    description: l.descripcion,
    image: l.imagen ? `${API}${l.imagen}` : null,
    alt: l.nombre,
    price: l.precio,
    originalPrice: l.precio_original,
    badge: l.badge,
    badgeColor: l.badge ? 'bg-primary text-white' : null,
    rating: null,
    category: l.tipo === 'producto' ? 'productos' : l.tipo === 'servicio' ? 'servicios' : l.tipo === 'arriendo' ? 'arriendos' : 'otros',
    categoria: l.categoria,
    subcategory: l.subcategoria,
    tipo: l.tipo,
    medidas: l.medidas,
    tallas: l.tallas,
    genero: l.genero,
    negocio_whatsapp: l.negocio_whatsapp,
    negocio_telefono: l.negocio_telefono,
    negocio_direccion: l.negocio_direccion,
    negocio_correo: l.negocio_correo,
    negocio_facebook: l.negocio_facebook,
    negocio_instagram: l.negocio_instagram,
    nombre_negocio: l.nombre_negocio,
    owner_plan_id: l.owner_plan_id,
  }
}

// Mezcla ponderada: Premium 3 slots, Normal 2, Gratis 1 por ronda
// Round-robin entre negocios del mismo tier, producto aleatorio de cada uno
function mixProductsByPlan(products) {
  if (products.length <= 1) return products

  // Agrupar por user_id (negocio)
  const byUser = {}
  products.forEach(p => {
    const uid = p.user_id || 0
    if (!byUser[uid]) byUser[uid] = { plan: p.owner_plan_id || 1, items: [] }
    byUser[uid].items.push(p)
  })

  // Mezclar productos de cada negocio aleatoriamente
  Object.values(byUser).forEach(u => {
    for (let i = u.items.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [u.items[i], u.items[j]] = [u.items[j], u.items[i]]
    }
  })

  // Separar negocios por tier
  const tiers = { 3: [], 2: [], 1: [] }
  Object.values(byUser).forEach(u => {
    const tier = u.plan >= 3 ? 3 : u.plan === 2 ? 2 : 1
    tiers[tier].push({ items: [...u.items], idx: 0 })
  })

  // Mezclar orden de negocios dentro de cada tier
  Object.values(tiers).forEach(arr => {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]]
    }
  })

  // Pesos por tier: Premium 3, Normal 2, Gratis 1
  const weights = { 3: 3, 2: 2, 1: 1 }
  const result = []
  const totalProducts = products.length
  const tierPointers = { 3: 0, 2: 0, 1: 0 } // round-robin pointer por tier

  while (result.length < totalProducts) {
    let added = false
    for (const tier of [3, 2, 1]) {
      const businesses = tiers[tier]
      if (businesses.length === 0) continue
      const slots = weights[tier]
      for (let s = 0; s < slots && result.length < totalProducts; s++) {
        // Round-robin entre negocios del tier
        let attempts = 0
        while (attempts < businesses.length) {
          const biz = businesses[tierPointers[tier] % businesses.length]
          tierPointers[tier]++
          if (biz.idx < biz.items.length) {
            result.push(biz.items[biz.idx])
            biz.idx++
            added = true
            break
          }
          attempts++
        }
      }
    }
    if (!added) break
  }

  return result
}


function buildSectionsFromAPI(listings) {
  const grouped = {}
  listings.forEach((l) => {
    const sec = l.seccion || 'destacados'
    if (!grouped[sec]) grouped[sec] = []
    grouped[sec].push(mapListingToProduct(l))
  })

  return SECTION_ORDER.map((id) => {
    const realItems = mixProductsByPlan(grouped[id] || [])
    return {
      id,
      title: SECTION_TITLES[id] || id,
      hidePrice: id === 'servicios',
      items: realItems,
    }
  })
}

// --- Rotación de secciones cada 5 horas ---
function seededRandom(seed) {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff
    return (s >>> 0) / 0xffffffff
  }
}

function seededShuffle(arr, rng) {
  const result = [...arr]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

function buildShuffledRows(sections, seed) {
  if (sections.length === 0) return []
  const rng = seededRandom(seed)

  // Convertir secciones de productos a rows
  const productRows = sections.map(s => ({ type: 'product', id: s.id, data: s }))

  // Secciones especiales
  const specialRows = [
    { type: 'turismo', id: '_turismo' },
    { type: 'eventos', id: '_eventos' },
    { type: 'locales', id: '_locales' },
  ]

  // 1) Barajar productos y tomar los 2 primeros para posiciones 0,1
  const shuffledProducts = seededShuffle(productRows, rng)
  const first2 = shuffledProducts.slice(0, 2)
  const restProducts = shuffledProducts.slice(2)

  // 2) Mezclar los 6 productos restantes + 4 especiales para posiciones 2-11
  let pool = seededShuffle([...restProducts, ...specialRows], rng)

  return [...first2, ...pool]
}

export default function App() {
  // Leer query params una sola vez antes del primer render para evitar flash del Home
  const urlInit = (() => {
    const params = new URLSearchParams(window.location.search)
    const storeId = params.get('store')
    const turismoId = params.get('turismo')
    return {
      storeUserId: storeId ? parseInt(storeId) : null,
      turismoUserId: turismoId ? parseInt(turismoId) : null,
    }
  })()

  const [currentPage, setCurrentPage] = useState(urlInit.turismoUserId ? 'turismo' : null)
  const [activeSidebar, setActiveSidebar] = useState(urlInit.turismoUserId ? 'turismo' : null)
  const [activeSection, setActiveSection] = useState(null)
  const [activeFilter, setActiveFilter] = useState(null)
  const [storeMapMode, setStoreMapMode] = useState(false)
  const [sidebarH, setSidebarH] = useState(0)
  // Menú lateral cerrado por defecto: se abre/cierra con la hamburguesa de arriba
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeStore, setActiveStore] = useState(
    urlInit.storeUserId
      ? { id: `user-${urlInit.storeUserId}`, userId: urlInit.storeUserId, name: '', plan_id: 1 }
      : null
  )
  const [scrollBeforeStore, setScrollBeforeStore] = useState(0)
  const [storeCatKey, setStoreCatKey] = useState(0)
  const [sections, setSections] = useState([])
  const [shuffleSeed, setShuffleSeed] = useState(() => Math.floor(Date.now() / (5 * 60 * 60 * 1000)))
  const shuffledRows = useMemo(() => buildShuffledRows(sections, shuffleSeed), [sections, shuffleSeed])
  const [scrolled, setScrolled] = useState(false)
  const [headerH, setHeaderH] = useState(116)

  useEffect(() => {
    const measure = () => {
      const el = document.getElementById('main-header')
      if (el) setHeaderH(el.offsetHeight)
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Verificar cada minuto si cambió la ventana de 5 horas
  useEffect(() => {
    const interval = setInterval(() => {
      const newSeed = Math.floor(Date.now() / (5 * 60 * 60 * 1000))
      setShuffleSeed(prev => prev !== newSeed ? newSeed : prev)
    }, 60000)
    return () => clearInterval(interval)
  }, [])

  const [turismoCategorias, setTurismoCategorias] = useState([])
  const [turismoCategoriasAll, setTurismoCategoriasAll] = useState([])
  const [listingSubcategorias, setListingSubcategorias] = useState([])
  const [sidebarCategorias, setSidebarCategorias] = useState([])
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user')
    return saved ? JSON.parse(saved) : null
  })


  // Registrar visita al sitio
  useEffect(() => {
    fetch(`${API}/api/v1/servidor/visita`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pagina: 'home' }),
    }).catch(() => {})
  }, [])

  // Título dinámico por vista (SPA: la navegación es por estado, no por URL)
  useEffect(() => {
    const BASE = 'LocalClick — Marketplace local de Villarrica'
    const PAGE_TITLES = {
      productos: 'Productos', servicios: 'Servicios', arriendos: 'Arriendos',
      eventos: 'Eventos', locales: 'Locales', turismo: 'Turismo',
    }
    let label = null
    if (activeStore) label = activeStore.name
    else if (activeSection) label = SECTION_TITLES[activeSection] || activeSection
    else if (currentPage && PAGE_TITLES[currentPage]) label = PAGE_TITLES[currentPage]
    else if (typeof activeFilter === 'string') label = activeFilter
    document.title = label ? `${label} | LocalClick` : BASE
  }, [currentPage, activeStore, activeSection, activeFilter])

  // Cargar listings desde API
  useEffect(() => {
    fetch(`${API}/api/v1/public/listings`)
      .then(r => r.json())
      .then(data => {
        {
          setSections(buildSectionsFromAPI(data.listings || []))
          // Extraer subcategorías únicas con su tipo para el sidebar dinámico
          const subsMap = new Map()
          data.listings.forEach(l => {
            if (l.subcategoria) {
              const key = `${l.tipo}|${l.subcategoria}`
              if (!subsMap.has(key)) subsMap.set(key, { tipo: l.tipo, sub: l.subcategoria })
            }
          })
          setListingSubcategorias([...subsMap.values()])
        }
      })
      .catch(err => console.error('Error cargando listings:', err))

    // Cargar categorías de turismo desde portadas activas
    fetch(`${API}/api/v1/public/portadas`)
      .then(r => r.json())
      .then(data => {
        if (data.portadas && data.portadas.length > 0) {
          const cats = new Set()
          data.portadas.forEach(p => {
            if (p.categorias && Array.isArray(p.categorias)) {
              p.categorias.forEach(c => cats.add(c))
            }
          })
          const sorted = [...cats].sort()
          setTurismoCategorias(sorted)
          setTurismoCategoriasAll(sorted)
        } else {
          setTurismoCategorias([])
          setTurismoCategoriasAll([])
        }
      })
      .catch(() => {
        setTurismoCategorias([])
        setTurismoCategoriasAll([])
      })

    // Cargar categorías del sidebar: solo las que tienen productos publicados
    fetch(`${API}/api/v1/categorias/sidebar`)
      .then(r => r.json())
      .then(data => {
        if (data.categorias) setSidebarCategorias(data.categorias)
      })
      .catch(err => console.error('Error cargando categorías sidebar:', err))
  }, [])

  const [turismoDirectUserId, setTurismoDirectUserId] = useState(urlInit.turismoUserId)
  const [turismoDirectTour, setTurismoDirectTour] = useState(null)
  const [turismoResetKey, setTurismoResetKey] = useState(0)
  const [turismoScrollTo, setTurismoScrollTo] = useState(null)
  // Producto cuyo pop-up debe abrirse automáticamente al entrar a su tienda
  const [pendingStoreProduct, setPendingStoreProduct] = useState(null)

  // Si vino ?store= o ?turismo=: limpiar URL y enriquecer con datos del business
  // El estado inicial ya se inicializó arriba (urlInit) para evitar flash del Home
  useEffect(() => {
    if (urlInit.storeUserId) {
      window.history.replaceState({}, '', '/')
      // Enriquecer con datos completos del business (nombre, slogan, plan, etc.)
      fetch(`${API}/api/v1/public/business/${urlInit.storeUserId}`)
        .then(r => r.json())
        .then(data => {
          if (data.business) {
            const b = data.business
            setActiveStore(prev => ({
              ...prev,
              name: b.nombre_negocio || '',
              slogan: b.slogan || '',
              phone: b.whatsapp || b.telefono || '',
              email: b.correo || '',
              address: b.direccion || '',
              description: b.descripcion || '',
              facebook: b.facebook || '',
              instagram: b.instagram || '',
              horarios: b.horarios || [],
              plan_id: b.plan_id || 1,
              ...DEFAULT_HEADER,
            }))
          }
        })
        .catch(() => {})
    } else if (urlInit.turismoUserId) {
      window.history.replaceState({}, '', '/')
    }

    // Navegar a sección si viene desde el admin (navTo)
    const navTo = localStorage.getItem('navTo')
    if (navTo) {
      localStorage.removeItem('navTo')
      if (navTo === 'turismo') {
        setCurrentPage('turismo')
        setActiveSidebar('turismo')
        setActiveFilter(null)
        const scrollTo = localStorage.getItem('turismo_scroll_to')
        if (scrollTo) {
          localStorage.removeItem('turismo_scroll_to')
          setTurismoScrollTo(parseInt(scrollTo))
        }
      }
    }
  }, [])

  const handleLoginSuccess = (userData) => {
    setUser(userData)
  }

  const handleLogout = async () => {
    try {
      await fetch(`${API}/api/v1/auth/logout`, { method: 'POST', credentials: 'include' })
    } catch {}
    localStorage.removeItem('user')
    localStorage.removeItem('auth_mode')
    localStorage.removeItem('dev_user_id')
    localStorage.removeItem('token')
    // Recargar a home: resetea cualquier estado (tienda activa, turismo, etc.)
    window.location.href = '/'
  }

  // Interruptor del menú lateral (hamburguesa de arriba / botón X)
  const toggleSidebar = () => setSidebarOpen(o => !o)
  const closeSidebar = () => setSidebarOpen(false)

  const toggleNav = (nav) => {
    const targetPage = nav === 'negocios' ? 'locales' : nav
    // Si ya estamos en la sección, el botón actúa como interruptor del menú lateral
    if (currentPage === targetPage) {
      setSidebarOpen(o => !o)
      return
    }
    // Navegar a la sección con el menú lateral CERRADO por defecto
    if (nav === 'negocios') {
      handleViewAllStores()
    } else if (nav === 'turismo') {
      setCurrentPage('turismo')
      setActiveSidebar('turismo')
      setActiveSection(null)
      setActiveFilter(null)
      setTurismoResetKey(k => k + 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else if (nav === 'arriendos') {
      handleViewAllArriendos()
    } else if (nav === 'servicios') {
      handleViewAllServicios()
    } else if (nav === 'eventos') {
      handleViewAllEvents()
    } else {
      handleViewAllProductos()
    }
    setSidebarOpen(false)
  }

  const goHome = () => {
    const wasInStore = !!activeStore
    const savedScroll = scrollBeforeStore
    setCurrentPage(null)
    setActiveSidebar(null)
    setActiveSection(null)
    setActiveFilter(null)
    setStoreMapMode(false)
    setActiveStore(null)
    setPendingStoreProduct(null)
    setSidebarOpen(false)
    if (wasInStore && savedScroll > 0) {
      setTimeout(() => window.scrollTo({ top: savedScroll, behavior: 'smooth' }), 50)
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleOpenStore = (store, productToOpen = null) => {
    setScrollBeforeStore(window.scrollY)
    window.scrollTo({ top: 0 })
    setCurrentPage(null)
    setActiveSidebar(null)
    setActiveSection(null)
    setActiveFilter(null)
    setSidebarOpen(false)
    setPendingStoreProduct(productToOpen)

    // Si la tienda tiene userId, cargar datos completos del negocio
    if (store.userId) {
      fetch(`${API}/api/v1/public/business/${store.userId}`)
        .then(r => r.json())
        .then(data => {
          if (data.business) {
            const b = data.business
            setActiveStore({
              ...store,
              name: b.nombre_negocio || store.name,
              slogan: b.slogan || '',
              phone: b.whatsapp || b.telefono || store.phone || '',
              email: b.correo || '',
              address: b.direccion || '',
              description: b.descripcion || '',
              facebook: b.facebook || '',
              instagram: b.instagram || '',
              horarios: b.horarios || [],
              plan_id: b.plan_id || 1,
              ...DEFAULT_HEADER,
            })
          } else {
            setActiveStore(store)
          }
        })
        .catch(() => setActiveStore(store))
    } else {
      setActiveStore(store)
    }
  }


  const handleViewAll = (section) => {
    setCurrentPage(null)
    setActiveSection(section)
    setActiveFilter(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleFilterSelect = (filter) => {
    setActiveFilter(filter)
    window.scrollTo({ top: 0 })
  }

  const handleCategorySelect = (catLabel, subcategories) => {
    setActiveFilter({ category: catLabel, subcategories })
    window.scrollTo({ top: 0 })
  }

  const handleViewAllStores = () => {
    window.scrollTo({ top: 0 })
    setCurrentPage('locales')
    setActiveSidebar('locales')
    setActiveSection(null)
    setActiveFilter(null)
    setSidebarOpen(false)
  }

  const handleViewAllEvents = () => {
    window.scrollTo({ top: 0 })
    setCurrentPage('eventos')
    setActiveSidebar('eventos')
    setActiveSection(null)
    setActiveFilter(null)
    setSidebarOpen(false)
  }

  const handleViewAllArriendos = () => {
    window.scrollTo({ top: 0 })
    setCurrentPage('arriendos')
    setActiveSidebar('arriendos')
    setActiveSection(null)
    setActiveFilter(null)
    setSidebarOpen(false)
  }

  const handleViewAllServicios = () => {
    window.scrollTo({ top: 0 })
    setCurrentPage('servicios')
    setActiveSidebar('servicios')
    setActiveSection(null)
    setActiveFilter(null)
    setSidebarOpen(false)
  }

  const handleViewAllProductos = () => {
    window.scrollTo({ top: 0 })
    setCurrentPage('productos')
    setActiveSidebar('productos')
    setActiveSection(null)
    setActiveFilter(null)
    setSidebarOpen(false)
  }

  const handleSearchSelect = (item) => {
    window.scrollTo({ top: 0 })
    setStoreMapMode(false)
    setActiveSection(null)
    setSidebarOpen(false)

    if (item.nav === 'turismo') {
      setCurrentPage('turismo')
      setActiveSidebar('turismo')
      setActiveFilter(item.label)
    } else if (item.nav === 'locales') {
      setCurrentPage('locales')
      setActiveSidebar('locales')
      setActiveFilter(item.label)
    } else if (item.nav === 'eventos') {
      setCurrentPage('eventos')
      setActiveSidebar('eventos')
      setActiveFilter(item.label)
    } else if (item.nav === 'arriendos') {
      setCurrentPage('arriendos')
      setActiveSidebar('arriendos')
      setActiveFilter(item.label)
    } else if (item.nav === 'servicios') {
      setCurrentPage('servicios')
      setActiveSidebar('servicios')
      setActiveFilter(item.label)
    } else {
      // productos
      setCurrentPage(null)
      setActiveSidebar(item.nav)
      if (item.type === 'category' && item.subcategories) {
        setActiveFilter({ category: item.label, subcategories: item.subcategories })
      } else {
        setActiveFilter(item.label)
      }
    }
  }

  // Para el header, marcar como activo el sidebar actual
  const activeNav = activeSidebar

  // Determinar si mostrar botón Inicio
  const showInicio = currentPage === 'turismo' || currentPage === 'locales' || currentPage === 'eventos' || currentPage === 'arriendos' || currentPage === 'servicios' || currentPage === 'productos' || activeSection !== null || activeFilter !== null || activeStore !== null || activeSidebar !== null

  if (activeStore) {
    return (
      <Suspense fallback={<PageFallback />}>
      <div className="relative flex min-h-screen flex-col">
        {/* Header de la tienda (estilo personalizable por el usuario) + barra de navegación */}
        <StoreHeader
          store={activeStore}
          user={user}
          onGoHome={goHome}
          onLogout={handleLogout}
          onToggleCat={() => setStoreCatKey(k => k + 1)}
        />

        <div className="w-full flex flex-1 flex-col md:flex-row">
          <StorePage store={activeStore} onBack={goHome} onOpenStore={handleOpenStore} mobileCatKey={storeCatKey} />
        </div>

        <StoreFooter store={activeStore} />

        {/* Pop-up del producto seleccionado al llegar desde el icono amarillo de la tarjeta */}
        {pendingStoreProduct && (
          <ProductModal
            product={pendingStoreProduct}
            inStorePage
            onClose={() => setPendingStoreProduct(null)}
          />
        )}
      </div>
      </Suspense>
    )
  }

  return (
    <div className="relative flex min-h-screen flex-col">
      <Header activeNav={activeNav} toggleNav={toggleNav} onToggleSidebar={toggleSidebar} sidebarOpen={sidebarOpen} onGoHome={goHome} showInicio={showInicio} onSearchSelect={handleSearchSelect} user={user} onLoginSuccess={handleLoginSuccess} onLogout={handleLogout} />

      <div className="w-full flex flex-1 flex-col md:flex-row relative" style={sidebarH > 0 ? { minHeight: sidebarH } : undefined}>
        <Sidebar
          activeNav={activeSidebar}
          open={sidebarOpen}
          onClose={closeSidebar}
          onGoHome={goHome}
          showInicio={showInicio}
          onFilterSelect={handleFilterSelect}
          activeFilter={activeFilter}
          onMapClick={() => setStoreMapMode(m => !m)}
          mapMode={storeMapMode}
          onCategorySelect={handleCategorySelect}
          turismoCategorias={turismoCategorias}
          listingSubcategorias={listingSubcategorias}
          sidebarCategorias={sidebarCategorias}
          onSidebarHeight={setSidebarH}
        />

        <main className="flex-1 flex flex-col gap-4 sm:gap-6 md:gap-8 p-3 sm:p-4 md:p-6 overflow-hidden transition-all duration-300">
          {/* <Breadcrumbs /> */}

          <Suspense fallback={<PageFallback />}>
          {currentPage === 'productos' ? (
            (() => {
              const productSections = sections
                .filter(s => s.id !== 'servicios' && s.id !== 'arriendos')
                .map(s => ({
                  ...s,
                  items: activeFilter
                    ? s.items.filter(item => {
                        if (typeof activeFilter === 'object' && activeFilter.subcategories) {
                          return activeFilter.subcategories.some(sub => sub.toLowerCase() === (item.subcategory || '').toLowerCase())
                        }
                        return (item.subcategory || '').toLowerCase() === activeFilter.toLowerCase() || (item.categoria || '').toLowerCase() === activeFilter.toLowerCase()
                      })
                    : s.items,
                }))
                .filter(s => s.items.length > 0)

              return (
                <div>
                  {scrolled && (
                    <button
                      onClick={goHome}
                      aria-label="Inicio"
                      className="sm:hidden fixed right-3 z-50 flex items-center justify-center h-11 w-11 rounded-full bg-accent text-primary shadow-lg hover:brightness-110 active:scale-95 transition-all"
                      style={{ top: headerH + 10 }}
                    >
                      <span className="material-symbols-outlined text-xl">home</span>
                    </button>
                  )}
                  <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                    <button onClick={goHome} className="hidden sm:flex items-center gap-1 text-primary hover:text-accent transition-colors text-[10px] sm:text-xs font-bold">
                      <span className="material-symbols-outlined text-sm">arrow_back</span>
                      Volver
                    </button>
                    <div className="w-1 h-4 sm:h-5 bg-accent rounded-full sm:block hidden"></div>
                    <h2 className="text-xs sm:text-sm font-bold text-slate-700 tracking-wide">
                      {activeFilter ? (typeof activeFilter === 'object' ? activeFilter.category : activeFilter) : 'Todos los Productos'}
                    </h2>
                    <button
                      onClick={goHome}
                      aria-label="Inicio"
                      className="sm:hidden ml-auto shrink-0 flex items-center justify-center h-7 w-7 rounded-full bg-accent text-primary shadow hover:brightness-110 active:scale-95 transition-all"
                    >
                      <span className="material-symbols-outlined text-base">home</span>
                    </button>
                  </div>
                  {productSections.length > 0 ? (
                    <div className="flex flex-col gap-8">
                      {productSections.map((section, index) => (
                        <div key={section.id}>
                          <ProductCarousel
                            title={section.title}
                            items={section.items}
                            sidebarOpen={sidebarOpen}
                            hidePrice={section.hidePrice}
                            onViewAll={() => handleViewAll(section)}
                            onOpenStore={handleOpenStore}
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-slate-400 text-xs mt-8">No hay productos para mostrar.</p>
                  )}
                </div>
              )
            })()
          ) : currentPage === 'servicios' ? (
            <ServiciosPage
              sidebarOpen={sidebarOpen}
              onBack={goHome}
              activeFilter={activeFilter}
              onOpenStore={handleOpenStore}
            />
          ) : currentPage === 'arriendos' ? (
            <ArriendosPage
              sidebarOpen={sidebarOpen}
              onBack={goHome}
              activeFilter={activeFilter}
              onOpenStore={handleOpenStore}
            />
          ) : currentPage === 'eventos' ? (
            <EventsPage
              sidebarOpen={sidebarOpen}
              onBack={goHome}
              activeFilter={activeFilter}
            />
          ) : currentPage === 'locales' ? (
            <StoresPage
              sidebarOpen={sidebarOpen}
              onBack={goHome}
              activeFilter={activeFilter}
              mapMode={storeMapMode}
              onToggleMap={() => setStoreMapMode(false)}
            />
          ) : currentPage === 'turismo' ? (
            <TourismPage
              activeFilter={activeFilter}
              onClearFilter={() => setActiveFilter(null)}
              onEmpresaCategorias={(cats) => setTurismoCategorias(cats || turismoCategoriasAll)}
              initialUserId={turismoDirectUserId}
              onInitialUserConsumed={() => setTurismoDirectUserId(null)}
              initialTour={turismoDirectTour}
              onInitialTourConsumed={() => setTurismoDirectTour(null)}
              resetKey={turismoResetKey}
              scrollToUserId={turismoScrollTo}
              onScrollConsumed={() => setTurismoScrollTo(null)}
              onBack={goHome}
            />
          ) : activeFilter ? (
            /* Filtro activo: mostrar secciones (filas) que tengan productos de esa subcategoría o categoría */
            (() => {
              const isCategory = typeof activeFilter === 'object' && activeFilter.subcategories
              const filterLabel = isCategory ? activeFilter.category : activeFilter
              const filteredSections = sections
                .map((s) => ({
                  ...s,
                  items: s.items.filter((item) =>
                    isCategory
                      ? activeFilter.subcategories.some(sub => sub.toLowerCase() === (item.subcategory || '').toLowerCase())
                      : (item.subcategory || '').toLowerCase() === activeFilter.toLowerCase()
                  ),
                }))
                .filter((s) => s.items.length > 0)

              const rowCount = filteredSections.length

              return (
                <div>
                  {scrolled && (
                    <button
                      onClick={goHome}
                      aria-label="Inicio"
                      className="sm:hidden fixed right-3 z-50 flex items-center justify-center h-11 w-11 rounded-full bg-accent text-primary shadow-lg hover:brightness-110 active:scale-95 transition-all"
                      style={{ top: headerH + 10 }}
                    >
                      <span className="material-symbols-outlined text-xl">home</span>
                    </button>
                  )}
                  <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                    <button
                      onClick={() => setActiveFilter(null)}
                      className="hidden sm:flex items-center gap-1 text-primary hover:text-accent transition-colors text-[10px] sm:text-xs font-bold"
                    >
                      <span className="material-symbols-outlined text-sm">arrow_back</span>
                      Volver
                    </button>
                    <div className="w-1 h-4 sm:h-5 bg-accent rounded-full sm:block hidden"></div>
                    <h2 className="text-xs sm:text-sm font-bold text-slate-700 tracking-wide">{filterLabel}</h2>
                    <span className="text-[9px] sm:text-[10px] text-slate-400">
                      {filteredSections.reduce((acc, s) => acc + s.items.length, 0)} resultados
                    </span>
                    <button
                      onClick={() => setActiveFilter(null)}
                      aria-label="Inicio"
                      className="sm:hidden ml-auto shrink-0 flex items-center justify-center h-7 w-7 rounded-full bg-accent text-primary shadow hover:brightness-110 active:scale-95 transition-all"
                    >
                      <span className="material-symbols-outlined text-base">home</span>
                    </button>
                  </div>
                  <div className="flex flex-col gap-8">
                    {filteredSections.map((section, index) => (
                      <div key={section.id}>
                        <ProductCarousel
                          title={section.title}
                          items={section.items}
                          sidebarOpen={sidebarOpen}
                          hidePrice={section.hidePrice}
                          onViewAll={() => handleViewAll(section)}
                          onOpenStore={handleOpenStore}
                        />
                        {rowCount > 4 && index === 3 && <div className="mt-8"><StoresCarousel onViewAll={handleViewAllStores} /></div>}
                      </div>
                    ))}
                  </div>
                  {filteredSections.length === 0 && (
                    <p className="text-center text-slate-400 text-xs mt-8">
                      No hay productos para mostrar.
                    </p>
                  )}
                </div>
              )
            })()
          ) : activeSection ? (
            <SectionPage
              section={activeSection}
              sidebarOpen={sidebarOpen}
              onBack={goHome}
              onOpenStore={handleOpenStore}
            />
          ) : (
            (() => {
              // Group sections by mockup layout (using sections directly, not shuffledRows)
              const getSection = (id) => sections.find(s => s.id === id)
              // Mientras cargan los listings, reservamos altura para evitar CLS: las secciones
              // data-driven aparecerian progresivamente y empujarian el contenido (CLS ~0.30).
              // Renderizamos hero + categorias + placeholder de altura fija hasta que haya datos.
              if (sections.length === 0) {
                return (
                  <>
                    <HeroBanner />
                    <CategoryGrid onNavigate={toggleNav} />
                    <div className="min-h-screen flex items-start justify-center pt-16">
                      <PageFallback />
                    </div>
                  </>
                )
              }
              // Ordenar por prioridad de plan: Premium (3) → Normal (2) → Gratuito (1), aleatorio dentro de cada tier
              const byPriority = (items) => {
                const shuffle = (arr) => {
                  for (let i = arr.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1))
                    ;[arr[i], arr[j]] = [arr[j], arr[i]]
                  }
                  return arr
                }
                const p3 = shuffle(items.filter(p => (p.owner_plan_id || 1) >= 3))
                const p2 = shuffle(items.filter(p => (p.owner_plan_id || 1) === 2))
                const p1 = shuffle(items.filter(p => (p.owner_plan_id || 1) < 2))
                return [...p3, ...p2, ...p1]
              }
              // Productos: combinar destacados + novedades + tecnología + tendencia
              const productosSections = ['destacados', 'novedades', 'tecnologia', 'tendencia']
              const realProductos = productosSections.flatMap(id => (getSection(id)?.items || []))
              const shuffled = byPriority(realProductos)
              // Dividir en 2 filas
              const half = Math.ceil(shuffled.length / 2)
              const prodRow1Items = shuffled.slice(0, half)
              const prodRow2Items = shuffled.slice(half)
              // Ofertas: combinar ofertas + liquidacion
              const ofertasSections = ['ofertas', 'liquidacion']
              const realOfertas = ofertasSections.flatMap(id => (getSection(id)?.items || []))
              const shuffledOfertas = byPriority(realOfertas)
              const halfOfertas = Math.ceil(shuffledOfertas.length / 2)
              const ofertaRow1Items = shuffledOfertas.slice(0, halfOfertas)
              const ofertaRow2Items = shuffledOfertas.slice(halfOfertas)
              // Arriendos
              const shuffledArriendos = byPriority(getSection('arriendos')?.items || [])
              // Servicios
              const shuffledServicios = byPriority(getSection('servicios')?.items || [])

              return (
                <>
                  {/* 1. HERO BANNER */}
                  <HeroBanner />

                  {/* 2. CATEGORÍAS */}
                  <CategoryGrid onNavigate={toggleNav} />

                  {/* 3. PRODUCTOS — fondo blanco, 2 filas */}
                  <div className="bg-white -mx-3 sm:-mx-4 md:-mx-6 px-3 sm:px-4 md:px-6 py-5 sm:py-6">
                    <div className="flex items-center gap-2 sm:gap-3 mb-4">
                      <div className="w-1 h-5 sm:h-6 bg-accent rounded-full"></div>
                      <h2 className="text-sm sm:text-base font-black text-slate-800 tracking-wide">Productos</h2>
                      <div className="flex-1 h-px bg-slate-200"></div>
                      <button onClick={() => toggleNav('productos')} className="text-[9px] sm:text-[10px] font-bold text-primary hover:text-accent transition-colors uppercase tracking-wider">Ver todo</button>
                    </div>
                    <div className="flex flex-col gap-6">
                      {prodRow1Items.length > 0 && (
                        <ProductCarousel
                          key="productos-row1"
                          title="Productos"
                          items={prodRow1Items}
                          sidebarOpen={sidebarOpen}
                          onViewAll={() => toggleNav('productos')}
                          onOpenStore={handleOpenStore}
                          hideHeader
                        />
                      )}
                      {prodRow2Items.length > 0 && (
                        <ProductCarousel
                          key="productos-row2"
                          title="Productos"
                          items={prodRow2Items}
                          sidebarOpen={sidebarOpen}
                          onViewAll={() => toggleNav('productos')}
                          onOpenStore={handleOpenStore}
                          hideHeader
                        />
                      )}
                    </div>
                  </div>

                  {/* 4. TURISMO — fondo foto oscuro */}
                  <div className="-mx-3 sm:-mx-4 md:-mx-6">
                    <TurismoSection onViewAll={() => { setCurrentPage('turismo'); setActiveSidebar('turismo'); setActiveFilter(null) }} onOpenTour={(userId, tour) => {
                      // Registrar click en tarjeta para estadísticas del operador turístico
                      if (userId) fetch(`${API}/api/v1/analytics/track`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_id: userId, event_type: 'card_click', listing_id: tour?.id || null }) }).catch(() => {})
                      setCurrentPage('turismo'); setActiveSidebar('turismo'); setTurismoDirectUserId(userId); setTurismoDirectTour(tour || null)
                    }} />
                  </div>

                  {/* 5. OFERTAS — fondo gris, 2 filas */}
                  <div className="bg-[#F5F4F7] -mx-3 sm:-mx-4 md:-mx-6 px-3 sm:px-4 md:px-6 py-5 sm:py-6">
                    <div className="flex items-center gap-2 sm:gap-3 mb-4">
                      <div className="w-1 h-5 sm:h-6 bg-accent rounded-full"></div>
                      <h2 className="text-sm sm:text-base font-black text-slate-800 tracking-wide">Productos en <span className="text-red-600">Oferta</span></h2>
                      <div className="flex-1 h-px bg-slate-200"></div>
                      <button onClick={() => toggleNav('productos')} className="text-[9px] sm:text-[10px] font-bold text-primary hover:text-accent transition-colors uppercase tracking-wider">Ver todo</button>
                    </div>
                    <div className="flex flex-col gap-6">
                      {ofertaRow1Items.length > 0 && (
                        <ProductCarousel
                          key="ofertas-row1"
                          title="Ofertas"
                          items={ofertaRow1Items}
                          sidebarOpen={sidebarOpen}
                          onViewAll={() => toggleNav('productos')}
                          onOpenStore={handleOpenStore}
                          hideHeader
                        />
                      )}
                      {ofertaRow2Items.length > 0 && (
                        <ProductCarousel
                          key="ofertas-row2"
                          title="Ofertas"
                          items={ofertaRow2Items}
                          sidebarOpen={sidebarOpen}
                          onViewAll={() => toggleNav('productos')}
                          onOpenStore={handleOpenStore}
                          hideHeader
                        />
                      )}
                    </div>
                  </div>


                  {/* 7. EVENTOS — fondo oscuro */}
                  <div className="-mx-3 sm:-mx-4 md:-mx-6 px-3 sm:px-4 md:px-6">
                    <EventsSection onViewAll={handleViewAllEvents} />
                  </div>

                  {/* 8. ARRIENDOS — fondo blanco */}
                  <div className="bg-white -mx-3 sm:-mx-4 md:-mx-6 px-3 sm:px-4 md:px-6 py-5 sm:py-6">
                    <div className="flex items-center gap-2 sm:gap-3 mb-4">
                      <div className="w-1 h-5 sm:h-6 bg-accent rounded-full"></div>
                      <h2 className="text-sm sm:text-base font-black text-slate-800 tracking-wide">Arriendos</h2>
                      <div className="flex-1 h-px bg-slate-200"></div>
                      <button onClick={() => toggleNav('arriendos')} className="text-[9px] sm:text-[10px] font-bold text-primary hover:text-accent transition-colors uppercase tracking-wider">Ver todo</button>
                    </div>
                    {shuffledArriendos.length > 0 && (
                      <ProductCarousel
                        key="arriendos-row"
                        title="Arriendos"
                        items={shuffledArriendos}
                        sidebarOpen={sidebarOpen}
                        onViewAll={() => toggleNav('arriendos')}
                        onOpenStore={handleOpenStore}
                        hideHeader
                      />
                    )}
                  </div>

                  {/* 9. LOCALES — fondo morado */}
                  <StoresCarousel onViewAll={handleViewAllStores} />

                  {/* 10. SERVICIOS — fondo gris */}
                  <div className="bg-[#F5F4F7] -mx-3 sm:-mx-4 md:-mx-6 px-3 sm:px-4 md:px-6 py-5 sm:py-6">
                    <div className="flex items-center gap-2 sm:gap-3 mb-4">
                      <div className="w-1 h-5 sm:h-6 bg-accent rounded-full"></div>
                      <h2 className="text-sm sm:text-base font-black text-slate-800 tracking-wide">Servicios</h2>
                      <div className="flex-1 h-px bg-slate-200"></div>
                      <button onClick={() => toggleNav('servicios')} className="text-[9px] sm:text-[10px] font-bold text-primary hover:text-accent transition-colors uppercase tracking-wider">Ver todo</button>
                    </div>
                    {shuffledServicios.length > 0 && (
                      <ProductCarousel
                        key="servicios-row"
                        title="Servicios"
                        items={shuffledServicios}
                        sidebarOpen={sidebarOpen}
                        hidePrice
                        onViewAll={() => toggleNav('servicios')}
                        onOpenStore={handleOpenStore}
                        hideHeader
                      />
                    )}
                  </div>
                </>
              )
            })()
          )}
          </Suspense>
        </main>
      </div>

      {currentPage !== 'turismo' && (
        <Footer onNavigate={toggleNav} onLoginSuccess={handleLoginSuccess} />
      )}
    </div>
  )
}
