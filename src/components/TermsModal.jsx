export default function TermsModal({ onClose }) {
  return (
    <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-primary px-6 py-4 flex items-center justify-between shrink-0">
          <h2 className="text-white font-bold text-base sm:text-lg flex items-center gap-2">
            <span className="material-symbols-outlined">gavel</span>
            Términos y Condiciones
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

          <Section title="1. Aceptación de los Términos">
            <p>
              Al utilizar la plataforma <strong>LocalClick</strong> (en adelante, "la Plataforma" o "el Servicio"),
              el usuario (en adelante, "el Cliente", "el Usuario" o "Usted") declara haber leído, comprendido y aceptado
              íntegramente estos Términos y Condiciones, así como la Política de Privacidad. Si no está de acuerdo con
              alguno de los puntos aquí descritos, debe abstenerse de utilizar el Servicio.
            </p>
          </Section>

          <Section title="2. Identificación del Prestador">
            <p>
              <strong>LocalClick S.A.</strong> es una sociedad constituida bajo las leyes de la
              República de Chile, con domicilio en Villarrica, Región de La Araucanía. La Empresa presta servicios
              digitales de difusión y promoción comercial.
            </p>
          </Section>

          <Section title="3. Descripción del Servicio">
            <p>
              LocalClick ofrece una plataforma web que permite a comercios, prestadores de servicios, arrendadores
              y operadores turísticos publicar y promocionar sus productos, servicios, arriendos y actividades a
              visitantes y consumidores de la zona de Villarrica y alrededores. La Empresa actúa exclusivamente como
              intermediario tecnológico y <strong>no participa de las transacciones</strong> que se concreten entre los
              publicadores y los visitantes.
            </p>
          </Section>

          <Section title="4. Registro y Cuenta de Usuario">
            <p>
              Para acceder a las funcionalidades de la Plataforma, el Cliente debe registrarse proporcionando información
              veraz, exacta y actualizada. El Cliente es responsable de la confidencialidad de su contraseña y de toda
              la actividad que ocurra bajo su cuenta. El uso indebido o no autorizado debe ser comunicado de inmediato
              al equipo de soporte.
            </p>
          </Section>

          <Section title="5. Planes y Precios">
            <p>
              La Plataforma ofrece distintos planes de suscripción (Gratuito, Normal y Premium, según corresponda) cuyos
              precios, beneficios y limitaciones se detallan en la sección de planes del sitio. Los precios se expresan
              en pesos chilenos (CLP) e incluyen el Impuesto al Valor Agregado (IVA) cuando corresponda. La Empresa se
              reserva el derecho de modificar los precios mediante aviso previo de al menos <strong>30 días corridos</strong>.
            </p>
          </Section>

          <Section title="6. Forma de Pago y Facturación">
            <p className="font-semibold text-slate-800">6.1. Medio de pago</p>
            <p>
              Los planes de pago se cobran <strong>exclusivamente mediante tarjeta de débito o crédito</strong>, a través
              de plataformas de pago electrónico autorizadas y reguladas por la <strong>Comisión para el Mercado
              Financiero (CMF)</strong> y el <strong>Banco Central de Chile</strong>, conforme a la normativa vigente
              sobre medios de pago electrónico y operaciones con tarjetas.
            </p>

            <p className="font-semibold text-slate-800 mt-3">6.2. Emisión de boleta o factura</p>
            <p>
              Una vez efectuado el pago, <strong>dentro de un plazo máximo de 24 horas</strong> la Empresa emitirá y
              enviará al correo electrónico registrado por el Cliente el documento tributario correspondiente
              (boleta electrónica o factura electrónica), conforme a la normativa del <strong>Servicio de Impuestos
              Internos (SII)</strong>. El Cliente que requiera factura debe indicarlo durante la contratación y
              proporcionar: razón social, <strong>RUT</strong>, giro y dirección de facturación. La Empresa no se hace
              responsable por errores de emisión derivados de datos incorrectos, incompletos o desactualizados
              entregados por el Cliente.
            </p>

            <p className="font-semibold text-slate-800 mt-3">6.3. Renovación automática mensual</p>
            <p>
              La suscripción a planes pagados se <strong>renueva automáticamente cada mes</strong> en la misma fecha del
              cobro inicial. El Cliente autoriza expresamente a la Empresa a debitar el valor del plan contratado en su
              tarjeta hasta que comunique su voluntad de cancelarlo. Esta autorización constituye un mandato remunerado
              que el Cliente puede revocar en cualquier momento.
            </p>

            <p className="font-semibold text-slate-800 mt-3">6.4. Cancelación de la suscripción</p>
            <p>
              El Cliente puede <strong>cancelar su suscripción en cualquier momento</strong> desde su panel de administración
              o solicitándolo al equipo de soporte. La cancelación tendrá efecto al finalizar el período mensual ya
              pagado. Hasta esa fecha, el Cliente conserva todos los beneficios del plan vigente.
            </p>

            <p className="font-semibold text-slate-800 mt-3">6.5. Política de no reembolso del proporcional</p>
            <p className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              En caso de que el Cliente decida cancelar su suscripción antes del término del período mensual ya pagado,
              <strong> el monto proporcional correspondiente al período no utilizado no será reembolsable</strong>,
              entendiéndose que la decisión de cancelación queda a entera discreción del Cliente, quien siempre tuvo la
              posibilidad de cancelar con anterioridad. Sin perjuicio de lo anterior, el Cliente conserva el derecho de
              retracto contemplado en el <strong>artículo 3 bis de la Ley N° 19.496</strong> sobre Protección de los
              Derechos del Consumidor, dentro de los 10 días siguientes a la primera contratación, siempre que no haya
              hecho uso material del Servicio.
            </p>

            <p className="font-semibold text-slate-800 mt-3">6.6. Falla en el cobro automático</p>
            <p>
              Si el cobro automático no se concreta por motivos imputables al Cliente (tarjeta vencida, fondos
              insuficientes, bloqueo, etc.), la Empresa reintentará el cobro y notificará al correo registrado. Si
              transcurridos <strong>5 días corridos</strong> el cobro sigue sin concretarse, la cuenta del Cliente
              <strong> pasará automáticamente al Plan Gratuito</strong> y dejará de gozar de los beneficios del plan
              pagado.
            </p>
            <p>
              Bajo el Plan Gratuito, las publicaciones del Cliente (productos, servicios, arriendos o actividades, según
              corresponda) seguirán visibles dentro de los límites del plan, pero se <strong>mostrarán de forma aleatoria</strong>
              en la Plataforma, sin las prioridades ni espacios destacados que ofrece el plan pagado. El contenido que
              exceda los límites del Plan Gratuito quedará oculto al público hasta que el Cliente regularice su pago.
            </p>
            <p>
              Será de exclusiva responsabilidad del Cliente <strong>ingresar a su panel de administración</strong> si desea
              modificar, ocultar o eliminar publicaciones para adaptarlas al nuevo plan. La Empresa no realizará dichos
              cambios automáticamente. El Cliente podrá retomar su plan pagado en cualquier momento actualizando su medio
              de pago y reactivando la suscripción desde su panel.
            </p>
          </Section>

          <Section title="7. Obligaciones del Cliente">
            <p>El Cliente se compromete a:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Proporcionar información veraz, exacta y actualizada, manteniéndola al día.</li>
              <li>No publicar contenido falso, engañoso, ofensivo, discriminatorio, ilícito o que infrinja derechos de terceros.</li>
              <li>No utilizar la Plataforma para actividades fraudulentas, comercialización de productos prohibidos o cualquier conducta contraria a la legislación vigente.</li>
              <li>Cumplir con sus obligaciones tributarias respecto de las ventas que realice a través de los contactos generados en la Plataforma.</li>
              <li>Respetar la propiedad intelectual de terceros en las publicaciones que cargue.</li>
            </ul>
          </Section>

          <Section title="8. Contenido Publicado por el Cliente">
            <p>
              El Cliente conserva la titularidad de los contenidos que publique (textos, imágenes, descripciones de
              productos), pero otorga a la Empresa una licencia no exclusiva, gratuita y revocable para mostrarlos dentro
              de la Plataforma con fines de promoción del Servicio. La Empresa podrá remover, modificar o suspender
              contenidos que infrinjan estos Términos sin necesidad de aviso previo.
            </p>
          </Section>

          <Section title="9. Propiedad Intelectual">
            <p>
              Todos los elementos de la Plataforma (diseño, marcas, logotipos, código fuente, bases de datos, etc.) son
              de propiedad exclusiva de la Empresa o de sus licenciantes y están protegidos por la <strong>Ley N° 17.336</strong> sobre
              Propiedad Intelectual y por la <strong>Ley N° 19.039</strong> sobre Propiedad Industrial. Queda prohibida su reproducción,
              distribución o modificación sin autorización expresa.
            </p>
          </Section>

          <Section title="10. Protección de Datos Personales">
            <p>
              La Empresa trata los datos personales del Cliente conforme a la <strong>Ley N° 19.628</strong> sobre
              Protección de la Vida Privada y la <strong>Ley N° 21.663</strong> de 2024 (nueva Ley de Protección de
              Datos Personales), cuya autoridad de control es la <strong>Agencia de Protección de Datos Personales</strong>.
              El Cliente podrá ejercer en cualquier momento sus derechos de acceso, rectificación, supresión, oposición,
              portabilidad y bloqueo mediante solicitud escrita al correo de contacto. La Empresa adopta medidas técnicas
              y organizativas razonables para proteger la seguridad de los datos.
            </p>
          </Section>

          <Section title="11. Cookies y Tecnologías de Seguimiento">
            <p>
              La Plataforma utiliza cookies y tecnologías similares para mejorar la experiencia de navegación, recordar
              preferencias y obtener estadísticas de uso. El Cliente puede configurar su navegador para rechazarlas,
              entendiendo que esto puede afectar el funcionamiento de algunas funcionalidades.
            </p>
          </Section>

          <Section title="12. Limitación de Responsabilidad">
            <p>La Empresa actúa exclusivamente como intermediario tecnológico. No será responsable por:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>La calidad, idoneidad, legalidad o veracidad de los productos o servicios publicados por los Clientes.</li>
              <li>Disputas, transacciones, pagos, garantías o entregas entre Clientes y compradores finales.</li>
              <li>Interrupciones del servicio causadas por fuerza mayor, caso fortuito, mantenimiento programado o fallas de proveedores externos (hosting, pasarelas de pago, etc.).</li>
              <li>Daños indirectos, lucro cesante o pérdida de oportunidades comerciales.</li>
            </ul>
            <p className="mt-2">
              En todo caso, la responsabilidad máxima de la Empresa frente al Cliente, por cualquier causa, no excederá
              del monto total efectivamente pagado por el Cliente en los últimos 12 meses por el Servicio. Las disposiciones
              de este punto se entienden sin perjuicio de los derechos irrenunciables que asisten al consumidor según la
              <strong> Ley N° 19.496</strong> sobre Protección de los Derechos del Consumidor.
            </p>
          </Section>

          <Section title="13. Modificaciones del Servicio y de los Términos">
            <p>
              La Empresa podrá modificar funcionalidades, limitaciones o estos Términos para adaptarse a cambios legales,
              técnicos o comerciales. Las modificaciones serán comunicadas con al menos <strong>30 días de anticipación</strong>
              al correo registrado y al continuar usando la Plataforma tras esa fecha, se entenderá aceptada la nueva
              versión. Si el Cliente no acepta las modificaciones, podrá cancelar su suscripción según el punto 6.4.
            </p>
          </Section>

          <Section title="14. Suspensión y Terminación de la Cuenta">
            <p>
              La Empresa podrá suspender o cancelar la cuenta del Cliente, sin obligación de reembolso, en caso de
              incumplimiento grave o reiterado de estos Términos, falta de pago, uso fraudulento, vulneración de derechos
              de terceros o por mandato legal de autoridad competente.
            </p>
          </Section>

          <Section title="15. Atención al Cliente y Reclamos">
            <p>
              Conforme a la <strong>Ley N° 19.496</strong> sobre Protección de los Derechos del Consumidor, los reclamos
              pueden dirigirse al correo de contacto indicado en el sitio. La Empresa se compromete a entregar una primera
              respuesta en un plazo no mayor a <strong>5 días hábiles</strong>. El Cliente conserva en todo momento el
              derecho a recurrir al <strong>SERNAC</strong> (Servicio Nacional del Consumidor) o a los Tribunales de
              Justicia.
            </p>
          </Section>

          <Section title="16. Legislación Aplicable y Jurisdicción">
            <p>
              Estos Términos se rigen por las leyes de la República de Chile. Para cualquier controversia derivada o
              relacionada con el Servicio, las partes se someten a los <strong>Tribunales Ordinarios de Justicia con asiento en
              la ciudad de Villarrica</strong>, sin perjuicio de los derechos irrenunciables del consumidor establecidos en
              la <strong>Ley N° 19.496</strong>.
            </p>
          </Section>

          <Section title="17. Contacto">
            <p>
              Cualquier consulta, requerimiento o ejercicio de derechos en relación con estos Términos o con el
              tratamiento de datos personales puede dirigirse a:
            </p>
            <ul className="mt-2 space-y-0.5">
              <li><strong>Correo:</strong> contacto@localclick.cl</li>
              <li><strong>Domicilio:</strong> Villarrica, Región de La Araucanía, Chile</li>
            </ul>
          </Section>

          <p className="text-[11px] text-slate-400 pt-4 border-t border-slate-100">
            Al continuar utilizando la Plataforma, el Usuario declara haber leído y aceptado íntegramente los presentes
            Términos y Condiciones.
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
