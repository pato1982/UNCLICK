/**
 * Agrega columna `ubicacion` a la tabla `negocios`.
 * Usado por turismo users para indicar la región (ej: "Villarrica, La Araucanía").
 * Es seguro re-ejecutar: IF NOT EXISTS evita duplicar la columna.
 *
 * Correr una vez: node backend/add-ubicacion-negocios.js
 */
import 'dotenv/config'
import mysql from 'mysql2/promise'

const pool = await mysql.createPool({
  host:     process.env.DB_HOST,
  port:     Number(process.env.DB_PORT),
  user:     process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
})

const conn = await pool.getConnection()

try {
  // Verificar si la columna ya existe antes de agregarla
  const [cols] = await conn.query(`
    SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'negocios' AND COLUMN_NAME = 'ubicacion'
  `)

  if (cols.length > 0) {
    console.log('✅  Columna `ubicacion` ya existe en `negocios` — nada que hacer.')
  } else {
    await conn.query(`
      ALTER TABLE negocios
      ADD COLUMN ubicacion VARCHAR(120) NULL AFTER descripcion
    `)
    console.log('✅  Columna `ubicacion` agregada a `negocios`.')
  }
} catch (err) {
  console.error('❌  Error:', err.message)
} finally {
  conn.release()
  await pool.end()
}
