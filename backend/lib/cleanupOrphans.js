import { unlink, readdir, stat } from 'fs/promises'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const UPLOADS_BASE = join(__dirname, '..', 'uploads')

// Archivos más viejos de 2 horas sin referencia en DB se eliminan
const MAX_AGE_MS = 2 * 60 * 60 * 1000

async function collectReferencedUrls(pool) {
  const referenced = new Set()

  const add = (val) => {
    if (!val) return
    if (typeof val === 'string' && val.startsWith('/uploads/')) {
      referenced.add(val)
      return
    }
    if (typeof val === 'string' && val.startsWith('[')) {
      try {
        JSON.parse(val).forEach(item => {
          const url = typeof item === 'string' ? item : item?.url
          if (url?.startsWith('/uploads/')) referenced.add(url)
        })
      } catch {}
    }
  }

  const queries = [
    'SELECT imagen FROM tb_listings WHERE imagen IS NOT NULL',
    'SELECT url FROM tb_listing_imagenes',
    'SELECT imagenes FROM portadas WHERE imagenes IS NOT NULL',
    'SELECT imagen_superior, imagen_inferior FROM paginas',
    'SELECT imagenes FROM tb_tours WHERE imagenes IS NOT NULL',
  ]

  for (const q of queries) {
    try {
      const [rows] = await pool.query(q)
      for (const row of rows) Object.values(row).forEach(add)
    } catch {}
  }

  return referenced
}

export async function cleanupOrphanUploads(pool) {
  const referenced = await collectReferencedUrls(pool)
  const cutoff = Date.now() - MAX_AGE_MS
  const subdirs = ['productos', 'portadas', 'paginas', 'tours', 'turismo']
  let removed = 0

  for (const sub of subdirs) {
    const dir = join(UPLOADS_BASE, sub)
    let files
    try { files = await readdir(dir) } catch { continue }

    for (const file of files) {
      if (file.startsWith('seed-')) continue
      const url = `/uploads/${sub}/${file}`
      if (referenced.has(url)) continue
      const filePath = join(dir, file)
      try {
        const { mtimeMs } = await stat(filePath)
        if (mtimeMs < cutoff) {
          await unlink(filePath)
          removed++
        }
      } catch {}
    }
  }

  if (removed > 0) console.log(`[cleanup] ${removed} archivo(s) huérfano(s) eliminado(s)`)
}
