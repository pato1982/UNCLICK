import 'dotenv/config'
import sharp from 'sharp'
import mysql from 'mysql2/promise'

const BASE = 'http://localhost:3001/api/v1'
let pass = 0, fail = 0
const ok  = label => { console.log('  OK  ', label); pass++ }
const err = (label, msg) => { console.log('  FAIL', label, '-', String(msg).slice(0, 120)); fail++ }

const ts = Date.now()

// ── Registrar usuario plan 1 (general, sin banner) ────────────────────────
const r0a = await fetch(BASE+'/auth/register', {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ nombre: 'Gen1', email: 'gen1'+ts+'@t.cl', password: 'test123', tipo_cuenta: 'general', vende_productos: 1 })
})
const ck1 = r0a.headers.get('set-cookie').split(';')[0]
if (r0a.status === 201) ok('register plan 1 (general)')
else { err('register', await r0a.text()); process.exit(1) }

// ── Registrar usuario que elevaremos a plan 3 ─────────────────────────────
const r0b = await fetch(BASE+'/auth/register', {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ nombre: 'Gen3', email: 'gen3'+ts+'@t.cl', password: 'test123', tipo_cuenta: 'general', vende_productos: 1 })
})
const ck3 = r0b.headers.get('set-cookie').split(';')[0]
if (r0b.status === 201) ok('register plan 3 base')
else { err('register plan3', await r0b.text()); process.exit(1) }

// Elevar a plan 3 directamente en DB
const pool = await mysql.createPool({
  host: process.env.DB_HOST, port: Number(process.env.DB_PORT),
  user: process.env.DB_USER, password: process.env.DB_PASS, database: process.env.DB_NAME
})
const meRes = await fetch(BASE+'/auth/me', { headers: { Cookie: ck3 } })
const { usuario } = await meRes.json()
await pool.query('UPDATE usuarios SET plan_id = 3 WHERE id = ?', [usuario.id])
await pool.end()
ok('plan elevado a 3 para usuario id='+usuario.id)

// ── 1. Subir imagen vía /upload con sharp → WebP ──────────────────────────
const imgBuf = await sharp({
  create: { width: 800, height: 800, channels: 3, background: { r: 255, g: 100, b: 30 } }
}).jpeg().toBuffer()
const fd = new FormData()
fd.append('imagen', new Blob([imgBuf], { type: 'image/jpeg' }), 'banner.jpg')
const rUp = await fetch(BASE+'/upload', { method: 'POST', headers: { Cookie: ck3 }, body: fd })
const dUp = await rUp.json()
if (rUp.status === 200 && dUp.url?.endsWith('.webp')) ok('Upload imagen -> WebP comprimido por sharp')
else err('Upload', JSON.stringify(dUp))
const imgUrl = dUp.url ?? '/uploads/negocios/test.webp'

// ── 2. Comprobar compresión: WebP < 50% del JPEG original ─────────────────
const bigBuf = await sharp({
  create: { width: 1200, height: 1200, channels: 3, background: { r: 80, g: 150, b: 200 } }
}).jpeg({ quality: 95 }).toBuffer()
const webpBuf = await sharp(bigBuf)
  .resize({ width: 1200, height: 1200, fit: 'inside' })
  .webp({ quality: 82 }).toBuffer()
console.log('  INFO JPEG original:', Math.round(bigBuf.length/1024), 'KB | WebP:', Math.round(webpBuf.length/1024), 'KB')
if (webpBuf.length < bigBuf.length * 0.5) ok('Compresion: WebP <50% del JPEG original')
else err('Compresion', 'WebP no es significativamente menor al JPEG')

// ── 3. POST listing SIN banner_orden (plan 1, sin restriccion) ───────────
const bodyBase = {
  tipo: 'producto', seccion: 'destacados', nombre: 'Producto Test '+ts,
  descripcion: 'Descripcion', precio: 9990, imagen: imgUrl,
  categoria: 'Ropa', subcategoria: 'Poleras',
}
const r3 = await fetch(BASE+'/listings', {
  method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: ck1 },
  body: JSON.stringify(bodyBase)
})
const d3 = await r3.json()
if (r3.status === 201 && d3.listing?.id) ok('POST listing sin banner -> 201')
else err('POST listing', JSON.stringify(d3))

// ── 4. POST listing CON banner_orden plan 1 -> 403 ────────────────────────
const r4 = await fetch(BASE+'/listings', {
  method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: ck1 },
  body: JSON.stringify({ ...bodyBase, nombre: 'Banner plan1', banner_orden: 1 })
})
if (r4.status === 403) ok('POST banner_orden plan1 -> 403 (plan insuficiente)')
else err('403 banner plan1', r4.status + ' ' + await r4.text())

// ── 5. POST listing CON banner_orden plan 3 -> 201 ────────────────────────
const r5 = await fetch(BASE+'/listings', {
  method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: ck3 },
  body: JSON.stringify({ ...bodyBase, nombre: 'Banner Slide1 Pos1 '+ts, banner_orden: 1 })
})
const d5 = await r5.json()
if (r5.status === 201 && d5.listing?.banner_orden === 1) ok('POST banner_orden=1 plan3 -> 201')
else err('POST banner plan3', JSON.stringify(d5))
const bannerListingId = d5.listing?.id

// ── 6. GET /mine devuelve banner_orden ───────────────────────────────────
const r6 = await fetch(BASE+'/listings/mine', { headers: { Cookie: ck3 } })
const d6 = await r6.json()
const bannerItem = d6.listings?.find(l => l.banner_orden === 1)
if (bannerItem) ok('GET /mine -> listing con banner_orden=1 visible')
else err('GET mine banner', JSON.stringify(d6.listings?.map(l => ({id: l.id, banner_orden: l.banner_orden}))))

// ── 7. Crear items adicionales (orden 2-5) ────────────────────────────────
let allCreated = true
for (let i = 2; i <= 5; i++) {
  const ri = await fetch(BASE+'/listings', {
    method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: ck3 },
    body: JSON.stringify({ ...bodyBase, nombre: 'Banner Slide1 Pos'+i+' '+ts, banner_orden: i })
  })
  if (ri.status !== 201) { allCreated = false; err('POST banner orden '+i, ri.status); break }
}
if (allCreated) ok('Crear items banner_orden 2-5')

// ── 8. PUT actualiza banner_orden ────────────────────────────────────────
if (bannerListingId) {
  const r9 = await fetch(BASE+'/listings/'+bannerListingId, {
    method: 'PUT', headers: { 'Content-Type': 'application/json', Cookie: ck3 },
    body: JSON.stringify({ ...bodyBase, nombre: 'Banner ACTUALIZADO '+ts, banner_orden: 1 })
  })
  const d9 = await r9.json()
  if (r9.status === 200 && d9.listing?.nombre === 'Banner ACTUALIZADO '+ts) ok('PUT listing con banner_orden -> actualiza nombre')
  else err('PUT banner', JSON.stringify(d9))
} else err('PUT banner', 'no bannerListingId')

// ── 9. PUT banner_orden plan 1 -> 403 ─────────────────────────────────────
if (d3.listing?.id) {
  const r10 = await fetch(BASE+'/listings/'+d3.listing.id, {
    method: 'PUT', headers: { 'Content-Type': 'application/json', Cookie: ck1 },
    body: JSON.stringify({ ...bodyBase, nombre: 'Intento banner', banner_orden: 1 })
  })
  if (r10.status === 403) ok('PUT banner_orden plan1 -> 403')
  else err('PUT 403 plan1', r10.status + ' ' + await r10.text())
} else err('PUT 403 plan1', 'no listing id para plan1')

// ── 10. Archivo >10MB rechazado (413) ────────────────────────────────────
const bigFileBuf = Buffer.alloc(11 * 1024 * 1024, 0xff)
const fdBig = new FormData()
fdBig.append('imagen', new Blob([bigFileBuf], { type: 'image/jpeg' }), 'big.jpg')
const rBig = await fetch(BASE+'/upload', { method: 'POST', headers: { Cookie: ck3 }, body: fdBig })
if (rBig.status === 413) ok('Archivo >10MB -> 413 (limite de tamano)')
else err('>10MB', rBig.status + ' ' + await rBig.text())

// ── 11. Aislamiento: usuario plan1 no ve listings de usuario plan3 ────────
const r12 = await fetch(BASE+'/listings/mine', { headers: { Cookie: ck1 } })
const d12 = await r12.json()
const ajeno = d12.listings?.find(l => l.nombre?.includes('Banner Slide'))
if (!ajeno) ok('Aislamiento: usuario plan1 no ve listings de plan3')
else err('Aislamiento', 'Vio listing ajeno: ' + JSON.stringify(ajeno?.nombre))

// ── Resultado final ───────────────────────────────────────────────────────
console.log('\n  Resultado:', pass+'/'+(pass+fail), 'pasaron')
if (fail > 0) process.exit(1)
