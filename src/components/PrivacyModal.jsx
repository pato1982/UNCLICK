export default function PrivacyModal({ onClose }) {
  return (
    <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-primary px-6 py-4 flex items-center justify-between shrink-0">
          <h2 className="text-white font-bold text-base sm:text-lg flex items-center gap-2">
            <span className="material-symbols-outlined">shield_lock</span>
            Política de Privacidad y Protección de Datos
          </h2>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white transition-colors"
            aria-label="Cerrar"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Body scrollable */}
        <div className="overflow-y-auto px-6 py-5 text-[13px] sm:text-sm text-slate-700 leading-relaxed space-y-4 text-justify">
          <p className="text-[11px] text-slate-400">Última actualización: 11 de junio de 2026</p>

          <Section title="1. Introducción y Compromiso">
            <p>
              En <strong>Solo a un Click SpA</strong> (en adelante, "la Empresa", "nosotros") respetamos y protegemos la
              privacidad de los usuarios de nuestra plataforma. La presente Política de Privacidad describe cómo
              recopilamos, utilizamos, almacenamos, comunicamos y protegemos los datos personales de quienes acceden o
              utilizan nuestros servicios, en cumplimiento de la <strong>Ley N° 19.628</strong> sobre Protección de la
              Vida Privada y la <strong>Ley N° 21.663</strong> de 2024 (nueva Ley de Protección de Datos Personales),
              cuya autoridad de control es la <strong>Agencia de Protección de Datos Personales</strong>, y demás
              normativa aplicable de la República de Chile.
            </p>
            <p>
              El acceso y uso de la Plataforma implica el conocimiento y aceptación de esta Política. En caso de no
              estar de acuerdo, le solicitamos abstenerse de utilizar el Servicio.
            </p>
          </Section>

          <Section title="2. Identificación del Responsable del Tratamiento">
            <p>
              El responsable del tratamiento de los datos personales recopilados a través de la Plataforma es:
            </p>
            <ul className="mt-2 space-y-0.5 text-left">
              <li><strong>Razón social:</strong> Solo a un Click SpA</li>
              <li><strong>Domicilio:</strong> Villarrica, Región de La Araucanía, Chile</li>
              <li><strong>Correo de contacto:</strong> contacto@soloaunclick.cl</li>
              <li><strong>Encargado de Datos Personales:</strong> datos@soloaunclick.cl</li>
            </ul>
          </Section>

          <Section title="3. Datos Personales que Recopilamos">
            <p>Dependiendo de la interacción con la Plataforma, podemos recopilar las siguientes categorías de datos:</p>

            <p className="font-semibold text-slate-800 mt-2">3.1. Datos de identificación y contacto</p>
            <p>
              Nombre, apellido, <strong>RUT</strong> (si emite factura o boleta), correo electrónico, número de teléfono
              móvil, dirección física o comercial. Estos datos se obtienen al momento del registro o durante la
              contratación de un plan.
            </p>

            <p className="font-semibold text-slate-800 mt-2">3.2. Datos comerciales del negocio</p>
            <p>
              Razón social del negocio, slogan, descripción, redes sociales, horarios de atención, ubicación,
              fotografías y descripciones de productos, servicios, arriendos o actividades publicadas en la Plataforma.
            </p>

            <p className="font-semibold text-slate-800 mt-2">3.3. Datos de pago</p>
            <p>
              La Empresa <strong>no almacena datos completos de tarjetas bancarias</strong>. El procesamiento de pagos
              se realiza a través de pasarelas certificadas y reguladas por la <strong>Comisión para el Mercado
              Financiero (CMF)</strong> y el <strong>Banco Central de Chile</strong>, las cuales tratan los datos bajo
              sus propias políticas y bajo el estándar PCI-DSS. La Empresa solo conserva el tipo de tarjeta, los últimos
              cuatro dígitos y el identificador de la transacción para fines de facturación, conciliación y soporte.
            </p>

            <p className="font-semibold text-slate-800 mt-2">3.4. Datos técnicos y de navegación</p>
            <p>
              Dirección IP, tipo de dispositivo, sistema operativo, navegador, idioma, identificadores de cookies, hora
              de conexión y páginas visitadas. Estos datos se recopilan automáticamente y se utilizan con fines de
              seguridad, prevención de fraude y mejora del servicio.
            </p>

            <p className="font-semibold text-slate-800 mt-2">3.5. Datos de uso e interacción</p>
            <p>
              Estadísticas de visitas a las páginas de tienda, clics sobre productos o publicaciones, interacciones con
              elementos de la interfaz y métricas de desempeño del servicio.
            </p>
          </Section>

          <Section title="4. Finalidades del Tratamiento">
            <p>Los datos personales se tratan para los siguientes fines, debidamente informados y autorizados:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li><strong>Prestación del Servicio:</strong> creación y administración de cuentas, autenticación, publicación de contenidos y funcionamiento de la Plataforma.</li>
              <li><strong>Gestión de pagos y facturación:</strong> cobro de planes pagados, emisión de boleta o factura electrónica conforme a la normativa del <strong>SII</strong> (Servicio de Impuestos Internos).</li>
              <li><strong>Comunicación con el Cliente:</strong> envío de notificaciones operativas, alertas de seguridad, recordatorios de pago y respuestas a consultas o reclamos.</li>
              <li><strong>Cumplimiento de obligaciones legales:</strong> contables, tributarias y respuestas a requerimientos de autoridades competentes.</li>
              <li><strong>Seguridad y prevención de fraude:</strong> detección de accesos no autorizados, abusos, suplantación o usos indebidos.</li>
              <li><strong>Estadísticas y mejora del Servicio:</strong> análisis agregado y disociado del uso de la Plataforma.</li>
              <li><strong>Marketing directo:</strong> envío de comunicaciones comerciales, novedades, ofertas o encuestas, <em>solo</em> con consentimiento previo del titular y siempre con la opción de revocarlo.</li>
            </ul>
          </Section>

          <Section title="5. Base de Licitud del Tratamiento">
            <p>El tratamiento de datos personales se sustenta, según corresponda, en alguna de las siguientes bases:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li><strong>Consentimiento expreso:</strong> manifestado al registrarse, contratar un plan o aceptar comunicaciones comerciales.</li>
              <li><strong>Ejecución de un contrato:</strong> necesario para prestar el Servicio contratado.</li>
              <li><strong>Cumplimiento de obligación legal:</strong> normativa tributaria, contable o requerimientos de autoridad.</li>
              <li><strong>Interés legítimo:</strong> seguridad, prevención de fraude y mejora razonable del servicio, siempre que no prevalezcan los derechos del titular.</li>
            </ul>
            <p className="mt-2">
              El consentimiento puede ser <strong>revocado en cualquier momento</strong>, sin efecto retroactivo, mediante
              solicitud al correo del Encargado de Datos Personales.
            </p>
          </Section>

          <Section title="6. Período de Conservación de los Datos">
            <p>
              Los datos personales se conservan únicamente por el tiempo necesario para cumplir con las finalidades
              informadas, conforme a los siguientes plazos generales:
            </p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li><strong>Datos de cuenta y contrato:</strong> mientras la suscripción se encuentre vigente y hasta 5 años posteriores al término, conforme a las normas de prescripción tributaria del <strong>Código Tributario</strong> chileno.</li>
              <li><strong>Documentos de facturación:</strong> 6 años, conforme al Código Tributario.</li>
              <li><strong>Datos de seguridad y logs:</strong> hasta 12 meses, salvo investigación en curso.</li>
              <li><strong>Datos analíticos disociados:</strong> indefinido, sin posibilidad de reidentificación.</li>
              <li><strong>Datos para marketing:</strong> hasta que el titular revoque su consentimiento.</li>
            </ul>
            <p className="mt-2">
              Cumplidos los plazos, los datos serán <strong>eliminados o anonimizados</strong> de forma segura.
            </p>
          </Section>

          <Section title="7. Comunicación a Terceros y Encargados de Tratamiento">
            <p>
              La Empresa no vende, arrienda ni cede datos personales a terceros con fines comerciales. Sin embargo,
              ciertos prestadores acceden a los datos en calidad de <strong>encargados del tratamiento</strong>, sujetos
              a contratos de confidencialidad y protección de datos, exclusivamente para los fines descritos:
            </p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li><strong>Pasarelas de pago</strong> reguladas por la CMF para procesar transacciones.</li>
              <li><strong>Proveedores de hosting, almacenamiento y nube</strong> para alojar la infraestructura.</li>
              <li><strong>Servicios de envío de correo electrónico</strong> transaccional y notificaciones.</li>
              <li><strong>Servicios de analítica</strong> para mediciones de uso, en su mayoría disociadas.</li>
              <li><strong>Asesores legales, contables o auditores</strong> sujetos a deber de secreto profesional.</li>
              <li><strong>Autoridades públicas</strong>, exclusivamente cuando exista obligación legal o requerimiento judicial.</li>
            </ul>
          </Section>

          <Section title="8. Transferencias Internacionales">
            <p>
              Algunos prestadores de tecnología (servidores cloud, correo, analítica) pueden encontrarse en jurisdicciones
              fuera de Chile. En estos casos, la Empresa adopta las garantías exigidas por la <strong>Ley N° 19.628</strong> y
              la <strong>Ley N° 21.663</strong>, ya sea celebrando cláusulas contractuales tipo, verificando que el
              destinatario cuente con un nivel adecuado de protección, o requiriendo el consentimiento expreso del
              titular cuando corresponda.
            </p>
          </Section>

          <Section title="9. Derechos del Titular de los Datos">
            <p>
              Conforme a la <strong>Ley N° 19.628</strong> y la <strong>Ley N° 21.663</strong>, todo titular de datos
              personales tiene los siguientes derechos respecto de la información que la Empresa trata:
            </p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li><strong>Acceso:</strong> conocer si se están tratando datos suyos y obtener una copia de ellos.</li>
              <li><strong>Rectificación:</strong> solicitar la corrección de datos inexactos, incompletos o desactualizados.</li>
              <li><strong>Supresión o cancelación:</strong> pedir la eliminación de datos cuando ya no sean necesarios o se haya revocado el consentimiento.</li>
              <li><strong>Oposición:</strong> oponerse al tratamiento por motivos legítimos, incluido el marketing directo.</li>
              <li><strong>Portabilidad:</strong> recibir los datos en un formato estructurado, de uso común y lectura mecánica, o solicitar su transmisión a otro responsable.</li>
              <li><strong>Bloqueo:</strong> suspender temporalmente el tratamiento mientras se resuelve una solicitud.</li>
              <li><strong>Oposición a decisiones automatizadas</strong> que produzcan efectos jurídicos o significativos sobre el titular.</li>
            </ul>
            <p className="mt-2">
              Estos derechos pueden ejercerse de forma <strong>gratuita</strong> mediante solicitud escrita al correo
              <strong> datos@soloaunclick.cl</strong>, identificando al titular y acompañando documento que acredite su
              identidad. La Empresa responderá en un plazo máximo de <strong>15 días hábiles</strong>, prorrogables por
              razones fundadas.
            </p>
          </Section>

          <Section title="10. Cookies y Tecnologías Similares">
            <p>
              La Plataforma utiliza cookies y tecnologías similares (local storage, pixels) para distintas finalidades:
            </p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li><strong>Esenciales:</strong> necesarias para el funcionamiento del sitio (autenticación, sesión, seguridad). No requieren consentimiento.</li>
              <li><strong>Funcionales:</strong> recuerdan preferencias del usuario (idioma, tema, etc.).</li>
              <li><strong>Analíticas:</strong> miden el uso y desempeño de la Plataforma de forma agregada.</li>
              <li><strong>De marketing:</strong> personalizan comunicaciones; solo se activan con consentimiento expreso.</li>
            </ul>
            <p className="mt-2">
              El usuario puede aceptar, rechazar o configurar las cookies desde el panel de su navegador o desde el banner
              de cookies, entendiendo que rechazar las esenciales puede afectar el funcionamiento del sitio.
            </p>
          </Section>

          <Section title="11. Seguridad de los Datos">
            <p>
              La Empresa adopta <strong>medidas técnicas y organizativas razonables</strong> para resguardar la
              integridad, confidencialidad y disponibilidad de los datos personales, incluyendo:
            </p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Cifrado de las comunicaciones mediante TLS/HTTPS.</li>
              <li>Cifrado o hashing de credenciales sensibles (contraseñas).</li>
              <li>Control de acceso basado en roles y autenticación multifactor cuando corresponde.</li>
              <li>Respaldos periódicos y planes de continuidad y recuperación ante incidentes.</li>
              <li>Auditorías y monitoreo continuo de la infraestructura.</li>
            </ul>
            <p className="mt-2">
              En caso de un <strong>incidente de seguridad</strong> que afecte datos personales y comporte un riesgo para
              los derechos del titular, la Empresa notificará al afectado y a la <strong>Agencia de Protección de Datos
              Personales</strong>, dentro de los plazos y condiciones que establece la <strong>Ley N° 21.663</strong>.
            </p>
          </Section>

          <Section title="12. Datos de Menores de Edad">
            <p>
              La Plataforma está dirigida a personas mayores de 18 años o a menores con autorización de padre, madre o
              representante legal. La Empresa no recopila intencionalmente datos de menores de edad sin la debida
              autorización; si tomamos conocimiento de un caso, procederemos a la eliminación inmediata de los datos.
            </p>
          </Section>

          <Section title="13. Datos Sensibles">
            <p>
              La Empresa <strong>no solicita ni trata datos personales sensibles</strong> (origen racial o étnico,
              opiniones políticas, convicciones religiosas, afiliación sindical, salud, vida sexual, datos biométricos
              para identificación o datos de menores) salvo cuando exista una base legal específica o consentimiento
              explícito del titular para una finalidad determinada, conforme a lo dispuesto en la
              <strong> Ley N° 19.628</strong> y la <strong>Ley N° 21.663</strong>.
            </p>
          </Section>

          <Section title="14. Modificaciones a esta Política">
            <p>
              La Empresa podrá actualizar esta Política para adaptarla a cambios legales, técnicos o del Servicio. Las
              modificaciones serán publicadas en la Plataforma con la fecha de actualización y, cuando impliquen cambios
              relevantes para los titulares, serán comunicadas por correo electrónico con al menos 30 días de
              anticipación.
            </p>
          </Section>

          <Section title="15. Reclamos ante la Autoridad">
            <p>
              Sin perjuicio de los canales internos descritos, todo titular de datos puede presentar reclamos ante la
              <strong> Agencia de Protección de Datos Personales</strong>, organismo público creado por la
              <strong> Ley N° 21.663</strong> encargado de fiscalizar el cumplimiento de la normativa de protección de
              datos en Chile. Asimismo, el titular puede recurrir al <strong>SERNAC</strong> (Servicio Nacional del
              Consumidor) en materias que afecten sus derechos como consumidor.
            </p>
          </Section>

          <Section title="16. Contacto del Encargado de Datos Personales">
            <p>
              Para ejercer derechos, presentar consultas o reclamos relacionados con el tratamiento de datos personales,
              el titular puede dirigirse a:
            </p>
            <ul className="mt-2 space-y-0.5 text-left">
              <li><strong>Encargado de Datos Personales:</strong> Solo a un Click SpA</li>
              <li><strong>Correo:</strong> datos@soloaunclick.cl</li>
              <li><strong>Domicilio:</strong> Villarrica, Región de La Araucanía, Chile</li>
            </ul>
          </Section>

          <p className="text-[11px] text-slate-400 pt-4 border-t border-slate-100">
            La presente Política de Privacidad complementa los Términos y Condiciones de la Plataforma. Al utilizar el
            Servicio, el titular declara haber leído y aceptado esta Política.
          </p>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 px-6 py-3 shrink-0 flex justify-end">
          <button
            onClick={onClose}
            className="bg-primary hover:bg-primary/90 text-white text-xs font-bold px-5 py-2 rounded-lg transition-colors"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div>
      <h3 className="font-bold text-primary text-sm sm:text-[15px] mb-1.5">{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  )
}
