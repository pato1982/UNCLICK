/**
 * Crea la tabla tb_password_reset_tokens.
 * Ejecutar una vez: node create-password-reset-table.js
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
  CREATE TABLE IF NOT EXISTS tb_password_reset_tokens (
    id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
    usuario_id  INT UNSIGNED NOT NULL,
    token       VARCHAR(64)  NOT NULL,
    expires_at  DATETIME     NOT NULL,
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_reset_token (token),
    KEY idx_reset_usuario (usuario_id),
    CONSTRAINT fk_reset_usuario FOREIGN KEY (usuario_id)
      REFERENCES usuarios (id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
`)

console.log('✅  Tabla tb_password_reset_tokens creada (o ya existía)')
await conn.end()
