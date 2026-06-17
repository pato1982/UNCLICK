/**
 * Migración local: agrega columna logo_size a la tabla negocios.
 * Ejecutar: node backend/migrate-logo-size.mjs
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

const [cols] = await db.query(
  `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'negocios' AND COLUMN_NAME = 'logo_size'`
)

if (cols.length) {
  console.log('✓ logo_size ya existe en negocios, nada que hacer.')
} else {
  await db.query(`ALTER TABLE negocios ADD COLUMN logo_size TINYINT UNSIGNED DEFAULT 3 AFTER logo_url`)
  console.log('✓ Columna logo_size añadida (TINYINT, DEFAULT 3)')
}

const [res] = await db.query(`UPDATE negocios SET logo_size = 3 WHERE logo_size IS NULL`)
if (res.affectedRows) console.log(`✓ ${res.affectedRows} filas corregidas a DEFAULT 3`)

await db.end()
console.log('Migración completada.')
