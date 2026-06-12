/**
 * Store reactivo de requests API interceptados en modo desarrollo.
 * Emite eventos a suscriptores cada vez que se agrega o actualiza una entrada.
 *
 * Shape de una entrada:
 *   {
 *     id: number (incremental),
 *     method: string,
 *     url: string,
 *     path: string (pathname + search),
 *     status: number | null,
 *     ok: boolean | null,
 *     durationMs: number | null,
 *     startedAt: number (epoch ms),
 *     requestHeaders: object,
 *     requestBody: any,
 *     responseHeaders: object | null,
 *     responseBody: any,
 *     error: string | null,
 *   }
 */

const MAX_ENTRIES = 200
const SENSITIVE_HEADER_KEYS = ['authorization', 'cookie', 'x-api-key', 'set-cookie']
const SENSITIVE_BODY_FIELDS = ['password', 'token', 'refresh_token', 'accessToken', 'refreshToken', 'current_password', 'new_password']

let _nextId = 1
let _entries = []
const _listeners = new Set()

function notify() {
  _entries = [..._entries]
  for (const fn of _listeners) {
    try { fn(_entries) } catch (e) { /* noop */ }
  }
}

function redactHeaders(headers) {
  if (!headers) return {}
  const out = {}
  for (const [k, v] of Object.entries(headers)) {
    out[k] = SENSITIVE_HEADER_KEYS.includes(k.toLowerCase()) ? '***redacted***' : v
  }
  return out
}

function redactBody(body) {
  if (!body || typeof body !== 'object') return body
  if (Array.isArray(body)) return body.map(redactBody)
  const out = {}
  for (const [k, v] of Object.entries(body)) {
    out[k] = SENSITIVE_BODY_FIELDS.includes(k) ? '***redacted***' : (typeof v === 'object' ? redactBody(v) : v)
  }
  return out
}

export function addEntry(partial) {
  const entry = {
    id: _nextId++,
    status: null,
    ok: null,
    durationMs: null,
    requestHeaders: redactHeaders(partial.requestHeaders),
    requestBody: redactBody(partial.requestBody),
    responseHeaders: null,
    responseBody: null,
    error: null,
    ...partial,
  }
  _entries = [entry, ..._entries].slice(0, MAX_ENTRIES)
  notify()
  return entry.id
}

export function updateEntry(id, patch) {
  const idx = _entries.findIndex(e => e.id === id)
  if (idx === -1) return
  const existing = _entries[idx]
  const updated = {
    ...existing,
    ...patch,
    requestHeaders: patch.requestHeaders ? redactHeaders(patch.requestHeaders) : existing.requestHeaders,
    requestBody: patch.requestBody !== undefined ? redactBody(patch.requestBody) : existing.requestBody,
    responseHeaders: patch.responseHeaders ? redactHeaders(patch.responseHeaders) : existing.responseHeaders,
  }
  _entries = [..._entries.slice(0, idx), updated, ..._entries.slice(idx + 1)]
  notify()
}

export function clearEntries() {
  _entries = []
  notify()
}

export function getEntries() {
  return _entries
}

export function subscribe(listener) {
  _listeners.add(listener)
  return () => _listeners.delete(listener)
}
