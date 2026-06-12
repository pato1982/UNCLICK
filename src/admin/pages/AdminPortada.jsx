import { useState, useEffect, useRef } from 'react'
import ImageZoomPan from '../components/ImageZoomPan'

const API = import.meta.env.VITE_API || ''

function parseJSON(val) {
  if (!val) return null
  if (typeof val === 'string') try { return JSON.parse(val) } catch { return null }
  return val
}

const emptyForm = {
  descripcion: '',
  imagenes: [null, null, null],
  imagenesPreview: [null, null, null],
  imagenesCrop: [null, null, null],
}

export default function AdminPortada() {
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState(0)
  const [portadaId, setPortadaId] = useState(null)
  const [nombreNegocio, setNombreNegocio] = useState('')
  const [categoriasDB, setCategoriasDB] = useState([])
  const [categorias, setCategorias] = useState([])
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)
  const fileRefs = [useRef(null), useRef(null), useRef(null)]


  useEffect(() => {
    // Cargar portada y nombre del negocio en paralelo
    const headers = { }

    const safeFetch = (url) => fetch(url, { credentials: 'include' }).then(r => {
      if (r.status === 401) { localStorage.removeItem('token'); localStorage.removeItem('user'); window.location.href = '/'; return {} }
      if (!r.ok) return {}
      return r.json()
    })

    Promise.all([
      safeFetch(`${API}/api/v1/portada`),
      safeFetch(`${API}/api/v1/business`),
      safeFetch(`${API}/api/v1/categorias?tipo=turismo`),
    ])
      .then(([portadaData, businessData, catsData]) => {
        if (businessData.business) {
          setNombreNegocio(businessData.business.nombre_negocio || '')
        }
        if (catsData.categorias) {
          setCategoriasDB(catsData.categorias)
        }
        if (portadaData.portada) {
          const p = portadaData.portada
          const imgs = parseJSON(p.imagenes) || []
          setPortadaId(p.id)
          setCategorias(parseJSON(p.categorias) || [])
          const crops = parseJSON(p.imagenes_crop) || []
          setForm({
            descripcion: p.descripcion || '',
            imagenes: [imgs[0] || null, imgs[1] || null, imgs[2] || null],
            imagenesPreview: [
              imgs[0] ? `${API}${imgs[0]}` : null,
              imgs[1] ? `${API}${imgs[1]}` : null,
              imgs[2] ? `${API}${imgs[2]}` : null,
            ],
            imagenesCrop: [crops[0] || null, crops[1] || null, crops[2] || null],
          })
        }
      })
      .catch(err => console.error('Error cargando portada:', err))
      .finally(() => setLoading(false))
  }, [])

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    if (!dropdownOpen) return
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [dropdownOpen])

  const update = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }))
    setSaved(false)
  }

  const handleImageChange = (index, e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onloadend = () => {
      setForm(prev => {
        const newImages = [...prev.imagenes]
        const newPreviews = [...prev.imagenesPreview]
        newImages[index] = file
        newPreviews[index] = reader.result
        return { ...prev, imagenes: newImages, imagenesPreview: newPreviews }
      })
      setSaved(false)
    }
    reader.readAsDataURL(file)
  }

  const toggleCategoria = (cat) => {
    setCategorias(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    )
    setSaved(false)
  }

  const removeImage = (index) => {
    setForm(prev => {
      const newImages = [...prev.imagenes]
      const newPreviews = [...prev.imagenesPreview]
      newImages[index] = null
      newPreviews[index] = null
      return { ...prev, imagenes: newImages, imagenesPreview: newPreviews }
    })
    setSaved(false)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!form.imagenes.some(img => img)) return
    setSaving(true)
    setError('')

    try {
      const finalUrls = []
      for (let i = 0; i < 3; i++) {
        const img = form.imagenes[i]
        if (img instanceof File) {
          const fd = new FormData()
          fd.append('imagen', img)
          const upRes = await fetch(`${API}/api/v1/upload?tipo=portadas`, {
            method: 'POST',
            credentials: 'include',
            body: fd
          })
          if (!upRes.ok) {
            setError(`Error al subir imagen ${i + 1}`)
            setSaving(false)
            return
          }
          const upData = await upRes.json()
          finalUrls.push(upData.url || null)
        } else if (typeof img === 'string') {
          finalUrls.push(img)
        } else {
          finalUrls.push(null)
        }
      }

      const body = {
        nombre: nombreNegocio || 'Mi emprendimiento',
        descripcion: form.descripcion,
        imagenes: finalUrls.filter(Boolean),
        categorias,
      }

      const url = portadaId ? `${API}/api/v1/portada/${portadaId}` : `${API}/api/v1/portada`
      const method = portadaId ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify(body)
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error || 'Error al guardar la portada')
        setSaving(false)
        return
      }

      const data = await res.json()
      if (!portadaId && data.id) {
        setPortadaId(data.id)
        if (form.imagenesCrop.some(Boolean)) {
          fetch(`${API}/api/v1/portada/${data.id}/crop`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' }, credentials: 'include',
            body: JSON.stringify({ imagenes_crop: form.imagenesCrop }),
          }).catch(() => {})
        }
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      console.error('Error guardando portada:', err)
      setError('Error de conexión al guardar')
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <span className="material-symbols-outlined text-primary text-3xl animate-spin">progress_activity</span>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-black text-gray-800">Portada</h1>
        <p className="text-xs text-gray-400 mt-0.5">Personaliza cómo se ve tu negocio en la página principal de turismo</p>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-2 flex items-center gap-2">
          <span className="material-symbols-outlined text-base">error</span>
          {error}
        </div>
      )}

      <form onSubmit={handleSave} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row gap-6">
          {/* Columna izquierda — Imágenes con pestañas */}
          <div className="w-full sm:w-52 shrink-0">
            <label className="block text-[11px] font-semibold text-gray-600 mb-2">Imágenes de portada</label>

            {/* Pestañas */}
            <div className="flex mb-2 rounded-lg overflow-hidden border border-gray-200">
              {[0, 1, 2].map((i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActiveTab(i)}
                  className={`flex-1 py-1.5 text-[11px] font-semibold transition-colors relative ${
                    activeTab === i
                      ? 'text-primary bg-primary/5'
                      : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <span className="flex items-center justify-center gap-1">
                    Img {i + 1}
                    {form.imagenesPreview[i] && (
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                    )}
                  </span>
                  {activeTab === i && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
                </button>
              ))}
            </div>

            {/* Visor imagen activa */}
            {form.imagenesPreview[activeTab] ? (
              <ImageZoomPan
                src={form.imagenesPreview[activeTab]}
                alt={`Imagen ${activeTab + 1}`}
                onEdit={() => fileRefs[activeTab].current?.click()}
                onRemove={() => removeImage(activeTab)}
                initialCrop={form.imagenesCrop[activeTab]}
                onSaveCrop={(cropData) => {
                  const newCrops = [...form.imagenesCrop]
                  newCrops[activeTab] = cropData
                  setForm(prev => ({ ...prev, imagenesCrop: newCrops }))
                  if (portadaId) {
                    fetch(`${API}/api/v1/portada/${portadaId}/crop`, {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' }, credentials: 'include',
                      body: JSON.stringify({ imagenes_crop: newCrops }),
                    }).catch(() => {})
                  }
                }}
              />
            ) : (
              <button
                type="button"
                onClick={() => fileRefs[activeTab].current?.click()}
                className="w-full sm:w-52 h-52 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center gap-2 hover:border-primary hover:bg-primary/5 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-3xl text-gray-400">cloud_upload</span>
                <span className="text-xs text-gray-500">Buscar imagen</span>
                <span className="text-[10px] text-gray-400">JPG, PNG, WEBP</span>
              </button>
            )}

            {[0, 1, 2].map((i) => (
              <input
                key={i}
                ref={fileRefs[i]}
                type="file"
                accept="image/*"
                onChange={(e) => handleImageChange(i, e)}
                className="hidden"
              />
            ))}

            <p className="text-[10px] text-gray-400 text-center mt-2">Estas 3 imágenes aparecen en abanico en tu tarjeta</p>
          </div>

          {/* Columna derecha — Info */}
          <div className="flex-1 flex flex-col gap-4">
            {/* Categorías — selector desplegable */}
            <div>
              <label className="block text-[11px] font-semibold text-gray-600 mb-2">Categorías</label>
              <div className="relative" ref={dropdownRef}>
                {/* Input que abre el dropdown */}
                <button
                  type="button"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-left flex items-center gap-2 hover:border-primary/50 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all"
                >
                  <span className="flex-1 text-gray-500">
                    {categorias.length > 0 ? `${categorias.length} seleccionada${categorias.length !== 1 ? 's' : ''}` : 'Seleccionar categorías...'}
                  </span>
                  <span className={`material-symbols-outlined text-lg text-gray-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}>
                    expand_more
                  </span>
                </button>

                {/* Dropdown con opciones */}
                {dropdownOpen && (
                  <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-52 overflow-y-auto">
                    {(() => {
                      const seen = new Set()
                      const items = []
                      const otrosLabel = 'Otros'

                      categoriasDB.forEach(cat => {
                        const hasSubs = cat.subcategorias && cat.subcategorias.length > 0
                        if (hasSubs) {
                          cat.subcategorias.forEach(sub => {
                            // "Otros" se agrega una sola vez al final
                            if (sub.nombre.toLowerCase() === 'otros') return
                            if (!seen.has(sub.nombre)) {
                              seen.add(sub.nombre)
                              items.push({ key: `${cat.nombre}-${sub.nombre}`, label: sub.nombre, group: cat.nombre })
                            }
                          })
                        } else {
                          if (cat.nombre.toLowerCase() !== 'otros' && !seen.has(cat.nombre)) {
                            seen.add(cat.nombre)
                            items.push({ key: cat.nombre, label: cat.nombre, group: null })
                          }
                        }
                      })

                      // Verificar si "Otros" existe en alguna categoría
                      const hasOtros = categoriasDB.some(cat =>
                        cat.subcategorias?.some(s => s.nombre.toLowerCase() === 'otros')
                      ) || categoriasDB.some(cat => cat.nombre.toLowerCase() === 'otros')
                      if (hasOtros) {
                        items.push({ key: 'otros-unico', label: otrosLabel, group: null })
                      }

                      // Agrupar con encabezados
                      return items.reduce((acc, item) => {
                        if (item.group && (acc.length === 0 || acc[acc.length - 1].group !== item.group)) {
                          acc.push({ type: 'header', group: item.group })
                        }
                        acc.push({ type: 'option', ...item })
                        return acc
                      }, [])
                    })().map((entry, i) => {
                      if (entry.type === 'header') {
                        return (
                          <div key={`h-${entry.group}`} className="px-3 pt-2 pb-1 text-[10px] font-bold text-gray-400 uppercase tracking-wide bg-gray-50 sticky top-0">
                            {entry.group}
                          </div>
                        )
                      }
                      const selected = categorias.includes(entry.label)
                      return (
                        <button
                          key={entry.key}
                          type="button"
                          onClick={() => { toggleCategoria(entry.label) }}
                          className={`w-full text-left px-3 py-1.5 text-xs flex items-center gap-2 transition-colors ${
                            selected ? 'bg-primary/5 text-primary font-semibold' : 'text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          <span className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-all ${
                            selected ? 'bg-primary border-primary' : 'border-gray-300'
                          }`}>
                            {selected && <span className="material-symbols-outlined text-white text-xs">check</span>}
                          </span>
                          {entry.label}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Categorías seleccionadas como chips debajo */}
              {categorias.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {categorias.map(cat => (
                    <span
                      key={cat}
                      className="inline-flex items-center gap-1 bg-primary/10 text-primary text-[10px] font-semibold pl-2 pr-1 py-0.5 rounded-full"
                    >
                      {cat}
                      <button
                        type="button"
                        onClick={() => toggleCategoria(cat)}
                        className="hover:bg-primary/20 rounded-full p-0.5 transition-colors"
                      >
                        <span className="material-symbols-outlined text-xs">close</span>
                      </button>
                    </span>
                  ))}
                </div>
              )}

            </div>

            {/* Descripción */}
            <div>
              <label className="block text-[11px] font-semibold text-gray-600 mb-0.5">Descripción</label>
              <textarea
                value={form.descripcion}
                onChange={(e) => update('descripcion', e.target.value)}
                rows={4}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none resize-none"
                placeholder="Somos líderes en ascensos al volcán Villarrica con más de 15 años de experiencia..."
              />
            </div>

            {/* Botón guardar */}
            <div className="flex items-center gap-3 mt-2">
              <button
                type="submit"
                disabled={saving || saved}
                className={`font-bold px-6 py-2.5 rounded-lg transition-all text-sm flex items-center gap-2 disabled:opacity-90 ${
                  saved
                    ? 'bg-green-500 text-white'
                    : 'bg-primary text-white hover:bg-primary/90'
                }`}
              >
                <span className="material-symbols-outlined text-lg">{saved ? 'check_circle' : 'save'}</span>
                {saving ? 'Guardando...' : saved ? 'Guardado' : 'Guardar cambios'}
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Vista previa */}
      {(nombreNegocio || form.descripcion || form.imagenesPreview.some(Boolean)) && (
        <div className="mt-6">
          <p className="text-[10px] font-semibold text-gray-500 mb-2 flex items-center gap-1">
            <span className="material-symbols-outlined text-xs">visibility</span>
            Vista previa — así se verá tu tarjeta en la página de turismo
          </p>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-5 flex flex-col sm:flex-row items-center gap-4 max-w-2xl">
            <div className="flex-1">
              <h3 className="text-lg font-black text-primary mb-1">{nombreNegocio || 'Nombre de Mi Negocio'}</h3>
              {categorias.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {categorias.map(cat => (
                    <span key={cat} className="bg-primary/10 text-primary text-[9px] font-semibold px-2 py-0.5 rounded-full">{cat}</span>
                  ))}
                </div>
              )}
              <p className="text-xs text-gray-500 leading-relaxed mb-3 line-clamp-3">
                {form.descripcion || 'Descripción de tu negocio...'}
              </p>
              <div className="flex items-center gap-3">
                <span className="bg-primary text-white px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wide flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm">visibility</span>
                  Ver más
                </span>
                <span className="border border-primary/20 text-primary px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wide flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm">call</span>
                  Contactar
                </span>
              </div>
            </div>
            {/* Mini fan de imágenes */}
            <div className="relative shrink-0" style={{ width: '180px', height: '140px' }}>
              {form.imagenesPreview.map((src, i) => {
                if (!src) return null
                const angles = [{ r: -15, tx: -35 }, { r: 0, tx: 0 }, { r: 15, tx: 35 }]
                return (
                  <div
                    key={i}
                    className="absolute w-20 h-[110px] rounded-xl overflow-hidden shadow-lg border-2 border-white"
                    style={{
                      transform: `translateX(calc(-50% + ${angles[i].tx}px)) rotate(${angles[i].r}deg)`,
                      transformOrigin: 'bottom center',
                      left: '50%',
                      top: '0px',
                      zIndex: i === 1 || i === 2 ? 12 : 10,
                    }}
                  >
                    <img src={src} alt={`Img ${i + 1}`} className="w-full h-full object-cover" />
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
