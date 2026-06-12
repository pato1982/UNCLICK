import { useState, useEffect, useRef, useCallback } from 'react'

const ROTATION_MS = 6000
const VISIBLE_DESKTOP = 4
const VISIBLE_TABLET = 2
const VISIBLE_MOBILE = 2

function ServiceModal({ service, onClose }) {
  if (!service) return null
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="relative w-full" style={{ aspectRatio: '4 / 3' }}>
          {service.image ? (
            <img src={service.image} alt={service.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-slate-200 flex items-center justify-center">
              <span className="material-symbols-outlined text-5xl text-slate-400">work</span>
            </div>
          )}
          <button onClick={onClose} className="absolute top-2 right-2 h-7 w-7 bg-black/40 backdrop-blur rounded-full flex items-center justify-center hover:bg-black/60 transition-colors">
            <span className="material-symbols-outlined text-white text-sm">close</span>
          </button>
          {service.badge && (
            <span className="absolute top-2 left-2 bg-accent text-primary text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">{service.badge}</span>
          )}
        </div>

        <div className="p-4 flex flex-col gap-2">
          <h3 className="text-sm font-black text-slate-800">{service.name}</h3>
          {service.category && (
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-primary text-sm">category</span>
              <span className="text-[11px] font-bold text-primary">{service.category}{service.subcategory ? ` · ${service.subcategory}` : ''}</span>
            </div>
          )}
          {service.description && (
            <p className="text-[11px] text-slate-500 leading-relaxed">{service.description}</p>
          )}
          {(service.price || service.originalPrice) && (
            <div className="flex items-center gap-3 pt-1">
              {service.originalPrice && (
                <span className="text-xs text-slate-400 line-through">${Number(service.originalPrice).toLocaleString('es-CL')}</span>
              )}
              {service.price && (
                <span className="text-lg font-black text-primary">${Number(service.price).toLocaleString('es-CL')}</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ServiceCard({ service, onClick }) {
  return (
    <div
      onClick={onClick}
      className="relative rounded-xl overflow-hidden cursor-pointer group bg-slate-800 shadow-lg"
      style={{ aspectRatio: '3 / 4' }}
    >
      {service.image ? (
        <img
          src={service.image}
          alt={service.name}
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="material-symbols-outlined text-4xl text-slate-500">work</span>
        </div>
      )}
      <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 50%, transparent 100%)' }} />
      <div className="absolute bottom-0 left-0 right-0 p-3">
        {service.category && (
          <span className="inline-block bg-accent/90 text-primary text-[8px] sm:text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider mb-1.5">
            {service.category}
          </span>
        )}
        <p className="text-white font-bold leading-tight line-clamp-2 text-xs sm:text-sm">
          {service.name}
        </p>
        {(service.price || service.originalPrice) && (
          <div className="flex items-center gap-2 mt-1.5">
            {service.originalPrice && (
              <span className="text-[10px] text-white/50 line-through">
                ${Number(service.originalPrice).toLocaleString('es-CL')}
              </span>
            )}
            {service.price && (
              <span className="text-xs sm:text-sm font-black text-accent">
                ${Number(service.price).toLocaleString('es-CL')}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default function StoreServicesCollage({ items, bgColor }) {
  const color = bgColor || '#0f1a2e'
  const transparent = color === 'transparent'
  const [index, setIndex] = useState(0)
  const [visibleCount, setVisibleCount] = useState(VISIBLE_DESKTOP)
  const [selected, setSelected] = useState(null)
  const intervalRef = useRef(null)

  // Detectar viewport: 1 / 2 / 4 cards
  useEffect(() => {
    function update() {
      const w = window.innerWidth
      if (w >= 768) setVisibleCount(VISIBLE_DESKTOP)
      else if (w >= 480) setVisibleCount(VISIBLE_TABLET)
      else setVisibleCount(VISIBLE_MOBILE)
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  const total = items?.length || 0
  const canRotate = total > visibleCount

  const advance = useCallback(() => {
    setIndex(i => (i + 1) % total)
  }, [total])

  // Auto-rotación: solo si hay más items que los visibles
  const restartTimer = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    if (canRotate) {
      intervalRef.current = setInterval(advance, ROTATION_MS)
    }
  }, [advance, canRotate])

  useEffect(() => {
    restartTimer()
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [restartTimer])

  if (!items || items.length === 0) return null

  // Calcular los items visibles desde index, ciclando
  const visibleItems = []
  for (let i = 0; i < Math.min(visibleCount, total); i++) {
    visibleItems.push(items[(index + i) % total])
  }

  const handlePrev = () => {
    setIndex(i => (i - 1 + total) % total)
    restartTimer()
  }
  const handleNext = () => {
    setIndex(i => (i + 1) % total)
    restartTimer()
  }

  return (
    <div className="relative overflow-hidden rounded-2xl mb-4" style={{ background: transparent ? 'transparent' : color }}>
      {!transparent && visibleItems[0] && visibleItems[0].image && (
        <>
          <img
            src={visibleItems[0].image}
            alt=""
            aria-hidden
            className="absolute inset-0 w-full h-full object-cover opacity-20"
            style={{ filter: 'blur(4px)', transform: 'scale(1.05)' }}
          />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, rgba(0,0,0,0.8) 35%, rgba(0,0,0,0.5) 100%)' }} />
        </>
      )}

      <div className="relative z-10 p-3 sm:p-4">
        <div className="relative">
          <div
            className="grid gap-3"
            style={{ gridTemplateColumns: `repeat(${Math.min(visibleCount, total)}, minmax(0, 1fr))` }}
          >
            {visibleItems.map((service, i) => (
              <ServiceCard
                key={`${service.id}-${index}-${i}`}
                service={service}
                onClick={() => setSelected(service)}
              />
            ))}
          </div>

          {canRotate && (
            <>
              <button
                onClick={handlePrev}
                className="absolute left-1 sm:-left-2 top-1/2 -translate-y-1/2 h-9 w-9 sm:h-10 sm:w-10 bg-white/90 hover:bg-white text-primary rounded-full shadow-xl flex items-center justify-center transition-colors z-10"
                aria-label="Anterior"
              >
                <span className="material-symbols-outlined text-xl">chevron_left</span>
              </button>
              <button
                onClick={handleNext}
                className="absolute right-1 sm:-right-2 top-1/2 -translate-y-1/2 h-9 w-9 sm:h-10 sm:w-10 bg-white/90 hover:bg-white text-primary rounded-full shadow-xl flex items-center justify-center transition-colors z-10"
                aria-label="Siguiente"
              >
                <span className="material-symbols-outlined text-xl">chevron_right</span>
              </button>
            </>
          )}
        </div>

        {canRotate && (
          <div className="flex justify-center gap-1.5 mt-3">
            {items.map((_, i) => (
              <button
                key={i}
                onClick={() => { setIndex(i); restartTimer() }}
                className={`h-1.5 rounded-full transition-all ${i === index ? 'w-5 bg-accent' : 'w-1.5 bg-white/30 hover:bg-white/50'}`}
                aria-label={`Ir al servicio ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {selected && <ServiceModal service={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
