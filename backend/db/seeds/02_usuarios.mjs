/**
 * Cuentas de prueba para desarrollo local.
 *
 * Cubre TODAS las combinaciones que la app distingue, para poder ejercitar
 * cada panel y cada gate de permisos sin tener que crear usuarios a mano:
 *   - rol:         usuario | programador
 *   - tipo_cuenta: general | turismo | local | evento
 *   - plan_id:     1..5
 *   - capacidades: vende_productos / ofrece_servicios / ofrece_arriendos
 *
 * IDs explícitos en el rango 9000+ para no chocar nunca con datos reales
 * y para que borrarlos sea trivial (`DELETE FROM usuarios WHERE id >= 9000`).
 *
 * Idempotente: borra por email/id y reinserta. El borrado cascadea a
 * negocios/listings/etc., y el seed de contenido corre después.
 */
import bcrypt from 'bcrypt'

export const QA_PASSWORD = 'Dev1234!'

// Debe coincidir con SALT_ROUNDS de backend/routes/auth.js. bcrypt.compare
// funciona entre costos distintos, pero mantenerlo igual evita que el seed
// enmascare un problema de rendimiento del hash real.
const SALT_ROUNDS = 12

const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

/** Horario comercial típico, en el formato que espera AdminNegocio.jsx. */
export const horariosStd = DIAS.map((dia, i) => ({
  dia,
  activo: i < 6,
  apertura: i === 5 ? '10:00' : '09:00',
  cierre: i === 5 ? '14:00' : '19:00',
  dosTramos: false,
  apertura2: '15:00',
  cierre2: '19:00',
}))

const NEGOCIOS = [
  'Almacén Villarrica', 'Rincón del Volcán', 'Tienda Kalfulikan', 'Estilo Araucanía',
  'Cumbre Outdoor', 'Bazar del Lago', 'Nieve y Bosque', 'Aire Libre Villarrica',
  'Refugio Pucón', 'Sendero Sur', 'Quila Diseño', 'Pehuén Hogar',
  'Villarrica Sport', 'Maitén Deco', 'Lago Azul Store', 'Feria Pucará',
  'Ruta Lacustre', 'Bosque Nativo', 'Araucanía Express', 'Volcán Tienda',
  'Trafún Provisiones', 'Ñielol Market',
]

const NEGOCIOS_TURISMO = [
  'Villarrica Aventura', 'Licanray Expediciones', 'Rucapillán Outdoor', 'Andes Trekking Sur',
  'Trancura Rafting', 'Pucón Tours', 'Kayak Lago Villarrica', 'Araucanía Bike',
]

const SLOGANS = [
  'Lo mejor de La Araucanía, a un click',
  'Calidad y calidez del sur de Chile',
  'Tu tienda local de confianza',
  'Productos pensados para la montaña',
  'Aventura, hogar y estilo',
  'Hecho con identidad del sur',
]

/**
 * Catálogo de cuentas. `caps` son las capacidades comerciales:
 * P = vende productos, S = ofrece servicios, A = ofrece arriendos.
 */
export const QA_USERS = [
  // Programador: único rol que ve /admin/programador/*, /monitor y /servidor/stats.
  { id: 9000, email: 'admin@qa.dev', nombre: 'Admin Programador', rol: 'programador', tipo: 'general', plan: 4, caps: ['P', 'S', 'A'] },

  // General — las 7 combinaciones de capacidades × 3 planes.
  { id: 9001, email: 'gen_p1_p@qa.dev',   nombre: 'P1 · Productos', tipo: 'general', plan: 1, caps: ['P'] },
  { id: 9002, email: 'gen_p1_s@qa.dev',   nombre: 'P1 · Servicios', tipo: 'general', plan: 1, caps: ['S'] },
  { id: 9003, email: 'gen_p1_a@qa.dev',   nombre: 'P1 · Arriendos', tipo: 'general', plan: 1, caps: ['A'] },
  { id: 9004, email: 'gen_p1_ps@qa.dev',  nombre: 'P1 · Prod+Serv', tipo: 'general', plan: 1, caps: ['P', 'S'] },
  { id: 9005, email: 'gen_p1_pa@qa.dev',  nombre: 'P1 · Prod+Arr',  tipo: 'general', plan: 1, caps: ['P', 'A'] },
  { id: 9006, email: 'gen_p1_sa@qa.dev',  nombre: 'P1 · Serv+Arr',  tipo: 'general', plan: 1, caps: ['S', 'A'] },
  { id: 9007, email: 'gen_p1_psa@qa.dev', nombre: 'P1 · Todos',     tipo: 'general', plan: 1, caps: ['P', 'S', 'A'] },
  { id: 9008, email: 'gen_p2_p@qa.dev',   nombre: 'P2 · Productos', tipo: 'general', plan: 2, caps: ['P'] },
  { id: 9009, email: 'gen_p2_s@qa.dev',   nombre: 'P2 · Servicios', tipo: 'general', plan: 2, caps: ['S'] },
  { id: 9010, email: 'gen_p2_a@qa.dev',   nombre: 'P2 · Arriendos', tipo: 'general', plan: 2, caps: ['A'] },
  { id: 9011, email: 'gen_p2_ps@qa.dev',  nombre: 'P2 · Prod+Serv', tipo: 'general', plan: 2, caps: ['P', 'S'] },
  { id: 9012, email: 'gen_p2_pa@qa.dev',  nombre: 'P2 · Prod+Arr',  tipo: 'general', plan: 2, caps: ['P', 'A'] },
  { id: 9013, email: 'gen_p2_sa@qa.dev',  nombre: 'P2 · Serv+Arr',  tipo: 'general', plan: 2, caps: ['S', 'A'] },
  { id: 9014, email: 'gen_p2_psa@qa.dev', nombre: 'P2 · Todos',     tipo: 'general', plan: 2, caps: ['P', 'S', 'A'] },
  // Plan 3+ desbloquea Banner, Apariencia y Estadísticas.
  { id: 9015, email: 'gen_p3_p@qa.dev',   nombre: 'P3 · Productos', tipo: 'general', plan: 3, caps: ['P'] },
  { id: 9016, email: 'gen_p3_s@qa.dev',   nombre: 'P3 · Servicios', tipo: 'general', plan: 3, caps: ['S'] },
  { id: 9017, email: 'gen_p3_a@qa.dev',   nombre: 'P3 · Arriendos', tipo: 'general', plan: 3, caps: ['A'] },
  { id: 9018, email: 'gen_p3_ps@qa.dev',  nombre: 'P3 · Prod+Serv', tipo: 'general', plan: 3, caps: ['P', 'S'] },
  { id: 9019, email: 'gen_p3_pa@qa.dev',  nombre: 'P3 · Prod+Arr',  tipo: 'general', plan: 3, caps: ['P', 'A'] },
  { id: 9020, email: 'gen_p3_sa@qa.dev',  nombre: 'P3 · Serv+Arr',  tipo: 'general', plan: 3, caps: ['S', 'A'] },
  { id: 9021, email: 'gen_p3_psa@qa.dev', nombre: 'P3 · Todos',     tipo: 'general', plan: 3, caps: ['P', 'S', 'A'] },
  // Plan 4 (Premium Plus): es el plan que auth.js asigna por defecto a las
  // cuentas de turismo al registrarse, pero antes ningún seed lo ejercitaba.
  { id: 9022, email: 'gen_p4@qa.dev', nombre: 'P4 · Premium Plus', tipo: 'general', plan: 4, caps: ['P', 'S', 'A'] },

  // Turismo — plan 5 desbloquea Página propia, Tours y Estadísticas.
  { id: 9023, email: 'tur_p1@qa.dev',   nombre: 'Turismo Gratis',    tipo: 'turismo', plan: 1, caps: [] },
  { id: 9024, email: 'tur_p1_b@qa.dev', nombre: 'Turismo Gratis 2',  tipo: 'turismo', plan: 1, caps: [] },
  { id: 9025, email: 'tur_p1_c@qa.dev', nombre: 'Turismo Gratis 3',  tipo: 'turismo', plan: 1, caps: [] },
  { id: 9026, email: 'tur_p3@qa.dev',   nombre: 'Turismo Premium',   tipo: 'turismo', plan: 5, caps: [] },
  { id: 9027, email: 'tur_p3_b@qa.dev', nombre: 'Turismo Premium 2', tipo: 'turismo', plan: 5, caps: [] },
  { id: 9028, email: 'tur_p3_c@qa.dev', nombre: 'Turismo Premium 3', tipo: 'turismo', plan: 5, caps: [] },
  { id: 9029, email: 'tur_p3_d@qa.dev', nombre: 'Turismo Premium 4', tipo: 'turismo', plan: 5, caps: [] },
  { id: 9030, email: 'tur_p3_e@qa.dev', nombre: 'Turismo Premium 5', tipo: 'turismo', plan: 5, caps: [] },

  // Tipos de cuenta que la migración 003 recién habilitó: antes el enum los
  // rechazaba y sus paneles (/admin/mi-local, /admin/mis-eventos) eran
  // inalcanzables.
  { id: 9100, email: 'local_p1@qa.dev',  nombre: 'Almacén Don Pedro',  tipo: 'local',  plan: 1, caps: [] },
  { id: 9101, email: 'evento_p1@qa.dev', nombre: 'Eventos Araucanía',  tipo: 'evento', plan: 1, caps: [] },
]

const tel = (i) => '+56 9 ' + String(60000000 + i * 111111).slice(0, 8)

export async function seedUsuarios(conn) {
  const hash = await bcrypt.hash(QA_PASSWORD, SALT_ROUNDS)

  // Limpieza previa: por email (puede existir con otro id) y por rango de id.
  const emails = QA_USERS.map((u) => u.email)
  await conn.query(`DELETE FROM usuarios WHERE email IN (${emails.map(() => '?').join(',')})`, emails)
  await conn.query('DELETE FROM usuarios WHERE id >= 9000')

  const turismo = QA_USERS.filter((u) => u.tipo === 'turismo')

  for (let i = 0; i < QA_USERS.length; i++) {
    const u = QA_USERS[i]
    const nombreNegocio =
      u.tipo === 'turismo'
        ? NEGOCIOS_TURISMO[turismo.indexOf(u) % NEGOCIOS_TURISMO.length]
        : NEGOCIOS[i % NEGOCIOS.length]

    await conn.query(
      `INSERT INTO usuarios
         (id, nombre, email, password_hash, rol, tipo_cuenta, plan_id,
          vende_productos, ofrece_servicios, ofrece_arriendos,
          telefono, direccion, comuna, activo)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [
        u.id,
        u.nombre,
        u.email,
        hash,
        u.rol || 'usuario',
        u.tipo,
        u.plan,
        u.caps.includes('P') ? 1 : 0,
        u.caps.includes('S') ? 1 : 0,
        u.caps.includes('A') ? 1 : 0,
        tel(i),
        'Av. Pedro de Valdivia ' + (100 + i * 25),
        'Villarrica',
      ]
    )

    await conn.query(
      `INSERT INTO negocios
         (usuario_id, nombre_negocio, slogan, descripcion, direccion,
          whatsapp, telefono, correo, facebook, instagram, horarios,
          header_preset, header_color, logo_size)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 3)`,
      [
        u.id,
        nombreNegocio,
        SLOGANS[i % SLOGANS.length],
        `Bienvenido a ${nombreNegocio}. Somos un negocio local de Villarrica, en la Región de La Araucanía, con productos y servicios de calidad.`,
        `Av. Pedro de Valdivia ${100 + i * 25}, Villarrica`,
        tel(i),
        tel(i),
        `contacto@${u.email.split('@')[0]}.cl`,
        `fb.com/${u.email.split('@')[0]}`,
        `instagram.com/${u.email.split('@')[0]}`,
        JSON.stringify(horariosStd),
        ['marca', 'foto', 'degradado', 'oscuro'][i % 4],
        ['#1e293b', '#0E7490', '#3B1969', '#B45309', '#1E3A8A', '#BE123C'][i % 6],
      ]
    )
  }

  console.log(`   ✓ usuarios (${QA_USERS.length}) + negocios — password: ${QA_PASSWORD}`)
}
