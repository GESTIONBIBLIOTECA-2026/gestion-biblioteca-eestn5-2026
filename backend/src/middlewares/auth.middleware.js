/* ==========================================================================
   auth.middleware.js - Verificación del token de sesión
   "Molinete": si el token no es válido, la petición no llega al controlador.
   ========================================================================== */

import jwt from "jsonwebtoken";
import { JWT_SECRET, ROLES_PANEL } from "../config/config.js";


export const verificarToken = (req, res, next) => {

    // El frontend manda:  Authorization: Bearer <token>
    const encabezado = req.headers.authorization || "";
    const [tipo, token] = encabezado.split(" ");

    if (tipo !== "Bearer" || !token) {
        return res.status(401).json({ error: "Tenés que iniciar sesión." });
    }

    try {
        const { id, nombre, rol } = jwt.verify(token, JWT_SECRET);

        // Deja los datos del usuario disponibles para el controlador
        req.usuario = { id, nombre, rol };
        next();

    } catch (error) {
        return res.status(401).json({ error: "La sesión venció. Iniciá sesión de nuevo." });
    }
};


/* --- Solo deja pasar a los roles del panel (se usa después de verificarToken) --- */
export const soloAdministrador = (req, res, next) => {

    if (!ROLES_PANEL.includes(req.usuario?.rol)) {
        return res.status(403).json({ error: "No tenés permiso para hacer esto." });
    }

    next();
};
