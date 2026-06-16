import { useState, useEffect, useRef } from 'react'
import ImageZoomPan from '../components/ImageZoomPan'

const API = import.meta.env.VITE_API || ''

function parseCrop(crop) {
  if (!crop) return null
  if (typeof crop === 'string') try { return JSON.parse(crop) } catch { return null }
  return crop
}

export default function ProgramadorLocales() {
  const [locales, setLocales] = useState([])
  const [categorias, setCategorias] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null) // null | 'new' | local object
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ nombre: '', direccion: '', categoria_barrio_id: '', descripcion: '', telefono: '', whatsapp: '', horario: '', facebook: '', instagram: '', correo: '' })
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [toast, setToast] = useState(null)
  const fileRef = useRef(null)

  const headers = { }

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const fetchLocales = () => {
    fetch(`${API}/api/v1/locales/admin`, { credentials: 'include' })
      .then(r => r.json())
      .then(data => { setLocales(data.locales || []); setLoading(false) })
      .catch(() => setLoading(false))
  }

  const fetchCategorias = () => {
    fetch(`${API}/api/v1/locales/categorias`)
      .then(r => r.json())
      .then(data => setCategorias(data.categorias || []))
      .catch(() => {})
  }

  useEffect(() => { fetchLocales(); fetchCategorias() }, [])

  const openNew = () => {
    setForm({ nombre: '', direccion: '', categoria_barrio_id: '', descripcion: '', telefono: '', whatsapp: '', horario: '', facebook: '', instagram: '', correo: '' })
    setImageFile(null)
    setImagePreview(null)
    setModal('new')
  }

  const openEdit = (local) => {
    setForm({
      nombre: local.nombre || '',
      direccion: local.direccion || '',
      categoria_barrio_id: local.categoria_barrio_id || '',
      descripcion: local.descripcion || '',
      telefono: local.telefono || '',
      whatsapp: local.whatsapp || '',
      horario: local.horario || '',
      facebook: local.facebook || '',
      instagram: local.instagram || '',
      correo: local.correo || '',
    })
    setImageFile(null)
    setImagePreview(local.imagen ? `${API}${local.imagen}` : null)
    setModal(local)
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const handleSave = async () => {
    if (!form.nombre.trim()) return
    setSaving(true)
    const fd = new FormData()
    fd.append('nombre', form.nombre)
    fd.append('direccion', form.direccion)
    fd.append('categoria_barrio_id', form.categoria_barrio_id)
    fd.append('descripcion', form.descripcion)
    fd.append('telefono', form.telefono)
    fd.append('whatsapp', form.whatsapp)
    fd.append('horario', form.horario)
    fd.append('facebook', form.facebook)
    fd.append('instagram', form.instagram)
    fd.append('correo', form.correo)
    if (imageFile) fd.append('imagen', imageFile)

    const isNew = modal === 'new'
    const url = isNew ? `${API}/api/v1/locales` : `${API}/api/v1/locales/${modal.id}`
    const method = isNew ? 'POST' : 'PUT'

    try {
      const res = await fetch(url, { method, headers, body: fd })
      const data = await res.json()
      if (!res.ok) {
        showToast(data.error || 'Error al guardar', 'error')
      } else {
        setModal(null)
        fetchLocales()
        showToast(isNew ? 'Local creado' : 'Local actualizado')
      }
    } catch (err) {
      showToast('Error de conexión al guardar', 'error')
    }
    setSaving(false)
  }

  const handleToggle = async (local) => {
    try {
      const res = await fetch(`${API}/api/v1/locales/${local.id}/toggle`, { method: 'PATCH', headers })
      const data = await res.json()
      fetchLocales()
      showToast(data.message || (local.activo ? 'Local desactivado' : 'Local activado'))
    } catch (err) {
      showToast('Error al cambiar estado', 'error')
    }
  }

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`${API}/api/v1/locales/${id}`, { method: 'DELETE', headers })
      if (!res.ok) {
        const data = await res.json()
        showToast(data.error || 'Error al eliminar', 'error')
      } else {
        showToast('Local eliminado')
      }
      setDeleteConfirm(null)
      fetchLocales()
    } catch (err) {
      showToast('Error de conexión al eliminar', 'error')
    }
  }

  const handleSaveCrop = async (localId, cropData) => {
    try {
      const res = await fetch(`${API}/api/v1/locales/${localId}/crop`, {
        method: 'PATCH',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ imagen_crop: cropData }),
      })
      if (res.ok) showToast('Encuadre guardado')
      else showToast('Error al guardar encuadre', 'error')
    } catch (err) {
      showToast('Error de conexión', 'error')
    }
  }

  const getCatName = (id) => categorias.find(c => c.id === id)?.nombre || ''
  const getCatIcon = (id) => categorias.find(c => c.id === id)?.icono || 'store'

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-[100] px-4 py-2.5 rounded-lg text-xs font-bold shadow-lg flex items-center gap-2 animate-slide-in ${toast.type === 'error' ? 'bg-red-500 text-white' : 'bg-emerald-500 text-white'}`}>
          <span className="material-symbols-outlined text-sm">{toast.type === 'error' ? 'error' : 'check_circle'}</span>
          {toast.msg}
        </div>
      )}

      {/* Encabezado */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-black text-emerald-400 flex items-center gap-2">
            <span className="material-symbols-outlined text-2xl">store</span>
            Locales de Barrio
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">{locales.length} locales registrados</p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold rounded-lg transition-all shadow-lg shadow-emerald-500/25"
        >
          <span className="material-symbols-outlined text-sm">add</span>
          Agregar local
        </button>
      </div>

      {/* Grid de locales */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : locales.length === 0 ? (
        <div className="text-center py-20">
          <span className="material-symbols-outlined text-6xl text-slate-600 mb-3 block">store</span>
          <p className="text-sm text-slate-400">No hay locales registrados</p>
          <p className="text-xs text-slate-500 mt-1">Agrega el primer local del barrio</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {locales.map(local => {
            const crop = parseCrop(local.imagen_crop)
            return (
            <div key={local.id} className={`bg-slate-900 border rounded-xl overflow-hidden transition-all ${local.activo ? 'border-slate-700' : 'border-red-500/30 opacity-60'}`}>
              {/* Imagen con zoom/pan */}
              <div className="relative">
                {local.imagen ? (
                  <div className="h-44 overflow-hidden">
                    <img
                      src={`${API}${local.imagen}`}
                      alt={local.nombre}
                      className="w-full h-full object-cover"
                      style={crop ? {
                        transform: `scale(${crop.zoom || 1}) translate(${(crop.x || 0) / (crop.zoom || 1)}px, ${(crop.y || 0) / (crop.zoom || 1)}px)`,
                        transformOrigin: 'center center',
                      } : undefined}
                    />
                  </div>
                ) : (
                  <div className="h-44 bg-slate-800 flex items-center justify-center">
                    <span className="material-symbols-outlined text-4xl text-slate-600">image</span>
                  </div>
                )}
                {/* Badge categoría */}
                {local.categoria_barrio_id && (
                  <span className="absolute top-2 left-2 bg-emerald-500/90 backdrop-blur text-white px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider flex items-center gap-1">
                    <span className="material-symbols-outlined text-[10px]">{getCatIcon(local.categoria_barrio_id)}</span>
                    {getCatName(local.categoria_barrio_id)}
                  </span>
                )}
                {/* Toggle activo */}
                <button
                  onClick={() => handleToggle(local)}
                  className={`absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center transition-all ${local.activo ? 'bg-emerald-500 shadow-lg shadow-emerald-500/30' : 'bg-red-500/80'}`}
                  title={local.activo ? 'Activo — click para desactivar' : 'Inactivo — click para activar'}
                >
                  <span className="material-symbols-outlined text-white text-sm">{local.activo ? 'visibility' : 'visibility_off'}</span>
                </button>
              </div>

              {/* Info */}
              <div className="p-3">
                <h3 className="text-sm font-bold text-white truncate">{local.nombre}</h3>
                {local.direccion && (
                  <div className="flex items-center gap-1 mt-1">
                    <span className="material-symbols-outlined text-slate-500 text-xs">location_on</span>
                    <p className="text-[10px] text-slate-400 truncate">{local.direccion}</p>
                  </div>
                )}
              </div>

              {/* Acciones */}
              <div className="px-3 pb-3 flex gap-2">
                <button
                  onClick={() => openEdit(local)}
                  className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 text-[10px] font-bold rounded-lg transition-colors"
                >
                  <span className="material-symbols-outlined text-xs">edit</span>
                  Editar
                </button>
                <button
                  onClick={() => setDeleteConfirm(local)}
                  className="flex items-center justify-center px-2.5 py-1.5 bg-slate-800 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
                >
                  <span className="material-symbols-outlined text-xs">delete</span>
                </button>
              </div>
            </div>
            )
          })}
        </div>
      )}

      {/* Modal crear/editar */}
      {modal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => setModal(null)}>
          <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
            {/* Header modal */}
            <div className="bg-slate-800 px-6 py-4 flex items-center justify-between border-b border-slate-700">
              <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
                <span className="material-symbols-outlined text-lg">{modal === 'new' ? 'add_business' : 'edit'}</span>
                {modal === 'new' ? 'Nuevo local' : 'Editar local'}
              </h3>
              <button onClick={() => setModal(null)} className="p-1 hover:bg-slate-700 rounded-lg transition-colors">
                <span className="material-symbols-outlined text-slate-400 text-lg">close</span>
              </button>
            </div>

            <div className="p-4 sm:p-6 flex flex-col sm:flex-row gap-4 sm:gap-6 max-h-[70vh] overflow-y-auto">
              {/* Imagen */}
              <div className="shrink-0 mx-auto sm:mx-0">
                {imagePreview ? (
                  <ImageZoomPan
                    src={imagePreview}
                    alt="Imagen local"
                    onEdit={() => fileRef.current?.click()}
                    onRemove={() => { setImageFile(null); setImagePreview(null) }}
                    initialCrop={modal !== 'new' ? parseCrop(modal.imagen_crop) : undefined}
                    onSaveCrop={modal !== 'new' ? (crop) => handleSaveCrop(modal.id, crop) : undefined}
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="w-52 h-52 border-2 border-dashed border-slate-600 rounded-lg flex flex-col items-center justify-center gap-2 hover:border-emerald-500 hover:bg-emerald-500/5 transition-all"
                  >
                    <span className="material-symbols-outlined text-3xl text-slate-500">add_photo_alternate</span>
                    <span className="text-[10px] text-slate-500 font-bold">Subir imagen</span>
                  </button>
                )}
                <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFileChange} />
              </div>

              {/* Columna derecha: campos */}
              <div className="flex-1 flex flex-col gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Nombre *</label>
                  <input
                    type="text"
                    value={form.nombre}
                    onChange={e => setForm({ ...form, nombre: e.target.value })}
                    placeholder="Ej: Almacén Doña Rosa"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Dirección</label>
                  <input
                    type="text"
                    value={form.direccion}
                    onChange={e => setForm({ ...form, direccion: e.target.value })}
                    placeholder="Ej: Av. San Martín 520"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Categoría</label>
                  <select
                    value={form.categoria_barrio_id}
                    onChange={e => setForm({ ...form, categoria_barrio_id: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30"
                  >
                    <option value="">Seleccionar categoría</option>
                    {categorias.map(c => (
                      <option key={c.id} value={c.id}>{c.nombre}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Horario</label>
                  <input
                    type="text"
                    value={form.horario}
                    onChange={e => setForm({ ...form, horario: e.target.value })}
                    placeholder="Ej: Lun-Vie 09:00-18:00"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Teléfono</label>
                    <input
                      type="text"
                      value={form.telefono}
                      onChange={e => setForm({ ...form, telefono: e.target.value })}
                      placeholder="+56 9 1234 5678"
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">WhatsApp</label>
                    <input
                      type="text"
                      value={form.whatsapp}
                      onChange={e => setForm({ ...form, whatsapp: e.target.value })}
                      placeholder="+56 9 1234 5678"
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Correo</label>
                  <input
                    type="email"
                    value={form.correo}
                    onChange={e => setForm({ ...form, correo: e.target.value })}
                    placeholder="contacto@local.cl"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Facebook</label>
                    <input
                      type="text"
                      value={form.facebook}
                      onChange={e => setForm({ ...form, facebook: e.target.value })}
                      placeholder="facebook.com/local"
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Instagram</label>
                    <input
                      type="text"
                      value={form.instagram}
                      onChange={e => setForm({ ...form, instagram: e.target.value })}
                      placeholder="@local"
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Descripción</label>
                  <textarea
                    value={form.descripcion}
                    onChange={e => setForm({ ...form, descripcion: e.target.value })}
                    placeholder="Descripción del local..."
                    rows={3}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 resize-none"
                  />
                </div>

                <button
                  onClick={handleSave}
                  disabled={saving || !form.nombre.trim()}
                  className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/25"
                >
                  <span className="material-symbols-outlined text-sm">{saving ? 'hourglass_empty' : 'save'}</span>
                  {saving ? 'Guardando...' : modal === 'new' ? 'Crear local' : 'Guardar cambios'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm delete */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70" onClick={() => setDeleteConfirm(null)}>
          <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-xs mx-4 p-5" onClick={e => e.stopPropagation()}>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-3">
                <span className="material-symbols-outlined text-2xl text-red-400">delete_forever</span>
              </div>
              <p className="text-sm text-white font-bold mb-1">Eliminar local</p>
              <p className="text-xs text-slate-400 mb-4">¿Eliminar <strong className="text-white">{deleteConfirm.nombre}</strong>? Esta acción no se puede deshacer.</p>
              <div className="flex gap-2">
                <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-lg transition-colors">
                  Cancelar
                </button>
                <button onClick={() => handleDelete(deleteConfirm.id)} className="flex-1 py-2 bg-red-500 hover:bg-red-400 text-white text-xs font-bold rounded-lg transition-colors">
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
