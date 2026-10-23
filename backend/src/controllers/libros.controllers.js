/* ==========================================================================
   libros.controllers.js - Controlador de Libros (consulta para otros grupos)
   ========================================================================== */

import { getLibroPorId, listarLibrosParaPedido } from "../models/libro.models.js";

/* --- GET /api/libros/:id --- */
export const getLibro = async (req, res) => {
    try {
        const libro = await getLibroPorId(req.id);
        if (!libro) return res.status(404).json({ error: "No hay ningún libro con ese ID." });
        return res.json({ payload: libro });
    } catch (error) {
        console.error("Error al buscar libro:", error.message);
        return res.status(500).json({ error: "No se pudo consultar la base de datos." });
    }
};


// GET /api/libros?q=... — listado del catálogo para crear pedidos.
export const getLibros = async (req, res) => {
    try {
        const busqueda = String(req.query.q || "").trim().slice(0, 100);
        const libros = await listarLibrosParaPedido(busqueda);
        return res.json({ payload: libros });
    } catch (error) {
        console.error("Error al listar libros:", error.message);
        return res.status(500).json({ error: "No se pudo cargar el catálogo de libros." });
    }
};
