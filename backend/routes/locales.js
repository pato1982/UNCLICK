import { Router } from 'express'
import { uploadImagen } from '../middleware/upload.js'
import { requireAuth, requireProgramador } from '../middleware/requireAuth.js'
import { unlink } from 'fs/promises'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const router    = Router()

async function borrarImagen(rutaRelativa) {
  if (!rutaRelativa) return
  try { await unlink(join(__dirname, '..', rutaRelativa)) } catch {}
}

// ── GET /api/v1/locales ────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const [locales] = await req.pool.query(
      `SELECT l.*, c.nombre AS categoria_nombre, c.icono AS categoria_icono
       FROM tb_locales l
       LEFT JOIN tb_categorias c ON c.id = l.categoria_barrio_id
       WHERE l.activo = 1
       ORDER BY l.created_at DESC`
    )
    res.json({ locales })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error al obtener locales' })
  }
})

// ── GET /api/v1/locales/categorias ────────────────────────────────────────
// Devuelve solo las categorías que tienen al menos un local activo
router.get('/categorias', async (req, res) => {
  try {
    const [categorias] = await req.pool.query(
      `SELECT DISTINCT c.id, c.nombre, c.icono
       FROM tb_categorias c
       INNER JOIN tb_locales l ON l.categoria_barrio_id = c.id AND l.activo = 1
       ORDER BY c.nombre ASC`
    )
    res.json({ categorias })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error al obtener categorías de locales' })
  }
})

// ── GET /api/v1/locales/admin ──────────────────────────────────────────────
router.get('/admin', requireAuth, requireProgramador, async (req, res) => {
  try {
    const [locales] = await req.pool.query(
      `SELECT l.*, c.nombre AS categoria_nombre, c.icono AS categoria_icono
       FROM tb_locales l
       LEFT JOIN tb_categorias c ON c.id = l.categoria_barrio_id
       ORDER BY l.created_at DESC`
    )
    res.json({ locales })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error al obtener locales' })
  }
})

// ── POST /api/v1/locales ───────────────────────────────────────────────────
router.post('/', requireAuth, requireProgramador, ...uploadImagen('locales'), async (req, res) => {
  const { nombre, direccion, categoria_barrio_id, descripcion, telefono, whatsapp, horario, facebook, instagram, correo } = req.body
  if (!nombre?.trim()) return res.status(400).json({ error: 'El nombre es requerido' })

  try {
    const [result] = await req.pool.query(
      `INSERT INTO tb_locales (nombre, direccion, categoria_barrio_id, imagen, descripcion, telefono, whatsapp, horario, facebook, instagram, correo)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [nombre.trim(), direccion || null, categoria_barrio_id || null, req.file?.url || null,
       descripcion || null, telefono || null, whatsapp || null, horario || null,
       facebook || null, instagram || null, correo || null]
    )
    const [rows] = await req.pool.query('SELECT * FROM tb_locales WHERE id = ?', [result.insertId])
    res.status(201).json({ local: rows[0] })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error al crear el local' })
  }
})

// ── PUT /api/v1/locales/:id ────────────────────────────────────────────────
router.put('/:id', requireAuth, requireProgramador, ...uploadImagen('locales'), async (req, res) => {
  const { nombre, direccion, categoria_barrio_id, descripcion, telefono, whatsapp, horario, facebook, instagram, correo } = req.body
  if (!nombre?.trim()) return res.status(400).json({ error: 'El nombre es requerido' })

  try {
    const [[local]] = await req.pool.query('SELECT * FROM tb_locales WHERE id = ?', [req.params.id])
    if (!local) return res.status(404).json({ error: 'Local no encontrado' })

    if (req.file && local.imagen) await borrarImagen(local.imagen)
    const imagen = req.file?.url ?? local.imagen

    await req.pool.query(
      `UPDATE tb_locales
       SET nombre = ?, direccion = ?, categoria_barrio_id = ?, imagen = ?,
           descripcion = ?, telefono = ?, whatsapp = ?, horario = ?,
           facebook = ?, instagram = ?, correo = ?
       WHERE id = ?`,
      [nombre.trim(), direccion || null, categoria_barrio_id || null, imagen,
       descripcion || null, telefono || null, whatsapp || null, horario || null,
       facebook || null, instagram || null, correo || null, req.params.id]
    )
    const [rows] = await req.pool.query('SELECT * FROM tb_locales WHERE id = ?', [req.params.id])
    res.json({ local: rows[0] })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error al actualizar el local' })
  }
})

// ── DELETE /api/v1/locales/:id ─────────────────────────────────────────────
router.delete('/:id', requireAuth, requireProgramador, async (req, res) => {
  try {
    const [[local]] = await req.pool.query('SELECT imagen FROM tb_locales WHERE id = ?', [req.params.id])
    if (!local) return res.status(404).json({ error: 'Local no encontrado' })

    await req.pool.query('DELETE FROM tb_locales WHERE id = ?', [req.params.id])
    await borrarImagen(local.imagen)
    res.json({ ok: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error al eliminar el local' })
  }
})

// ── PATCH /api/v1/locales/:id/toggle ──────────────────────────────────────
router.patch('/:id/toggle', requireAuth, requireProgramador, async (req, res) => {
  try {
    const [[local]] = await req.pool.query('SELECT activo FROM tb_locales WHERE id = ?', [req.params.id])
    if (!local) return res.status(404).json({ error: 'Local no encontrado' })

    const nuevoEstado = local.activo ? 0 : 1
    await req.pool.query('UPDATE tb_locales SET activo = ? WHERE id = ?', [nuevoEstado, req.params.id])
    res.json({ message: nuevoEstado ? 'Local activado' : 'Local desactivado', activo: nuevoEstado })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error al cambiar estado' })
  }
})

// ── PATCH /api/v1/locales/:id/crop ────────────────────────────────────────
router.patch('/:id/crop', requireAuth, requireProgramador, async (req, res) => {
  try {
    await req.pool.query(
      'UPDATE tb_locales SET imagen_crop = ? WHERE id = ?',
      [JSON.stringify(req.body.imagen_crop), req.params.id]
    )
    res.json({ ok: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error al guardar encuadre' })
  }
})

export default router
