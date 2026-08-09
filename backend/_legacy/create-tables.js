/**
 * Crea las 4 tablas de publicaciones y agrega columna icono a tb_categorias.
 * Ejecutar una vez: node create-tables.js
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

// ── 1. icono en tb_categorias ──────────────────────────────────────────────
await conn.query(`
  ALTER TABLE tb_categorias
    ADD COLUMN IF NOT EXISTS icono VARCHAR(80) NULL AFTER nombre;
`)
console.log('✔  tb_categorias → columna icono agregada')

// ── 2. tb_listings (productos / servicios / arriendos) ─────────────────────
await conn.query(`
  CREATE TABLE IF NOT EXISTS tb_listings (
    id               INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    usuario_id       INT UNSIGNED    NULL COMMENT 'FK a tabla de usuarios (futura)',
    tipo             ENUM('producto','servicio','arriendo') NOT NULL,
    seccion          VARCHAR(60)     NULL COMMENT 'destacados | ofertas | novedades | liquidacion | tecnologia | tendencia | servicios | arriendos',
    nombre           VARCHAR(200)    NOT NULL,
    descripcion      TEXT            NULL,
    precio           INT UNSIGNED    NOT NULL DEFAULT 0,
    precio_original  INT UNSIGNED    NULL,
    categoria        VARCHAR(80)     NULL COMMENT 'Texto del nombre de categoría',
    categoria_id     INT UNSIGNED    NULL COMMENT 'FK tb_categorias',
    subcategoria     VARCHAR(80)     NULL COMMENT 'Texto del nombre de subcategoría',
    subcategoria_id  INT UNSIGNED    NULL COMMENT 'FK tb_subcategorias',
    badge            VARCHAR(30)     NULL COMMENT 'Ej: Nuevo | Oferta | Hot',
    genero           VARCHAR(20)     NULL COMMENT 'hombre | mujer | unisex | niño | niña',
    imagen           VARCHAR(500)    NULL COMMENT 'Ruta relativa /uploads/productos/...',
    imagen_pos_x     FLOAT           NULL DEFAULT 0 COMMENT 'Posición X del recorte',
    imagen_pos_y     FLOAT           NULL DEFAULT 0 COMMENT 'Posición Y del recorte',
    imagen_scale     FLOAT           NULL DEFAULT 1 COMMENT 'Escala del recorte',
    imagen_natural_w INT             NULL COMMENT 'Ancho natural de la imagen original',
    imagen_natural_h INT             NULL COMMENT 'Alto natural de la imagen original',
    banner_orden     TINYINT         NULL COMMENT 'Posición en banner (0-N)',
    banner_pos_x     FLOAT           NULL DEFAULT 50 COMMENT 'X% para banner',
    banner_pos_y     FLOAT           NULL DEFAULT 50 COMMENT 'Y% para banner',
    banner_scale     FLOAT           NULL DEFAULT 1 COMMENT 'Escala para banner',
    tallas           JSON            NULL COMMENT '{tipo: calzado|ropa|accesorios, seleccion: []}',
    medidas          JSON            NULL COMMENT '{alto, ancho, profundidad}',
    activo           TINYINT(1)      NOT NULL DEFAULT 1,
    created_at       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_listings_usuario (usuario_id),
    KEY idx_listings_tipo (tipo),
    KEY idx_listings_seccion (seccion),
    KEY idx_listings_activo (activo),
    KEY idx_listings_categoria (categoria_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`)
console.log('✔  tb_listings creada')

// ── 3. tb_tours (turismo) ──────────────────────────────────────────────────
await conn.query(`
  CREATE TABLE IF NOT EXISTS tb_tours (
    id               INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    usuario_id       INT UNSIGNED    NULL COMMENT 'FK a tabla de usuarios (futura)',
    nombre           VARCHAR(200)    NOT NULL,
    categoria        VARCHAR(80)     NULL COMMENT 'Texto del nombre de categoría turismo',
    categoria_id     INT UNSIGNED    NULL COMMENT 'FK tb_categorias tipo=turismo',
    ubicacion        VARCHAR(200)    NULL,
    detalle          TEXT            NULL,
    precio           INT UNSIGNED    NULL COMMENT 'NULL = precio a consultar',
    precio_antes     INT UNSIGNED    NULL,
    imagen_principal TINYINT         NOT NULL DEFAULT 0 COMMENT 'Índice 0-2 de la imagen principal',
    imagenes         JSON            NULL COMMENT 'Array de 3 URLs [img0, img1, img2]',
    imagenes_crop    JSON            NULL COMMENT 'Array de 3 objetos {zoom, x, y}',
    activo           TINYINT(1)      NOT NULL DEFAULT 1,
    created_at       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_tours_usuario (usuario_id),
    KEY idx_tours_categoria (categoria_id),
    KEY idx_tours_activo (activo)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`)
console.log('✔  tb_tours creada')

// ── 4. tb_eventos ──────────────────────────────────────────────────────────
await conn.query(`
  CREATE TABLE IF NOT EXISTS tb_eventos (
    id                  INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    titulo              VARCHAR(200)    NOT NULL,
    fecha               VARCHAR(80)     NULL COMMENT 'Texto libre: Ej "15 - 17 Mar 2026"',
    ubicacion           VARCHAR(200)    NULL,
    precio              VARCHAR(60)     NULL COMMENT 'Texto libre: Ej "$5.000 o Gratis"',
    categoria_evento_id INT UNSIGNED    NULL COMMENT 'FK tb_categorias tipo=evento',
    imagen              VARCHAR(500)    NULL COMMENT 'Ruta relativa /uploads/eventos/...',
    imagen_crop         JSON            NULL COMMENT '{zoom, x, y}',
    activo              TINYINT(1)      NOT NULL DEFAULT 1,
    created_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_eventos_categoria (categoria_evento_id),
    KEY idx_eventos_activo (activo)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`)
console.log('✔  tb_eventos creada')

// ── 5. tb_locales ──────────────────────────────────────────────────────────
await conn.query(`
  CREATE TABLE IF NOT EXISTS tb_locales (
    id                   INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    nombre               VARCHAR(200)    NOT NULL,
    direccion            VARCHAR(200)    NULL,
    categoria_barrio_id  INT UNSIGNED    NULL COMMENT 'FK tb_categorias tipo=local',
    imagen               VARCHAR(500)    NULL COMMENT 'Ruta relativa /uploads/locales/...',
    imagen_crop          JSON            NULL COMMENT '{zoom, x, y}',
    activo               TINYINT(1)      NOT NULL DEFAULT 1,
    created_at           DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at           DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_locales_categoria (categoria_barrio_id),
    KEY idx_locales_activo (activo)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`)
console.log('✔  tb_locales creada')

// ── Resumen ────────────────────────────────────────────────────────────────
const [tables] = await conn.query(`
  SELECT TABLE_NAME, TABLE_ROWS
  FROM information_schema.TABLES
  WHERE TABLE_SCHEMA = ? AND TABLE_NAME LIKE 'tb_%'
  ORDER BY TABLE_NAME
`, [process.env.DB_NAME])

console.log('\n📋  Tablas tb_ en la base de datos:')
tables.forEach(r => console.log(`   • ${r.TABLE_NAME}`))

await conn.end()
console.log('\n🎉  Listo.')
