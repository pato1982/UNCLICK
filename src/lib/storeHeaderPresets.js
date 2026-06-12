/**
 * Estilos de header para las tiendas premium (productos / servicios / arriendos).
 *
 * Cada plantilla es un diseño profesional y distinto (fondo + composición +
 * tipografía). Se combina con los controles de color, altura y barra inferior.
 */

export const STORE_HEADER_PRESETS = [
  { id: 'esencial', label: 'Esencial', desc: 'Fondo claro, nombre centrado, look editorial y limpio.' },
  { id: 'marca', label: 'Marca', desc: 'Banda con tu color, identidad alineada a la izquierda.' },
  { id: 'boutique', label: 'Boutique', desc: 'Fondo oscuro, nombre serif centrado con filete dorado.' },
  { id: 'degrade', label: 'Degradé', desc: 'Gradiente suave de tu color, nombre destacado al centro.' },
  { id: 'panel', label: 'Panel', desc: 'Bloque de color a un lado (logo + nombre) y panel claro al otro.' },
]

// Altura del header: relleno vertical en px (controlado por un slider).
export const HEADER_PAD_MIN = 10
export const HEADER_PAD_MAX = 160
export const HEADER_PAD_DEFAULT = 26

// Estilos para la barra de navegación inferior (volver / saludo / acciones).
export const NAV_STYLES = [
  { id: 'borde', label: 'Borde acento' },
  { id: 'solido', label: 'Sólido' },
  { id: 'degradado', label: 'Degradado' },
]

// Modo de la barra de navegación: separada (abajo) o integrada (dentro del header).
export const BAR_MODES = [
  { id: 'separada', label: 'Barra separada' },
  { id: 'integrada', label: 'Integrada en el header' },
]

// Estilos de posición del menú lateral de categorías de la tienda.
// Permite que cada usuario elija una disposición distinta al resto.
export const MENU_STYLES = [
  { id: 'izquierda', label: 'Izquierda', icon: 'view_sidebar', desc: 'Menú fijo a la izquierda del contenido (clásico).' },
  { id: 'derecha', label: 'Lado opuesto', icon: 'flip', desc: 'Mismo menú pero anclado a la derecha del contenido.' },
  { id: 'modal', label: 'Modal central', icon: 'crop_square', desc: 'Botón "Categorías" que abre el menú centrado en pantalla.' },
]

export const DEFAULT_HEADER = {
  header_preset: 'marca',
  header_color: '#3B1969',
  header_height: 26,
  header_bar: 'separada',
  banner_color: '#1a1220',
  services_color: '#0f1a2e',
  arriendos_color: '#14241c',
  sidebar_color: '#3B1969',
  sidebar_accent: '#E5B800',
  sidebar_style: 'izquierda',
  nav_color: '#4A2070',
  nav_style: 'borde',
}

// Variantes con fondo claro (las acciones integradas usan texto oscuro).
const LIGHT_HEADER = { esencial: true, panel: true }

function clampHex(c) {
  return /^#?[0-9a-fA-F]{6}$/.test(String(c || '')) ? (c[0] === '#' ? c : '#' + c) : '#3B1969'
}

function shift(hex, pct) {
  const h = clampHex(hex).slice(1)
  const num = parseInt(h, 16)
  const f = 1 + pct / 100 // pct<0 oscurece, pct>0 aclara
  const ch = (c) => Math.max(0, Math.min(255, Math.round(c * f)))
  const r = ch((num >> 16) & 255), g = ch((num >> 8) & 255), b = ch(num & 255)
  return `rgb(${r}, ${g}, ${b})`
}

function rgbParts(hex) {
  const num = parseInt(clampHex(hex).slice(1), 16)
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255]
}

/**
 * Fondo neutro del menú: carbón oscuro con apenas un dejo del color de la
 * marca. La idea es que combine con el header sin ser invasivo; el color
 * fuerte queda para bordes y acentos.
 */
export function softenColor(hex) {
  const [r, g, b] = rgbParts(hex)
  const target = [0x22, 0x24, 0x2b] // carbón neutro
  const a = 0.86 // 86% hacia el neutro → casi gris con un leve tinte
  const mix = (c, t) => Math.round(c * (1 - a) + t * a)
  return `rgb(${mix(r, target[0])}, ${mix(g, target[1])}, ${mix(b, target[2])})`
}

/**
 * Versión del color del header pensada como acento sobre el fondo neutro:
 * se aclara/satura un poco para que los bordes, títulos y la categoría
 * activa resalten y se lean bien.
 */
export function menuAccent(hex) {
  const [r, g, b] = rgbParts(hex)
  const lum = 0.299 * r + 0.587 * g + 0.114 * b
  // si el color es muy oscuro lo aclaramos más, para que el acento resalte
  const boost = lum < 90 ? 1.7 : 1.25
  const ch = (c) => Math.max(0, Math.min(255, Math.round(c * boost)))
  return `rgb(${ch(r)}, ${ch(g)}, ${ch(b)})`
}

// Mezcla un color hacia un objetivo (0 = color puro, 1 = objetivo puro).
function mixToward(hex, target, a) {
  const [r, g, b] = rgbParts(hex)
  const m = (c, t) => Math.round(c * (1 - a) + t * a)
  return `rgb(${m(r, target[0])}, ${m(g, target[1])}, ${m(b, target[2])})`
}

function luminance(hex) {
  const h = clampHex(hex).slice(1)
  const num = parseInt(h, 16)
  const r = (num >> 16) & 255, g = (num >> 8) & 255, b = num & 255
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255
}

/**
 * Devuelve la configuración (variante + colores + barra) para el header.
 * El layout/diseño concreto de cada variante lo arma StoreHeaderThemed.
 */
export function getStoreHeaderStyle(cfg = {}) {
  const variant = STORE_HEADER_PRESETS.some((p) => p.id === cfg.header_preset) ? cfg.header_preset : 'marca'
  const color = clampHex(cfg.header_color)
  const padY = Number.isFinite(Number(cfg.header_height))
    ? Math.min(Math.max(Number(cfg.header_height), HEADER_PAD_MIN), HEADER_PAD_MAX)
    : HEADER_PAD_DEFAULT

  // --- Barra de navegación inferior ---
  const navColor = clampHex(cfg.nav_color || '#4A2070')
  const navStyleId = cfg.nav_style || 'borde'
  const navStyle =
    navStyleId === 'degradado'
      ? { background: `linear-gradient(135deg, ${navColor} 0%, ${shift(navColor, -45)} 100%)` }
      : { backgroundColor: navColor }
  const navBorderClass = navStyleId === 'borde' ? 'border-y-2 border-accent' : ''
  const navOnLight = luminance(navColor) > 0.6

  return {
    variant,
    color,
    colorDark: shift(color, -45),
    colorLight: shift(color, 22),
    // Tinte muy claro del color elegido (para el preset "Esencial": fondo claro pero teñido)
    colorPale: mixToward(color, [255, 255, 255], 0.9),
    // Versión oscura del color elegido, pero conservando bien el matiz (preset "Boutique").
    // Mezcla moderada hacia un negro tenue para que se note el color sin perder el look oscuro.
    colorDeep: mixToward(color, [10, 10, 14], 0.5),
    padY,
    barIntegrated: cfg.header_bar === 'integrada',
    actionText: LIGHT_HEADER[variant] ? 'text-slate-700' : 'text-white',
    navStyle,
    navBorderClass,
    navText: navOnLight ? 'text-slate-700' : 'text-white',
    navTextSoft: navOnLight ? 'text-slate-500' : 'text-white/70',
    navTextFaint: navOnLight ? 'text-slate-400' : 'text-white/50',
  }
}
