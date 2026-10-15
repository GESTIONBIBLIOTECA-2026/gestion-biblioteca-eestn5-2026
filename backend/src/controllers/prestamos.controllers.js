/* ==========================================================================
   prestamos.controllers.js - Controlador de Préstamos (solo lectura)
   Registrar préstamos y devoluciones es del Grupo 4.
   ========================================================================== */

import { getUltimosPrestamos } from "../models/prestamo.models.js";


/* --------------------------------------------------------------------------
   GET /api/prestamos?limite=5   (requiere token)
   Últimos préstamos para la tabla del panel.
   -------------------------------------------------------------------------- */
export const getPrestamos = async (req, res) => {
    try {
        const prestamos = await getUltimosPrestamos(req.limite);
        return res.json({ payload: prestamos });

    } catch (error) {
        console.error("Error al listar préstamos:", error.message);
        return res.status(500).json({ error: "No se pudieron cargar los préstamos." });
    }
};
