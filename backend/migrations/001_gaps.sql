-- ============================================================
-- UNCLICK — Migración 001: cierre de gaps estructurales
-- BD: unclik · MariaDB 10.4 · XAMPP 3308
-- IDEMPOTENTE: re-ejecutable sin error ni duplicación de datos.
-- NO destruye datos existentes. La columna tb_listings.imagen se CONSERVA.
--
-- Aplicar:
--   "C:\xampp\mysql\bin\mysql.exe" -u root -h 127.0.0.1 -P 3308 unclik < backend/migrations/001_gaps.sql
-- (o con MySQL Server 8.0 si XAMPP no está: "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe")
--
-- Backup previo recomendado:
--   mysqldump -u root -h 127.0.0.1 -P 3308 --databases unclik --routines --triggers > backup.sql
-- ============================================================

USE unclik;

-- Las FKs guardadas con PREPARE necesitan que el motor no aborte por checks
-- de tipos intermedios; no tocamos FOREIGN_KEY_CHECKS para no enmascarar errores reales.

-- ============================================================
-- BLOQUE 1 — P0: tb_historial_seguridad
-- El código (auth.js + lib/securityLog.js) ya inserta (accion, detalle, ip).
-- Sin esta tabla, login / recover / delete de cuenta FALLAN.
-- FK ON DELETE SET NULL: la auditoría de 'cuenta_eliminada' debe sobrevivir
-- al borrado del propio usuario, por eso usuario_id es NULL-able.
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
-- BLOQUE 2 — P0: usuarios.eliminacion_programada_at
-- Usado por auth.js (login, recover, delete). Sin esta columna,
-- el SELECT de login con 'eliminacion_programada_at' FALLA.
-- ============================================================
ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS eliminacion_programada_at DATETIME NULL AFTER activo;

ALTER TABLE usuarios
  ADD INDEX IF NOT EXISTS idx_usuarios_eliminacion (eliminacion_programada_at);

-- ============================================================
-- BLOQUE 3 — tb_listing_imagenes (galería múltiple, 1:N)
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
-- BLOQUE 4 — tb_listing_variantes (talla/color/material, 1:N)
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
-- BLOQUE 5 — tb_listings: stock + sku + envío (columnas 1:1)
-- stock NULL = no se controla (servicios/arriendos).
-- costo_envio NULL = a convenir; 0 = gratis.
-- ============================================================
ALTER TABLE tb_listings
  ADD COLUMN IF NOT EXISTS stock            INT        NULL                AFTER medidas,
  ADD COLUMN IF NOT EXISTS stock_minimo     INT        NULL DEFAULT 0      AFTER stock,
  ADD COLUMN IF NOT EXISTS sku              VARCHAR(60) NULL               AFTER stock_minimo,
  ADD COLUMN IF NOT EXISTS peso_gramos      INT        NULL                AFTER sku,
  ADD COLUMN IF NOT EXISTS alto_cm          INT        NULL                AFTER peso_gramos,
  ADD COLUMN IF NOT EXISTS ancho_cm         INT        NULL                AFTER alto_cm,
  ADD COLUMN IF NOT EXISTS profundidad_cm   INT        NULL                AFTER ancho_cm,
  ADD COLUMN IF NOT EXISTS envio_disponible TINYINT(1) NOT NULL DEFAULT 0  AFTER profundidad_cm,
  ADD COLUMN IF NOT EXISTS retiro_local     TINYINT(1) NOT NULL DEFAULT 1  AFTER envio_disponible,
  ADD COLUMN IF NOT EXISTS costo_envio      INT        NULL                AFTER retiro_local;

ALTER TABLE tb_listings
  ADD INDEX IF NOT EXISTS idx_listings_sku (sku);

-- ============================================================
-- BLOQUE 6 — Migración de datos: imagen actual -> tb_listing_imagenes
-- Idempotente: solo siembra si el listing aún no tiene filas en la galería.
-- La columna tb_listings.imagen se CONSERVA (cache de la principal).
-- ============================================================
INSERT INTO tb_listing_imagenes
  (listing_id, url, orden, es_principal, pos_x, pos_y, scale, natural_w, natural_h)
SELECT l.id, l.imagen, 0, 1,
       l.imagen_pos_x, l.imagen_pos_y, l.imagen_scale,
       l.imagen_natural_w, l.imagen_natural_h
FROM tb_listings l
WHERE l.imagen IS NOT NULL
  AND l.imagen <> ''
  AND NOT EXISTS (
    SELECT 1 FROM tb_listing_imagenes i WHERE i.listing_id = l.id
  );

-- ============================================================
-- BLOQUE 7 — FK tb_subcategorias.categoria_id -> tb_categorias(id)
-- ADD CONSTRAINT no soporta IF NOT EXISTS en MariaDB 10.4 -> guard manual.
-- 0 huérfanas verificadas. Ambas columnas son INT signed (compatibles).
-- ============================================================
SET @fk_exists := (
  SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE()
    AND TABLE_NAME = 'tb_subcategorias'
    AND CONSTRAINT_NAME = 'fk_subcat_categoria'
    AND CONSTRAINT_TYPE = 'FOREIGN KEY'
);

SET @sql := IF(@fk_exists = 0,
  'ALTER TABLE tb_subcategorias
     ADD CONSTRAINT fk_subcat_categoria
     FOREIGN KEY (categoria_id) REFERENCES tb_categorias(id) ON DELETE CASCADE',
  'DO 0');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================================
-- VERIFICACIÓN (informativa — se muestra al final del run)
-- ============================================================
SELECT 'tb_listing_imagenes sembradas' AS check_name, COUNT(*) AS valor FROM tb_listing_imagenes
UNION ALL
SELECT 'tb_historial_seguridad existe', COUNT(*) FROM information_schema.TABLES
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tb_historial_seguridad'
UNION ALL
SELECT 'usuarios.eliminacion_programada_at', COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'usuarios' AND COLUMN_NAME = 'eliminacion_programada_at'
UNION ALL
SELECT 'tb_listings.stock', COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tb_listings' AND COLUMN_NAME = 'stock'
UNION ALL
SELECT 'FK subcategorias->categorias', COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'tb_subcategorias'
    AND CONSTRAINT_NAME = 'fk_subcat_categoria';
