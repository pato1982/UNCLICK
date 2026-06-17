import mysql from 'mysql2/promise'
import path from 'path'
import { fileURLToPath } from 'url'
import * as dotenv from 'dotenv'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '.env') })

const db = await mysql.createConnection({
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'unclik',
})

const [rows] = await db.execute(`
  SELECT u.id, u.nombre, u.plan_id, n.logo_url
  FROM usuarios u
  JOIN negocios n ON n.usuario_id = u.id
  WHERE u.plan_id >= 2
  ORDER BY u.plan_id DESC
  LIMIT 10
`)

console.log('Usuarios pagados y su logo_url:')
rows.forEach(r => {
  const logo = r.logo_url || '(vacío)'
  console.log(`  [plan ${r.plan_id}] id=${r.id} ${r.nombre} → ${logo.substring(0, 60)}`)
})

// Verificar API
const res = await fetch(`http://localhost:3001/api/v1/public/business/${rows[0]?.id}`)
const data = await res.json()
console.log(`\nAPI /public/business/${rows[0]?.id}:`)
console.log('  plan_id:', data.business?.plan_id)
console.log('  logo_url:', data.business?.logo_url || '(vacío)')

await db.end()
