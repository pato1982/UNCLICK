/**
 * Interceptor de fetch para modo desarrollo.
 *
 * Responsabilidades (solo cuando import.meta.env.DEV === true):
 *  1. Inyectar el header X-Dev-User-Id en peticiones a /api/ para bypass de auth.
 *  2. Registrar cada request/response en el store devApiLog para el monitor UI.
 *
 * En build de producción, esta función retorna temprano y no modifica window.fetch.
 */

import { addEntry, updateEntry } from './devApiLog'

function toHeadersObject(init) {
  if (!init) return {}
  if (init instanceof Headers) {
    const out = {}
    init.forEach((v, k) => { out[k] = v })
    return out
  }
  if (Array.isArray(init)) return Object.fromEntries(init)
  return { ...init }
}

function responseHeadersToObject(res) {
  const out = {}
  res.headers.forEach((v, k) => { out[k] = v })
  return out
}

async function cloneResponseBody(res) {
  try {
    const clone = res.clone()
    const ct = res.headers.get('content-type') || ''
    if (ct.includes('application/json')) {
      return await clone.json()
    }
    const text = await clone.text()
    return text.length > 2000 ? text.slice(0, 2000) + '…[truncado]' : text
  } catch (e) {
    return null
  }
}

function parseRequestBody(body) {
  if (body == null) return null
  if (typeof body === 'string') {
    try { return JSON.parse(body) } catch { return body }
  }
  if (body instanceof FormData) {
    const out = {}
    for (const [k, v] of body.entries()) {
      out[k] = v instanceof File ? `[File: ${v.name} ${v.size}B]` : v
    }
    return out
  }
  if (body instanceof URLSearchParams) return Object.fromEntries(body.entries())
  if (body instanceof Blob) return `[Blob ${body.size}B ${body.type}]`
  return body
}

export function installDevFetchInterceptor() {
  if (!import.meta.env.DEV) return

  const originalFetch = window.fetch

  window.fetch = async function devFetch(...args) {
    const [input, config = {}] = args
    const urlStr = typeof input === 'string' ? input : input instanceof Request ? input.url : String(input)
    const isApi = urlStr.includes('/api/')

    let finalConfig = config
    if (isApi) {
      const userId = localStorage.getItem('dev_user_id')
      if (userId) {
        finalConfig = {
          ...config,
          headers: {
            ...toHeadersObject(config.headers),
            'X-Dev-User-Id': userId,
          },
        }
      }
    }

    if (!isApi) {
      return originalFetch(input, finalConfig)
    }

    const method = (finalConfig.method || 'GET').toUpperCase()
    const startedAt = Date.now()
    let pathname = urlStr
    try {
      const u = new URL(urlStr, window.location.origin)
      pathname = u.pathname + (u.search || '')
    } catch { /* noop */ }

    const entryId = addEntry({
      method,
      url: urlStr,
      path: pathname,
      startedAt,
      requestHeaders: toHeadersObject(finalConfig.headers),
      requestBody: parseRequestBody(finalConfig.body),
    })

    try {
      const res = await originalFetch(input, finalConfig)
      const durationMs = Date.now() - startedAt
      const responseBody = await cloneResponseBody(res)
      updateEntry(entryId, {
        status: res.status,
        ok: res.ok,
        durationMs,
        responseHeaders: responseHeadersToObject(res),
        responseBody,
      })
      return res
    } catch (err) {
      const durationMs = Date.now() - startedAt
      updateEntry(entryId, {
        status: 0,
        ok: false,
        durationMs,
        error: err?.message || String(err),
      })
      throw err
    }
  }

  // eslint-disable-next-line no-console
  console.log('[DEV] Fetch interceptor instalado — X-Dev-User-Id + monitor de APIs activos')
}
