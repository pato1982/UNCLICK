# Levantar UNCLICK en local

Stack real: **React 18 + Vite** (frontend) · **Express 5 + mysql2** (backend) · **MySQL 8 en Docker** (datos).
> Nota: el `README.md` dice "solo frontend" pero está **desactualizado** — el repo trae el stack completo.
> La BD migró de XAMPP/MariaDB a un contenedor Docker MySQL 8 (paridad con producción). XAMPP queda como fallback opcional.

## Requisitos
- Node 20+ (probado con v22)
- **Docker Desktop** corriendo

## Puertos (local)
| Servicio | Puerto | Notas |
|---|---|---|
| Frontend (Vite) | **5174** | 5173 suele estar ocupado por otro proyecto |
| Backend (Express) | **3002** | 3001 lo ocupa `wa-sender` (PM2) — por eso UNCLICK usa 3002 |
| MySQL (Docker `unclick-mysql`) | **3309** | BD `unclik` (3306/07 son otros proyectos, 3308 era XAMPP) |

## Primera vez

> **Paso 0 — Crear tu `docker-compose.yml`** (no viene en el repo: las credenciales y el puerto
> son propios de cada máquina). Copiá este contenido en la raíz del proyecto y ajustá puerto/credenciales
> a tu entorno. Asegurate de que coincidan con tu `backend/.env`:
>
> ```yaml
> services:
>   mysql:
>     image: mysql:8.0.46
>     container_name: unclick-mysql
>     restart: unless-stopped
>     ports:
>       - "127.0.0.1:3309:3306"   # ajustá 3309 si lo tenés ocupado
>     environment:
>       MYSQL_ROOT_PASSWORD: cambia-esto
>       MYSQL_DATABASE: unclik
>       MYSQL_USER: unclick_user
>       MYSQL_PASSWORD: cambia-esto
>     command:
>       - --character-set-server=utf8mb4
>       - --collation-server=utf8mb4_unicode_ci
>     volumes:
>       - unclick_mysql_data:/var/lib/mysql
>       - ./backend/db/schema.v0.sql:/docker-entrypoint-initdb.d/01-schema.sql:ro
>     healthcheck:
>       test: ["CMD", "mysqladmin", "ping", "-h", "127.0.0.1", "-uroot", "-pcambia-esto"]
>       interval: 10s
>       timeout: 5s
>       retries: 10
>       start_period: 30s
> volumes:
>   unclick_mysql_data:
>     name: unclick_mysql_data
> ```
>
> El volumen monta `backend/db/schema.v0.sql` (la fuente de verdad canónica, 22 tablas) en el primer arranque.

```bash
# 1. Base de datos en Docker — levantar el contenedor (auto-crea el schema la 1ª vez)
docker compose up -d

# 2. Dependencias
npm install                 # frontend (raíz)
cd backend && npm install   # backend

# 3. Completar la BD: migraciones + categorías + datos demo de QA  → 22 tablas
cd backend && npm run db:setup
#    Usuarios QA: cualquier email @qa.dev · password: Dev1234!
```

El archivo `backend/.env` ya está configurado (gitignored), apuntando al contenedor:
```
DB_HOST=127.0.0.1
DB_PORT=3309
DB_USER=unclick_user
DB_PASS=unclick_pass
DB_NAME=unclik
PORT=3002
APP_URL=http://localhost:5173
EMAIL_USER=   # opcional (solo recuperación de contraseña)
EMAIL_PASS=
```

### Gestión del contenedor de BD
```bash
docker compose up -d        # arrancar (conserva datos en el volumen unclick_mysql_data)
docker compose down         # detener (NO borra datos)
docker compose down -v      # detener y BORRAR datos (reset total → repetir db:setup)
docker compose logs -f mysql
```

> **Volver a XAMPP (fallback):** en `backend/.env` poner `DB_PORT=3308`, `DB_USER=root`, `DB_PASS=` (vacío).

## Cada arranque

```bash
# Terminal 1 — backend
cd backend && npm run dev     # node --watch server.js  → http://localhost:3002

# Terminal 2 — frontend
npm run dev                   # vite → http://localhost:5174 (proxy /api → :3002)
```

## Verificar que todo conecta
```bash
curl http://localhost:3002/api/v1/health        # {"ok":true}
curl http://localhost:5174/api/v1/categorias    # 109 categorías (proxy → backend → BD)
```

## Troubleshooting
- **404 en /api/v1/health** → otro proceso ocupa el puerto del backend (revisar `pm2 list` y `Get-NetTCPConnection -LocalPort 3002`).
- **MySQL no conecta** → confirmar que el contenedor está arriba y sano: `docker compose ps` (estado `healthy`). Debe escuchar en `127.0.0.1:3309`.
- **`/categorias` vacío** → faltó correr `npm run db:setup` (carga categorías + datos QA tras `docker compose up`).
- **Puerto 3309 ocupado** → otro servicio lo tomó; cambiar el mapeo en `docker-compose.yml` y `DB_PORT` en `backend/.env`.
- **db:setup apunta al contenedor equivocado** → `db-setup.mjs` carga `backend/.env`; verificá que `DB_PORT=3309` (las migraciones sueltas tienen fallback histórico a 3306, que es otro proyecto).
