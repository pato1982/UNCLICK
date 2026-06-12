// Caché en memoria simple con TTL por clave.
// Para consultas pesadas que no necesitan datos en tiempo real.
const store = new Map()

export async function cached(key, ttlMs, fetchFn) {
  const entry = store.get(key)
  if (entry && Date.now() - entry.ts < ttlMs) return entry.data
  const data = await fetchFn()
  store.set(key, { data, ts: Date.now() })
  return data
}

export function invalidate(key) {
  store.delete(key)
}

export function invalidateAll() {
  store.clear()
}
