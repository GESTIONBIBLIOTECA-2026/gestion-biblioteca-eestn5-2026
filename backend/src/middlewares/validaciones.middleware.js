/* ==========================================================================
   validaciones.middleware.js - Validación de parámetros y consultas
   Frenan los datos mal cargados ANTES de llegar al controlador y a la base.
   Si algo está mal: return res.status(400). Si está bien: next().
   Los formularios (perfil y contraseña) están en formularios.middleware.js
   ========================================================================== */

import { limpiarDni, esDniValido } from "./predicados.js";

/* --- ID de la URL: /api/libros/:id --- */
export const validarID = (req, res, next) => {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ error: "El ID tiene que ser un número entero mayor a 0." });
    }

    req.id = id;
    next();
};

/* --- Login: { dni, clave } --- */
export const validarLogin = (req, res, next) => {
    const dni = limpiarDni(req.body?.dni);
    const clave = String(req.body?.clave ?? "");

    if (!esDniValido(dni) || !clave) {
        return res.status(400).json({ error: "Completá el DNI (7 u 8 números) y la contraseña." });
    }

    req.body = { dni, clave };
    next();
};
