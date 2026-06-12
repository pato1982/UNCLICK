/**
 * test-seed-qa.mjs — Verifica que los usuarios QA están en la BD y
 * que el backend los sirve correctamente (login, datos, imágenes locales).
 *
 * Uso: node backend/test-seed-qa.mjs
 */

const BASE = 'http://localhost:3001'
const QA_PASSWORD = 'Dev1234!'

let passed = 0
let failed = 0

function ok(label) {
  console.log(`  ✅ ${label}`)
  passed++
}
function fail(label, detail = '') {
  console.log(`  ❌ ${label}${detail ? ' — ' + detail : ''}`)
  failed++
}
function section(title) {
  console.log(`\n── ${title}`)
}

async function get(path, cookie = '') {
  const headers = cookie ? { Cookie: cookie } : {}
  const res = await fetch(`${BASE}${path}`, { headers })
  const body = await res.json().catch(() => ({}))
  return { status: res.status, body }
}

async function post(path, data, cookie = '') {
  const headers = { 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}) }
  const res = await fetch(`${BASE}${path}`, { method: 'POST', headers, body: JSON.stringify(data) })
  const body = await res.json().catch(() => ({}))
  const setCookie = res.headers.get('set-cookie') || ''
  return { status: res.status, body, cookie: setCookie }
}

function extractCookie(setCookieHeader) {
  const m = setCookieHeader.match(/session_token=([^;]+)/)
  return m ? `session_token=${m[1]}` : ''
}

// ─── 1. Health check ──────────────────────────────────────────────────────────
section('1. Health check')
{
  const { status, body } = await get('/api/v1/health')
  status === 200 && body.ok ? ok('Backend responde') : fail('Backend no responde', `status ${status}`)
}

// ─── 2. Endpoints públicos con datos QA ───────────────────────────────────────
section('2. Endpoints públicos')
{
  const { status, body } = await get('/api/v1/public/listings')
  if (status === 200 && Array.isArray(body.listings) && body.listings.length > 0) {
    ok(`GET /public/listings → ${body.listings.length} listings`)

    // Verificar que las imágenes son locales (/uploads/) — no Unsplash
    const conImagen = body.listings.filter(l => l.imagen)
    const locales   = conImagen.filter(l => l.imagen.startsWith('/uploads/'))
    const externas  = conImagen.filter(l => !l.imagen.startsWith('/uploads/'))
    ok(`Imágenes locales: ${locales.length}/${conImagen.length}`)
    externas.length > 0
      ? fail(`Imágenes externas aún en listings: ${externas.length}`, externas[0]?.imagen)
      : ok('Ninguna imagen externa en listings')

    // Verificar mezcla de planes (owner_plan_id)
    const planes = new Set(body.listings.map(l => l.owner_plan_id).filter(Boolean))
    planes.size >= 2
      ? ok(`Mezcla de planes: ${[...planes].sort().join(', ')}`)
      : fail('Solo un plan en listings — mezcla no funciona')
  } else {
    fail(`GET /public/listings`, `status ${status}`)
  }
}

{
  const { status, body } = await get('/api/v1/public/portadas')
  if (status === 200 && Array.isArray(body.portadas) && body.portadas.length > 0) {
    ok(`GET /public/portadas → ${body.portadas.length} portadas`)
    const conImgs = body.portadas.filter(p => Array.isArray(p.imagenes) && p.imagenes.length > 0)
    ok(`Portadas con imágenes: ${conImgs.length}/${body.portadas.length}`)
    const locales = conImgs.filter(p => p.imagenes.some(img => img.startsWith('/uploads/')))
    ok(`Portadas con imágenes locales: ${locales.length}`)
  } else {
    fail(`GET /public/portadas`, `status ${status}`)
  }
}

{
  const { status, body } = await get('/api/v1/public/tours')
  if (status === 200 && Array.isArray(body.tours) && body.tours.length > 0) {
    ok(`GET /public/tours → ${body.tours.length} tours`)
    const conImgs = body.tours.filter(t => Array.isArray(t.imagenes) && t.imagenes.length > 0)
    ok(`Tours con imágenes: ${conImgs.length}/${body.tours.length}`)
  } else {
    fail(`GET /public/tours`, `status ${status}`)
  }
}

// ─── 3. Login QA — muestras de cada tipo ─────────────────────────────────────
section('3. Login QA con backend real')

const TEST_ACCOUNTS = [
  { email: 'gen_p1_p@qa.dev',   desc: 'General P1 solo productos' },
  { email: 'gen_p2_psa@qa.dev', desc: 'General P2 todos'          },
  { email: 'gen_p3_psa@qa.dev', desc: 'General P3 todos'          },
  { email: 'tur_p3@qa.dev',     desc: 'Turismo Premium'           },
  { email: 'tur_p1@qa.dev',     desc: 'Turismo Gratis'            },
]

const sessions = {}

for (const acc of TEST_ACCOUNTS) {
  const { status, body, cookie } = await post('/api/v1/auth/login', { email: acc.email, password: QA_PASSWORD })
  if (status === 200 && (body.usuario || body.user)) {
    const u = body.usuario || body.user
    sessions[acc.email] = extractCookie(cookie)
    ok(`Login ${acc.email} → plan_id=${u.plan_id} tipo=${u.tipo_cuenta}`)
  } else {
    fail(`Login ${acc.email}`, body.error || `status ${status}`)
  }
}

// ─── 4. Datos autenticados ────────────────────────────────────────────────────
section('4. Datos del panel (autenticado)')

// Business propio
for (const [email, cookie] of Object.entries(sessions)) {
  if (!cookie) continue
  const { status, body } = await get('/api/v1/business', cookie)
  if (status === 200 && body.business?.nombre_negocio) {
    ok(`GET /business → "${body.business.nombre_negocio}" (${email.split('@')[0]})`)
  } else {
    fail(`GET /business para ${email}`, `status ${status}`)
  }
  break // con uno alcanza para verificar el patrón
}

// Listings propios
for (const [email, cookie] of Object.entries(sessions)) {
  if (!cookie) continue
  const { status, body } = await get('/api/v1/listings/mine', cookie)
  if (status === 200 && Array.isArray(body.listings)) {
    ok(`GET /listings/mine → ${body.listings.length} listings (${email.split('@')[0]})`)
  } else {
    fail(`GET /listings/mine para ${email}`, `status ${status}`)
  }
  break
}

// Tours propios (turismo premium)
const turCookie = sessions['tur_p3@qa.dev']
if (turCookie) {
  const { status, body } = await get('/api/v1/tours', turCookie)
  if (status === 200 && Array.isArray(body.tours) && body.tours.length > 0) {
    ok(`GET /tours → ${body.tours.length} tours para tur_p3`)
    const conImgs = body.tours.filter(t => {
      const imgs = typeof t.imagenes === 'string' ? JSON.parse(t.imagenes || '[]') : (t.imagenes || [])
      return imgs.length > 0
    })
    ok(`Tours con imágenes: ${conImgs.length}/${body.tours.length}`)
  } else {
    fail(`GET /tours para tur_p3`, `status ${status}`)
  }

  // Portada propia
  const { status: ps, body: pb } = await get('/api/v1/portada', turCookie)
  if (ps === 200 && pb.portada) {
    const imgs = pb.portada.imagenes || []
    ok(`GET /portada → ${imgs.length} imágenes`)
    const locales = imgs.filter(i => i.startsWith('/uploads/'))
    ok(`Imágenes locales en portada: ${locales.length}/${imgs.length}`)
  } else {
    fail(`GET /portada para tur_p3`, `status ${ps}`)
  }

  // Página premium
  const { status: pgS, body: pgB } = await get('/api/v1/pagina', turCookie)
  if (pgS === 200 && pgB.pagina) {
    ok(`GET /pagina → título: "${pgB.pagina.titulo_superior}"`)
    pgB.pagina.imagen_superior?.startsWith('/uploads/')
      ? ok('Imagen superior de página es local')
      : fail('Imagen superior de página no es local', pgB.pagina.imagen_superior)
  } else {
    fail(`GET /pagina para tur_p3`, `status ${pgS}`)
  }
}

// ─── 5. Endpoint público de negocio específico ────────────────────────────────
section('5. Vista pública de tienda')
{
  // Buscar el ID de un usuario QA
  const { body } = await get('/api/v1/public/listings')
  const listing = body.listings?.[0]
  if (listing?.usuario_id) {
    const uid = listing.usuario_id
    const { status, body: biz } = await get(`/api/v1/public/business/${uid}`)
    status === 200 && biz.business
      ? ok(`GET /public/business/${uid} → "${biz.business.nombre_negocio}"`)
      : fail(`GET /public/business/${uid}`, `status ${status}`)

    const { status: ts, body: tb } = await get(`/api/v1/public/tours/${uid}`)
    ts === 200
      ? ok(`GET /public/tours/${uid} → ${tb.tours?.length ?? 0} tours`)
      : fail(`GET /public/tours/${uid}`, `status ${ts}`)
  } else {
    fail('No se pudo obtener usuario_id de un listing para probar vista pública')
  }
}

// ─── 6. Rate limiting activo ──────────────────────────────────────────────────
section('6. Rate limiting')
{
  // Intentar 22 logins seguidos con credenciales incorrectas (límite: 20)
  let blocked = false
  for (let i = 0; i < 22; i++) {
    const { status } = await post('/api/v1/auth/login', { email: 'x@x.com', password: 'wrong' })
    if (status === 429) { blocked = true; break }
  }
  blocked ? ok('Rate limiting activo en /auth/login (429 después de 20 intentos)') : fail('Rate limiting no disparó en /auth/login')
}

// ─── Resumen ──────────────────────────────────────────────────────────────────
console.log(`\n${'─'.repeat(50)}`)
console.log(`  Total: ${passed + failed} | ✅ ${passed} pasaron | ❌ ${failed} fallaron`)
console.log('─'.repeat(50))
process.exit(failed > 0 ? 1 : 0)
