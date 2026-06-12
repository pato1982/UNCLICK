# Sanmaaunclick — Plan de Desarrollo · Parte 3
**Plan de trabajo — Usuarios, autenticación y paneles pendientes**  
Continuación de `part2.md`

---

## Mapa de tipos de usuario

El proyecto tiene **3 roles** con paneles completamente distintos:

```
┌─────────────────────────────────────────────────────────────────┐
│  ROL: usuario · tipo_cuenta: general                            │
│  Planes: 1 (Gratis) · 2 (Normal) · 3 (Premium)                 │
│  Opciones: vende_productos · ofrece_servicios · ofrece_arriendos│
│                                                                 │
│  Panel base (todos los planes):                                 │
│    → Mi Negocio       /admin/negocio                            │
│    → Productos        /admin          (según opciones elegidas) │
│                                                                 │
│  Panel Premium (plan 3):                                        │
│    → Banner           /admin/banner                             │
│    → Apariencia       /admin/apariencia                         │
│    → Estadísticas     /admin/estadisticas                       │
├─────────────────────────────────────────────────────────────────┤
│  ROL: usuario · tipo_cuenta: turismo                            │
│  Planes: 1 (Gratis) · 3 (Premium) — el plan 2 no existe aquí   │
│                                                                 │
│  Panel base (todos los planes):                                 │
│    → Mi Negocio       /admin/negocio                            │
│    → Portada          /admin/portada                            │
│                                                                 │
│  Panel Premium (plan 3):                                        │
│    → Mi Página        /admin/pagina                             │
│    → Tour             /admin/tour     ← ya conectado ✅         │
│    → Estadísticas     /admin/estadisticas                       │
├─────────────────────────────────────────────────────────────────┤
│  ROL: programador                                               │
│  Sin tipo_cuenta ni plan — acceso total                         │
│                                                                 │
│    → Locales de Barrio  /admin/programador/locales  ← ya ✅    │
│    → Próximos Eventos   /admin/programador/eventos  ← ya ✅    │
│    → Estadísticas       /admin/programador/estadisticas         │
│    → Servidor           /admin/programador/servidor             │
└─────────────────────────────────────────────────────────────────┘
```

---

## Estado actual de los paneles

| Panel | Ruta | Tipo usuario | Backend | Estado |
|-------|------|-------------|:-------:|--------|
| Productos/Servicios/Arriendos | /admin | general | ✅ | Conectado |
| Tour | /admin/tour | turismo | ✅ | Conectado |
| Locales de Barrio | /admin/programador/locales | programador | ✅ | Conectado |
| Próximos Eventos | /admin/programador/eventos | programador | ✅ | Conectado |
| Login / Registro | / o /login | público | ✅ | **Implementado** |
| Mi Negocio | /admin/negocio | general + turismo | ✅ | **Implementado** |
| Banner | /admin/banner | general plan 3 | ✅ | **Implementado** |
| Apariencia | /admin/apariencia | general plan 3 | ✅ | **Implementado** |
| Portada | /admin/portada | turismo | ✅ | **Implementado** |
| Mi Página | /admin/pagina | turismo plan 5 | ✅ | **Implementado** |
| Estadísticas usuario | /admin/estadisticas | general + turismo | ✅ | **Implementado** |
| Estadísticas programador | /admin/programador/estadisticas | programador | ✅ | **Implementado** |
| Monitor de plataforma | /admin/programador/servidor | programador | ✅ | **Implementado** |

---

## Plan de trabajo — Fase por fase

---

### FASE 1 — Sistema de usuarios y autenticación
> **Prioridad máxima — todo lo demás depende de esto**

Sin autenticación, los paneles de usuario no saben quién está logueado, no pueden filtrar datos propios, y no pueden aplicar restricciones de plan.

#### 1.1 Crear tablas en `unclik`
Ejecutar el script de setup para crear en la base de datos:
- `planes` — define los 5 planes con sus límites
- `usuarios` — registro con tipo_cuenta, plan_id, opciones
- `sesiones` — tokens de sesión (o usar JWT)
- `negocios` — perfil de negocio general
- `turismo_negocios` — perfil de negocio turismo
- `portadas` — portada pública de turismo
- `paginas` — página premium de turismo

#### 1.2 Rutas de autenticación
```
POST /api/v1/auth/register   → crea usuario + negocio vacío según tipo
POST /api/v1/auth/login      → valida credenciales, crea sesión
GET  /api/v1/auth/me         → retorna usuario actual (ProtectedRoute lo usa)
POST /api/v1/auth/logout     → elimina sesión
```

#### 1.3 Middleware de sesión
- Verificar token en cada request protegido
- Adjuntar `req.usuario` con todos los campos del usuario
- Rechazar con 401 si token inválido o expirado

#### 1.4 Activar FKs y filtros
- Activar FK: `tb_listings.usuario_id → usuarios.id`
- Activar FK: `tb_tours.usuario_id → usuarios.id`
- Modificar `GET /api/v1/listings/mine` para filtrar por `req.usuario.id`
- Modificar `GET /api/v1/tours` para filtrar por `req.usuario.id`
- Agregar control de límite de plan al crear listings y tours

#### 1.5 Formulario de registro en frontend
El registro pide:
- Nombre, email, contraseña
- Tipo de cuenta: general o turismo
- Si general: checkboxes de productos / servicios / arriendos
- Plan elegido (con precios)

---

### FASE 2 — Panel Mi Negocio (general + turismo)
> Depende de Fase 1 (necesita saber el usuario)

Ambos tipos de usuario tienen este panel pero con campos distintos:

**General:** nombre_negocio, slogan (plan ≥ 2), descripcion, direccion, whatsapp, telefono, correo, facebook, instagram, horarios (JSON)

**Turismo:** igual pero sin slogan, con campos propios de turismo

```
GET  /api/v1/negocio     → datos del negocio del usuario logueado
POST /api/v1/negocio     → crea negocio (si no existe)
PUT  /api/v1/negocio     → actualiza datos del negocio
```

---

### FASE 3 — Panel Portada (turismo)
> Depende de Fase 1 y 2

La portada es la carta de presentación pública del negocio turístico. Tiene imágenes múltiples con crop.

```
GET  /api/v1/portada     → portada del usuario turismo logueado
PUT  /api/v1/portada     → actualiza portada (imágenes, descripción, contacto)
PATCH /api/v1/portada/crop → guarda encuadres de imágenes
```

---

### FASE 4 — Panel Mi Página (turismo, plan 3)
> Depende de Fase 1 y 2

Página personalizada accesible vía `/?turismo={id}`. Tiene secciones superior e inferior con imagen, título y texto.

```
GET  /api/v1/pagina      → página del usuario turismo logueado
PUT  /api/v1/pagina      → guarda contenido de la página
PATCH /api/v1/pagina/crop → guarda crops de imágenes
```

---

### FASE 5 — Panel Banner (general, plan 3)
> Depende de Fase 1

Los banners usan los mismos registros de `tb_listings` pero con los campos `banner_orden`, `banner_pos_x`, `banner_pos_y`, `banner_scale`. El panel permite ordenar y encuadrar los productos que aparecen en el banner.

```
GET  /api/v1/banner           → listings del usuario con banner_orden no nulo
PUT  /api/v1/banner/:id       → actualiza campos banner_* de un listing
PATCH /api/v1/banner/orden    → reordena todos los banners del usuario
DELETE /api/v1/banner/:id     → quita un listing del banner (banner_orden = null)
```

---

### FASE 6 — Panel Apariencia (general, plan 3)
> Depende de Fase 2 (usa tabla negocios)

Personalización de colores y estilos del perfil público del negocio. Los campos ya están en la tabla `negocios`:
`header_preset`, `header_color`, `header_height`, `header_bar`, `banner_color`, `services_color`, `arriendos_color`, `sidebar_color`, `sidebar_accent`, `sidebar_style`, `nav_color`, `nav_style`

```
GET /api/v1/apariencia   → (mismo que GET /negocio, extrae campos de estilo)
PUT /api/v1/apariencia   → guarda solo los campos de estilo
```

---

### FASE 7 — Estadísticas
> Depende de Fase 1 — dos variantes: usuario y programador

#### 7.1 Estadísticas de usuario (general + turismo, plan 3)
Métricas propias del negocio: visitas, clicks en WhatsApp, productos vistos, etc.
Requiere crear tabla `analytics_eventos` y empezar a registrar eventos.

```
GET /api/v1/estadisticas        → KPIs del usuario logueado
GET /api/v1/estadisticas/grafico → datos para gráficos por período
```

#### 7.2 Estadísticas del programador
Vista global del servidor: total usuarios, registros por tipo, listings activos, tours, eventos, etc.

```
GET /api/v1/programador/estadisticas  → resumen global de la plataforma
```

---

### FASE 8 — Panel Servidor (programador)
> Independiente — no necesita auth de usuario normal

Panel de monitoreo técnico del servidor: uso de memoria, CPU, uptime, últimas conexiones, logs.

```
GET /api/v1/programador/servidor   → métricas del servidor (process.memoryUsage, uptime)
GET /api/v1/programador/logs       → últimas líneas de log
```

---

## Orden de ejecución recomendado

```
Fase 1 — Auth           ████████████████████  CRÍTICO — todo depende de esto
Fase 2 — Mi Negocio     ████████████          Inmediato tras auth
Fase 3 — Portada        ████████              Desbloquea turismo
Fase 5 — Banner         ██████                Desbloquea general plan 3
Fase 4 — Mi Página      ██████                Desbloquea turismo plan 3
Fase 6 — Apariencia     ████                  Depende de negocio
Fase 7 — Estadísticas   ████                  Puede ir en paralelo con fases 3-6
Fase 8 — Servidor       ██                    Puede ir en cualquier momento
```

---

## Tablas que hay que crear en `unclik` para arrancar la Fase 1

Todas están diseñadas en `backend/setup-db.js`, solo falta ejecutarlas:

| Tabla | Para qué |
|-------|---------|
| `planes` | Define planes y límites de publicaciones |
| `usuarios` | Registro de usuarios con tipo, plan y opciones |
| `sesiones` | Tokens de autenticación |
| `negocios` | Perfil de negocio general (colores, horarios, contacto) |
| `turismo_negocios` | Perfil de negocio turismo |
| `portadas` | Portada pública turismo (imágenes + crops) |
| `paginas` | Página premium turismo |
| `analytics_eventos` | Log de eventos para estadísticas |
| `historial_planes` | Registro de cambios de plan |

---

## Notas importantes

- El frontend ya tiene **48 usuarios QA** en `src/lib/qaUsers.js` (21 general + 8 turismo) con todos los tipos y planes, para testear sin tener que registrarse.
- `ProtectedRoute` ya tiene bypass en DEV con un usuario default `programador`.
- La lógica de bloqueo por plan (popups de "upgrade") ya está en el frontend — el backend solo necesita responder 403 si el plan no alcanza.
- El sistema de sesiones puede implementarse con **tokens en cookie httpOnly** (más seguro) o con JWT en localStorage (más simple para empezar).

---

## ✅ IMPLEMENTACIÓN COMPLETADA — Sesión Part 3

> Todo lo planificado arriba fue implementado y verificado con tests automatizados.  
> Fecha: junio 2026 · Base de datos: `unclik` · Backend: Express + MySQL2 + Sharp

---

### FASE 1 — Autenticación (sesión anterior) ✅

Implementada en la sesión anterior. Resumen:

- Tablas: `planes`, `usuarios`, `sesiones`
- Rutas: `POST /auth/register`, `POST /auth/login`, `GET /auth/me`, `POST /auth/logout`
- Middleware `requireAuth` (cookie `session_token` httpOnly, 30 días)
- Middleware `requirePlan(minPlanId)` y `requireProgramador`
- Aislamiento por `usuario_id` en listings y tours

---

### FASE 2 — Mi Negocio ✅

**Tablas creadas:**

| Tabla | Descripción |
|-------|-------------|
| `negocios` | Perfil único por usuario (UNIQUE usuario_id). Campos: nombre_negocio, slogan, descripcion, direccion, whatsapp, telefono, correo, facebook, instagram, horarios (JSON), logo_url, + 10 campos de apariencia |
| `portadas` | Portada turismo (imagenes JSON, imagenes_crop JSON, categorias JSON) |
| `paginas` | Página premium turismo (crop_superior JSON, crop_inferior JSON) |

**Rutas implementadas:**

```
GET  /api/v1/business          → datos del negocio del usuario (null si no existe)
POST /api/v1/business          → UPSERT completo (texto + apariencia)
PATCH /api/v1/business/logo    → sube logo, comprime con sharp, borra el anterior del disco

GET  /api/v1/portada           → portada del usuario turismo
POST /api/v1/portada           → crea portada (requiere al menos 1 imagen)
PUT  /api/v1/portada/:id       → actualiza portada (con ownership check)
PATCH /api/v1/portada/:id/crop → guarda crops de imágenes

GET  /api/v1/pagina            → página del usuario (libre, solo requireAuth)
POST /api/v1/pagina            → crea página (requiere plan 5)
PUT  /api/v1/pagina/:id        → actualiza página (requiere plan 5)
PATCH /api/v1/pagina/:id/crop  → guarda crop_superior y crop_inferior (requiere plan 5)
```

**Frontend ajustado:**
- `AdminNegocio.jsx` — logo circular 80px, upload con spinner, `credentials: 'include'` corregido
- `AdminPortada.jsx` — URL de upload corregida a `?tipo=portadas`
- `AdminPagina.jsx` — URL de upload corregida a `?tipo=paginas`

---

### FASE 3 (doc) → Phase 3 implementado — Banner + Compresión de imágenes ✅

**Cambios en `backend/routes/listings.js`:**
- POST y PUT aceptan `banner_orden`
- Plan check: `banner_orden != null && plan_id < 3` → 403

**Mejoras globales a `backend/middleware/upload.js`:**
- Límite reducido de 30 MB a **10 MB** (menos picos de RAM bajo carga)
- `.rotate()` — respeta orientación EXIF de fotos de celular
- `effort: 4` — balance velocidad/compresión en WebP
- `.toFile()` en vez de `.toBuffer()` — stream directo al disco, sin acumular en RAM
- `handleUploadError` global — responde 413 para LIMIT_FILE_SIZE, 400 para campo inesperado

---

### FASE 6 (doc) → Phase 4 implementado — Apariencia ✅

**Columnas agregadas a `negocios`:**

```sql
header_preset   VARCHAR(30)  DEFAULT 'marca'
header_color    VARCHAR(7)   DEFAULT '#3B1969'
header_height   TINYINT      DEFAULT 26
header_bar      VARCHAR(20)  DEFAULT 'separada'
banner_color    VARCHAR(20)  DEFAULT '#1a1220'
services_color  VARCHAR(20)  DEFAULT '#0f1a2e'
arriendos_color VARCHAR(20)  DEFAULT '#14241c'
sidebar_style   VARCHAR(20)  DEFAULT 'izquierda'
nav_color       VARCHAR(7)   DEFAULT '#4A2070'
nav_style       VARCHAR(20)  DEFAULT 'borde'
```

Los defaults coinciden exactamente con `DEFAULT_HEADER` en `src/lib/storeHeaderPresets.js`.  
El POST de `/api/v1/business` ya incluye estos campos en el UPSERT.  
El frontend `AdminApariencia.jsx` estaba completo — sin cambios necesarios.

---

### FASE 7 (doc) → Phase 5 implementado — Estadísticas de usuario ✅

**Tablas creadas:**

| Tabla | Descripción |
|-------|-------------|
| `tb_analytics_visitas` | Visitas a tiendas individuales (store_uid, visitor_ip, pagina, created_at) |
| `tb_analytics_clicks` | Clicks en productos y tarjetas turismo (store_uid, entidad_id, tipo, created_at) |

**Rutas implementadas (`backend/routes/analytics.js`):**

```
POST /api/v1/analytics/track   → público (sin sesión)
                                 event_type: 'page_view'    → tb_analytics_visitas
                                 event_type: 'product_click'→ tb_analytics_clicks tipo='producto'
                                 event_type: 'card_click'   → tb_analytics_clicks tipo='card'

GET  /api/v1/analytics/stats   → privado (requireAuth)
                                 Retorna: visitas[6], clicks[6], card_clicks[6] (meses en español)
                                          resumen: {visitas_mes, visitantes_unicos, clicks_mes, por_pagina}
```

**Frontend ajustado:**
- `StorePage.jsx` — ya tenía `trackClick` y `page_view` listos, solo faltaba el endpoint
- `App.jsx` — agregado tracking de `card_click` en `onOpenTour` (tiendas turismo)
- `AdminEstadisticas.jsx` — sin cambios, ya consumía la estructura correcta

---

### FASE 8 (doc) → Phase 6 implementado — Panel Servidor + Monitor ✅

**Tabla creada:**

| Tabla | Descripción |
|-------|-------------|
| `tb_visitas_sitio` | Visitas globales al sitio (ip, pagina, created_at) |

**Rutas implementadas (`backend/routes/servidor.js`):**

```
POST /api/v1/servidor/visita         → público — registra visita al sitio
                                       (llamado desde App.jsx al cargar la home)

GET  /api/v1/servidor/estadisticas   → requireAuth + requireProgramador
                                       Retorna kpis: {total, general_gratis, general_normal,
                                                      general_premium, turismo_gratis, turismo_premium}
                                               visitas: {hoy, promedio_diario, semanales, mensuales,
                                                         total, visitantes_unicos, reiterados}
```

**Rutas implementadas (`backend/routes/monitor.js`):**

```
GET  /api/v1/monitor?limit=N   → requireAuth + requireProgramador
                                  Retorna listings de toda la plataforma JOIN usuarios
                                  (usuario_nombre, usuario_email, plan_id)
                                  Retorna businesses de toda la plataforma JOIN usuarios
                                  Retorna: {listings, businesses, total, businesses_total, generado}
```

**Frontend ajustado:**
- `AdminMonitor.jsx` — corregido a `credentials: 'include'` (era Bearer token sin funcionar)

---

### Archivos nuevos en el backend

```
backend/
├── middleware/
│   ├── upload.js          ← mejorado (10MB, rotate, effort:4, handleUploadError)
│   └── requireAuth.js     ← sin cambios (requireAuth, requirePlan, requireProgramador)
├── routes/
│   ├── business.js        ← GET / + POST (UPSERT texto+apariencia) + PATCH /logo
│   ├── portada.js         ← GET / + POST + PUT /:id + PATCH /:id/crop
│   ├── pagina.js          ← GET / + POST (plan5) + PUT /:id (plan5) + PATCH /:id/crop (plan5)
│   ├── listings.js        ← actualizado con banner_orden + plan check
│   ├── analytics.js       ← POST /track (público) + GET /stats (privado)
│   ├── servidor.js        ← POST /visita (público) + GET /estadisticas (programador)
│   └── monitor.js         ← GET / (programador) — listings+businesses enriquecidos
└── server.js              ← registra todos los routers nuevos
```

---

### Tests automatizados — Resultados finales

Todos los tests corren con `node <archivo>.mjs` desde `backend/`.  
El servidor debe estar activo en `http://localhost:3001`.

| Archivo | Descripción | Resultado |
|---------|-------------|:---------:|
| `test-smoke.mjs` | Auth, sesiones, 401/403 en todos los endpoints protegidos y públicos | **17/17** ✅ |
| `test-banner.mjs` | Banner, compresión WebP, límite 10MB, plan check, aislamiento | **14/14** ✅ |
| `test-apariencia.mjs` | 10 campos de apariencia, UPSERT parcial, defaults | **8/8** ✅ |
| `test-analytics.mjs` | Tracking público, stats privado, 6 meses, visitantes únicos, aislamiento | **19/19** ✅ |
| `test-servidor.mjs` | KPIs usuarios, visitas sitio, monitor con roles, listings enriquecidos | **20/20** ✅ |
| **TOTAL** | | **78/78** ✅ |

**Cobertura de los tests:**
- Autenticación completa: register → login → me → logout → cookie revocada
- 9 endpoints privados verificados como bloqueados sin sesión (401)
- Control de roles: `requireProgramador` bloquea usuarios normales con 403
- Control de planes: banner requiere plan 3, pagina requiere plan 5
- Compresión: JPEG 9KB → WebP 3KB (>50% reducción), rechazo >10MB con 413
- Series temporales: 6 meses con meses en español, relleno de 0s en meses sin datos
- Aislamiento: cada usuario ve solo sus propios datos
- Datos enriquecidos: monitor incluye nombre/email/plan_id del dueño en cada registro
