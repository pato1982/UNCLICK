const plans = [
  {
    name: 'Plan Gratuito',
    price: '$0',
    period: null,
    buttonText: 'Seleccionar',
    buttonStyle: 'bg-slate-200 text-slate-700 hover:bg-slate-300',
    highlight: false,
    basics: {
      images: '5',
      banner: null,
    },
    visibility: {
      mainPage: true,
      search: true,
      featured: false,
      priority: 'Normal',
    },
    features: {
      panel: true,
      edit: true,
      storeInfo: true,
      slogan: false,
      apariencia: false,
    },
    ownPage: {
      enabled: false,
      banner: false,
      stats: false,
    },
  },
  {
    name: 'Plan Normal',
    price: '$2.990',
    neto: 2990,
    period: '+ IVA Mensual',
    buttonText: 'Seleccionar',
    buttonStyle: 'bg-primary text-white hover:bg-primary-light',
    highlight: false,
    basics: {
      images: '25',
      banner: null,
    },
    visibility: {
      mainPage: true,
      search: true,
      featured: true,
      priority: 'Alta',
    },
    features: {
      panel: true,
      edit: true,
      storeInfo: true,
      slogan: true,
      apariencia: false,
    },
    ownPage: {
      enabled: true,
      banner: false,
      stats: false,
    },
  },
  {
    name: 'Plan Premium',
    price: '$4.990',
    neto: 4990,
    period: '+ IVA Mensual',
    buttonText: 'Plan Actual',
    buttonStyle: 'bg-accent text-primary font-black cursor-default',
    highlight: true,
    basics: {
      images: '100',
      banner: '10',
    },
    visibility: {
      mainPage: true,
      search: true,
      featured: true,
      priority: 'Maxima',
    },
    features: {
      panel: true,
      edit: true,
      storeInfo: true,
      slogan: true,
      apariencia: true,
    },
    ownPage: {
      enabled: true,
      banner: true,
      stats: true,
    },
  },
]

const plansTurismo = [
  {
    name: 'Plan Gratuito',
    price: '$0',
    buttonText: 'Seleccionar',
    buttonStyle: 'bg-slate-200 text-slate-700 hover:bg-slate-300',
    highlight: false,
    basics: {
      images: '3',
      tours: null,
    },
    visibility: {
      mainPage: true,
      search: true,
      priority: 'Normal',
    },
    features: {
      panel: true,
      edit: true,
      storeInfo: true,
      schedule: true,
    },
    ownPage: {
      enabled: false,
      tours: false,
      stats: false,
    },
  },
  {
    name: 'Plan Premium',
    price: '$3.990',
    neto: 3990,
    buttonText: 'Seleccionar',
    buttonStyle: 'bg-accent text-primary font-black',
    highlight: true,
    basics: {
      images: '3',
      tours: '36',
    },
    visibility: {
      mainPage: true,
      search: true,
      priority: 'Maxima',
    },
    features: {
      panel: true,
      edit: true,
      storeInfo: true,
      schedule: true,
    },
    ownPage: {
      enabled: true,
      tours: '12 Tours',
      stats: true,
    },
  },
]

import { useState } from 'react'

function Check() {
  return <span className="material-symbols-outlined text-green-500 text-sm">check_circle</span>
}

function Cross() {
  return <span className="material-symbols-outlined text-red-400 text-sm">cancel</span>
}

function BoolIcon({ value }) {
  return value ? <Check /> : <Cross />
}

function InfoTooltip({ text }) {
  const [show, setShow] = useState(false)
  return (
    <span className="relative inline-flex">
      <button
        onClick={(e) => { e.stopPropagation(); setShow(!show) }}
        className="h-5 w-5 rounded-full bg-amber-100 hover:bg-amber-200 text-amber-500 flex items-center justify-center transition-colors"
      >
        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>help</span>
      </button>
      {show && (
        <>
          <div className="fixed inset-0" style={{ zIndex: 10001 }} onClick={() => setShow(false)}></div>
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] leading-relaxed rounded-lg px-3 py-2 w-52 shadow-xl" style={{ zIndex: 10002 }}>
            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-800 rotate-45"></div>
          <span className="normal-case font-normal tracking-normal" style={{ textAlign: 'justify', display: 'block' }}>{text}</span>
          </div>
        </>
      )}
    </span>
  )
}

function ValueOrBool({ value }) {
  if (value === true) return <Check />
  if (value === false) return <Cross />
  return <span className="text-[11px] font-bold text-primary">{value}</span>
}

function GeneralPlanCard({ plan, hideRecommended }) {
  return (
        <div
          className={`rounded-xl border-2 p-2.5 sm:p-3 flex flex-col transition-all w-full relative ${
            plan.highlight
              ? 'border-accent shadow-lg shadow-accent/20'
              : 'border-slate-200 hover:border-primary/30'
          }`}
        >
          {plan.highlight && !hideRecommended && (
            <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-accent text-primary text-[8px] font-black uppercase tracking-wider px-3 py-0.5 rounded-full">
              Recomendado
            </span>
          )}

          <div className="text-center mb-1.5">
            <h3 className="text-sm font-black text-slate-800 leading-tight">{plan.name}</h3>
            {plan.price === '$0' ? (
              <span className="text-xl font-black text-primary">Gratis</span>
            ) : (
              <div className="flex flex-col items-center">
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-black text-primary">{plan.price}</span>
                  <span className="text-[10px] text-slate-400">/ mes</span>
                </div>
                <span className="text-[9px] text-slate-400">
                  + IVA (${Math.round(plan.neto * 0.19).toLocaleString('es-CL')})
                </span>
              </div>
            )}
          </div>

          <button className={`w-full py-1 rounded-lg text-xs font-bold uppercase tracking-wide transition-all mb-2 ${plan.buttonStyle}`}>
            {plan.buttonText}
          </button>

          <div className="mb-1.5">
            <h4 className="text-[10px] font-black text-primary uppercase tracking-wider mb-1 border-b border-primary/20 pb-0.5">Caracteristicas basicas</h4>
            <div className="space-y-0.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-600">Publicaciones</span>
                <span className="text-[11px] font-bold text-primary">{plan.basics.images} imágenes</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-600">Banner</span>
                {plan.basics.banner
                  ? <span className="text-[11px] font-bold text-primary">+ {plan.basics.banner} imágenes</span>
                  : <Cross />
                }
              </div>
              <div className="flex items-center justify-between border-t border-slate-100 pt-0.5">
                <span className="text-[11px] font-bold text-slate-700">Total imágenes</span>
                <span className="text-[11px] font-black text-accent bg-primary/5 px-1.5 py-0.5 rounded">{
                  Number(plan.basics.images) + Number(plan.basics.banner || 0)
                } imágenes</span>
              </div>
            </div>
          </div>

          <div className="mb-1.5">
            <h4 className="text-[10px] font-black text-primary uppercase tracking-wider mb-1 border-b border-primary/20 pb-0.5">Visibilidad</h4>
            <div className="space-y-0.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-600">Pagina principal</span>
                <BoolIcon value={plan.visibility.mainPage} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-600">Buscadores</span>
                <BoolIcon value={plan.visibility.search} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-600">Producto destacado</span>
                <BoolIcon value={plan.visibility.featured} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-600">Prioridad de aparicion</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  plan.visibility.priority === 'Maxima' ? 'bg-accent text-primary' :
                  plan.visibility.priority === 'Alta' ? 'bg-primary/10 text-primary' :
                  'bg-slate-100 text-slate-500'
                }`}>{plan.visibility.priority}</span>
              </div>
            </div>
          </div>

          <div className="mb-1.5">
            <h4 className="text-[10px] font-black text-primary uppercase tracking-wider mb-1 border-b border-primary/20 pb-0.5">Funcionalidades</h4>
            <div className="space-y-0.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-600">Panel de control</span>
                <BoolIcon value={plan.features.panel} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-600">Editar informacion</span>
                <BoolIcon value={plan.features.edit} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-600">Info de la tienda</span>
                <BoolIcon value={plan.features.storeInfo} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-600">Slogan</span>
                <BoolIcon value={plan.features.slogan} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-600">Apariencia</span>
                <BoolIcon value={plan.features.apariencia} />
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-[10px] font-black text-primary uppercase tracking-wider mb-1 border-b border-primary/20 pb-0.5 flex items-center gap-1">
              Pagina propia
              {plan.highlight && <InfoTooltip text="Tu negocio tendra su propia pagina dentro de LocalClick con toda tu informacion, productos y contacto. Podras compartir el enlace directo con tus clientes para que accedan a tu tienda facilmente." />}
            </h4>
            <div className="space-y-0.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-600">Pagina propia</span>
                <BoolIcon value={plan.ownPage.enabled} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-600">Banner</span>
                <BoolIcon value={plan.ownPage.banner} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-600">Estadisticas</span>
                <BoolIcon value={plan.ownPage.stats} />
              </div>
            </div>
          </div>
        </div>
  )
}

function GeneralPlans({ hideRecommended } = {}) {
  const [sel, setSel] = useState(() => {
    const i = plans.findIndex((p) => p.highlight)
    return i >= 0 ? i : 0
  })
  return (
    <>
      {/* MÓVIL: pestañas con el nombre de cada plan + plan seleccionado */}
      <div className="sm:hidden pt-3">
        <div className="flex gap-1.5 mb-3">
          {plans.map((plan, i) => (
            <button
              key={plan.name}
              type="button"
              onClick={() => setSel(i)}
              className={`flex-1 rounded-lg px-1 py-2 text-[11px] font-black uppercase tracking-wide transition-all border-2 ${
                sel === i ? 'border-primary bg-primary text-white shadow' : 'border-gray-200 bg-white text-gray-500'
              }`}
            >
              {plan.name.replace('Plan ', '')}
            </button>
          ))}
        </div>
        <GeneralPlanCard plan={plans[sel]} hideRecommended={hideRecommended} />
      </div>

      {/* TABLET/DESKTOP: grilla */}
      <div className="hidden sm:grid sm:grid-cols-3 gap-3 pt-3">
        {plans.map((plan) => (
          <GeneralPlanCard key={plan.name} plan={plan} hideRecommended={hideRecommended} />
        ))}
      </div>
    </>
  )
}

function TurismoPlanCard({ plan, hideRecommended }) {
  return (
        <div
          className={`rounded-xl border-2 p-2.5 sm:p-3 flex flex-col transition-all w-full relative ${
            plan.highlight
              ? 'border-accent shadow-lg shadow-accent/20'
              : 'border-slate-200 hover:border-primary/30'
          }`}
        >
          {plan.highlight && !hideRecommended && (
            <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-accent text-primary text-[8px] font-black uppercase tracking-wider px-3 py-0.5 rounded-full">
              Recomendado
            </span>
          )}

          <div className="text-center mb-1.5">
            <h3 className="text-sm font-black text-slate-800 leading-tight">{plan.name}</h3>
            {plan.price === '$0' ? (
              <span className="text-xl font-black text-primary">Gratis</span>
            ) : (
              <div className="flex flex-col items-center">
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-black text-primary">{plan.price}</span>
                  <span className="text-[10px] text-slate-400">/ mes</span>
                </div>
                <span className="text-[9px] text-slate-400">
                  + IVA (${Math.round(plan.neto * 0.19).toLocaleString('es-CL')})
                </span>
              </div>
            )}
          </div>

          <button className={`w-full py-1 rounded-lg text-xs font-bold uppercase tracking-wide transition-all mb-2 ${plan.buttonStyle}`}>
            {plan.buttonText}
          </button>

          <div className="mb-1.5">
            <h4 className="text-[10px] font-black text-primary uppercase tracking-wider mb-1 border-b border-primary/20 pb-0.5">Caracteristicas basicas</h4>
            <div className="space-y-0.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-600">Imágenes en portada</span>
                <span className="text-[11px] font-bold text-primary">{plan.basics.images}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-600">Imágenes en página premium</span>
                <span className="text-[11px] font-bold text-primary">{plan.basics.tours || 0}</span>
              </div>
            </div>
          </div>

          <div className="mb-1.5">
            <h4 className="text-[10px] font-black text-primary uppercase tracking-wider mb-1 border-b border-primary/20 pb-0.5">Visibilidad</h4>
            <div className="space-y-0.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-600">Pagina principal</span>
                <BoolIcon value={plan.visibility.mainPage} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-600">Buscadores</span>
                <BoolIcon value={plan.visibility.search} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-600">Prioridad de aparicion</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  plan.visibility.priority === 'Maxima' ? 'bg-accent text-primary' : 'bg-slate-100 text-slate-500'
                }`}>{plan.visibility.priority}</span>
              </div>
            </div>
          </div>

          <div className="mb-1.5">
            <h4 className="text-[10px] font-black text-primary uppercase tracking-wider mb-1 border-b border-primary/20 pb-0.5">Funcionalidades</h4>
            <div className="space-y-0.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-600">Panel de control</span>
                <BoolIcon value={plan.features.panel} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-600">Editar informacion</span>
                <BoolIcon value={plan.features.edit} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-600">Info del negocio</span>
                <BoolIcon value={plan.features.storeInfo} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-600">Horarios y direccion</span>
                <BoolIcon value={plan.features.schedule} />
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-[10px] font-black text-primary uppercase tracking-wider mb-1 border-b border-primary/20 pb-0.5 flex items-center gap-1">
              Pagina propia
              {plan.highlight && <InfoTooltip text="Tu negocio de turismo tendra su propia pagina dentro de LocalClick con toda tu informacion, tours y contacto. Podras compartir el enlace directo con tus clientes." />}
            </h4>
            <div className="space-y-0.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-600">Pagina propia</span>
                <BoolIcon value={plan.ownPage.enabled} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-600">Tours</span>
                <ValueOrBool value={plan.ownPage.tours} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-600">Estadisticas</span>
                <BoolIcon value={plan.ownPage.stats} />
              </div>
            </div>
          </div>
        </div>
  )
}

function TurismoPlans({ hideRecommended } = {}) {
  const [sel, setSel] = useState(() => {
    const i = plansTurismo.findIndex((p) => p.highlight)
    return i >= 0 ? i : 0
  })
  return (
    <>
      {/* MÓVIL: pestañas con el nombre de cada plan + plan seleccionado */}
      <div className="sm:hidden pt-3">
        <div className="flex gap-1.5 mb-3">
          {plansTurismo.map((plan, i) => (
            <button
              key={plan.name}
              type="button"
              onClick={() => setSel(i)}
              className={`flex-1 rounded-lg px-1 py-2 text-[11px] font-black uppercase tracking-wide transition-all border-2 ${
                sel === i ? 'border-primary bg-primary text-white shadow' : 'border-gray-200 bg-white text-gray-500'
              }`}
            >
              {plan.name.replace('Plan ', '')}
            </button>
          ))}
        </div>
        <TurismoPlanCard plan={plansTurismo[sel]} hideRecommended={hideRecommended} />
      </div>

      {/* TABLET/DESKTOP: grilla */}
      <div className="hidden sm:grid sm:grid-cols-2 gap-3 max-w-lg mx-auto pt-3">
        {plansTurismo.map((plan) => (
          <TurismoPlanCard key={plan.name} plan={plan} hideRecommended={hideRecommended} />
        ))}
      </div>
    </>
  )
}

export { GeneralPlans, TurismoPlans }

export default function PlansModal({ onClose }) {
  const [tipo, setTipo] = useState(null)

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex: 10000 }} onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
      <div
        className={`relative bg-white rounded-2xl shadow-2xl w-full max-h-[90vh] overflow-y-auto transition-all duration-300 ${
          tipo === 'general' ? 'max-w-4xl' : tipo === 'turismo' ? 'max-w-xl' : 'max-w-md'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-3 right-3 z-10 h-7 w-7 bg-slate-100 hover:bg-slate-200 rounded-full flex items-center justify-center transition-colors">
          <span className="material-symbols-outlined text-slate-600 text-base">close</span>
        </button>

        <div className="p-4 pt-5">
          {/* Selector de tipo */}
          {!tipo && (
            <div>
              <h2 className="text-center text-sm font-black text-slate-800 mb-4">¿Qué clase de negocio tienes?</h2>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setTipo('general')}
                  className="flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-gray-200 hover:border-primary hover:bg-primary/5 transition-all"
                >
                  <span className="material-symbols-outlined text-4xl text-primary">storefront</span>
                  <span className="text-sm font-bold text-slate-800">Productos / Arriendos / Servicios</span>
                  <span className="text-[10px] text-slate-400 text-center leading-tight">Venta de productos, servicios profesionales o arriendos</span>
                </button>
                <button
                  onClick={() => setTipo('turismo')}
                  className="flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-gray-200 hover:border-primary hover:bg-primary/5 transition-all"
                >
                  <span className="material-symbols-outlined text-4xl text-primary">tour</span>
                  <span className="text-sm font-bold text-slate-800">Turismo</span>
                  <span className="text-[10px] text-slate-400 text-center leading-tight">Experiencias, tours y actividades turísticas</span>
                </button>
              </div>
            </div>
          )}

          {/* Planes según tipo */}
          {tipo && (
            <div>
              {tipo === 'general' && <GeneralPlans />}
              {tipo === 'turismo' && <TurismoPlans />}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
