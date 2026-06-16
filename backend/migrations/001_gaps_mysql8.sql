-- ============================================================
-- UNCLICK -- Migración 001: cierre de gaps estructurales
-- BD: unclik · MySQL 8.0 · VPS stage
-- IDEMPOTENTE: re-ejecutable sin error ni duplicación de datos.
-- NO destruye datos existentes. La columna tb_listings.imagen se CONSERVA.
--
-- Adaptada desde 001_gaps.sql (MariaDB 10.4):
--   - ADD COLUMN IF NOT EXISTS  -> guard via information_schema + PREPARE/EXECUTE
--   - ADD INDEX IF NOT EXISTS   -> guard via information_schema.STATISTICS + PREPARE/EXECUTE
--   - Bloque 7 (FK tb_subcategorias): tabla no existe en este VPS -> guard adicional
--     que verifica TABLE existencia antes de intentar el ALTER.
--
-- Backup previo: /root/backups/unclik_pre_001gaps_20260616.sql (ya creado)
-- Aplicar: mysql -u root unclik < /var/www/unclick/backend/migrations/001_gaps_mysql8.sql
-- ============================================================

USE unclik;

-- ============================================================
-- BLOQUE 1 -- P0: tb_historial_seguridad
-- CREATE TABLE IF NOT EXISTS funciona igual en MySQL 8.
-- ============================================================
CREATE TABLE IF NOT EXISTS tb_historial_seguridad (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  usuario_id  INT UNSIGNED NULL,
  accion      VARCHAR(60)  NOT NULL,
  detalle     VARCHAR(255) NULL,
  ip          VARCHAR(45)  NULL,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_hist_seg_usuario (usuario_id, created_at),
  CONSTRAINT fk_hist_seg_usuario
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- BLOQUE 2 -- P0: usuarios.eliminacion_programada_at
-- MySQL 8 no soporta ADD COLUMN IF NOT EXISTS.
-- Guard: consulta information_schema.COLUMNS antes de ejecutar el ALTER.
-- ============================================================

-- 2a) Columna eliminacion_programada_at
SET @col_exists = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME   = 'usuarios'
    AND COLUMN_NAME  = 'eliminacion_programada_at'
);
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE usuarios ADD COLUMN eliminacion_programada_at DATETIME NULL AFTER activo',
  'DO 0'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2b) Índice idx_usuarios_eliminacion
SET @idx_exists = (
  SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME   = 'usuarios'
    AND INDEX_NAME   = 'idx_usuarios_eliminacion'
);
SET @sql = IF(@idx_exists = 0,
  'ALTER TABLE usuarios ADD INDEX idx_usuarios_eliminacion (eliminacion_programada_at)',
  'DO 0'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================================
-- BLOQUE 3 -- tb_listing_imagenes (galería múltiple, 1:N)
-- CREATE TABLE IF NOT EXISTS funciona igual en MySQL 8.
-- ============================================================
CREATE TABLE IF NOT EXISTS tb_listing_imagenes (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  listing_id    INT UNSIGNED NOT NULL,
  url           VARCHAR(500) NOT NULL,
  orden         TINYINT      NOT NULL DEFAULT 0,
  es_principal  TINYINT(1)   NOT NULL DEFAULT 0,
  pos_x         FLOAT        DEFAULT 0,
  pos_y         FLOAT        DEFAULT 0,
  scale         FLOAT        DEFAULT 1,
  natural_w     INT          NULL,
  natural_h     INT          NULL,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_listing_img (listing_id, orden),
  CONSTRAINT fk_listing_img_listing
    FOREIGN KEY (listing_id) REFERENCES tb_listings(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- BLOQUE 4 -- tb_listing_variantes (talla/color/material, 1:N)
-- CREATE TABLE IF NOT EXISTS funciona igual en MySQL 8.
-- ============================================================
CREATE TABLE IF NOT EXISTS tb_listing_variantes (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  listing_id    INT UNSIGNED NOT NULL,
  tipo          VARCHAR(40)  NOT NULL,
  valor         VARCHAR(80)  NOT NULL,
  sku           VARCHAR(60)  NULL,
  stock         INT          NULL,
  precio_delta  INT          NOT NULL DEFAULT 0,
  orden         TINYINT      NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY idx_listing_var (listing_id),
  CONSTRAINT fk_listing_var_listing
    FOREIGN KEY (listing_id) REFERENCES tb_listings(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- BLOQUE 5 -- tb_listings: stock + sku + envío (columnas 1:1)
-- Cada columna recibe su propio guard individual para ser granular
-- e idempotente: si alguna ya existe (ejecución parcial previa),
-- se salta solo esa sin abortar el bloque completo.
-- stock NULL = no se controla (servicios/arriendos).
-- costo_envio NULL = a convenir; 0 = gratis.
-- ============================================================

-- stock
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='tb_listings' AND COLUMN_NAME='stock');
SET @sql = IF(@col_exists=0,
  'ALTER TABLE tb_listings ADD COLUMN stock INT NULL AFTER medidas', 'DO 0');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- stock_minimo
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='tb_listings' AND COLUMN_NAME='stock_minimo');
SET @sql = IF(@col_exists=0,
  'ALTER TABLE tb_listings ADD COLUMN stock_minimo INT NULL DEFAULT 0 AFTER stock', 'DO 0');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- sku
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='tb_listings' AND COLUMN_NAME='sku');
SET @sql = IF(@col_exists=0,
  'ALTER TABLE tb_listings ADD COLUMN sku VARCHAR(60) NULL AFTER stock_minimo', 'DO 0');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- peso_gramos
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='tb_listings' AND COLUMN_NAME='peso_gramos');
SET @sql = IF(@col_exists=0,
  'ALTER TABLE tb_listings ADD COLUMN peso_gramos INT NULL AFTER sku', 'DO 0');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- alto_cm
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='tb_listings' AND COLUMN_NAME='alto_cm');
SET @sql = IF(@col_exists=0,
  'ALTER TABLE tb_listings ADD COLUMN alto_cm INT NULL AFTER peso_gramos', 'DO 0');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ancho_cm
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='tb_listings' AND COLUMN_NAME='ancho_cm');
SET @sql = IF(@col_exists=0,
  'ALTER TABLE tb_listings ADD COLUMN ancho_cm INT NULL AFTER alto_cm', 'DO 0');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- profundidad_cm
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='tb_listings' AND COLUMN_NAME='profundidad_cm');
SET @sql = IF(@col_exists=0,
  'ALTER TABLE tb_listings ADD COLUMN profundidad_cm INT NULL AFTER ancho_cm', 'DO 0');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- envio_disponible
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='tb_listings' AND COLUMN_NAME='envio_disponible');
SET @sql = IF(@col_exists=0,
  'ALTER TABLE tb_listings ADD COLUMN envio_disponible TINYINT(1) NOT NULL DEFAULT 0 AFTER profundidad_cm', 'DO 0');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- retiro_local
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='tb_listings' AND COLUMN_NAME='retiro_local');
SET @sql = IF(@col_exists=0,
  'ALTER TABLE tb_listings ADD COLUMN retiro_local TINYINT(1) NOT NULL DEFAULT 1 AFTER envio_disponible', 'DO 0');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- costo_envio
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='tb_listings' AND COLUMN_NAME='costo_envio');
SET @sql = IF(@col_exists=0,
  'ALTER TABLE tb_listings ADD COLUMN costo_envio INT NULL AFTER retiro_local', 'DO 0');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- idx_listings_sku
SET @idx_exists = (SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='tb_listings' AND INDEX_NAME='idx_listings_sku');
SET @sql = IF(@idx_exists=0,
  'ALTER TABLE tb_listings ADD INDEX idx_listings_sku (sku)', 'DO 0');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ============================================================
-- BLOQUE 6 -- Migración de datos: imagen actual -> tb_listing_imagenes
-- Idempotente: solo siembra si el listing aún no tiene filas en la galería.
-- La columna tb_listings.imagen se CONSERVA (cache de la principal).
-- ADAPTACIÓN VPS: tb_listings en este VPS no tiene imagen_pos_x/y/scale/natural_*
-- -> se siembran con valores default (0, 0, 1, NULL, NULL).
-- ============================================================
INSERT INTO tb_listing_imagenes
  (listing_id, url, orden, es_principal, pos_x, pos_y, scale, natural_w, natural_h)
SELECT l.id, l.imagen, 0, 1,
       0, 0, 1, NULL, NULL
FROM tb_listings l
WHERE l.imagen IS NOT NULL
  AND l.imagen <> ''
  AND NOT EXISTS (
    SELECT 1 FROM tb_listing_imagenes i WHERE i.listing_id = l.id
  );

-- ============================================================
-- BLOQUE 7 -- FK tb_subcategorias.categoria_id -> tb_categorias(id)
-- ADAPTACIÓN MySQL 8: guard adicional que verifica primero que la tabla
-- tb_subcategorias exista (en este VPS NO existe -> @fk_exists queda en 1
-- y el ALTER nunca se ejecuta).
-- ============================================================
SET @tbl_exists = (
  SELECT COUNT(*) FROM information_schema.TABLES
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME   = 'tb_subcategorias'
);

SET @fk_exists = IF(@tbl_exists = 0, 1, (
  SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE()
    AND TABLE_NAME       = 'tb_subcategorias'
    AND CONSTRAINT_NAME  = 'fk_subcat_categoria'
    AND CONSTRAINT_TYPE  = 'FOREIGN KEY'
));

SET @sql = IF(@fk_exists = 0,
  'ALTER TABLE tb_subcategorias ADD CONSTRAINT fk_subcat_categoria FOREIGN KEY (categoria_id) REFERENCES tb_categorias(id) ON DELETE CASCADE',
  'DO 0'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================================
-- VERIFICACIÓN (informativa -- se muestra al final del run)
-- ============================================================
SELECT 'tb_historial_seguridad existe'       AS check_name, COUNT(*) AS valor
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tb_historial_seguridad'
UNION ALL
SELECT 'usuarios.eliminacion_programada_at', COUNT(*)
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'usuarios'
  AND COLUMN_NAME = 'eliminacion_programada_at'
UNION ALL
SELECT 'idx_usuarios_eliminacion',            COUNT(*)
FROM information_schema.STATISTICS
WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'usuarios'
  AND INDEX_NAME = 'idx_usuarios_eliminacion'
UNION ALL
SELECT 'tb_listing_imagenes existe',          COUNT(*)
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tb_listing_imagenes'
UNION ALL
SELECT 'tb_listing_variantes existe',         COUNT(*)
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tb_listing_variantes'
UNION ALL
SELECT 'tb_listings.stock existe',            COUNT(*)
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tb_listings'
  AND COLUMN_NAME = 'stock'
UNION ALL
SELECT 'tb_listings.sku existe',              COUNT(*)
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tb_listings'
  AND COLUMN_NAME = 'sku'
UNION ALL
SELECT 'idx_listings_sku existe',             COUNT(*)
FROM information_schema.STATISTICS
WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tb_listings'
  AND INDEX_NAME = 'idx_listings_sku'
UNION ALL
SELECT 'tb_listing_imagenes sembradas',       COUNT(*)
FROM tb_listing_imagenes;
