import 'dotenv/config'
const B = `http://localhost:${process.env.PORT || 3001}/api/v1`
const ts = Date.now()
let p=0, f=0
const ok = l => { console.log('  OK  ', l); p++ }
const er = (l, m) => { console.log('  FAIL', l, '-', String(m).slice(0, 100)); f++ }

// ── Auth: register + me + login + logout + revocación ────────────────────
const rReg = await fetch(B+'/auth/register', {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ nombre: 'Smoke', email: 'smoke'+ts+'@t.cl', password: 'abc12345', tipo_cuenta: 'general', vende_productos: 1 })
})
const ck = rReg.headers.get('set-cookie')?.split(';')[0]
if (rReg.status === 201) ok('POST /auth/register -> 201')
else er('register', rReg.status)

const rMe = await fetch(B+'/auth/me', { headers: { Cookie: ck } })
const dMe = await rMe.json()
if (rMe.status === 200 && dMe.usuario?.email) ok('GET /auth/me -> 200 con usuario')
else er('/me', JSON.stringify(dMe))

const rLog = await fetch(B+'/auth/login', {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'smoke'+ts+'@t.cl', password: 'abc12345' })
})
if (rLog.status === 200) ok('POST /auth/login -> 200')
else er('login', rLog.status)

const rBad = await fetch(B+'/auth/login', {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'smoke'+ts+'@t.cl', password: 'wrongpass' })
})
if (rBad.status === 401) ok('Login password incorrecto -> 401')
else er('login 401', rBad.status)

const rOut = await fetch(B+'/auth/logout', { method: 'POST', headers: { Cookie: ck } })
if (rOut.status === 200) ok('POST /auth/logout -> 200')
else er('logout', rOut.status)

const rAfter = await fetch(B+'/auth/me', { headers: { Cookie: ck } })
if (rAfter.status === 401) ok('GET /auth/me tras logout -> 401 (sesion revocada)')
else er('sesion revocada', rAfter.status)

// ── Endpoints protegidos sin sesion -> 401 ────────────────────────────────
for (const [label, url] of [
  ['GET /business',      B+'/business'],
  ['GET /listings/mine', B+'/listings/mine'],
  ['GET /portada',       B+'/portada'],
  ['GET /pagina',        B+'/pagina'],
  ['GET /analytics/stats', B+'/analytics/stats'],
  ['GET /servidor/estadisticas', B+'/servidor/estadisticas'],
  ['GET /monitor',       B+'/monitor'],
]) {
  const r = await fetch(url)
  if (r.status === 401) ok(label+' sin sesion -> 401')
  else er(label+' 401', r.status)
}

// ── Upload sin sesion -> 401 ──────────────────────────────────────────────
const fd = new FormData()
fd.append('imagen', new Blob([new Uint8Array(10)], { type: 'image/jpeg' }), 'x.jpg')
const rUp = await fetch(B+'/upload', { method: 'POST', body: fd })
if (rUp.status === 401) ok('POST /upload sin sesion -> 401')
else er('upload 401', rUp.status)

// ── Endpoints publicos accesibles sin sesion ──────────────────────────────
for (const [label, url] of [
  ['GET /health',           B+'/health'],      // (en /api/v1/ level)
  ['POST /analytics/track', null],             // testeado abajo
  ['POST /servidor/visita', null],
]) {
  if (!url) continue
  const r = await fetch(url)
  if (r.status === 200) ok(label+' -> 200 (publico OK)')
  else er(label+' publico', r.status)
}

// track sin sesion
// usuario_id tiene FK a usuarios: se usa el id del usuario recién registrado,
// no un id fijo (antes era 1, que solo existía si la BD venía de un dump viejo).
const rTrack = await fetch(B+'/analytics/track', {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ user_id: dMe.usuario?.id, event_type: 'page_view' })
})
if (rTrack.status === 200) ok('POST /analytics/track -> 200 (publico OK)')
else er('analytics track publico', rTrack.status)

const rVis = await fetch(B+'/servidor/visita', {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ pagina: 'home' })
})
if (rVis.status === 200) ok('POST /servidor/visita -> 200 (publico OK)')
else er('servidor visita publico', rVis.status)

// ── Resumen ───────────────────────────────────────────────────────────────
console.log('\n  Smoke tests:', p+'/'+(p+f), 'pasaron')
if (f > 0) process.exit(1)
