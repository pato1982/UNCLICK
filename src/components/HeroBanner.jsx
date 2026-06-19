import { useState, useEffect } from 'react'

const SLIDES = [
  {
    // Volcán Villarrica con lago — Ricardo Díaz (Unsplash free license)
    image: 'https://images.unsplash.com/photo-1665107277506-5f272d52ddb1?auto=format&fit=crop&w=1600&q=85',
    label: 'Villarrica, Chile',
    title: <>Todo lo que<br />necesitas está<br />en <em className="text-accent not-italic">LocalClick</em></>,
    sub: 'El marketplace local de Villarrica y sus alrededores',
  },
  {
    // Bosque andino y volcán — David Vives (Unsplash free license)
    image: 'https://images.unsplash.com/photo-1600591054558-106b19b70279?auto=format&fit=crop&w=1600&q=85',
    label: 'Lagos y Volcanes',
    title: <>Compra, arrienda<br />y descubre<br /><em className="text-accent not-italic">Villarrica</em></>,
    sub: 'Productos, servicios, turismo y mucho más',
  },
  {
    // Montañas nevadas Villarrica — David Vives (Unsplash free license)
    image: 'https://images.unsplash.com/photo-1573502143827-a16f0ee55a9b?auto=format&fit=crop&w=1600&q=85',
    label: 'Naturaleza y Aventura',
    title: <>Negocios locales<br />a tu<br /><em className="text-accent not-italic">alcance</em></>,
    sub: 'Apoya a los emprendedores de Villarrica y sus alrededores',
  },
]

export default function HeroBanner() {
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => setCurrent(c => (c + 1) % SLIDES.length), 6000)
    return () => clearInterval(timer)
  }, [])

  const slide = SLIDES[current]

  return (
    <div className="relative h-52 sm:h-64 md:h-80 overflow-hidden -mx-3 sm:-mx-4 md:-mx-6 -mt-3 sm:-mt-4 md:-mt-6">
      {SLIDES.map((s, i) => (
        <img
          key={i}
          src={s.image}
          alt="Villarrica"
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${i === current ? 'opacity-100' : 'opacity-0'}`}
        />
      ))}
      <div
        className="absolute inset-0 flex flex-col justify-center px-6 sm:px-10 md:px-12"
        style={{ background: 'linear-gradient(135deg, rgba(59,25,105,0.88) 0%, rgba(26,18,32,0.4) 60%, transparent 100%)' }}
      >
        <span className="text-accent text-[9px] sm:text-[10px] font-black uppercase tracking-[3px] mb-1 sm:mb-2">
          ✦ {slide.label}
        </span>
        <h1 className="text-white text-2xl sm:text-3xl md:text-4xl font-black italic leading-[1.1] mb-2 sm:mb-3">
          {slide.title}
        </h1>
        <p className="text-white/70 text-xs sm:text-sm max-w-md">
          {slide.sub}
        </p>
      </div>
      {/* Dots */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`h-1.5 rounded-full transition-all duration-300 ${i === current ? 'w-5 bg-accent' : 'w-1.5 bg-white/40'}`}
          />
        ))}
      </div>
    </div>
  )
}
