/**
 * seed-qa.mjs — Crea los usuarios QA en la BD local con datos completos.
 *
 * Uso:  node backend/seed-qa.mjs
 *       (desde la raíz del proyecto, con MySQL corriendo y la BD importada)
 *
 * Idempotente: si el usuario ya existe (por email), lo omite.
 */

import 'dotenv/config'
import bcrypt from 'bcrypt'
import mysql  from 'mysql2/promise'

// ─── Datos copiados de qaUsers.js ────────────────────────────────────────────
const QA_PASSWORD = 'Dev1234!'

const QA_USERS = [
  // General Plan 1
  { email: 'gen_p1_p@qa.dev',   nombre: 'P1 · Productos',    tipo: 'general', plan: 1, caps: ['P'] },
  { email: 'gen_p1_s@qa.dev',   nombre: 'P1 · Servicios',    tipo: 'general', plan: 1, caps: ['S'] },
  { email: 'gen_p1_a@qa.dev',   nombre: 'P1 · Arriendos',    tipo: 'general', plan: 1, caps: ['A'] },
  { email: 'gen_p1_ps@qa.dev',  nombre: 'P1 · Prod+Serv',    tipo: 'general', plan: 1, caps: ['P','S'] },
  { email: 'gen_p1_pa@qa.dev',  nombre: 'P1 · Prod+Arr',     tipo: 'general', plan: 1, caps: ['P','A'] },
  { email: 'gen_p1_sa@qa.dev',  nombre: 'P1 · Serv+Arr',     tipo: 'general', plan: 1, caps: ['S','A'] },
  { email: 'gen_p1_psa@qa.dev', nombre: 'P1 · Todos',        tipo: 'general', plan: 1, caps: ['P','S','A'] },
  // General Plan 2
  { email: 'gen_p2_p@qa.dev',   nombre: 'P2 · Productos',    tipo: 'general', plan: 2, caps: ['P'] },
  { email: 'gen_p2_s@qa.dev',   nombre: 'P2 · Servicios',    tipo: 'general', plan: 2, caps: ['S'] },
  { email: 'gen_p2_a@qa.dev',   nombre: 'P2 · Arriendos',    tipo: 'general', plan: 2, caps: ['A'] },
  { email: 'gen_p2_ps@qa.dev',  nombre: 'P2 · Prod+Serv',    tipo: 'general', plan: 2, caps: ['P','S'] },
  { email: 'gen_p2_pa@qa.dev',  nombre: 'P2 · Prod+Arr',     tipo: 'general', plan: 2, caps: ['P','A'] },
  { email: 'gen_p2_sa@qa.dev',  nombre: 'P2 · Serv+Arr',     tipo: 'general', plan: 2, caps: ['S','A'] },
  { email: 'gen_p2_psa@qa.dev', nombre: 'P2 · Todos',        tipo: 'general', plan: 2, caps: ['P','S','A'] },
  // General Plan 3
  { email: 'gen_p3_p@qa.dev',   nombre: 'P3 · Productos',    tipo: 'general', plan: 3, caps: ['P'] },
  { email: 'gen_p3_s@qa.dev',   nombre: 'P3 · Servicios',    tipo: 'general', plan: 3, caps: ['S'] },
  { email: 'gen_p3_a@qa.dev',   nombre: 'P3 · Arriendos',    tipo: 'general', plan: 3, caps: ['A'] },
  { email: 'gen_p3_ps@qa.dev',  nombre: 'P3 · Prod+Serv',    tipo: 'general', plan: 3, caps: ['P','S'] },
  { email: 'gen_p3_pa@qa.dev',  nombre: 'P3 · Prod+Arr',     tipo: 'general', plan: 3, caps: ['P','A'] },
  { email: 'gen_p3_sa@qa.dev',  nombre: 'P3 · Serv+Arr',     tipo: 'general', plan: 3, caps: ['S','A'] },
  { email: 'gen_p3_psa@qa.dev', nombre: 'P3 · Todos',        tipo: 'general', plan: 3, caps: ['P','S','A'] },
  // Turismo
  { email: 'tur_p1@qa.dev',     nombre: 'Turismo Gratis',    tipo: 'turismo', plan: 1, caps: [] },
  { email: 'tur_p3@qa.dev',     nombre: 'Turismo Premium',   tipo: 'turismo', plan: 5, caps: [] },
  { email: 'tur_p3_b@qa.dev',   nombre: 'Turismo Premium 2', tipo: 'turismo', plan: 5, caps: [] },
  { email: 'tur_p1_b@qa.dev',   nombre: 'Turismo Gratis 2',  tipo: 'turismo', plan: 1, caps: [] },
  { email: 'tur_p3_c@qa.dev',   nombre: 'Turismo Premium 3', tipo: 'turismo', plan: 5, caps: [] },
  { email: 'tur_p3_d@qa.dev',   nombre: 'Turismo Premium 4', tipo: 'turismo', plan: 5, caps: [] },
  { email: 'tur_p1_c@qa.dev',   nombre: 'Turismo Gratis 3',  tipo: 'turismo', plan: 1, caps: [] },
  { email: 'tur_p3_e@qa.dev',   nombre: 'Turismo Premium 5', tipo: 'turismo', plan: 5, caps: [] },
  // Local de barrio
  { email: 'local_p1@qa.dev',  nombre: 'Almacén El Rincón', tipo: 'local',   plan: 1, caps: [] },
  // Organizador de eventos
  { email: 'evento_p1@qa.dev', nombre: 'Eventos Patagonia', tipo: 'evento',  plan: 1, caps: [] },
]

// ─── Datos de muestra ─────────────────────────────────────────────────────────
const NAMES = [
  'Almacén Patagonia', 'Rincón Andino', 'Tienda Lácar', 'Estilo Lanín',
  'Cumbre Outdoor', 'Bazar del Sur', 'Nieve y Bosque', 'Aire Libre SMA',
  'Refugio del Lago', 'Sendero Sur', 'Quila Diseño', 'Pehuén Hogar',
  'Chapelco Sport', 'Maitén Deco', 'Lago Azul Store', 'Vega Maipú',
  'Ruta 40 Market', 'Bosque Nativo', 'Andes Express', 'Volcán Tienda',
]
const TURISMO_NAMES = [
  'Patagonia Aventura', 'Lácar Expediciones', 'Lanín Outdoor', 'Andes Trekking',
  'Hua Hum Rafting', 'Chapelco Tours', 'Bandurrias Excursiones', 'Lago Azul Kayak',
]
const SLOGANS = [
  'Lo mejor de la Patagonia, a un click',
  'Calidad y calidez del sur',
  'Tu tienda local de confianza',
  'Productos pensados para la montaña',
  'Aventura, hogar y estilo',
  'Hecho con identidad patagónica',
]
const DIAS = ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo']
const horariosStd = DIAS.map((dia, i) => ({
  dia, activo: i < 6, apertura: i===5?'10:00':'09:00', cierre: i===5?'14:00':'19:00',
}))

const UNSPLASH = (id, w=800) => `https://images.unsplash.com/${id}?w=${w}&q=80`

const IMG = {
  product: [
    'photo-1521572163474-6864f9cf17ab','photo-1542291026-7eec264c27ff',
    'photo-1523275335684-37898b6baf30','photo-1505740420928-5e560c06d30e',
    'photo-1526045612212-70caf35c14df','photo-1556909114-44e3e70034e2',
    'photo-1560066984-138dadb4c035','photo-1555041469-a586c61ea9bc',
    'photo-1544161515-4ab6ce6db874','photo-1576871337632-b9aef4c17ab9',
  ],
  service: [
    'photo-1487754180451-c456f719a1fc','photo-1542744173-8e7e53415bb0',
    'photo-1554048612-b6a482bc67e5','photo-1551698618-1dfe5d97d256',
    'photo-1509062522246-3755977927d7','photo-1543589077-47d81606c1bf',
  ],
  arriendo: [
    'photo-1564013799919-ab600027ffc6','photo-1497366216548-37526070297c',
    'photo-1502672260266-1c1ef2d93688','photo-1520219306100-ec4afeeefe58',
    'photo-1510798831971-661eb04b3739','photo-1544551763-46a013bb70d5',
  ],
  tour: [
    'photo-1551632811-561732d1e306','photo-1506905925346-21bda4d32df4',
    'photo-1501785888041-af3ef285b470','photo-1504309092620-4d0ec726efa4',
    'photo-1472745942893-4b9f730c7668','photo-1530866707318-0761c37bc3be',
    'photo-1519331379826-f10be5486c6f','photo-1464822759023-fed622ff2c3b',
  ],
  logo: [
    'photo-1441986300917-64674bd600d8','photo-1497366216548-37526070297c',
    'photo-1556909114-44e3e70034e2','photo-1506905925346-21bda4d32df4',
  ],
}
const pick = (arr, n) => arr[((n % arr.length) + arr.length) % arr.length]

const PRODUCT_DATA = [
  { nombre: 'Polera Patagonia',          precio: 12900, seccion: 'destacados', badge: 'Nuevo',    cat: 'Ropa y Calzado', sub: 'Poleras' },
  { nombre: 'Zapatillas Trekking Andes', precio: 59900, seccion: 'ofertas',    badge: '-20%',     cat: 'Deporte',        sub: 'Trekking' },
  { nombre: 'Campera Térmica Lanín',     precio: 84900, seccion: 'novedades',  badge: null,       cat: 'Ropa y Calzado', sub: 'Abrigos' },
  { nombre: 'Mochila Outdoor 40L',       precio: 39900, seccion: 'tecnologia', badge: 'Destacado',cat: 'Deporte',        sub: 'Camping' },
  { nombre: 'Gorro de Lana Tejido',      precio: 8900,  seccion: 'tendencia',  badge: null,       cat: 'Ropa y Calzado', sub: 'Poleras' },
  { nombre: 'Termo de Acero 1L',         precio: 14900, seccion: 'novedades',  badge: null,       cat: 'Hogar',          sub: 'Cocina' },
  { nombre: 'Set de Mates Artesanal',    precio: 22900, seccion: 'destacados', badge: null,       cat: 'Hogar',          sub: 'Decoración' },
  { nombre: 'Linterna LED Recargable',   precio: 11900, seccion: 'tecnologia', badge: null,       cat: 'Tecnología',     sub: 'Accesorios' },
  { nombre: 'Buzo Polar Unisex',         precio: 32900, seccion: 'liquidacion',badge: 'Oferta',   cat: 'Ropa y Calzado', sub: 'Abrigos' },
  { nombre: 'Guantes de Montaña',        precio: 9900,  seccion: 'tendencia',  badge: null,       cat: 'Ropa y Calzado', sub: 'Abrigos' },
  { nombre: 'Lentes de Sol UV400',       precio: 17900, seccion: 'destacados', badge: null,       cat: 'Deporte',        sub: 'Camping' },
  { nombre: 'Cuchillo de Camping',       precio: 24900, seccion: 'novedades',  badge: 'Nuevo',    cat: 'Deporte',        sub: 'Camping' },
]
const SERVICE_DATA = [
  { nombre: 'Corte y Peinado',               precio: 8900,  seccion: 'servicios', cat: 'Belleza y Bienestar', sub: 'Peluquería' },
  { nombre: 'Masaje Descontracturante',       precio: 14900, seccion: 'servicios', cat: 'Belleza y Bienestar', sub: 'Spa' },
  { nombre: 'Reparación Eléctrica',          precio: 19900, seccion: 'servicios', cat: 'Hogar y Reparaciones', sub: 'Electricidad' },
  { nombre: 'Clases de Inglés',              precio: 9900,  seccion: 'servicios', cat: 'Clases',             sub: 'Idiomas' },
  { nombre: 'Sesión de Fotografía',          precio: 39900, seccion: 'servicios', cat: 'Clases',             sub: 'Música' },
  { nombre: 'Instalación de Gasfitería',     precio: 24900, seccion: 'servicios', cat: 'Hogar y Reparaciones', sub: 'Gasfitería' },
]
const ARRIENDO_DATA = [
  { nombre: 'Cabaña frente al Lago Lácar',  precio: 89900, seccion: 'arriendos', cat: 'Alojamiento', sub: 'Cabañas' },
  { nombre: 'Departamento en el Centro',    precio: 59900, seccion: 'arriendos', cat: 'Alojamiento', sub: 'Departamentos' },
  { nombre: 'Pickup 4x4 Doble Cabina',      precio: 44900, seccion: 'arriendos', cat: 'Vehículos',   sub: 'Autos' },
  { nombre: 'Bicicleta de Montaña',         precio: 14900, seccion: 'arriendos', cat: 'Vehículos',   sub: 'Bicicletas' },
  { nombre: 'Equipo de Esquí Completo',     precio: 29900, seccion: 'arriendos', cat: 'Equipos',     sub: 'Esquí' },
  { nombre: 'Carpa 4 Personas',             precio: 9900,  seccion: 'arriendos', cat: 'Equipos',     sub: 'Camping' },
]
const LOCAL_DATA = {
  nombre:      'Almacén El Rincón',
  descripcion: 'Almacén de barrio con todos los productos de primera necesidad. Atendemos de lunes a sábado con la mejor atención y precios convenientes.',
  horario:     'Lunes a Viernes 09:00 - 20:00, Sábado 09:00 - 14:00',
  categoria_id: 1,
  imgs: [
    'photo-1555396273-367ea4eb4db5',
    'photo-1528698827591-e19ccd7bc23d',
    'photo-1604719312566-8912e9c8a213',
  ],
}
const EVENTO_DATA_SEED = [
  { titulo: 'Feria Artesanal Villarrica',    fecha: '2026-07-15', ubicacion: 'Plaza Central, Villarrica', precio: 'Entrada libre', horario: '10:00 - 20:00', organizador: 'Eventos Patagonia', categoria_id: 8, imgs: ['photo-1492684223066-81342ee5ff30','photo-1540575467063-178a50c2df87','photo-1501281668745-f7f57925c3b4'] },
  { titulo: 'Festival de Música Patagonia',  fecha: '2026-08-01', ubicacion: 'Anfiteatro Municipal',      precio: '$5.000',        horario: '20:00 - 00:00', organizador: 'Eventos Patagonia', categoria_id: 1, imgs: ['photo-1516450360452-9312f5e86fc7','photo-1470229722913-7c0e2dbbafd3','photo-1429962714451-bb934ecdc4ec'] },
  { titulo: 'Encuentro Gastronómico SMA',    fecha: '2026-05-20', ubicacion: 'Costanera del Lago',        precio: 'Entrada libre', horario: '12:00 - 22:00', organizador: 'Eventos Patagonia', categoria_id: 2, imgs: ['photo-1501281668745-f7f57925c3b4','photo-1492684223066-81342ee5ff30','photo-1516450360452-9312f5e86fc7'] },
]

const TOUR_DATA = [
  { nombre: 'Ascenso al Volcán Lanín',  precio: 49900, cat: 'Aventura',    ubicacion: 'Parque Nacional Lanín' },
  { nombre: 'Trekking Lago Lácar',      precio: 29900, cat: 'Naturaleza',  ubicacion: 'Lago Lácar, San Martín de los Andes' },
  { nombre: 'Rafting Río Hua Hum',      precio: 39900, cat: 'Agua',        ubicacion: 'Río Hua Hum, Neuquén' },
  { nombre: 'Cabalgata Andina',         precio: 34900, cat: 'Aventura',    ubicacion: 'Alrededores de Junín de los Andes' },
  { nombre: 'Kayak en el Lago',         precio: 24900, cat: 'Agua',        ubicacion: 'Lago Lácar' },
  { nombre: 'Cascada Chachín',          precio: 19900, cat: 'Naturaleza',  ubicacion: 'Parque Nacional Lanín' },
  { nombre: 'Mirador Bandurrias',       precio: 14900, cat: 'Naturaleza',  ubicacion: 'San Martín de los Andes' },
  { nombre: 'Bosque de Arrayanes',      precio: 22900, cat: 'Cultural',    ubicacion: 'Puerto Manzano, Neuquén' },
]
const TURISMO_CAT_SETS = [
  ['Aventura','Naturaleza','Familiar'],
  ['Trekking','Montaña','Aventura'],
  ['Agua','Kayak','Rafting'],
  ['Cultural','Naturaleza','Familiar'],
  ['Cabalgatas','Aventura','Montaña'],
]

// ─── Cantidad de listings por plan ───────────────────────────────────────────
const COUNT_BY_PLAN = { 1: 5, 2: 8, 3: 12 }

// ─── Main ─────────────────────────────────────────────────────────────────────
const pool = mysql.createPool({
  host:     process.env.DB_HOST || '127.0.0.1',
  port:     Number(process.env.DB_PORT) || 3306,
  user:     process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'unclik',
  waitForConnections: true,
  connectionLimit: 5,
})

async function main() {
  console.log('🌱 Generando hash de contraseña QA...')
  const hash = await bcrypt.hash(QA_PASSWORD, 10)

  // Eliminar usuarios QA existentes (por email) para re-insertarlos con IDs 9001-9028
  console.log('🗑  Limpiando usuarios QA existentes...')
  for (const qa of QA_USERS) {
    const [[row]] = await pool.query('SELECT id FROM usuarios WHERE email = ?', [qa.email])
    if (row) {
      await pool.query('DELETE FROM usuarios WHERE id = ?', [row.id])
      console.log(`  🗑  Eliminado ID=${row.id} (${qa.email})`)
    }
  }

  const turUsers = QA_USERS.filter(u => u.tipo === 'turismo')
  let created = 0

  for (let i = 0; i < QA_USERS.length; i++) {
    const qa = QA_USERS[i]
    const isTur = qa.tipo === 'turismo'
    const turIdx = isTur ? turUsers.indexOf(qa) : 0
    const negName = isTur ? TURISMO_NAMES[turIdx % TURISMO_NAMES.length] : NAMES[i % NAMES.length]
    const slogan  = SLOGANS[i % SLOGANS.length]
    // IDs 9001-9029 para gen_*/tur_*, 9100+ para local/evento (evita conflictos con usuarios reales)
    const uid = (qa.tipo === 'local' || qa.tipo === 'evento')
      ? 9100 + QA_USERS.filter((u, j) => j < i && (u.tipo === 'local' || u.tipo === 'evento')).length
      : 9001 + i

    // ── Insertar usuario con ID explícito ──────────────────────────────────
    await pool.query(
      `INSERT INTO usuarios
         (id, nombre, email, password_hash, rol, tipo_cuenta, plan_id,
          vende_productos, ofrece_servicios, ofrece_arriendos,
          telefono, direccion, comuna, activo)
       VALUES (?, ?, ?, ?, 'usuario', ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [
        uid,
        negName,
        qa.email,
        hash,
        qa.tipo === 'turismo' ? 'turismo' : 'general',
        qa.plan,
        qa.caps.includes('P') ? 1 : 0,
        qa.caps.includes('S') ? 1 : 0,
        qa.caps.includes('A') ? 1 : 0,
        '+56 9 ' + String(i * 1111111 + 90000000),
        'Av. San Martín ' + (100 + i * 50),
        'San Martín de los Andes',
      ]
    )

    // ── Insertar negocio ───────────────────────────────────────────────────
    await pool.query(
      `INSERT INTO negocios
         (usuario_id, nombre_negocio, slogan, descripcion, direccion,
          whatsapp, telefono, correo, facebook, instagram, horarios, logo_url,
          header_preset, header_color)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        uid,
        negName,
        slogan,
        `Bienvenido a ${negName}. Somos una tienda local ubicada en San Martín de los Andes, ofreciendo productos de calidad con identidad patagónica.`,
        'Av. San Martín ' + (100 + i * 50) + ', San Martín de los Andes',
        '+56 9 ' + String(i * 1111111 + 90000000),
        '+56 9 ' + String(i * 1111111 + 90000000),
        'contacto@' + qa.email.split('@')[0] + '.cl',
        'fb.com/' + qa.email.split('@')[0],
        'instagram.com/' + qa.email.split('@')[0],
        JSON.stringify(horariosStd),
        UNSPLASH(pick(IMG.logo, i), 400),
        ['marca','foto','degradado','oscuro'][i % 4],
        ['#1e293b','#0E7490','#3B1969','#B45309','#1E3A8A','#BE123C'][i % 6],
      ]
    )

    // ── Listings por caps ──────────────────────────────────────────────────
    const totalProd = COUNT_BY_PLAN[qa.plan] || 5
    let listCount = 0

    if (qa.caps.includes('P')) {
      const qty = Math.min(Math.ceil(totalProd * 0.5), PRODUCT_DATA.length)
      for (let j = 0; j < qty; j++) {
        const p = PRODUCT_DATA[(i + j) % PRODUCT_DATA.length]
        await pool.query(
          `INSERT INTO tb_listings (usuario_id, tipo, seccion, nombre, descripcion, precio, categoria, subcategoria, badge, imagen)
           VALUES (?, 'producto', ?, ?, ?, ?, ?, ?, ?, ?)`,
          [uid, p.seccion, p.nombre, `${p.nombre} de alta calidad, ideal para la montaña.`, p.precio, p.cat, p.sub, p.badge, UNSPLASH(pick(IMG.product, i+j))]
        )
        listCount++
      }
    }

    if (qa.caps.includes('S')) {
      const qty = Math.min(Math.ceil(totalProd * 0.35), SERVICE_DATA.length)
      for (let j = 0; j < qty; j++) {
        const s = SERVICE_DATA[(i + j) % SERVICE_DATA.length]
        await pool.query(
          `INSERT INTO tb_listings (usuario_id, tipo, seccion, nombre, descripcion, precio, categoria, subcategoria, imagen)
           VALUES (?, 'servicio', ?, ?, ?, ?, ?, ?, ?)`,
          [uid, s.seccion, s.nombre, `${s.nombre}. Profesionales con experiencia y dedicación.`, s.precio, s.cat, s.sub, UNSPLASH(pick(IMG.service, i+j))]
        )
        listCount++
      }
    }

    if (qa.caps.includes('A')) {
      const qty = Math.min(Math.ceil(totalProd * 0.35), ARRIENDO_DATA.length)
      for (let j = 0; j < qty; j++) {
        const a = ARRIENDO_DATA[(i + j) % ARRIENDO_DATA.length]
        await pool.query(
          `INSERT INTO tb_listings (usuario_id, tipo, seccion, nombre, descripcion, precio, categoria, subcategoria, imagen)
           VALUES (?, 'arriendo', ?, ?, ?, ?, ?, ?, ?)`,
          [uid, a.seccion, a.nombre, `${a.nombre}. Excelentes condiciones, precio por día.`, a.precio, a.cat, a.sub, UNSPLASH(pick(IMG.arriendo, i+j))]
        )
        listCount++
      }
    }

    // ── Local de barrio ────────────────────────────────────────────────────
    if (qa.tipo === 'local') {
      const slug = qa.email.split('@')[0]
      await pool.query(
        `INSERT INTO tb_locales
           (usuario_id, nombre, descripcion, direccion, horario, telefono, whatsapp,
            facebook, instagram, correo, imagen, imagen_2, imagen_3, categoria_barrio_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          uid,
          LOCAL_DATA.nombre,
          LOCAL_DATA.descripcion,
          'Av. San Martín ' + (100 + i * 50) + ', San Martín de los Andes',
          LOCAL_DATA.horario,
          '+56 9 ' + String(i * 1111111 + 90000000),
          '+56 9 ' + String(i * 1111111 + 90000000),
          'fb.com/' + slug,
          'instagram.com/' + slug,
          'contacto@' + slug + '.cl',
          UNSPLASH(LOCAL_DATA.imgs[0]),
          UNSPLASH(LOCAL_DATA.imgs[1]),
          UNSPLASH(LOCAL_DATA.imgs[2]),
          LOCAL_DATA.categoria_id,
        ]
      )
    }

    // ── Eventos ────────────────────────────────────────────────────────────
    if (qa.tipo === 'evento') {
      for (const ev of EVENTO_DATA_SEED) {
        await pool.query(
          `INSERT INTO tb_eventos
             (usuario_id, titulo, descripcion, fecha, ubicacion, precio, horario,
              telefono, whatsapp, organizador, imagen, imagen_2, imagen_3, categoria_evento_id)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            uid,
            ev.titulo,
            `${ev.titulo}: un evento imperdible en la región. Ven a disfrutar con toda la familia.`,
            ev.fecha,
            ev.ubicacion,
            ev.precio,
            ev.horario,
            '+56 9 ' + String(i * 1111111 + 90000000),
            '+56 9 ' + String(i * 1111111 + 90000000),
            ev.organizador,
            UNSPLASH(ev.imgs[0]),
            UNSPLASH(ev.imgs[1]),
            UNSPLASH(ev.imgs[2]),
            ev.categoria_id,
          ]
        )
      }
    }

    // ── Turismo: portada + tours + pagina ──────────────────────────────────
    if (isTur) {
      const catSet = TURISMO_CAT_SETS[turIdx % TURISMO_CAT_SETS.length]
      const portImgs = [0,1,2,3].map(k => UNSPLASH(pick(IMG.tour, turIdx*4+k), 1200))

      // Portada
      await pool.query(
        `INSERT INTO portadas (usuario_id, nombre, descripcion, imagenes, categorias)
         VALUES (?, ?, ?, ?, ?)`,
        [
          uid,
          negName,
          `Descubrí la magia de la Patagonia con ${negName}. Tours y excursiones para todos los gustos.`,
          JSON.stringify(portImgs),
          JSON.stringify(catSet),
        ]
      )

      // Tours (6 por operador)
      for (let j = 0; j < 6; j++) {
        const t = TOUR_DATA[(turIdx * 6 + j) % TOUR_DATA.length]
        const tourImgs = [0,1,2].map(k => UNSPLASH(pick(IMG.tour, turIdx*3+j+k)))
        await pool.query(
          `INSERT INTO tb_tours (usuario_id, nombre, categoria, ubicacion, detalle, precio, imagen_principal, imagenes)
           VALUES (?, ?, ?, ?, ?, ?, 0, ?)`,
          [
            uid,
            t.nombre,
            t.cat,
            t.ubicacion,
            `${t.nombre}. Una experiencia única en el corazón de la Patagonia. Incluye guía especializado, transporte y equipamiento básico.`,
            t.precio,
            JSON.stringify(tourImgs),
          ]
        )
      }

      // Página (solo plan 5)
      if (qa.plan >= 5) {
        await pool.query(
          `INSERT INTO paginas (usuario_id, titulo_superior, texto_superior, imagen_superior, titulo_inferior, texto_inferior, imagen_inferior)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            uid,
            `Bienvenidos a ${negName}`,
            `Somos una empresa de turismo aventura con más de 10 años de experiencia en la Patagonia. Nuestros guías son expertos locales apasionados por la montaña y el lago. Ofrecemos experiencias únicas e irrepetibles en uno de los paisajes más impresionantes del mundo.`,
            UNSPLASH(pick(IMG.tour, turIdx*2), 1200),
            'Nuestra Filosofía',
            `Creemos en el turismo responsable y sustentable. Cada excursión está diseñada para minimizar el impacto ambiental y maximizar la experiencia del visitante. Trabajamos con pequeños grupos para garantizar atención personalizada y mayor contacto con la naturaleza.`,
            UNSPLASH(pick(IMG.tour, turIdx*2+1), 1200),
          ]
        )
      }
    }

    console.log(`  ✅ [ID ${uid}] ${qa.email} → ${negName} (${listCount} listings)`)
    created++
  }

  await pool.end()
  console.log(`\n🎉 Seed completo: ${created} usuarios creados con IDs 9001-9030.`)
  console.log(`   Email: cualquier @qa.dev | Password: ${QA_PASSWORD}`)
  console.log(`   Los IDs coinciden con los mock de DevQuickLogin.`)
}

main().catch(err => {
  console.error('❌ Error en seed:', err.message)
  process.exit(1)
})
