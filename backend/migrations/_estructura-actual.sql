-- ============================================================
-- UNCLICK — Estructura ACTUAL de la BD (snapshot en vivo)
-- Generado con mysqldump --no-data desde unclik (MariaDB 3308)
-- Fecha: 2026-06-16  ·  19 tablas  ·  solo estructura (sin datos)
--
-- PROPOSITO: revision rapida de la estructura completa y vigente.
-- NO contiene datos (sin password_hash ni filas) -> seguro de leer/compartir.
-- Fuente de verdad para crear desde cero: backend/schema.sql (comentado).
-- Este archivo es el reflejo CRUDO de la BD real para verificar sincronia.
-- ============================================================

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `negocios` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `usuario_id` int(10) unsigned NOT NULL,
  `nombre_negocio` varchar(120) DEFAULT NULL,
  `slogan` varchar(220) DEFAULT NULL,
  `descripcion` text DEFAULT NULL,
  `ubicacion` varchar(120) DEFAULT NULL,
  `direccion` varchar(220) DEFAULT NULL,
  `whatsapp` varchar(30) DEFAULT NULL,
  `telefono` varchar(30) DEFAULT NULL,
  `correo` varchar(100) DEFAULT NULL,
  `facebook` varchar(400) DEFAULT NULL,
  `instagram` varchar(400) DEFAULT NULL,
  `horarios` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`horarios`)),
  `logo_url` varchar(500) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `header_preset` varchar(30) DEFAULT 'marca',
  `header_color` varchar(7) DEFAULT '#3B1969',
  `header_height` tinyint(4) DEFAULT 26,
  `header_bar` varchar(20) DEFAULT 'separada',
  `banner_color` varchar(20) DEFAULT '#1a1220',
  `services_color` varchar(20) DEFAULT '#0f1a2e',
  `arriendos_color` varchar(20) DEFAULT '#14241c',
  `sidebar_style` varchar(20) DEFAULT 'izquierda',
  `nav_color` varchar(7) DEFAULT '#4A2070',
  `nav_style` varchar(20) DEFAULT 'borde',
  PRIMARY KEY (`id`),
  UNIQUE KEY `usuario_id` (`usuario_id`),
  CONSTRAINT `negocios_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=47 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `paginas` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `usuario_id` int(10) unsigned NOT NULL,
  `titulo_superior` varchar(200) DEFAULT NULL,
  `texto_superior` text DEFAULT NULL,
  `imagen_superior` varchar(500) DEFAULT NULL,
  `titulo_inferior` varchar(200) DEFAULT NULL,
  `texto_inferior` text DEFAULT NULL,
  `imagen_inferior` varchar(500) DEFAULT NULL,
  `crop_superior` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`crop_superior`)),
  `crop_inferior` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`crop_inferior`)),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `usuario_id` (`usuario_id`),
  CONSTRAINT `paginas_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `planes` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `nombre` varchar(60) NOT NULL,
  `tipo` enum('general','turismo') NOT NULL DEFAULT 'general',
  `precio_neto` int(10) unsigned NOT NULL DEFAULT 0,
  `max_listings` int(10) unsigned NOT NULL DEFAULT 5,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `portadas` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `usuario_id` int(10) unsigned NOT NULL,
  `nombre` varchar(120) DEFAULT NULL,
  `descripcion` text DEFAULT NULL,
  `imagenes` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`imagenes`)),
  `imagenes_crop` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`imagenes_crop`)),
  `categorias` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`categorias`)),
  `activo` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `usuario_id` (`usuario_id`),
  CONSTRAINT `portadas_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `sesiones` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `usuario_id` int(10) unsigned NOT NULL,
  `token` char(64) NOT NULL,
  `expires_at` datetime NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_sesiones_token` (`token`),
  KEY `idx_sesiones_usuario` (`usuario_id`),
  CONSTRAINT `fk_sesiones_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=69 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tb_actividad_usuarios` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `usuario_id` int(10) unsigned NOT NULL,
  `accion` varchar(60) NOT NULL COMMENT 'login | logout | crear_listing | editar_listing | eliminar_listing | crear_tour | editar_tour | eliminar_tour | subir_imagen | editar_negocio | cambiar_plan',
  `entidad` varchar(40) DEFAULT NULL COMMENT 'listing | tour | negocio | sesion | imagen',
  `entidad_id` int(10) unsigned DEFAULT NULL COMMENT 'id del registro afectado',
  `ip` varchar(45) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_act_usuario` (`usuario_id`),
  KEY `idx_act_accion` (`accion`),
  KEY `idx_act_fecha` (`created_at`),
  CONSTRAINT `fk_act_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=127 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tb_analytics_clicks` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `usuario_id` int(10) unsigned NOT NULL,
  `listing_id` int(10) unsigned DEFAULT NULL,
  `ip` varchar(45) DEFAULT NULL,
  `event_type` varchar(40) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `usuario_id` (`usuario_id`),
  CONSTRAINT `tb_analytics_clicks_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=575 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tb_analytics_visitas` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `usuario_id` int(10) unsigned NOT NULL,
  `session_id` varchar(64) DEFAULT NULL,
  `pagina` varchar(80) DEFAULT NULL,
  `ip` varchar(45) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `usuario_id` (`usuario_id`),
  CONSTRAINT `tb_analytics_visitas_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=1423 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tb_categorias` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(255) NOT NULL,
  `tipo` varchar(50) DEFAULT NULL,
  `icono` varchar(255) DEFAULT NULL,
  `orden` int(11) DEFAULT 0,
  `activo` tinyint(1) DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_tb_categorias_tipo` (`tipo`)
) ENGINE=InnoDB AUTO_INCREMENT=110 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tb_eventos` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `titulo` varchar(200) NOT NULL,
  `fecha` varchar(80) DEFAULT NULL COMMENT 'Texto libre: Ej "15 - 17 Mar 2026"',
  `ubicacion` varchar(200) DEFAULT NULL,
  `precio` varchar(60) DEFAULT NULL COMMENT 'Texto libre: Ej "$5.000 o Gratis"',
  `categoria_evento_id` int(10) unsigned DEFAULT NULL COMMENT 'FK tb_categorias tipo=evento',
  `imagen` varchar(500) DEFAULT NULL COMMENT 'Ruta relativa /uploads/eventos/...',
  `imagen_crop` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT '{zoom, x, y}' CHECK (json_valid(`imagen_crop`)),
  `activo` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_eventos_categoria` (`categoria_evento_id`),
  KEY `idx_eventos_activo` (`activo`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tb_historial_seguridad` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `usuario_id` int(10) unsigned DEFAULT NULL,
  `accion` varchar(60) NOT NULL,
  `detalle` varchar(255) DEFAULT NULL,
  `ip` varchar(45) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_hist_seg_usuario` (`usuario_id`,`created_at`),
  CONSTRAINT `fk_hist_seg_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tb_listing_imagenes` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `listing_id` int(10) unsigned NOT NULL,
  `url` varchar(500) NOT NULL,
  `orden` tinyint(4) NOT NULL DEFAULT 0,
  `es_principal` tinyint(1) NOT NULL DEFAULT 0,
  `pos_x` float DEFAULT 0,
  `pos_y` float DEFAULT 0,
  `scale` float DEFAULT 1,
  `natural_w` int(11) DEFAULT NULL,
  `natural_h` int(11) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_listing_img` (`listing_id`,`orden`),
  CONSTRAINT `fk_listing_img_listing` FOREIGN KEY (`listing_id`) REFERENCES `tb_listings` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=260 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tb_listing_variantes` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `listing_id` int(10) unsigned NOT NULL,
  `tipo` varchar(40) NOT NULL,
  `valor` varchar(80) NOT NULL,
  `sku` varchar(60) DEFAULT NULL,
  `stock` int(11) DEFAULT NULL,
  `precio_delta` int(11) NOT NULL DEFAULT 0,
  `orden` tinyint(4) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_listing_var` (`listing_id`),
  CONSTRAINT `fk_listing_var_listing` FOREIGN KEY (`listing_id`) REFERENCES `tb_listings` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tb_listings` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `usuario_id` int(10) unsigned DEFAULT NULL COMMENT 'FK a tabla de usuarios (futura)',
  `tipo` enum('producto','servicio','arriendo') NOT NULL,
  `seccion` varchar(60) DEFAULT NULL COMMENT 'destacados | ofertas | novedades | liquidacion | tecnologia | tendencia | servicios | arriendos',
  `nombre` varchar(200) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `precio` int(10) unsigned NOT NULL DEFAULT 0,
  `precio_original` int(10) unsigned DEFAULT NULL,
  `categoria` varchar(80) DEFAULT NULL COMMENT 'Texto del nombre de categoría',
  `categoria_id` int(10) unsigned DEFAULT NULL COMMENT 'FK tb_categorias',
  `subcategoria` varchar(80) DEFAULT NULL COMMENT 'Texto del nombre de subcategoría',
  `subcategoria_id` int(10) unsigned DEFAULT NULL COMMENT 'FK tb_subcategorias',
  `badge` varchar(30) DEFAULT NULL COMMENT 'Ej: Nuevo | Oferta | Hot',
  `genero` varchar(20) DEFAULT NULL COMMENT 'hombre | mujer | unisex | niño | niña',
  `imagen` varchar(500) DEFAULT NULL COMMENT 'Ruta relativa /uploads/productos/...',
  `imagen_pos_x` float DEFAULT 0 COMMENT 'Posición X del recorte',
  `imagen_pos_y` float DEFAULT 0 COMMENT 'Posición Y del recorte',
  `imagen_scale` float DEFAULT 1 COMMENT 'Escala del recorte',
  `imagen_natural_w` int(11) DEFAULT NULL COMMENT 'Ancho natural de la imagen original',
  `imagen_natural_h` int(11) DEFAULT NULL COMMENT 'Alto natural de la imagen original',
  `banner_orden` tinyint(4) DEFAULT NULL COMMENT 'Posición en banner (0-N)',
  `banner_pos_x` float DEFAULT 50 COMMENT 'X% para banner',
  `banner_pos_y` float DEFAULT 50 COMMENT 'Y% para banner',
  `banner_scale` float DEFAULT 1 COMMENT 'Escala para banner',
  `tallas` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT '{tipo: calzado|ropa|accesorios, seleccion: []}' CHECK (json_valid(`tallas`)),
  `medidas` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT '{alto, ancho, profundidad}' CHECK (json_valid(`medidas`)),
  `stock` int(11) DEFAULT NULL,
  `stock_minimo` int(11) DEFAULT 0,
  `sku` varchar(60) DEFAULT NULL,
  `peso_gramos` int(11) DEFAULT NULL,
  `alto_cm` int(11) DEFAULT NULL,
  `ancho_cm` int(11) DEFAULT NULL,
  `profundidad_cm` int(11) DEFAULT NULL,
  `envio_disponible` tinyint(1) NOT NULL DEFAULT 0,
  `retiro_local` tinyint(1) NOT NULL DEFAULT 1,
  `costo_envio` int(11) DEFAULT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_listings_usuario` (`usuario_id`),
  KEY `idx_listings_tipo` (`tipo`),
  KEY `idx_listings_seccion` (`seccion`),
  KEY `idx_listings_activo` (`activo`),
  KEY `idx_listings_categoria` (`categoria_id`),
  KEY `idx_listings_sku` (`sku`),
  CONSTRAINT `fk_listings_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=159 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tb_locales` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `nombre` varchar(200) NOT NULL,
  `direccion` varchar(200) DEFAULT NULL,
  `categoria_barrio_id` int(10) unsigned DEFAULT NULL COMMENT 'FK tb_categorias tipo=local',
  `imagen` varchar(500) DEFAULT NULL COMMENT 'Ruta relativa /uploads/locales/...',
  `imagen_crop` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT '{zoom, x, y}' CHECK (json_valid(`imagen_crop`)),
  `activo` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_locales_categoria` (`categoria_barrio_id`),
  KEY `idx_locales_activo` (`activo`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tb_subcategorias` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `categoria_id` int(11) NOT NULL,
  `nombre` varchar(255) NOT NULL,
  `icono` varchar(255) DEFAULT NULL,
  `orden` int(11) DEFAULT 0,
  `activo` tinyint(1) DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_tb_sub_categoria` (`categoria_id`),
  CONSTRAINT `fk_subcat_categoria` FOREIGN KEY (`categoria_id`) REFERENCES `tb_categorias` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=856 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tb_tours` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `usuario_id` int(10) unsigned DEFAULT NULL COMMENT 'FK a tabla de usuarios (futura)',
  `nombre` varchar(200) NOT NULL,
  `categoria` varchar(80) DEFAULT NULL COMMENT 'Texto del nombre de categoría turismo',
  `categoria_id` int(10) unsigned DEFAULT NULL COMMENT 'FK tb_categorias tipo=turismo',
  `ubicacion` varchar(200) DEFAULT NULL,
  `detalle` text DEFAULT NULL,
  `precio` int(10) unsigned DEFAULT NULL COMMENT 'NULL = precio a consultar',
  `precio_antes` int(10) unsigned DEFAULT NULL,
  `imagen_principal` tinyint(4) NOT NULL DEFAULT 0 COMMENT 'Índice 0-2 de la imagen principal',
  `imagenes` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Array de 3 URLs [img0, img1, img2]' CHECK (json_valid(`imagenes`)),
  `imagenes_crop` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Array de 3 objetos {zoom, x, y}' CHECK (json_valid(`imagenes_crop`)),
  `activo` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_tours_usuario` (`usuario_id`),
  KEY `idx_tours_categoria` (`categoria_id`),
  KEY `idx_tours_activo` (`activo`),
  CONSTRAINT `fk_tours_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=52 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tb_visitas_sitio` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `ip` varchar(45) NOT NULL DEFAULT '',
  `pagina` varchar(40) NOT NULL DEFAULT 'home',
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_fecha` (`created_at`),
  KEY `idx_ip` (`ip`)
) ENGINE=InnoDB AUTO_INCREMENT=891 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `usuarios` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `nombre` varchar(120) NOT NULL,
  `email` varchar(191) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `rol` enum('usuario','programador') NOT NULL DEFAULT 'usuario',
  `tipo_cuenta` enum('general','turismo') NOT NULL DEFAULT 'general',
  `plan_id` int(10) unsigned NOT NULL DEFAULT 1,
  `vende_productos` tinyint(1) NOT NULL DEFAULT 0,
  `ofrece_servicios` tinyint(1) NOT NULL DEFAULT 0,
  `ofrece_arriendos` tinyint(1) NOT NULL DEFAULT 0,
  `dni` varchar(20) DEFAULT NULL,
  `telefono` varchar(30) DEFAULT NULL,
  `direccion` varchar(200) DEFAULT NULL,
  `comuna` varchar(80) DEFAULT 'Villarrica',
  `activo` tinyint(1) NOT NULL DEFAULT 1,
  `eliminacion_programada_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_usuarios_email` (`email`),
  KEY `idx_usuarios_plan` (`plan_id`),
  KEY `idx_usuarios_rol` (`rol`),
  KEY `idx_usuarios_eliminacion` (`eliminacion_programada_at`),
  CONSTRAINT `fk_usuarios_plan` FOREIGN KEY (`plan_id`) REFERENCES `planes` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=65 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
