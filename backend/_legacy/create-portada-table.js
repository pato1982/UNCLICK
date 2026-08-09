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
    CREATE TABLE IF NOT EXISTS portadas (
      id              INT AUTO_INCREMENT PRIMARY KEY,
      usuario_id      INT UNSIGNED NOT NULL UNIQUE,
      nombre          VARCHAR(120),
      descripcion     TEXT,
      imagenes        JSON,
      imagenes_crop   JSON,
      categorias      JSON,
      activo          TINYINT(1) NOT NULL DEFAULT 1,
      created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `)
  console.log('✅  Tabla portadas creada (o ya existía)')
} catch (err) {
  console.error('❌  Error:', err.message)
} finally {
  conn.release()
  await pool.end()
}
