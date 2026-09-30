/* ==========================================================================
   libros.controllers.js - Controlador de Libros
   ========================================================================== */

import { getLibroPorId } from "../models/libro.models.js";


/* --------------------------------------------------------------------------
   GET /api/libros/:id   (requiere token)
   Devuelve el libro con su stock (vista_stock_libros).
   -------------------------------------------------------------------------- */
export const getLibro = async (req, res) => {
    try {
        const libro = await getLibroPorId(Number(req.params.id));

        if (!libro) {
            return res.status(404).json({ error: "No hay ningún libro con ese ID." });
        }

        return res.json({ payload: libro });

    } catch (error) {
        console.error("Error al buscar libro:", error.message);
        return res.status(500).json({ error: "No se pudo consultar la base de datos." });
    }
};
