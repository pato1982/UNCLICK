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

// ── GET /api/v1/mi-local/categorias ──────────────────────────────────────────
// Todas las categorías de locales (para el panel del usuario)
router.get('/categorias', async (req, res) => {
  try {
    const [categorias] = await req.pool.query(
      'SELECT id, nombre, icono FROM tb_categorias_locales ORDER BY nombre ASC'
    )
    res.json({ categorias })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error al obtener categorías' })
  }
})

// ── GET /api/v1/mi-local ──────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const [[local]] = await req.pool.query(
      `SELECT l.*, c.nombre AS categoria_nombre, c.icono AS categoria_icono
       FROM tb_locales l
       LEFT JOIN tb_categorias_locales c ON c.id = l.categoria_barrio_id
       WHERE l.usuario_id = ?`,
      [req.usuario.id]
    )
    res.json({ local: local ?? null })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error al obtener local' })
  }
})

// ── POST /api/v1/mi-local (crear o actualizar info) ───────────────────────────
router.post('/', async (req, res) => {
  const {
    nombre, descripcion, direccion, categoria_barrio_id,
    telefono, whatsapp, horario, facebook, instagram, correo,
  } = req.body

  if (!nombre?.trim()) return res.status(400).json({ error: 'El nombre del local es requerido' })

  try {
    const [[existing]] = await req.pool.query(
      'SELECT id FROM tb_locales WHERE usuario_id = ?', [req.usuario.id]
    )

    if (existing) {
      await req.pool.query(
        `UPDATE tb_locales
         SET nombre=?, descripcion=?, direccion=?, categoria_barrio_id=?,
             telefono=?, whatsapp=?, horario=?, facebook=?, instagram=?, correo=?
         WHERE usuario_id=?`,
        [
          nombre.trim(), descripcion || null, direccion || null, categoria_barrio_id || null,
          telefono || null, whatsapp || null, horario || null,
          facebook || null, instagram || null, correo || null,
          req.usuario.id,
        ]
      )
    } else {
      await req.pool.query(
        `INSERT INTO tb_locales
         (usuario_id, nombre, descripcion, direccion, categoria_barrio_id,
          telefono, whatsapp, horario, facebook, instagram, correo, activo)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
        [
          req.usuario.id, nombre.trim(), descripcion || null, direccion || null,
          categoria_barrio_id || null, telefono || null, whatsapp || null,
          horario || null, facebook || null, instagram || null, correo || null,
        ]
      )
    }

    const [[local]] = await req.pool.query(
      `SELECT l.*, c.nombre AS categoria_nombre, c.icono AS categoria_icono
       FROM tb_locales l
       LEFT JOIN tb_categorias_locales c ON c.id = l.categoria_barrio_id
       WHERE l.usuario_id = ?`,
      [req.usuario.id]
    )
    res.json({ local })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error al guardar local' })
  }
})

// ── Helper: ruta de imagen por slot ──────────────────────────────────────────
// slot: 'imagen' | 'imagen_2' | 'imagen_3'  (valor controlado, nunca usuario)
function patchImagen(slot) {
  return [
    ...uploadImagen('locales'),
    async (req, res) => {
      if (!req.file?.url) return res.status(400).json({ error: 'No se recibió imagen válida' })
      try {
        const [[local]] = await req.pool.query(
          `SELECT id, \`${slot}\` AS actual FROM tb_locales WHERE usuario_id = ?`,
          [req.usuario.id]
        )
        if (!local) {
          return res.status(404).json({ error: 'Guardá la información del local primero' })
        }
        await borrarImagen(local.actual)
        await req.pool.query(
          `UPDATE tb_locales SET \`${slot}\` = ? WHERE usuario_id = ?`,
          [req.file.url, req.usuario.id]
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
    try {
      const [[local]] = await req.pool.query(
        `SELECT \`${slot}\` AS actual FROM tb_locales WHERE usuario_id = ?`,
        [req.usuario.id]
      )
      if (!local) return res.status(404).json({ error: 'Local no encontrado' })
      await borrarImagen(local.actual)
      await req.pool.query(
        `UPDATE tb_locales SET \`${slot}\` = NULL WHERE usuario_id = ?`,
        [req.usuario.id]
      )
      res.json({ ok: true })
    } catch (err) {
      console.error(err)
      res.status(500).json({ error: 'Error al eliminar imagen' })
    }
  }
}

// ── PATCH /api/v1/mi-local/imagen   (portada — requerida) ─────────────────────
router.patch('/imagen',  ...patchImagen('imagen'))

// ── PATCH /api/v1/mi-local/imagen2  (adicional 1) ────────────────────────────
router.patch('/imagen2', ...patchImagen('imagen_2'))

// ── PATCH /api/v1/mi-local/imagen3  (adicional 2) ────────────────────────────
router.patch('/imagen3', ...patchImagen('imagen_3'))

// ── DELETE /api/v1/mi-local/imagen2 ──────────────────────────────────────────
router.delete('/imagen2', deleteImagen('imagen_2'))

// ── DELETE /api/v1/mi-local/imagen3 ──────────────────────────────────────────
router.delete('/imagen3', deleteImagen('imagen_3'))

export default router
