/* ==========================================================================
   libro.models.js - Modelo de Libros (consulta para otros grupos)
   ========================================================================== */

import connection from "../database/db.js";

// Un libro con su stock (vista_stock_libros)
export const getLibroPorId = async (id) => {
    const sql = `SELECT libro_id, isbn, titulo, categoria, autores, ejemplares_totales,
                        ejemplares_disponibles, cantidad_reservada, stock_reservable, estado_visual
                 FROM vista_stock_libros WHERE libro_id = ?`;
    const [rows] = await connection.query(sql, [id]);
    return rows[0];
};
