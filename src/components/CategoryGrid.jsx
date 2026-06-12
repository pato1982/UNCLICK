const CATEGORIES = [
  {
    id: 'productos',
    name: 'Productos',
    icon: 'shopping_bag',
    image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=300&q=80',
  },
  {
    id: 'arriendos',
    name: 'Arriendos',
    icon: 'home',
    image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=300&q=80',
  },
  {
    id: 'servicios',
    name: 'Servicios',
    icon: 'handyman',
    image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=300&q=80',
  },
  {
    id: 'turismo',
    name: 'Turismo',
    icon: 'landscape',
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300&q=80',
  },
  {
    id: 'negocios',
    name: 'Locales',
    icon: 'storefront',
    image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=300&q=80',
  },
  {
    id: 'eventos',
    name: 'Eventos',
    icon: 'event',
    image: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=300&q=80',
  },
]

import { useRef } from 'react'

export default function CategoryGrid({ onNavigate }) {
  const scrollRef = useRef(null)
  const drag = useRef({ down: false, startX: 0, startScroll: 0, moved: false })

  // Arrastrar con el mouse (el táctil ya usa el scroll nativo)
  const onPointerDown = (e) => {
    if (e.pointerType !== 'mouse') return
    const el = scrollRef.current
    if (!el) return
    drag.current = { down: true, startX: e.clientX, startScroll: el.scrollLeft, moved: false }
  }
  const onPointerMove = (e) => {
    if (!drag.current.down) return
    const el = scrollRef.current
    if (!el) return
    const dx = e.clientX - drag.current.startX
    if (Math.abs(dx) > 4) drag.current.moved = true
    el.scrollLeft = drag.current.startScroll - dx
  }
  const endDrag = () => { drag.current.down = false }

  return (
    <div className="relative z-10 -mt-8 sm:-mt-10 md:-mt-12 pb-2">
      <div
        ref={scrollRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
        className="flex gap-6 sm:gap-8 md:gap-12 max-[510px]:gap-2 overflow-x-auto sm:justify-center px-3 sm:px-0 max-[510px]:px-2 snap-x select-none cursor-grab active:cursor-grabbing pb-1 tabs-scroll"
      >
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={(e) => { if (drag.current.moved) { e.preventDefault(); return } onNavigate(cat.id) }}
            className="flex flex-col items-center gap-1 sm:gap-1.5 group cursor-pointer shrink-0 snap-start"
          >
            {/* Foto redonda */}
            <div className="w-24 h-24 max-[510px]:w-[72px] max-[510px]:h-[72px] sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-2xl max-[510px]:rounded-xl overflow-hidden shadow-md group-hover:shadow-lg transition-all duration-300 group-hover:-translate-y-1 border-2 border-white">
              <img
                src={cat.image}
                alt={cat.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
            </div>

            {/* Nombre debajo */}
            <span className="text-[11px] max-[510px]:text-[10px] sm:text-xs md:text-sm font-bold text-slate-700 group-hover:text-primary transition-colors leading-tight text-center">
              {cat.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
