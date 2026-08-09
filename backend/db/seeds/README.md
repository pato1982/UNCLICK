# Seeds de desarrollo

Datos para levantar un ambiente local completo. Se aplican con
`npm run db:setup` desde `backend/` — no ejecutar estos archivos sueltos.

| Archivo | Contenido |
|---|---|
| `01_catalogo.sql` | `tb_categorias` (36) + `tb_subcategorias` (227). IDs explícitos, idempotente. |
| `02_usuarios.mjs` | Cuentas de prueba: un usuario por cada combinación de rol, plan y tipo de cuenta. |
| `03_contenido.mjs` | Negocios, publicaciones, tours, portadas, páginas, locales y eventos. |

Password de todas las cuentas de prueba: **`Dev1234!`**

## Reemplazar el catálogo por el real de producción

`01_catalogo.sql` es **sintético**: coherente con el rubro de Villarrica, pero
no es el catálogo que usa el negocio. El real (109 categorías / ~855
subcategorías) existió solo dentro de `unclik_dump.sql`, que se sacó del
control de versiones en el commit `cb40727` y está en `.gitignore`.

Para reemplazarlo cuando haya acceso al VPS de producción:

```bash
# En el VPS de producción (158.220.123.58), solo estas 2 tablas.
# NO incluye datos de usuarios ni de negocios.
mysqldump --no-tablespaces --skip-add-drop-table --complete-insert \
  -u <usuario> -p unclik tb_categorias tb_subcategorias \
  > 01_catalogo.sql
```

Después, en el archivo generado:

1. Quitar cualquier `CREATE TABLE` (el esquema ya lo define `backend/schema.sql`).
2. Cambiar los `INSERT INTO` por `INSERT ... ON DUPLICATE KEY UPDATE` para que
   siga siendo reaplicable.
3. Verificar que no se coló ninguna columna con datos personales.

El resto de los seeds no depende del contenido del catálogo, así que no hay
que tocar nada más.
