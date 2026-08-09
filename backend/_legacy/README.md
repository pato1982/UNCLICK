# Scripts históricos — NO usar

Estos scripts crearon el esquema de forma incremental antes de que existieran
`backend/schema.sql` + `backend/migrations/`. Se conservan como registro, pero
**ninguno debe ejecutarse**: el esquema hoy se construye con
`npm run db:setup` (ver `LEVANTAR-LOCAL.md`).

Por qué se retiraron del uso:

| Script | Motivo |
|---|---|
| `setup-db.js` | **Peligroso.** Crea tablas legacy duplicadas (`listings`, `tours`, `turismo_negocios`, `analytics_eventos`) en paralelo a las `tb_*` reales, y declara `rol ENUM('usuario','admin')` cuando el esquema real usa `ENUM('usuario','programador')`. |
| `fix-analytics-tables.mjs` | **Peligroso.** Hace `DROP TABLE` de las tablas de analytics y las recrea con una forma distinta a `schema.sql`. Además ignora `.env`: la conexión está hardcodeada a `127.0.0.1:3306 root/''`. |
| `migrate-fase1-locales-eventos.mjs`, `migrate-logo-size.mjs` | Ya cubiertos por `migrations/002_tablas_faltantes.sql` y `003_local_dev_gaps.sql`. Además cargaban un `.env` de la raíz del repo que no existe, cayendo en silencio a `3306/root/''`. |
| `create-*.js`, `add-*.js` | Parches DDL de una sola vez, todos absorbidos por `schema.sql` y las migraciones. |
| `seed-qa.mjs` | Reemplazado por `db/seeds/02_usuarios.mjs` + `03_contenido.mjs`. El viejo escribía URLs de `images.unsplash.com` (el ambiente local no servía sin internet), hasheaba con bcrypt cost 10 en vez de 12, no creaba ningún usuario `programador`, y cargaba el `.env` por CWD. Tener dos seeds de usuarios compitiendo es justo la deriva que se quiso cerrar. |
| `seed-imagenes.mjs` | Descargaba 24 fotos de Unsplash y hacía `UPDATE ... WHERE titulo = ?` sobre filas que ya no se llaman así. Los `.webp` que generaba están versionados en `uploads/` y el seed nuevo los referencia directo. |

Si hace falta rescatar lógica de aquí, portarla a una migración nueva en
`backend/migrations/` con guards de `information_schema` (el patrón de
`001_gaps_mysql8.sql`), nunca ejecutar estos archivos directamente.
