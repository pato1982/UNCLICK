/**
 * Crea la base de datos `unclik` y todas las tablas necesarias.
 * Ejecutar una sola vez: node setup-db.js
 */
import 'dotenv/config'
import mysql from 'mysql2/promise'

const conn = await mysql.createConnection({
  host:     process.env.DB_HOST,
  port:     Number(process.env.DB_PORT),
  user:     process.env.DB_USER,
  password: process.env.DB_PASS,
  multipleStatements: true,
})

console.log('✅  Conectado a MySQL')

await conn.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`)
await conn.query(`USE \`${process.env.DB_NAME}\``)
console.log(`📦  Usando base de datos: ${process.env.DB_NAME}`)

const schema = `
-- ─────────────────────────────────────────────
--  PLANES
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS planes (
  id            INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  nombre        VARCHAR(60)     NOT NULL,
  tipo          ENUM('general','turismo') NOT NULL DEFAULT 'general',
  precio_neto   INT UNSIGNED    NOT NULL DEFAULT 0,
  max_listings  INT UNSIGNED    NOT NULL DEFAULT 5,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO planes (id, nombre, tipo, precio_neto, max_listings) VALUES
  (1, 'Gratuito', 'general',  0,     5),
  (2, 'Normal',   'general',  2990,  25),
  (3, 'Premium',  'general',  4990,  100),
  (4, 'Gratuito', 'turismo',  0,     5),
  (5, 'Premium',  'turismo',  3990,  50);

-- ─────────────────────────────────────────────
--  USUARIOS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS usuarios (
  id                  INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  nombre              VARCHAR(120)    NOT NULL,
  email               VARCHAR(191)    NOT NULL,
  password_hash       VARCHAR(255)    NOT NULL,
  rol                 ENUM('usuario','admin') NOT NULL DEFAULT 'usuario',
  plan_id             INT UNSIGNED    NOT NULL DEFAULT 1,
  tipo_cuenta         ENUM('general','turismo') NOT NULL DEFAULT 'general',
  vende_productos     TINYINT(1)      NOT NULL DEFAULT 0,
  ofrece_servicios    TINYINT(1)      NOT NULL DEFAULT 0,
  ofrece_arriendos    TINYINT(1)      NOT NULL DEFAULT 0,
  telefono            VARCHAR(30)     NULL,
  direccion           VARCHAR(200)    NULL,
  comuna              VARCHAR(80)     NULL DEFAULT 'Villarrica',
  activo              TINYINT(1)      NOT NULL DEFAULT 1,
  created_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_usuarios_email (email),
  KEY idx_usuarios_plan (plan_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────
--  SESIONES (tokens de autenticación)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sesiones (
  id          INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  user_id     INT UNSIGNED    NOT NULL,
  token       VARCHAR(255)    NOT NULL,
  expires_at  DATETIME        NOT NULL,
  created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_sesiones_token (token),
  KEY idx_sesiones_user (user_id),
  CONSTRAINT fk_sesiones_user FOREIGN KEY (user_id) REFERENCES usuarios (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────
--  HISTORIAL DE SEGURIDAD
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tb_historial_seguridad (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  usuario_id  INT UNSIGNED NULL,
  accion      ENUM('reset_solicitado','reset_password','cambio_password','login_fallido','login_exitoso','logout','sesion_expirada') NOT NULL,
  detalle     VARCHAR(255) NULL,
  ip          VARCHAR(45)  NULL,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_seg_usuario (usuario_id),
  KEY idx_seg_accion  (accion),
  KEY idx_seg_created (created_at),
  CONSTRAINT fk_seg_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────
--  TOKENS DE RECUPERACIÓN DE CONTRASEÑA
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tb_password_reset_tokens (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  usuario_id  INT UNSIGNED NOT NULL,
  token       VARCHAR(64)  NOT NULL,
  expires_at  DATETIME     NOT NULL,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_reset_token (token),
  KEY idx_reset_usuario (usuario_id),
  CONSTRAINT fk_reset_usuario FOREIGN KEY (usuario_id)
    REFERENCES usuarios (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────
--  NEGOCIOS (perfil de empresa — cuenta general)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS negocios (
  id               INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  usuario_id       INT UNSIGNED    NOT NULL,
  nombre_negocio   VARCHAR(150)    NOT NULL DEFAULT '',
  slogan           VARCHAR(255)    NULL,
  descripcion      TEXT            NULL,
  ubicacion        VARCHAR(120)    NULL,
  direccion        VARCHAR(200)    NULL,
  whatsapp         VARCHAR(30)     NULL,
  telefono         VARCHAR(30)     NULL,
  correo           VARCHAR(191)    NULL,
  facebook         VARCHAR(255)    NULL,
  instagram        VARCHAR(100)    NULL,
  horarios         JSON            NULL COMMENT 'Array de {dia,activo,apertura,cierre}',
  logo_url         VARCHAR(500)    NULL,
  header_preset    VARCHAR(60)     NULL,
  header_color     VARCHAR(20)     NULL DEFAULT '#3B1969',
  header_height    INT             NULL DEFAULT 22,
  header_bar       ENUM('integrada','separada') NULL DEFAULT 'separada',
  banner_color     VARCHAR(30)     NULL DEFAULT '#1a1220',
  services_color   VARCHAR(30)     NULL DEFAULT '#0f1a2e',
  arriendos_color  VARCHAR(30)     NULL DEFAULT '#14241c',
  sidebar_color    VARCHAR(20)     NULL DEFAULT '#3B1969',
  sidebar_accent   VARCHAR(20)     NULL DEFAULT '#E5B800',
  sidebar_style    ENUM('izquierda','derecha','modal') NULL DEFAULT 'izquierda',
  nav_color        VARCHAR(20)     NULL DEFAULT '#2C134F',
  nav_style        ENUM('borde','solido','degradado') NULL DEFAULT 'borde',
  created_at       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_negocios_usuario (usuario_id),
  CONSTRAINT fk_negocios_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────
--  LISTINGS (productos / servicios / arriendos)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS listings (
  id               INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  user_id          INT UNSIGNED    NOT NULL,
  tipo             ENUM('producto','servicio','arriendo') NOT NULL,
  nombre           VARCHAR(200)    NOT NULL,
  descripcion      TEXT            NULL,
  precio           INT UNSIGNED    NOT NULL DEFAULT 0,
  precio_original  INT UNSIGNED    NULL,
  imagen           VARCHAR(500)    NULL,
  badge            VARCHAR(30)     NULL,
  seccion          VARCHAR(60)     NULL,
  categoria        VARCHAR(80)     NULL,
  categoria_id     INT UNSIGNED    NULL,
  subcategoria     VARCHAR(80)     NULL,
  subcategoria_id  INT UNSIGNED    NULL,
  banner_orden     TINYINT         NULL,
  banner_pos_x     FLOAT           NULL DEFAULT 50,
  banner_pos_y     FLOAT           NULL DEFAULT 50,
  banner_scale     FLOAT           NULL DEFAULT 1,
  genero           VARCHAR(20)     NULL,
  tallas           JSON            NULL,
  medidas          JSON            NULL,
  activo           TINYINT(1)      NOT NULL DEFAULT 1,
  created_at       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_listings_user (user_id),
  KEY idx_listings_tipo (tipo),
  KEY idx_listings_activo (activo),
  CONSTRAINT fk_listings_user FOREIGN KEY (user_id) REFERENCES usuarios (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────
--  TURISMO — Negocio turístico
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS turismo_negocios (
  id          INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  user_id     INT UNSIGNED    NOT NULL,
  nombre      VARCHAR(150)    NOT NULL DEFAULT '',
  descripcion TEXT            NULL,
  direccion   VARCHAR(200)    NULL,
  ubicacion   VARCHAR(80)     NULL DEFAULT 'Villarrica',
  whatsapp    VARCHAR(30)     NULL,
  telefono    VARCHAR(30)     NULL,
  correo      VARCHAR(191)    NULL,
  facebook    VARCHAR(255)    NULL,
  instagram   VARCHAR(100)    NULL,
  horarios    JSON            NULL,
  created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_tur_negocios_user (user_id),
  CONSTRAINT fk_tur_neg_user FOREIGN KEY (user_id) REFERENCES usuarios (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────
--  TURISMO — Tours
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tours (
  id               INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  user_id          INT UNSIGNED    NOT NULL,
  nombre           VARCHAR(200)    NOT NULL,
  categoria        VARCHAR(80)     NULL,
  ubicacion        VARCHAR(80)     NULL DEFAULT 'Villarrica',
  detalle          TEXT            NULL,
  precio           INT UNSIGNED    NOT NULL DEFAULT 0,
  precio_antes     INT UNSIGNED    NULL,
  imagen_principal TINYINT         NOT NULL DEFAULT 0,
  imagenes         JSON            NULL COMMENT 'Array de URLs',
  imagenes_crop    JSON            NULL COMMENT 'Array de {zoom,x,y}',
  activo           TINYINT(1)      NOT NULL DEFAULT 1,
  created_at       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_tours_user (user_id),
  KEY idx_tours_activo (activo),
  CONSTRAINT fk_tours_user FOREIGN KEY (user_id) REFERENCES usuarios (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────
--  TURISMO — Portadas (listado público de empresas turísticas)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS portadas (
  id               INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  user_id          INT UNSIGNED    NOT NULL,
  nombre_negocio   VARCHAR(150)    NOT NULL DEFAULT '',
  descripcion      TEXT            NULL,
  imagenes         JSON            NULL,
  imagenes_crop    JSON            NULL,
  categorias       JSON            NULL COMMENT 'Array de strings',
  direccion        VARCHAR(200)    NULL,
  horarios         JSON            NULL,
  telefono         VARCHAR(30)     NULL,
  whatsapp         VARCHAR(30)     NULL,
  correo           VARCHAR(191)    NULL,
  facebook         VARCHAR(255)    NULL,
  instagram        VARCHAR(100)    NULL,
  created_at       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_portadas_user (user_id),
  CONSTRAINT fk_portadas_user FOREIGN KEY (user_id) REFERENCES usuarios (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────
--  TURISMO — Páginas premium
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS paginas (
  id               INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  user_id          INT UNSIGNED    NOT NULL,
  titulo_superior  VARCHAR(200)    NULL,
  texto_superior   TEXT            NULL,
  imagen_superior  VARCHAR(500)    NULL,
  crop_superior    JSON            NULL,
  titulo_inferior  VARCHAR(200)    NULL,
  texto_inferior   TEXT            NULL,
  imagen_inferior  VARCHAR(500)    NULL,
  crop_inferior    JSON            NULL,
  created_at       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_paginas_user (user_id),
  CONSTRAINT fk_paginas_user FOREIGN KEY (user_id) REFERENCES usuarios (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────
--  ANALYTICS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS analytics_eventos (
  id           INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  owner_id     INT UNSIGNED    NULL COMMENT 'user_id del dueño del negocio',
  event_type   VARCHAR(60)     NOT NULL,
  source_page  VARCHAR(120)    NULL,
  meta         JSON            NULL,
  created_at   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_anal_owner (owner_id),
  KEY idx_anal_type (event_type),
  KEY idx_anal_date (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────
--  HISTORIAL DE PLANES
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS historial_planes (
  id          INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  user_id     INT UNSIGNED    NOT NULL,
  accion      ENUM('pago','cambio_plan','cancelacion') NOT NULL,
  detalles    JSON            NULL,
  created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_hist_user (user_id),
  CONSTRAINT fk_hist_user FOREIGN KEY (user_id) REFERENCES usuarios (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`

await conn.query(schema)
console.log('✅  Tablas creadas / verificadas:')
const [tables] = await conn.query('SHOW TABLES')
tables.forEach(row => console.log('   •', Object.values(row)[0]))

await conn.end()
console.log('\n🎉  Setup completado. Ya podés iniciar el backend con: npm run dev')
