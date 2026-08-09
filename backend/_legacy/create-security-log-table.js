/**
 * Crea la tabla tb_historial_seguridad.
 * Ejecutar una vez: node create-security-log-table.js
 */
import 'dotenv/config'
import mysql from 'mysql2/promise'

const conn = await mysql.createConnection({
  host:     process.env.DB_HOST,
  port:     Number(process.env.DB_PORT),
  user:     process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
})

await conn.query(`
  CREATE TABLE IF NOT EXISTS tb_historial_seguridad (
    id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
    usuario_id  INT UNSIGNED NULL COMMENT 'NULL si el usuario no existe (login fallido con email desconocido)',
    accion      ENUM(
                  'reset_solicitado',
                  'reset_password',
                  'cambio_password',
                  'login_fallido',
                  'login_exitoso',
                  'logout',
                  'sesion_expirada'
                ) NOT NULL,
    detalle     VARCHAR(255) NULL COMMENT 'Info extra: email intentado, motivo, etc.',
    ip          VARCHAR(45)  NULL,
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_seg_usuario  (usuario_id),
    KEY idx_seg_accion   (accion),
    KEY idx_seg_created  (created_at),
    CONSTRAINT fk_seg_usuario FOREIGN KEY (usuario_id)
      REFERENCES usuarios (id) ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
`)

console.log('✅  Tabla tb_historial_seguridad creada (o ya existía)')
await conn.end()
