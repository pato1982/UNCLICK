/**
 * Datos de muestra COMPLETOS para las cuentas de prueba (QA) en modo local.
 *
 * Genera, de forma determinista, para cada cuenta QA:
 *  - Perfil de negocio completo (con horarios, contacto, redes).
 *  - Productos / Servicios / Arriendos (según capacidades) con imágenes reales.
 *  - Para turismo: tours, negocio turístico, portada y página premium.
 *
 * Sirve para ver "cómo se ve" la plataforma llena, sin backend.
 * Las imágenes son URLs absolutas de Unsplash (la app antepone API='' → quedan intactas).
 */

import { QA_USERS, buildQaUser } from './qaUsers'
import { STORE_HEADER_PRESETS } from './storeHeaderPresets'

// --- Estilo de header por usuario (con guardado local) ---
const PRESET_IDS = STORE_HEADER_PRESETS.map((p) => p.id)
const HEADER_COLORS = ['#3B1969', '#0E7490', '#B45309', '#9333EA', '#1E3A8A', '#BE123C']
const NAV_COLORS = ['#2C134F', '#0A5560', '#8A3F07', '#6B21A8', '#152C66', '#8C0E2E']
const NAV_STYLE_IDS = ['borde', 'solido', 'degradado']
const HEADER_OVERRIDE_KEY = 'qa_header_overrides'

function readHeaderOverrides() {
  try { return JSON.parse(localStorage.getItem(HEADER_OVERRIDE_KEY) || '{}') } catch { return {} }
}
export function readHeaderOverride(id) {
  return readHeaderOverrides()[id] || null
}
export function writeHeaderOverride(id, cfg) {
  const all = readHeaderOverrides()
  all[id] = { ...(all[id] || {}), ...cfg }
  try { localStorage.setItem(HEADER_OVERRIDE_KEY, JSON.stringify(all)) } catch { /* noop */ }
}

// Estilo de header por defecto: variado por índice para que cada tienda se vea distinta.
function defaultHeaderFor(p) {
  const preset = PRESET_IDS[p._index % PRESET_IDS.length]
  return {
    header_preset: preset,
    header_color: HEADER_COLORS[p._index % HEADER_COLORS.length],
    header_height: 22 + (p._index % 4) * 8,
    header_bar: p._index % 3 === 0 ? 'integrada' : 'separada',
    banner_color: p._index % 4 === 0 ? 'transparent' : '#1a1220',
    services_color: p._index % 5 === 0 ? 'transparent' : '#0f1a2e',
    arriendos_color: p._index % 5 === 0 ? 'transparent' : '#14241c',
    sidebar_color: HEADER_COLORS[(p._index + 2) % HEADER_COLORS.length],
    sidebar_accent: '#E5B800',
    sidebar_style: ['izquierda', 'derecha', 'modal'][p._index % 3],
    nav_color: NAV_COLORS[p._index % NAV_COLORS.length],
    nav_style: NAV_STYLE_IDS[p._index % NAV_STYLE_IDS.length],
  }
}

const img = (id, w = 800) => `https://images.unsplash.com/${id}?w=${w}&q=80`

// Pools de imágenes (IDs estables, ya usados en el proyecto)
const POOL = {
  product: [
    'photo-1521572163474-6864f9cf17ab', 'photo-1542291026-7eec264c27ff',
    'photo-1523275335684-37898b6baf30', 'photo-1505740420928-5e560c06d30e',
    'photo-1526045612212-70caf35c14df', 'photo-1556909114-44e3e70034e2',
    'photo-1560066984-138dadb4c035', 'photo-1555041469-a586c61ea9bc',
    'photo-1544161515-4ab6ce6db874', 'photo-1576871337632-b9aef4c17ab9',
    'photo-1545170241-e489b37bfb98', 'photo-1533174072545-7a4b6ad7a6c3',
  ],
  service: [
    'photo-1487754180451-c456f719a1fc', 'photo-1542744173-8e7e53415bb0',
    'photo-1554048612-b6a482bc67e5', 'photo-1556909114-44e3e70034e2',
    'photo-1560066984-138dadb4c035', 'photo-1551698618-1dfe5d97d256',
    'photo-1509062522246-3755977927d7', 'photo-1543589077-47d81606c1bf',
  ],
  arriendo: [
    'photo-1564013799919-ab600027ffc6', 'photo-1497366216548-37526070297c',
    'photo-1502672260266-1c1ef2d93688', 'photo-1520219306100-ec4afeeefe58',
    'photo-1510798831971-661eb04b3739', 'photo-1544551763-46a013bb70d5',
    'photo-1554048612-b6a482bc67e5', 'photo-1502005229762-cf1b2da7c5d6',
  ],
  tour: [
    'photo-1551632811-561732d1e306', 'photo-1506905925346-21bda4d32df4',
    'photo-1501785888041-af3ef285b470', 'photo-1504309092620-4d0ec726efa4',
    'photo-1472745942893-4b9f730c7668', 'photo-1530866707318-0761c37bc3be',
    'photo-1519331379826-f10be5486c6f', 'photo-1464822759023-fed622ff2c3b',
  ],
  store: [
    'photo-1441986300917-64674bd600d8', 'photo-1497366216548-37526070297c',
    'photo-1556909114-44e3e70034e2', 'photo-1506905925346-21bda4d32df4',
  ],
}

const pick = (arr, n) => arr[((n % arr.length) + arr.length) % arr.length]

const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
function horariosEstandar() {
  return DIAS.map((dia, i) => ({
    dia,
    activo: i < 6, // cerrado domingo
    apertura: i === 5 ? '10:00' : '09:00',
    cierre: i === 5 ? '14:00' : '19:00',
  }))
}

// Nombres de negocio temáticos (Villarrica, Patagonia)
const NAMES = [
  'Almacén Patagonia', 'Rincón Andino', 'Tienda Lácar', 'Estilo Lanín',
  'Cumbre Outdoor', 'Bazar del Sur', 'Nieve y Bosque', 'Aire Libre SMA',
  'Refugio del Lago', 'Sendero Sur', 'Quila Diseño', 'Pehuén Hogar',
  'Chapelco Sport', 'Maitén Deco', 'Lago Azul Store', 'Vega Maipú',
  'Ruta 40 Market', 'Bosque Nativo', 'Andes Express', 'Volcán Tienda',
  'Turismo Lácar', 'Patagonia Aventura',
]
const SLOGANS = [
  'Lo mejor de la Patagonia, a un click',
  'Calidad y calidez del sur',
  'Tu tienda local de confianza',
  'Productos pensados para la montaña',
  'Aventura, hogar y estilo',
  'Hecho con identidad patagónica',
]

const PRODUCT_CATS = [
  { cat: 'Ropa y Calzado', cat_id: 1, subs: [{ n: 'Poleras', id: 11 }, { n: 'Zapatillas', id: 12 }, { n: 'Abrigos', id: 13 }] },
  { cat: 'Tecnología', cat_id: 2, subs: [{ n: 'Audio', id: 21 }, { n: 'Accesorios', id: 22 }] },
  { cat: 'Hogar', cat_id: 3, subs: [{ n: 'Decoración', id: 31 }, { n: 'Cocina', id: 32 }] },
  { cat: 'Deporte', cat_id: 4, subs: [{ n: 'Camping', id: 41 }, { n: 'Trekking', id: 42 }] },
]
const SERVICE_CATS = [
  { cat: 'Belleza y Bienestar', cat_id: 5, subs: [{ n: 'Peluquería', id: 51 }, { n: 'Spa', id: 52 }] },
  { cat: 'Hogar y Reparaciones', cat_id: 6, subs: [{ n: 'Gasfitería', id: 61 }, { n: 'Electricidad', id: 62 }] },
  { cat: 'Clases', cat_id: 7, subs: [{ n: 'Idiomas', id: 71 }, { n: 'Música', id: 72 }] },
]
const ARRIENDO_CATS = [
  { cat: 'Alojamiento', cat_id: 8, subs: [{ n: 'Cabañas', id: 81 }, { n: 'Departamentos', id: 82 }] },
  { cat: 'Vehículos', cat_id: 9, subs: [{ n: 'Autos', id: 91 }, { n: 'Bicicletas', id: 92 }] },
  { cat: 'Equipos', cat_id: 10, subs: [{ n: 'Esquí', id: 101 }, { n: 'Camping', id: 102 }] },
]

const PRODUCT_NAMES = [
  'Polera Patagonia', 'Zapatillas Trekking Andes', 'Campera Térmica Lanín', 'Mochila Outdoor 40L',
  'Gorro de Lana Tejido', 'Termo de Acero 1L', 'Set de Mates Artesanal', 'Linterna LED Recargable',
  'Buzo Polar Unisex', 'Guantes de Montaña', 'Lentes de Sol UV400', 'Cuchillo de Camping',
]
const SERVICE_NAMES = [
  'Corte y Peinado', 'Masaje Descontracturante', 'Reparación Eléctrica', 'Clases de Inglés',
  'Sesión de Fotografía', 'Instalación de Gasfitería', 'Clases de Guitarra', 'Tratamiento Facial Spa',
]
const ARRIENDO_NAMES = [
  'Cabaña frente al Lago Lácar', 'Departamento en el Centro', 'Pickup 4x4 Doble Cabina', 'Bicicleta de Montaña',
  'Equipo de Esquí Completo', 'Carpa 4 Personas', 'Casa Familiar con Parrilla', 'Kayak Doble',
]
const SECCIONES = ['destacados', 'novedades', 'ofertas', 'tecnologia', 'tendencia', 'liquidacion']
const BADGES = [null, 'Nuevo', 'Oferta', 'Destacado', '-20%', null]

const TOUR_NAMES = [
  'Ascenso al Volcán Lanín', 'Trekking Lago Lácar', 'Rafting Río Hua Hum', 'Cabalgata Andina',
  'Kayak en el Lago', 'Cascada Chachín', 'Mirador Bandurrias', 'Bosque de Arrayanes',
]
const TOUR_CATS = ['Aventura', 'Naturaleza', 'Agua', 'Cultural']

// Nombres temáticos para operadores turísticos (se asignan a las cuentas de turismo)
const TURISMO_NAMES = [
  'Patagonia Aventura', 'Lácar Expediciones', 'Lanín Outdoor', 'Andes Trekking',
  'Hua Hum Rafting', 'Chapelco Tours', 'Bandurrias Excursiones', 'Lago Azul Kayak',
]
// Conjuntos de categorías para variar las etiquetas y los filtros entre empresas
const TURISMO_CAT_SETS = [
  ['Aventura', 'Naturaleza', 'Familiar'],
  ['Trekking', 'Montaña', 'Aventura'],
  ['Agua', 'Kayak', 'Rafting'],
  ['Cultural', 'Naturaleza', 'Familiar'],
  ['Cabalgatas', 'Aventura', 'Montaña'],
]

function slugOf(email) {
  return email.split('@')[0].replace(/[^a-z0-9]/gi, '')
}

// ---- Perfiles QA enriquecidos ----
const TUR_USERS = QA_USERS.filter((u) => u.tipo === 'turismo')
export const QA_PROFILES = QA_USERS.map((qa, i) => {
  const user = buildQaUser(qa)
  const caps = qa.caps || []
  const isTur = qa.tipo === 'turismo'
  const name = isTur
    ? TURISMO_NAMES[TUR_USERS.indexOf(qa) % TURISMO_NAMES.length]
    : NAMES[i % NAMES.length]
  return {
    ...user,
    _index: i,
    _caps: caps,
    _name: name,
  }
})

export function qaUserById(id) {
  const n = Number(id)
  return QA_PROFILES.find((u) => u.id === n) || null
}
export function qaUserByEmail(email) {
  return QA_PROFILES.find((u) => u.email === email) || null
}

function contacto(p) {
  const slug = slugOf(p.email)
  const tail = String(100000 + p._index * 37).slice(-6)
  return {
    whatsapp: `+54 9 2972 ${tail.slice(0, 2)}${tail.slice(2, 4)} ${tail.slice(4)}`,
    telefono: `+54 2972 4${tail.slice(0, 5)}`,
    correo: `contacto@${slug}.com.ar`,
    facebook: `https://facebook.com/${slug}`,
    instagram: `@${slug}`,
    direccion: `Av. San Martín ${120 + p._index * 7}, Villarrica`,
  }
}

// ---- Negocio (general) ----
export function businessProfile(p) {
  if (!p) return null
  const c = contacto(p)
  return {
    id: p.id,
    user_id: p.id,
    nombre_negocio: p._name,
    slogan: pick(SLOGANS, p._index),
    descripcion:
      `${p._name} es un emprendimiento local de Villarrica. Ofrecemos atención ` +
      `personalizada y productos seleccionados con identidad patagónica. Trabajamos todo el año ` +
      `para vecinos y visitantes que buscan calidad, buen precio y trato cercano.`,
    direccion: c.direccion,
    whatsapp: c.whatsapp,
    telefono: c.telefono,
    correo: c.correo,
    facebook: c.facebook,
    instagram: c.instagram,
    horarios: horariosEstandar(),
    plan_id: p.plan_id,
    logo_url: p.plan_id >= 2 ? '/uploads/negocios/logo-demo-placeholder.webp' : null,
    // Estilo del header (default variado + override guardado por el usuario)
    ...defaultHeaderFor(p),
    ...(readHeaderOverride(p.id) || {}),
  }
}

function negocioFields(p) {
  const c = contacto(p)
  return {
    nombre_negocio: p._name,
    negocio_whatsapp: c.whatsapp,
    negocio_telefono: c.telefono,
    negocio_direccion: c.direccion,
    negocio_correo: c.correo,
    negocio_facebook: c.facebook,
    negocio_instagram: c.instagram,
    owner_plan_id: p.plan_id,
  }
}

function buildItems(p, tipo, count, names, cats, pool, priceBase, priceStep) {
  const nf = negocioFields(p)
  const items = []
  const tipoOffset = tipo === 'producto' ? 0 : tipo === 'servicio' ? 30 : 60
  for (let n = 0; n < count; n++) {
    const cat = pick(cats, n)
    const sub = pick(cat.subs, n)
    const precio = tipo === 'servicio' && n % 4 === 0 ? 0 : priceBase + (n % 8) * priceStep
    const hasOffer = tipo !== 'servicio' && n % 3 === 0 && precio > 0
    const seccion =
      tipo === 'servicio' ? 'servicios' : tipo === 'arriendo' ? 'arriendos' : pick(SECCIONES, n)
    items.push({
      id: p.id * 100 + tipoOffset + n,
      user_id: p.id,
      tipo,
      nombre: `${pick(names, n)}${count > names.length ? ' ' + (n + 1) : ''}`,
      descripcion:
        `${pick(names, n)} de excelente calidad. Disponible en ${p._name}, ` +
        `Villarrica. Consultá por stock y envíos a domicilio.`,
      precio,
      precio_original: hasOffer ? Math.round(precio * 1.25) : null,
      imagen: img(pick(pool, n + p._index)),
      badge: pick(BADGES, n + p._index),
      seccion,
      categoria: cat.cat,
      categoria_id: cat.cat_id,
      subcategoria: sub.n,
      subcategoria_id: sub.id,
      banner_orden: null,
      ...(tipo === 'producto' && n % 2 === 0
        ? { genero: pick(['Hombre', 'Mujer', 'Unisex'], n), tallas: { tipo: 'ropa', seleccion: ['S', 'M', 'L', 'XL'] } }
        : {}),
      ...(tipo === 'arriendo' ? { medidas: { alto: 0, ancho: 0, profundidad: 0 } } : {}),
      ...nf,
    })
  }
  return items
}

function bannerItems(p) {
  // Solo para Premium (plan 3): ítems destacados del banner de la tienda.
  if (p.plan_id < 3 || !p.vende_productos) return []
  const nf = negocioFields(p)
  // Banner completo: 10 imágenes (2 slides de 5: principal + 4).
  return Array.from({ length: 10 }, (_, n) => ({
    id: p.id * 100 + 90 + n,
    user_id: p.id,
    tipo: 'producto',
    nombre: `Destacado ${n + 1} · ${p._name}`,
    descripcion: 'Producto destacado en el banner de la tienda.',
    precio: 19990 + (n % 5) * 5000,
    precio_original: 24990 + (n % 5) * 5000,
    imagen: img(pick(POOL.product, n + p._index)),
    badge: 'Destacado',
    seccion: 'destacados',
    categoria: 'Destacados',
    banner_orden: n + 1,
    banner_pos_x: 50,
    banner_pos_y: 50,
    banner_scale: 1,
    ...nf,
  }))
}

// Cantidad de publicaciones de ejemplo a cargar por plan (dentro del máximo permitido:
// Gratuito 5, Normal 25, Premium 100). Se reparte entre las capacidades del usuario.
const PLAN_TOTAL = { 1: 5, 2: 15, 3: 24 }

/** Todos los listings (productos+servicios+arriendos, sin banner) de un perfil. */
export function listingsFor(p) {
  if (!p) return []
  const caps = []
  if (p.vende_productos) caps.push('P')
  if (p.ofrece_servicios) caps.push('S')
  if (p.ofrece_arriendos) caps.push('A')
  if (!caps.length) return []

  // Reparte el total permitido entre las capacidades (sin exceder el límite del plan).
  const total = PLAN_TOTAL[p.plan_id] || 5
  const base = Math.floor(total / caps.length)
  let extra = total - base * caps.length
  const n = {}
  caps.forEach((c) => { n[c] = base + (extra-- > 0 ? 1 : 0) })

  const out = []
  if (n.P) out.push(...buildItems(p, 'producto', n.P, PRODUCT_NAMES, PRODUCT_CATS, POOL.product, 8990, 6000))
  if (n.S) out.push(...buildItems(p, 'servicio', n.S, SERVICE_NAMES, SERVICE_CATS, POOL.service, 15000, 8000))
  if (n.A) out.push(...buildItems(p, 'arriendo', n.A, ARRIENDO_NAMES, ARRIENDO_CATS, POOL.arriendo, 28000, 22000))
  return out
}

export function bannerListingsFor(p) {
  return p ? bannerItems(p) : []
}

/** Listings públicos del home: combina todos los perfiles generales. */
export function allListings() {
  return QA_PROFILES.filter((p) => p.tipo_cuenta === 'general').flatMap(listingsFor)
}

// ---- Turismo ----
export function toursFor(p) {
  if (!p || p.tipo_cuenta !== 'turismo') return []
  const count = p.plan_id >= 3 ? 8 : 4
  const tours = []
  for (let n = 0; n < count; n++) {
    const imagenes = [pick(POOL.tour, n), pick(POOL.tour, n + 2), pick(POOL.tour, n + 4)].map((id) => img(id))
    const precio = 18000 + (n % 6) * 9000
    tours.push({
      id: p.id * 100 + n,
      user_id: p.id,
      owner_plan_id: p.plan_id,
      empresa_nombre: p._name,
      nombre: pick(TOUR_NAMES, n),
      categoria: pick(TOUR_CATS, n),
      ubicacion: 'Villarrica',
      detalle:
        `${pick(TOUR_NAMES, n)}: experiencia guiada por la zona de Villarrica y el ` +
        `Parque Nacional Lanín. Incluye equipamiento, guía certificado y traslados. Apto para toda la familia.`,
      precio,
      precio_antes: n % 3 === 0 ? Math.round(precio * 1.3) : null,
      imagen_principal: 0,
      imagenes,
      imagenes_crop: imagenes.map(() => ({ zoom: 1, x: 0, y: 0 })),
    })
  }
  return tours
}

export function allTours() {
  return QA_PROFILES.filter((p) => p.tipo_cuenta === 'turismo').flatMap(toursFor)
}

export function turismoNegocio(p) {
  if (!p) return null
  const c = contacto(p)
  return {
    id: p.id,
    user_id: p.id,
    nombre: p._name,
    descripcion:
      `${p._name} es un operador turístico de Villarrica. Organizamos excursiones, ` +
      `trekking y actividades de aventura en la región de los lagos y el Parque Nacional Lanín.`,
    direccion: c.direccion,
    ubicacion: 'Villarrica',
    whatsapp: c.whatsapp,
    telefono: c.telefono,
    correo: c.correo,
    facebook: c.facebook,
    instagram: c.instagram,
    horarios: horariosEstandar(),
  }
}

export function paginaFor(p) {
  if (!p) return null
  return {
    id: p.id,
    user_id: p.id,
    titulo_superior: `Bienvenidos a ${p._name}`,
    texto_superior:
      'Viví la Patagonia con nosotros. Excursiones diseñadas para descubrir los paisajes más ' +
      'impresionantes de Villarrica con guías locales expertos.',
    imagen_superior: img(pick(POOL.tour, p._index)),
    crop_superior: null,
    titulo_inferior: 'Aventuras todo el año',
    texto_inferior:
      'Verano e invierno, ofrecemos actividades para todos los niveles. Reservá tu experiencia y ' +
      'creá recuerdos inolvidables en la cordillera de los Andes.',
    imagen_inferior: img(pick(POOL.tour, p._index + 3)),
    crop_inferior: null,
  }
}

export function portadaFor(p) {
  if (!p) return null
  const c = contacto(p)
  const imagenes = [pick(POOL.tour, p._index), pick(POOL.tour, p._index + 2), pick(POOL.tour, p._index + 4)].map((id) => img(id))
  return {
    id: p.id,
    usuario_id: p.id,
    nombre_negocio: p._name,
    descripcion: turismoNegocio(p).descripcion,
    imagenes,
    imagenes_crop: imagenes.map(() => null),
    categorias: pick(TURISMO_CAT_SETS, p._index),
    direccion: c.direccion,
    horarios: horariosEstandar(),
    telefono: c.telefono,
    whatsapp: c.whatsapp,
    correo: c.correo,
    facebook: c.facebook,
    instagram: c.instagram,
    plan_id: p.plan_id,
  }
}

export function allPortadas() {
  return QA_PROFILES.filter((p) => p.tipo_cuenta === 'turismo').map(portadaFor)
}

// ---- Estadísticas (analytics) ----
const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun']

export function statsFor(p) {
  if (!p) {
    return { visitas: [], clicks: [], card_clicks: [], resumen: { visitas_mes: 0, visitantes_unicos: 0, clicks_mes: 0, por_pagina: {} } }
  }
  // A mayor plan, más tráfico de ejemplo.
  const scale = p.plan_id >= 3 ? 5 : p.plan_id === 2 ? 2.5 : 1
  const seed = (p._index % 7) + 3
  const visitas = MESES.map((mes, i) => ({ mes, valor: Math.round((seed * 20 + i * seed * 9) * scale) }))
  const clicks = MESES.map((mes, i) => ({ mes, valor: Math.round(visitas[i].valor * 0.42) }))
  const card_clicks = MESES.map((mes, i) => ({ mes, valor: Math.round(visitas[i].valor * 0.30) }))
  const last = visitas[visitas.length - 1].valor
  const clicksLast = clicks[clicks.length - 1].valor
  const por_pagina =
    p.tipo_cuenta === 'turismo'
      ? {
          Inicio: Math.round(last * 0.4),
          Turismo: Math.round(last * 0.3),
          'Mi página': Math.round(last * 0.2),
          Tours: Math.round(last * 0.1),
        }
      : {
          Inicio: Math.round(last * 0.45),
          'Mi tienda': Math.round(last * 0.3),
          Productos: Math.round(last * 0.15),
          Contacto: Math.round(last * 0.1),
        }
  return {
    visitas,
    clicks,
    card_clicks,
    resumen: {
      visitas_mes: last,
      visitantes_unicos: Math.round(last * 0.68),
      clicks_mes: clicksLast,
      por_pagina,
    },
  }
}

// ---- Historial de pagos y cambios de plan ----
const PLAN_NAMES = { 1: 'Gratuito', 2: 'Normal', 3: 'Premium' }

export function historyFor(p) {
  if (!p || p.plan_id < 2) return [] // plan gratuito: sin pagos
  const planNombre = PLAN_NAMES[p.plan_id]
  const monto = p.tipo_cuenta === 'turismo' ? 5000 : p.plan_id === 2 ? 5000 : 8000
  // Pagos mensuales (más reciente primero)
  const meses = ['2026-05-01', '2026-04-01', '2026-03-01', '2026-02-01']
  const pagos = meses.map((d) => ({
    accion: 'pago',
    created_at: `${d}T10:00:00.000Z`,
    detalles: { plan_nombre: planNombre, monto },
  }))
  // Cambio de plan inicial (alta del plan pago desde Gratuito)
  const cambio = {
    accion: 'cambio_plan',
    created_at: '2026-01-15T12:00:00.000Z',
    detalles: { plan_anterior_nombre: 'Gratuito', plan_nuevo_nombre: planNombre, tipo: 'upgrade' },
  }
  return [...pagos, cambio]
}

export function countsFor(p) {
  if (!p) return { productos: 0, servicios: 0, arriendos: 0, tours: 0, portada: 0, pagina: 0, negocio: 0 }
  const ls = listingsFor(p)
  return {
    productos: ls.filter((l) => l.tipo === 'producto').length,
    servicios: ls.filter((l) => l.tipo === 'servicio').length,
    arriendos: ls.filter((l) => l.tipo === 'arriendo').length,
    tours: toursFor(p).length,
    portada: p.tipo_cuenta === 'turismo' ? 1 : 0,
    pagina: p.tipo_cuenta === 'turismo' && p.plan_id >= 3 ? 1 : 0,
    negocio: 1,
  }
}
