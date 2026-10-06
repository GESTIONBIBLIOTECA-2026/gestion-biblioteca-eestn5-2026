/* ==========================================================================
   libro.models.js - Modelo de Libros (Acceso a Datos)
   Usa la vista vista_stock_libros (catálogo + stock) de base-de-datos.sql
   ========================================================================== */

import connection from "../database/db.js";


export class ErrorLibro extends Error {
    constructor(codigoOStatus, mensaje, campos = null) {
        super(mensaje);
        this.codigo = typeof codigoOStatus === "string" ? codigoOStatus : null;
        this.status = typeof codigoOStatus === "number" ? codigoOStatus : (codigoOStatus === "NOT_FOUND" ? 404 : codigoOStatus === "CONFLICT" ? 409 : 400);
        this.campos = campos;
    }
}


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


/**
 * Valida que el libro exista, tenga un ejemplar disponible y no esté reservado.
 * Se ejecuta dentro de una transacción recibiendo la conexión con FOR UPDATE en los ejemplares.
 */
export const obtenerEjemplarParaPrestamo = async (conexion, libroId) => {
    const [libros] = await conexion.query(
        "SELECT id, titulo FROM libros WHERE id = ? AND activo = TRUE LIMIT 1",
        [libroId]
    );

    const libro = libros[0];
    if (!libro) {
        throw new ErrorLibro("NOT_FOUND", "No hay ningún libro con ese ID.");
    }

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
        throw new ErrorLibro("CONFLICT", "No quedan ejemplares disponibles de ese libro.");
    }

    const [[stock]] = await conexion.query(
        `SELECT
            (SELECT COUNT(*) FROM ejemplares WHERE libro_id = ? AND estado = 'disponible') AS disponibles,
            (SELECT COALESCE(SUM(cantidad), 0) FROM pedidos WHERE libro_id = ? AND estado = 'pendiente') AS reservados`,
        [libroId, libroId]
    );

    if (stock.disponibles - stock.reservados < 1) {
        throw new ErrorLibro("CONFLICT", "Los ejemplares disponibles ya están reservados por otros pedidos.");
    }

    return { libro, ejemplar };
};

