/* ==========================================================================
   prestamos.controllers.js - Controlador de Préstamos
   ========================================================================== */

import { getUltimosPrestamos, crearPrestamo, ErrorPrestamo } from "../models/prestamo.models.js";
import { DIAS_PRESTAMO } from "../config/config.js";


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


/* --------------------------------------------------------------------------
   POST /api/prestamos   (requiere token)
   Body: { "dni": "45123456", "libroId": 1 }
   -------------------------------------------------------------------------- */
export const postPrestamo = async (req, res) => {
    try {
        const { dni, libroId } = req.prestamo;

        const prestamo = await crearPrestamo({
            dni,
            libroId,
            adminId: req.usuario.id,     // quién lo registró (queda en pedido_historial)
            dias: DIAS_PRESTAMO
        });

        return res.status(201).json({ mensaje: "Préstamo registrado con éxito.", payload: prestamo });

    } catch (error) {

        // Reglas de negocio (usuario suspendido, sin stock...): el mensaje va tal cual
        if (error instanceof ErrorPrestamo) {
            return res.status(error.status).json({ error: error.message });
        }

        console.error("Error al registrar préstamo:", error.message);
        return res.status(500).json({ error: "No se pudo registrar el préstamo en la base de datos." });
    }
};
