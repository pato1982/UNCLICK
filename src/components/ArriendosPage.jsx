import { useState, useEffect } from 'react'
import ProductCard from './ProductCard'

const API = import.meta.env.VITE_API || ''

export default function ArriendosPage({ sidebarOpen, onBack, activeFilter, onOpenStore }) {
  const [allItems, setAllItems] = useState([])
  const [currentPage, setCurrentPage] = useState(0)
  const [loading, setLoading] = useState(true)
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
    fetch(`${API}/api/v1/public/listings`)
      .then(r => r.json())
      .then(data => {
        const arriendos = (data.listings || [])
          .filter(l => l.tipo === 'arriendo')
          .map(l => ({
            id: l.id,
            user_id: l.user_id,
            name: l.nombre,
            description: l.descripcion || '',
            image: l.imagen ? `${API}${l.imagen}` : '',
            alt: l.nombre,
            price: l.precio,
            originalPrice: l.precio_original,
            badge: l.badge || '',
            category: l.categoria || '',
            subcategory: l.subcategoria || '',
            tipo: l.tipo,
            nombre_negocio: l.nombre_negocio || '',
            negocio_whatsapp: l.negocio_whatsapp || '',
            negocio_telefono: l.negocio_telefono || '',
            negocio_direccion: l.negocio_direccion || '',
            negocio_correo: l.negocio_correo || '',
            negocio_facebook: l.negocio_facebook || '',
            negocio_instagram: l.negocio_instagram || '',
            owner_plan_id: l.owner_plan_id,
          }))
        setAllItems(arriendos)
        setLoading(false)
      })
      .catch(() => {
        setAllItems([])
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    setCurrentPage(0)
  }, [activeFilter])

  const filteredItems = activeFilter
    ? allItems.filter(item => {
        if (typeof activeFilter === 'object' && activeFilter.subcategories) {
          return activeFilter.subcategories.some(s => s.toLowerCase() === (item.subcategory || '').toLowerCase()) || (item.category || '').toLowerCase() === (activeFilter.category || '').toLowerCase()
        }
        const f = activeFilter.toLowerCase()
        return (item.subcategory || '').toLowerCase() === f || (item.category || '').toLowerCase() === f
      })
    : allItems

  const cols = sidebarOpen ? 5 : 6
  const ROWS_PER_PAGE = 10
  const itemsPerPage = ROWS_PER_PAGE * cols
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / itemsPerPage))
  const pageItems = filteredItems.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage)

  const goToPage = (page) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0 })
  }

  const filterLabel = activeFilter && typeof activeFilter === 'object' ? activeFilter.category : activeFilter

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
          {filterLabel || 'Todos los Arriendos'}
        </h2>
        <span className="text-[9px] sm:text-[10px] text-slate-400">
          {filteredItems.length} {filteredItems.length === 1 ? 'arriendo' : 'arriendos'}
        </span>
        <button
          onClick={onBack}
          aria-label="Inicio"
          className="sm:hidden ml-auto shrink-0 flex items-center justify-center h-7 w-7 rounded-full bg-accent text-primary shadow hover:brightness-110 active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined text-base">home</span>
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <span className="material-symbols-outlined text-primary text-3xl animate-spin">progress_activity</span>
        </div>
      ) : (
        <>
          <div className={`grid gap-2 sm:gap-3 md:gap-4 transition-all duration-300 ${sidebarOpen ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-5' : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-5'}`}>
            {pageItems.map((item, idx) => (
              <ProductCard
                key={`${item.id}-${idx}`}
                product={item}
                onOpenStore={onOpenStore}
              />
            ))}
          </div>

          {filteredItems.length === 0 && (
            <p className="text-center text-slate-400 text-xs mt-8">
              No hay arriendos para mostrar.
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
