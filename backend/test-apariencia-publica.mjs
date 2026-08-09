/**
 * test-apariencia-publica.mjs
 * Verifica que los 10 campos de apariencia fluyen correctamente
 * desde la BD hasta el endpoint público /api/v1/public/business/:userId
 *
 * Uso: node backend/test-apariencia-publica.mjs
 */

const BASE = `http://localhost:${process.env.PORT || 3001}`

const APARIENCIA_CAMPOS = [
  'header_preset',
  'header_color',
  'header_height',
  'header_bar',
  'banner_color',
  'services_color',
  'arriendos_color',
  'sidebar_style',
  'nav_color',
  'nav_style',
]

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

async function get(path) {
  const res = await fetch(`${BASE}${path}`)
  const body = await res.json().catch(() => ({}))
  return { status: res.status, body }
}

// ── 1. Health check ───────────────────────────────────────────────────────────
section('1. Health check')
{
  const { status, body } = await get('/api/v1/health')
  status === 200 && body.ok
    ? ok(`Backend responde en ${BASE}`)
    : fail('Backend no responde', `status ${status}`)
}

// ── 2. /public/listings devuelve owner_plan_id ────────────────────────────────
section('2. Listings públicos — campo owner_plan_id')
let primeruserId = null
{
  const { status, body } = await get('/api/v1/public/listings')
  if (status === 200 && Array.isArray(body.listings) && body.listings.length > 0) {
    ok(`GET /public/listings → ${body.listings.length} listings`)

    const conPlan = body.listings.filter(l => l.owner_plan_id != null)
    conPlan.length > 0
      ? ok(`owner_plan_id presente en ${conPlan.length}/${body.listings.length} listings`)
      : fail('Ningún listing tiene owner_plan_id — mezcla de planes no funcionará')

    primeruserId = body.listings[0]?.usuario_id ?? body.listings[0]?.user_id ?? null
    primeruserId
      ? ok(`usuario_id disponible para prueba de negocio: ${primeruserId}`)
      : fail('No se pudo obtener usuario_id desde listings')
  } else {
    fail('GET /public/listings falló', `status ${status}`)
  }
}

// ── 3. /public/business/:userId devuelve todos los campos de apariencia ───────
section('3. Endpoint público /public/business/:userId — campos de apariencia')
if (primeruserId) {
  const { status, body } = await get(`/api/v1/public/business/${primeruserId}`)
  if (status === 200 && body.business) {
    ok(`GET /public/business/${primeruserId} → status 200`)

    const biz = body.business

    // Verificar presencia de cada campo (puede ser null si el usuario no los configuró)
    const presentes = APARIENCIA_CAMPOS.filter(c => c in biz)
    const ausentes  = APARIENCIA_CAMPOS.filter(c => !(c in biz))

    presentes.length === APARIENCIA_CAMPOS.length
      ? ok(`Los 10 campos de apariencia están presentes en la respuesta`)
      : fail(`Faltan ${ausentes.length} campos de apariencia`, ausentes.join(', '))

    // Verificar que al menos algunos tienen valor (no todos null)
    const conValor = APARIENCIA_CAMPOS.filter(c => biz[c] != null)
    conValor.length > 0
      ? ok(`${conValor.length}/10 campos tienen valor configurado: ${conValor.join(', ')}`)
      : fail('Todos los campos de apariencia son null — usuario sin configuración')

    // Verificar campo a campo
    section('   Detalle por campo')
    for (const campo of APARIENCIA_CAMPOS) {
      if (!(campo in biz)) {
        fail(`${campo}`, 'ausente en respuesta')
      } else if (biz[campo] == null) {
        ok(`${campo} → null (sin configurar, usará default del frontend)`)
      } else {
        ok(`${campo} → ${JSON.stringify(biz[campo])}`)
      }
    }

  } else {
    fail(`GET /public/business/${primeruserId}`, `status ${status}`)
  }
} else {
  fail('Test de apariencia omitido — no hay userId disponible')
}

// ── 4. Buscar usuario QA con apariencia configurada ──────────────────────────
section('4. Usuario QA con apariencia completa')
{
  const { body: listBody } = await get('/api/v1/public/listings')
  const userIds = [...new Set(
    (listBody.listings || []).map(l => l.usuario_id ?? l.user_id).filter(Boolean)
  )]

  let encontrado = false
  for (const uid of userIds.slice(0, 10)) {
    const { status, body } = await get(`/api/v1/public/business/${uid}`)
    if (status !== 200 || !body.business) continue
    const biz = body.business
    const configurados = APARIENCIA_CAMPOS.filter(c => biz[c] != null)
    if (configurados.length >= 5) {
      ok(`Usuario ${uid} tiene ${configurados.length}/10 campos de apariencia configurados`)
      ok(`  Campos: ${configurados.join(', ')}`)
      encontrado = true
      break
    }
  }
  if (!encontrado) {
    fail('Ningún usuario QA tiene al menos 5 campos de apariencia configurados',
      'Ejecutar `npm run db:setup` para poblar datos')
  }
}

// ── 5. Consistencia: plan_id y tipo_cuenta también presentes ─────────────────
section('5. Campos de contexto (plan_id, tipo_cuenta)')
if (primeruserId) {
  const { body } = await get(`/api/v1/public/business/${primeruserId}`)
  const biz = body.business || {}
  biz.plan_id != null
    ? ok(`plan_id presente → ${biz.plan_id}`)
    : fail('plan_id ausente en respuesta pública')
  biz.tipo_cuenta
    ? ok(`tipo_cuenta presente → ${biz.tipo_cuenta}`)
    : fail('tipo_cuenta ausente en respuesta pública')
}

// ── Resumen ───────────────────────────────────────────────────────────────────
console.log(`\n${'─'.repeat(55)}`)
console.log(`  Total: ${passed + failed} | ✅ ${passed} pasaron | ❌ ${failed} fallaron`)
console.log('─'.repeat(55))
process.exit(failed > 0 ? 1 : 0)
