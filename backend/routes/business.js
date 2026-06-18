import { Router } from 'express'

const router = Router()

function log(pool, usuario_id, accion) {
  pool.query(
    'INSERT INTO tb_actividad_usuarios (usuario_id, accion, entidad) VALUES (?, ?, ?)',
    [usuario_id, accion, 'negocio']
  ).catch(() => {})
}

function parseHorarios(row) {
  if (!row) return row
  if (row.horarios && typeof row.horarios === 'string') {
    try { row.horarios = JSON.parse(row.horarios) } catch {}
  }
  return row
}

// ── GET /api/v1/business ───────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const [[business]] = await req.pool.query(
      'SELECT * FROM negocios WHERE usuario_id = ?',
      [req.usuario.id]
    )
    res.json({ business: parseHorarios(business) ?? null })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error al obtener negocio' })
  }
})

// ── POST /api/v1/business (actualización parcial — solo toca campos presentes) ──
// AdminNegocio envía texto/contacto; AdminApariencia envía solo apariencia.
// Usar un UPSERT fijo sobrescribiría con null los campos del otro módulo.
// Solución: INSERT IGNORE crea la fila (con defaults del schema) si no existe,
// luego UPDATE dinámico solo actualiza los campos que vienen en el body.
router.post('/', async (req, res) => {
  const b = req.body

  // Campos de texto/contacto
  const TEXT_FIELDS = [
    'nombre_negocio', 'slogan', 'descripcion', 'ubicacion', 'direccion',
    'whatsapp', 'telefono', 'correo', 'facebook', 'instagram',
  ]
  // Campos de apariencia
  const APPEARANCE_FIELDS = [
    'header_preset', 'header_color', 'header_bar',
    'banner_color', 'services_color', 'arriendos_color',
    'sidebar_style', 'nav_color', 'nav_style',
  ]

  try {
    // Garantiza que la fila exista; los defaults del schema se aplican en la creación
    await req.pool.query(
      'INSERT IGNORE INTO negocios (usuario_id) VALUES (?)',
      [req.usuario.id]
    )

    // Construir SET dinámico con solo los campos presentes en el body
    const setClauses = []
    const values = []

    for (const k of TEXT_FIELDS) {
      if (k in b) { setClauses.push(`${k} = ?`); values.push(b[k] || null) }
    }
    for (const k of APPEARANCE_FIELDS) {
      if (k in b) { setClauses.push(`${k} = ?`); values.push(b[k] || null) }
    }
    // Campos con transformación especial
    if ('horarios' in b) {
      setClauses.push('horarios = ?')
      values.push(b.horarios ? JSON.stringify(b.horarios) : null)
    }
    if ('header_height' in b) {
      setClauses.push('header_height = ?')
      values.push(b.header_height != null ? Number(b.header_height) : null)
    }
    if (setClauses.length > 0) {
      setClauses.push('updated_at = CURRENT_TIMESTAMP')
      values.push(req.usuario.id)
      await req.pool.query(
        `UPDATE negocios SET ${setClauses.join(', ')} WHERE usuario_id = ?`,
        values
      )
    }

    log(req.pool, req.usuario.id, 'actualizar_negocio')

    const [[business]] = await req.pool.query(
      'SELECT * FROM negocios WHERE usuario_id = ?',
      [req.usuario.id]
    )
    res.json({ business: parseHorarios(business) })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error al guardar negocio' })
  }
})

export default router
