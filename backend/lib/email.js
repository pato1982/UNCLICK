import { Resend } from 'resend'

const resend  = new Resend(process.env.RESEND_API_KEY)
const FROM    = process.env.EMAIL_FROM || 'Sanmaaunclick <no-reply@sanmaaunclick.cl>'
const APP_URL = process.env.APP_URL    || 'http://localhost:5173'

export async function sendPasswordResetEmail(toEmail, nombre, token) {
  const resetUrl = `${APP_URL}?reset=${token}`

  await resend.emails.send({
    from: FROM,
    to:   toEmail,
    subject: 'Recupera tu contraseña — Sanmaaunclick',
    html: `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:system-ui,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 20px;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08);">
        <!-- Header -->
        <tr><td style="background:#3B1969;padding:32px 40px;text-align:center;">
          <p style="margin:0;font-size:22px;font-weight:900;color:#fff;letter-spacing:-0.5px;">Sanmaaunclick</p>
          <p style="margin:6px 0 0;font-size:12px;color:rgba(255,255,255,.6);">Marketplace local de Villarrica</p>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:40px;">
          <h1 style="margin:0 0 8px;font-size:20px;font-weight:800;color:#1a1a2e;">Hola, ${nombre} 👋</h1>
          <p style="margin:0 0 24px;font-size:14px;color:#555;line-height:1.6;">
            Recibimos una solicitud para restablecer la contraseña de tu cuenta. Haz clic en el botón de abajo para crear una nueva contraseña.
          </p>
          <div style="text-align:center;margin:32px 0;">
            <a href="${resetUrl}" style="background:#3B1969;color:#fff;text-decoration:none;font-weight:700;font-size:14px;padding:14px 32px;border-radius:10px;display:inline-block;">
              Restablecer contraseña
            </a>
          </div>
          <p style="margin:0 0 8px;font-size:12px;color:#888;line-height:1.5;">
            Este enlace expira en <strong>1 hora</strong>. Si no solicitaste este cambio, puedes ignorar este email con seguridad.
          </p>
          <p style="margin:0;font-size:11px;color:#bbb;word-break:break-all;">
            O copia este enlace en tu navegador:<br>${resetUrl}
          </p>
        </td></tr>
        <!-- Footer -->
        <tr><td style="background:#f9f9fb;padding:20px 40px;border-top:1px solid #eee;text-align:center;">
          <p style="margin:0;font-size:11px;color:#aaa;">Sanmaaunclick · Villarrica, Chile</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
    `.trim(),
  })
}

export async function sendWelcomeEmail(toEmail, nombre) {
  await resend.emails.send({
    from: FROM,
    to:   toEmail,
    subject: '¡Bienvenido/a a Sanmaaunclick! 🎉',
    html: `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:system-ui,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 20px;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08);">
        <tr><td style="background:#3B1969;padding:32px 40px;text-align:center;">
          <p style="margin:0;font-size:22px;font-weight:900;color:#fff;letter-spacing:-0.5px;">Sanmaaunclick</p>
          <p style="margin:6px 0 0;font-size:12px;color:rgba(255,255,255,.6);">Marketplace local de Villarrica</p>
        </td></tr>
        <tr><td style="padding:40px;">
          <h1 style="margin:0 0 8px;font-size:20px;font-weight:800;color:#1a1a2e;">¡Bienvenido/a, ${nombre}! 🎉</h1>
          <p style="margin:0 0 16px;font-size:14px;color:#555;line-height:1.6;">
            Tu cuenta en Sanmaaunclick está lista. Ahora puedes acceder a tu panel de administración y empezar a publicar tus productos, servicios o experiencias turísticas.
          </p>
          <div style="text-align:center;margin:32px 0;">
            <a href="${APP_URL}" style="background:#3B1969;color:#fff;text-decoration:none;font-weight:700;font-size:14px;padding:14px 32px;border-radius:10px;display:inline-block;">
              Ir a mi panel
            </a>
          </div>
          <p style="margin:0;font-size:12px;color:#888;line-height:1.5;">
            Si tienes dudas, responde este email y te ayudamos.
          </p>
        </td></tr>
        <tr><td style="background:#f9f9fb;padding:20px 40px;border-top:1px solid #eee;text-align:center;">
          <p style="margin:0;font-size:11px;color:#aaa;">Sanmaaunclick · Villarrica, Chile</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
    `.trim(),
  })
}
