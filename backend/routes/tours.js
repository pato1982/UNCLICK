import { Router } from 'express'
import { deleteUpload, deleteRemovedUploads, extractUploadUrls } from '../lib/files.js'

const router = Router()

function logActividad(pool, usuario_id, accion, entidad_id = null) {
  pool.query(
    'INSERT INTO tb_actividad_usuarios (usuario_id, accion, entidad, entidad_id) VALUES (?, ?, ?, ?)',
    [usuario_id, accion, 'tour', entidad_id]
  ).catch(() => {})
}

// ── GET /api/v1/tours ──────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const [tours] = await req.pool.query(
      'SELECT * FROM tb_tours WHERE usuario_id = ? ORDER BY created_at DESC',
      [req.usuario.id]
    )
    const parsed = tours.map(t => ({
      ...t,
      imagenes:      t.imagenes      ? (typeof t.imagenes      === 'string' ? JSON.parse(t.imagenes)      : t.imagenes)      : [],
      imagenes_crop: t.imagenes_crop ? (typeof t.imagenes_crop === 'string' ? JSON.parse(t.imagenes_crop) : t.imagenes_crop) : [],
    }))
    res.json({ tours: parsed })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error al obtener tours' })
  }
})

// ── POST /api/v1/tours ─────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  const { nombre, categoria, ubicacion, detalle, precio, precio_antes, imagen_principal, imagenes, imagenes_crop } = req.body

  if (!nombre?.trim()) return res.status(400).json({ error: 'El nombre es requerido' })

  // Buscar categoria_id a partir del nombre
  let categoria_id = null
  if (categoria) {
    const [[cat]] = await req.pool.query(
      'SELECT id FROM tb_categorias WHERE nombre = ? AND tipo = ? LIMIT 1',
      [categoria, 'turismo']
    )
    if (cat) categoria_id = cat.id
  }

  try {
    const [result] = await req.pool.query(
      `INSERT INTO tb_tours
         (usuario_id, nombre, categoria, categoria_id, ubicacion, detalle, precio, precio_antes, imagen_principal, imagenes, imagenes_crop)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.usuario.id,
        nombre.trim(),
        categoria      || null,
        categoria_id,
        ubicacion      || null,
        detalle        || null,
        precio         ? Math.round(Number(precio))       : null,
        precio_antes   ? Math.round(Number(precio_antes)) : null,
        imagen_principal ?? 0,
        imagenes?.length ? JSON.stringify(imagenes) : null,
        imagenes_crop  ? JSON.stringify(imagenes_crop) : null,
      ]
    )
    logActividad(req.pool, req.usuario.id, 'crear_tour', result.insertId)
    const [rows] = await req.pool.query('SELECT * FROM tb_tours WHERE id = ?', [result.insertId])
    res.status(201).json({ tour: rows[0] })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error al crear el tour' })
  }
})

// ── PUT /api/v1/tours/:id ──────────────────────────────────────────────────
router.put('/:id', async (req, res) => {
  const { nombre, categoria, ubicacion, detalle, precio, precio_antes, imagen_principal, imagenes } = req.body

  if (!nombre?.trim()) return res.status(400).json({ error: 'El nombre es requerido' })

  try {
    const [[tour]] = await req.pool.query(
      'SELECT id, imagenes FROM tb_tours WHERE id = ? AND usuario_id = ?',
      [req.params.id, req.usuario.id]
    )
    if (!tour) return res.status(404).json({ error: 'Tour no encontrado' })

    const oldImagenes = typeof tour.imagenes === 'string' ? JSON.parse(tour.imagenes || '[]') : (tour.imagenes ?? [])

    let categoria_id = null
    if (categoria) {
      const [[cat]] = await req.pool.query(
        'SELECT id FROM tb_categorias WHERE nombre = ? AND tipo = ? LIMIT 1',
        [categoria, 'turismo']
      )
      if (cat) categoria_id = cat.id
    }

    await req.pool.query(
      `UPDATE tb_tours
       SET nombre = ?, categoria = ?, categoria_id = ?, ubicacion = ?, detalle = ?,
           precio = ?, precio_antes = ?, imagen_principal = ?, imagenes = ?
       WHERE id = ?`,
      [
        nombre.trim(),
        categoria    || null,
        categoria_id,
        ubicacion    || null,
        detalle      || null,
        precio       ? Math.round(Number(precio))       : null,
        precio_antes ? Math.round(Number(precio_antes)) : null,
        imagen_principal ?? 0,
        imagenes?.length ? JSON.stringify(imagenes) : null,
        req.params.id,
      ]
    )
    deleteRemovedUploads(extractUploadUrls(oldImagenes), imagenes ?? [])
    logActividad(req.pool, req.usuario.id, 'editar_tour', req.params.id)
    const [rows] = await req.pool.query('SELECT * FROM tb_tours WHERE id = ?', [req.params.id])
    res.json({ tour: rows[0] })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error al actualizar el tour' })
  }
})

// ── DELETE /api/v1/tours/:id ───────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const [[tour]] = await req.pool.query(
      'SELECT id, imagenes FROM tb_tours WHERE id = ? AND usuario_id = ?',
      [req.params.id, req.usuario.id]
    )
    if (!tour) return res.status(404).json({ error: 'Tour no encontrado' })

    await req.pool.query('DELETE FROM tb_tours WHERE id = ? AND usuario_id = ?',
      [req.params.id, req.usuario.id])
    const imgs = typeof tour.imagenes === 'string' ? JSON.parse(tour.imagenes || '[]') : (tour.imagenes ?? [])
    extractUploadUrls(imgs).forEach(url => deleteUpload(url))
    logActividad(req.pool, req.usuario.id, 'eliminar_tour', req.params.id)
    res.json({ ok: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error al eliminar el tour' })
  }
})

// ── PATCH /api/v1/tours/:id/crop ──────────────────────────────────────────
router.patch('/:id/crop', async (req, res) => {
  try {
    const [result] = await req.pool.query(
      'UPDATE tb_tours SET imagenes_crop = ? WHERE id = ? AND usuario_id = ?',
      [JSON.stringify(req.body.imagenes_crop), req.params.id, req.usuario.id]
    )
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Tour no encontrado' })
    res.json({ ok: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error al guardar encuadre' })
  }
})

export default router
