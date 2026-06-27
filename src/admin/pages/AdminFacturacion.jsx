import { GeneralPlans, TurismoPlans } from '../../components/PlansModal.jsx'

// Resumen del plan actual por tipo de cuenta (MOD-023, fase 1 informativo).
// Las características completas se muestran reutilizando GeneralPlans/TurismoPlans.
const PLAN_INFO = {
  general: {
    1: { name: 'Plan Gratuito', price: 'Gratis', images: '5 imágenes' },
    2: { name: 'Plan Normal', price: '$2.990 / mes + IVA', images: '25 imágenes' },
    3: { name: 'Plan Premium', price: '$4.990 / mes + IVA', images: '110 imágenes' },
  },
  turismo: {
    // El backend asigna plan_id=4 a las cuentas de turismo (ver backend/routes/auth.js).
    1: { name: 'Plan Gratuito', price: 'Gratis', images: '3 imágenes' },
    3: { name: 'Plan Premium', price: '$3.990 / mes + IVA', images: '3 imágenes + 36 tours' },
    4: { name: 'Plan Premium', price: '$3.990 / mes + IVA', images: '3 imágenes + 36 tours' },
  },
}

export default function AdminFacturacion() {
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const esTurismo = user.tipo_cuenta === 'turismo'
  const grupo = esTurismo ? 'turismo' : 'general'
  const planId = user.plan_id || 1
  const tabla = PLAN_INFO[grupo]
  const actual = tabla[planId] || tabla[esTurismo ? 4 : 1]

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Encabezado */}
      <div>
        <h1 className="text-xl font-black text-slate-800 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">receipt_long</span>
          Facturación
        </h1>
        <p className="text-sm text-slate-500 mt-1">Tu plan actual y lo que incluye.</p>
      </div>

      {/* Tarjeta del plan actual */}
      <div className="rounded-2xl border-2 border-primary/20 bg-primary/5 p-5 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="w-14 h-14 rounded-xl bg-primary text-white flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-3xl">workspace_premium</span>
        </div>
        <div className="flex-1">
          <span className="inline-block text-[10px] font-black uppercase tracking-wider bg-accent text-primary px-2 py-0.5 rounded-full mb-1">
            Plan actual
          </span>
          <h2 className="text-lg font-black text-slate-800">{actual.name}</h2>
          <p className="text-sm text-slate-500">{actual.price} · hasta {actual.images}</p>
        </div>
      </div>

      {/* Comparativa de características */}
      <div>
        <h3 className="text-sm font-black text-slate-700 uppercase tracking-wider">Características de los planes</h3>
        <p className="text-xs text-slate-400 mb-1">Compará lo que incluye cada plan{esTurismo ? ' de turismo' : ''}.</p>
        {esTurismo ? <TurismoPlans hideRecommended /> : <GeneralPlans hideRecommended />}
      </div>

      {/* Nota sobre cambios de plan / facturación */}
      <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 flex items-start gap-3">
        <span className="material-symbols-outlined text-primary shrink-0">info</span>
        <p className="text-xs text-slate-500 leading-relaxed">
          ¿Querés cambiar de plan o revisar tu facturación? Escribinos y te ayudamos a gestionarlo.
          Próximamente vas a poder gestionar el upgrade directamente desde acá.
        </p>
      </div>
    </div>
  )
}
