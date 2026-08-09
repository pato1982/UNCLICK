import 'dotenv/config'

const BASE = `http://localhost:${process.env.PORT || 3001}/api/v1`
let pass = 0, fail = 0
const ok  = label => { console.log('  OK  ', label); pass++ }
const err = (label, msg) => { console.log('  FAIL', label, '-', String(msg).slice(0, 150)); fail++ }

const ts = Date.now()

// ── Registrar usuario ─────────────────────────────────────────────────────
const r0 = await fetch(BASE+'/auth/register', {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ nombre: 'AprTest', email: 'apr'+ts+'@t.cl', password: 'test123', tipo_cuenta: 'general', vende_productos: 1 })
})
const ck = r0.headers.get('set-cookie').split(';')[0]
if (r0.status === 201) ok('register')
else { err('register', await r0.text()); process.exit(1) }

// ── 1. GET inicial → business null ────────────────────────────────────────
const r1 = await fetch(BASE+'/business', { headers: { Cookie: ck } })
const d1 = await r1.json()
if (r1.status === 200 && d1.business === null) ok('GET inicial -> null')
else err('GET inicial', JSON.stringify(d1))

// ── 2. POST campos de texto + apariencia ─────────────────────────────────
const apariencia = {
  nombre_negocio: 'Tienda Test', slogan: 'Lo mejor', descripcion: 'Descripcion larga',
  header_preset: 'panel', header_color: '#123456', header_height: 40,
  header_bar: 'integrada', banner_color: '#abcdef', services_color: '#001122',
  arriendos_color: '#334455', sidebar_style: 'modal', nav_color: '#667788', nav_style: 'solido',
}
const r2 = await fetch(BASE+'/business', {
  method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: ck },
  body: JSON.stringify(apariencia)
})
const d2 = await r2.json()
if (r2.status === 200 && d2.business?.header_preset === 'panel') ok('POST guarda apariencia')
else err('POST apariencia', JSON.stringify(d2))

// ── 3. GET devuelve todos los campos guardados ────────────────────────────
const r3 = await fetch(BASE+'/business', { headers: { Cookie: ck } })
const d3 = await r3.json()
const b = d3.business
const checks = [
  ['header_preset',   b?.header_preset   === 'panel'],
  ['header_color',    b?.header_color    === '#123456'],
  ['header_height',   b?.header_height   === 40],
  ['header_bar',      b?.header_bar      === 'integrada'],
  ['banner_color',    b?.banner_color    === '#abcdef'],
  ['services_color',  b?.services_color  === '#001122'],
  ['arriendos_color', b?.arriendos_color === '#334455'],
  ['sidebar_style',   b?.sidebar_style   === 'modal'],
  ['nav_color',       b?.nav_color       === '#667788'],
  ['nav_style',       b?.nav_style       === 'solido'],
]
let allOk = true
for (const [name, cond] of checks) {
  if (!cond) { err('GET campo '+name, 'got: '+b?.[name]); allOk = false }
}
if (allOk) ok('GET devuelve todos los campos de apariencia')

// ── 4. POST de solo apariencia (sin texto) no borra campos de texto ───────
const r4 = await fetch(BASE+'/business', {
  method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: ck },
  body: JSON.stringify({ header_preset: 'esencial', header_color: '#ffffff' })
})
const d4 = await r4.json()
if (r4.status === 200 && d4.business?.header_preset === 'esencial' && d4.business?.header_color === '#ffffff') ok('POST parcial -> actualiza solo campos enviados')
else err('POST parcial', JSON.stringify(d4?.business))

// ── 5. GET tras actualizar parcial ────────────────────────────────────────
const r5 = await fetch(BASE+'/business', { headers: { Cookie: ck } })
const d5 = await r5.json()
if (d5.business?.header_preset === 'esencial') ok('GET tras update parcial -> header_preset actualizado')
else err('GET tras update parcial', JSON.stringify(d5?.business?.header_preset))
// nombre_negocio no se mandó ahora → debería ser null (UPSERT sobrescribe)
// Eso es el comportamiento esperado del UPSERT con VALUES(nombre_negocio) = null

// ── 6. UPSERT completo con defaults (simula guardar apariencia desde frontend) ─
const r6 = await fetch(BASE+'/business', {
  method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: ck },
  body: JSON.stringify({
    nombre_negocio: 'Tienda Prueba', slogan: 'Eslogan',
    header_preset: 'marca', header_color: '#3B1969', header_height: 26,
    header_bar: 'separada', banner_color: '#1a1220', services_color: '#0f1a2e',
    arriendos_color: '#14241c', sidebar_style: 'izquierda', nav_color: '#4A2070', nav_style: 'borde',
  })
})
const d6 = await r6.json()
if (r6.status === 200 && d6.business?.nombre_negocio === 'Tienda Prueba' && d6.business?.header_preset === 'marca') ok('UPSERT completo con defaults OK')
else err('UPSERT completo', JSON.stringify(d6?.business))

// ── 7. Sin sesion -> 401 ──────────────────────────────────────────────────
const r7 = await fetch(BASE+'/business', {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ header_color: '#000000' })
})
if (r7.status === 401) ok('Sin sesion -> 401')
else err('401', r7.status)

console.log('\n  Resultado:', pass+'/'+(pass+fail), 'pasaron')
if (fail > 0) process.exit(1)
