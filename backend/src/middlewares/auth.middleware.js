/* ==========================================================================
   auth.middleware.js - Verificación del token de sesión
   "Molinete": si el token no es válido, la petición no llega al controlador.
   ========================================================================== */

import jwt from "jsonwebtoken";
import { JWT_SECRET, ROLES_PANEL } from "../config/config.js";
import { getSesionUsuario } from "../models/usuario.models.js";


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


/* --- Solo deja pasar a los roles del panel (se usa después de verificarToken) ---
   El token dice QUIÉN es, pero el rol y el estado se leen de la base en cada petición:
   si a un administrador lo suspenden, lo dan de baja o le sacan el rol,
   pierde el acceso al instante (aunque su token todavía no haya vencido). */
export const soloAdministrador = async (req, res, next) => {

    try {
        const actual = await getSesionUsuario(req.usuario?.id);

        if (!actual || actual.estado !== "habilitado" || !ROLES_PANEL.includes(actual.rol)) {
            return res.status(401).json({ error: "Tu usuario ya no tiene acceso al panel. Iniciá sesión de nuevo." });
        }

        // Datos frescos (si le cambiaron el nombre, se ve el nuevo)
        req.usuario = { id: actual.id, nombre: actual.nombre_completo, rol: actual.rol };
        next();

    } catch (error) {
        console.error("Error al verificar el usuario:", error.message);
        return res.status(500).json({ error: "No se pudo conectar con la base de datos." });
    }
};
