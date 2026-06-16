import 'dotenv/config' // rev: 2026-06-11
import express      from 'express'
import cors         from 'cors'
import cookieParser from 'cookie-parser'
import mysql        from 'mysql2/promise'
import rateLimit    from 'express-rate-limit'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { CARPETAS_VALIDAS, multerMemoria, guardarImagen, handleUploadError } from './middleware/upload.js'
import { requireAuth } from './middleware/requireAuth.js'
import authRouter          from './routes/auth.js'
import passwordResetRouter from './routes/password-reset.js'
import categoriasRouter from './routes/categorias.js'
import eventosRouter    from './routes/eventos.js'
import localesRouter    from './routes/locales.js'
import listingsRouter   from './routes/listings.js'
import toursRouter      from './routes/tours.js'
import businessRouter   from './routes/business.js'
import portadaRouter    from './routes/portada.js'
import paginaRouter     from './routes/pagina.js'
import analyticsRouter  from './routes/analytics.js'
import servidorRouter   from './routes/servidor.js'
import monitorRouter    from './routes/monitor.js'
import publicRouter     from './routes/public.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

const app  = express()
const PORT = process.env.PORT || 3001

// Detrás de nginx (reverse proxy): confiar en el primer proxy para que
// req.secure y X-Forwarded-* sean correctos (cookies Secure, rate-limit por IP real).
app.set('trust proxy', 1)

app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173', credentials: true }))
app.use(express.json())
app.use(cookieParser())

// ── Rate limiting ──────────────────────────────────────────────────────────
// Auth: anti-fuerza-bruta (login/register)
const limiterAuth = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 20,
  message: { error: 'Demasiados intentos, esperá 15 minutos e intentá de nuevo.' },
  standardHeaders: true,
  legacyHeaders: false,
})
// Upload: evita flooding de imágenes
const limiterUpload = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 30,
  message: { error: 'Demasiadas imágenes subidas seguidas, esperá un momento.' },
  standardHeaders: true,
  legacyHeaders: false,
})
// Público: track de analytics y visitas al sitio
const limiterPublico = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  message: { error: 'Demasiadas peticiones.' },
  standardHeaders: true,
  legacyHeaders: false,
})
// General: todas las demás rutas autenticadas
const limiterGeneral = rateLimit({
  windowMs: 60 * 1000,
  max: 300,
  message: { error: 'Demasiadas peticiones, esperá un momento.' },
  standardHeaders: true,
  legacyHeaders: false,
})

app.use('/api/v1/auth',             limiterAuth)
app.use('/api/v1/upload',           limiterUpload)
app.use('/api/v1/analytics/track',  limiterPublico)
app.use('/api/v1/servidor/visita',  limiterPublico)
app.use('/api/v1',                  limiterGeneral)

// ── Imágenes estáticas ─────────────────────────────────────────────────────
app.use('/uploads', express.static(join(__dirname, 'uploads')))

// ── Pool de conexiones ─────────────────────────────────────────────────────
const pool = mysql.createPool({
  host:     process.env.DB_HOST,
  port:     Number(process.env.DB_PORT),
  user:     process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
})

pool.getConnection()
  .then(conn => {
    console.log(`✅  MySQL conectado → ${process.env.DB_NAME}@${process.env.DB_HOST}:${process.env.DB_PORT}`)
    conn.release()
  })
  .catch(err => {
    console.error('❌  Error al conectar con MySQL:', err.message)
    process.exit(1)
  })

// ── Pool disponible en todas las rutas ────────────────────────────────────
app.use((req, _res, next) => { req.pool = pool; next() })

// ── Health check ───────────────────────────────────────────────────────────
app.get('/api/v1/health', (_req, res) => res.json({ ok: true }))

// ── Autenticación (rutas públicas) ─────────────────────────────────────────
app.use('/api/v1/auth', authRouter)

// ── Recuperación de contraseña (pública, rate-limited por limiterAuth) ──────
app.use('/api/v1/password-reset', limiterAuth, passwordResetRouter)

// ── Upload de imágenes (requiere sesión) ───────────────────────────────────
app.post('/api/v1/upload', requireAuth, multerMemoria.single('imagen'), async (req, res) => {
  const tipo = CARPETAS_VALIDAS.has(req.query.tipo) ? req.query.tipo : 'productos'
  if (!req.file) return res.status(400).json({ error: 'No se recibió imagen válida (jpeg, png o webp)' })
  try {
    const { url } = await guardarImagen(req.file.buffer, tipo)
    // Registrar actividad
    pool.query(
      'INSERT INTO tb_actividad_usuarios (usuario_id, accion, entidad) VALUES (?, ?, ?)',
      [req.usuario.id, 'subir_imagen', tipo]
    ).catch(() => {})
    res.json({ url })
  } catch {
    res.status(500).json({ error: 'Error al procesar la imagen' })
  }
})

// ── Rutas públicas (sin auth — marketplace, tiendas, turismo) ─────────────
app.use('/api/v1/public', publicRouter)

// ── Analytics (track público + stats privado con su propio requireAuth) ────
app.use('/api/v1/analytics', analyticsRouter)

// ── Servidor: visita pública + estadísticas programador ───────────────────
app.use('/api/v1/servidor', servidorRouter)

// ── Monitor de plataforma (requireAuth aplicado en server, requireProg en ruta) ─
app.use('/api/v1/monitor', requireAuth, monitorRouter)

// ── Categorías (públicas) ──────────────────────────────────────────────────
app.use('/api/v1/categorias', categoriasRouter)

app.get('/api/v1/eventos/categorias', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, nombre, icono FROM tb_categorias WHERE tipo = ? ORDER BY nombre', ['evento']
    )
    res.json({ categorias: rows })
  } catch { res.status(500).json({ error: 'Error al obtener categorías' }) }
})

app.get('/api/v1/locales/categorias', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, nombre, icono FROM tb_categorias WHERE tipo = ? ORDER BY nombre', ['local']
    )
    res.json({ categorias: rows })
  } catch { res.status(500).json({ error: 'Error al obtener categorías' }) }
})

// ── Rutas del programador (públicas en dev, proteger en prod) ──────────────
app.use('/api/v1/eventos', eventosRouter)
app.use('/api/v1/locales', localesRouter)

// ── Rutas de usuario (requieren sesión) ────────────────────────────────────
app.use('/api/v1/business',  requireAuth, businessRouter)
app.use('/api/v1/portada',   requireAuth, portadaRouter)
app.use('/api/v1/pagina',    requireAuth, paginaRouter)
app.use('/api/v1/listings',  requireAuth, listingsRouter)
app.use('/api/v1/tours',     requireAuth, toursRouter)

// ── Error handler global para errores de upload (multer límite, etc.) ─────
app.use(handleUploadError)

// ── Inicio ─────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀  Backend corriendo en http://localhost:${PORT}`)
})
