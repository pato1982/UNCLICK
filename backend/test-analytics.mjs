import 'dotenv/config'

const BASE = 'http://localhost:3001/api/v1'
let pass = 0, fail = 0
const ok  = label => { console.log('  OK  ', label); pass++ }
const err = (label, msg) => { console.log('  FAIL', label, '-', String(msg).slice(0, 150)); fail++ }

const ts = Date.now()

// ── Registrar usuario ─────────────────────────────────────────────────────
const r0 = await fetch(BASE+'/auth/register', {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ nombre: 'StatsTest', email: 'stats'+ts+'@t.cl', password: 'test123', tipo_cuenta: 'general', vende_productos: 1 })
})
const ck = r0.headers.get('set-cookie').split(';')[0]
const { usuario } = await r0.json()
const uid = usuario?.id
if (r0.status === 201 && uid) ok('register id='+uid)
else { err('register', await r0.text()); process.exit(1) }

// ── 1. Track page_view (sin sesión) ──────────────────────────────────────
const r1 = await fetch(BASE+'/analytics/track', {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ user_id: uid, event_type: 'page_view', pagina: 'tienda' })
})
if (r1.status === 200) ok('POST /track page_view -> 200 (sin sesion)')
else err('track page_view', r1.status + ' ' + await r1.text())

// ── 2. Track page_view desde otra IP simulada (para visitantes unicos) ───
const r2 = await fetch(BASE+'/analytics/track', {
  method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': '10.0.0.5' },
  body: JSON.stringify({ user_id: uid, event_type: 'page_view', pagina: 'tienda' })
})
if (r2.status === 200) ok('POST /track page_view IP distinta -> 200')
else err('track page_view ip2', r2.status)

// ── 3. Track product_click ────────────────────────────────────────────────
const r3 = await fetch(BASE+'/analytics/track', {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ user_id: uid, event_type: 'product_click', listing_id: 42 })
})
if (r3.status === 200) ok('POST /track product_click -> 200')
else err('track product_click', r3.status)

// ── 4. Track card_click ───────────────────────────────────────────────────
const r4 = await fetch(BASE+'/analytics/track', {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ user_id: uid, event_type: 'card_click', listing_id: 7 })
})
if (r4.status === 200) ok('POST /track card_click -> 200')
else err('track card_click', r4.status)

// ── 5. Track sin campos requeridos -> 400 ────────────────────────────────
const r5 = await fetch(BASE+'/analytics/track', {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ event_type: 'page_view' })
})
if (r5.status === 400) ok('POST /track sin user_id -> 400')
else err('track 400', r5.status)

// ── 6. GET /stats sin sesion -> 401 ──────────────────────────────────────
const r6 = await fetch(BASE+'/analytics/stats')
if (r6.status === 401) ok('GET /stats sin sesion -> 401')
else err('stats 401', r6.status)

// ── 7. GET /stats con sesion -> estructura valida ─────────────────────────
const r7 = await fetch(BASE+'/analytics/stats', { headers: { Cookie: ck } })
const d7 = await r7.json()
if (r7.status !== 200) { err('GET stats 200', r7.status + ' ' + JSON.stringify(d7)); }
else {
  const { visitas, clicks, card_clicks, resumen } = d7
  const validArrays = Array.isArray(visitas) && Array.isArray(clicks) && Array.isArray(card_clicks)
  if (validArrays) ok('GET /stats -> arrays visitas/clicks/card_clicks presentes')
  else err('GET stats arrays', JSON.stringify(d7))

  const has6Months = visitas?.length === 6 && clicks?.length === 6 && card_clicks?.length === 6
  if (has6Months) ok('GET /stats -> 6 meses en cada serie')
  else err('GET stats 6 meses', `visitas=${visitas?.length} clicks=${clicks?.length} card=${card_clicks?.length}`)

  const validResumen = typeof resumen?.visitas_mes === 'number' && typeof resumen?.visitantes_unicos === 'number' && typeof resumen?.clicks_mes === 'number'
  if (validResumen) ok('GET /stats -> resumen con campos numericos')
  else err('GET stats resumen', JSON.stringify(resumen))

  if (resumen?.visitas_mes >= 2) ok('GET /stats -> visitas_mes='+resumen.visitas_mes+' (contabilizadas las 2 de arriba)')
  else err('GET stats conteo visitas', 'visitas_mes='+resumen?.visitas_mes+' (esperaba >=2)')

  if (resumen?.visitantes_unicos >= 2) ok('GET /stats -> visitantes_unicos>=2 (IPs distintas)')
  else err('GET stats unicos', 'visitantes_unicos='+resumen?.visitantes_unicos)

  if (resumen?.clicks_mes >= 2) ok('GET /stats -> clicks_mes>=2 (producto + card)')
  else err('GET stats clicks', 'clicks_mes='+resumen?.clicks_mes)

  if (resumen?.por_pagina?.tienda >= 2) ok('GET /stats -> por_pagina.tienda>=2')
  else err('GET stats por_pagina', JSON.stringify(resumen?.por_pagina))

  // El mes actual debe tener el conteo correcto en la serie
  const lastVisitaMes = visitas?.[5]?.valor
  if (lastVisitaMes >= 2) ok('GET /stats -> ultima entrada visitas = '+lastVisitaMes)
  else err('GET stats visitas serie', 'ultimo mes='+lastVisitaMes)

  const lastClickMes = clicks?.[5]?.valor
  if (lastClickMes >= 1) ok('GET /stats -> ultima entrada clicks = '+lastClickMes)
  else err('GET stats clicks serie', 'ultimo mes='+lastClickMes)

  const lastCardMes = card_clicks?.[5]?.valor
  if (lastCardMes >= 1) ok('GET /stats -> ultima entrada card_clicks = '+lastCardMes)
  else err('GET stats card serie', 'ultimo mes='+lastCardMes)

  const mesesValidos = visitas?.every(v => typeof v.mes === 'string' && typeof v.valor === 'number')
  if (mesesValidos) ok('GET /stats -> formato {mes:string, valor:number} correcto')
  else err('GET stats formato', JSON.stringify(visitas?.[0]))
}

// ── 8. Aislamiento: estadísticas de otro usuario no se mezclan ───────────
const r8a = await fetch(BASE+'/auth/register', {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ nombre: 'Otro', email: 'otro'+ts+'@t.cl', password: 'test123', tipo_cuenta: 'general', vende_productos: 1 })
})
const ck8 = r8a.headers.get('set-cookie').split(';')[0]
await fetch(BASE+'/analytics/track', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_id: uid+1000, event_type: 'page_view' }) })
const r8b = await fetch(BASE+'/analytics/stats', { headers: { Cookie: ck8 } })
const d8b = await r8b.json()
if (d8b.resumen?.visitas_mes === 0) ok('Aislamiento: usuario nuevo -> visitas_mes=0')
else err('Aislamiento', JSON.stringify(d8b?.resumen))

console.log('\n  Resultado:', pass+'/'+(pass+fail), 'pasaron')
if (fail > 0) process.exit(1)
