import { useState } from 'react'

const API = import.meta.env.VITE_API || ''
const IVA = 0.19

const formatCLP = (n) => '$' + n.toLocaleString('es-CL')

const plansList = [
  {
    id: 1,
    name: 'Plan Gratuito',
    neto: 0,
    max: '5 imágenes',
    features: ['Panel de control', 'Visible al filtrar por producto o categoría', 'Editar información'],
    noFeatures: ['Visible en página principal', 'Slogan', 'Producto destacado', 'Página propia', 'Apariencia', 'Estadísticas'],
    highlight: false,
  },
  {
    id: 2,
    name: 'Plan Normal',
    neto: 2990,
    max: '25 imágenes',
    features: ['Panel de control', 'Visible en página principal', 'Editar información', 'Slogan', 'Producto destacado', 'Prioridad alta', 'Página propia'],
    noFeatures: ['Banner', 'Apariencia', 'Estadísticas'],
    highlight: false,
  },
  {
    id: 3,
    name: 'Plan Premium',
    neto: 4990,
    max: '110 imágenes',
    features: ['Panel de control', 'Visible en página principal', 'Editar información', 'Slogan', 'Producto destacado', 'Prioridad máxima', 'Página propia', 'Banner (10 items)', 'Apariencia', 'Estadísticas'],
    noFeatures: [],
    highlight: true,
  },
]

const plansListTurismo = [
  {
    id: 1,
    name: 'Plan Gratuito',
    neto: 0,
    max: '3 imágenes',
    features: ['Panel de control', 'Info del negocio', 'Portada (3 imágenes)', 'Tarjeta en página turismo', 'Dirección y horarios'],
    noFeatures: ['Página propia premium', 'Tours (36 imágenes)', 'Estadísticas'],
    highlight: false,
  },
  {
    id: 3,
    name: 'Plan Premium',
    neto: 3990,
    max: '39 imágenes',
    features: ['Panel de control', 'Info del negocio', 'Portada (3 imágenes)', 'Tarjeta en página turismo', 'Dirección y horarios', 'Página propia premium', 'Tours (36 imágenes)', 'Estadísticas'],
    noFeatures: [],
    highlight: true,
  },
]

export default function RegisterModal({ onClose, onSwitchToLogin, onRegisterSuccess }) {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({
    nombre: '',
    email: '',
    password: '',
    password2: '',
    dni: '',
    telefono: '',
    comuna: 'Villarrica',
    direccion: '',
    tipo_cuenta: '',
    vende_productos: false,
    ofrece_servicios: false,
    ofrece_arriendos: false,
    plan_id: 3, // Premium por defecto para cualquier registro
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const update = (field, value) => setForm({ ...form, [field]: value })

  // Rellena el paso actual con datos de ejemplo (utilidad para pruebas)
  const handleAutofill = () => {
    setError('')
    if (step === 1) {
      const rnd = Math.floor(Math.random() * 100000)
      setForm((f) => ({
        ...f,
        nombre: 'Juan Pérez',
        email: `prueba${rnd}@example.com`,
        password: 'prueba123',
        password2: 'prueba123',
        dni: `20${10000000 + (rnd % 90000000)}`,
        telefono: '+54 9 2972 12 3456',
        comuna: 'Villarrica',
        direccion: 'Av. San Martín 123',
      }))
    } else if (step === 2) {
      setForm((f) =>
        f.tipo_cuenta === 'turismo'
          ? f
          : { ...f, tipo_cuenta: 'general', vende_productos: true, ofrece_servicios: true, ofrece_arriendos: false }
      )
    } else if (step === 3) {
      setForm((f) => ({ ...f, plan_id: 3 }))
    }
  }

  const validateStep1 = () => {
    if (!form.nombre.trim()) return 'El nombre es obligatorio'
    if (!form.email.trim()) return 'El email es obligatorio'
    if (!form.password || form.password.length < 6) return 'La contraseña debe tener al menos 6 caracteres'
    if (form.password !== form.password2) return 'Las contraseñas no coinciden'
    if (!form.dni.trim()) return 'El RUT es obligatorio'
    if (!form.telefono.trim()) return 'El teléfono es obligatorio'
    if (!form.direccion.trim()) return 'La dirección es obligatoria'
    return null
  }

  const validateStep2 = () => {
    if (!form.tipo_cuenta) return 'Selecciona un tipo de cuenta'
    if (form.tipo_cuenta === 'general' && !form.vende_productos && !form.ofrece_servicios && !form.ofrece_arriendos) {
      return 'Selecciona al menos una opción'
    }
    return null
  }

  const isSimpleType = form.tipo_cuenta === 'local' || form.tipo_cuenta === 'evento'

  const handleNext = () => {
    if (step === 1) {
      const err = validateStep1()
      if (err) { setError(err); return }
    }
    if (step === 2) {
      const err = validateStep2()
      if (err) { setError(err); return }
      setError('')
      // local y evento siempre son plan gratuito — saltar el paso 3
      if (isSimpleType) {
        handleSubmit({ plan_id: 1 })
        return
      }
    }
    setError('')
    setStep(step + 1)
  }

  // overrides permite pasar plan_id=1 directamente para local/evento sin pasar por step 3
  const handleSubmit = async (overrides = {}) => {
    setError('')
    setLoading(true)
    const f = { ...form, ...overrides }

    try {
      const res = await fetch(`${API}/api/v1/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          nombre: f.nombre.trim(),
          email: f.email.trim(),
          password: f.password,
          dni: f.dni.trim(),
          telefono: f.telefono.trim() || null,
          comuna: f.comuna.trim() || null,
          direccion: f.direccion.trim() || null,
          tipo_cuenta: f.tipo_cuenta,
          vende_productos: f.vende_productos,
          ofrece_servicios: f.ofrece_servicios,
          ofrece_arriendos: f.ofrece_arriendos,
          plan_id: f.plan_id,
        })
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Error al registrar')
        setLoading(false)
        return
      }

      const u = data.usuario || data.user
      localStorage.removeItem('token')
      localStorage.setItem('user', JSON.stringify(u))
      onRegisterSuccess(u)
      onClose()
    } catch {
      setError('Error de conexión')
      setLoading(false)
    }
  }

  const stepTitles = isSimpleType
    ? ['Datos personales', 'Tipo de cuenta']
    : ['Datos personales', 'Tipo de cuenta', 'Elige tu plan']

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className={`bg-white rounded-2xl shadow-2xl w-full overflow-hidden ${step === 3 ? (form.tipo_cuenta === 'turismo' ? 'max-w-xl' : 'max-w-3xl') : 'max-w-lg'} transition-all duration-300`} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-primary px-3 sm:px-6 py-2.5 sm:py-4 flex items-center justify-between">
          <h2 className="text-white font-bold text-sm sm:text-lg flex items-center gap-1.5 sm:gap-2">
            <span className="material-symbols-outlined text-lg sm:text-2xl">person_add</span>
            Registrarse
          </h2>
          <div className="flex items-center gap-3">
            {/* Indicador de pasos */}
            <div className="flex items-center gap-1">
              {stepTitles.map((_, i) => {
                const s = i + 1
                return (
                  <div key={s} className="flex items-center">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                      s === step ? 'bg-accent text-primary' : s < step ? 'bg-white/30 text-white' : 'bg-white/10 text-white/40'
                    }`}>
                      {s < step ? <span className="material-symbols-outlined text-sm">check</span> : s}
                    </div>
                    {s < stepTitles.length && <div className={`w-4 h-0.5 ${s < step ? 'bg-white/30' : 'bg-white/10'}`} />}
                  </div>
                )
              })}
            </div>
            <button onClick={onClose} className="text-white/70 hover:text-white transition-colors">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>

        {/* Subtítulo del paso */}
        <div className="bg-primary/5 px-3 sm:px-6 py-1.5 sm:py-2 border-b border-gray-100 flex items-center justify-between gap-2 sm:gap-3">
          <p className="text-[10px] sm:text-xs font-semibold text-primary">{stepTitles[step - 1]}</p>
          <button
            type="button"
            onClick={handleAutofill}
            className="flex items-center gap-1 text-[10px] font-bold text-primary/70 hover:text-primary bg-white border border-primary/20 hover:border-primary/40 rounded-full px-2.5 py-1 transition-colors shrink-0"
            title="Rellenar este paso con datos de ejemplo"
          >
            <span className="material-symbols-outlined text-xs">auto_fix_high</span>
            Autocompletar
          </button>
        </div>

        <div className="p-3 sm:p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-[13px] sm:text-sm rounded-lg px-3 sm:px-4 py-2 flex items-center gap-2 mb-3 sm:mb-4">
              <span className="material-symbols-outlined text-sm sm:text-base">error</span>
              {error}
            </div>
          )}

          {/* PASO 1: Datos personales */}
          {step === 1 && (
            <div className="space-y-2 sm:space-y-3">
              <div>
                <label className="block text-[10px] sm:text-xs font-semibold text-gray-600 mb-1">Nombre completo *</label>
                <input
                  type="text"
                  required
                  value={form.nombre}
                  onChange={(e) => update('nombre', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-2.5 py-1 sm:px-3 sm:py-2 text-[12px] sm:text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
                  placeholder="Tu nombre completo"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <div>
                  <label className="block text-[10px] sm:text-xs font-semibold text-gray-600 mb-1">RUT *</label>
                  <input
                    type="text"
                    required
                    value={form.dni}
                    onChange={(e) => update('dni', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-2.5 py-1 sm:px-3 sm:py-2 text-[12px] sm:text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
                    placeholder="Ej: 20-12345678-3"
                  />
                </div>
                <div>
                  <label className="block text-[10px] sm:text-xs font-semibold text-gray-600 mb-1">Teléfono *</label>
                  <input
                    type="tel"
                    value={form.telefono}
                    onChange={(e) => update('telefono', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-2.5 py-1 sm:px-3 sm:py-2 text-[12px] sm:text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
                    placeholder="+54 9 2972 12 3456"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] sm:text-xs font-semibold text-gray-600 mb-1">Email *</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => update('email', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-2.5 py-1 sm:px-3 sm:py-2 text-[12px] sm:text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
                  placeholder="tu@email.com"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <div>
                  <label className="block text-[10px] sm:text-xs font-semibold text-gray-600 mb-1">Contraseña *</label>
                  <input
                    type="password"
                    required
                    value={form.password}
                    onChange={(e) => update('password', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-2.5 py-1 sm:px-3 sm:py-2 text-[12px] sm:text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
                    placeholder="Mínimo 6 caracteres"
                  />
                </div>
                <div>
                  <label className="block text-[10px] sm:text-xs font-semibold text-gray-600 mb-1">Repetir contraseña *</label>
                  <input
                    type="password"
                    required
                    value={form.password2}
                    onChange={(e) => update('password2', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-2.5 py-1 sm:px-3 sm:py-2 text-[12px] sm:text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
                    placeholder="Repite tu contraseña"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <div>
                  <label className="block text-[10px] sm:text-xs font-semibold text-gray-600 mb-1">Localidad</label>
                  <input
                    type="text"
                    value="Villarrica"
                    readOnly
                    disabled
                    title="Disponible solo en Villarrica"
                    className="w-full border border-gray-200 bg-gray-100 text-gray-500 cursor-not-allowed rounded-lg px-2.5 py-1 sm:px-3 sm:py-2 text-[12px] sm:text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] sm:text-xs font-semibold text-gray-600 mb-1">Dirección *</label>
                  <input
                    type="text"
                    value={form.direccion}
                    onChange={(e) => update('direccion', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-2.5 py-1 sm:px-3 sm:py-2 text-[12px] sm:text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
                    placeholder="Tu dirección"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleNext}
                className="w-full bg-primary text-white font-bold py-2 sm:py-2.5 text-sm sm:text-base rounded-lg hover:bg-primary/90 transition-colors mt-2"
              >
                Siguiente
              </button>

              <p className="text-center text-[13px] sm:text-sm text-gray-500">
                ¿Ya tienes cuenta?{' '}
                <button type="button" onClick={onSwitchToLogin} className="text-primary font-bold hover:underline">
                  Ingresar
                </button>
              </p>
            </div>
          )}

          {/* PASO 2: Tipo de cuenta */}
          {step === 2 && (
            <div className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-[10px] sm:text-xs font-semibold text-gray-600 mb-2 sm:mb-3">¿Qué tipo de cuenta necesitas?</label>
                <div className="grid grid-cols-2 gap-2 sm:gap-3">

                  {/* General */}
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, tipo_cuenta: 'general', vende_productos: false, ofrece_servicios: false, ofrece_arriendos: false })}
                    className={`flex flex-col items-center gap-1.5 p-3 sm:p-4 rounded-xl border-2 transition-all ${
                      form.tipo_cuenta === 'general'
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-gray-200 text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    <span className="material-symbols-outlined text-2xl sm:text-3xl">storefront</span>
                    <span className="text-[12px] sm:text-sm font-bold">General</span>
                    <span className="text-[9px] sm:text-[10px] text-center leading-tight">Productos, servicios o arriendos</span>
                  </button>

                  {/* Turismo */}
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, tipo_cuenta: 'turismo', vende_productos: false, ofrece_servicios: false, ofrece_arriendos: false })}
                    className={`flex flex-col items-center gap-1.5 p-3 sm:p-4 rounded-xl border-2 transition-all ${
                      form.tipo_cuenta === 'turismo'
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-gray-200 text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    <span className="material-symbols-outlined text-2xl sm:text-3xl">tour</span>
                    <span className="text-[12px] sm:text-sm font-bold">Turismo</span>
                    <span className="text-[9px] sm:text-[10px] text-center leading-tight">Experiencias, tours y actividades</span>
                  </button>

                  {/* Local de barrio */}
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, tipo_cuenta: 'local', vende_productos: false, ofrece_servicios: false, ofrece_arriendos: false, plan_id: 1 })}
                    className={`flex flex-col items-center gap-1.5 p-3 sm:p-4 rounded-xl border-2 transition-all relative ${
                      form.tipo_cuenta === 'local'
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-gray-200 text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-green-500 text-white text-[8px] font-black px-2 py-0.5 rounded-full">GRATIS</span>
                    <span className="material-symbols-outlined text-2xl sm:text-3xl">local_grocery_store</span>
                    <span className="text-[12px] sm:text-sm font-bold">Local de barrio</span>
                    <span className="text-[9px] sm:text-[10px] text-center leading-tight">Almacén, ferretería, restorán y más</span>
                  </button>

                  {/* Evento */}
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, tipo_cuenta: 'evento', vende_productos: false, ofrece_servicios: false, ofrece_arriendos: false, plan_id: 1 })}
                    className={`flex flex-col items-center gap-1.5 p-3 sm:p-4 rounded-xl border-2 transition-all relative ${
                      form.tipo_cuenta === 'evento'
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-gray-200 text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-green-500 text-white text-[8px] font-black px-2 py-0.5 rounded-full">GRATIS</span>
                    <span className="material-symbols-outlined text-2xl sm:text-3xl">event</span>
                    <span className="text-[12px] sm:text-sm font-bold">Evento</span>
                    <span className="text-[9px] sm:text-[10px] text-center leading-tight">Conciertos, ferias, beneficios y más</span>
                  </button>

                </div>
              </div>

              {/* Subopción: qué ofrece (solo General) */}
              {form.tipo_cuenta === 'general' && (
                <div>
                  <label className="block text-[10px] sm:text-xs font-semibold text-gray-600 mb-2">¿Qué ofreces? (selecciona al menos una)</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { key: 'vende_productos', label: 'Productos', icon: 'inventory_2' },
                      { key: 'ofrece_servicios', label: 'Servicios', icon: 'work' },
                      { key: 'ofrece_arriendos', label: 'Arriendos', icon: 'home' },
                    ].map((opt) => (
                      <label
                        key={opt.key}
                        className={`flex flex-col items-center gap-1 p-2 sm:p-2.5 rounded-lg border-2 cursor-pointer transition-all ${
                          form[opt.key]
                            ? 'border-primary bg-primary/5'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <input type="checkbox" checked={form[opt.key]} onChange={(e) => update(opt.key, e.target.checked)} className="sr-only" />
                        <span className={`material-symbols-outlined text-base sm:text-lg ${form[opt.key] ? 'text-primary' : 'text-gray-400'}`}>
                          {form[opt.key] ? 'check_circle' : opt.icon}
                        </span>
                        <span className={`text-[10px] sm:text-[11px] font-medium ${form[opt.key] ? 'text-primary' : 'text-gray-600'}`}>{opt.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Info boxes */}
              {form.tipo_cuenta === 'turismo' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 flex items-start gap-2">
                  <span className="material-symbols-outlined text-xs text-blue-500 mt-0.5">info</span>
                  <span className="text-[10px] sm:text-[11px] text-blue-700 leading-tight">Podrás publicar experiencias, tours y actividades turísticas en Villarrica y alrededores.</span>
                </div>
              )}

              {form.tipo_cuenta === 'local' && (
                <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2 flex items-start gap-2">
                  <span className="material-symbols-outlined text-xs text-green-600 mt-0.5">check_circle</span>
                  <span className="text-[10px] sm:text-[11px] text-green-700 leading-tight">
                    <strong>Plan siempre gratuito.</strong> Podrás publicar tu local con hasta 3 imágenes, categoría, horario y datos de contacto. Aparecerás en el mapa y en el listado de locales.
                  </span>
                </div>
              )}

              {form.tipo_cuenta === 'evento' && (
                <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2 flex items-start gap-2">
                  <span className="material-symbols-outlined text-xs text-green-600 mt-0.5">check_circle</span>
                  <span className="text-[10px] sm:text-[11px] text-green-700 leading-tight">
                    <strong>Plan siempre gratuito.</strong> Podrás publicar eventos con hasta 3 imágenes. Al llegar la fecha del evento, la publicación se retira automáticamente al día siguiente.
                  </span>
                </div>
              )}

              <div className="flex gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => { setStep(1); setError('') }}
                  className="flex-1 border-2 border-gray-300 text-gray-600 font-bold py-2 sm:py-2.5 text-sm sm:text-base rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Volver
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={loading}
                  className="flex-1 bg-primary text-white font-bold py-2 sm:py-2.5 text-sm sm:text-base rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Registrando...' : isSimpleType ? 'Crear cuenta' : 'Siguiente'}
                </button>
              </div>
            </div>
          )}

          {/* PASO 3: Selección de plan */}
          {step === 3 && (
            <div className="space-y-3 sm:space-y-4">
              {(() => {
                const planes = form.tipo_cuenta === 'turismo' ? plansListTurismo : plansList
                const selected = planes.find((p) => p.id === form.plan_id) || planes.find((p) => p.highlight) || planes[0]
                return (
                  <>
                    {/* MÓVIL: pestañas con el nombre de cada plan + detalle del seleccionado */}
                    <div className="sm:hidden">
                      <div className="flex gap-1.5 mb-3">
                        {planes.map((plan) => (
                          <button
                            key={plan.id}
                            type="button"
                            onClick={() => update('plan_id', plan.id)}
                            className={`flex-1 rounded-lg px-1 py-2 text-[11px] font-black uppercase tracking-wide transition-all border-2 ${
                              form.plan_id === plan.id
                                ? 'border-primary bg-primary text-white shadow'
                                : 'border-gray-200 bg-white text-gray-500'
                            }`}
                          >
                            {plan.name.replace('Plan ', '')}
                          </button>
                        ))}
                      </div>

                      <div className="relative rounded-xl border-2 border-primary bg-primary/5 p-4">
                        {selected.highlight && (
                          <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-accent text-primary text-[8px] font-black uppercase tracking-wider px-3 py-0.5 rounded-full">
                            Recomendado
                          </span>
                        )}
                        <h3 className="text-base font-black text-slate-800">{selected.name}</h3>

                        {selected.neto === 0 ? (
                          <div className="mt-1">
                            <span className="text-2xl font-black text-primary">Gratis</span>
                          </div>
                        ) : (
                          <div className="mt-1 space-y-0.5">
                            <div className="flex items-baseline gap-1">
                              <span className="text-2xl font-black text-primary">{formatCLP(selected.neto)}</span>
                              <span className="text-[11px] text-slate-400">/ mes</span>
                            </div>
                            <div className="text-[10px] text-slate-400 leading-tight">
                              + IVA ({formatCLP(Math.round(selected.neto * IVA))})
                            </div>
                          </div>
                        )}

                        {selected.max && <span className="block text-[12px] font-bold text-primary/70 mt-1">{selected.max}</span>}

                        <div className="mt-3 space-y-1">
                          {selected.features.map((f) => (
                            <div key={f} className="flex items-center gap-1.5">
                              <span className="material-symbols-outlined text-green-500 text-sm">check_circle</span>
                              <span className="text-[12px] text-slate-600">{f}</span>
                            </div>
                          ))}
                          {selected.noFeatures.map((f) => (
                            <div key={f} className="flex items-center gap-1.5">
                              <span className="material-symbols-outlined text-red-400 text-sm">cancel</span>
                              <span className="text-[12px] text-slate-400">{f}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* TABLET/DESKTOP: grilla de planes */}
                    <div className={`hidden sm:grid gap-3 ${form.tipo_cuenta === 'turismo' ? 'grid-cols-2' : 'grid-cols-3'}`}>
                {planes.map((plan) => (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() => update('plan_id', plan.id)}
                    className={`relative flex flex-col rounded-xl border-2 p-2.5 sm:p-4 transition-all text-left ${
                      form.plan_id === plan.id
                        ? 'border-primary bg-primary/5 shadow-lg'
                        : plan.highlight
                          ? 'border-accent hover:border-primary'
                          : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {plan.highlight && (
                      <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-accent text-primary text-[8px] font-black uppercase tracking-wider px-3 py-0.5 rounded-full">
                        Recomendado
                      </span>
                    )}

                    {/* Check de selección */}
                    <div className="absolute top-2 right-2">
                      <span className={`material-symbols-outlined text-xl ${form.plan_id === plan.id ? 'text-primary' : 'text-gray-300'}`}>
                        {form.plan_id === plan.id ? 'check_circle' : 'radio_button_unchecked'}
                      </span>
                    </div>

                    <h3 className="text-[12px] sm:text-sm font-black text-slate-800">{plan.name}</h3>

                    {plan.neto === 0 ? (
                      <div className="mt-1">
                        <span className="text-xl sm:text-2xl font-black text-primary">Gratis</span>
                      </div>
                    ) : (
                      <div className="mt-1 space-y-0.5">
                        <div className="flex items-baseline gap-1">
                          <span className="text-lg sm:text-xl font-black text-primary">{formatCLP(plan.neto)}</span>
                          <span className="text-[10px] text-slate-400">/ mes</span>
                        </div>
                        <div className="text-[9px] text-slate-400 leading-tight">
                          + IVA ({formatCLP(Math.round(plan.neto * IVA))})
                        </div>
                      </div>
                    )}

                    {plan.max && <span className="text-[10px] sm:text-[11px] font-bold text-primary/70 mt-1">{plan.max}</span>}

                    <div className="mt-3 space-y-1">
                      {plan.features.map((f) => (
                        <div key={f} className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-green-500 text-xs sm:text-sm">check_circle</span>
                          <span className="text-[10px] sm:text-[11px] text-slate-600">{f}</span>
                        </div>
                      ))}
                      {plan.noFeatures.map((f) => (
                        <div key={f} className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-red-400 text-xs sm:text-sm">cancel</span>
                          <span className="text-[10px] sm:text-[11px] text-slate-400">{f}</span>
                        </div>
                      ))}
                    </div>
                  </button>
                ))}
                    </div>
                  </>
                )
              })()}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => { setStep(2); setError('') }}
                  className="flex-1 border-2 border-gray-300 text-gray-600 font-bold py-2 sm:py-2.5 text-sm sm:text-base rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Volver
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 bg-primary text-white font-bold py-2 sm:py-2.5 text-sm sm:text-base rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Registrando...' : 'Crear cuenta'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
