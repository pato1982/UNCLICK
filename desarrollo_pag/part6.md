# Aunclick — Plan de Desarrollo · Parte 6
**Sistema de emails, recuperación de contraseña, historial de seguridad y eliminación de cuenta**  
Continuación de `part5.md`

---

## Resumen ejecutivo

Esta parte cubre cuatro sistemas nuevos independientes implementados sobre el núcleo de autenticación: el envío de emails transaccionales, la recuperación de contraseña por token, el registro de eventos de seguridad en tabla dedicada y el sistema completo de eliminación de cuenta con período de gracia de 10 días.

También incluye el rebrand completo del proyecto de "Sanmaaunclick / soloaunclick" a **Aunclick**.

---

## Bloque 1 — Rebrand: Sanmaaunclick → Aunclick

### Alcance
Se renombraron todas las referencias visibles al usuario en el frontend. El nombre interno del repositorio y las rutas no cambiaron.

### Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `index.html` | `<title>` → "Aunclick" |
| `src/components/Footer.jsx` | `contacto@solaunclick.cl` → `contacto@aunclick.cl` |
| `src/components/PrivacyModal.jsx` | `soloaunclick.cl` → `aunclick.cl` · "Solo a un Click SpA" → "Aunclick SpA" |
| `src/components/TermsModal.jsx` | `soloaunclick.cl` → `aunclick.cl` |
| `src/components/CookiesModal.jsx` | `soloaunclick.cl` → `aunclick.cl` · "Solo a un Click SpA" → "Aunclick SpA" |
| `src/admin/components/AdminSidebar.jsx` | Email fallback `admin@soloaunclick.cl` → `admin@aunclick.cl` |

---

## Bloque 2 — Sistema de emails transaccionales (Nodemailer + Gmail)

### Problema
No había ningún sistema de comunicación por email con los usuarios. El registro y la recuperación de contraseña eran mudos.

### Solución
Se implementó un wrapper sobre **Nodemailer** usando Gmail SMTP con App Password, sin servicio externo de pago.

### Credenciales configuradas (`backend/.env`)
```
EMAIL_USER=<correo-gmail>
EMAIL_PASS=<app-password-de-gmail>
APP_URL=http://localhost:5173
```
> Las credenciales reales están en `backend/.env` (no se sube al repositorio).

### Archivo: `backend/lib/email.js`
```js
// sendWelcomeEmail(toEmail, nombre)
//   → se llama en background después del registro, no bloquea la respuesta
//
// sendPasswordResetEmail(toEmail, nombre, token)
//   → envía link con token de un solo uso, expira en 1 hora
//   → link: ${APP_URL}/?reset=${token}
```

Ambas funciones se llaman con `.catch()` para que un fallo de email nunca rompa el flujo principal.

### Cuándo se envía cada email

| Evento | Email enviado |
|--------|--------------|
| Usuario se registra | Bienvenida con nombre |
| Usuario solicita recuperar contraseña | Link de reset con token (1h TTL) |

---

## Bloque 3 — Recuperación de contraseña por token

### Flujo completo
1. Usuario hace clic en "Olvidé mi contraseña" en el login
2. Ingresa su email → `POST /api/v1/password-reset/request`
3. Backend genera token aleatorio (64 bytes hex), lo guarda en `tb_password_reset_tokens` con expiración de 1 hora
4. Envía email con link `/?reset=TOKEN` en background
5. Respuesta siempre es igual aunque el email no exista (anti-enumeración)
6. Usuario abre el link → `LoginModal.jsx` detecta `?reset=TOKEN` en la URL y muestra formulario de nueva contraseña
7. Usuario envía nueva contraseña → `POST /api/v1/password-reset/reset`
8. Backend valida token, hace bcrypt hash de la nueva contraseña, invalida **todas** las sesiones activas del usuario, borra el token

### Tabla: `tb_password_reset_tokens`
```sql
CREATE TABLE IF NOT EXISTS tb_password_reset_tokens (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  usuario_id  INT UNSIGNED NOT NULL,
  token       VARCHAR(64)  NOT NULL,
  expires_at  DATETIME     NOT NULL,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_reset_token (token),
  CONSTRAINT fk_reset_usuario FOREIGN KEY (usuario_id)
    REFERENCES usuarios (id) ON DELETE CASCADE
)
```
Script de migración: `backend/create-password-reset-table.js`

### Archivo: `backend/routes/password-reset.js`
- `POST /request` — genera token, envía email, responde igual siempre
- `POST /reset` — valida token y fecha, actualiza hash, invalida sesiones, borra token

### Frontend: `src/components/LoginModal.jsx`
- `ForgotPasswordView` — componente con 3 pasos internos: `email` → `reset` → `done`
- Al montar detecta `?reset=TOKEN` en URL y salta directo al paso `reset`
- Limpia la URL con `window.history.replaceState` para no revelar el token

---

## Bloque 4 — Cambio de contraseña autenticado

### Endpoint: `PUT /api/v1/auth/password`
Permite cambiar la contraseña desde el panel (requiere sesión activa).

Lógica:
1. Verifica sesión activa (cookie)
2. Requiere `password_actual` y `password_nueva` (mínimo 6 caracteres)
3. Verifica que `password_actual` sea correcto con `bcrypt.compare`
4. Genera nuevo hash con `bcrypt.hash` (SALT_ROUNDS = 12)
5. Actualiza `password_hash` en la tabla `usuarios`
6. Registra evento en `tb_historial_seguridad` con acción `cambio_password`

La contraseña anterior queda completamente reemplazada en la base de datos — no hay historial de contraseñas anteriores.

---

## Bloque 5 — Historial de seguridad (`tb_historial_seguridad`)

### Por qué una tabla dedicada
Los eventos de seguridad son distintos a la actividad de negocio. Mezclarlos en `tb_actividad_usuarios` dificultaba el análisis y la auditoría. La tabla dedicada permite:
- Saber cuándo alguien intentó entrar sin éxito
- Detectar resets de contraseña sospechosos
- Tener trazabilidad IP para cada evento crítico
- Conservar el registro aunque el usuario sea eliminado (ON DELETE SET NULL)

### Tabla
```sql
CREATE TABLE IF NOT EXISTS tb_historial_seguridad (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  usuario_id  INT UNSIGNED NULL,          -- NULL si usuario eliminado
  accion      ENUM(
                'reset_solicitado',
                'reset_password',
                'cambio_password',
                'login_fallido',
                'login_exitoso',
                'logout',
                'sesion_expirada',
                'cuenta_eliminacion_solicitada',
                'cuenta_recuperada',
                'cuenta_eliminada'
              ) NOT NULL,
  detalle     VARCHAR(255) NULL,          -- contexto extra: motivo, email, etc.
  ip          VARCHAR(45)  NULL,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_seg_usuario (usuario_id),
  CONSTRAINT fk_seg_usuario FOREIGN KEY (usuario_id)
    REFERENCES usuarios (id) ON DELETE SET NULL
)
```
Script de migración: `backend/create-security-log-table.js`

### Helper: `backend/lib/securityLog.js`
```js
export function logSeguridad(pool, { usuario_id = null, accion, detalle = null, ip = null }) {
  pool.query(
    `INSERT INTO tb_historial_seguridad (usuario_id, accion, detalle, ip) VALUES (?, ?, ?, ?)`,
    [usuario_id, accion, detalle, ip]
  ).catch(err => console.error('[security-log]', err.message))
}
```
Fire-and-forget: nunca bloquea ni lanza excepciones.

### Qué registra y dónde

| Evento | Acción registrada | Archivo |
|--------|-------------------|---------|
| Login correcto | `login_exitoso` | `auth.js` |
| Login con contraseña incorrecta | `login_fallido` + detalle: "contraseña incorrecta" | `auth.js` |
| Login con cuenta desactivada | `login_fallido` + detalle: "cuenta desactivada" | `auth.js` |
| Login con email no registrado | `login_fallido` + detalle: "email no registrado: …" | `auth.js` |
| Logout | `logout` | `auth.js` |
| Solicitud de reset por email | `reset_solicitado` | `password-reset.js` |
| Reset de contraseña completado | `reset_password` | `password-reset.js` |
| Cambio de contraseña desde panel | `cambio_password` | `auth.js` |
| Solicitud de eliminación de cuenta | `cuenta_eliminacion_solicitada` | `auth.js` |
| Recuperación de cuenta | `cuenta_recuperada` | `auth.js` |
| Eliminación permanente ejecutada | `cuenta_eliminada` | `auth.js` |

---

## Bloque 6 — Sistema de eliminación de cuenta con período de gracia

### Diseño del flujo
El usuario tiene **10 días corridos** para arrepentirse después de solicitar la eliminación. Pasado ese plazo, el sistema elimina todo permanentemente al próximo intento de login.

### Base de datos — cambios en `usuarios`
```sql
ALTER TABLE usuarios
ADD COLUMN eliminacion_programada_at DATETIME NULL DEFAULT NULL AFTER activo
```
Script de migración: `backend/add-account-deletion.js` (ya ejecutado)

### Flujo completo

#### 1. Solicitar eliminación (desde el panel)
- Usuario va al 4to tab "Cuenta" en el modal de perfil
- Ve la "Zona de peligro" con lista de qué se borrará
- Apreta "Solicitar eliminación" → popup de confirmación
- Confirma → `DELETE /api/v1/auth/account`
- Backend: `activo = 0` + `eliminacion_programada_at = NOW() + 10 días`
- Se cierran **todas** las sesiones del usuario
- Se registra `cuenta_eliminacion_solicitada` en historial
- Frontend redirige a `/`

#### 2. Período de gracia (10 días)
- La cuenta queda invisible al público (`activo = 0`)
- Ningún contenido se borra todavía
- Si el usuario intenta hacer login → el backend detecta `activo = 0` + `eliminacion_programada_at IS NOT NULL` + fecha futura
- Responde `{ cuenta_en_eliminacion: true, dias_restantes: X }` (HTTP 403)
- Frontend muestra pantalla especial: "Tu cuenta se elimina en X días"

#### 3. Recuperación dentro del plazo
- Usuario ve la pantalla de recuperación con días restantes
- Apreta "Sí, recuperar mi cuenta" → `POST /api/v1/auth/account/recover` con `{ email, password }`
- Backend re-autentica (sin sesión), cancela eliminación: `activo = 1`, `eliminacion_programada_at = NULL`
- Crea nueva sesión, registra `cuenta_recuperada`
- Usuario queda logueado normalmente, todo su contenido intacto

#### 4. Eliminación permanente (al expirar plazo)
Cuando el usuario intenta login y `eliminacion_programada_at <= NOW()`:

```
1. Recopila URLs de imágenes: tb_listings.imagen, tb_tours.imagenes,
   portadas.imagenes, paginas.imagen_superior/inferior, negocios.logo_url
2. INSERT en tb_historial_seguridad con accion='cuenta_eliminada'
3. DELETE FROM usuarios WHERE id = ?
   → CASCADE borra: sesiones, tb_listings, tb_tours, portadas,
     paginas, negocios, turismo_negocios, historial_planes, analytics_eventos
4. Borra archivos físicos del disco (backend/uploads/)
```

El registro de historial queda con `usuario_id = NULL` (ON DELETE SET NULL) como respaldo permanente de auditoría.

### Endpoints nuevos

#### `DELETE /api/v1/auth/account`
Requiere sesión activa (cookie). Programa la eliminación.
```
→ UPDATE usuarios SET activo=0, eliminacion_programada_at=NOW()+10d
→ DELETE FROM sesiones WHERE usuario_id=?
→ INSERT historial (cuenta_eliminacion_solicitada)
→ clearCookie('session_token')
← { ok: true }
```

#### `POST /api/v1/auth/account/recover`
Sin sesión. Autentica con email+password, cancela eliminación.
```
→ Busca usuario con activo=0 + eliminacion_programada_at > NOW()
→ bcrypt.compare(password, hash)
→ UPDATE activo=1, eliminacion_programada_at=NULL
→ INSERT sesiones (nueva sesión)
→ INSERT historial (cuenta_recuperada)
→ setCookie('session_token', ...)
← { ok: true, usuario: {...} }
```

### Frontend — AdminHeader.jsx (4to tab "Cuenta")
Se agregó el tab al array:
```js
const tabs = [
  { id: 'datos',    label: 'Datos',   icon: 'person' },
  { id: 'plan',     label: 'Plan',    icon: 'star' },
  { id: 'historial',label: 'Pagos',   icon: 'receipt_long' },
  { id: 'cuenta',   label: 'Cuenta',  icon: 'manage_accounts' },  // nuevo
]
```

`renderCuentaTab()` muestra:
- Descripción informativa
- "Zona de peligro" con borde rojo y lista de qué se elimina
- Botón "Solicitar eliminación"
- Popup de confirmación con resumen del proceso y botón final

### Frontend — LoginModal.jsx (pantalla de recuperación)
Nuevo componente `DeletionPendingView` que se muestra cuando el login detecta `cuenta_en_eliminacion: true`:
- Header naranja con ícono `person_remove`
- Badge con días restantes
- Botón verde "Sí, recuperar mi cuenta" → llama `POST /account/recover`
- Botón gris "No, continuar con la eliminación" → vuelve al login sin hacer nada

---

## Archivos creados/modificados en esta parte

| Archivo | Tipo de cambio |
|---------|---------------|
| `backend/lib/email.js` | Nuevo — wrapper Nodemailer Gmail SMTP |
| `backend/lib/securityLog.js` | Nuevo — helper fire-and-forget para historial |
| `backend/routes/password-reset.js` | Nuevo — endpoints request y reset de contraseña |
| `backend/routes/auth.js` | Modificado — welcome email, logSeguridad en login/logout, PUT /password, DELETE /account, POST /account/recover, eliminación permanente |
| `backend/server.js` | Modificado — registro de passwordResetRouter |
| `backend/setup-db.js` | Modificado — tb_historial_seguridad, tb_password_reset_tokens, columna eliminacion_programada_at |
| `backend/create-security-log-table.js` | Nuevo — script de migración |
| `backend/create-password-reset-table.js` | Nuevo — script de migración |
| `backend/add-account-deletion.js` | Nuevo — script de migración (ejecutado) |
| `backend/.env` | Modificado — EMAIL_USER, EMAIL_PASS, APP_URL |
| `src/admin/components/AdminHeader.jsx` | Modificado — 4to tab "Cuenta" + renderCuentaTab + popup eliminación |
| `src/components/LoginModal.jsx` | Modificado — ForgotPasswordView + DeletionPendingView |
| `index.html` | Modificado — title → "Aunclick" |
| `src/components/Footer.jsx` | Modificado — email → aunclick.cl |
| `src/components/PrivacyModal.jsx` | Modificado — rebrand a Aunclick SpA |
| `src/components/TermsModal.jsx` | Modificado — rebrand a aunclick.cl |
| `src/components/CookiesModal.jsx` | Modificado — rebrand a Aunclick SpA |
| `src/admin/components/AdminSidebar.jsx` | Modificado — email fallback + corrección minPlan turismo |

---

## Estado de la base de datos al cierre de esta parte

### Tablas de seguridad y autenticación

```
usuarios
  ├── activo                    TINYINT(1) DEFAULT 1
  └── eliminacion_programada_at DATETIME NULL        ← nuevo

sesiones
  └── CASCADE desde usuarios

tb_historial_seguridad
  ├── usuario_id  → SET NULL al eliminar usuario
  ├── accion      ENUM (10 valores)                  ← extendido
  └── ip, detalle, created_at

tb_password_reset_tokens
  ├── token       VARCHAR(64) UNIQUE
  ├── expires_at  (1 hora TTL)
  └── CASCADE desde usuarios
```

---

Continúa en `part7.md`
