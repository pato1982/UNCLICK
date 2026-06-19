import { useState, useEffect, useRef, useCallback } from 'react'

const API = import.meta.env.VITE_API || ''

const LAYOUT = [
  { colSpan: 2, rowSpan: 2 },
  { colSpan: 1, rowSpan: 1 },
  { colSpan: 1, rowSpan: 1 },
  { colSpan: 2, rowSpan: 2 },
  { colSpan: 1, rowSpan: 1 },
  { colSpan: 1, rowSpan: 1 },
  { colSpan: 1, rowSpan: 1 },
  { colSpan: 1, rowSpan: 1 },
  { colSpan: 1, rowSpan: 1 },
  { colSpan: 1, rowSpan: 1 },
]

const FEW_THRESHOLD = 4

function parseJSON(val) {
  if (Array.isArray(val)) return val
  if (!val) return []
  try { return JSON.parse(val) } catch { return [] }
}

function getTourImage(tour) {
  const imgs = parseJSON(tour.imagenes)
  const idx = tour.imagen_principal || 0
  if (imgs.length > 0) {
    const img = imgs[idx] || imgs[0]
    return img.startsWith('http') ? img : `${API}${img}`
  }
  return ''
}

function shuffleWithCompanyBalance(tours) {
  if (tours.length === 0) return []
  const byCompany = {}
  tours.forEach(t => {
    const key = t.user_id || t.id
    if (!byCompany[key]) byCompany[key] = []
    byCompany[key].push(t)
  })
  Object.values(byCompany).forEach(arr => {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[arr[i], arr[j]] = [arr[j], arr[i]]
    }
  })
  const result = []
  const companyKeys = Object.keys(byCompany)
  for (let i = companyKeys.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[companyKeys[i], companyKeys[j]] = [companyKeys[j], companyKeys[i]]
  }
  let added = true
  while (added) {
    added = false
    for (const key of companyKeys) {
      if (byCompany[key].length > 0) {
        result.push(byCompany[key].shift())
        added = true
      }
    }
  }
  return result
}

function TourModal({ tour, onClose, onOpenTour }) {
  const [currentImg, setCurrentImg] = useState(0)
  const imgs = parseJSON(tour.imagenes).map(img => img.startsWith('http') ? img : `${API}${img}`).filter(Boolean)
  const crops = parseJSON(tour.imagenes_crop) || []

  const prev = () => setCurrentImg(i => i === 0 ? imgs.length - 1 : i - 1)
  const next = () => setCurrentImg(i => i === imgs.length - 1 ? 0 : i + 1)

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="relative w-full" style={{ aspectRatio: '4 / 3' }}>
          {imgs.length > 0 ? (
            <img
              src={imgs[currentImg]}
              alt={`${tour.nombre} ${currentImg + 1}`}
              className="w-full h-full object-contain"
              style={crops[currentImg] && (crops[currentImg].zoom > 1 || crops[currentImg].x || crops[currentImg].y) ? {
                transform: `scale(${crops[currentImg].zoom}) translate(${crops[currentImg].x / crops[currentImg].zoom}px, ${crops[currentImg].y / crops[currentImg].zoom}px)`,
                transformOrigin: 'center center',
              } : undefined}
            />
          ) : (
            <div className="w-full h-full bg-slate-200 flex items-center justify-center">
              <span className="material-symbols-outlined text-5xl text-slate-400">landscape</span>
            </div>
          )}
          <button onClick={onClose} className="absolute top-2 right-2 h-7 w-7 bg-black/40 backdrop-blur rounded-full flex items-center justify-center hover:bg-black/60 transition-colors">
            <span className="material-symbols-outlined text-white text-sm">close</span>
          </button>
          {imgs.length > 1 && (
            <>
              <button onClick={prev} className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 bg-white/80 backdrop-blur rounded-full flex items-center justify-center shadow-lg text-primary hover:bg-white transition-colors">
                <span className="material-symbols-outlined text-base">chevron_left</span>
              </button>
              <button onClick={next} className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 bg-white/80 backdrop-blur rounded-full flex items-center justify-center shadow-lg text-primary hover:bg-white transition-colors">
                <span className="material-symbols-outlined text-base">chevron_right</span>
              </button>
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                {imgs.map((_, i) => (
                  <button key={i} onClick={() => setCurrentImg(i)} className={`h-1.5 rounded-full transition-all ${i === currentImg ? 'w-5 bg-accent' : 'w-1.5 bg-white/50'}`} />
                ))}
              </div>
              <span className="absolute top-2 left-2 bg-black/40 backdrop-blur text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                {currentImg + 1}/{imgs.length}
              </span>
            </>
          )}
        </div>
        <div className="p-4 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-800">{tour.nombre}</h3>
            {tour.user_id && !tour._isPlaceholder && (
              <button
                onClick={() => { onClose(); onOpenTour && onOpenTour(tour.user_id, tour) }}
                className="flex items-center gap-1 px-2.5 py-1 bg-accent hover:bg-accent/80 rounded-full transition-colors shadow-sm"
              >
                <span className="material-symbols-outlined text-primary text-sm">storefront</span>
                <span className="text-[10px] font-bold text-primary">Ver tienda</span>
              </button>
            )}
          </div>
          {tour.empresa_nombre && (
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-primary text-sm">store</span>
              <span className="text-[11px] font-bold text-primary">{tour.empresa_nombre}</span>
            </div>
          )}
          {tour.ubicacion && (
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-accent text-sm">location_on</span>
              <span className="text-[11px] text-slate-500">{tour.ubicacion}</span>
            </div>
          )}
          {tour.detalle && (
            <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-3">{tour.detalle}</p>
          )}
          {(tour.precio || tour.precio_antes) && (
            <div className="flex items-center gap-3 pt-1">
              {tour.precio_antes && (
                <span className="text-xs text-slate-400 line-through">
                  ${Number(tour.precio_antes).toLocaleString('es-CL', { maximumFractionDigits: 0 })}
                </span>
              )}
              {tour.precio && (
                <span className="text-lg font-black text-primary">
                  ${Number(tour.precio).toLocaleString('es-CL', { maximumFractionDigits: 0 })}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function MosaicTile({ tour, colSpan, rowSpan, onClick, onOpenTour, fading, aspect = '1 / 1' }) {
  const isBig = colSpan >= 2 && rowSpan >= 2
  const imageSrc = getTourImage(tour)
  const isPaid = tour.user_id && !tour._isPlaceholder && tour.owner_plan_id >= 2

  return (
    <div
      onClick={onClick}
      className={`relative overflow-hidden rounded-xl cursor-pointer group transition-opacity duration-700 ${fading ? 'opacity-0' : 'opacity-100'}`}
      style={{ gridColumn: `span ${colSpan}`, gridRow: `span ${rowSpan}`, aspectRatio: aspect }}
    >
      {imageSrc ? (
        <img src={imageSrc} alt={tour.nombre} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
      ) : (
        <div className="absolute inset-0 bg-slate-700 flex items-center justify-center">
          <span className="material-symbols-outlined text-4xl text-slate-500">landscape</span>
        </div>
      )}
      <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.1) 55%, transparent 100%)' }} />
      <div className="absolute bottom-0 left-0 right-0 p-2 sm:p-3">
        {tour.categoria && (
          <span className="inline-block bg-accent/90 text-primary text-[8px] sm:text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider mb-1">
            {tour.categoria}
          </span>
        )}
        <p className={`text-white font-bold leading-tight line-clamp-2 ${isBig ? 'text-sm sm:text-base' : 'text-[10px] sm:text-xs'}`}>
          {tour.nombre}
        </p>
        {isBig && tour.ubicacion && (
          <p className="text-white/60 text-[10px] mt-0.5 line-clamp-1">{tour.ubicacion}</p>
        )}
      </div>
      {isPaid && (
        <button
          onClick={(e) => { e.stopPropagation(); onOpenTour && onOpenTour(tour.user_id, tour) }}
          className="absolute bottom-1.5 right-1.5 z-10 h-7 w-7 sm:h-8 sm:w-8 rounded-md sm:rounded-lg bg-accent text-primary hover:bg-accent/80 flex items-center justify-center shadow-md transition-all hover:scale-110"
        >
          <span className="material-symbols-outlined text-sm sm:text-base font-bold">storefront</span>
        </button>
      )}
    </div>
  )
}

const TOUR_IMGS_LEFT  = ['/1.jpg', '/2.jfif', '/3.jfif']
const TOUR_IMGS_RIGHT = ['/4.jpg', '/5.webp', '/6.jfif']

function CardColumn({ imgs }) {
  const rotations = [-4, 3, -2]
  return (
    <div className="flex flex-col gap-2 h-full py-2 overflow-hidden" style={{ width: '130px' }}>
      {imgs.map((src, i) => (
        <div key={i} className="flex-1 relative rounded-2xl overflow-hidden shadow-xl"
          style={{ transform: `rotate(${rotations[i]}deg)`, border: '2px solid rgba(255,255,255,0.13)', minHeight: 0 }}>
          <img src={src} alt="" className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent 55%, rgba(5,15,35,0.6) 100%)' }} />
        </div>
      ))}
    </div>
  )
}

function TurismoPromo({ onViewAll }) {
  const chips = ['Kayak', 'Senderismo', 'Volcán', 'Camping', 'Fotografía', 'Pesca', 'Ciclismo', 'Avistamiento']
  return (
    <div className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #08192e 0%, #0d2840 35%, #1a2540 60%, #26143a 85%, #1a1220 100%)' }}>
      <div className="absolute pointer-events-none" style={{ bottom: '-60px', left: '25%', width: '480px', height: '220px', background: 'radial-gradient(ellipse, rgba(6,75,115,0.45) 0%, transparent 70%)', filter: 'blur(28px)' }} />
      <div className="absolute pointer-events-none" style={{ top: '-50px', right: '10%', width: '280px', height: '260px', background: 'radial-gradient(ellipse, rgba(55,16,75,0.6) 0%, transparent 68%)', filter: 'blur(30px)' }} />
      <div className="relative z-10 py-5 sm:py-4 px-3 sm:px-0">
        <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
          <div className="w-1 h-5 sm:h-6 bg-accent rounded-full" />
          <h2 className="text-sm sm:text-base font-black text-white tracking-wide">Turismo</h2>
          <span className="text-[9px] sm:text-[10px] font-bold text-accent/70 uppercase tracking-wider">Villarrica</span>
          <div className="flex-1 h-px bg-white/10" />
          <button onClick={onViewAll} className="text-[9px] sm:text-[10px] font-bold text-accent hover:text-white transition-colors uppercase tracking-wider">Ver todo</button>
        </div>
        <div className="flex items-stretch gap-2 sm:gap-4 max-w-5xl mx-auto w-full" style={{ minHeight: '220px' }}>
          <div className="hidden sm:flex items-stretch justify-center shrink-0">
            <CardColumn imgs={TOUR_IMGS_LEFT} />
          </div>
          <div className="flex-1 flex flex-col items-center justify-center text-center px-2 sm:px-4">
            <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest mb-1.5" style={{ color: 'rgba(245,200,66,0.65)' }}>
              Lago Villarrica · Volcán · Naturaleza
            </p>
            <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-white leading-tight mb-2.5">
              Descubre el turismo<br /><span style={{ color: '#F5C842' }}>en Villarrica</span>
            </h3>
            <p className="text-[11px] sm:text-xs leading-relaxed mb-4 max-w-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>
              Lago cristalino, volcán imponente y naturaleza única. Conoce las empresas de tours y aventura de la zona.
            </p>
            <button onClick={onViewAll} className="inline-flex items-center gap-2 font-black text-[11px] sm:text-xs px-4 sm:px-5 py-2 sm:py-2.5 rounded-full transition-all hover:scale-105 shadow-lg mb-3" style={{ background: '#F5C842', color: '#3B1969' }}>
              <span className="material-symbols-outlined text-sm">explore</span>
              Ver empresas de turismo disponibles
            </button>
            <div className="hidden sm:flex flex-wrap justify-center gap-1.5">
              {chips.map((act, i) => (
                <span key={i} className="text-[10px] font-bold px-2.5 py-1 rounded-full"
                  style={{ border: '1px solid rgba(245,200,66,0.22)', color: 'rgba(245,200,66,0.7)', background: 'rgba(245,200,66,0.07)' }}>
                  {act}
                </span>
              ))}
            </div>
          </div>
          <div className="hidden sm:flex items-stretch justify-center shrink-0">
            <CardColumn imgs={TOUR_IMGS_RIGHT} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default function TurismoSection({ onViewAll, onOpenTour }) {
  const [allTours, setAllTours] = useState([])
  const [displayTours, setDisplayTours] = useState([])
  const [fading, setFading] = useState(false)
  const [selectedTour, setSelectedTour] = useState(null)
  const [loaded, setLoaded] = useState(false)
  const gridRef = useRef(null)
  const rotationRef = useRef(null)

  useEffect(() => {
    fetch(`${API}/api/v1/public/tours`)
      .then(r => r.json())
      .then(data => {
        const tours = data.tours || []
        setAllTours(tours)
        const shuffled = shuffleWithCompanyBalance(tours)
        setDisplayTours(shuffled.slice(0, LAYOUT.length))
        setLoaded(true)
      })
      .catch(() => { setLoaded(true) })
  }, [])

  const rotateTours = useCallback(() => {
    setFading(true)
    setTimeout(() => {
      const shuffled = shuffleWithCompanyBalance(allTours)
      setDisplayTours(shuffled.slice(0, LAYOUT.length))
      setFading(false)
    }, 700)
  }, [allTours])

  useEffect(() => {
    rotationRef.current = setInterval(rotateTours, 10000)
    return () => clearInterval(rotationRef.current)
  }, [rotateTours])

  useEffect(() => {
    function equalize() {
      const grid = gridRef.current
      if (!grid) return
      const cols = 8
      const gap = 6
      const cellSize = Math.floor((grid.clientWidth - (cols - 1) * gap) / cols)
      grid.style.gridTemplateRows = `${cellSize}px ${cellSize}px`
    }
    equalize()
    window.addEventListener('resize', equalize)
    return () => window.removeEventListener('resize', equalize)
  }, [displayTours])

  if (loaded && allTours.length === 0) {
    return <TurismoPromo onViewAll={onViewAll} />
  }

  const fewItems = allTours.length > 0 && allTours.length <= FEW_THRESHOLD

  const tiles = LAYOUT.map((slot, i) => ({ ...slot, tour: displayTours[i] })).filter(t => t.tour)

  const handleTileClick = (tour) => setSelectedTour(tour)

  // Pocos tours: fondo a lo ancho, tarjetas centradas
  if (fewItems) {
    return (
      <div className="relative overflow-hidden" style={{ background: '#1a1220' }}>
        <div className="relative z-10 py-4 sm:py-6 px-3 sm:px-0">
          <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-5">
            <div className="w-1 h-5 sm:h-6 bg-accent rounded-full" />
            <h2 className="text-sm sm:text-base font-black text-white tracking-wide">Turismo</h2>
            <span className="text-[9px] sm:text-[10px] font-bold text-accent/70 uppercase tracking-wider">Villarrica</span>
            <div className="flex-1 h-px bg-white/10" />
            <button onClick={onViewAll} className="text-[9px] sm:text-[10px] font-bold text-accent hover:text-white transition-colors uppercase tracking-wider">
              Ver todo
            </button>
          </div>
          <div className="flex justify-center gap-2">
            {displayTours.map((tour) => (
              <div key={`few-${tour.id}`} style={{ width: '180px', flexShrink: 0 }}>
                <MosaicTile
                  tour={tour}
                  colSpan={1}
                  rowSpan={1}
                  aspect="1 / 1"
                  onClick={() => handleTileClick(tour)}
                  onOpenTour={onOpenTour}
                  fading={fading}
                />
              </div>
            ))}
          </div>
        </div>
        {selectedTour && (
          <TourModal tour={selectedTour} onClose={() => setSelectedTour(null)} onOpenTour={onOpenTour} />
        )}
      </div>
    )
  }

  // Muchos tours: layout full-width con imagen borroneada de fondo
  return (
    <div className="relative overflow-hidden" style={{ background: '#1a1220' }}>
      {displayTours.length > 0 && getTourImage(displayTours[0]) && (
        <>
          <img src={getTourImage(displayTours[0])} alt="" aria-hidden
            className="absolute inset-0 w-full h-full object-cover opacity-20"
            style={{ filter: 'blur(4px)', transform: 'scale(1.05)' }}
          />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, rgba(26,18,32,0.95) 35%, rgba(26,18,32,0.6) 100%)' }} />
        </>
      )}
      <div className="relative z-10 py-4 sm:py-6 px-3 sm:px-0">
        <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-5">
          <div className="w-1 h-5 sm:h-6 bg-accent rounded-full" />
          <h2 className="text-sm sm:text-base font-black text-white tracking-wide">Turismo</h2>
          <span className="text-[9px] sm:text-[10px] font-bold text-accent/70 uppercase tracking-wider">Villarrica</span>
          <div className="flex-1 h-px bg-white/10" />
          <button onClick={onViewAll} className="text-[9px] sm:text-[10px] font-bold text-accent hover:text-white transition-colors uppercase tracking-wider">
            Ver todo
          </button>
        </div>

        {/* Movil: 2x2 */}
        <div className="grid sm:hidden grid-cols-2 gap-1.5">
          {displayTours.slice(0, 4).map((tour, i) => (
            <MosaicTile key={`m-${tour.id}-${i}`} tour={tour} colSpan={1} rowSpan={1} aspect="1 / 1"
              onClick={() => handleTileClick(tour)} onOpenTour={onOpenTour} fading={fading} />
          ))}
        </div>

        {/* Rango 800-900px: fila de 4 */}
        <div className="hidden min-[800px]:max-[900px]:flex gap-1.5 px-6">
          {displayTours.slice(0, 4).map((tour, i) => (
            <div key={`mid-${tour.id}-${i}`} className="flex-1">
              <MosaicTile tour={tour} colSpan={1} rowSpan={1} aspect="1 / 1"
                onClick={() => handleTileClick(tour)} onOpenTour={onOpenTour} fading={fading} />
            </div>
          ))}
        </div>

        {/* Escritorio: mosaico */}
        <div ref={gridRef} className="hidden min-[640px]:max-[799px]:grid min-[901px]:grid gap-1.5"
          style={{ gridTemplateColumns: 'repeat(8, 1fr)', gridAutoRows: 'auto' }}>
          {tiles.map((tile, i) => (
            <MosaicTile key={`${tile.tour.id}-${i}`} tour={tile.tour}
              colSpan={tile.colSpan} rowSpan={tile.rowSpan}
              onClick={() => handleTileClick(tile.tour)} onOpenTour={onOpenTour} fading={fading} />
          ))}
        </div>
      </div>

      {selectedTour && (
        <TourModal tour={selectedTour} onClose={() => setSelectedTour(null)} onOpenTour={onOpenTour} />
      )}
    </div>
  )
}
