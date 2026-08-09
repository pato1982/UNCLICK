import 'dotenv/config'
import mysql from 'mysql2/promise'

const BASE = `http://localhost:${process.env.PORT || 3001}/api/v1`
let pass = 0, fail = 0
const ok  = label => { console.log('  OK  ', label); pass++ }
const err = (label, msg) => { console.log('  FAIL', label, '-', String(msg).slice(0, 150)); fail++ }

const ts = Date.now()
const pool = await mysql.createPool({ host: process.env.DB_HOST, port: Number(process.env.DB_PORT), user: process.env.DB_USER, password: process.env.DB_PASS, database: process.env.DB_NAME })

// ── Crear usuario general y usuario programador ───────────────────────────
const r0a = await fetch(BASE+'/auth/register', {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ nombre: 'MonGen', email: 'mongen'+ts+'@t.cl', password: 'test123', tipo_cuenta: 'general', vende_productos: 1 })
})
const ckGen = r0a.headers.get('set-cookie').split(';')[0]
if (r0a.status === 201) ok('register usuario general')
else { err('register gen', await r0a.text()); process.exit(1) }

const r0b = await fetch(BASE+'/auth/register', {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ nombre: 'MonProg', email: 'monprog'+ts+'@t.cl', password: 'test123', tipo_cuenta: 'general', vende_productos: 1 })
})
const ckProg = r0b.headers.get('set-cookie').split(';')[0]
const { usuario: progUser } = await r0b.json()
// Elevar a programador
await pool.query("UPDATE usuarios SET rol = 'programador' WHERE id = ?", [progUser.id])
ok('register programador id='+progUser.id)

// ── 1. POST /servidor/visita (sin sesion) → 200 ───────────────────────────
const r1 = await fetch(BASE+'/servidor/visita', {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ pagina: 'home' })
})
if (r1.status === 200) ok('POST /servidor/visita -> 200 (sin sesion)')
else err('visita 200', r1.status)

// Agregar mas visitas para las metricas
for (let i = 0; i < 4; i++) {
  await fetch(BASE+'/servidor/visita', {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': `10.0.0.${i+1}` },
    body: JSON.stringify({ pagina: 'home' })
  })
}
ok('5 visitas adicionales con IPs distintas')

// ── 2. GET /servidor/estadisticas sin sesion → 401 ────────────────────────
const r2 = await fetch(BASE+'/servidor/estadisticas')
if (r2.status === 401) ok('GET /servidor/estadisticas sin sesion -> 401')
else err('401 estadisticas', r2.status)

// ── 3. GET /servidor/estadisticas con usuario general → 403 ──────────────
const r3 = await fetch(BASE+'/servidor/estadisticas', { headers: { Cookie: ckGen } })
if (r3.status === 403) ok('GET /servidor/estadisticas usuario general -> 403')
else err('403 estadisticas gen', r3.status + ' ' + await r3.text())

// ── 4. GET /servidor/estadisticas con programador → 200 + estructura ──────
const r4 = await fetch(BASE+'/servidor/estadisticas', { headers: { Cookie: ckProg } })
const d4 = await r4.json()
if (r4.status !== 200) { err('estadisticas 200', r4.status + ' ' + JSON.stringify(d4)); }
else {
  const { kpis, visitas } = d4
  const validKpis = typeof kpis?.total === 'number' && typeof kpis?.general_gratis === 'number'
  if (validKpis) ok('GET /servidor/estadisticas -> kpis con campos numericos')
  else err('kpis campos', JSON.stringify(kpis))

  if (kpis?.total >= 2) ok('kpis.total >= 2 (hay usuarios registrados)')
  else err('kpis.total', 'got '+kpis?.total)

  const validVisitas = typeof visitas?.hoy === 'number' && typeof visitas?.semanales === 'number' && typeof visitas?.visitantes_unicos === 'number'
  if (validVisitas) ok('GET /servidor/estadisticas -> visitas con campos numericos')
  else err('visitas campos', JSON.stringify(visitas))

  if (visitas?.hoy >= 5) ok('visitas.hoy >= 5 (contabiliza las que insertamos)')
  else err('visitas.hoy', 'got '+visitas?.hoy)

  if (visitas?.visitantes_unicos >= 4) ok('visitantes_unicos >= 4 (IPs distintas)')
  else err('visitantes_unicos', 'got '+visitas?.visitantes_unicos)
}

// ── 5. GET /monitor sin sesion → 401 ─────────────────────────────────────
const r5 = await fetch(BASE+'/monitor', { credentials: 'include' })
if (r5.status === 401) ok('GET /monitor sin sesion -> 401')
else err('monitor 401', r5.status)

// ── 6. GET /monitor con usuario general → 403 ────────────────────────────
const r6 = await fetch(BASE+'/monitor', { headers: { Cookie: ckGen } })
if (r6.status === 403) ok('GET /monitor usuario general -> 403')
else err('monitor 403 gen', r6.status)

// ── 7. GET /monitor con programador → 200 + estructura ───────────────────
const r7 = await fetch(BASE+'/monitor?limit=50', { headers: { Cookie: ckProg } })
const d7 = await r7.json()
if (r7.status !== 200) { err('monitor 200', r7.status + ' ' + JSON.stringify(d7)); }
else {
  const hasListing = Array.isArray(d7.listings)
  const hasBusiness = Array.isArray(d7.businesses)
  if (hasListing && hasBusiness) ok('GET /monitor -> listings y businesses son arrays')
  else err('monitor estructura', JSON.stringify(Object.keys(d7)))

  if (typeof d7.total === 'number' && typeof d7.businesses_total === 'number') ok('GET /monitor -> total y businesses_total numericos')
  else err('monitor totales', JSON.stringify({total: d7.total, bt: d7.businesses_total}))

  if (d7.generado) ok('GET /monitor -> generado presente: '+d7.generado.slice(0,19))
  else err('monitor generado', 'no generado')

  // Verificar que los listings tienen los campos enriquecidos de usuario
  const listing = d7.listings?.[0]
  if (listing) {
    if (listing.usuario_nombre && listing.usuario_email && typeof listing.plan_id === 'number') ok('listings enriquecidos con usuario_nombre/email/plan_id')
    else err('listing enriquecido', JSON.stringify({nombre: listing.usuario_nombre, email: listing.usuario_email, plan: listing.plan_id}))
  } else {
    ok('listings vacio (no hay publicaciones) — skip')
  }

  // Verificar que los businesses tienen los campos enriquecidos
  const biz = d7.businesses?.[0]
  if (biz) {
    if (biz.usuario_nombre && biz.usuario_email) ok('businesses enriquecidos con usuario_nombre/email')
    else err('biz enriquecido', JSON.stringify({nombre: biz.usuario_nombre, email: biz.usuario_email}))
  } else {
    ok('businesses vacio — skip')
  }
}

// ── 8. Crear un listing con usuario general y verificar que aparece en monitor ─
const rL = await fetch(BASE+'/listings', {
  method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: ckGen },
  body: JSON.stringify({ tipo: 'producto', seccion: 'destacados', nombre: 'Producto Monitor '+ts, precio: 5000, categoria: 'Ropa' })
})
const dL = await rL.json()
if (rL.status === 201) ok('POST listing para monitor id='+dL.listing?.id)
else err('listing monitor', rL.status)

const r8 = await fetch(BASE+'/monitor?limit=50', { headers: { Cookie: ckProg } })
const d8 = await r8.json()
const myListing = d8.listings?.find(l => l.nombre === 'Producto Monitor '+ts)
if (myListing) ok('Listing aparece en /monitor con datos enriquecidos (usuario_nombre='+myListing.usuario_nombre+')')
else err('listing en monitor', 'no encontrado. Total: '+d8.listings?.length)

await pool.end()
console.log('\n  Resultado:', pass+'/'+(pass+fail), 'pasaron')
if (fail > 0) process.exit(1)
