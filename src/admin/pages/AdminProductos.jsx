import { useState, useRef, useCallback, useEffect } from 'react'

const API = import.meta.env.VITE_API || ''

const allTabs = [
  { id: 'destacados', label: 'Destacados', requiere: 'vende_productos' },
  { id: 'ofertas', label: 'Ofertas', requiere: 'vende_productos' },
  { id: 'novedades', label: 'Novedades', requiere: 'vende_productos' },
  { id: 'liquidacion', label: 'Liquidación', requiere: 'vende_productos' },
  { id: 'tecnologia', label: 'Tecnología', requiere: 'vende_productos' },
  { id: 'tendencia', label: 'Tendencia', requiere: 'vende_productos' },
  { id: 'servicios', label: 'Servicios', requiere: 'ofrece_servicios' },
  { id: 'arriendos', label: 'Arriendos', requiere: 'ofrece_arriendos' },
]

const emptyForm = {
  nombre: '',
  descripcion: '',
  precio: '',
  precioOriginal: '',
  seccion: '',
  categoria: '',
  categoria_id: null,
  subcategoria: '',
  subcategoria_id: null,
  badge: '',
  tipo: '',
  attrMedidas: false,
  tallasTipo: '',
  tallasSeleccion: [],
  medidasAlto: '',
  medidasAncho: '',
  medidasProfundidad: '',
  genero: '',
  imagen: null,
  imagenPreview: null,
  imagenPos: { x: 0, y: 0 },
  imagenScale: 1,
  imagenNaturalW: 0,
  imagenNaturalH: 0,
}

const TALLAS_CALZADO = ['20','21','22','23','24','25','26','27','28','29','30','31','32','33','34','35','36','37','38','39','40','41','42','43','44','45','46']
const TALLAS_ROPA = ['2','4','6','8','10','12','14','16','XS','S','M','L','XL','XXL','XXXL']
const TALLAS_ACCESORIOS = ['XS','S','M','L','XL','Único']

function generateCroppedImage(src, pos, scale, naturalW, naturalH, size = 400) {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = size
      canvas.height = size
      const fitScale = Math.max(size / naturalW, size / naturalH) * scale
      const drawW = naturalW * fitScale
      const drawH = naturalH * fitScale
      const ctx = canvas.getContext('2d')
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, size, size)
      ctx.drawImage(img, pos.x * (size / 208), pos.y * (size / 208), drawW, drawH)
      canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.9)
    }
    img.src = src
  })
}

function ImageCropper({ src, pos, onPosChange, naturalW, naturalH, scale, onScaleChange }) {
  const containerRef = useRef(null)
  const dragging = useRef(false)
  const startPoint = useRef({ x: 0, y: 0 })
  const startPos = useRef({ x: 0, y: 0 })

  const fitScale = naturalW && naturalH ? Math.max(208 / naturalW, 208 / naturalH) * scale : 1
  const drawW = naturalW * fitScale
  const drawH = naturalH * fitScale

  const clampPos = useCallback((x, y) => {
    let cx, cy
    if (drawW >= 208) {
      cx = Math.max(208 - drawW, Math.min(0, x))
    } else {
      cx = (208 - drawW) / 2
    }
    if (drawH >= 208) {
      cy = Math.max(208 - drawH, Math.min(0, y))
    } else {
      cy = (208 - drawH) / 2
    }
    return { x: cx, y: cy }
  }, [drawW, drawH])

  const handleStart = (clientX, clientY) => {
    dragging.current = true
    startPoint.current = { x: clientX, y: clientY }
    startPos.current = { ...pos }
  }

  const handleMove = useCallback((clientX, clientY) => {
    if (!dragging.current) return
    const dx = clientX - startPoint.current.x
    const dy = clientY - startPoint.current.y
    onPosChange(clampPos(startPos.current.x + dx, startPos.current.y + dy))
  }, [clampPos, onPosChange])

  const handleEnd = useCallback(() => { dragging.current = false }, [])

  useEffect(() => {
    const onMouseMove = (e) => handleMove(e.clientX, e.clientY)
    const onTouchMove = (e) => { e.preventDefault(); handleMove(e.touches[0].clientX, e.touches[0].clientY) }
    const onUp = () => handleEnd()
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onUp)
    window.addEventListener('touchmove', onTouchMove, { passive: false })
    window.addEventListener('touchend', onUp)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onUp)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend', onUp)
    }
  }, [handleMove, handleEnd])

  useEffect(() => { onPosChange(clampPos(pos.x, pos.y)) }, [scale])

  const step = 10
  const nudge = (dx, dy) => onPosChange(clampPos(pos.x + dx, pos.y + dy))

  const canMove = {
    left: drawW > 208 && pos.x < 0,
    right: drawW > 208 && pos.x > 208 - drawW,
    up: drawH > 208 && pos.y < 0,
    down: drawH > 208 && pos.y > 208 - drawH,
  }

  const arrowBtn = "absolute z-10 bg-white/80 hover:bg-white rounded-full shadow p-0.5 transition-all disabled:opacity-0 disabled:pointer-events-none"

  return (
    <div className="relative">
      <div className="relative">
        {/* Flechas de dirección */}
        <button type="button" onClick={() => nudge(step, 0)} disabled={!canMove.left} className={`${arrowBtn} left-1 top-1/2 -translate-y-1/2`}>
          <span className="material-symbols-outlined text-gray-500 text-base">chevron_left</span>
        </button>
        <button type="button" onClick={() => nudge(-step, 0)} disabled={!canMove.right} className={`${arrowBtn} right-1 top-1/2 -translate-y-1/2`}>
          <span className="material-symbols-outlined text-gray-500 text-base">chevron_right</span>
        </button>
        <button type="button" onClick={() => nudge(0, step)} disabled={!canMove.up} className={`${arrowBtn} top-1 left-1/2 -translate-x-1/2`}>
          <span className="material-symbols-outlined text-gray-500 text-base">expand_less</span>
        </button>
        <button type="button" onClick={() => nudge(0, -step)} disabled={!canMove.down} className={`${arrowBtn} bottom-1 left-1/2 -translate-x-1/2`}>
          <span className="material-symbols-outlined text-gray-500 text-base">expand_more</span>
        </button>

        <div
          ref={containerRef}
          className="w-52 h-52 rounded-lg border border-gray-200 overflow-hidden cursor-grab active:cursor-grabbing select-none bg-white"
          onMouseDown={(e) => { e.preventDefault(); handleStart(e.clientX, e.clientY) }}
          onTouchStart={(e) => handleStart(e.touches[0].clientX, e.touches[0].clientY)}
        >
          <img src={src} alt="Preview" draggable={false} className="pointer-events-none" style={{ width: drawW, height: drawH, transform: `translate(${pos.x}px, ${pos.y}px)`, maxWidth: 'none' }} />
        </div>
      </div>
      <div className="flex items-center gap-2 mt-2">
        <span className="material-symbols-outlined text-gray-400 text-sm">zoom_out</span>
        <input type="range" min="0.5" max="1.5" step="0.02" value={scale} onChange={(e) => onScaleChange(Number(e.target.value))} className="flex-1 h-1 accent-primary" />
        <span className="material-symbols-outlined text-gray-400 text-sm">zoom_in</span>
      </div>
      <p className="text-[10px] text-gray-400 text-center mt-1">Arrastra o usa las flechas</p>
    </div>
  )
}

export default function AdminProductos() {
  const user = JSON.parse(localStorage.getItem('user') || '{}')


  // Filtrar tabs según permisos del usuario
  const tabs = allTabs.filter((tab) => {
    if (tab.requiere === 'vende_productos') return user.vende_productos
    if (tab.requiere === 'ofrece_servicios') return user.ofrece_servicios
    if (tab.requiere === 'ofrece_arriendos') return user.ofrece_arriendos
    return true
  })

  const [activeTab, setActiveTab] = useState(tabs[0]?.id || 'destacados')
  const [productos, setProductos] = useState([])
  const [categoriasDB, setCategoriasDB] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const [toast, setToast] = useState(null)
  const [seccionPopup, setSeccionPopup] = useState(null)
  const fileInputRef = useRef(null)

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  // Construir tipos para fetch de categorías según permisos
  const tiposUsuario = [
    user.vende_productos && 'producto',
    user.ofrece_servicios && 'servicio',
    user.ofrece_arriendos && 'arriendo',
  ].filter(Boolean)

  // Cargar categorías desde API (independiente de productos)
  useEffect(() => {
    const catUrl = tiposUsuario.length > 0
      ? `${API}/api/v1/categorias?tipo=${tiposUsuario.join(',')}`
      : `${API}/api/v1/categorias`

    fetch(catUrl)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then(data => {
        if (data.categorias) {
          setCategoriasDB(data.categorias)
        }
      })
      .catch(err => console.error('Error cargando categorías:', err))
  }, [])

  // Cargar productos desde API
  useEffect(() => {
    
    fetch(`${API}/api/v1/listings/mine`, { credentials: 'include' })
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then(data => {
        if (data.listings) {
          setProductos(data.listings.filter(l => !l.banner_orden).map(l => ({
            id: l.id,
            seccion: l.seccion || 'destacados',
            nombre: l.nombre,
            descripcion: l.descripcion,
            precio: l.precio,
            precioOriginal: l.precio_original,
            categoria: l.categoria || '',
            categoria_id: l.categoria_id || null,
            subcategoria: l.subcategoria,
            subcategoria_id: l.subcategoria_id || null,
            badge: l.badge,
            tipo: l.tipo,
            tallas: l.tallas,
            medidas: l.medidas,
            genero: l.genero,
            imagenPreview: l.imagen ? `${API}${l.imagen}` : null,
            imagenUrl: l.imagen,
          })))
        }
      })
      .catch(err => console.error('Error cargando productos:', err))
      .finally(() => setLoading(false))
  }, [])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        const img = new Image()
        img.onload = () => {
          const fitScale = Math.max(208 / img.naturalWidth, 208 / img.naturalHeight)
          const drawW = img.naturalWidth * fitScale
          const drawH = img.naturalHeight * fitScale
          setFormData((prev) => ({
            ...prev,
            imagen: file,
            imagenPreview: reader.result,
            imagenNaturalW: img.naturalWidth,
            imagenNaturalH: img.naturalHeight,
            imagenPos: { x: (208 - drawW) / 2, y: (208 - drawH) / 2 },
            imagenScale: 1,
          }))
        }
        img.src = reader.result
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e, overrideSeccion) => {
    e.preventDefault()

    // Validar que el tipo coincida con la pestaña
    const tipo = formData.tipo
    const seccionDestino = overrideSeccion || activeTab
    if (tipo && !overrideSeccion) {
      const SECCION_CORRECTA = { servicio: 'servicios', arriendo: 'arriendos' }
      const TIPO_LABEL = { servicio: 'Servicios', arriendo: 'Arriendos', producto: 'Productos' }
      if (tipo === 'servicio' && seccionDestino !== 'servicios') {
        setSeccionPopup({ tipo, seccionCorrecta: 'servicios', label: TIPO_LABEL[tipo] })
        return
      }
      if (tipo === 'arriendo' && seccionDestino !== 'arriendos') {
        setSeccionPopup({ tipo, seccionCorrecta: 'arriendos', label: TIPO_LABEL[tipo] })
        return
      }
      if (tipo === 'producto' && (seccionDestino === 'servicios' || seccionDestino === 'arriendos')) {
        setSeccionPopup({ tipo, seccionCorrecta: 'destacados', label: TIPO_LABEL[tipo] })
        return
      }
    }

    setSaving(true)

    try {
      let imagenUrl = editingId ? productos.find(p => p.id === editingId)?.imagenUrl : null

      // Subir imagen si hay una nueva
      if (formData.imagen && formData.imagenNaturalW) {
        const blob = await generateCroppedImage(
          formData.imagenPreview,
          formData.imagenPos,
          formData.imagenScale,
          formData.imagenNaturalW,
          formData.imagenNaturalH
        )
        const fd = new FormData()
        fd.append('imagen', blob, 'producto.jpg')
        const uploadRes = await fetch(`${API}/api/v1/upload`, {
          method: 'POST',
          credentials: 'include',
          body: fd
        })
        const uploadData = await uploadRes.json()
        if (uploadData.url) imagenUrl = uploadData.url
      }

      // Determinar tipo automático según sección
      let tipo = formData.tipo
      if (!tipo) {
        if (activeTab === 'servicios') tipo = 'servicio'
        else if (activeTab === 'arriendos') tipo = 'arriendo'
        else tipo = 'producto'
      }

      const body = {
        tipo,
        seccion: overrideSeccion || formData.seccion || activeTab,
        nombre: formData.nombre,
        descripcion: formData.descripcion,
        precio: Math.round(Number(formData.precio)) || 0,
        precio_original: formData.precioOriginal ? Math.round(Number(formData.precioOriginal)) : null,
        categoria: formData.categoria,
        categoria_id: formData.categoria_id || null,
        subcategoria: formData.subcategoria,
        subcategoria_id: formData.subcategoria_id || null,
        badge: formData.badge,
        genero: formData.genero || null,
        imagen: imagenUrl,
        tallas: formData.tallasTipo ? { tipo: formData.tallasTipo, seleccion: formData.tallasSeleccion } : null,
        medidas: formData.attrMedidas ? { alto: formData.medidasAlto, ancho: formData.medidasAncho, profundidad: formData.medidasProfundidad } : null,
      }

      let res
      if (editingId) {
        res = await fetch(`${API}/api/v1/listings/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' }, credentials: 'include',
          body: JSON.stringify(body)
        })
      } else {
        res = await fetch(`${API}/api/v1/listings`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }, credentials: 'include',
          body: JSON.stringify(body)
        })
      }

      if (res.ok) {
        // Recargar lista
        const listRes = await fetch(`${API}/api/v1/listings/mine`, {
          credentials: 'include'
        })
        const listData = await listRes.json()
        if (listData.listings) {
          setProductos(listData.listings.filter(l => !l.banner_orden).map(l => ({
            id: l.id,
            seccion: l.seccion || 'destacados',
            nombre: l.nombre,
            descripcion: l.descripcion,
            precio: l.precio,
            precioOriginal: l.precio_original,
            categoria: l.categoria || '',
            categoria_id: l.categoria_id || null,
            subcategoria: l.subcategoria,
            subcategoria_id: l.subcategoria_id || null,
            badge: l.badge,
            tipo: l.tipo,
            tallas: l.tallas,
            medidas: l.medidas,
            genero: l.genero,
            imagenPreview: l.imagen ? `${API}${l.imagen}` : null,
            imagenUrl: l.imagen,
          })))
        }
        setEditingId(null)
        setFormData(emptyForm)
        setShowModal(false)
        if (overrideSeccion) setActiveTab(overrideSeccion)
        showToast(editingId ? 'Producto actualizado' : 'Producto creado' + (overrideSeccion ? ` en ${overrideSeccion}` : ''))
      } else {
        const errData = await res.json().catch(() => ({}))
        showToast(errData.error || 'Error al guardar', 'error')
      }
    } catch (err) {
      showToast('Error de conexión', 'error')
    }
    setSaving(false)
  }

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`${API}/api/v1/listings/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      })
      if (res.ok) {
        setProductos((prev) => prev.filter((p) => p.id !== id))
        showToast('Producto eliminado')
      } else {
        showToast('Error al eliminar', 'error')
      }
    } catch (err) {
      showToast('Error de conexión', 'error')
    }
    setDeleteId(null)
  }

  const openModal = () => {
    setEditingId(null)
    // Autoseleccionar tipo según tab activo
    let defaultTipo = ''
    if (activeTab === 'servicios') defaultTipo = 'servicio'
    else if (activeTab === 'arriendos') defaultTipo = 'arriendo'
    else defaultTipo = 'producto'
    setFormData({ ...emptyForm, tipo: defaultTipo })
    setShowModal(true)
  }

  const openEdit = (prod) => {
    setEditingId(prod.id)
    setFormData({
      nombre: prod.nombre,
      descripcion: prod.descripcion,
      precio: String(prod.precio),
      precioOriginal: prod.precioOriginal ? String(prod.precioOriginal) : '',
      categoria: prod.categoria || '',
      categoria_id: prod.categoria_id || null,
      subcategoria: prod.subcategoria,
      subcategoria_id: prod.subcategoria_id || null,
      badge: prod.badge || '',
      tipo: prod.tipo || '',
      seccion: prod.seccion || 'destacados',
      attrMedidas: !!prod.medidas,
      tallasTipo: prod.tallas?.tipo || '',
      tallasSeleccion: prod.tallas?.seleccion || [],
      medidasAlto: prod.medidas?.alto || '',
      medidasAncho: prod.medidas?.ancho || '',
      medidasProfundidad: prod.medidas?.profundidad || '',
      genero: prod.genero || '',
      imagen: null,
      imagenPreview: prod.imagenPreview || null,
      imagenPos: { x: 0, y: 0 },
      imagenScale: 1,
      imagenNaturalW: 0,
      imagenNaturalH: 0,
    })
    setShowModal(true)
  }

  const productosDeTab = productos.filter((p) => p.seccion === activeTab)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <span className="material-symbols-outlined text-primary text-3xl animate-spin">progress_activity</span>
      </div>
    )
  }

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-[100] px-4 py-2.5 rounded-lg text-xs font-bold shadow-lg flex items-center gap-2 animate-slide-in ${toast.type === 'error' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`}>
          <span className="material-symbols-outlined text-sm">{toast.type === 'error' ? 'error' : 'check_circle'}</span>
          {toast.msg}
        </div>
      )}

      <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 mb-4 sm:mb-6">Productos</h1>

      {/* Pestañas */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
        {/* MOBILE: select dropdown */}
        <div className="sm:hidden p-2 border-b border-gray-200">
          <select
            value={activeTab}
            onChange={(e) => setActiveTab(e.target.value)}
            className="w-full rounded-lg border-gray-300 text-xs py-2 px-3 font-semibold text-primary focus:ring-primary focus:border-primary"
          >
            {tabs.map((tab) => {
              const count = productos.filter((p) => p.seccion === tab.id).length
              return <option key={tab.id} value={tab.id}>{tab.label}{count > 0 ? ` (${count})` : ''}</option>
            })}
          </select>
        </div>
        {/* TABLET/DESKTOP: tabs horizontales */}
        <div className="hidden sm:flex overflow-x-auto border-b border-gray-200">
          {tabs.map((tab) => {
            const count = productos.filter((p) => p.seccion === tab.id).length
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 md:px-5 py-3 md:py-3.5 text-xs md:text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary text-primary bg-primary/5'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
                {count > 0 && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                    activeTab === tab.id ? 'bg-primary text-white' : 'bg-gray-200 text-gray-600'
                  }`}>{count}</span>
                )}
              </button>
            )
          })}
        </div>

        {/* Grid de productos */}
        <div className="p-2 sm:p-4 md:p-6">
          {/* MOBILE: grid 2 columnas como página principal */}
          <div className="sm:hidden grid grid-cols-2 gap-2">
            <button
              onClick={openModal}
              className="group flex flex-col items-center justify-center gap-1.5 border-2 border-dashed border-gray-300 rounded-xl p-3 aspect-[3/4] hover:border-primary hover:bg-primary/5 transition-all"
            >
              <span className="material-symbols-outlined text-2xl text-gray-300 group-hover:text-primary">add_circle</span>
              <span className="text-[10px] font-semibold text-gray-400 group-hover:text-primary">Agregar</span>
            </button>

            {productosDeTab.map((prod) => (
              <div key={prod.id} className="relative bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm flex flex-col">
                <div className="relative h-32 bg-gray-100">
                  {prod.imagenPreview ? (
                    <img src={prod.imagenPreview} alt={prod.nombre} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="material-symbols-outlined text-2xl text-gray-300">image</span>
                    </div>
                  )}
                  {prod.badge && (
                    <span className="absolute top-1 left-1 text-[7px] font-bold bg-primary text-white px-1.5 py-0.5 rounded-full">{prod.badge}</span>
                  )}
                </div>
                <div className="px-1.5 py-1.5 flex flex-col flex-1">
                  <p className="text-[10px] font-bold text-gray-800 line-clamp-2 leading-tight">{prod.nombre}</p>
                  <p className="text-[8px] text-gray-400 truncate mt-0.5">{prod.subcategoria}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    {prod.precio > 0 && (
                      <span className="text-[10px] font-black text-primary">${prod.precio.toLocaleString('es-CL', { maximumFractionDigits: 0 })}</span>
                    )}
                    {prod.precioOriginal && (
                      <span className="text-[8px] text-gray-400 line-through">${prod.precioOriginal.toLocaleString('es-CL', { maximumFractionDigits: 0 })}</span>
                    )}
                  </div>
                  <div className="flex gap-1 mt-auto pt-1">
                    <button onClick={() => openEdit(prod)} className="flex-1 flex items-center justify-center gap-0.5 py-1 rounded-md text-[8px] font-semibold text-primary bg-primary/5 active:bg-primary/10">
                      <span className="material-symbols-outlined text-xs">edit</span>
                      Editar
                    </button>
                    <button onClick={() => setDeleteId(prod.id)} className="flex-1 flex items-center justify-center gap-0.5 py-1 rounded-md text-[8px] font-semibold text-red-500 bg-red-50 active:bg-red-100">
                      <span className="material-symbols-outlined text-xs">delete</span>
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* TABLET/DESKTOP: grid de tarjetas */}
          <div className="hidden sm:grid sm:grid-cols-3 md:grid-cols-5 gap-3 md:gap-4">
            <button
              onClick={openModal}
              className="group flex flex-col items-center justify-center gap-3 border-2 border-dashed border-gray-300 rounded-xl p-6 min-h-[200px] hover:border-primary hover:bg-primary/5 transition-all cursor-pointer"
            >
              <div className="w-14 h-14 rounded-full bg-gray-100 group-hover:bg-primary/10 flex items-center justify-center transition-colors">
                <span className="material-symbols-outlined text-3xl text-gray-400 group-hover:text-primary transition-colors">add</span>
              </div>
              <span className="text-sm font-semibold text-gray-400 group-hover:text-primary transition-colors">Agregar producto</span>
            </button>

            {productosDeTab.map((prod) => (
              <div key={prod.id} className="relative bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                {prod.imagenPreview ? (
                  <img src={prod.imagenPreview} alt={prod.nombre} className="w-full aspect-square object-cover" />
                ) : (
                  <div className="w-full aspect-square bg-gray-100 flex items-center justify-center">
                    <span className="material-symbols-outlined text-3xl text-gray-300">image</span>
                  </div>
                )}
                {prod.badge && (
                  <span className="absolute top-2 left-2 text-[10px] font-bold bg-primary text-white px-2 py-0.5 rounded-full">{prod.badge}</span>
                )}
                <div className="p-3">
                  <p className="text-xs font-semibold text-gray-800 truncate">{prod.nombre}</p>
                  <p className="text-[10px] text-gray-400 truncate">{prod.subcategoria}</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    {prod.precio > 0 && (
                      <span className="text-sm font-bold text-primary">${prod.precio.toLocaleString('es-CL', { maximumFractionDigits: 0 })}</span>
                    )}
                    {prod.precioOriginal && (
                      <span className="text-[10px] text-gray-400 line-through">${prod.precioOriginal.toLocaleString('es-CL', { maximumFractionDigits: 0 })}</span>
                    )}
                  </div>
                  <div className="flex gap-1.5 mt-2">
                    <button
                      onClick={() => openEdit(prod)}
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[10px] font-semibold text-primary bg-primary/5 hover:bg-primary/10 transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm">edit</span>
                      Editar
                    </button>
                    <button
                      onClick={() => setDeleteId(prod.id)}
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[10px] font-semibold text-red-500 bg-red-50 hover:bg-red-100 transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm">delete</span>
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-2 sm:mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h3 className="text-xs sm:text-sm font-bold text-gray-800">{editingId ? 'Editar producto' : 'Nuevo producto'}</h3>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
                <span className="material-symbols-outlined text-gray-400 text-lg">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 sm:gap-4 p-3 sm:p-4">
              {/* Columna izquierda - Imagen */}
              <div className="w-full sm:w-52 shrink-0 flex flex-col items-center sm:items-start">
                {formData.imagenPreview ? (
                  <div className="relative">
                    {formData.imagenNaturalW > 0 ? (
                      <ImageCropper
                        src={formData.imagenPreview}
                        pos={formData.imagenPos}
                        onPosChange={(pos) => setFormData((prev) => ({ ...prev, imagenPos: pos }))}
                        naturalW={formData.imagenNaturalW}
                        naturalH={formData.imagenNaturalH}
                        scale={formData.imagenScale}
                        onScaleChange={(s) => setFormData((prev) => ({ ...prev, imagenScale: s }))}
                      />
                    ) : (
                      <img src={formData.imagenPreview} alt="Preview" className="w-52 h-52 object-cover rounded-lg border border-gray-200" />
                    )}
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="absolute top-1.5 left-1.5 bg-white/90 p-1 rounded-md shadow hover:bg-primary/10 transition-colors z-10">
                      <span className="material-symbols-outlined text-primary text-sm">edit</span>
                    </button>
                    <button type="button" onClick={() => setFormData((prev) => ({ ...prev, imagen: null, imagenPreview: null, imagenPos: { x: 0, y: 0 }, imagenScale: 1, imagenNaturalW: 0, imagenNaturalH: 0 }))} className="absolute top-1.5 right-1.5 bg-white/90 p-1 rounded-md shadow hover:bg-red-50 transition-colors z-10">
                      <span className="material-symbols-outlined text-red-500 text-sm">close</span>
                    </button>
                  </div>
                ) : (
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="w-40 h-40 sm:w-52 sm:h-52 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center gap-2 hover:border-primary hover:bg-primary/5 transition-all cursor-pointer">
                    <span className="material-symbols-outlined text-2xl sm:text-3xl text-gray-400">cloud_upload</span>
                    <span className="text-[10px] sm:text-xs text-gray-500">Buscar imagen</span>
                    <span className="text-[9px] sm:text-[10px] text-gray-400">JPG, PNG, WEBP</span>
                  </button>
                )}
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />

                <div className="grid grid-cols-2 gap-2 mt-3">
                  <div>
                    <label className="block text-[10px] sm:text-[11px] font-semibold text-gray-600 mb-0.5">Precio *</label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">$</span>
                      <input type="number" name="precio" value={formData.precio} onChange={handleInputChange} required min="0" step="1" onKeyDown={(e) => ['.', ',', 'e', 'E'].includes(e.key) && e.preventDefault()} className="w-full rounded-md border-gray-300 text-xs py-1.5 pl-6 focus:ring-primary focus:border-primary" placeholder="249990" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] sm:text-[11px] font-semibold text-gray-600 mb-0.5">Precio anterior</label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">$</span>
                      <input type="number" name="precioOriginal" value={formData.precioOriginal} onChange={handleInputChange} min="0" step="1" onKeyDown={(e) => ['.', ',', 'e', 'E'].includes(e.key) && e.preventDefault()} className="w-full rounded-md border-gray-300 text-xs py-1.5 pl-6 focus:ring-primary focus:border-primary" placeholder="379990" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Columna derecha - Info */}
              <div className="flex-1 flex flex-col gap-2 sm:gap-3">
                <div>
                  <label className="block text-[10px] sm:text-[11px] font-semibold text-gray-600 mb-0.5">Nombre *</label>
                  <input type="text" name="nombre" value={formData.nombre} onChange={handleInputChange} required className="w-full rounded-md border-gray-300 text-[11px] sm:text-xs py-1 sm:py-1.5 focus:ring-primary focus:border-primary" placeholder="Nombre del producto" />
                </div>

                <div>
                  <label className="block text-[10px] sm:text-[11px] font-semibold text-gray-600 mb-0.5">Descripción *</label>
                  <textarea
                    name="descripcion"
                    value={formData.descripcion}
                    onChange={(e) => {
                      const words = e.target.value.trim() ? e.target.value.trim().split(/\s+/) : []
                      if (words.length <= 40) handleInputChange(e)
                    }}
                    required
                    rows={3}
                    className={`w-full rounded-md text-[11px] sm:text-xs py-1 sm:py-1.5 focus:ring-primary focus:border-primary resize-none ${(formData.descripcion.trim() ? formData.descripcion.trim().split(/\s+/).length : 0) >= 35 ? 'border-amber-400 bg-amber-50/50' : 'border-gray-300'} ${(formData.descripcion.trim() ? formData.descripcion.trim().split(/\s+/).length : 0) >= 40 ? 'border-red-400 bg-red-50/50' : ''}`}
                    placeholder="Describe el producto (máx. 40 palabras)..."
                  />
                  {(() => {
                    const count = formData.descripcion.trim() ? formData.descripcion.trim().split(/\s+/).length : 0
                    const remaining = 40 - count
                    return (
                      <p className={`text-[9px] sm:text-[10px] mt-0.5 font-semibold ${count >= 40 ? 'text-red-500' : count >= 35 ? 'text-amber-500' : 'text-gray-400'}`}>
                        {count}/40 palabras{remaining > 0 ? ` · Quedan ${remaining}` : ' · Límite alcanzado'}
                      </p>
                    )
                  })()}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] sm:text-[11px] font-semibold text-gray-600 mb-0.5">Tipo *</label>
                    <select name="tipo" value={formData.tipo} onChange={(e) => { const t = e.target.value; const s = t === 'servicio' ? 'servicios' : t === 'arriendo' ? 'arriendos' : (['servicios','arriendos'].includes(formData.seccion) ? activeTab : formData.seccion) || activeTab; setFormData(prev => ({ ...prev, tipo: t, seccion: s, categoria: '', categoria_id: null, subcategoria: '', subcategoria_id: null })) }} required className="w-full rounded-md border-gray-300 text-gray-800 bg-white text-[11px] sm:text-xs py-1 sm:py-1.5 focus:ring-primary focus:border-primary">
                      <option value="">Seleccionar</option>
                      {user.vende_productos && <option value="producto">Productos</option>}
                      {user.ofrece_servicios && <option value="servicio">Servicios</option>}
                      {user.ofrece_arriendos && <option value="arriendo">Arriendos</option>}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] sm:text-[11px] font-semibold text-gray-600 mb-0.5">Etiqueta</label>
                    <input type="text" name="badge" value={formData.badge} onChange={handleInputChange} className="w-full rounded-md border-gray-300 text-[11px] sm:text-xs py-1 sm:py-1.5 focus:ring-primary focus:border-primary" placeholder="Ej: Top Ventas" />
                  </div>
                </div>
                {formData.tipo === 'producto' && (
                  <div>
                    <label className="block text-[10px] sm:text-[11px] font-semibold text-gray-600 mb-0.5">Sección</label>
                    <select name="seccion" value={formData.seccion} onChange={(e) => setFormData(prev => ({ ...prev, seccion: e.target.value }))} className="w-full rounded-md border-gray-300 text-gray-800 bg-white text-[11px] sm:text-xs py-1 sm:py-1.5 focus:ring-primary focus:border-primary">
                      <option value="destacados">Destacados</option>
                      <option value="ofertas">Ofertas</option>
                      <option value="novedades">Novedades</option>
                      <option value="liquidacion">Liquidación</option>
                      <option value="tecnologia">Tecnología</option>
                      <option value="tendencia">Tendencia</option>
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] sm:text-[11px] font-semibold text-gray-600 mb-0.5">Categoría *</label>
                    <select name="categoria" value={formData.categoria_id ?? ''} onChange={(e) => { const cat = categoriasDB.find(c => c.id === Number(e.target.value)); setFormData(prev => ({ ...prev, categoria_id: cat ? cat.id : null, categoria: cat ? cat.nombre : '', subcategoria: '', subcategoria_id: null })) }} disabled={!formData.tipo} required className="w-full rounded-md border-gray-300 text-gray-800 bg-white text-[11px] sm:text-xs py-1 sm:py-1.5 focus:ring-primary focus:border-primary disabled:opacity-50">
                      <option value="">Seleccionar categoría</option>
                      {categoriasDB.filter(c => !formData.tipo || c.tipo === formData.tipo).map(c => (
                        <option key={c.id} value={c.id}>{c.nombre}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] sm:text-[11px] font-semibold text-gray-600 mb-0.5">Subcategoría *</label>
                    <select name="subcategoria" value={formData.subcategoria_id ?? ''} onChange={(e) => { const subcat = (categoriasDB.find(c => c.id === formData.categoria_id)?.subcategorias || []).find(s => s.id === Number(e.target.value)); setFormData(prev => ({ ...prev, subcategoria_id: subcat ? subcat.id : null, subcategoria: subcat ? subcat.nombre : '' })) }} disabled={!formData.categoria_id} required className="w-full rounded-md border-gray-300 text-gray-800 bg-white text-[11px] sm:text-xs py-1 sm:py-1.5 focus:ring-primary focus:border-primary disabled:opacity-50">
                      <option value="">Seleccionar subcategoría</option>
                      {(categoriasDB.find(c => c.id === formData.categoria_id)?.subcategorias || []).map(s => (
                        <option key={s.id} value={s.id}>{s.nombre}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {formData.tipo === 'producto' && (
                <div className="space-y-1">
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] sm:text-[11px] font-semibold text-gray-600 mb-0.5">Tallas</label>
                      <select name="tallasTipo" value={formData.tallasTipo} onChange={(e) => setFormData((prev) => ({ ...prev, tallasTipo: e.target.value, tallasSeleccion: [] }))} className="w-full rounded-md border-gray-300 text-gray-800 bg-white text-[11px] sm:text-xs py-1 sm:py-1.5 focus:ring-primary focus:border-primary">
                        <option value="">Sin tallas</option>
                        <option value="calzado">Calzado</option>
                        <option value="ropa">Ropa</option>
                        <option value="accesorios">Accesorios</option>
                      </select>
                    </div>
                    <div className="flex items-end pb-0.5">
                      <button type="button" onClick={() => setFormData((prev) => ({ ...prev, attrMedidas: !prev.attrMedidas, ...(!prev.attrMedidas ? {} : { medidasAlto: '', medidasAncho: '', medidasProfundidad: '' }) }))} className="flex items-center gap-1.5">
                        <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${formData.attrMedidas ? 'border-primary bg-primary' : 'border-gray-300'}`}>
                          {formData.attrMedidas && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </span>
                        <span className="text-[11px] font-semibold text-gray-600">Medidas</span>
                      </button>
                    </div>
                    <div>
                      <label className="block text-[10px] sm:text-[11px] font-semibold text-gray-600 mb-0.5">Género</label>
                      <select name="genero" value={formData.genero} onChange={handleInputChange} className="w-full rounded-md border-gray-300 text-gray-800 bg-white text-[11px] sm:text-xs py-1 sm:py-1.5 focus:ring-primary focus:border-primary">
                        <option value="">Sin definir</option>
                        <option value="Niño">Niño</option>
                        <option value="Niña">Niña</option>
                        <option value="Hombre">Hombre</option>
                        <option value="Mujer">Mujer</option>
                        <option value="Unisex">Unisex</option>
                      </select>
                    </div>
                  </div>

                  {formData.tallasTipo && (
                    <div className="flex flex-wrap gap-1.5">
                      {(formData.tallasTipo === 'calzado' ? TALLAS_CALZADO : formData.tallasTipo === 'ropa' ? TALLAS_ROPA : TALLAS_ACCESORIOS).map((t) => {
                        const selected = formData.tallasSeleccion.includes(t)
                        return (
                          <button key={t} type="button" onClick={() => setFormData((prev) => ({ ...prev, tallasSeleccion: selected ? prev.tallasSeleccion.filter((s) => s !== t) : [...prev.tallasSeleccion, t] }))} className={`min-w-[32px] px-1.5 py-0.5 text-[10px] font-semibold rounded border transition-colors ${selected ? 'border-primary bg-primary text-white' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                            {t}
                          </button>
                        )
                      })}
                    </div>
                  )}

                  {formData.attrMedidas && (
                    <div className="grid grid-cols-3 sm:grid-cols-3 gap-2">
                      {[{ name: 'medidasAlto', label: 'Alto' }, { name: 'medidasAncho', label: 'Ancho' }, { name: 'medidasProfundidad', label: 'Profundidad' }].map(({ name, label }) => (
                        <div key={name}>
                          <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">{label} (cm)</label>
                          <input type="number" name={name} value={formData[name]} onChange={handleInputChange} min="0" step="1" className="w-full rounded-md border-gray-300 text-[10px] py-1 focus:ring-primary focus:border-primary" placeholder="0" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                )}

                <button type="submit" disabled={saving} className="mt-auto flex items-center justify-center gap-1 sm:gap-1.5 bg-accent text-primary py-1.5 sm:py-2 rounded-lg text-[10px] sm:text-xs font-bold hover:brightness-110 transition-all shadow-sm disabled:opacity-50">
                  <span className="material-symbols-outlined text-sm sm:text-base">save</span>
                  {saving ? 'Guardando...' : editingId ? 'Actualizar Producto' : 'Guardar Producto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Popup confirmar eliminación */}
      {seccionPopup && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50" onClick={() => setSeccionPopup(null)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm mx-4 p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center">
                <span className="material-symbols-outlined text-2xl text-amber-500">warning</span>
              </div>
              <h3 className="text-sm font-bold text-gray-800">Sección incorrecta</h3>
              <p className="text-xs text-gray-500 text-center">
                Los items de tipo <strong>{seccionPopup.label}</strong> deben estar en la sección <strong>{seccionPopup.label}</strong>.
                ¿Deseas mover este item a su sección correspondiente?
              </p>
              <div className="flex gap-2 w-full mt-1">
                <button onClick={() => setSeccionPopup(null)} className="flex-1 py-2 rounded-lg text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors">Cancelar</button>
                <button onClick={(e) => { const sec = seccionPopup.seccionCorrecta; setSeccionPopup(null); handleSubmit(e, sec) }} className="flex-1 py-2 rounded-lg text-xs font-semibold text-white bg-primary hover:bg-primary-light transition-colors">Sí, mover</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50" onClick={() => setDeleteId(null)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm mx-4 p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
                <span className="material-symbols-outlined text-2xl text-red-500">delete</span>
              </div>
              <h3 className="text-sm font-bold text-gray-800">Eliminar producto</h3>
              <p className="text-xs text-gray-500 text-center">¿Estás seguro de que deseas eliminar este producto? Esta acción no se puede deshacer.</p>
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
