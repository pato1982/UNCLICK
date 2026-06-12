// Verifica que la request tenga una sesión válida.
// Adjunta req.usuario con todos los datos del usuario logueado.
export async function requireAuth(req, res, next) {
  const token = req.cookies?.session_token

  if (!token) return res.status(401).json({ error: 'No autenticado' })

  try {
    const [[sesion]] = await req.pool.query(
      `SELECT s.usuario_id, s.expires_at,
              u.id, u.nombre, u.email, u.rol, u.tipo_cuenta, u.plan_id,
              u.vende_productos, u.ofrece_servicios, u.ofrece_arriendos,
              u.telefono, u.direccion, u.comuna, u.activo
       FROM sesiones s
       JOIN usuarios u ON u.id = s.usuario_id
       WHERE s.token = ? AND s.expires_at > NOW() AND u.activo = 1`,
      [token]
    )

    if (!sesion) return res.status(401).json({ error: 'Sesión inválida o expirada' })

    req.usuario = sesion
    next()
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error al verificar sesión' })
  }
}

// Solo para el rol programador
export function requireProgramador(req, res, next) {
  if (req.usuario?.rol !== 'programador') {
    return res.status(403).json({ error: 'Acceso restringido al programador' })
  }
  next()
}

// Verifica que el usuario tenga el plan mínimo requerido
export function requirePlan(minPlanId) {
  return (req, res, next) => {
    if ((req.usuario?.plan_id ?? 0) < minPlanId) {
      return res.status(403).json({ error: `Se requiere plan ${minPlanId} o superior` })
    }
    next()
  }
}
