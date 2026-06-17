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
  local: [
    'photo-1555396273-367ea4eb4db5', 'photo-1528698827591-e19ccd7bc23d',
    'photo-1604719312566-8912e9c8a213', 'photo-1542838132-92c53300491e',
    'photo-1578662996442-48f60103fc96', 'photo-1583258292688-d0213dc5a3a8',
  ],
  evento: [
    'photo-1492684223066-81342ee5ff30', 'photo-1540575467063-178a50c2df87',
    'photo-1501281668745-f7f57925c3b4', 'photo-1516450360452-9312f5e86fc7',
    'photo-1470229722913-7c0e2dbbafd3', 'photo-1429962714451-bb934ecdc4ec',
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
    logo_size: 3,
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

// ---- Local de barrio ----
export const LOCAL_CATEGORIAS = [
  { id: 1,  nombre: 'Abarrotes / Almacén',    icono: 'local_grocery_store' },
  { id: 2,  nombre: 'Panadería / Pastelería', icono: 'bakery_dining' },
  { id: 3,  nombre: 'Farmacia',               icono: 'local_pharmacy' },
  { id: 4,  nombre: 'Carnicería / Pescadería',icono: 'egg' },
  { id: 5,  nombre: 'Frutas y Verduras',      icono: 'nutrition' },
  { id: 6,  nombre: 'Ferretería',             icono: 'hardware' },
  { id: 7,  nombre: 'Librería / Papelería',   icono: 'menu_book' },
  { id: 8,  nombre: 'Ropa y Calzado',         icono: 'checkroom' },
  { id: 9,  nombre: 'Peluquería / Barbería',  icono: 'content_cut' },
  { id: 10, nombre: 'Botillería',             icono: 'local_bar' },
]

export function miLocalFor(p) {
  if (!p) return null
  const c = contacto(p)
  return {
    id: p.id * 10,
    usuario_id: p.id,
    nombre: 'Almacén El Rincón',
    descripcion:
      'Almacén de barrio con todos los productos de primera necesidad. ' +
      'Atendemos de lunes a sábado con la mejor atención y precios convenientes para el vecino de siempre.',
    direccion: c.direccion,
    horario: 'Lunes a Viernes 09:00 - 20:00, Sábado 09:00 - 14:00',
    telefono: c.telefono,
    whatsapp: c.whatsapp,
    facebook: c.facebook,
    instagram: c.instagram,
    correo: c.correo,
    imagen:   img(pick(POOL.local, p._index)),
    imagen_2: img(pick(POOL.local, p._index + 1)),
    imagen_3: img(pick(POOL.local, p._index + 2)),
    categoria_barrio_id: 1,
    categoria_nombre: 'Abarrotes',
    categoria_icono: 'local_grocery_store',
    lat: -39.2849,
    lng: -72.2240,
  }
}

// ---- Organizador de eventos ----
export const EVENTO_CATEGORIAS = [
  { id: 1,  nombre: 'Música',        icono: 'music_note' },
  { id: 2,  nombre: 'Gastronomía',   icono: 'restaurant' },
  { id: 3,  nombre: 'Cultura',       icono: 'theater_comedy' },
  { id: 4,  nombre: 'Artesanía',     icono: 'handyman' },
  { id: 5,  nombre: 'Deporte',       icono: 'sports_soccer' },
  { id: 6,  nombre: 'Familiar',      icono: 'family_restroom' },
  { id: 7,  nombre: 'Nocturno',      icono: 'nightlife' },
  { id: 8,  nombre: 'Ferias',        icono: 'storefront' },
  { id: 9,  nombre: 'Educación',     icono: 'school' },
  { id: 10, nombre: 'Beneficencia',  icono: 'volunteer_activism' },
]

const EVENTOS_DEMO = [
  { titulo: 'Feria Artesanal Villarrica', fecha: '2026-07-15', ubicacion: 'Plaza Central, Villarrica', precio: 'Entrada libre', horario: '10:00 - 20:00', categoria_id: 8 },
  { titulo: 'Festival de Música Patagonia', fecha: '2026-08-01', ubicacion: 'Anfiteatro Municipal', precio: '$5.000', horario: '20:00 - 00:00', categoria_id: 1 },
  { titulo: 'Encuentro Gastronómico SMA', fecha: '2026-05-20', ubicacion: 'Costanera del Lago', precio: 'Entrada libre', horario: '12:00 - 22:00', categoria_id: 2 },
]

export function misEventosFor(p) {
  if (!p) return []
  const c = contacto(p)
  return EVENTOS_DEMO.map((ev, j) => ({
    id: p.id * 100 + j,
    usuario_id: p.id,
    titulo: ev.titulo,
    descripcion:
      `${ev.titulo}: un evento imperdible en la región. ` +
      `Ven a disfrutar con toda la familia de esta experiencia única en el corazón de la Patagonia.`,
    fecha: ev.fecha,
    horario: ev.horario,
    ubicacion: ev.ubicacion,
    precio: ev.precio,
    telefono: c.telefono,
    whatsapp: c.whatsapp,
    organizador: p._name,
    imagen:   img(pick(POOL.evento, p._index + j)),
    imagen_2: img(pick(POOL.evento, p._index + j + 1)),
    imagen_3: img(pick(POOL.evento, p._index + j + 2)),
    categoria_evento_id: ev.categoria_id,
    categoria_nombre: ev.titulo.includes('Feria') ? 'Ferias' : ev.titulo.includes('Música') ? 'Música' : 'Gastronomía',
  }))
}

// ---- Locales y Eventos públicos (StoresPage / EventsPage) ----
const ALL_LOCALES_RAW = [
  { nombre: 'Almacén El Rincón',      cat: 'Abarrotes',  cat_id: 1,  cat_icono: 'local_grocery_store',
    descripcion: 'Almacén de barrio con todos los productos de primera necesidad, bebidas y lácteos frescos.',
    direccion: 'Pasaje Los Pinos 15, Villarrica', horario: 'Lun-Sáb 08:00-20:00',
    telefono: '+56 9 7800 0001', whatsapp: '+56 9 7800 0001',
    facebook: 'https://facebook.com/almacenrincon', instagram: '@almacenrincon', correo: 'info@almacenrincon.cl',
    lat: -39.2849, lng: -72.2240,
    imgs: ['photo-1604719312566-8912e9c8a213','photo-1555396273-367ea4eb4db5','photo-1542838132-92c53300491e'] },
  { nombre: 'Panadería La Cabaña',    cat: 'Panadería',  cat_id: 2,  cat_icono: 'bakery_dining',
    descripcion: 'Pan artesanal horneado cada mañana. Hallullas, marraquetas y tortas especiales para toda ocasión.',
    direccion: 'Calle Caupolican 230, Villarrica', horario: 'Lun-Dom 07:00-14:00',
    telefono: '+56 9 7800 0002', whatsapp: '+56 9 7800 0002',
    facebook: 'https://facebook.com/panaderiacabana', instagram: '@panaderiacabana', correo: 'pan@lacabana.cl',
    lat: -39.2865, lng: -72.2255,
    imgs: ['photo-1528698827591-e19ccd7bc23d','photo-1583258292688-d0213dc5a3a8','photo-1604719312566-8912e9c8a213'] },
  { nombre: 'Farmacia del Lago',      cat: 'Farmacia',   cat_id: 3,  cat_icono: 'local_pharmacy',
    descripcion: 'Medicamentos, vitaminas y atención farmacéutica personalizada. Delivery disponible en la ciudad.',
    direccion: 'Av. Pedro de Valdivia 88, Villarrica', horario: 'Lun-Sáb 09:00-21:00',
    telefono: '+56 9 7800 0003', whatsapp: '+56 9 7800 0003',
    facebook: 'https://facebook.com/farmaciadellago', instagram: '@farmaciadellago', correo: 'info@farmaciadellago.cl',
    lat: -39.2840, lng: -72.2270,
    imgs: ['photo-1578662996442-48f60103fc96','photo-1555396273-367ea4eb4db5','photo-1583258292688-d0213dc5a3a8'] },
  { nombre: 'Ferretería Andina',      cat: 'Ferretería', cat_id: 4,  cat_icono: 'hardware',
    descripcion: 'Herramientas, materiales de construcción y todo para el hogar. Servicio técnico incluido.',
    direccion: 'Ruta 199 km 2, Villarrica', horario: 'Lun-Vie 08:30-18:30, Sáb 09:00-13:00',
    telefono: '+56 9 7800 0004', whatsapp: '+56 9 7800 0004',
    facebook: 'https://facebook.com/ferreteriaandina', instagram: '@ferreteriaandina', correo: 'ventas@ferreteriaandina.cl',
    lat: -39.2875, lng: -72.2225,
    imgs: ['photo-1542838132-92c53300491e','photo-1604719312566-8912e9c8a213','photo-1578662996442-48f60103fc96'] },
  { nombre: 'Restorán Los Arrayanes', cat: 'Comida',     cat_id: 5,  cat_icono: 'restaurant',
    descripcion: 'Cocina patagónica con vista al lago. Trucha ahumada, cordero al palo y empanadas caseras.',
    direccion: 'Costanera Koerner 400, Villarrica', horario: 'Mar-Dom 12:00-22:00',
    telefono: '+56 9 7800 0005', whatsapp: '+56 9 7800 0005',
    facebook: 'https://facebook.com/losarrayanes.vca', instagram: '@losarrayanesvca', correo: 'reservas@losarrayanes.cl',
    lat: -39.2830, lng: -72.2290,
    imgs: ['photo-1555396273-367ea4eb4db5','photo-1583258292688-d0213dc5a3a8','photo-1542838132-92c53300491e'] },
  { nombre: 'Peluquería Andes Style', cat: 'Peluquería', cat_id: 6,  cat_icono: 'content_cut',
    descripcion: 'Cortes, tintes y tratamientos capilares para toda la familia con productos premium.',
    direccion: 'Calle Aldunate 155, Villarrica', horario: 'Mar-Sáb 09:00-19:00',
    telefono: '+56 9 7800 0006', whatsapp: '+56 9 7800 0006',
    facebook: 'https://facebook.com/andesstyle.vca', instagram: '@andesstyle.vca', correo: 'reservas@andesstyle.cl',
    lat: -39.2855, lng: -72.2260,
    imgs: ['photo-1583258292688-d0213dc5a3a8','photo-1578662996442-48f60103fc96','photo-1555396273-367ea4eb4db5'] },
  { nombre: 'Floristería Primavera',  cat: 'Florería',   cat_id: 7,  cat_icono: 'local_florist',
    descripcion: 'Ramos, coronas y arreglos florales para toda ocasión. Envíos a domicilio todos los días.',
    direccion: 'Av. Anfión Muñoz 320, Villarrica', horario: 'Lun-Sáb 09:00-18:00',
    telefono: '+56 9 7800 0007', whatsapp: '+56 9 7800 0007',
    facebook: 'https://facebook.com/primaveraflores', instagram: '@primaveraflores', correo: 'floreria@primavera.cl',
    lat: -39.2844, lng: -72.2280,
    imgs: ['photo-1528698827591-e19ccd7bc23d','photo-1542838132-92c53300491e','photo-1604719312566-8912e9c8a213'] },
  { nombre: 'Bazar Del Sur',          cat: 'Bazar',      cat_id: 8,  cat_icono: 'storefront',
    descripcion: 'Artículos para el hogar, cocina, decoración y regalos. Variedad y precios accesibles.',
    direccion: 'Calle Epulef 70, Villarrica', horario: 'Lun-Sáb 10:00-19:00',
    telefono: '+56 9 7800 0008', whatsapp: '+56 9 7800 0008',
    facebook: 'https://facebook.com/bazardelsur.vca', instagram: '@bazardelsur', correo: 'info@bazardelsur.cl',
    lat: -39.2870, lng: -72.2245,
    imgs: ['photo-1604719312566-8912e9c8a213','photo-1555396273-367ea4eb4db5','photo-1528698827591-e19ccd7bc23d'] },
  { nombre: 'Mascotería Patagonia',   cat: 'Mascotas',   cat_id: 9,  cat_icono: 'pets',
    descripcion: 'Alimentos balanceados, accesorios y cuidado veterinario para tus mascotas.',
    direccion: 'Calle General Körner 210, Villarrica', horario: 'Lun-Sáb 09:30-19:30',
    telefono: '+56 9 7800 0009', whatsapp: '+56 9 7800 0009',
    facebook: 'https://facebook.com/mascoteriapatagonia', instagram: '@mascoteriapatagonia', correo: 'info@mascoteriapatagonia.cl',
    lat: -39.2860, lng: -72.2235,
    imgs: ['photo-1583258292688-d0213dc5a3a8','photo-1604719312566-8912e9c8a213','photo-1578662996442-48f60103fc96'] },
  { nombre: 'Lavandería Express',     cat: 'Lavandería', cat_id: 10, cat_icono: 'local_laundry_service',
    descripcion: 'Lavado y planchado al día. Retiro y entrega a domicilio disponible en toda la ciudad.',
    direccion: 'Pasaje Raulí 8, Villarrica', horario: 'Lun-Sáb 08:00-20:00',
    telefono: '+56 9 7800 0010', whatsapp: '+56 9 7800 0010',
    facebook: 'https://facebook.com/lavanderiaexpress.vca', instagram: '@lavanderiaexpress', correo: 'lavanderia@express.cl',
    lat: -39.2880, lng: -72.2265,
    imgs: ['photo-1542838132-92c53300491e','photo-1578662996442-48f60103fc96','photo-1583258292688-d0213dc5a3a8'] },
]

export function allLocales() {
  return ALL_LOCALES_RAW.map((l, i) => ({
    id: 8000 + i + 1,
    usuario_id: null,
    nombre:      l.nombre,
    descripcion: l.descripcion,
    direccion:   l.direccion,
    horario:     l.horario,
    telefono:    l.telefono,
    whatsapp:    l.whatsapp,
    facebook:    l.facebook,
    instagram:   l.instagram,
    correo:      l.correo,
    imagen:      img(l.imgs[0]),
    imagen_2:    img(l.imgs[1]),
    imagen_3:    img(l.imgs[2]),
    categoria_barrio_id: l.cat_id,
    categoria_nombre:    l.cat,
    categoria_icono:     l.cat_icono,
    lat:    l.lat,
    lng:    l.lng,
    activo: 1,
  }))
}

const ALL_EVENTOS_RAW = [
  { titulo: 'Feria Artesanal Villarrica',    cat: 'Ferias',      cat_id: 8,
    fecha: '2026-07-15', horario: '10:00 - 20:00', ubicacion: 'Plaza Central de Villarrica',
    precio: 'Entrada libre', organizador: 'Municipalidad de Villarrica',
    telefono: '+56 9 7900 0001', whatsapp: '+56 9 7900 0001',
    descripcion: 'La feria artesanal más grande de la región con más de 100 expositores de artesanía local, textiles y gastronomía.',
    imgs: ['photo-1492684223066-81342ee5ff30','photo-1540575467063-178a50c2df87','photo-1501281668745-f7f57925c3b4'] },
  { titulo: 'Festival de Música Patagonia',  cat: 'Música',      cat_id: 1,
    fecha: '2026-08-01', horario: '20:00 - 00:00', ubicacion: 'Anfiteatro Municipal, Villarrica',
    precio: '$5.000', organizador: 'Cultura SMA',
    telefono: '+56 9 7900 0002', whatsapp: '+56 9 7900 0002',
    descripcion: 'Música en vivo de artistas locales y nacionales en el corazón de la Patagonia. Una noche para no olvidar.',
    imgs: ['photo-1470229722913-7c0e2dbbafd3','photo-1429962714451-bb934ecdc4ec','photo-1516450360452-9312f5e86fc7'] },
  { titulo: 'Encuentro Gastronómico Andino', cat: 'Gastronomía', cat_id: 2,
    fecha: '2026-07-20', horario: '12:00 - 22:00', ubicacion: 'Costanera del Lago, Villarrica',
    precio: 'Entrada libre', organizador: 'Asociación Gastronómica Regional',
    telefono: '+56 9 7900 0003', whatsapp: '+56 9 7900 0003',
    descripcion: 'Degustá lo mejor de la cocina patagónica con más de 30 restaurantes y productores locales reunidos.',
    imgs: ['photo-1501281668745-f7f57925c3b4','photo-1492684223066-81342ee5ff30','photo-1540575467063-178a50c2df87'] },
  { titulo: 'Torneo de Fútbol Barrial',       cat: 'Deporte',    cat_id: 5,
    fecha: '2026-07-28', horario: '09:00 - 18:00', ubicacion: 'Estadio Municipal Norte',
    precio: 'Entrada libre', organizador: 'Club Deportivo Villarrica',
    telefono: '+56 9 7900 0004', whatsapp: '+56 9 7900 0004',
    descripcion: 'El torneo de fútbol más querido de la ciudad reúne a 16 equipos barriales en una jornada llena de emoción.',
    imgs: ['photo-1516450360452-9312f5e86fc7','photo-1501281668745-f7f57925c3b4','photo-1470229722913-7c0e2dbbafd3'] },
  { titulo: 'Muestra de Arte Local',          cat: 'Cultura',    cat_id: 3,
    fecha: '2026-08-10', horario: '10:00 - 19:00', ubicacion: 'Centro Cultural Municipal',
    precio: 'Entrada libre', organizador: 'Centro Cultural',
    telefono: '+56 9 7900 0005', whatsapp: '+56 9 7900 0005',
    descripcion: 'Pinturas, esculturas y fotografía de artistas locales que interpretan la naturaleza y vida patagónica.',
    imgs: ['photo-1492684223066-81342ee5ff30','photo-1516450360452-9312f5e86fc7','photo-1429962714451-bb934ecdc4ec'] },
  { titulo: 'Noche de Peñas Folclóricas',     cat: 'Nocturno',   cat_id: 7,
    fecha: '2026-07-25', horario: '21:00 - 02:00', ubicacion: 'Club Social Villarrica',
    precio: '$3.000', organizador: 'Peñas del Sur',
    telefono: '+56 9 7900 0006', whatsapp: '+56 9 7900 0006',
    descripcion: 'Una noche de música folclórica con cueca, tonadas y zamacueca. Cena incluida en el precio de la entrada.',
    imgs: ['photo-1540575467063-178a50c2df87','photo-1470229722913-7c0e2dbbafd3','photo-1492684223066-81342ee5ff30'] },
  { titulo: 'Feria del Libro y Familia',      cat: 'Familiar',   cat_id: 6,
    fecha: '2026-08-05', horario: '10:00 - 18:00', ubicacion: 'Biblioteca Municipal',
    precio: 'Entrada libre', organizador: 'Biblioteca Pública',
    telefono: '+56 9 7900 0007', whatsapp: '+56 9 7900 0007',
    descripcion: 'Libros, talleres, cuentacuentos y actividades para toda la familia. Entrada libre para niños y adultos.',
    imgs: ['photo-1429962714451-bb934ecdc4ec','photo-1501281668745-f7f57925c3b4','photo-1540575467063-178a50c2df87'] },
]

export function allEventos() {
  return ALL_EVENTOS_RAW.map((e, i) => ({
    id: 8100 + i + 1,
    usuario_id: null,
    titulo:      e.titulo,
    descripcion: e.descripcion,
    fecha:       e.fecha,
    horario:     e.horario,
    ubicacion:   e.ubicacion,
    precio:      e.precio,
    telefono:    e.telefono,
    whatsapp:    e.whatsapp,
    organizador: e.organizador,
    imagen:      img(e.imgs[0]),
    imagen_2:    img(e.imgs[1]),
    imagen_3:    img(e.imgs[2]),
    categoria_evento_id: e.cat_id,
    categoria_nombre:    e.cat,
    categoria_icono:     null,
    activo: 1,
  }))
}
