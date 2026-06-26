import { useState, useEffect, useRef } from 'react'

const API = import.meta.env.VITE_API || ''

function parseJSON(val) {
  if (!val) return null
  if (typeof val === 'string') try { return JSON.parse(val) } catch { return null }
  return val
}

const fanAngles = [
  { rotate: -15, translateX: -50 },
  { rotate: 0, translateX: 0 },
  { rotate: 15, translateX: 50 },
]

const fanAnglesMobile = [
  { rotate: -12, translateX: -28 },
  { rotate: 0, translateX: 0 },
  { rotate: 12, translateX: 28 },
]

function CardFan({ images, crops = [] }) {
  if (!images || images.length === 0) {
    return (
      <div className="relative shrink-0 flex items-center justify-center" style={{ width: '250px', height: '180px' }}>
        <span className="material-symbols-outlined text-5xl text-slate-200">image</span>
      </div>
    )
  }
  const renderFan = (angles, containerClass, cardClass) => (
    <div className={`relative shrink-0 ${containerClass}`}>
      {images.slice(0, angles.length).map((img, i) => {
        const c = crops[i]
        const z = c?.zoom || 1
        const cx = c?.x || 0
        const cy = c?.y || 0
        return (
          <div
            key={i}
            className={`absolute ${cardClass} rounded-lg sm:rounded-xl overflow-hidden shadow-xl sm:shadow-2xl border-2 sm:border-[3px] border-white transition-transform duration-300 hover:scale-110 hover:z-20`}
            style={{
              transform: `translateX(calc(-50% + ${angles[i].translateX}px)) rotate(${angles[i].rotate}deg)`,
              transformOrigin: 'bottom center',
              left: '50%',
              top: '0px',
              zIndex: i === 1 || i === 2 ? 12 : 10,
            }}
          >
            <img
              src={img}
              alt="Turismo"
              className="w-full h-full object-cover"
              style={z > 1 || cx || cy ? {
                transform: `scale(${z}) translate(${cx / z}px, ${cy / z}px)`,
                transformOrigin: 'center center',
              } : undefined}
            />
          </div>
        )
      })}
    </div>
  )

  return (
    <>
      {/* Mobile: más junto */}
      <div className="sm:hidden">{renderFan(fanAnglesMobile, 'w-[120px] h-[100px]', 'w-14 h-[75px]')}</div>
      {/* Tablet */}
      <div className="hidden sm:block md:hidden">{renderFan(fanAngles, 'w-[200px] h-[150px]', 'w-20 h-[110px]')}</div>
      {/* Desktop */}
      <div className="hidden md:block">{renderFan(fanAngles, 'w-[250px] h-[180px]', 'w-28 h-[150px]')}</div>
    </>
  )
}

function FloatingButton({ label, icon, onClick }) {
  const [bottom, setBottom] = useState(24)

  useEffect(() => {
    let rafId
    const handleScroll = () => {
      cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(() => {
        const footer = document.querySelector('footer')
        if (!footer) return
        const footerTop = footer.getBoundingClientRect().top
        const windowHeight = window.innerHeight
        const visibleFooter = windowHeight - footerTop
        setBottom(visibleFooter > 0 ? visibleFooter + 16 : 24)
      })
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => { window.removeEventListener('scroll', handleScroll); cancelAnimationFrame(rafId) }
  }, [])

  return (
    <div className="fixed left-1/2 -translate-x-1/2 z-50" style={{ bottom: `${bottom}px` }}>
      <button
        onClick={onClick}
        className="flex items-center gap-2 bg-accent text-primary px-6 py-2.5 rounded-full shadow-lg hover:brightness-110 hover:scale-105 transition-all text-xs font-bold uppercase tracking-wide"
      >
        <span className="material-symbols-outlined text-base">{icon}</span>
        {label}
      </button>
    </div>
  )
}

function MiniPopup({ children, onClose }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-xs mx-4 p-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-end mb-1">
          <button onClick={onClose} className="p-0.5 hover:bg-gray-100 rounded-lg transition-colors">
            <span className="material-symbols-outlined text-gray-400 text-lg">close</span>
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

function LocationPopup({ direccion, onClose }) {
  return (
    <MiniPopup onClose={onClose}>
      <div className="flex items-start gap-2">
        <span className="material-symbols-outlined text-primary text-xl mt-0.5">location_on</span>
        <div>
          <p className="text-xs font-bold text-gray-700 mb-1">Dirección</p>
          <p className="text-xs text-gray-500">{direccion || 'No disponible'}</p>
        </div>
      </div>
    </MiniPopup>
  )
}

function SchedulePopup({ horarios, onClose }) {
  return (
    <MiniPopup onClose={onClose}>
      <div className="flex items-start gap-2">
        <span className="material-symbols-outlined text-primary text-xl mt-0.5">schedule</span>
        <div className="flex-1">
          <p className="text-xs font-bold text-gray-700 mb-2">Horarios de atención</p>
          {horarios && horarios.length > 0 ? (
            <div className="flex flex-col gap-1">
              {horarios.map((h) => (
                <div key={h.dia} className="flex items-center justify-between text-[11px]">
                  <span className={`font-semibold ${h.activo ? 'text-gray-700' : 'text-gray-400'}`}>{h.dia}</span>
                  {h.activo ? (
                    <span className="text-gray-500">{h.apertura} - {h.cierre}{h.dosTramos && h.apertura2 && h.cierre2 ? ` · ${h.apertura2} - ${h.cierre2}` : ''}</span>
                  ) : (
                    <span className="text-gray-400 italic">Cerrado</span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-400">No disponible</p>
          )}
        </div>
      </div>
    </MiniPopup>
  )
}

/* =========================================
   Página premium de una empresa
   ========================================= */
function TourModal({ tour, onClose }) {
  const [currentImg, setCurrentImg] = useState(0)
  const rawImgs = parseJSON(tour.imagenes) || []
  const imgs = rawImgs.map(img => img.startsWith('http') ? img : `${API}${img}`).filter(Boolean)
  const crops = parseJSON(tour.imagenes_crop) || []

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <h3 className="text-sm font-bold text-gray-800 truncate">{tour.nombre}</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
            <span className="material-symbols-outlined text-gray-400 text-lg">close</span>
          </button>
        </div>

        {/* Imágenes */}
        {imgs.length > 0 && (
          <div className="px-4 pt-3">
            {/* Mobile: carrusel de 1 imagen con flechas */}
            <div className="sm:hidden relative">
              <div className="rounded-lg overflow-hidden">
                <img src={imgs[currentImg]} alt={`${tour.nombre} ${currentImg + 1}`} className="w-full h-48 object-contain"
                  style={crops[currentImg] && (crops[currentImg].zoom > 1 || crops[currentImg].x || crops[currentImg].y) ? {
                    transform: `scale(${crops[currentImg].zoom}) translate(${crops[currentImg].x / crops[currentImg].zoom}px, ${crops[currentImg].y / crops[currentImg].zoom}px)`,
                    transformOrigin: 'center center',
                  } : undefined}
                />
              </div>
              {imgs.length > 1 && (
                <>
                  <button onClick={() => setCurrentImg(i => i === 0 ? imgs.length - 1 : i - 1)} className="absolute left-1 top-1/2 -translate-y-1/2 h-7 w-7 bg-white/80 backdrop-blur rounded-full flex items-center justify-center shadow text-primary">
                    <span className="material-symbols-outlined text-sm">chevron_left</span>
                  </button>
                  <button onClick={() => setCurrentImg(i => i === imgs.length - 1 ? 0 : i + 1)} className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 bg-white/80 backdrop-blur rounded-full flex items-center justify-center shadow text-primary">
                    <span className="material-symbols-outlined text-sm">chevron_right</span>
                  </button>
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {imgs.map((_, i) => (
                      <button key={i} onClick={() => setCurrentImg(i)} className={`h-1.5 rounded-full transition-all ${i === currentImg ? 'w-4 bg-primary' : 'w-1.5 bg-white/60'}`} />
                    ))}
                  </div>
                </>
              )}
            </div>
            {/* Tablet/Desktop: grid lado a lado */}
            <div className={`hidden sm:grid gap-2 ${imgs.length === 1 ? 'grid-cols-1' : imgs.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
              {imgs.map((src, i) => {
                const c = crops[i]
                return (
                  <div key={i} className="rounded-lg overflow-hidden">
                    <img src={src} alt={`${tour.nombre} ${i + 1}`} className="w-full h-36 object-contain"
                      style={c && (c.zoom > 1 || c.x || c.y) ? {
                        transform: `scale(${c.zoom}) translate(${c.x / c.zoom}px, ${c.y / c.zoom}px)`,
                        transformOrigin: 'center center',
                      } : undefined}
                    />
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Info */}
        <div className="p-4 flex flex-col gap-3">
          {tour.detalle && (
            <p className="text-xs text-slate-500 leading-relaxed">{tour.detalle}</p>
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

function CompanyDetail({ company, onBack, activeFilter, onClearFilter, initialTour, onInitialTourConsumed }) {
  const [tours, setTours] = useState([])
  const [loadingTours, setLoadingTours] = useState(true)
  const [selectedTour, setSelectedTour] = useState(null)
  const [pagina, setPagina] = useState(null)
  const [errorMsg, setErrorMsg] = useState('')

  // Abrir automáticamente el pop-up del tour seleccionado al llegar desde el icono de la tarjeta
  useEffect(() => {
    if (initialTour) {
      setSelectedTour(initialTour)
      if (onInitialTourConsumed) onInitialTourConsumed()
    }
  }, [initialTour])

  // Registrar visita a la página de turismo
  useEffect(() => {
    if (!company.userId) return
    fetch(`${API}/api/v1/analytics/track`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: company.userId, event_type: 'page_view', pagina: 'turismo' }),
    }).catch(() => {})
  }, [company.userId])

  useEffect(() => {
    if (!company.userId) {
      setTours([])
      setPagina(null)
      setLoadingTours(false)
      return
    }
    // Cargar tours y datos de página en paralelo, filtrados por userId
    Promise.all([
      fetch(`${API}/api/v1/public/tours/${company.userId}`).then(r => r.json()),
      fetch(`${API}/api/v1/public/pagina/${company.userId}`).then(r => r.json()),
    ])
      .then(([toursData, paginaData]) => {
        setTours(toursData.tours || [])
        setPagina(paginaData.pagina || null)
      })
      .catch(() => setErrorMsg('Error al cargar los datos. Intenta recargar la página.'))
      .finally(() => setLoadingTours(false))
  }, [company.userId])

  const imgSup = pagina?.imagen_superior ? `${API}${pagina.imagen_superior}` : company.images[0]
  const imgInf = pagina?.imagen_inferior ? `${API}${pagina.imagen_inferior}` : company.images[1]
  const cropSup = parseJSON(pagina?.crop_superior)
  const cropInf = parseJSON(pagina?.crop_inferior)
  const tituloSup = pagina?.titulo_superior || 'Sobre Nosotros'
  const textoSup = pagina?.texto_superior || company.description || 'Sin descripción'
  const tituloInf = pagina?.titulo_inferior || 'Datos de la Empresa'
  const textoInf = pagina?.texto_inferior || null

  return (
    <div className="flex flex-col gap-8 relative pb-16">
      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-2 flex items-center gap-2">
          <span className="material-symbols-outlined text-base">error</span>
          {errorMsg}
        </div>
      )}

      {/* Título */}
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="w-1 h-5 sm:h-6 bg-accent rounded-full"></div>
        <h2 className="text-sm sm:text-base md:text-lg font-bold text-slate-700 tracking-wide">{company.name}</h2>
        <div className="flex-1 h-px bg-slate-200"></div>
      </div>

      {/* Fila 1: Imagen izquierda + Texto derecho — solo si hay página personalizada */}
      {pagina && (
      <div className="flex flex-col-reverse md:flex-row gap-4 sm:gap-6 items-center">
        {imgSup && (
          <div className="w-full md:w-1/2 rounded-xl overflow-hidden shadow-md bg-slate-50">
            <img src={imgSup} alt={company.name} className="w-full h-44 sm:h-52 md:h-64 object-cover"
              style={cropSup && (cropSup.zoom > 1 || cropSup.x || cropSup.y) ? {
                transform: `scale(${cropSup.zoom}) translate(${cropSup.x / cropSup.zoom}px, ${cropSup.y / cropSup.zoom}px)`,
                transformOrigin: 'center center',
              } : undefined}
            />
          </div>
        )}
        <div className={imgSup ? 'md:w-1/2 flex flex-col' : 'w-full flex flex-col'}>
          <h3 className="text-sm font-black text-primary mb-2">{tituloSup}</h3>
          <p className="text-xs text-slate-500 leading-relaxed">{textoSup}</p>
        </div>
      </div>
      )}

      {/* Botón flotante "Ver todos" cuando hay filtro activo */}
      {activeFilter && !loadingTours && (
        <div className="sticky top-16 z-30 flex justify-center -mb-4">
          <button
            onClick={() => onClearFilter && onClearFilter()}
            className="flex items-center gap-1.5 bg-primary text-white px-4 py-2 rounded-full shadow-lg hover:bg-primary/90 transition-all text-xs font-bold"
          >
            <span className="material-symbols-outlined text-sm">filter_list_off</span>
            Ver todos los tours
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}

      {/* Tours / Panoramas — solo si hay tours o están cargando */}
      {(loadingTours || tours.length > 0) && (
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-1 h-5 bg-accent rounded-full"></div>
          <h3 className="text-sm font-black text-primary uppercase tracking-wide">
            {activeFilter ? `${activeFilter}` : 'Panoramas y Salidas'}
          </h3>
          <div className="flex-1 h-px bg-slate-200"></div>
        </div>

        {loadingTours ? (
          <div className="flex items-center justify-center py-10">
            <span className="material-symbols-outlined text-primary text-2xl animate-spin">progress_activity</span>
          </div>
        ) : (() => {
          const visibleTours = activeFilter
            ? tours.filter(t => t.categoria && t.categoria.toLowerCase() === activeFilter.toLowerCase())
            : tours
          return visibleTours.length === 0 ? (
            <p className="text-center text-slate-400 text-xs py-6">No hay tours en esta categoría.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 sm:gap-3">
              {visibleTours.map((tour) => {
                const imgIdx = tour.imagen_principal || 0
                const tourImgs = parseJSON(tour.imagenes) || []
                const tourCrops = parseJSON(tour.imagenes_crop) || []
                const imagen = tourImgs[imgIdx]
                  ? `${API}${tourImgs[imgIdx]}`
                  : (tourImgs[0] ? `${API}${tourImgs[0]}` : null)
                const imgCrop = tourCrops[imgIdx] || null
                return (
                  <div
                    key={tour.id}
                    onClick={() => setSelectedTour(tour)}
                    className="cursor-pointer group rounded-xl overflow-hidden shadow-sm border border-slate-100 hover:shadow-md transition-shadow"
                  >
                    {imagen ? (
                      <img src={imagen} alt={tour.nombre} className="w-full h-32 object-contain"
                        style={imgCrop && (imgCrop.zoom > 1 || imgCrop.x || imgCrop.y) ? {
                          transform: `scale(${imgCrop.zoom}) translate(${imgCrop.x / imgCrop.zoom}px, ${imgCrop.y / imgCrop.zoom}px)`,
                          transformOrigin: 'center center',
                        } : undefined}
                      />
                    ) : (
                      <div className="w-full h-32 bg-slate-50 flex items-center justify-center">
                        <span className="material-symbols-outlined text-3xl text-slate-200">image</span>
                      </div>
                    )}
                    <p className="text-[11px] font-semibold text-slate-600 text-center py-2 px-1 truncate">{tour.nombre}</p>
                  </div>
                )
              })}
            </div>
          )
        })()}
      </div>
      )}

      {/* Fila 2: Texto + Imagen, y debajo Contacto | Horarios */}
      {pagina && (
      <div className="flex flex-col gap-4 sm:gap-6">
        {/* Arriba: texto izquierda + imagen derecha */}
        <div className="flex flex-col md:flex-row gap-4 sm:gap-6 items-center">
          <div className={imgInf ? 'w-full md:w-1/2 flex flex-col' : 'w-full flex flex-col'}>
            <h3 className="text-sm font-black text-primary mb-2">{tituloInf}</h3>
            {textoInf && <p className="text-xs text-slate-500 leading-relaxed">{textoInf}</p>}
          </div>
          {imgInf && (
            <div className="w-full md:w-1/2 rounded-xl overflow-hidden shadow-md bg-slate-50">
              <img src={imgInf} alt={company.name} className="w-full h-44 sm:h-52 md:h-64 object-cover"
                style={cropInf && (cropInf.zoom > 1 || cropInf.x || cropInf.y) ? {
                  transform: `scale(${cropInf.zoom}) translate(${cropInf.x / cropInf.zoom}px, ${cropInf.y / cropInf.zoom}px)`,
                  transformOrigin: 'center center',
                } : undefined}
              />
            </div>
          )}
        </div>

        {/* Abajo: dos columnas — Contacto | Horarios */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          {/* Columna Contacto */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-accent text-base">contact_phone</span>
              <h4 className="text-xs font-black text-primary uppercase tracking-wide">Contacto</h4>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
              {company.direccion && (
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-accent text-sm">location_on</span>
                  <span className="text-[11px] text-slate-600">{company.direccion}</span>
                </div>
              )}
              {company.telefono && (
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-accent text-sm">call</span>
                  <span className="text-[11px] text-slate-600">{company.telefono}</span>
                </div>
              )}
              {company.whatsapp && (
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-accent text-sm">chat</span>
                  <span className="text-[11px] text-slate-600">{company.whatsapp}</span>
                </div>
              )}
              {company.correo && (
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-accent text-sm">mail</span>
                  <span className="text-[11px] text-slate-600">{company.correo}</span>
                </div>
              )}
              {(company.facebook || company.instagram) && (
                <div className="flex items-center gap-3 mt-1">
                  {company.facebook && (
                    <a href={company.facebook.startsWith('http') ? company.facebook : `https://${company.facebook}`} target="_blank" rel="noopener noreferrer" className="hover:scale-110 transition-transform" title="Facebook">
                      <svg className="w-5 h-5 fill-current text-[#1877F2]" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                    </a>
                  )}
                  {company.instagram && (
                    <a href={company.instagram.startsWith('http') ? company.instagram : `https://instagram.com/${company.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="hover:scale-110 transition-transform" title="Instagram">
                      <svg className="w-5 h-5" viewBox="0 0 24 24"><defs><linearGradient id="ig-detail" x1="0%" y1="100%" x2="100%" y2="0%"><stop offset="0%" style={{stopColor:'#feda75'}}/><stop offset="25%" style={{stopColor:'#fa7e1e'}}/><stop offset="50%" style={{stopColor:'#d62976'}}/><stop offset="75%" style={{stopColor:'#962fbf'}}/><stop offset="100%" style={{stopColor:'#4f5bd5'}}/></linearGradient></defs><path fill="url(#ig-detail)" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Columna Horarios */}
          {company.horarios && company.horarios.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-accent text-base">schedule</span>
              <h4 className="text-xs font-black text-primary uppercase tracking-wide">Horarios de atención</h4>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
              {company.horarios.map(h => (
                <div key={h.dia} className="flex items-center justify-between text-[11px]">
                  <span className={`font-semibold ${h.activo ? 'text-slate-700' : 'text-slate-400'}`}>{h.dia}</span>
                  {h.activo ? (
                    <span className="text-slate-500">{h.apertura} - {h.cierre}{h.dosTramos && h.apertura2 && h.cierre2 ? ` · ${h.apertura2} - ${h.cierre2}` : ''}</span>
                  ) : (
                    <span className="text-slate-400 italic">Cerrado</span>
                  )}
                </div>
              ))}
            </div>
          </div>
          )}
        </div>
      </div>
      )}

      {/* Modal detalle tour */}
      {selectedTour && (
        <TourModal tour={selectedTour} onClose={() => setSelectedTour(null)} />
      )}

      {/* Botón flotante volver */}
      <FloatingButton label="Volver a Turismo" icon="arrow_back" onClick={onBack} />
    </div>
  )
}

/* =========================================
   Página principal de turismo
   ========================================= */
export default function TourismPage({ activeFilter, onClearFilter, onEmpresaCategorias, initialUserId, onInitialUserConsumed, initialTour, onInitialTourConsumed, resetKey, scrollToUserId, onScrollConsumed, onBack }) {
  const [empresas, setEmpresas] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCompany, setSelectedCompany] = useState(null)
  const [popup, setPopup] = useState(null)
  const [errorMsg, setErrorMsg] = useState('')
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
    fetch(`${API}/api/v1/public/portadas`)
      .then(r => r.json())
      .then(data => {
        if (data.portadas && data.portadas.length > 0) {
          const mapped = data.portadas.map(p => ({
            id: p.id,
            userId: p.usuario_id,
            name: p.nombre_negocio || 'Sin nombre',
            description: p.descripcion || '',
            ubicacion: p.ubicacion || '',
            images: (p.imagenes || []).map(img => `${API}${img}`),
            imagesCrop: p.imagenes_crop || [],
            subcategories: p.categorias || [],
            direccion: p.direccion || '',
            horarios: p.horarios || [],
            telefono: p.telefono || '',
            whatsapp: p.whatsapp || '',
            correo: p.correo || '',
            facebook: p.facebook || '',
            instagram: p.instagram || '',
            planId: p.plan_id || 1,
          }))
          setEmpresas(mapped)
        } else {
          setEmpresas([])
        }
      })
      .catch(() => setEmpresas([]))
      .finally(() => setLoading(false))
  }, [])

  // Volver a la lista principal cuando se clickea "Turismo" en el nav
  useEffect(() => {
    setSelectedCompany(null)
  }, [resetKey])

  // Auto-seleccionar empresa si viene initialUserId
  useEffect(() => {
    if (!initialUserId || loading) return
    const match = empresas.find(e => e.userId === initialUserId)
    if (match) {
      setSelectedCompany(match)
      if (onInitialUserConsumed) onInitialUserConsumed()
    } else {
      // Si no está en el listado público, cargar directamente desde la API
      Promise.all([
        fetch(`${API}/api/v1/public/portadas`).then(r => r.json()),
        fetch(`${API}/api/v1/public/business/${initialUserId}`).then(r => r.ok ? r.json() : null).catch(() => null),
      ]).then(([portadasData, bizData]) => {
        const portada = (portadasData.portadas || []).find(p => p.usuario_id === initialUserId)
        if (portada) {
          setSelectedCompany({
            id: portada.id,
            userId: portada.usuario_id,
            name: portada.nombre_negocio || 'Sin nombre',
            description: portada.descripcion || '',
            ubicacion: portada.ubicacion || '',
            images: (portada.imagenes || []).map(img => `${API}${img}`),
            imagesCrop: portada.imagenes_crop || [],
            subcategories: portada.categorias || [],
            direccion: portada.direccion || '',
            horarios: portada.horarios || [],
            telefono: portada.telefono || '',
            whatsapp: portada.whatsapp || '',
            correo: portada.correo || '',
            facebook: portada.facebook || '',
            instagram: portada.instagram || '',
            planId: portada.plan_id || 1,
          })
        } else {
          const b = bizData?.business || {}
          setSelectedCompany({
            id: `direct-${initialUserId}`,
            userId: initialUserId,
            name: b.nombre_negocio || 'Mi Negocio',
            description: b.descripcion || '',
            ubicacion: b.ubicacion || '',
            images: [],
            imagesCrop: [],
            subcategories: [],
            direccion: b.direccion || '',
            horarios: b.horarios || [],
            telefono: b.telefono || '',
            whatsapp: b.whatsapp || '',
            correo: b.correo || '',
            facebook: b.facebook || '',
            instagram: b.instagram || '',
            planId: 3,
          })
        }
        if (onInitialUserConsumed) onInitialUserConsumed()
      })
    }
  }, [initialUserId, empresas, loading])

  // Solo cerrar empresa si se filtra y NO hay empresa seleccionada (listado general)
  // Si hay empresa seleccionada, el filtro resalta tours, no cierra la página
  useEffect(() => {
    if (activeFilter && !selectedCompany) setSelectedCompany(null)
  }, [activeFilter])

  // Cuando se selecciona/deselecciona empresa, actualizar categorías del sidebar
  useEffect(() => {
    if (onEmpresaCategorias) {
      if (selectedCompany) {
        onEmpresaCategorias(selectedCompany.subcategories || [])
      } else {
        onEmpresaCategorias(null) // null = restaurar categorías globales
      }
    }
  }, [selectedCompany])

  // Scroll hasta la portada del usuario cuando viene del admin
  useEffect(() => {
    if (!scrollToUserId || loading) return
    const el = document.getElementById(`turismo-card-${scrollToUserId}`)
    if (el) {
      setTimeout(() => {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        el.classList.add('ring-2', 'ring-accent', 'ring-offset-2')
        setTimeout(() => el.classList.remove('ring-2', 'ring-accent', 'ring-offset-2'), 3000)
      }, 300)
    }
    if (onScrollConsumed) onScrollConsumed()
  }, [scrollToUserId, loading, empresas])

  const trackCardClick = (userId) => {
    fetch(`${API}/api/v1/analytics/track`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, event_type: 'card_click' }),
    }).catch(() => {})
  }

  const filteredCompanies = (activeFilter
    ? empresas.filter((c) => c.subcategories.includes(activeFilter))
    : empresas
  )
    // Las empresas Premium turismo (plan 5) siempre primero; Gratuito turismo (plan 4) al final
    .slice()
    .sort((a, b) => (b.planId >= 5 ? 1 : 0) - (a.planId >= 5 ? 1 : 0))

  if (loading || (initialUserId && !selectedCompany)) {
    return (
      <div className="flex items-center justify-center py-20">
        <span className="material-symbols-outlined text-primary text-3xl animate-spin">progress_activity</span>
      </div>
    )
  }

  // Vista de empresa seleccionada
  if (selectedCompany) {
    // Plan 4 = Gratuito turismo: no tienen página de detalle activa
    if (selectedCompany.planId < 5) {
      return (
        <div className="flex flex-col items-center justify-center gap-6 py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center">
            <span className="material-symbols-outlined text-3xl text-amber-400">lock</span>
          </div>
          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-bold text-slate-700">{selectedCompany.name}</h3>
            <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
              Esta empresa aún no tiene su página de turismo activada. Próximamente podrás ver sus tours y experiencias aquí.
            </p>
          </div>
          <button
            onClick={() => { setSelectedCompany(null); if (onClearFilter) onClearFilter(); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
            className="flex items-center gap-1.5 bg-primary text-white px-5 py-2 rounded-lg text-xs font-bold hover:bg-primary/90 transition-colors"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Volver a Turismo
          </button>
        </div>
      )
    }
    return (
      <CompanyDetail
        company={selectedCompany}
        activeFilter={activeFilter}
        onClearFilter={onClearFilter}
        initialTour={initialTour}
        onInitialTourConsumed={onInitialTourConsumed}
        onBack={() => {
          setSelectedCompany(null)
          if (onClearFilter) onClearFilter()
          window.scrollTo({ top: 0, behavior: 'smooth' })
        }}
      />
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {scrolled && onBack && (
        <button
          onClick={onBack}
          aria-label="Inicio"
          className="sm:hidden fixed right-3 z-50 flex items-center justify-center h-11 w-11 rounded-full bg-accent text-primary shadow-lg hover:brightness-110 active:scale-95 transition-all"
          style={{ top: headerH + 10 }}
        >
          <span className="material-symbols-outlined text-xl">home</span>
        </button>
      )}
      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-2 flex items-center gap-2">
          <span className="material-symbols-outlined text-base">error</span>
          {errorMsg}
        </div>
      )}

      <div className="flex items-center gap-2 sm:gap-3 mb-2">
        <div className="w-1 h-5 sm:h-6 bg-accent rounded-full"></div>
        <h2 className="text-sm sm:text-base md:text-lg font-bold text-slate-700 tracking-wide">
          {activeFilter ? `Turismo — ${activeFilter}` : 'Turismo y Experiencias en Villarrica'}
        </h2>
        {activeFilter && (
          <span className="text-[10px] text-slate-400">{filteredCompanies.length} {filteredCompanies.length === 1 ? 'empresa' : 'empresas'}</span>
        )}
        <div className="flex-1 h-px bg-slate-200"></div>
        {onBack && (
          <button
            onClick={onBack}
            aria-label="Inicio"
            className="sm:hidden shrink-0 flex items-center justify-center h-7 w-7 rounded-full bg-accent text-primary shadow hover:brightness-110 active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-base">home</span>
          </button>
        )}
      </div>

      {filteredCompanies.length === 0 && (
        <p className="text-center text-slate-400 text-xs mt-8">No hay empresas con esta actividad.</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 md:gap-5">
        {filteredCompanies.map((company) => (
          <div
            key={company.id}
            id={`turismo-card-${company.userId}`}
            className="flex flex-row bg-white rounded-xl sm:rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow border border-slate-100 p-3 sm:p-4 md:p-5 gap-3 sm:gap-4 items-stretch min-h-[195px] sm:min-h-0 transition-all duration-500"
          >
            <div className="flex-1 flex flex-col min-w-0">
              <div className="flex items-center gap-1.5 mb-1">
                <span
                  className="material-symbols-outlined text-slate-400 text-sm sm:text-base cursor-pointer hover:text-primary transition-colors"
                  onClick={() => { trackCardClick(company.userId); setPopup({ type: 'location', data: company.direccion }) }}
                >location_on</span>
                <span
                  className="material-symbols-outlined text-slate-400 text-sm sm:text-base cursor-pointer hover:text-primary transition-colors"
                  onClick={() => { trackCardClick(company.userId); setPopup({ type: 'schedule', data: company.horarios }) }}
                >schedule</span>
              </div>
              <h3 className="text-sm sm:text-base md:text-lg font-black text-primary mb-0.5">{company.name}</h3>
              {company.ubicacion && (
                <div className="flex items-center gap-1 mb-1">
                  <span className="material-symbols-outlined text-accent text-sm">pin_drop</span>
                  <span className="text-[10px] text-slate-500">{company.ubicacion}</span>
                </div>
              )}
              <p className="text-[10px] sm:text-xs text-slate-500 leading-relaxed mb-2 sm:mb-3 line-clamp-5 sm:line-clamp-3">{company.description}</p>
              {/* Categorías — solo mobile, fila horizontal scrolleable */}
              {company.subcategories && company.subcategories.length > 0 && (
                <div className="sm:hidden flex items-center gap-1 overflow-x-auto mb-2 w-full" style={{ scrollbarWidth: 'none' }}>
                  {company.subcategories.map((cat) => (
                    <span key={cat} className="shrink-0 text-[9px] font-semibold px-2 py-0.5 rounded-full border whitespace-nowrap" style={{ color: '#3B1969', background: 'rgba(59,25,105,0.07)', borderColor: 'rgba(59,25,105,0.15)' }}>
                      {cat}
                    </span>
                  ))}
                </div>
              )}
              <div className="mt-auto flex items-center gap-2 sm:gap-3">
                {company.planId >= 5 && (
                  <button
                    onClick={() => {
                      trackCardClick(company.userId)
                      setSelectedCompany(company)
                      window.scrollTo({ top: 0, behavior: 'smooth' })
                    }}
                    className="bg-primary hover:bg-primary-light text-white px-5 sm:px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wide transition-all hover:scale-105 flex items-center gap-1.5 whitespace-nowrap"
                  >
                    <span className="material-symbols-outlined text-sm">visibility</span>
                    Ver más
                  </button>
                )}
                {(company.telefono || company.whatsapp) && (
                  <a
                    href={company.whatsapp
                      ? `https://wa.me/${company.whatsapp.replace(/[^0-9]/g, '')}`
                      : `tel:${company.telefono}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => trackCardClick(company.userId)}
                    className="border border-primary/20 text-primary px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wide hover:bg-primary/5 transition-all flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-sm">{company.whatsapp ? 'chat' : 'call'}</span>
                    Contactar
                  </a>
                )}
              </div>
            </div>

            <div className="shrink-0 flex flex-col items-center">
              <CardFan images={company.images} crops={company.imagesCrop} />
              <div className="hidden sm:flex flex-wrap justify-center items-start content-start gap-x-1 gap-y-0.5 sm:-mt-2 max-w-[200px] md:max-w-[250px]">
                {company.subcategories && company.subcategories.length > 0 && company.subcategories.map((cat, i) => (
                  <span key={cat} className="flex items-center gap-0.5 sm:gap-1">
                    {i > 0 && <span className="text-[5px] sm:text-[6px] text-slate-300">●</span>}
                    <span className="text-[10px] sm:text-[9px] text-slate-400 font-medium">{cat}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Popups */}
      {popup && popup.type === 'location' && (
        <LocationPopup direccion={popup.data} onClose={() => setPopup(null)} />
      )}
      {popup && popup.type === 'schedule' && (
        <SchedulePopup horarios={popup.data} onClose={() => setPopup(null)} />
      )}

      {activeFilter && onClearFilter && (
        <FloatingButton label="Quitar filtro" icon="close" onClick={onClearFilter} />
      )}
    </div>
  )
}

