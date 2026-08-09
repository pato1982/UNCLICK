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
    CREATE TABLE IF NOT EXISTS paginas (
      id               INT AUTO_INCREMENT PRIMARY KEY,
      usuario_id       INT UNSIGNED NOT NULL UNIQUE,
      titulo_superior  VARCHAR(200),
      texto_superior   TEXT,
      imagen_superior  VARCHAR(500),
      titulo_inferior  VARCHAR(200),
      texto_inferior   TEXT,
      imagen_inferior  VARCHAR(500),
      crop_superior    JSON,
      crop_inferior    JSON,
      created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `)
  console.log('✅  Tabla paginas creada (o ya existía)')
} catch (err) {
  console.error('❌  Error:', err.message)
} finally {
  conn.release()
  await pool.end()
}
