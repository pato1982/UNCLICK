import { Router }   from 'express'
import bcrypt        from 'bcrypt'
import { randomBytes } from 'crypto'
import { sendWelcomeEmail } from '../lib/email.js'
import { logSeguridad }    from '../lib/securityLog.js'
import { deleteUpload }    from '../lib/files.js'

const router      = Router()
const SALT_ROUNDS = 12
const SESSION_DAYS = 30

// Recopila todas las URLs de imágenes subidas de un usuario y elimina su cuenta permanentemente.
async function eliminarCuentaPermanente(pool, usuario_id, ip) {
  const [listRows]    = await pool.query('SELECT imagen FROM tb_listings WHERE usuario_id = ?', [usuario_id])
  const [tourRows]    = await pool.query('SELECT imagenes FROM tb_tours WHERE usuario_id = ?', [usuario_id])
  const [portRows]    = await pool.query('SELECT imagenes FROM portadas WHERE usuario_id = ?', [usuario_id])
  const [pagRows]     = await pool.query('SELECT imagen_superior, imagen_inferior FROM paginas WHERE usuario_id = ?', [usuario_id])
  const [negRows]     = await pool.query('SELECT logo_url FROM negocios WHERE usuario_id = ?', [usuario_id])

  const urls = []
  for (const r of listRows) if (r.imagen) urls.push(r.imagen)
  for (const r of tourRows) {
    const imgs = r.imagenes ? (typeof r.imagenes === 'string' ? JSON.parse(r.imagenes) : r.imagenes) : []
    urls.push(...imgs.filter(u => typeof u === 'string'))
  }
  for (const r of portRows) {
    const imgs = r.imagenes ? (typeof r.imagenes === 'string' ? JSON.parse(r.imagenes) : r.imagenes) : []
    urls.push(...imgs.filter(u => typeof u === 'string'))
  }
  for (const r of pagRows) {
    if (r.imagen_superior) urls.push(r.imagen_superior)
    if (r.imagen_inferior) urls.push(r.imagen_inferior)
  }
  for (const r of negRows) if (r.logo_url) urls.push(r.logo_url)

  // Registrar antes de borrar (FK ON DELETE SET NULL preserva el registro sin usuario_id)
  await pool.query(
    `INSERT INTO tb_historial_seguridad (usuario_id, accion, detalle, ip) VALUES (?, ?, ?, ?)`,
    [usuario_id, 'cuenta_eliminada', 'eliminación permanente tras período de gracia de 10 días', ip]
  )

  // Borrar usuario — CASCADE elimina sesiones, listings, tours, portadas, paginas, negocios
  await pool.query('DELETE FROM usuarios WHERE id = ?', [usuario_id])

  // Borrar archivos del disco
  for (const url of urls) deleteUpload(url)

  console.log(`[account-deletion] Cuenta ${usuario_id} eliminada. ${urls.length} archivo(s) borrado(s).`)
}

function registrarActividad(pool, usuario_id, accion, entidad = null, entidad_id = null, ip = null) {
  pool.query(
    `INSERT INTO tb_actividad_usuarios (usuario_id, accion, entidad, entidad_id, ip)
     VALUES (?, ?, ?, ?, ?)`,
    [usuario_id, accion, entidad, entidad_id, ip]
  ).catch(() => {}) // no bloquea si falla el log
}

function cookieOpts(req, remember = true) {
  const opts = {
    httpOnly: true,
    sameSite: 'lax',
    secure:   req.secure || req.headers['x-forwarded-proto'] === 'https',
  }
  if (remember) opts.maxAge = SESSION_DAYS * 24 * 60 * 60 * 1000
  return opts
}

// ── POST /api/v1/auth/register ─────────────────────────────────────────────
router.post('/register', async (req, res) => {
  const {
    nombre, email, password,
    dni = null, telefono = null, comuna = null, direccion = null,
    tipo_cuenta = 'general',
    vende_productos = 0, ofrece_servicios = 0, ofrece_arriendos = 0,
    plan_id = 1,
  } = req.body

  if (!nombre?.trim())    return res.status(400).json({ error: 'El nombre es requerido' })
  if (!email?.trim())     return res.status(400).json({ error: 'El email es requerido' })
  if (!password || password.length < 6)
    return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' })
  if (!['general', 'turismo'].includes(tipo_cuenta))
    return res.status(400).json({ error: 'Tipo de cuenta inválido' })

  try {
    // Email único
    const [[existe]] = await req.pool.query(
      'SELECT id FROM usuarios WHERE email = ?', [email.trim().toLowerCase()]
    )
    if (existe) return res.status(409).json({ error: 'El email ya está registrado' })

    const hash = await bcrypt.hash(password, SALT_ROUNDS)

    // Plan por defecto según tipo: general→1, turismo→4
    const planFinal = tipo_cuenta === 'turismo' ? 4 : (plan_id || 1)

    const [result] = await req.pool.query(
      `INSERT INTO usuarios
         (nombre, email, password_hash, tipo_cuenta, plan_id,
          vende_productos, ofrece_servicios, ofrece_arriendos,
          dni, telefono, comuna, direccion)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        nombre.trim(), email.trim().toLowerCase(), hash,
        tipo_cuenta, planFinal,
        tipo_cuenta === 'general' ? (vende_productos ? 1 : 0) : 0,
        tipo_cuenta === 'general' ? (ofrece_servicios ? 1 : 0) : 0,
        tipo_cuenta === 'general' ? (ofrece_arriendos ? 1 : 0) : 0,
        dni?.trim() || null, telefono?.trim() || null,
        comuna?.trim() || null, direccion?.trim() || null,
      ]
    )

    const usuario_id = result.insertId

    // Crear entrada vacía de negocio para que el panel cargue sin errores
    await req.pool.query('INSERT IGNORE INTO negocios (usuario_id) VALUES (?)', [usuario_id])

    // Crear sesión automáticamente tras el registro
    const token     = randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + SESSION_DAYS * 86400 * 1000)
      .toISOString().slice(0, 19).replace('T', ' ')

    await req.pool.query(
      'INSERT INTO sesiones (usuario_id, token, expires_at) VALUES (?, ?, ?)',
      [usuario_id, token, expiresAt]
    )

    registrarActividad(req.pool, usuario_id, 'registro', 'sesion', null, req.ip)

    // Email de bienvenida en background — no bloquea el registro
    sendWelcomeEmail(email.trim().toLowerCase(), nombre.trim()).catch(err => {
      console.error('[email] Error al enviar bienvenida:', err.message)
    })

    const [[usuario]] = await req.pool.query(
      `SELECT id, nombre, email, rol, tipo_cuenta, plan_id,
              vende_productos, ofrece_servicios, ofrece_arriendos,
              dni, telefono, direccion, comuna, created_at
       FROM usuarios WHERE id = ?`,
      [usuario_id]
    )

    res.cookie('session_token', token, cookieOpts(req))
    res.status(201).json({ usuario })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error al registrar usuario' })
  }
})

// ── POST /api/v1/auth/login ────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  const { email, password, remember_me = false } = req.body

  if (!email || !password)
    return res.status(400).json({ error: 'Email y contraseña son requeridos' })

  try {
    const [[usuario]] = await req.pool.query(
      `SELECT id, nombre, email, password_hash, rol, tipo_cuenta, plan_id,
              vende_productos, ofrece_servicios, ofrece_arriendos,
              dni, telefono, direccion, comuna, activo, eliminacion_programada_at, created_at
       FROM usuarios WHERE email = ?`,
      [email.trim().toLowerCase()]
    )

    const ip = (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '').slice(0, 45)

    if (!usuario) {
      logSeguridad(req.pool, { accion: 'login_fallido', detalle: `email no registrado: ${email.trim().toLowerCase()}`, ip })
      return res.status(401).json({ error: 'Email o contraseña incorrectos' })
    }

    if (!usuario.activo) {
      // Cuenta con eliminación programada: verificar si está dentro del período de gracia
      if (usuario.eliminacion_programada_at) {
        const deletionDate = new Date(usuario.eliminacion_programada_at)
        const now = new Date()

        if (deletionDate > now) {
          // Dentro del período de gracia — permite recuperación
          const diasRestantes = Math.ceil((deletionDate - now) / (1000 * 60 * 60 * 24))
          return res.status(403).json({ cuenta_en_eliminacion: true, dias_restantes: diasRestantes })
        } else {
          // Período de gracia expirado — eliminar permanentemente
          try {
            const valido = await bcrypt.compare(password, usuario.password_hash)
            if (valido) {
              await eliminarCuentaPermanente(req.pool, usuario.id, ip)
            }
          } catch (err) {
            console.error('[account-deletion] Error al eliminar cuenta permanentemente:', err)
          }
          return res.status(403).json({ error: 'Esta cuenta fue eliminada permanentemente' })
        }
      }

      logSeguridad(req.pool, { usuario_id: usuario.id, accion: 'login_fallido', detalle: 'cuenta desactivada', ip })
      return res.status(403).json({ error: 'Cuenta desactivada' })
    }

    const valido = await bcrypt.compare(password, usuario.password_hash)
    if (!valido) {
      logSeguridad(req.pool, { usuario_id: usuario.id, accion: 'login_fallido', detalle: 'contraseña incorrecta', ip })
      return res.status(401).json({ error: 'Email o contraseña incorrectos' })
    }

    // Crear sesión
    const token     = randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + SESSION_DAYS * 86400 * 1000)
      .toISOString().slice(0, 19).replace('T', ' ')

    await req.pool.query(
      'INSERT INTO sesiones (usuario_id, token, expires_at) VALUES (?, ?, ?)',
      [usuario.id, token, expiresAt]
    )

    registrarActividad(req.pool, usuario.id, 'login', 'sesion', null, req.ip)
    logSeguridad(req.pool, { usuario_id: usuario.id, accion: 'login_exitoso', ip })

    const { password_hash, ...usuarioPublico } = usuario

    res.cookie('session_token', token, cookieOpts(req, remember_me))
    res.json({ usuario: usuarioPublico })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error al iniciar sesión' })
  }
})

// ── GET /api/v1/auth/me ────────────────────────────────────────────────────
// ProtectedRoute del frontend llama a esto para verificar sesión activa
router.get('/me', async (req, res) => {
  const token = req.cookies?.session_token
  if (!token) return res.status(401).json({ error: 'No autenticado' })

  try {
    const [[sesion]] = await req.pool.query(
      `SELECT u.id, u.nombre, u.email, u.rol, u.tipo_cuenta, u.plan_id,
              u.vende_productos, u.ofrece_servicios, u.ofrece_arriendos,
              u.dni, u.telefono, u.direccion, u.comuna, u.created_at
       FROM sesiones s
       JOIN usuarios u ON u.id = s.usuario_id
       WHERE s.token = ? AND s.expires_at > NOW() AND u.activo = 1`,
      [token]
    )

    if (!sesion) return res.status(401).json({ error: 'Sesión inválida o expirada' })

    res.json({ usuario: sesion })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error al verificar sesión' })
  }
})

// ── GET /api/v1/auth/profile/counts ───────────────────────────────────────
router.get('/profile/counts', async (req, res) => {
  const token = req.cookies?.session_token
  if (!token) return res.status(401).json({ error: 'No autenticado' })
  try {
    const [[sesion]] = await req.pool.query(
      'SELECT usuario_id FROM sesiones WHERE token = ? AND expires_at > NOW()', [token]
    )
    if (!sesion) return res.status(401).json({ error: 'Sesión inválida' })
    const uid = sesion.usuario_id

    const [[{ productos }]] = await req.pool.query(
      "SELECT COUNT(*) AS productos FROM tb_listings WHERE usuario_id = ? AND tipo = 'producto'", [uid])
    const [[{ servicios }]] = await req.pool.query(
      "SELECT COUNT(*) AS servicios FROM tb_listings WHERE usuario_id = ? AND tipo = 'servicio'", [uid])
    const [[{ arriendos }]] = await req.pool.query(
      "SELECT COUNT(*) AS arriendos FROM tb_listings WHERE usuario_id = ? AND tipo = 'arriendo'", [uid])
    const [[{ tours }]] = await req.pool.query(
      'SELECT COUNT(*) AS tours FROM tb_tours WHERE usuario_id = ?', [uid])
    const [[{ portada }]] = await req.pool.query(
      'SELECT COUNT(*) AS portada FROM portadas WHERE usuario_id = ?', [uid])
    const [[{ pagina }]] = await req.pool.query(
      'SELECT COUNT(*) AS pagina FROM paginas WHERE usuario_id = ?', [uid])
    const [[{ negocio }]] = await req.pool.query(
      'SELECT COUNT(*) AS negocio FROM negocios WHERE usuario_id = ? AND nombre_negocio IS NOT NULL', [uid])

    res.json({ productos, servicios, arriendos, tours, portada, pagina, negocio })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error al obtener conteos' })
  }
})

// ── GET /api/v1/auth/profile/history ──────────────────────────────────────
router.get('/profile/history', async (req, res) => {
  const token = req.cookies?.session_token
  if (!token) return res.status(401).json({ error: 'No autenticado' })
  try {
    const [[sesion]] = await req.pool.query(
      'SELECT usuario_id FROM sesiones WHERE token = ? AND expires_at > NOW()', [token]
    )
    if (!sesion) return res.status(401).json({ error: 'Sesión inválida' })

    const [rows] = await req.pool.query(
      `SELECT accion, entidad, created_at
       FROM tb_actividad_usuarios
       WHERE usuario_id = ?
       ORDER BY created_at DESC
       LIMIT 50`,
      [sesion.usuario_id]
    )
    res.json({ history: rows })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error al obtener historial' })
  }
})

// ── PUT /api/v1/auth/profile ───────────────────────────────────────────────
router.put('/profile', async (req, res) => {
  const token = req.cookies?.session_token
  if (!token) return res.status(401).json({ error: 'No autenticado' })
  try {
    const [[sesion]] = await req.pool.query(
      'SELECT usuario_id FROM sesiones WHERE token = ? AND expires_at > NOW()', [token]
    )
    if (!sesion) return res.status(401).json({ error: 'Sesión inválida' })
    const uid = sesion.usuario_id

    const {
      email, telefono, direccion,
      tipo_cuenta, vende_productos, ofrece_servicios, ofrece_arriendos,
      plan_id, delete_tipos = [],
    } = req.body

    // Validaciones básicas
    if (email && !email.includes('@')) return res.status(400).json({ error: 'Email inválido' })
    if (tipo_cuenta && !['general', 'turismo'].includes(tipo_cuenta))
      return res.status(400).json({ error: 'Tipo de cuenta inválido' })

    // Email único (si cambió)
    if (email) {
      const [[existe]] = await req.pool.query(
        'SELECT id FROM usuarios WHERE email = ? AND id != ?', [email.trim().toLowerCase(), uid]
      )
      if (existe) return res.status(409).json({ error: 'Ese email ya está en uso' })
    }

    // Borrar listings de tipos desactivados
    if (Array.isArray(delete_tipos) && delete_tipos.length > 0) {
      const validTipos = delete_tipos.filter(t => ['producto', 'servicio', 'arriendo'].includes(t))
      if (validTipos.length > 0) {
        await req.pool.query(
          `DELETE FROM tb_listings WHERE usuario_id = ? AND tipo IN (${validTipos.map(() => '?').join(',')})`,
          [uid, ...validTipos]
        )
      }
    }

    // Si cambia tipo_cuenta, borrar datos del tipo anterior
    if (tipo_cuenta) {
      const [[u]] = await req.pool.query('SELECT tipo_cuenta FROM usuarios WHERE id = ?', [uid])
      if (u && u.tipo_cuenta !== tipo_cuenta) {
        if (tipo_cuenta === 'turismo') {
          // General → Turismo: borrar listings
          await req.pool.query('DELETE FROM tb_listings WHERE usuario_id = ?', [uid])
        } else {
          // Turismo → General: borrar tours, portada, pagina
          await req.pool.query('DELETE FROM tb_tours WHERE usuario_id = ?', [uid])
          await req.pool.query('DELETE FROM portadas WHERE usuario_id = ?', [uid])
          await req.pool.query('DELETE FROM paginas WHERE usuario_id = ?', [uid])
        }
      }
    }

    // Actualizar usuario
    await req.pool.query(
      `UPDATE usuarios SET
        email              = COALESCE(NULLIF(?, ''), email),
        telefono           = COALESCE(NULLIF(?, ''), telefono),
        direccion          = COALESCE(NULLIF(?, ''), direccion),
        tipo_cuenta        = COALESCE(?, tipo_cuenta),
        vende_productos    = COALESCE(?, vende_productos),
        ofrece_servicios   = COALESCE(?, ofrece_servicios),
        ofrece_arriendos   = COALESCE(?, ofrece_arriendos),
        plan_id            = COALESCE(?, plan_id)
       WHERE id = ?`,
      [
        email?.trim().toLowerCase() || '',
        telefono?.trim() || '',
        direccion?.trim() || '',
        tipo_cuenta || null,
        vende_productos != null ? (vende_productos ? 1 : 0) : null,
        ofrece_servicios != null ? (ofrece_servicios ? 1 : 0) : null,
        ofrece_arriendos != null ? (ofrece_arriendos ? 1 : 0) : null,
        plan_id || null,
        uid,
      ]
    )

    registrarActividad(req.pool, uid, 'actualizar_perfil', 'usuario', uid, req.ip)

    const [[usuario]] = await req.pool.query(
      `SELECT id, nombre, email, rol, tipo_cuenta, plan_id,
              vende_productos, ofrece_servicios, ofrece_arriendos,
              dni, telefono, direccion, comuna, created_at
       FROM usuarios WHERE id = ?`,
      [uid]
    )

    res.json({ usuario })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error al actualizar perfil' })
  }
})

// ── PUT /api/v1/auth/password ─────────────────────────────────────────────
// Cambia la contraseña de un usuario autenticado (requiere contraseña actual).
router.put('/password', async (req, res) => {
  const token = req.cookies?.session_token
  if (!token) return res.status(401).json({ error: 'No autenticado' })

  const { password_actual, password_nueva } = req.body
  if (!password_actual)           return res.status(400).json({ error: 'La contraseña actual es requerida' })
  if (!password_nueva || password_nueva.length < 6)
    return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 6 caracteres' })

  try {
    const [[sesion]] = await req.pool.query(
      'SELECT usuario_id FROM sesiones WHERE token = ? AND expires_at > NOW()',
      [token]
    )
    if (!sesion) return res.status(401).json({ error: 'Sesión inválida' })

    const [[usuario]] = await req.pool.query(
      'SELECT id, password_hash FROM usuarios WHERE id = ?',
      [sesion.usuario_id]
    )

    const valido = await bcrypt.compare(password_actual, usuario.password_hash)
    if (!valido) return res.status(401).json({ error: 'La contraseña actual es incorrecta' })

    const hash = await bcrypt.hash(password_nueva, SALT_ROUNDS)
    await req.pool.query('UPDATE usuarios SET password_hash = ? WHERE id = ?', [hash, usuario.id])

    const ipPass = (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '').slice(0, 45)
    registrarActividad(req.pool, usuario.id, 'cambio_password', 'usuario', usuario.id, req.ip)
    logSeguridad(req.pool, { usuario_id: usuario.id, accion: 'cambio_password', detalle: 'cambio desde panel de perfil', ip: ipPass })
    res.json({ ok: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error al cambiar contraseña' })
  }
})

// ── DELETE /api/v1/auth/account ───────────────────────────────────────────
// Programa la eliminación de la cuenta en 10 días y cierra la sesión.
router.delete('/account', async (req, res) => {
  const token = req.cookies?.session_token
  if (!token) return res.status(401).json({ error: 'No autenticado' })

  try {
    const [[sesion]] = await req.pool.query(
      'SELECT usuario_id FROM sesiones WHERE token = ? AND expires_at > NOW()', [token]
    )
    if (!sesion) return res.status(401).json({ error: 'Sesión inválida' })

    const uid = sesion.usuario_id
    const ip  = (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '').slice(0, 45)

    // Programar eliminación: desactivar + marcar fecha límite
    await req.pool.query(
      `UPDATE usuarios SET activo = 0, eliminacion_programada_at = DATE_ADD(NOW(), INTERVAL 10 DAY) WHERE id = ?`,
      [uid]
    )

    // Cerrar todas las sesiones del usuario
    await req.pool.query('DELETE FROM sesiones WHERE usuario_id = ?', [uid])

    await req.pool.query(
      `INSERT INTO tb_historial_seguridad (usuario_id, accion, detalle, ip) VALUES (?, ?, ?, ?)`,
      [uid, 'cuenta_eliminacion_solicitada', 'período de gracia: 10 días', ip]
    )

    res.clearCookie('session_token')
    res.json({ ok: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error al programar la eliminación' })
  }
})

// ── POST /api/v1/auth/account/recover ─────────────────────────────────────
// Cancela una eliminación pendiente. Autentica con email+password (sin sesión activa).
router.post('/account/recover', async (req, res) => {
  const { email, password } = req.body
  if (!email || !password) return res.status(400).json({ error: 'Email y contraseña requeridos' })

  try {
    const [[usuario]] = await req.pool.query(
      `SELECT id, nombre, email, password_hash, rol, tipo_cuenta, plan_id,
              vende_productos, ofrece_servicios, ofrece_arriendos,
              dni, telefono, direccion, comuna, created_at
       FROM usuarios
       WHERE email = ? AND activo = 0
         AND eliminacion_programada_at IS NOT NULL
         AND eliminacion_programada_at > NOW()`,
      [email.trim().toLowerCase()]
    )

    if (!usuario) {
      return res.status(404).json({ error: 'No hay ninguna cuenta con eliminación pendiente para ese email, o el plazo ya expiró' })
    }

    const valido = await bcrypt.compare(password, usuario.password_hash)
    if (!valido) return res.status(401).json({ error: 'Contraseña incorrecta' })

    const ip = (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '').slice(0, 45)

    // Restaurar cuenta
    await req.pool.query(
      'UPDATE usuarios SET activo = 1, eliminacion_programada_at = NULL WHERE id = ?',
      [usuario.id]
    )

    // Crear nueva sesión
    const token     = randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + SESSION_DAYS * 86400 * 1000)
      .toISOString().slice(0, 19).replace('T', ' ')

    await req.pool.query(
      'INSERT INTO sesiones (usuario_id, token, expires_at) VALUES (?, ?, ?)',
      [usuario.id, token, expiresAt]
    )

    await req.pool.query(
      `INSERT INTO tb_historial_seguridad (usuario_id, accion, detalle, ip) VALUES (?, ?, ?, ?)`,
      [usuario.id, 'cuenta_recuperada', 'cuenta recuperada dentro del período de gracia', ip]
    )

    const { password_hash, ...usuarioPublico } = usuario

    res.cookie('session_token', token, cookieOpts(req))
    res.json({ ok: true, usuario: usuarioPublico })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error al recuperar la cuenta' })
  }
})

// ── POST /api/v1/auth/logout ───────────────────────────────────────────────
router.post('/logout', async (req, res) => {
  const token = req.cookies?.session_token
  if (token) {
    try {
      const [[sesion]] = await req.pool.query(
        'SELECT usuario_id FROM sesiones WHERE token = ?', [token]
      )
      await req.pool.query('DELETE FROM sesiones WHERE token = ?', [token])
      if (sesion) {
        const ip = (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '').slice(0, 45)
        registrarActividad(req.pool, sesion.usuario_id, 'logout', 'sesion')
        logSeguridad(req.pool, { usuario_id: sesion.usuario_id, accion: 'logout', ip })
      }
    } catch {}
  }
  res.clearCookie('session_token')
  res.json({ ok: true })
})

export default router
