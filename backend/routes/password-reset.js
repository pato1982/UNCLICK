import { Router }    from 'express'
import { randomBytes } from 'crypto'
import bcrypt          from 'bcrypt'
import { sendPasswordResetEmail } from '../lib/email.js'
import { logSeguridad }           from '../lib/securityLog.js'

const router     = Router()
const SALT_ROUNDS = 12
const TOKEN_TTL_MS = 60 * 60 * 1000 // 1 hora

// ── POST /api/v1/password-reset/request ──────────────────────────────────────
// Genera token, lo guarda en BD y envía email con el enlace de reset.
// Siempre responde OK aunque el email no exista (evita enumerar usuarios).
router.post('/request', async (req, res) => {
  const { email } = req.body
  if (!email?.trim()) return res.status(400).json({ error: 'El email es requerido' })

  try {
    const [[usuario]] = await req.pool.query(
      'SELECT id, nombre, email FROM usuarios WHERE email = ? AND activo = 1',
      [email.trim().toLowerCase()]
    )

    const ip = (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '').slice(0, 45)

    if (usuario) {
      // Borrar tokens anteriores del mismo usuario
      await req.pool.query(
        'DELETE FROM tb_password_reset_tokens WHERE usuario_id = ?',
        [usuario.id]
      )

      const token     = randomBytes(32).toString('hex')
      const expiresAt = new Date(Date.now() + TOKEN_TTL_MS)
        .toISOString().slice(0, 19).replace('T', ' ')

      await req.pool.query(
        'INSERT INTO tb_password_reset_tokens (usuario_id, token, expires_at) VALUES (?, ?, ?)',
        [usuario.id, token, expiresAt]
      )

      // Registrar solicitud de reset
      logSeguridad(req.pool, { usuario_id: usuario.id, accion: 'reset_solicitado', detalle: `email: ${usuario.email}`, ip })

      // Enviar email en background — no bloquea la respuesta
      sendPasswordResetEmail(usuario.email, usuario.nombre, token).catch(err => {
        console.error('[email] Error al enviar reset:', err.message)
      })
    }

    // Respuesta igual si el usuario existe o no (anti-enumeración)
    res.json({ message: 'Si ese email está registrado, recibirás instrucciones en unos minutos.' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error al procesar la solicitud' })
  }
})

// ── POST /api/v1/password-reset/reset ────────────────────────────────────────
// Valida el token y actualiza la contraseña del usuario.
router.post('/reset', async (req, res) => {
  const { token, password } = req.body
  if (!token)                  return res.status(400).json({ error: 'Token requerido' })
  if (!password || password.length < 6)
    return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' })

  try {
    const [[row]] = await req.pool.query(
      `SELECT t.id, t.usuario_id, t.expires_at
       FROM tb_password_reset_tokens t
       WHERE t.token = ?`,
      [token]
    )

    if (!row)                              return res.status(400).json({ error: 'Token inválido o ya utilizado' })
    if (new Date(row.expires_at) < new Date()) return res.status(400).json({ error: 'El enlace ha expirado. Solicita uno nuevo.' })

    const hash = await bcrypt.hash(password, SALT_ROUNDS)

    await req.pool.query(
      'UPDATE usuarios SET password_hash = ? WHERE id = ?',
      [hash, row.usuario_id]
    )

    // Invalidar todas las sesiones activas del usuario
    await req.pool.query('DELETE FROM sesiones WHERE usuario_id = ?', [row.usuario_id])

    // Borrar el token usado
    await req.pool.query('DELETE FROM tb_password_reset_tokens WHERE id = ?', [row.id])

    // Registrar en historial de seguridad
    const ip = (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '').slice(0, 45)
    logSeguridad(req.pool, { usuario_id: row.usuario_id, accion: 'reset_password', detalle: 'contraseña restablecida via email', ip })

    res.json({ ok: true, message: 'Contraseña actualizada correctamente' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error al restablecer la contraseña' })
  }
})

export default router
