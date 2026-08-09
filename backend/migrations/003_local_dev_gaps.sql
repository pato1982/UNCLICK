-- ============================================================
-- UNCLICK — Migración 003: cierra la deriva entre código y esquema
--
-- Idempotente (guards de information_schema + PREPARE/EXECUTE), mismo patrón
-- que 001_gaps_mysql8.sql. MySQL 8 no soporta ADD COLUMN IF NOT EXISTS.
--
-- Motivo: hay columnas y valores de enum que el código YA usa pero que nunca
-- llegaron a ningún .sql, así que una BD creada desde el repo queda distinta
-- de la que corre en el VPS. Cada bloque documenta el call site.
-- ============================================================

-- ============================================================
-- BLOQUE 1 -- usuarios.tipo_cuenta: agregar 'local' y 'evento'
--
-- El frontend tiene paneles completos para estos dos tipos de cuenta
-- (src/admin/pages/AdminLocal.jsx, AdminEvento.jsx, ruteo en src/main.jsx),
-- y el backend expone /api/v1/mi-local y /api/v1/mis-eventos para ellos.
-- Pero el enum solo aceptaba general|turismo, así que registrarse como
-- 'local' o 'evento' fallaba y esos paneles eran inalcanzables.
-- ============================================================

SET @enum_ok = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME   = 'usuarios'
    AND COLUMN_NAME  = 'tipo_cuenta'
    AND COLUMN_TYPE LIKE '%evento%'
);
SET @sql = IF(@enum_ok = 0,
  "ALTER TABLE usuarios MODIFY COLUMN tipo_cuenta ENUM('general','turismo','local','evento') NOT NULL DEFAULT 'general'",
  'DO 0'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ============================================================
-- BLOQUE 2 -- usuarios: contador de intentos de login y bloqueo
--
-- backend/routes/auth.js lee usuario.login_bloqueado_hasta (:175) y
-- usuario.login_intentos (:210), y hace UPDATE sobre ambas (:214). Las
-- columnas no existían en ningún .sql: el SELECT devolvía undefined y el
-- UPDATE habría tirado 500. Sin esto el lockout por fuerza bruta no puede
-- funcionar ni siquiera con el resto arreglado.
-- ============================================================

SET @col_exists = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME   = 'usuarios'
    AND COLUMN_NAME  = 'login_intentos'
);
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE usuarios ADD COLUMN login_intentos INT NOT NULL DEFAULT 0 AFTER activo',
  'DO 0'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME   = 'usuarios'
    AND COLUMN_NAME  = 'login_bloqueado_hasta'
);
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE usuarios ADD COLUMN login_bloqueado_hasta DATETIME NULL AFTER login_intentos',
  'DO 0'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ============================================================
-- BLOQUE 3 -- tb_eventos: autogestión por usuario + galería
--
-- backend/routes/mis-eventos.js filtra por usuario_id y sube hasta 3
-- imágenes (imagen_2, imagen_3). Las columnas solo existían vía el script
-- migrate-fase1-locales-eventos.mjs (ahora en _legacy/), no en el esquema.
-- usuario_id NULL = evento creado por el panel programador.
-- ============================================================

SET @col_exists = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tb_eventos' AND COLUMN_NAME = 'usuario_id'
);
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE tb_eventos ADD COLUMN usuario_id INT UNSIGNED NULL AFTER id, ADD INDEX idx_eventos_usuario (usuario_id)',
  'DO 0'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tb_eventos' AND COLUMN_NAME = 'imagen_2'
);
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE tb_eventos ADD COLUMN imagen_2 VARCHAR(255) NULL, ADD COLUMN imagen_3 VARCHAR(255) NULL',
  'DO 0'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ============================================================
-- BLOQUE 4 -- tb_locales: mismo par (autogestión 1:1 + galería)
-- backend/routes/mi-local.js
-- ============================================================

SET @col_exists = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tb_locales' AND COLUMN_NAME = 'usuario_id'
);
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE tb_locales ADD COLUMN usuario_id INT UNSIGNED NULL AFTER id, ADD INDEX idx_locales_usuario (usuario_id)',
  'DO 0'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tb_locales' AND COLUMN_NAME = 'imagen_2'
);
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE tb_locales ADD COLUMN imagen_2 VARCHAR(255) NULL, ADD COLUMN imagen_3 VARCHAR(255) NULL',
  'DO 0'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ============================================================
-- BLOQUE 5 -- negocios.logo_size
-- Usada por el panel de apariencia; venía del script migrate-logo-size.mjs.
-- ============================================================

SET @col_exists = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'negocios' AND COLUMN_NAME = 'logo_size'
);
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE negocios ADD COLUMN logo_size TINYINT NOT NULL DEFAULT 3',
  'DO 0'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ============================================================
-- Verificación
-- ============================================================
SELECT 'tipo_cuenta acepta local/evento' AS check_name,
       (SELECT COUNT(*) FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'usuarios'
          AND COLUMN_NAME = 'tipo_cuenta' AND COLUMN_TYPE LIKE '%evento%') AS valor
UNION ALL SELECT 'usuarios.login_intentos',
       (SELECT COUNT(*) FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'usuarios' AND COLUMN_NAME = 'login_intentos')
UNION ALL SELECT 'tb_eventos.usuario_id',
       (SELECT COUNT(*) FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tb_eventos' AND COLUMN_NAME = 'usuario_id')
UNION ALL SELECT 'tb_locales.usuario_id',
       (SELECT COUNT(*) FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tb_locales' AND COLUMN_NAME = 'usuario_id')
UNION ALL SELECT 'negocios.logo_size',
       (SELECT COUNT(*) FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'negocios' AND COLUMN_NAME = 'logo_size');
