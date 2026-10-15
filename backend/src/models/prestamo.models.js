/* ==========================================================================
   prestamo.models.js - Modelo de Préstamos (solo lectura)
   Registrar préstamos y devoluciones es del Grupo 4.
   ========================================================================== */

import connection from "../database/db.js";

// Últimos préstamos entregados, vencidos o devueltos (para el Inicio)
export const getUltimosPrestamos = async (limite) => {
    const sql = `SELECT nombre_completo, titulo, COALESCE(fecha_entrega, fecha_pedido) AS fecha_prestamo,
                        fecha_devolucion_estimada, fecha_devolucion_real, estado, dias_atraso
                 FROM vista_historial_usuario
                 WHERE estado IN ('prestado', 'vencido', 'devuelto')
                 ORDER BY fecha_prestamo DESC
                 LIMIT ?`;
    const [rows] = await connection.query(sql, [limite]);
    return rows;
};
