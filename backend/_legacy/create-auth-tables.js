/**
 * Crea las tablas de usuarios, sesiones y actividad.
 * Ejecutar: node create-auth-tables.js
 */
import 'dotenv/config'
import mysql from 'mysql2/promise'

const conn = await mysql.createConnection({
  host:               process.env.DB_HOST,
  port:               Number(process.env.DB_PORT),
  user:               process.env.DB_USER,
  password:           process.env.DB_PASS,
  database:           process.env.DB_NAME,
  multipleStatements: true,
})

console.log(`✅  Conectado → ${process.env.DB_NAME}`)

// ── planes ─────────────────────────────────────────────────────────────────
await conn.query(`
  CREATE TABLE IF NOT EXISTS planes (
    id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
    nombre        VARCHAR(60)  NOT NULL,
    tipo          ENUM('general','turismo') NOT NULL DEFAULT 'general',
    precio_neto   INT UNSIGNED NOT NULL DEFAULT 0,
    max_listings  INT UNSIGNED NOT NULL DEFAULT 5,
    PRIMARY KEY (id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`)
await conn.query(`
  INSERT IGNORE INTO planes (id, nombre, tipo, precio_neto, max_listings) VALUES
    (1, 'Gratuito', 'general',  0,    5),
    (2, 'Normal',   'general',  2990, 25),
    (3, 'Premium',  'general',  4990, 100),
    (4, 'Gratuito', 'turismo',  0,    5),
    (5, 'Premium',  'turismo',  3990, 50);
`)
console.log('✔  planes creada y cargada')

// ── usuarios ───────────────────────────────────────────────────────────────
await conn.query(`
  CREATE TABLE IF NOT EXISTS usuarios (
    id                INT UNSIGNED NOT NULL AUTO_INCREMENT,
    nombre            VARCHAR(120) NOT NULL,
    email             VARCHAR(191) NOT NULL,
    password_hash     VARCHAR(255) NOT NULL,
    rol               ENUM('usuario','programador') NOT NULL DEFAULT 'usuario',
    tipo_cuenta       ENUM('general','turismo')     NOT NULL DEFAULT 'general',
    plan_id           INT UNSIGNED NOT NULL DEFAULT 1,
    vende_productos   TINYINT(1)   NOT NULL DEFAULT 0,
    ofrece_servicios  TINYINT(1)   NOT NULL DEFAULT 0,
    ofrece_arriendos  TINYINT(1)   NOT NULL DEFAULT 0,
    telefono          VARCHAR(30)  NULL,
    direccion         VARCHAR(200) NULL,
    comuna            VARCHAR(80)  NULL DEFAULT 'Villarrica',
    activo            TINYINT(1)   NOT NULL DEFAULT 1,
    created_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_usuarios_email (email),
    KEY idx_usuarios_plan (plan_id),
    KEY idx_usuarios_rol (rol),
    CONSTRAINT fk_usuarios_plan FOREIGN KEY (plan_id) REFERENCES planes (id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`)
console.log('✔  usuarios creada')

// ── sesiones ───────────────────────────────────────────────────────────────
await conn.query(`
  CREATE TABLE IF NOT EXISTS sesiones (
    id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
    usuario_id  INT UNSIGNED NOT NULL,
    token       CHAR(64)     NOT NULL,
    expires_at  DATETIME     NOT NULL,
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_sesiones_token (token),
    KEY idx_sesiones_usuario (usuario_id),
    CONSTRAINT fk_sesiones_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`)
console.log('✔  sesiones creada')

// ── tb_actividad_usuarios ──────────────────────────────────────────────────
await conn.query(`
  CREATE TABLE IF NOT EXISTS tb_actividad_usuarios (
    id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
    usuario_id  INT UNSIGNED NOT NULL,
    accion      VARCHAR(60)  NOT NULL COMMENT 'login | logout | crear_listing | editar_listing | eliminar_listing | crear_tour | editar_tour | eliminar_tour | subir_imagen | editar_negocio | cambiar_plan',
    entidad     VARCHAR(40)  NULL     COMMENT 'listing | tour | negocio | sesion | imagen',
    entidad_id  INT UNSIGNED NULL     COMMENT 'id del registro afectado',
    ip          VARCHAR(45)  NULL,
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_act_usuario (usuario_id),
    KEY idx_act_accion  (accion),
    KEY idx_act_fecha   (created_at),
    CONSTRAINT fk_act_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`)
console.log('✔  tb_actividad_usuarios creada')

// ── FKs pendientes en tb_listings y tb_tours ───────────────────────────────
// Solo agrega si no existe (evita error si ya fue creada antes)
const [[fkListings]] = await conn.query(`
  SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE
  WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'tb_listings' AND CONSTRAINT_NAME = 'fk_listings_usuario'
`, [process.env.DB_NAME])

if (!fkListings) {
  await conn.query(`
    ALTER TABLE tb_listings
      ADD CONSTRAINT fk_listings_usuario
      FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON DELETE CASCADE
  `)
  console.log('✔  FK tb_listings.usuario_id activada')
} else {
  console.log('—  FK tb_listings ya existía, sin cambios')
}

const [[fkTours]] = await conn.query(`
  SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE
  WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'tb_tours' AND CONSTRAINT_NAME = 'fk_tours_usuario'
`, [process.env.DB_NAME])

if (!fkTours) {
  await conn.query(`
    ALTER TABLE tb_tours
      ADD CONSTRAINT fk_tours_usuario
      FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON DELETE CASCADE
  `)
  console.log('✔  FK tb_tours.usuario_id activada')
} else {
  console.log('—  FK tb_tours ya existía, sin cambios')
}

// ── Resumen ────────────────────────────────────────────────────────────────
const [tables] = await conn.query(
  `SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? ORDER BY TABLE_NAME`,
  [process.env.DB_NAME]
)
console.log('\n📋  Todas las tablas en unclik:')
tables.forEach(r => console.log(`   • ${r.TABLE_NAME}`))

await conn.end()
console.log('\n🎉  Listo.')
