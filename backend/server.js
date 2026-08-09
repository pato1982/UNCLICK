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
import { cleanupOrphanUploads } from './lib/cleanupOrphans.js'
import authRouter          from './routes/auth.js'
import passwordResetRouter from './routes/password-reset.js'
import categoriasRouter from './routes/categorias.js'
import eventosRouter    from './routes/eventos.js'
import localesRouter    from './routes/locales.js'
import miLocalRouter    from './routes/mi-local.js'
import misEventosRouter from './routes/mis-eventos.js'
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

// DetrÃ¡s de nginx (reverse proxy): confiar en el primer proxy para que
// req.secure y X-Forwarded-* sean correctos (cookies Secure, rate-limit por IP real).
app.set('trust proxy', 1)

app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173', credentials: true }))
app.use(express.json())
app.use(cookieParser())

// â”€â”€ Rate limiting â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Auth: anti-fuerza-bruta (login/register)
const limiterAuth = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: Number(process.env.RATE_LIMIT_AUTH_MAX) || 20,
  message: { error: 'Demasiados intentos, esperÃ¡ 15 minutos e intentÃ¡ de nuevo.' },
  standardHeaders: true,
  legacyHeaders: false,
})
// Upload: evita flooding de imÃ¡genes
const limiterUpload = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: Number(process.env.RATE_LIMIT_UPLOAD_MAX) || 30,
  message: { error: 'Demasiadas imÃ¡genes subidas seguidas, esperÃ¡ un momento.' },
  standardHeaders: true,
  legacyHeaders: false,
})
// PÃºblico: track de analytics y visitas al sitio
const limiterPublico = rateLimit({
  windowMs: 60 * 1000,
  max: Number(process.env.RATE_LIMIT_PUBLICO_MAX) || 120,
  message: { error: 'Demasiadas peticiones.' },
  standardHeaders: true,
  legacyHeaders: false,
})
// General: todas las demÃ¡s rutas autenticadas
const limiterGeneral = rateLimit({
  windowMs: 60 * 1000,
  max: Number(process.env.RATE_LIMIT_GENERAL_MAX) || 300,
  message: { error: 'Demasiadas peticiones, esperÃ¡ un momento.' },
  standardHeaders: true,
  legacyHeaders: false,
})

app.use('/api/v1/auth',             limiterAuth)
app.use('/api/v1/upload',           limiterUpload)
app.use('/api/v1/analytics/track',  limiterPublico)
app.use('/api/v1/servidor/visita',  limiterPublico)
app.use('/api/v1',                  limiterGeneral)

// â”€â”€ ImÃ¡genes estÃ¡ticas â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
app.use('/uploads', express.static(join(__dirname, 'uploads')))

// â”€â”€ Pool de conexiones â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
    console.log(`âœ…  MySQL conectado â†’ ${process.env.DB_NAME}@${process.env.DB_HOST}:${process.env.DB_PORT}`)
    conn.release()
    cleanupOrphanUploads(pool).catch(() => {})
    setInterval(() => cleanupOrphanUploads(pool).catch(() => {}), 6 * 60 * 60 * 1000)
  })
  .catch(err => {
    console.error('âŒ  Error al conectar con MySQL:', err.message)
    process.exit(1)
  })

// â”€â”€ Pool disponible en todas las rutas â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
app.use((req, _res, next) => { req.pool = pool; next() })

// â”€â”€ Health check â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
app.get('/api/v1/health', (_req, res) => res.json({ ok: true }))

// â”€â”€ AutenticaciÃ³n (rutas pÃºblicas) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
app.use('/api/v1/auth', authRouter)

// â”€â”€ RecuperaciÃ³n de contraseÃ±a (pÃºblica, rate-limited por limiterAuth) â”€â”€â”€â”€â”€â”€
app.use('/api/v1/password-reset', limiterAuth, passwordResetRouter)

// â”€â”€ Upload de imÃ¡genes (requiere sesiÃ³n) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
app.post('/api/v1/upload', requireAuth, multerMemoria.single('imagen'), async (req, res) => {
  const tipo = CARPETAS_VALIDAS.has(req.query.tipo) ? req.query.tipo : 'productos'
  if (!req.file) return res.status(400).json({ error: 'No se recibiÃ³ imagen vÃ¡lida (jpeg, png o webp)' })
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

// â”€â”€ Rutas pÃºblicas (sin auth â€” marketplace, tiendas, turismo) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
app.use('/api/v1/public', publicRouter)

// â”€â”€ Analytics (track pÃºblico + stats privado con su propio requireAuth) â”€â”€â”€â”€
app.use('/api/v1/analytics', analyticsRouter)

// â”€â”€ Servidor: visita pÃºblica + estadÃ­sticas programador â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
app.use('/api/v1/servidor', servidorRouter)

// â”€â”€ Monitor de plataforma (requireAuth aplicado en server, requireProg en ruta) â”€
app.use('/api/v1/monitor', requireAuth, monitorRouter)

// â”€â”€ CategorÃ­as (pÃºblicas) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
app.use('/api/v1/categorias', categoriasRouter)

// Rutas /categorias manejadas dentro de cada router (eventos.js / locales.js)

// â”€â”€ Rutas del programador (pÃºblicas en dev, proteger en prod) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
app.use('/api/v1/eventos', eventosRouter)
app.use('/api/v1/locales', localesRouter)

// â”€â”€ Rutas de usuario (requieren sesiÃ³n) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
app.use('/api/v1/business',    requireAuth, businessRouter)
app.use('/api/v1/portada',     requireAuth, portadaRouter)
app.use('/api/v1/pagina',      requireAuth, paginaRouter)
app.use('/api/v1/listings',    requireAuth, listingsRouter)
app.use('/api/v1/tours',       requireAuth, toursRouter)
app.use('/api/v1/mi-local',    requireAuth, miLocalRouter)
app.use('/api/v1/mis-eventos', requireAuth, misEventosRouter)

// â”€â”€ Error handler global para errores de upload (multer lÃ­mite, etc.) â”€â”€â”€â”€â”€
app.use(handleUploadError)

// â”€â”€ Inicio â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
app.listen(PORT, () => {
  console.log(`ðŸš€  Backend corriendo en http://localhost:${PORT}`)
})

