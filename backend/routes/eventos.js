import { Router } from 'express'
import { uploadImagen } from '../middleware/upload.js'
import { requireAuth, requireProgramador } from '../middleware/requireAuth.js'
import { unlink } from 'fs/promises'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const router    = Router()

// Elimina el archivo físico de una imagen (no lanza error si no existe)
async function borrarImagen(rutaRelativa) {
  if (!rutaRelativa) return
  try {
    await unlink(join(__dirname, '..', rutaRelativa))
  } catch {}
}

// ── GET /api/v1/eventos ───────────────────────────────────────────────────
// Auto-vencimiento: excluye eventos cuya fecha ya pasó (al día siguiente desaparecen)
router.get('/', async (req, res) => {
  try {
    const [eventos] = await req.pool.query(
      `SELECT e.*, c.nombre AS categoria_nombre, c.icono AS categoria_icono
       FROM tb_eventos e
       LEFT JOIN tb_categorias_eventos c ON c.id = e.categoria_evento_id
       WHERE e.activo = 1
         AND (e.fecha IS NULL OR e.fecha >= CURDATE())
       ORDER BY COALESCE(e.fecha, '9999-12-31') ASC, e.created_at DESC`
    )
    res.json({ eventos })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error al obtener eventos' })
  }
})

// ── GET /api/v1/eventos/categorias ────────────────────────────────────────
// Devuelve solo las categorías que tienen al menos un evento activo y vigente
router.get('/categorias', async (req, res) => {
  try {
    const [categorias] = await req.pool.query(
      `SELECT DISTINCT c.id, c.nombre, c.icono
       FROM tb_categorias_eventos c
       INNER JOIN tb_eventos e ON e.categoria_evento_id = c.id
         AND e.activo = 1
         AND (e.fecha IS NULL OR e.fecha >= CURDATE())
       ORDER BY c.nombre ASC`
    )
    res.json({ categorias })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error al obtener categorías de eventos' })
  }
})

// ── GET /api/v1/eventos/admin ──────────────────────────────────────────────
router.get('/admin', requireAuth, requireProgramador, async (req, res) => {
  try {
    const [eventos] = await req.pool.query(
      `SELECT e.*, c.nombre AS categoria_nombre, c.icono AS categoria_icono
       FROM tb_eventos e
       LEFT JOIN tb_categorias c ON c.id = e.categoria_evento_id
       ORDER BY e.created_at DESC`
    )
    res.json({ eventos })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error al obtener eventos' })
  }
})

// ── POST /api/v1/eventos ───────────────────────────────────────────────────
router.post('/', requireAuth, requireProgramador, ...uploadImagen('eventos'), async (req, res) => {
  const { titulo, fecha, ubicacion, precio, categoria_evento_id, descripcion, organizador, telefono, whatsapp, horario } = req.body
  if (!titulo?.trim()) return res.status(400).json({ error: 'El título es requerido' })

  const imagen = req.file?.url || null

  try {
    const [result] = await req.pool.query(
      `INSERT INTO tb_eventos (titulo, fecha, ubicacion, precio, categoria_evento_id, imagen, descripcion, organizador, telefono, whatsapp, horario)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        titulo.trim(),
        fecha    || null,
        ubicacion || null,
        precio   || null,
        categoria_evento_id || null,
        imagen,
        descripcion || null,
        organizador || null,
        telefono || null,
        whatsapp || null,
        horario || null,
      ]
    )
    const [rows] = await req.pool.query('SELECT * FROM tb_eventos WHERE id = ?', [result.insertId])
    res.status(201).json({ evento: rows[0] })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error al crear el evento' })
  }
})

// ── PUT /api/v1/eventos/:id ────────────────────────────────────────────────
router.put('/:id', requireAuth, requireProgramador, ...uploadImagen('eventos'), async (req, res) => {
  const { id } = req.params
  const { titulo, fecha, ubicacion, precio, categoria_evento_id, descripcion, organizador, telefono, whatsapp, horario } = req.body
  if (!titulo?.trim()) return res.status(400).json({ error: 'El título es requerido' })

  try {
    const [[evento]] = await req.pool.query('SELECT * FROM tb_eventos WHERE id = ?', [id])
    if (!evento) return res.status(404).json({ error: 'Evento no encontrado' })

    if (req.file && evento.imagen) await borrarImagen(evento.imagen)
    const imagen = req.file?.url ?? evento.imagen

    await req.pool.query(
      `UPDATE tb_eventos
       SET titulo = ?, fecha = ?, ubicacion = ?, precio = ?, categoria_evento_id = ?, imagen = ?,
           descripcion = ?, organizador = ?, telefono = ?, whatsapp = ?, horario = ?
       WHERE id = ?`,
      [titulo.trim(), fecha || null, ubicacion || null, precio || null, categoria_evento_id || null, imagen,
       descripcion || null, organizador || null, telefono || null, whatsapp || null, horario || null, id]
    )
    const [rows] = await req.pool.query('SELECT * FROM tb_eventos WHERE id = ?', [id])
    res.json({ evento: rows[0] })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error al actualizar el evento' })
  }
})

// ── DELETE /api/v1/eventos/:id ─────────────────────────────────────────────
router.delete('/:id', requireAuth, requireProgramador, async (req, res) => {
  try {
    const [[evento]] = await req.pool.query('SELECT imagen FROM tb_eventos WHERE id = ?', [req.params.id])
    if (!evento) return res.status(404).json({ error: 'Evento no encontrado' })

    await req.pool.query('DELETE FROM tb_eventos WHERE id = ?', [req.params.id])
    await borrarImagen(evento.imagen)

    res.json({ ok: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error al eliminar el evento' })
  }
})

// ── PATCH /api/v1/eventos/:id/toggle ──────────────────────────────────────
router.patch('/:id/toggle', requireAuth, requireProgramador, async (req, res) => {
  try {
    const [[evento]] = await req.pool.query('SELECT activo FROM tb_eventos WHERE id = ?', [req.params.id])
    if (!evento) return res.status(404).json({ error: 'Evento no encontrado' })

    const nuevoEstado = evento.activo ? 0 : 1
    await req.pool.query('UPDATE tb_eventos SET activo = ? WHERE id = ?', [nuevoEstado, req.params.id])
    res.json({ message: nuevoEstado ? 'Evento activado' : 'Evento desactivado', activo: nuevoEstado })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error al cambiar estado' })
  }
})

// ── PATCH /api/v1/eventos/:id/crop ────────────────────────────────────────
router.patch('/:id/crop', requireAuth, requireProgramador, async (req, res) => {
  const { imagen_crop } = req.body
  try {
    await req.pool.query(
      'UPDATE tb_eventos SET imagen_crop = ? WHERE id = ?',
      [JSON.stringify(imagen_crop), req.params.id]
    )
    res.json({ ok: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error al guardar encuadre' })
  }
})

export default router
