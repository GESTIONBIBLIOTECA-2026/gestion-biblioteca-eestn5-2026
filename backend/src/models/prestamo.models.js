/* ==========================================================================
   prestamo.models.js - Modelo de Préstamos (Acceso a Datos)
   Un préstamo es un registro de la tabla "pedidos" en estado 'prestado'.
   ========================================================================== */

import connection from "../database/db.js";


/**
 * Error de regla de negocio (usuario suspendido, sin stock, etc.).
 * El controlador lo convierte en una respuesta con ese código HTTP.
 */
export class ErrorPrestamo extends Error {
    constructor(status, mensaje) {
        super(mensaje);
        this.status = status;
    }
}


/**
 * Últimos préstamos (entregados, vencidos o devueltos), del más nuevo al más viejo.
 */
export const getUltimosPrestamos = async (limite = 5) => {

    const sql = `SELECT pedido_id, usuario_id, dni, nombre_completo, titulo, cantidad,
                        COALESCE(fecha_entrega, fecha_pedido) AS fecha_prestamo,
                        fecha_devolucion_estimada, fecha_devolucion_real,
                        estado, dias_atraso
                 FROM vista_historial_usuario
                 WHERE estado IN ('prestado', 'vencido', 'devuelto')
                 ORDER BY COALESCE(fecha_entrega, fecha_pedido) DESC, pedido_id DESC
                 LIMIT ?`;

    const [filas] = await connection.query(sql, [limite]);

    return filas;
};


/**
 * Registra un préstamo en el mostrador, todo junto o nada (transacción):
 *   1. Valida al usuario (habilitado, sin sanciones ni atrasos)
 *   2. Toma un ejemplar disponible del libro y lo bloquea
 *   3. Crea el pedido en estado 'prestado', le asigna el ejemplar y lo marca prestado
 *   4. Deja el registro en pedido_historial
 * Devuelve el préstamo creado.
 */
export const crearPrestamo = async ({ dni, libroId, adminId, dias }) => {

    // Se pide UNA conexión del pool: la transacción tiene que ir toda por la misma
    const conexion = await connection.getConnection();

    try {
        await conexion.beginTransaction();

        // --- 1. Usuario ---
        const [usuarios] = await conexion.query(
            `SELECT u.id, u.nombre_completo, u.estado,
                    (SELECT COUNT(*) FROM sanciones s
                      WHERE s.usuario_id = u.id AND s.activa = TRUE
                        AND (s.fecha_fin IS NULL OR s.fecha_fin >= CURRENT_DATE)) AS sanciones_activas,
                    (SELECT COUNT(*) FROM pedidos p
                      WHERE p.usuario_id = u.id
                        AND (p.estado = 'vencido'
                             OR (p.estado = 'prestado' AND p.fecha_devolucion_estimada < CURRENT_DATE))) AS prestamos_atrasados
             FROM usuarios u
             WHERE u.dni = ?
             LIMIT 1`,
            [dni]
        );

        const usuario = usuarios[0];

        if (!usuario) {
            throw new ErrorPrestamo(404, "No hay ningún usuario con ese DNI.");
        }

        if (usuario.estado !== "habilitado") {
            throw new ErrorPrestamo(409, usuario.estado === "baja"
                ? "El usuario está dado de baja."
                : "El usuario está suspendido y no puede llevarse libros.");
        }

        if (usuario.sanciones_activas > 0) {
            throw new ErrorPrestamo(409, "El usuario tiene una sanción activa.");
        }

        if (usuario.prestamos_atrasados > 0) {
            throw new ErrorPrestamo(409, "El usuario tiene un préstamo atrasado sin devolver.");
        }

        // --- 2. Libro y ejemplar disponible ---
        const [libros] = await conexion.query(
            "SELECT id, titulo FROM libros WHERE id = ? AND activo = TRUE LIMIT 1",
            [libroId]
        );

        const libro = libros[0];

        if (!libro) {
            throw new ErrorPrestamo(404, "No hay ningún libro con ese ID.");
        }

        // FOR UPDATE: bloquea el ejemplar hasta terminar, así dos préstamos
        // al mismo tiempo no se pueden llevar la misma copia
        const [ejemplares] = await conexion.query(
            `SELECT id, codigo_inventario FROM ejemplares
             WHERE libro_id = ? AND estado = 'disponible'
             ORDER BY id
             LIMIT 1
             FOR UPDATE`,
            [libroId]
        );

        const ejemplar = ejemplares[0];

        if (!ejemplar) {
            throw new ErrorPrestamo(409, "No quedan ejemplares disponibles de ese libro.");
        }

        // Los ejemplares libres que ya están reservados (pedidos pendientes) no se prestan
        const [[stock]] = await conexion.query(
            `SELECT
                (SELECT COUNT(*) FROM ejemplares WHERE libro_id = ? AND estado = 'disponible') AS disponibles,
                (SELECT COALESCE(SUM(cantidad), 0) FROM pedidos WHERE libro_id = ? AND estado = 'pendiente') AS reservados`,
            [libroId, libroId]
        );

        if (stock.disponibles - stock.reservados < 1) {
            throw new ErrorPrestamo(409, "Los ejemplares disponibles ya están reservados por otros pedidos.");
        }

        // --- 3. Pedido en estado 'prestado' ---
        const [resultado] = await conexion.query(
            `INSERT INTO pedidos (usuario_id, libro_id, cantidad, fecha_devolucion_estimada, fecha_entrega, estado)
             VALUES (?, ?, 1, DATE_ADD(CURRENT_DATE, INTERVAL ? DAY), NOW(), 'prestado')`,
            [usuario.id, libro.id, dias]
        );

        const pedidoId = resultado.insertId;

        await conexion.query(
            "INSERT INTO pedido_ejemplares (pedido_id, ejemplar_id) VALUES (?, ?)",
            [pedidoId, ejemplar.id]
        );

        await conexion.query(
            "UPDATE ejemplares SET estado = 'prestado' WHERE id = ?",
            [ejemplar.id]
        );

        // --- 4. Historial activo ---
        await conexion.query(
            `INSERT INTO pedido_historial (pedido_id, estado_anterior, estado_nuevo, registrado_por, observacion)
             VALUES (?, NULL, 'prestado', ?, 'Préstamo registrado en el mostrador')`,
            [pedidoId, adminId]
        );

        await conexion.commit();

        // Devolver el préstamo tal como lo muestra el panel
        const [filas] = await connection.query(
            `SELECT pedido_id, nombre_completo, titulo,
                    COALESCE(fecha_entrega, fecha_pedido) AS fecha_prestamo,
                    fecha_devolucion_estimada, estado
             FROM vista_historial_usuario
             WHERE pedido_id = ?`,
            [pedidoId]
        );

        return { ...filas[0], codigo_inventario: ejemplar.codigo_inventario };

    } catch (error) {
        await conexion.rollback();
        throw error;

    } finally {
        // Devolver la conexión al pool (si no, el pool se queda sin conexiones)
        conexion.release();
    }
};
