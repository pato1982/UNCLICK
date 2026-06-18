import { useState, useRef, useEffect, useCallback } from 'react'
import ProductCard from './ProductCard'

export default function ProductCarousel({ title, items, sidebarOpen, hidePrice, onViewAll, onOpenStore, hideHeader }) {
  const mobileScrollRef = useRef(null)
  const desktopScrollRef = useRef(null)
  const intervalRef = useRef(null)

  const [dragging, setDragging] = useState(false)
  const isDragging = useRef(false)
  const dragStart = useRef(0)
  const dragEnd = useRef(0)
  const scrollStart = useRef(0)
  const pointerActive = useRef(false)

  const DRAG_THRESHOLD = 6
  const SNAP_THRESHOLD = 30

  const onPointerDown = (e) => {
    pointerActive.current = true
    isDragging.current = false
    dragStart.current = e.clientX
    dragEnd.current = e.clientX
    scrollStart.current = e.currentTarget.scrollLeft
    if (intervalRef.current) clearInterval(intervalRef.current)
  }

  const onPointerMove = (e) => {
    if (!pointerActive.current) return
    const delta = Math.abs(e.clientX - dragStart.current)
    if (!isDragging.current) {
      if (delta < DRAG_THRESHOLD) return
      isDragging.current = true
      setDragging(true)
      e.currentTarget.setPointerCapture(e.pointerId)
    }
    e.preventDefault()
    dragEnd.current = e.clientX
    e.currentTarget.scrollLeft = scrollStart.current - (e.clientX - dragStart.current)
  }

  const snapToCard = (el) => {
    const dx = dragStart.current - dragEnd.current
    const cardW = el.querySelector(':first-child')?.offsetWidth || 200
    const gap = parseFloat(window.getComputedStyle(el).columnGap) || 8
    const unit = cardW + gap
    const current = el.scrollLeft
    let target
    if (Math.abs(dx) > SNAP_THRESHOLD) {
      const direction = dx > 0 ? 1 : -1
      const currentCard = Math.round(current / unit)
      target = (currentCard + direction) * unit
    } else {
      target = Math.round(current / unit) * unit
    }
    el.scrollTo({ left: Math.max(0, Math.min(el.scrollWidth - el.clientWidth, target)), behavior: 'smooth' })
  }

  const onPointerUp = (e) => {
    pointerActive.current = false
    if (!isDragging.current) return
    isDragging.current = false
    setDragging(false)
    snapToCard(e.currentTarget)
    resetAutoScroll()
  }

  const onPointerLeave = () => {
    if (!isDragging.current) return
    pointerActive.current = false
    isDragging.current = false
    setDragging(false)
    resetAutoScroll()
  }

  const getScrollEl = () => {
    if (window.innerWidth < 640 && mobileScrollRef.current) return mobileScrollRef.current
    return desktopScrollRef.current
  }

  // La tarjeta dorada (primera posición) solo para plan Normal o Premium
  const featuredItem = items.find(p => p.owner_plan_id && p.owner_plan_id >= 2) || null
  const restItems = featuredItem ? items.filter(p => p !== featuredItem) : items

  const scrollOne = useCallback((direction) => {
    const el = getScrollEl()
    if (!el) return
    const cardW = el.querySelector(':first-child')?.offsetWidth || 200
    // Usar el gap real del contenedor (8px móvil / 16px escritorio) para avanzar
    // exactamente UNA tarjeta y que siempre queden 4 alineadas.
    const styles = window.getComputedStyle(el)
    const gap = parseFloat(styles.columnGap || styles.gap) || 8
    const amount = cardW + gap
    el.scrollBy({ left: direction === 'left' ? -amount : amount, behavior: 'smooth' })
  }, [])

  const scroll = (direction) => {
    scrollOne(direction)
    resetAutoScroll()
  }

  const resetAutoScroll = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    intervalRef.current = setInterval(() => {
      const el = getScrollEl()
      if (!el) return
      const { scrollLeft, scrollWidth, clientWidth } = el
      if (scrollLeft + clientWidth >= scrollWidth - 5) {
        el.scrollTo({ left: 0, behavior: 'smooth' })
      } else {
        scrollOne('right')
      }
    }, 4000)
  }, [scrollOne])

  useEffect(() => {
    if (items.length > 0) {
      resetAutoScroll()
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [resetAutoScroll, items.length])

  // Ancho de la tarjeta destacada (fija) — un poco más ancha en escritorio
  const featuredWidth = 'w-[calc(33.33%-6px)] sm:w-[calc(28%-12px)] md:w-[calc(26%-14px)]'
  // Ancho de tarjetas del carrusel: relativo a su propio contenedor (flex-1), por lo que
  // siempre se ven 4 en escritorio aunque la destacada sea más ancha. La compensación evita
  // que la 4ª quede cortada por el overflow-hidden.
  const carouselCardTablet = sidebarOpen ? 'sm:w-[calc(33.33%-13px)]' : 'sm:w-[calc(33.33%-14px)]'
  const carouselCardDesktop = sidebarOpen ? 'md:w-[calc(25%-15px)]' : 'md:w-[calc(25%-16px)]'
  const carouselCardWidth = `w-[calc(50%-4px)] ${carouselCardTablet} ${carouselCardDesktop}`

  return (
    <div>
      {!hideHeader && (
        <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4 md:mb-6">
          <div className="w-1 h-4 sm:h-5 bg-accent rounded-full"></div>
          <h2 className="text-xs sm:text-sm font-bold text-slate-700 tracking-wide">{title}</h2>
          <div className="flex-1 h-px bg-slate-200"></div>
          <button onClick={onViewAll} className="text-[9px] sm:text-[10px] font-bold text-primary hover:text-accent transition-colors uppercase tracking-wider">Ver todo</button>
        </div>
      )}
      <>
      {/* ===== MOBILE: todas las tarjetas en carrusel, 2 por fila, sin destacada fija ===== */}
      <div className="sm:hidden">
        <div
          ref={mobileScrollRef}
          className="flex gap-2 overflow-x-scroll hide-scrollbar py-1 px-1"
          style={{ scrollSnapType: 'x mandatory' }}
        >
          {items.map((product) => (
            <div
              key={product.id}
              className="shrink-0 w-[calc(50%-4px)] transition-all duration-300"
              style={{ scrollSnapAlign: 'start' }}
            >
              <ProductCard product={product} hidePrice={hidePrice} onOpenStore={onOpenStore} />
            </div>
          ))}
        </div>
      </div>

      {/* ===== TABLET/DESKTOP: destacada fija + carrusel ===== */}
      <div className="hidden sm:flex gap-3 md:gap-4 py-1 px-1">
        {/* Primera tarjeta fija (destacada) */}
        <div className={`shrink-0 ${featuredWidth} transition-all duration-300`}>
          {featuredItem ? (
            <ProductCard product={featuredItem} hidePrice={hidePrice} isFirst onOpenStore={onOpenStore} />
          ) : (
            <div className="bg-white rounded-xl overflow-hidden shadow-sm border-2 border-dashed border-amber-400 outline outline-2 outline-amber-400 outline-offset-2 flex flex-col">
              <div className="relative h-32 md:h-40 pt-2 bg-amber-50/30 flex items-center justify-center">
                <span className="material-symbols-outlined text-4xl text-amber-300">star</span>
                <span className="absolute top-2 left-2 bg-amber-400 text-amber-900 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider shadow">Popular</span>
              </div>
              <div className="px-4 py-3 flex flex-col flex-1 items-center text-center">
                <h3 className="font-bold text-xs text-amber-400 leading-tight line-clamp-1 mb-1">Destacado</h3>
                <p className="text-slate-400 text-[10px] line-clamp-2">Espacio premium</p>
              </div>
            </div>
          )}
        </div>

        {/* Carrusel con el resto */}
        {restItems.length > 0 && (
          <div className="relative group/carousel flex-1 min-w-0">
            <button
              onClick={() => scroll('left')}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-9 w-9 md:h-10 md:w-10 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-lg text-primary hover:bg-primary hover:text-white transition-all opacity-0 group-hover/carousel:opacity-100"
            >
              <span className="material-symbols-outlined text-base md:text-lg">chevron_left</span>
            </button>

            <button
              onClick={() => scroll('right')}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-9 w-9 md:h-10 md:w-10 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-lg text-primary hover:bg-primary hover:text-white transition-all opacity-0 group-hover/carousel:opacity-100"
            >
              <span className="material-symbols-outlined text-base md:text-lg">chevron_right</span>
            </button>

            <div
              ref={desktopScrollRef}
              className="flex gap-3 md:gap-4 overflow-x-scroll hide-scrollbar"
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerLeave={onPointerLeave}
              style={{ cursor: dragging ? 'grabbing' : 'grab', userSelect: 'none', scrollSnapType: 'x mandatory' }}
            >
              {restItems.map((product) => (
                <div
                  key={product.id}
                  className={`shrink-0 ${carouselCardWidth} transition-all duration-300`}
                  style={{ scrollSnapAlign: 'start' }}
                >
                  <ProductCard product={product} hidePrice={hidePrice} onOpenStore={onOpenStore} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      </>
    </div>
  )
}
