import { unlink } from 'fs/promises'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Borra un archivo de /uploads/ del disco (silencioso si ya no existe)
export function deleteUpload(url) {
  if (!url || typeof url !== 'string' || !url.startsWith('/uploads/')) return
  const filePath = join(__dirname, '..', url.replace(/^\//, ''))
  unlink(filePath).catch(() => {})
}

// Borra todos los URLs de /uploads/ que estaban en oldUrls pero ya no están en newUrls
export function deleteRemovedUploads(oldUrls, newUrls) {
  if (!oldUrls?.length) return
  const newSet = new Set(Array.isArray(newUrls) ? newUrls : [])
  for (const url of oldUrls) {
    if (!newSet.has(url)) deleteUpload(url)
  }
}

// Extrae todos los strings /uploads/ de cualquier valor (string, array, objeto)
export function extractUploadUrls(val) {
  if (!val) return []
  if (typeof val === 'string') return val.startsWith('/uploads/') ? [val] : []
  if (Array.isArray(val)) return val.flatMap(extractUploadUrls)
  if (typeof val === 'object') return Object.values(val).flatMap(extractUploadUrls)
  return []
}
