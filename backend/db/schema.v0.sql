-- ============================================================
-- UNCLICK — Esquema Canónico v0 (baseline)
-- ============================================================
-- Fecha baseline : 2026-06-16
-- Origen         : generado desde unclick_stage (VPS Villarrica)
--                  mysqldump --no-data de la BD real del entorno stage
-- Motor          : MySQL 8.0 · InnoDB · utf8mb4_unicode_ci (predeterminado)
--                  Dos tablas de catálogo usan utf8mb4_0900_ai_ci (detalle abajo)
-- ============================================================
-- FUENTE DE VERDAD ÚNICA
--   Este archivo consolida y reemplaza:
--     · backend/schema.sql               (20 tablas, incompleto / desactualizado)
--     · backend/migrate-fase1-locales-eventos.mjs  (tb_categorias_locales,
--                                         tb_categorias_eventos + columnas
--                                         imagen_2/imagen_3/usuario_id en
--                                         tb_locales y tb_eventos)
--     · backend/migrate-logo-size.mjs    (logo_size en negocios — pendiente
--                                         de aplicar en stage, ver nota abajo)
--   Esos archivos quedan como referencia histórica; la estructura
--   definitiva es la que describe este documento.
-- ============================================================
-- IDEMPOTENCIA
--   Usar CREATE TABLE IF NOT EXISTS + INSERT ... ON DUPLICATE KEY UPDATE.
--   Se puede correr sobre una BD vacía o sobre la existente sin romper nada.
--   NOTA: para aplicar en stage/prod ejecutar como usuario con SUPER o
--   con SET FOREIGN_KEY_CHECKS=0 durante la carga inicial en BD vacía.
-- ============================================================
-- ESTADO DE SINCRONIZACIÓN CONOCIDO
--   stage → v0  (esta es la fuente)
--   prod  → pendiente; tiene ~20 tablas, le faltan:
--             tb_categorias_locales, tb_categorias_eventos
--           y las columnas nuevas de tb_locales / tb_eventos.
-- ============================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = 'NO_AUTO_VALUE_ON_ZERO';


-- ────────────────────────────────────────────────────────────
-- 1. PLANES
--    Sin dependencias. Tabla de lookup; usuarios la referencia.
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `planes` (
  `id`           int unsigned NOT NULL AUTO_INCREMENT,
  `nombre`       varchar(60)  NOT NULL,
  `tipo`         enum('general','turismo') NOT NULL DEFAULT 'general',
  `precio_neto`  int unsigned NOT NULL DEFAULT '0',
  `max_listings` int unsigned NOT NULL DEFAULT '5',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ────────────────────────────────────────────────────────────
-- 2. USUARIOS
--    Depende de: planes
--    FK lógica (no enforced): negocios, sesiones, historial, etc.
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `usuarios` (
  `id`                        int unsigned NOT NULL AUTO_INCREMENT,
  `nombre`                    varchar(120) NOT NULL,
  `email`                     varchar(191) NOT NULL,
  `password_hash`             varchar(255) NOT NULL,
  `rol`                       enum('usuario','programador') NOT NULL DEFAULT 'usuario',
  `tipo_cuenta`               enum('general','turismo')     NOT NULL DEFAULT 'general',
  `plan_id`                   int unsigned NOT NULL DEFAULT '1',
  `vende_productos`           tinyint(1)   NOT NULL DEFAULT '0',
  `ofrece_servicios`          tinyint(1)   NOT NULL DEFAULT '0',
  `ofrece_arriendos`          tinyint(1)   NOT NULL DEFAULT '0',
  `dni`                       varchar(20)  DEFAULT NULL,
  `telefono`                  varchar(30)  DEFAULT NULL,
  `direccion`                 varchar(200) DEFAULT NULL,
  `comuna`                    varchar(80)  DEFAULT 'Villarrica',
  `activo`                    tinyint(1)   NOT NULL DEFAULT '1',
  `eliminacion_programada_at` datetime     DEFAULT NULL,  -- fecha límite del período de gracia (10 días)
  `created_at`                datetime     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`                datetime     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `login_intentos`            tinyint unsigned NOT NULL DEFAULT '0',
  `login_bloqueado_hasta`     datetime     DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_usuarios_email`       (`email`),
  KEY        `idx_usuarios_plan`       (`plan_id`),
  KEY        `idx_usuarios_rol`        (`rol`),
  KEY        `idx_usuarios_eliminacion`(`eliminacion_programada_at`),
  CONSTRAINT `fk_usuarios_plan` FOREIGN KEY (`plan_id`) REFERENCES `planes` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ────────────────────────────────────────────────────────────
-- 3. SESIONES
--    Depende de: usuarios
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `sesiones` (
  `id`         int unsigned NOT NULL AUTO_INCREMENT,
  `usuario_id` int unsigned NOT NULL,
  `token`      char(64)     NOT NULL,
  `expires_at` datetime     NOT NULL,
  `created_at` datetime     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_sesiones_token`   (`token`),
  KEY        `idx_sesiones_usuario`(`usuario_id`),
  CONSTRAINT `fk_sesiones_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ────────────────────────────────────────────────────────────
-- 4. TB_CATEGORIAS
--    Catálogo de categorías para listings/tours.
--    tipo: 'producto' | 'servicio' | 'arriendo' | 'turismo' | 'evento' | 'local'
--    Sin dependencias de FK.
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `tb_categorias` (
  `id`         int          NOT NULL AUTO_INCREMENT,
  `nombre`     varchar(255) NOT NULL,
  `tipo`       varchar(50)  DEFAULT NULL,
  `icono`      varchar(255) DEFAULT NULL,
  `orden`      int          DEFAULT '0',
  `activo`     tinyint(1)   DEFAULT '1',
  `created_at` timestamp    NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_tb_categorias_tipo` (`tipo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ────────────────────────────────────────────────────────────
-- 5. TB_SUBCATEGORIAS
--    Depende de: tb_categorias
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `tb_subcategorias` (
  `id`           int          NOT NULL AUTO_INCREMENT,
  `categoria_id` int          NOT NULL,
  `nombre`       varchar(255) NOT NULL,
  `icono`        varchar(255) DEFAULT NULL,
  `orden`        int          DEFAULT '0',
  `activo`       tinyint(1)   DEFAULT '1',
  `created_at`   timestamp    NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY        `idx_tb_sub_categoria`(`categoria_id`),
  CONSTRAINT `fk_subcat_categoria` FOREIGN KEY (`categoria_id`) REFERENCES `tb_categorias` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ────────────────────────────────────────────────────────────
-- 6. TB_CATEGORIAS_LOCALES
--    Catálogo de tipos de local (directorio de barrio).
--    Creada por migrate-fase1-locales-eventos.mjs.
--    Colación utf8mb4_0900_ai_ci (tal como existe en stage).
--    Sin dependencias de FK.
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `tb_categorias_locales` (
  `id`     int          NOT NULL AUTO_INCREMENT,
  `nombre` varchar(120) NOT NULL,
  `icono`  varchar(80)  NOT NULL DEFAULT 'storefront',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- ────────────────────────────────────────────────────────────
-- 7. TB_CATEGORIAS_EVENTOS
--    Catálogo de tipos de evento (cartelera municipal).
--    Creada por migrate-fase1-locales-eventos.mjs.
--    Colación utf8mb4_0900_ai_ci (tal como existe en stage).
--    Sin dependencias de FK.
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `tb_categorias_eventos` (
  `id`     int          NOT NULL AUTO_INCREMENT,
  `nombre` varchar(120) NOT NULL,
  `icono`  varchar(80)  NOT NULL DEFAULT 'event',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- ────────────────────────────────────────────────────────────
-- 8. NEGOCIOS
--    Depende de: usuarios
--    CHECK json_valid(horarios): el JSON de horarios semanales
--    (clave: día, valor: {apertura, cierre, cerrado}).
--    NOTA: logo_url y logo_size definidos en migrate-logo-size.mjs
--    NO están presentes en stage a la fecha de este baseline.
--    Quedan documentados en la sección de "drift pendiente" al final.
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `negocios` (
  `id`              int          NOT NULL AUTO_INCREMENT,
  `usuario_id`      int unsigned NOT NULL,
  `nombre_negocio`  varchar(120) DEFAULT NULL,
  `slogan`          varchar(220) DEFAULT NULL,
  `descripcion`     text         DEFAULT NULL,
  `ubicacion`       varchar(120) DEFAULT NULL,
  `direccion`       varchar(220) DEFAULT NULL,
  `whatsapp`        varchar(30)  DEFAULT NULL,
  `telefono`        varchar(30)  DEFAULT NULL,
  `correo`          varchar(100) DEFAULT NULL,
  `facebook`        varchar(400) DEFAULT NULL,
  `instagram`       varchar(400) DEFAULT NULL,
  `horarios`        longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `created_at`      timestamp    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`      timestamp    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  -- Apariencia (disponible desde plan 3+)
  `header_preset`   varchar(30)  DEFAULT 'marca',
  `header_color`    varchar(7)   DEFAULT '#3B1969',
  `header_height`   tinyint      DEFAULT '26',
  `header_bar`      varchar(20)  DEFAULT 'separada',
  `banner_color`    varchar(20)  DEFAULT '#1a1220',
  `services_color`  varchar(20)  DEFAULT '#0f1a2e',
  `arriendos_color` varchar(20)  DEFAULT '#14241c',
  `sidebar_style`   varchar(20)  DEFAULT 'izquierda',
  `nav_color`       varchar(7)   DEFAULT '#4A2070',
  `nav_style`       varchar(20)  DEFAULT 'borde',
  PRIMARY KEY (`id`),
  UNIQUE KEY `usuario_id` (`usuario_id`),
  CONSTRAINT `negocios_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE,
  CONSTRAINT `negocios_chk_1`  CHECK (json_valid(`horarios`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ────────────────────────────────────────────────────────────
-- 9. TB_LISTINGS (productos / servicios / arriendos)
--    Depende de: usuarios
--    imagen_* cols: cache de la imagen principal; la galería
--    completa vive en tb_listing_imagenes.
--    tallas/medidas: JSON legacy; variantes estructuradas en
--    tb_listing_variantes.
--    stock NULL = no se controla (ej. servicios/arriendos).
--    costo_envio NULL = a convenir, 0 = gratis.
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `tb_listings` (
  `id`               int unsigned NOT NULL AUTO_INCREMENT,
  `usuario_id`       int unsigned DEFAULT NULL,
  `tipo`             enum('producto','servicio','arriendo') NOT NULL,
  `seccion`          varchar(60)  DEFAULT NULL,  -- destacados | ofertas | novedades | liquidacion | tecnologia | tendencia | servicios | arriendos
  `nombre`           varchar(200) NOT NULL,
  `descripcion`      text         DEFAULT NULL,
  `precio`           int unsigned NOT NULL DEFAULT '0',
  `precio_original`  int unsigned DEFAULT NULL,
  `categoria`        varchar(80)  DEFAULT NULL,
  `categoria_id`     int unsigned DEFAULT NULL,
  `subcategoria`     varchar(80)  DEFAULT NULL,
  `subcategoria_id`  int unsigned DEFAULT NULL,
  `badge`            varchar(30)  DEFAULT NULL,
  `genero`           varchar(20)  DEFAULT NULL,
  `imagen`           varchar(500) DEFAULT NULL,
  `imagen_pos_x`     float        DEFAULT '0',
  `imagen_pos_y`     float        DEFAULT '0',
  `imagen_scale`     float        DEFAULT '1',
  `imagen_natural_w` int          DEFAULT NULL,
  `imagen_natural_h` int          DEFAULT NULL,
  `banner_orden`     tinyint      DEFAULT NULL,   -- NULL = no aparece en banner
  `banner_pos_x`     float        DEFAULT '50',
  `banner_pos_y`     float        DEFAULT '50',
  `banner_scale`     float        DEFAULT '1',
  `tallas`           longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,  -- JSON array de tallas
  `medidas`          longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,  -- JSON array de medidas
  `stock`            int          DEFAULT NULL,
  `stock_minimo`     int          DEFAULT '0',
  `sku`              varchar(60)  DEFAULT NULL,
  `peso_gramos`      int          DEFAULT NULL,
  `alto_cm`          int          DEFAULT NULL,
  `ancho_cm`         int          DEFAULT NULL,
  `profundidad_cm`   int          DEFAULT NULL,
  `envio_disponible` tinyint(1)   NOT NULL DEFAULT '0',
  `retiro_local`     tinyint(1)   NOT NULL DEFAULT '1',
  `costo_envio`      int          DEFAULT NULL,
  `activo`           tinyint(1)   NOT NULL DEFAULT '1',
  `created_at`       datetime     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`       datetime     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY        `idx_listings_usuario`  (`usuario_id`),
  KEY        `idx_listings_tipo`     (`tipo`),
  KEY        `idx_listings_seccion`  (`seccion`),
  KEY        `idx_listings_activo`   (`activo`),
  KEY        `idx_listings_categoria`(`categoria_id`),
  KEY        `idx_listings_sku`      (`sku`),
  CONSTRAINT `fk_listings_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE,
  CONSTRAINT `tb_listings_chk_1`   CHECK (json_valid(`tallas`)),
  CONSTRAINT `tb_listings_chk_2`   CHECK (json_valid(`medidas`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ────────────────────────────────────────────────────────────
-- 10. TB_LISTING_IMAGENES (galería 1:N por listing)
--     Depende de: tb_listings
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `tb_listing_imagenes` (
  `id`           int unsigned NOT NULL AUTO_INCREMENT,
  `listing_id`   int unsigned NOT NULL,
  `url`          varchar(500) NOT NULL,
  `orden`        tinyint      NOT NULL DEFAULT '0',
  `es_principal` tinyint(1)   NOT NULL DEFAULT '0',
  `pos_x`        float        DEFAULT '0',
  `pos_y`        float        DEFAULT '0',
  `scale`        float        DEFAULT '1',
  `natural_w`    int          DEFAULT NULL,
  `natural_h`    int          DEFAULT NULL,
  `created_at`   datetime     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY        `idx_listing_img`        (`listing_id`, `orden`),
  CONSTRAINT `fk_listing_img_listing` FOREIGN KEY (`listing_id`) REFERENCES `tb_listings` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ────────────────────────────────────────────────────────────
-- 11. TB_LISTING_VARIANTES (talla/color/material, 1:N por listing)
--     Depende de: tb_listings
--     tipo: 'talla' | 'color' | 'material' | 'presentacion'
--     precio_delta: diferencia +/- sobre el precio base del listing.
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `tb_listing_variantes` (
  `id`           int unsigned NOT NULL AUTO_INCREMENT,
  `listing_id`   int unsigned NOT NULL,
  `tipo`         varchar(40)  NOT NULL,
  `valor`        varchar(80)  NOT NULL,
  `sku`          varchar(60)  DEFAULT NULL,
  `stock`        int          DEFAULT NULL,
  `precio_delta` int          NOT NULL DEFAULT '0',
  `orden`        tinyint      NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY        `idx_listing_var`        (`listing_id`),
  CONSTRAINT `fk_listing_var_listing` FOREIGN KEY (`listing_id`) REFERENCES `tb_listings` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ────────────────────────────────────────────────────────────
-- 12. TB_TOURS (catálogo de turismo)
--     Depende de: usuarios
--     imagen_principal: índice 0-2 dentro del array imagenes.
--     imagenes / imagenes_crop: JSON arrays de URLs.
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `tb_tours` (
  `id`               int unsigned NOT NULL AUTO_INCREMENT,
  `usuario_id`       int unsigned DEFAULT NULL,
  `nombre`           varchar(200) NOT NULL,
  `categoria`        varchar(80)  DEFAULT NULL,
  `categoria_id`     int unsigned DEFAULT NULL,
  `ubicacion`        varchar(200) DEFAULT NULL,
  `detalle`          text         DEFAULT NULL,
  `precio`           int unsigned DEFAULT NULL,  -- NULL = precio a consultar
  `precio_antes`     int unsigned DEFAULT NULL,
  `imagen_principal` tinyint      NOT NULL DEFAULT '0',
  `imagenes`         longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `imagenes_crop`    longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `activo`           tinyint(1)   NOT NULL DEFAULT '1',
  `created_at`       datetime     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`       datetime     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY        `idx_tours_usuario`  (`usuario_id`),
  KEY        `idx_tours_categoria`(`categoria_id`),
  KEY        `idx_tours_activo`   (`activo`),
  CONSTRAINT `fk_tours_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE,
  CONSTRAINT `tb_tours_chk_1`   CHECK (json_valid(`imagenes`)),
  CONSTRAINT `tb_tours_chk_2`   CHECK (json_valid(`imagenes_crop`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ────────────────────────────────────────────────────────────
-- 13. PORTADAS (galería de presentación — cuentas turismo)
--     Depende de: usuarios
--     imagenes / imagenes_crop / categorias: JSON arrays.
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `portadas` (
  `id`            int          NOT NULL AUTO_INCREMENT,
  `usuario_id`    int unsigned NOT NULL,
  `nombre`        varchar(120) DEFAULT NULL,
  `descripcion`   text         DEFAULT NULL,
  `imagenes`      longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `imagenes_crop` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `categorias`    longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `activo`        tinyint(1)   NOT NULL DEFAULT '1',
  `created_at`    timestamp    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`    timestamp    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `usuario_id` (`usuario_id`),
  CONSTRAINT `portadas_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE,
  CONSTRAINT `portadas_chk_1`  CHECK (json_valid(`imagenes`)),
  CONSTRAINT `portadas_chk_2`  CHECK (json_valid(`imagenes_crop`)),
  CONSTRAINT `portadas_chk_3`  CHECK (json_valid(`categorias`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ────────────────────────────────────────────────────────────
-- 14. PAGINAS (página de presentación — cuentas turismo)
--     Depende de: usuarios
--     crop_superior / crop_inferior: JSON de coordenadas de recorte.
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `paginas` (
  `id`              int          NOT NULL AUTO_INCREMENT,
  `usuario_id`      int unsigned NOT NULL,
  `titulo_superior` varchar(200) DEFAULT NULL,
  `texto_superior`  text         DEFAULT NULL,
  `imagen_superior` varchar(500) DEFAULT NULL,
  `titulo_inferior` varchar(200) DEFAULT NULL,
  `texto_inferior`  text         DEFAULT NULL,
  `imagen_inferior` varchar(500) DEFAULT NULL,
  `crop_superior`   longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `crop_inferior`   longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `created_at`      timestamp    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`      timestamp    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `usuario_id` (`usuario_id`),
  CONSTRAINT `paginas_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE,
  CONSTRAINT `paginas_chk_1`  CHECK (json_valid(`crop_superior`)),
  CONSTRAINT `paginas_chk_2`  CHECK (json_valid(`crop_inferior`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ────────────────────────────────────────────────────────────
-- 15. TB_EVENTOS (cartelera municipal)
--     Depende de: (ninguna FK enforced)
--     usuario_id INT (no unsigned, no FK) — agregado en migrate-fase1.
--     categoria_evento_id referencia lógica a tb_categorias_eventos.
--     imagen_2, imagen_3 — agregadas en migrate-fase1.
--     imagen_crop: JSON de coordenadas de recorte de la imagen principal.
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `tb_eventos` (
  `id`                  int unsigned NOT NULL AUTO_INCREMENT,
  `usuario_id`          int          DEFAULT NULL,  -- FK lógica a usuarios.id (no enforced); agregado en migrate-fase1
  `titulo`              varchar(200) NOT NULL,
  `fecha`               varchar(80)  DEFAULT NULL,
  `ubicacion`           varchar(200) DEFAULT NULL,
  `precio`              varchar(60)  DEFAULT NULL,
  `categoria_evento_id` int unsigned DEFAULT NULL,  -- FK lógica a tb_categorias_eventos.id (no enforced)
  `imagen`              varchar(500) DEFAULT NULL,
  `imagen_2`            varchar(300) DEFAULT NULL,  -- agregado en migrate-fase1
  `imagen_3`            varchar(300) DEFAULT NULL,  -- agregado en migrate-fase1
  `imagen_crop`         longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `activo`              tinyint(1)   NOT NULL DEFAULT '1',
  `created_at`          datetime     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`          datetime     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `descripcion`         text         DEFAULT NULL,
  `organizador`         varchar(200) DEFAULT NULL,
  `telefono`            varchar(30)  DEFAULT NULL,
  `whatsapp`            varchar(30)  DEFAULT NULL,
  `horario`             varchar(80)  DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_eventos_categoria`(`categoria_evento_id`),
  KEY `idx_eventos_activo`   (`activo`),
  CONSTRAINT `tb_eventos_chk_1` CHECK (json_valid(`imagen_crop`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ────────────────────────────────────────────────────────────
-- 16. TB_LOCALES (directorio de barrio)
--     Depende de: (ninguna FK enforced)
--     usuario_id INT (no unsigned, no FK) — agregado en migrate-fase1.
--     categoria_barrio_id: FK lógica a tb_categorias_locales.id (no enforced).
--     imagen_2, imagen_3 — agregadas en migrate-fase1.
--     lat, lng DECIMAL(10,7) — DRIFT NO VERSIONADO: estas columnas existían
--       en la BD de stage pero NO estaban en schema.sql ni en ningún .mjs.
--       Se incluyen aquí porque el stage (fuente de verdad) las tiene.
--     imagen_crop: JSON de coordenadas de recorte de la imagen principal.
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `tb_locales` (
  `id`                  int unsigned NOT NULL AUTO_INCREMENT,
  `usuario_id`          int          DEFAULT NULL,  -- FK lógica a usuarios.id (no enforced); agregado en migrate-fase1
  `nombre`              varchar(200) NOT NULL,
  `direccion`           varchar(200) DEFAULT NULL,
  `categoria_barrio_id` int unsigned DEFAULT NULL,  -- FK lógica a tb_categorias_locales.id (no enforced)
  `imagen`              varchar(500) DEFAULT NULL,
  `imagen_2`            varchar(300) DEFAULT NULL,  -- agregado en migrate-fase1
  `imagen_3`            varchar(300) DEFAULT NULL,  -- agregado en migrate-fase1
  `imagen_crop`         longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `activo`              tinyint(1)   NOT NULL DEFAULT '1',
  `created_at`          datetime     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`          datetime     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `descripcion`         text         DEFAULT NULL,
  `telefono`            varchar(30)  DEFAULT NULL,
  `whatsapp`            varchar(30)  DEFAULT NULL,
  `horario`             varchar(200) DEFAULT NULL,
  `facebook`            varchar(300) DEFAULT NULL,
  `instagram`           varchar(200) DEFAULT NULL,
  `correo`              varchar(200) DEFAULT NULL,
  `lat`                 decimal(10,7) DEFAULT NULL,  -- agregado en stage, no estaba en schema.sql ni en los .mjs
  `lng`                 decimal(10,7) DEFAULT NULL,  -- agregado en stage, no estaba en schema.sql ni en los .mjs
  PRIMARY KEY (`id`),
  KEY `idx_locales_categoria`(`categoria_barrio_id`),
  KEY `idx_locales_activo`   (`activo`),
  CONSTRAINT `tb_locales_chk_1` CHECK (json_valid(`imagen_crop`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ────────────────────────────────────────────────────────────
-- 17. TB_HISTORIAL_SEGURIDAD
--     Depende de: usuarios (ON DELETE SET NULL)
--     usuario_id es NULL-able + ON DELETE SET NULL: los registros
--     de 'cuenta_eliminada' deben sobrevivir al borrado del usuario.
--     acciones: login_exitoso | login_fallido | cambio_password |
--       cuenta_eliminacion_solicitada | cuenta_eliminada |
--       cuenta_recuperada | logout
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `tb_historial_seguridad` (
  `id`         int unsigned NOT NULL AUTO_INCREMENT,
  `usuario_id` int unsigned DEFAULT NULL,
  `accion`     varchar(60)  NOT NULL,
  `detalle`    varchar(255) DEFAULT NULL,
  `ip`         varchar(45)  DEFAULT NULL,
  `created_at` datetime     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY        `idx_hist_seg_usuario`(`usuario_id`, `created_at`),
  CONSTRAINT `fk_hist_seg_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ────────────────────────────────────────────────────────────
-- 18. TB_ACTIVIDAD_USUARIOS (log de acciones de negocio)
--     Depende de: usuarios
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `tb_actividad_usuarios` (
  `id`         int unsigned NOT NULL AUTO_INCREMENT,
  `usuario_id` int unsigned NOT NULL,
  `accion`     varchar(60)  NOT NULL,
  `entidad`    varchar(40)  DEFAULT NULL,
  `entidad_id` int unsigned DEFAULT NULL,
  `ip`         varchar(45)  DEFAULT NULL,
  `created_at` datetime     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY        `idx_act_usuario`(`usuario_id`),
  KEY        `idx_act_accion` (`accion`),
  KEY        `idx_act_fecha`  (`created_at`),
  CONSTRAINT `fk_act_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ────────────────────────────────────────────────────────────
-- 19. TB_ANALYTICS_VISITAS (visitas por negocio)
--     Depende de: usuarios
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `tb_analytics_visitas` (
  `id`         int unsigned NOT NULL AUTO_INCREMENT,
  `usuario_id` int unsigned NOT NULL,
  `session_id` varchar(64)  DEFAULT NULL,
  `pagina`     varchar(80)  DEFAULT NULL,
  `ip`         varchar(45)  DEFAULT NULL,
  `created_at` datetime     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY        `usuario_id` (`usuario_id`),
  CONSTRAINT `tb_analytics_visitas_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ────────────────────────────────────────────────────────────
-- 20. TB_ANALYTICS_CLICKS (clicks en listings)
--     Depende de: usuarios
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `tb_analytics_clicks` (
  `id`         int unsigned NOT NULL AUTO_INCREMENT,
  `usuario_id` int unsigned NOT NULL,
  `listing_id` int unsigned DEFAULT NULL,
  `ip`         varchar(45)  DEFAULT NULL,
  `event_type` varchar(40)  DEFAULT NULL,
  `created_at` datetime     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY        `usuario_id` (`usuario_id`),
  CONSTRAINT `tb_analytics_clicks_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ────────────────────────────────────────────────────────────
-- 21. TB_VISITAS_SITIO (visitas globales al sitio, sin usuario)
--     Sin dependencias de FK.
--     Colación utf8mb4_general_ci (tal como existe en stage).
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `tb_visitas_sitio` (
  `id`         int unsigned NOT NULL AUTO_INCREMENT,
  `ip`         varchar(45)  NOT NULL DEFAULT '',
  `pagina`     varchar(40)  NOT NULL DEFAULT 'home',
  `created_at` datetime     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_fecha`(`created_at`),
  KEY `idx_ip`   (`ip`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


-- ────────────────────────────────────────────────────────────
-- 22. TB_PASSWORD_RESET_TOKENS
--     Depende de: usuarios
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `tb_password_reset_tokens` (
  `id`         int unsigned NOT NULL AUTO_INCREMENT,
  `usuario_id` int unsigned NOT NULL,
  `token`      varchar(64)  NOT NULL,
  `expires_at` datetime     NOT NULL,
  `created_at` datetime     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_reset_token`   (`token`),
  KEY        `idx_reset_usuario`(`usuario_id`),
  CONSTRAINT `fk_reset_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


SET FOREIGN_KEY_CHECKS = 1;


-- ============================================================
-- SEEDS DE REFERENCIA
-- ============================================================
-- Los datos de referencia se insertan con ON DUPLICATE KEY UPDATE
-- (o INSERT IGNORE donde no hay datos variables) para garantizar
-- idempotencia: correr sobre una BD con datos existentes no rompe
-- ni duplica filas.
-- ============================================================


-- ── PLANES ───────────────────────────────────────────────────
-- 5 planes reales del stage. precio_neto se actualiza en cada run
-- para reflejar el valor vigente.
INSERT INTO `planes` (`id`, `nombre`, `tipo`, `precio_neto`, `max_listings`) VALUES
  (1, 'Gratuito', 'general',    0,  5),
  (2, 'Normal',   'general', 2990, 25),
  (3, 'Premium',  'general', 4990,100),
  (4, 'Gratuito', 'turismo',    0,  0),
  (5, 'Premium',  'turismo', 3990, 12)
ON DUPLICATE KEY UPDATE
  `nombre`       = VALUES(`nombre`),
  `tipo`         = VALUES(`tipo`),
  `precio_neto`  = VALUES(`precio_neto`),
  `max_listings` = VALUES(`max_listings`);


-- ── TB_CATEGORIAS_EVENTOS (22 filas) ─────────────────────────
INSERT INTO `tb_categorias_eventos` (`id`, `nombre`, `icono`) VALUES
  ( 1, 'Música / Concierto',             'music_note'),
  ( 2, 'Festival / Feria',               'festival'),
  ( 3, 'Peña / Folclor / Cueca',         'guitar_pick'),
  ( 4, 'Stand up / Humor / Show',        'emoji_emotions'),
  ( 5, 'Teatro / Danza / Circo',         'theater_comedy'),
  ( 6, 'Cine / Audiovisual',             'movie'),
  ( 7, 'Arte / Exposición / Cultura',    'palette'),
  ( 8, 'Gastronómico / Food fest',       'restaurant'),
  ( 9, 'Mercado / Venta de garage',      'sell'),
  (10, 'Deporte / Torneo / Campeonato',  'sports'),
  (11, 'Infantil / Familiar',            'child_care'),
  (12, 'Charla / Seminario / Taller',    'school'),
  (13, 'Religioso / Procesión / Misa',   'church'),
  (14, 'Carnaval / Corso / Desfile',     'celebration'),
  (15, 'Bingo / Rifa / Tombola',         'confirmation_number'),
  (16, 'Matrimonio / Quinceañero',       'favorite'),
  (17, 'Cumpleaños / Celebración priv.', 'cake'),
  (18, 'Halloween / Disfraz / Temático', 'masks'),
  (19, 'Navidad / Año nuevo / Fiestas',  'nights_stay'),
  (20, 'A Beneficio / Solidario',        'volunteer_activism'),
  (21, 'Comunitario / Vecinal',          'groups'),
  (22, 'Otro',                           'event')
ON DUPLICATE KEY UPDATE
  `nombre` = VALUES(`nombre`),
  `icono`  = VALUES(`icono`);


-- ── TB_CATEGORIAS_LOCALES (77 filas) ─────────────────────────
INSERT INTO `tb_categorias_locales` (`id`, `nombre`, `icono`) VALUES
  -- Alimentación
  ( 1, 'Almacén / Minimarket',            'local_grocery_store'),
  ( 2, 'Supermercado',                    'shopping_cart'),
  ( 3, 'Panadería / Pastelería',          'bakery_dining'),
  ( 4, 'Amasandería',                     'cookie'),
  ( 5, 'Carnicería / Rotisería',          'set_meal'),
  ( 6, 'Verdulería / Frutería',           'eco'),
  ( 7, 'Marisquería / Pescadería',        'set_meal'),
  ( 8, 'Empanadas / Sopaipillas',         'lunch_dining'),
  ( 9, 'Heladería',                       'icecream'),
  (10, 'Comida rápida / Snacks',          'fastfood'),
  (11, 'Pizzería',                        'local_pizza'),
  (12, 'Sushi / Comida oriental',         'ramen_dining'),
  (13, 'Restaurant / Comedor',            'restaurant'),
  (14, 'Rotisería / Menú del día',        'soup_kitchen'),
  (15, 'Café / Fuente de soda',           'coffee'),
  (16, 'Bar / Pub',                       'sports_bar'),
  (17, 'Discoteca / Karaoke',             'nightlife'),
  (18, 'Botillería',                      'liquor'),
  (19, 'Distribuidora agua / bebidas',    'water_drop'),
  -- Salud y belleza
  (20, 'Farmacia / Botica',               'local_pharmacy'),
  (21, 'Centro médico / Consultorio',     'medical_services'),
  (22, 'Clínica dental / Dentista',       'dentistry'),
  (23, 'Óptica',                          'visibility'),
  (24, 'Kinesiología / Masajes',          'self_improvement'),
  (25, 'Peluquería / Barbería',           'content_cut'),
  (26, 'Centro de estética / Spa',        'spa'),
  (27, 'Pedicuría / Manicuría',           'face_3'),
  (28, 'Veterinaria / Petshop',           'pets'),
  -- Hogar y construcción
  (29, 'Ferretería',                      'hardware'),
  (30, 'Materiales de construcción',      'home_repair_service'),
  (31, 'Gasfitería / Plomería',           'plumbing'),
  (32, 'Electricidad / Electricista',     'electrical_services'),
  (33, 'Cerrajería',                      'lock'),
  (34, 'Pinturería',                      'format_paint'),
  (35, 'Mueblería / Tapicería',           'chair'),
  (36, 'Decoración / Artículos hogar',    'home'),
  (37, 'Vidriería / Aluminios',           'window'),
  (38, 'Gas / Distribuidora de gas',      'gas_meter'),
  -- Automotriz
  (39, 'Taller mecánico / Maestranza',    'build'),
  (40, 'Repuestos automotrices',          'settings'),
  (41, 'Lubricentro / Aceites',           'oil_barrel'),
  (42, 'Llantas / Gomería',               'tire_repair'),
  (43, 'Lavado de autos',                 'local_car_wash'),
  (44, 'Combustibles / Bencinera',        'local_gas_station'),
  (45, 'Estacionamiento / Parking',       'local_parking'),
  -- Servicios
  (46, 'Lavandería / Tintorería',         'local_laundry_service'),
  (47, 'Imprenta / Fotocopiadora',        'print'),
  (48, 'Fotografía / Estudio fotográfico','photo_camera'),
  (49, 'Confección / Costura / Sastrería','design_services'),
  (50, 'Relojería / Joyería',             'watch'),
  (51, 'Zapatería / Reparación calzado',  'footprint'),
  (52, 'Computación / Servicio técnico',  'computer'),
  (53, 'Telefonía / Accesorios celular',  'phone_android'),
  (54, 'Bicicletería / Reparación bici',  'pedal_bike'),
  (55, 'Correo / Mensajería / Courier',   'local_shipping'),
  (56, 'Notaría / Trámites legales',      'gavel'),
  (57, 'Seguros / Financiera',            'account_balance'),
  (58, 'Cambio de moneda',                'currency_exchange'),
  (59, 'Agencia de viajes',               'flight'),
  -- Comercio
  (60, 'Bazar / Bric-à-brac',             'category'),
  (61, 'Librería / Papelería',            'menu_book'),
  (62, 'Juguetería',                      'toys'),
  (63, 'Ropa / Vestuario / Boutique',     'checkroom'),
  (64, 'Lencería / Ropa interior',        'checkroom'),
  (65, 'Deportes / Artículos deportivos', 'sports'),
  (66, 'Electrónica / Tecnología',        'devices'),
  (67, 'Floristería',                     'local_florist'),
  (68, 'Cigarrería / Kiosko',             'smoking_rooms'),
  (69, 'Lotería / Punto de apuestas',     'confirmation_number'),
  -- Educación y deporte
  (70, 'Academia / Clases particulares',  'school'),
  (71, 'Gym / Fitness / Crossfit',        'fitness_center'),
  (72, 'Artes marciales / Escuela dep.',  'sports_martial_arts'),
  (73, 'Danza / Ballet / Pilates',        'self_improvement'),
  -- Comunidad
  (74, 'Iglesia / Templo / Capilla',      'church'),
  (75, 'Junta de vecinos / Sede social',  'groups'),
  (76, 'Centro cultural / Club social',   'museum'),
  (77, 'Otro',                            'storefront')
ON DUPLICATE KEY UPDATE
  `nombre` = VALUES(`nombre`),
  `icono`  = VALUES(`icono`);


-- ── TB_CATEGORIAS (109 filas: producto/servicio/arriendo/turismo/evento/local) ──
-- Los timestamps de created_at vienen del dump del stage; se omiten en el
-- INSERT para que MySQL use CURRENT_TIMESTAMP en instalaciones limpias.
-- En staging/prod ya existentes las filas no cambian (ON DUPLICATE KEY solo
-- actualiza nombre, tipo, orden, activo).
INSERT INTO `tb_categorias` (`id`, `nombre`, `tipo`, `icono`, `orden`, `activo`) VALUES
  -- Producto (ids 1-29)
  ( 1,'Accesorios para Vehículos',         'producto',NULL, 1,1),
  ( 2,'Agro',                              'producto',NULL, 2,1),
  ( 3,'Alimentos y Bebidas',               'producto',NULL, 3,1),
  ( 4,'Mascotas',                          'producto',NULL, 4,1),
  ( 5,'Antigüedades y Colecciones',        'producto',NULL, 5,1),
  ( 6,'Arte, Librería y Cordonería',       'producto',NULL, 6,1),
  ( 7,'Autos, Motos y Otros',              'producto',NULL, 7,1),
  ( 8,'Bebés',                             'producto',NULL, 8,1),
  ( 9,'Belleza y Cuidado Personal',        'producto',NULL, 9,1),
  (10,'Cámaras y Accesorios',              'producto',NULL,10,1),
  (11,'Celulares y Telefonía',             'producto',NULL,11,1),
  (12,'Computación',                       'producto',NULL,12,1),
  (13,'Consolas y Videojuegos',            'producto',NULL,13,1),
  (14,'Construcción',                      'producto',NULL,14,1),
  (15,'Deportes y Fitness',                'producto',NULL,15,1),
  (16,'Electrodomésticos',                 'producto',NULL,16,1),
  (17,'Electrónica, Audio y Video',        'producto',NULL,17,1),
  (18,'Herramientas',                      'producto',NULL,18,1),
  (19,'Hogar y Muebles',                   'producto',NULL,19,1),
  (20,'Industrias y Oficinas',             'producto',NULL,20,1),
  (21,'Instrumentos Musicales',            'producto',NULL,21,1),
  (22,'Juegos y Juguetes',                 'producto',NULL,22,1),
  (23,'Libros, Revistas y Comics',         'producto',NULL,23,1),
  (24,'Música y Películas',                'producto',NULL,24,1),
  (25,'Relojes y Joyas',                   'producto',NULL,25,1),
  (26,'Salud y Equipamiento Médico',       'producto',NULL,26,1),
  (27,'Souvenirs, Cotillón y Fiestas',     'producto',NULL,27,1),
  (28,'Vestuario y Calzado',               'producto',NULL,28,1),
  (29,'Otras Categorías',                  'producto',NULL,29,1),
  -- Servicio (ids 30-49)
  (30,'Belleza y Estética',                'servicio',NULL,30,1),
  (31,'Construcción y Remodelación',       'servicio',NULL,31,1),
  (32,'Diseño y Creatividad',              'servicio',NULL,32,1),
  (33,'Educación y Clases',                'servicio',NULL,33,1),
  (34,'Fotografía y Video',                'servicio',NULL,34,1),
  (35,'Gastronomía y Catering',            'servicio',NULL,35,1),
  (36,'Jardinería y Paisajismo',           'servicio',NULL,36,1),
  (37,'Legal, Contable y Financiero',      'servicio',NULL,37,1),
  (38,'Limpieza y Mantención',             'servicio',NULL,38,1),
  (39,'Mantención del Hogar',              'servicio',NULL,39,1),
  (40,'Mascotas',                          'servicio',NULL,40,1),
  (41,'Salud y Bienestar',                 'servicio',NULL,41,1),
  (42,'Seguridad',                         'servicio',NULL,42,1),
  (43,'Tecnología y Soporte Técnico',      'servicio',NULL,43,1),
  (44,'Transporte y Logística',            'servicio',NULL,44,1),
  (45,'Eventos y Entretenimiento',         'servicio',NULL,45,1),
  (46,'Cuidado Personal y Familiar',       'servicio',NULL,46,1),
  (47,'Automotriz',                        'servicio',NULL,47,1),
  (48,'Ropa y Textil',                     'servicio',NULL,48,1),
  (49,'Veterinaria',                       'servicio',NULL,49,1),
  -- Arriendo (ids 50-61)
  (50,'Alojamiento',                       'arriendo',NULL,50,1),
  (51,'Vehículos',                         'arriendo',NULL,51,1),
  (52,'Equipos y Maquinaria',              'arriendo',NULL,52,1),
  (53,'Herramientas',                      'arriendo',NULL,53,1),
  (54,'Espacios para Eventos',             'arriendo',NULL,54,1),
  (55,'Locales y Oficinas',                'arriendo',NULL,55,1),
  (56,'Equipos para Eventos',              'arriendo',NULL,56,1),
  (57,'Deportes y Aventura',               'arriendo',NULL,57,1),
  (58,'Embarcaciones',                     'arriendo',NULL,58,1),
  (59,'Tecnología y Audiovisual',          'arriendo',NULL,59,1),
  (60,'Camping y Outdoor',                 'arriendo',NULL,60,1),
  (61,'Ropa y Disfraces',                  'arriendo',NULL,61,1),
  -- Turismo (ids 62-84)
  (62,'Aventura y Deportes Extremos',      'turismo', NULL,62,1),
  (63,'Deportes Acuáticos',               'turismo', NULL,63,1),
  (64,'Senderismo y Trekking',             'turismo', NULL,64,1),
  (65,'Naturaleza y Ecoturismo',           'turismo', NULL,65,1),
  (66,'Termas y Bienestar',               'turismo', NULL,66,1),
  (67,'Cultura y Patrimonio',              'turismo', NULL,67,1),
  (68,'Gastronomía y Turismo Rural',       'turismo', NULL,68,1),
  (69,'Ski y Nieve',                       'turismo', NULL,69,1),
  (70,'Cabalgatas y Vida Rural',           'turismo', NULL,70,1),
  (71,'Tours y Excursiones',               'turismo', NULL,71,1),
  (72,'Ciclismo y Rutas',                  'turismo', NULL,72,1),
  (73,'Turismo Familiar',                  'turismo', NULL,73,1),
  (74,'Alojamiento Turístico',             'turismo', NULL,74,1),
  (75,'Fotografía y Arte',                 'turismo', NULL,75,1),
  (76,'Vida Nocturna y Social',            'turismo', NULL,76,1),
  (77,'Navegación y Vela',                 'turismo', NULL,77,1),
  (78,'Camping y Vida al Aire Libre',      'turismo', NULL,78,1),
  (79,'Astroturismo',                      'turismo', NULL,79,1),
  (80,'Turismo de Bodas y Celebraciones',  'turismo', NULL,80,1),
  (81,'Retiros y Espiritualidad',          'turismo', NULL,81,1),
  (82,'Turismo Invernal',                  'turismo', NULL,82,1),
  (83,'Turismo de Voluntariado',           'turismo', NULL,83,1),
  (84,'Eventos Deportivos',                'turismo', NULL,84,1),
  -- Evento (ids 85-96)
  (85,'Fiestas Locales y Tradiciones',     'evento',  NULL,85,1),
  (86,'Cultura Mapuche',                   'evento',  NULL,86,1),
  (87,'Deportes y Aventura',               'evento',  NULL,87,1),
  (88,'Música y Entretenimiento',          'evento',  NULL,88,1),
  (89,'Gastronomía Local',                 'evento',  NULL,89,1),
  (90,'Festivales de Temporada',           'evento',  NULL,90,1),
  (91,'Ferias y Exposiciones',             'evento',  NULL,91,1),
  (92,'Eventos Familiares e Infantiles',   'evento',  NULL,92,1),
  (93,'Educativos y Comunitarios',         'evento',  NULL,93,1),
  (94,'Celebraciones Privadas',            'evento',  NULL,94,1),
  (95,'Turismo y Naturaleza',              'evento',  NULL,95,1),
  (96,'Rodeo y Tradición Chilena',         'evento',  NULL,96,1),
  -- Local (ids 97-109)
  (97, 'Almacén y Minimarket',             'local',   NULL, 97,1),
  (98, 'Botillería',                       'local',   NULL, 98,1),
  (99, 'Verdulería y Frutería',            'local',   NULL, 99,1),
  (100,'Panadería y Masas',               'local',   NULL,100,1),
  (101,'Carnicería y Fiambrería',          'local',   NULL,101,1),
  (102,'Rotisería y Comida al Paso',       'local',   NULL,102,1),
  (103,'Pescadería y Mariscos',            'local',   NULL,103,1),
  (104,'Lácteos y Quesería',              'local',   NULL,104,1),
  (105,'Heladería y Confitería',           'local',   NULL,105,1),
  (106,'Feria Libre y Mercado',            'local',   NULL,106,1),
  (107,'Café y Té',                        'local',   NULL,107,1),
  (108,'Fuente de Soda',                   'local',   NULL,108,1),
  (109,'Alimento y Accesorios para Animales','local', NULL,109,1)
ON DUPLICATE KEY UPDATE
  `nombre` = VALUES(`nombre`),
  `tipo`   = VALUES(`tipo`),
  `orden`  = VALUES(`orden`),
  `activo` = VALUES(`activo`);


-- ── TB_SUBCATEGORIAS ──────────────────────────────────────────
-- 855 filas — el dump completo está en _stage_seed_raw.sql (línea 33).
-- Se reproduce aquí en su totalidad para que el documento sea
-- autónomo. El INSERT original del stage es una sola línea compacta;
-- se formatea aquí por legibilidad pero los datos son idénticos.
-- Para importar en un entorno nuevo es válido copiar directamente
-- la línea 33 del archivo _stage_seed_raw.sql.
-- ────────────────────────────────────────────────────────────
-- NOTA: por el volumen (855 filas, ~50 KB), este bloque se
-- referencia externamente. Para la carga inicial ejecutar:
--   SOURCE backend/db/_stage_seed_raw.sql;
-- O bien, importar sólo la sección de tb_subcategorias con:
--   sed -n '/LOCK TABLES `tb_subcategorias`/,/UNLOCK TABLES/p' \
--     backend/db/_stage_seed_raw.sql | mysql -u<user> -p <db>
-- El seed de subcategorías se trackea en _stage_seed_raw.sql
-- hasta que se decida extraerlo a un archivo seeds/ dedicado.


-- ============================================================
-- NOTA SOBRE COLUMNAS PENDIENTES DE MIGRAR A STAGE
-- ============================================================
-- Las siguientes columnas existen en backend/schema.sql y/o en
-- migrate-logo-size.mjs pero NO están en stage a la fecha v0:
--
--   negocios.logo_url  VARCHAR(500)      -- definida en schema.sql
--   negocios.logo_size TINYINT UNSIGNED DEFAULT 3  -- definida en migrate-logo-size.mjs
--
-- Antes de aplicarlas en stage crear una migración numerada
-- (backend/db/migrations/001_negocios_logo.sql) con:
--   ALTER TABLE negocios
--     ADD COLUMN logo_url  VARCHAR(500)         DEFAULT NULL AFTER instagram,
--     ADD COLUMN logo_size TINYINT UNSIGNED     DEFAULT 3   AFTER logo_url,
--     ALGORITHM=INPLACE, LOCK=NONE;
-- y su correspondiente DOWN.
-- ============================================================
