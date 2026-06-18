import { useState, useRef, useEffect, useCallback } from 'react'
import LocalModal from './LocalModal'

const API = import.meta.env.VITE_API || ''


const PLACEHOLDER_STORES = [
  { id: 'ph-s1', name: 'Centro Gastronómico', image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=300&q=80', address: 'Costanera, Villarrica', _isPlaceholder: true },
  { id: 'ph-s2', name: 'Mall y Tiendas', image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=300&q=80', address: 'Centro, Villarrica', _isPlaceholder: true },
  { id: 'ph-s3', name: 'Barrio Costanera', image: 'https://images.unsplash.com/photo-1580274455191-1c62238fa333?w=300&q=80', address: 'Costanera Norte', _isPlaceholder: true },
  { id: 'ph-s4', name: 'Servicios Profesionales', image: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=300&q=80', address: 'Centro, Villarrica', _isPlaceholder: true },
  { id: 'ph-s5', name: 'Oficinas y Cowork', image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=300&q=80', address: 'Av. San Martín', _isPlaceholder: true },
  { id: 'ph-s6', name: 'Mercado Local', image: 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=300&q=80', address: 'Feria Municipal', _isPlaceholder: true },
]

export default function StoresCarousel({ onViewAll }) {
  const [stores, setStores] = useState([])
  const [selected, setSelected] = useState(null)
  const scrollRef = useRef(null)
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
    const target = Math.abs(dx) > SNAP_THRESHOLD
      ? scrollStart.current + (dx > 0 ? unit : -unit)
      : Math.round(scrollStart.current / unit) * unit
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

  useEffect(() => {
    fetch(`${API}/api/v1/locales`)
      .then(r => r.json())
      .then(data => {
        const mapped = (data.locales || []).map(l => ({
          id: l.id,
          name: l.nombre,
          image: l.imagen ? `${API}${l.imagen}` : '',
          imagen_2: l.imagen_2 ? `${API}${l.imagen_2}` : null,
          imagen_3: l.imagen_3 ? `${API}${l.imagen_3}` : null,
          address: l.direccion || '',
          categoria: l.categoria_nombre || '',
          descripcion: l.descripcion || '',
          telefono: l.telefono || '',
          whatsapp: l.whatsapp || '',
          horario: l.horario || '',
          facebook: l.facebook || '',
          instagram: l.instagram || '',
          correo: l.correo || '',
        }))
        setStores(mapped)
      })
      .catch(() => setStores([]))
  }, [])

  const MIN_STORES = 6
  const displayStores = stores.length >= MIN_STORES
    ? stores
    : [...stores, ...PLACEHOLDER_STORES.slice(0, MIN_STORES - stores.length)]

  const scrollOne = useCallback((direction) => {
    const el = scrollRef.current
    if (!el) return
    const card = el.querySelector(':first-child')
    if (!card) return
    const amount = card.offsetWidth + 8
    if (direction === 'left') {
      el.scrollBy({ left: -amount, behavior: 'smooth' })
    } else {
      const { scrollLeft, scrollWidth, clientWidth } = el
      if (scrollLeft + clientWidth >= scrollWidth - 5) {
        el.scrollTo({ left: 0, behavior: 'smooth' })
      } else {
        el.scrollBy({ left: amount, behavior: 'smooth' })
      }
    }
  }, [])

  const resetAutoScroll = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    intervalRef.current = setInterval(() => scrollOne('right'), 4000)
  }, [scrollOne])

  useEffect(() => {
    if (displayStores.length > 0) resetAutoScroll()
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [resetAutoScroll, displayStores.length])

  const scroll = (direction) => {
    scrollOne(direction)
    resetAutoScroll()
  }

  return (
    <div className="py-4 sm:py-6 px-3 sm:px-4 rounded-2xl" style={{ background: '#3B1969' }}>
      <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
        <div className="w-1 h-4 sm:h-5 bg-accent rounded-full"></div>
        <h2 className="text-xs sm:text-sm font-black text-white tracking-wide">Locales Inscritos</h2>
        <div className="flex-1 h-px bg-white/20"></div>
        <button onClick={onViewAll} className="text-[9px] sm:text-[10px] font-bold text-accent hover:text-white transition-colors uppercase tracking-wider">Ver todo</button>
      </div>

      <div className="relative group/carousel">
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 md:h-9 md:w-9 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-lg text-primary hover:bg-primary hover:text-white transition-all opacity-0 group-hover/carousel:opacity-100"
        >
          <span className="material-symbols-outlined text-base">chevron_left</span>
        </button>

        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 md:h-9 md:w-9 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-lg text-primary hover:bg-primary hover:text-white transition-all opacity-0 group-hover/carousel:opacity-100"
        >
          <span className="material-symbols-outlined text-base">chevron_right</span>
        </button>

        <div
          ref={scrollRef}
          className="flex gap-2 sm:gap-3 overflow-x-scroll hide-scrollbar py-1 px-1"
          style={{ scrollSnapType: 'x mandatory' }}
        >
          {displayStores.map((store, i) => (
            <button
              key={`${store.id}-${i}`}
              onClick={() => setSelected(store)}
              className="shrink-0 w-[calc(50%-4px)] sm:w-[calc(33.33%-8px)] md:w-[calc(20%-10px)] bg-white/10 rounded-xl overflow-hidden border border-white/10 hover:border-accent hover:shadow-lg transition-all group/item cursor-pointer text-left"
              style={{ scrollSnapAlign: 'start' }}
            >
              <div className="w-full overflow-hidden" style={{ aspectRatio: '4/3' }}>
                <img
                  src={store.image}
                  alt={store.name}
                  className="w-full h-full object-cover group-hover/item:scale-110 transition-transform duration-500"
                />
              </div>
              <div className="px-2 py-2 sm:px-3 sm:py-2.5">
                <h3 className="text-xs sm:text-sm font-bold text-white leading-tight line-clamp-1 mb-0.5 group-hover/item:text-accent transition-colors">{store.name}</h3>
                {store.address && (
                  <div className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-white/40 text-[10px]">location_on</span>
                    <p className="text-[10px] sm:text-[11px] text-white/50 line-clamp-1">{store.address}</p>
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {selected && <LocalModal local={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
