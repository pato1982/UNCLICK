# Sanmaaunclick — Plan de Desarrollo · Parte 4
**Estabilidad, datos públicos y entorno local de desarrollo**  
Continuación de `part3.md`

---

## Resumen ejecutivo

Esta parte cubre tres grandes bloques de trabajo realizados tras completar la Parte 3:

1. **Mejoras de estabilidad** — rate limiting, borrado automático de imágenes viejas, caché en memoria
2. **Corrección del marketplace público** — las páginas de tiendas y el home eran invisibles para visitantes sin cuenta
3. **Entorno local completo** — 29 usuarios QA en la BD real con todos sus datos e imágenes en disco

---

## Bloque 1 — Mejoras de estabilidad

### 1.1 Rate limiting (`express-rate-limit`)

**Archivo:** `backend/server.js`

Se instaló `express-rate-limit` y se aplicaron 4 niveles de límite antes de las rutas:

| Limiter | Ruta | Ventana | Máx. requests |
|---------|------|---------|---------------|
| `limiterAuth` | `/api/v1/auth` | 15 min | 20 |
| `limiterUpload` | `/api/v1/upload` | 1 min | 30 |
| `limiterPublico` | `/api/v1/analytics/track`, `/api/v1/servidor/visita` | 1 min | 120 |
| `limiterGeneral` | `/api/v1` (todo lo demás) | 1 min | 300 |

El de auth protege contra fuerza bruta en login/registro. El de upload evita que un usuario suba imágenes en ráfaga. El público protege los endpoints de tracking que no requieren sesión.

---

### 1.2 Borrado automático de imágenes viejas

**Archivo nuevo:** `backend/lib/files.js`

Utilidades compartidas para eliminar archivos de `/uploads/` del disco:

```js
deleteUpload(url)                          // borra un archivo individual
deleteRemovedUploads(oldUrls, newUrls)     // diff entre arrays, borra solo los removidos
extractUploadUrls(val)                     // extrae /uploads/ de string, array u objeto
```

Se aplicó en cada ruta que modifica imágenes:

| Archivo | Operación | Qué se borra |
|---------|-----------|--------------|
| `routes/listings.js` | PUT + DELETE | `imagen` del listing anterior |
| `routes/pagina.js` | PUT | `imagen_superior` e `imagen_inferior` si fueron reemplazadas |
| `routes/portada.js` | PUT | imágenes removidas del array `imagenes` |
| `routes/tours.js` | PUT + DELETE | imágenes removidas/todas del array `imagenes` |

La eliminación es silenciosa (`.catch(() => {})`) — si el archivo ya no existe, no falla.

---

### 1.3 Caché en memoria (`backend/lib/cache.js`)

**Archivo nuevo:** `backend/lib/cache.js`

Caché TTL simple basado en `Map`, sin Redis:

```js
cached(key, ttlMs, fetchFn)   // retorna del caché si no expiró, ejecuta fetchFn si expiró
invalidate(key)                // invalida una clave
invalidateAll()                // limpia todo el caché
```

Se aplicó en las dos rutas más pesadas:

| Ruta | Clave | TTL |
|------|-------|-----|
| `GET /api/v1/monitor` | `monitor:${limit}` | 30 s |
| `GET /api/v1/servidor/estadisticas` | `servidor:estadisticas` | 30 s |

---

## Bloque 2 — Marketplace público

### Problema identificado

Toda la página principal y las vistas de tienda cargaban vacías para visitantes sin cuenta. La causa: las rutas de listings, portadas y negocios estaban todas bajo `requireAuth`. Un visitante anónimo recibía 401 en todos los fetches de datos.

### Solución

**Archivo nuevo:** `backend/routes/public.js`

Router registrado en `server.js` **antes** de `requireAuth`, con 6 endpoints completamente públicos:

| Endpoint | Descripción |
|----------|-------------|
| `GET /api/v1/public/listings` | Todos los listings activos del marketplace |
| `GET /api/v1/public/portadas` | Todas las portadas de turismo |
| `GET /api/v1/public/tours` | Todos los tours activos |
| `GET /api/v1/public/tours/:userId` | Tours de un operador turístico específico |
| `GET /api/v1/public/business/:userId` | Info pública de un negocio (para vista de tienda) |
| `GET /api/v1/public/pagina/:userId` | Página de presentación pública (turismo) |

El query de `listings` incluye `JOIN` con `usuarios` y `negocios` para devolver `owner_plan_id` (necesario para la mezcla ponderada por plan) y datos de contacto del negocio (`negocio_whatsapp`, `negocio_telefono`, etc.).

### URLs actualizadas en el frontend

| Archivo | URL anterior (rota) | URL nueva (pública) |
|---------|--------------------|--------------------|
| `src/App.jsx` | `/api/v1/listings` | `/api/v1/public/listings` |
| `src/App.jsx` | `/api/v1/portada/public` | `/api/v1/public/portadas` |
| `src/App.jsx` | `/api/v1/business/:userId` (×2) | `/api/v1/public/business/:userId` |
| `src/components/TurismoSection.jsx` | `/api/v1/tours/public` | `/api/v1/public/tours` |
| `src/components/TourismPage.jsx` | `/api/v1/tours/public/:userId` | `/api/v1/public/tours/:userId` |
| `src/components/TourismPage.jsx` | `/api/v1/pagina/public/:userId` | `/api/v1/public/pagina/:userId` |

### Fix adicional: `data.user` → `data.usuario`

Se detectó un bug existente: `LoginModal.jsx` leía `data.user` pero el backend devuelve `{ usuario: ... }`. Resultado: al hacer login real, el usuario quedaba como `undefined` en localStorage. Corregido con:

```js
const u = data.usuario || data.user   // compatible con ambas versiones
```

---

## Bloque 3 — Entorno local completo

### Schema SQL corregido (`backend/schema.sql`)

Se completaron columnas que faltaban en el schema original:

- `usuarios`: añadidos `rol`, `vende_productos`, `ofrece_servicios`, `ofrece_arriendos`, `telefono`, `direccion`, `comuna`
- `tb_actividad_usuarios`: añadido `ip`

### Usuarios QA en la BD real

**Archivo nuevo:** `backend/seed-qa.mjs`

Script que crea en la BD local los 29 usuarios del botón DEV con todos sus datos:

| Tipo | Cantidad | Datos generados |
|------|----------|----------------|
| General Plan 1 | 7 | Negocio + listings (3–7 según caps) |
| General Plan 2 | 7 | Negocio + listings (4–10 según caps) |
| General Plan 3 | 7 | Negocio + listings (5–16 según caps) |
| Turismo Plan 1 | 3 | Negocio + portada + 6 tours |
| Turismo Plan 5 | 5 | Negocio + portada + 6 tours + página premium |

Password de todos: `Dev1234!`  
Imágenes: inicialmente URLs de Unsplash, luego reemplazadas por archivos locales.

### Descarga de imágenes (`backend/download-images.mjs`)

**Archivo nuevo:** `backend/download-images.mjs`

Script que recorre la BD, descarga cada URL externa de Unsplash, la convierte a WebP con Sharp (máx 1200×1200, calidad 82) y actualiza el registro con la ruta local `/uploads/...`.

Tablas e imágenes procesadas:

| Tabla | Campo | Carpeta local |
|-------|-------|---------------|
| `negocios` | `logo_url` | `uploads/negocios/` |
| `tb_listings` tipo producto | `imagen` | `uploads/productos/` |
| `tb_listings` tipo servicio | `imagen` | `uploads/servicios/` |
| `tb_listings` tipo arriendo | `imagen` | `uploads/arriendos/` |
| `tb_tours` | `imagenes` (JSON array) | `uploads/turismo/` |
| `portadas` | `imagenes` (JSON array) | `uploads/portadas/` |
| `paginas` | `imagen_superior`, `imagen_inferior` | `uploads/paginas/` |

**Resultado:** 226 registros actualizados · imágenes disponibles sin conexión a internet.

### Login real desde el botón QA

**Archivo modificado:** `src/components/LoginModal.jsx`

El handler `onLogin` del botón DEV ahora intenta login real contra el backend antes de caer al mock:

```
1. POST /api/v1/auth/login con email + Dev1234!
2. Si responde 200 → sesión real (cookie) → datos de la BD
3. Si falla (backend apagado) → fallback al mock de siempre
```

**Archivo modificado:** `src/lib/qaMockApi.js`

`currentQaUser()` ahora solo activa el mock si `localStorage.dev_user_id` empieza con `'mock-'`. Una sesión real del backend elimina esa clave, por lo que el interceptor no interfiere.

---

## Test de verificación

**Archivo:** `backend/test-seed-qa.mjs`

```
── 1. Health check
  ✅ Backend responde

── 2. Endpoints públicos
  ✅ GET /public/listings → 153 listings
  ✅ Imágenes locales: 150/150
  ✅ Ninguna imagen externa en listings
  ✅ Mezcla de planes: 1, 2, 3
  ✅ GET /public/portadas → 9 portadas con imágenes
  ✅ Portadas con imágenes locales: 9
  ✅ GET /public/tours → 48 tours con imágenes

── 3. Login QA con backend real
  ✅ Login gen_p1_p@qa.dev → plan_id=1 tipo=general
  ✅ Login gen_p2_psa@qa.dev → plan_id=2 tipo=general
  ✅ Login gen_p3_psa@qa.dev → plan_id=3 tipo=general
  ✅ Login tur_p3@qa.dev → plan_id=5 tipo=turismo
  ✅ Login tur_p1@qa.dev → plan_id=1 tipo=turismo

── 4. Datos del panel (autenticado)
  ✅ GET /business → "Almacén Patagonia"
  ✅ GET /listings/mine → 3 listings
  ✅ GET /tours → 6 tours para tur_p3
  ✅ Tours con imágenes: 6/6
  ✅ GET /portada → 4 imágenes (3 locales)
  ✅ GET /pagina → "Bienvenidos a Lácar Expediciones"
  ✅ Imagen superior de página es local

── 5. Vista pública de tienda
  ✅ GET /public/business/40 → "Aire Libre SMA"
  ✅ GET /public/tours/40 → OK

── 6. Rate limiting
  ✅ Rate limiting activo en /auth/login (429 después de 20 intentos)

─────────────────────────────────────
  Total: 26 | ✅ 26 pasaron | ❌ 0 fallaron
─────────────────────────────────────
```

---

## Bloque 4 — Corrección del registro de usuarios

### Problema identificado

Al registrarse, el frontend enviaba `dni`, `telefono`, `comuna` y `direccion` en el cuerpo del POST, pero el backend los ignoraba por completo. Además no existía la columna `dni` en la tabla `usuarios`. El resultado: los datos personales del formulario se perdían sin que el usuario lo supiera.

Un segundo bug: `RegisterModal.jsx` leía `data.user` al terminar el registro, pero el backend devuelve `{ usuario }` (no `{ user }`). Esto dejaba `undefined` en localStorage y la sesión quedaba rota inmediatamente tras el registro.

Un tercer problema: al registrarse no se creaba ninguna entrada en la tabla `negocios`. La primera vez que el usuario abría el panel, el GET `/api/v1/business` devolvía `404` y el panel se romía.

### Correcciones aplicadas

**`backend/schema.sql`** — Columna `dni VARCHAR(20)` añadida a la tabla `usuarios` (después de `ofrece_arriendos`).

**BD local** — `ALTER TABLE usuarios ADD COLUMN dni VARCHAR(20) AFTER ofrece_arriendos` ejecutado sobre la DB `unclik` activa.

**`backend/routes/auth.js`** — 4 cambios en el route `POST /register`:

1. Destructura `dni`, `telefono`, `comuna`, `direccion` del body (con `null` por defecto).
2. Incluye esos 4 campos en el `INSERT INTO usuarios`.
3. Después del INSERT, ejecuta `INSERT IGNORE INTO negocios (usuario_id) VALUES (?)` para crear la entrada vacía del negocio.
4. El `SELECT` de respuesta ahora devuelve `dni`.

Los queries de `POST /login` y `GET /me` también actualizados para devolver `dni` junto con los demás datos del usuario.

**`src/components/RegisterModal.jsx`** — línea 171:

```js
// Antes (roto):
localStorage.setItem('user', JSON.stringify(data.user))   // undefined
onRegisterSuccess(data.user)                               // undefined

// Después:
const u = data.usuario || data.user
localStorage.setItem('user', JSON.stringify(u))
onRegisterSuccess(u)
```

---

## Archivos nuevos y modificados

### Nuevos
| Archivo | Descripción |
|---------|-------------|
| `backend/lib/files.js` | Utilidades de borrado de imágenes del disco |
| `backend/lib/cache.js` | Caché en memoria con TTL |
| `backend/routes/public.js` | Router público (sin auth) para marketplace y tiendas |
| `backend/schema.sql` | Schema SQL completo y corregido |
| `backend/seed-qa.mjs` | Script para poblar usuarios QA en la BD |
| `backend/download-images.mjs` | Script para descargar imágenes a disco local |
| `backend/test-seed-qa.mjs` | Test de verificación del seed y endpoints |

### Modificados
| Archivo | Qué cambió |
|---------|-----------|
| `backend/server.js` | Rate limiters + registro de `publicRouter` |
| `backend/routes/listings.js` | Borrado de imagen al editar/eliminar |
| `backend/routes/pagina.js` | Borrado de imágenes al actualizar |
| `backend/routes/portada.js` | Borrado de imágenes removidas del array |
| `backend/routes/tours.js` | Borrado de imágenes al editar/eliminar |
| `backend/routes/monitor.js` | Caché de 30 s en el query principal |
| `backend/routes/servidor.js` | Caché de 30 s en estadísticas |
| `src/App.jsx` | URLs públicas + fix `data.usuario` |
| `src/components/TurismoSection.jsx` | URL pública de tours |
| `src/components/TourismPage.jsx` | URLs públicas de tours y página |
| `src/components/LoginModal.jsx` | Login real para botón QA + fix `data.usuario` |
| `src/lib/qaMockApi.js` | Mock solo activo en sesiones explícitamente mock |
| `backend/routes/auth.js` | Register guarda dni/telefono/comuna/direccion + auto-crea negocios |
| `src/components/RegisterModal.jsx` | Fix `data.user` → `data.usuario` tras registro exitoso |
