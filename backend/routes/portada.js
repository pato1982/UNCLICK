import { Router } from 'express'
import { deleteRemovedUploads, extractUploadUrls } from '../lib/files.js'

const router = Router()

function parse(val) {
  if (!val) return null
  if (typeof val === 'string') try { return JSON.parse(val) } catch { return null }
  return val
}

function parsePortada(row) {
  if (!row) return row
  row.imagenes      = parse(row.imagenes)      ?? []
  row.imagenes_crop = parse(row.imagenes_crop) ?? []
  row.categorias    = parse(row.categorias)    ?? []
  return row
}

function log(pool, usuario_id, accion) {
  pool.query(
    'INSERT INTO tb_actividad_usuarios (usuario_id, accion, entidad) VALUES (?, ?, ?)',
    [usuario_id, accion, 'portada']
  ).catch(() => {})
}

// ── GET /api/v1/portada ────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const [[portada]] = await req.pool.query(
      'SELECT * FROM portadas WHERE usuario_id = ?',
      [req.usuario.id]
    )
    res.json({ portada: parsePortada(portada) ?? null })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error al obtener portada' })
  }
})

// ── POST /api/v1/portada (crear) ───────────────────────────────────────────
router.post('/', async (req, res) => {
  const { nombre, descripcion, imagenes, categorias } = req.body

  if (!imagenes?.length) return res.status(400).json({ error: 'Se requiere al menos una imagen' })

  try {
    const [result] = await req.pool.query(
      `INSERT INTO portadas (usuario_id, nombre, descripcion, imagenes, categorias)
       VALUES (?, ?, ?, ?, ?)`,
      [
        req.usuario.id,
        nombre       || null,
        descripcion  || null,
        JSON.stringify(imagenes),
        categorias?.length ? JSON.stringify(categorias) : null,
      ]
    )
    log(req.pool, req.usuario.id, 'crear_portada')
    const [[portada]] = await req.pool.query('SELECT * FROM portadas WHERE id = ?', [result.insertId])
    res.status(201).json({ portada: parsePortada(portada), id: result.insertId })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error al crear portada' })
  }
})

// ── PUT /api/v1/portada/:id (actualizar) ──────────────────────────────────
router.put('/:id', async (req, res) => {
  const { nombre, descripcion, imagenes, categorias } = req.body

  if (!imagenes?.length) return res.status(400).json({ error: 'Se requiere al menos una imagen' })

  try {
    const [[portada]] = await req.pool.query(
      'SELECT id, imagenes FROM portadas WHERE id = ? AND usuario_id = ?',
      [req.params.id, req.usuario.id]
    )
    if (!portada) return res.status(404).json({ error: 'Portada no encontrada' })

    const oldImagenes = typeof portada.imagenes === 'string' ? JSON.parse(portada.imagenes || '[]') : (portada.imagenes ?? [])

    await req.pool.query(
      `UPDATE portadas
       SET nombre = ?, descripcion = ?, imagenes = ?, categorias = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND usuario_id = ?`,
      [
        nombre       || null,
        descripcion  || null,
        JSON.stringify(imagenes),
        categorias?.length ? JSON.stringify(categorias) : null,
        req.params.id,
        req.usuario.id,
      ]
    )
    deleteRemovedUploads(extractUploadUrls(oldImagenes), imagenes)
    log(req.pool, req.usuario.id, 'actualizar_portada')
    const [[updated]] = await req.pool.query('SELECT * FROM portadas WHERE id = ?', [req.params.id])
    res.json({ portada: parsePortada(updated) })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error al actualizar portada' })
  }
})

// ── PATCH /api/v1/portada/:id/crop ────────────────────────────────────────
router.patch('/:id/crop', async (req, res) => {
  const { imagenes_crop } = req.body

  try {
    const [[portada]] = await req.pool.query(
      'SELECT id FROM portadas WHERE id = ? AND usuario_id = ?',
      [req.params.id, req.usuario.id]
    )
    if (!portada) return res.status(404).json({ error: 'Portada no encontrada' })

    await req.pool.query(
      'UPDATE portadas SET imagenes_crop = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND usuario_id = ?',
      [
        imagenes_crop ? JSON.stringify(imagenes_crop) : null,
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
