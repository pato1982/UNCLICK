# Levantar UNCLICK en local

Stack: **React 18 + Vite 6** (frontend) · **Express 5 + mysql2** (backend, sin ORM) · **MySQL 8 en Docker**.

> El `README.md` dice "solo frontend" — está desactualizado, el repo trae el stack completo.

## Requisitos

- Node 20+
- Docker (para MySQL)

## Puertos

| Servicio | Puerto | Nota |
|---|---|---|
| Frontend (Vite) | **5173** | proxea `/api` y `/uploads` al backend |
| Backend (Express) | **3002** | 3001 lo ocupa wa-sender en algunas máquinas |
| MySQL (Docker) | **3309** | coexiste con otros proyectos (3306/3307/3308) |

## Primera vez

```bash
# 1. Base de datos
docker compose up -d

# 2. Configuración del backend
cp backend/.env.example backend/.env

# 3. Dependencias
npm install                 # frontend (raíz)
cd backend && npm install   # backend

# 4. Esquema + migraciones + datos de prueba
npm run db:setup            # desde backend/
```

`db:setup` es idempotente: se puede correr las veces que sea. Deja ~36
categorías, 227 subcategorías, 33 usuarios de prueba, ~198 publicaciones, 40
tours, 12 locales y 12 eventos. **No necesita internet**: todas las imágenes
son locales.

## Cada arranque

```bash
# Terminal 1 — backend (¡desde backend/, dotenv resuelve el .env por CWD!)
cd backend && npm run dev     # → http://localhost:3002

# Terminal 2 — frontend
npm run dev                   # → http://localhost:5173
```

## Cuentas de prueba

Password para todas: **`Dev1234!`**

En el modal de login (solo en dev) hay un desplegable **"DEV · Acceso rápido"**
con todas ellas. Las principales:

| Cuenta | Rol / tipo | Plan | Para probar |
|---|---|---|---|
| `admin@qa.dev` | programador | 4 | Panel programador, monitor, estadísticas de servidor |
| `gen_p1_p@qa.dev` … `gen_p3_psa@qa.dev` | general | 1-3 | 7 combinaciones de productos/servicios/arriendos × 3 planes |
| `gen_p4@qa.dev` | general | 4 | Premium Plus |
| `tur_p1@qa.dev` | turismo | 1 | Turismo sin features premium |
| `tur_p3@qa.dev` | turismo | 5 | Portada, tours y página propia |
| `local_p1@qa.dev` | local | 1 | `/admin/mi-local` |
| `evento_p1@qa.dev` | evento | 1 | `/admin/mis-eventos` |

Plan 3+ desbloquea Banner, Apariencia y Estadísticas. Plan 5 (turismo)
desbloquea Página propia y Tours.

## Comandos útiles

```bash
# desde backend/
npm run db:setup     # aplica esquema + migraciones + seeds (idempotente)
npm run db:reset     # borra la BD entera y la reconstruye
npm test             # smoke test (backend arriba)

# desde la raíz
docker compose logs -f mysql
docker compose down          # detiene MySQL, conserva los datos
docker compose down -v       # ⚠️ borra también el volumen
```

## Verificar que todo conecta

```bash
curl http://localhost:3002/api/v1/health        # {"ok":true}
curl http://localhost:5173/api/v1/categorias    # 36 categorías vía proxy
```

## Notas

**MySQL corre en UTC a propósito.** Producción está en un VPS con hora de
Alemania mientras los usuarios están en Chile; tener el contenedor en una zona
distinta a la del navegador es lo que permite reproducir localmente los bugs de
fecha. Si se cambia a `America/Santiago`, esos bugs dejan de aparecer.

**Recuperación de contraseña sin SMTP:** `EMAIL_USER`/`EMAIL_PASS` vienen
vacíos, así que el correo no se envía (la API responde 200 igual, por
anti-enumeración). Para probar el flujo, sacar el token de la BD y abrirlo a
mano:

```bash
docker compose exec mysql mysql -uunclick_user -punclick_local unclik \
  -e "SELECT token FROM tb_password_reset_tokens ORDER BY id DESC LIMIT 1;"
# luego: http://localhost:5173/?reset=<token>
```

**Rate limiting:** el `.env.example` trae límites holgados para desarrollo. En
producción esas variables se omiten y aplican los defaults estrictos del código
(20 intentos / 15 min en `/api/v1/auth`).

## Troubleshooting

| Síntoma | Causa |
|---|---|
| Backend sale con `Faltan variables de BD` | Se arrancó desde la raíz. `dotenv` resuelve por CWD: `cd backend` primero. |
| `ECONNREFUSED` al puerto 3309 | El contenedor no está arriba: `docker compose up -d` y esperar el healthcheck. |
| Dropdowns de categoría vacíos en el admin | Falta correr `npm run db:setup`. |
| 429 en todo | Se está corriendo con los límites de producción; revisar las `RATE_LIMIT_*` del `.env`. |
| Un evento no aparece en el sitio público | `tb_eventos.fecha` debe ser ISO `YYYY-MM-DD`. Es un `VARCHAR` de texto libre, pero se compara con `CURDATE()`; cualquier otro formato lo deja invisible. |

## Scripts legacy

`backend/_legacy/` tiene los scripts que construían el esquema antes de que
existieran `schema.sql` + `migrations/`. **No ejecutarlos** — algunos crean
tablas duplicadas o borran datos. Ver `backend/_legacy/README.md`.
