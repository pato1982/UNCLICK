# Sanmaaunclick — Plan de Desarrollo · Parte 5
**Panel de turismo: auditoría completa, corrección de bugs y campo ubicación**  
Continuación de `part4.md`

---

## Resumen ejecutivo

Esta parte cubre la auditoría y corrección de todas las secciones del panel de administración de turismo, más la revisión del archivo huérfano `AdminTurismo.jsx` y la implementación del campo `ubicacion` para negocios turísticos.

Secciones auditadas: **Portada · Mi Negocio · Mi Página · Tour · Estadísticas · AdminTurismo**

---

## Bloque 1 — Crop en primera creación (3 componentes)

### Problema
Los tres componentes tenían una guardia `if (portadaId / paginaId / editingId)` que impedía enviar el PATCH de crop cuando el elemento se estaba creando por primera vez. El crop se perdía en toda creación inicial.

### Fix — AdminPortada.jsx
Después del POST que crea la portada y devuelve `data.id`, se envía inmediatamente el PATCH pendiente si hay crops:

```js
const data = await res.json()
if (!portadaId && data.id) {
  setPortadaId(data.id)
  if (form.imagenesCrop.some(Boolean)) {
    fetch(`${API}/api/v1/portada/${data.id}/crop`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' }, credentials: 'include',
      body: JSON.stringify({ imagenes_crop: form.imagenesCrop }),
    }).catch(() => {})
  }
}
setSaved(true)
```

### Fix — AdminPagina.jsx
Mismo patrón. Después del POST:

```js
const data = await res.json()
if (data.id) {
  setPaginaId(data.id)
  if (supCrop || infCrop) {
    fetch(`${API}/api/v1/pagina/${data.id}/crop`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' }, credentials: 'include',
      body: JSON.stringify({ crop_superior: supCrop, crop_inferior: infCrop }),
    }).catch(() => {})
  }
}
setSaved(true)
```

### Fix — AdminTour.jsx
El bloque `if (res.ok)` nunca leía el body de respuesta, por lo que el ID del tour nuevo era inaccesible. Se corrigió leyendo `resData` primero:

```js
const resData = await res.json().catch(() => ({}))
if (res.ok) {
  if (!editingId && resData.tour?.id && form.imagenesCrop.some(Boolean)) {
    fetch(`${API}/api/v1/tours/${resData.tour.id}/crop`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' }, credentials: 'include',
      body: JSON.stringify({ imagenes_crop: form.imagenesCrop }),
    }).catch(() => {})
  }
  fetchTours(); setShowModal(false); setEditingId(null); setForm(emptyForm)
  showToast(editingId ? 'Tour actualizado' : 'Tour creado')
} else {
  setError(resData.error || 'Error al guardar')
}
```

---

## Bloque 2 — Bug crítico: cross-save destruía datos (business.js)

### Problema
El endpoint `POST /api/v1/business` hacía un UPSERT fijo con todas las columnas. Si `AdminNegocio` guardaba (texto/contacto), ponía `null` en todos los campos de apariencia. Si `AdminApariencia` guardaba, ponía `null` en todos los campos de texto. Cualquier guardado destruía los datos del otro módulo.

### Fix — `backend/routes/business.js`
Se reemplazó el UPSERT fijo por:
1. `INSERT IGNORE INTO negocios (usuario_id) VALUES (?)` — crea la fila solo si no existe, respetando defaults del schema
2. UPDATE dinámico que solo toca los campos presentes en `req.body` usando `'key' in b`

```js
const TEXT_FIELDS = [
  'nombre_negocio', 'slogan', 'descripcion', 'ubicacion', 'direccion',
  'whatsapp', 'telefono', 'correo', 'facebook', 'instagram',
]
const APPEARANCE_FIELDS = [
  'header_preset', 'header_color', 'header_bar',
  'banner_color', 'services_color', 'arriendos_color',
  'sidebar_style', 'nav_color', 'nav_style',
]

for (const k of TEXT_FIELDS) {
  if (k in b) { setClauses.push(`${k} = ?`); values.push(b[k] || null) }
}
// igual para APPEARANCE_FIELDS, horarios y header_height
```

---

## Bloque 3 — Crop no aplicado en página pública de turismo (TourismPage.jsx)

### Problema
En `TourismPage.jsx` las variables `cropSup` y `cropInf` se calculaban (líneas 314-315) pero nunca se aplicaban como `style` en los `<img>`. Las imágenes de la página de presentación ignoraban el encuadre guardado.

### Fix
Se aplicó el mismo patrón `scale(zoom) translate(x/zoom px, y/zoom px)` ya usado en los tours:

```jsx
<img src={imgSup} alt={company.name}
  className="w-full h-44 sm:h-52 md:h-64 object-cover"
  style={cropSup && (cropSup.zoom > 1 || cropSup.x || cropSup.y) ? {
    transform: `scale(${cropSup.zoom}) translate(${cropSup.x / cropSup.zoom}px, ${cropSup.y / cropSup.zoom}px)`,
    transformOrigin: 'center center',
  } : undefined}
/>
```
Lo mismo para `imgInf`.

---

## Bloque 4 — Seguridad en PATCH crop de tours

### Problema
`PATCH /api/v1/tours/:id/crop` hacía `UPDATE ... WHERE id = ?` sin validar que el tour perteneciera al usuario autenticado. Cualquier usuario podía modificar el crop de cualquier tour conociendo su ID.

### Fix — `backend/routes/tours.js`

```js
const [result] = await req.pool.query(
  'UPDATE tb_tours SET imagenes_crop = ? WHERE id = ? AND usuario_id = ?',
  [JSON.stringify(req.body.imagenes_crop), req.params.id, req.usuario.id]
)
if (result.affectedRows === 0) return res.status(404).json({ error: 'Tour no encontrado' })
res.json({ ok: true })
```

---

## Bloque 5 — Optimización de imágenes (upload.js)

### Problema
Todos los uploads usaban la misma resolución máxima (1200px) sin importar el destino, y el límite de multer era 10 MB — demasiado peso en RAM bajo carga concurrente.

### Fix — `backend/middleware/upload.js`

Se agregó un mapa de dimensiones máximas por carpeta:

```js
const CARPETA_MAX_DIM = {
  turismo:  900,   // thumbnails en grid de 6 col
  portadas: 900,   // fan de 3 tarjetas con crop
  paginas:  1000,  // secciones a ancho completo en móvil
  negocios: 600,   // logos circulares
}
const DEFAULT_MAX_DIM = 1200
```

Y se redujo el límite de multer de 10 MB a **5 MB**:

```js
limits: { fileSize: 5 * 1024 * 1024 }
```

Resultado: cada imagen procesada pesa 50–150 KB, y el pico de RAM por upload se redujo a la mitad.

---

## Bloque 6 — Correcciones en AdminEstadisticas.jsx

### Fix 1 — LineChart con menos de 2 puntos (división por cero)
`px = usableW / (data.length - 1)` con 1 solo elemento producía `Infinity`, generando coordenadas SVG inválidas y un gráfico invisible.

```js
function LineChart({ data }) {
  if (!data || data.length < 2) {
    return (
      <svg viewBox="0 0 300 150" className="block w-full h-full">
        <text x="150" y="80" textAnchor="middle" fill="#d1d5db"
          style={{ fontSize: '11px', fontWeight: 600 }}>Sin datos aún</text>
      </svg>
    )
  }
  // ...resto sin cambios
}
```

### Fix 2 — Label incorrecto en KPI de turismo
El texto "Clicks en productos" estaba hardcodeado. Para usuarios turismo debe decir "Clicks en tarjeta":

```jsx
<p className="text-[10px] font-semibold text-gray-500 leading-tight">
  {esTurismo ? 'Clicks en tarjeta' : 'Clicks en productos'}
</p>
```

---

## Bloque 7 — AdminTurismo.jsx: diagnóstico y solución

### Diagnóstico
`AdminTurismo.jsx` era un **archivo huérfano** con 5 bugs:

| Bug | Descripción |
|-----|-------------|
| No ruteado | No aparece en router ni en ningún menú — ningún usuario podía acceder |
| Endpoint inexistente | Llamaba a `/api/v1/turismo` que no existe en el backend |
| Sin credentials | POST/PUT/DELETE no enviaban `credentials: 'include'` |
| Campo incorrecto | Usaba `nombre` pero la tabla tiene `nombre_negocio` |
| Columna inexistente | El campo `ubicacion` no existía en la tabla `negocios` |

### Conclusión
La funcionalidad de perfil de negocio turístico ya estaba cubierta por `AdminNegocio.jsx` (que tiene el flag `esTurismo`). El único aporte real de `AdminTurismo.jsx` era el campo `ubicacion`.

### Fix aplicado: agregar `ubicacion` donde corresponde

**`backend/routes/business.js`** — se agregó `ubicacion` a `TEXT_FIELDS`:
```js
const TEXT_FIELDS = [
  'nombre_negocio', 'slogan', 'descripcion', 'ubicacion', 'direccion', ...
]
```

**`src/admin/pages/AdminNegocio.jsx`** — se agregó el campo al form y al JSX (visible solo para turismo users):
```jsx
{esTurismo && (
  <div>
    <label>Ubicación</label>
    <input
      type="text"
      value={form.ubicacion}
      onChange={(e) => update('ubicacion', e.target.value)}
      placeholder="Ej: Villarrica, La Araucanía"
    />
  </div>
)}
```

**`backend/routes/public.js`** — se agregó `n.ubicacion` al query de portadas.

**`src/components/TourismPage.jsx`** — se mapeó `ubicacion` en los 3 bloques donde se construye el objeto `company`, y se muestra en la tarjeta pública:
```jsx
{company.ubicacion && (
  <div className="flex items-center gap-1 mb-1">
    <span className="material-symbols-outlined text-accent text-sm">pin_drop</span>
    <span className="text-[10px] text-slate-500">{company.ubicacion}</span>
  </div>
)}
```

**`backend/create-negocio-table.js`** — columna agregada al CREATE TABLE para nuevas instancias.

**`backend/add-ubicacion-negocios.js`** (nuevo) — script de migración ejecutado exitosamente:
```
✅ Columna `ubicacion` agregada a `negocios`.
```

---

## Archivos modificados en esta parte

| Archivo | Tipo de cambio |
|---------|---------------|
| `src/admin/pages/AdminPortada.jsx` | Fix crop en primera creación |
| `src/admin/pages/AdminPagina.jsx` | Fix crop en primera creación |
| `src/admin/pages/AdminTour.jsx` | Fix crop en primera creación + lectura de respuesta |
| `backend/routes/business.js` | Fix cross-save + campo ubicacion |
| `backend/routes/tours.js` | Fix seguridad PATCH crop |
| `backend/middleware/upload.js` | Optimización dims por carpeta + límite 5 MB |
| `src/admin/pages/AdminEstadisticas.jsx` | Fix LineChart + label KPI turismo |
| `src/components/TourismPage.jsx` | Fix crop imgSup/imgInf + campo ubicacion |
| `src/admin/pages/AdminNegocio.jsx` | Campo ubicacion para turismo users |
| `backend/routes/public.js` | Campo ubicacion en portadas endpoint |
| `backend/create-negocio-table.js` | Columna ubicacion en schema |
| `backend/add-ubicacion-negocios.js` | Script de migración (nuevo) |

---

Continúa en `part6.md`
