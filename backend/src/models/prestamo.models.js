/* ==========================================================================
   prestamo.models.js - Modelo de Préstamos (Acceso a Datos) · solo lectura
   Registrar préstamos y devoluciones es del Grupo 4.
   Acá solo se leen los últimos préstamos para la tabla del Inicio.
   ========================================================================== */

import connection from "../database/db.js";


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
