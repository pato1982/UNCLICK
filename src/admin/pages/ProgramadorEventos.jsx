import { useState, useEffect, useRef } from 'react'
import ImageZoomPan from '../components/ImageZoomPan'

const API = import.meta.env.VITE_API || ''

function parseCrop(crop) {
  if (!crop) return null
  if (typeof crop === 'string') try { return JSON.parse(crop) } catch { return null }
  return crop
}

export default function ProgramadorEventos() {
  const [eventos, setEventos] = useState([])
  const [categorias, setCategorias] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ titulo: '', fecha: '', ubicacion: '', precio: '', categoria_evento_id: '' })
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

  const fetchEventos = () => {
    fetch(`${API}/api/v1/eventos/admin`, { credentials: 'include' })
      .then(r => r.json())
      .then(data => { setEventos(data.eventos || []); setLoading(false) })
      .catch(() => setLoading(false))
  }

  const fetchCategorias = () => {
    fetch(`${API}/api/v1/eventos/categorias`)
      .then(r => r.json())
      .then(data => setCategorias(data.categorias || []))
      .catch(() => {})
  }

  useEffect(() => { fetchEventos(); fetchCategorias() }, [])

  const openNew = () => {
    setForm({ titulo: '', fecha: '', ubicacion: '', precio: '', categoria_evento_id: '' })
    setImageFile(null)
    setImagePreview(null)
    setModal('new')
  }

  const openEdit = (evento) => {
    setForm({
      titulo: evento.titulo || '',
      fecha: evento.fecha || '',
      ubicacion: evento.ubicacion || '',
      precio: evento.precio || '',
      categoria_evento_id: evento.categoria_evento_id || '',
    })
    setImageFile(null)
    setImagePreview(evento.imagen ? `${API}${evento.imagen}` : null)
    setModal(evento)
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const handleSave = async () => {
    if (!form.titulo.trim()) return
    setSaving(true)
    const fd = new FormData()
    fd.append('titulo', form.titulo)
    fd.append('fecha', form.fecha)
    fd.append('ubicacion', form.ubicacion)
    fd.append('precio', form.precio)
    fd.append('categoria_evento_id', form.categoria_evento_id)
    if (imageFile) fd.append('imagen', imageFile)

    const isNew = modal === 'new'
    const url = isNew ? `${API}/api/v1/eventos` : `${API}/api/v1/eventos/${modal.id}`
    const method = isNew ? 'POST' : 'PUT'

    try {
      const res = await fetch(url, { method, headers, body: fd })
      const data = await res.json()
      if (!res.ok) {
        showToast(data.error || 'Error al guardar', 'error')
      } else {
        setModal(null)
        fetchEventos()
        showToast(isNew ? 'Evento creado' : 'Evento actualizado')
      }
    } catch (err) {
      showToast('Error de conexión al guardar', 'error')
    }
    setSaving(false)
  }

  const handleToggle = async (evento) => {
    try {
      const res = await fetch(`${API}/api/v1/eventos/${evento.id}/toggle`, { method: 'PATCH', headers })
      const data = await res.json()
      fetchEventos()
      showToast(data.message || (evento.activo ? 'Evento desactivado' : 'Evento activado'))
    } catch (err) {
      showToast('Error al cambiar estado', 'error')
    }
  }

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`${API}/api/v1/eventos/${id}`, { method: 'DELETE', headers })
      if (!res.ok) {
        const data = await res.json()
        showToast(data.error || 'Error al eliminar', 'error')
      } else {
        showToast('Evento eliminado')
      }
      setDeleteConfirm(null)
      fetchEventos()
    } catch (err) {
      showToast('Error de conexión al eliminar', 'error')
    }
  }

  const handleSaveCrop = async (eventoId, cropData) => {
    try {
      const res = await fetch(`${API}/api/v1/eventos/${eventoId}/crop`, {
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
  const getCatIcon = (id) => categorias.find(c => c.id === id)?.icono || 'event'

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
            <span className="material-symbols-outlined text-2xl">event</span>
            Próximos Eventos
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">{eventos.length} eventos registrados</p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold rounded-lg transition-all shadow-lg shadow-emerald-500/25"
        >
          <span className="material-symbols-outlined text-sm">add</span>
          Agregar evento
        </button>
      </div>

      {/* Grid de eventos */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : eventos.length === 0 ? (
        <div className="text-center py-20">
          <span className="material-symbols-outlined text-6xl text-slate-600 mb-3 block">event</span>
          <p className="text-sm text-slate-400">No hay eventos registrados</p>
          <p className="text-xs text-slate-500 mt-1">Agrega el primer evento</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {eventos.map(evento => {
            const crop = parseCrop(evento.imagen_crop)
            return (
            <div key={evento.id} className={`bg-slate-900 border rounded-xl overflow-hidden transition-all ${evento.activo ? 'border-slate-700' : 'border-red-500/30 opacity-60'}`}>
              {/* Imagen */}
              <div className="relative">
                {evento.imagen ? (
                  <div className="h-44 overflow-hidden">
                    <img
                      src={`${API}${evento.imagen}`}
                      alt={evento.titulo}
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
                {evento.categoria_evento_id && (
                  <span className="absolute top-2 left-2 bg-emerald-500/90 backdrop-blur text-white px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider flex items-center gap-1">
                    <span className="material-symbols-outlined text-[10px]">{getCatIcon(evento.categoria_evento_id)}</span>
                    {getCatName(evento.categoria_evento_id)}
                  </span>
                )}
                {/* Toggle activo */}
                <button
                  onClick={() => handleToggle(evento)}
                  className={`absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center transition-all ${evento.activo ? 'bg-emerald-500 shadow-lg shadow-emerald-500/30' : 'bg-red-500/80'}`}
                  title={evento.activo ? 'Activo — click para desactivar' : 'Inactivo — click para activar'}
                >
                  <span className="material-symbols-outlined text-white text-sm">{evento.activo ? 'visibility' : 'visibility_off'}</span>
                </button>
              </div>

              {/* Info */}
              <div className="p-3">
                <h3 className="text-sm font-bold text-white truncate">{evento.titulo}</h3>
                {evento.fecha && (
                  <div className="flex items-center gap-1 mt-1">
                    <span className="material-symbols-outlined text-emerald-400 text-xs">calendar_month</span>
                    <p className="text-[10px] text-slate-300 font-bold">{evento.fecha}</p>
                  </div>
                )}
                {evento.ubicacion && (
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="material-symbols-outlined text-slate-500 text-xs">location_on</span>
                    <p className="text-[10px] text-slate-400 truncate">{evento.ubicacion}</p>
                  </div>
                )}
                {evento.precio && (
                  <p className="text-xs font-black text-emerald-400 mt-1">{evento.precio}</p>
                )}
              </div>

              {/* Acciones */}
              <div className="px-3 pb-3 flex gap-2">
                <button
                  onClick={() => openEdit(evento)}
                  className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 text-[10px] font-bold rounded-lg transition-colors"
                >
                  <span className="material-symbols-outlined text-xs">edit</span>
                  Editar
                </button>
                <button
                  onClick={() => setDeleteConfirm(evento)}
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
            <div className="bg-slate-800 px-6 py-4 flex items-center justify-between border-b border-slate-700">
              <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
                <span className="material-symbols-outlined text-lg">{modal === 'new' ? 'add' : 'edit'}</span>
                {modal === 'new' ? 'Nuevo evento' : 'Editar evento'}
              </h3>
              <button onClick={() => setModal(null)} className="p-1 hover:bg-slate-700 rounded-lg transition-colors">
                <span className="material-symbols-outlined text-slate-400 text-lg">close</span>
              </button>
            </div>

            <div className="p-6 flex gap-6">
              {/* Columna izquierda: imagen */}
              <div className="shrink-0">
                {imagePreview ? (
                  <ImageZoomPan
                    src={imagePreview}
                    alt="Imagen evento"
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
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Nombre del evento *</label>
                  <input
                    type="text"
                    value={form.titulo}
                    onChange={e => setForm({ ...form, titulo: e.target.value })}
                    placeholder="Ej: Feria Costumbrista Villarrica"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Fecha</label>
                    <input
                      type="text"
                      value={form.fecha}
                      onChange={e => setForm({ ...form, fecha: e.target.value })}
                      placeholder="Ej: 15 - 17 Mar 2026"
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Precio</label>
                    <input
                      type="text"
                      value={form.precio}
                      onChange={e => setForm({ ...form, precio: e.target.value })}
                      placeholder="Ej: $5.000 o Gratis"
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Dirección</label>
                  <input
                    type="text"
                    value={form.ubicacion}
                    onChange={e => setForm({ ...form, ubicacion: e.target.value })}
                    placeholder="Ej: Plaza de Armas, Villarrica"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Categoría</label>
                  <select
                    value={form.categoria_evento_id}
                    onChange={e => setForm({ ...form, categoria_evento_id: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30"
                  >
                    <option value="">Seleccionar categoría</option>
                    {categorias.map(c => (
                      <option key={c.id} value={c.id}>{c.nombre}</option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={handleSave}
                  disabled={saving || !form.titulo.trim()}
                  className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/25"
                >
                  <span className="material-symbols-outlined text-sm">{saving ? 'hourglass_empty' : 'save'}</span>
                  {saving ? 'Guardando...' : modal === 'new' ? 'Crear evento' : 'Guardar cambios'}
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
              <p className="text-sm text-white font-bold mb-1">Eliminar evento</p>
              <p className="text-xs text-slate-400 mb-4">¿Eliminar <strong className="text-white">{deleteConfirm.titulo}</strong>? Esta acción no se puede deshacer.</p>
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
