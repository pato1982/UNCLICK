/**
 * db-setup.mjs — Completa la BD tras `docker compose up`.
 *
 * El contenedor unclick-mysql auto-crea el schema vía docker-entrypoint-initdb.d
 * desde backend/db/schema.v0.sql (FUENTE DE VERDAD: 22 tablas + seeds de planes,
 * categorías, categorías_locales y categorías_eventos). Este script aplica lo que falta:
 *   1. migrate-fase1-locales-eventos.mjs → no-op idempotente sobre v0 (red de
 *                                          seguridad si se montó la schema.sql vieja)
 *   1b. columnas negocios.logo_url/logo_size → las espera el código, no están en v0
 *   2. seed-subcategorias.sql → las subcategorías (v0 no las trae)
 *   3. seed-qa.mjs            → usuarios y datos demo de QA
 * Resultado: 22 tablas + 109 categorías + 855 subcategorías + datos de prueba.
 *
 * Carga backend/.env y pasa las variables a cada proceso hijo. Como dotenv NO
 * sobreescribe variables ya presentes en el entorno, esto fuerza que las
 * migraciones se conecten al contenedor correcto (DB_PORT=3309) y NO a su
 * fallback histórico (3306, que corresponde a otro proyecto en Docker).
 *
 * Idempotente: las migraciones usan columnExists()/IF NOT EXISTS, el seed de
 * categorías solo corre si la tabla está vacía (no pisa datos custom) y seed-qa
 * omite usuarios ya creados. Re-ejecutar es seguro.
 *
 * Espera a que la BD acepte conexiones antes de empezar (tolera el arranque del
 * contenedor), así `docker compose up -d && npm run db:setup` funciona seguido.
 *
 * Uso:  cd backend && npm run db:setup
 */
import { config } from 'dotenv'
import { spawnSync } from 'child_process'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import mysql from 'mysql2/promise'
import bcrypt from 'bcrypt'

const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: join(__dirname, '.env') })

const dbConfig = {
  host:     process.env.DB_HOST,
  port:     Number(process.env.DB_PORT),
  user:     process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
}

console.log(`▶ Conectando a ${dbConfig.database}@${dbConfig.host}:${dbConfig.port}`)

function runChild(script) {
  console.log(`\n──────── ${script} ────────`)
  const r = spawnSync(process.execPath, [join(__dirname, script)], {
    stdio: 'inherit',
    env: process.env,
  })
  if (r.error || r.status !== 0) {
    console.error(`\n✗ Falló ${script}:`, r.error ?? `código ${r.status}`)
    process.exit(r.status || 1)
  }
}

// ── 0. Esperar a que la BD acepte conexiones (máx ~60s) ───────────────────────
async function waitForDb() {
  for (let i = 1; i <= 30; i++) {
    try {
      const c = await mysql.createConnection(dbConfig)
      await c.end()
      return
    } catch (e) {
      if (i === 1) console.log('⏳ Esperando a que la BD acepte conexiones...')
      await new Promise(r => setTimeout(r, 2000))
    }
  }
  console.error('✗ La BD no respondió tras 60s. ¿Está arriba el contenedor? (docker compose ps)')
  process.exit(1)
}
await waitForDb()

// ── 1. Migraciones (.mjs idempotentes, vía proceso hijo) ──────────────────────
runChild('migrate-fase1-locales-eventos.mjs')

// ── 1b. Columnas que el CÓDIGO (HEAD) espera pero v0 (espejo de stage) no trae ──
//    negocios.logo_url (lo lee routes/auth.js y lo inserta seed-qa) y logo_size
//    (feature del colaborador). Pendientes en stage; el dev debe matchear el código.
{
  const c = await mysql.createConnection(dbConfig)
  const hasCol = async (col) => {
    const [r] = await c.query(
      `SELECT 1 FROM information_schema.columns
       WHERE table_schema=? AND table_name='negocios' AND column_name=? LIMIT 1`,
      [dbConfig.database, col])
    return r.length > 0
  }
  if (!await hasCol('logo_url')) {
    await c.query('ALTER TABLE negocios ADD COLUMN logo_url VARCHAR(500) NULL')
    console.log('✓ negocios.logo_url añadida')
  } else { console.log('  – negocios.logo_url ya existe') }
  if (!await hasCol('logo_size')) {
    await c.query('ALTER TABLE negocios ADD COLUMN logo_size TINYINT UNSIGNED DEFAULT 3')
    console.log('✓ negocios.logo_size añadida')
  } else { console.log('  – negocios.logo_size ya existe') }
  await c.end()
}

// ── 2. Seed de subcategorías (SQL, vía mysql2 — solo si está vacío) ───────────
//    v0 ya sembró tb_categorias (109); aquí añadimos sus subcategorías.
console.log('\n──────── seed-subcategorias.sql ────────')
const conn = await mysql.createConnection({ ...dbConfig, multipleStatements: true })
const [[{ n: existentes }]] = await conn.query('SELECT COUNT(*) AS n FROM tb_subcategorias')
if (existentes > 0) {
  console.log(`✓ tb_subcategorias ya tiene ${existentes} filas; no se re-siembra (preserva datos custom).`)
} else {
  const sql = readFileSync(join(__dirname, 'seed-subcategorias.sql'), 'utf8')
  await conn.query(sql)
  const [[{ n }]] = await conn.query('SELECT COUNT(*) AS n FROM tb_subcategorias')
  console.log(`✓ ${n} subcategorías cargadas`)
}
await conn.end()

// ── 3. Seed de datos QA (usuarios, listings, locales, eventos) ────────────────
runChild('seed-qa.mjs')

// ── 4. Usuario admin (programador) para el panel de administración en dev ─────
//    seed-qa crea solo usuarios rol='usuario'; el panel admin (eventos/locales/
//    servidor/monitor) exige requireProgramador. Este upsert garantiza un admin.
{
  const ADMIN_EMAIL = 'admin@qa.dev'
  const ADMIN_PASS = 'Dev1234!'
  const c = await mysql.createConnection(dbConfig)
  const hash = await bcrypt.hash(ADMIN_PASS, 10)
  const [[existing]] = await c.query('SELECT id FROM usuarios WHERE email=?', [ADMIN_EMAIL])
  if (existing) {
    await c.query(
      "UPDATE usuarios SET password_hash=?, rol='programador', activo=1 WHERE id=?",
      [hash, existing.id])
    console.log(`\n✓ admin ${ADMIN_EMAIL} actualizado (rol=programador)`)
  } else {
    await c.query(
      `INSERT INTO usuarios (id, nombre, email, password_hash, rol, tipo_cuenta, plan_id, activo)
       VALUES (9000, 'Admin Dev', ?, ?, 'programador', 'general', 3, 1)`,
      [ADMIN_EMAIL, hash])
    console.log(`\n✓ admin ${ADMIN_EMAIL} creado (rol=programador, password ${ADMIN_PASS})`)
  }
  await c.end()
}

console.log('\n✅ BD lista: schema v0 + subcategorías + seed QA + admin (22 tablas).')
