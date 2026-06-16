-- ============================================================
-- UNCLICK — Schema completo (sincronizado con BD real, post-migración 001)
-- Base de datos: unclik · MariaDB 10.4 · InnoDB · utf8mb4_unicode_ci
--
-- FUENTE DE VERDAD: este archivo refleja la estructura REAL de la BD tras
-- aplicar backend/migrations/001_gaps.sql (ver backend/migrations/README.md).
-- Las tablas se crean respetando el orden de las foreign keys.
-- ============================================================

CREATE DATABASE IF NOT EXISTS unclik
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE unclik;

-- ── Planes ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS planes (
  id           INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  nombre       VARCHAR(60)   NOT NULL,
  tipo         ENUM('general','turismo') NOT NULL DEFAULT 'general',
  precio_neto  INT UNSIGNED  NOT NULL DEFAULT 0,
  max_listings INT UNSIGNED  NOT NULL DEFAULT 5,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO planes (id, nombre, tipo, max_listings) VALUES
  (1, 'Gratis',           'general',   5),
  (2, 'Normal',           'general',  20),
  (3, 'Premium General',  'general',  50),
  (4, 'Premium Plus',     'general', 100),
  (5, 'Premium Turismo',  'turismo',  50);

-- ── Usuarios ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS usuarios (
  id                        INT UNSIGNED NOT NULL AUTO_INCREMENT,
  nombre                    VARCHAR(120) NOT NULL,
  email                     VARCHAR(191) NOT NULL,
  password_hash             VARCHAR(255) NOT NULL,
  rol                       ENUM('usuario','programador') NOT NULL DEFAULT 'usuario',
  tipo_cuenta               ENUM('general','turismo')     NOT NULL DEFAULT 'general',
  plan_id                   INT UNSIGNED NOT NULL DEFAULT 1,
  vende_productos           TINYINT(1)   NOT NULL DEFAULT 0,
  ofrece_servicios          TINYINT(1)   NOT NULL DEFAULT 0,
  ofrece_arriendos          TINYINT(1)   NOT NULL DEFAULT 0,
  dni                       VARCHAR(20),
  telefono                  VARCHAR(30),
  direccion                 VARCHAR(200),
  comuna                    VARCHAR(80)  DEFAULT 'Villarrica',
  activo                    TINYINT(1)   NOT NULL DEFAULT 1,
  eliminacion_programada_at DATETIME     NULL,     -- fecha límite del período de gracia (10 días)
  created_at                DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at                DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_usuarios_email (email),
  KEY idx_usuarios_plan (plan_id),
  KEY idx_usuarios_rol (rol),
  KEY idx_usuarios_eliminacion (eliminacion_programada_at),
  CONSTRAINT fk_usuarios_plan FOREIGN KEY (plan_id) REFERENCES planes(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Sesiones ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sesiones (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  usuario_id  INT UNSIGNED NOT NULL,
  token       CHAR(64)     NOT NULL,
  expires_at  DATETIME     NOT NULL,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_sesiones_token (token),
  KEY idx_sesiones_usuario (usuario_id),
  CONSTRAINT fk_sesiones_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Categorías ───────────────────────────────────────────────
-- tipo (VARCHAR): producto | servicio | arriendo | turismo | evento | local
CREATE TABLE IF NOT EXISTS tb_categorias (
  id         INT          NOT NULL AUTO_INCREMENT,
  nombre     VARCHAR(255) NOT NULL,
  tipo       VARCHAR(50)  DEFAULT NULL,
  icono      VARCHAR(255) DEFAULT NULL,
  orden      INT          DEFAULT 0,
  activo     TINYINT(1)   DEFAULT 1,
  created_at TIMESTAMP    NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_tb_categorias_tipo (tipo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Subcategorías ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tb_subcategorias (
  id           INT          NOT NULL AUTO_INCREMENT,
  categoria_id INT          NOT NULL,
  nombre       VARCHAR(255) NOT NULL,
  icono        VARCHAR(255) DEFAULT NULL,
  orden        INT          DEFAULT 0,
  activo       TINYINT(1)   DEFAULT 1,
  created_at   TIMESTAMP    NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_tb_sub_categoria (categoria_id),
  CONSTRAINT fk_subcat_categoria FOREIGN KEY (categoria_id) REFERENCES tb_categorias(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Negocios ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS negocios (
  id              INT          NOT NULL AUTO_INCREMENT,
  usuario_id      INT UNSIGNED NOT NULL,
  nombre_negocio  VARCHAR(120) DEFAULT NULL,
  slogan          VARCHAR(220) DEFAULT NULL,
  descripcion     TEXT         DEFAULT NULL,
  ubicacion       VARCHAR(120) DEFAULT NULL,
  direccion       VARCHAR(220) DEFAULT NULL,
  whatsapp        VARCHAR(30)  DEFAULT NULL,
  telefono        VARCHAR(30)  DEFAULT NULL,
  correo          VARCHAR(100) DEFAULT NULL,
  facebook        VARCHAR(400) DEFAULT NULL,
  instagram       VARCHAR(400) DEFAULT NULL,
  horarios        LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(horarios)),
  logo_url        VARCHAR(500) DEFAULT NULL,
  created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  -- Apariencia (plan 3+)
  header_preset   VARCHAR(30)  DEFAULT 'marca',
  header_color    VARCHAR(7)   DEFAULT '#3B1969',
  header_height   TINYINT      DEFAULT 26,
  header_bar      VARCHAR(20)  DEFAULT 'separada',
  banner_color    VARCHAR(20)  DEFAULT '#1a1220',
  services_color  VARCHAR(20)  DEFAULT '#0f1a2e',
  arriendos_color VARCHAR(20)  DEFAULT '#14241c',
  sidebar_style   VARCHAR(20)  DEFAULT 'izquierda',
  nav_color       VARCHAR(7)   DEFAULT '#4A2070',
  nav_style       VARCHAR(20)  DEFAULT 'borde',
  PRIMARY KEY (id),
  UNIQUE KEY usuario_id (usuario_id),
  CONSTRAINT negocios_ibfk_1 FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Listings (productos / servicios / arriendos) ─────────────
CREATE TABLE IF NOT EXISTS tb_listings (
  id               INT UNSIGNED NOT NULL AUTO_INCREMENT,
  usuario_id       INT UNSIGNED DEFAULT NULL,
  tipo             ENUM('producto','servicio','arriendo') NOT NULL,
  seccion          VARCHAR(60)  DEFAULT NULL,   -- destacados | ofertas | novedades | liquidacion | tecnologia | tendencia | servicios | arriendos
  nombre           VARCHAR(200) NOT NULL,
  descripcion      TEXT         DEFAULT NULL,
  precio           INT UNSIGNED NOT NULL DEFAULT 0,
  precio_original  INT UNSIGNED DEFAULT NULL,
  categoria        VARCHAR(80)  DEFAULT NULL,
  categoria_id     INT UNSIGNED DEFAULT NULL,
  subcategoria     VARCHAR(80)  DEFAULT NULL,
  subcategoria_id  INT UNSIGNED DEFAULT NULL,
  badge            VARCHAR(30)  DEFAULT NULL,
  genero           VARCHAR(20)  DEFAULT NULL,
  -- Imagen principal (cache; la galería completa vive en tb_listing_imagenes)
  imagen           VARCHAR(500) DEFAULT NULL,
  imagen_pos_x     FLOAT        DEFAULT 0,
  imagen_pos_y     FLOAT        DEFAULT 0,
  imagen_scale     FLOAT        DEFAULT 1,
  imagen_natural_w INT          DEFAULT NULL,
  imagen_natural_h INT          DEFAULT NULL,
  -- Banner (plan 3+)
  banner_orden     TINYINT      DEFAULT NULL,
  banner_pos_x     FLOAT        DEFAULT 50,
  banner_pos_y     FLOAT        DEFAULT 50,
  banner_scale     FLOAT        DEFAULT 1,
  -- Atributos JSON legacy (las variantes estructuradas viven en tb_listing_variantes)
  tallas           LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(tallas)),
  medidas          LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(medidas)),
  -- Stock e inventario (NULL = no se controla, p.ej. servicios/arriendos)
  stock            INT          DEFAULT NULL,
  stock_minimo     INT          DEFAULT 0,
  sku              VARCHAR(60)  DEFAULT NULL,
  -- Envío
  peso_gramos      INT          DEFAULT NULL,
  alto_cm          INT          DEFAULT NULL,
  ancho_cm         INT          DEFAULT NULL,
  profundidad_cm   INT          DEFAULT NULL,
  envio_disponible TINYINT(1)   NOT NULL DEFAULT 0,
  retiro_local     TINYINT(1)   NOT NULL DEFAULT 1,
  costo_envio      INT          DEFAULT NULL,  -- NULL = a convenir, 0 = gratis
  activo           TINYINT(1)   NOT NULL DEFAULT 1,
  created_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_listings_usuario (usuario_id),
  KEY idx_listings_tipo (tipo),
  KEY idx_listings_seccion (seccion),
  KEY idx_listings_activo (activo),
  KEY idx_listings_categoria (categoria_id),
  KEY idx_listings_sku (sku),
  CONSTRAINT fk_listings_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Galería de imágenes por listing (1:N) ────────────────────
CREATE TABLE IF NOT EXISTS tb_listing_imagenes (
  id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  listing_id   INT UNSIGNED NOT NULL,
  url          VARCHAR(500) NOT NULL,
  orden        TINYINT      NOT NULL DEFAULT 0,
  es_principal TINYINT(1)   NOT NULL DEFAULT 0,
  pos_x        FLOAT        DEFAULT 0,
  pos_y        FLOAT        DEFAULT 0,
  scale        FLOAT        DEFAULT 1,
  natural_w    INT          DEFAULT NULL,
  natural_h    INT          DEFAULT NULL,
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_listing_img (listing_id, orden),
  CONSTRAINT fk_listing_img_listing FOREIGN KEY (listing_id) REFERENCES tb_listings(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Variantes por listing (talla/color/material, 1:N) ────────
CREATE TABLE IF NOT EXISTS tb_listing_variantes (
  id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  listing_id   INT UNSIGNED NOT NULL,
  tipo         VARCHAR(40)  NOT NULL,   -- talla | color | material | presentacion
  valor        VARCHAR(80)  NOT NULL,   -- "M" | "Rojo" | "500ml"
  sku          VARCHAR(60)  DEFAULT NULL,
  stock        INT          DEFAULT NULL,
  precio_delta INT          NOT NULL DEFAULT 0,  -- +/- sobre el precio base del listing
  orden        TINYINT      NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY idx_listing_var (listing_id),
  CONSTRAINT fk_listing_var_listing FOREIGN KEY (listing_id) REFERENCES tb_listings(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Tours (turismo) ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tb_tours (
  id               INT UNSIGNED NOT NULL AUTO_INCREMENT,
  usuario_id       INT UNSIGNED DEFAULT NULL,
  nombre           VARCHAR(200) NOT NULL,
  categoria        VARCHAR(80)  DEFAULT NULL,
  categoria_id     INT UNSIGNED DEFAULT NULL,
  ubicacion        VARCHAR(200) DEFAULT NULL,
  detalle          TEXT         DEFAULT NULL,
  precio           INT UNSIGNED DEFAULT NULL,  -- NULL = precio a consultar
  precio_antes     INT UNSIGNED DEFAULT NULL,
  imagen_principal TINYINT      NOT NULL DEFAULT 0,  -- índice 0-2 de la imagen principal
  imagenes         LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(imagenes)),
  imagenes_crop    LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(imagenes_crop)),
  activo           TINYINT(1)   NOT NULL DEFAULT 1,
  created_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_tours_usuario (usuario_id),
  KEY idx_tours_categoria (categoria_id),
  KEY idx_tours_activo (activo),
  CONSTRAINT fk_tours_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Portadas (turismo — galería de presentación) ─────────────
CREATE TABLE IF NOT EXISTS portadas (
  id            INT          NOT NULL AUTO_INCREMENT,
  usuario_id    INT UNSIGNED NOT NULL,
  nombre        VARCHAR(120) DEFAULT NULL,
  descripcion   TEXT         DEFAULT NULL,
  imagenes      LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(imagenes)),
  imagenes_crop LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(imagenes_crop)),
  categorias    LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(categorias)),
  activo        TINYINT(1)   NOT NULL DEFAULT 1,
  created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY usuario_id (usuario_id),
  CONSTRAINT portadas_ibfk_1 FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Páginas (turismo — página de presentación) ───────────────
CREATE TABLE IF NOT EXISTS paginas (
  id              INT          NOT NULL AUTO_INCREMENT,
  usuario_id      INT UNSIGNED NOT NULL,
  titulo_superior VARCHAR(200) DEFAULT NULL,
  texto_superior  TEXT         DEFAULT NULL,
  imagen_superior VARCHAR(500) DEFAULT NULL,
  titulo_inferior VARCHAR(200) DEFAULT NULL,
  texto_inferior  TEXT         DEFAULT NULL,
  imagen_inferior VARCHAR(500) DEFAULT NULL,
  crop_superior   LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(crop_superior)),
  crop_inferior   LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(crop_inferior)),
  created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY usuario_id (usuario_id),
  CONSTRAINT paginas_ibfk_1 FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Historial de seguridad (auditoría de cuenta) ─────────────
-- usuario_id NULL-able + ON DELETE SET NULL: la auditoría de 'cuenta_eliminada'
-- debe sobrevivir al borrado del propio usuario.
CREATE TABLE IF NOT EXISTS tb_historial_seguridad (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  usuario_id  INT UNSIGNED NULL,
  accion      VARCHAR(60)  NOT NULL,   -- login_exitoso | login_fallido | cambio_password | cuenta_eliminacion_solicitada | cuenta_eliminada | cuenta_recuperada | logout
  detalle     VARCHAR(255) NULL,
  ip          VARCHAR(45)  NULL,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_hist_seg_usuario (usuario_id, created_at),
  CONSTRAINT fk_hist_seg_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Actividad de usuarios ────────────────────────────────────
CREATE TABLE IF NOT EXISTS tb_actividad_usuarios (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  usuario_id  INT UNSIGNED NOT NULL,
  accion      VARCHAR(60)  NOT NULL,
  entidad     VARCHAR(40)  DEFAULT NULL,
  entidad_id  INT UNSIGNED DEFAULT NULL,
  ip          VARCHAR(45)  DEFAULT NULL,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_act_usuario (usuario_id),
  KEY idx_act_accion (accion),
  KEY idx_act_fecha (created_at),
  CONSTRAINT fk_act_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Analytics — visitas por negocio ─────────────────────────
CREATE TABLE IF NOT EXISTS tb_analytics_visitas (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  usuario_id  INT UNSIGNED NOT NULL,
  session_id  VARCHAR(64)  DEFAULT NULL,
  pagina      VARCHAR(80)  DEFAULT NULL,
  ip          VARCHAR(45)  DEFAULT NULL,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY usuario_id (usuario_id),
  CONSTRAINT tb_analytics_visitas_ibfk_1 FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Analytics — clicks en productos ─────────────────────────
CREATE TABLE IF NOT EXISTS tb_analytics_clicks (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  usuario_id  INT UNSIGNED NOT NULL,
  listing_id  INT UNSIGNED DEFAULT NULL,
  ip          VARCHAR(45)  DEFAULT NULL,
  event_type  VARCHAR(40)  DEFAULT NULL,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY usuario_id (usuario_id),
  CONSTRAINT tb_analytics_clicks_ibfk_1 FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Visitas al sitio (general) ───────────────────────────────
CREATE TABLE IF NOT EXISTS tb_visitas_sitio (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  ip         VARCHAR(45)  NOT NULL DEFAULT '',
  pagina     VARCHAR(40)  NOT NULL DEFAULT 'home',
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_fecha (created_at),
  KEY idx_ip (ip)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ── Eventos (cartelera de la comuna) ─────────────────────────
CREATE TABLE IF NOT EXISTS tb_eventos (
  id                  INT UNSIGNED NOT NULL AUTO_INCREMENT,
  titulo              VARCHAR(200) NOT NULL,
  fecha               VARCHAR(80)  DEFAULT NULL,  -- texto libre: "15 - 17 Mar 2026"
  ubicacion           VARCHAR(200) DEFAULT NULL,
  precio              VARCHAR(60)  DEFAULT NULL,  -- texto libre: "$5.000 o Gratis"
  categoria_evento_id INT UNSIGNED DEFAULT NULL,  -- FK lógica tb_categorias tipo=evento
  imagen              VARCHAR(500) DEFAULT NULL,
  imagen_crop         LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(imagen_crop)),
  activo              TINYINT(1)   NOT NULL DEFAULT 1,
  created_at          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_eventos_categoria (categoria_evento_id),
  KEY idx_eventos_activo (activo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Locales (directorio de barrio) ───────────────────────────
CREATE TABLE IF NOT EXISTS tb_locales (
  id                  INT UNSIGNED NOT NULL AUTO_INCREMENT,
  nombre              VARCHAR(200) NOT NULL,
  direccion           VARCHAR(200) DEFAULT NULL,
  categoria_barrio_id INT UNSIGNED DEFAULT NULL,  -- FK lógica tb_categorias tipo=local
  imagen              VARCHAR(500) DEFAULT NULL,
  imagen_crop         LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(imagen_crop)),
  activo              TINYINT(1)   NOT NULL DEFAULT 1,
  created_at          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_locales_categoria (categoria_barrio_id),
  KEY idx_locales_activo (activo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
