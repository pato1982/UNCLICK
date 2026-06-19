import { useState, useEffect } from 'react'
import { GeneralPlans, TurismoPlans } from '../../components/PlansModal.jsx'

const API = import.meta.env.VITE_API || ''

function ConfirmDeletePopup({ message, details, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex: 10001 }} onClick={onCancel}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="bg-red-500 px-6 py-4 text-center">
          <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2">
            <span className="material-symbols-outlined text-3xl text-white">warning</span>
          </div>
          <h3 className="text-base font-bold text-white">Atención</h3>
        </div>
        <div className="px-6 py-4">
          <p className="text-sm text-slate-700 text-center leading-relaxed">{message}</p>
          {details && details.length > 0 && (
            <div className="mt-3 bg-red-50 rounded-lg p-3">
              <p className="text-[10px] font-bold text-red-400 uppercase mb-1.5">Se eliminarán:</p>
              <ul className="space-y-1">
                {details.map((d, i) => (
                  <li key={i} className="flex items-center gap-2 text-xs text-red-600">
                    <span className="material-symbols-outlined text-sm">delete</span>
                    {d}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <p className="text-[10px] text-red-500 font-bold text-center mt-3">Esta acción no se puede deshacer.</p>
          <p className="text-[10px] text-slate-500 text-center mt-2 flex items-center justify-center gap-1">
            <span className="material-symbols-outlined text-sm">logout</span>
            Se cerrará tu sesión para aplicar los cambios. Solo debes volver a iniciar sesión.
          </p>
        </div>
        <div className="px-6 pb-4 flex gap-2">
          <button onClick={onCancel} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-lg transition-all">
            Cancelar
          </button>
          <button onClick={onConfirm} className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5">
            <span className="material-symbols-outlined text-sm">delete_forever</span>
            Aceptar
          </button>
        </div>
      </div>
    </div>
  )
}

function ConfirmDowngradePopup({ message, items, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex: 10001 }} onClick={onCancel}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="bg-amber-500 px-6 py-4 text-center">
          <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2">
            <span className="material-symbols-outlined text-3xl text-white">info</span>
          </div>
          <h3 className="text-base font-bold text-white">Cambio de plan</h3>
        </div>
        <div className="px-6 py-4">
          <p className="text-sm text-slate-700 text-center leading-relaxed">{message}</p>
          {items && items.length > 0 && (
            <div className="mt-3 bg-amber-50 rounded-lg p-3">
              <p className="text-[10px] font-bold text-amber-500 uppercase mb-1.5">Qué cambiará:</p>
              <ul className="space-y-1">
                {items.map((d, i) => (
                  <li key={i} className="flex items-center gap-2 text-xs text-amber-700">
                    <span className="material-symbols-outlined text-sm">visibility_off</span>
                    {d}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <p className="text-[10px] text-green-600 font-bold text-center mt-3 flex items-center justify-center gap-1">
            <span className="material-symbols-outlined text-sm">check_circle</span>
            Tu contenido se conservará y podrás recuperarlo subiendo de plan.
          </p>
          <p className="text-[10px] text-slate-500 text-center mt-2 flex items-center justify-center gap-1">
            <span className="material-symbols-outlined text-sm">logout</span>
            Se cerrará tu sesión para aplicar los cambios. Solo debes volver a iniciar sesión.
          </p>
        </div>
        <div className="px-6 pb-4 flex gap-2">
          <button onClick={onCancel} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-lg transition-all">
            Cancelar
          </button>
          <button onClick={onConfirm} className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5">
            <span className="material-symbols-outlined text-sm">swap_vert</span>
            Cambiar plan
          </button>
        </div>
      </div>
    </div>
  )
}

function ProfileModal({ onClose }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [counts, setCounts] = useState(null)
  const [confirmPopup, setConfirmPopup] = useState(null)
  const [downgradePopup, setDowngradePopup] = useState(null)
  const [planChangePopup, setPlanChangePopup] = useState(false)
  const [activeTab, setActiveTab] = useState('datos')
  const [showPlansModal, setShowPlansModal] = useState(false)
  const [history, setHistory] = useState(null)
  const [deleteAccountStep, setDeleteAccountStep] = useState(null)
  const [deletingAccount, setDeletingAccount] = useState(false)

  // Campos editables - Datos personales
  const [editEmail, setEditEmail] = useState('')
  const [editTelefono, setEditTelefono] = useState('')
  const [editDireccion, setEditDireccion] = useState('')

  // Campos editables - Plan
  const [tipoCuenta, setTipoCuenta] = useState('general')
  const [vendeProductos, setVendeProductos] = useState(false)
  const [ofreceServicios, setOfreceServicios] = useState(false)
  const [ofreceArriendos, setOfreceArriendos] = useState(false)
  const [planId, setPlanId] = useState(1)

  useEffect(() => {
    Promise.all([
      fetch(`${API}/api/v1/auth/me`, { credentials: 'include' }).then(r => r.json()),
      fetch(`${API}/api/v1/auth/profile/counts`, { credentials: 'include' }).then(r => r.json()),
    ]).then(([meData, countsData]) => {
      const u = meData.usuario || meData.user || null
      setUser(u)
      setCounts(countsData)
      if (u) {
        setTipoCuenta(u.tipo_cuenta || 'general')
        setVendeProductos(!!u.vende_productos)
        setOfreceServicios(!!u.ofrece_servicios)
        setOfreceArriendos(!!u.ofrece_arriendos)
        setPlanId(u.plan_id || 1)
        setEditEmail(u.email || '')
        setEditTelefono(u.telefono || '')
        setEditDireccion(u.direccion || '')
      }
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  // Cargar historial cuando se abre la pestaña
  useEffect(() => {
    if (activeTab === 'historial' && !history) {
      fetch(`${API}/api/v1/auth/profile/history`, { credentials: 'include' })
        .then(r => r.json())
        .then(data => setHistory(data.history || []))
        .catch(() => setHistory([]))
    }
  }, [activeTab])

  const buildDeleteWarning = () => {
    const deleteDetails = []
    const deleteTipos = []

    if (user.tipo_cuenta === 'general' && tipoCuenta === 'turismo') {
      const total = (counts?.productos || 0) + (counts?.servicios || 0) + (counts?.arriendos || 0)
      if (total > 0) deleteDetails.push(`${total} publicaciones (productos, servicios y arriendos)`)
      if (counts?.negocio > 0) deleteDetails.push('Datos del negocio')
      if (deleteDetails.length > 0) {
        return { message: 'Al cambiar a Turismo se eliminarán todos los datos de tu cuenta de Comercio.', details: deleteDetails, deleteTipos: [] }
      }
    }

    if (user.tipo_cuenta === 'turismo' && tipoCuenta === 'general') {
      if (counts?.tours > 0) deleteDetails.push(`${counts.tours} tours`)
      if (counts?.portada > 0) deleteDetails.push('Portada y sus imágenes')
      if (counts?.pagina > 0) deleteDetails.push('Página personalizada')
      if (counts?.negocio > 0) deleteDetails.push('Datos del negocio')
      if (deleteDetails.length > 0) {
        return { message: 'Al cambiar a Comercio se eliminarán todos los datos de tu cuenta de Turismo.', details: deleteDetails, deleteTipos: [] }
      }
    }

    if (tipoCuenta === 'general') {
      if (user.vende_productos && !vendeProductos) {
        const n = counts?.productos || 0
        deleteDetails.push(n > 0 ? `${n} productos (publicaciones y banner)` : 'Sección de Productos')
        deleteTipos.push('producto')
      }
      if (user.ofrece_servicios && !ofreceServicios) {
        const n = counts?.servicios || 0
        deleteDetails.push(n > 0 ? `${n} servicios publicados` : 'Sección de Servicios')
        deleteTipos.push('servicio')
      }
      if (user.ofrece_arriendos && !ofreceArriendos) {
        const n = counts?.arriendos || 0
        deleteDetails.push(n > 0 ? `${n} arriendos publicados` : 'Sección de Arriendos')
        deleteTipos.push('arriendo')
      }
      if (deleteTipos.length > 0) {
        const nombres = deleteTipos.map(t => t === 'producto' ? 'Productos' : t === 'servicio' ? 'Servicios' : 'Arriendos').join(', ')
        return { message: `Al desmarcar ${nombres} se eliminarán todos los datos de esas secciones.`, details: deleteDetails, deleteTipos }
      }
    }
    return null
  }

  const buildDowngradeWarning = () => {
    if (planId >= user.plan_id) return null
    const esTurismo = tipoCuenta === 'turismo'
    const items = []
    if (esTurismo) {
      if (user.plan_id >= 5 && planId < 5) {
        if (counts?.tours > 0) items.push(`${counts.tours} tours dejarán de mostrarse`)
        if (counts?.pagina > 0) items.push('Tu página personalizada no será accesible')
        items.push('Las estadísticas no estarán disponibles')
      }
    } else {
      if (user.plan_id >= 3 && planId < 3) {
        items.push('Tus banners dejarán de mostrarse públicamente')
        items.push('Las estadísticas no estarán disponibles')
      }
      if (user.plan_id >= 2 && planId < 2) {
        items.push('Tu página de tienda no será accesible')
        items.push('Si tienes más de 5 productos, solo los 5 más recientes serán visibles')
      }
    }
    if (items.length === 0) return null
    return { message: `Al bajar de Plan ${planLabel(user.plan_id)} a Plan ${planLabel(planId)}, tu contenido no se eliminará pero dejará de estar visible. Si vuelves a subir, se restaurará.`, items }
  }

  const handleSave = async (deleteTipos = []) => {
    setSaving(true)
    const prevPlanId = Number(JSON.parse(localStorage.getItem('user') || '{}').plan_id || 1)
    try {
      const body = {
        tipo_cuenta: tipoCuenta,
        vende_productos: tipoCuenta === 'general' ? vendeProductos : false,
        ofrece_servicios: tipoCuenta === 'general' ? ofreceServicios : false,
        ofrece_arriendos: tipoCuenta === 'general' ? ofreceArriendos : false,
        plan_id: planId,
        delete_tipos: deleteTipos,
        email: editEmail.trim(),
        telefono: editTelefono.trim(),
        direccion: editDireccion.trim(),
      }
      const res = await fetch(`${API}/api/v1/auth/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (data.error) {
        alert(data.error)
        setSaving(false)
        return
      }
      const updatedUser = data.usuario || data.user
      if (updatedUser) {
        // Si el plan cambió, cerrar sesión para aplicar cambios
        if (Number(updatedUser.plan_id) !== prevPlanId) {
          await fetch(`${API}/api/v1/auth/logout`, { method: 'POST', credentials: 'include' })
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          localStorage.removeItem('auth_mode')
          localStorage.removeItem('dev_user_id')
          window.location.href = '/'
          return
        }

        const stored = JSON.parse(localStorage.getItem('user') || '{}')
        Object.assign(stored, {
          tipo_cuenta: updatedUser.tipo_cuenta,
          plan_id: updatedUser.plan_id,
          vende_productos: updatedUser.vende_productos,
          ofrece_servicios: updatedUser.ofrece_servicios,
          ofrece_arriendos: updatedUser.ofrece_arriendos,
        })
        localStorage.setItem('user', JSON.stringify(stored))

        setUser(updatedUser)
        setEditEmail(updatedUser.email || '')
        setEditTelefono(updatedUser.telefono || '')
        setEditDireccion(updatedUser.direccion || '')
        const countsRes = await fetch(`${API}/api/v1/auth/profile/counts`, { credentials: 'include' })
        setCounts(await countsRes.json())
        setHistory(null)
      }
      setEditing(false)
    } catch (err) {
      console.error('Error guardando perfil:', err)
    }
    setSaving(false)
  }

  const handleSaveClick = () => {
    const warning = buildDeleteWarning()
    if (warning) { setConfirmPopup(warning); return }
    const downgrade = buildDowngradeWarning()
    if (downgrade) { setDowngradePopup(downgrade); return }
    // Si el plan cambió (upgrade sin warnings), mostrar confirmación
    const currentPlanId = Number(JSON.parse(localStorage.getItem('user') || '{}').plan_id || 1)
    if (Number(planId) !== currentPlanId) {
      setPlanChangePopup(true)
      return
    }
    handleSave()
  }

  const cancelEditing = () => {
    setEditing(false)
    setTipoCuenta(user.tipo_cuenta || 'general')
    setVendeProductos(!!user.vende_productos)
    setOfreceServicios(!!user.ofrece_servicios)
    setOfreceArriendos(!!user.ofrece_arriendos)
    setPlanId(user.plan_id || 1)
    setEditEmail(user.email || '')
    setEditTelefono(user.telefono || '')
    setEditDireccion(user.direccion || '')
  }

  const planLabel = (id) => (id === 3 || id === 5) ? 'Premium' : id === 2 ? 'Normal' : 'Gratis'
  const planColor = (id) => (id === 3 || id === 5) ? 'text-amber-400' : id === 2 ? 'text-blue-400' : 'text-slate-400'
  const tipoCuentaLabel = () => {
    if (user?.tipo_cuenta === 'turismo') return 'Turismo'
    const tipos = []
    if (user?.vende_productos) tipos.push('Productos')
    if (user?.ofrece_servicios) tipos.push('Servicios')
    if (user?.ofrece_arriendos) tipos.push('Arriendos')
    return tipos.length > 0 ? tipos.join(', ') : '—'
  }

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('es-CL', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'
  const formatDateTime = (d) => d ? new Date(d).toLocaleDateString('es-CL', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'

  const checkboxClass = (checked) =>
    `w-4 h-4 rounded border-2 flex items-center justify-center cursor-pointer transition-all ${checked ? 'bg-primary border-primary' : 'border-slate-300 hover:border-primary/50'}`

  const handleDeleteAccount = async () => {
    setDeletingAccount(true)
    try {
      const res = await fetch(`${API}/api/v1/auth/account`, {
        method: 'DELETE',
        credentials: 'include',
      })
      const data = await res.json()
      if (!res.ok) {
        alert(data.error || 'Error al programar la eliminación')
        setDeletingAccount(false)
        return
      }
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      localStorage.removeItem('auth_mode')
      localStorage.removeItem('dev_user_id')
      window.location.href = '/'
    } catch {
      alert('Error de conexión')
      setDeletingAccount(false)
    }
  }

  const tabs = [
    { id: 'datos', label: 'Datos', icon: 'person' },
    { id: 'plan', label: 'Plan', icon: 'star' },
    { id: 'historial', label: 'Pagos', icon: 'receipt_long' },
    { id: 'cuenta', label: 'Cuenta', icon: 'manage_accounts' },
  ]

  // ===================== TAB: DATOS PERSONALES =====================
  const renderDatosTab = () => (
    <div className="space-y-3">
      {/* Nombre (solo lectura) */}
      <div className="flex items-start gap-3">
        <span className="material-symbols-outlined text-lg text-primary/60 mt-0.5">badge</span>
        <div className="flex-1">
          <p className="text-[10px] font-bold text-slate-400 uppercase">Nombre</p>
          <p className="text-sm text-slate-700 font-medium">{user.nombre}</p>
        </div>
      </div>

      {/* RUT */}
      {user.dni && (
        <div className="flex items-start gap-3">
          <span className="material-symbols-outlined text-lg text-primary/60 mt-0.5">fingerprint</span>
          <div className="flex-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase">RUT</p>
            <p className="text-sm text-slate-700 font-medium">{user.dni}</p>
          </div>
        </div>
      )}

      {/* Correo */}
      <div className="flex items-start gap-3">
        <span className="material-symbols-outlined text-lg text-primary/60 mt-0.5">mail</span>
        <div className="flex-1">
          <p className="text-[10px] font-bold text-slate-400 uppercase">Correo</p>
          {!editing ? (
            <p className="text-sm text-slate-700">{user.email}</p>
          ) : (
            <input type="email" value={editEmail} onChange={e => setEditEmail(e.target.value)}
              className="w-full text-sm text-slate-700 border border-slate-200 rounded-lg px-2.5 py-1.5 mt-1 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20" />
          )}
        </div>
      </div>

      {/* Teléfono */}
      <div className="flex items-start gap-3">
        <span className="material-symbols-outlined text-lg text-primary/60 mt-0.5">call</span>
        <div className="flex-1">
          <p className="text-[10px] font-bold text-slate-400 uppercase">Teléfono</p>
          {!editing ? (
            <p className="text-sm text-slate-700">{user.telefono || '—'}</p>
          ) : (
            <input type="tel" value={editTelefono} onChange={e => setEditTelefono(e.target.value)}
              className="w-full text-sm text-slate-700 border border-slate-200 rounded-lg px-2.5 py-1.5 mt-1 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20" />
          )}
        </div>
      </div>

      {/* Dirección */}
      <div className="flex items-start gap-3">
        <span className="material-symbols-outlined text-lg text-primary/60 mt-0.5">location_on</span>
        <div className="flex-1">
          <p className="text-[10px] font-bold text-slate-400 uppercase">Dirección</p>
          {!editing ? (
            <p className="text-sm text-slate-700">{[user.direccion, user.comuna].filter(Boolean).join(', ') || '—'}</p>
          ) : (
            <input type="text" value={editDireccion} onChange={e => setEditDireccion(e.target.value)}
              className="w-full text-sm text-slate-700 border border-slate-200 rounded-lg px-2.5 py-1.5 mt-1 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20" />
          )}
        </div>
      </div>

      {/* Fecha inscripción */}
      <div className="flex items-start gap-3">
        <span className="material-symbols-outlined text-lg text-primary/60 mt-0.5">calendar_today</span>
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase">Miembro desde</p>
          <p className="text-sm text-slate-700">{formatDate(user.created_at)}</p>
        </div>
      </div>

      {/* Botones editar/guardar */}
      <div className="pt-2 border-t border-slate-100">
        {!editing ? (
          <button onClick={() => setEditing(true)}
            className="w-full py-2 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5">
            <span className="material-symbols-outlined text-sm">edit</span>
            Editar datos
          </button>
        ) : (
          <div className="flex gap-2">
            <button onClick={cancelEditing}
              className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-lg transition-all">Cancelar</button>
            <button onClick={handleSaveClick} disabled={saving}
              className="flex-1 py-2 bg-primary hover:bg-primary-light text-white text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 disabled:opacity-50">
              {saving ? 'Guardando...' : <><span className="material-symbols-outlined text-sm">save</span>Guardar</>}
            </button>
          </div>
        )}
      </div>
    </div>
  )

  // ===================== TAB: PLAN =====================
  const renderPlanTab = () => (
    <div className="space-y-3">
      {/* Plan actual */}
      <div className="flex items-start gap-3">
        <span className="material-symbols-outlined text-lg text-primary/60 mt-0.5">workspace_premium</span>
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase">Plan actual</p>
          <p className={`text-sm font-bold ${planColor(user.plan_id)}`}>Plan {planLabel(user.plan_id)}</p>
        </div>
      </div>

      {/* Tipo de cuenta */}
      <div className="flex items-start gap-3">
        <span className="material-symbols-outlined text-lg text-primary/60 mt-0.5">storefront</span>
        <div className="flex-1">
          <p className="text-[10px] font-bold text-slate-400 uppercase">Tipo de cuenta</p>
          {!editing ? (
            <p className="text-sm text-slate-700">{tipoCuentaLabel()}</p>
          ) : (
            <div className="mt-1 space-y-2">
              <div className="flex gap-2">
                <button onClick={() => setTipoCuenta('general')}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${tipoCuenta === 'general' ? 'bg-primary text-white shadow-md' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                  <span className="material-symbols-outlined text-sm">storefront</span>Comercio
                </button>
                <button onClick={() => { setTipoCuenta('turismo'); if (planId === 2) setPlanId(1) }}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${tipoCuenta === 'turismo' ? 'bg-emerald-500 text-white shadow-md' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                  <span className="material-symbols-outlined text-sm">park</span>Turismo
                </button>
              </div>
              {tipoCuenta === 'general' && (
                <div className="bg-slate-50 rounded-lg p-2.5 space-y-1.5">
                  <label className="flex items-center gap-2 cursor-pointer" onClick={() => setVendeProductos(!vendeProductos)}>
                    <div className={checkboxClass(vendeProductos)}>
                      {vendeProductos && <span className="material-symbols-outlined text-white text-xs">check</span>}
                    </div>
                    <span className="text-xs text-slate-600">Productos</span>
                    {counts?.productos > 0 && <span className="text-[10px] text-slate-400">({counts.productos})</span>}
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer" onClick={() => setOfreceServicios(!ofreceServicios)}>
                    <div className={checkboxClass(ofreceServicios)}>
                      {ofreceServicios && <span className="material-symbols-outlined text-white text-xs">check</span>}
                    </div>
                    <span className="text-xs text-slate-600">Servicios</span>
                    {counts?.servicios > 0 && <span className="text-[10px] text-slate-400">({counts.servicios})</span>}
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer" onClick={() => setOfreceArriendos(!ofreceArriendos)}>
                    <div className={checkboxClass(ofreceArriendos)}>
                      {ofreceArriendos && <span className="material-symbols-outlined text-white text-xs">check</span>}
                    </div>
                    <span className="text-xs text-slate-600">Arriendos</span>
                    {counts?.arriendos > 0 && <span className="text-[10px] text-slate-400">({counts.arriendos})</span>}
                  </label>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Selección de plan */}
      <div className="flex items-start gap-3">
        <span className="material-symbols-outlined text-lg text-primary/60 mt-0.5">star</span>
        <div className="flex-1">
          <p className="text-[10px] font-bold text-slate-400 uppercase">Plan</p>
          {!editing ? (
            <p className="text-sm text-slate-700">Plan {planLabel(user.plan_id)}</p>
          ) : (
            <div className="flex gap-2 mt-1">
              {(tipoCuenta === 'turismo' ? [4, 5] : [1, 2, 3]).map(p => (
                <button key={p} onClick={() => setPlanId(p)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${planId === p
                    ? (p === 3 ? 'bg-amber-400 text-amber-900' : p === 2 ? 'bg-blue-500 text-white' : 'bg-slate-500 text-white')
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                  {planLabel(p)}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Botón ver planes disponibles */}
      <button onClick={() => setShowPlansModal(true)}
        className="w-full py-2.5 bg-gradient-to-r from-primary/10 to-purple-500/10 hover:from-primary/20 hover:to-purple-500/20 text-primary text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 border border-primary/20">
        <span className="material-symbols-outlined text-sm">info</span>
        Ver planes disponibles
      </button>

      {/* Botones editar/guardar */}
      <div className="pt-2 border-t border-slate-100">
        {!editing ? (
          <button onClick={() => setEditing(true)}
            className="w-full py-2 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5">
            <span className="material-symbols-outlined text-sm">edit</span>
            Cambiar plan
          </button>
        ) : (
          <div className="flex gap-2">
            <button onClick={cancelEditing}
              className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-lg transition-all">Cancelar</button>
            <button onClick={handleSaveClick} disabled={saving}
              className="flex-1 py-2 bg-primary hover:bg-primary-light text-white text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 disabled:opacity-50">
              {saving ? 'Guardando...' : <><span className="material-symbols-outlined text-sm">save</span>Guardar</>}
            </button>
          </div>
        )}
      </div>
    </div>
  )

  // ===================== TAB: HISTORIAL =====================
  const renderHistorialTab = () => (
    <div className="space-y-4">
      {/* Info de cuenta */}
      <div className="bg-slate-50 rounded-xl p-3 space-y-2">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-base text-primary/60">event</span>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase">Fecha de registro</p>
            <p className="text-sm text-slate-700 font-medium">{formatDate(user.created_at)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-base text-primary/60">workspace_premium</span>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase">Plan actual</p>
            <p className={`text-sm font-bold ${planColor(user.plan_id)}`}>Plan {planLabel(user.plan_id)}</p>
          </div>
        </div>
      </div>

      {/* Timeline de cambios */}
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase mb-3">Historial de pagos</p>
        {!history ? (
          <div className="flex items-center justify-center py-6">
            <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
            <span className="text-xs text-slate-400 ml-2">Cargando...</span>
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-6">
            <span className="material-symbols-outlined text-3xl text-slate-300">receipt_long</span>
            <p className="text-xs text-slate-400 mt-1">Sin pagos registrados</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Tu plan actual es gratuito.</p>
          </div>
        ) : (
          <div className="relative pl-6">
            {/* Línea vertical del timeline */}
            <div className="absolute left-2 top-1 bottom-1 w-0.5 bg-slate-200"></div>
            <div className="space-y-3">
              {history.map((item, i) => {
                const isPago = item.accion === 'pago'
                const isPlan = item.accion === 'cambio_plan'
                const isUpgrade = isPlan && item.detalles?.tipo === 'upgrade'
                const dotColor = isPago ? 'bg-emerald-500' : isPlan ? (isUpgrade ? 'bg-green-400' : 'bg-amber-400') : 'bg-blue-400'
                return (
                  <div key={i} className="relative">
                    <div className={`absolute -left-4 top-1 w-3 h-3 rounded-full ${dotColor} border-2 border-white shadow-sm`}></div>
                    <div className="bg-white border border-slate-100 rounded-lg p-2.5 shadow-sm">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className={`material-symbols-outlined text-sm ${isPago ? 'text-emerald-600' : isPlan ? (isUpgrade ? 'text-green-500' : 'text-amber-500') : 'text-blue-500'}`}>
                          {isPago ? 'paid' : isPlan ? (isUpgrade ? 'upgrade' : 'downgrade') : 'swap_horiz'}
                        </span>
                        <span className="text-xs font-bold text-slate-700">
                          {isPago ? 'Pago de plan' : isPlan ? 'Cambio de plan' : 'Cambio de tipo'}
                        </span>
                        {isPago && (
                          <span className="ml-auto text-xs font-black text-emerald-600">${Number(item.detalles?.monto || 0).toLocaleString('es-AR')}</span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-600">
                        {isPago ? (
                          <>Plan <span className="font-bold">{item.detalles?.plan_nombre}</span> · pago mensual</>
                        ) : isPlan ? (
                          <>Plan <span className="font-bold">{item.detalles?.plan_anterior_nombre}</span> → <span className="font-bold">{item.detalles?.plan_nuevo_nombre}</span></>
                        ) : (
                          <>Tipo <span className="font-bold">{item.detalles?.tipo_anterior === 'general' ? 'Comercio' : 'Turismo'}</span> → <span className="font-bold">{item.detalles?.tipo_nuevo === 'general' ? 'Comercio' : 'Turismo'}</span></>
                        )}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1">{formatDateTime(item.created_at)}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )

  // ===================== TAB: CUENTA / ELIMINACIÓN =====================
  const renderCuentaTab = () => (
    <div className="space-y-4">
      {/* Descripción */}
      <div className="bg-slate-50 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="material-symbols-outlined text-base text-slate-400">manage_accounts</span>
          <p className="text-[10px] font-bold text-slate-400 uppercase">Gestión de cuenta</p>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          Desde aquí puedes solicitar la eliminación permanente de tu cuenta y todos sus datos en LocalClick.
        </p>
      </div>

      {/* Zona de peligro */}
      <div className="border border-red-200 rounded-xl overflow-hidden">
        <div className="bg-red-50 px-4 py-3 flex items-center gap-2">
          <span className="material-symbols-outlined text-red-500 text-base">dangerous</span>
          <p className="text-xs font-bold text-red-600 uppercase">Zona de peligro</p>
        </div>
        <div className="p-4 space-y-3">
          <div>
            <p className="text-xs font-bold text-slate-700">Eliminar mi cuenta</p>
            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
              Tu cuenta se programará para eliminarse en <strong>10 días corridos</strong>. Durante ese plazo puedes arrepentirte iniciando sesión nuevamente.
            </p>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-1">
            <p className="text-[10px] font-bold text-amber-600 uppercase">Se eliminará permanentemente:</p>
            <ul className="space-y-0.5">
              {[
                'Tu cuenta y datos personales',
                'Productos, servicios y arriendos',
                'Tours y páginas turísticas',
                'Imágenes y archivos subidos',
                'Estadísticas y analytics',
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-1.5 text-[11px] text-amber-700">
                  <span className="material-symbols-outlined text-xs text-amber-500">remove_circle</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <button
            onClick={() => setDeleteAccountStep('confirm')}
            className="w-full py-2.5 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5"
          >
            <span className="material-symbols-outlined text-sm">delete_forever</span>
            Solicitar eliminación de cuenta
          </button>
        </div>
      </div>
    </div>
  )

  // ===================== MODAL DE PLANES =====================
  const renderPlansModal = () => {
    if (!showPlansModal) return null
    const esTurismo = user?.tipo_cuenta === 'turismo'
    return (
      <div className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex: 10001 }} onClick={() => setShowPlansModal(false)}>
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
        <div className={`relative bg-white rounded-2xl shadow-2xl w-full max-h-[90vh] overflow-y-auto ${esTurismo ? 'max-w-xl' : 'max-w-4xl'}`} onClick={e => e.stopPropagation()}>
          <button onClick={() => setShowPlansModal(false)} className="absolute top-3 right-3 z-10 h-7 w-7 bg-slate-100 hover:bg-slate-200 rounded-full flex items-center justify-center transition-colors">
            <span className="material-symbols-outlined text-slate-600 text-base">close</span>
          </button>
          <div className="p-4 pt-5 pb-5">
            {esTurismo ? <TurismoPlans hideRecommended /> : <GeneralPlans hideRecommended />}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 flex items-start justify-center p-4 pt-16 sm:pt-20" style={{ zIndex: 10000 }} onClick={() => { if (!showPlansModal) onClose() }}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden h-[80vh] sm:h-[600px] flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Header compacto */}
        <div className="bg-primary px-6 py-4 text-center relative shrink-0">
          <button onClick={onClose} className="absolute top-3 right-3 h-6 w-6 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors">
            <span className="material-symbols-outlined text-white text-sm">close</span>
          </button>
          {loading ? (
            <p className="text-white/70 text-sm">Cargando...</p>
          ) : user ? (
            <div className="flex items-center gap-3 justify-center">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <span className="material-symbols-outlined text-2xl text-white">person</span>
              </div>
              <div className="text-left">
                <h3 className="text-base font-bold text-white leading-tight">{user.nombre}</h3>
                <span className={`text-xs font-bold ${planColor(user.plan_id)}`}>Plan {planLabel(user.plan_id)}</span>
              </div>
            </div>
          ) : (
            <p className="text-white/70 text-sm">Sin datos</p>
          )}
        </div>

        {/* Tabs */}
        {user && (
          <>
            <div className="flex border-b border-slate-100 shrink-0">
              {tabs.map(tab => (
                <button key={tab.id} onClick={() => { setActiveTab(tab.id); if (editing) cancelEditing() }}
                  className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 text-xs font-bold transition-all relative ${activeTab === tab.id ? 'text-primary' : 'text-slate-400 hover:text-slate-600'}`}>
                  <span className="material-symbols-outlined text-sm">{tab.icon}</span>
                  {tab.label}
                  {activeTab === tab.id && <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-primary rounded-full"></div>}
                </button>
              ))}
            </div>

            {/* Contenido de la pestaña */}
            <div className="px-5 py-4 overflow-y-auto flex-1">
              {activeTab === 'datos' && renderDatosTab()}
              {activeTab === 'plan' && renderPlanTab()}
              {activeTab === 'historial' && renderHistorialTab()}
              {activeTab === 'cuenta' && renderCuentaTab()}
            </div>
          </>
        )}
      </div>

      {/* Modal de planes disponibles */}
      {renderPlansModal()}

      {/* Popups de confirmación */}
      {confirmPopup && (
        <ConfirmDeletePopup message={confirmPopup.message} details={confirmPopup.details}
          onCancel={() => setConfirmPopup(null)}
          onConfirm={() => { setConfirmPopup(null); handleSave(confirmPopup.deleteTipos || []) }} />
      )}
      {downgradePopup && (
        <ConfirmDowngradePopup message={downgradePopup.message} items={downgradePopup.items}
          onCancel={() => setDowngradePopup(null)}
          onConfirm={() => { setDowngradePopup(null); handleSave() }} />
      )}
      {planChangePopup && (
        <div className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex: 10001 }} onClick={() => setPlanChangePopup(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="bg-primary px-6 py-4 text-center">
              <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="material-symbols-outlined text-3xl text-white">swap_vert</span>
              </div>
              <h3 className="text-base font-bold text-white">Cambio de plan</h3>
            </div>
            <div className="px-6 py-4">
              <p className="text-sm text-slate-700 text-center leading-relaxed">
                Para aplicar el cambio de plan, se cerrará tu sesión actual.
              </p>
              <p className="text-sm text-slate-700 text-center leading-relaxed mt-2 font-semibold">
                Tu cuenta y todo tu contenido se mantienen intactos. Solo necesitas volver a iniciar sesión.
              </p>
              <p className="text-[10px] text-slate-500 text-center mt-3 flex items-center justify-center gap-1">
                <span className="material-symbols-outlined text-sm">logout</span>
                Serás redirigido a la pantalla de inicio de sesión.
              </p>
            </div>
            <div className="px-6 pb-4 flex gap-2">
              <button onClick={() => setPlanChangePopup(false)} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-lg transition-all">
                Cancelar
              </button>
              <button onClick={() => { setPlanChangePopup(false); handleSave() }} className="flex-1 py-2.5 bg-primary hover:bg-primary-light text-white text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5">
                <span className="material-symbols-outlined text-sm">check_circle</span>
                Confirmar cambio
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Popup confirmación eliminación de cuenta */}
      {deleteAccountStep === 'confirm' && (
        <div className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex: 10001 }} onClick={() => setDeleteAccountStep(null)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="bg-red-600 px-6 py-5 text-center">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="material-symbols-outlined text-4xl text-white">person_remove</span>
              </div>
              <h3 className="text-base font-bold text-white">¿Eliminar tu cuenta?</h3>
              <p className="text-red-200 text-xs mt-1">Tendrás 10 días para arrepentirte</p>
            </div>
            <div className="px-6 py-4 space-y-3">
              <p className="text-sm text-slate-700 text-center leading-relaxed">
                Tu cuenta se <strong>programará para eliminarse en 10 días corridos</strong>. Si cambias de opinión, inicia sesión antes de que expire el plazo.
              </p>
              <div className="bg-slate-50 rounded-lg p-3 space-y-1.5">
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <span className="material-symbols-outlined text-sm text-emerald-500">check_circle</span>
                  10 días para recuperar tu cuenta
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <span className="material-symbols-outlined text-sm text-emerald-500">check_circle</span>
                  Recupera iniciando sesión normalmente
                </div>
                <div className="flex items-center gap-2 text-xs text-red-600">
                  <span className="material-symbols-outlined text-sm text-red-500">cancel</span>
                  Después de 10 días, todo se borra para siempre
                </div>
              </div>
              <p className="text-[10px] text-slate-500 text-center flex items-center justify-center gap-1">
                <span className="material-symbols-outlined text-sm">logout</span>
                Se cerrará tu sesión automáticamente.
              </p>
            </div>
            <div className="px-6 pb-5 flex gap-2">
              <button
                onClick={() => setDeleteAccountStep(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-lg transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deletingAccount}
                className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-sm">delete_forever</span>
                {deletingAccount ? 'Procesando...' : 'Confirmar eliminación'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function AdminHeader({ onToggleSidebar }) {
  const [showProfile, setShowProfile] = useState(false)
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const hasPage = user.plan_id && user.plan_id >= 2
  const isProg = (user.rol || 'usuario') === 'programador'

  return (
    <>
      <header className={`sticky top-0 z-50 text-white shadow-lg ${isProg ? 'bg-slate-950' : 'bg-primary'}`}>
        <div className="flex items-center h-14 sm:h-16 px-3 sm:px-4 md:px-6">
          {/* Botón hamburguesa */}
          <button
            onClick={onToggleSidebar}
            className="p-1.5 sm:p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <span className="material-symbols-outlined text-xl sm:text-2xl">menu</span>
          </button>

          {/* Icono usuario + nombre */}
          {!isProg && (
            <button
              onClick={() => setShowProfile(true)}
              className="flex items-center gap-1.5 sm:gap-2 min-w-0 max-w-[55vw] sm:max-w-[220px] p-1 rounded-lg hover:bg-white/10 transition-colors ml-1 mr-2 sm:mr-4"
              title="Mi perfil"
            >
              <span className="material-symbols-outlined text-xl sm:text-2xl text-white/70 shrink-0">account_circle</span>
              <span className="text-xs sm:text-sm md:text-base font-bold text-white truncate">{user.nombre}</span>
            </button>
          )}

          {/* Título centrado (solo admin normal, oculto en mobile) */}
          <div className="flex-1 flex items-center justify-center">
            {!isProg && (
              <span className="hidden sm:inline text-sm md:text-lg font-bold uppercase tracking-wider text-white">
                Panel Administrador
              </span>
            )}
          </div>

          {/* Programador: botón salir */}
          {isProg && (
            <button
              onClick={async () => { await fetch(`${API}/api/v1/auth/logout`, { method: 'POST', credentials: 'include' }); localStorage.removeItem('token'); localStorage.removeItem('user'); localStorage.removeItem('auth_mode'); localStorage.removeItem('dev_user_id'); window.location.href = '/' }}
              className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors mr-1 sm:mr-3"
              title="Cerrar sesión"
            >
              <span className="material-symbols-outlined text-base sm:text-lg">logout</span>
              <span className="hidden sm:inline text-[10px] font-bold uppercase tracking-wider">Salir</span>
            </button>
          )}

          {/* Logo LocalClick a la derecha */}
          <a href="/" className="flex items-center gap-1.5 sm:gap-2 hover:opacity-80 transition-opacity shrink-0">
            <div className={`p-1 sm:p-1.5 rounded-lg leading-none ${isProg ? 'bg-emerald-500/20 text-emerald-400' : 'bg-accent text-primary'}`}>
              <span className="material-symbols-outlined block text-xl sm:text-2xl font-bold">ads_click</span>
            </div>
            <span className="text-base sm:text-xl font-black tracking-tight text-white">
              Local<span className={isProg ? 'text-emerald-400' : 'text-accent'}>Click</span>
            </span>
          </a>
        </div>

        {/* Barra inferior mobile: Ver sitio público + Ver mi página + Logout */}
        {!isProg && (
          <div className="sm:hidden bg-[#4A2070] border-t border-white/10 py-1 flex items-center px-3">
            <div className="flex-1 flex items-center justify-center gap-4">
              <a href="/" className="flex items-center gap-1 text-[10px] font-bold text-white/60 hover:text-white transition-colors">
                <span className="material-symbols-outlined text-xs">open_in_new</span>
                Ver sitio
              </a>
              {hasPage && (
                <>
                  <span className="text-white/20">|</span>
                  <a
                    href={user.tipo_cuenta === 'turismo' ? `/?turismo=${user.id}` : `/?store=${user.id}`}
                    className="flex items-center gap-1 text-[10px] font-bold text-accent hover:text-white transition-colors"
                  >
                    <span className="material-symbols-outlined text-xs">visibility</span>
                    Ver mi página
                  </a>
                </>
              )}
            </div>
            <button
              onClick={async () => {
                await fetch(`${API}/api/v1/auth/logout`, { method: 'POST', credentials: 'include' })
                localStorage.removeItem('token'); localStorage.removeItem('user')
                localStorage.removeItem('auth_mode'); localStorage.removeItem('dev_user_id')
                window.location.href = '/'
              }}
              className="shrink-0 flex items-center gap-1 text-[10px] font-bold text-white/50 hover:text-red-400 transition-colors"
              title="Cerrar sesión"
            >
              <span className="material-symbols-outlined text-xs">logout</span>
              Salir
            </button>
          </div>
        )}

        {/* Barra tablet/desktop: Ver sitio/Ver mi página centrado */}
        {!isProg && (
          <div className="hidden sm:flex bg-[#4A2070] border-t border-white/10 py-1.5 items-center px-4 relative min-h-[32px]">
            {/* Centro: Ver sitio + Ver mi página */}
            <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-4">
              <a href="/" className="flex items-center gap-1 text-xs font-bold text-white/60 hover:text-white transition-colors">
                <span className="material-symbols-outlined text-sm">open_in_new</span>
                Ver sitio
              </a>
              {hasPage && (
                <>
                  <span className="text-white/20">|</span>
                  <a
                    href={user.tipo_cuenta === 'turismo' ? `/?turismo=${user.id}` : `/?store=${user.id}`}
                    className="flex items-center gap-1.5 text-xs font-bold text-accent hover:text-white transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">visibility</span>
                    Ver mi página
                  </a>
                </>
              )}
            </div>
            {/* Derecha: Cerrar sesión */}
            <button
              onClick={async () => {
                await fetch(`${API}/api/v1/auth/logout`, { method: 'POST', credentials: 'include' })
                localStorage.removeItem('token'); localStorage.removeItem('user')
                localStorage.removeItem('auth_mode'); localStorage.removeItem('dev_user_id')
                window.location.href = '/'
              }}
              className="ml-auto flex items-center gap-1 text-xs font-bold text-white/50 hover:text-red-400 transition-colors"
              title="Cerrar sesión"
            >
              <span className="material-symbols-outlined text-sm">logout</span>
              Salir
            </button>
          </div>
        )}
      </header>

      {showProfile && <ProfileModal onClose={() => setShowProfile(false)} />}
    </>
  )
}
