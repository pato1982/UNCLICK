import { Router } from 'express'

const router = Router()

function parseHorarios(row) {
  if (!row) return row
  if (row.horarios && typeof row.horarios === 'string') {
    try { row.horarios = JSON.parse(row.horarios) } catch {}
  }
  return row
}

function parseJson(val) {
  if (!val) return null
  if (typeof val === 'string') try { return JSON.parse(val) } catch { return null }
  return val
}

// ── GET /api/v1/public/listings ───────────────────────────────────────────
// Todos los listings activos del marketplace (sin auth — vista pública)
// Soporta ?limit=N&offset=N para paginación. Default amplio porque el frontend
// (App.jsx) consume el endpoint sin parámetros y aún no implementa UI de paginación:
// el default debe cubrir el catálogo completo para no truncar el marketplace.
router.get('/listings', async (req, res) => {
  const limit  = Math.min(parseInt(req.query.limit)  || 500, 1000)
  const offset = Math.max(parseInt(req.query.offset) || 0, 0)
  try {
    const [[{ total }]] = await req.pool.query(
      'SELECT COUNT(*) AS total FROM tb_listings l JOIN usuarios u ON u.id = l.usuario_id AND u.activo = 1'
    )
    const [listings] = await req.pool.query(`
      SELECT l.*,
             l.usuario_id            AS user_id,
             u.plan_id               AS owner_plan_id,
             n.nombre_negocio,
             n.whatsapp              AS negocio_whatsapp,
             n.telefono              AS negocio_telefono,
             n.direccion             AS negocio_direccion,
             n.correo                AS negocio_correo,
             n.facebook              AS negocio_facebook,
             n.instagram             AS negocio_instagram
      FROM tb_listings l
      JOIN usuarios u ON u.id = l.usuario_id AND u.activo = 1
      LEFT JOIN negocios n ON n.usuario_id = l.usuario_id
      ORDER BY l.created_at DESC
      LIMIT ? OFFSET ?`, [limit, offset])

    const parsed = listings.map(l => ({
      ...l,
      tallas:  parseJson(l.tallas),
      medidas: parseJson(l.medidas),
    }))

    // Adjuntar galería y variantes en batch (sin N+1).
    if (parsed.length) {
      const ids = parsed.map(l => l.id)
      const ph  = ids.map(() => '?').join(',')
      const [imgs] = await req.pool.query(
        `SELECT * FROM tb_listing_imagenes WHERE listing_id IN (${ph}) ORDER BY listing_id, orden`, ids
      )
      const [vars] = await req.pool.query(
        `SELECT * FROM tb_listing_variantes WHERE listing_id IN (${ph}) ORDER BY listing_id, orden`, ids
      )
      const imgsBy = new Map(), varsBy = new Map()
      for (const i of imgs) {
        if (!imgsBy.has(i.listing_id)) imgsBy.set(i.listing_id, [])
        imgsBy.get(i.listing_id).push(i)
      }
      for (const v of vars) {
        if (!varsBy.has(v.listing_id)) varsBy.set(v.listing_id, [])
        varsBy.get(v.listing_id).push(v)
      }
      for (const l of parsed) {
        l.imagenes  = imgsBy.get(l.id) || []
        l.variantes = varsBy.get(l.id) || []
      }
    }

    res.json({ listings: parsed, total, limit, offset })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error al cargar listings' })
  }
})

// ── GET /api/v1/public/listings/:userId ─────────────────────────────────
// Listings públicos de un usuario específico para la vista de tienda (sin auth)
// ?banner=1 filtra solo los que tienen banner asignado (plan 3+)
router.get('/listings/:userId', async (req, res) => {
  const banner = req.query.banner === '1'
  try {
    const [listings] = await req.pool.query(`
      SELECT l.*,
             l.usuario_id            AS user_id,
             u.plan_id               AS owner_plan_id,
             n.nombre_negocio,
             n.whatsapp              AS negocio_whatsapp,
             n.telefono              AS negocio_telefono,
             n.direccion             AS negocio_direccion,
             n.correo                AS negocio_correo,
             n.facebook              AS negocio_facebook,
             n.instagram             AS negocio_instagram
      FROM tb_listings l
      JOIN usuarios u ON u.id = l.usuario_id AND u.activo = 1
      LEFT JOIN negocios n ON n.usuario_id = l.usuario_id
      WHERE l.usuario_id = ? AND l.activo = 1
      ${banner ? 'AND l.banner_orden IS NOT NULL ORDER BY l.banner_orden ASC' : 'ORDER BY l.created_at DESC'}`,
      [req.params.userId]
    )

    const parsed = listings.map(l => ({
      ...l,
      tallas:  parseJson(l.tallas),
      medidas: parseJson(l.medidas),
    }))

    if (parsed.length) {
      const ids = parsed.map(l => l.id)
      const ph  = ids.map(() => '?').join(',')
      const [imgs] = await req.pool.query(
        `SELECT * FROM tb_listing_imagenes WHERE listing_id IN (${ph}) ORDER BY listing_id, orden`, ids
      )
      const [vars] = await req.pool.query(
        `SELECT * FROM tb_listing_variantes WHERE listing_id IN (${ph}) ORDER BY listing_id, orden`, ids
      )
      const imgsBy = new Map(), varsBy = new Map()
      for (const i of imgs) {
        if (!imgsBy.has(i.listing_id)) imgsBy.set(i.listing_id, [])
        imgsBy.get(i.listing_id).push(i)
      }
      for (const v of vars) {
        if (!varsBy.has(v.listing_id)) varsBy.set(v.listing_id, [])
        varsBy.get(v.listing_id).push(v)
      }
      for (const l of parsed) {
        l.imagenes  = imgsBy.get(l.id) || []
        l.variantes = varsBy.get(l.id) || []
      }
    }

    res.json({ listings: parsed })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error al cargar listings del usuario' })
  }
})

// ── GET /api/v1/public/portadas ───────────────────────────────────────────
// Todas las portadas activas (turismo — sin auth)
router.get('/portadas', async (req, res) => {
  try {
    const [portadas] = await req.pool.query(`
      SELECT p.*,
             u.plan_id,
             u.tipo_cuenta,
             n.nombre_negocio,
             n.ubicacion,
             n.direccion,
             n.horarios,
             n.telefono,
             n.whatsapp,
             n.correo,
             n.facebook,
             n.instagram
      FROM portadas p
      JOIN usuarios u ON u.id = p.usuario_id AND u.activo = 1
      LEFT JOIN negocios n ON n.usuario_id = p.usuario_id
      ORDER BY p.updated_at DESC`)

    const parsed = portadas.map(p => ({
      ...p,
      imagenes:      parseJson(p.imagenes)      ?? [],
      imagenes_crop: parseJson(p.imagenes_crop) ?? [],
      categorias:    parseJson(p.categorias)    ?? [],
      horarios:      parseJson(p.horarios)      ?? [],
    }))
    res.json({ portadas: parsed })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error al cargar portadas' })
  }
})

// ── GET /api/v1/public/business/:userId ──────────────────────────────────
// Info pública de un negocio para la vista de tienda (sin auth)
router.get('/business/:userId', async (req, res) => {
  try {
    const [[business]] = await req.pool.query(`
      SELECT n.*, u.plan_id, u.tipo_cuenta
      FROM negocios n
      JOIN usuarios u ON u.id = n.usuario_id AND u.activo = 1
      WHERE n.usuario_id = ?`,
      [req.params.userId]
    )
    if (!business) return res.status(404).json({ error: 'Negocio no encontrado' })
    res.json({ business: parseHorarios(business) })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error al cargar negocio' })
  }
})

// ── GET /api/v1/public/tours ──────────────────────────────────────────────
// Todos los tours activos del marketplace turismo (sin auth)
router.get('/tours', async (req, res) => {
  try {
    const [tours] = await req.pool.query(`
      SELECT t.*,
             t.usuario_id  AS user_id,
             u.plan_id     AS owner_plan_id,
             n.nombre_negocio
      FROM tb_tours t
      JOIN usuarios u ON u.id = t.usuario_id AND u.activo = 1 AND u.tipo_cuenta = 'turismo' AND u.plan_id = 5
      LEFT JOIN negocios n ON n.usuario_id = t.usuario_id
      ORDER BY t.created_at DESC`)

    const parsed = tours.map(t => ({
      ...t,
      imagenes:      parseJson(t.imagenes)      ?? [],
      imagenes_crop: parseJson(t.imagenes_crop) ?? [],
    }))
    res.json({ tours: parsed })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error al cargar tours' })
  }
})

// ── GET /api/v1/public/tours/:userId ─────────────────────────────────────
// Tours públicos de un usuario turismo (sin auth)
router.get('/tours/:userId', async (req, res) => {
  try {
    const [tours] = await req.pool.query(`
      SELECT t.*
      FROM tb_tours t
      JOIN usuarios u ON u.id = t.usuario_id AND u.activo = 1
      WHERE t.usuario_id = ?
      ORDER BY t.created_at DESC`,
      [req.params.userId]
    )
    const parsed = tours.map(t => ({
      ...t,
      imagenes:      parseJson(t.imagenes)      ?? [],
      imagenes_crop: parseJson(t.imagenes_crop) ?? [],
    }))
    res.json({ tours: parsed })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error al cargar tours' })
  }
})

// ── GET /api/v1/public/pagina/:userId ────────────────────────────────────
// Página de presentación pública de un usuario turismo (sin auth)
router.get('/pagina/:userId', async (req, res) => {
  try {
    const [[pagina]] = await req.pool.query(`
      SELECT p.*
      FROM paginas p
      JOIN usuarios u ON u.id = p.usuario_id AND u.activo = 1
      WHERE p.usuario_id = ?`,
      [req.params.userId]
    )
    if (!pagina) return res.json({ pagina: null })
    if (pagina.crop_superior && typeof pagina.crop_superior === 'string') {
      try { pagina.crop_superior = JSON.parse(pagina.crop_superior) } catch {}
    }
    if (pagina.crop_inferior && typeof pagina.crop_inferior === 'string') {
      try { pagina.crop_inferior = JSON.parse(pagina.crop_inferior) } catch {}
    }
    res.json({ pagina })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error al cargar página' })
  }
})

export default router
