/**
 * Contenido de prueba: publicaciones, tours, portadas, páginas, locales y
 * eventos, colgando de las cuentas que crea 02_usuarios.mjs.
 *
 * Dos reglas que NO se pueden relajar:
 *
 * 1. IMÁGENES LOCALES. El seed viejo escribía URLs de images.unsplash.com, así
 *    que el ambiente local no servía sin internet. Acá se usan los .webp ya
 *    versionados en uploads/{eventos,locales}/ y placeholders generados con
 *    sharp. Todos los archivos generados llevan prefijo `seed-`: es la
 *    exclusión que respeta lib/cleanupOrphans.js, que si no los borra a las 2h.
 *
 * 2. tb_eventos.fecha SIEMPRE en ISO `YYYY-MM-DD`. La columna es VARCHAR(80)
 *    de texto libre, pero routes/eventos.js la compara con `>= CURDATE()`;
 *    cualquier otro formato coacciona a 0000-00-00 y el evento queda invisible
 *    en el sitio público para siempre.
 */
import { existsSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'
import { QA_USERS } from './02_usuarios.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const UPLOADS = join(__dirname, '..', '..', 'uploads')

// ── Placeholders locales ─────────────────────────────────────────────────────

const PALETA = ['#0E7490', '#3B1969', '#B45309', '#1E3A8A', '#BE123C', '#15803D', '#7C2D12', '#1e293b']

/**
 * Genera (una vez) un .webp de color plano con un rótulo, y devuelve la ruta
 * pública. Idempotente por existsSync: en la segunda corrida no reescribe.
 */
async function placeholder(carpeta, slug, etiqueta, idx) {
  const filename = `seed-${slug}.webp`
  const dir = join(UPLOADS, carpeta)
  const full = join(dir, filename)
  const url = `/uploads/${carpeta}/${filename}`
  if (existsSync(full)) return url

  await mkdir(dir, { recursive: true })
  const color = PALETA[idx % PALETA.length]
  const texto = etiqueta.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="600">
    <rect width="900" height="600" fill="${color}"/>
    <text x="450" y="310" font-family="sans-serif" font-size="42" fill="#ffffff"
          text-anchor="middle" dominant-baseline="middle">${texto}</text>
  </svg>`
  await sharp(Buffer.from(svg)).webp({ quality: 82 }).toFile(full)
  return url
}

const slugify = (s) =>
  s.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

// ── Datos de muestra (contexto real: Villarrica, La Araucanía) ───────────────

const PRODUCTOS = [
  ['Merkén ahumado artesanal', 3500, 'Alimentos y Bebidas', 'Miel y Conservas'],
  ['Miel de ulmo 1 kg', 9900, 'Alimentos y Bebidas', 'Miel y Conservas'],
  ['Manta de lana de oveja', 45000, 'Artesanía', 'Tejidos y Lana'],
  ['Tabla de raulí para asado', 18900, 'Artesanía', 'Madera Nativa'],
  ['Chaqueta impermeable', 79900, 'Ropa y Calzado', 'Ropa Outdoor'],
  ['Bototos de trekking', 89900, 'Ropa y Calzado', 'Calzado'],
  ['Saco de dormir -5°C', 64900, 'Deportes y Aire Libre', 'Camping'],
  ['Caña de pescar telescópica', 39900, 'Deportes y Aire Libre', 'Pesca'],
  ['Estufa a leña 12 kW', 349000, 'Hogar y Decoración', 'Calefacción'],
  ['Set de cerámica de greda', 24900, 'Artesanía', 'Cerámica y Greda'],
  ['Café de grano 500 g', 12900, 'Alimentos y Bebidas', 'Café y Té'],
  ['Cerveza artesanal pack 6', 15900, 'Alimentos y Bebidas', 'Cervecería Artesanal'],
]

const SERVICIOS = [
  ['Clases de kayak para principiantes', 25000, 'Educación', 'Deportes y Entrenamiento'],
  ['Sesión de kinesiología', 28000, 'Salud', 'Kinesiología'],
  ['Corte y peinado', 12000, 'Belleza y Bienestar', 'Peluquería'],
  ['Instalación eléctrica domiciliaria', 55000, 'Construcción y Reparaciones', 'Electricidad'],
  ['Flete dentro de Villarrica', 20000, 'Transporte y Fletes', 'Fletes y Mudanzas'],
  ['Fotografía de eventos', 150000, 'Eventos y Celebraciones', 'Fotografía y Video'],
  ['Reparación de notebook', 30000, 'Tecnología y Soporte', 'Reparación de Computadores'],
  ['Peluquería canina', 18000, 'Cuidado de Mascotas', 'Peluquería Canina'],
  ['Aseo profundo de hogar', 45000, 'Limpieza y Aseo', 'Aseo del Hogar'],
  ['Asesoría contable mensual', 90000, 'Servicios Profesionales', 'Contabilidad'],
]

const ARRIENDOS = [
  ['Cabaña para 4 personas', 75000, 'Alojamiento', 'Cabañas'],
  ['Domo geodésico con vista al lago', 95000, 'Alojamiento', 'Domos y Glamping'],
  ['Camioneta 4x4 por día', 65000, 'Vehículos', 'Camionetas 4x4'],
  ['Kayak doble por jornada', 25000, 'Equipamiento Outdoor', 'Kayak y Paddle'],
  ['Equipo de esquí completo', 30000, 'Equipamiento Outdoor', 'Equipo de Esquí'],
  ['Quincho para 30 personas', 120000, 'Espacios y Salones', 'Quincho'],
  ['Toldo 6x3 para eventos', 55000, 'Equipos para Eventos', 'Toldos y Carpas'],
  ['Generador eléctrico 5 kVA', 40000, 'Herramientas y Maquinaria', 'Generadores'],
  ['Bicicleta de montaña', 18000, 'Vehículos', 'Bicicletas'],
  ['Andamio modular', 22000, 'Herramientas y Maquinaria', 'Andamios'],
]

const TOURS = [
  ['Ascenso al Volcán Villarrica', 89900, 'Volcán y Montaña', 'Parque Nacional Villarrica'],
  ['Rafting Río Trancura', 45000, 'Aventura y Deportes', 'Río Trancura, Pucón'],
  ['Kayak en el Lago Villarrica', 28000, 'Lago y Navegación', 'Lago Villarrica'],
  ['Trekking Santuario El Cañi', 39900, 'Naturaleza y Ecoturismo', 'Reserva El Cañi'],
  ['Cabalgata a los faldeos', 42000, 'Aventura y Deportes', 'Sector Palguín'],
  ['Termas Geométricas día completo', 55000, 'Termas y Bienestar', 'Coñaripe'],
  ['Ruta cervecera de Villarrica', 32000, 'Gastronomía y Cervecerías', 'Villarrica centro'],
  ['Experiencia cultura mapuche', 35000, 'Cultura y Patrimonio', 'Comunidad local'],
]

/** Locales de barrio — coinciden con los .webp ya versionados en uploads/locales/. */
const LOCALES = [
  ['Almacén Don Pedro', 'almacen-don-pedro', 'Abarrotes y despacho a domicilio en el centro.'],
  ['Panadería La Tradición', 'panaderia-tradicion', 'Pan amasado y marraqueta recién horneada.'],
  ['Carnicería El Gaucho', 'carniceria-gaucho', 'Cortes seleccionados y cecinas artesanales.'],
  ['Verdulería El Huerto', 'verduleria-huerto', 'Frutas y verduras frescas de la zona.'],
  ['Pescadería del Lago', 'pescaderia-lago', 'Pescados y mariscos frescos del sur.'],
  ['Lácteos del Volcán', 'lacteos-volcan', 'Quesos de campo y leche fresca.'],
  ['Heladería Glaciar', 'heladeria-glaciar', 'Helados artesanales con frutas nativas.'],
  ['Café del Lago', 'cafe-del-lago', 'Café de especialidad con vista al lago.'],
  ['Botillería El Punto', 'botilleria-punto', 'Vinos, cervezas artesanales y destilados.'],
  ['Rotisería El Rincón', 'rotiseria-rincon', 'Comida casera preparada para llevar.'],
  ['Feria Libre de Villarrica', 'feria-libre', 'Productores locales, martes y sábado.'],
  ['Dulce Mar', 'dulce-mar', 'Repostería y tortas por encargo.'],
]

/**
 * Eventos — el `offsetDias` es relativo al día de la corrida, a propósito:
 * deja siempre eventos pasados, uno de hoy y varios futuros. El de hoy es el
 * caso que expone el bug de zona horaria (desaparece del sitio público varias
 * horas antes de tiempo si el servidor no está en la hora de Chile).
 */
const EVENTOS = [
  ['Feria Costumbrista Villarrica', 'feria-costumbrista', -30, 'Costanera', 'Entrada liberada', '11:00 - 21:00'],
  ['Rodeo Regional', 'rodeo-regional', -14, 'Medialuna de Villarrica', '$6.000', '14:00 - 20:00'],
  ['Torneo de Kayak', 'torneo-kayak', -3, 'Playa Pucará', 'Entrada liberada', '09:00 - 17:00'],
  ['Mercado de Emprendedores', 'mercado-emprendedores', 0, 'Plaza de Armas', 'Entrada liberada', '10:00 - 19:00'],
  ['Cine al Aire Libre', 'cine-aire-libre', 2, 'Parque Municipal', 'Entrada liberada', '21:00 - 23:30'],
  ['Feria Gastronómica del Sur', 'feria-gastronomica', 7, 'Costanera', '$3.000', '12:00 - 22:00'],
  ['Festival de Música Araucanía', 'festival-musica', 14, 'Anfiteatro Municipal', '$8.000', '20:00 - 01:00'],
  ['Expo Artesanía Mapuche', 'expo-artesania', 21, 'Centro Cultural', 'Entrada liberada', '10:00 - 20:00'],
  ['Festival de la Cerveza', 'festival-cerveza', 30, 'Parque Municipal', '$5.000', '17:00 - 00:00'],
  ['Carrera Trail Volcán', 'carrera-trail', 45, 'Sector Rucapillán', '$12.000', '08:00 - 15:00'],
  ['Feria del Libro', 'feria-libro', 60, 'Biblioteca Municipal', 'Entrada liberada', '10:00 - 19:00'],
  ['Festival Folclórico', 'festival-folclore', 75, 'Gimnasio Municipal', '$4.000', '19:00 - 23:00'],
]

/** Fecha ISO (YYYY-MM-DD) desplazada N días desde hoy, en hora de Chile. */
function fechaISO(offsetDias) {
  const hoyChile = new Date(
    new Date().toLocaleString('en-US', { timeZone: 'America/Santiago' })
  )
  hoyChile.setDate(hoyChile.getDate() + offsetDias)
  const y = hoyChile.getFullYear()
  const m = String(hoyChile.getMonth() + 1).padStart(2, '0')
  const d = String(hoyChile.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

const LISTINGS_POR_PLAN = { 1: 5, 2: 8, 3: 12, 4: 16, 5: 12 }

export async function seedContenido(conn) {
  // Se borra el contenido de las cuentas de prueba; el de usuarios reales
  // (id < 9000) no se toca.
  await conn.query('DELETE FROM tb_listings WHERE usuario_id >= 9000')
  await conn.query('DELETE FROM tb_tours    WHERE usuario_id >= 9000')
  await conn.query('DELETE FROM portadas    WHERE usuario_id >= 9000')
  await conn.query('DELETE FROM paginas     WHERE usuario_id >= 9000')
  await conn.query("DELETE FROM tb_locales  WHERE nombre LIKE '%' AND (usuario_id >= 9000 OR usuario_id IS NULL)")
  await conn.query('DELETE FROM tb_eventos  WHERE usuario_id >= 9000 OR usuario_id IS NULL')

  // Mapa nombre → id del catálogo, para poblar categoria_id/subcategoria_id.
  const [cats] = await conn.query('SELECT id, nombre, tipo FROM tb_categorias')
  const [subs] = await conn.query('SELECT id, categoria_id, nombre FROM tb_subcategorias')
  const catId = (tipo, nombre) => cats.find((c) => c.tipo === tipo && c.nombre === nombre)?.id ?? null
  const subId = (cid, nombre) => subs.find((s) => s.categoria_id === cid && s.nombre === nombre)?.id ?? null

  // ── Listings ───────────────────────────────────────────────────────────────
  const FUENTES = { P: ['producto', PRODUCTOS], S: ['servicio', SERVICIOS], A: ['arriendo', ARRIENDOS] }
  let nListings = 0

  for (const u of QA_USERS) {
    if (!u.caps.length) continue
    const cupo = LISTINGS_POR_PLAN[u.plan] ?? 5
    const porCap = Math.max(1, Math.floor(cupo / u.caps.length))

    for (const cap of u.caps) {
      const [tipo, fuente] = FUENTES[cap]
      for (let i = 0; i < porCap; i++) {
        const [nombre, precio, categoria, subcategoria] = fuente[i % fuente.length]
        const cid = catId(tipo, categoria)
        const img = await placeholder(tipo + 's', `${tipo}-${slugify(nombre)}`, nombre, i)

        // Banner solo desde plan 3 (routes/listings.js PLAN_BANNER).
        const banner = u.plan >= 3 && i === 0 ? 1 : null

        await conn.query(
          `INSERT INTO tb_listings
             (usuario_id, tipo, nombre, descripcion, precio, categoria, categoria_id,
              subcategoria, subcategoria_id, imagen, banner_orden, stock, sku,
              envio_disponible, retiro_local, activo)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1)`,
          [
            u.id, tipo, nombre,
            `${nombre} — disponible en ${u.nombre}. Producto de muestra para desarrollo local.`,
            precio, categoria, cid, subcategoria, cid ? subId(cid, subcategoria) : null,
            img, banner,
            tipo === 'producto' ? 10 + i : null,
            `SEED-${u.id}-${tipo.slice(0, 3).toUpperCase()}-${i + 1}`,
            tipo === 'producto' ? 1 : 0,
          ]
        )
        nListings++
      }
    }
  }
  console.log(`   ✓ listings (${nListings})`)

  // ── Turismo: tours, portadas y páginas ────────────────────────────────────
  const turismo = QA_USERS.filter((u) => u.tipo === 'turismo')
  let nTours = 0

  for (const u of turismo) {
    const imgs = []
    for (let i = 0; i < 3; i++) {
      imgs.push(await placeholder('portadas', `portada-${u.id}-${i + 1}`, `${u.nombre} ${i + 1}`, u.id + i))
    }
    await conn.query(
      `INSERT INTO portadas (usuario_id, nombre, descripcion, imagenes, categorias, activo)
       VALUES (?, ?, ?, ?, ?, 1)`,
      [
        u.id, u.nombre,
        'Operador turístico de Villarrica. Excursiones al volcán, el lago y la selva valdiviana.',
        JSON.stringify(imgs),
        JSON.stringify(['Aventura', 'Naturaleza', 'Familiar']),
      ]
    )

    // Tours y página propia son plan 5 (requirePlan en routes/pagina.js).
    if (u.plan < 5) continue

    for (let i = 0; i < TOURS.length; i++) {
      const [nombre, precio, categoria, ubicacion] = TOURS[i]
      const cid = catId('turismo', categoria)
      const timg = await placeholder('turismo', `tour-${slugify(nombre)}`, nombre, i)
      await conn.query(
        `INSERT INTO tb_tours
           (usuario_id, nombre, categoria, categoria_id, ubicacion, detalle, precio, imagenes, activo)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`,
        [
          u.id, nombre, categoria, cid, ubicacion,
          `${nombre}. Salidas diarias con guía certificado. Incluye equipo y traslado desde Villarrica.`,
          precio, JSON.stringify([timg]),
        ]
      )
      nTours++
    }

    const [sup, inf] = [
      await placeholder('paginas', `pagina-${u.id}-sup`, `${u.nombre} — portada`, u.id),
      await placeholder('paginas', `pagina-${u.id}-inf`, `${u.nombre} — nosotros`, u.id + 1),
    ]
    await conn.query(
      `INSERT INTO paginas
         (usuario_id, titulo_superior, texto_superior, imagen_superior,
          titulo_inferior, texto_inferior, imagen_inferior)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        u.id,
        'Descubre Villarrica con nosotros',
        'Somos un operador local con más de diez años guiando en el Parque Nacional Villarrica, el lago y los bosques de la zona.',
        sup,
        'Nuestro equipo',
        'Guías certificados, equipamiento propio y grupos reducidos para que la experiencia sea segura y cercana.',
        inf,
      ]
    )
  }
  console.log(`   ✓ tours (${nTours}) · portadas (${turismo.length}) · páginas (${turismo.filter((u) => u.plan >= 5).length})`)

  // ── Locales de barrio ─────────────────────────────────────────────────────
  const [catsLocales] = await conn.query('SELECT id FROM tb_categorias_locales ORDER BY id')
  const localUser = QA_USERS.find((u) => u.tipo === 'local')

  for (let i = 0; i < LOCALES.length; i++) {
    const [nombre, slug, descripcion] = LOCALES[i]
    // El primero es del usuario tipo `local` (autogestión 1:1 vía /mi-local);
    // el resto queda sin dueño, como los que administra el programador.
    const dueno = i === 0 ? localUser.id : null
    await conn.query(
      `INSERT INTO tb_locales
         (usuario_id, nombre, direccion, categoria_barrio_id, imagen, descripcion,
          telefono, whatsapp, horario, correo, activo)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [
        dueno, nombre, `Calle Comercio ${100 + i * 20}, Villarrica`,
        catsLocales[i % catsLocales.length]?.id ?? null,
        `/uploads/locales/seed-${slug}.webp`,
        descripcion,
        '+56 9 6000' + String(1000 + i),
        '+56 9 6000' + String(1000 + i),
        'Lunes a sábado, 09:00 - 20:00',
        `contacto@${slug}.cl`,
      ]
    )
  }
  console.log(`   ✓ locales (${LOCALES.length})`)

  // ── Eventos ───────────────────────────────────────────────────────────────
  const [catsEventos] = await conn.query('SELECT id FROM tb_categorias_eventos ORDER BY id')
  const eventoUser = QA_USERS.find((u) => u.tipo === 'evento')

  for (let i = 0; i < EVENTOS.length; i++) {
    const [titulo, slug, offset, ubicacion, precio, horario] = EVENTOS[i]
    const dueno = i % 3 === 0 ? eventoUser.id : null
    await conn.query(
      `INSERT INTO tb_eventos
         (usuario_id, titulo, fecha, ubicacion, precio, categoria_evento_id, imagen,
          descripcion, organizador, telefono, whatsapp, horario, activo)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [
        dueno, titulo,
        fechaISO(offset),
        ubicacion, precio,
        catsEventos[i % catsEventos.length]?.id ?? null,
        `/uploads/eventos/seed-${slug}.webp`,
        `${titulo} en Villarrica. Evento de muestra para desarrollo local.`,
        'Municipalidad de Villarrica',
        '+56 9 7000' + String(1000 + i),
        '+56 9 7000' + String(1000 + i),
        horario,
      ]
    )
  }
  const pasados = EVENTOS.filter((e) => e[2] < 0).length
  console.log(`   ✓ eventos (${EVENTOS.length}) — ${pasados} pasados, 1 hoy, ${EVENTOS.length - pasados - 1} futuros`)
}
