/**
 * test-visualizacion-publica.mjs
 * Verifica que los datos de turismo se visualizan correctamente en la
 * página pública: portadas con plan_id correcto, tours con alias user_id /
 * owner_plan_id, página de presentación y negocio del usuario premium.
 *
 * Flujo que se testea:
 *  - Página turismo (TourismPage) carga /public/portadas → empresa aparece
 *  - Botón "Ver más" visible (planId >= 3)
 *  - CompanyDetail carga /public/tours/:id y /public/pagina/:id
 *  - Home (TurismoSection) carga /public/tours → tarjeta con user_id
 *  - Tarjeta pagada muestra icono "Ver empresa" (owner_plan_id >= 2)
 *
 * Uso: node backend/test-visualizacion-publica.mjs
 */

const BASE = `http://localhost:${process.env.PORT || 3001}`
const QA_PASSWORD = 'Dev1234!'
const TUR_PREMIUM = 'tur_p3@qa.dev'

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

function extractCookie(sc) {
  const m = sc.match(/session_token=([^;]+)/)
  return m ? `session_token=${m[1]}` : ''
}

function parseJson(val) {
  if (Array.isArray(val)) return val
  if (!val) return []
  try { return JSON.parse(val) } catch { return [] }
}

// ─── 0. Health ────────────────────────────────────────────────────────────────
section('0. Health check')
{
  const { status, body } = await get('/api/v1/health')
  status === 200 && body.ok
    ? ok(`Backend activo en ${BASE}`)
    : fail('Backend no responde', `status ${status}`)
}

// ─── Obtener userId del usuario premium ───────────────────────────────────────
section('Preparación — userId del usuario turismo premium')
let premId = null, premCookie = ''
{
  const { status, body, cookie } = await post('/api/v1/auth/login', { email: TUR_PREMIUM, password: QA_PASSWORD })
  if (status === 200 && (body.usuario || body.user)) {
    const u = body.usuario || body.user
    premId = u.id
    premCookie = extractCookie(cookie)
    ok(`Login OK → userId=${premId} plan=${u.plan_id} tipo=${u.tipo_cuenta}`)
  } else {
    fail('No se pudo obtener userId', body.error || `status ${status}`)
    process.exit(1)
  }
}

// ─── 1. /public/portadas — lista de empresas turismo ─────────────────────────
section('1. GET /public/portadas — lista de empresas en página Turismo')
let portadaDelPremium = null
{
  const { status, body } = await get('/api/v1/public/portadas')
  if (status === 200 && Array.isArray(body.portadas)) {
    ok(`Status 200 → ${body.portadas.length} portada(s) en BD`)

    // Buscar la del usuario premium
    portadaDelPremium = body.portadas.find(p => p.usuario_id === premId)

    if (portadaDelPremium) {
      const p = portadaDelPremium
      ok(`Portada del usuario premium (id=${premId}) está en la lista pública`)

      // Campos críticos para TourismPage
      p.usuario_id != null
        ? ok(`usuario_id = ${p.usuario_id} (campo correcto — antes era user_id)`)
        : fail('usuario_id NULL — la empresa no tendría userId en frontend')

      p.plan_id != null
        ? ok(`plan_id = ${p.plan_id} — ${p.plan_id >= 3 ? '✔ botón "Ver más" visible' : '✘ botón "Ver más" NO visible (plan < 3)'}`)
        : fail('plan_id NULL — botón "Ver más" nunca aparecería en TourismPage')

      p.plan_id >= 3
        ? ok('Botón "Ver más" se mostrará (planId >= 3)')
        : fail(`Plan ${p.plan_id} — botón "Ver más" oculto; se necesita plan >= 3`)

      // Nombre del negocio
      p.nombre_negocio
        ? ok(`nombre_negocio = "${p.nombre_negocio}"`)
        : fail('nombre_negocio vacío — tarjeta mostraría "Sin nombre"')

      // Imágenes (CardFan)
      const imgs = parseJson(p.imagenes)
      imgs.length > 0
        ? ok(`imagenes: ${imgs.length} imagen(es)`)
        : fail('Sin imágenes — CardFan mostraría placeholder')
      const locales = imgs.filter(i => i.startsWith('/uploads/'))
      ok(`Imágenes locales: ${locales.length}/${imgs.length}`)

      // Categorías (subcategories para el filtro lateral)
      const cats = parseJson(p.categorias)
      Array.isArray(cats)
        ? ok(`categorias: [${cats.join(', ') || 'sin categorías'}]`)
        : fail('categorias no es array')

      // Campos de contacto (nuevos en el fix)
      p.telefono  !== undefined ? ok(`telefono: "${p.telefono || '(vacío)'}"`)  : fail('campo telefono AUSENTE — popup contacto no mostraría tel')
      p.whatsapp  !== undefined ? ok(`whatsapp: "${p.whatsapp || '(vacío)'}"`)  : fail('campo whatsapp AUSENTE')
      p.correo    !== undefined ? ok(`correo: "${p.correo || '(vacío)'}"`)      : fail('campo correo AUSENTE')
      p.direccion !== undefined ? ok(`direccion: "${p.direccion || '(vacío)'}"`) : fail('campo direccion AUSENTE — popup ubicación vacío')
      Array.isArray(p.horarios)
        ? ok(`horarios: array de ${p.horarios.length} días`)
        : fail('horarios no es array — popup horario vacío')

    } else {
      fail(`Portada del usuario ${TUR_PREMIUM} (id=${premId}) no encontrada en /public/portadas`,
           '¿No ha creado portada en el admin? Ir a Admin → Portada')
    }

    // Verificar que hay al menos una empresa premium en la lista
    const premiums = body.portadas.filter(p => p.plan_id >= 3)
    premiums.length > 0
      ? ok(`${premiums.length} empresa(s) premium en la lista (con botón "Ver más")`)
      : fail('Ninguna empresa tiene plan_id >= 3 — nadie tendrá botón "Ver más"')

    // Verificar orden: premiums primero (sort del frontend: planId>=3 → 1, otros → 0)
    if (body.portadas.length >= 2) {
      const primerPlan  = body.portadas[0].plan_id || 1
      const ultimoPlan  = body.portadas[body.portadas.length - 1].plan_id || 1
      info(`Primera portada: plan_id=${primerPlan} | Última: plan_id=${ultimoPlan}`)
    }

  } else { fail('GET /public/portadas', body.error || `status ${status}`) }
}

// ─── 2. /public/tours — tarjetas del home (TurismoSection) ───────────────────
section('2. GET /public/tours — tours en tarjetas del Home')
let toursPublicos = []
{
  const { status, body } = await get('/api/v1/public/tours')
  if (status === 200 && Array.isArray(body.tours)) {
    toursPublicos = body.tours
    ok(`Status 200 → ${body.tours.length} tour(s) en marketplace`)

    if (body.tours.length === 0) {
      fail('Sin tours en BD — TurismoSection mostraría placeholders')
    } else {
      const tour = body.tours[0]

      // Alias críticos para TurismoSection
      tour.user_id != null
        ? ok(`user_id = ${tour.user_id} (alias correcto de usuario_id)`)
        : fail('user_id NULL — TurismoSection no puede agrupar por empresa')

      tour.owner_plan_id != null
        ? ok(`owner_plan_id presente en tours (tour[0]=${tour.owner_plan_id})`)
        : fail('owner_plan_id NULL — icono "Ver empresa" nunca aparece')

      // Al menos un tour de empresa premium debe tener owner_plan_id >= 2
      const tourPremium = body.tours.find(t => t.owner_plan_id >= 2)
      tourPremium
        ? ok(`Tour de empresa premium encontrado → owner_plan_id=${tourPremium.owner_plan_id} → icono "Ver empresa" visible`)
        : fail('Ningún tour tiene owner_plan_id >= 2 — icono "Ver empresa" no aparecería para nadie')

      // Imágenes del tour
      const imgs = parseJson(tour.imagenes)
      imgs.length > 0
        ? ok(`Tour[0] tiene ${imgs.length} imagen(es)`)
        : fail('Tour[0] sin imágenes')

      // Tours del usuario premium
      const toursDePremium = body.tours.filter(t => t.user_id === premId)
      toursDePremium.length > 0
        ? ok(`${toursDePremium.length} tour(s) del usuario premium en la lista`)
        : fail(`Ningún tour del usuario ${premId} en /public/tours — ¿creó tours?`)

      // Verificar agrupación por empresa (base del round-robin en TurismoSection)
      const empresasUnicas = new Set(body.tours.map(t => t.user_id).filter(Boolean))
      ok(`Tours de ${empresasUnicas.size} empresa(s) distintas`)
    }
  } else { fail('GET /public/tours', body.error || `status ${status}`) }
}

// ─── 3. /public/tours/:userId — tours del CompanyDetail ──────────────────────
section('3. GET /public/tours/:userId — tours del usuario en su página')
{
  const { status, body } = await get(`/api/v1/public/tours/${premId}`)
  if (status === 200 && Array.isArray(body.tours)) {
    ok(`GET /public/tours/${premId} → ${body.tours.length} tour(s)`)

    if (body.tours.length === 0) {
      fail('Sin tours para este usuario — CompanyDetail mostraría sección vacía')
    } else {
      body.tours.forEach((t, i) => {
        const imgs = parseJson(t.imagenes)
        ok(`Tour ${i + 1}: "${t.nombre}" | categoria="${t.categoria || '?'}" | precio=${t.precio ?? '?'} | imgs=${imgs.length}`)
        imgs.length > 0 && imgs.some(img => img.startsWith('/uploads/'))
          ? ok(`  Imágenes en /uploads/ ✔`)
          : fail(`  Tour ${i + 1} sin imágenes locales`, imgs[0] || 'vacío')
      })
    }
  } else { fail(`GET /public/tours/${premId}`, body.error || `status ${status}`) }
}

// ─── 4. /public/pagina/:userId — Mi Página en CompanyDetail ──────────────────
section('4. GET /public/pagina/:userId — sección Mi Página en página pública')
{
  const { status, body } = await get(`/api/v1/public/pagina/${premId}`)
  if (status === 200) {
    if (body.pagina) {
      const p = body.pagina
      ok(`GET /public/pagina/${premId} → pagina encontrada`)

      // Sección superior (imagen izquierda + texto derecho)
      p.titulo_superior
        ? ok(`titulo_superior: "${p.titulo_superior}"`)
        : fail('titulo_superior vacío — sección superior mostraría "Sobre Nosotros" por defecto')

      p.texto_superior
        ? ok(`texto_superior: ${p.texto_superior.length} chars`)
        : fail('texto_superior vacío — sección superior sin texto')

      p.imagen_superior
        ? (p.imagen_superior.startsWith('/uploads/')
            ? ok(`imagen_superior: local ✔ → ${p.imagen_superior}`)
            : fail('imagen_superior no es ruta local', p.imagen_superior))
        : fail('imagen_superior ausente — sección superior sin foto')

      // Sección inferior (texto izquierda + imagen derecha)
      p.titulo_inferior
        ? ok(`titulo_inferior: "${p.titulo_inferior}"`)
        : fail('titulo_inferior vacío — sección inferior mostraría "Datos de la Empresa"')

      p.imagen_inferior !== undefined
        ? ok(`imagen_inferior: ${p.imagen_inferior ? 'tiene imagen' : 'sin imagen (opcional)'}`)
        : fail('imagen_inferior campo ausente en respuesta')

      // Crop data
      p.crop_superior !== undefined ? ok('crop_superior presente') : fail('crop_superior ausente')
      p.crop_inferior !== undefined ? ok('crop_inferior presente') : fail('crop_inferior ausente')

    } else {
      fail(`Pagina NULL para usuario ${premId}`, 'El usuario no ha guardado Mi Página en el admin')
      info('→ Ir a Admin → Mi Página y guardar el contenido')
    }
  } else { fail(`GET /public/pagina/${premId}`, body.error || `status ${status}`) }
}

// ─── 5. /public/business/:userId — negocio en CompanyDetail ──────────────────
section('5. GET /public/business/:userId — negocio con contacto y plan')
{
  const { status, body } = await get(`/api/v1/public/business/${premId}`)
  if (status === 200 && body.business) {
    const b = body.business
    ok(`GET /public/business/${premId} → "${b.nombre_negocio || '(sin nombre)'}"`)

    b.plan_id >= 3
      ? ok(`plan_id = ${b.plan_id} — usuario premium confirmado`)
      : fail(`plan_id = ${b.plan_id} — no es premium (necesita >= 3)`)

    b.tipo_cuenta === 'turismo'
      ? ok('tipo_cuenta = "turismo" ✔')
      : fail(`tipo_cuenta = "${b.tipo_cuenta}" — se esperaba "turismo"`)

    // Campos de contacto
    b.telefono  !== undefined ? ok(`telefono: "${b.telefono || '(vacío)'}"`)  : fail('telefono ausente')
    b.whatsapp  !== undefined ? ok(`whatsapp: "${b.whatsapp || '(vacío)'}"`)  : fail('whatsapp ausente')
    b.correo    !== undefined ? ok(`correo: "${b.correo || '(vacío)'}"`)      : fail('correo ausente')
    b.direccion !== undefined ? ok(`direccion: "${b.direccion || '(vacío)'}"`) : fail('direccion ausente')
    b.facebook  !== undefined ? ok('facebook presente')  : fail('facebook ausente')
    b.instagram !== undefined ? ok('instagram presente') : fail('instagram ausente')

    Array.isArray(b.horarios)
      ? ok(`horarios: ${b.horarios.length} días configurados`)
      : fail('horarios no es array')

    // Logo
    b.logo_url
      ? ok(`logo_url: ${b.logo_url}`)
      : fail('logo_url vacío — empresa mostrará placeholder de logo')

  } else { fail(`GET /public/business/${premId}`, body.error || `status ${status}`) }
}

// ─── 6. Cross-check — coherencia entre secciones ─────────────────────────────
section('6. Cross-check — coherencia de datos entre endpoints')
{
  // plan_id del portada debe coincidir con el de business
  const { body: bBiz } = await get(`/api/v1/public/business/${premId}`)
  if (portadaDelPremium && bBiz.business) {
    portadaDelPremium.plan_id === bBiz.business.plan_id
      ? ok(`plan_id coherente: portadas=${portadaDelPremium.plan_id} = business=${bBiz.business.plan_id}`)
      : fail('plan_id inconsistente entre /public/portadas y /public/business', `portadas=${portadaDelPremium.plan_id} business=${bBiz.business.plan_id}`)
  }

  // Tours del usuario en /public/tours coinciden con /public/tours/:userId
  const toursEnGeneral = toursPublicos.filter(t => t.user_id === premId)
  const { body: bTours } = await get(`/api/v1/public/tours/${premId}`)
  if (bTours.tours) {
    toursEnGeneral.length === bTours.tours.length
      ? ok(`Cantidad de tours coherente: ${toursEnGeneral.length} en listado general = ${bTours.tours.length} en endpoint por usuario`)
      : fail('Discrepancia de tours', `listado general=${toursEnGeneral.length} vs por-usuario=${bTours.tours.length}`)
  }

  // usuario_id en portada == premId
  if (portadaDelPremium) {
    portadaDelPremium.usuario_id === premId
      ? ok(`usuario_id en portada (${portadaDelPremium.usuario_id}) = userId del login (${premId}) ✔`)
      : fail('usuario_id de portada no coincide con userId del login')
  }

  // Analytics: track visita y luego stats
  await post('/api/v1/analytics/track', {
    user_id: premId, event_type: 'page_view', pagina: 'turismo'
  })
  const { status: as, body: ab } = await get('/api/v1/analytics/stats', premCookie)
  as === 200 && !ab.error
    ? ok('Analytics registra visita a turismo y stats responde sin error')
    : fail('Analytics con error', ab.error || `status ${as}`)
}

// ─── 7. Acceso sin sesión (visitante anónimo) ─────────────────────────────────
section('7. Endpoints públicos sin cookie (visitante anónimo)')
{
  const endpoints = [
    { path: '/api/v1/public/portadas',           check: b => b.portadas },
    { path: `/api/v1/public/tours`,              check: b => b.tours },
    { path: `/api/v1/public/tours/${premId}`,    check: b => b.tours },
    { path: `/api/v1/public/pagina/${premId}`,   check: b => 'pagina' in b },
    { path: `/api/v1/public/business/${premId}`, check: b => b.business },
  ]
  for (const ep of endpoints) {
    const { status, body } = await get(ep.path)   // sin cookie
    status === 200 && ep.check(body)
      ? ok(`Sin sesión: GET ${ep.path} → 200 ✔`)
      : fail(`Sin sesión: GET ${ep.path} → ${status}`, JSON.stringify(body).slice(0, 80))
  }
}

// ─── Resumen ──────────────────────────────────────────────────────────────────
console.log(`\n${'─'.repeat(65)}`)
console.log(`  Total: ${passed + failed} | ✅ ${passed} pasaron | ❌ ${failed} fallaron`)
console.log('─'.repeat(65))
if (failed > 0) {
  console.log('\n  Causas comunes de fallo:')
  console.log('  · tur_p3 no tiene portada/tours/pagina creados en el admin')
  console.log('  · Backend corriendo versión vieja (sin los fixes de hoy) — reiniciar')
}
process.exit(failed > 0 ? 1 : 0)
