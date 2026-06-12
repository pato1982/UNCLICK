import multer from 'multer'
import sharp from 'sharp'
import { mkdirSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))

export const CARPETAS_VALIDAS = new Set([
  'productos', 'servicios', 'arriendos', 'turismo',
  'locales', 'eventos', 'negocios', 'portadas', 'paginas',
])

// ── Dimensiones máximas de salida por carpeta ─────────────────────────────
// Reducir dimensiones en carpetas de galería/thumbnail para ahorrar disco y RAM.
// Mantener 1200 solo donde se necesita calidad alta (banner principal, etc.).
const CARPETA_MAX_DIM = {
  turismo:  900,   // thumbnails de tour — grid de 6 col, 900px > 2× resolución pantalla
  portadas: 900,   // fan de 3 tarjetas — 900px suficiente con crop
  paginas:  1000,  // secciones a ancho completo en móvil
  negocios: 600,   // logos circulares — 600px a 3× es generoso
}
const DEFAULT_MAX_DIM = 1200

// ── Multer: solo memoria, sharp comprime antes de ir al disco ──────────────
// Límite 5 MB: fotos de teléfono reales son 3-6 MB; al reducirlo a 5 MB
// se recorta el pico de RAM por upload a la mitad sin afectar la mayoría de casos.
export const multerMemoria = multer({
  storage: multer.memoryStorage(),
  fileFilter(_req, file, cb) {
    cb(null, ['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype))
  },
  limits: { fileSize: 5 * 1024 * 1024 },  // 5 MB máximo
})

// ── Compresión con sharp — stream directo al disco (no acumula en RAM) ─────
// Resultado: WebP ≤ maxDim×maxDim, ~50-150 KB sin importar cuánto pesaba el original.
export async function guardarImagen(buffer, carpeta) {
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.webp`
  const dir      = join(__dirname, '..', 'uploads', carpeta)
  const destino  = join(dir, filename)
  const maxDim   = CARPETA_MAX_DIM[carpeta] ?? DEFAULT_MAX_DIM

  mkdirSync(dir, { recursive: true })

  await sharp(buffer)
    .rotate()                                                       // respeta EXIF orientation
    .resize({ width: maxDim, height: maxDim, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 82, effort: 4 })                               // effort 4: balance velocidad/compresión
    .toFile(destino)                                                // stream → disco, no acumula en RAM

  return { filename, url: `/uploads/${carpeta}/${filename}` }
}

// ── Middleware reutilizable: multer + sharp para rutas de carpeta fija ─────
export function uploadImagen(carpeta) {
  return [
    multerMemoria.single('imagen'),
    async (req, _res, next) => {
      if (!req.file) return next()
      try {
        const { filename, url } = await guardarImagen(req.file.buffer, carpeta)
        req.file.filename = filename
        req.file.url      = url
        next()
      } catch (err) {
        next(err)
      }
    },
  ]
}

// ── Error handler para multer (límite de tamaño superado) ─────────────────
export function handleUploadError(err, _req, res, next) {
  if (err?.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: 'La imagen supera los 5 MB. Reduce el tamaño antes de subir.' })
  }
  if (err?.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({ error: 'Campo de archivo inesperado.' })
  }
  next(err)
}
