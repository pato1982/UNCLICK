export default function CookiesModal({ onClose }) {
  return (
    <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-primary px-6 py-4 flex items-center justify-between shrink-0">
          <h2 className="text-white font-bold text-base sm:text-lg flex items-center gap-2">
            <span className="material-symbols-outlined">cookie</span>
            Política de Cookies
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

          <Section title="1. Introducción">
            <p>
              La presente Política de Cookies describe el uso que <strong>Solo a un Click SpA</strong> (en adelante, "la
              Empresa", "nosotros") realiza de cookies y tecnologías similares en su plataforma web (en adelante, "la
              Plataforma" o "el Servicio"). Esta Política se enmarca en el cumplimiento de la <strong>Ley N° 19.628</strong>
              sobre Protección de la Vida Privada y la <strong>Ley N° 21.663</strong> de 2024 (nueva Ley de Protección de
              Datos Personales), cuya autoridad de control es la <strong>Agencia de Protección de Datos Personales</strong>,
              y demás normativa aplicable de la República de Chile.
            </p>
            <p>
              Al continuar navegando, el usuario declara haber sido informado del uso de cookies y, según la categoría,
              presta su consentimiento conforme a los términos descritos en este documento.
            </p>
          </Section>

          <Section title="2. ¿Qué son las Cookies?">
            <p>
              Una <strong>cookie</strong> es un pequeño archivo de texto que un sitio web envía al navegador del usuario
              y que se almacena en su dispositivo (computador, teléfono, tablet). Las cookies permiten que el sitio
              recuerde información sobre la visita —preferencias, sesión, idioma, productos consultados— de modo que la
              experiencia sea más fluida y personalizada.
            </p>
            <p>
              Las cookies <strong>no contienen virus</strong>, no acceden a información personal del dispositivo y, por
              sí solas, no permiten identificar a una persona. Sin embargo, en combinación con otros datos, pueden
              llegar a constituir un <strong>dato personal</strong> conforme a la definición de la <strong>Ley N° 19.628</strong>,
              motivo por el cual su uso se rige por esta Política.
            </p>
          </Section>

          <Section title="3. Tecnologías Similares">
            <p>
              Además de las cookies tradicionales, la Plataforma puede utilizar otras tecnologías de almacenamiento o
              identificación que cumplen funciones equivalentes:
            </p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li><strong>Local storage y session storage:</strong> almacenamiento en el navegador para guardar preferencias o estado de sesión.</li>
              <li><strong>Pixels o web beacons:</strong> imágenes invisibles que registran la apertura de un correo o la carga de una página.</li>
              <li><strong>Identificadores de dispositivo:</strong> generados para fines de seguridad y prevención de fraude.</li>
              <li><strong>Etiquetas de scripts</strong> (tags) usadas por servicios de analítica.</li>
            </ul>
            <p className="mt-2">
              Todas estas tecnologías se rigen por las mismas reglas de consentimiento descritas en esta Política.
            </p>
          </Section>

          <Section title="4. Tipos de Cookies que Utilizamos">
            <p className="font-semibold text-slate-800 mt-2">4.1. Cookies estrictamente necesarias o técnicas</p>
            <p>
              Son <strong>imprescindibles para el funcionamiento</strong> de la Plataforma. Permiten al usuario navegar,
              autenticarse, mantener la sesión iniciada, completar formularios y acceder a áreas seguras. Sin ellas, el
              Servicio no puede prestarse. <em>Estas cookies no requieren consentimiento previo</em>, conforme al
              criterio internacionalmente aceptado y compatible con la normativa chilena vigente.
            </p>

            <p className="font-semibold text-slate-800 mt-3">4.2. Cookies funcionales o de preferencias</p>
            <p>
              Permiten recordar elecciones del usuario (idioma, región, preferencia de tema oscuro/claro, vista
              compacta) para entregar una experiencia personalizada. Su desactivación no impide la navegación, pero
              puede degradar la comodidad del Servicio.
            </p>

            <p className="font-semibold text-slate-800 mt-3">4.3. Cookies analíticas o de rendimiento</p>
            <p>
              Recopilan información <strong>agregada y disociada</strong> sobre el uso de la Plataforma —páginas más
              visitadas, tiempo en sitio, dispositivos, errores técnicos— con el propósito de medir el desempeño,
              detectar problemas y mejorar el Servicio. Cuando estas cookies utilizan proveedores externos, la Empresa
              configura las opciones de privacidad disponibles para minimizar el tratamiento de datos identificables.
            </p>

            <p className="font-semibold text-slate-800 mt-3">4.4. Cookies de personalización y marketing</p>
            <p>
              Se utilizan para mostrar contenido y comunicaciones más relevantes para el usuario, así como para evaluar
              la efectividad de las campañas comerciales. Estas cookies <strong>solo se activan con el consentimiento
              explícito</strong> del usuario y pueden ser revocadas en cualquier momento desde el panel de cookies.
            </p>
          </Section>

          <Section title="5. Cookies Propias y de Terceros">
            <p>
              Según la entidad que las gestione, las cookies pueden ser:
            </p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li><strong>Propias:</strong> establecidas por <em>Solo a un Click SpA</em> directamente.</li>
              <li><strong>De terceros:</strong> establecidas por proveedores con los que la Empresa colabora (por ejemplo, pasarelas de pago, servicios de analítica, redes de contenido). Estos proveedores tratan los datos bajo sus propias políticas, sujetas a contratos de tratamiento de datos cuando corresponde.</li>
            </ul>
            <p className="mt-2">
              La Empresa selecciona a sus proveedores cuidando que ofrezcan un nivel adecuado de protección de datos y
              que cumplan con la normativa aplicable, incluida la <strong>Ley N° 19.628</strong> y la
              <strong> Ley N° 21.663</strong> cuando corresponda.
            </p>
          </Section>

          <Section title="6. Duración de las Cookies">
            <p>Por su persistencia, las cookies se clasifican en:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li><strong>De sesión:</strong> se eliminan automáticamente al cerrar el navegador. Se utilizan, por ejemplo, para mantener la sesión durante la navegación.</li>
              <li><strong>Persistentes:</strong> permanecen almacenadas durante un período definido (desde minutos hasta meses). Se utilizan para recordar preferencias, prevención de fraude y análisis a largo plazo.</li>
            </ul>
            <p className="mt-2">
              La duración máxima de cada cookie está alineada con su finalidad. Las cookies analíticas y de marketing
              tienen una vigencia máxima de <strong>13 meses</strong>, conforme a las recomendaciones internacionales en
              la materia.
            </p>
          </Section>

          <Section title="7. Base Legal del Tratamiento">
            <p>
              El uso de cookies se sustenta, según su categoría, en alguna de las siguientes bases reconocidas por la
              <strong> Ley N° 19.628</strong> y la <strong>Ley N° 21.663</strong>:
            </p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li><strong>Ejecución del contrato</strong> y prestación del Servicio (cookies estrictamente necesarias).</li>
              <li><strong>Interés legítimo</strong> de la Empresa para asegurar el correcto funcionamiento del sitio (cookies funcionales y analíticas razonables).</li>
              <li><strong>Consentimiento expreso</strong> del usuario (cookies de marketing, personalización avanzada o cualquier categoría que implique tratamiento de datos identificables por terceros).</li>
            </ul>
          </Section>

          <Section title="8. Gestión y Configuración de Cookies">
            <p className="font-semibold text-slate-800 mt-2">8.1. Desde el banner de cookies</p>
            <p>
              Al ingresar por primera vez a la Plataforma, el usuario verá un banner que le permite <strong>aceptar
              todas</strong> las cookies, <strong>rechazar las no esenciales</strong> o <strong>configurarlas</strong>
              por categoría. La preferencia se recuerda mediante una cookie técnica para evitar mostrar el banner en
              cada visita. El usuario puede modificar su elección en cualquier momento desde el enlace "Configurar
              cookies" disponible en el footer.
            </p>

            <p className="font-semibold text-slate-800 mt-3">8.2. Desde el navegador</p>
            <p>
              La mayoría de los navegadores permiten gestionar las cookies desde su configuración: ver, eliminar,
              bloquear o permitir cookies por sitio. Cada navegador entrega su propio panel de control:
            </p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li><strong>Google Chrome:</strong> Configuración → Privacidad y seguridad → Cookies.</li>
              <li><strong>Mozilla Firefox:</strong> Opciones → Privacidad y seguridad → Cookies.</li>
              <li><strong>Microsoft Edge:</strong> Configuración → Cookies y permisos del sitio.</li>
              <li><strong>Safari:</strong> Preferencias → Privacidad → Cookies.</li>
              <li><strong>Apple Safari (iOS) y Android:</strong> Ajustes → Navegador → Privacidad.</li>
            </ul>

            <p className="font-semibold text-slate-800 mt-3">8.3. Desactivar el rastreo publicitario</p>
            <p>
              El usuario puede activar la opción "Do Not Track" o "Global Privacy Control" en su navegador, que la
              Empresa respeta para las cookies de marketing en la medida que técnicamente lo permitan los proveedores
              utilizados.
            </p>
          </Section>

          <Section title="9. Consecuencias de Desactivar las Cookies">
            <p>
              El usuario es libre de bloquear o eliminar cookies. Sin embargo, debe considerar que:
            </p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Las cookies <strong>estrictamente necesarias</strong>, si se bloquean, pueden impedir el inicio de sesión, la realización de pagos o el correcto funcionamiento del Servicio.</li>
              <li>Las cookies <strong>funcionales</strong>, al ser deshabilitadas, harán que el usuario deba reconfigurar sus preferencias en cada visita.</li>
              <li>Las cookies <strong>analíticas y de marketing</strong>, si se rechazan, no afectan la prestación del Servicio.</li>
            </ul>
          </Section>

          <Section title="10. Uso Combinado con Datos Personales">
            <p>
              Cuando la información obtenida mediante cookies se combine con datos personales identificables, dicho
              tratamiento se regirá adicionalmente por la <strong>Política de Privacidad y Protección de Datos</strong>
              de la Empresa. En particular, el titular podrá ejercer en todo momento sus derechos de acceso,
              rectificación, supresión, oposición y portabilidad respecto de esos datos, conforme a la
              <strong> Ley N° 19.628</strong> y la <strong>Ley N° 21.663</strong>.
            </p>
          </Section>

          <Section title="11. Transferencia Internacional">
            <p>
              Algunos proveedores de cookies de terceros (analítica, redes de contenido, pasarelas de pago) pueden
              encontrarse en jurisdicciones fuera de Chile. En estos casos, la Empresa adopta las garantías exigidas
              por la <strong>Ley N° 19.628</strong> y la <strong>Ley N° 21.663</strong>, incluyendo cláusulas
              contractuales tipo, verificación de niveles adecuados de protección y, cuando corresponda, solicitud de
              consentimiento explícito al usuario.
            </p>
          </Section>

          <Section title="12. Modificaciones a la Política de Cookies">
            <p>
              La Empresa podrá actualizar esta Política para adaptarla a cambios legales, tecnológicos o de proveedores.
              Las modificaciones se publicarán en la Plataforma con la fecha de actualización. Cuando los cambios sean
              relevantes para el usuario, se le solicitará nuevamente su consentimiento mediante el banner de cookies.
            </p>
          </Section>

          <Section title="13. Más Información y Contacto">
            <p>
              Para consultas, ejercicio de derechos o reclamos relacionados con el uso de cookies, el usuario puede
              dirigirse a:
            </p>
            <ul className="mt-2 space-y-0.5 text-left">
              <li><strong>Encargado de Datos Personales:</strong> Solo a un Click SpA</li>
              <li><strong>Correo:</strong> datos@soloaunclick.cl</li>
              <li><strong>Domicilio:</strong> Villarrica, Región de La Araucanía, Chile</li>
            </ul>
            <p className="mt-2">
              Sin perjuicio de los canales internos, el usuario podrá presentar reclamos ante la <strong>Agencia de
              Protección de Datos Personales</strong>, organismo creado por la <strong>Ley N° 21.663</strong> encargado
              de fiscalizar el cumplimiento de la normativa de protección de datos en Chile. También puede recurrir al
              <strong> SERNAC</strong> (Servicio Nacional del Consumidor) en materias que afecten sus derechos como
              consumidor.
            </p>
          </Section>

          <p className="text-[11px] text-slate-400 pt-4 border-t border-slate-100">
            La presente Política de Cookies forma parte integrante de los Términos y Condiciones y de la Política de
            Privacidad y Protección de Datos de la Plataforma.
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
