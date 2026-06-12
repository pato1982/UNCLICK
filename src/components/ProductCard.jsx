import { useState } from 'react'

const API = import.meta.env.VITE_API || ''
function trackProductClick(product) {
  const userId = product.user_id
  if (!userId) return
  fetch(`${API}/api/v1/analytics/track`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId, event_type: 'product_click', listing_id: product.id }),
  }).catch(() => {})
}

function getStoreFromProduct(product) {
  if (product.user_id && product.nombre_negocio) {
    return {
      id: `user-${product.user_id}`,
      userId: product.user_id,
      name: product.nombre_negocio,
      phone: product.negocio_whatsapp || product.negocio_telefono || '',
      address: product.negocio_direccion || '',
      plan_id: product.owner_plan_id || 1,
    }
  }
  return null
}

function ContactPopup({ icon, title, value, onClose }) {
  return (
    <div className="absolute inset-x-0 bottom-full mb-2 flex justify-center" style={{ zIndex: 10001 }}>
      <div className="relative bg-white rounded-xl shadow-2xl max-w-xs w-full p-5 border border-slate-200">
        <button onClick={onClose} className="absolute top-2 right-2 h-5 w-5 bg-slate-100 rounded-full flex items-center justify-center hover:bg-slate-200 transition-colors">
          <span className="material-symbols-outlined text-slate-500 text-xs">close</span>
        </button>
        <div className="flex flex-col items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-primary text-xl">{icon}</span>
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{title}</p>
          <p className="text-sm font-bold text-slate-800 select-all">{value}</p>
        </div>
      </div>
    </div>
  )
}

export function ProductModal({ product, hidePrice, inStorePage, onClose, onOpenStore }) {
  const [contactPopup, setContactPopup] = useState(null)
  return (
    <div className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex: 10000 }} onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
      <div
        className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full max-h-[85vh] overflow-y-auto mx-2"
        onClick={(e) => { e.stopPropagation(); setContactPopup(null) }}
      >
        {/* Botón cerrar */}
        <button onClick={onClose} className="absolute top-2 right-2 z-10 h-6 w-6 bg-white/80 backdrop-blur rounded-full flex items-center justify-center hover:bg-slate-100 transition-colors shadow">
          <span className="material-symbols-outlined text-slate-600 text-sm">close</span>
        </button>

        {/* Imagen grande arriba */}
        <div className="relative w-full overflow-hidden rounded-t-2xl" style={{ aspectRatio: '4/3' }}>
          <img
            src={product.image}
            alt={product.alt}
            className="w-full h-full object-cover bg-slate-100"
          />
          {product.badge && (
            <span className="absolute top-2 left-2 px-2 py-0.5 bg-primary text-white rounded-full text-[8px] font-bold shadow">{product.badge}</span>
          )}
          {product.genero && (
            <span className="absolute top-2 right-10 px-2 py-0.5 bg-white/90 backdrop-blur-sm rounded-full text-[8px] font-bold text-slate-700 shadow">{product.genero}</span>
          )}
        </div>

        {/* Info debajo */}
        <div className="px-3 py-3">
          {/* Nombre */}
          <h3 className="text-xs font-black text-primary text-center mb-1">{product.name}</h3>

          {/* Descripción - 4 líneas fijas */}
          <div className="min-h-[56px] mb-1">
            <p className="text-[10px] text-slate-500 leading-[14px] text-center line-clamp-4">{product.description}</p>
          </div>

          {/* Tallas / Medidas */}
          {(product.tallas?.seleccion?.length > 0 || product.sizes || product.colors || product.medidas) && (
            <div className="space-y-2 mb-2">
              {product.tallas && product.tallas.seleccion?.length > 0 && (
                <div className="text-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">
                    Tallas {product.tallas.tipo === 'calzado' ? '(Calzado)' : product.tallas.tipo === 'ropa' ? '(Ropa)' : '(Accesorios)'}
                  </p>
                  <div className="flex gap-1.5 flex-wrap justify-center">
                    {product.tallas.seleccion.map((t) => (
                      <span key={t} className="px-2 py-0.5 border border-slate-200 rounded text-xs font-bold text-slate-600">{t}</span>
                    ))}
                  </div>
                </div>
              )}
              {product.sizes && (
                <div className="text-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Tallas</p>
                  <div className="flex gap-1.5 flex-wrap justify-center">
                    {product.sizes.map((size) => (
                      <span key={size} className="px-2 py-0.5 border border-slate-200 rounded text-xs font-bold text-slate-600">{size}</span>
                    ))}
                  </div>
                </div>
              )}
              {product.colors && (
                <div className="text-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Colores</p>
                  <div className="flex gap-1.5 flex-wrap justify-center">
                    {product.colors.map((color) => (
                      <span key={color} className="px-2 py-0.5 border border-slate-200 rounded text-xs font-bold text-slate-600">{color}</span>
                    ))}
                  </div>
                </div>
              )}
              {product.medidas && (
                <div className="text-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Medidas</p>
                  <div className="flex gap-3 justify-center">
                    {product.medidas.alto && <span className="text-xs text-slate-600"><span className="font-bold">Alto:</span> {product.medidas.alto}cm</span>}
                    {product.medidas.ancho && <span className="text-xs text-slate-600"><span className="font-bold">Ancho:</span> {product.medidas.ancho}cm</span>}
                    {product.medidas.profundidad && <span className="text-xs text-slate-600"><span className="font-bold">Prof:</span> {product.medidas.profundidad}cm</span>}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Precios centrados */}
          <div className="mb-2">
            {!hidePrice && (product.price > 0 || product.precio > 0) ? (
              <div className="flex items-center justify-center gap-2">
                <p className="text-sm font-black text-primary">
                  ${(product.price ?? product.precio ?? 0).toLocaleString('es-CL', { maximumFractionDigits: 0 })}
                </p>
                {(product.originalPrice || product.precioOriginal) && (
                  <p className="text-[11px] font-bold text-slate-400 line-through">
                    ${(product.originalPrice ?? product.precioOriginal ?? 0).toLocaleString('es-CL', { maximumFractionDigits: 0 })}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-[11px] font-bold text-primary text-center">Consultar precio</p>
            )}
          </div>

          {/* Redes y contacto */}
          <div className="flex items-center justify-between border-t border-slate-100 pt-2">
            <div className="flex items-center gap-1.5">
              {product.negocio_facebook && (
                <a href={product.negocio_facebook} target="_blank" rel="noopener noreferrer" className="h-7 w-7 rounded-lg bg-[#1877F2]/10 hover:bg-[#1877F2] hover:text-white text-[#1877F2] flex items-center justify-center transition-all" title="Facebook">
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                </a>
              )}
              {product.negocio_instagram && (
                <a href={product.negocio_instagram.startsWith('http') ? product.negocio_instagram : `https://instagram.com/${product.negocio_instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="h-7 w-7 rounded-lg bg-pink-500/10 hover:bg-gradient-to-tr hover:from-yellow-400 hover:via-pink-500 hover:to-purple-600 hover:text-white text-pink-500 flex items-center justify-center transition-all" title="Instagram">
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                </a>
              )}
            </div>

            <div className="relative flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
              {contactPopup && (
                <ContactPopup icon={contactPopup.icon} title={contactPopup.title} value={contactPopup.value} onClose={() => setContactPopup(null)} />
              )}
              {!inStorePage && product.owner_plan_id && product.owner_plan_id >= 2 && onOpenStore && (
                <button
                  onClick={() => { const store = getStoreFromProduct(product); onClose(); onOpenStore(store, product) }}
                  className="h-7 w-7 rounded-lg bg-primary/10 hover:bg-primary hover:text-white text-primary flex items-center justify-center transition-all"
                  title="Tienda"
                >
                  <span className="material-symbols-outlined text-sm">storefront</span>
                </button>
              )}
              {product.negocio_whatsapp && (
                <button onClick={() => setContactPopup(contactPopup?.title === 'WhatsApp' ? null : { icon: 'chat', title: 'WhatsApp', value: product.negocio_whatsapp })} className="h-7 w-7 rounded-lg bg-green-500/10 hover:bg-green-500 hover:text-white text-green-600 flex items-center justify-center transition-all" title="WhatsApp">
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.5.5 0 00.611.611l4.458-1.495A11.943 11.943 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-2.347 0-4.522-.809-6.236-2.164l-.436-.35-3.233 1.084 1.084-3.233-.35-.436A9.956 9.956 0 012 12C2 6.486 6.486 2 12 2s10 4.486 10 10-4.486 10-10 10z"/></svg>
                </button>
              )}
              {product.negocio_telefono && (
                <button onClick={() => setContactPopup(contactPopup?.title === 'Teléfono' ? null : { icon: 'call', title: 'Teléfono', value: product.negocio_telefono })} className="h-7 w-7 rounded-lg bg-primary/10 hover:bg-primary hover:text-white text-primary flex items-center justify-center transition-all" title="Teléfono">
                  <span className="material-symbols-outlined text-sm">call</span>
                </button>
              )}
              {product.negocio_correo && (
                <button onClick={() => setContactPopup(contactPopup?.title === 'Correo' ? null : { icon: 'mail', title: 'Correo', value: product.negocio_correo })} className="h-7 w-7 rounded-lg bg-primary/10 hover:bg-primary hover:text-white text-primary flex items-center justify-center transition-all" title="Correo">
                  <span className="material-symbols-outlined text-sm">mail</span>
                </button>
              )}
              {product.negocio_direccion && (
                <button onClick={() => setContactPopup(contactPopup?.title === 'Ubicación' ? null : { icon: 'location_on', title: 'Ubicación', value: product.negocio_direccion })} className="h-7 w-7 rounded-lg bg-primary/10 hover:bg-primary hover:text-white text-primary flex items-center justify-center transition-all" title="Ubicación">
                  <span className="material-symbols-outlined text-sm">location_on</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ProductCard({ product, hidePrice, isFirst, onOpenStore, inStorePage }) {
  const [showModal, setShowModal] = useState(false)
  const store = getStoreFromProduct(product)

  return (
    <>
      <div
        onClick={() => { trackProductClick(product); setShowModal(true) }}
        className={`bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all flex flex-col group cursor-pointer ${isFirst ? 'border-2 border-amber-400 outline outline-2 outline-amber-400 outline-offset-2' : 'border border-slate-100'}`}
      >
        <div className="relative h-44 sm:h-44 md:h-52 bg-slate-50 overflow-hidden">
          <img
            alt={product.alt}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            src={product.image}
          />
          {isFirst && (
            <span className="absolute top-1 left-1 sm:top-2 sm:left-2 bg-amber-400 text-amber-900 px-1 sm:px-2 py-0.5 rounded-full text-[6px] sm:text-[8px] font-black uppercase tracking-wider shadow">
              Popular
            </span>
          )}
          {!isFirst && product.badge && (
            <span className="absolute top-1 left-1 sm:top-2 sm:left-2 bg-primary text-white px-1 sm:px-2 py-0.5 rounded-full text-[6px] sm:text-[8px] font-black uppercase tracking-wider shadow">
              {product.badge}
            </span>
          )}
        </div>
        <div className="px-1.5 sm:px-3 md:px-4 py-1.5 sm:py-3 flex flex-col flex-1 items-center text-center">
          {/* Nombre: 2 líneas fijas */}
          <div className="min-h-[24px] sm:min-h-0 flex items-start">
            <h3 className="font-bold text-xs sm:text-xs text-slate-900 leading-tight line-clamp-2 sm:line-clamp-1 mb-0 sm:mb-1">{product.name}</h3>
          </div>
          {/* Descripción: 3 líneas fijas */}
          <div className="min-h-[36px] sm:min-h-0 flex items-start">
            <p className="text-slate-500 text-[10px] sm:text-[10px] line-clamp-3 sm:line-clamp-2 mb-0.5 sm:mb-2">{product.description}</p>
          </div>
          <div className="mt-auto flex items-end justify-between w-full pt-1">
            {hidePrice ? (
              <div className="flex items-center gap-1 w-full">
                <span className="flex-1 bg-primary text-white py-1 sm:py-1.5 rounded-lg text-[9px] sm:text-[10px] font-bold uppercase tracking-wide text-center">
                  Solicitar
                </span>
                {store && !inStorePage && product.owner_plan_id && product.owner_plan_id >= 2 && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onOpenStore && onOpenStore(store, product) }}
                    className="bg-accent text-primary hover:bg-accent/80 h-7 w-7 sm:h-8 sm:w-8 rounded-md sm:rounded-lg flex items-center justify-center transition-all hover:scale-110 shrink-0 shadow-sm"
                    title={`Ver tienda de ${store.name}`}
                  >
                    <span className="material-symbols-outlined text-sm sm:text-base font-bold">storefront</span>
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="text-left">
                  {product.originalPrice && (
                    <p className="text-[8px] sm:text-[9px] font-medium text-slate-400 line-through leading-none">
                      ${product.originalPrice.toLocaleString('es-CL', { maximumFractionDigits: 0 })}
                    </p>
                  )}
                  <p className="text-xs sm:text-sm font-semibold text-primary leading-tight">
                    ${product.price.toLocaleString('es-CL', { maximumFractionDigits: 0 })}
                  </p>
                </div>
                <div className="flex items-center gap-0.5 sm:gap-1">
                  {store && !inStorePage && product.owner_plan_id && product.owner_plan_id >= 2 && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onOpenStore && onOpenStore(store, product) }}
                      className="bg-accent text-primary hover:bg-accent/80 h-7 w-7 sm:h-8 sm:w-8 rounded-md sm:rounded-lg flex items-center justify-center transition-all hover:scale-110 shadow-sm"
                      title={`Ver tienda de ${store.name}`}
                    >
                      <span className="material-symbols-outlined text-sm sm:text-base font-bold">storefront</span>
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {showModal && (
        <ProductModal product={product} hidePrice={hidePrice} inStorePage={inStorePage} onClose={() => setShowModal(false)} onOpenStore={onOpenStore} />
      )}
    </>
  )
}
