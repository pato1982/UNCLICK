import { useState, useEffect, useRef } from 'react'

const API = import.meta.env.VITE_API || ''

const emptyForm = {
  titulo: '',
  fecha: '',
  ubicacion: '',
  precio: '',
  categoria_evento_id: '',
  descripcion: '',
  organizador: '',
  telefono: '',
  whatsapp: '',
  horario: '',
}

const SLOTS = [
  { key: 'imagen',   routeKey: 'imagen',  label: 'Portada',  hint: 'Imagen principal', deletable: false },
  { key: 'imagen_2', routeKey: 'imagen2', label: 'Imagen 2', hint: 'Segunda imagen',    deletable: true  },
  { key: 'imagen_3', routeKey: 'imagen3', label: 'Imagen 3', hint: 'Tercera imagen',    deletable: true  },
]

export default function AdminEvento() {
  const [form, setForm] = useState(emptyForm)
  const [categorias, setCategorias] = useState([])
  const [eventoId, setEventoId] = useState(null)
  const [imagenes, setImagenes] = useState({ imagen: null, imagen_2: null, imagen_3: null })
  const [pendingFiles, setPendingFiles] = useState({ imagen: null, imagen_2: null, imagen_3: null })
  const [activeTab, setActiveTab] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingSlot, setUploadingSlot] = useState(null)
  const [error, setError] = useState('')
  const [toast, setToast] = useState(null)
  const fileRefs = {
    imagen:   useRef(null),
    imagen_2: useRef(null),
    imagen_3: useRef(null),
  }

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  useEffect(() => {
    Promise.all([
      fetch(`${API}/api/v1/mis-eventos`, { credentials: 'include' })
        .then(r => r.ok ? r.json() : { eventos: [] }),
      fetch(`${API}/api/v1/mis-eventos/categorias`, { credentials: 'include' })
        .then(r => r.ok ? r.json() : { categorias: [] }),
    ])
      .then(([evData, catData]) => {
        const ev = evData.eventos?.[0]
        if (ev) {
          setEventoId(ev.id)
          setForm({
            titulo:              ev.titulo || '',
            fecha:               ev.fecha ? ev.fecha.split('T')[0] : '',
            ubicacion:           ev.ubicacion || '',
            precio:              ev.precio != null ? String(ev.precio) : '',
            categoria_evento_id: ev.categoria_evento_id ? String(ev.categoria_evento_id) : '',
            descripcion:         ev.descripcion || '',
            organizador:         ev.organizador || '',
            telefono:            ev.telefono || '',
            whatsapp:            ev.whatsapp || '',
            horario:             ev.horario || '',
          })
          setImagenes({ imagen: ev.imagen || null, imagen_2: ev.imagen_2 || null, imagen_3: ev.imagen_3 || null })
        }
        setCategorias(catData.categorias || [])
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }))

  const handleFileSelect = async (slot, file) => {
    if (eventoId) {
      const previewUrl = URL.createObjectURL(file)
      setImagenes(prev => ({ ...prev, [slot.key]: previewUrl }))
      setUploadingSlot(slot.key)
      const fd = new FormData()
      fd.append('imagen', file)
      try {
        const res = await fetch(`${API}/api/v1/mis-eventos/${eventoId}/${slot.routeKey}`, {
          method: 'PATCH', body: fd, credentials: 'include',
        })
        const data = await res.json()
        if (res.ok) {
          setImagenes(prev => ({ ...prev, [slot.key]: data.url }))
          showToast('Imagen guardada')
        } else {
          showToast(data.error || 'Error al subir imagen', 'error')
          setImagenes(prev => ({ ...prev, [slot.key]: null }))
        }
      } catch {
        showToast('Error de conexión', 'error')
        setImagenes(prev => ({ ...prev, [slot.key]: null }))
      }
      setUploadingSlot(null)
    } else {
      const previewUrl = URL.createObjectURL(file)
      setImagenes(prev => ({ ...prev, [slot.key]: previewUrl }))
      setPendingFiles(prev => ({ ...prev, [slot.key]: file }))
    }
  }

  const handleImageDelete = async (slot) => {
    if (!eventoId || !slot.deletable) return
    try {
      const res = await fetch(`${API}/api/v1/mis-eventos/${eventoId}/${slot.routeKey}`, {
        method: 'DELETE', credentials: 'include',
      })
      if (res.ok) {
        setImagenes(prev => ({ ...prev, [slot.key]: null }))
        showToast('Imagen eliminada')
      } else {
        showToast('Error al eliminar imagen', 'error')
      }
    } catch {
      showToast('Error de conexión', 'error')
    }
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!form.titulo.trim()) { setError('El título es requerido'); return }
    if (!form.fecha)         { setError('La fecha del evento es requerida'); return }
    setSaving(true)
    setError('')

    try {
      const body = {
        titulo:              form.titulo.trim(),
        fecha:               form.fecha,
        ubicacion:           form.ubicacion || null,
        precio:              form.precio !== '' ? Number(form.precio) : null,
        categoria_evento_id: form.categoria_evento_id || null,
        descripcion:         form.descripcion || null,
        organizador:         form.organizador || null,
        telefono:            form.telefono || null,
        whatsapp:            form.whatsapp || null,
        horario:             form.horario || null,
      }

      let id = eventoId

      if (eventoId) {
        const res = await fetch(`${API}/api/v1/mis-eventos/${eventoId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(body),
        })
        const data = await res.json()
        if (!res.ok) { setError(data.error || 'Error al guardar'); setSaving(false); return }
      } else {
        const res = await fetch(`${API}/api/v1/mis-eventos`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(body),
        })
        const data = await res.json()
        if (!res.ok) { setError(data.error || 'Error al crear'); setSaving(false); return }
        id = data.evento.id
        setEventoId(id)
      }

      for (const slot of SLOTS) {
        if (pendingFiles[slot.key]) {
          setUploadingSlot(slot.key)
          const fd = new FormData()
          fd.append('imagen', pendingFiles[slot.key])
          try {
            const res = await fetch(`${API}/api/v1/mis-eventos/${id}/${slot.routeKey}`, {
              method: 'PATCH', body: fd, credentials: 'include',
            })
            const data = await res.json()
            if (res.ok) setImagenes(prev => ({ ...prev, [slot.key]: data.url }))
          } catch {}
          setUploadingSlot(null)
        }
      }
      setPendingFiles({ imagen: null, imagen_2: null, imagen_3: null })

      showToast('Evento guardado')
    } catch {
      setError('Error de conexión')
    }
    setSaving(false)
  }

  const renderImageSlot = (slot) => {
    const src = imagenes[slot.key]
    const isUploading = uploadingSlot === slot.key
    return (
      <div key={slot.key}>
        {src ? (
          <div className="relative group rounded-xl overflow-hidden border border-gray-200 bg-gray-50 aspect-square">
            <img
              src={src.startsWith('blob:') || src.startsWith('http') ? src : `${API}${src}`}
              alt={slot.label}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
              <button type="button" onClick={() => fileRefs[slot.key].current?.click()}
                className="bg-white text-primary text-xs font-bold px-3 py-1.5 rounded-full shadow hover:brightness-110">
                Cambiar
              </button>
              {slot.deletable && (
                <button type="button" onClick={() => handleImageDelete(slot)}
                  className="bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow hover:brightness-110">
                  Quitar
                </button>
              )}
            </div>
            {isUploading && (
              <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                <span className="material-symbols-outlined animate-spin text-primary text-2xl">progress_activity</span>
              </div>
            )}
          </div>
        ) : (
          <button type="button" onClick={() => fileRefs[slot.key].current?.click()}
            className="w-full aspect-square border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center gap-1.5 hover:border-primary hover:bg-primary/5 transition-all group">
            {isUploading ? (
              <span className="material-symbols-outlined animate-spin text-primary text-2xl">progress_activity</span>
            ) : (
              <>
                <span className="material-symbols-outlined text-3xl text-gray-300 group-hover:text-primary transition-colors">cloud_upload</span>
                <span className="text-xs text-gray-400 group-hover:text-primary transition-colors font-medium">{slot.hint}</span>
                <span className="text-[10px] text-gray-300">JPG, PNG, WEBP</span>
              </>
            )}
          </button>
        )}
        <input
          ref={fileRefs[slot.key]}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => { if (e.target.files[0]) handleFileSelect(slot, e.target.files[0]) }}
        />
      </div>
    )
  }

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <span className="material-symbols-outlined text-primary text-3xl animate-spin">progress_activity</span>
    </div>
  )

  return (
    <div>
      {toast && (
        <div className={`fixed top-4 right-4 z-[100] px-4 py-2.5 rounded-lg text-xs font-bold shadow-lg flex items-center gap-2 ${toast.type === 'error' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`}>
          <span className="material-symbols-outlined text-sm">{toast.type === 'error' ? 'error' : 'check_circle'}</span>
          {toast.msg}
        </div>
      )}

      <div className="mb-5">
        <h1 className="text-xl font-black text-gray-800">Mi Evento</h1>
        <p className="text-xs text-gray-400 mt-0.5">Tu publicación aparecerá en la página de eventos hasta la fecha indicada</p>
      </div>

      {/* Layout: mobile apilado, desktop 1/3 imágenes + 2/3 formulario */}
      <div className="sm:grid sm:grid-cols-3 sm:gap-5 sm:items-stretch">

        {/* Columna izquierda — imágenes con pestañas */}
        <div className="sm:col-span-1 mb-5 sm:mb-0">
          <div className="flex mb-2 border border-gray-200 rounded-lg overflow-hidden">
            {SLOTS.map((slot, i) => (
              <button
                key={slot.key}
                type="button"
                onClick={() => setActiveTab(i)}
                className={`flex-1 relative py-1.5 text-[11px] font-semibold transition-colors ${activeTab === i ? 'text-primary bg-primary/5' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <span className="flex items-center justify-center gap-1">
                  {i === 0 ? 'Principal' : `Img ${i + 1}`}
                  {imagenes[slot.key] && <span className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0" />}
                </span>
                {activeTab === i && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
              </button>
            ))}
          </div>
          <div className="max-w-[360px] mx-auto">
            {renderImageSlot(SLOTS[activeTab])}
          </div>
          <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-2 flex items-start gap-1.5">
            <span className="material-symbols-outlined text-amber-500 text-sm mt-0.5 shrink-0">info</span>
            <span className="text-[10px] text-amber-700 leading-tight">
              {eventoId
                ? 'Las imágenes se guardan automáticamente al seleccionarlas.'
                : 'Guarda la información del evento antes de subir imágenes.'}
            </span>
          </div>
        </div>

        {/* Columna derecha — formulario */}
        <div className="sm:col-span-2 sm:flex sm:flex-col">
          <form onSubmit={handleSave} className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col gap-3 sm:flex-1">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-xs rounded-lg px-3 py-2 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm">error</span>
                {error}
              </div>
            )}

            <div>
              <label className="block text-[11px] font-semibold text-gray-600 mb-0.5">Nombre del evento *</label>
              <input
                type="text"
                value={form.titulo}
                onChange={e => update('titulo', e.target.value)}
                required
                className="w-full rounded-md border-gray-300 text-xs py-1.5 focus:ring-primary focus:border-primary"
                placeholder="Ej: Feria de artesanías"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-gray-600 mb-0.5">
                  Fecha *
                  <span className="text-[9px] text-red-400 ml-1">se retira al vencer</span>
                </label>
                <input
                  type="date"
                  value={form.fecha}
                  onChange={e => update('fecha', e.target.value)}
                  required
                  className="w-full rounded-md border-gray-300 text-xs py-1.5 focus:ring-primary focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-600 mb-0.5">Categoría</label>
                <select
                  value={form.categoria_evento_id}
                  onChange={e => update('categoria_evento_id', e.target.value)}
                  className="w-full rounded-md border-gray-300 text-xs py-1.5 focus:ring-primary focus:border-primary"
                >
                  <option value="">Sin categoría</option>
                  {categorias.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="sm:flex-1 sm:flex sm:flex-col">
              <label className="block text-[11px] font-semibold text-gray-600 mb-0.5">Descripción</label>
              <textarea
                value={form.descripcion}
                onChange={e => update('descripcion', e.target.value)}
                rows={3}
                className="w-full rounded-md border-gray-300 text-xs py-1.5 focus:ring-primary focus:border-primary resize-none sm:flex-1"
                placeholder="Describe el evento..."
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-gray-600 mb-0.5">Ubicación</label>
                <input
                  type="text"
                  value={form.ubicacion}
                  onChange={e => update('ubicacion', e.target.value)}
                  className="w-full rounded-md border-gray-300 text-xs py-1.5 focus:ring-primary focus:border-primary"
                  placeholder="Ej: Plaza de Armas"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-600 mb-0.5">Horario</label>
                <input
                  type="text"
                  value={form.horario}
                  onChange={e => update('horario', e.target.value)}
                  className="w-full rounded-md border-gray-300 text-xs py-1.5 focus:ring-primary focus:border-primary"
                  placeholder="Ej: 10:00 - 20:00"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-gray-600 mb-0.5">Organizador</label>
                <input
                  type="text"
                  value={form.organizador}
                  onChange={e => update('organizador', e.target.value)}
                  className="w-full rounded-md border-gray-300 text-xs py-1.5 focus:ring-primary focus:border-primary"
                  placeholder="Nombre del organizador"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-600 mb-0.5">Precio <span className="text-gray-400 font-normal">(0 = gratis)</span></label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">$</span>
                  <input
                    type="number"
                    value={form.precio}
                    onChange={e => update('precio', e.target.value)}
                    min="0"
                    onKeyDown={e => ['.', ',', 'e', 'E'].includes(e.key) && e.preventDefault()}
                    className="w-full rounded-md border-gray-300 text-xs py-1.5 pl-6 focus:ring-primary focus:border-primary"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-gray-600 mb-0.5">Teléfono</label>
                <input
                  type="tel"
                  value={form.telefono}
                  onChange={e => update('telefono', e.target.value)}
                  className="w-full rounded-md border-gray-300 text-xs py-1.5 focus:ring-primary focus:border-primary"
                  placeholder="+56 9 1234 5678"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-600 mb-0.5">WhatsApp</label>
                <input
                  type="tel"
                  value={form.whatsapp}
                  onChange={e => update('whatsapp', e.target.value)}
                  className="w-full rounded-md border-gray-300 text-xs py-1.5 focus:ring-primary focus:border-primary"
                  placeholder="+56 9 1234 5678"
                />
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-1.5 bg-accent text-primary py-2 px-5 rounded-lg text-xs font-bold hover:brightness-110 transition-all shadow-sm disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-base">{saving ? 'progress_activity' : 'save'}</span>
                {saving ? 'Guardando...' : 'Guardar evento'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
