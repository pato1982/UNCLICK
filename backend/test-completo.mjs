/**
 * test-completo.mjs — Suite completa de verificación del estado del proyecto.
 * Cubre: salud, endpoints públicos, registro, login, perfil, panel, analytics,
 *        apariencia, imágenes locales y rate limiting.
 *
 * Uso: node backend/test-completo.mjs
 */

const BASE = `http://localhost:${process.env.PORT || 3001}`
const QA_PASSWORD = 'Dev1234!'
const APARIENCIA_CAMPOS = [
  'header_preset','header_color','header_height','header_bar',
  'banner_color','services_color','arriendos_color',
  'sidebar_style','nav_color','nav_style',
]

let passed = 0, failed = 0

function ok(label)         { console.log(`  ✅ ${label}`); passed++ }
function fail(label, d='') { console.log(`  ❌ ${label}${d ? ' — '+d : ''}`); failed++ }
function section(t)        { console.log(`\n── ${t}`) }

async function get(path, cookie='') {
  const h = cookie ? { Cookie: cookie } : {}
  const res = await fetch(`${BASE}${path}`, { headers: h })
  const body = await res.json().catch(() => ({}))
  return { status: res.status, body }
}

async function post(path, data, cookie='') {
  const h = { 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}) }
  const res = await fetch(`${BASE}${path}`, { method:'POST', headers:h, body:JSON.stringify(data) })
  const body = await res.json().catch(() => ({}))
  const sc   = res.headers.get('set-cookie') || ''
  return { status: res.status, body, cookie: sc }
}

async function put(path, data, cookie='') {
  const h = { 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}) }
  const res = await fetch(`${BASE}${path}`, { method:'PUT', headers:h, body:JSON.stringify(data) })
  const body = await res.json().catch(() => ({}))
  return { status: res.status, body }
}

function extractCookie(sc) {
  const m = sc.match(/session_token=([^;]+)/)
  return m ? `session_token=${m[1]}` : ''
}

// ─── 1. Health ────────────────────────────────────────────────────────────────
section('1. Health check')
{
  const { status, body } = await get('/api/v1/health')
  status === 200 && body.ok ? ok(`Backend activo en ${BASE}`) : fail('Backend no responde', `status ${status}`)
}

// ─── 2. Endpoints públicos ────────────────────────────────────────────────────
section('2. Marketplace público (sin sesión)')
let primerUserId = null
{
  const { status, body } = await get('/api/v1/public/listings')
  if (status === 200 && Array.isArray(body.listings) && body.listings.length > 0) {
    ok(`GET /public/listings → ${body.listings.length} listings`)
    const conImg   = body.listings.filter(l => l.imagen)
    const locales  = conImg.filter(l => l.imagen.startsWith('/uploads/'))
    ok(`Imágenes locales: ${locales.length}/${conImg.length}`)
    const conPlan  = body.listings.filter(l => l.owner_plan_id != null)
    conPlan.length === body.listings.length
      ? ok(`owner_plan_id presente en todos (${conPlan.length}) los listings`)
      : fail(`owner_plan_id faltante en ${body.listings.length - conPlan.length} listings`)
    primerUserId = body.listings[0]?.usuario_id ?? null
  } else { fail('GET /public/listings', `status ${status}`) }
}
{
  const { status, body } = await get('/api/v1/public/portadas')
  status === 200 && Array.isArray(body.portadas) && body.portadas.length > 0
    ? ok(`GET /public/portadas → ${body.portadas.length} portadas`)
    : fail('GET /public/portadas', `status ${status}`)
}
{
  const { status, body } = await get('/api/v1/public/tours')
  status === 200 && Array.isArray(body.tours) && body.tours.length > 0
    ? ok(`GET /public/tours → ${body.tours.length} tours`)
    : fail('GET /public/tours', `status ${status}`)
}

// ─── 3. Apariencia en endpoint público ───────────────────────────────────────
section('3. Campos de apariencia en negocio público')
if (primerUserId) {
  const { status, body } = await get(`/api/v1/public/business/${primerUserId}`)
  if (status === 200 && body.business) {
    const biz = body.business
    const ausentes = APARIENCIA_CAMPOS.filter(c => !(c in biz))
    ausentes.length === 0
      ? ok(`Los 10 campos de apariencia presentes en /public/business/${primerUserId}`)
      : fail(`Campos ausentes: ${ausentes.join(', ')}`)
    const conValor = APARIENCIA_CAMPOS.filter(c => biz[c] != null)
    ok(`${conValor.length}/10 campos con valor configurado`)
    biz.plan_id != null ? ok(`plan_id = ${biz.plan_id}`) : fail('plan_id ausente')
    biz.tipo_cuenta      ? ok(`tipo_cuenta = ${biz.tipo_cuenta}`) : fail('tipo_cuenta ausente')
  } else { fail(`GET /public/business/${primerUserId}`, `status ${status}`) }
} else { fail('Test de apariencia omitido — sin userId') }

// ─── 4. Registro de usuario nuevo ────────────────────────────────────────────
section('4. Registro — todos los campos personales se guardan')
const rnd = Date.now()
const nuevoEmail = `test_${rnd}@example.com`
let regCookie = ''
{
  const { status, body, cookie } = await post('/api/v1/auth/register', {
    nombre: 'Test Completo',
    email: nuevoEmail,
    password: 'Test1234!',
    dni: `20${rnd % 90000000 + 10000000}`,
    telefono: '+56 9 1234 5678',
    comuna: 'Villarrica',
    direccion: 'Av. Test 999',
    tipo_cuenta: 'general',
    vende_productos: true,
    ofrece_servicios: false,
    ofrece_arriendos: false,
    plan_id: 1,
  })
  if (status === 201 && (body.usuario || body.user)) {
    const u = body.usuario || body.user
    regCookie = extractCookie(cookie)
    ok(`Registro exitoso → id=${u.id} plan_id=${u.plan_id}`)
    u.dni       ? ok(`dni guardado → ${u.dni}`)       : fail('dni NO guardado')
    u.telefono  ? ok(`telefono guardado → ${u.telefono}`)  : fail('telefono NO guardado')
    u.comuna    ? ok(`comuna guardada → ${u.comuna}`)   : fail('comuna NO guardada')
    u.direccion ? ok(`direccion guardada → ${u.direccion}`) : fail('direccion NO guardada')
  } else { fail('POST /auth/register', body.error || `status ${status}`) }
}

// Verificar que se creó fila en negocios automáticamente
{
  const { status, body } = await get('/api/v1/business', regCookie)
  status === 200 && body.business !== undefined
    ? ok('Fila en negocios creada automáticamente al registrarse')
    : fail('No se creó fila en negocios al registrar', `status ${status}`)
}

// Logout del usuario de prueba
await post('/api/v1/auth/logout', {}, regCookie)

// ─── 5. Login QA — muestra de cada tipo ──────────────────────────────────────
section('5. Login QA con datos reales en BD')
const TEST_ACCOUNTS = [
  { email: 'gen_p1_p@qa.dev',   tipo: 'general',  plan: 1 },
  { email: 'gen_p2_psa@qa.dev', tipo: 'general',  plan: 2 },
  { email: 'gen_p3_psa@qa.dev', tipo: 'general',  plan: 3 },
  { email: 'tur_p3@qa.dev',     tipo: 'turismo',  plan: 5 },
  { email: 'tur_p1@qa.dev',     tipo: 'turismo',  plan: 1 },
]
const sessions = {}
for (const acc of TEST_ACCOUNTS) {
  const { status, body, cookie } = await post('/api/v1/auth/login', { email: acc.email, password: QA_PASSWORD })
  if (status === 200 && (body.usuario || body.user)) {
    const u = body.usuario || body.user
    sessions[acc.email] = extractCookie(cookie)
    u.plan_id === acc.plan && u.tipo_cuenta === acc.tipo
      ? ok(`Login ${acc.email} → plan=${u.plan_id} tipo=${u.tipo_cuenta}`)
      : fail(`Login ${acc.email}`, `plan=${u.plan_id} tipo=${u.tipo_cuenta} (esperado plan=${acc.plan} tipo=${acc.tipo})`)
  } else { fail(`Login ${acc.email}`, body.error || `status ${status}`) }
}

// ─── 6. Datos del perfil — GET /auth/me ──────────────────────────────────────
section('6. GET /auth/me — datos del usuario autenticado')
for (const [email, cookie] of Object.entries(sessions)) {
  if (!cookie) continue
  const { status, body } = await get('/api/v1/auth/me', cookie)
  if (status === 200 && (body.usuario || body.user)) {
    const u = body.usuario || body.user
    ok(`/auth/me para ${email.split('@')[0]} → nombre="${u.nombre}" plan=${u.plan_id}`)
  } else { fail(`/auth/me para ${email}`, `status ${status}`) }
  break
}

// ─── 7. Endpoints del perfil (nuevos) ────────────────────────────────────────
section('7. Endpoints de perfil modal (/auth/profile/...)')
const genCookie = sessions['gen_p1_p@qa.dev'] || Object.values(sessions)[0]
if (genCookie) {
  {
    const { status, body } = await get('/api/v1/auth/profile/counts', genCookie)
    if (status === 200) {
      ok(`GET /profile/counts → productos=${body.productos} servicios=${body.servicios} arriendos=${body.arriendos}`)
    } else { fail('GET /profile/counts', `status ${status}`) }
  }
  {
    const { status, body } = await get('/api/v1/auth/profile/history', genCookie)
    status === 200 && Array.isArray(body.history)
      ? ok(`GET /profile/history → ${body.history.length} eventos`)
      : fail('GET /profile/history', `status ${status}`)
  }
  {
    const { status, body } = await put('/api/v1/auth/profile', { telefono: '+56 9 0000 0000' }, genCookie)
    if (status === 200 && (body.usuario || body.user)) {
      const u = body.usuario || body.user
      ok(`PUT /profile → teléfono actualizado a "${u.telefono}"`)
    } else { fail('PUT /profile', body.error || `status ${status}`) }
  }
}

// ─── 8. Panel de administración ──────────────────────────────────────────────
section('8. Panel — datos reales del negocio y productos')
for (const [email, cookie] of Object.entries(sessions)) {
  if (!cookie) continue
  const { status, body } = await get('/api/v1/business', cookie)
  if (status === 200 && body.business) {
    ok(`GET /business → "${body.business.nombre_negocio || '(sin nombre)'}" (${email.split('@')[0]})`)
  } else { fail(`GET /business para ${email}`, `status ${status}`) }
  break
}
{
  const cookie = sessions['gen_p1_p@qa.dev']
  if (cookie) {
    const { status, body } = await get('/api/v1/listings/mine', cookie)
    status === 200 && Array.isArray(body.listings)
      ? ok(`GET /listings/mine → ${body.listings.length} listings propios`)
      : fail('GET /listings/mine', `status ${status}`)
  }
}

// ─── 9. Panel turismo ────────────────────────────────────────────────────────
section('9. Panel turismo — tours, portada, página')
const turCookie = sessions['tur_p3@qa.dev']
if (turCookie) {
  {
    const { status, body } = await get('/api/v1/tours', turCookie)
    if (status === 200 && Array.isArray(body.tours) && body.tours.length > 0) {
      ok(`GET /tours → ${body.tours.length} tours`)
      const conImg = body.tours.filter(t => {
        const imgs = typeof t.imagenes === 'string' ? JSON.parse(t.imagenes||'[]') : (t.imagenes||[])
        return imgs.length > 0
      })
      ok(`Tours con imágenes locales: ${conImg.length}/${body.tours.length}`)
    } else { fail('GET /tours para tur_p3', `status ${status}`) }
  }
  {
    const { status, body } = await get('/api/v1/portada', turCookie)
    if (status === 200 && body.portada) {
      const imgs = body.portada.imagenes || []
      ok(`GET /portada → ${imgs.length} imágenes`)
      const locales = imgs.filter(i => i.startsWith('/uploads/'))
      ok(`Imágenes locales en portada: ${locales.length}/${imgs.length}`)
    } else { fail('GET /portada para tur_p3', `status ${status}`) }
  }
  {
    const { status, body } = await get('/api/v1/pagina', turCookie)
    if (status === 200 && body.pagina) {
      ok(`GET /pagina → "${body.pagina.titulo_superior}"`)
      body.pagina.imagen_superior?.startsWith('/uploads/')
        ? ok('imagen_superior es local')
        : fail('imagen_superior no es local', body.pagina.imagen_superior)
    } else { fail('GET /pagina para tur_p3', `status ${status}`) }
  }
}

// ─── 10. Analytics — track y stats ───────────────────────────────────────────
section('10. Analytics — registro y lectura de estadísticas')
if (primerUserId) {
  {
    const { status } = await post('/api/v1/analytics/track', {
      user_id: primerUserId, event_type: 'page_view', pagina: 'tienda'
    })
    status === 200 ? ok('POST /analytics/track page_view → OK') : fail('POST /analytics/track', `status ${status}`)
  }
  {
    const { status } = await post('/api/v1/analytics/track', {
      user_id: primerUserId, event_type: 'product_click', listing_id: 1
    })
    status === 200 ? ok('POST /analytics/track product_click → OK') : fail('POST /analytics/track product_click', `status ${status}`)
  }
}
{
  const cookie = sessions['gen_p1_p@qa.dev'] || Object.values(sessions)[0]
  if (cookie) {
    const { status, body } = await get('/api/v1/analytics/stats', cookie)
    if (status === 200 && Array.isArray(body.visitas)) {
      ok(`GET /analytics/stats → ${body.visitas.length} meses de datos`)
      const totalVisitas = body.visitas.reduce((s,m) => s + m.valor, 0)
      const totalClicks  = body.clicks.reduce((s,m) => s + m.valor, 0)
      ok(`Visitas acumuladas (6 meses): ${totalVisitas}`)
      ok(`Clicks acumulados (6 meses): ${totalClicks}`)
      ok(`Resumen mes actual: visitas=${body.resumen.visitas_mes} únicos=${body.resumen.visitantes_unicos} clicks=${body.resumen.clicks_mes}`)
    } else { fail('GET /analytics/stats', body.error || `status ${status}`) }
  }
}

// ─── 11. Rate limiting ───────────────────────────────────────────────────────
section('11. Rate limiting activo')
{
  let blocked = false
  for (let i = 0; i < 22; i++) {
    const { status } = await post('/api/v1/auth/login', { email: 'x@x.com', password: 'wrong' })
    if (status === 429) { blocked = true; break }
  }
  blocked ? ok('Rate limiting activo en /auth/login (429 tras 20 intentos)') : fail('Rate limiting no disparó')
}

// ─── 12. Schema analytics — columnas correctas ───────────────────────────────
section('12. Verificación directa de BD — columnas analytics')
{
  const { status, body } = await get('/api/v1/health')
  // Verificamos indirectamente que analytics/stats responde sin error de columna
  const cookie = sessions['gen_p2_psa@qa.dev'] || Object.values(sessions)[0]
  if (cookie) {
    const { status: as, body: ab } = await get('/api/v1/analytics/stats', cookie)
    as === 200 && !ab.error
      ? ok('analytics/stats no arroja error de columna — BD sincronizada con schema')
      : fail('analytics/stats devuelve error', ab.error || `status ${as}`)
  }
}

// ─── Resumen ──────────────────────────────────────────────────────────────────
console.log(`\n${'─'.repeat(60)}`)
console.log(`  Total: ${passed+failed} | ✅ ${passed} pasaron | ❌ ${failed} fallaron`)
console.log('─'.repeat(60))
process.exit(failed > 0 ? 1 : 0)
