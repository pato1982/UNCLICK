/**
 * Migración Fase 1 — Autogestión de Locales y Eventos
 * Crea tb_categorias_locales, tb_categorias_eventos y extiende tb_locales / tb_eventos
 * Ejecutar: node backend/migrate-fase1-locales-eventos.mjs
 */
import mysql from 'mysql2/promise'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { config } from 'dotenv'

const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: join(__dirname, '..', '.env') })

const db = await mysql.createConnection({
  host:     process.env.DB_HOST || '127.0.0.1',
  port:     parseInt(process.env.DB_PORT) || 3306,
  user:     process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'unclik',
})

function ok(msg)   { console.log(`  ✓ ${msg}`) }
function skip(msg) { console.log(`  – ${msg}`) }
function section(t){ console.log(`\n▸ ${t}`) }

// ─── Helpers ────────────────────────────────────────────────────────────────

async function tableExists(name) {
  const [r] = await db.query(
    `SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=?`, [name]
  )
  return r.length > 0
}

async function columnExists(table, col) {
  const [r] = await db.query(
    `SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=? AND COLUMN_NAME=?`,
    [table, col]
  )
  return r.length > 0
}

// ─── 1. tb_categorias_locales ────────────────────────────────────────────────

section('tb_categorias_locales')

if (await tableExists('tb_categorias_locales')) {
  skip('tabla ya existe')
} else {
  await db.query(`
    CREATE TABLE tb_categorias_locales (
      id     INT          NOT NULL AUTO_INCREMENT,
      nombre VARCHAR(120) NOT NULL,
      icono  VARCHAR(80)  NOT NULL DEFAULT 'storefront',
      PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `)
  ok('tabla creada')

  const cats = [
    // ── Alimentación ──────────────────────────────────────────────
    ['Almacén / Minimarket',          'local_grocery_store'],
    ['Supermercado',                  'shopping_cart'],
    ['Panadería / Pastelería',        'bakery_dining'],
    ['Amasandería',                   'cookie'],
    ['Carnicería / Rotisería',        'set_meal'],
    ['Verdulería / Frutería',         'eco'],
    ['Marisquería / Pescadería',      'set_meal'],
    ['Empanadas / Sopaipillas',       'lunch_dining'],
    ['Heladería',                     'icecream'],
    ['Comida rápida / Snacks',        'fastfood'],
    ['Pizzería',                      'local_pizza'],
    ['Sushi / Comida oriental',       'ramen_dining'],
    ['Restaurant / Comedor',          'restaurant'],
    ['Rotisería / Menú del día',      'soup_kitchen'],
    ['Café / Fuente de soda',         'coffee'],
    ['Bar / Pub',                     'sports_bar'],
    ['Discoteca / Karaoke',           'nightlife'],
    ['Botillería',                    'liquor'],
    ['Distribuidora agua / bebidas',  'water_drop'],
    // ── Salud y belleza ───────────────────────────────────────────
    ['Farmacia / Botica',             'local_pharmacy'],
    ['Centro médico / Consultorio',   'medical_services'],
    ['Clínica dental / Dentista',     'dentistry'],
    ['Óptica',                        'visibility'],
    ['Kinesiología / Masajes',        'self_improvement'],
    ['Peluquería / Barbería',         'content_cut'],
    ['Centro de estética / Spa',      'spa'],
    ['Pedicuría / Manicuría',         'face_3'],
    ['Veterinaria / Petshop',         'pets'],
    // ── Hogar y construcción ──────────────────────────────────────
    ['Ferretería',                    'hardware'],
    ['Materiales de construcción',    'home_repair_service'],
    ['Gasfitería / Plomería',         'plumbing'],
    ['Electricidad / Electricista',   'electrical_services'],
    ['Cerrajería',                    'lock'],
    ['Pinturería',                    'format_paint'],
    ['Mueblería / Tapicería',         'chair'],
    ['Decoración / Artículos hogar',  'home'],
    ['Vidriería / Aluminios',         'window'],
    ['Gas / Distribuidora de gas',    'gas_meter'],
    // ── Automotriz ────────────────────────────────────────────────
    ['Taller mecánico / Maestranza',  'build'],
    ['Repuestos automotrices',        'settings'],
    ['Lubricentro / Aceites',         'oil_barrel'],
    ['Llantas / Gomería',             'tire_repair'],
    ['Lavado de autos',               'local_car_wash'],
    ['Combustibles / Bencinera',      'local_gas_station'],
    ['Estacionamiento / Parking',     'local_parking'],
    // ── Servicios ─────────────────────────────────────────────────
    ['Lavandería / Tintorería',       'local_laundry_service'],
    ['Imprenta / Fotocopiadora',      'print'],
    ['Fotografía / Estudio fotográfico','photo_camera'],
    ['Confección / Costura / Sastrería','design_services'],
    ['Relojería / Joyería',           'watch'],
    ['Zapatería / Reparación calzado','footprint'],
    ['Computación / Servicio técnico','computer'],
    ['Telefonía / Accesorios celular','phone_android'],
    ['Bicicletería / Reparación bici','pedal_bike'],
    ['Correo / Mensajería / Courier', 'local_shipping'],
    ['Notaría / Trámites legales',    'gavel'],
    ['Seguros / Financiera',          'account_balance'],
    ['Cambio de moneda',              'currency_exchange'],
    ['Agencia de viajes',             'flight'],
    // ── Comercio ──────────────────────────────────────────────────
    ['Bazar / Bric-à-brac',           'category'],
    ['Librería / Papelería',          'menu_book'],
    ['Juguetería',                    'toys'],
    ['Ropa / Vestuario / Boutique',   'checkroom'],
    ['Lencería / Ropa interior',      'checkroom'],
    ['Deportes / Artículos deportivos','sports'],
    ['Electrónica / Tecnología',      'devices'],
    ['Floristería',                   'local_florist'],
    ['Cigarrería / Kiosko',           'smoking_rooms'],
    ['Lotería / Punto de apuestas',   'confirmation_number'],
    // ── Educación y deporte ───────────────────────────────────────
    ['Academia / Clases particulares','school'],
    ['Gym / Fitness / Crossfit',      'fitness_center'],
    ['Artes marciales / Escuela dep.','sports_martial_arts'],
    ['Danza / Ballet / Pilates',      'self_improvement'],
    // ── Comunidad ─────────────────────────────────────────────────
    ['Iglesia / Templo / Capilla',    'church'],
    ['Junta de vecinos / Sede social','groups'],
    ['Centro cultural / Club social', 'museum'],
    ['Otro',                          'storefront'],
  ]

  await db.query(
    `INSERT INTO tb_categorias_locales (nombre, icono) VALUES ?`,
    [cats]
  )
  ok(`${cats.length} categorías de locales insertadas`)
}

// ─── 2. tb_categorias_eventos ────────────────────────────────────────────────

section('tb_categorias_eventos')

if (await tableExists('tb_categorias_eventos')) {
  skip('tabla ya existe')
} else {
  await db.query(`
    CREATE TABLE tb_categorias_eventos (
      id     INT          NOT NULL AUTO_INCREMENT,
      nombre VARCHAR(120) NOT NULL,
      icono  VARCHAR(80)  NOT NULL DEFAULT 'event',
      PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `)
  ok('tabla creada')

  const evCats = [
    ['Música / Concierto',             'music_note'],
    ['Festival / Feria',               'festival'],
    ['Peña / Folclor / Cueca',         'guitar_pick'],
    ['Stand up / Humor / Show',        'emoji_emotions'],
    ['Teatro / Danza / Circo',         'theater_comedy'],
    ['Cine / Audiovisual',             'movie'],
    ['Arte / Exposición / Cultura',    'palette'],
    ['Gastronómico / Food fest',       'restaurant'],
    ['Mercado / Venta de garage',      'sell'],
    ['Deporte / Torneo / Campeonato',  'sports'],
    ['Infantil / Familiar',            'child_care'],
    ['Charla / Seminario / Taller',    'school'],
    ['Religioso / Procesión / Misa',   'church'],
    ['Carnaval / Corso / Desfile',     'celebration'],
    ['Bingo / Rifa / Tombola',         'confirmation_number'],
    ['Matrimonio / Quinceañero',       'favorite'],
    ['Cumpleaños / Celebración priv.', 'cake'],
    ['Halloween / Disfraz / Temático', 'masks'],
    ['Navidad / Año nuevo / Fiestas',  'nights_stay'],
    ['A Beneficio / Solidario',        'volunteer_activism'],
    ['Comunitario / Vecinal',          'groups'],
    ['Otro',                           'event'],
  ]

  await db.query(
    `INSERT INTO tb_categorias_eventos (nombre, icono) VALUES ?`,
    [evCats]
  )
  ok(`${evCats.length} categorías de eventos insertadas`)
}

// ─── 3. Extender tb_locales ───────────────────────────────────────────────────

section('tb_locales — columnas nuevas')

if (!await columnExists('tb_locales', 'usuario_id')) {
  await db.query(`ALTER TABLE tb_locales ADD COLUMN usuario_id INT NULL AFTER id`)
  ok('usuario_id añadido')
} else { skip('usuario_id ya existe') }

if (!await columnExists('tb_locales', 'imagen_2')) {
  await db.query(`ALTER TABLE tb_locales ADD COLUMN imagen_2 VARCHAR(300) NULL AFTER imagen`)
  ok('imagen_2 añadida')
} else { skip('imagen_2 ya existe') }

if (!await columnExists('tb_locales', 'imagen_3')) {
  await db.query(`ALTER TABLE tb_locales ADD COLUMN imagen_3 VARCHAR(300) NULL AFTER imagen_2`)
  ok('imagen_3 añadida')
} else { skip('imagen_3 ya existe') }

// ─── 4. Extender tb_eventos ───────────────────────────────────────────────────

section('tb_eventos — columnas nuevas')

if (!await columnExists('tb_eventos', 'usuario_id')) {
  await db.query(`ALTER TABLE tb_eventos ADD COLUMN usuario_id INT NULL AFTER id`)
  ok('usuario_id añadido')
} else { skip('usuario_id ya existe') }

if (!await columnExists('tb_eventos', 'imagen_2')) {
  await db.query(`ALTER TABLE tb_eventos ADD COLUMN imagen_2 VARCHAR(300) NULL AFTER imagen`)
  ok('imagen_2 añadida')
} else { skip('imagen_2 ya existe') }

if (!await columnExists('tb_eventos', 'imagen_3')) {
  await db.query(`ALTER TABLE tb_eventos ADD COLUMN imagen_3 VARCHAR(300) NULL AFTER imagen_2`)
  ok('imagen_3 añadida')
} else { skip('imagen_3 ya existe') }

// ─── 5. Verificación final ────────────────────────────────────────────────────

section('Verificación')

const [[{ cats_locales }]] = await db.query(`SELECT COUNT(*) AS cats_locales FROM tb_categorias_locales`)
const [[{ cats_eventos }]] = await db.query(`SELECT COUNT(*) AS cats_eventos FROM tb_categorias_eventos`)

const [colsLocales] = await db.query(
  `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='tb_locales'
   AND COLUMN_NAME IN ('usuario_id','imagen_2','imagen_3')`
)
const [colsEventos] = await db.query(
  `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='tb_eventos'
   AND COLUMN_NAME IN ('usuario_id','imagen_2','imagen_3')`
)

ok(`tb_categorias_locales → ${cats_locales} categorías`)
ok(`tb_categorias_eventos  → ${cats_eventos} categorías`)
ok(`tb_locales nuevas cols → ${colsLocales.map(c => c.COLUMN_NAME).join(', ')}`)
ok(`tb_eventos nuevas cols → ${colsEventos.map(c => c.COLUMN_NAME).join(', ')}`)

console.log('\n✅ Migración Fase 1 completada\n')

await db.end()
