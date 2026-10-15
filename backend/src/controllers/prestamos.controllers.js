/* ==========================================================================
   prestamos.controllers.js - Controlador de Préstamos (solo lectura)
   Registrar préstamos y devoluciones es del Grupo 4.
   ========================================================================== */

import { getUltimosPrestamos } from "../models/prestamo.models.js";

/* --- GET /api/prestamos?limite=5 --- */
export const getPrestamos = async (req, res) => {
    try {
        return res.json({ payload: await getUltimosPrestamos(req.limite) });
    } catch (error) {
        console.error("Error al listar préstamos:", error.message);
        return res.status(500).json({ error: "No se pudieron cargar los préstamos." });
    }
};
