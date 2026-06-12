import { Router } from 'express'
import { requirePlan } from '../middleware/requireAuth.js'
import { deleteUpload } from '../lib/files.js'

const router = Router()

const PLAN_PAGINA = 5  // Premium turismo

function parse(val) {
  if (!val) return null
  if (typeof val === 'string') try { return JSON.parse(val) } catch { return null }
  return val
}

function parsePagina(row) {
  if (!row) return row
  row.crop_superior = parse(row.crop_superior)
  row.crop_inferior = parse(row.crop_inferior)
  return row
}

function log(pool, usuario_id, accion) {
  pool.query(
    'INSERT INTO tb_actividad_usuarios (usuario_id, accion, entidad) VALUES (?, ?, ?)',
    [usuario_id, accion, 'pagina']
  ).catch(() => {})
}

// ── GET /api/v1/pagina ────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const [[pagina]] = await req.pool.query(
      'SELECT * FROM paginas WHERE usuario_id = ?',
      [req.usuario.id]
    )
    res.json({ pagina: parsePagina(pagina) ?? null })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error al obtener página' })
  }
})

// ── POST /api/v1/pagina (crear) — requiere plan 5 ─────────────────────────
router.post('/', requirePlan(PLAN_PAGINA), async (req, res) => {
  const {
    titulo_superior, texto_superior, imagen_superior,
    titulo_inferior, texto_inferior, imagen_inferior,
  } = req.body

  try {
    const [result] = await req.pool.query(
      `INSERT INTO paginas
         (usuario_id, titulo_superior, texto_superior, imagen_superior,
          titulo_inferior, texto_inferior, imagen_inferior)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        req.usuario.id,
        titulo_superior || null,
        texto_superior  || null,
        imagen_superior || null,
        titulo_inferior || null,
        texto_inferior  || null,
        imagen_inferior || null,
      ]
    )
    log(req.pool, req.usuario.id, 'crear_pagina')
    const [[pagina]] = await req.pool.query('SELECT * FROM paginas WHERE id = ?', [result.insertId])
    res.status(201).json({ pagina: parsePagina(pagina), id: result.insertId })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error al crear página' })
  }
})

// ── PUT /api/v1/pagina/:id (actualizar) — requiere plan 5 ─────────────────
router.put('/:id', requirePlan(PLAN_PAGINA), async (req, res) => {
  const {
    titulo_superior, texto_superior, imagen_superior,
    titulo_inferior, texto_inferior, imagen_inferior,
  } = req.body

  try {
    const [[pagina]] = await req.pool.query(
      'SELECT id, imagen_superior, imagen_inferior FROM paginas WHERE id = ? AND usuario_id = ?',
      [req.params.id, req.usuario.id]
    )
    if (!pagina) return res.status(404).json({ error: 'Página no encontrada' })

    await req.pool.query(
      `UPDATE paginas
       SET titulo_superior = ?, texto_superior  = ?, imagen_superior = ?,
           titulo_inferior = ?, texto_inferior  = ?, imagen_inferior = ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND usuario_id = ?`,
      [
        titulo_superior || null,
        texto_superior  || null,
        imagen_superior || null,
        titulo_inferior || null,
        texto_inferior  || null,
        imagen_inferior || null,
        req.params.id,
        req.usuario.id,
      ]
    )
    // Borrar imágenes anteriores del disco si fueron reemplazadas
    if (pagina.imagen_superior && pagina.imagen_superior !== (imagen_superior || null)) deleteUpload(pagina.imagen_superior)
    if (pagina.imagen_inferior && pagina.imagen_inferior !== (imagen_inferior || null)) deleteUpload(pagina.imagen_inferior)
    log(req.pool, req.usuario.id, 'actualizar_pagina')
    const [[updated]] = await req.pool.query('SELECT * FROM paginas WHERE id = ?', [req.params.id])
    res.json({ pagina: parsePagina(updated) })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error al actualizar página' })
  }
})

// ── PATCH /api/v1/pagina/:id/crop — requiere plan 5 ──────────────────────
router.patch('/:id/crop', requirePlan(PLAN_PAGINA), async (req, res) => {
  const { crop_superior, crop_inferior } = req.body

  try {
    const [[pagina]] = await req.pool.query(
      'SELECT id FROM paginas WHERE id = ? AND usuario_id = ?',
      [req.params.id, req.usuario.id]
    )
    if (!pagina) return res.status(404).json({ error: 'Página no encontrada' })

    await req.pool.query(
      `UPDATE paginas
       SET crop_superior = ?, crop_inferior = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND usuario_id = ?`,
      [
        crop_superior != null ? JSON.stringify(crop_superior) : null,
        crop_inferior != null ? JSON.stringify(crop_inferior) : null,
        req.params.id,
        req.usuario.id,
      ]
    )
    res.json({ ok: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error al guardar encuadre' })
  }
})

export default router
