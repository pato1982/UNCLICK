/**
 * Router de API "mock" para sesiones de cuentas de prueba (QA) en modo local.
 *
 * Cuando hay una sesión QA activa (email @qa.dev en localStorage), intercepta
 * las peticiones GET a /api/v1/... y devuelve datos de muestra completos
 * (perfil de negocio, productos, tours, etc.) para ver la plataforma llena
 * sin backend. Las demás peticiones devuelven null → siguen su curso normal.
 */

import {
  qaUserById,
  qaUserByEmail,
  businessProfile,
  listingsFor,
  bannerListingsFor,
  allListings,
  toursFor,
  allTours,
  turismoNegocio,
  paginaFor,
  portadaFor,
  allPortadas,
  countsFor,
  statsFor,
  historyFor,
  writeHeaderOverride,
} from './qaMockData'

const HEADER_KEYS = ['header_preset', 'header_color', 'header_height', 'header_bar', 'banner_color', 'services_color', 'arriendos_color', 'sidebar_color', 'sidebar_accent', 'sidebar_style', 'nav_color', 'nav_style']

function currentQaUser() {
  try {
    // Solo activa el mock si es una sesión mock explícita (dev_user_id = 'mock-...')
    // Las sesiones reales del backend no tienen dev_user_id → no interceptar
    const devId = localStorage.getItem('dev_user_id')
    if (!devId || !devId.startsWith('mock-')) return null
    const u = JSON.parse(localStorage.getItem('user') || 'null')
    if (u && typeof u.email === 'string' && u.email.endsWith('@qa.dev')) {
      return qaUserByEmail(u.email)
    }
  } catch {
    /* noop */
  }
  return null
}

export function isQaSession() {
  return !!currentQaUser()
}

/**
 * Devuelve un objeto de datos para responder la petición, o null si no aplica.
 * Solo intercepta GET; el resto (POST/PUT/DELETE) se deja pasar.
 */
export function resolveQaMock(urlStr, method = 'GET', body = null) {
  const me = currentQaUser()
  if (!me) return null

  let path, params
  try {
    const u = new URL(urlStr, window.location.origin)
    path = u.pathname
    params = u.searchParams
  } catch {
    return null
  }

  const m = String(method).toUpperCase()

  // Guardado del estilo del header (POST/PUT al perfil de negocio).
  if ((m === 'POST' || m === 'PUT') && path === '/api/v1/business') {
    if (body && typeof body === 'object') {
      const cfg = {}
      HEADER_KEYS.forEach((k) => { if (body[k] !== undefined) cfg[k] = body[k] })
      if (Object.keys(cfg).length) writeHeaderOverride(me.id, cfg)
    }
    return { business: businessProfile(me) }
  }

  if (m !== 'GET') return null

  const idIn = (re) => {
    const m = path.match(re)
    return m ? m[1] : null
  }
  const userFor = (id) => (id ? qaUserById(id) || me : me)

  // --- Negocio / perfil ---
  if (path === '/api/v1/business') return { business: businessProfile(me) }
  {
    const id = idIn(/^\/api\/v1\/business\/(?:public\/)?(\d+)$/)
    if (id) return { business: businessProfile(userFor(id)) }
  }

  // --- Listings (productos / servicios / arriendos) ---
  if (path === '/api/v1/listings/mine') {
    return { listings: [...listingsFor(me), ...bannerListingsFor(me)] }
  }
  if (path === '/api/v1/listings') {
    const uid = params.get('user_id')
    if (uid) {
      const target = userFor(uid)
      if (params.get('banner')) return { listings: bannerListingsFor(target) }
      return { listings: listingsFor(target) }
    }
    return { listings: allListings() } // home público
  }

  // --- Tours ---
  if (path === '/api/v1/tours') return { tours: toursFor(me) }
  if (path === '/api/v1/tours/public') return { tours: allTours() }
  if (path === '/api/v1/public/tours') return { tours: allTours() }
  {
    const id = idIn(/^\/api\/v1\/tours\/public\/(\d+)$/)
    if (id) return { tours: toursFor(userFor(id)) }
  }
  {
    const id = idIn(/^\/api\/v1\/public\/tours\/(\d+)$/)
    if (id) return { tours: toursFor(userFor(id)) }
  }

  // --- Negocio turístico ---
  if (path === '/api/v1/turismo') return { negocios: [turismoNegocio(me)] }
  {
    const id = idIn(/^\/api\/v1\/turismo\/(\d+)$/)
    if (id) return { negocio: turismoNegocio(userFor(id)) }
  }

  // --- Página premium ---
  if (path === '/api/v1/pagina') return { pagina: paginaFor(me) }
  {
    const id = idIn(/^\/api\/v1\/pagina\/public\/(\d+)$/)
    if (id) return { pagina: paginaFor(userFor(id)) }
  }
  {
    const id = idIn(/^\/api\/v1\/public\/pagina\/(\d+)$/)
    if (id) return { pagina: paginaFor(userFor(id)) }
  }

  // --- Portada ---
  if (path === '/api/v1/portada') return { portada: portadaFor(me) }
  if (path === '/api/v1/portada/public') return { portadas: allPortadas() }
  if (path === '/api/v1/public/portadas') return { portadas: allPortadas() }
  {
    const id = idIn(/^\/api\/v1\/portada\/(\d+)$/)
    if (id) return { portada: portadaFor(userFor(id)) }
  }

  // --- Business público (nuevo path) ---
  {
    const id = idIn(/^\/api\/v1\/public\/business\/(\d+)$/)
    if (id) return { business: businessProfile(userFor(id)) }
  }

  // --- Perfil del usuario (datos de registro + plan) ---
  if (path === '/api/v1/auth/me') {
    const { _index, _caps, _name, ...clean } = me
    return { user: clean }
  }

  // --- Contadores de perfil ---
  if (path === '/api/v1/auth/profile/counts') return countsFor(me)

  // --- Historial de pagos y cambios ---
  if (path === '/api/v1/auth/profile/history') return { history: historyFor(me) }

  // --- Estadísticas (analytics) ---
  if (path === '/api/v1/analytics/stats') return statsFor(me)

  return null
}

/**
 * Mock para los endpoints PÚBLICOS del sitio (turismo, home, páginas de empresa),
 * que NO dependen de una sesión iniciada. Permite ver el sitio lleno de datos de
 * ejemplo en modo local aunque no hayas iniciado sesión con una cuenta QA.
 *
 * Devuelve un objeto para responder, o null si la ruta no corresponde a un
 * endpoint público conocido (en cuyo caso la petición sigue su curso normal).
 */
export function resolvePublicMock(urlStr, method = 'GET', body = null) {
  let path, params
  try {
    const u = new URL(urlStr, window.location.origin)
    path = u.pathname
    params = u.searchParams
  } catch {
    return null
  }

  const m = String(method).toUpperCase()

  // Analytics: en local no hay backend → aceptar sin hacer nada (evita errores en consola).
  if (m === 'POST' && path === '/api/v1/analytics/track') return { ok: true }

  if (m !== 'GET') return null

  const idIn = (re) => {
    const mm = path.match(re)
    return mm ? mm[1] : null
  }

  // --- Listings públicos (home) ---
  if (path === '/api/v1/listings') {
    const uid = params.get('user_id')
    if (uid) {
      const target = qaUserById(uid)
      if (!target) return { listings: [] }
      if (params.get('banner')) return { listings: bannerListingsFor(target) }
      return { listings: listingsFor(target) }
    }
    return { listings: allListings() }
  }

  // --- Turismo: portadas públicas (listado de empresas) ---
  if (path === '/api/v1/portada/public') return { portadas: allPortadas() }
  if (path === '/api/v1/public/portadas') return { portadas: allPortadas() }

  // --- Tours públicos ---
  if (path === '/api/v1/tours/public') return { tours: allTours() }
  if (path === '/api/v1/public/tours') return { tours: allTours() }
  {
    const id = idIn(/^\/api\/v1\/tours\/public\/(\d+)$/)
    if (id) {
      const t = qaUserById(id)
      return { tours: t ? toursFor(t) : [] }
    }
  }
  {
    const id = idIn(/^\/api\/v1\/public\/tours\/(\d+)$/)
    if (id) {
      const t = qaUserById(id)
      return { tours: t ? toursFor(t) : [] }
    }
  }

  // --- Página premium pública de una empresa ---
  {
    const id = idIn(/^\/api\/v1\/pagina\/public\/(\d+)$/)
    if (id) {
      const t = qaUserById(id)
      return { pagina: t ? paginaFor(t) : null }
    }
  }
  {
    const id = idIn(/^\/api\/v1\/public\/pagina\/(\d+)$/)
    if (id) {
      const t = qaUserById(id)
      return { pagina: t ? paginaFor(t) : null }
    }
  }

  // --- Datos públicos de negocio ---
  {
    const id = idIn(/^\/api\/v1\/business\/public\/(\d+)$/)
    if (id) {
      const t = qaUserById(id)
      return { business: t ? businessProfile(t) : null }
    }
  }
  {
    const id = idIn(/^\/api\/v1\/public\/business\/(\d+)$/)
    if (id) {
      const t = qaUserById(id)
      return { business: t ? businessProfile(t) : null }
    }
  }

  // --- Portada por id ---
  {
    const id = idIn(/^\/api\/v1\/portada\/(\d+)$/)
    if (id) {
      const t = qaUserById(id)
      return { portada: t ? portadaFor(t) : null }
    }
  }

  return null
}
