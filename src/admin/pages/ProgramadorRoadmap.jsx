import { useState, useMemo } from 'react'

// Minuta de modificaciones propuestas en la sesión del 2026-06-20.
// Tablero Kanban de SOLO LECTURA (sin interacción) para monitorear avance.
// Para mover un ítem de columna, cambiar su campo `estado` aquí abajo.
//   estado: 'backlog' | 'evaluar' | 'definir' | 'spike' | 'curso' | 'hecho'
const MODS = [
  { id: 'MOD-001', area: 'Frontend / UX',        prioridad: 'media', estado: 'hecho',   titulo: 'Feedback de login y saludo en responsive', desc: 'Toast/mensaje de login exitoso y bienvenida sobre el mismo modal; saludo visible también en responsive.' },
  { id: 'MOD-002', area: 'Frontend / Nav',       prioridad: 'baja',  estado: 'backlog', titulo: 'Clic en el logo redirige a inicio', desc: 'El logo debe navegar a la home (/).' },
  { id: 'MOD-003', area: 'Frontend / UI',        prioridad: 'baja',  estado: 'backlog', titulo: 'Botones de sesión como texto', desc: '"Ingresar" y "Cerrar sesión" como texto, no iconos, en el header.' },
  { id: 'MOD-004', area: 'Frontend / Nav',       prioridad: 'baja',  estado: 'backlog', titulo: 'Quitar botón "Inicio" en negocio', desc: 'Eliminar el botón amarillo "Inicio" en la vista de negocio (el logo lo reemplaza).' },
  { id: 'MOD-005', area: 'Frontend / UI',        prioridad: 'media', estado: 'backlog', titulo: 'Tags en tarjetas de producto', desc: 'Mostrar tags tipo "nuevo" / "usado" en las cards.' },
  { id: 'MOD-006', area: 'Frontend / UI',        prioridad: 'media', estado: 'backlog', titulo: 'Nombre del negocio en modal de producto', desc: 'El modal del producto debe mostrar el nombre del negocio.' },
  { id: 'MOD-007', area: 'Frontend / i18n',      prioridad: 'alta',  estado: 'backlog', titulo: 'Versión en inglés del sitio', desc: 'Internacionalizar toda la UI con selector de idioma. Amerita spec propia.' },
  { id: 'MOD-008', area: 'Admin / Negocio',      prioridad: 'media', estado: 'hecho',   titulo: 'Horarios en dos tramos', desc: 'Permitir doble tramo horario por día (cierre por almuerzo).' },
  { id: 'MOD-009', area: 'Admin / Negocio',      prioridad: 'media', estado: 'backlog', titulo: 'Dirección en 4 campos', desc: 'Separar en dirección, numeración, región y comuna. Requiere migración de BD.' },
  { id: 'MOD-010', area: 'Frontend / UI',        prioridad: 'baja',  estado: 'backlog', titulo: 'Quitar tabs "Tecnología" y "Tendencia"', desc: 'Eliminar esos tabs del módulo de producto.' },
  { id: 'MOD-011', area: 'Admin / Negocio',      prioridad: 'media', estado: 'backlog', titulo: 'Logo de la empresa en Mi negocio', desc: 'Permitir subir/mostrar el logo del negocio.' },
  { id: 'MOD-012', area: 'Admin / Negocio',      prioridad: 'baja',  estado: 'evaluar', titulo: 'Evaluar Google Maps para dirección', desc: 'Geolocalizar la dirección. Evaluar costo/API key y alternativas.' },
  { id: 'MOD-013', area: 'Admin / Negocio',      prioridad: 'media', estado: 'backlog', titulo: 'Servicios y medios de pago', desc: 'Delivery / retiro / reservas + medios de pago aceptados.' },
  { id: 'MOD-014', area: 'Admin / Negocio',      prioridad: 'baja',  estado: 'backlog', titulo: '% de perfil completado', desc: 'Indicador de avance del perfil del negocio.' },
  { id: 'MOD-015', area: 'Admin / Negocio',      prioridad: 'media', estado: 'definir', titulo: 'Manejo de feriados', desc: 'Definir cómo se abordan los feriados en los horarios.' },
  { id: 'MOD-016', area: 'Admin / Productos',    prioridad: 'media', estado: 'backlog', titulo: 'Crear/editar producto como SPA', desc: 'Migrar el formulario de modal a vista dedicada con ruta propia.' },
  { id: 'MOD-017', area: 'Admin / Productos',    prioridad: 'baja',  estado: 'backlog', titulo: 'Layout de talla y medidas', desc: 'Ordenar el layout talla+medida; secuencia de medidas: alto, ancho, largo.' },
  { id: 'MOD-018', area: 'Admin / Productos',    prioridad: 'media', estado: 'backlog', titulo: 'Oferta exige precio final y anterior', desc: 'La categoría "oferta" obliga ambos precios (final con descuento + anterior).' },
  { id: 'MOD-019', area: 'Frontend / Catálogo',  prioridad: 'baja',  estado: 'backlog', titulo: 'Opción "Todos" en el catálogo', desc: 'Vista que liste todos los productos sin filtrar por categoría.' },
  { id: 'MOD-020', area: 'Feature / Soporte',    prioridad: 'alta',  estado: 'backlog', titulo: 'Canal de requerimientos y tickets', desc: 'Canal in-app usuario → soporte con generación de tickets. Amerita spec propia.' },
  { id: 'MOD-021', area: 'Frontend / UX',        prioridad: 'baja',  estado: 'backlog', titulo: 'Doble confirmación al cerrar sesión', desc: 'Confirmar antes del logout, en admin y en cualquier módulo.' },
  { id: 'MOD-022', area: 'Admin / Productos',    prioridad: 'baja',  estado: 'backlog', titulo: 'Avisos de validación en español', desc: 'Los avisos del modal de nuevo producto siempre en español.' },
  { id: 'MOD-023', area: 'Admin / Facturación',  prioridad: 'media', estado: 'backlog', titulo: 'Módulo de facturación y plan actual', desc: 'Mostrar el plan vigente del negocio y sus características.' },
  { id: 'MOD-024', area: 'Admin / Planes',       prioridad: 'media', estado: 'backlog', titulo: 'Aviso de límite de imágenes del plan', desc: 'Avisar al acercarse y al alcanzar el límite de imágenes del plan.' },
  { id: 'MOD-025', area: 'Frontend / UI',        prioridad: 'baja',  estado: 'backlog', titulo: 'Quitar ícono de sesión del sidebar', desc: 'Eliminar el ícono duplicado (ya está en el header).' },
  { id: 'MOD-026', area: 'Admin / Facturación',  prioridad: 'media', estado: 'backlog', titulo: 'Propuesta de upgrade de plan', desc: 'Junto al plan actual, ofrecer y capturar solicitud de upgrade.' },
  { id: 'MOD-027', area: 'Investigación',        prioridad: 'baja',  estado: 'spike',   titulo: 'Unlighthouse sobre módulos autenticados', desc: 'Averiguar cómo correr Unlighthouse en prod sobre rutas con login.' },
  { id: 'MOD-028', area: 'Registro / Comercio',  prioridad: 'media', estado: 'backlog', titulo: 'Regiones y comunas en el registro', desc: 'Liberar todas las regiones/comunas de Chile; default Araucanía / Villarrica.' },
  { id: 'MOD-029', area: 'Registro / UX',        prioridad: 'media', estado: 'backlog', titulo: 'Mensaje de éxito al registrarse', desc: 'Feedback de éxito al crear un usuario nuevo (análogo a MOD-001).' },
  { id: 'MOD-030', area: 'Registro / UI',        prioridad: 'baja',  estado: 'backlog', titulo: 'Prefijo telefónico por país', desc: '+56 por default + select de países de Latinoamérica con su prefijo de celular.' },
]

const PRIORIDAD = {
  alta:  { label: 'Alta',  dot: 'bg-red-400' },
  media: { label: 'Media', dot: 'bg-amber-400' },
  baja:  { label: 'Baja',  dot: 'bg-emerald-400' },
}

// Columnas del Kanban. Cada columna agrupa uno o más `estado`.
const COLUMNAS = [
  { key: 'todo',    label: 'Por hacer',  icon: 'inbox',         estados: ['backlog'],            accent: 'text-slate-300',   bar: 'bg-slate-500',   card: 'border-slate-700' },
  { key: 'eval',    label: 'Por definir',icon: 'help',          estados: ['evaluar', 'definir', 'spike'], accent: 'text-cyan-300', bar: 'bg-cyan-500', card: 'border-cyan-500/30' },
  { key: 'curso',   label: 'En curso',   icon: 'autorenew',     estados: ['curso'],              accent: 'text-amber-300',   bar: 'bg-amber-500',   card: 'border-amber-500/30' },
  { key: 'hecho',   label: 'Hecho',      icon: 'check_circle',  estados: ['hecho'],              accent: 'text-emerald-300', bar: 'bg-emerald-500', card: 'border-emerald-500/30' },
]

const FILTROS = [
  { key: 'todas', label: 'Todas' },
  { key: 'alta',  label: 'Alta' },
  { key: 'media', label: 'Media' },
  { key: 'baja',  label: 'Baja' },
]

function Card({ m }) {
  const p = PRIORIDAD[m.prioridad]
  const done = m.estado === 'hecho'
  return (
    <div className={`bg-slate-900 border rounded-lg p-3 ${done ? 'border-emerald-500/30 opacity-80' : 'border-slate-700'}`}>
      <div className="flex items-center gap-2 mb-1">
        <span className={`w-2 h-2 rounded-full shrink-0 ${p.dot}`} title={`Prioridad ${p.label}`}></span>
        <span className="text-[10px] font-black text-emerald-400">{m.id}</span>
        <span className="ml-auto text-[9px] font-semibold text-slate-500 truncate">{m.area}</span>
      </div>
      <p className={`text-xs font-bold leading-snug ${done ? 'text-slate-400 line-through' : 'text-slate-100'}`}>{m.titulo}</p>
      <p className="text-[11px] text-slate-500 mt-1 leading-snug">{m.desc}</p>
    </div>
  )
}

export default function ProgramadorRoadmap() {
  const [filtro, setFiltro] = useState('todas')

  const visibles = useMemo(
    () => (filtro === 'todas' ? MODS : MODS.filter(m => m.prioridad === filtro)),
    [filtro]
  )

  const columnas = useMemo(
    () => COLUMNAS.map(col => ({
      ...col,
      items: visibles.filter(m => col.estados.includes(m.estado)),
    })),
    [visibles]
  )

  const hechos = MODS.filter(m => m.estado === 'hecho').length

  return (
    <div>
      {/* Scrollbar sutil para las columnas (tema oscuro) */}
      <style>{`
        .kanban-col::-webkit-scrollbar { width: 6px; }
        .kanban-col::-webkit-scrollbar-track { background: transparent; }
        .kanban-col::-webkit-scrollbar-thumb { background: #475569; border-radius: 9999px; }
        .kanban-col::-webkit-scrollbar-thumb:hover { background: #64748b; }
        .kanban-col { scrollbar-width: thin; scrollbar-color: #475569 transparent; }
      `}</style>

      {/* Encabezado */}
      <div className="flex items-center justify-between mb-2 flex-wrap gap-3">
        <h1 className="text-lg font-black text-emerald-400 flex items-center gap-2">
          <span className="material-symbols-outlined text-2xl">view_kanban</span>
          Roadmap de Modificaciones
        </h1>
        <span className="text-[11px] text-slate-500 font-semibold">
          Sesión 2026-06-20 · {hechos}/{MODS.length} realizadas
        </span>
      </div>
      <p className="text-xs text-slate-400 mb-4 leading-relaxed max-w-2xl">
        Tablero de seguimiento (solo lectura). Monitorea qué modificaciones están realizadas y cuáles pendientes.
      </p>

      {/* Filtros por prioridad */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {FILTROS.map(f => (
          <button
            key={f.key}
            onClick={() => setFiltro(f.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors border ${
              filtro === f.key
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-emerald-300'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Tablero Kanban: altura acotada al viewport.
          El scroll horizontal mueve las columnas; el scroll vertical vive
          DENTRO de cada columna (no en el main). */}
      <div className="flex gap-3 overflow-x-auto pb-3 -mx-1 px-1 h-[calc(100dvh-240px)] min-h-[320px]">
        {columnas.map(col => (
          <div key={col.key} className="w-72 shrink-0 flex flex-col h-full">
            {/* Cabecera de columna (fija dentro de la columna) */}
            <div className="bg-slate-800/60 border border-slate-700 rounded-t-xl px-3 py-2.5 shrink-0">
              <div className="flex items-center gap-2">
                <span className={`material-symbols-outlined text-base ${col.accent}`}>{col.icon}</span>
                <span className={`text-xs font-bold ${col.accent}`}>{col.label}</span>
                <span className="ml-auto text-[11px] font-black text-slate-400 bg-slate-900 rounded-full px-2 py-0.5">
                  {col.items.length}
                </span>
              </div>
              <div className={`h-1 rounded-full mt-2 ${col.bar}`}></div>
            </div>

            {/* Cuerpo de columna: SCROLL VERTICAL PROPIO al desbordar */}
            <div className="kanban-col bg-slate-800/30 border-x border-b border-slate-700 rounded-b-xl p-2 flex flex-col gap-2 flex-1 min-h-0 overflow-y-auto overscroll-contain">
              {col.items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-slate-600">
                  <span className="material-symbols-outlined text-2xl mb-1">remove</span>
                  <span className="text-[10px] font-semibold">Sin ítems</span>
                </div>
              ) : (
                col.items.map(m => <Card key={m.id} m={m} />)
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
