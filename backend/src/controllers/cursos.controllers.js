/* ==========================================================================
   cursos.controllers.js - Controlador de Cursos · Grupo 5
   ========================================================================== */

import { getCursos } from "../models/curso.models.js";
import { error500 } from "./respuestas.js";

/* --- GET /api/cursos --- */
export const getListaCursos = async (req, res) => {
    try {
        return res.json({ payload: await getCursos() });
    } catch (error) {
        return error500(res, error, "No se pudieron cargar los cursos");
    }
};
