import 'dotenv/config'
import mysql from 'mysql2/promise'

const pool = mysql.createPool({
  host: '127.0.0.1', port: 3306,
  user: 'root', password: '', database: 'unclik',
})

// Recrear con columnas correctas (solo había 11 filas de prueba)
await pool.query('DROP TABLE IF EXISTS tb_analytics_clicks')
await pool.query('DROP TABLE IF EXISTS tb_analytics_visitas')

await pool.query(`
  CREATE TABLE tb_analytics_visitas (
    id          INT UNSIGNED  NOT NULL AUTO_INCREMENT PRIMARY KEY,
    usuario_id  INT UNSIGNED  NOT NULL,
    session_id  VARCHAR(64),
    pagina      VARCHAR(80),
    ip          VARCHAR(45),
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
  ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
`)

await pool.query(`
  CREATE TABLE tb_analytics_clicks (
    id          INT UNSIGNED  NOT NULL AUTO_INCREMENT PRIMARY KEY,
    usuario_id  INT UNSIGNED  NOT NULL,
    listing_id  INT UNSIGNED,
    ip          VARCHAR(45),
    event_type  VARCHAR(40),
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
  ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
`)

console.log('OK: tablas analytics recreadas con columnas correctas')

// Datos de prueba para usuarios QA — últimos 6 meses
const [usuarios] = await pool.query("SELECT id FROM usuarios WHERE email LIKE '%@qa.dev' LIMIT 10")
let visitas = 0, clks = 0

for (const u of usuarios) {
  for (let mesAtras = 5; mesAtras >= 0; mesAtras--) {
    const cantV = Math.floor(Math.random() * 40) + 5
    for (let i = 0; i < cantV; i++) {
      const fecha = new Date()
      fecha.setMonth(fecha.getMonth() - mesAtras)
      fecha.setDate(Math.floor(Math.random() * 28) + 1)
      const ip = `192.168.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}`
      await pool.query(
        'INSERT INTO tb_analytics_visitas (usuario_id, ip, pagina, created_at) VALUES (?, ?, ?, ?)',
        [u.id, ip, 'tienda', fecha.toISOString().slice(0,19).replace('T',' ')]
      )
      visitas++
    }
    const cantC = Math.floor(Math.random() * 15) + 2
    for (let i = 0; i < cantC; i++) {
      const fecha = new Date()
      fecha.setMonth(fecha.getMonth() - mesAtras)
      fecha.setDate(Math.floor(Math.random() * 28) + 1)
      const ip = `192.168.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}`
      await pool.query(
        'INSERT INTO tb_analytics_clicks (usuario_id, ip, event_type, created_at) VALUES (?, ?, ?, ?)',
        [u.id, ip, 'product_click', fecha.toISOString().slice(0,19).replace('T',' ')]
      )
      clks++
    }
  }
}

console.log(`OK: ${visitas} visitas y ${clks} clicks insertados para ${usuarios.length} usuarios QA`)
await pool.end()
