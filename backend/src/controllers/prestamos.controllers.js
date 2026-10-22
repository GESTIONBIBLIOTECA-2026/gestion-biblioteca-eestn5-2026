/* ==========================================================================
   prestamos.controllers.js - Controlador de Préstamos (solo lectura)
   Registrar préstamos y devoluciones es del Grupo 4.
   ========================================================================== */

import { getUltimosPrestamos } from "../models/prestamo.models.js";
import { error500 } from "./respuestas.js";

/* --- GET /api/prestamos?limite=5 --- */
export const getPrestamos = async (req, res) => {
    try {
        return res.json({ payload: await getUltimosPrestamos(req.limite) });
    } catch (error) {
        return error500(res, error, "No se pudieron cargar los préstamos");
    }
};
