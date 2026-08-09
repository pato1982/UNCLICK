/**
 * Crea la tabla negocios (perfil de negocio de cada usuario).
 * Un usuario → un registro (UNIQUE en usuario_id).
 * Aplica para ambos tipos: general y turismo.
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
  await conn.query(`
    CREATE TABLE IF NOT EXISTS negocios (
      id              INT AUTO_INCREMENT PRIMARY KEY,
      usuario_id      INT UNSIGNED NOT NULL UNIQUE,
      nombre_negocio  VARCHAR(120),
      slogan          VARCHAR(220),
      descripcion     TEXT,
      ubicacion       VARCHAR(120),
      direccion       VARCHAR(220),
      whatsapp        VARCHAR(30),
      telefono        VARCHAR(30),
      correo          VARCHAR(100),
      facebook        VARCHAR(400),
      instagram       VARCHAR(400),
      horarios        JSON,
      logo_url        VARCHAR(500),
      created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `)
  console.log('✅  Tabla negocios creada (o ya existía)')
} catch (err) {
  console.error('❌  Error:', err.message)
} finally {
  conn.release()
  await pool.end()
}
