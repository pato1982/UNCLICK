-- ============================================================
-- Sanmaaunclick — Schema completo
-- Base de datos: unclik
-- Ejecutar en orden (foreign keys respetadas)
-- ============================================================

CREATE DATABASE IF NOT EXISTS unclik
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE unclik;

-- ── Planes ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS planes (
  id           INT UNSIGNED    PRIMARY KEY,
  nombre       VARCHAR(60)     NOT NULL,
  max_listings SMALLINT        NOT NULL DEFAULT 5,
  descripcion  TEXT
);

INSERT IGNORE INTO planes (id, nombre, max_listings) VALUES
  (1, 'Gratis',           5),
  (2, 'Normal',          20),
  (3, 'Premium General', 50),
  (4, 'Premium Plus',   100),
  (5, 'Premium Turismo', 50);

-- ── Usuarios ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS usuarios (
  id                INT UNSIGNED    NOT NULL AUTO_INCREMENT PRIMARY KEY,
  nombre            VARCHAR(120)    NOT NULL,
  email             VARCHAR(160)    NOT NULL UNIQUE,
  password_hash     VARCHAR(255)    NOT NULL,
  rol               VARCHAR(30)     NOT NULL DEFAULT 'usuario',
  tipo_cuenta       ENUM('general','turismo') NOT NULL DEFAULT 'general',
  plan_id           INT UNSIGNED    NOT NULL DEFAULT 1,
  vende_productos   TINYINT(1)      NOT NULL DEFAULT 0,
  ofrece_servicios  TINYINT(1)      NOT NULL DEFAULT 0,
  ofrece_arriendos  TINYINT(1)      NOT NULL DEFAULT 0,
  dni               VARCHAR(20),
  telefono          VARCHAR(30),
  direccion         VARCHAR(200),
  comuna            VARCHAR(100),
  activo            TINYINT(1)      NOT NULL DEFAULT 1,
  created_at        DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (plan_id) REFERENCES planes(id)
);

-- ── Sesiones ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sesiones (
  token         VARCHAR(64)     PRIMARY KEY,
  usuario_id    INT UNSIGNED    NOT NULL,
  expires_at    DATETIME        NOT NULL,
  created_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- ── Negocios ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS negocios (
  id              INT UNSIGNED  NOT NULL AUTO_INCREMENT PRIMARY KEY,
  usuario_id      INT UNSIGNED  NOT NULL UNIQUE,
  nombre_negocio  VARCHAR(120),
  slogan          VARCHAR(200),
  descripcion     TEXT,
  direccion       VARCHAR(200),
  whatsapp        VARCHAR(30),
  telefono        VARCHAR(30),
  correo          VARCHAR(160),
  facebook        VARCHAR(200),
  instagram       VARCHAR(200),
  horarios        JSON,
  logo_url        VARCHAR(300),
  -- Apariencia (plan 3+)
  header_preset   VARCHAR(40)  DEFAULT 'marca',
  header_color    VARCHAR(20)  DEFAULT '#1e293b',
  header_height   SMALLINT     DEFAULT 180,
  header_bar      VARCHAR(40)  DEFAULT 'solid',
  banner_color    VARCHAR(20)  DEFAULT '#f1f5f9',
  services_color  VARCHAR(20)  DEFAULT '#f8fafc',
  arriendos_color VARCHAR(20)  DEFAULT '#f0fdf4',
  sidebar_style   VARCHAR(40)  DEFAULT 'classic',
  nav_color       VARCHAR(20)  DEFAULT '#ffffff',
  nav_style       VARCHAR(40)  DEFAULT 'default',
  created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- ── Categorías ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tb_categorias (
  id      INT UNSIGNED  NOT NULL AUTO_INCREMENT PRIMARY KEY,
  nombre  VARCHAR(100)  NOT NULL,
  icono   VARCHAR(10),
  tipo    ENUM('producto','servicio','local','turismo','evento') NOT NULL DEFAULT 'producto'
);

-- ── Listings (productos / servicios / arriendos) ─────────────
CREATE TABLE IF NOT EXISTS tb_listings (
  id              INT UNSIGNED  NOT NULL AUTO_INCREMENT PRIMARY KEY,
  usuario_id      INT UNSIGNED  NOT NULL,
  tipo            ENUM('producto','servicio','arriendo') NOT NULL DEFAULT 'producto',
  seccion         VARCHAR(40)   NOT NULL DEFAULT 'destacados',
  nombre          VARCHAR(200)  NOT NULL,
  descripcion     TEXT,
  precio          INT           NOT NULL DEFAULT 0,
  precio_original INT,
  categoria       VARCHAR(100),
  categoria_id    INT UNSIGNED,
  subcategoria    VARCHAR(100),
  subcategoria_id INT UNSIGNED,
  badge           VARCHAR(60),
  genero          VARCHAR(30),
  imagen          VARCHAR(300),
  tallas          JSON,
  medidas         JSON,
  banner_orden    TINYINT,
  created_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- ── Tours (turismo) ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tb_tours (
  id               INT UNSIGNED  NOT NULL AUTO_INCREMENT PRIMARY KEY,
  usuario_id       INT UNSIGNED  NOT NULL,
  nombre           VARCHAR(200)  NOT NULL,
  categoria        VARCHAR(100),
  categoria_id     INT UNSIGNED,
  ubicacion        VARCHAR(200),
  detalle          TEXT,
  precio           INT,
  precio_antes     INT,
  imagen_principal TINYINT       NOT NULL DEFAULT 0,
  imagenes         JSON,
  imagenes_crop    JSON,
  created_at       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- ── Portadas (turismo — galería de presentación) ─────────────
CREATE TABLE IF NOT EXISTS portadas (
  id           INT UNSIGNED  NOT NULL AUTO_INCREMENT PRIMARY KEY,
  usuario_id   INT UNSIGNED  NOT NULL,
  nombre       VARCHAR(200),
  descripcion  TEXT,
  imagenes     JSON,
  imagenes_crop JSON,
  categorias   JSON,
  created_at   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- ── Páginas (turismo — página de presentación) ───────────────
CREATE TABLE IF NOT EXISTS paginas (
  id               INT UNSIGNED  NOT NULL AUTO_INCREMENT PRIMARY KEY,
  usuario_id       INT UNSIGNED  NOT NULL,
  titulo_superior  VARCHAR(200),
  texto_superior   TEXT,
  imagen_superior  VARCHAR(300),
  titulo_inferior  VARCHAR(200),
  texto_inferior   TEXT,
  imagen_inferior  VARCHAR(300),
  crop_superior    JSON,
  crop_inferior    JSON,
  created_at       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- ── Actividad de usuarios ────────────────────────────────────
CREATE TABLE IF NOT EXISTS tb_actividad_usuarios (
  id          INT UNSIGNED  NOT NULL AUTO_INCREMENT PRIMARY KEY,
  usuario_id  INT UNSIGNED  NOT NULL,
  accion      VARCHAR(80)   NOT NULL,
  entidad     VARCHAR(60),
  entidad_id  INT UNSIGNED,
  ip          VARCHAR(45),
  created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- ── Analytics — visitas por negocio ─────────────────────────
CREATE TABLE IF NOT EXISTS tb_analytics_visitas (
  id          INT UNSIGNED  NOT NULL AUTO_INCREMENT PRIMARY KEY,
  usuario_id  INT UNSIGNED  NOT NULL,
  session_id  VARCHAR(64),
  pagina      VARCHAR(80),
  ip          VARCHAR(45),
  created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- ── Analytics — clicks en productos ─────────────────────────
CREATE TABLE IF NOT EXISTS tb_analytics_clicks (
  id          INT UNSIGNED  NOT NULL AUTO_INCREMENT PRIMARY KEY,
  usuario_id  INT UNSIGNED  NOT NULL,
  listing_id  INT UNSIGNED,
  ip          VARCHAR(45),
  event_type  VARCHAR(40),
  created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- ── Visitas al sitio (general) ───────────────────────────────
CREATE TABLE IF NOT EXISTS tb_visitas_sitio (
  id         INT UNSIGNED  NOT NULL AUTO_INCREMENT PRIMARY KEY,
  ip         VARCHAR(45),
  pagina     VARCHAR(80),
  created_at DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
);
