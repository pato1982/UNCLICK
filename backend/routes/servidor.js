import { Router }                    from 'express'
import { requireAuth, requireProgramador } from '../middleware/requireAuth.js'
import { cached }                     from '../lib/cache.js'

const router = Router()

// ── POST /api/v1/servidor/visita (público — registra visita al sitio) ─────
router.post('/visita', async (req, res) => {
  const ip = (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '').slice(0, 45)
  const pagina = (req.body?.pagina || 'home').slice(0, 40)
  try {
    await req.pool.query(
      'INSERT INTO tb_visitas_sitio (ip, pagina) VALUES (?, ?)',
      [ip, pagina]
    )
    res.json({ ok: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error al registrar visita' })
  }
})

// ── GET /api/v1/servidor/estadisticas (programador) ───────────────────────
router.get('/estadisticas', requireAuth, requireProgramador, async (req, res) => {
  try {
    const data = await cached('servidor:estadisticas', 30_000, async () => {
      const [[kpisRow]] = await req.pool.query(`
        SELECT
          COUNT(*)                                                  AS total,
          SUM(tipo_cuenta = 'general' AND plan_id = 1)             AS general_gratis,
          SUM(tipo_cuenta = 'general' AND plan_id = 2)             AS general_normal,
          SUM(tipo_cuenta = 'general' AND plan_id >= 3)            AS general_premium,
          SUM(tipo_cuenta = 'turismo' AND plan_id < 5)             AS turismo_gratis,
          SUM(tipo_cuenta = 'turismo' AND plan_id >= 5)            AS turismo_premium
        FROM usuarios WHERE activo = 1`)

      const [[{ hoy }]] = await req.pool.query(
        'SELECT COUNT(*) AS hoy FROM tb_visitas_sitio WHERE DATE(created_at) = CURDATE()')
      const [[{ semanales }]] = await req.pool.query(
        'SELECT COUNT(*) AS semanales FROM tb_visitas_sitio WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)')
      const [[{ mensuales }]] = await req.pool.query(
        'SELECT COUNT(*) AS mensuales FROM tb_visitas_sitio WHERE YEAR(created_at) = YEAR(NOW()) AND MONTH(created_at) = MONTH(NOW())')
      const [[{ total_vis }]] = await req.pool.query(
        'SELECT COUNT(*) AS total_vis FROM tb_visitas_sitio')
      const [[{ visitantes_unicos }]] = await req.pool.query(
        'SELECT COUNT(DISTINCT ip) AS visitantes_unicos FROM tb_visitas_sitio WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)')
      const [[{ reiterados }]] = await req.pool.query(`
        SELECT COUNT(*) AS reiterados
        FROM (
          SELECT ip FROM tb_visitas_sitio
          WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
          GROUP BY ip HAVING COUNT(*) > 1
        ) t`)
      const [[{ promedio_raw }]] = await req.pool.query(
        'SELECT COUNT(*) / 30 AS promedio_raw FROM tb_visitas_sitio WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)')

      return {
        kpis: {
          total:           Number(kpisRow.total)           || 0,
          general_gratis:  Number(kpisRow.general_gratis)  || 0,
          general_normal:  Number(kpisRow.general_normal)  || 0,
          general_premium: Number(kpisRow.general_premium) || 0,
          turismo_gratis:  Number(kpisRow.turismo_gratis)  || 0,
          turismo_premium: Number(kpisRow.turismo_premium) || 0,
        },
        visitas: {
          hoy:               Number(hoy)               || 0,
          promedio_diario:   Math.round(Number(promedio_raw) * 10) / 10 || 0,
          semanales:         Number(semanales)          || 0,
          mensuales:         Number(mensuales)          || 0,
          total:             Number(total_vis)          || 0,
          visitantes_unicos: Number(visitantes_unicos)  || 0,
          reiterados:        Number(reiterados)         || 0,
        },
      }
    })

    res.json(data)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error al obtener estadísticas' })
  }
})

export default router
