/**
 * seed-imagenes.mjs
 * Descarga imágenes de Unsplash, las convierte a WebP con Sharp
 * y actualiza los registros de tb_eventos y tb_locales en la BD.
 * Uso: node backend/seed-imagenes.mjs
 */

import sharp from 'sharp'
import { mkdirSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import mysql from 'mysql2/promise'
import 'dotenv/config'

const __dirname = dirname(fileURLToPath(import.meta.url))

const pool = await mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'unclik',
})

let ok = 0, fail = 0

async function descargarYConvertir(url, carpeta, nombre) {
  const dir = join(__dirname, 'uploads', carpeta)
  mkdirSync(dir, { recursive: true })
  const filename = `seed-${nombre}.webp`
  const destino = join(dir, filename)
  if (existsSync(destino)) return `/uploads/${carpeta}/${filename}`

  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status} al descargar ${url}`)
  const buffer = Buffer.from(await res.arrayBuffer())

  await sharp(buffer)
    .resize({ width: 900, height: 900, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 82 })
    .toFile(destino)

  return `/uploads/${carpeta}/${filename}`
}

// ── EVENTOS ───────────────────────────────────────────────────────────────────
const eventos = [
  { titulo: 'Feria Costumbrista Villarrica',  url: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=900&q=80', slug: 'feria-costumbrista' },
  { titulo: 'Festival de Música del Lago',    url: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=900&q=80', slug: 'festival-musica' },
  { titulo: 'Feria Gastronómica del Lago',    url: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=900&q=80', slug: 'feria-gastronomica' },
  { titulo: 'Carrera Trail Volcán 2026',      url: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=900&q=80', slug: 'carrera-trail' },
  { titulo: 'Expo Artesanía Mapuche',         url: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=900&q=80', slug: 'expo-artesania' },
  { titulo: 'Festival Folclore Primavera',    url: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=900&q=80', slug: 'festival-folclore' },
  { titulo: 'Mercado de Emprendedores Lago',  url: 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=900&q=80', slug: 'mercado-emprendedores' },
  { titulo: 'Noche de Cine al Aire Libre',    url: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=900&q=80', slug: 'cine-aire-libre' },
  { titulo: 'Torneo Kayak Lago Villarrica',   url: 'https://images.unsplash.com/photo-1504309092620-4d0ec726efa4?w=900&q=80', slug: 'torneo-kayak' },
  { titulo: 'Festival Cerveza Artesanal',     url: 'https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=900&q=80', slug: 'festival-cerveza' },
  { titulo: 'Rodeo Regional Villarrica',      url: 'https://images.unsplash.com/photo-1601758125946-6ec2ef64daf8?w=900&q=80', slug: 'rodeo-regional' },
  { titulo: 'Feria del Libro Patagónica',     url: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=900&q=80', slug: 'feria-libro' },
]

// ── LOCALES ───────────────────────────────────────────────────────────────────
const locales = [
  { nombre: 'Almacén Don Pedro',              url: 'https://images.unsplash.com/photo-1534723452862-4c874018d66d?w=900&q=80', slug: 'almacen-don-pedro' },
  { nombre: 'Panadería La Tradición',         url: 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=900&q=80', slug: 'panaderia-tradicion' },
  { nombre: 'Carnicería El Gaucho',           url: 'https://images.unsplash.com/photo-1558030137-a56c1b002c9f?w=900&q=80', slug: 'carniceria-gaucho' },
  { nombre: 'Verdulería El Huerto',           url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=900&q=80', slug: 'verduleria-huerto' },
  { nombre: 'Café del Lago',                  url: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=900&q=80', slug: 'cafe-del-lago' },
  { nombre: 'Rotisería El Rincón',            url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=900&q=80', slug: 'rotiseria-rincon' },
  { nombre: 'Heladería Glaciar',              url: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=900&q=80', slug: 'heladeria-glaciar' },
  { nombre: 'Feria Libre Central',            url: 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=900&q=80', slug: 'feria-libre' },
  { nombre: 'Pescadería del Lago',            url: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=900&q=80', slug: 'pescaderia-lago' },
  { nombre: 'Botillería El Punto',            url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=900&q=80', slug: 'botilleria-punto' },
  { nombre: 'Heladería y Confitería Dulce Mar', url: 'https://images.unsplash.com/photo-1501443762994-82bd5dace89a?w=900&q=80', slug: 'dulce-mar' },
  { nombre: 'Lácteos El Volcán',              url: 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=900&q=80', slug: 'lacteos-volcan' },
]

// ── Procesar eventos ──────────────────────────────────────────────────────────
console.log('\n== EVENTOS ==')
for (const ev of eventos) {
  try {
    process.stdout.write(`  Descargando: ${ev.titulo}... `)
    const rutaImg = await descargarYConvertir(ev.url, 'eventos', ev.slug)
    await pool.query('UPDATE tb_eventos SET imagen = ? WHERE titulo = ?', [rutaImg, ev.titulo])
    console.log(`OK → ${rutaImg}`)
    ok++
  } catch (e) {
    console.log(`FAIL — ${e.message}`)
    fail++
  }
}

// ── Procesar locales ──────────────────────────────────────────────────────────
console.log('\n== LOCALES ==')
for (const loc of locales) {
  try {
    process.stdout.write(`  Descargando: ${loc.nombre}... `)
    const rutaImg = await descargarYConvertir(loc.url, 'locales', loc.slug)
    await pool.query('UPDATE tb_locales SET imagen = ? WHERE nombre = ?', [rutaImg, loc.nombre])
    console.log(`OK → ${rutaImg}`)
    ok++
  } catch (e) {
    console.log(`FAIL — ${e.message}`)
    fail++
  }
}

console.log(`\nResultado: ${ok} OK, ${fail} errores`)
await pool.end()
