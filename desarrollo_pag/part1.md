# Sanmaaunclick — Plan de Desarrollo · Parte 1
**Marketplace local Villarrica, Chile**  
Stack: React 18 + Vite + Tailwind CSS + React Router 7 · Express.js + MySQL2

---

## 1. Arquitectura general

```
Frontend (Vite :5173)  ──proxy /api──►  Backend Express (:3001)  ──►  MySQL unclik
```

- **Frontend:** `src/` — React + Tailwind, rutas con React Router 7
- **Backend:** `backend/` — Express ESM (`"type": "module"`), pool MySQL2
- **Base de datos:** `unclik` en MySQL local (127.0.0.1:3306)
- **Imágenes:** guardadas en `backend/uploads/<tipo>/` (excluidas de git)
- **Proxy Vite:** `/api` → `http://localhost:3001` (configurado en `vite.config.js`)

---

## 2. Tipos de usuario (multi-usuario)
> ⚠️ **PENDIENTE — Solo planificado, aún no implementado.** No existe tabla de usuarios ni sistema de registro.

El marketplace tendrá **dos tipos de cuenta** que se definen al registrarse:

| tipo_cuenta | Puede publicar |
|-------------|---------------|
| `general`   | Productos · Servicios · Arriendos |
| `turismo`   | Tours turísticos |

Dentro de `general`, el usuario elige en el registro qué ofrece:
- `vende_productos` (0/1)
- `ofrece_servicios` (0/1)
- `ofrece_arriendos` (0/1)

**Eventos y Locales de barrio** los administra exclusivamente el programador (sin usuario_id).

---

## 3. Planes (límites por usuario)
> ⚠️ **PENDIENTE — Solo planificado, aún no implementado.** La tabla `planes` no existe en `unclik` ni está cargada con datos.

| id | Nombre   | Tipo    | Precio neto | Max publicaciones |
|----|----------|---------|:-----------:|:-----------------:|
| 1  | Gratuito | general |    $0       |         5         |
| 2  | Normal   | general |  $2.990     |        25         |
| 3  | Premium  | general |  $4.990     |       100         |
| 4  | Gratuito | turismo |    $0       |         5         |
| 5  | Premium  | turismo |  $3.990     |        50         |

El límite se aplica en el **backend** al momento de crear una publicación:  
`COUNT(tb_listings WHERE usuario_id = ?) ≥ plan.max_listings → rechazar`

---

## 4. Categorías y Subcategorías
> ✅ **COMPLETADO — Tablas creadas y cargadas con datos.**

### Tablas creadas
- `tb_categorias` — 109 categorías distribuidas en 6 tipos
- `tb_subcategorias` — ~540 subcategorías vinculadas por `categoria_id`

### Distribución por tipo

| tipo     | Categorías |
|----------|:----------:|
| producto |     29     |
| servicio |     20     |
| arriendo |     12     |
| turismo  |     23     |
| evento   |     12     |
| local    |     13     |

### Columnas de `tb_categorias`
```
id · nombre · icono · tipo · created_at
```

### Columnas de `tb_subcategorias`
```
id · categoria_id (FK) · nombre · created_at
```

---

## 5. Tablas de publicaciones (4 tablas)
> ✅ **COMPLETADO — Las 4 tablas están creadas en `unclik` (estructura vacía, sin datos aún).**

### 5.1 `tb_listings` — Productos / Servicios / Arriendos

Administrada por **usuarios tipo `general`** según sus opciones de registro.

| Columna | Tipo | Notas |
|---------|------|-------|
| id | INT UNSIGNED PK | Auto-increment |
| usuario_id | INT UNSIGNED NULL | FK futura → usuarios |
| tipo | ENUM | `producto` · `servicio` · `arriendo` |
| seccion | VARCHAR(60) | destacados · ofertas · novedades · liquidacion · tecnologia · tendencia · servicios · arriendos |
| nombre | VARCHAR(200) | Requerido |
| descripcion | TEXT | |
| precio | INT UNSIGNED | |
| precio_original | INT UNSIGNED NULL | Para mostrar tachado |
| categoria | VARCHAR(80) | Texto del nombre |
| categoria_id | INT UNSIGNED | FK tb_categorias |
| subcategoria | VARCHAR(80) | Texto del nombre |
| subcategoria_id | INT UNSIGNED | FK tb_subcategorias |
| badge | VARCHAR(30) | Nuevo · Oferta · Hot |
| genero | VARCHAR(20) | hombre · mujer · unisex · niño · niña |
| imagen | VARCHAR(500) | Ruta `/uploads/productos/...` |
| imagen_pos_x | FLOAT | Recorte: posición X |
| imagen_pos_y | FLOAT | Recorte: posición Y |
| imagen_scale | FLOAT | Recorte: escala |
| imagen_natural_w | INT | Ancho original de la imagen |
| imagen_natural_h | INT | Alto original de la imagen |
| banner_orden | TINYINT | Posición en banner |
| banner_pos_x | FLOAT | X% posición en banner |
| banner_pos_y | FLOAT | Y% posición en banner |
| banner_scale | FLOAT | Escala en banner |
| tallas | JSON | `{tipo, seleccion[]}` |
| medidas | JSON | `{alto, ancho, profundidad}` |
| activo | TINYINT(1) | Default 1 |
| created_at / updated_at | DATETIME | |

**Tipos de tallas soportadas:**
- `calzado` → tallas 20 al 46
- `ropa` → 2-16, XS-XXXL
- `accesorios` → XS-Único

---

### 5.2 `tb_tours` — Turismo

Administrada por **usuarios tipo `turismo`**.

| Columna | Tipo | Notas |
|---------|------|-------|
| id | INT UNSIGNED PK | |
| usuario_id | INT UNSIGNED NULL | FK futura → usuarios |
| nombre | VARCHAR(200) | |
| categoria | VARCHAR(80) | Texto (tipo=turismo) |
| categoria_id | INT UNSIGNED | FK tb_categorias |
| ubicacion | VARCHAR(200) | |
| detalle | TEXT | |
| precio | INT UNSIGNED NULL | NULL = precio a consultar |
| precio_antes | INT UNSIGNED NULL | |
| imagen_principal | TINYINT | Índice 0-2 de la imagen principal |
| imagenes | JSON | Array de 3 URLs `[img0, img1, img2]` |
| imagenes_crop | JSON | Array de 3 objetos `{zoom, x, y}` |
| activo | TINYINT(1) | Default 1 |
| created_at / updated_at | DATETIME | |

---

### 5.3 `tb_eventos` — Eventos

Administrada **exclusivamente por el programador** (sin usuario_id).  
Panel: `ProgramadorEventos.jsx`

| Columna | Tipo | Notas |
|---------|------|-------|
| id | INT UNSIGNED PK | |
| titulo | VARCHAR(200) | Requerido |
| fecha | VARCHAR(80) | Texto libre: `15 - 17 Mar 2026` |
| ubicacion | VARCHAR(200) | |
| precio | VARCHAR(60) | Texto libre: `$5.000` o `Gratis` |
| categoria_evento_id | INT UNSIGNED | FK tb_categorias tipo=evento |
| imagen | VARCHAR(500) | Ruta `/uploads/eventos/...` |
| imagen_crop | JSON | `{zoom, x, y}` |
| activo | TINYINT(1) | Default 1 |
| created_at / updated_at | DATETIME | |

---

### 5.4 `tb_locales` — Locales de Barrio

Administrada **exclusivamente por el programador** (sin usuario_id).  
Panel: `ProgramadorLocales.jsx`

| Columna | Tipo | Notas |
|---------|------|-------|
| id | INT UNSIGNED PK | |
| nombre | VARCHAR(200) | Requerido |
| direccion | VARCHAR(200) | |
| categoria_barrio_id | INT UNSIGNED | FK tb_categorias tipo=local |
| imagen | VARCHAR(500) | Ruta `/uploads/locales/...` |
| imagen_crop | JSON | `{zoom, x, y}` |
| activo | TINYINT(1) | Default 1 |
| created_at / updated_at | DATETIME | |

---

## 6. Carpetas de imágenes
> ✅ **COMPLETADO — Carpetas creadas en `backend/uploads/`.**

```
backend/
└── uploads/
    ├── productos/
    ├── servicios/
    ├── arriendos/
    ├── turismo/
    ├── locales/
    └── eventos/
```

- Carpetas excluidas de git (`.gitignore` → `backend/uploads`)
- El backend recibe imágenes vía `POST /api/v1/upload` con `multipart/form-data`
- Retorna `{ url: '/uploads/<tipo>/archivo.jpg' }`

---

## 7. Estado actual del backend (`backend/server.js`)
> ✅ **COMPLETADO — Conexión activa. Solo health check, sin rutas de negocio aún.**

```
✅ Conexión MySQL pool (mysql2/promise)
✅ CORS configurado → http://localhost:5173
✅ GET /api/v1/health
```

**Pendiente de implementar:**
- Rutas para categorías y subcategorías
- Rutas CRUD para las 4 tablas de publicaciones
- Middleware de upload de imágenes (multer)
- Sistema de autenticación (usuarios + sesiones + planes)
- Middleware de verificación de sesión y límite de plan

---

## 8. Tablas pendientes de crear en `unclik`
> ⚠️ **PENDIENTE — Diseñadas en `setup-db.js` pero no creadas en la base de datos.**

Estas tablas están **diseñadas** en `backend/setup-db.js` pero **aún no creadas** en la base de datos:

| Tabla | Propósito |
|-------|-----------|
| `planes` | Define los planes y sus límites de publicaciones |
| `usuarios` | Registro de usuarios con plan, tipo_cuenta y opciones |
| `sesiones` | Tokens de autenticación |
| `negocios` | Perfil de empresa para cuentas generales |
| `turismo_negocios` | Perfil de empresa para cuentas turismo |
| `portadas` | Portada pública del negocio turístico |
| `paginas` | Páginas premium (turismo) |
| `historial_planes` | Log de cambios/pagos de planes |

**FK pendientes** (activar al crear tabla `usuarios`):
```sql
ALTER TABLE tb_listings ADD CONSTRAINT fk_listings_usuario
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE;

ALTER TABLE tb_tours ADD CONSTRAINT fk_tours_usuario
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE;
```

---

## 9. Paneles de administración existentes
> ✅ **Paneles de UI creados** · ⚠️ **Sin rutas API — no funcionan aún.**

| Panel | Tipo | Ruta API esperada |
|-------|------|-------------------|
| `AdminProductos.jsx` | Usuario general | `/api/v1/listings` |
| `AdminTour.jsx` | Usuario turismo | `/api/v1/tours` |
| `ProgramadorEventos.jsx` | Programador | `/api/v1/eventos` |
| `ProgramadorLocales.jsx` | Programador | `/api/v1/locales` |
| `AdminBanner.jsx` | Programador | `/api/v1/banner` |

---

## 10. Próximos pasos sugeridos
> ⚠️ **TODO — En orden de prioridad.**

1. **Implementar rutas de categorías** → `GET /api/v1/categorias?tipo=...` y `GET /api/v1/subcategorias?categoria_id=...`
2. **Implementar upload de imágenes** → multer + rutas por tipo
3. **Rutas CRUD de eventos** → activar `ProgramadorEventos.jsx`
4. **Rutas CRUD de locales** → activar `ProgramadorLocales.jsx`
5. **Rutas CRUD de listings** → activar `AdminProductos.jsx`
6. **Rutas CRUD de tours** → activar `AdminTour.jsx`
7. **Sistema de usuarios** → crear tablas `planes` + `usuarios` + `sesiones` en `unclik`, activar FKs
8. **Autenticación** → registro, login, middleware de sesión, control de límites de plan
