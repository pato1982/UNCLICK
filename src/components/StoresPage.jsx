import { useState, useEffect, useRef } from 'react'
import LocalModal from './LocalModal'

const API = import.meta.env.VITE_API || ''

const typeColors = {
  Abarrotes: '#16a34a',
  Botillería: '#7c3aed',
  Botilleria: '#7c3aed',
  Ferretería: '#ea580c',
  Ferreteria: '#ea580c',
  Panadería: '#ca8a04',
  Panaderia: '#ca8a04',
  Farmacia: '#0891b2',
  Bazar: '#e11d48',
  Comida: '#dc2626',
  Florería: '#db2777',
  Floreria: '#db2777',
  Pastelería: '#a855f7',
  Pasteleria: '#a855f7',
  Ropa: '#6366f1',
  Mascotas: '#059669',
  Librería: '#0284c7',
  Libreria: '#0284c7',
  Peluquería: '#c026d3',
  Peluqueria: '#c026d3',
  Lavandería: '#0d9488',
  Lavanderia: '#0d9488',
  Celulares: '#4f46e5',
  Reciclaje: '#65a30d',
}

function StoreCard({ store }) {
  const [showModal, setShowModal] = useState(false)
  return (
    <>
      <div
        className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all flex flex-col group border border-slate-100 cursor-pointer"
        onClick={() => setShowModal(true)}
      >
        <div className="relative h-32 sm:h-32 md:h-40 bg-slate-100 overflow-hidden">
          <img
            src={store.image}
            alt={store.name}
            className="w-full h-full object-contain"
            width={300}
            height={225}
            loading="lazy"
            decoding="async"
          />
          {store.type && (
            <span className="absolute top-1 right-1 sm:top-2 sm:right-2 bg-primary/80 backdrop-blur text-white px-1.5 sm:px-2 py-0.5 rounded-full text-[7px] sm:text-[8px] font-bold uppercase tracking-wider">
              {store.type}
            </span>
          )}
        </div>
        <div className="px-1.5 sm:px-4 py-1.5 sm:py-3 flex flex-col flex-1">
          <div className="min-h-[24px] sm:min-h-0 flex items-start">
            <h3 className="font-bold text-xs sm:text-xs text-slate-900 leading-tight line-clamp-2 sm:line-clamp-1 mb-0.5 sm:mb-1">{store.name}</h3>
          </div>
          {store.address && (
            <div className="flex items-start gap-0.5 sm:gap-1 mb-0.5 sm:mb-1">
              <span className="material-symbols-outlined text-slate-400 text-[10px] sm:text-xs mt-0.5 shrink-0">location_on</span>
              <p className="text-[10px] sm:text-[10px] text-slate-500 line-clamp-2">{store.address}</p>
            </div>
          )}
        </div>
      </div>
      {showModal && <LocalModal local={store} onClose={() => setShowModal(false)} />}
    </>
  )
}

function StoresMap({ stores, activeFilter }) {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markersRef = useRef([])
  const [L, setL] = useState(null)

  // Carga Leaflet (JS + CSS) bajo demanda, solo cuando se muestra el mapa.
  // Antes se cargaba en el <head> de index.html y bloqueaba el render de toda la app.
  useEffect(() => {
    let cancelled = false
    Promise.all([
      import('leaflet'),
      import('leaflet/dist/leaflet.css'),
    ]).then(([mod]) => {
      if (!cancelled) setL(mod.default || mod)
    })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (!L || !mapRef.current) return

    if (!mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapRef.current).setView([-39.2850, -72.2270], 15)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap',
      }).addTo(mapInstanceRef.current)
    }

    // Limpiar markers anteriores
    markersRef.current.forEach((m) => m.remove())
    markersRef.current = []

    const filtered = activeFilter
      ? stores.filter((s) => s.type === activeFilter)
      : stores

    filtered.forEach((store) => {
      if (!store.lat || !store.lng) return
      const color = typeColors[store.type] || '#6b21a8'
      const icon = L.divIcon({
        className: '',
        html: `<div style="background:${color};width:28px;height:28px;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;">
          <span class="material-symbols-outlined" style="color:white;font-size:14px;">storefront</span>
        </div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
        popupAnchor: [0, -16],
      })

      const marker = L.marker([store.lat, store.lng], { icon })
        .addTo(mapInstanceRef.current)
        .bindPopup(`
          <div style="min-width:180px;font-family:Inter,sans-serif;">
            <img src="${store.image}" style="width:100%;height:80px;object-fit:cover;border-radius:6px;margin-bottom:6px;" />
            <div style="font-size:12px;font-weight:800;color:#1e293b;margin-bottom:2px;">${store.name}</div>
            <div style="font-size:10px;color:#64748b;margin-bottom:2px;display:flex;align-items:center;gap:3px;">
              <span class="material-symbols-outlined" style="font-size:12px;color:#94a3b8;">location_on</span>
              ${store.address}
            </div>
            <div style="margin-top:4px;display:inline-block;background:${color};color:white;font-size:9px;font-weight:700;padding:2px 8px;border-radius:10px;text-transform:uppercase;">${store.type}</div>
          </div>
        `)

      markersRef.current.push(marker)
    })

    const withCoords = filtered.filter(s => s.lat && s.lng)
    if (withCoords.length > 0) {
      const bounds = L.latLngBounds(withCoords.map((s) => [s.lat, s.lng]))
      mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 })
    }
  }, [L, stores, activeFilter])

  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [])

  return (
    <div ref={mapRef} className="w-full rounded-xl overflow-hidden border border-slate-200 shadow-sm" style={{ height: '70vh' }}></div>
  )
}


export default function StoresPage({ sidebarOpen, onBack, activeFilter, mapMode, onToggleMap }) {
  const [allStores, setAllStores] = useState([])
  const [currentPage, setCurrentPage] = useState(0)
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

  useEffect(() => {
    fetch(`${API}/api/v1/locales`)
      .then(r => r.json())
      .then(data => {
        const imgUrl = (p) => p ? (p.startsWith('http') ? p : `${API}${p}`) : null
        const mapped = (data.locales || []).map(l => ({
          id: l.id,
          name: l.nombre,
          image: imgUrl(l.imagen) || '',
          imagen_2: imgUrl(l.imagen_2),
          imagen_3: imgUrl(l.imagen_3),
          address: l.direccion || '',
          type: l.categoria_nombre || '',
          descripcion: l.descripcion || '',
          horario: l.horario || '',
          telefono: l.telefono || '',
          whatsapp: l.whatsapp || '',
          facebook: l.facebook || '',
          instagram: l.instagram || '',
          correo: l.correo || '',
          lat: l.lat != null ? parseFloat(l.lat) : null,
          lng: l.lng != null ? parseFloat(l.lng) : null,
        }))
        setAllStores(mapped)
      })
      .catch(() => setAllStores([]))
  }, [])

  const filteredStores = activeFilter
    ? allStores.filter((s) => s.type && s.type.toLowerCase() === activeFilter.toLowerCase())
    : allStores

  const cols = sidebarOpen ? 5 : 6
  const ROWS_PER_PAGE = 10
  const itemsPerPage = ROWS_PER_PAGE * cols
  const totalPages = Math.max(1, Math.ceil(filteredStores.length / itemsPerPage))
  const pageItems = filteredStores.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage)

  const goToPage = (page) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0 })
  }

  return (
    <div>
      {scrolled && (
        <button
          onClick={onBack}
          aria-label="Inicio"
          className="sm:hidden fixed right-3 z-50 flex items-center justify-center h-11 w-11 rounded-full bg-accent text-primary shadow-lg hover:brightness-110 active:scale-95 transition-all"
          style={{ top: headerH + 10 }}
        >
          <span className="material-symbols-outlined text-xl">home</span>
        </button>
      )}
      <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
        <button
          onClick={onBack}
          className="hidden sm:flex items-center gap-1 text-primary hover:text-accent transition-colors text-[10px] sm:text-xs font-bold"
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Volver
        </button>
        <div className="w-1 h-4 sm:h-5 bg-accent rounded-full sm:block hidden"></div>
        <h2 className="text-xs sm:text-sm font-bold text-slate-700 tracking-wide">
          {activeFilter ? activeFilter : 'Todos los Locales'}
        </h2>
        <span className="text-[9px] sm:text-[10px] text-slate-400">
          {filteredStores.length} {filteredStores.length === 1 ? 'local' : 'locales'}
        </span>
        <div className="flex-1"></div>
        {mapMode && (
          <button
            onClick={onToggleMap}
            className="flex items-center gap-1 text-xs font-bold text-primary hover:text-accent transition-colors"
          >
            <span className="material-symbols-outlined text-sm">grid_view</span>
            Ver tarjetas
          </button>
        )}
        <button
          onClick={onBack}
          aria-label="Inicio"
          className="sm:hidden shrink-0 flex items-center justify-center h-7 w-7 rounded-full bg-accent text-primary shadow hover:brightness-110 active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined text-base">home</span>
        </button>
      </div>

      {mapMode ? (
        <StoresMap stores={allStores} activeFilter={activeFilter} />
      ) : (
        <>
          <div className={`grid gap-2 sm:gap-3 md:gap-4 ${sidebarOpen ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-5' : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-6'} transition-all duration-300`}>
            {pageItems.map((store, idx) => (
              <StoreCard key={`${store.id}-${idx}`} store={store} />
            ))}
          </div>

          {filteredStores.length === 0 && (
            <p className="text-center text-slate-400 text-xs mt-8">
              No hay locales para mostrar.
            </p>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 0}
                className="h-8 w-8 rounded-lg flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all disabled:opacity-30 disabled:pointer-events-none"
              >
                <span className="material-symbols-outlined text-sm">chevron_left</span>
              </button>

              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  onClick={() => goToPage(i)}
                  className={`h-8 w-8 rounded-lg text-xs font-bold transition-all ${
                    i === currentPage
                      ? 'bg-primary text-white shadow'
                      : 'text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  {i + 1}
                </button>
              ))}

              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages - 1}
                className="h-8 w-8 rounded-lg flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all disabled:opacity-30 disabled:pointer-events-none"
              >
                <span className="material-symbols-outlined text-sm">chevron_right</span>
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
