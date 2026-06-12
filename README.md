# Sanmaaunclick — Solo Diseño (Frontend)

Marketplace local de **Villarrica** — Copia del proyecto **Solo a un Click** con **solo el frontend/diseño**.
Sin backend, sin base de datos y sin conexiones a ningún servidor.

> ⚠️ Las llamadas a `/api/...` no responderán (no hay backend).
> Eso es normal: este proyecto es solo para trabajar el **diseño/UI**.

## Cómo levantarlo

```bash
npm install      # solo la primera vez
npm run dev      # abre http://localhost:5173
```

## Qué incluye
- `src/` — todo el frontend React (App.jsx, components/, admin/, lib/, estilos)
- `public/` — imágenes y assets estáticos
- `index.html`, `vite.config.js`, `tailwind.config.js`, `postcss.config.js`

## Qué NO incluye (a propósito)
- ❌ Backend (carpeta `backend/`)
- ❌ Base de datos / MySQL
- ❌ Archivos `.env` / credenciales
- ❌ Proxy al API (removido del `vite.config.js`)

## Tecnologías
React 18 + Vite + Tailwind CSS + React Router 7
