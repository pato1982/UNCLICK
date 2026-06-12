import { Router }                    from 'express'
import { requireProgramador }         from '../middleware/requireAuth.js'
import { cached }                     from '../lib/cache.js'

const router = Router()

// ── GET /api/v1/monitor (programador — listings y negocios del marketplace) ─
router.get('/', requireProgramador, async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 100, 500)

  try {
    const data = await cached(`monitor:${limit}`, 30_000, async () => {
      const [listings] = await req.pool.query(`
        SELECT l.*,
               u.nombre AS usuario_nombre,
               u.email  AS usuario_email,
               u.plan_id
        FROM tb_listings l
        JOIN usuarios u ON u.id = l.usuario_id
        ORDER BY l.created_at DESC
        LIMIT ?`, [limit])

      const [businesses] = await req.pool.query(`
        SELECT n.*,
               u.nombre     AS usuario_nombre,
               u.email      AS usuario_email,
               u.plan_id,
               u.activo
        FROM negocios n
        JOIN usuarios u ON u.id = n.usuario_id
        ORDER BY n.created_at DESC`)

      return {
        listings,
        businesses,
        total:            listings.length,
        businesses_total: businesses.length,
        generado:         new Date().toISOString(),
      }
    })

    res.json(data)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error al obtener datos del monitor' })
  }
})

export default router
