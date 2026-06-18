import { useState, useEffect, useRef, useCallback } from 'react'

export default function ImageGallery({ images = [], alt = '', height = 'h-52 sm:h-64' }) {
  const imgs = images.filter(Boolean)
  const count = imgs.length
  const [current, setCurrent] = useState(0)
  const startX = useRef(null)
  const timerRef = useRef(null)

  const next = useCallback(() => setCurrent(i => (i + 1) % count), [count])
  const prev = useCallback(() => setCurrent(i => (i - 1 + count) % count), [count])

  // Auto-play solo en mobile
  useEffect(() => {
    if (count <= 1) return
    const isMobile = window.matchMedia('(max-width: 640px)').matches
    if (!isMobile) return
    timerRef.current = setInterval(next, 3500)
    return () => clearInterval(timerRef.current)
  }, [count, current, next])

  if (count === 0) return (
    <div className={`w-full ${height} bg-slate-100 flex items-center justify-center`}>
      <span className="material-symbols-outlined text-slate-300 text-5xl">image</span>
    </div>
  )

  if (count === 1) return (
    <div className={`w-full ${height} overflow-hidden bg-slate-100`}>
      <img src={imgs[0]} alt={alt} className="w-full h-full object-cover" />
    </div>
  )

  const handlePointerDown = (e) => {
    startX.current = e.clientX
    clearInterval(timerRef.current)
  }

  const handlePointerUp = (e) => {
    if (startX.current === null) return
    const diff = startX.current - e.clientX
    if (Math.abs(diff) > 40) diff > 0 ? next() : prev()
    startX.current = null
  }

  return (
    <div
      className={`relative w-full ${height} overflow-hidden bg-slate-100 select-none`}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      style={{ touchAction: 'pan-y' }}
    >
      {imgs.map((src, i) => (
        <img
          key={src + i}
          src={src}
          alt={`${alt} ${i + 1}`}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${i === current ? 'opacity-100' : 'opacity-0'}`}
        />
      ))}

      {/* Flechas — solo desktop */}
      <button
        onClick={prev}
        className="hidden sm:flex absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-white/80 backdrop-blur items-center justify-center hover:bg-white transition-colors shadow z-10"
      >
        <span className="material-symbols-outlined text-slate-700 text-base leading-none">chevron_left</span>
      </button>
      <button
        onClick={next}
        className="hidden sm:flex absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-white/80 backdrop-blur items-center justify-center hover:bg-white transition-colors shadow z-10"
      >
        <span className="material-symbols-outlined text-slate-700 text-base leading-none">chevron_right</span>
      </button>

      {/* Dots */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 z-10">
        {imgs.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`rounded-full transition-all duration-300 shadow-md ${i === current ? 'w-6 h-3 bg-accent' : 'w-3 h-3 bg-white/70'}`}
          />
        ))}
      </div>
    </div>
  )
}
