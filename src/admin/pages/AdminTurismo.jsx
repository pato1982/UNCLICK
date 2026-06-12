import { useState, useEffect } from 'react'

const API = import.meta.env.VITE_API || ''
const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

const defaultHorarios = DIAS.map((dia) => ({
  dia,
  activo: dia !== 'Domingo',
  apertura: '09:00',
  cierre: '18:00',
}))

const emptyForm = {
  nombre: '',
  descripcion: '',
  direccion: '',
  ubicacion: '',
  whatsapp: '',
  telefono: '',
  correo: '',
  facebook: '',
  instagram: '',
  horarios: defaultHorarios,
}

export default function AdminTurismo() {
  const [negocios, setNegocios] = useState([])
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)


  const fetchNegocios = () => {
    fetch(`${API}/api/v1/turismo`, {
      credentials: 'include'
    })
      .then(r => r.json())
      .then(data => {
        setNegocios(data.negocios || [])
      })
      .catch(err => console.error('Error cargando turismo:', err))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchNegocios() }, [])

  const update = (field, value) => {
    setForm({ ...form, [field]: value })
    setSaved(false)
  }

  const updateHorario = (index, field, value) => {
    const newHorarios = [...form.horarios]
    newHorarios[index] = { ...newHorarios[index], [field]: value }
    setForm({ ...form, horarios: newHorarios })
    setSaved(false)
  }

  const handleNew = () => {
    setSelected(null)
    setForm(emptyForm)
    setShowForm(true)
    setSaved(false)
  }

  const handleEdit = (negocio) => {
    setSelected(negocio.id)
    setForm({
      nombre: negocio.nombre || '',
      descripcion: negocio.descripcion || '',
      direccion: negocio.direccion || '',
      ubicacion: negocio.ubicacion || '',
      whatsapp: negocio.whatsapp || '',
      telefono: negocio.telefono || '',
      correo: negocio.correo || '',
      facebook: negocio.facebook || '',
      instagram: negocio.instagram || '',
      horarios: negocio.horarios || defaultHorarios,
    })
    setShowForm(true)
    setSaved(false)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!form.nombre.trim()) return
    setSaving(true)
    try {
      const url = selected
        ? `${API}/api/v1/turismo/${selected}`
        : `${API}/api/v1/turismo`
      const method = selected ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(form)
      })
      if (res.ok) {
        const data = await res.json()
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
        fetchNegocios()
        if (!selected && data.id) setSelected(data.id)
      }
    } catch (err) {
      console.error('Error guardando turismo:', err)
    }
    setSaving(false)
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este negocio de turismo?')) return
    try {
      await fetch(`${API}/api/v1/turismo/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      })
      if (selected === id) {
        setShowForm(false)
        setSelected(null)
        setForm(emptyForm)
      }
      fetchNegocios()
    } catch (err) {
      console.error('Error eliminando:', err)
    }
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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-black text-gray-800">Turismo</h1>
          <p className="text-xs text-gray-400 mt-0.5">Administra los negocios de turismo y aventura</p>
        </div>
        <button
          onClick={handleNew}
          className="bg-primary text-white font-bold px-4 py-2.5 rounded-lg hover:bg-primary/90 transition-colors text-sm flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-lg">add</span>
          Nuevo negocio
        </button>
      </div>

      {/* Lista de negocios */}
      {negocios.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6 overflow-x-auto">
          <table className="w-full text-sm min-w-[500px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Nombre</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Ubicación</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Teléfono</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Correo</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {negocios.map((n) => (
                <tr
                  key={n.id}
                  className={`border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer ${selected === n.id ? 'bg-primary/5' : ''}`}
                  onClick={() => handleEdit(n)}
                >
                  <td className="px-4 py-3 font-medium text-gray-800">{n.nombre}</td>
                  <td className="px-4 py-3 text-gray-500">{n.ubicacion || n.direccion || '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{n.telefono || '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{n.correo || '—'}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleEdit(n) }}
                      className="text-primary hover:text-primary/70 transition-colors mr-2"
                      title="Editar"
                    >
                      <span className="material-symbols-outlined text-lg">edit</span>
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(n.id) }}
                      className="text-red-400 hover:text-red-600 transition-colors"
                      title="Eliminar"
                    >
                      <span className="material-symbols-outlined text-lg">delete</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Estado vacío */}
      {negocios.length === 0 && !showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <span className="material-symbols-outlined text-5xl text-gray-300 mb-3">landscape</span>
          <p className="text-sm text-gray-500 mb-4">Aún no hay negocios de turismo registrados</p>
          <button
            onClick={handleNew}
            className="bg-primary text-white font-bold px-5 py-2.5 rounded-lg hover:bg-primary/90 transition-colors text-sm inline-flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-lg">add</span>
            Agregar el primero
          </button>
        </div>
      )}

      {/* Formulario */}
      {showForm && (
        <form onSubmit={handleSave} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-gray-700 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-lg">landscape</span>
              {selected ? 'Editar negocio' : 'Nuevo negocio de turismo'}
            </h2>
            <button
              type="button"
              onClick={() => { setShowForm(false); setSelected(null); setForm(emptyForm) }}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* COLUMNA IZQUIERDA: Datos del negocio */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Nombre del negocio</label>
                  <input
                    type="text"
                    value={form.nombre}
                    onChange={(e) => update('nombre', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
                    placeholder="Ej: Volcán Expediciones"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Ubicación</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-primary text-lg material-symbols-outlined">pin_drop</span>
                    <input
                      type="text"
                      value={form.ubicacion}
                      onChange={(e) => update('ubicacion', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2 text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
                      placeholder="Ej: Villarrica, La Araucanía"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Descripción</label>
                <textarea
                  value={form.descripcion}
                  onChange={(e) => update('descripcion', e.target.value)}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none resize-none"
                  placeholder="Breve descripción del negocio de turismo..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">WhatsApp</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-green-500 text-lg material-symbols-outlined">chat</span>
                    <input
                      type="tel"
                      value={form.whatsapp}
                      onChange={(e) => update('whatsapp', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2 text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
                      placeholder="+54 9 2972 12 3456"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Teléfono</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-primary text-lg material-symbols-outlined">phone</span>
                    <input
                      type="tel"
                      value={form.telefono}
                      onChange={(e) => update('telefono', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2 text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
                      placeholder="+54 2972 42 3456"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Correo electrónico</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-primary text-lg material-symbols-outlined">mail</span>
                    <input
                      type="email"
                      value={form.correo}
                      onChange={(e) => update('correo', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2 text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
                      placeholder="contacto@negocio.cl"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Dirección</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-primary text-lg material-symbols-outlined">location_on</span>
                    <input
                      type="text"
                      value={form.direccion}
                      onChange={(e) => update('direccion', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2 text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
                      placeholder="Av. San Martín 535, Villarrica"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Facebook</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-600 text-sm font-black">f</span>
                    <input
                      type="text"
                      value={form.facebook}
                      onChange={(e) => update('facebook', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2 text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
                      placeholder="facebook.com/tu-pagina"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Instagram</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-pink-500 text-lg material-symbols-outlined">photo_camera</span>
                    <input
                      type="text"
                      value={form.instagram}
                      onChange={(e) => update('instagram', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2 text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
                      placeholder="@tu_instagram"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* COLUMNA DERECHA: Horarios */}
            <div>
              <h2 className="text-sm font-bold text-gray-700 flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined text-primary text-lg">schedule</span>
                Horarios de atención
              </h2>
              <div className="space-y-1.5">
                {form.horarios.map((h, i) => (
                  <div key={h.dia} className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => updateHorario(i, 'activo', !h.activo)}
                      className={`w-24 text-left text-xs font-semibold py-1.5 px-2 rounded-lg transition-colors flex items-center gap-1.5 ${
                        h.activo ? 'text-primary bg-primary/5' : 'text-gray-400 bg-gray-50'
                      }`}
                    >
                      <span className={`material-symbols-outlined text-sm ${h.activo ? 'text-primary' : 'text-gray-300'}`}>
                        {h.activo ? 'check_box' : 'check_box_outline_blank'}
                      </span>
                      {h.dia}
                    </button>

                    {h.activo ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="time"
                          value={h.apertura}
                          onChange={(e) => updateHorario(i, 'apertura', e.target.value)}
                          className="border border-gray-300 rounded-lg px-2 py-1.5 text-xs focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
                        />
                        <span className="text-xs text-gray-400">a</span>
                        <input
                          type="time"
                          value={h.cierre}
                          onChange={(e) => updateHorario(i, 'cierre', e.target.value)}
                          className="border border-gray-300 rounded-lg px-2 py-1.5 text-xs focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
                        />
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400 italic">Cerrado</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Botón guardar */}
          <div className="flex items-center gap-3 mt-6">
            <button
              type="submit"
              disabled={saving}
              className="bg-primary text-white font-bold px-6 py-2.5 rounded-lg hover:bg-primary/90 transition-colors text-sm flex items-center gap-2 disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-lg">save</span>
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </button>
            {saved && (
              <span className="text-green-600 text-sm font-medium flex items-center gap-1">
                <span className="material-symbols-outlined text-base">check_circle</span>
                Guardado correctamente
              </span>
            )}
          </div>
        </form>
      )}
    </div>
  )
}
