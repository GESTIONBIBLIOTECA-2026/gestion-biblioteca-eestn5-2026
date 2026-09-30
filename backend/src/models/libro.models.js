/* ==========================================================================
   libro.models.js - Modelo de Libros (Acceso a Datos)
   Usa la vista vista_stock_libros (catálogo + stock) de base-de-datos.sql
   ========================================================================== */

import connection from "../database/db.js";


/**
 * Busca un libro activo por ID con su stock.
 * Devuelve { libro_id, titulo, autores, ejemplares_disponibles, stock_reservable, ... } o null.
 */
export const getLibroPorId = async (id) => {

    const sql = `SELECT libro_id, isbn, titulo, categoria, autores,
                        ejemplares_totales, ejemplares_disponibles,
                        cantidad_reservada, stock_reservable, estado_visual
                 FROM vista_stock_libros
                 WHERE libro_id = ?
                 LIMIT 1`;

    const [filas] = await connection.query(sql, [id]);

    return filas[0] ?? null;
};
