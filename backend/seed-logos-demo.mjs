/**
 * seed-logos-demo.mjs
 * Genera un logo placeholder con Sharp y lo asigna a todos los negocios
 * cuyos usuarios tienen plan_id >= 2 (planes pagados).
 * Uso: node backend/seed-logos-demo.mjs
 */

import sharp from 'sharp'
import mysql from 'mysql2/promise'
import path from 'path'
import { fileURLToPath } from 'url'
import { readFileSync } from 'fs'
import * as dotenv from 'dotenv'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '.env') })

const FILENAME = 'logo-demo-placeholder.webp'
const OUTPUT   = path.join(__dirname, 'uploads', 'negocios', FILENAME)
const LOGO_URL = `/uploads/negocios/${FILENAME}`

// SVG de un logo genérico con las iniciales "LC" sobre fondo morado
const svgLogo = `
<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#3B1969"/>
      <stop offset="100%" style="stop-color:#5B2D8E"/>
    </linearGradient>
  </defs>
  <rect width="300" height="300" rx="60" fill="url(#bg)"/>
  <circle cx="150" cy="120" r="50" fill="none" stroke="#F5C842" stroke-width="5"/>
  <text x="150" y="138" font-family="Arial, sans-serif" font-size="48" font-weight="900"
        fill="#F5C842" text-anchor="middle">LC</text>
  <text x="150" y="210" font-family="Arial, sans-serif" font-size="22" font-weight="700"
        fill="#ffffff" text-anchor="middle">Mi Negocio</text>
  <text x="150" y="240" font-family="Arial, sans-serif" font-size="14"
        fill="#ffffff99" text-anchor="middle">localclick.cl</text>
</svg>`

async function run() {
  // 1. Generar imagen con Sharp (igual que el middleware de upload)
  await sharp(Buffer.from(svgLogo))
    .rotate()
    .resize(600, 600, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 82, effort: 4 })
    .toFile(OUTPUT)

  console.log(`✓ Logo generado: ${OUTPUT}`)

  // 2. Conectar a BD y actualizar solo usuarios pagados sin logo
  const db = await mysql.createConnection({
    host:     process.env.DB_HOST || '127.0.0.1',
    port:     parseInt(process.env.DB_PORT) || 3306,
    user:     process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'unclik',
  })

  // Reemplaza TODOS los logos de usuarios pagados (incluye URLs externas como Unsplash)
  const [result] = await db.execute(`
    UPDATE negocios n
    JOIN usuarios u ON u.id = n.usuario_id
    SET n.logo_url = ?
    WHERE u.plan_id >= 2
  `, [LOGO_URL])

  console.log(`✓ Negocios actualizados: ${result.affectedRows}`)

  // Mostrar cuáles quedaron con logo
  const [rows] = await db.execute(`
    SELECT u.id, u.nombre, u.email, u.plan_id, n.logo_url
    FROM usuarios u
    JOIN negocios n ON n.usuario_id = u.id
    WHERE u.plan_id >= 2
    ORDER BY u.plan_id DESC, u.nombre
    LIMIT 20
  `)

  console.log('\nUsuarios pagados con logo:')
  rows.forEach(r => {
    console.log(`  [plan ${r.plan_id}] ${r.nombre} (${r.email}) → ${r.logo_url || '(sin logo)'}`)
  })

  await db.end()
  console.log('\n✓ Listo. Recarga la página para ver el logo.')
}

run().catch(err => { console.error('Error:', err.message); process.exit(1) })
