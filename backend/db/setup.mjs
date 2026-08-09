#!/usr/bin/env node
/**
 * Construye la base de datos local desde cero, de forma idempotente.
 *
 *   npm run db:setup            aplica esquema + migraciones + seeds
 *   npm run db:setup -- --fresh borra la BD y la reconstruye
 *   npm run db:setup -- --schema-only  solo esquema + migraciones, sin datos
 *
 * Es el único punto de entrada. No ejecutar los scripts de backend/_legacy/.
 */
import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import mysql from 'mysql2/promise'
import * as dotenv from 'dotenv'

const __dirname = dirname(fileURLToPath(import.meta.url))
const BACKEND = join(__dirname, '..')
dotenv.config({ path: join(BACKEND, '.env') })

const { DB_HOST, DB_PORT, DB_USER, DB_PASS, DB_NAME } = process.env

if (!DB_HOST || !DB_PORT || !DB_USER || !DB_NAME) {
  console.error('❌  Faltan variables de BD. Copia backend/.env.example a backend/.env')
  process.exit(1)
}

const args = process.argv.slice(2)
const FRESH = args.includes('--fresh')
const SCHEMA_ONLY = args.includes('--schema-only')

// Los .sql traen `CREATE DATABASE` / `USE unclik` hardcodeados. Se quitan para
// que el destino lo decida DB_NAME y los archivos sirvan con cualquier nombre
// de BD (antes había que retargetearlos con sed antes de aplicarlos).
function stripDatabaseDirectives(sql) {
  return sql
    .replace(/^\s*CREATE\s+DATABASE[\s\S]*?;\s*$/gim, '')
    .replace(/^\s*USE\s+[`\w]+\s*;\s*$/gim, '')
}

async function applySqlFile(conn, relPath) {
  const full = join(BACKEND, relPath)
  const raw = await readFile(full, 'utf8')
  const sql = stripDatabaseDirectives(raw).trim()
  if (!sql) return
  await conn.query(sql)
  console.log(`   ✓ ${relPath}`)
}

async function main() {
  const base = {
    host: DB_HOST,
    port: Number(DB_PORT),
    user: DB_USER,
    password: DB_PASS,
    multipleStatements: true,
    // Mismo criterio que el pool de la app: instantes en UTC, sin que el driver
    // reinterprete según la zona del proceso.
    timezone: 'Z',
  }

  const admin = await mysql.createConnection(base)
  if (FRESH) {
    console.log(`⚠️  --fresh: eliminando la base ${DB_NAME}`)
    await admin.query(`DROP DATABASE IF EXISTS \`${DB_NAME}\``)
  }
  await admin.query(
    `CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
  )
  await admin.end()

  const conn = await mysql.createConnection({ ...base, database: DB_NAME })
  console.log(`\n🔌  ${DB_USER}@${DB_HOST}:${DB_PORT}/${DB_NAME}\n`)

  console.log('📐  Esquema y migraciones')
  await applySqlFile(conn, 'schema.sql')
  await applySqlFile(conn, 'migrations/001_gaps_mysql8.sql')
  await applySqlFile(conn, 'migrations/002_tablas_faltantes.sql')
  await applySqlFile(conn, 'migrations/003_local_dev_gaps.sql')

  if (!SCHEMA_ONLY) {
    console.log('\n🌱  Datos de desarrollo')
    await applySqlFile(conn, 'db/seeds/01_catalogo.sql')

    const { seedUsuarios } = await import('./seeds/02_usuarios.mjs')
    await seedUsuarios(conn)

    const { seedContenido } = await import('./seeds/03_contenido.mjs')
    await seedContenido(conn)
  }

  const [[stats]] = await conn.query(`
    SELECT (SELECT COUNT(*) FROM tb_categorias)     AS categorias,
           (SELECT COUNT(*) FROM tb_subcategorias)  AS subcategorias,
           (SELECT COUNT(*) FROM usuarios)          AS usuarios,
           (SELECT COUNT(*) FROM tb_listings)       AS listings,
           (SELECT COUNT(*) FROM tb_eventos)        AS eventos,
           (SELECT COUNT(*) FROM tb_locales)        AS locales,
           (SELECT COUNT(*) FROM tb_tours)          AS tours
  `)

  console.log('\n📊  Resumen')
  for (const [k, v] of Object.entries(stats)) {
    console.log(`   ${k.padEnd(15)} ${v}`)
  }
  console.log('\n✅  Base lista. Arranca con: cd backend && npm run dev\n')

  await conn.end()
}

main().catch((err) => {
  console.error('\n❌  Falló el setup:', err.message)
  if (err.sql) console.error('    SQL:', String(err.sql).slice(0, 200))
  process.exit(1)
})
