import { Router } from 'express'
import { deleteUpload, extractUploadUrls } from '../lib/files.js'

const router = Router()

const TIPOS_VALIDOS    = new Set(['producto', 'servicio', 'arriendo'])
const SECCIONES_VALIDAS = new Set([
  'destacados', 'ofertas', 'novedades', 'liquidacion',
  'tecnologia', 'tendencia', 'servicios', 'arriendos',
])

const PLAN_BANNER = 3  // Plan Premium general

function logActividad(pool, usuario_id, accion, entidad_id = null) {
  pool.query(
    'INSERT INTO tb_actividad_usuarios (usuario_id, accion, entidad, entidad_id) VALUES (?, ?, ?, ?)',
    [usuario_id, accion, 'listing', entidad_id]
  ).catch(() => {})
}

// Deriva la URL de la imagen principal de un set de galería entrante.
// Prioridad: es_principal === true → orden 0 → primera del array.
function imagenPrincipalDe(imagenes) {
  if (!Array.isArray(imagenes) || imagenes.length === 0) return null
  const marcada = imagenes.find(i => i?.es_principal)
  if (marcada?.url) return marcada.url
  const orden0 = imagenes.find(i => Number(i?.orden) === 0)
  if (orden0?.url) return orden0.url
  return imagenes[0]?.url || null
}

// Reemplaza (replace-all) las imágenes de un listing dentro de una conexión transaccional.
async function reemplazarImagenes(conn, listing_id, imagenes) {
  // Borrar del disco las imágenes que ya no están en el nuevo set
  const [oldRows] = await conn.query('SELECT url FROM tb_listing_imagenes WHERE listing_id = ?', [listing_id])
  const newUrls = new Set((imagenes || []).map(i => i?.url).filter(Boolean))
  for (const { url } of oldRows) {
    if (url && !newUrls.has(url)) deleteUpload(url)
  }
  await conn.query('DELETE FROM tb_listing_imagenes WHERE listing_id = ?', [listing_id])
  if (!Array.isArray(imagenes) || imagenes.length === 0) return
  const principalUrl = imagenPrincipalDe(imagenes)
  for (let i = 0; i < imagenes.length; i++) {
    const img = imagenes[i] || {}
    await conn.query(
      `INSERT INTO tb_listing_imagenes
         (listing_id, url, orden, es_principal, pos_x, pos_y, scale, natural_w, natural_h)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        listing_id,
        String(img.url || ''),
        img.orden != null ? Number(img.orden) : i,
        img.url && img.url === principalUrl ? 1 : 0,
        img.pos_x != null ? Number(img.pos_x) : 0,
        img.pos_y != null ? Number(img.pos_y) : 0,
        img.scale != null ? Number(img.scale) : 1,
        img.natural_w != null ? Number(img.natural_w) : null,
        img.natural_h != null ? Number(img.natural_h) : null,
      ]
    )
  }
}

// Reemplaza (replace-all) las variantes de un listing dentro de una conexión transaccional.
async function reemplazarVariantes(conn, listing_id, variantes) {
  await conn.query('DELETE FROM tb_listing_variantes WHERE listing_id = ?', [listing_id])
  if (!Array.isArray(variantes) || variantes.length === 0) return
  for (let i = 0; i < variantes.length; i++) {
    const v = variantes[i] || {}
    if (!v.tipo || !v.valor) continue
    await conn.query(
      `INSERT INTO tb_listing_variantes
         (listing_id, tipo, valor, sku, stock, precio_delta, orden)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        listing_id,
        String(v.tipo).slice(0, 40),
        String(v.valor).slice(0, 80),
        v.sku ? String(v.sku).slice(0, 60) : null,
        v.stock != null ? Number(v.stock) : null,
        v.precio_delta != null ? Math.round(Number(v.precio_delta)) : 0,
        v.orden != null ? Number(v.orden) : i,
      ]
    )
  }
}

// Adjunta imagenes y variantes a una lista de listings sin incurrir en N+1.
async function adjuntarHijos(pool, listings) {
  if (!listings.length) return listings
  const ids = listings.map(l => l.id)
  const placeholders = ids.map(() => '?').join(',')
  const [imgs] = await pool.query(
    `SELECT * FROM tb_listing_imagenes WHERE listing_id IN (${placeholders}) ORDER BY listing_id, orden`,
    ids
  )
  const [vars] = await pool.query(
    `SELECT * FROM tb_listing_variantes WHERE listing_id IN (${placeholders}) ORDER BY listing_id, orden`,
    ids
  )
  const imgsByListing = new Map()
  const varsByListing = new Map()
  for (const img of imgs) {
    if (!imgsByListing.has(img.listing_id)) imgsByListing.set(img.listing_id, [])
    imgsByListing.get(img.listing_id).push(img)
  }
  for (const v of vars) {
    if (!varsByListing.has(v.listing_id)) varsByListing.set(v.listing_id, [])
    varsByListing.get(v.listing_id).push(v)
  }
  for (const l of listings) {
    l.imagenes  = imgsByListing.get(l.id) || []
    l.variantes = varsByListing.get(l.id) || []
  }
  return listings
}

// ── GET /api/v1/listings/mine ──────────────────────────────────────────────
router.get('/mine', async (req, res) => {
  try {
    const [listings] = await req.pool.query(
      'SELECT * FROM tb_listings WHERE usuario_id = ? ORDER BY created_at DESC',
      [req.usuario.id]
    )
    const parsed = listings.map(l => ({
      ...l,
      tallas:  l.tallas  ? (typeof l.tallas  === 'string' ? JSON.parse(l.tallas)  : l.tallas)  : null,
      medidas: l.medidas ? (typeof l.medidas === 'string' ? JSON.parse(l.medidas) : l.medidas) : null,
    }))
    await adjuntarHijos(req.pool, parsed)
    res.json({ listings: parsed })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error al obtener listings' })
  }
})

// ── POST /api/v1/listings ──────────────────────────────────────────────────
router.post('/', async (req, res) => {
  const {
    tipo, seccion, nombre, descripcion,
    precio, precio_original,
    categoria, categoria_id, subcategoria, subcategoria_id,
    badge, genero, imagen, tallas, medidas,
    banner_orden, banner_pos_x, banner_pos_y, banner_scale,
    // ─ nuevos: stock + envío ─
    stock, stock_minimo, sku, peso_gramos,
    alto_cm, ancho_cm, profundidad_cm,
    envio_disponible, retiro_local, costo_envio,
    // ─ nuevos: galería + variantes (1:N) ─
    imagenes, variantes,
  } = req.body

  if (!nombre?.trim())          return res.status(400).json({ error: 'El nombre es requerido' })
  if (!TIPOS_VALIDOS.has(tipo)) return res.status(400).json({ error: 'Tipo inválido' })

  // Validar plan para banner
  if (banner_orden != null && req.usuario.plan_id < PLAN_BANNER) {
    return res.status(403).json({ error: 'El banner requiere Plan Premium (plan 3 o superior)' })
  }

  // Si viene galería, la imagen legacy se deriva de la principal.
  const imagenLegacy = Array.isArray(imagenes) ? imagenPrincipalDe(imagenes) : (imagen || null)

  const conn = await req.pool.getConnection()
  // Guarda: garantiza que release() se llame EXACTAMENTE una vez por conexión,
  // tanto en el camino feliz como en el catch (evita double-release que corrompe el pool).
  let released = false
  const release = () => { if (!released) { released = true; conn.release() } }
  try {
    // Verificar límite de plan
    const [[plan]] = await conn.query(
      'SELECT max_listings FROM planes WHERE id = ?', [req.usuario.plan_id]
    )
    const [[{ total }]] = await conn.query(
      'SELECT COUNT(*) AS total FROM tb_listings WHERE usuario_id = ?', [req.usuario.id]
    )
    if (total >= (plan?.max_listings ?? 5)) {
      release()
      return res.status(403).json({ error: `Límite de tu plan alcanzado (${plan?.max_listings} publicaciones)` })
    }

    await conn.beginTransaction()

    const [result] = await conn.query(
      `INSERT INTO tb_listings
         (usuario_id, tipo, seccion, nombre, descripcion, precio, precio_original,
          categoria, categoria_id, subcategoria, subcategoria_id,
          badge, genero, imagen, tallas, medidas,
          stock, stock_minimo, sku, peso_gramos, alto_cm, ancho_cm, profundidad_cm,
          envio_disponible, retiro_local, costo_envio,
          banner_orden, banner_pos_x, banner_pos_y, banner_scale)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.usuario.id,
        tipo,
        SECCIONES_VALIDAS.has(seccion) ? seccion : 'destacados',
        nombre.trim(),
        descripcion     || null,
        Math.round(Number(precio)) || 0,
        precio_original ? Math.round(Number(precio_original)) : null,
        categoria       || null,
        categoria_id    || null,
        subcategoria    || null,
        subcategoria_id || null,
        badge   || null,
        genero  || null,
        imagenLegacy || null,
        tallas  ? JSON.stringify(tallas)  : null,
        medidas ? JSON.stringify(medidas) : null,
        stock          != null ? Number(stock)          : null,
        stock_minimo   != null ? Number(stock_minimo)   : 0,
        sku ? String(sku).slice(0, 60) : null,
        peso_gramos    != null ? Number(peso_gramos)    : null,
        alto_cm        != null ? Number(alto_cm)        : null,
        ancho_cm       != null ? Number(ancho_cm)       : null,
        profundidad_cm != null ? Number(profundidad_cm) : null,
        envio_disponible ? 1 : 0,
        retiro_local != null ? (retiro_local ? 1 : 0) : 1,
        costo_envio    != null ? Number(costo_envio)    : null,
        banner_orden != null ? Number(banner_orden) : null,
        banner_pos_x != null ? Number(banner_pos_x) : 50,
        banner_pos_y != null ? Number(banner_pos_y) : 50,
        banner_scale != null ? Number(banner_scale) : 1,
      ]
    )

    const listingId = result.insertId
    // Sets hijos: replace-all solo si vienen en el body (retrocompat).
    if (Array.isArray(imagenes))  await reemplazarImagenes(conn, listingId, imagenes)
    if (Array.isArray(variantes)) await reemplazarVariantes(conn, listingId, variantes)

    await conn.commit()
    release()

    logActividad(req.pool, req.usuario.id, 'crear_listing', listingId)
    const [rows] = await req.pool.query('SELECT * FROM tb_listings WHERE id = ?', [listingId])
    await adjuntarHijos(req.pool, rows)
    res.status(201).json({ listing: rows[0] })
  } catch (err) {
    try { await conn.rollback() } catch {}
    release()
    console.error(err)
    res.status(500).json({ error: 'Error al crear el listing' })
  }
})

// ── PUT /api/v1/listings/:id ───────────────────────────────────────────────
router.put('/:id', async (req, res) => {
  const {
    tipo, seccion, nombre, descripcion,
    precio, precio_original,
    categoria, categoria_id, subcategoria, subcategoria_id,
    badge, genero, imagen, tallas, medidas,
    banner_orden, banner_pos_x, banner_pos_y, banner_scale,
    // ─ nuevos: stock + envío ─
    stock, stock_minimo, sku, peso_gramos,
    alto_cm, ancho_cm, profundidad_cm,
    envio_disponible, retiro_local, costo_envio,
    // ─ nuevos: galería + variantes (1:N) ─
    imagenes, variantes,
  } = req.body

  if (!nombre?.trim())          return res.status(400).json({ error: 'El nombre es requerido' })
  if (!TIPOS_VALIDOS.has(tipo)) return res.status(400).json({ error: 'Tipo inválido' })

  // Validar plan para banner
  if (banner_orden != null && req.usuario.plan_id < PLAN_BANNER) {
    return res.status(403).json({ error: 'El banner requiere Plan Premium (plan 3 o superior)' })
  }

  // Si viene galería, la imagen legacy se deriva de la principal; si no, se usa el campo legacy.
  const imagenLegacy = Array.isArray(imagenes) ? imagenPrincipalDe(imagenes) : (imagen || null)

  const conn = await req.pool.getConnection()
  // Guarda: garantiza que release() se llame EXACTAMENTE una vez por conexión.
  let released = false
  const release = () => { if (!released) { released = true; conn.release() } }
  try {
    const [[listing]] = await conn.query(
      'SELECT id, imagen FROM tb_listings WHERE id = ? AND usuario_id = ?',
      [req.params.id, req.usuario.id]
    )
    if (!listing) {
      release()
      return res.status(404).json({ error: 'Listing no encontrado' })
    }

    await conn.beginTransaction()

    await conn.query(
      `UPDATE tb_listings
       SET tipo = ?, seccion = ?, nombre = ?, descripcion = ?,
           precio = ?, precio_original = ?,
           categoria = ?, categoria_id = ?, subcategoria = ?, subcategoria_id = ?,
           badge = ?, genero = ?, imagen = ?, tallas = ?, medidas = ?,
           stock = ?, stock_minimo = ?, sku = ?, peso_gramos = ?,
           alto_cm = ?, ancho_cm = ?, profundidad_cm = ?,
           envio_disponible = ?, retiro_local = ?, costo_envio = ?,
           banner_orden = ?, banner_pos_x = ?, banner_pos_y = ?, banner_scale = ?
       WHERE id = ? AND usuario_id = ?`,
      [
        tipo,
        SECCIONES_VALIDAS.has(seccion) ? seccion : 'destacados',
        nombre.trim(),
        descripcion     || null,
        Math.round(Number(precio)) || 0,
        precio_original ? Math.round(Number(precio_original)) : null,
        categoria       || null,
        categoria_id    || null,
        subcategoria    || null,
        subcategoria_id || null,
        badge   || null,
        genero  || null,
        imagenLegacy || null,
        tallas  ? JSON.stringify(tallas)  : null,
        medidas ? JSON.stringify(medidas) : null,
        stock          != null ? Number(stock)          : null,
        stock_minimo   != null ? Number(stock_minimo)   : 0,
        sku ? String(sku).slice(0, 60) : null,
        peso_gramos    != null ? Number(peso_gramos)    : null,
        alto_cm        != null ? Number(alto_cm)        : null,
        ancho_cm       != null ? Number(ancho_cm)       : null,
        profundidad_cm != null ? Number(profundidad_cm) : null,
        envio_disponible ? 1 : 0,
        retiro_local != null ? (retiro_local ? 1 : 0) : 1,
        costo_envio    != null ? Number(costo_envio)    : null,
        banner_orden != null ? Number(banner_orden) : null,
        banner_pos_x != null ? Number(banner_pos_x) : 50,
        banner_pos_y != null ? Number(banner_pos_y) : 50,
        banner_scale != null ? Number(banner_scale) : 1,
        req.params.id,
        req.usuario.id,
      ]
    )

    // Sets hijos: replace-all solo si vienen en el body (retrocompat).
    if (Array.isArray(imagenes))  await reemplazarImagenes(conn, req.params.id, imagenes)
    if (Array.isArray(variantes)) await reemplazarVariantes(conn, req.params.id, variantes)

    await conn.commit()
    release()

    // Borrar imagen anterior del disco si la principal cambió.
    if (listing.imagen && listing.imagen !== (imagenLegacy || null)) deleteUpload(listing.imagen)
    logActividad(req.pool, req.usuario.id, 'editar_listing', req.params.id)
    const [rows] = await req.pool.query('SELECT * FROM tb_listings WHERE id = ?', [req.params.id])
    await adjuntarHijos(req.pool, rows)
    res.json({ listing: rows[0] })
  } catch (err) {
    try { await conn.rollback() } catch {}
    release()
    console.error(err)
    res.status(500).json({ error: 'Error al actualizar el listing' })
  }
})

// ── DELETE /api/v1/listings/:id ────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const [[listing]] = await req.pool.query(
      'SELECT id, imagen FROM tb_listings WHERE id = ? AND usuario_id = ?',
      [req.params.id, req.usuario.id]
    )
    if (!listing) return res.status(404).json({ error: 'Listing no encontrado' })

    await req.pool.query('DELETE FROM tb_listings WHERE id = ? AND usuario_id = ?',
      [req.params.id, req.usuario.id])
    deleteUpload(listing.imagen)
    logActividad(req.pool, req.usuario.id, 'eliminar_listing', req.params.id)
    res.json({ ok: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error al eliminar el listing' })
  }
})

export default router
