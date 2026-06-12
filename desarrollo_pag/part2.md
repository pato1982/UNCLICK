# Sanmaaunclick — Plan de Desarrollo · Parte 2
**Conexión de paneles administrativos al backend**  
Continuación de `part1.md` — Backend Express + MySQL `unclik`

---

## Resumen de lo realizado

En esta etapa se conectaron los **4 paneles de administración** al backend, se implementó el sistema de **upload y compresión de imágenes**, y se verificó el funcionamiento completo con un test automatizado de **51 endpoints**.

---

## Paso 0 — Compresión automática de imágenes (Sharp)

> ✅ **COMPLETADO**

Antes de implementar las rutas, se identificó un problema crítico: sin compresión, miles de usuarios subiendo fotos de celular (3-10 MB cada una) colapsarían el servidor y el almacenamiento.

**Solución:** instalar `sharp` — librería C++ que procesa imágenes en memoria antes de guardarlas a disco.

**Instalación:**
```bash
npm install sharp
```

**Archivo creado:** `backend/middleware/upload.js`

**Cómo funciona:**
1. Multer recibe la imagen en **memoria** (no escribe a disco directamente)
2. Sharp la redimensiona a máximo **1200×1200 px** (sin distorsión, sin agrandar)
3. La convierte a formato **WebP** con calidad 82
4. Recién ahí la escribe al disco en la carpeta correspondiente

**Resultado del proceso:**

| Origen | Tamaño original | Después de Sharp |
|--------|:-----------:|:----------------:|
| Foto de celular | 3 – 8 MB | ~80 – 200 KB |
| Foto DSLR | 10 – 20 MB | ~150 – 300 KB |
| Reducción promedio | — | **30× a 50×** |

**Límite de aceptación:** 30 MB (el usuario puede subir fotos muy pesadas, Sharp las achica igual)

**Formato de salida:** siempre `.webp` — mismo ojo visual, menor peso que jpeg/png

**Middleware exportado:** `uploadImagen(carpeta)` — reutilizable en todas las rutas

---

## Paso 1 — Multer + ruta de upload

> ✅ **COMPLETADO**

**Ruta implementada:**
```
POST /api/v1/upload?tipo=productos
```

**Carpetas disponibles:** `productos` · `servicios` · `arriendos` · `turismo` · `locales` · `eventos`

**Comportamiento especial:** si no se envía `?tipo=`, la imagen se guarda en `productos` por defecto (necesario para `AdminProductos.jsx` que no envía el parámetro).

**Respuesta:**
```json
{ "url": "/uploads/productos/1718300000000-abc123.webp" }
```

**Express sirve las imágenes estáticamente:**
```
GET /uploads/productos/archivo.webp → archivo físico en backend/uploads/productos/
```

---

## Paso 2 — Rutas de categorías

> ✅ **COMPLETADO**

**Archivo creado:** `backend/routes/categorias.js`

**Rutas implementadas:**

| Ruta | Descripción |
|------|-------------|
| `GET /api/v1/categorias?tipo=turismo` | Categorías filtradas por tipo |
| `GET /api/v1/categorias?tipo=producto,servicio,arriendo` | Múltiples tipos en una sola consulta |
| `GET /api/v1/categorias` | Todas las categorías |
| `GET /api/v1/eventos/categorias` | Alias → tipo=evento (para ProgramadorEventos) |
| `GET /api/v1/locales/categorias` | Alias → tipo=local (para ProgramadorLocales) |

**Característica clave — subcategorías anidadas:**  
`AdminProductos.jsx` espera las subcategorías dentro de cada categoría, no en una llamada separada. La respuesta incluye:

```json
{
  "categorias": [
    {
      "id": 1,
      "nombre": "Vestuario y Calzado",
      "icono": "checkroom",
      "tipo": "producto",
      "subcategorias": [
        { "id": 10, "nombre": "Poleras" },
        { "id": 11, "nombre": "Jeans" }
      ]
    }
  ]
}
```

Se implementó con **2 queries** (categorías + subcategorías) y mapeo en JS — más limpio que GROUP_CONCAT.

---

## Paso 3 — CRUD Eventos

> ✅ **COMPLETADO**

**Archivo creado:** `backend/routes/eventos.js`  
**Panel conectado:** `ProgramadorEventos.jsx`  
**Tabla:** `tb_eventos`

**Rutas implementadas:**

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/v1/eventos/admin` | Lista todos con JOIN a tb_categorias |
| POST | `/api/v1/eventos` | Crea evento con imagen opcional (FormData) |
| PUT | `/api/v1/eventos/:id` | Actualiza — reemplaza imagen si viene nueva |
| DELETE | `/api/v1/eventos/:id` | Elimina registro **e imagen del disco** |
| PATCH | `/api/v1/eventos/:id/toggle` | Activa / desactiva visibilidad |
| PATCH | `/api/v1/eventos/:id/crop` | Guarda encuadre `{zoom, x, y}` |

**Notas de implementación:**
- Imagen se procesa con Sharp antes de guardar
- Al actualizar, si llega nueva imagen se elimina la anterior del disco (`fs/promises unlink`)
- GET admin hace LEFT JOIN con tb_categorias para traer nombre e ícono de la categoría

---

## Paso 4 — CRUD Locales de Barrio

> ✅ **COMPLETADO**

**Archivo creado:** `backend/routes/locales.js`  
**Panel conectado:** `ProgramadorLocales.jsx`  
**Tabla:** `tb_locales`

**Rutas implementadas:**

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/v1/locales/admin` | Lista todos con JOIN a tb_categorias |
| POST | `/api/v1/locales` | Crea local con imagen opcional (FormData) |
| PUT | `/api/v1/locales/:id` | Actualiza — reemplaza imagen si viene nueva |
| DELETE | `/api/v1/locales/:id` | Elimina registro e imagen del disco |
| PATCH | `/api/v1/locales/:id/toggle` | Activa / desactiva visibilidad |
| PATCH | `/api/v1/locales/:id/crop` | Guarda encuadre `{zoom, x, y}` |

Misma arquitectura que Eventos. Reutiliza `uploadImagen('locales')` del middleware compartido.

---

## Paso 5 — CRUD Listings (Productos / Servicios / Arriendos)

> ✅ **COMPLETADO**

**Archivo creado:** `backend/routes/listings.js`  
**Panel conectado:** `AdminProductos.jsx`  
**Tabla:** `tb_listings`

**Diferencia clave respecto a Eventos/Locales:**  
`AdminProductos` sube la imagen primero (`POST /api/v1/upload`), la recorta en el cliente, y luego envía el body como **JSON** con la URL ya incluida. No usa FormData en el POST/PUT.

**Rutas implementadas:**

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/v1/listings/mine` | Lista todos (filtrará por usuario cuando haya auth) |
| POST | `/api/v1/listings` | Crea listing — body JSON |
| PUT | `/api/v1/listings/:id` | Actualiza listing — body JSON |
| DELETE | `/api/v1/listings/:id` | Elimina listing |

**Campos del body JSON:**
```
tipo · seccion · nombre · descripcion · precio · precio_original
categoria · categoria_id · subcategoria · subcategoria_id
badge · genero · imagen · tallas (JSON) · medidas (JSON)
```

**Validaciones:**
- `tipo` debe ser `producto`, `servicio` o `arriendo` — rechaza con 400 si no
- `seccion` se valida contra lista permitida — fallback a `destacados` si inválida
- `tallas` y `medidas` se serializan como JSON string antes de guardar

---

## Paso 6 — CRUD Tours (Turismo)

> ✅ **COMPLETADO**

**Archivo creado:** `backend/routes/tours.js`  
**Panel conectado:** `AdminTour.jsx`  
**Tabla:** `tb_tours`

**Rutas implementadas:**

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/v1/tours` | Lista todos con imágenes y crops parseados |
| POST | `/api/v1/tours` | Crea tour — body JSON con array de URLs |
| PUT | `/api/v1/tours/:id` | Actualiza tour |
| DELETE | `/api/v1/tours/:id` | Elimina tour |
| PATCH | `/api/v1/tours/:id/crop` | Guarda array de 3 crops `[{zoom,x,y}, ...]` |

**Particularidades de Tours:**
- Soporta **3 imágenes** subidas en paralelo por el panel
- `imagen_principal` es el índice (0, 1 o 2) de la imagen a mostrar en portada
- `imagenes_crop` es un array de 3 objetos de encuadre, uno por imagen
- **`categoria_id` se resuelve automáticamente** en el backend: si llega `categoria: "Aventura y Deportes Extremos"`, se hace un `SELECT id FROM tb_categorias WHERE nombre = ? AND tipo = 'turismo'` y se guarda el id — el frontend solo manda el texto
- GET parsea `imagenes` e `imagenes_crop` de JSON string a array antes de responder

---

## Estado del server.js al finalizar la Parte 2

```
backend/
├── server.js              ← pool + middlewares + monta todas las rutas
├── middleware/
│   └── upload.js          ← multer memoria + sharp + guardarImagen()
└── routes/
    ├── categorias.js      ← GET categorías con subs anidadas
    ├── eventos.js         ← CRUD + toggle + crop
    ├── locales.js         ← CRUD + toggle + crop
    ├── listings.js        ← CRUD (JSON body)
    └── tours.js           ← CRUD + crop (JSON body, 3 imágenes)
```

---

## Test automatizado — 51/51 pasaron

> ✅ **COMPLETADO**

**Archivo:** `backend/test-api.js`  
**Ejecución:** `node -e "import('./server.js').then(async () => { await new Promise(r => setTimeout(r, 1500)); await import('./test-api.js') })"`

### Resultados por módulo

| Módulo | Tests | Resultado |
|--------|:-----:|:---------:|
| Health check | 2 | ✅ 2/2 |
| Categorías (4 rutas) | 6 | ✅ 6/6 |
| Upload + compresión WebP | 5 | ✅ 5/5 |
| Eventos (CRUD + toggle + crop) | 11 | ✅ 11/11 |
| Locales (CRUD + toggle + crop) | 8 | ✅ 8/8 |
| Listings (CRUD + validación tipo) | 9 | ✅ 9/9 |
| Tours (CRUD + crop + JSON parsing) | 10 | ✅ 10/10 |
| **Total** | **51** | **✅ 51/51** |

### Problema encontrado y corregido durante el test

**❌ Fallo inicial:** 5 tests de upload retornaron error 500.

**Causa:** El buffer PNG generado en el test tenía la cadena hexadecimal mal formada — no era una imagen válida que Sharp pudiera procesar.

**Corrección:** Se reemplazó el buffer manual por una imagen generada directamente con Sharp:
```js
// Antes (inválido)
const png1x1 = Buffer.from('89504e470d0a...hex incorrecto...', 'hex')

// Después (válido)
const imgBuffer = await sharp({
  create: { width: 100, height: 100, channels: 3, background: { r: 220, g: 50, b: 50 } }
}).jpeg().toBuffer()
```

**Resultado tras corrección:** 51/51 ✅

---

## Paneles conectados al finalizar la Parte 2

| Panel | Tipo de usuario | Estado |
|-------|----------------|--------|
| `ProgramadorEventos.jsx` | Programador | ✅ Conectado |
| `ProgramadorLocales.jsx` | Programador | ✅ Conectado |
| `AdminProductos.jsx` | Usuario general | ✅ Conectado |
| `AdminTour.jsx` | Usuario turismo | ✅ Conectado |

---

## Pendiente para Parte 3

- Sistema de usuarios (`planes` + `usuarios` + `sesiones` en `unclik`)
- Autenticación: registro, login, middleware de sesión
- Activar FKs: `tb_listings.usuario_id` y `tb_tours.usuario_id` → `usuarios.id`
- Filtrar `GET /api/v1/listings/mine` por usuario autenticado
- Panel AdminBanner (aún sin rutas backend)
- Prueba visual en el browser con ambos servidores corriendo
