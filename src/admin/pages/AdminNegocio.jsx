import { useState, useEffect } from 'react'

const API = import.meta.env.VITE_API || ''
const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

const defaultHorarios = DIAS.map((dia) => ({
  dia,
  activo: dia !== 'Domingo',
  apertura: '09:00',
  cierre: '18:00',
}))

const MAX_SLOGAN_WORDS = 10

const emptyForm = {
  nombre_negocio: '',
  slogan: '',
  descripcion: '',
  ubicacion: '',
  direccion: '',
  whatsapp: '',
  telefono: '',
  correo: '',
  facebook: '',
  instagram: '',
  horarios: defaultHorarios,
}

export default function AdminNegocio() {
  const [form, setForm] = useState(emptyForm)
  const [logo, setLogo] = useState('')
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const user = JSON.parse(localStorage.getItem('user') || '{}')

  const esTurismo = user.tipo_cuenta === 'turismo'
  const tieneSlogan = !esTurismo && user.plan_id && user.plan_id >= 2

  useEffect(() => {
    fetch(`${API}/api/v1/business`, {
      credentials: 'include'
    })
      .then(r => {
        if (r.status === 401) { localStorage.removeItem('token'); localStorage.removeItem('user'); window.location.href = '/'; return {} }
        if (!r.ok) return {}
        return r.json()
      })
      .then(data => {
        if (data.business) {
          setLogo(data.business.logo_url || '')
          setForm({
            nombre_negocio: data.business.nombre_negocio || '',
            slogan: data.business.slogan || '',
            descripcion: data.business.descripcion || '',
            ubicacion: data.business.ubicacion || '',
            direccion: data.business.direccion || '',
            whatsapp: data.business.whatsapp || '',
            telefono: data.business.telefono || '',
            correo: data.business.correo || '',
            facebook: data.business.facebook || '',
            instagram: data.business.instagram || '',
            horarios: data.business.horarios || defaultHorarios,
          })
        }
      })
      .catch(err => console.error('Error cargando negocio:', err))
      .finally(() => setLoading(false))
  }, [])

  const update = (field, value) => {
    if (field === 'slogan') {
      const words = value.trim().split(/\s+/).filter(Boolean)
      if (words.length > MAX_SLOGAN_WORDS) return
    }
    setForm({ ...form, [field]: value })
    setSaved(false)
  }

  const sloganWordCount = form.slogan.trim() ? form.slogan.trim().split(/\s+/).filter(Boolean).length : 0

  const updateHorario = (index, field, value) => {
    const newHorarios = [...form.horarios]
    newHorarios[index] = { ...newHorarios[index], [field]: value }
    setForm({ ...form, horarios: newHorarios })
    setSaved(false)
  }

  const handleLogoChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploadingLogo(true)
    setError('')
    try {
      const fd = new FormData()
      fd.append('imagen', file)
      const res = await fetch(`${API}/api/v1/business/logo`, {
        method: 'PATCH',
        credentials: 'include',
        body: fd,
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) setLogo(data.logo_url)
      else setError(data.error || 'Error al subir logo')
    } catch {
      setError('Error de conexión al subir logo')
    }
    setUploadingLogo(false)
    e.target.value = ''
  }

  const fbValid = !form.facebook || /^https?:\/\/(www\.)?(facebook\.com|fb\.com)\//i.test(form.facebook)
  const igValid = !form.instagram || /^https?:\/\/(www\.)?instagram\.com\//i.test(form.instagram) || /^@[\w.]+$/.test(form.instagram)

  const handleSave = async (e) => {
    e.preventDefault()
    if (!fbValid) { setError('La URL de Facebook debe ser un enlace válido de facebook.com'); return }
    if (!igValid) { setError('Instagram debe ser una URL de instagram.com o un @usuario'); return }
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`${API}/api/v1/business`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      if (res.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      } else {
        const data = await res.json().catch(() => ({}))
        setError(data.error || 'Error al guardar')
      }
    } catch {
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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-black text-gray-800">Mi Negocio</h1>
          <p className="text-xs text-gray-400 mt-0.5">Información de tu emprendimiento, local o servicio</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-2 flex items-center gap-2">
          <span className="material-symbols-outlined text-base">error</span>
          {error}
        </div>
      )}

      {/* Logo — solo planes pagados de productos generales */}
      {!esTurismo && user.plan_id >= 2 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-5 mb-4 flex items-center gap-5">
          <div className="relative flex-shrink-0">
            <div className="w-20 h-20 rounded-full border-2 border-dashed border-gray-300 overflow-hidden flex items-center justify-center bg-gray-50">
              {logo
                ? <img src={logo} alt="Logo" className="w-full h-full object-cover" />
                : <span className="material-symbols-outlined text-gray-300 text-3xl">store</span>
              }
            </div>
            {uploadingLogo && (
              <div className="absolute inset-0 rounded-full bg-white/80 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-xl animate-spin">progress_activity</span>
              </div>
            )}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-0.5">Logo del negocio</p>
            <p className="text-xs text-gray-400 mb-2">Se mostrará en el header de tu página. Se comprime automáticamente.</p>
            <label className={`cursor-pointer inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${uploadingLogo ? 'opacity-50 pointer-events-none' : 'text-primary bg-primary/10 hover:bg-primary/20'}`}>
              <span className="material-symbols-outlined text-sm">upload</span>
              {uploadingLogo ? 'Subiendo...' : logo ? 'Cambiar logo' : 'Subir logo'}
              <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleLogoChange} disabled={uploadingLogo} />
            </label>
          </div>
        </div>
      )}

      <form onSubmit={handleSave} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* COLUMNA IZQUIERDA: Datos del negocio */}
          <div className="space-y-4">
            <div className={`grid gap-3 ${tieneSlogan ? 'grid-cols-2' : 'grid-cols-1'}`}>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Negocio o emprendimiento</label>
                <input
                  type="text"
                  value={form.nombre_negocio}
                  onChange={(e) => update('nombre_negocio', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
                  placeholder="Nombre de tu negocio"
                />
              </div>
              {tieneSlogan && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">
                    Slogan
                    <span className={`ml-2 text-[10px] font-normal ${sloganWordCount >= MAX_SLOGAN_WORDS ? 'text-red-500' : 'text-gray-400'}`}>
                      {sloganWordCount}/{MAX_SLOGAN_WORDS} palabras
                    </span>
                  </label>
                  <input
                    type="text"
                    value={form.slogan}
                    onChange={(e) => update('slogan', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
                    placeholder="Ej: Lo mejor en calidad y precio"
                  />
                </div>
              )}
            </div>

            {esTurismo && (
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
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Descripción del negocio</label>
              <textarea
                value={form.descripcion}
                onChange={(e) => update('descripcion', e.target.value)}
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none resize-none"
                placeholder="Describe tu negocio, qué ofreces, tu experiencia..."
              />
            </div>

            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <div>
                <label className="block text-[10px] sm:text-xs font-semibold text-gray-500 mb-1">WhatsApp</label>
                <div className="relative">
                  <span className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 text-green-500 text-sm sm:text-lg material-symbols-outlined">chat</span>
                  <input
                    type="tel"
                    value={form.whatsapp}
                    onChange={(e) => update('whatsapp', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg pl-7 sm:pl-10 pr-1 sm:pr-3 py-1.5 sm:py-2 text-[11px] sm:text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
                    placeholder="+56 9 1234 5678"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] sm:text-xs font-semibold text-gray-500 mb-1">Teléfono</label>
                <div className="relative">
                  <span className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 text-primary text-sm sm:text-lg material-symbols-outlined">phone</span>
                  <input
                    type="tel"
                    value={form.telefono}
                    onChange={(e) => update('telefono', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg pl-7 sm:pl-10 pr-1 sm:pr-3 py-1.5 sm:py-2 text-[11px] sm:text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
                    placeholder="+56 45 234 5678"
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
                    placeholder="contacto@minegocio.cl"
                  />
                </div>
              </div>
              {!esTurismo && (
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Dirección</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-primary text-lg material-symbols-outlined">location_on</span>
                  <input
                    type="text"
                    value={form.direccion}
                    onChange={(e) => update('direccion', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2 text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
                    placeholder="Dirección del negocio"
                  />
                </div>
              </div>
              )}
            </div>

            <div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Facebook</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-600 text-sm font-black">f</span>
                    <input
                      type="text"
                      value={form.facebook}
                      onChange={(e) => update('facebook', e.target.value)}
                      className={`w-full border rounded-lg pl-10 pr-3 py-2 text-sm focus:ring-2 focus:ring-primary/30 outline-none ${!fbValid ? 'border-red-400 focus:border-red-400' : 'border-gray-300 focus:border-primary'}`}
                      placeholder="https://facebook.com/tu-pagina"
                    />
                  </div>
                  {!fbValid && <p className="text-[10px] text-red-500 mt-0.5">Debe ser un enlace de facebook.com</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Instagram</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-pink-500 text-lg material-symbols-outlined">photo_camera</span>
                    <input
                      type="text"
                      value={form.instagram}
                      onChange={(e) => update('instagram', e.target.value)}
                      className={`w-full border rounded-lg pl-10 pr-3 py-2 text-sm focus:ring-2 focus:ring-primary/30 outline-none ${!igValid ? 'border-red-400 focus:border-red-400' : 'border-gray-300 focus:border-primary'}`}
                      placeholder="@tu_instagram"
                    />
                  </div>
                  {!igValid && <p className="text-[10px] text-red-500 mt-0.5">Debe ser instagram.com/... o @usuario</p>}
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
    </div>
  )
}
