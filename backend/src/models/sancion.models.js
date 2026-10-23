/* ==========================================================================
   sancion.models.js - Historial activo y sanciones de un usuario · Grupo 5
   Solo lectura: la app muestra los préstamos y las sanciones del alumno/docente.
   ========================================================================== */

import connection from "../database/db.js";

// Historial activo: préstamos (la vista calcula los días de atraso) y sanciones.
// dias_restantes: cuántos días faltan para la fecha de devolución (negativo = ya pasó)
export const getHistorial = async (id) => {
    const [[prestamos], [sanciones]] = await Promise.all([
        connection.query(
            `SELECT pedido_id, titulo, cantidad, fecha_pedido, fecha_entrega, fecha_devolucion_estimada,
                    fecha_devolucion_real, estado, dias_atraso,
                    DATEDIFF(fecha_devolucion_estimada, CURRENT_DATE) AS dias_restantes
             FROM vista_historial_usuario WHERE usuario_id = ? ORDER BY fecha_pedido DESC`,
            [id]
        ),
        connection.query(
            `SELECT s.tipo, s.motivo, s.fecha_inicio, s.fecha_fin, a.nombre_completo AS aplicada_por,
                    (s.activa = TRUE AND (s.fecha_fin IS NULL OR s.fecha_fin >= CURRENT_DATE)) AS en_vigor
             FROM sanciones s LEFT JOIN usuarios a ON a.id = s.aplicada_por
             WHERE s.usuario_id = ? ORDER BY en_vigor DESC, s.fecha_inicio DESC`,
            [id]
        )
    ]);
    return { prestamos, sanciones };
};
