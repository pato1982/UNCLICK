/**
 * Test completo de todos los endpoints del backend.
 * Ejecutar con el servidor corriendo: node test-api.js
 */
const BASE = `http://localhost:${process.env.PORT || 3001}/api/v1`
let passed = 0, failed = 0

function ok(label, condition, detail = '') {
  if (condition) {
    console.log(`  ✅ ${label}`)
    passed++
  } else {
    console.log(`  ❌ ${label}${detail ? ' → ' + detail : ''}`)
    failed++
  }
}

async function get(path)         { return fetch(`${BASE}${path}`) }
async function post(path, body)  { return fetch(`${BASE}${path}`, { method: 'POST',   headers: {'Content-Type':'application/json'}, body: JSON.stringify(body) }) }
async function put(path, body)   { return fetch(`${BASE}${path}`, { method: 'PUT',    headers: {'Content-Type':'application/json'}, body: JSON.stringify(body) }) }
async function patch(path, body) { return fetch(`${BASE}${path}`, { method: 'PATCH',  headers: {'Content-Type':'application/json'}, body: JSON.stringify(body) }) }
async function del(path)         { return fetch(`${BASE}${path}`, { method: 'DELETE' }) }

// ── 1. Health check ────────────────────────────────────────────────────────
console.log('\n🔵 1. Health check')
const h = await get('/health')
const hd = await h.json()
ok('GET /health responde 200',    h.status === 200)
ok('Respuesta tiene { ok: true }', hd.ok === true)

// ── 2. Categorías ──────────────────────────────────────────────────────────
console.log('\n🔵 2. Categorías')

const c1 = await (await get('/categorias?tipo=turismo')).json()
ok('GET /categorias?tipo=turismo — tiene resultados',    c1.categorias?.length > 0, `got ${c1.categorias?.length}`)
ok('Cada categoría trae subcategorias anidadas',         c1.categorias?.[0]?.subcategorias !== undefined)
ok('Categorías de turismo son 23',                       c1.categorias?.length === 23, `got ${c1.categorias?.length}`)

const c2 = await (await get('/categorias?tipo=producto,servicio,arriendo')).json()
ok('GET /categorias?tipo=producto,servicio,arriendo — 61 cats', c2.categorias?.length === 61, `got ${c2.categorias?.length}`)

const c3 = await (await get('/eventos/categorias')).json()
ok('GET /eventos/categorias — 12 cats',  c3.categorias?.length === 12, `got ${c3.categorias?.length}`)

const c4 = await (await get('/locales/categorias')).json()
ok('GET /locales/categorias — 13 cats',  c4.categorias?.length === 13, `got ${c4.categorias?.length}`)

// ── 3. Upload de imagen ────────────────────────────────────────────────────
console.log('\n🔵 3. Upload de imagen')

// Generar imagen válida con sharp (100x100 rojo)
const { default: sharp } = await import('sharp')
const imgBuffer = await sharp({
  create: { width: 100, height: 100, channels: 3, background: { r: 220, g: 50, b: 50 } }
}).jpeg().toBuffer()

const fd = new FormData()
fd.append('imagen', new Blob([imgBuffer], { type: 'image/jpeg' }), 'test.jpg')

const up1 = await fetch(`${BASE}/upload`, { method: 'POST', body: fd })
const ud1 = await up1.json()
ok('POST /upload sin ?tipo → status 200',           up1.status === 200, `got ${up1.status}`)
ok('Respuesta tiene url',                           typeof ud1.url === 'string')
ok('URL apunta a carpeta productos (default)',       ud1.url?.startsWith('/uploads/productos/'))
ok('Imagen guardada como .webp',                    ud1.url?.endsWith('.webp'))

const fd2 = new FormData()
fd2.append('imagen', new Blob([imgBuffer], { type: 'image/jpeg' }), 'test.jpg')
const up2 = await fetch(`${BASE}/upload?tipo=eventos`, { method: 'POST', body: fd2 })
const ud2 = await up2.json()
ok('POST /upload?tipo=eventos → carpeta correcta',  ud2.url?.startsWith('/uploads/eventos/'))

// ── 4. Eventos ─────────────────────────────────────────────────────────────
console.log('\n🔵 4. Eventos')

const evList1 = await (await get('/eventos/admin')).json()
ok('GET /eventos/admin responde',                   Array.isArray(evList1.eventos))

const evFd = new FormData()
evFd.append('titulo',    'Festival del Lago')
evFd.append('fecha',     '20 - 22 Feb 2026')
evFd.append('ubicacion', 'Costanera, Villarrica')
evFd.append('precio',    'Entrada libre')
evFd.append('categoria_evento_id', c3.categorias?.[0]?.id ?? '')

const evPost = await fetch(`${BASE}/eventos`, { method: 'POST', body: evFd })
const evD    = await evPost.json()
ok('POST /eventos → 201',                           evPost.status === 201, `got ${evPost.status}`)
ok('Evento creado tiene id y titulo',               evD.evento?.id && evD.evento?.titulo === 'Festival del Lago')

const evId = evD.evento?.id

const evFd2 = new FormData()
evFd2.append('titulo', 'Festival del Lago (editado)')
evFd2.append('fecha', '20 - 23 Feb 2026')
evFd2.append('ubicacion', 'Costanera, Villarrica')
evFd2.append('precio', 'Entrada libre')
const evPut = await fetch(`${BASE}/eventos/${evId}`, { method: 'PUT', body: evFd2 })
const evPutD = await evPut.json()
ok('PUT /eventos/:id → 200',                        evPut.status === 200)
ok('Título actualizado correctamente',              evPutD.evento?.titulo === 'Festival del Lago (editado)')

const evTog = await patch(`/eventos/${evId}/toggle`, {})
const evTogD = await evTog.json()
ok('PATCH /eventos/:id/toggle → 200',               evTog.status === 200)
ok('Retorna mensaje de estado',                     typeof evTogD.message === 'string')

const evCrop = await patch(`/eventos/${evId}/crop`, { imagen_crop: { zoom: 1.3, x: 5, y: -10 } })
ok('PATCH /eventos/:id/crop → 200',                 evCrop.status === 200)

const evList2 = await (await get('/eventos/admin')).json()
ok('GET /eventos/admin refleja el evento creado',   evList2.eventos?.length >= 1)
ok('Evento trae nombre de categoría (JOIN)',        typeof evList2.eventos?.[0]?.categoria_nombre !== 'undefined')

const evDel = await del(`/eventos/${evId}`)
ok('DELETE /eventos/:id → 200',                     evDel.status === 200)

// ── 5. Locales ─────────────────────────────────────────────────────────────
console.log('\n🔵 5. Locales')

const locFd = new FormData()
locFd.append('nombre', 'Botillería El Central')
locFd.append('direccion', 'Calle Henríquez 210, Villarrica')
locFd.append('categoria_barrio_id', c4.categorias?.[0]?.id ?? '')

const locPost = await fetch(`${BASE}/locales`, { method: 'POST', body: locFd })
const locD    = await locPost.json()
ok('POST /locales → 201',                           locPost.status === 201)
ok('Local creado tiene id y nombre',                locD.local?.id && locD.local?.nombre === 'Botillería El Central')

const locId = locD.local?.id

const locFd2 = new FormData()
locFd2.append('nombre', 'Botillería El Central (editado)')
locFd2.append('direccion', 'Calle Henríquez 210')
const locPut = await fetch(`${BASE}/locales/${locId}`, { method: 'PUT', body: locFd2 })
ok('PUT /locales/:id → 200',                        locPut.status === 200)

const locTog = await patch(`/locales/${locId}/toggle`, {})
const locTogD = await locTog.json()
ok('PATCH /locales/:id/toggle → 200',               locTog.status === 200)
ok('Retorna mensaje de estado',                     typeof locTogD.message === 'string')

const locCrop = await patch(`/locales/${locId}/crop`, { imagen_crop: { zoom: 1.1, x: 0, y: 5 } })
ok('PATCH /locales/:id/crop → 200',                 locCrop.status === 200)

const locList = await (await get('/locales/admin')).json()
ok('GET /locales/admin refleja el local creado',    locList.locales?.length >= 1)

const locDel = await del(`/locales/${locId}`)
ok('DELETE /locales/:id → 200',                     locDel.status === 200)

// ── 6. Listings ────────────────────────────────────────────────────────────
console.log('\n🔵 6. Listings')

const listBody = {
  tipo: 'producto', seccion: 'destacados',
  nombre: 'Chaqueta de Cuero Marrón',
  descripcion: 'Cuero legítimo, talla única',
  precio: 89990, precio_original: 120000,
  categoria: 'Vestuario y Calzado', categoria_id: 1,
  subcategoria: 'Chaquetas', subcategoria_id: 2,
  badge: 'Oferta', genero: 'unisex',
  imagen: '/uploads/productos/test.webp',
  tallas: { tipo: 'ropa', seleccion: ['S','M','L','XL'] },
  medidas: null
}

const listPost = await post('/listings', listBody)
const listD    = await listPost.json()
ok('POST /listings → 201',                          listPost.status === 201)
ok('Listing creado tiene id',                       listD.listing?.id > 0)
ok('Precio guardado correctamente',                 listD.listing?.precio === 89990)

const listId = listD.listing?.id

const listPut = await put(`/listings/${listId}`, { ...listBody, nombre: 'Chaqueta Editada', precio: 79990 })
const listPutD = await listPut.json()
ok('PUT /listings/:id → 200',                       listPut.status === 200)
ok('Precio actualizado',                            listPutD.listing?.precio === 79990)

const listMine = await (await get('/listings/mine')).json()
ok('GET /listings/mine devuelve array',             Array.isArray(listMine.listings))
ok('Listing aparece en /mine',                      listMine.listings?.some(l => l.id === listId))

const listDel = await del(`/listings/${listId}`)
ok('DELETE /listings/:id → 200',                    listDel.status === 200)

// tipo inválido debe rechazarse
const listBad = await post('/listings', { ...listBody, tipo: 'otro' })
ok('POST /listings con tipo inválido → 400',        listBad.status === 400)

// ── 7. Tours ───────────────────────────────────────────────────────────────
console.log('\n🔵 7. Tours')

const tourBody = {
  nombre: 'Rafting Río Trancura', categoria: 'Aventura y Deportes Extremos',
  ubicacion: 'Río Trancura, Pucón', detalle: 'Clase III y IV — 2 horas',
  precio: 35000, precio_antes: 42000, imagen_principal: 0,
  imagenes: ['/uploads/turismo/r1.webp', '/uploads/turismo/r2.webp', null]
}

const tourPost = await post('/tours', tourBody)
const tourD    = await tourPost.json()
ok('POST /tours → 201',                             tourPost.status === 201)
ok('Tour creado tiene id',                          tourD.tour?.id > 0)
ok('categoria_id resuelto automáticamente',         tourD.tour?.categoria_id > 0, `got ${tourD.tour?.categoria_id}`)

const tourId = tourD.tour?.id

const tourPut = await put(`/tours/${tourId}`, { ...tourBody, nombre: 'Rafting Editado', precio: 30000 })
const tourPutD = await tourPut.json()
ok('PUT /tours/:id → 200',                          tourPut.status === 200)
ok('Precio actualizado',                            tourPutD.tour?.precio === 30000)

const tourCrop = await patch(`/tours/${tourId}/crop`, {
  imagenes_crop: [{ zoom: 1.2, x: 0, y: -5 }, { zoom: 1.0, x: 10, y: 0 }, null]
})
ok('PATCH /tours/:id/crop → 200',                   tourCrop.status === 200)

const tourList = await (await get('/tours')).json()
ok('GET /tours devuelve array',                     Array.isArray(tourList.tours))
ok('Tour aparece en listado',                       tourList.tours?.some(t => t.id === tourId))
ok('imagenes viene como array (no string)',         Array.isArray(tourList.tours?.find(t => t.id === tourId)?.imagenes))

const tourDel = await del(`/tours/${tourId}`)
ok('DELETE /tours/:id → 200',                       tourDel.status === 200)

// ── Resumen ────────────────────────────────────────────────────────────────
const total = passed + failed
console.log(`\n${'─'.repeat(45)}`)
console.log(`  Resultado: ${passed}/${total} tests pasaron`)
if (failed > 0) console.log(`  ⚠️  Fallaron: ${failed} tests`)
else             console.log(`  🎉  Todos los tests pasaron`)
console.log(`${'─'.repeat(45)}\n`)
