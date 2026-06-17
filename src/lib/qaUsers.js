/**
 * Cuentas de prueba (QA) para trabajar en LOCAL sin backend.
 *
 * El proyecto es "solo diseño": no hay servidor que valide credenciales.
 * Estas cuentas permiten iniciar sesión de forma local (mock) para entrar
 * a las secciones de ejemplo/prueba del panel según tipo de cuenta, plan
 * y capacidades (Productos / Servicios / Arriendos).
 *
 * Solo se usan en modo desarrollo (import.meta.env.DEV).
 */

export const QA_PASSWORD = 'Dev1234!'

export const QA_USERS = [
  // General Plan 1 (Gratis)
  { email: 'gen_p1_p@qa.dev',   nombre: 'P1 · Productos',          tipo: 'general', plan: 1, caps: ['P'] },
  { email: 'gen_p1_s@qa.dev',   nombre: 'P1 · Servicios',          tipo: 'general', plan: 1, caps: ['S'] },
  { email: 'gen_p1_a@qa.dev',   nombre: 'P1 · Arriendos',          tipo: 'general', plan: 1, caps: ['A'] },
  { email: 'gen_p1_ps@qa.dev',  nombre: 'P1 · Prod+Serv',          tipo: 'general', plan: 1, caps: ['P','S'] },
  { email: 'gen_p1_pa@qa.dev',  nombre: 'P1 · Prod+Arr',           tipo: 'general', plan: 1, caps: ['P','A'] },
  { email: 'gen_p1_sa@qa.dev',  nombre: 'P1 · Serv+Arr',           tipo: 'general', plan: 1, caps: ['S','A'] },
  { email: 'gen_p1_psa@qa.dev', nombre: 'P1 · Todos',              tipo: 'general', plan: 1, caps: ['P','S','A'] },
  // General Plan 2 (Normal)
  { email: 'gen_p2_p@qa.dev',   nombre: 'P2 · Productos',          tipo: 'general', plan: 2, caps: ['P'] },
  { email: 'gen_p2_s@qa.dev',   nombre: 'P2 · Servicios',          tipo: 'general', plan: 2, caps: ['S'] },
  { email: 'gen_p2_a@qa.dev',   nombre: 'P2 · Arriendos',          tipo: 'general', plan: 2, caps: ['A'] },
  { email: 'gen_p2_ps@qa.dev',  nombre: 'P2 · Prod+Serv',          tipo: 'general', plan: 2, caps: ['P','S'] },
  { email: 'gen_p2_pa@qa.dev',  nombre: 'P2 · Prod+Arr',           tipo: 'general', plan: 2, caps: ['P','A'] },
  { email: 'gen_p2_sa@qa.dev',  nombre: 'P2 · Serv+Arr',           tipo: 'general', plan: 2, caps: ['S','A'] },
  { email: 'gen_p2_psa@qa.dev', nombre: 'P2 · Todos',              tipo: 'general', plan: 2, caps: ['P','S','A'] },
  // General Plan 3 (Premium)
  { email: 'gen_p3_p@qa.dev',   nombre: 'P3 · Productos',          tipo: 'general', plan: 3, caps: ['P'] },
  { email: 'gen_p3_s@qa.dev',   nombre: 'P3 · Servicios',          tipo: 'general', plan: 3, caps: ['S'] },
  { email: 'gen_p3_a@qa.dev',   nombre: 'P3 · Arriendos',          tipo: 'general', plan: 3, caps: ['A'] },
  { email: 'gen_p3_ps@qa.dev',  nombre: 'P3 · Prod+Serv',          tipo: 'general', plan: 3, caps: ['P','S'] },
  { email: 'gen_p3_pa@qa.dev',  nombre: 'P3 · Prod+Arr',           tipo: 'general', plan: 3, caps: ['P','A'] },
  { email: 'gen_p3_sa@qa.dev',  nombre: 'P3 · Serv+Arr',           tipo: 'general', plan: 3, caps: ['S','A'] },
  { email: 'gen_p3_psa@qa.dev', nombre: 'P3 · Todos',              tipo: 'general', plan: 3, caps: ['P','S','A'] },
  // Turismo
  { email: 'tur_p1@qa.dev',     nombre: 'Turismo Gratis',          tipo: 'turismo', plan: 1, caps: [] },
  { email: 'tur_p3@qa.dev',     nombre: 'Turismo Premium',         tipo: 'turismo', plan: 3, caps: [] },
  { email: 'tur_p3_b@qa.dev',   nombre: 'Turismo Premium 2',       tipo: 'turismo', plan: 3, caps: [] },
  { email: 'tur_p1_b@qa.dev',   nombre: 'Turismo Gratis 2',        tipo: 'turismo', plan: 1, caps: [] },
  { email: 'tur_p3_c@qa.dev',   nombre: 'Turismo Premium 3',       tipo: 'turismo', plan: 3, caps: [] },
  { email: 'tur_p3_d@qa.dev',   nombre: 'Turismo Premium 4',       tipo: 'turismo', plan: 3, caps: [] },
  { email: 'tur_p1_c@qa.dev',   nombre: 'Turismo Gratis 3',        tipo: 'turismo', plan: 1, caps: [] },
  { email: 'tur_p3_e@qa.dev',   nombre: 'Turismo Premium 5',       tipo: 'turismo', plan: 3, caps: [] },
  // Local de barrio (plan 1 = gratis)
  { email: 'local_p1@qa.dev',   nombre: 'Local de Barrio',         tipo: 'local',   plan: 1, caps: [] },
  // Organizador de eventos (plan 1 = gratis)
  { email: 'evento_p1@qa.dev',  nombre: 'Org. de Eventos',         tipo: 'evento',  plan: 1, caps: [] },
]

/** Construye el objeto `user` completo que espera la app a partir de una cuenta QA. */
export function buildQaUser(qa) {
  const idx = QA_USERS.indexOf(qa)
  return {
    id: 9000 + (idx >= 0 ? idx + 1 : 0),
    nombre: qa.nombre,
    email: qa.email,
    rol: 'usuario',
    plan_id: qa.plan,
    tipo_cuenta: qa.tipo,
    vende_productos: qa.caps.includes('P') ? 1 : 0,
    ofrece_servicios: qa.caps.includes('S') ? 1 : 0,
    ofrece_arriendos: qa.caps.includes('A') ? 1 : 0,
    telefono: '+54 9 2972 000000',
    direccion: 'Av. San Martín 100',
    comuna: 'Villarrica',
    created_at: '2026-01-01T00:00:00.000Z',
  }
}

/** Devuelve el `user` mock si email+password coinciden con una cuenta QA, o null. */
export function resolveQaUser(email, password) {
  if (password !== QA_PASSWORD) return null
  const target = String(email || '').trim().toLowerCase()
  const qa = QA_USERS.find(u => u.email === target)
  return qa ? buildQaUser(qa) : null
}

/** Persiste la sesión mock en localStorage tal como la espera ProtectedRoute/App. */
export function loginAsQaUser(user) {
  localStorage.removeItem('token')
  localStorage.setItem('auth_mode', 'real')
  localStorage.setItem('dev_user_id', 'mock-' + user.email)
  localStorage.setItem('user', JSON.stringify(user))
}
