# Sanmaaunclick — Lo que falta por hacer
**Generado al cierre de la Parte 5 — 2026-06-11**

Lista verificada de bugs y features pendientes, ordenados por severidad.

---

## 🔴 CRÍTICO — Rompe funcionalidad real

### 1. Banner crop nunca se guarda
**Dónde:** `AdminBanner.jsx` + `backend/routes/listings.js`  
**Qué pasa:** La tabla `tb_listings` tiene columnas `banner_pos_x`, `banner_pos_y`, `banner_scale`. `AdminBanner.jsx` las **lee** al cargar para posicionar la imagen, pero ni el frontend las envía al guardar ni `listings.js` las incluye en el INSERT/UPDATE. Cada vez que el usuario recarga, el encuadre del banner vuelve a los valores por defecto (50, 50, 1).  
**Fix necesario:** Agregar los tres campos al body que envía `AdminBanner.jsx` y al INSERT/UPDATE de `listings.js`.

---

### 2. Registro de usuarios incompleto (4 sub-bugs)
**Dónde:** `backend/routes/auth.js` + `src/components/RegisterModal.jsx`

| Sub-bug | Descripción |
|---------|-------------|
| `data.user` vs `data.usuario` | `RegisterModal.jsx` lee `data.user` pero el backend devuelve `data.usuario` → el usuario queda sin sesión tras registrarse |
| Campos no guardados | `auth.js` no guarda `dni`, `telefono`, `comuna`, `direccion` al registrarse aunque el formulario los recibe |
| Sin auto-crear negocio | Al registrarse no se crea automáticamente una fila vacía en la tabla `negocios` → el usuario entra a "Mi Negocio" y ve error hasta que guarda por primera vez |
| Columna `dni` puede faltar | Si la columna `dni` no fue agregada a la tabla `usuarios` con la migración correspondiente, el INSERT de registro falla |

**Fix necesario:** Corregir los 4 puntos en `auth.js` y `RegisterModal.jsx`.

---

## 🟡 IMPORTANTE — Afecta datos o UX notablemente

### 3. AdminBanner pierde categoria_id al reasignar banner
**Dónde:** `src/admin/pages/AdminBanner.jsx` (función `buildBodyFromItem`)  
**Qué pasa:** Cuando se reasigna un producto como "principal de banner", el body que se construye no incluye `categoria_id` ni `subcategoria_id`. Si el PUT se ejecuta, esos campos quedan en null.  
**Fix necesario:** Incluir `categoria_id` y `subcategoria_id` del item original al reasignar.

---

### 4. Validación de descripción (40 palabras) solo en frontend
**Dónde:** `backend/routes/listings.js`  
**Qué pasa:** `AdminProductos.jsx` limita la descripción a 40 palabras, pero el backend no valida. Un PUT directo a la API puede guardar descripciones más largas.  
**Fix necesario:** Agregar validación en el backend antes del INSERT/UPDATE.

---

### 5. activeStore — verificar segundo bloque de construcción en App.jsx
**Dónde:** `src/App.jsx` (hay 2 bloques donde se construye `activeStore`, ~línea 335 y ~línea 475)  
**Qué pasa:** Se confirmó que el primer bloque tiene los 10 campos de apariencia, pero el segundo bloque (fallback directo desde business API) no fue auditado completamente.  
**Fix necesario:** Confirmar que los 10 campos de apariencia (`header_preset`, `header_color`, `header_height`, `header_bar`, `banner_color`, `services_color`, `arriendos_color`, `sidebar_style`, `nav_color`, `nav_style`) están en ambos bloques.

---

### 6. StorePage — campos sin fallback robusto
**Dónde:** `src/components/StorePage.jsx`  
**Qué pasa:** Usa `store.phone`, `store.email`, `store.address`, `store.name`, `store.description`. `App.jsx` los mapea correctamente pero si alguna fuente falta, el campo queda vacío sin mensaje alternativo.  
**Fix necesario:** Revisar que todos los campos tengan fallbacks adecuados o que el componente maneje la ausencia de datos con gracia.

---

## 🔵 MENOR — No bloquea pero debería corregirse

### 7. Reset de apariencia sin confirmación
**Dónde:** `src/admin/pages/AdminApariencia.jsx`  
**Qué pasa:** El botón "restaurar defaults" por pestaña no pide confirmación. Un click accidental borra todas las personalizaciones sin posibilidad de recuperarlas.  
**Fix necesario:** Agregar un `confirm()` o un modal de confirmación antes de restaurar.

---

### 8. Sin paginación en el marketplace público
**Dónde:** `backend/routes/public.js` — endpoint `GET /api/v1/public/listings`  
**Qué pasa:** Query con `LIMIT 1000` hardcoded. Si la plataforma supera 1000 productos registrados, los más antiguos no aparecen.  
**Fix necesario:** Implementar paginación con `LIMIT` y `OFFSET`, o cursor-based pagination.

---

### 9. AdminTurismo.jsx — archivo huérfano
**Dónde:** `src/admin/pages/AdminTurismo.jsx`  
**Qué pasa:** Archivo sin ruta, sin menú, sin backend. Funcionalidad cubierta por `AdminNegocio.jsx`. No hace daño pero ocupa espacio y puede confundir.  
**Fix necesario:** Eliminar el archivo.

---

### 10. Horarios sin zona horaria
**Dónde:** Tabla `negocios`, columna `horarios` (JSON)  
**Qué pasa:** Los horarios se guardan como `{ apertura: "09:00", cierre: "18:00" }` sin zona horaria. Para usuarios en otra zona horaria los tiempos se leen incorrectamente.  
**Fix necesario:** No urgente hoy, pero si el proyecto se internacionaliza hay que agregar el timezone al JSON de horarios.

---

## Resumen rápido

| # | Qué | Severidad | Archivos involucrados |
|---|-----|-----------|----------------------|
| 1 | Banner crop no se guarda | 🔴 Crítico | `AdminBanner.jsx`, `listings.js` |
| 2 | Registro incompleto (4 sub-bugs) | 🔴 Crítico | `auth.js`, `RegisterModal.jsx` |
| 3 | Banner pierde categoria_id al reasignar | 🟡 Importante | `AdminBanner.jsx` |
| 4 | Validación descripción solo en frontend | 🟡 Importante | `listings.js` |
| 5 | activeStore segundo bloque sin auditar | 🟡 Importante | `App.jsx` |
| 6 | StorePage campos sin fallback | 🟡 Importante | `StorePage.jsx`, `App.jsx` |
| 7 | Reset apariencia sin confirmación | 🔵 Menor | `AdminApariencia.jsx` |
| 8 | Sin paginación en marketplace | 🔵 Menor | `public.js` |
| 9 | AdminTurismo.jsx huérfano | 🔵 Menor | `AdminTurismo.jsx` |
| 10 | Horarios sin timezone | 🔵 Menor | `negocios.horarios` |
