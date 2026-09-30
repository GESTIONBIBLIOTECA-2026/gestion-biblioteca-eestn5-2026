/* ==========================================================================
   usuarios.controllers.js - Controlador de Usuarios
   ========================================================================== */

import { getFichaUsuarioPorDni } from "../models/usuario.models.js";


/* --------------------------------------------------------------------------
   GET /api/usuarios/dni/:dni   (requiere token)
   Lo usa "Nuevo préstamo" para completar el nombre y avisar si puede llevarse libros.
   -------------------------------------------------------------------------- */
export const getUsuarioPorDni = async (req, res) => {
    try {
        const usuario = await getFichaUsuarioPorDni(req.params.dni);

        if (!usuario) {
            return res.status(404).json({ error: "No hay ningún usuario con ese DNI." });
        }

        const puedePedir = usuario.estado === "habilitado"
            && usuario.sanciones_activas === 0
            && usuario.prestamos_atrasados === 0;

        return res.json({ payload: { ...usuario, puede_pedir: puedePedir } });

    } catch (error) {
        console.error("Error al buscar usuario:", error.message);
        return res.status(500).json({ error: "No se pudo consultar la base de datos." });
    }
};
