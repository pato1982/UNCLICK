import { useState, useEffect, useRef } from 'react'

const API = import.meta.env.VITE_API || ''

const emptyForm = {
  nombre: '',
  categoria_barrio_id: '',
  descripcion: '',
  direccion: '',
  telefono: '',
  whatsapp: '',
  horario: '',
  facebook: '',
  instagram: '',
  correo: '',
}

const SLOTS = [
  { key: 'imagen',   routeKey: 'imagen',  label: 'Imagen portada',     hint: 'Imagen principal del local', deletable: false },
  { key: 'imagen_2', routeKey: 'imagen2', label: 'Imagen adicional 1', hint: 'Segunda imagen',             deletable: true  },
  { key: 'imagen_3', routeKey: 'imagen3', label: 'Imagen adicional 2', hint: 'Tercera imagen',             deletable: true  },
]

export default function AdminLocal() {
  const [form, setForm] = useState(emptyForm)
  const [categorias, setCategorias] = useState([])
  const [imagenes, setImagenes] = useState({ imagen: null, imagen_2: null, imagen_3: null })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingSlot, setUploadingSlot] = useState(null)
  const [activeImgTab, setActiveImgTab] = useState(0)
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
      fetch(`${API}/api/v1/mi-local`, { credentials: 'include' })
        .then(r => r.ok ? r.json() : {}),
      fetch(`${API}/api/v1/mi-local/categorias`, { credentials: 'include' })
        .then(r => r.ok ? r.json() : { categorias: [] }),
    ])
      .then(([localData, catData]) => {
        if (localData.local) {
          const l = localData.local
          setForm({
            nombre:              l.nombre || '',
            categoria_barrio_id: l.categoria_barrio_id ? String(l.categoria_barrio_id) : '',
            descripcion:         l.descripcion || '',
            direccion:           l.direccion || '',
            telefono:            l.telefono || '',
            whatsapp:            l.whatsapp || '',
            horario:             l.horario || '',
            facebook:            l.facebook || '',
            instagram:           l.instagram || '',
            correo:              l.correo || '',
          })
          setImagenes({ imagen: l.imagen || null, imagen_2: l.imagen_2 || null, imagen_3: l.imagen_3 || null })
        }
        setCategorias(catData.categorias || [])
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false))
  }, [])

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }))

  const handleImageUpload = async (slot, file) => {
    const routeKey = SLOTS.find(s => s.key === slot)?.routeKey
    setUploadingSlot(slot)
    const fd = new FormData()
    fd.append('imagen', file)
    try {
      const res = await fetch(`${API}/api/v1/mi-local/${routeKey}`, {
        method: 'PATCH', body: fd, credentials: 'include',
      })
      const data = await res.json()
      if (res.ok) {
        setImagenes(prev => ({ ...prev, [slot]: data.url }))
        showToast('Imagen guardada')
      } else {
        showToast(data.error || 'Error al subir imagen', 'error')
      }
    } catch {
      showToast('Error de conexión', 'error')
    }
    setUploadingSlot(null)
  }

  const handleImageDelete = async (slot) => {
    const routeKey = SLOTS.find(s => s.key === slot)?.routeKey
    try {
      const res = await fetch(`${API}/api/v1/mi-local/${routeKey}`, {
        method: 'DELETE', credentials: 'include',
      })
      if (res.ok) {
        setImagenes(prev => ({ ...prev, [slot]: null }))
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
    if (!form.nombre.trim()) { setError('El nombre del local es requerido'); return }
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`${API}/api/v1/mi-local`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          nombre:              form.nombre.trim(),
          categoria_barrio_id: form.categoria_barrio_id || null,
          descripcion:         form.descripcion || null,
          direccion:           form.direccion || null,
          telefono:            form.telefono || null,
          whatsapp:            form.whatsapp || null,
          horario:             form.horario || null,
          facebook:            form.facebook || null,
          instagram:           form.instagram || null,
          correo:              form.correo || null,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        showToast('Local actualizado')
      } else {
        setError(data.error || 'Error al guardar')
      }
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
              src={src.startsWith('http') ? src : `${API}${src}`}
              alt={slot.label}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
              <button type="button" onClick={() => fileRefs[slot.key].current?.click()}
                className="bg-white text-primary text-xs font-bold px-3 py-1.5 rounded-full shadow hover:brightness-110">
                Cambiar
              </button>
              {slot.deletable && (
                <button type="button" onClick={() => handleImageDelete(slot.key)}
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
          onChange={(e) => { if (e.target.files[0]) handleImageUpload(slot.key, e.target.files[0]) }}
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

      <div className="mb-6">
        <h1 className="text-xl font-black text-gray-800">Mi Local</h1>
        <p className="text-xs text-gray-400 mt-0.5">Completa la información de tu local de barrio</p>
      </div>

      {/* Layout: mobile apilado, desktop 1/3 imágenes + 2/3 formulario */}
      <div className="sm:grid sm:grid-cols-3 sm:gap-5 sm:items-stretch">

        {/* Columna izquierda — imágenes con pestañas (1/3) */}
        <div className="sm:col-span-1 mb-5 sm:mb-0">
          <div className="flex mb-2 border border-gray-200 rounded-lg overflow-hidden">
            {SLOTS.map((slot, i) => (
              <button
                key={slot.key}
                type="button"
                onClick={() => setActiveImgTab(i)}
                className={`flex-1 relative py-1.5 text-[11px] font-semibold transition-colors ${activeImgTab === i ? 'text-primary bg-primary/5' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <span className="flex items-center justify-center gap-1">
                  {i === 0 ? 'Principal' : `Img ${i + 1}`}
                  {imagenes[slot.key] && <span className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0" />}
                </span>
                {activeImgTab === i && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
              </button>
            ))}
          </div>
          <div className="max-w-[360px] mx-auto">
            {renderImageSlot(SLOTS[activeImgTab])}
          </div>
          <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-2 flex items-start gap-1.5">
            <span className="material-symbols-outlined text-amber-500 text-sm mt-0.5 shrink-0">info</span>
            <span className="text-[10px] text-amber-700 leading-tight">
              Guarda la información del local antes de subir imágenes. Se guardan al seleccionarlas.
            </span>
          </div>
        </div>

        {/* Columna derecha — formulario (2/3) */}
        <div className="sm:col-span-2 sm:flex sm:flex-col">
          <form onSubmit={handleSave} className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col gap-3 sm:flex-1">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-xs rounded-lg px-3 py-2 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-sm">error</span>
            {error}
          </div>
        )}

        {/* Mobile: nombre + categoría en misma fila */}
        <div className="grid grid-cols-2 gap-3 sm:hidden">
          <div>
            <label className="block text-[11px] font-semibold text-gray-600 mb-0.5">Nombre *</label>
            <input
              type="text"
              value={form.nombre}
              onChange={e => update('nombre', e.target.value)}
              required
              className="w-full rounded-md border-gray-300 text-xs py-1.5 focus:ring-primary focus:border-primary"
              placeholder="Almacén El Barrio"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-gray-600 mb-0.5">Categoría</label>
            <select
              value={form.categoria_barrio_id}
              onChange={e => update('categoria_barrio_id', e.target.value)}
              className="w-full rounded-md border-gray-300 text-xs py-1.5 focus:ring-primary focus:border-primary"
            >
              <option value="">Categoría...</option>
              {categorias.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.nombre}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Desktop: nombre + categoría */}
        <div className="hidden sm:grid sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-gray-600 mb-0.5">Nombre del local *</label>
            <input
              type="text"
              value={form.nombre}
              onChange={e => update('nombre', e.target.value)}
              required
              className="w-full rounded-md border-gray-300 text-xs py-1.5 focus:ring-primary focus:border-primary"
              placeholder="Ej: Almacén El Barrio"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-gray-600 mb-0.5">Categoría</label>
            <select
              value={form.categoria_barrio_id}
              onChange={e => update('categoria_barrio_id', e.target.value)}
              className="w-full rounded-md border-gray-300 text-xs py-1.5 focus:ring-primary focus:border-primary"
            >
              <option value="">Seleccionar...</option>
              {categorias.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.nombre}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Desktop: teléfono + whatsapp */}
        <div className="hidden sm:grid sm:grid-cols-2 gap-3">
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

        {/* Descripción — se expande para llenar el espacio vertical en desktop */}
        <div className="sm:flex-1 sm:flex sm:flex-col">
          <label className="block text-[11px] font-semibold text-gray-600 mb-0.5">Descripción</label>
          <textarea
            value={form.descripcion}
            onChange={e => update('descripcion', e.target.value)}
            rows={3}
            className="w-full rounded-md border-gray-300 text-xs py-1.5 focus:ring-primary focus:border-primary resize-none sm:flex-1"
            placeholder="Describe tu local, qué vendes o qué ofreces..."
          />
        </div>

        {/* Dirección + Horario — siempre 2 columnas */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-gray-600 mb-0.5">Dirección</label>
            <input
              type="text"
              value={form.direccion}
              onChange={e => update('direccion', e.target.value)}
              className="w-full rounded-md border-gray-300 text-xs py-1.5 focus:ring-primary focus:border-primary"
              placeholder="Av. Principal 123"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-gray-600 mb-0.5">Horario</label>
            <input
              type="text"
              value={form.horario}
              onChange={e => update('horario', e.target.value)}
              className="w-full rounded-md border-gray-300 text-xs py-1.5 focus:ring-primary focus:border-primary"
              placeholder="Lun-Vie 9:00-18:00"
            />
          </div>
        </div>

        {/* Mobile: teléfono solo */}
        <div className="sm:hidden">
          <label className="block text-[11px] font-semibold text-gray-600 mb-0.5">Teléfono</label>
          <input
            type="tel"
            value={form.telefono}
            onChange={e => update('telefono', e.target.value)}
            className="w-full rounded-md border-gray-300 text-xs py-1.5 focus:ring-primary focus:border-primary"
            placeholder="+56 9 1234 5678"
          />
        </div>

        {/* Mobile: correo + whatsapp en misma fila */}
        <div className="grid grid-cols-2 gap-3 sm:hidden">
          <div>
            <label className="block text-[11px] font-semibold text-gray-600 mb-0.5">Correo</label>
            <input
              type="email"
              value={form.correo}
              onChange={e => update('correo', e.target.value)}
              className="w-full rounded-md border-gray-300 text-xs py-1.5 focus:ring-primary focus:border-primary"
              placeholder="local@correo.cl"
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

        {/* Mobile: redes sociales */}
        <div className="grid grid-cols-2 gap-3 sm:hidden">
          <div>
            <label className="block text-[11px] font-semibold text-gray-600 mb-0.5">Facebook</label>
            <input
              type="text"
              value={form.facebook}
              onChange={e => update('facebook', e.target.value)}
              className="w-full rounded-md border-gray-300 text-xs py-1.5 focus:ring-primary focus:border-primary"
              placeholder="facebook.com/tulocal"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-gray-600 mb-0.5">Instagram</label>
            <input
              type="text"
              value={form.instagram}
              onChange={e => update('instagram', e.target.value)}
              className="w-full rounded-md border-gray-300 text-xs py-1.5 focus:ring-primary focus:border-primary"
              placeholder="@tulocal"
            />
          </div>
        </div>

        {/* Desktop: correo + redes sociales en misma fila */}
        <div className="hidden sm:grid sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-gray-600 mb-0.5">Correo electrónico</label>
            <input
              type="email"
              value={form.correo}
              onChange={e => update('correo', e.target.value)}
              className="w-full rounded-md border-gray-300 text-xs py-1.5 focus:ring-primary focus:border-primary"
              placeholder="local@correo.cl"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-gray-600 mb-0.5">Facebook</label>
            <input
              type="text"
              value={form.facebook}
              onChange={e => update('facebook', e.target.value)}
              className="w-full rounded-md border-gray-300 text-xs py-1.5 focus:ring-primary focus:border-primary"
              placeholder="facebook.com/tulocal"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-gray-600 mb-0.5">Instagram</label>
            <input
              type="text"
              value={form.instagram}
              onChange={e => update('instagram', e.target.value)}
              className="w-full rounded-md border-gray-300 text-xs py-1.5 focus:ring-primary focus:border-primary"
              placeholder="@tulocal"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-1.5 bg-accent text-primary py-2 px-5 rounded-lg text-xs font-bold hover:brightness-110 transition-all shadow-sm disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-base">{saving ? 'progress_activity' : 'save'}</span>
            {saving ? 'Guardando...' : 'Guardar información'}
          </button>
        </div>
          </form>
        </div>{/* fin columna derecha */}
      </div>{/* fin layout 2 columnas */}
    </div>
  )
}
