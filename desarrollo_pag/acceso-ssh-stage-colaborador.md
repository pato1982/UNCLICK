# Acceso SSH al servidor STAGE — Guía para colaborador

> **Objetivo:** darte acceso SSH al entorno **stage** de UNCLICK de forma segura, con tu propia
> llave y un usuario limitado que **no toca producción**.
>
> ⚠️ **Importante:** el stage vive en el **mismo servidor físico que producción** (`localclick.cl`,
> con clientes reales). Por eso tu usuario está restringido solo a la carpeta de stage. **No uses
> `sudo` ni toques nada fuera de `/var/www/unclick-stage`.**

---

## Resumen del entorno stage

| Dato | Valor |
|---|---|
| Servidor | VPS Villarrica (Contabo) |
| IP | `158.220.123.58` |
| Usuario SSH (tuyo) | `deploy-stage` |
| Puerto SSH | `22` |
| Directorio de la app stage | `/var/www/unclick-stage` |
| URL stage | `https://stage.localclick.cl` (protegida con Basic Auth) |
| Backend stage | puerto interno `3002` (PM2: `unclick-stage`) |

> El usuario y contraseña del **Basic Auth** del sitio (`stage.localclick.cl`) y los secretos de la
> app **no van en este documento** — te los paso por un canal seguro aparte.

---

## PARTE 1 — Lo que haces TÚ (colaborador)

### Paso 1 — Generar tu par de llaves SSH (si no tienes una)

En tu máquina, abre una terminal y ejecuta:

```bash
ssh-keygen -t ed25519 -C "tu-correo@ejemplo.com" -f ~/.ssh/unclick_stage
```

- Cuando pida *passphrase*, pon una (recomendado) o déjala vacía con Enter.
- Esto crea **dos archivos**:
  - `~/.ssh/unclick_stage` → tu llave **privada** (🔒 **NUNCA la compartas ni la envíes a nadie**).
  - `~/.ssh/unclick_stage.pub` → tu llave **pública** (✅ esta sí se comparte).

> En Windows con PowerShell el comando es el mismo; las llaves quedan en `C:\Users\TU_USUARIO\.ssh\`.

### Paso 2 — Enviarme tu llave PÚBLICA

Muestra el contenido de la llave **pública** y envíamelo (es seguro compartirla):

```bash
cat ~/.ssh/unclick_stage.pub
```

Copia la línea completa (empieza con `ssh-ed25519 ...`) y mándamela por WhatsApp o el canal que usemos.

> 🔒 **Nunca** me envíes el archivo SIN `.pub` (la privada). Si alguna vez la compartes por error,
> hay que regenerar el par completo.

### Paso 3 — Esperar mi confirmación

Yo autorizo tu llave en el servidor (Parte 2). Te aviso cuando esté lista.

### Paso 4 — Conectarte

Una vez te confirme, conéctate con:

```bash
ssh -i ~/.ssh/unclick_stage deploy-stage@158.220.123.58
```

Para no escribir la ruta cada vez, agrega esto a tu archivo `~/.ssh/config`:

```
Host unclick-stage
    HostName 158.220.123.58
    User deploy-stage
    IdentityFile ~/.ssh/unclick_stage
    Port 22
```

Y luego simplemente:

```bash
ssh unclick-stage
```

### Qué puedes hacer una vez dentro

- Trabajar dentro de `/var/www/unclick-stage` (código de la app stage).
- Hacer deploy de stage con el script: `./deploy-stage.sh` (git pull + build + reload PM2).
- Ver logs de stage: `pm2 logs unclick-stage`.

### Qué NO debes hacer

- ❌ Salir de `/var/www/unclick-stage` para tocar `/var/www/unclick` (eso es **producción**).
- ❌ Usar `sudo`, reiniciar nginx (`restart`), ni tocar la BD de producción.
- ❌ Compartir tu llave privada con nadie.

---

## PARTE 2 — Lo que hago YO (con acceso root) — al recibir tu llave pública

> Esta sección es para el administrador del VPS (referencia interna). Se ejecuta **una sola vez**.

```bash
# 1. Conectarse como root al VPS
ssh -i ~/.ssh/villarrica root@158.220.123.58

# 2. Crear el usuario de deploy aislado (sin sudo, sin acceso a prod)
adduser --disabled-password --gecos "" deploy-stage

# 3. Darle propiedad de la carpeta stage (y SOLO esa)
chown -R deploy-stage:deploy-stage /var/www/unclick-stage

# 4. Preparar su carpeta .ssh
mkdir -p /home/deploy-stage/.ssh
chmod 700 /home/deploy-stage/.ssh

# 5. Pegar la llave PÚBLICA que envió el colaborador en authorized_keys
echo "ssh-ed25519 AAAA... tu-correo@ejemplo.com" >> /home/deploy-stage/.ssh/authorized_keys

# 6. Permisos correctos
chmod 600 /home/deploy-stage/.ssh/authorized_keys
chown -R deploy-stage:deploy-stage /home/deploy-stage/.ssh
```

### Endurecimiento recomendado (opcional pero aconsejado)

- Verificar que `deploy-stage` **no esté** en el grupo `sudo`: `groups deploy-stage` (no debe aparecer `sudo`).
- Confiar el aislamiento a permisos de carpeta: `deploy-stage` no es dueño de `/var/www/unclick`
  (producción), así que no puede modificarla.
- Si se quiere restringir aún más a futuro: evaluar `Match User deploy-stage` en
  `/etc/ssh/sshd_config` con `ChrootDirectory` (no imprescindible para empezar).

### Verificación post-setup

```bash
# Desde la máquina del colaborador (o simulando):
ssh -i ~/.ssh/unclick_stage deploy-stage@158.220.123.58 "whoami && pwd && ls /var/www/unclick-stage | head"
# Debe responder: deploy-stage / /home/deploy-stage / contenido de la app stage
```

---

## Notas de seguridad

- Cada persona usa **su propia llave**. Nunca se comparte una llave privada entre dos personas.
- Si el colaborador deja el proyecto: `userdel -r deploy-stage` en el VPS revoca su acceso al instante.
- Los secretos de la app (`ecosystem.stage.config.cjs`) y el Basic Auth del sitio **no** están en
  este documento ni en el repo — se entregan por canal seguro aparte.
- Recordatorio: este VPS también corre **producción**. El aislamiento del usuario `deploy-stage` es
  lo que protege a los clientes reales de un error accidental.
