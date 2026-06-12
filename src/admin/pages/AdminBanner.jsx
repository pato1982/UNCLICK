import { useState, useEffect, useRef, useCallback } from 'react'

const API = import.meta.env.VITE_API || ''
const MAX_PER_SLIDE = 5

const TALLAS_CALZADO = ['20','21','22','23','24','25','26','27','28','29','30','31','32','33','34','35','36','37','38','39','40','41','42','43','44','45','46']
const TALLAS_ROPA = ['2','4','6','8','10','12','14','16','XS','S','M','L','XL','XXL','XXXL']
const TALLAS_ACCESORIOS = ['XS','S','M','L','XL','Único']

const SECCIONES_PRODUCTO = [
  { value: 'destacados', label: 'Destacados' },
  { value: 'ofertas', label: 'Ofertas' },
  { value: 'novedades', label: 'Novedades' },
  { value: 'liquidacion', label: 'Liquidación' },
  { value: 'tecnologia', label: 'Tecnología' },
  { value: 'tendencia', label: 'Tendencia' },
]

const emptyForm = {
  nombre: '', descripcion: '', precio: '', precioOriginal: '', categoria: '', subcategoria: '', badge: '', tipo: 'producto', seccion: 'destacados',
  attrMedidas: false, tallasTipo: '', tallasSeleccion: [],
  medidasAlto: '', medidasAncho: '', medidasProfundidad: '', genero: '',
  imagen: null, imagenPreview: null, imagenPos: { x: 0, y: 0 }, imagenScale: 1, imagenNaturalW: 0, imagenNaturalH: 0,
}

function generateCroppedBlob(src, pos, scale, naturalW, naturalH, size = 400) {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = size; canvas.height = size
      const fitScale = Math.max(size / naturalW, size / naturalH) * scale
      const ctx = canvas.getContext('2d')
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, size, size)
      ctx.drawImage(img, pos.x * (size / 208), pos.y * (size / 208), naturalW * fitScale, naturalH * fitScale)
      canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.9)
    }
    img.src = src
  })
}

function ImageCropper({ src, pos, onPosChange, naturalW, naturalH, scale, onScaleChange }) {
  const dragging = useRef(false)
  const startPoint = useRef({ x: 0, y: 0 })
  const startPos = useRef({ x: 0, y: 0 })
  const fitScale = naturalW && naturalH ? Math.max(208 / naturalW, 208 / naturalH) * scale : 1
  const drawW = naturalW * fitScale, drawH = naturalH * fitScale

  const clampPos = useCallback((x, y) => {
    let minX, maxX, minY, maxY
    if (drawW >= 208) { minX = 208 - drawW; maxX = 0 } else { minX = 0; maxX = 208 - drawW }
    if (drawH >= 208) { minY = 208 - drawH; maxY = 0 } else { minY = 0; maxY = 208 - drawH }
    return { x: Math.max(minX, Math.min(maxX, x)), y: Math.max(minY, Math.min(maxY, y)) }
  }, [drawW, drawH])

  const handleStart = (cx, cy) => { dragging.current = true; startPoint.current = { x: cx, y: cy }; startPos.current = { ...pos } }
  const handleMove = useCallback((cx, cy) => {
    if (!dragging.current) return
    onPosChange(clampPos(startPos.current.x + cx - startPoint.current.x, startPos.current.y + cy - startPoint.current.y))
  }, [clampPos, onPosChange])
  const handleEnd = useCallback(() => { dragging.current = false }, [])

  useEffect(() => {
    const mm = (e) => handleMove(e.clientX, e.clientY)
    const tm = (e) => { e.preventDefault(); handleMove(e.touches[0].clientX, e.touches[0].clientY) }
    const up = () => handleEnd()
    window.addEventListener('mousemove', mm); window.addEventListener('mouseup', up)
    window.addEventListener('touchmove', tm, { passive: false }); window.addEventListener('touchend', up)
    return () => { window.removeEventListener('mousemove', mm); window.removeEventListener('mouseup', up); window.removeEventListener('touchmove', tm); window.removeEventListener('touchend', up) }
  }, [handleMove, handleEnd])

  useEffect(() => { onPosChange(clampPos(pos.x, pos.y)) }, [scale])

  return (
    <div className="relative">
      <div className="w-52 h-52 rounded-lg border border-gray-200 overflow-hidden cursor-grab active:cursor-grabbing select-none bg-gray-100"
        onMouseDown={(e) => { e.preventDefault(); handleStart(e.clientX, e.clientY) }}
        onTouchStart={(e) => handleStart(e.touches[0].clientX, e.touches[0].clientY)}>
        <img src={src} alt="Preview" draggable={false} className="pointer-events-none" style={{ width: drawW, height: drawH, transform: `translate(${pos.x}px, ${pos.y}px)`, maxWidth: 'none' }} />
      </div>
      <div className="flex items-center gap-2 mt-2">
        <span className="material-symbols-outlined text-gray-400 text-sm">zoom_out</span>
        <input type="range" min="1" max="3" step="0.05" value={scale} onChange={(e) => onScaleChange(Number(e.target.value))} className="flex-1 h-1 accent-primary" />
        <span className="material-symbols-outlined text-gray-400 text-sm">zoom_in</span>
      </div>
      <p className="text-[10px] text-gray-400 text-center mt-1">Arrastra para ajustar posición</p>
    </div>
  )
}

function BannerPreview({ items }) {
  const [previewSlide, setPreviewSlide] = useState(0)

  const slide1 = items.filter(i => i.orden >= 1 && i.orden <= 5).sort((a, b) => a.orden - b.orden)
  const slide2 = items.filter(i => i.orden >= 6 && i.orden <= 10).sort((a, b) => a.orden - b.orden)
  const slides = [slide1, slide2].filter(s => s.length >= 1)

  useEffect(() => {
    if (slides.length < 2) return
    const id = setInterval(() => setPreviewSlide(prev => (prev === 0 ? 1 : 0)), 7000)
    return () => clearInterval(id)
  }, [slides.length])

  if (slides.length === 0) return (
    <div className="w-full h-48 sm:h-72 rounded-lg border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-2 bg-gray-50">
      <span className="material-symbols-outlined text-3xl text-gray-300">photo_library</span>
      <p className="text-xs text-gray-400">Agrega productos para ver la vista previa del banner</p>
    </div>
  )

  return (
    <div className="relative w-full h-64 sm:h-80 overflow-hidden rounded-xl shadow-sm" style={{ background: '#1a1220' }}>
      {slides.map((slide, i) => {
        const hasSmall = slide.length > 1
        return (
          <div
            key={i}
            className={`absolute inset-0 gap-2 p-2 transition-opacity duration-1000 ${hasSmall ? 'grid grid-cols-2 grid-rows-1' : 'flex'}`}
            style={{ opacity: previewSlide === i ? 1 : 0 }}
          >
            {/* Imagen principal izquierda */}
            {slide[0] && (
              <div className={`rounded-xl overflow-hidden flex items-center justify-center ${hasSmall ? '' : 'flex-1'}`} style={{ background: '#1a1220' }}>
                {slide[0].imagenPreview ? (
                  <img src={slide[0].imagenPreview} alt={slide[0].nombre} className="w-full h-full object-contain" />
                ) : (
                  <span className="material-symbols-outlined text-3xl text-white/30">image</span>
                )}
              </div>
            )}
            {/* 4 imágenes derecha en grid 2x2 */}
            {hasSmall && (
              <div className="grid grid-cols-2 grid-rows-2 gap-2">
                {[1, 2, 3, 4].map(idx => (
                  <div key={idx} className="rounded-xl overflow-hidden flex items-center justify-center" style={{ background: '#1a1220' }}>
                    {slide[idx]?.imagenPreview ? (
                      <img src={slide[idx].imagenPreview} alt={slide[idx].nombre} className="w-full h-full object-contain" />
                    ) : (
                      <span className="material-symbols-outlined text-xl text-white/20">image</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}
      {slides.length > 1 && (
        <div className="absolute bottom-2 right-3 flex gap-1.5 z-10">
          {slides.map((_, i) => (
            <button key={i} onClick={() => setPreviewSlide(i)}
              className={`h-1.5 rounded-full transition-all ${previewSlide === i ? 'w-5 bg-accent' : 'w-1.5 bg-white/50'}`} />
          ))}
        </div>
      )}
    </div>
  )
}

export default function AdminBanner() {
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  const esPremium = user.plan_id && user.plan_id >= 3

  const [activeSlide, setActiveSlide] = useState(1)
  const [items, setItems] = useState([])
  const [categoriasDB, setCategoriasDB] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const [toast, setToast] = useState(null)
  const fileInputRef = useRef(null)

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const fetchItems = () => {
    fetch(`${API}/api/v1/listings/mine`, { credentials: 'include' })
      .then(r => r.json())
      .then(data => {
        if (data.listings) {
          setItems(data.listings.filter(l => l.banner_orden).map(l => ({
            id: l.id, orden: l.banner_orden,
            nombre: l.nombre, descripcion: l.descripcion, precio: l.precio, precioOriginal: l.precio_original,
            subcategoria: l.subcategoria, categoria: l.categoria || '', badge: l.badge, tipo: l.tipo, seccion: l.seccion || 'destacados',
            tallas: l.tallas, medidas: l.medidas, genero: l.genero,
            imagenPreview: l.imagen ? `${API}${l.imagen}` : null, imagenUrl: l.imagen,
            posX: l.banner_pos_x ?? 50, posY: l.banner_pos_y ?? 50, scale: parseFloat(l.banner_scale) || 1,
          })))
        }
      })
      .catch(err => console.error('Error cargando:', err))
      .finally(() => setLoading(false))
  }

  // Construir tipos para fetch de categorías
  const tiposUsuario = [
    user.vende_productos && 'producto',
    user.ofrece_servicios && 'servicio',
    user.ofrece_arriendos && 'arriendo',
  ].filter(Boolean)

  useEffect(() => {
    if (!esPremium) { setLoading(false); return }
    // Cargar categorías en paralelo
    if (tiposUsuario.length > 0) {
      fetch(`${API}/api/v1/categorias?tipo=${tiposUsuario.join(',')}`)
        .then(r => r.json())
        .then(data => { if (data.categorias) setCategoriasDB(data.categorias) })
        .catch(err => console.error('Error cargando categorías:', err))
    }
    fetchItems()
  }, [])

  // Slide 1 = orden 1-5, Slide 2 = orden 6-10
  const slideOffset = (activeSlide - 1) * MAX_PER_SLIDE
  const slideItems = items
    .filter(i => i.orden > slideOffset && i.orden <= slideOffset + MAX_PER_SLIDE)
    .sort((a, b) => a.orden - b.orden)
  const principalItem = slideItems.find(i => i.orden === slideOffset + 1)
  const secondaryItems = slideItems.filter(i => i.orden !== slideOffset + 1)

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onloadend = () => {
      const img = new Image()
      img.onload = () => {
        const fitScale = Math.max(208 / img.naturalWidth, 208 / img.naturalHeight)
        setFormData(prev => ({
          ...prev, imagen: file, imagenPreview: reader.result,
          imagenNaturalW: img.naturalWidth, imagenNaturalH: img.naturalHeight,
          imagenPos: { x: (208 - img.naturalWidth * fitScale) / 2, y: (208 - img.naturalHeight * fitScale) / 2 }, imagenScale: 1,
        }))
      }
      img.src = reader.result
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      let imagenUrl = editingId ? items.find(p => p.id === editingId)?.imagenUrl : null

      if (formData.imagen && formData.imagenNaturalW) {
        const blob = await generateCroppedBlob(formData.imagenPreview, formData.imagenPos, formData.imagenScale, formData.imagenNaturalW, formData.imagenNaturalH)
        const fd = new FormData()
        fd.append('imagen', blob, 'banner.jpg')
        const upRes = await fetch(`${API}/api/v1/upload`, { method: 'POST', credentials: 'include', body: fd })
        const upData = await upRes.json()
        if (upData.url) imagenUrl = upData.url
      }

      const nextOrden = editingId
        ? items.find(p => p.id === editingId)?.orden || (slideOffset + slideItems.length + 1)
        : slideOffset + slideItems.length + 1

      const body = {
        tipo: formData.tipo || 'producto',
        seccion: formData.tipo === 'servicio' ? 'servicios' : formData.tipo === 'arriendo' ? 'arriendos' : (formData.seccion || 'destacados'),
        nombre: formData.nombre, descripcion: formData.descripcion,
        precio: Math.round(Number(formData.precio)) || 0,
        precio_original: formData.precioOriginal ? Math.round(Number(formData.precioOriginal)) : null,
        categoria: formData.categoria, subcategoria: formData.subcategoria, badge: formData.badge, genero: formData.genero || null,
        imagen: imagenUrl,
        tallas: formData.tallasTipo ? { tipo: formData.tallasTipo, seleccion: formData.tallasSeleccion } : null,
        medidas: formData.attrMedidas ? { alto: formData.medidasAlto, ancho: formData.medidasAncho, profundidad: formData.medidasProfundidad } : null,
        banner_orden: nextOrden,
      }

      const res = editingId
        ? await fetch(`${API}/api/v1/listings/${editingId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(body) })
        : await fetch(`${API}/api/v1/listings`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(body) })

      if (res.ok) {
        fetchItems()
        setEditingId(null); setFormData(emptyForm); setShowModal(false)
        showToast(editingId ? 'Banner actualizado' : 'Banner creado')
      } else {
        const err = await res.json().catch(() => ({}))
        showToast(err.error || 'Error al guardar', 'error')
      }
    } catch (err) { showToast('Error de conexión', 'error') }
    setSaving(false)
  }

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`${API}/api/v1/listings/${id}`, { method: 'DELETE', credentials: 'include' })
      if (res.ok) { setItems(prev => prev.filter(p => p.id !== id)); showToast('Eliminado') }
      else showToast('Error al eliminar', 'error')
    } catch (err) { showToast('Error de conexión', 'error') }
    setDeleteId(null)
  }

  const buildBodyFromItem = (item) => ({
    tipo: item.tipo || 'producto', seccion: item.tipo === 'servicio' ? 'servicios' : item.tipo === 'arriendo' ? 'arriendos' : (item.seccion || 'destacados'), nombre: item.nombre, descripcion: item.descripcion,
    precio: item.precio || 0, precio_original: item.precioOriginal || null, categoria: item.categoria || '', subcategoria: item.subcategoria,
    badge: item.badge, genero: item.genero || null, imagen: item.imagenUrl,
    tallas: item.tallas, medidas: item.medidas,
  })

  const handleSetPrincipal = (prod) => {
    const principalOrden = slideOffset + 1
    const currentPrincipal = items.find(i => i.orden === principalOrden)
    if (!currentPrincipal || currentPrincipal.id === prod.id) return

    const updated = items.map(i => {
      if (i.id === prod.id) return { ...i, orden: principalOrden }
      if (i.id === currentPrincipal.id) return { ...i, orden: prod.orden }
      return i
    })
    setItems(updated)

    // Guardar en BD
    Promise.all([
      fetch(`${API}/api/v1/listings/${prod.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ ...buildBodyFromItem(prod), banner_orden: principalOrden }) }),
      fetch(`${API}/api/v1/listings/${currentPrincipal.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ ...buildBodyFromItem(currentPrincipal), banner_orden: prod.orden }) }),
    ]).catch(err => console.error('Error reordenando:', err))
  }

  const openModal = () => {
    setEditingId(null)
    setFormData({ ...emptyForm, tipo: 'producto' })
    setShowModal(true)
  }

  const openEdit = (prod) => {
    setEditingId(prod.id)
    setFormData({
      nombre: prod.nombre, descripcion: prod.descripcion,
      precio: String(prod.precio), precioOriginal: prod.precioOriginal ? String(prod.precioOriginal) : '',
      categoria: prod.categoria || '', subcategoria: prod.subcategoria, badge: prod.badge || '', tipo: prod.tipo || 'producto',
      seccion: prod.seccion || 'destacados',
      attrMedidas: !!prod.medidas, tallasTipo: prod.tallas?.tipo || '', tallasSeleccion: prod.tallas?.seleccion || [],
      medidasAlto: prod.medidas?.alto || '', medidasAncho: prod.medidas?.ancho || '', medidasProfundidad: prod.medidas?.profundidad || '',
      genero: prod.genero || '', imagen: null, imagenPreview: prod.imagenPreview || null,
      imagenPos: { x: 0, y: 0 }, imagenScale: 1, imagenNaturalW: 0, imagenNaturalH: 0,
    })
    setShowModal(true)
  }


  if (!esPremium) {
    return (
      <div>
        <div className="mb-6"><h1 className="text-xl font-black text-gray-800">Banner</h1><p className="text-xs text-gray-400 mt-0.5">Productos destacados en el banner de tu página</p></div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <span className="material-symbols-outlined text-4xl text-gray-300 mb-3 block">lock</span>
          <h2 className="text-sm font-bold text-gray-600 mb-1">Función exclusiva del Plan Premium</h2>
          <p className="text-xs text-gray-400 max-w-sm mx-auto">El banner personalizado está disponible solo para usuarios con Plan Premium.</p>
        </div>
      </div>
    )
  }

  if (loading) return <div className="flex items-center justify-center py-20"><span className="material-symbols-outlined text-primary text-3xl animate-spin">progress_activity</span></div>

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-[100] px-4 py-2.5 rounded-lg text-xs font-bold shadow-lg flex items-center gap-2 animate-slide-in ${toast.type === 'error' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`}>
          <span className="material-symbols-outlined text-sm">{toast.type === 'error' ? 'error' : 'check_circle'}</span>
          {toast.msg}
        </div>
      )}

      <div className="mb-6">
        <h1 className="text-xl font-black text-gray-800">Banner</h1>
        <p className="text-xs text-gray-400 mt-0.5">Productos destacados en el banner de tu página premium (2 slides, {MAX_PER_SLIDE} por slide)</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {/* Tabs de slides */}
        <div className="flex border-b border-gray-200">
          {[1, 2].map((slide) => {
            return (
              <button key={slide} onClick={() => setActiveSlide(slide)}
                className={`flex-1 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold transition-colors relative ${activeSlide === slide ? 'text-primary' : 'text-gray-400 hover:text-gray-600'}`}>
                <span className="flex items-center justify-center gap-1 sm:gap-2">
                  <span className="material-symbols-outlined text-sm sm:text-base">photo_library</span>
                  Slide {slide}
                </span>
                {activeSlide === slide && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"></span>}
              </button>
            )
          })}
        </div>

        <div className="p-3 sm:p-5">
          {/* Vista previa real del banner */}
          <div className="mb-4">
            <p className="text-[10px] font-semibold text-gray-500 mb-2 flex items-center gap-1">
              <span className="material-symbols-outlined text-xs">visibility</span>
              Vista previa real — así se verá en tu página premium
            </p>
            <BannerPreview items={items} />
          </div>

          {/* Grid de productos */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-4">
            {/* Tarjeta agregar */}
            {slideItems.length < MAX_PER_SLIDE && (
              <button onClick={openModal}
                className="group flex flex-col items-center justify-center gap-3 border-2 border-dashed border-gray-300 rounded-xl p-6 min-h-[200px] hover:border-primary hover:bg-primary/5 transition-all cursor-pointer">
                <div className="w-14 h-14 rounded-full bg-gray-100 group-hover:bg-primary/10 flex items-center justify-center transition-colors">
                  <span className="material-symbols-outlined text-3xl text-gray-400 group-hover:text-primary transition-colors">add</span>
                </div>
                <span className="text-sm font-semibold text-gray-400 group-hover:text-primary transition-colors">Agregar</span>
              </button>
            )}

            {/* Tarjetas de productos */}
            {slideItems.map((prod) => {
              const isPrincipal = prod.orden === slideOffset + 1
              return (
                <div key={prod.id} className={`relative bg-white border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow ${isPrincipal ? 'border-amber-400 ring-2 ring-amber-200' : 'border-gray-200'}`}>
                  {isPrincipal && (
                    <div className="absolute top-0 left-0 right-0 bg-amber-400 text-white text-[9px] font-bold text-center py-0.5 z-10">
                      PRINCIPAL
                    </div>
                  )}
                  {prod.imagenPreview ? (
                    <img src={prod.imagenPreview} alt={prod.nombre} className={`w-full aspect-square object-cover ${isPrincipal ? 'pt-4' : ''}`} />
                  ) : (
                    <div className={`w-full aspect-square bg-gray-100 flex items-center justify-center ${isPrincipal ? 'pt-4' : ''}`}>
                      <span className="material-symbols-outlined text-3xl text-gray-300">image</span>
                    </div>
                  )}
                  {prod.badge && <span className="absolute top-2 left-2 text-[10px] font-bold bg-primary text-white px-2 py-0.5 rounded-full">{prod.badge}</span>}
                  <div className="p-3">
                    <p className="text-xs font-semibold text-gray-800 truncate">{prod.nombre}</p>
                    <p className="text-[10px] text-gray-400 truncate">{prod.descripcion}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      {prod.precio > 0 && <span className="text-sm font-bold text-primary">${prod.precio.toLocaleString('es-CL', { maximumFractionDigits: 0 })}</span>}
                      {prod.precioOriginal && <span className="text-[10px] text-gray-400 line-through">${prod.precioOriginal.toLocaleString('es-CL', { maximumFractionDigits: 0 })}</span>}
                    </div>
                    <div className="flex gap-1 mt-2">
                      {!isPrincipal && (
                        <button onClick={() => handleSetPrincipal(prod)} className="flex-1 flex items-center justify-center gap-0.5 py-1.5 rounded-lg text-[9px] font-semibold text-amber-600 bg-amber-50 hover:bg-amber-100 transition-colors" title="Hacer principal">
                          <span className="material-symbols-outlined text-xs">star</span>Principal
                        </button>
                      )}
                      <button onClick={() => openEdit(prod)} className="flex-1 flex items-center justify-center gap-0.5 py-1.5 rounded-lg text-[10px] font-semibold text-primary bg-primary/5 hover:bg-primary/10 transition-colors">
                        <span className="material-symbols-outlined text-sm">edit</span>Editar
                      </button>
                      <button onClick={() => setDeleteId(prod.id)} className="flex-1 flex items-center justify-center gap-0.5 py-1.5 rounded-lg text-[10px] font-semibold text-red-500 bg-red-50 hover:bg-red-100 transition-colors">
                        <span className="material-symbols-outlined text-sm">delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {slideItems.length === 0 && (
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center mt-4">
              <span className="material-symbols-outlined text-3xl text-gray-300 mb-2 block">photo_library</span>
              <p className="text-sm text-gray-400">No hay productos en este slide</p>
              <p className="text-[10px] text-gray-300 mt-1">Agrega {MAX_PER_SLIDE} productos para completar el slide</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal — igual que productos */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h3 className="text-sm font-bold text-gray-800">{editingId ? 'Editar producto del banner' : 'Nuevo producto para banner'}</h3>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
                <span className="material-symbols-outlined text-gray-400 text-lg">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 p-4">
              {/* Columna izquierda - Imagen */}
              <div className="w-full sm:w-52 shrink-0 flex flex-col items-center">
                {formData.imagenPreview ? (
                  <div className="relative w-52 mx-auto">
                    {formData.imagenNaturalW > 0 ? (
                      <ImageCropper src={formData.imagenPreview} pos={formData.imagenPos}
                        onPosChange={(pos) => setFormData(prev => ({ ...prev, imagenPos: pos }))}
                        naturalW={formData.imagenNaturalW} naturalH={formData.imagenNaturalH}
                        scale={formData.imagenScale} onScaleChange={(s) => setFormData(prev => ({ ...prev, imagenScale: s }))} />
                    ) : (
                      <img src={formData.imagenPreview} alt="Preview" className="w-52 h-52 object-cover rounded-lg border border-gray-200" />
                    )}
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="absolute top-1.5 left-1.5 bg-white/90 p-1 rounded-md shadow hover:bg-primary/10 transition-colors z-10">
                      <span className="material-symbols-outlined text-primary text-sm">edit</span>
                    </button>
                    <button type="button" onClick={() => setFormData(prev => ({ ...prev, imagen: null, imagenPreview: null, imagenPos: { x: 0, y: 0 }, imagenScale: 1, imagenNaturalW: 0, imagenNaturalH: 0 }))} className="absolute top-1.5 right-1.5 bg-white/90 p-1 rounded-md shadow hover:bg-red-50 transition-colors z-10">
                      <span className="material-symbols-outlined text-red-500 text-sm">close</span>
                    </button>
                  </div>
                ) : (
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="w-52 h-52 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center gap-2 hover:border-primary hover:bg-primary/5 transition-all cursor-pointer">
                    <span className="material-symbols-outlined text-3xl text-gray-400">cloud_upload</span>
                    <span className="text-xs text-gray-500">Buscar imagen</span>
                    <span className="text-[10px] text-gray-400">JPG, PNG, WEBP</span>
                  </button>
                )}
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />

                <div className="grid grid-cols-2 gap-2 mt-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 mb-0.5">Precio *</label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">$</span>
                      <input type="number" name="precio" value={formData.precio} onChange={handleInputChange} required min="0" step="1" onKeyDown={(e) => ['.', ',', 'e', 'E'].includes(e.key) && e.preventDefault()} className="w-full rounded-md border-gray-300 text-xs py-1.5 pl-6 focus:ring-primary focus:border-primary" placeholder="249990" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 mb-0.5">Precio anterior</label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">$</span>
                      <input type="number" name="precioOriginal" value={formData.precioOriginal} onChange={handleInputChange} min="0" step="1" onKeyDown={(e) => ['.', ',', 'e', 'E'].includes(e.key) && e.preventDefault()} className="w-full rounded-md border-gray-300 text-xs py-1.5 pl-6 focus:ring-primary focus:border-primary" placeholder="379990" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Columna derecha - Info */}
              <div className="flex-1 flex flex-col gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-0.5">Nombre *</label>
                  <input type="text" name="nombre" value={formData.nombre} onChange={handleInputChange} required className="w-full rounded-md border-gray-300 text-xs py-1.5 focus:ring-primary focus:border-primary" placeholder="Nombre del producto" />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-0.5">Descripción *</label>
                  <textarea name="descripcion" value={formData.descripcion} onChange={handleInputChange} required rows={2} className="w-full rounded-md border-gray-300 text-xs py-1.5 focus:ring-primary focus:border-primary resize-none" placeholder="Describe el producto..." />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 mb-0.5">Tipo *</label>
                    <select name="tipo" value={formData.tipo} onChange={(e) => setFormData(prev => ({ ...prev, tipo: e.target.value, categoria: '', subcategoria: '', seccion: 'destacados' }))} required className="w-full rounded-md border-gray-300 text-xs py-1.5 focus:ring-primary focus:border-primary">
                      <option value="">Seleccionar</option>
                      {user.vende_productos && <option value="producto">Productos</option>}
                      {user.ofrece_servicios && <option value="servicio">Servicios</option>}
                      {user.ofrece_arriendos && <option value="arriendo">Arriendos</option>}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 mb-0.5">Etiqueta</label>
                    <input type="text" name="badge" value={formData.badge} onChange={handleInputChange} className="w-full rounded-md border-gray-300 text-xs py-1.5 focus:ring-primary focus:border-primary" placeholder="Ej: Top Ventas" />
                  </div>
                </div>

                {formData.tipo === 'producto' && (
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 mb-0.5">Sección en la tienda *</label>
                    <select name="seccion" value={formData.seccion} onChange={handleInputChange} required className="w-full rounded-md border-gray-300 text-xs py-1.5 focus:ring-primary focus:border-primary">
                      {SECCIONES_PRODUCTO.map(s => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 mb-0.5">Categoría *</label>
                    <select name="categoria" value={formData.categoria} onChange={(e) => setFormData(prev => ({ ...prev, categoria: e.target.value, subcategoria: '' }))} required className="w-full rounded-md border-gray-300 text-xs py-1.5 focus:ring-primary focus:border-primary">
                      <option value="">Seleccionar categoría</option>
                      {categoriasDB.filter(c => !formData.tipo || c.tipo === formData.tipo).map(c => (
                        <option key={c.id} value={c.nombre}>{c.nombre}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 mb-0.5">Subcategoría *</label>
                    <select name="subcategoria" value={formData.subcategoria} onChange={handleInputChange} required className="w-full rounded-md border-gray-300 text-xs py-1.5 focus:ring-primary focus:border-primary">
                      <option value="">Seleccionar subcategoría</option>
                      {(categoriasDB.find(c => c.nombre === formData.categoria)?.subcategorias || []).map(s => (
                        <option key={s.id} value={s.nombre}>{s.nombre}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-600 mb-0.5">Tallas</label>
                      <select name="tallasTipo" value={formData.tallasTipo} onChange={(e) => setFormData(prev => ({ ...prev, tallasTipo: e.target.value, tallasSeleccion: [] }))} className="w-full rounded-md border-gray-300 text-xs py-1 focus:ring-primary focus:border-primary">
                        <option value="">Sin tallas</option>
                        <option value="calzado">Calzado</option>
                        <option value="ropa">Ropa</option>
                        <option value="accesorios">Accesorios</option>
                      </select>
                    </div>
                    <div className="flex items-end pb-0.5">
                      <button type="button" onClick={() => setFormData(prev => ({ ...prev, attrMedidas: !prev.attrMedidas, ...(!prev.attrMedidas ? {} : { medidasAlto: '', medidasAncho: '', medidasProfundidad: '' }) }))} className="flex items-center gap-1.5">
                        <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${formData.attrMedidas ? 'border-primary bg-primary' : 'border-gray-300'}`}>
                          {formData.attrMedidas && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </span>
                        <span className="text-[11px] font-semibold text-gray-600">Medidas</span>
                      </button>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-600 mb-0.5">Género</label>
                      <select name="genero" value={formData.genero} onChange={handleInputChange} className="w-full rounded-md border-gray-300 text-xs py-1 focus:ring-primary focus:border-primary">
                        <option value="">Sin definir</option>
                        <option value="Niño">Niño</option><option value="Niña">Niña</option>
                        <option value="Hombre">Hombre</option><option value="Mujer">Mujer</option><option value="Unisex">Unisex</option>
                      </select>
                    </div>
                  </div>

                  {formData.tallasTipo && (
                    <div className="flex flex-wrap gap-1.5">
                      {(formData.tallasTipo === 'calzado' ? TALLAS_CALZADO : formData.tallasTipo === 'ropa' ? TALLAS_ROPA : TALLAS_ACCESORIOS).map((t) => {
                        const sel = formData.tallasSeleccion.includes(t)
                        return <button key={t} type="button" onClick={() => setFormData(prev => ({ ...prev, tallasSeleccion: sel ? prev.tallasSeleccion.filter(s => s !== t) : [...prev.tallasSeleccion, t] }))} className={`min-w-[32px] px-1.5 py-0.5 text-[10px] font-semibold rounded border transition-colors ${sel ? 'border-primary bg-primary text-white' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>{t}</button>
                      })}
                    </div>
                  )}

                  {formData.attrMedidas && (
                    <div className="grid grid-cols-3 gap-2">
                      {[{ name: 'medidasAlto', label: 'Alto' }, { name: 'medidasAncho', label: 'Ancho' }, { name: 'medidasProfundidad', label: 'Profundidad' }].map(({ name, label }) => (
                        <div key={name}>
                          <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">{label} (cm)</label>
                          <input type="number" name={name} value={formData[name]} onChange={handleInputChange} min="0" step="1" className="w-full rounded-md border-gray-300 text-[10px] py-1 focus:ring-primary focus:border-primary" placeholder="0" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button type="submit" disabled={saving} className="mt-auto flex items-center justify-center gap-1.5 bg-accent text-primary py-2 rounded-lg text-xs font-bold hover:brightness-110 transition-all shadow-sm disabled:opacity-50">
                  <span className="material-symbols-outlined text-base">save</span>
                  {saving ? 'Guardando...' : editingId ? 'Actualizar' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Popup confirmar eliminación */}
      {deleteId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50" onClick={() => setDeleteId(null)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm mx-4 p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center"><span className="material-symbols-outlined text-2xl text-red-500">delete</span></div>
              <h3 className="text-sm font-bold text-gray-800">Eliminar del banner</h3>
              <p className="text-xs text-gray-500 text-center">¿Estás seguro? Esta acción no se puede deshacer.</p>
              <div className="flex gap-2 w-full mt-1">
                <button onClick={() => setDeleteId(null)} className="flex-1 py-2 rounded-lg text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors">Cancelar</button>
                <button onClick={() => handleDelete(deleteId)} className="flex-1 py-2 rounded-lg text-xs font-semibold text-white bg-red-500 hover:bg-red-600 transition-colors">Aceptar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
