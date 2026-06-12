import { useState, useEffect, useRef, useCallback } from 'react'
import ProductCard from './ProductCard'
import StoreServicesCollage from './StoreServicesCollage'
import { softenColor, menuAccent, getStoreHeaderStyle } from '../lib/storeHeaderPresets'

const API = import.meta.env.VITE_API || ''

function trackClick(userId, listingId) {
  if (!userId) return
  fetch(`${API}/api/v1/analytics/track`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId, event_type: 'product_click', listing_id: listingId || null }),
  }).catch(() => {})
}

export function StoreFooter({ store }) {
  const waPhone = (store.phone || '').replace(/[\s+]/g, '')
  const igUrl = store.instagram ? (store.instagram.startsWith('http') ? store.instagram : `https://instagram.com/${store.instagram.replace('@', '')}`) : null
  const horarios = Array.isArray(store.horarios) && store.horarios.length > 0 ? store.horarios : null
  const hasRedes = store.facebook || igUrl
  // El footer toma el mismo color que el usuario eligió para el header (sin cambiar su diseño)
  const hdr = getStoreHeaderStyle(store)

  return (
    <footer className="text-white px-4 sm:px-6 md:px-10 py-3 sm:py-4 md:py-2.5" style={{ backgroundColor: hdr.color }}>
      {/* Fila 1: Nombre + Redes sociales centrados (solo móvil; en escritorio van como 1ª columna) */}
      <div className="text-center mb-2.5 sm:mb-3 md:mb-2 sm:hidden">
        <h3 className="text-xs sm:text-sm md:text-base font-black italic tracking-tight leading-tight">{store.name || 'Mi Tienda'}</h3>
        {hasRedes && (
          <div className="flex items-center justify-center gap-3 mt-2">
            {store.facebook && (
              <a href={store.facebook} target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity" title="Facebook">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 fill-current text-[#1877F2]" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              </a>
            )}
            {igUrl && (
              <a href={igUrl} target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity" title="Instagram">
                <svg className="w-5 h-5 sm:w-6 sm:h-6" viewBox="0 0 24 24"><defs><linearGradient id="ig-store" x1="0%" y1="100%" x2="100%" y2="0%"><stop offset="0%" style={{stopColor:'#feda75'}}/><stop offset="25%" style={{stopColor:'#fa7e1e'}}/><stop offset="50%" style={{stopColor:'#d62976'}}/><stop offset="75%" style={{stopColor:'#962fbf'}}/><stop offset="100%" style={{stopColor:'#4f5bd5'}}/></linearGradient></defs><path fill="url(#ig-store)" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
              </a>
            )}
          </div>
        )}
      </div>

      {/* Separador (solo móvil) */}
      <div className="h-px bg-white/10 mb-2.5 sm:mb-3 md:mb-2 sm:hidden"></div>

      {/* MOBILE: Descripción arriba + Contacto|Horarios en 2 cols */}
      <div className="sm:hidden">
        <div className="text-center mb-3">
          <h4 className="text-[9px] font-black uppercase tracking-widest text-accent mb-1">Sobre nosotros</h4>
          <p className="text-white/50 text-[9px] leading-relaxed text-justify">{store.description || 'Bienvenido a nuestra tienda.'}</p>
        </div>
        <div className={`grid gap-3 ${horarios ? 'grid-cols-2' : 'grid-cols-1'}`}>
          <div className="flex justify-center">
            <div>
              <h4 className="text-[9px] font-black uppercase tracking-widest text-accent mb-1 text-center">Contacto</h4>
              <ul className="space-y-0.5 text-[8px] text-white/50">
                {store.email && (
                  <li className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-accent text-[10px]">mail</span>
                    {store.email}
                  </li>
                )}
                {store.phone && (
                  <li className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-accent text-[10px]">call</span>
                    {store.phone}
                  </li>
                )}
                {store.address && (
                  <li className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-accent text-[10px]">location_on</span>
                    {store.address}
                  </li>
                )}
              </ul>
            </div>
          </div>
          {horarios && (
            <div className="flex justify-center">
              <div>
                <h4 className="text-[9px] font-black uppercase tracking-widest text-accent mb-1 text-center">Horarios</h4>
                <div className="grid grid-cols-2 gap-x-2 gap-y-0 text-[8px] text-white/50">
                  {horarios.map((h) => (
                    <div key={h.dia} className="flex gap-1">
                      <span className="font-medium text-white/40 w-6">{h.dia.slice(0, 3)}</span>
                      {h.activo ? <span className="text-white/60">{h.apertura}-{h.cierre}</span> : <span className="text-white/30 italic">Cerrado</span>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* TABLET/DESKTOP: 4 columnas — Nombre+Redes | Contacto | Sobre nosotros | Horarios */}
      <div className="hidden sm:grid grid-cols-4 gap-6 w-full items-start">
        {/* Nombre + Redes sociales */}
        <div className="flex justify-center">
          <div className="text-center">
            <h3 className="text-sm md:text-base font-black italic tracking-tight leading-tight mb-2">{store.name || 'Mi Tienda'}</h3>
            {hasRedes && (
              <div className="flex items-center justify-center gap-3">
                {store.facebook && (
                  <a href={store.facebook} target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity" title="Facebook">
                    <svg className="w-5 h-5 md:w-6 md:h-6 fill-current text-[#1877F2]" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                  </a>
                )}
                {igUrl && (
                  <a href={igUrl} target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity" title="Instagram">
                    <svg className="w-5 h-5 md:w-6 md:h-6" viewBox="0 0 24 24"><defs><linearGradient id="ig-store-col" x1="0%" y1="100%" x2="100%" y2="0%"><stop offset="0%" style={{stopColor:'#feda75'}}/><stop offset="25%" style={{stopColor:'#fa7e1e'}}/><stop offset="50%" style={{stopColor:'#d62976'}}/><stop offset="75%" style={{stopColor:'#962fbf'}}/><stop offset="100%" style={{stopColor:'#4f5bd5'}}/></linearGradient></defs><path fill="url(#ig-store-col)" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                  </a>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Sobre nosotros */}
        <div className="flex justify-center">
          <div>
            <h4 className="text-[10px] font-black uppercase tracking-widest text-accent mb-1.5 text-center">Sobre nosotros</h4>
            <p className="text-white/50 text-[10px] leading-relaxed">{store.description || 'Bienvenido a nuestra tienda.'}</p>
          </div>
        </div>

        {/* Contacto */}
        <div className="flex justify-center">
          <div>
            <h4 className="text-[10px] font-black uppercase tracking-widest text-accent mb-1.5 text-center">Contacto</h4>
            <ul className="space-y-0.5 text-[10px] text-white/50">
              {store.email && (
                <li className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-accent text-xs">mail</span>
                  {store.email}
                </li>
              )}
              {store.phone && (
                <li className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-accent text-xs">call</span>
                  {store.phone}
                </li>
              )}
              {store.address && (
                <li className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-accent text-xs">location_on</span>
                  {store.address}
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Horarios */}
        <div className="flex justify-center">
          <div>
            <h4 className="text-[10px] font-black uppercase tracking-widest text-accent mb-1.5 text-center">Horarios</h4>
            {horarios ? (
              <div className="grid grid-cols-2 gap-x-3 gap-y-0 text-[9px] text-white/50">
                {horarios.map((h) => (
                  <div key={h.dia} className="flex gap-1">
                    <span className="font-medium text-white/40 w-7">{h.dia.slice(0, 3)}</span>
                    {h.activo ? <span className="text-white/60">{h.apertura}-{h.cierre}</span> : <span className="text-white/30 italic">Cerrado</span>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[9px] text-white/30 italic">No disponible</p>
            )}
          </div>
        </div>
      </div>
    </footer>
  )
}

function getWhatsAppUrl(product, phone) {
  const p = phone ? phone.replace(/[\s+]/g, '') : ''
  if (!p) return null
  const msg = `Hola! Me interesa este producto:\n\n*${product.name}*\n${product.price ? `Precio: $${product.price.toLocaleString('es-CL', { maximumFractionDigits: 0 })}` : ''}\n\n${product.image}`
  return `https://wa.me/${p}?text=${encodeURIComponent(msg)}`
}

function MarqueeModal({ product, phone, onClose }) {
  return (
    <div className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex: 10000 }} onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
      <div
        className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-2 right-2 z-10 h-6 w-6 bg-white/80 backdrop-blur rounded-full flex items-center justify-center hover:bg-slate-100 transition-colors">
          <span className="material-symbols-outlined text-slate-600 text-sm">close</span>
        </button>
        <div className="flex flex-col md:flex-row md:min-h-[220px]">
          <div className="md:w-[50%] h-64 md:h-auto shrink-0 p-1">
            <img src={product.image} alt={product.alt || product.name} className="w-full h-full object-cover rounded-tr-xl bg-slate-100" />
          </div>
          <div className="md:w-[50%] p-3 flex flex-col flex-1">
            <h3 className="text-sm font-black text-primary text-center mb-2 shrink-0 line-clamp-2">
              {(() => {
                const words = product.name.split(' ')
                if (words.length <= 2) return product.name
                return <>{words.slice(0, 2).join(' ')}<br />{words.slice(2).join(' ')}</>
              })()}
            </h3>
            {product.badge && (
              <div className="flex justify-center mb-2 shrink-0">
                <span className="text-[9px] font-bold bg-primary text-white px-2 py-0.5 rounded-full">{product.badge}</span>
              </div>
            )}
            <div className="flex-1 flex items-center min-h-0 my-1">
              <div className="w-full max-h-full overflow-y-auto">
                <p className="text-[10px] text-slate-500 leading-relaxed text-center">{product.description}</p>
              </div>
            </div>

            {product.tallas && product.tallas.seleccion && product.tallas.seleccion.length > 0 && (
              <div className="mb-2 shrink-0">
                <p className="text-[9px] font-bold text-slate-600 mb-1">Tallas disponibles:</p>
                <div className="flex flex-wrap gap-1">
                  {product.tallas.seleccion.map((t) => (
                    <span key={t} className="text-[9px] font-semibold px-1.5 py-0.5 rounded border border-primary/20 bg-primary/5 text-primary">{t}</span>
                  ))}
                </div>
              </div>
            )}

            {product.medidas && (product.medidas.alto || product.medidas.ancho || product.medidas.profundidad) && (
              <div className="mb-2 shrink-0">
                <p className="text-[9px] font-bold text-slate-600 mb-1">Medidas:</p>
                <div className="flex gap-2 text-[9px] text-slate-500">
                  {product.medidas.alto && <span>Alto: {product.medidas.alto}cm</span>}
                  {product.medidas.ancho && <span>Ancho: {product.medidas.ancho}cm</span>}
                  {product.medidas.profundidad && <span>Prof: {product.medidas.profundidad}cm</span>}
                </div>
              </div>
            )}

            {product.genero && (
              <p className="text-[9px] text-slate-400 mb-2 shrink-0">Género: {product.genero}</p>
            )}

            <div className="pt-2 flex items-center gap-2 shrink-0">
              {product.originalPrice && (
                <p className="text-[10px] font-bold text-slate-400 line-through">
                  ${product.originalPrice.toLocaleString('es-CL', { maximumFractionDigits: 0 })}
                </p>
              )}
              {product.price > 0 && (
                <p className="text-sm font-black text-primary">
                  ${product.price.toLocaleString('es-CL', { maximumFractionDigits: 0 })}
                </p>
              )}
            </div>
          </div>
        </div>
        <div className="border-t border-slate-100 px-3 py-2 flex items-center justify-end">
          <div className="flex items-center gap-1.5">
            {getWhatsAppUrl(product, phone) && (
              <a href={getWhatsAppUrl(product, phone)} target="_blank" rel="noopener noreferrer" className="h-7 w-7 rounded-lg bg-green-500/10 hover:bg-green-500 hover:text-white text-green-600 flex items-center justify-center transition-all" title="WhatsApp">
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.5.5 0 00.611.611l4.458-1.495A11.943 11.943 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-2.347 0-4.522-.809-6.236-2.164l-.436-.35-3.233 1.084 1.084-3.233-.35-.436A9.956 9.956 0 012 12C2 6.486 6.486 2 12 2s10 4.486 10 10-4.486 10-10 10z"/></svg>
              </a>
            )}
            <button className="h-7 w-7 rounded-lg bg-primary/10 hover:bg-primary hover:text-white text-primary flex items-center justify-center transition-all" title="Ubicación">
              <span className="material-symbols-outlined text-sm">location_on</span>
            </button>
            <button className="h-7 w-7 rounded-lg bg-primary/10 hover:bg-primary hover:text-white text-primary flex items-center justify-center transition-all" title="Teléfono">
              <span className="material-symbols-outlined text-sm">call</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function StoreCarousel({ title, items, onOpenStore }) {
  const mobileScrollRef = useRef(null)
  const desktopScrollRef = useRef(null)
  const intervalRef = useRef(null)

  const featuredItem = items.find(p => p.owner_plan_id && p.owner_plan_id >= 2) || null
  const restItems = featuredItem ? items.filter(p => p !== featuredItem) : items

  const getScrollEl = () => {
    if (window.innerWidth < 640 && mobileScrollRef.current) return mobileScrollRef.current
    return desktopScrollRef.current
  }

  const scrollOne = useCallback((direction) => {
    const el = getScrollEl()
    if (!el) return
    const cardW = el.querySelector(':first-child')?.offsetWidth || 200
    el.scrollBy({ left: direction === 'left' ? -(cardW + 8) : (cardW + 8), behavior: 'smooth' })
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
    }, 5000)
  }, [scrollOne])

  useEffect(() => {
    if (items.length > 0) resetAutoScroll()
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [resetAutoScroll, items.length])

  const featuredWidth = 'w-[calc(33.33%-6px)] sm:w-[calc(25%-12px)] md:w-[calc(16.66%-14px)]'
  const carouselCardWidth = 'w-[calc(50%-4px)] sm:w-[calc(33.33%-12px)] md:w-[calc(20%-14px)]'

  if (items.length === 0) return null

  return (
    <div>
      {title && (
        <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4 md:mb-6">
          <div className="w-1 h-4 sm:h-5 bg-accent rounded-full"></div>
          <h2 className="text-xs sm:text-sm font-bold text-slate-700 tracking-wide">{title}</h2>
          <div className="flex-1 h-px bg-slate-200"></div>
        </div>
      )}

      {/* MOBILE: carrusel horizontal, 2 por fila */}
      <div className="sm:hidden relative group/carousel">
        <div ref={mobileScrollRef} className="flex gap-2 overflow-x-hidden scroll-smooth py-1 px-1">
          {items.map((product) => (
            <div key={product.id} className="shrink-0 w-[calc(50%-4px)]">
              <ProductCard product={product} onOpenStore={onOpenStore} inStorePage />
            </div>
          ))}
        </div>
      </div>

      {/* TABLET/DESKTOP: destacada fija + carrusel */}
      <div className="hidden sm:flex gap-3 md:gap-4 py-1 px-1">
        <div className={`shrink-0 ${featuredWidth} transition-all duration-300`}>
          {featuredItem ? (
            <ProductCard product={featuredItem} isFirst onOpenStore={onOpenStore} inStorePage />
          ) : (
            <ProductCard product={items[0]} isFirst onOpenStore={onOpenStore} inStorePage />
          )}
        </div>

        {restItems.length > 0 && (
          <div className="relative group/carousel flex-1 min-w-0">
            <button onClick={() => scroll('left')} className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-9 w-9 md:h-10 md:w-10 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-lg text-primary hover:bg-primary hover:text-white transition-all opacity-0 group-hover/carousel:opacity-100">
              <span className="material-symbols-outlined text-base md:text-lg">chevron_left</span>
            </button>
            <button onClick={() => scroll('right')} className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-9 w-9 md:h-10 md:w-10 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-lg text-primary hover:bg-primary hover:text-white transition-all opacity-0 group-hover/carousel:opacity-100">
              <span className="material-symbols-outlined text-base md:text-lg">chevron_right</span>
            </button>
            <div ref={desktopScrollRef} className="flex gap-3 md:gap-4 overflow-x-hidden scroll-smooth">
              {restItems.map((product) => (
                <div key={product.id} className={`shrink-0 ${carouselCardWidth} transition-all duration-300`}>
                  <ProductCard product={product} onOpenStore={onOpenStore} inStorePage />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export function StoreBanner({ store, products, bannerItems, phone, storeUserId }) {
  const [activeSlide, setActiveSlide] = useState(0)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const intervalRef = useRef(null)
  const mobileScrollRef = useRef(null)
  // Fondo del banner configurable desde Apariencia ('transparent' o un color)
  const bannerBg = store?.banner_color || '#1a1220'

  // Solo mostrar banner si el admin configuró items con banner_orden
  if (!bannerItems || bannerItems.length === 0) return null
  const slide1 = bannerItems.filter(b => b.banner_orden >= 1 && b.banner_orden <= 5).sort((a, b) => a.banner_orden - b.banner_orden)
  const slide2 = bannerItems.filter(b => b.banner_orden >= 6 && b.banner_orden <= 10).sort((a, b) => a.banner_orden - b.banner_orden)
  const slides = [slide1, slide2].filter(s => s.length >= 1)

  useEffect(() => {
    if (slides.length < 2) return
    intervalRef.current = setInterval(() => {
      setActiveSlide((prev) => (prev === 0 ? 1 : 0))
    }, 7000)
    return () => clearInterval(intervalRef.current)
  }, [slides.length])

  // Auto-avance del carrusel móvil (3 imágenes cuadradas a la vez)
  useEffect(() => {
    const el = mobileScrollRef.current
    if (!el || !bannerItems || bannerItems.length <= 3) return
    const t = setInterval(() => {
      const card = el.querySelector(':first-child')
      const amount = (card?.offsetWidth || 100) + 8
      if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 5) {
        el.scrollTo({ left: 0, behavior: 'smooth' })
      } else {
        el.scrollBy({ left: amount, behavior: 'smooth' })
      }
    }, 3500)
    return () => clearInterval(t)
  }, [bannerItems])

  return (
    <>
      {/* MÓVIL: carrusel de 3 imágenes cuadradas que llenan el ancho */}
      <div className="sm:hidden mb-2 overflow-hidden" style={{ background: bannerBg }}>
        <div
          ref={mobileScrollRef}
          className="flex gap-1.5 overflow-x-auto snap-x snap-mandatory [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        >
          {bannerItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => { trackClick(storeUserId, item.id); setSelectedProduct(item) }}
              className="shrink-0 w-[calc((100%-0.75rem)/3)] aspect-square rounded-lg overflow-hidden snap-start bg-black/10"
            >
              {item.image
                ? <img src={item.image} alt={item.alt || item.name} className="w-full h-full object-cover" />
                : <span className="material-symbols-outlined text-xl text-slate-300 flex items-center justify-center h-full">image</span>}
            </button>
          ))}
        </div>
      </div>

      {/* ESCRITORIO/TABLET: mosaico (sin cambios) */}
      <div className="hidden sm:block relative w-full sm:h-80 md:h-96 overflow-hidden mb-2 rounded-xl" style={{ background: bannerBg }}>
        {slides.map((slide, i) => {
          const hasSmall = slide.length > 1
          return (
            <div
              key={i}
              className={`absolute inset-0 gap-2 p-2 transition-opacity duration-1000 ${hasSmall ? 'grid grid-cols-2 grid-rows-1' : 'flex'}`}
              style={{ opacity: activeSlide === i ? 1 : 0 }}
            >
              {/* Imagen principal izquierda */}
              {slide[0] && (
                <div className={`rounded-xl overflow-hidden flex items-center justify-center cursor-pointer hover:opacity-90 transition-opacity ${hasSmall ? '' : 'flex-1'}`} style={{ background: bannerBg }} onClick={() => { trackClick(storeUserId, slide[0]?.id); setSelectedProduct(slide[0]) }}>
                  <img src={slide[0].image} alt={slide[0].alt || slide[0].name} className="w-full h-full object-cover" />
                </div>
              )}
              {/* 4 imágenes derecha en grid 2x2 */}
              {hasSmall && (
                <div className="grid grid-cols-2 grid-rows-2 gap-2">
                  {[1, 2, 3, 4].map((idx) => (
                    <div key={idx} className="rounded-xl overflow-hidden flex items-center justify-center cursor-pointer hover:opacity-90 transition-opacity" style={{ background: bannerBg }} onClick={() => { if (slide[idx]) { trackClick(storeUserId, slide[idx]?.id); setSelectedProduct(slide[idx]) } }}>
                      {slide[idx] ? (
                        <img src={slide[idx].image} alt={slide[idx].alt || slide[idx].name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="material-symbols-outlined text-xl text-slate-300">image</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
        {/* Indicadores */}
        {slides.length > 1 && (
          <div className="absolute bottom-2 right-3 flex gap-1.5 z-10">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => { setActiveSlide(i); clearInterval(intervalRef.current) }}
                className={`h-1.5 rounded-full transition-all ${
                  activeSlide === i ? 'w-5 bg-accent' : 'w-1.5 bg-white/50'
                }`}
              />
            ))}
          </div>
        )}
      </div>
      {selectedProduct && (
        <MarqueeModal product={selectedProduct} phone={phone} onClose={() => setSelectedProduct(null)} />
      )}
    </>
  )
}

export function mapListing(l) {
  return {
    id: l.id,
    user_id: l.user_id,
    name: l.nombre,
    description: l.descripcion,
    image: l.imagen ? (l.imagen.startsWith('http') ? l.imagen : `${API}${l.imagen}`) : null,
    alt: l.nombre,
    price: l.precio,
    originalPrice: l.precio_original,
    badge: l.badge,
    tallas: l.tallas,
    medidas: l.medidas,
    genero: l.genero,
    tipo: l.tipo,
    category: l.categoria,
    subcategory: l.subcategoria,
    seccion: l.seccion,
    negocio_whatsapp: l.negocio_whatsapp,
    negocio_telefono: l.negocio_telefono,
    negocio_direccion: l.negocio_direccion,
    negocio_correo: l.negocio_correo,
    negocio_facebook: l.negocio_facebook,
    negocio_instagram: l.negocio_instagram,
    nombre_negocio: l.nombre_negocio,
    owner_plan_id: l.owner_plan_id,
  }
}

const SECTION_TITLES = {
  destacados: 'Productos Destacados',
  ofertas: 'Productos en Ofertas',
  novedades: 'Novedades',
  liquidacion: 'Productos en Liquidación',
  tecnologia: 'Tecnología',
  servicios: 'Servicios',
  arriendos: 'Arriendos',
  turismo: 'Tendencia',
}

export default function StorePage({ store, onBack, onOpenStore, mobileCatKey }) {
  const [activeCat, setActiveCat] = useState(null)
  const [activeSub, setActiveSub] = useState(null)
  const [mobileCatOpen, setMobileCatOpen] = useState(false)

  // Abrir sidebar mobile cuando cambia mobileCatKey
  useEffect(() => {
    if (mobileCatKey > 0) setMobileCatOpen(true)
  }, [mobileCatKey])
  const [bannerItems, setBannerItems] = useState([])
  const [apiProducts, setApiProducts] = useState(null)
  const [storeInfo, setStoreInfo] = useState(null)
  const [loading, setLoading] = useState(!!store.userId)

  // Registrar visita a la página
  useEffect(() => {
    if (!store.userId) return
    fetch(`${API}/api/v1/analytics/track`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: store.userId, event_type: 'page_view', pagina: 'tienda' }),
    }).catch(() => {})
  }, [store.userId])

  // Fetch data from API if store has userId
  useEffect(() => {
    if (!store.userId) return
    Promise.all([
      fetch(`${API}/api/v1/listings?user_id=${store.userId}`).then(r => r.json()),
      fetch(`${API}/api/v1/listings?user_id=${store.userId}&banner=1`).then(r => r.json()),
      fetch(`${API}/api/v1/business/${store.userId}`).then(r => r.json()),
    ]).then(([listData, banData, bizData]) => {
      if (listData.listings) {
        setApiProducts(listData.listings.map(mapListing))
      }
      if (banData.listings) {
        setBannerItems(banData.listings.map(l => ({
          ...mapListing(l),
          banner_orden: l.banner_orden,
          posX: l.banner_pos_x ?? 50,
          posY: l.banner_pos_y ?? 50,
          scale: parseFloat(l.banner_scale) || 1,
        })))
      }
      if (bizData.business) {
        setStoreInfo(bizData.business)
      }
    }).catch(err => console.error('Error cargando tienda:', err))
      .finally(() => setLoading(false))
  }, [store.userId])

  // Colores del menú lateral: ya NO se configuran aparte; el menú toma
  // automáticamente el color del header de la tienda + el acento del tema,
  // para quedar siempre acorde al aspecto de la página.
  const headerColor = storeInfo?.header_color || store.header_color || '#3B1969'
  const sideVars = {
    '--side-bg': softenColor(headerColor),     // fondo neutro oscuro (poco invasivo)
    '--side-accent': menuAccent(headerColor),  // acento de marca para títulos/activos
    '--side-border': headerColor,              // borde en el color exacto del header
  }

  // Estilo/posición del menú: 'izquierda' (def.), 'derecha' o 'modal' (centrado)
  const menuStyle = storeInfo?.sidebar_style || store.sidebar_style || 'izquierda'
  const isModalMenu = menuStyle === 'modal'

  // Datos de la tienda: API o estáticos
  const storeName = storeInfo?.nombre_negocio || store.name
  const storePhone = storeInfo?.whatsapp || storeInfo?.telefono || store.phone
  const storeSlogan = storeInfo?.slogan || store.slogan

  // Límite de listings según plan: Normal=25, Premium=100
  const PLAN_LIMITS = { 1: 0, 2: 25, 3: 100 }
  const maxListings = PLAN_LIMITS[store.plan_id] || 25

  // Productos desde API, limitados por plan
  const storeProducts = apiProducts ? apiProducts.slice(0, maxListings) : []

  // Categorías agrupadas por tipo (Productos / Servicios / Arriendos)
  const storeCategoryGroups = apiProducts
    ? (() => {
        const byTipo = {}
        apiProducts.forEach(p => {
          if (!p.category) return
          const tipo = p.tipo || 'producto'
          if (!byTipo[tipo]) byTipo[tipo] = {}
          if (!byTipo[tipo][p.category]) byTipo[tipo][p.category] = new Set()
          if (p.subcategory) byTipo[tipo][p.category].add(p.subcategory)
        })
        const TIPO_ORDER = { producto: 0, servicio: 1, arriendo: 2 }
        const TIPO_LABEL = { producto: 'Productos', servicio: 'Servicios', arriendo: 'Arriendos' }
        return Object.keys(byTipo)
          .sort((a, b) => (TIPO_ORDER[a] ?? 99) - (TIPO_ORDER[b] ?? 99))
          .map(tipo => ({
            tipo,
            label: TIPO_LABEL[tipo] || tipo,
            categories: Object.entries(byTipo[tipo]).map(([catLabel, subs]) => ({
              label: catLabel,
              subcategories: [...subs],
            })),
          }))
      })()
    : (store.categoryGroups || [])

  // Lista plana (compat con resto del código)
  const storeCategories = storeCategoryGroups.flatMap(g => g.categories)

  // Filtrar por categoría o subcategoría seleccionada
  const filteredProducts = storeProducts.filter((p) => {
    if (activeSub) return (p.subcategory || '').toLowerCase() === activeSub.toLowerCase()
    if (activeCat) return (p.category || '').toLowerCase() === activeCat.toLowerCase()
    return true
  })

  const handleCatClick = (catLabel, collapseOnly) => {
    if (activeCat === catLabel) {
      if (collapseOnly) return // En mobile solo colapsa visualmente, no cierra menú
      setActiveCat(null)
      setActiveSub(null)
    } else {
      setActiveCat(catLabel)
      setActiveSub(null)
    }
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <span className="material-symbols-outlined text-primary text-3xl animate-spin">progress_activity</span>
      </div>
    )
  }

  return (
    <>
      {/* Sidebar con categorías y subcategorías (oculto en modo modal) */}
      <aside className={`${isModalMenu ? 'hidden' : 'hidden md:block'} shrink-0 w-max sticky top-[148px] self-start mt-3 ml-1 mr-1 z-30 mb-6 max-h-[calc(100vh-168px)] flex flex-col ${menuStyle === 'derecha' ? 'md:order-2' : ''}`} style={sideVars}>
          <div className="text-white animate-slide-in shadow-lg p-2 flex flex-col min-h-0" style={{ background: 'var(--side-bg)' }}>
            <div className="border-2 rounded-lg p-2 pt-3 flex flex-col min-h-0" style={{ borderColor: 'var(--side-border)' }}>
              <div className="flex items-center justify-between mb-3 shrink-0">
                <h3 className="text-sm font-black uppercase tracking-tight">Categorías</h3>
              </div>
              <div className="flex flex-col gap-0 flex-1 min-h-0 overflow-y-auto sidebar-scroll pr-1">
                {storeCategoryGroups.map((group, gIdx) => (
                  <div key={group.tipo} className={gIdx > 0 ? 'mt-2 pt-2 border-t border-white/10' : ''}>
                    <h4 className="text-[10px] font-black uppercase tracking-wider px-2 mb-1" style={{ color: 'var(--side-accent)' }}>
                      {group.label}
                    </h4>
                    {group.categories.map((cat) => (
                      <div key={cat.label}>
                        <button
                          onClick={() => handleCatClick(cat.label)}
                          className={`flex items-center gap-2 px-2 py-1 rounded-md transition-colors text-xs font-normal w-full ${
                            activeCat === cat.label ? 'bg-white/10' : 'text-white/50'
                          }`}
                          style={activeCat === cat.label ? { color: 'var(--side-accent)' } : undefined}
                        >
                          <span className="material-symbols-outlined text-xs" style={{ transition: 'transform 0.2s', transform: activeCat === cat.label ? 'rotate(90deg)' : 'rotate(0deg)' }}>
                            chevron_right
                          </span>
                          <span className="flex-1 text-left">{cat.label}</span>
                        </button>
                        <div
                          className="overflow-hidden transition-all duration-300 flex flex-col"
                          style={{ maxHeight: activeCat === cat.label ? `${cat.subcategories.length * 36}px` : '0px' }}
                        >
                          {cat.subcategories.map((sub) => (
                            <button
                              key={sub}
                              onClick={() => { setActiveCat(cat.label); setActiveSub(activeSub === sub ? null : sub) }}
                              className={`flex items-center gap-2 pl-2 pr-2 py-0.5 rounded-md text-xs font-normal w-full text-left ${
                                activeSub === sub ? 'text-white font-medium' : 'text-white/50'
                              }`}
                            >
                              {activeSub === sub
                                ? <span className="material-symbols-outlined text-white text-xs shrink-0">check</span>
                                : <span className="w-1 h-1 rounded-full shrink-0" style={{ background: 'var(--side-accent)' }}></span>
                              }
                              <span>{sub}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Contenido principal */}
        <main className={`flex-1 flex flex-col gap-4 sm:gap-6 md:gap-8 pt-3 sm:pt-4 px-3 sm:px-4 md:px-6 pb-4 sm:pb-6 overflow-hidden transition-all duration-300 ${menuStyle === 'derecha' ? 'md:order-1' : ''}`}>
          {/* Botón para abrir el menú en modo modal (escritorio) */}
          {isModalMenu && storeCategories.length > 0 && (
            <button
              onClick={() => setMobileCatOpen(true)}
              className="hidden md:inline-flex items-center gap-2 self-start pl-3 pr-4 py-2.5 rounded-xl text-sm font-bold text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
              style={{ ...sideVars, background: 'var(--side-bg)', boxShadow: '0 4px 14px rgba(0,0,0,0.18)' }}
            >
              <span className="flex items-center justify-center h-6 w-6 rounded-lg" style={{ background: 'var(--side-accent)' }}>
                <span className="material-symbols-outlined text-base text-white">menu</span>
              </span>
              Categorías
              {(activeCat || activeSub) && (
                <span className="ml-1 text-[10px] font-black uppercase px-1.5 py-0.5 rounded-full text-white" style={{ background: 'var(--side-accent)' }}>
                  Filtrando
                </span>
              )}
            </button>
          )}

          {/* ===== Modo MODAL: menú centrado y atractivo (móvil + escritorio) ===== */}
          {isModalMenu && mobileCatOpen && storeCategories.length > 0 && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in" style={sideVars}>
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMobileCatOpen(false)}></div>
              <div
                className="relative w-[420px] max-w-[92vw] max-h-[82vh] flex flex-col rounded-2xl overflow-hidden shadow-2xl animate-modal-pop text-white"
                style={{ background: 'var(--side-bg)', boxShadow: '0 25px 60px -12px rgba(0,0,0,0.55)' }}
              >
                {/* Encabezado */}
                <div className="relative shrink-0 px-5 pt-4 pb-3" style={{ borderBottom: '2px solid var(--side-border)' }}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <span className="flex items-center justify-center h-9 w-9 rounded-xl" style={{ background: 'var(--side-accent)' }}>
                        <span className="material-symbols-outlined text-xl text-white">category</span>
                      </span>
                      <div>
                        <h3 className="text-base font-black uppercase tracking-tight leading-none">Categorías</h3>
                        <p className="text-[11px] text-white/50 mt-0.5">Elegí qué querés ver</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setMobileCatOpen(false)}
                      className="flex items-center justify-center h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                    >
                      <span className="material-symbols-outlined text-white text-lg">close</span>
                    </button>
                  </div>
                </div>

                {/* Lista de categorías */}
                <div className="flex-1 min-h-0 flex flex-col gap-1 px-3 py-3 overflow-y-auto sidebar-scroll">
                  {(activeCat || activeSub) && (
                    <button
                      onClick={() => { setActiveCat(null); setActiveSub(null); setMobileCatOpen(false) }}
                      className="flex items-center gap-2 w-full px-3 py-2 mb-1 rounded-lg text-xs font-bold bg-white/10 hover:bg-white/20 transition-colors"
                      style={{ color: 'var(--side-accent)' }}
                    >
                      <span className="material-symbols-outlined text-base">filter_alt_off</span>
                      <span>Quitar filtro</span>
                    </button>
                  )}
                  {storeCategoryGroups.map((group, gIdx) => (
                    <div key={group.tipo} className={gIdx > 0 ? 'mt-3 pt-3 border-t border-white/10' : ''}>
                      <h4 className="text-[11px] font-black uppercase tracking-wider px-1 mb-1.5" style={{ color: 'var(--side-accent)' }}>
                        {group.label}
                      </h4>
                      {group.categories.map((cat) => {
                        const isOpen = activeCat === cat.label
                        return (
                          <div key={cat.label}>
                            <button
                              onClick={() => { handleCatClick(cat.label, true); if (!cat.subcategories || cat.subcategories.length === 0) setMobileCatOpen(false) }}
                              className={`flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${isOpen ? 'bg-white/15' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}
                              style={isOpen ? { color: 'var(--side-accent)' } : undefined}
                            >
                              <span className="material-symbols-outlined text-lg" style={{ transition: 'transform 0.2s', transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}>chevron_right</span>
                              <span className="flex-1 text-left">{cat.label}</span>
                              {cat.subcategories && cat.subcategories.length > 0 && (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-white/10">{cat.subcategories.length}</span>
                              )}
                            </button>
                            <div
                              className="overflow-hidden transition-all duration-300 flex flex-col gap-0.5"
                              style={{ maxHeight: isOpen && cat.subcategories ? `${cat.subcategories.length * 44}px` : '0px' }}
                            >
                              {(cat.subcategories || []).map((sub) => (
                                <button
                                  key={sub}
                                  onClick={() => { setActiveCat(cat.label); setActiveSub(activeSub === sub ? null : sub); setMobileCatOpen(false) }}
                                  className={`flex items-center gap-2 ml-4 pl-3 pr-2 py-2 rounded-lg text-[13px] transition-colors ${activeSub === sub ? 'bg-white/10 text-white font-bold' : 'text-white/55 hover:text-white hover:bg-white/5'}`}
                                >
                                  {activeSub === sub
                                    ? <span className="material-symbols-outlined text-sm shrink-0" style={{ color: 'var(--side-accent)' }}>check_circle</span>
                                    : <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: 'var(--side-accent)' }}></span>
                                  }
                                  <span>{sub}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ))}
                </div>

                {/* Pie: ver todo */}
                <div className="shrink-0 px-4 py-3 border-t border-white/10">
                  <button
                    onClick={() => { setActiveCat(null); setActiveSub(null); setMobileCatOpen(false) }}
                    className="w-full py-2.5 rounded-xl text-sm font-black uppercase tracking-wide text-white hover:brightness-110 transition-all"
                    style={{ background: 'var(--side-accent)' }}
                  >
                    Ver todo
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ===== Cajón lateral móvil (estilos izquierda / derecha) ===== */}
          {!isModalMenu && mobileCatOpen && storeCategories.length > 0 && (
            <div
              className="md:hidden fixed inset-0 z-40"
              style={{ top: (document.getElementById('main-header')?.offsetHeight || 90) + 'px' }}
            >
              <div className="absolute inset-0 bg-black/40" onClick={() => setMobileCatOpen(false)}></div>
              <div
                className="relative w-fit h-full text-white shadow-lg flex flex-col border-r-2"
                style={{ ...sideVars, background: 'var(--side-bg)', borderColor: 'var(--side-border)' }}
              >
                <div className="flex items-center justify-between gap-3 px-3 pt-2 pb-1 shrink-0">
                  <h3 className="text-xs font-black uppercase tracking-tight whitespace-nowrap">Categorías</h3>
                  <button onClick={() => setMobileCatOpen(false)} className="hover:bg-white/10 rounded-full p-0.5 transition-colors shrink-0">
                    <span className="material-symbols-outlined text-white/60 text-base hover:text-white">close</span>
                  </button>
                </div>
                <div className="flex-1 min-h-0 flex flex-col gap-0.5 px-2 pb-2 overflow-y-auto sidebar-scroll">
                  {(activeCat || activeSub) && (
                    <button
                      onClick={() => { setActiveCat(null); setActiveSub(null); setMobileCatOpen(false) }}
                      className="flex items-center gap-1.5 w-full px-2 py-1 rounded-md text-[11px] font-bold hover:bg-white/10 transition-colors"
                      style={{ color: 'var(--side-accent)' }}
                    >
                      <span className="material-symbols-outlined text-xs">close</span>
                      <span>Quitar filtro</span>
                    </button>
                  )}
                  {storeCategoryGroups.map((group, gIdx) => (
                    <div key={group.tipo} className={gIdx > 0 ? 'mt-2 pt-2 border-t border-white/10' : ''}>
                      <h4 className="text-[10px] font-black uppercase tracking-wider px-2 mb-1 whitespace-nowrap" style={{ color: 'var(--side-accent)' }}>
                        {group.label}
                      </h4>
                      {group.categories.map((cat) => (
                        <div key={cat.label}>
                          <button
                            onClick={() => { handleCatClick(cat.label, true); if (!cat.subcategories || cat.subcategories.length === 0) setMobileCatOpen(false) }}
                            className={`flex items-center gap-1.5 w-full px-2 py-1 rounded-md text-[11px] font-medium transition-colors ${activeCat === cat.label ? 'bg-white/10' : 'text-white/60 hover:text-accent'}`}
                            style={activeCat === cat.label ? { color: 'var(--side-accent)' } : undefined}
                          >
                            <span className="material-symbols-outlined text-xs" style={{ transition: 'transform 0.2s', transform: activeCat === cat.label ? 'rotate(90deg)' : 'rotate(0deg)' }}>chevron_right</span>
                            <span className="whitespace-nowrap">{cat.label}</span>
                          </button>
                          {activeCat === cat.label && cat.subcategories && cat.subcategories.length > 0 && (
                            <div className="flex flex-col ml-4">
                              {cat.subcategories.map((sub) => (
                                <button
                                  key={sub}
                                  onClick={() => { setActiveCat(cat.label); setActiveSub(activeSub === sub ? null : sub); setMobileCatOpen(false) }}
                                  className={`flex items-center gap-1.5 px-1.5 py-0.5 rounded text-[10px] transition-colors ${activeSub === sub ? 'text-white font-bold' : 'text-white/40 hover:text-accent'}`}
                                >
                                  {activeSub === sub
                                    ? <span className="material-symbols-outlined text-white text-[10px] shrink-0">check</span>
                                    : <span className="w-1 h-1 rounded-full shrink-0" style={{ background: 'var(--side-accent)' }}></span>
                                  }
                                  <span className="whitespace-nowrap">{sub}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          {/* Ver todo - cuando hay filtro activo */}
          {(activeCat || activeSub) && (
            <button
              onClick={() => { setActiveCat(null); setActiveSub(null) }}
              className="flex items-center gap-1.5 text-xs text-primary/60 hover:text-primary transition-colors self-start -mb-4"
            >
              <span className="material-symbols-outlined text-sm">arrow_back</span>
              <span>Ver todos los productos</span>
            </button>
          )}
          {/* Banner publicitario - solo plan Premium */}
          {store.plan_id >= 3 && (
            <StoreBanner store={store} products={storeProducts} bannerItems={bannerItems} phone={storePhone} storeUserId={store.userId} />
          )}
          {filteredProducts.length > 0 ? (
            (() => {
              // Agrupar por tipo
              const tipos = {}
              filteredProducts.forEach(p => {
                const t = p.tipo || 'producto'
                if (!tipos[t]) tipos[t] = []
                tipos[t].push(p)
              })
              const tipoKeys = Object.keys(tipos)
              const hasMixedTypes = tipoKeys.length > 1

              const TIPO_LABELS = { producto: 'Productos', servicio: 'Servicios', arriendo: 'Arriendos' }
              const TIPO_ICONS = { producto: 'inventory_2', servicio: 'work', arriendo: 'home' }

              if (hasMixedTypes && !activeCat && !activeSub) {
                // Múltiples tipos · Orden fijo: productos → servicios → arriendos
                const TIPO_ORDER = { producto: 0, servicio: 1, arriendo: 2 }
                const sortedKeys = [...tipoKeys].sort((a, b) => (TIPO_ORDER[a] ?? 99) - (TIPO_ORDER[b] ?? 99))
                const elements = []

                const ownerPlan = store.plan_id || 1

                sortedKeys.forEach((tipo) => {
                  const items = tipos[tipo]
                  const rows = []
                  for (let i = 0; i < items.length; i += 10) {
                    rows.push(items.slice(i, i + 10))
                  }

                  // Servicios y arriendos en planes pagados (Normal/Premium): collage rotativo en lugar de grid
                  const useServicesCollage = tipo === 'servicio' && ownerPlan >= 2
                  const useArriendosCollage = tipo === 'arriendo' && ownerPlan >= 2
                  const useCollage = useServicesCollage || useArriendosCollage
                  const collageColor = tipo === 'arriendo' ? store.arriendos_color : store.services_color

                  // Header de sección
                  elements.push(
                    <div key={tipo} className="mb-4">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="material-symbols-outlined text-primary text-base">{TIPO_ICONS[tipo] || 'category'}</span>
                        <h3 className="text-xs sm:text-sm font-black text-primary uppercase tracking-wide">{TIPO_LABELS[tipo] || tipo}</h3>
                        <span className="text-[9px] text-slate-400">({items.length})</span>
                        <div className="flex-1 h-px bg-slate-200"></div>
                      </div>
                      {useCollage ? (
                        <StoreServicesCollage items={items} bgColor={collageColor} />
                      ) : (
                        rows.map((row, idx) => (
                          <div key={idx}>
                            <StoreCarousel title="" items={row} onOpenStore={onOpenStore} />
                          </div>
                        ))
                      )}
                    </div>
                  )
                })

                return elements
              }

              // Un solo tipo o con filtro activo
              const allRows = []
              for (let i = 0; i < filteredProducts.length; i += 10) {
                allRows.push(filteredProducts.slice(i, i + 10))
              }
              const singleTitle = activeSub || activeCat || TIPO_LABELS[tipoKeys[0]] || 'Todos los productos'

              return (
                <>
                  {allRows.map((row, idx) => (
                    <div key={idx}>
                      <StoreCarousel
                        title={idx === 0 ? singleTitle : ''}
                        items={row}
                        onOpenStore={onOpenStore}
                      />
                    </div>
                  ))}
                </>
              )
            })()
          ) : (
            <div className="text-center py-12 text-slate-400 text-sm">
              No hay productos en esta categoría.
            </div>
          )}

        </main>
    </>
  )
}
