/**
 * test-secciones-admin.mjs
 * Verifica que cada sección del panel turismo está conectada a la BD:
 * Mi Negocio, Portada, Mi Página, Tour, Estadísticas.
 * Incluye roundtrip write→read en Mi Negocio para confirmar persistencia.
 *
 * Uso: node backend/test-secciones-admin.mjs
 */

const BASE = 'http://localhost:3001'
const QA_PASSWORD = 'Dev1234!'
const TUR_PREMIUM = 'tur_p3@qa.dev'   // plan 5 — turismo premium
const TUR_GRATIS  = 'tur_p1@qa.dev'   // plan 4 — turismo gratuito

let passed = 0, failed = 0

function ok(label)         { console.log(`  ✅ ${label}`); passed++ }
function fail(label, d='') { console.log(`  ❌ ${label}${d ? ' — ' + d : ''}`); failed++ }
function section(t)        { console.log(`\n── ${t}`) }
function info(msg)         { console.log(`     ℹ  ${msg}`) }

async function get(path, cookie = '') {
  const h = cookie ? { Cookie: cookie } : {}
  const res = await fetch(`${BASE}${path}`, { headers: h })
  const body = await res.json().catch(() => ({}))
  return { status: res.status, body }
}

async function post(path, data, cookie = '') {
  const h = { 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}) }
  const res = await fetch(`${BASE}${path}`, { method: 'POST', headers: h, body: JSON.stringify(data) })
  const body = await res.json().catch(() => ({}))
  const sc   = res.headers.get('set-cookie') || ''
  return { status: res.status, body, cookie: sc }
}

async function put(path, data, cookie = '') {
  const h = { 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}) }
  const res = await fetch(`${BASE}${path}`, { method: 'PUT', headers: h, body: JSON.stringify(data) })
  const body = await res.json().catch(() => ({}))
  return { status: res.status, body }
}

function extractCookie(sc) {
  const m = sc.match(/session_token=([^;]+)/)
  return m ? `session_token=${m[1]}` : ''
}

// ─── 0. Health ────────────────────────────────────────────────────────────────
section('0. Health check')
{
  const { status, body } = await get('/api/v1/health')
  status === 200 && body.ok
    ? ok('Backend activo en localhost:3001')
    : fail('Backend no responde', `status ${status}`)
}

// ─── Login de ambas cuentas QA turismo ───────────────────────────────────────
section('Login QA — cuentas turismo')
let premCookie = '', premId = null
let gratisCookie = '', gratisId = null

{
  const { status, body, cookie } = await post('/api/v1/auth/login', { email: TUR_PREMIUM, password: QA_PASSWORD })
  if (status === 200 && (body.usuario || body.user)) {
    const u = body.usuario || body.user
    premCookie = extractCookie(cookie)
    premId = u.id
    ok(`Login ${TUR_PREMIUM} → id=${u.id} plan=${u.plan_id} tipo=${u.tipo_cuenta}`)
    u.plan_id >= 3
      ? ok(`Plan premium confirmado (plan_id=${u.plan_id})`)
      : fail(`Plan ${u.plan_id} — se esperaba >= 3 para premium`)
  } else { fail(`Login ${TUR_PREMIUM}`, body.error || `status ${status}`) }
}

{
  const { status, body, cookie } = await post('/api/v1/auth/login', { email: TUR_GRATIS, password: QA_PASSWORD })
  if (status === 200 && (body.usuario || body.user)) {
    const u = body.usuario || body.user
    gratisCookie = extractCookie(cookie)
    gratisId = u.id
    ok(`Login ${TUR_GRATIS} → id=${u.id} plan=${u.plan_id}`)
  } else { fail(`Login ${TUR_GRATIS}`, body.error || `status ${status}`) }
}

if (!premCookie) {
  console.log('\n❌ No se pudo iniciar sesión — interrumpiendo tests.')
  process.exit(1)
}

// ─── 1. Mi Negocio ────────────────────────────────────────────────────────────
section('1. Mi Negocio — GET, write→read roundtrip')
let negocioOriginal = {}
{
  const { status, body } = await get('/api/v1/business', premCookie)
  if (status === 200 && body.business) {
    const b = body.business
    negocioOriginal = b
    ok(`GET /business → nombre="${b.nombre_negocio || '(vacío)'}"`)
    info(`descripcion: "${(b.descripcion || '').slice(0, 60)}"`)
    b.slogan !== undefined   ? ok('Campo slogan presente')   : fail('Campo slogan ausente')
    b.whatsapp !== undefined ? ok('Campo whatsapp presente') : fail('Campo whatsapp ausente')
    b.telefono !== undefined ? ok('Campo telefono presente') : fail('Campo telefono ausente')
    b.correo   !== undefined ? ok('Campo correo presente')   : fail('Campo correo ausente')
    b.facebook !== undefined ? ok('Campo facebook presente') : fail('Campo facebook ausente')
    b.instagram!== undefined ? ok('Campo instagram presente'): fail('Campo instagram ausente')
    b.direccion!== undefined ? ok('Campo direccion presente'): fail('Campo direccion ausente')
    Array.isArray(b.horarios) ? ok(`Campo horarios → array de ${b.horarios.length} días`) : fail('horarios no es array')
  } else { fail('GET /business', body.error || `status ${status}`) }
}

// Roundtrip: escribir valor de test → leer y verificar (POST = UPSERT)
const TEST_SLOGAN = `Test QA ${Date.now()}`
{
  const { status, body } = await post('/api/v1/business', {
    ...negocioOriginal,
    slogan: TEST_SLOGAN,
  }, premCookie)
  if (status === 200 && (body.business || body.ok || body.negocio)) {
    ok('POST /business (upsert) → 200')
  } else { fail('POST /business', body.error || `status ${status}`) }
}
{
  const { status, body } = await get('/api/v1/business', premCookie)
  if (status === 200 && body.business) {
    body.business.slogan === TEST_SLOGAN
      ? ok(`Slogan guardado y leído correctamente en BD → "${TEST_SLOGAN}"`)
      : fail('Roundtrip slogan falló', `guardado="${body.business.slogan}" esperado="${TEST_SLOGAN}"`)
    // Restaurar valor original
    await post('/api/v1/business', { ...negocioOriginal }, premCookie).catch(() => {})
    ok('Slogan restaurado al valor original')
  } else { fail('GET /business (verificación roundtrip)', `status ${status}`) }
}

// ─── 2. Portada ───────────────────────────────────────────────────────────────
section('2. Portada — datos en BD')
{
  const { status, body } = await get('/api/v1/portada', premCookie)
  if (status === 200) {
    if (body.portada) {
      const p = body.portada
      ok('GET /portada → portada encontrada en BD')
      Array.isArray(p.imagenes) && p.imagenes.length > 0
        ? ok(`Imágenes: ${p.imagenes.length} imagen(es)`)
        : fail('Portada sin imágenes')
      const locales = (p.imagenes || []).filter(i => i.startsWith('/uploads/'))
      ok(`Imágenes locales: ${locales.length}/${(p.imagenes || []).length}`)
      Array.isArray(p.categorias)
        ? ok(`Categorías: [${(p.categorias || []).join(', ') || 'sin categorías'}]`)
        : fail('Campo categorias no es array')
      p.descripcion !== undefined ? ok(`Descripcion: "${(p.descripcion||'').slice(0,50)}"`) : fail('Campo descripcion ausente')
    } else {
      fail('Portada no encontrada', `body.portada = ${JSON.stringify(body.portada)} — ¿falta crear portada para tur_p3?`)
    }
  } else { fail('GET /portada', body.error || `status ${status}`) }
}

// Portada del usuario gratuito (debería no tener o ser null)
{
  const { status, body } = await get('/api/v1/portada', gratisCookie)
  if (status === 200) {
    body.portada
      ? info(`tur_p1 también tiene portada (id=${body.portada.id})`)
      : info('tur_p1 no tiene portada (normal para gratuito si no ha configurado)')
    ok('GET /portada funciona para cualquier turismo (200)')
  } else { fail('GET /portada para tur_p1', `status ${status}`) }
}

// ─── 3. Mi Página ─────────────────────────────────────────────────────────────
section('3. Mi Página — datos en BD')
{
  const { status, body } = await get('/api/v1/pagina', premCookie)
  if (status === 200) {
    if (body.pagina) {
      const p = body.pagina
      ok('GET /pagina → página encontrada en BD')
      p.titulo_superior !== undefined ? ok(`titulo_superior: "${p.titulo_superior || '(vacío)'}"`) : fail('titulo_superior ausente')
      p.texto_superior  !== undefined ? ok(`texto_superior: ${(p.texto_superior||'').length} chars`) : fail('texto_superior ausente')
      p.imagen_superior !== undefined
        ? (p.imagen_superior?.startsWith('/uploads/')
            ? ok(`imagen_superior: local → ${p.imagen_superior}`)
            : fail('imagen_superior no es ruta local', p.imagen_superior))
        : fail('imagen_superior ausente en respuesta')
      p.titulo_inferior !== undefined ? ok(`titulo_inferior: "${p.titulo_inferior || '(vacío)'}"`) : fail('titulo_inferior ausente')
      p.texto_inferior  !== undefined ? ok(`texto_inferior: ${(p.texto_inferior||'').length} chars`) : fail('texto_inferior ausente')
      p.imagen_inferior !== undefined ? ok('imagen_inferior presente') : fail('imagen_inferior ausente')
    } else {
      fail('Página no encontrada', '¿falta crear Mi Página para tur_p3? — ir al admin y guardar contenido')
    }
  } else { fail('GET /pagina', body.error || `status ${status}`) }
}

// ─── 4. Tour ──────────────────────────────────────────────────────────────────
section('4. Tour — listado y campos completos')
{
  const { status, body } = await get('/api/v1/tours', premCookie)
  if (status === 200 && Array.isArray(body.tours)) {
    if (body.tours.length === 0) {
      fail('GET /tours → sin tours', '¿falta crear tours para tur_p3?')
    } else {
      ok(`GET /tours → ${body.tours.length} tour(s)`)
      const tour = body.tours[0]
      tour.id       !== undefined ? ok(`Tour[0] id=${tour.id}`) : fail('campo id ausente')
      tour.nombre   ? ok(`Tour[0] nombre="${tour.nombre}"`) : fail('campo nombre vacío')
      tour.categoria? ok(`Tour[0] categoria="${tour.categoria}"`) : fail('campo categoria vacío')
      tour.ubicacion? ok(`Tour[0] ubicacion="${tour.ubicacion}"`) : fail('campo ubicacion vacío')
      ;(tour.precio != null)
        ? ok(`Tour[0] precio=$${Number(tour.precio).toLocaleString('es-CL')}`)
        : fail('campo precio ausente')
      const imgs = typeof tour.imagenes === 'string' ? JSON.parse(tour.imagenes || '[]') : (tour.imagenes || [])
      imgs.length > 0
        ? ok(`Tour[0] imagenes: ${imgs.length} imagen(es)`)
        : fail('Tour[0] sin imágenes')
      const locales = imgs.filter(i => i.startsWith('/uploads/'))
      locales.length > 0
        ? ok(`Imágenes en /uploads/turismo/: ${locales.length}/${imgs.length}`)
        : fail('Imágenes no están en /uploads/ (problema de carpeta upload)', imgs[0])
      // Verificar que NO estén en /productos/ (bug previo)
      const enProductos = imgs.filter(i => i.includes('/uploads/productos/'))
      enProductos.length === 0
        ? ok('Ninguna imagen está en /uploads/productos/ (carpeta correcta)')
        : fail(`${enProductos.length} imágenes en /uploads/productos/ — re-subir tours después del fix`)
    }
  } else { fail('GET /tours', body.error || `status ${status}`) }
}

// ─── 5. Estadísticas ─────────────────────────────────────────────────────────
section('5. Estadísticas — datos de los últimos 6 meses')
{
  const { status, body } = await get('/api/v1/analytics/stats', premCookie)
  if (status === 200 && Array.isArray(body.visitas)) {
    ok(`GET /analytics/stats → ${body.visitas.length} meses de datos`)
    body.visitas.length === 6 ? ok('6 meses de histórico de visitas') : fail(`Se esperaban 6 meses, llegaron ${body.visitas.length}`)
    body.clicks.length  === 6 ? ok('6 meses de histórico de clicks')  : fail(`Se esperaban 6 meses de clicks`)
    body.card_clicks?.length === 6 ? ok('6 meses de card_clicks') : fail('card_clicks ausente o incompleto')
    const totalVisitas = body.visitas.reduce((s, m) => s + m.valor, 0)
    const totalClicks  = body.clicks.reduce((s, m) => s + m.valor, 0)
    ok(`Visitas acumuladas (6m): ${totalVisitas}`)
    ok(`Clicks acumulados (6m): ${totalClicks}`)
    const r = body.resumen
    if (r) {
      ok(`Resumen mes actual: visitas=${r.visitas_mes} únicos=${r.visitantes_unicos} clicks=${r.clicks_mes}`)
      r.por_pagina && Object.keys(r.por_pagina).length > 0
        ? ok(`Páginas visitadas: ${JSON.stringify(r.por_pagina)}`)
        : ok('por_pagina vacío (sin visitas registradas este mes aún)')
    } else { fail('Resumen ausente en stats') }
  } else { fail('GET /analytics/stats', body.error || `status ${status}`) }
}

// ─── 6. Conteos del perfil (sidebar turismo) ─────────────────────────────────
section('6. Conteos del perfil — números del sidebar admin')
{
  const { status, body } = await get('/api/v1/auth/profile/counts', premCookie)
  if (status === 200) {
    ok(`GET /profile/counts → portada=${body.portada} pagina=${body.pagina} tours=${body.tours}`)
    body.tours   > 0 ? ok(`${body.tours} tour(s) contados`) : fail('0 tours en conteo — verificar que existan tours en BD')
    body.portada > 0 ? ok(`${body.portada} portada(s)`)     : fail('0 portadas — verificar portada en BD')
    body.pagina  > 0 ? ok(`${body.pagina} página(s)`)       : fail('0 páginas — verificar Mi Página en BD')
  } else { fail('GET /profile/counts', body.error || `status ${status}`) }
}

// ─── Resumen ──────────────────────────────────────────────────────────────────
console.log(`\n${'─'.repeat(65)}`)
console.log(`  Total: ${passed + failed} | ✅ ${passed} pasaron | ❌ ${failed} fallaron`)
console.log('─'.repeat(65))
if (failed > 0) {
  console.log('\n  Nota: si alguna sección muestra 0 filas, probablemente no se ha')
  console.log('  cargado contenido desde el admin de tur_p3@qa.dev todavía.')
}
process.exit(failed > 0 ? 1 : 0)
