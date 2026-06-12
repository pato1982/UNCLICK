/**
 * Registra eventos de seguridad en tb_historial_seguridad.
 * Nunca lanza excepciones — los fallos de log no deben romper el flujo principal.
 */
export function logSeguridad(pool, { usuario_id = null, accion, detalle = null, ip = null }) {
  pool.query(
    `INSERT INTO tb_historial_seguridad (usuario_id, accion, detalle, ip)
     VALUES (?, ?, ?, ?)`,
    [usuario_id, accion, detalle, ip]
  ).catch(err => console.error('[security-log]', err.message))
}
