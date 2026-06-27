-- ============================================================
-- UNCLICK — Migración 002: tablas faltantes en local vs stage
-- BD: unclik · MariaDB/MySQL · XAMPP
-- IDEMPOTENTE: re-ejecutable sin error ni duplicación.
--
-- Aplicar:
--   "C:\xampp\mysql\bin\mysql.exe" -u root -h 127.0.0.1 -P 3306 unclik < backend/migrations/002_tablas_faltantes.sql
-- (o puerto 3308 si usas XAMPP con puerto personalizado)
-- ============================================================

USE unclik;

-- ============================================================
-- BLOQUE 1 — tb_categorias_eventos
-- Categorías para el módulo de eventos (22 categorías).
-- ============================================================
CREATE TABLE IF NOT EXISTS `tb_categorias_eventos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(120) NOT NULL,
  `icono` varchar(80) NOT NULL DEFAULT 'event',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `tb_categorias_eventos` (`id`, `nombre`, `icono`) VALUES
(1,  'Música / Concierto',            'music_note'),
(2,  'Festival / Feria',              'festival'),
(3,  'Peña / Folclor / Cueca',        'guitar_pick'),
(4,  'Stand up / Humor / Show',       'emoji_emotions'),
(5,  'Teatro / Danza / Circo',        'theater_comedy'),
(6,  'Cine / Audiovisual',            'movie'),
(7,  'Arte / Exposición / Cultura',   'palette'),
(8,  'Gastronómico / Food fest',      'restaurant'),
(9,  'Mercado / Venta de garage',     'sell'),
(10, 'Deporte / Torneo / Campeonato', 'sports'),
(11, 'Infantil / Familiar',           'child_care'),
(12, 'Charla / Seminario / Taller',   'school'),
(13, 'Religioso / Procesión / Misa',  'church'),
(14, 'Carnaval / Corso / Desfile',    'celebration'),
(15, 'Bingo / Rifa / Tombola',        'confirmation_number'),
(16, 'Matrimonio / Quinceañero',      'favorite'),
(17, 'Cumpleaños / Celebración priv.','cake'),
(18, 'Halloween / Disfraz / Temático','masks'),
(19, 'Navidad / Año nuevo / Fiestas', 'nights_stay'),
(20, 'A Beneficio / Solidario',       'volunteer_activism'),
(21, 'Comunitario / Vecinal',         'groups'),
(22, 'Otro',                          'event')
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre), icono = VALUES(icono);

-- ============================================================
-- BLOQUE 2 — tb_categorias_locales
-- Categorías para negocios locales (77 categorías).
-- ============================================================
CREATE TABLE IF NOT EXISTS `tb_categorias_locales` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(120) NOT NULL,
  `icono` varchar(80) NOT NULL DEFAULT 'storefront',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `tb_categorias_locales` (`id`, `nombre`, `icono`) VALUES
(1,  'Almacén / Minimarket',              'local_grocery_store'),
(2,  'Supermercado',                      'shopping_cart'),
(3,  'Panadería / Pastelería',            'bakery_dining'),
(4,  'Amasandería',                       'cookie'),
(5,  'Carnicería / Rotisería',            'set_meal'),
(6,  'Verdulería / Frutería',             'eco'),
(7,  'Marisquería / Pescadería',          'set_meal'),
(8,  'Empanadas / Sopaipillas',           'lunch_dining'),
(9,  'Heladería',                         'icecream'),
(10, 'Comida rápida / Snacks',            'fastfood'),
(11, 'Pizzería',                          'local_pizza'),
(12, 'Sushi / Comida oriental',           'ramen_dining'),
(13, 'Restaurant / Comedor',              'restaurant'),
(14, 'Rotisería / Menú del día',          'soup_kitchen'),
(15, 'Café / Fuente de soda',             'coffee'),
(16, 'Bar / Pub',                         'sports_bar'),
(17, 'Discoteca / Karaoke',               'nightlife'),
(18, 'Botillería',                        'liquor'),
(19, 'Distribuidora agua / bebidas',      'water_drop'),
(20, 'Farmacia / Botica',                 'local_pharmacy'),
(21, 'Centro médico / Consultorio',       'medical_services'),
(22, 'Clínica dental / Dentista',         'dentistry'),
(23, 'Óptica',                            'visibility'),
(24, 'Kinesiología / Masajes',            'self_improvement'),
(25, 'Peluquería / Barbería',             'content_cut'),
(26, 'Centro de estética / Spa',          'spa'),
(27, 'Pedicuría / Manicuría',             'face_3'),
(28, 'Veterinaria / Petshop',             'pets'),
(29, 'Ferretería',                        'hardware'),
(30, 'Materiales de construcción',        'home_repair_service'),
(31, 'Gasfitería / Plomería',             'plumbing'),
(32, 'Electricidad / Electricista',       'electrical_services'),
(33, 'Cerrajería',                        'lock'),
(34, 'Pinturería',                        'format_paint'),
(35, 'Mueblería / Tapicería',             'chair'),
(36, 'Decoración / Artículos hogar',      'home'),
(37, 'Vidriería / Aluminios',             'window'),
(38, 'Gas / Distribuidora de gas',        'gas_meter'),
(39, 'Taller mecánico / Maestranza',      'build'),
(40, 'Repuestos automotrices',            'settings'),
(41, 'Lubricentro / Aceites',             'oil_barrel'),
(42, 'Llantas / Gomería',                 'tire_repair'),
(43, 'Lavado de autos',                   'local_car_wash'),
(44, 'Combustibles / Bencinera',          'local_gas_station'),
(45, 'Estacionamiento / Parking',         'local_parking'),
(46, 'Lavandería / Tintorería',           'local_laundry_service'),
(47, 'Imprenta / Fotocopiadora',          'print'),
(48, 'Fotografía / Estudio fotográfico',  'photo_camera'),
(49, 'Confección / Costura / Sastrería',  'design_services'),
(50, 'Relojería / Joyería',               'watch'),
(51, 'Zapatería / Reparación calzado',    'footprint'),
(52, 'Computación / Servicio técnico',    'computer'),
(53, 'Telefonía / Accesorios celular',    'phone_android'),
(54, 'Bicicletería / Reparación bici',    'pedal_bike'),
(55, 'Correo / Mensajería / Courier',     'local_shipping'),
(56, 'Notaría / Trámites legales',        'gavel'),
(57, 'Seguros / Financiera',              'account_balance'),
(58, 'Cambio de moneda',                  'currency_exchange'),
(59, 'Agencia de viajes',                 'flight'),
(60, 'Bazar / Bric-à-brac',              'category'),
(61, 'Librería / Papelería',              'menu_book'),
(62, 'Juguetería',                        'toys'),
(63, 'Ropa / Vestuario / Boutique',       'checkroom'),
(64, 'Lencería / Ropa interior',          'checkroom'),
(65, 'Deportes / Artículos deportivos',   'sports'),
(66, 'Electrónica / Tecnología',          'devices'),
(67, 'Floristería',                       'local_florist'),
(68, 'Cigarrería / Kiosko',              'smoking_rooms'),
(69, 'Lotería / Punto de apuestas',       'confirmation_number'),
(70, 'Academia / Clases particulares',    'school'),
(71, 'Gym / Fitness / Crossfit',          'fitness_center'),
(72, 'Artes marciales / Escuela dep.',    'sports_martial_arts'),
(73, 'Danza / Ballet / Pilates',          'self_improvement'),
(74, 'Iglesia / Templo / Capilla',        'church'),
(75, 'Junta de vecinos / Sede social',    'groups'),
(76, 'Centro cultural / Club social',     'museum'),
(77, 'Otro',                              'storefront')
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre), icono = VALUES(icono);

-- ============================================================
-- BLOQUE 3 — tb_password_reset_tokens
-- Tokens para recuperación de contraseña (enlace por email).
-- ============================================================
CREATE TABLE IF NOT EXISTS `tb_password_reset_tokens` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `usuario_id` int unsigned NOT NULL,
  `token` varchar(64) NOT NULL,
  `expires_at` datetime NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_reset_token` (`token`),
  KEY `idx_reset_usuario` (`usuario_id`),
  CONSTRAINT `fk_reset_usuario`
    FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- VERIFICACIÓN
-- ============================================================
SELECT 'tb_categorias_eventos' AS tabla, COUNT(*) AS filas FROM tb_categorias_eventos
UNION ALL
SELECT 'tb_categorias_locales', COUNT(*) FROM tb_categorias_locales
UNION ALL
SELECT 'tb_password_reset_tokens', COUNT(*) FROM tb_password_reset_tokens;
