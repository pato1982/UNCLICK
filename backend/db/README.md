# backend/db — Base de datos UNCLICK

## Fuente de verdad

`schema.v0.sql` es el documento canónico de la estructura de la base de datos.
Todo cambio de esquema futuro debe reflejarse en este archivo; el diff de git
es el changelog de estructura.

Los archivos que quedaron como referencia histórica **no deben usarse para
crear entornos nuevos**:

| Archivo | Estado |
|---|---|
| `backend/schema.sql` | Obsoleto (20 tablas, incompleto). Conservado como referencia. |
| `backend/migrate-fase1-locales-eventos.mjs` | Consolidado en v0. |
| `backend/migrate-logo-size.mjs` | Pendiente de aplicar en stage (ver nota al final de `schema.v0.sql`). |

## Cómo trackear cambios de estructura

1. Editar `schema.v0.sql` directamente (DDL `CREATE TABLE IF NOT EXISTS`,
   columnas, índices, seeds).
2. Hacer commit. El diff de git es el registro de qué cambió y cuándo.
3. Para cambios en producción que requieran `ALTER TABLE`, crear adicionalmente
   un archivo numerado en `backend/db/migrations/NNN_descripcion.sql` con la
   sentencia `ALTER` y su `DOWN`, siguiendo el proceso de migración controlada.

## Cómo aplicar a un entorno nuevo

```bash
mysql -u<user> -p<password> <nombre_bd> < backend/db/schema.v0.sql
```

Para las subcategorías (855 filas, referenciadas externamente en el schema):

```bash
sed -n '/LOCK TABLES `tb_subcategorias`/,/UNLOCK TABLES/p' \
  backend/db/_stage_seed_raw.sql | mysql -u<user> -p<password> <nombre_bd>
```

El archivo es idempotente: se puede correr sobre una BD vacía o sobre una
existente sin romper ni duplicar datos.

## Estado de sincronización (a 2026-06-16)

| Entorno | Estado |
|---|---|
| stage (VPS Villarrica) | **v0** — es el origen de este baseline |
| prod | Atrasado — ~20 tablas; le faltan `tb_categorias_locales`, `tb_categorias_eventos` y las columnas `imagen_2`, `imagen_3`, `usuario_id` en `tb_locales` y `tb_eventos`. Pendiente de alinear. |
| local dev | Depende del desarrollador; aplicar `schema.v0.sql` para sincronizar. |

## Archivos en este directorio

| Archivo | Descripción |
|---|---|
| `schema.v0.sql` | Fuente de verdad. 22 tablas + seeds de referencia. |
| `_stage_seed_raw.sql` | Dump original de seeds del stage (incluye tb_subcategorias completo). Referencia, no editar. |
| `_stage_structure_raw.sql` | Dump original `--no-data` del stage. Referencia, no editar. |
