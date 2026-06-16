import { Router }                    from 'express'
import { requireAuth, requireProgramador } from '../middleware/requireAuth.js'
import { cached }                     from '../lib/cache.js'
import fs                             from 'fs'
import path                           from 'path'
import { fileURLToPath }              from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname  = path.dirname(__filename)
const backendDir = path.resolve(__dirname, '..')

async function getDirSize(dir) {
  let total = 0
  try {
    const entries = await fs.promises.readdir(dir, { withFileTypes: true })
    await Promise.all(entries.map(async entry => {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) total += await getDirSize(full)
      else if (entry.isFile()) { const s = await fs.promises.stat(full); total += s.size }
    }))
  } catch {}
  return total
}

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

// ── GET /api/v1/servidor/stats (programador) ──────────────────────────────
router.get('/stats', requireAuth, requireProgramador, async (req, res) => {
  try {
    const data = await cached('servidor:stats', 60_000, async () => {
      // ── Uploads: tamaño por subcarpeta ──────────────────────────────────
      const uploadsDir = path.join(backendDir, 'uploads')
      const uploadsCarpetas = []
      let uploadsTotal = 0
      try {
        const entries = await fs.promises.readdir(uploadsDir, { withFileTypes: true })
        await Promise.all(entries.map(async entry => {
          const full = path.join(uploadsDir, entry.name)
          if (entry.isDirectory()) {
            const bytes = await getDirSize(full)
            uploadsCarpetas.push({ nombre: entry.name, bytes })
            uploadsTotal += bytes
          } else if (entry.isFile()) {
            const s = await fs.promises.stat(full)
            uploadsTotal += s.size
          }
        }))
        uploadsCarpetas.sort((a, b) => b.bytes - a.bytes)
      } catch {}

      // ── Disco: espacio total/libre del sistema ──────────────────────────
      let discoTotal = 0, discoUsado = 0, discoDisponible = 0
      try {
        const sf = await fs.promises.statfs(uploadsDir)
        discoTotal     = sf.bsize * sf.blocks
        discoDisponible = sf.bsize * sf.bavail
        discoUsado     = discoTotal - sf.bsize * sf.bfree
      } catch {}

      // ── Base de datos: tamaño por tabla ────────────────────────────────
      const [tablas] = await req.pool.query(`
        SELECT
          TABLE_NAME                         AS tabla,
          TABLE_ROWS                         AS filas,
          DATA_LENGTH + INDEX_LENGTH         AS total_bytes,
          DATA_LENGTH                        AS data_bytes,
          INDEX_LENGTH                       AS index_bytes
        FROM information_schema.TABLES
        WHERE TABLE_SCHEMA = DATABASE()
        ORDER BY total_bytes DESC
      `)

      let bdDatos = 0, bdIndices = 0
      for (const t of tablas) {
        bdDatos   += Number(t.data_bytes)  || 0
        bdIndices += Number(t.index_bytes) || 0
      }

      return {
        disco: {
          total:         discoTotal,
          usado:         discoUsado,
          disponible:    discoDisponible,
          uploads:       uploadsTotal,
          uploadsCarpetas,
        },
        bd: {
          total:   bdDatos + bdIndices,
          datos:   bdDatos,
          indices: bdIndices,
          tablas:  tablas.map(t => ({
            tabla:       t.tabla,
            filas:       Number(t.filas) || 0,
            total_bytes: Number(t.total_bytes) || 0,
          })),
        },
      }
    })

    res.json(data)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error al obtener stats del servidor' })
  }
})

export default router
