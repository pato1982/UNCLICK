# Migraciones — UNCLICK

Cambios de schema versionados y aplicados en orden. Cada archivo es **idempotente**: re-ejecutarlo no falla ni duplica datos.

## 001_gaps.sql — Cierre de gaps estructurales

Cierra los gaps reales detectados en la auditoría del modelo de datos. Antes de esta migración, la BD real estaba desincronizada del `schema.sql` y dos features de auth estaban **rotas** (referenciaban objetos inexistentes).

### Qué hace

| Bloque | Cambio | Gap |
|---|---|---|
| 1 | Crea `tb_historial_seguridad` (auditoría de cuenta). FK `ON DELETE SET NULL` para que la auditoría sobreviva al borrado del usuario. | P0 — `auth.js` ya insertaba aquí |
| 2 | `usuarios.eliminacion_programada_at` + índice (período de gracia de borrado). | P0 — `auth.js` ya lo leía |
| 3 | Crea `tb_listing_imagenes` (galería múltiple por listing, 1:N). | GAP-01 |
| 4 | Crea `tb_listing_variantes` (talla/color/material con SKU + stock, 1:N). | GAP-04 / GAP-05 |
| 5 | `tb_listings` + `stock`, `stock_minimo`, `sku`, envío (`peso_gramos`, `alto/ancho/profundidad_cm`, `envio_disponible`, `retiro_local`, `costo_envio`) + índice `idx_listings_sku`. | GAP-02 / GAP-05 / GAP-06 |
| 6 | Migra la `imagen` actual de cada listing a `tb_listing_imagenes` como principal (~150 filas). La columna `imagen` se **conserva** como cache de la principal. | GAP-01 |
| 7 | FK `tb_subcategorias.categoria_id → tb_categorias(id)` ON DELETE CASCADE. | GAP-21 |

Los gaps GAP-03 (`activo`), GAP-14 (`planes.tipo`/`precio_neto`), GAP-15 (`usuarios.updated_at`) y GAP-19 (índices de filtro) **ya estaban resueltos** en la BD real y solo faltaba reflejarlos en `schema.sql`.

### Cómo aplicar

```bash
# XAMPP MariaDB (puerto 3308, root sin password en local)
"C:\xampp\mysql\bin\mysql.exe" -u root -h 127.0.0.1 -P 3308 unclik < backend/migrations/001_gaps.sql

# Backup previo recomendado:
mysqldump -u root -h 127.0.0.1 -P 3308 --databases unclik --routines --triggers > backup.sql
```

La migración termina imprimiendo una tabla de verificación (imágenes sembradas, tablas/columnas/FK creadas). Tras un run correcto: `tb_listing_imagenes` tiene una fila por cada listing con imagen.

### Idempotencia

- Tablas: `CREATE TABLE IF NOT EXISTS`.
- Columnas/índices: `ADD COLUMN IF NOT EXISTS` / `ADD INDEX IF NOT EXISTS` (MariaDB 10.4).
- FK del bloque 7: `ADD CONSTRAINT` no acepta `IF NOT EXISTS` en MariaDB 10.4 → guard con `information_schema.TABLE_CONSTRAINTS` + `PREPARE`.
- Bloque 6: el `INSERT ... SELECT` usa `NOT EXISTS` para no re-sembrar listings que ya tienen galería.

## Relación con `schema.sql`

`backend/schema.sql` ya refleja el estado **post-migración 001** y es la fuente de verdad para levantar la BD desde cero. Las migraciones son el historial de cómo se llegó ahí; `schema.sql` es el destino. Al crear una BD nueva con `schema.sql` no hace falta correr `001_gaps.sql` (ya está incorporado).
