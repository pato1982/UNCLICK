import { Router } from 'express'
import { uploadImagen } from '../middleware/upload.js'
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

// ── GET /api/v1/eventos/admin ──────────────────────────────────────────────
router.get('/admin', async (req, res) => {
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
router.post('/', ...uploadImagen('eventos'), async (req, res) => {
  const { titulo, fecha, ubicacion, precio, categoria_evento_id } = req.body
  if (!titulo?.trim()) return res.status(400).json({ error: 'El título es requerido' })

  const imagen = req.file?.url || null

  try {
    const [result] = await req.pool.query(
      `INSERT INTO tb_eventos (titulo, fecha, ubicacion, precio, categoria_evento_id, imagen)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        titulo.trim(),
        fecha    || null,
        ubicacion || null,
        precio   || null,
        categoria_evento_id || null,
        imagen,
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
router.put('/:id', ...uploadImagen('eventos'), async (req, res) => {
  const { id } = req.params
  const { titulo, fecha, ubicacion, precio, categoria_evento_id } = req.body
  if (!titulo?.trim()) return res.status(400).json({ error: 'El título es requerido' })

  try {
    const [[evento]] = await req.pool.query('SELECT * FROM tb_eventos WHERE id = ?', [id])
    if (!evento) return res.status(404).json({ error: 'Evento no encontrado' })

    // Si se sube nueva imagen, elimina la anterior
    if (req.file && evento.imagen) await borrarImagen(evento.imagen)
    const imagen = req.file?.url ?? evento.imagen

    await req.pool.query(
      `UPDATE tb_eventos
       SET titulo = ?, fecha = ?, ubicacion = ?, precio = ?, categoria_evento_id = ?, imagen = ?
       WHERE id = ?`,
      [titulo.trim(), fecha || null, ubicacion || null, precio || null, categoria_evento_id || null, imagen, id]
    )
    const [rows] = await req.pool.query('SELECT * FROM tb_eventos WHERE id = ?', [id])
    res.json({ evento: rows[0] })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error al actualizar el evento' })
  }
})

// ── DELETE /api/v1/eventos/:id ─────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
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
router.patch('/:id/toggle', async (req, res) => {
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
router.patch('/:id/crop', async (req, res) => {
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
