import { Router } from 'express'
import { deleteUpload } from '../lib/files.js'

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
    banner_orden,
  } = req.body

  if (!nombre?.trim())          return res.status(400).json({ error: 'El nombre es requerido' })
  if (!TIPOS_VALIDOS.has(tipo)) return res.status(400).json({ error: 'Tipo inválido' })

  // Validar plan para banner
  if (banner_orden != null && req.usuario.plan_id < PLAN_BANNER) {
    return res.status(403).json({ error: 'El banner requiere Plan Premium (plan 3 o superior)' })
  }

  try {
    // Verificar límite de plan
    const [[plan]] = await req.pool.query(
      'SELECT max_listings FROM planes WHERE id = ?', [req.usuario.plan_id]
    )
    const [[{ total }]] = await req.pool.query(
      'SELECT COUNT(*) AS total FROM tb_listings WHERE usuario_id = ?', [req.usuario.id]
    )
    if (total >= (plan?.max_listings ?? 5)) {
      return res.status(403).json({ error: `Límite de tu plan alcanzado (${plan?.max_listings} publicaciones)` })
    }

    const [result] = await req.pool.query(
      `INSERT INTO tb_listings
         (usuario_id, tipo, seccion, nombre, descripcion, precio, precio_original,
          categoria, categoria_id, subcategoria, subcategoria_id,
          badge, genero, imagen, tallas, medidas, banner_orden)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
        imagen  || null,
        tallas  ? JSON.stringify(tallas)  : null,
        medidas ? JSON.stringify(medidas) : null,
        banner_orden    != null ? Number(banner_orden) : null,
      ]
    )
    logActividad(req.pool, req.usuario.id, 'crear_listing', result.insertId)
    const [rows] = await req.pool.query('SELECT * FROM tb_listings WHERE id = ?', [result.insertId])
    res.status(201).json({ listing: rows[0] })
  } catch (err) {
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
    banner_orden,
  } = req.body

  if (!nombre?.trim())          return res.status(400).json({ error: 'El nombre es requerido' })
  if (!TIPOS_VALIDOS.has(tipo)) return res.status(400).json({ error: 'Tipo inválido' })

  // Validar plan para banner
  if (banner_orden != null && req.usuario.plan_id < PLAN_BANNER) {
    return res.status(403).json({ error: 'El banner requiere Plan Premium (plan 3 o superior)' })
  }

  try {
    const [[listing]] = await req.pool.query(
      'SELECT id, imagen FROM tb_listings WHERE id = ? AND usuario_id = ?',
      [req.params.id, req.usuario.id]
    )
    if (!listing) return res.status(404).json({ error: 'Listing no encontrado' })

    await req.pool.query(
      `UPDATE tb_listings
       SET tipo = ?, seccion = ?, nombre = ?, descripcion = ?,
           precio = ?, precio_original = ?,
           categoria = ?, categoria_id = ?, subcategoria = ?, subcategoria_id = ?,
           badge = ?, genero = ?, imagen = ?, tallas = ?, medidas = ?,
           banner_orden = ?
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
        imagen  || null,
        tallas  ? JSON.stringify(tallas)  : null,
        medidas ? JSON.stringify(medidas) : null,
        banner_orden    != null ? Number(banner_orden) : null,
        req.params.id,
        req.usuario.id,
      ]
    )
    // Borrar imagen anterior del disco si fue reemplazada
    if (listing.imagen && listing.imagen !== (imagen || null)) deleteUpload(listing.imagen)
    logActividad(req.pool, req.usuario.id, 'editar_listing', req.params.id)
    const [rows] = await req.pool.query('SELECT * FROM tb_listings WHERE id = ?', [req.params.id])
    res.json({ listing: rows[0] })
  } catch (err) {
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
