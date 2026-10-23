/* ==========================================================================
   sanciones.controllers.js - Mi cuenta: historial activo y sanciones · Grupo 5
   El alumno o docente ve SOLO lo suyo (el ID sale del token).
   ========================================================================== */

import { getUsuarioPorId } from "../models/usuario.models.js";
import { getHistorial } from "../models/sancion.models.js";
import { error500 } from "./respuestas.js";


// Usuario + historial activo + resumen (inicio del alumno/docente)
const armarHistorial = async (id) => {
    const usuario = await getUsuarioPorId(id);
    if (!usuario) return null;

    const { prestamos, sanciones } = await getHistorial(id);

    // Resumen con HOFs (.filter)
    const resumen = {
        entregas: prestamos.filter((p) => p.fecha_entrega).length,
        devoluciones: prestamos.filter((p) => p.estado === "devuelto").length,
        atrasos: prestamos.filter((p) => p.dias_atraso > 0).length,
        en_curso: prestamos.filter((p) => ["prestado", "vencido"].includes(p.estado)).length,
        reservas: prestamos.filter((p) => p.estado === "pendiente").length
    };

    return { usuario, resumen, prestamos, sanciones };
};


/* --- GET /api/perfil/historial   Mi cuenta: el historial del usuario logueado --- */
export const getMiHistorial = async (req, res) => {
    try {
        return res.json({ payload: await armarHistorial(req.usuario.id) });
    } catch (error) {
        return error500(res, error, "No se pudo cargar tu cuenta");
    }
};
