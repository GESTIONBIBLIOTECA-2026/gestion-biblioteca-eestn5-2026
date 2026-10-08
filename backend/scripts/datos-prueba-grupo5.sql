-- =====================================================================
-- datos-prueba-grupo5.sql  ·  OPCIONAL
-- Datos de ejemplo para probar "Gestión de usuarios" (Grupo 5):
-- usuarios con distintos estados, préstamos al día, devueltos, atrasados
-- y sanciones. Ejecutalo UNA sola vez en VS Code (Database Client),
-- después de base-de-datos.sql.
--
-- Todo lo de prueba se reconoce fácil para borrarlo después:
--   usuarios con DNI 99000001..99000006 · libro con ISBN 'PRUEBA-G5-1'
-- (al final está el bloque para borrarlo)
-- Contraseña de todos los usuarios de prueba: prueba123
-- =====================================================================

SET NAMES utf8mb4;
SET time_zone = '-03:00';

-- bcrypt de "prueba123"
SET @clave := '$2b$10$JyN4hbF3pwxf.JHVC7eaLej4s08ZyWdAOkSvgl0p1VZB5o6rPMfhW';

SET @rol_alumno  := (SELECT id FROM roles WHERE nombre = 'alumno');
SET @rol_docente := (SELECT id FROM roles WHERE nombre = 'docente');
SET @admin       := (SELECT id FROM usuarios WHERE dni = '30111222');   -- Gabriela (puede ser NULL)

INSERT IGNORE INTO cursos (nombre) VALUES ('7mo 5ta'), ('7mo 4ta'), ('6to 5ta');
SET @c75 := (SELECT id FROM cursos WHERE nombre = '7mo 5ta');
SET @c74 := (SELECT id FROM cursos WHERE nombre = '7mo 4ta');
SET @c65 := (SELECT id FROM cursos WHERE nombre = '6to 5ta');


-- ---------------------------------------------------------------------
-- Usuarios
-- ---------------------------------------------------------------------
INSERT INTO usuarios (dni, nombre_completo, curso_id, correo, telefono, direccion, password_hash, rol_id, estado) VALUES
('99000001', 'Juan Pérez',       @c75, 'juan.perez@prueba.eest5.edu.ar',       '11 5555-0001', 'Av. Hipólito Yrigoyen 4500, Lanús',   @clave, @rol_alumno,  'habilitado'),
('99000002', 'Lucía Gómez',      @c75, 'lucia.gomez@prueba.eest5.edu.ar',      '11 5555-0002', 'Margarita Weild 1200, Lanús',         @clave, @rol_alumno,  'habilitado'),
('99000003', 'Tomás Ruiz',       @c65, 'tomas.ruiz@prueba.eest5.edu.ar',       '11 5555-0003', '9 de Julio 800, Lanús',               @clave, @rol_alumno,  'habilitado'),
('99000004', 'Agustina Díaz',    @c74, 'agustina.diaz@prueba.eest5.edu.ar',    '11 5555-0004', 'Sarmiento 300, Remedios de Escalada', @clave, @rol_alumno,  'suspendido'),
('99000005', 'Sergio Mora',      NULL, 'sergio.mora@prueba.eest5.edu.ar',      '11 5555-0005', 'Pasco 1500, Lanús',                   @clave, @rol_docente, 'habilitado'),
('99000006', 'Martín Fernández', @c74, 'martin.fernandez@prueba.eest5.edu.ar', '11 5555-0006', 'Ituzaingó 900, Lanús',                @clave, @rol_alumno,  'baja');

SET @juan     := (SELECT id FROM usuarios WHERE dni = '99000001');
SET @lucia    := (SELECT id FROM usuarios WHERE dni = '99000002');
SET @tomas    := (SELECT id FROM usuarios WHERE dni = '99000003');
SET @agustina := (SELECT id FROM usuarios WHERE dni = '99000004');
SET @sergio   := (SELECT id FROM usuarios WHERE dni = '99000005');


-- ---------------------------------------------------------------------
-- Libro de prueba con 3 ejemplares
-- ---------------------------------------------------------------------
INSERT INTO libros (isbn, titulo, categoria_id, anio_publicacion)
VALUES ('PRUEBA-G5-1', 'Martín Fierro', COALESCE((SELECT id FROM categorias WHERE nombre = 'Literatura'),
                                                 (SELECT MIN(id) FROM categorias)), 1872);
SET @libro := LAST_INSERT_ID();

INSERT INTO ejemplares (libro_id, codigo_inventario, estado) VALUES (@libro, 'PRUEBA-G5-01', 'prestado');
SET @ej1 := LAST_INSERT_ID();
INSERT INTO ejemplares (libro_id, codigo_inventario, estado) VALUES (@libro, 'PRUEBA-G5-02', 'prestado');
SET @ej2 := LAST_INSERT_ID();
INSERT INTO ejemplares (libro_id, codigo_inventario, estado) VALUES (@libro, 'PRUEBA-G5-03', 'disponible');
SET @ej3 := LAST_INSERT_ID();


-- ---------------------------------------------------------------------
-- Préstamos (pedidos) + historial
-- ---------------------------------------------------------------------

-- Juan: uno devuelto a tiempo y uno en curso, al día
INSERT INTO pedidos (usuario_id, libro_id, fecha_pedido, fecha_devolucion_estimada, fecha_entrega, fecha_devolucion_real, estado)
VALUES (@juan, @libro, NOW() - INTERVAL 30 DAY, CURRENT_DATE - INTERVAL 23 DAY, NOW() - INTERVAL 30 DAY, NOW() - INTERVAL 25 DAY, 'devuelto');
SET @p1 := LAST_INSERT_ID();
INSERT INTO pedido_ejemplares (pedido_id, ejemplar_id) VALUES (@p1, @ej3);

INSERT INTO pedidos (usuario_id, libro_id, fecha_pedido, fecha_devolucion_estimada, fecha_entrega, estado)
VALUES (@juan, @libro, NOW() - INTERVAL 2 DAY, CURRENT_DATE + INTERVAL 5 DAY, NOW() - INTERVAL 2 DAY, 'prestado');
SET @p2 := LAST_INSERT_ID();
INSERT INTO pedido_ejemplares (pedido_id, ejemplar_id) VALUES (@p2, @ej2);

-- Tomás: prestado y vencido hace 5 días → "Suspendido por atraso" (moroso)
INSERT INTO pedidos (usuario_id, libro_id, fecha_pedido, fecha_devolucion_estimada, fecha_entrega, estado)
VALUES (@tomas, @libro, NOW() - INTERVAL 12 DAY, CURRENT_DATE - INTERVAL 5 DAY, NOW() - INTERVAL 12 DAY, 'prestado');
SET @p3 := LAST_INSERT_ID();
INSERT INTO pedido_ejemplares (pedido_id, ejemplar_id) VALUES (@p3, @ej1);

-- Lucía: devolvió con 3 días de atraso + tiene una reserva sin retirar
INSERT INTO pedidos (usuario_id, libro_id, fecha_pedido, fecha_devolucion_estimada, fecha_entrega, fecha_devolucion_real, estado)
VALUES (@lucia, @libro, NOW() - INTERVAL 40 DAY, CURRENT_DATE - INTERVAL 33 DAY, NOW() - INTERVAL 40 DAY, NOW() - INTERVAL 30 DAY, 'devuelto');
SET @p4 := LAST_INSERT_ID();
INSERT INTO pedido_ejemplares (pedido_id, ejemplar_id) VALUES (@p4, @ej1);

INSERT INTO pedidos (usuario_id, libro_id, fecha_pedido, fecha_devolucion_estimada, estado)
VALUES (@lucia, @libro, NOW(), CURRENT_DATE + INTERVAL 7 DAY, 'pendiente');
SET @p5 := LAST_INSERT_ID();

INSERT INTO pedido_historial (pedido_id, estado_anterior, estado_nuevo, registrado_por, fecha, observacion) VALUES
(@p1, NULL,       'prestado',  @admin, NOW() - INTERVAL 30 DAY, 'Préstamo registrado en el mostrador'),
(@p1, 'prestado', 'devuelto',  @admin, NOW() - INTERVAL 25 DAY, 'Devolución registrada'),
(@p2, NULL,       'prestado',  @admin, NOW() - INTERVAL 2 DAY,  'Préstamo registrado en el mostrador'),
(@p3, NULL,       'prestado',  @admin, NOW() - INTERVAL 12 DAY, 'Préstamo registrado en el mostrador'),
(@p4, NULL,       'prestado',  @admin, NOW() - INTERVAL 40 DAY, 'Préstamo registrado en el mostrador'),
(@p4, 'prestado', 'devuelto',  @admin, NOW() - INTERVAL 30 DAY, 'Devolución registrada'),
(@p5, NULL,       'pendiente', NULL,   NOW(),                   'Reserva desde la app');


-- ---------------------------------------------------------------------
-- Sanciones
-- ---------------------------------------------------------------------

-- Agustina: suspendida por un administrador (en vigor)
INSERT INTO sanciones (usuario_id, tipo, motivo, fecha_inicio, activa, aplicada_por)
VALUES (@agustina, 'manual', 'Devolvió un libro con hojas arrancadas', CURRENT_DATE - INTERVAL 5 DAY, TRUE, @admin);

-- Sergio: sanción vieja, ya levantada
INSERT INTO sanciones (usuario_id, tipo, motivo, fecha_inicio, fecha_fin, activa, aplicada_por)
VALUES (@sergio, 'manual', 'Libro devuelto dañado', CURRENT_DATE - INTERVAL 60 DAY, CURRENT_DATE - INTERVAL 50 DAY, FALSE, @admin);


-- Verificación rápida:
-- SELECT dni, nombre_completo, estado FROM usuarios WHERE dni LIKE '990000%';
-- SELECT * FROM vista_historial_usuario WHERE dni LIKE '990000%';


-- =====================================================================
-- PARA BORRAR LOS DATOS DE PRUEBA (descomentá y ejecutá en este orden)
-- =====================================================================
-- UPDATE ejemplares e
--   JOIN pedido_ejemplares pe ON pe.ejemplar_id = e.id
--   JOIN pedidos p ON p.id = pe.pedido_id
--   JOIN usuarios u ON u.id = p.usuario_id
--    SET e.estado = 'disponible'
--  WHERE u.dni LIKE '990000%' AND p.estado IN ('prestado', 'vencido');   -- libros que se llevaron en las pruebas
-- DELETE s FROM sanciones s JOIN usuarios u ON u.id = s.usuario_id WHERE u.dni LIKE '990000%';
-- DELETE FROM pedidos WHERE libro_id = (SELECT id FROM libros WHERE isbn = 'PRUEBA-G5-1');
-- DELETE p FROM pedidos p JOIN usuarios u ON u.id = p.usuario_id WHERE u.dni LIKE '990000%';
-- DELETE FROM usuarios WHERE dni LIKE '990000%';
-- DELETE e FROM ejemplares e JOIN libros l ON l.id = e.libro_id WHERE l.isbn = 'PRUEBA-G5-1';
-- DELETE FROM libros WHERE isbn = 'PRUEBA-G5-1';
