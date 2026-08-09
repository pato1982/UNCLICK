/**
 * Migración: agrega soporte para eliminación programada de cuentas.
 * Ejecutar una vez: node add-account-deletion.js
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

console.log('✅  Conectado a MySQL')

// 1. Agregar columna a usuarios (solo si no existe)
const [[colCheck]] = await conn.query(
  `SELECT COLUMN_NAME
   FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'usuarios' AND COLUMN_NAME = 'eliminacion_programada_at'`,
  [process.env.DB_NAME]
)

if (!colCheck) {
  await conn.query(`
    ALTER TABLE usuarios
    ADD COLUMN eliminacion_programada_at DATETIME NULL DEFAULT NULL
    AFTER activo
  `)
  console.log('✅  Columna eliminacion_programada_at agregada a usuarios')
} else {
  console.log('ℹ️   Columna eliminacion_programada_at ya existe')
}

// 2. Extender ENUM de tb_historial_seguridad con los nuevos eventos
await conn.query(`
  ALTER TABLE tb_historial_seguridad
  MODIFY COLUMN accion ENUM(
    'reset_solicitado',
    'reset_password',
    'cambio_password',
    'login_fallido',
    'login_exitoso',
    'logout',
    'sesion_expirada',
    'cuenta_eliminacion_solicitada',
    'cuenta_recuperada',
    'cuenta_eliminada'
  ) NOT NULL
`)
console.log('✅  ENUM de tb_historial_seguridad extendido con acciones de eliminación')

await conn.end()
console.log('🎉  Migración completada')
