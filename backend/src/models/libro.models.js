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


// Catálogo consultable para el módulo de pedidos (Grupo 4).
// La vista calcula el stock reservable descontando las reservas pendientes.
export const listarLibrosParaPedido = async (busqueda = "") => {
    const termino = `%${String(busqueda).trim()}%`;
    const [rows] = await connection.query(
        `SELECT libro_id, isbn, titulo, categoria, autores, portada_url,
                ejemplares_totales, ejemplares_disponibles, cantidad_reservada,
                stock_reservable, estado_visual
         FROM vista_stock_libros
         WHERE ? = '' OR titulo LIKE ? OR autores LIKE ? OR categoria LIKE ? OR isbn LIKE ?
         ORDER BY titulo ASC LIMIT 500`,
        [String(busqueda).trim(), termino, termino, termino, termino]
    );
    return rows;
};
