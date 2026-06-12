/**
 * download-images.mjs — Descarga las imágenes Unsplash de los usuarios QA,
 * las convierte a WebP con sharp y actualiza la BD con rutas locales.
 *
 * Uso: node backend/download-images.mjs
 *      (desde la raíz del proyecto)
 */

import 'dotenv/config'
import mysql  from 'mysql2/promise'
import sharp  from 'sharp'
import { mkdirSync }       from 'fs'
import { writeFile }       from 'fs/promises'
import { join, dirname }   from 'path'
import { fileURLToPath }   from 'url'
import { randomBytes }     from 'crypto'

const __dirname = dirname(fileURLToPath(import.meta.url))
const UPLOADS   = join(__dirname, 'uploads')

const pool = mysql.createPool({
  host:     process.env.DB_HOST || '127.0.0.1',
  port:     Number(process.env.DB_PORT) || 3306,
  user:     process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'unclik',
  waitForConnections: true,
  connectionLimit: 5,
})

// ── Helpers ───────────────────────────────────────────────────────────────────
function isExternal(url) {
  return typeof url === 'string' && (url.startsWith('http://') || url.startsWith('https://'))
}

function uid() {
  return Date.now() + '-' + randomBytes(4).toString('hex')
}

function ensureDir(carpeta) {
  const dir = join(UPLOADS, carpeta)
  mkdirSync(dir, { recursive: true })
  return dir
}

async function downloadToWebp(url, carpeta, label = '') {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(20_000),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const buf      = Buffer.from(await res.arrayBuffer())
    const filename = `${uid()}.webp`
    const dir      = ensureDir(carpeta)
    const dest     = join(dir, filename)
    await sharp(buf)
      .resize({ width: 1200, height: 1200, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 82, effort: 4 })
      .toFile(dest)
    const localUrl = `/uploads/${carpeta}/${filename}`
    process.stdout.write(`  ✅ ${label || carpeta}/${filename}\n`)
    return localUrl
  } catch (err) {
    process.stdout.write(`  ⚠️  ${label} → fallo (${err.message})\n`)
    return null
  }
}

// ── Procesar campo simple ─────────────────────────────────────────────────────
async function fixSimple(table, idCol, imageCol, carpeta, whereExtra = '') {
  const [rows] = await pool.query(
    `SELECT ${idCol}, ${imageCol} FROM ${table} WHERE ${imageCol} IS NOT NULL ${whereExtra}`
  )
  let updated = 0
  for (const row of rows) {
    const url = row[imageCol]
    if (!isExternal(url)) continue
    const local = await downloadToWebp(url, carpeta, `${table}.${imageCol}`)
    if (local) {
      await pool.query(`UPDATE ${table} SET ${imageCol} = ? WHERE ${idCol} = ?`, [local, row[idCol]])
      updated++
    }
  }
  return updated
}

// ── Procesar campo JSON array ─────────────────────────────────────────────────
async function fixJsonArray(table, idCol, imageCol, carpeta, whereExtra = '') {
  const [rows] = await pool.query(
    `SELECT ${idCol}, ${imageCol} FROM ${table} WHERE ${imageCol} IS NOT NULL ${whereExtra}`
  )
  let updated = 0
  for (const row of rows) {
    let arr
    try { arr = typeof row[imageCol] === 'string' ? JSON.parse(row[imageCol]) : row[imageCol] } catch { continue }
    if (!Array.isArray(arr) || arr.length === 0) continue
    let changed = false
    const newArr = []
    for (const url of arr) {
      if (isExternal(url)) {
        const local = await downloadToWebp(url, carpeta, `${table}.${imageCol}`)
        newArr.push(local ?? url)
        if (local) changed = true
      } else {
        newArr.push(url)
      }
    }
    if (changed) {
      await pool.query(`UPDATE ${table} SET ${imageCol} = ? WHERE ${idCol} = ?`, [JSON.stringify(newArr), row[idCol]])
      updated++
    }
  }
  return updated
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('📥 Descargando imágenes de usuarios QA a uploads/ ...\n')
  let total = 0

  // Logos de negocios
  console.log('── negocios.logo_url')
  total += await fixSimple('negocios', 'id', 'logo_url', 'negocios')

  // Imágenes de listings (productos / servicios / arriendos)
  console.log('\n── tb_listings.imagen  (productos)')
  total += await fixSimple('tb_listings', 'id', 'imagen', 'productos', "AND tipo = 'producto'")
  console.log('\n── tb_listings.imagen  (servicios)')
  total += await fixSimple('tb_listings', 'id', 'imagen', 'servicios', "AND tipo = 'servicio'")
  console.log('\n── tb_listings.imagen  (arriendos)')
  total += await fixSimple('tb_listings', 'id', 'imagen', 'arriendos', "AND tipo = 'arriendo'")

  // Imágenes de tours (array JSON)
  console.log('\n── tb_tours.imagenes')
  total += await fixJsonArray('tb_tours', 'id', 'imagenes', 'turismo')

  // Imágenes de portadas (array JSON)
  console.log('\n── portadas.imagenes')
  total += await fixJsonArray('portadas', 'id', 'imagenes', 'portadas')

  // Imágenes de páginas premium
  console.log('\n── paginas.imagen_superior')
  total += await fixSimple('paginas', 'id', 'imagen_superior', 'paginas')
  console.log('\n── paginas.imagen_inferior')
  total += await fixSimple('paginas', 'id', 'imagen_inferior', 'paginas')

  await pool.end()
  console.log(`\n🎉 Listo — ${total} registros actualizados con rutas locales.`)
}

main().catch(err => {
  console.error('❌ Error:', err.message)
  process.exit(1)
})
