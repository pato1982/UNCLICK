# Levantar UNCLICK en local

Stack real: **React 18 + Vite** (frontend) · **Express 5 + mysql2** (backend) · **MariaDB** (datos).
> Nota: el `README.md` dice "solo frontend" pero está **desactualizado** — el repo trae el stack completo.

## Requisitos
- Node 20+ (probado con v22)
- **XAMPP MariaDB** corriendo en `127.0.0.1:3308`, usuario `root` **sin contraseña**
  (misma instancia desde la que se generó `unclik_dump.sql`)

## Puertos (local)
| Servicio | Puerto | Notas |
|---|---|---|
| Frontend (Vite) | **5174** | 5173 suele estar ocupado por otro proyecto |
| Backend (Express) | **3002** | 3001 lo ocupa `wa-sender` (PM2) — por eso UNCLICK usa 3002 |
| MariaDB (XAMPP) | 3308 | BD `unclik` |

## Primera vez

```bash
# 1. Base de datos — importar el dump (viene en UTF-16, hay que convertirlo)
#    En PowerShell:
$in="unclik_dump.sql"; $out="$env:TEMP\unclik_utf8.sql"
$t=[IO.File]::ReadAllText($in,[Text.Encoding]::Unicode)
[IO.File]::WriteAllText($out,$t,(New-Object Text.UTF8Encoding($false)))
& "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -h 127.0.0.1 -P 3308 -e "source $out"
#    (el dump incluye CREATE DATABASE unclik + datos: 16 tablas, ~153 listings)

# 2. Dependencias
npm install                 # frontend (raíz)
cd backend && npm install   # backend
```

El archivo `backend/.env` ya está configurado (gitignored):
```
DB_HOST=127.0.0.1
DB_PORT=3308
DB_USER=root
DB_PASS=
DB_NAME=unclik
PORT=3002
APP_URL=http://localhost:5173
EMAIL_USER=   # opcional (solo recuperación de contraseña)
EMAIL_PASS=
```

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
- **MySQL no conecta** → confirmar que XAMPP está en 3308 (no el servicio `MySQL80` de Windows, que usa 3306 y tiene contraseña).
- **Dump falla al importar** (`ASCII '\0'` / `Unknown command '\U'`) → el `.sql` está en UTF-16; convertir a UTF-8 (paso 1).
