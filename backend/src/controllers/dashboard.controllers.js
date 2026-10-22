/* ==========================================================================
   dashboard.controllers.js - Controlador del Inicio (index.html) · Grupo 5
   ========================================================================== */

import { getMetricas } from "../models/dashboard.models.js";
import { error500 } from "./respuestas.js";

/* --- GET /api/dashboard → { payload: { libros_total, prestamos_activos, alumnos_morosos } } --- */
export const getMetricasDashboard = async (req, res) => {
    try {
        const metricas = await getMetricas();
        return res.json({ payload: metricas });
    } catch (error) {
        return error500(res, error, "No se pudieron cargar las métricas del inicio");
    }
};
