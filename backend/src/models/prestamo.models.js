/* ==========================================================================
   prestamo.models.js - Modelo de Préstamos (Acceso a Datos)
   Un préstamo es un registro de la tabla "pedidos" en estado 'prestado'.
   ========================================================================== */

import connection from "../database/db.js";
import { obtenerUsuarioParaPrestamo } from "./usuario.models.js";
import { obtenerEjemplarParaPrestamo } from "./libro.models.js";


/**
 * Error de regla de negocio (usuario suspendido, sin stock, etc.).
 * Soporta códigos semánticos de dominio y status HTTP para compatibilidad.
 */
export class ErrorPrestamo extends Error {
    constructor(codigoOStatus, mensaje) {
        super(mensaje);
        this.codigo = typeof codigoOStatus === "string" ? codigoOStatus : null;
        this.status = typeof codigoOStatus === "number" ? codigoOStatus : (codigoOStatus === "NOT_FOUND" ? 404 : codigoOStatus === "CONFLICT" ? 409 : 400);
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


/* ==========================================================================
   SUBFUNCIONES AUXILIARES (Pasos del Préstamo)
   ========================================================================== */

// 1. Registra el pedido, vincula el ejemplar y guarda el historial
async function registrarPedido(conexion, { usuario, libro, ejemplar, adminId, dias }) {
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

    await conexion.query(
        `INSERT INTO pedido_historial (pedido_id, estado_anterior, estado_nuevo, registrado_por, observacion)
         VALUES (?, NULL, 'prestado', ?, 'Préstamo registrado en el mostrador')`,
        [pedidoId, adminId]
    );

    return pedidoId;
}

// 2. Lee el préstamo recién creado para devolverlo formateado
async function consultarPrestamoCreado(conexion, pedidoId, codigoInventario) {
    const [filas] = await conexion.query(
        `SELECT pedido_id, nombre_completo, titulo,
                COALESCE(fecha_entrega, fecha_pedido) AS fecha_prestamo,
                fecha_devolucion_estimada, estado
         FROM vista_historial_usuario
         WHERE pedido_id = ?`,
        [pedidoId]
    );

    return { ...filas[0], codigo_inventario: codigoInventario };
}


/**
 * Registra un préstamo en el mostrador en una transacción atómica:
 *   1. Valida al usuario (delegado a usuario.models.js)
 *   2. Bloquea un ejemplar disponible (delegado a libro.models.js)
 *   3. Inserta el pedido y actualiza inventario
 *   4. Registra en el historial
 */
export const crearPrestamo = async ({ dni, libroId, adminId, dias }) => {
    const conexion = await connection.getConnection();

    try {
        await conexion.beginTransaction();

<<<<<<< HEAD
        // --- 1. Usuario ---
        // FOR SHARE: si al mismo tiempo lo están suspendiendo o dando de baja,
        // se espera a que eso termine y se lee el estado nuevo
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
             LIMIT 1
             FOR SHARE`,
            [dni]
        );
=======
        const usuario = await obtenerUsuarioParaPrestamo(conexion, dni);
        const { libro, ejemplar } = await obtenerEjemplarParaPrestamo(conexion, libroId);
>>>>>>> 005a4073036d3e3ff288278e2d2c8430f8c5ef16

        const pedidoId = await registrarPedido(conexion, {
            usuario,
            libro,
            ejemplar,
            adminId,
            dias
        });

        await conexion.commit();

<<<<<<< HEAD
        // Devolver el préstamo tal como lo muestra el panel.
        // Con la MISMA conexión: pedir otra al pool mientras se tiene esta puede trabar el servidor.
        const [filas] = await conexion.query(
            `SELECT pedido_id, nombre_completo, titulo,
                    COALESCE(fecha_entrega, fecha_pedido) AS fecha_prestamo,
                    fecha_devolucion_estimada, estado
             FROM vista_historial_usuario
             WHERE pedido_id = ?`,
            [pedidoId]
        );

        return { ...filas[0], codigo_inventario: ejemplar.codigo_inventario };
=======
        return await consultarPrestamoCreado(conexion, pedidoId, ejemplar.codigo_inventario);
>>>>>>> 005a4073036d3e3ff288278e2d2c8430f8c5ef16

    } catch (error) {
        await conexion.rollback();
        throw error;

    } finally {
        conexion.release();
    }
};

