-- ============================================================
-- UNCLICK — Catálogo de categorías y subcategorías (desarrollo)
--
-- Idempotente: IDs explícitos + ON DUPLICATE KEY UPDATE. Se puede reaplicar
-- sin duplicar ni romper las FK de tb_subcategorias.
--
-- Rangos de ID (estables, no reordenar):
--   producto  100-199   subcategorías: id_categoria * 100 + n
--   servicio  200-299
--   arriendo  300-399
--   turismo   400-499
--
-- ⚠️ Este es un catálogo SINTÉTICO, coherente con el rubro de Villarrica pero
-- no idéntico al de producción. El catálogo real vive solo en la BD de
-- producción; ver README.md de esta carpeta para reemplazarlo.
-- ============================================================

-- ── Categorías ──────────────────────────────────────────────

INSERT INTO tb_categorias (id, nombre, tipo, icono, orden, activo) VALUES
  -- producto
  (101, 'Alimentos y Bebidas',        'producto', 'restaurant',      1, 1),
  (102, 'Artesanía',                  'producto', 'palette',         2, 1),
  (103, 'Ropa y Calzado',             'producto', 'checkroom',       3, 1),
  (104, 'Hogar y Decoración',         'producto', 'chair',           4, 1),
  (105, 'Deportes y Aire Libre',      'producto', 'hiking',          5, 1),
  (106, 'Tecnología',                 'producto', 'devices',         6, 1),
  (107, 'Mascotas',                   'producto', 'pets',            7, 1),
  (108, 'Ferretería y Construcción',  'producto', 'construction',    8, 1),
  (109, 'Salud y Belleza',            'producto', 'spa',             9, 1),
  (110, 'Libros y Papelería',         'producto', 'menu_book',      10, 1),
  (111, 'Jardín y Vivero',            'producto', 'yard',           11, 1),
  (112, 'Automotriz',                 'producto', 'directions_car', 12, 1),
  -- servicio
  (201, 'Gastronomía',                'servicio', 'restaurant_menu', 1, 1),
  (202, 'Salud',                      'servicio', 'medical_services',2, 1),
  (203, 'Belleza y Bienestar',        'servicio', 'face',            3, 1),
  (204, 'Educación',                  'servicio', 'school',          4, 1),
  (205, 'Servicios Profesionales',    'servicio', 'work',            5, 1),
  (206, 'Construcción y Reparaciones','servicio', 'handyman',        6, 1),
  (207, 'Transporte y Fletes',        'servicio', 'local_shipping',  7, 1),
  (208, 'Eventos y Celebraciones',    'servicio', 'celebration',     8, 1),
  (209, 'Tecnología y Soporte',       'servicio', 'computer',        9, 1),
  (210, 'Cuidado de Mascotas',        'servicio', 'pets',           10, 1),
  (211, 'Limpieza y Aseo',            'servicio', 'cleaning_services',11,1),
  -- arriendo
  (301, 'Alojamiento',                'arriendo', 'hotel',           1, 1),
  (302, 'Vehículos',                  'arriendo', 'directions_car',  2, 1),
  (303, 'Equipamiento Outdoor',       'arriendo', 'backpack',        3, 1),
  (304, 'Espacios y Salones',         'arriendo', 'meeting_room',    4, 1),
  (305, 'Herramientas y Maquinaria',  'arriendo', 'build',           5, 1),
  (306, 'Equipos para Eventos',       'arriendo', 'speaker',         6, 1),
  -- turismo
  (401, 'Aventura y Deportes',        'turismo',  'paragliding',     1, 1),
  (402, 'Lago y Navegación',          'turismo',  'sailing',         2, 1),
  (403, 'Volcán y Montaña',           'turismo',  'terrain',         3, 1),
  (404, 'Naturaleza y Ecoturismo',    'turismo',  'forest',          4, 1),
  (405, 'Cultura y Patrimonio',       'turismo',  'museum',          5, 1),
  (406, 'Gastronomía y Cervecerías',  'turismo',  'local_bar',       6, 1),
  (407, 'Termas y Bienestar',         'turismo',  'hot_tub',         7, 1)
ON DUPLICATE KEY UPDATE
  nombre = VALUES(nombre), tipo = VALUES(tipo), icono = VALUES(icono),
  orden  = VALUES(orden),  activo = VALUES(activo);

-- ── Subcategorías ───────────────────────────────────────────

INSERT INTO tb_subcategorias (id, categoria_id, nombre, orden, activo) VALUES
  -- 101 Alimentos y Bebidas
  (10101, 101, 'Panadería y Pastelería',   1, 1),
  (10102, 101, 'Carnicería',               2, 1),
  (10103, 101, 'Verdulería',               3, 1),
  (10104, 101, 'Pescadería',               4, 1),
  (10105, 101, 'Lácteos y Quesos',         5, 1),
  (10106, 101, 'Cervecería Artesanal',     6, 1),
  (10107, 101, 'Miel y Conservas',         7, 1),
  (10108, 101, 'Café y Té',                8, 1),
  (10109, 101, 'Productos Sin Gluten',     9, 1),
  (10110, 101, 'Almacén y Abarrotes',     10, 1),
  -- 102 Artesanía
  (10201, 102, 'Madera Nativa',            1, 1),
  (10202, 102, 'Tejidos y Lana',           2, 1),
  (10203, 102, 'Cerámica y Greda',         3, 1),
  (10204, 102, 'Platería Mapuche',         4, 1),
  (10205, 102, 'Cuero',                    5, 1),
  (10206, 102, 'Velas y Aromas',           6, 1),
  (10207, 102, 'Joyería Artesanal',        7, 1),
  (10208, 102, 'Souvenirs',                8, 1),
  -- 103 Ropa y Calzado
  (10301, 103, 'Ropa de Mujer',            1, 1),
  (10302, 103, 'Ropa de Hombre',           2, 1),
  (10303, 103, 'Ropa Infantil',            3, 1),
  (10304, 103, 'Calzado',                  4, 1),
  (10305, 103, 'Ropa Outdoor',             5, 1),
  (10306, 103, 'Accesorios',               6, 1),
  (10307, 103, 'Ropa de Segunda Mano',     7, 1),
  -- 104 Hogar y Decoración
  (10401, 104, 'Muebles',                  1, 1),
  (10402, 104, 'Textiles del Hogar',       2, 1),
  (10403, 104, 'Iluminación',              3, 1),
  (10404, 104, 'Cocina y Menaje',          4, 1),
  (10405, 104, 'Decoración',               5, 1),
  (10406, 104, 'Calefacción',              6, 1),
  (10407, 104, 'Organización',             7, 1),
  -- 105 Deportes y Aire Libre
  (10501, 105, 'Camping',                  1, 1),
  (10502, 105, 'Pesca',                    2, 1),
  (10503, 105, 'Ciclismo',                 3, 1),
  (10504, 105, 'Montañismo',               4, 1),
  (10505, 105, 'Deportes Náuticos',        5, 1),
  (10506, 105, 'Esquí y Nieve',            6, 1),
  (10507, 105, 'Running y Trekking',       7, 1),
  (10508, 105, 'Fitness',                  8, 1),
  -- 106 Tecnología
  (10601, 106, 'Celulares y Accesorios',   1, 1),
  (10602, 106, 'Computación',              2, 1),
  (10603, 106, 'Audio y Video',            3, 1),
  (10604, 106, 'Fotografía',               4, 1),
  (10605, 106, 'Videojuegos',              5, 1),
  (10606, 106, 'Domótica',                 6, 1),
  -- 107 Mascotas
  (10701, 107, 'Alimento para Perros',     1, 1),
  (10702, 107, 'Alimento para Gatos',      2, 1),
  (10703, 107, 'Accesorios',               3, 1),
  (10704, 107, 'Higiene y Salud',          4, 1),
  (10705, 107, 'Camas y Casas',            5, 1),
  (10706, 107, 'Animales de Granja',       6, 1),
  -- 108 Ferretería y Construcción
  (10801, 108, 'Herramientas Manuales',    1, 1),
  (10802, 108, 'Herramientas Eléctricas',  2, 1),
  (10803, 108, 'Materiales de Construcción',3,1),
  (10804, 108, 'Pinturas y Barnices',      4, 1),
  (10805, 108, 'Electricidad',             5, 1),
  (10806, 108, 'Gasfitería',               6, 1),
  (10807, 108, 'Leña y Combustibles',      7, 1),
  -- 109 Salud y Belleza
  (10901, 109, 'Cosmética Natural',        1, 1),
  (10902, 109, 'Cuidado Capilar',          2, 1),
  (10903, 109, 'Perfumería',               3, 1),
  (10904, 109, 'Suplementos',              4, 1),
  (10905, 109, 'Herboristería',            5, 1),
  (10906, 109, 'Higiene Personal',         6, 1),
  -- 110 Libros y Papelería
  (11001, 110, 'Libros',                   1, 1),
  (11002, 110, 'Útiles Escolares',         2, 1),
  (11003, 110, 'Arte y Manualidades',      3, 1),
  (11004, 110, 'Juegos de Mesa',           4, 1),
  (11005, 110, 'Impresión y Copias',       5, 1),
  -- 111 Jardín y Vivero
  (11101, 111, 'Plantas de Interior',      1, 1),
  (11102, 111, 'Plantas Nativas',          2, 1),
  (11103, 111, 'Semillas',                 3, 1),
  (11104, 111, 'Macetas y Sustratos',      4, 1),
  (11105, 111, 'Herramientas de Jardín',   5, 1),
  (11106, 111, 'Huerto Urbano',            6, 1),
  -- 112 Automotriz
  (11201, 112, 'Repuestos',                1, 1),
  (11202, 112, 'Neumáticos',               2, 1),
  (11203, 112, 'Lubricantes',              3, 1),
  (11204, 112, 'Accesorios',               4, 1),
  (11205, 112, 'Audio para Autos',         5, 1),

  -- 201 Gastronomía
  (20101, 201, 'Restaurante',              1, 1),
  (20102, 201, 'Cafetería',                2, 1),
  (20103, 201, 'Comida para Llevar',       3, 1),
  (20104, 201, 'Banquetería',              4, 1),
  (20105, 201, 'Food Truck',               5, 1),
  (20106, 201, 'Pizzería',                 6, 1),
  (20107, 201, 'Repostería por Encargo',   7, 1),
  -- 202 Salud
  (20201, 202, 'Medicina General',         1, 1),
  (20202, 202, 'Kinesiología',             2, 1),
  (20203, 202, 'Odontología',              3, 1),
  (20204, 202, 'Psicología',               4, 1),
  (20205, 202, 'Nutrición',                5, 1),
  (20206, 202, 'Fonoaudiología',           6, 1),
  (20207, 202, 'Enfermería a Domicilio',   7, 1),
  (20208, 202, 'Terapias Complementarias', 8, 1),
  -- 203 Belleza y Bienestar
  (20301, 203, 'Peluquería',               1, 1),
  (20302, 203, 'Barbería',                 2, 1),
  (20303, 203, 'Manicure y Pedicure',      3, 1),
  (20304, 203, 'Masajes',                  4, 1),
  (20305, 203, 'Depilación',               5, 1),
  (20306, 203, 'Maquillaje',               6, 1),
  (20307, 203, 'Yoga y Meditación',        7, 1),
  -- 204 Educación
  (20401, 204, 'Clases Particulares',      1, 1),
  (20402, 204, 'Idiomas',                  2, 1),
  (20403, 204, 'Música',                   3, 1),
  (20404, 204, 'Computación',              4, 1),
  (20405, 204, 'Preuniversitario',         5, 1),
  (20406, 204, 'Talleres de Arte',         6, 1),
  (20407, 204, 'Deportes y Entrenamiento', 7, 1),
  -- 205 Servicios Profesionales
  (20501, 205, 'Contabilidad',             1, 1),
  (20502, 205, 'Asesoría Legal',           2, 1),
  (20503, 205, 'Arquitectura',             3, 1),
  (20504, 205, 'Diseño Gráfico',           4, 1),
  (20505, 205, 'Marketing Digital',        5, 1),
  (20506, 205, 'Traducción',               6, 1),
  (20507, 205, 'Corretaje de Propiedades', 7, 1),
  (20508, 205, 'Topografía',               8, 1),
  -- 206 Construcción y Reparaciones
  (20601, 206, 'Gasfitería',               1, 1),
  (20602, 206, 'Electricidad',             2, 1),
  (20603, 206, 'Carpintería',              3, 1),
  (20604, 206, 'Pintura',                  4, 1),
  (20605, 206, 'Techumbres',               5, 1),
  (20606, 206, 'Obra Gruesa',              6, 1),
  (20607, 206, 'Soldadura',                7, 1),
  (20608, 206, 'Climatización',            8, 1),
  -- 207 Transporte y Fletes
  (20701, 207, 'Fletes y Mudanzas',        1, 1),
  (20702, 207, 'Transporte de Pasajeros',  2, 1),
  (20703, 207, 'Transfer Aeropuerto',      3, 1),
  (20704, 207, 'Delivery',                 4, 1),
  (20705, 207, 'Grúas',                    5, 1),
  -- 208 Eventos y Celebraciones
  (20801, 208, 'Fotografía y Video',       1, 1),
  (20802, 208, 'Animación',                2, 1),
  (20803, 208, 'DJ y Música en Vivo',      3, 1),
  (20804, 208, 'Decoración de Eventos',    4, 1),
  (20805, 208, 'Wedding Planner',          5, 1),
  (20806, 208, 'Arriendo de Mobiliario',   6, 1),
  -- 209 Tecnología y Soporte
  (20901, 209, 'Reparación de Computadores',1,1),
  (20902, 209, 'Reparación de Celulares',  2, 1),
  (20903, 209, 'Desarrollo Web',           3, 1),
  (20904, 209, 'Redes e Internet',         4, 1),
  (20905, 209, 'Cámaras de Seguridad',     5, 1),
  -- 210 Cuidado de Mascotas
  (21001, 210, 'Veterinaria',              1, 1),
  (21002, 210, 'Peluquería Canina',        2, 1),
  (21003, 210, 'Paseo de Perros',          3, 1),
  (21004, 210, 'Hotel para Mascotas',      4, 1),
  (21005, 210, 'Adiestramiento',           5, 1),
  -- 211 Limpieza y Aseo
  (21101, 211, 'Aseo del Hogar',           1, 1),
  (21102, 211, 'Limpieza de Oficinas',     2, 1),
  (21103, 211, 'Lavado de Alfombras',      3, 1),
  (21104, 211, 'Limpieza de Vidrios',      4, 1),
  (21105, 211, 'Retiro de Escombros',      5, 1),
  (21106, 211, 'Lavandería',               6, 1),

  -- 301 Alojamiento
  (30101, 301, 'Cabañas',                  1, 1),
  (30102, 301, 'Departamentos',            2, 1),
  (30103, 301, 'Casas',                    3, 1),
  (30104, 301, 'Habitaciones',             4, 1),
  (30105, 301, 'Hostal',                   5, 1),
  (30106, 301, 'Domos y Glamping',         6, 1),
  (30107, 301, 'Sitios de Camping',        7, 1),
  -- 302 Vehículos
  (30201, 302, 'Autos',                    1, 1),
  (30202, 302, 'Camionetas 4x4',           2, 1),
  (30203, 302, 'Motos',                    3, 1),
  (30204, 302, 'Bicicletas',               4, 1),
  (30205, 302, 'Motorhome',                5, 1),
  (30206, 302, 'Remolques',                6, 1),
  -- 303 Equipamiento Outdoor
  (30301, 303, 'Kayak y Paddle',           1, 1),
  (30302, 303, 'Equipo de Camping',        2, 1),
  (30303, 303, 'Equipo de Esquí',          3, 1),
  (30304, 303, 'Equipo de Montaña',        4, 1),
  (30305, 303, 'Equipo de Pesca',          5, 1),
  (30306, 303, 'Trajes de Neopreno',       6, 1),
  -- 304 Espacios y Salones
  (30401, 304, 'Salón de Eventos',         1, 1),
  (30402, 304, 'Sala de Reuniones',        2, 1),
  (30403, 304, 'Quincho',                  3, 1),
  (30404, 304, 'Cancha Deportiva',         4, 1),
  (30405, 304, 'Bodega',                   5, 1),
  (30406, 304, 'Oficina',                  6, 1),
  -- 305 Herramientas y Maquinaria
  (30501, 305, 'Andamios',                 1, 1),
  (30502, 305, 'Betoneras',                2, 1),
  (30503, 305, 'Generadores',              3, 1),
  (30504, 305, 'Maquinaria de Jardín',     4, 1),
  (30505, 305, 'Herramientas Eléctricas',  5, 1),
  (30506, 305, 'Compresores',              6, 1),
  -- 306 Equipos para Eventos
  (30601, 306, 'Toldos y Carpas',          1, 1),
  (30602, 306, 'Mesas y Sillas',           2, 1),
  (30603, 306, 'Sonido e Iluminación',     3, 1),
  (30604, 306, 'Vajilla',                  4, 1),
  (30605, 306, 'Juegos Inflables',         5, 1),

  -- 401 Aventura y Deportes
  (40101, 401, 'Rafting',                  1, 1),
  (40102, 401, 'Canopy',                   2, 1),
  (40103, 401, 'Parapente',                3, 1),
  (40104, 401, 'Cabalgatas',               4, 1),
  (40105, 401, 'Cicloturismo',             5, 1),
  (40106, 401, 'Escalada',                 6, 1),
  (40107, 401, 'Canyoning',                7, 1),
  -- 402 Lago y Navegación
  (40201, 402, 'Paseos en Lancha',         1, 1),
  (40202, 402, 'Kayak',                    2, 1),
  (40203, 402, 'Stand Up Paddle',          3, 1),
  (40204, 402, 'Vela',                     4, 1),
  (40205, 402, 'Pesca Deportiva',          5, 1),
  (40206, 402, 'Buceo',                    6, 1),
  -- 403 Volcán y Montaña
  (40301, 403, 'Ascenso al Volcán',        1, 1),
  (40302, 403, 'Trekking',                 2, 1),
  (40303, 403, 'Esquí y Snowboard',        3, 1),
  (40304, 403, 'Raquetas de Nieve',        4, 1),
  (40305, 403, 'Montañismo Técnico',       5, 1),
  -- 404 Naturaleza y Ecoturismo
  (40401, 404, 'Parques Nacionales',       1, 1),
  (40402, 404, 'Bosque Nativo',            2, 1),
  (40403, 404, 'Avistamiento de Aves',     3, 1),
  (40404, 404, 'Saltos y Cascadas',        4, 1),
  (40405, 404, 'Fotografía de Naturaleza', 5, 1),
  (40406, 404, 'Astroturismo',             6, 1),
  -- 405 Cultura y Patrimonio
  (40501, 405, 'Cultura Mapuche',          1, 1),
  (40502, 405, 'Museos',                   2, 1),
  (40503, 405, 'Ferias Artesanales',       3, 1),
  (40504, 405, 'Circuitos Históricos',     4, 1),
  (40505, 405, 'Talleres Culturales',      5, 1),
  -- 406 Gastronomía y Cervecerías
  (40601, 406, 'Ruta Cervecera',           1, 1),
  (40602, 406, 'Tours Gastronómicos',      2, 1),
  (40603, 406, 'Cocina Mapuche',           3, 1),
  (40604, 406, 'Degustaciones',            4, 1),
  (40605, 406, 'Clases de Cocina',         5, 1),
  -- 407 Termas y Bienestar
  (40701, 407, 'Termas',                   1, 1),
  (40702, 407, 'Spa',                      2, 1),
  (40703, 407, 'Retiros de Bienestar',     3, 1),
  (40704, 407, 'Baños Termales Rústicos',  4, 1)
ON DUPLICATE KEY UPDATE
  categoria_id = VALUES(categoria_id), nombre = VALUES(nombre),
  orden = VALUES(orden), activo = VALUES(activo);
