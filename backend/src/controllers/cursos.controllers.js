/* ==========================================================================
   cursos.controllers.js - Controlador de Cursos · Grupo 5
   ========================================================================== */

import { getCursos } from "../models/curso.models.js";


/* --------------------------------------------------------------------------
   GET /api/cursos   (requiere token)
   Lista de cursos para el formulario y el buscador de usuarios.
   -------------------------------------------------------------------------- */
export const getListaCursos = async (req, res) => {
    try {
        const cursos = await getCursos();
        return res.json({ payload: cursos });

    } catch (error) {
        console.error("Error al listar cursos:", error.message);
        return res.status(500).json({ error: "No se pudieron cargar los cursos." });
    }
};
