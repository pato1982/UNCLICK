# Avances y Conexiones — Sanmaaunclick

Registro de los cambios realizados y de cómo se conectan las piezas del proyecto.
Última actualización: 2026-06-10

---

## 1. Turismo — Ejemplos basados en Villarrica

**Archivos:**
- `src/components/TurismoSection.jsx` — array `PLACEHOLDER_TOURS`
- `src/admin/pages/AdminTurismo.jsx` — textos placeholder de inputs

**Qué se hizo:**
- Se reescribieron los 10 ejemplos de turismo para que todos sean atracciones reales
  de Villarrica (antes mezclaban Junín de los Andes y lugares de Chile
  como Termas Geométricas / Coñaripe y el Río Trancura).
- Nuevos ejemplos: Cerro Chapelco, Kayak en Lago Lácar, Mirador Bandurrias,
  Cascada Chachín, Canopy Bosque Andino, Playa Catritre, Rafting Río Hua Hum,
  Bosque de Arrayanes Quila Quina, Pesca con Mosca Lago Lolog, Cabalgata Cerro Curruhuinca.
- Todos con `ubicacion: 'Villarrica'`.
- En `AdminTurismo.jsx` se actualizaron los textos de ejemplo de los campos de
  ubicación/dirección (antes sugerían "Junín de los Andes").

**Nota de conexión:** estos son los datos *placeholder* que se muestran cuando la API
(`/api/v1/tours/public`) no devuelve tours. Los datos reales vienen de la base de datos.
El archivo `src/lib/qaMockData.js` ya usaba atracciones de SMA.

---

## 2. Turismo — Vista móvil (2 filas de 2 tarjetas)

**Archivo:** `src/components/TurismoSection.jsx`

**Qué se hizo:**
- En móvil (`< 640px`) la grilla pasó de 3 columnas (6 tarjetas) a **2 columnas
  (4 tarjetas: 2 filas × 2 visibles)**.
- Las tarjetas rotan automáticamente cada 10 s con el efecto *fade* existente.

---

## 3. Turismo — Rango 800–900px (fila de 4 tarjetas rotando)

**Archivo:** `src/components/TurismoSection.jsx`

**Qué se hizo:** se definieron rangos de ancho que NO se solapan:

| Ancho            | Qué se muestra                                  |
|------------------|-------------------------------------------------|
| `< 640px`        | Grilla 2 columnas, 4 tarjetas                   |
| `640–799px`      | Mosaico de escritorio (8 columnas)              |
| `800–900px`      | **1 fila con 4 tarjetas iguales, lado a lado**  |
| `≥ 901px`        | Mosaico de escritorio (8 columnas)              |

**Cómo funciona la conexión de clases:**
- Bloque nuevo: `hidden min-[800px]:max-[900px]:flex` con cada tarjeta en `flex-1`.
- Padding lateral `px-6` solo en ese bloque → pequeño margen con los laterales
  y tarjetas un poco más chicas.
- El mosaico se oculta en ese rango usando rangos disjuntos:
  `hidden min-[640px]:max-[799px]:grid min-[901px]:grid`.
- Las 4 tarjetas rotan con el mismo `fade` cada 10 s (`displayTours` se re-baraja).

---

## 4. Categorías bajo el banner — más chicas en pantallas angostas

**Archivo:** `src/components/CategoryGrid.jsx`

**Qué se hizo:**
- Solo **bajo 510px** (`max-[510px]:`) los 6 botones redondos de categoría
  (Productos, Arriendos, Servicios, Turismo, Locales, Eventos) se achican para que
  entren 4 en pantalla:
  - Imagen: 96px → **72px**
  - Separación: `gap-6` → `gap-2`
  - Padding lateral: `px-3` → `px-2`
  - Texto: 11px → 10px · esquinas `rounded-2xl` → `rounded-xl`
- Arriba de 510px se mantienen los tamaños normales (`sm:`/`md:`).

---

## 5. Panel Apariencia — Altura del header (rango ampliado)

**Archivo:** `src/lib/storeHeaderPresets.js`

**Qué se hizo:**
- `HEADER_PAD_MAX`: 72 → **160** (permite headers mucho más altos).
- `HEADER_PAD_MIN = 10` y `HEADER_PAD_DEFAULT = 26` sin cambios.

**Cadena de conexión completa del "Altura del header":**
1. `src/admin/pages/AdminApariencia.jsx` — slider actualiza `form.header_height`
   (`min={HEADER_PAD_MIN}`, `max={HEADER_PAD_MAX}`, paso 2).
2. Se persiste vía `POST /api/v1/business` (clave en grupo `header`).
3. `src/App.jsx:345` — pasa `b.header_height` a la tienda.
4. `src/lib/storeHeaderPresets.js:77` — `getStoreHeaderStyle()` lo convierte en `padY`
   (clamp entre MIN y MAX).
5. `src/components/StoreHeaderThemes.jsx` — aplica `padY` como
   `paddingTop`/`paddingBottom` del header.

---

## 6. Panel Apariencia — Los ejemplos también reflejan la altura

**Archivo:** `src/components/StoreHeaderThemes.jsx` (línea ~49)

**Problema:** las miniaturas de ejemplo del bloque "Tipo de header" usan la prop `mini`,
que antes tenía un padding **fijo de 12px**, por lo que solo la vista previa grande
reaccionaba al slider de altura.

**Qué se hizo:**
```js
const miniPad = Math.max(6, Math.round(hdr.padY * 0.45))
const padStyle = mini
  ? { paddingTop: miniPad, paddingBottom: miniPad }
  : { paddingTop: hdr.padY, paddingBottom: hdr.padY }
```
- El modo `mini` ahora escala proporcionalmente (factor 0.45) a la altura elegida,
  así los ejemplos/opciones cambian junto con la vista previa al mover el slider.

---

## 7. Datos de ejemplo PÚBLICOS en local (sin iniciar sesión)

**Archivos:** `src/lib/qaMockApi.js`, `src/lib/devFetch.js`

**Problema:** sin backend, la página pública de Turismo (`/api/v1/portada/public`) quedaba
vacía. El mock existente (`resolveQaMock`) solo respondía con una **sesión QA activa**.

**Qué se hizo:**
- Nueva función `resolvePublicMock(url, method)` en `qaMockApi.js` que responde los
  endpoints **públicos** (no dependen de sesión): `/portada/public`, `/tours/public`,
  `/tours/public/:id`, `/pagina/public/:id`, `/business/public/:id`, `/portada/:id`,
  `/listings`. Además `POST /analytics/track` responde OK (no-op) para no ensuciar la consola.
- En `devFetch.js` se encadena: `resolveQaMock(...) ?? resolvePublicMock(...)`.
- Solo en DEV (`import.meta.env.DEV`). La producción no se ve afectada.

**Conexión:** ahora al abrir el sitio en local y entrar a Turismo se ven empresas de
ejemplo aunque no haya login.

---

## 8. Turismo — Más empresas de ejemplo (mock)

**Archivos:** `src/lib/qaUsers.js`, `src/lib/qaMockData.js`

**Qué se hizo:**
- Se ampliaron las cuentas QA de turismo de 2 a **8** (`QA_USERS`), mezclando planes
  Gratis y Premium.
- Nombres temáticos de operadores turísticos (`TURISMO_NAMES`) asignados solo a las
  cuentas turismo en `QA_PROFILES`.
- Categorías variadas por empresa (`TURISMO_CAT_SETS`, elegidas por `_index` en
  `portadaFor`) para que las etiquetas y el filtro lateral tengan variedad.

---

## 9. Menú lateral — Interruptor (cerrado por defecto + hamburguesa)

**Archivos:** `src/App.jsx`, `src/components/Header.jsx`, `src/components/Sidebar.jsx`

**Qué se hizo:** el menú lateral de categorías (Turismo/Productos/Servicios/Arriendos/etc.)
pasó a un **toggle unificado** en todos los tamaños:
- `App.jsx`: se reemplazó `sidebarOpenKey` por el estado booleano **`sidebarOpen`** (cerrado
  por defecto). Helpers `toggleSidebar`/`closeSidebar`. `toggleNav` navega con el menú
  cerrado y, si ya estás en la sección, actúa como interruptor. Todos los `handleViewAll*`,
  `goHome`, `handleSearchSelect`, `handleOpenStore` cierran el menú.
- `Header.jsx`: hamburguesa (☰ / `menu_open`) en la barra **móvil y de escritorio/tablet**
  (`onToggleSidebar`); en desktop con etiqueta "Categorías"/"Cerrar".
- `Sidebar.jsx`: controlado por el prop **`open`**; si está cerrado no renderiza (antes el
  escritorio estaba siempre visible). La X siempre cierra.

---

## 10. Turismo — Empresas Premium primero

**Archivo:** `src/components/TourismPage.jsx`

**Qué se hizo:** `filteredCompanies` se ordena de forma **estable** poniendo las empresas
con página premium (`planId >= 3`, las que tienen botón "Ver más") en las primeras
posiciones. Aplica con y sin filtro de categoría. Hecho en el componente (no en el mock),
así también funciona con el backend real.

---

## 11. Barra de scroll vertical visible (todas las resoluciones)

**Archivo:** `src/index.css`

**Qué se hizo:** barra de scroll del documento **siempre visible** a la derecha, fina (8px),
color de marca morado semitransparente, con `:hover`/`:active`. Se aplica a `html` de forma
global (`overflow-y: scroll`), no solo en móvil.

**Nota:** Safari de iPhone real fuerza su barra overlay y **ignora** `::-webkit-scrollbar`
del documento (limitación de iOS). En Chrome/Edge/Firefox/Android y emulación de DevTools
se ve correctamente.

---

## 12. Tienda premium — Botón "Volver" flotante en móvil (barra integrada)

**Archivos:** `src/components/StoreHeader.jsx`, `src/admin/pages/AdminApariencia.jsx`

**Qué se hizo:** cuando la barra está **integrada al header** (`header_bar === 'integrada'`),
en **móvil** (`sm:hidden`, < 700px) el "Volver" deja de ir dentro del header y pasa a ser una
**flecha flotante (solo flecha) bajo el header, a la izquierda**:
- `StoreHeader.jsx`: el "Volver" con texto se oculta en móvil (`hidden sm:flex`); se agrega
  una flecha circular dorada `absolute left-2 top-full` dentro del contenedor `sticky`
  (flota bajo el header al hacer scroll).
- `AdminApariencia.jsx` (`HeaderPreview`): las **previsualizaciones** integradas reflejan lo
  mismo — chip "Volver" oculto en móvil + flecha flotante sobre una franja que simula el
  inicio del contenido (escala en `mini`).

---

## 13. Tienda — El footer toma el color del header

**Archivos:** `src/components/StorePage.jsx` (`StoreFooter`), `src/App.jsx`

**Qué se hizo:**
- El footer dejó de usar `bg-primary` fijo y ahora usa `backgroundColor: hdr.color` con
  `getStoreHeaderStyle(store)` — el **mismo `header_color`** que el header. Mismo diseño,
  solo cambia el color.
- En `App.jsx` `handleOpenStore` (abrir tienda por click) no pasaba los campos de estilo del
  header; se agregaron (`header_color`, `header_preset`, `nav_color`, etc.) para que header y
  footer reflejen lo guardado también al abrir desde el listado, no solo por URL.

---

## 14. Apariencia — Los presets Boutique y Esencial reflejan el color

**Archivos:** `src/lib/storeHeaderPresets.js`, `src/components/StoreHeaderThemes.jsx`

**Problema:** 'esencial' (blanco fijo) y 'boutique' (oscuro fijo) ignoraban el color elegido;
solo cambiaban marca/degradé/panel.

**Qué se hizo:**
- En `getStoreHeaderStyle` se agregaron tonos derivados con el helper `mixToward`:
  - `colorPale` = mezcla 90% hacia blanco → fondo de **Esencial** (claro pero teñido).
  - `colorDeep` = mezcla **50%** hacia negro tenue → fondo de **Boutique** (oscuro pero con
    el matiz claramente visible; el 0.72 inicial lo dejaba casi negro y "no cambiaba").
- `StoreHeaderThemes.jsx`: Boutique usa `colorDeep`; Esencial usa `colorPale` y el **nombre en
  el color elegido**.

---

## 15. Apariencia — Preview "Modal central" no se recorta en móvil

**Archivo:** `src/admin/pages/AdminApariencia.jsx` (`SidebarPreview`, estilo `modal`)

**Qué se hizo:** el contenedor del preview modal era más bajo que el menú centrado
(`absolute`) y el `overflow-hidden` lo cortaba. Se le dio **`min-h-[230px] sm:min-h-[200px]`**
para que el modal quepa con margen.

---

## 16. Apariencia — Pestañas Servicios/Arriendos según el plan + nueva pestaña Arriendos

**Archivos:** `src/admin/pages/AdminApariencia.jsx`, `src/components/StorePage.jsx`,
`src/lib/storeHeaderPresets.js`, `src/lib/qaMockData.js`, `src/lib/qaMockApi.js`, `src/App.jsx`

**Qué se hizo:**
- Las pestañas **Servicios** y **Arriendos** se muestran según las capacidades del usuario
  (`ofrece_servicios` / `ofrece_arriendos`): solo servicios, solo arriendos, o ambas.
- Nueva pestaña **Arriendos** (espejo de Servicios): preview con collage de arriendos reales
  + selector de color **`arriendos_color`** (con opción "Transparente").
- `arriendos_color` agregado a: `DEFAULT_HEADER`, `defaultHeaderFor` (mock), `HEADER_KEYS`
  (persistencia mock), `form` load/save/`TAB_FIELDS`/reset, y al `activeStore` en `App.jsx`.
- `StorePage.jsx`: los arriendos (plan ≥2, vista de tipos mixtos) ahora usan el mismo
  `StoreServicesCollage` con `store.arriendos_color`, igual que servicios.

**Cuentas QA para probar (premium):** `gen_p3_a` (solo arriendos), `gen_p3_s` (solo servicios),
`gen_p3_psa` (ambas + productos).

---

## 17. Apariencia — Barra de scroll fina bajo las pestañas (móvil)

**Archivos:** `src/index.css`, `src/admin/pages/AdminApariencia.jsx`

**Qué se hizo:** la tira de pestañas dejó de ocultar el scrollbar y usa la nueva clase
**`.tabs-scroll`** (barra horizontal de 4px, morada, suave). Aparece sola cuando las pestañas
no caben (móvil), indicando que hay más opciones. Clase reutilizable para otras tiras con
scroll horizontal.

---

## Stack y ejecución local

- **Stack:** React 18 + Vite 6 + Tailwind CSS 3 + React Router 7. Modo "solo diseño"
  (sin backend; los datos vienen de placeholders o de la API si está disponible).
- **Levantar en local:** `npm run dev` → http://localhost:5173/
- **Notas WSL2:** Vite usa polling para detectar cambios en `/mnt/c` (ver `vite.config.js`).
