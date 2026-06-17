import { Router }       from 'express'
import { uploadImagen } from '../middleware/upload.js'
import { unlink }       from 'fs/promises'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const router    = Router()

async function borrarImagen(ruta) {
  if (!ruta || ruta.includes('placeholder')) return
  try { await unlink(join(__dirname, '..', ruta.replace(/^\//, ''))) } catch {}
}

// Verifica que el evento pertenezca al usuario logueado
async function ownsEvento(pool, eventoId, usuarioId) {
  const [[e]] = await pool.query(
    'SELECT id FROM tb_eventos WHERE id = ? AND usuario_id = ?',
    [eventoId, usuarioId]
  )
  return !!e
}

// ── GET /api/v1/mis-eventos/categorias ───────────────────────────────────────
// Todas las categorías de eventos (para el panel del usuario)
router.get('/categorias', async (req, res) => {
  try {
    const [categorias] = await req.pool.query(
      'SELECT id, nombre, icono FROM tb_categorias_eventos ORDER BY nombre ASC'
    )
    res.json({ categorias })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error al obtener categorías' })
  }
})

// ── GET /api/v1/mis-eventos ───────────────────────────────────────────────────
// Lista todos los eventos del usuario (incluye vencidos, para que pueda verlos y eliminarlos)
router.get('/', async (req, res) => {
  try {
    const [eventos] = await req.pool.query(
      `SELECT e.*, c.nombre AS categoria_nombre, c.icono AS categoria_icono
       FROM tb_eventos e
       LEFT JOIN tb_categorias_eventos c ON c.id = e.categoria_evento_id
       WHERE e.usuario_id = ?
       ORDER BY e.fecha ASC, e.created_at DESC`,
      [req.usuario.id]
    )
    res.json({ eventos })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error al obtener eventos' })
  }
})

// ── POST /api/v1/mis-eventos (crear nuevo evento) ─────────────────────────────
router.post('/', async (req, res) => {
  const {
    titulo, fecha, ubicacion, precio, categoria_evento_id,
    descripcion, organizador, telefono, whatsapp, horario,
  } = req.body

  if (!titulo?.trim()) return res.status(400).json({ error: 'El título del evento es requerido' })
  if (!fecha)          return res.status(400).json({ error: 'La fecha del evento es requerida' })

  try {
    const [result] = await req.pool.query(
      `INSERT INTO tb_eventos
       (usuario_id, titulo, fecha, ubicacion, precio, categoria_evento_id,
        descripcion, organizador, telefono, whatsapp, horario, activo)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [
        req.usuario.id, titulo.trim(), fecha,
        ubicacion || null, precio || null, categoria_evento_id || null,
        descripcion || null, organizador || null,
        telefono || null, whatsapp || null, horario || null,
      ]
    )
    const [[evento]] = await req.pool.query(
      `SELECT e.*, c.nombre AS categoria_nombre, c.icono AS categoria_icono
       FROM tb_eventos e
       LEFT JOIN tb_categorias_eventos c ON c.id = e.categoria_evento_id
       WHERE e.id = ?`,
      [result.insertId]
    )
    res.status(201).json({ evento })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error al crear evento' })
  }
})

// ── PUT /api/v1/mis-eventos/:id (editar evento propio) ───────────────────────
router.put('/:id', async (req, res) => {
  const { id } = req.params
  const {
    titulo, fecha, ubicacion, precio, categoria_evento_id,
    descripcion, organizador, telefono, whatsapp, horario,
  } = req.body

  if (!titulo?.trim()) return res.status(400).json({ error: 'El título es requerido' })
  if (!fecha)          return res.status(400).json({ error: 'La fecha es requerida' })

  try {
    if (!await ownsEvento(req.pool, id, req.usuario.id)) {
      return res.status(403).json({ error: 'No tenés permiso para editar este evento' })
    }

    await req.pool.query(
      `UPDATE tb_eventos
       SET titulo=?, fecha=?, ubicacion=?, precio=?, categoria_evento_id=?,
           descripcion=?, organizador=?, telefono=?, whatsapp=?, horario=?
       WHERE id=? AND usuario_id=?`,
      [
        titulo.trim(), fecha,
        ubicacion || null, precio || null, categoria_evento_id || null,
        descripcion || null, organizador || null,
        telefono || null, whatsapp || null, horario || null,
        id, req.usuario.id,
      ]
    )
    const [[evento]] = await req.pool.query(
      `SELECT e.*, c.nombre AS categoria_nombre, c.icono AS categoria_icono
       FROM tb_eventos e
       LEFT JOIN tb_categorias_eventos c ON c.id = e.categoria_evento_id
       WHERE e.id = ?`,
      [id]
    )
    res.json({ evento })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error al actualizar evento' })
  }
})

// ── DELETE /api/v1/mis-eventos/:id ───────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  const { id } = req.params
  try {
    const [[evento]] = await req.pool.query(
      'SELECT * FROM tb_eventos WHERE id = ? AND usuario_id = ?',
      [id, req.usuario.id]
    )
    if (!evento) return res.status(403).json({ error: 'No tenés permiso para eliminar este evento' })

    await req.pool.query('DELETE FROM tb_eventos WHERE id = ?', [id])
    await borrarImagen(evento.imagen)
    await borrarImagen(evento.imagen_2)
    await borrarImagen(evento.imagen_3)

    res.json({ ok: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error al eliminar evento' })
  }
})

// ── Helper imágenes por slot ──────────────────────────────────────────────────
function patchImagen(slot) {
  return [
    ...uploadImagen('eventos'),
    async (req, res) => {
      const { id } = req.params
      if (!req.file?.url) return res.status(400).json({ error: 'No se recibió imagen válida' })
      try {
        const [[evento]] = await req.pool.query(
          `SELECT \`${slot}\` AS actual FROM tb_eventos WHERE id = ? AND usuario_id = ?`,
          [id, req.usuario.id]
        )
        if (!evento) return res.status(403).json({ error: 'No tenés permiso para modificar este evento' })
        await borrarImagen(evento.actual)
        await req.pool.query(
          `UPDATE tb_eventos SET \`${slot}\` = ? WHERE id = ? AND usuario_id = ?`,
          [req.file.url, id, req.usuario.id]
        )
        res.json({ url: req.file.url, slot })
      } catch (err) {
        console.error(err)
        res.status(500).json({ error: 'Error al guardar imagen' })
      }
    },
  ]
}

function deleteImagen(slot) {
  return async (req, res) => {
    const { id } = req.params
    try {
      const [[evento]] = await req.pool.query(
        `SELECT \`${slot}\` AS actual FROM tb_eventos WHERE id = ? AND usuario_id = ?`,
        [id, req.usuario.id]
      )
      if (!evento) return res.status(403).json({ error: 'No tenés permiso' })
      await borrarImagen(evento.actual)
      await req.pool.query(
        `UPDATE tb_eventos SET \`${slot}\` = NULL WHERE id = ? AND usuario_id = ?`,
        [id, req.usuario.id]
      )
      res.json({ ok: true })
    } catch (err) {
      console.error(err)
      res.status(500).json({ error: 'Error al eliminar imagen' })
    }
  }
}

// ── PATCH /api/v1/mis-eventos/:id/imagen   (portada) ─────────────────────────
router.patch('/:id/imagen',  ...patchImagen('imagen'))

// ── PATCH /api/v1/mis-eventos/:id/imagen2  (adicional 1) ─────────────────────
router.patch('/:id/imagen2', ...patchImagen('imagen_2'))

// ── PATCH /api/v1/mis-eventos/:id/imagen3  (adicional 2) ─────────────────────
router.patch('/:id/imagen3', ...patchImagen('imagen_3'))

// ── DELETE /api/v1/mis-eventos/:id/imagen2 ───────────────────────────────────
router.delete('/:id/imagen2', deleteImagen('imagen_2'))

// ── DELETE /api/v1/mis-eventos/:id/imagen3 ───────────────────────────────────
router.delete('/:id/imagen3', deleteImagen('imagen_3'))

export default router
