import { Router }     from 'express'
import { requireAuth } from '../middleware/requireAuth.js'

const router = Router()

const MESES = ['', 'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

function last6Months() {
  const now = new Date()
  const months = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push({ year: d.getFullYear(), month: d.getMonth() + 1, mes: MESES[d.getMonth() + 1] })
  }
  return months
}

function fillMonths(rows, months) {
  const map = {}
  rows.forEach(r => { map[`${r.year}-${r.month}`] = Number(r.valor) })
  return months.map(m => ({ mes: m.mes, valor: map[`${m.year}-${m.month}`] ?? 0 }))
}

// ── POST /api/v1/analytics/track (público, sin sesión requerida) ──────────
router.post('/track', async (req, res) => {
  const { user_id, event_type, listing_id, pagina } = req.body
  if (!user_id || !event_type) return res.status(400).json({ error: 'Faltan campos' })
  const ip = (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '').slice(0, 45)
  try {
    if (event_type === 'page_view') {
      await req.pool.query(
        'INSERT INTO tb_analytics_visitas (usuario_id, ip, pagina) VALUES (?, ?, ?)',
        [user_id, ip, pagina || 'tienda']
      )
    } else if (event_type === 'product_click') {
      await req.pool.query(
        'INSERT INTO tb_analytics_clicks (usuario_id, listing_id, event_type) VALUES (?, ?, ?)',
        [user_id, listing_id || null, 'product_click']
      )
    } else if (event_type === 'card_click') {
      await req.pool.query(
        'INSERT INTO tb_analytics_clicks (usuario_id, listing_id, event_type) VALUES (?, ?, ?)',
        [user_id, listing_id || null, 'card_click']
      )
    }
    res.json({ ok: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error al registrar evento' })
  }
})

// ── GET /api/v1/analytics/stats (privado — estadísticas del usuario activo) ─
router.get('/stats', requireAuth, async (req, res) => {
  const uid = req.usuario.id
  const months = last6Months()

  try {
    const [[visitasRows], [clicksRows], [cardRows], [[resV]], [[resC]], [porPaginaRows]] = await Promise.all([
      req.pool.query(`
        SELECT YEAR(created_at) AS year, MONTH(created_at) AS month, COUNT(*) AS valor
        FROM tb_analytics_visitas
        WHERE usuario_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
        GROUP BY YEAR(created_at), MONTH(created_at)
        ORDER BY year, month`, [uid]),

      req.pool.query(`
        SELECT YEAR(created_at) AS year, MONTH(created_at) AS month, COUNT(*) AS valor
        FROM tb_analytics_clicks
        WHERE usuario_id = ? AND event_type = 'product_click' AND created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
        GROUP BY YEAR(created_at), MONTH(created_at)
        ORDER BY year, month`, [uid]),

      req.pool.query(`
        SELECT YEAR(created_at) AS year, MONTH(created_at) AS month, COUNT(*) AS valor
        FROM tb_analytics_clicks
        WHERE usuario_id = ? AND event_type = 'card_click' AND created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
        GROUP BY YEAR(created_at), MONTH(created_at)
        ORDER BY year, month`, [uid]),

      req.pool.query(`
        SELECT COUNT(*) AS visitas_mes, COUNT(DISTINCT ip) AS visitantes_unicos
        FROM tb_analytics_visitas
        WHERE usuario_id = ? AND YEAR(created_at) = YEAR(NOW()) AND MONTH(created_at) = MONTH(NOW())`, [uid]),

      req.pool.query(`
        SELECT
          SUM(event_type = 'product_click') AS clicks_mes,
          SUM(event_type = 'card_click')    AS card_clicks_mes
        FROM tb_analytics_clicks
        WHERE usuario_id = ? AND YEAR(created_at) = YEAR(NOW()) AND MONTH(created_at) = MONTH(NOW())`, [uid]),

      req.pool.query(`
        SELECT pagina, COUNT(*) AS total
        FROM tb_analytics_visitas
        WHERE usuario_id = ? AND YEAR(created_at) = YEAR(NOW()) AND MONTH(created_at) = MONTH(NOW())
        GROUP BY pagina`, [uid]),
    ])

    const por_pagina = {}
    porPaginaRows.forEach(r => { por_pagina[r.pagina] = Number(r.total) })

    res.json({
      visitas:     fillMonths(visitasRows, months),
      clicks:      fillMonths(clicksRows,  months),
      card_clicks: fillMonths(cardRows,    months),
      resumen: {
        visitas_mes:       Number(resV.visitas_mes)       || 0,
        visitantes_unicos: Number(resV.visitantes_unicos) || 0,
        clicks_mes:        Number(resC.clicks_mes)        || 0,
        card_clicks_mes:   Number(resC.card_clicks_mes)   || 0,
        por_pagina,
      },
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error al obtener estadísticas' })
  }
})

export default router
